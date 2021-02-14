var RewardToken = artifacts.require("RewardToken");
var Staker = artifacts.require("Staker");
var rewardTokenInstance;
var stakerInstance;

const BN = web3.utils.BN
const INITIAL_TOKEN_SUPPLY = web3.utils.toWei('1000000') // one million
const INITIAL_FARM_SUPPLY = web3.utils.toWei('100000') // one hundred thousand
const BLOCK_REWARD = web3.utils.toWei('100') // one hundred

contract("Staker", async function(accounts) {
  before(async function () {
    rewardTokenInstance = await RewardToken.deployed()
    stakerInstance = await Staker.deployed()
    await rewardTokenInstance.transfer(Staker.address, INITIAL_FARM_SUPPLY, {from: accounts[0]})
  })

  it("Should have an initial balance", async function() {
    var stakerBalance = await rewardTokenInstance.balanceOf(Staker.address)
    assert.equal(stakerBalance, INITIAL_FARM_SUPPLY, 'should have an initial balance of one hundred thousand')
  })

  it("Should allow deposits", async function() {
    var depositAmount = web3.utils.toWei('10')
    await rewardTokenInstance.transfer(accounts[1], depositAmount, {from:accounts[0]})
    await rewardTokenInstance.approve(Staker.address, depositAmount, {from:accounts[1]})
    await stakerInstance.deposit(depositAmount, {from:accounts[1]})
    var contractSupply = await rewardTokenInstance.balanceOf(Staker.address)
    var expectedSupply = (new BN(INITIAL_FARM_SUPPLY)).add(new BN(depositAmount)).toString()
    assert.equal(contractSupply, expectedSupply, 'should have transferred funds')
    var userInfo = await stakerInstance.userInfo(accounts[1])
    var registeredAmount = userInfo['amount']
    assert.equal(registeredAmount, depositAmount, 'should have registered deposit')
    var pendingReward = await stakerInstance.pendingReward(accounts[1])
    assert.equal(pendingReward, 0, 'should not provide rewards yet')
  })

  it("Should provide awards to only farmer", async function() {
    var depositAmount1 = web3.utils.toWei('10')
    var depositAmount2 = web3.utils.toWei('40')
    await rewardTokenInstance.transfer(accounts[2], depositAmount2, {from:accounts[0]})
    await rewardTokenInstance.approve(Staker.address, depositAmount2, {from:accounts[2]})
    // burn blocks to 'pass time'
    var farmInfo = await stakerInstance.farmInfo()
    var farmStartBlock = farmInfo["startBlock"]-0
    var curBlock = 0
    while(curBlock+1 < farmStartBlock+10){
      curBlock = (await web3.eth.getBlockNumber())-0
      await rewardTokenInstance.transfer(accounts[3], 1, {from:accounts[0]})
    }
    var pendingReward1 = (await stakerInstance.pendingReward(accounts[1])).toString()
    var expectedReward1 = bigNumberMul([BLOCK_REWARD, 10]).toString() // 100% ownership for 10 blocks
    assert.equal(pendingReward1, expectedReward1, 'should properly give rewards to only farmer')
  })

  it("Should fairly provide awards to all farmers", async function() {
    var depositAmount1 = web3.utils.toWei('10')
    var depositAmount2 = web3.utils.toWei('40')
    await stakerInstance.deposit(depositAmount2, {from:accounts[2]})
    // burn blocks to 'pass time'
    var farmInfo = await stakerInstance.farmInfo()
    var farmStartBlock = farmInfo["startBlock"]-0
    var curBlock = 0
    while(curBlock+1 < farmStartBlock+21){
      curBlock = (await web3.eth.getBlockNumber())-0
      await rewardTokenInstance.transfer(accounts[3], 1, {from:accounts[0]})
    }
    curBlock = (await web3.eth.getBlockNumber())-0

    var pendingReward2 = (await stakerInstance.pendingReward(accounts[1])).toString()
    var oldReward = bigNumberMul([BLOCK_REWARD, 11]) // 100% ownership for 11 blocks
    var newReward = bigNumberMul([BLOCK_REWARD, 10, 1], [5]) // 20% ownership for 10 blocks
    var expectedReward2 = bigNumberAdd([oldReward, newReward]).toString()
    assert.equal(pendingReward2, expectedReward2, 'should properly give rewards to first farmer')

    var pendingReward3 = (await stakerInstance.pendingReward(accounts[2])).toString()
    var expectedReward3 = bigNumberMul([BLOCK_REWARD, 10, 4], [5]) // 80% ownership for 10 blocks
    assert.equal(pendingReward3, expectedReward3, 'should properly give rewards to second farmer')
  })

  it("Should allow withdraws", async function() {
    var depositAmount1 = web3.utils.toWei('10')
    var depositAmount2 = web3.utils.toWei('40')

    var oldReward4 = bigNumberMul([BLOCK_REWARD, 11]) // 100% ownership for 11 blocks
    var newReward4 = bigNumberMul([BLOCK_REWARD, 11, 1], [5]) // 20% ownership for 11 blocks
    var expectedBalance4 = new BN(depositAmount1).add(oldReward4).add(newReward4).toString()
    await stakerInstance.withdraw(depositAmount1, {from:accounts[1]})
    var balance4 = (await rewardTokenInstance.balanceOf(accounts[1])).toString()
    assert.equal(balance4, expectedBalance4, 'should properly give rewards to first farmer')

    var oldReward5 = bigNumberMul([BLOCK_REWARD, 11, 4], [5]) // 80% ownership for 11 blocks
    var newReward5 = bigNumberMul([BLOCK_REWARD, 1]) // 100% ownership for 1 block
    var expectedBalance5 = bigNumberAdd([depositAmount2, oldReward5, newReward5]).toString()
    await stakerInstance.withdraw(depositAmount2, {from:accounts[2]})
    var balance5 = (await rewardTokenInstance.balanceOf(accounts[2])).toString()
    assert.equal(balance5, expectedBalance5, 'should properly give rewards to second farmer')

    var farmInfo = await stakerInstance.farmInfo() // sanity check, empty farm
    assert.equal(farmInfo["numFarmers"]-0, 0, 'should have no farmers')
    assert.equal(farmInfo["tokensStaked"]-0, 0, 'should have no staked tokens')
  })

  // In a production setting, I would test deposit after deposit and withdraw after withdraw with same account and deposit/witdraw after end of farm.
  // For brevity and because I borrowed from Unicrypt, I will omit extraneous tests.
})

// helper function, adds bignumbers together
function bigNumberAdd(numbers) {
  var res = new BN('0')
  numbers.forEach(num => { res = res.add(new BN(''+num)) })
  return res
}

// helper function, multiplies bignumbers together, optionally divides
function bigNumberMul(numerators, denominators=[]) {
  var numerator = new BN('1')
  numerators.forEach(num => { numerator = numerator.mul(new BN(''+num)) })
  if(denominators.length > 0){
    var denominator = new BN('1')
    denominators.forEach(num => { denominator = denominator.mul(new BN(''+num)) })
    numerator = numerator.div(denominator)
  }
  return numerator
}

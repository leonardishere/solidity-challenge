var RewardToken = artifacts.require("RewardToken")
var rewardTokenInstance;

const INITIAL_TOKEN_SUPPLY = web3.utils.toWei('1000000') // one million
const BN = web3.utils.BN

contract("RewardToken", async function(accounts) {
  before(async function () {
    rewardTokenInstance = await RewardToken.deployed()
  })

  it("Should have an initial balance", async function() {
    var totalSupply = await rewardTokenInstance.totalSupply()
    assert.equal(totalSupply, INITIAL_TOKEN_SUPPLY, 'should have an initial balance of one million')
  })

  it("Should have minted the initial balance to the owner", async function() {
    var ownerSupply = await rewardTokenInstance.balanceOf(accounts[0])
    assert.equal(ownerSupply, INITIAL_TOKEN_SUPPLY, 'should have minted the initial balance to the owner')
  })

  // In a production setting, I would test the ERC-20 functionality.
  // For brevity and because I used OpenZeppelin, I will omit extraneous tests.
})

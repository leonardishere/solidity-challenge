var RewardToken = artifacts.require("RewardToken");
var Staker = artifacts.require("Staker");
var rewardTokenInstance;
var stakerInstance;

const INITIAL_TOKEN_SUPPLY = web3.utils.toWei('1000000') // one million
const INITIAL_FARM_SUPPLY = web3.utils.toWei('100000') // one hundred thousand
const BLOCK_REWARD = web3.utils.toWei('100') // one hundred

// 1: deploy reward token contract
// 2: deploy staking contract
// 3: supply tokens to farm (in test/Staker.js, not here)

module.exports = function(deployer, network, accounts) {
  // 1: deploy reward token contract
  return deployer.deploy(RewardToken).then(() => {
    return RewardToken.deployed()
  }).then(instance => {
    rewardTokenInstance = instance
    return web3.eth.getBlockNumber()
  }).then(blocknum => {
    // starts in 20 blocks, ends in 120 blocks
    return deployer.deploy(Staker, RewardToken.address, INITIAL_FARM_SUPPLY, BLOCK_REWARD, blocknum+20, blocknum+20+1000)
  })
};

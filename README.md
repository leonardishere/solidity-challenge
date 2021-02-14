# challenge
create and deploy (locally) an ERC20 token and a staking contract that will distribute rewards to stakers over time. No need for an app or UI. You can reuse published or open source code, but you must indicate the source and what you have modified.

## User journey
An account with some balance of the tokens can deposit them into the staking contract (which also has the tokens and distributes them over time). As the time goes by and blocks are being produced, this user should accumulate more of the tokens and can claim the rewards and withdraw the deposit.

## RewardToken.sol
this contract defines an ERC20 token that will be used for staking/rewards. The owner should be able to mint the token.

## Staker.sol
this contract will get deployed with some tokens minted for the distribution to the stakers. And then, according to a schedule, allocate the reward tokens to addresses that deposited those tokens into the contract. The schedule is up to you, but you could say that every block 100 tokens are being distributed; then you'd take the allocated tokens and divide by the total balance of the deposited tokens so each depositor get's proportional share of the rewards. Ultimately, a user will deposit some tokens and later will be able to withdraw the principal amount plus the earned rewards. The following functions must be implemented: deposit(), withdraw()

## Scoring criteria
- launch ERC20 token
- implement reward allocation logic
- safe deposit/withdraw functions (avoid common attack vectors)

## Borrowed code
- ERC-20 from OpenZeppelin https://docs.openzeppelin.com/contracts/3.x/erc20
- Farm from Unicrypt (specifically, the OCTO-USDC farm that I'm on) https://etherscan.io/address/0xA42730eD85E5f0C3073Ae21b8315569f4A3eA358#code
  - Modified to use RewardToken for both staking and reward instead of LP token for staking and another ERC-20 for reward
  - Removed factory pattern
  - Removed bonus reward blocks
  - Removed emergency withdraw

## Pitfalls
- Does not sanity check block numbers or block rewards on staking contract construction
- Can permanently lock tokens on staking contract if farm has no users at any time during the staking duration

## Installation
- Install npm, truffle, and ganache if you haven't already
- Clone this repo
- ```npm install```
- create new ganache project, connect to truffle-config.js
- ```truffle migrate --reset --compile-all```
- ```truffle test```

/**
 * File: contracts/Staker.sol
 * Staker is a yield farming contract that distributes a constant amount of RewardToken per block split across stakers by amount staked.
 */
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.0;

import "./RewardToken.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./TransferHelper.sol";

contract Staker {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  /// @notice information stuct on each user that stakes.
  struct UserInfo {
    uint256 amount;     // How many tokens the user has provided.
    uint256 rewardDebt; // Reward debt.
  }

  mapping (address => UserInfo) public userInfo;

  /// @notice all the settings for this farm in one struct
  struct FarmInfo {
    IERC20 token;
    uint256 startBlock;
    uint256 blockReward;
    uint256 endBlock;
    uint256 lastRewardBlock;  // Last block number that reward distribution occurs.
    uint256 accRewardPerShare; // Accumulated Rewards per share, times 1e12
    uint256 farmableSupply; // set in init, total amount of tokens farmable
    uint256 numFarmers;
    uint256 tokensStaked;
  }

  FarmInfo public farmInfo;

  event Deposit(address indexed user, uint256 amount);
  event Withdraw(address indexed user, uint256 amount);

  constructor(address _rewardToken, uint256 _amount, uint256 _blockReward, uint256 _startBlock, uint256 _endBlock) public {
    farmInfo.token = IERC20(_rewardToken);
    farmInfo.farmableSupply = _amount;
    farmInfo.blockReward = _blockReward;
    farmInfo.startBlock = _startBlock;
    farmInfo.endBlock = _endBlock;
    farmInfo.lastRewardBlock = block.number > _startBlock ? block.number : _startBlock;
    farmInfo.accRewardPerShare = 0;
    farmInfo.numFarmers = 0;
    farmInfo.tokensStaked = 0;
  }

  /**
   * @notice Gets the reward multiplier over the given _from until _to block
   * @param _from the start of the period to measure rewards for
   * @param _to the end of the period to measure rewards for
   * @return The weighted multiplier for the given period
   */
  function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
      uint256 from = _from >= farmInfo.startBlock ? _from : farmInfo.startBlock;
      uint256 to = farmInfo.endBlock > _to ? _to : farmInfo.endBlock;
      return to.sub(from);
  }

  /**
   * @notice function to see accumulated balance of reward token for specified user
   * @param _user the user for whom unclaimed tokens will be shown
   * @return total amount of withdrawable reward tokens
   */
  function pendingReward(address _user) external view returns (uint256) {
    UserInfo storage user = userInfo[_user];
    uint256 accRewardPerShare = farmInfo.accRewardPerShare;
    if (block.number > farmInfo.lastRewardBlock && farmInfo.tokensStaked != 0) {
      uint256 multiplier = getMultiplier(farmInfo.lastRewardBlock, block.number);
      uint256 tokenReward = multiplier.mul(farmInfo.blockReward);
      accRewardPerShare = accRewardPerShare.add(tokenReward.mul(1e12).div(farmInfo.tokensStaked));
    }
    return user.amount.mul(accRewardPerShare).div(1e12).sub(user.rewardDebt);
  }

  /**
   * @notice updates pool information to be up to date to the current block
   */
  function updatePool() public {
    if (block.number <= farmInfo.lastRewardBlock) {
      return;
    }
    if (farmInfo.tokensStaked == 0) {
      farmInfo.lastRewardBlock = block.number < farmInfo.endBlock ? block.number : farmInfo.endBlock;
      return;
    }
    uint256 multiplier = getMultiplier(farmInfo.lastRewardBlock, block.number);
    uint256 tokenReward = multiplier.mul(farmInfo.blockReward);
    farmInfo.accRewardPerShare = farmInfo.accRewardPerShare.add(tokenReward.mul(1e12).div(farmInfo.tokensStaked));
    farmInfo.lastRewardBlock = block.number < farmInfo.endBlock ? block.number : farmInfo.endBlock;
  }

  /**
   * @notice deposit token function for msg.sender
   * @param _amount the total deposit amount
   */
  function deposit(uint256 _amount) public {
    UserInfo storage user = userInfo[msg.sender];
    updatePool();
    if (user.amount > 0) {
      uint256 pending = user.amount.mul(farmInfo.accRewardPerShare).div(1e12).sub(user.rewardDebt);
      safeRewardTransfer(msg.sender, pending);
    }
    if (user.amount == 0 && _amount > 0) {
      farmInfo.numFarmers++;
    }
    require(farmInfo.token.transferFrom(address(msg.sender), address(this), _amount), "TransferFrom failed");
    farmInfo.tokensStaked = farmInfo.tokensStaked.add(_amount);
    user.amount = user.amount.add(_amount);
    user.rewardDebt = user.amount.mul(farmInfo.accRewardPerShare).div(1e12);
    emit Deposit(msg.sender, _amount);
  }

  /**
   * @notice withdraw token function for msg.sender
   * @param _amount the total withdrawable amount
   * Note: _amount will be deducted from amount deposited
   * user will receive _amount plus accumulated rewards
   */
  function withdraw(uint256 _amount) public {
    UserInfo storage user = userInfo[msg.sender];
    require(user.amount >= _amount, "INSUFFICIENT");
    updatePool();
    if (user.amount == _amount && _amount > 0) {
      farmInfo.numFarmers--;
    }
    uint256 pending = _amount.add(user.amount.mul(farmInfo.accRewardPerShare).div(1e12).sub(user.rewardDebt));
    safeRewardTransfer(msg.sender, pending);
    farmInfo.tokensStaked = farmInfo.tokensStaked.sub(_amount);
    user.amount = user.amount.sub(_amount);
    user.rewardDebt = user.amount.mul(farmInfo.accRewardPerShare).div(1e12);
    emit Withdraw(msg.sender, _amount);
  }

  /**
   * @notice Safe reward transfer function, just in case a rounding error causes pool to not have enough reward tokens
   * @param _to the user address to transfer tokens to
   * @param _amount the total amount of tokens to transfer
   */
  function safeRewardTransfer(address _to, uint256 _amount) internal {
    uint256 rewardBal = farmInfo.token.balanceOf(address(this));
    if (_amount > rewardBal) {
      farmInfo.token.transfer(_to, rewardBal);
    } else {
      farmInfo.token.transfer(_to, _amount);
    }
  }
}

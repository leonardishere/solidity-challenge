/**
 * File: contracts/RewardToken.sol
 * RewardToken is an ERC-20 token that extends the OpenZeppelin implementation.
 */
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract RewardToken is ERC20 {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  string constant NAME    = "RewardToken";
  string constant SYMBOL  = "RWD";
  uint8 constant DECIMALS = 18;
  uint256 constant INITIAL_SUPPLY = 1_000_000 * 10**uint256(DECIMALS);

  constructor() public ERC20(NAME, SYMBOL) {
    _mint(msg.sender, INITIAL_SUPPLY);
  }
}

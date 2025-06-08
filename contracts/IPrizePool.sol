// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPrizePool
 * @dev Interface for the PrizePool contract
 */
interface IPrizePool {
    // Functions
    function addTrainingCost() external payable;
    function addBreedingCost() external payable;
    function awardPrize(address recipient, uint256 buckId, uint256 doesCount) external returns (uint256);
    function updateTotalDoeCount(uint256 _totalDoeCount) external;
    function getTrainingCost() external view returns (uint256);
    function getBreedingCost() external view returns (uint256);
    function getMatingSeasonEnd() external view returns (uint256);
    function prizePool() external view returns (uint256);
}

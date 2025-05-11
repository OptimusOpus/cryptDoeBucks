// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PrizePool
 * @dev A contract for managing the prize pool for the CryptDoeBucks game.
 * This contract abstracts the prize pool logic from the main CryptDoeBucks contract.
 */
contract PrizePool is Ownable, ReentrancyGuard, Pausable {
    // Amount of funds in the prize pool
    uint256 public prizePool;
    
    // Cost to train a buck
    uint256 public trainingCost;
    
    // Cost to breed bucks
    uint256 public breedingCost;
    
    // Time when the mating season ends
    uint256 public matingSeasonEnd;
    
    // Total number of does in the game
    uint256 public totalDoeCount;
    
    // Interface for the CryptDoeBucks contract
    address public buckContract;
    
    // Events
    event Received(address sender, uint256 amount);
    event PrizeAwarded(address recipient, uint256 amount, uint256 buckId, uint256 doesCount);
    event PrizePoolIncreased(uint256 amount, string reason);
    event CostsUpdated(uint256 newTrainingCost, uint256 newBreedingCost);
    
    // Modifiers
    modifier onlyBuckContract() {
        require(msg.sender == buckContract, "Caller is not the buck contract");
        _;
    }
    
    modifier onlyAfterMatingSeason() {
        require(block.timestamp > matingSeasonEnd, "Mating season is still ongoing");
        _;
    }
    
    /**
     * @dev Constructor to initialize the prize pool contract
     * @param _matingSeasonEnd The timestamp when the mating season ends
     * @param _initialPrizePool The initial amount in the prize pool
     * @param _trainingCost The cost to train a buck
     * @param _breedingCost The cost to breed bucks
     */
    constructor(
        uint256 _matingSeasonEnd,
        uint256 _initialPrizePool,
        uint256 _trainingCost,
        uint256 _breedingCost
    ) {
        matingSeasonEnd = _matingSeasonEnd;
        prizePool = _initialPrizePool;
        trainingCost = _trainingCost;
        breedingCost = _breedingCost;
    }
    
    /**
     * @dev Set the buck contract address
     * @param _buckContract The address of the CryptDoeBucks contract
     */
    function setBuckContract(address _buckContract) external onlyOwner {
        buckContract = _buckContract;
    }
    
    /**
     * @dev Update the costs for training and breeding
     * @param _trainingCost The new cost to train a buck
     * @param _breedingCost The new cost to breed bucks
     */
    function updateCosts(uint256 _trainingCost, uint256 _breedingCost) external onlyOwner {
        trainingCost = _trainingCost;
        breedingCost = _breedingCost;
        emit CostsUpdated(_trainingCost, _breedingCost);
    }
    
    /**
     * @dev Update the total doe count
     * @param _totalDoeCount The new total doe count
     */
    function updateTotalDoeCount(uint256 _totalDoeCount) external onlyBuckContract {
        totalDoeCount = _totalDoeCount;
    }
    
    /**
     * @dev Add funds to the prize pool
     * @param reason The reason for adding funds
     */
    function addToPrizePool(string memory reason) external payable {
        prizePool += msg.value;
        emit PrizePoolIncreased(msg.value, reason);
    }
    
    /**
     * @dev Add training cost to the prize pool
     */
    function addTrainingCost() external payable {
        require(msg.value >= trainingCost, "Insufficient payment for training");
        prizePool += msg.value;
        emit PrizePoolIncreased(msg.value, "Training");
    }
    
    /**
     * @dev Add breeding cost to the prize pool
     */
    function addBreedingCost() external payable {
        require(msg.value >= breedingCost, "Insufficient payment for breeding");
        prizePool += msg.value;
        emit PrizePoolIncreased(msg.value, "Breeding");
    }
    
    /**
     * @dev Award prize to a buck owner based on their doe percentage
     * @param recipient The address of the buck owner
     * @param buckId The ID of the buck
     * @param doesCount The number of does the buck has
     */
    function awardPrize(address recipient, uint256 buckId, uint256 doesCount) external onlyBuckContract nonReentrant whenNotPaused {
        require(doesCount > 0, "Buck does count is 0");
        require(totalDoeCount > 0, "Total doe count is 0");
        
        // Scale factor for percentage calculation
        uint256 scaleFactor = 10 ** 18;
        
        // Calculate the percentage of does the buck has
        uint256 doesPercentage = (doesCount * scaleFactor) / totalDoeCount;
        
        // Calculate the prize amount based on the percentage
        uint256 prizeAmount = (prizePool * doesPercentage) / scaleFactor;
        
        // Update the prize pool
        prizePool = prizePool - prizeAmount;
        
        require(address(this).balance >= prizeAmount, "Not enough funds in contract");
        
        // Transfer the prize to the recipient
        payable(recipient).transfer(prizeAmount);
        
        emit PrizeAwarded(recipient, prizeAmount, buckId, doesCount);
    }
    
    /**
     * @dev Get the training cost
     * @return The training cost
     */
    function getTrainingCost() external view returns (uint256) {
        return trainingCost;
    }
    
    /**
     * @dev Get the breeding cost
     * @return The breeding cost
     */
    function getBreedingCost() external view returns (uint256) {
        return breedingCost;
    }
    
    /**
     * @dev Get the mating season end timestamp
     * @return The mating season end timestamp
     */
    function getMatingSeasonEnd() external view returns (uint256) {
        return matingSeasonEnd;
    }
    
    /**
     * @dev Withdraw function to sweep funds from the contract to the owner
     * after the mating season has ended
     */
    function withdraw() external onlyOwner nonReentrant onlyAfterMatingSeason {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Emergency pause function
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause function
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Fallback function to receive ether
     */
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}

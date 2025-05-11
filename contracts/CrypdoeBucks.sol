/**
 * @title CrypdoeBucks
 * @dev A contract for managing and fighting Crypto Bucks.
 */
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./IVRFv2Consumer.sol";

contract CrypdoeBucks is ERC721, ERC721Burnable, Ownable, ReentrancyGuard {
    IVRFv2Consumer immutable VRF_CONTRACT;

    mapping(uint256 => string) idToIpfs;
    // Token id to owner
    mapping(uint => address) public buckToOwner;
    // Mapping for fight styles
    mapping(uint32 => uint32) winMap;

    struct PreFight {
        uint32 defenderId;
        uint256 randomRequestId;
    }

    // Mapping for pending fights
    mapping(address => PreFight) pendingFights;

    address private immutable self;
    // Time until buck can fight again
    uint32 cooldownTime;

    // Time when the mating season ends
    uint256 public matingSeasonEnd;

    // Total number of does
    uint256 public maxDoeCount;

    struct Buck {
        // If points is odd assume it is like a 4/5
        uint32 points;
        // Time until buck can fight again
        uint32 readyTime;
        // 1, 2 or 3 Rock paper sissors style
        uint32 fightingStyle;
        // Number of does under bucks control
        uint32 does;
    }

    Buck[] public bucks;

    // Amount of funds in the prize pool
    // Note: this will be updated automatically by the contract if the sale is done on chain
    uint256 public prizePool;

    event FightInitiated(uint attacker, uint defender, uint256 randomRequestId);

    event FightConcluded(uint defender, uint attacker, uint32 doesMoved);

    event NewBuck(address to, uint id, uint32 points, uint32 fightingStyle, uint32 does);

    event Received(address sender, uint amount);

    event EndSeason(uint buckId, uint prizeAmount);

    modifier onlyOwnerOf(uint _id) {
        require(msg.sender == buckToOwner[_id], "Must be the buck owner");
        _;
    }

    modifier onlyAfterMatingSeason() {
        require(block.timestamp > matingSeasonEnd, "Mating season is still ongoing.");
        _;
    }

    constructor(address vrfCoordinator, uint256 _matingSeasonEnd) ERC721("Crypto Bucks", "BUCK") {
        self = address(this);
        winMap[1] = 3;
        winMap[2] = 1;
        winMap[3] = 2;
        // Set this at 5 mins while we test
        cooldownTime = 300;
        prizePool = 1 ether;
        matingSeasonEnd = _matingSeasonEnd;
        VRF_CONTRACT = IVRFv2Consumer(vrfCoordinator);
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    // Withdraw function protected with nonReentrant modifier
    // This is to sweep funds from the contract to the owner
    // after the mating season has ended
    function withdraw() public onlyOwner nonReentrant onlyAfterMatingSeason {
        uint balance = address(this).balance;
        payable(owner()).transfer(balance);
    }

    // Could turn this into an internal function if we want to do the random genereration onchain, public is expensive
    // Might make the sale contract call this and supply random attributes
    function createBuck(
        address owner,
        uint32 _points,
        uint32 _fightingStyle,
        uint32 _does
    ) public onlyOwner returns (uint) {
        uint id = bucks.length; // Use the current length as the new ID
        bucks.push(Buck(_points, uint32(block.timestamp), _fightingStyle, _does));
        _mint(owner, id);
        buckToOwner[id] = owner;
        maxDoeCount += _does; // Use compound assignment for efficiency

        emit NewBuck(owner, id, _points, _fightingStyle, _does);
        return id;
    }

    // End season function
    function endSeason(uint256 buckId) external onlyOwnerOf(buckId) {
        // Transfer prize pool to buck as a percentage of the number of does they have compared to the total number of does
        // For example if they have 10% of the does they get 10% of the prize pool
        require(bucks[buckId].does > 0, "Buck does count is 0.");

        Buck memory buck = bucks[buckId];

        // Scale factor for percentage
        uint256 scalefactor = 10 ** 18;

        uint256 doesPercentage = (buck.does * scalefactor) / maxDoeCount;

        uint256 prizeAmount = (prizePool * doesPercentage) / scalefactor;
        // Update prize pool
        prizePool = prizePool - prizeAmount;

        require(address(this).balance >= prizeAmount, "Not enough funds in contract.");

        // Transfer prize pool percentage to buck
        payable(buckToOwner[buckId]).transfer(prizeAmount);

        // Burn buck
        _burnBuck(buckId);

        emit EndSeason(buckId, prizeAmount);
    }

    // Cooldown after fight
    function _triggerCooldown(uint id) internal {
        bucks[id].readyTime = uint32(block.timestamp + cooldownTime);
    }

    // Transfer VRF contract ownership
    function transferVRFOwnership(address to) external onlyOwner {
        // call transferOwnership on VRF contract
        VRF_CONTRACT.transferOwnership(to);
    }

    // Accept VRF contract ownership
    function acceptVRFOwnership() external onlyOwner {
        // call acceptOwnership on VRF contract
        VRF_CONTRACT.acceptOwnership();
    }

    // Request random number from VRF
    function random() private returns (uint256) {
        return VRF_CONTRACT.requestRandomWords();
    }

    // Add RND to power level
    function powerLevel(uint32 points, uint256 randomNumber) private pure returns (uint) {
        // Tune randomness impact from here
        return randomNumber % points ** 4;
    }

    // Returns if the attacker has style advantage
    // Ensure tie check is done beforehand
    function fightingStyleCalc(uint32 attackStyle, uint32 defendStyle) private view returns (bool) {
        return winMap[attackStyle] == defendStyle;
    }

    function moveDoes(uint fromId, uint toId) internal {
        Buck storage fromBuck = bucks[fromId];
        Buck storage toBuck = bucks[toId];
        uint32 doesMoving = fromBuck.does;
        fromBuck.does = 0;
        toBuck.does = toBuck.does + doesMoving;
    }

    // Prepare for fight (request random number)
    function prepareForFight(uint256 attackerId, uint256 defenderId) external onlyOwnerOf(attackerId) {
        require(bucks[attackerId].readyTime <= block.timestamp, "Buck is not ready to fight.");
        require(pendingFights[self].defenderId == 0, "Attacking buck already has a pending fight.");
        uint256 randomRequestId = random();
        pendingFights[self].defenderId = uint32(defenderId);
        pendingFights[self].randomRequestId = randomRequestId;
        emit FightInitiated(attackerId, defenderId, randomRequestId);
    }

    // Fight function refactored for clarity and maintainability
    function fight(uint256 attackerId, uint256 defenderId) external onlyOwnerOf(attackerId) {
        // Retrieve and validate the random number from the VRF contract
        uint256[] memory randomWords = getRandomNumbers();

        Buck storage attackingBuck = bucks[attackerId];
        Buck storage defendingBuck = bucks[defenderId];

        // Calculate power levels for attacker and defender
        (uint attackPower, uint defendPower) = calculatePowerLevels(attackingBuck, defendingBuck, randomWords);

        // Determine the outcome of the fight and apply consequences
        applyFightOutcome(attackerId, defenderId, attackPower, defendPower);
    }

    // Retrieve random numbers from VRF contract
    function getRandomNumbers() private returns (uint256[] memory randomWords) {
        (bool fulfilled, uint256[] memory rndWords) = VRF_CONTRACT.getRequestStatus(
            pendingFights[self].randomRequestId
        );
        require(fulfilled, "Random number not yet generated.");

        // Reset pending fight
        pendingFights[self].defenderId = 0;
        pendingFights[self].randomRequestId = 0;

        return rndWords;
    }

    // Calculate the power levels for both bucks, considering their points and fighting styles
    function calculatePowerLevels(
        Buck memory attackingBuck,
        Buck memory defendingBuck,
        uint256[] memory randomWords
    ) private view returns (uint attackPower, uint defendPower) {
        uint32 attackingBuckPoints = attackingBuck.points +
            getStyleBonus(attackingBuck.fightingStyle, defendingBuck.fightingStyle);
        uint32 defendingBuckPoints = defendingBuck.points +
            getStyleBonus(defendingBuck.fightingStyle, attackingBuck.fightingStyle);

        attackPower = powerLevel(attackingBuckPoints, randomWords[0]);
        defendPower = powerLevel(defendingBuckPoints, randomWords[1]);
    }

    // Determine the bonus for fighting style matchups
    function getStyleBonus(uint32 styleA, uint32 styleB) private view returns (uint32) {
        if (styleA != styleB && winMap[styleA] == styleB) {
            return 2; // Winning style gets a bonus
        }
        return 0;
    }

    // Apply the outcome of the fight based on the power levels
    function applyFightOutcome(uint256 attackerId, uint256 defenderId, uint attackPower, uint defendPower) private {
        if (attackPower > defendPower) {
            concludeFight(attackerId, defenderId, bucks[defenderId].does, true);
        } else if (attackPower == defendPower) {
            // Draw, no cooldown applied
            emit FightConcluded(defenderId, attackerId, 80085); // Special code for draw
        } else {
            concludeFight(defenderId, attackerId, 0, true);
        }
    }

    // Conclude the fight, transfer does if needed, and optionally trigger cooldowns
    function concludeFight(uint256 winnerId, uint256 loserId, uint32 doesTransferred, bool applyCooldown) private {
        if (doesTransferred > 0) {
            moveDoes(loserId, winnerId);
        }
        if (applyCooldown) {
            _triggerCooldown(winnerId);
        }
        emit FightConcluded(loserId, winnerId, doesTransferred);
    }

    function _burnBuck(uint256 tokenId) internal {
        require(tokenId < bucks.length, "Buck does not exist.");
        Buck memory lastBuck = bucks[bucks.length - 1];
        bucks[tokenId] = lastBuck; // Move the last buck to the deleted spot
        bucks.pop(); // Remove the last element

        // Update the buckToOwner mapping for the last buck moved
        if (tokenId < bucks.length) {
            // Check if the buck was not the last one
            buckToOwner[tokenId] = buckToOwner[bucks.length];
        }
        delete buckToOwner[bucks.length]; // Remove the last entry
        this.burn(tokenId);
    }
}

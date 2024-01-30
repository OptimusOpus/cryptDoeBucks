// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./IVRFv2Consumer.sol";

contract CrypdoeBucks is ERC721, ERC721Burnable, Ownable {
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

    // TODO: How are the does dispured to begin with?
    // randomly to bucks?

    event FightPending(uint attacker, uint defender, uint256 randomRequestId);

    event Fight(uint defender, uint attacker, uint32 doesMoved);

    event NewBuck(address to, uint id, uint32 points, uint32 fightingStyle, uint32 does);

    modifier onlyOwnerOf(uint _id) {
        require(msg.sender == buckToOwner[_id], "Must be the buck owner");
        _;
    }

    constructor(address vrfCoordinator) ERC721("Crypto Bucks", "BUCK") {
        self = address(this);
        winMap[1] = 3;
        winMap[2] = 1;
        winMap[3] = 2;
        // Set this at 5 mins while we test
        cooldownTime = 300;
        VRF_CONTRACT = IVRFv2Consumer(vrfCoordinator);
    }

    // Could turn this into an internal function if we want to do the random genereration onchain, public is expensive
    // Might make the sale contract call this and supply random attributes
    function createBuck(
        address owner,
        uint32 _points,
        uint32 _fightingStyle,
        uint32 _does
    ) public onlyOwner returns (uint) {
        bucks.push(Buck(_points, uint32(block.timestamp), _fightingStyle, _does));
        uint id = bucks.length - 1;
        _mint(owner, id);
        buckToOwner[id] = owner;
        emit NewBuck(owner, id, _points, _fightingStyle, _does);
        return id;
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
        // Tune randomness from here
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
        emit FightPending(attackerId, defenderId, randomRequestId);
    }

    // Fight function
    // Add modifier to make sure only buck owner makes call
    function fight(uint256 attackerId, uint256 defenderId) external onlyOwnerOf(attackerId) {
        // Get random number from VRF
        (bool fulfilled, uint256[] memory randomWords) = VRF_CONTRACT.getRequestStatus(
            pendingFights[self].randomRequestId
        );
        require(fulfilled, "Random number not yet generated.");

        // Reset pending fight
        pendingFights[self].defenderId = 0;
        pendingFights[self].randomRequestId = 0;

        Buck memory attackingBuck = bucks[attackerId];
        Buck memory defendingBuck = bucks[defenderId];

        uint attackPower;
        uint defendPower;

        uint32 attackingBuckPoints = attackingBuck.points;
        uint32 defendingBuckPoints = defendingBuck.points;

        // Who has the winning style?
        // Buck with the winning style gets plus 2 power, maybe make that a constant?
        if (attackingBuck.fightingStyle != defendingBuck.fightingStyle) {
            bool attackerAdvantage = fightingStyleCalc(attackingBuck.fightingStyle, defendingBuck.fightingStyle);
            if (attackerAdvantage) {
                attackingBuckPoints = attackingBuckPoints + 2;
            } else {
                defendingBuckPoints = defendingBuckPoints + 2;
            }
        }

        attackPower = powerLevel(attackingBuckPoints, randomWords[0]);
        defendPower = powerLevel(defendingBuckPoints, randomWords[1]);

        // Who has more power?
        if (attackPower > defendPower) {
            // Attacker wins, transfer defenders does
            _triggerCooldown(attackerId);
            moveDoes(defenderId, attackerId);
            emit Fight(defenderId, attackerId, defendingBuck.does);
        } else if (attackPower == defendPower) {
            // No one wins, defender keeps does, attacker has no death risk and no cooldown
            // Hacky solution for a draw
            emit Fight(defenderId, attackerId, 4200000000);
        } else if (attackPower < defendPower) {
            // Attacker loses, defender keeps does, attacker gets cooldown and death risk
            _triggerCooldown(attackerId);
            emit Fight(defenderId, attackerId, 0);
        }
        // emit an event and return a value?
    }
}

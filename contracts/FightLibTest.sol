// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./FightLib.sol";

/**
 * @title FightLibTest
 * @dev Test contract for the FightLib library
 */
contract FightLibTest {
    function getWinner(uint32 style1, uint32 style2) public pure returns (uint32) {
        return FightLib.getWinner(style1, style2);
    }
    
    function getStyleBonus(uint32 attackStyle, uint32 defendStyle) public pure returns (uint32) {
        return FightLib.getStyleBonus(attackStyle, defendStyle);
    }
    
    function powerLevel(
        uint32 points,
        uint256 randomNumber,
        uint8 level,
        uint8 strength,
        uint8 intelligence
    ) public pure returns (uint256) {
        return FightLib.powerLevel(points, randomNumber, level, strength, intelligence);
    }
    
    function isCriticalHit(uint8 level, uint256 randomValue) public pure returns (bool) {
        return FightLib.isCriticalHit(level, randomValue);
    }
    
    function specialAbilityActivates(bool hasSpecialAbility, uint256 randomValue) public pure returns (bool) {
        return FightLib.specialAbilityActivates(hasSpecialAbility, randomValue);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FightLib
 * @dev Library with fighting-related functions to reduce the size of the main contract
 */
library FightLib {
    // Map of fighting style advantages (rock-paper-scissors style)
    // 1 beats 3, 2 beats 1, 3 beats 2
    function getWinner(uint32 style1, uint32 style2) internal pure returns (uint32) {
        if (style1 == 1 && style2 == 3) return 1;
        if (style1 == 2 && style2 == 1) return 1;
        if (style1 == 3 && style2 == 2) return 1;
        if (style1 == style2) return 0;
        return 2; // style2 wins
    }
    
    // Get bonus for fighting style
    function getStyleBonus(uint32 attackStyle, uint32 defendStyle) internal pure returns (uint32) {
        // If attacker's style beats defender's style, grant a bonus
        if (attackStyle != defendStyle) {
            if ((attackStyle == 1 && defendStyle == 3) || 
                (attackStyle == 2 && defendStyle == 1) || 
                (attackStyle == 3 && defendStyle == 2)) {
                return 2; // Winning style gets a bonus
            }
        }
        return 0;
    }
    
    // Calculate power level for a buck
    function powerLevel(
        uint32 points,
        uint256 randomNumber,
        uint8 level,
        uint8 strength,
        uint8 intelligence
    ) internal pure returns (uint) {
        // Base power calculation
        uint base = randomNumber % points ** 4;

        // Add bonuses from level and genetics
        uint levelBonus = level * 10;
        uint strengthBonus = strength * 5;
        uint intelligenceBonus = intelligence * 3;

        return base + levelBonus + strengthBonus + intelligenceBonus;
    }
    
    // Check for critical hit
    function isCriticalHit(uint8 level, uint256 randomValue) internal pure returns (bool) {
        uint criticalChance = level * 5; // 5% chance per level
        return randomValue % 100 < criticalChance;
    }
    
    // Check if special ability activates (30% chance if buck has special ability)
    function specialAbilityActivates(bool hasSpecialAbility, uint256 randomValue) internal pure returns (bool) {
        return hasSpecialAbility && (randomValue % 100 < 30);
    }
}

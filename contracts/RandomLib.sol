// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RandomLib
 * @dev Library for generating random buck stats with weighted distributions
 */
library RandomLib {
    // Genetics struct matching CrypdoeBucks
    struct Genetics {
        uint8 strength;
        uint8 speed;
        uint8 vitality;
        uint8 intelligence;
    }

    // Complete buck stats for minting
    struct BuckStats {
        uint32 points;
        uint32 fightingStyle;
        uint32 does;
        Genetics genetics;
    }

    // Rarity tiers
    enum RarityTier { COMMON, UNCOMMON, RARE, EPIC, LEGENDARY }

    /**
     * @dev Generate complete random stats for a new buck
     */
    function generateRandomStats(uint256 seed) external pure returns (BuckStats memory) {
        // Split seed into different sections for different stats
        uint256 pointsSeed = (seed >> 0) & 0xFFFFFFFF;
        uint256 styleSeed = (seed >> 32) & 0xFFFFFFFF;
        uint256 doesSeed = (seed >> 64) & 0xFFFFFFFF;
        uint256 geneticsSeed = (seed >> 96) & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
        
        return BuckStats({
            points: generatePoints(pointsSeed),
            fightingStyle: generateFightingStyle(styleSeed),
            does: generateDoes(doesSeed),
            genetics: generateGenetics(geneticsSeed)
        });
    }

    /**
     * @dev Generate random stats with guaranteed minimum rarity
     */
    function generateGuaranteedRarityStats(uint256 seed, uint8 minRarity) external pure returns (BuckStats memory) {
        require(minRarity >= 1 && minRarity <= 5, "Invalid rarity tier");
        
        uint256 pointsSeed = (seed >> 0) & 0xFFFFFFFF;
        uint256 styleSeed = (seed >> 32) & 0xFFFFFFFF;
        uint256 doesSeed = (seed >> 64) & 0xFFFFFFFF;
        uint256 geneticsSeed = (seed >> 96) & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
        
        return BuckStats({
            points: generateEnhancedPoints(pointsSeed, minRarity),
            fightingStyle: generateFightingStyle(styleSeed),
            does: generateEnhancedDoes(doesSeed, minRarity),
            genetics: generateGuaranteedGenetics(geneticsSeed, RarityTier(minRarity - 1))
        });
    }

    /**
     * @dev Generate combat points with bell curve distribution (50-100 range)
     */
    function generatePoints(uint256 seed) internal pure returns (uint32) {
        // Create bell curve: more common in middle (70-80), rare at extremes
        uint256 roll1 = seed % 51;        // 0-50
        uint256 roll2 = (seed >> 8) % 51; // 0-50  
        uint256 roll3 = (seed >> 16) % 51; // 0-50
        
        // Average of 3 rolls creates bell curve, then shift to 50-100 range
        uint256 average = (roll1 + roll2 + roll3) / 3;
        return uint32(50 + average);
    }

    /**
     * @dev Generate enhanced points for guaranteed rarity
     */
    function generateEnhancedPoints(uint256 seed, uint8 minRarity) internal pure returns (uint32) {
        uint256 basePoints = generatePoints(seed);
        
        // Add bonus based on rarity tier
        uint256 bonus = 0;
        if (minRarity >= 2) bonus += 5;  // Uncommon+
        if (minRarity >= 3) bonus += 5;  // Rare+
        if (minRarity >= 4) bonus += 10; // Epic+
        if (minRarity >= 5) bonus += 10; // Legendary
        
        return uint32(basePoints + bonus);
    }

    /**
     * @dev Generate fighting style (evenly distributed)
     */
    function generateFightingStyle(uint256 seed) internal pure returns (uint32) {
        return uint32(1 + (seed % 3)); // 1=Aggressive, 2=Defensive, 3=Balanced
    }

    /**
     * @dev Generate does count with weighted distribution
     */
    function generateDoes(uint256 seed) internal pure returns (uint32) {
        uint256 roll = seed % 1000;
        
        // Weighted distribution for does
        if (roll < 400) return 1;      // 40% - 1 doe
        if (roll < 700) return 2;      // 30% - 2 does  
        if (roll < 850) return 3;      // 15% - 3 does
        if (roll < 950) return 4;      // 10% - 4 does
        if (roll < 990) return 5;      // 4% - 5 does
        return uint32(6 + (roll % 5)); // 1% - 6-10 does (ultra rare)
    }

    /**
     * @dev Generate enhanced does count for guaranteed rarity
     */
    function generateEnhancedDoes(uint256 seed, uint8 minRarity) internal pure returns (uint32) {
        uint32 baseDoes = generateDoes(seed);
        
        // Guarantee minimum does based on rarity
        uint32 minDoes = 1;
        if (minRarity >= 3) minDoes = 2;  // Rare+
        if (minRarity >= 4) minDoes = 3;  // Epic+
        if (minRarity >= 5) minDoes = 5;  // Legendary
        
        return baseDoes > minDoes ? baseDoes : minDoes;
    }

    /**
     * @dev Generate genetics with natural rarity distribution
     */
    function generateGenetics(uint256 seed) internal pure returns (Genetics memory) {
        // Determine rarity tier first
        uint256 rarityRoll = seed % 10000;
        RarityTier tier;
        
        if (rarityRoll < 100) {        // 1% - Legendary
            tier = RarityTier.LEGENDARY;
        } else if (rarityRoll < 600) { // 5% - Epic
            tier = RarityTier.EPIC;
        } else if (rarityRoll < 2000) { // 14% - Rare
            tier = RarityTier.RARE;
        } else if (rarityRoll < 5000) { // 30% - Uncommon
            tier = RarityTier.UNCOMMON;
        } else {                       // 50% - Common
            tier = RarityTier.COMMON;
        }
        
        return generateGuaranteedGenetics(seed, tier);
    }

    /**
     * @dev Generate genetics for specific rarity tier
     */
    function generateGuaranteedGenetics(uint256 seed, RarityTier tier) internal pure returns (Genetics memory) {
        uint8 minStat;
        uint8 maxStat;
        
        // Set stat ranges based on tier
        if (tier == RarityTier.LEGENDARY) {
            minStat = 8;
            maxStat = 10;
        } else if (tier == RarityTier.EPIC) {
            minStat = 6;
            maxStat = 9;
        } else if (tier == RarityTier.RARE) {
            minStat = 4;
            maxStat = 7;
        } else if (tier == RarityTier.UNCOMMON) {
            minStat = 2;
            maxStat = 5;
        } else { // COMMON
            minStat = 1;
            maxStat = 3;
        }
        
        // Generate individual stats within the tier range
        uint8 range = maxStat - minStat + 1;
        
        return Genetics({
            strength: minStat + uint8((seed >> 0) % range),
            speed: minStat + uint8((seed >> 8) % range),
            vitality: minStat + uint8((seed >> 16) % range),
            intelligence: minStat + uint8((seed >> 24) % range)
        });
    }

    /**
     * @dev Calculate rarity tier from genetics
     */
    function calculateRarityTier(Genetics memory genetics) external pure returns (RarityTier) {
        uint256 totalStats = uint256(genetics.strength) + 
                           uint256(genetics.speed) + 
                           uint256(genetics.vitality) + 
                           uint256(genetics.intelligence);
        
        if (totalStats >= 32) return RarityTier.LEGENDARY;
        if (totalStats >= 24) return RarityTier.EPIC;
        if (totalStats >= 16) return RarityTier.RARE;
        if (totalStats >= 8) return RarityTier.UNCOMMON;
        return RarityTier.COMMON;
    }

    /**
     * @dev Get rarity tier name
     */
    function getRarityName(RarityTier tier) external pure returns (string memory) {
        if (tier == RarityTier.LEGENDARY) return "Legendary";
        if (tier == RarityTier.EPIC) return "Epic";
        if (tier == RarityTier.RARE) return "Rare";
        if (tier == RarityTier.UNCOMMON) return "Uncommon";
        return "Common";
    }

    /**
     * @dev Generate pseudorandom seed for minting
     */
    function generateMintSeed(address minter, uint256 tokenId) external view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            minter,
            tokenId,
            tx.gasprice,
            block.number
        )));
    }

    /**
     * @dev Generate batch seed for multiple mints
     */
    function generateBatchSeed(address minter, uint256 startTokenId, uint256 quantity) external view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            minter,
            startTokenId,
            quantity,
            tx.gasprice
        )));
    }
}
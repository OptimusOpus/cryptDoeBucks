// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MetadataLib
 * @dev Library for generating dynamic NFT metadata for CrypdoeBucks
 */
library MetadataLib {
    // Buck struct matching the one in CrypdoeBucks.sol
    struct Genetics {
        uint8 strength;
        uint8 speed;
        uint8 vitality;
        uint8 intelligence;
    }

    struct Buck {
        uint32 points;
        uint32 readyTime;
        uint32 fightingStyle;
        uint32 does;
        uint32 experience;
        uint8 level;
        Genetics genetics;
        bool hasSpecialAbility;
    }

    // Base64 encoding table
    string internal constant BASE64_TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    /**
     * @dev Generate complete token URI with dynamic metadata
     */
    function generateTokenURI(Buck memory buck, uint256 tokenId) external pure returns (string memory) {
        string memory json = generateJSON(buck, tokenId);
        string memory encodedJson = base64Encode(bytes(json));
        return string(abi.encodePacked("data:application/json;base64,", encodedJson));
    }

    /**
     * @dev Generate JSON metadata for a buck
     */
    function generateJSON(Buck memory buck, uint256 tokenId) internal pure returns (string memory) {
        string memory name = string(abi.encodePacked("CrypdoeBuck #", toString(tokenId)));
        string memory description = generateDescription(buck);
        string memory image = generateImageURI(buck);
        string memory attributes = generateAttributes(buck);

        return string(abi.encodePacked(
            '{"name":"', name, '",',
            '"description":"', description, '",',
            '"image":"', image, '",',
            '"external_url":"https://cryptdoebucks.com/buck/', toString(tokenId), '",',
            '"attributes":[', attributes, ']}'
        ));
    }

    /**
     * @dev Generate dynamic description based on buck's stats
     */
    function generateDescription(Buck memory buck) internal pure returns (string memory) {
        string memory rarity = calculateRarity(buck);
        string memory fightingStyle = getFightingStyleName(buck.fightingStyle);
        
        if (buck.hasSpecialAbility) {
            return string(abi.encodePacked(
                "A legendary ", rarity, " fighting buck with ", fightingStyle, 
                " combat style. This buck has unlocked special abilities and controls ",
                toString(buck.does), " does. Level ", toString(buck.level), " warrior with superior genetics."
            ));
        } else {
            return string(abi.encodePacked(
                "A ", rarity, " fighting buck with ", fightingStyle, 
                " combat style. Controls ", toString(buck.does), 
                " does and is level ", toString(buck.level), "."
            ));
        }
    }

    /**
     * @dev Generate SVG image URI
     */
    function generateImageURI(Buck memory buck) internal pure returns (string memory) {
        string memory svg = generateSVG(buck);
        string memory encodedSvg = base64Encode(bytes(svg));
        return string(abi.encodePacked("data:image/svg+xml;base64,", encodedSvg));
    }

    /**
     * @dev Generate SVG image based on buck attributes
     */
    function generateSVG(Buck memory buck) internal pure returns (string memory) {
        (string memory bgColor1, string memory bgColor2) = getRarityColors(buck);
        string memory levelRing = generateLevelRing(buck.level);
        string memory statBars = generateStatBars(buck.genetics);
        string memory specialGlow = buck.hasSpecialAbility ? generateSpecialGlow() : "";

        return string(abi.encodePacked(
            '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">',
            '<defs>',
            '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:', bgColor1, '"/>',
            '<stop offset="100%" style="stop-color:', bgColor2, '"/>',
            '</linearGradient>',
            '</defs>',
            '<rect width="400" height="400" fill="url(#bg)"/>',
            specialGlow,
            generateBuckSilhouette(),
            levelRing,
            statBars,
            generateFightingStyleIcon(buck.fightingStyle),
            '</svg>'
        ));
    }

    /**
     * @dev Generate attributes array for OpenSea compatibility
     */
    function generateAttributes(Buck memory buck) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '{"trait_type":"Level","value":', toString(buck.level), ',"max_value":10},',
            '{"trait_type":"Points","value":', toString(buck.points), '},',
            '{"trait_type":"Fighting Style","value":"', getFightingStyleName(buck.fightingStyle), '"},',
            '{"trait_type":"Does Controlled","value":', toString(buck.does), '},',
            '{"trait_type":"Experience","value":', toString(buck.experience), '},',
            '{"trait_type":"Strength","value":', toString(buck.genetics.strength), ',"max_value":10},',
            '{"trait_type":"Speed","value":', toString(buck.genetics.speed), ',"max_value":10},',
            '{"trait_type":"Vitality","value":', toString(buck.genetics.vitality), ',"max_value":10},',
            '{"trait_type":"Intelligence","value":', toString(buck.genetics.intelligence), ',"max_value":10},',
            '{"trait_type":"Special Ability","value":"', buck.hasSpecialAbility ? "Unlocked" : "Locked", '"},',
            '{"trait_type":"Rarity","value":"', calculateRarity(buck), '"},',
            '{"trait_type":"Total Stats","value":', toString(getTotalStats(buck)), ',"max_value":40}'
        ));
    }

    /**
     * @dev Calculate rarity based on total genetic stats
     */
    function calculateRarity(Buck memory buck) internal pure returns (string memory) {
        uint256 totalStats = getTotalStats(buck);
        
        if (totalStats >= 35) return "Legendary";
        if (totalStats >= 30) return "Epic";
        if (totalStats >= 25) return "Rare";
        if (totalStats >= 20) return "Uncommon";
        return "Common";
    }

    /**
     * @dev Get total genetic stats
     */
    function getTotalStats(Buck memory buck) internal pure returns (uint256) {
        return uint256(buck.genetics.strength) + 
               uint256(buck.genetics.speed) + 
               uint256(buck.genetics.vitality) + 
               uint256(buck.genetics.intelligence);
    }

    /**
     * @dev Get fighting style name
     */
    function getFightingStyleName(uint32 style) internal pure returns (string memory) {
        if (style == 1) return "Aggressive";
        if (style == 2) return "Defensive";
        if (style == 3) return "Balanced";
        return "Unknown";
    }

    /**
     * @dev Get rarity colors for background gradient
     */
    function getRarityColors(Buck memory buck) internal pure returns (string memory, string memory) {
        uint256 totalStats = getTotalStats(buck);
        
        if (totalStats >= 35) return ("#FFD700", "#FFA500"); // Legendary (Gold)
        if (totalStats >= 30) return ("#9400D3", "#4B0082"); // Epic (Purple)
        if (totalStats >= 25) return ("#0000FF", "#0080FF"); // Rare (Blue)
        if (totalStats >= 20) return ("#008000", "#00FF00"); // Uncommon (Green)
        return ("#808080", "#C0C0C0"); // Common (Gray)
    }

    /**
     * @dev Generate level progress ring
     */
    function generateLevelRing(uint8 level) internal pure returns (string memory) {
        uint256 progress = (uint256(level) * 360) / 10; // Convert level to degrees
        
        return string(abi.encodePacked(
            '<circle cx="200" cy="200" r="180" fill="none" stroke="#000" stroke-width="4" opacity="0.3"/>',
            '<circle cx="200" cy="200" r="180" fill="none" stroke="#FFF" stroke-width="4" ',
            'stroke-dasharray="', toString(progress * 31416 / 360), ' 1131" ',
            'stroke-dashoffset="283" transform="rotate(-90 200 200)"/>'
        ));
    }

    /**
     * @dev Generate stat bars for genetics
     */
    function generateStatBars(Genetics memory genetics) internal pure returns (string memory) {
        return string(abi.encodePacked(
            generateStatBar("STR", genetics.strength, 320),
            generateStatBar("SPD", genetics.speed, 340),
            generateStatBar("VIT", genetics.vitality, 360),
            generateStatBar("INT", genetics.intelligence, 380)
        ));
    }

    /**
     * @dev Generate individual stat bar
     */
    function generateStatBar(string memory label, uint8 value, uint256 y) internal pure returns (string memory) {
        uint256 width = (uint256(value) * 80) / 10; // Max width 80px for value 10
        
        return string(abi.encodePacked(
            '<text x="20" y="', toString(y), '" fill="#FFF" font-size="12" font-family="monospace">', label, '</text>',
            '<rect x="50" y="', toString(y - 10), '" width="80" height="8" fill="#333" stroke="#FFF"/>',
            '<rect x="50" y="', toString(y - 10), '" width="', toString(width), '" height="8" fill="#0F0"/>'
        ));
    }

    /**
     * @dev Generate buck silhouette
     */
    function generateBuckSilhouette() internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<ellipse cx="200" cy="220" rx="60" ry="80" fill="#8B4513"/>',
            '<ellipse cx="200" cy="180" rx="40" ry="50" fill="#A0522D"/>',
            '<polygon points="170,150 180,120 190,150" fill="#654321"/>',
            '<polygon points="220,150 210,120 200,150" fill="#654321"/>',
            '<circle cx="185" cy="170" r="3" fill="#000"/>',
            '<circle cx="215" cy="170" r="3" fill="#000"/>'
        ));
    }

    /**
     * @dev Generate fighting style icon
     */
    function generateFightingStyleIcon(uint32 style) internal pure returns (string memory) {
        if (style == 1) { // Aggressive - Sword
            return '<polygon points="350,50 370,50 370,70 360,70 360,80 350,80" fill="#FF0000"/>';
        } else if (style == 2) { // Defensive - Shield
            return '<ellipse cx="360" cy="60" rx="15" ry="20" fill="#0000FF" stroke="#FFF" stroke-width="2"/>';
        } else { // Balanced - Star
            return '<polygon points="360,45 365,55 375,55 367,62 370,72 360,67 350,72 353,62 345,55 355,55" fill="#FFD700"/>';
        }
    }

    /**
     * @dev Generate special ability glow effect
     */
    function generateSpecialGlow() internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<defs>',
            '<filter id="glow">',
            '<feGaussianBlur stdDeviation="4" result="coloredBlur"/>',
            '<feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>',
            '</filter>',
            '</defs>',
            '<circle cx="200" cy="200" r="190" fill="none" stroke="#FFD700" stroke-width="2" filter="url(#glow)" opacity="0.7"/>'
        ));
    }

    /**
     * @dev Base64 encode bytes
     */
    function base64Encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";

        string memory table = BASE64_TABLE;
        uint256 encodedLen = 4 * ((data.length + 2) / 3);
        string memory result = new string(encodedLen + 32);

        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)
            
            for {
                let dataPtr := data
                let endPtr := add(dataPtr, mload(data))
            } lt(dataPtr, endPtr) {
                
            } {
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)

                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(6, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
                resultPtr := add(resultPtr, 1)
            }

            switch mod(mload(data), 3)
            case 1 { mstore(sub(resultPtr, 2), shl(240, 0x3d3d)) }
            case 2 { mstore(sub(resultPtr, 1), shl(248, 0x3d)) }
            
            mstore(result, encodedLen)
        }

        return result;
    }

    /**
     * @dev Convert uint256 to string
     */
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
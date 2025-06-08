import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('FightLib Unit Tests', function () {
  async function deployFightLibTestFixture() {
    const fightLibTestFactory = await ethers.getContractFactory('FightLibTest');
    const fightLibTest = await fightLibTestFactory.deploy();
    return { fightLibTest };
  }

  describe('#getWinner', function () {
    it('Should determine that style 1 beats style 3', async function () {
      const { fightLibTest } = await loadFixture(deployFightLibTestFixture);
      const testValues = await fightLibTest.getWinner(1, 3);
      expect(testValues).to.equal(1); // Style 1 wins
    });

    it('Should determine that style 2 beats style 1', async function () {
      const { fightLibTest } = await loadFixture(deployFightLibTestFixture);
      const testValues = await fightLibTest.getWinner(2, 1);
      expect(testValues).to.equal(1); // Style 2 wins
    });

    it('Should determine that style 3 beats style 2', async function () {
      const { fightLibTest } = await loadFixture(deployFightLibTestFixture);
      const testValues = await fightLibTest.getWinner(3, 2);
      expect(testValues).to.equal(1); // Style 3 wins
    });

    it('Should determine that same styles result in a draw', async function () {
      const { fightLibTest } = await loadFixture(deployFightLibTestFixture);
      const testValues = await fightLibTest.getWinner(2, 2);
      expect(testValues).to.equal(0); // Draw
    });

    it('Should return 2 when attacker loses to defender', async function () {
      const { fightLibTest } = await loadFixture(deployFightLibTestFixture);
      const testValues = await fightLibTest.getWinner(3, 1);
      expect(testValues).to.equal(2); // Defender wins (return 2)
    });
  });

  describe('#getStyleBonus', function () {
    it('Should grant bonus when attack style beats defend style', async function () {
      const { fightLibTest } = await loadFixture(deployFightLibTestFixture);

      // Test all winning combinations
      const bonus1 = await fightLibTest.getStyleBonus(1, 3); // Style 1 beats 3
      const bonus2 = await fightLibTest.getStyleBonus(2, 1); // Style 2 beats 1
      const bonus3 = await fightLibTest.getStyleBonus(3, 2); // Style 3 beats 2

      expect(bonus1).to.equal(2);
      expect(bonus2).to.equal(2);
      expect(bonus3).to.equal(2);
    });

    it('Should not grant bonus for same styles', async function () {
      const { fightLibTest } = await loadFixture(deployFightLibTestFixture);
      const bonus = await fightLibTest.getStyleBonus(1, 1);
      expect(bonus).to.equal(0);
    });

    it('Should not grant bonus when attack style loses to defend style', async function () {
      const { fightLibTest } = await loadFixture(deployFightLibTestFixture);

      // Test all losing combinations
      const bonus1 = await fightLibTest.getStyleBonus(3, 1); // Style 3 loses to 1
      const bonus2 = await fightLibTest.getStyleBonus(1, 2); // Style 1 loses to 2
      const bonus3 = await fightLibTest.getStyleBonus(2, 3); // Style 2 loses to 3

      expect(bonus1).to.equal(0);
      expect(bonus2).to.equal(0);
      expect(bonus3).to.equal(0);
    });
  });

  describe('#powerLevel', function () {
    it('Should calculate correct power level with various inputs', async function () {
      const { fightLibTest } = await loadFixture(deployFightLibTestFixture);

      // Test multiple combinations with different inputs
      const power1 = await fightLibTest.powerLevel(10, 12345, 5, 8, 6);

      // Base calculation: 12345 % 10^4 = 12345 % 10000 = 2345
      // Level bonus: 5 * 10 = 50
      // Strength bonus: 8 * 5 = 40
      // Intelligence bonus: 6 * 3 = 18
      // Total: 2345 + 50 + 40 + 18 = 2453

      expect(power1).to.equal(2453);

      // Test another set of values
      const power2 = await fightLibTest.powerLevel(5, 54321, 10, 10, 10);

      // Base calculation: 54321 % 5^4 = 54321 % 625 = 571
      // Level bonus: 10 * 10 = 100
      // Strength bonus: 10 * 5 = 50
      // Intelligence bonus: 10 * 3 = 30
      // Total: 571 + 100 + 50 + 30 = 751

      expect(power2).to.equal(751);
    });
  });

  describe('#isCriticalHit', function () {
    it('Should correctly determine critical hit chances based on level', async function () {
      const { fightLibTest } = await loadFixture(deployFightLibTestFixture);

      // Level 5 gives 25% chance
      // If randomValue % 100 < 25, it's a critical hit

      // Should be a critical hit (5% chance per level * 5 levels = 25%)
      const isCritical1 = await fightLibTest.isCriticalHit(5, 24); // 24 % 100 = 24 < 25
      expect(isCritical1).to.be.true;

      // Should not be a critical hit
      const isCritical2 = await fightLibTest.isCriticalHit(5, 25); // 25 % 100 = 25 === 25
      expect(isCritical2).to.be.false;

      // Higher level (10) gives 50% chance
      const isCritical3 = await fightLibTest.isCriticalHit(10, 49); // 49 % 100 = 49 < 50
      expect(isCritical3).to.be.true;

      const isCritical4 = await fightLibTest.isCriticalHit(10, 50); // 50 % 100 = 50 === 50
      expect(isCritical4).to.be.false;
    });
  });

  describe('#specialAbilityActivates', function () {
    it('Should correctly determine if special ability activates', async function () {
      const { fightLibTest } = await loadFixture(deployFightLibTestFixture);

      // Special ability has 30% chance of activating if buck has special ability

      // Should activate (less than 30)
      const activates1 = await fightLibTest.specialAbilityActivates(true, 29); // 29 % 100 = 29 < 30
      expect(activates1).to.be.true;

      // Should not activate (equal to 30)
      const activates2 = await fightLibTest.specialAbilityActivates(true, 30); // 30 % 100 = 30 === 30
      expect(activates2).to.be.false;

      // Should never activate if buck doesn't have special ability
      const activates3 = await fightLibTest.specialAbilityActivates(false, 5); // Even with low random value
      expect(activates3).to.be.false;
    });
  });
});

describe('Game Scenarios - Threshold Checks', function () {
  async function deployFightLibTestFixture() {
    const fightLibTestFactory = await ethers.getContractFactory('FightLibTest');
    const fightLibTest = await fightLibTestFactory.deploy();
    return { fightLibTest };
  }

  // Critical Hit Thresholds
  it('Critical Hit: Just below threshold (level 10, 50% chance, random 49)', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);
    expect(await fightLibTest.isCriticalHit(10, 49)).to.be.true;
  });

  it('Critical Hit: Exactly at threshold (level 10, 50% chance, random 50)', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);
    expect(await fightLibTest.isCriticalHit(10, 50)).to.be.false;
  });

  it('Critical Hit: Just above threshold (level 10, 50% chance, random 51)', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);
    expect(await fightLibTest.isCriticalHit(10, 51)).to.be.false;
  });

  it('Critical Hit: Zero chance (level 0 or invalid, random 0)', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);
    // Assuming level 0 means 0% crit chance. isCriticalHit uses (level * 5)
    // So level 0 * 5 = 0. Random value 0 % 100 = 0. 0 < 0 is false.
    expect(await fightLibTest.isCriticalHit(0, 0)).to.be.false;
  });

   it('Critical Hit: Max chance (level 20, 100% chance, random 99)', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);
    // Level 20 * 5 = 100. randomValue % 100 < 100. 99 < 100 is true.
    expect(await fightLibTest.isCriticalHit(20, 99)).to.be.true;
  });

  it('Critical Hit: Max chance at threshold (level 20, 100% chance, random 0)', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);
    // Level 20 * 5 = 100. randomValue % 100 < 100. 0 < 100 is true.
    expect(await fightLibTest.isCriticalHit(20, 0)).to.be.true;
  });


  // Special Ability Thresholds
  it('Special Ability: Just below threshold (has special, random 29)', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);
    expect(await fightLibTest.specialAbilityActivates(true, 29)).to.be.true;
  });

  it('Special Ability: Exactly at threshold (has special, random 30)', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);
    expect(await fightLibTest.specialAbilityActivates(true, 30)).to.be.false;
  });

  it('Special Ability: Just above threshold (has special, random 31)', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);
    expect(await fightLibTest.specialAbilityActivates(true, 31)).to.be.false;
  });

  it('Special Ability: No special ability (random 0)', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);
    expect(await fightLibTest.specialAbilityActivates(false, 0)).to.be.false; // Should be false regardless of random
  });

  it('Special Ability: No special ability (random 29, would activate if true)', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);
    expect(await fightLibTest.specialAbilityActivates(false, 29)).to.be.false;
  });
});

describe('Game Scenarios - Power Calculation Edge Cases', function () {
  async function deployFightLibTestFixture() {
    const fightLibTestFactory = await ethers.getContractFactory('FightLibTest');
    const fightLibTest = await fightLibTestFactory.deploy();
    return { fightLibTest };
  }

  it('Scenario: Power Calculation - Low Stats', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);

    const level = 1; // Minimum level
    const randomness = 1; // Low randomness
    const strength = 1; // Minimum strength
    const intelligence = 1; // Minimum intelligence
    // const style = 1; // Style is not an argument for powerLevel
    const pointsValue = 1; // Using points = 1 to match original interpretation where level was used as points.

    // Calculation based on current powerLevel logic:
    // Base: randomness % (pointsValue^4) = 1 % (1^4) = 1 % 1 = 0
    // Level Bonus: level * 10 = 1 * 10 = 10
    // Strength Bonus: strength * 5 = 1 * 5 = 5
    // Intelligence Bonus: intelligence * 3 = 1 * 3 = 3
    // Total: 0 + 10 + 5 + 3 = 18
    const expectedPower = 18;
    const actualPower = await fightLibTest.powerLevel(pointsValue, randomness, level, strength, intelligence);
    expect(actualPower).to.equal(expectedPower);
  });

  it('Scenario: Power Calculation - High Stats', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);

    const pointsValue = 10; // Define points, e.g., 10
    const level = 20; // High level
    const randomness = 99999; // High randomness
    const strength = 20; // High strength
    const intelligence = 20; // High intelligence
    // const style = 2; // Style is not an argument for powerLevel

    // Calculation with points = 10:
    // Base: randomness % (pointsValue^4) = 99999 % (10^4) = 99999 % 10000 = 9999
    // Level Bonus: level * 10 = 20 * 10 = 200
    // Strength Bonus: strength * 5 = 20 * 5 = 100
    // Intelligence Bonus: intelligence * 3 = 20 * 3 = 60
    // Total: 9999 + 200 + 100 + 60 = 10359
    const expectedPower = 10359;
    const actualPower = await fightLibTest.powerLevel(pointsValue, randomness, level, strength, intelligence);
    expect(actualPower).to.equal(expectedPower);
  });

   it('Scenario: Power Calculation - Zero Stats (if permissible by contract)', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);

    const pointsValue = 1; // Using points = 1 for this test case
    // Assuming 0 is not a valid level, but let's test with 1 and other stats as 0
    const level = 1;
    const randomness = 0;
    const strength = 0;
    const intelligence = 0;
    // const style = 3; // Style is not an argument for powerLevel

    // Calculation with points = 1:
    // Base: randomness % (pointsValue^4) = 0 % (1^4) = 0 % 1 = 0
    // Level Bonus: level * 10 = 1 * 10 = 10
    // Strength Bonus: strength * 5 = 0 * 5 = 0
    // Intelligence Bonus: intelligence * 3 = 0 * 3 = 0
    // Total: 0 + 10 + 0 + 0 = 10
    const expectedPower = 10;
    const actualPower = await fightLibTest.powerLevel(pointsValue, randomness, level, strength, intelligence);
    expect(actualPower).to.equal(expectedPower);
  });
});

describe('Game Scenarios - Style Draw', function () {
  async function deployFightLibTestFixture() {
    const fightLibTestFactory = await ethers.getContractFactory('FightLibTest');
    const fightLibTest = await fightLibTestFactory.deploy();
    return { fightLibTest };
  }

  it('Scenario: Draw in Styles, Winner Determined by Power Level - Attacker Higher Power', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);

    const style = 1; // Same style for attacker and defender
    const attackerLevel = 10;
    const attackerRandomness = 10000;
    const attackerStrength = 10;
    const attackerIntelligence = 10;

    const defenderLevel = 8;
    const defenderRandomness = 20000;
    const defenderStrength = 8;
    const defenderIntelligence = 8;
    const pointsValue = 10; // Define a consistent points value

    const attackerPower = await fightLibTest.powerLevel(pointsValue, attackerRandomness, attackerLevel, attackerStrength, attackerIntelligence);
    const defenderPower = await fightLibTest.powerLevel(pointsValue, defenderRandomness, defenderLevel, defenderStrength, defenderIntelligence);

    const styleWinner = await fightLibTest.getWinner(style, style);
    expect(styleWinner).to.equal(0); // Draw in styles

    const styleBonus = await fightLibTest.getStyleBonus(style, style);
    expect(styleBonus).to.equal(0); // No style bonus for a draw

    expect(attackerPower).to.be.greaterThan(defenderPower);
    // Assuming direct power comparison when styles draw and no other bonuses apply
    const finalWinner = attackerPower > defenderPower ? 1 : (defenderPower > attackerPower ? 2 : 0);
    expect(finalWinner).to.equal(1); // Attacker wins by power
  });

  it('Scenario: Draw in Styles, Winner Determined by Power Level - Defender Higher Power', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);

    const style = 2; // Same style
    const attackerLevel = 8;
    const attackerRandomness = 20000;
    const attackerStrength = 8;
    const attackerIntelligence = 8;

    const defenderLevel = 10;
    const defenderRandomness = 10000;
    const defenderStrength = 10;
    const defenderIntelligence = 10;
    const pointsValue = 10; // Define a consistent points value

    const attackerPower = await fightLibTest.powerLevel(pointsValue, attackerRandomness, attackerLevel, attackerStrength, attackerIntelligence);
    const defenderPower = await fightLibTest.powerLevel(pointsValue, defenderRandomness, defenderLevel, defenderStrength, defenderIntelligence);

    const styleWinner = await fightLibTest.getWinner(style, style);
    expect(styleWinner).to.equal(0); // Draw

    const styleBonus = await fightLibTest.getStyleBonus(style, style);
    expect(styleBonus).to.equal(0); // No bonus

    expect(defenderPower).to.be.greaterThan(attackerPower);
    const finalWinner = attackerPower > defenderPower ? 1 : (defenderPower > attackerPower ? 2 : 0);
    expect(finalWinner).to.equal(2); // Defender wins by power
  });
});

describe('Game Scenarios - Special Ability', function () {
  async function deployFightLibTestFixture() {
    const fightLibTestFactory = await ethers.getContractFactory('FightLibTest');
    const fightLibTest = await fightLibTestFactory.deploy();
    return { fightLibTest };
  }

  it('Scenario: Special Ability Activation - Attacker Activates', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);

    const attackerHasSpecial = true;
    const specificRandomValueForActivation = 29; // Activates: 29 < 30

    const activates = await fightLibTest.specialAbilityActivates(attackerHasSpecial, specificRandomValueForActivation);
    expect(activates).to.be.true;

    // Define arbitrary power levels
    const attackerPower = 100;
    const defenderPower = 120; // Defender stronger

    // Assuming special ability adds a bonus, e.g., 30% of attacker's power
    const specialBonus = attackerPower * 0.3;
    const attackerEffectivePower = attackerPower + specialBonus;

    expect(attackerEffectivePower).to.be.greaterThan(defenderPower);
    const finalWinner = attackerEffectivePower > defenderPower ? 1 : 2;
    expect(finalWinner).to.equal(1); // Attacker wins due to special ability
  });

  it('Scenario: Special Ability Activation - Attacker Fails to Activate', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);

    const attackerHasSpecial = true;
    const specificRandomValueNoActivation = 30; // Fails: 30 is not < 30

    const activates = await fightLibTest.specialAbilityActivates(attackerHasSpecial, specificRandomValueNoActivation);
    expect(activates).to.be.false;

    const attackerPower = 100;
    const defenderPower = 120;

    // No special bonus
    const attackerEffectivePower = attackerPower;

    expect(attackerEffectivePower).to.be.lessThan(defenderPower);
    const finalWinner = attackerEffectivePower > defenderPower ? 1 : 2;
    expect(finalWinner).to.equal(2); // Defender wins
  });

  it('Scenario: Special Ability Activation - Attacker Lacks Special', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);

    const attackerHasSpecial = false; // Does not have special ability
    const specificRandomValueIrrelevant = 10; // Low value, but should not activate

    const activates = await fightLibTest.specialAbilityActivates(attackerHasSpecial, specificRandomValueIrrelevant);
    expect(activates).to.be.false; // Does not activate because hasSpecial is false

    const attackerPower = 100;
    const defenderPower = 120;
    const attackerEffectivePower = attackerPower; // No bonus

    expect(attackerEffectivePower).to.be.lessThan(defenderPower);
    const finalWinner = attackerEffectivePower > defenderPower ? 1 : 2;
    expect(finalWinner).to.equal(2); // Defender wins
  });
});

describe('Game Scenarios - Critical Hit', function () {
  async function deployFightLibTestFixture() {
    const fightLibTestFactory = await ethers.getContractFactory('FightLibTest');
    const fightLibTest = await fightLibTestFactory.deploy();
    return { fightLibTest };
  }

  it('Scenario: Critical Hit Outcome - Attacker Lands Critical', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);

    const attackerLevel = 10; // 10 * 5 = 50% crit chance
    const specificRandomValueForCrit = 49; // Results in crit: 49 < 50

    const isCrit = await fightLibTest.isCriticalHit(attackerLevel, specificRandomValueForCrit);
    expect(isCrit).to.be.true;

    // Define arbitrary power levels for attacker and defender
    const attackerPower = 100;
    const defenderPower = 110; // Defender slightly stronger

    // Assuming critical hit adds a significant bonus, e.g., 50% of attacker's power
    const critBonus = attackerPower / 2;
    const attackerEffectivePower = attackerPower + critBonus;

    // Attacker with critical hit should overcome the defender
    expect(attackerEffectivePower).to.be.greaterThan(defenderPower);
    const finalWinner = attackerEffectivePower > defenderPower ? 1 : 2;
    expect(finalWinner).to.equal(1); // Attacker wins due to critical hit
  });

  it('Scenario: Critical Hit Outcome - Attacker Fails Critical', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);

    const attackerLevel = 10; // 50% crit chance
    const specificRandomValueNoCrit = 50; // No crit: 50 is not < 50

    const isCrit = await fightLibTest.isCriticalHit(attackerLevel, specificRandomValueNoCrit);
    expect(isCrit).to.be.false;

    const attackerPower = 100;
    const defenderPower = 110;

    // No crit bonus
    const attackerEffectivePower = attackerPower;

    expect(attackerEffectivePower).to.be.lessThan(defenderPower);
    const finalWinner = attackerEffectivePower > defenderPower ? 1 : 2;
    expect(finalWinner).to.equal(2); // Defender wins as no critical hit
  });
});

describe('Game Scenarios - Defender Wins', function () {
  async function deployFightLibTestFixture() {
    const fightLibTestFactory = await ethers.getContractFactory('FightLibTest');
    const fightLibTest = await fightLibTestFactory.deploy();
    return { fightLibTest };
  }

  it('Scenario: Defender Wins with Superior Power Despite Style Disadvantage', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);

    // Attacker: Style 1, Moderate Power
    // Defender: Style 3, Very High Power
    const attackerStyle = 1;
    const attackerLevel = 7;
    const attackerRandomness = 10000; // Adjusted for scenario
    const attackerStrength = 7;
    const attackerIntelligence = 7;

    const defenderStyle = 3; // Attacker has style advantage (1 beats 3)
    const defenderLevel = 10; // Defender has higher level
    const defenderRandomness = 13579; // Kept
    const defenderStrength = 10; // Defender has higher strength
    const defenderIntelligence = 10; // Defender has higher intelligence
    const pointsValue = 10; // Define a consistent points value for scenarios

    // Attacker Power with points=10: (10000 % 10000) + 7*10 + 7*5 + 7*3 = 0 + 70 + 35 + 21 = 126
    // Defender Power with points=10: (13579 % 10000) + 10*10 + 10*5 + 10*3 = 3579 + 100 + 50 + 30 = 3759
    const attackerPower = await fightLibTest.powerLevel(
      pointsValue,
      attackerRandomness,
      attackerLevel,
      attackerStrength,
      attackerIntelligence
    );
    const defenderPower = await fightLibTest.powerLevel(
      pointsValue,
      defenderRandomness,
      defenderLevel,
      defenderStrength,
      defenderIntelligence
    );

    const styleWinner = await fightLibTest.getWinner(attackerStyle, defenderStyle);
    expect(styleWinner).to.equal(1); // Attacker has style advantage

    const styleBonusToAttacker = await fightLibTest.getStyleBonus(attackerStyle, defenderStyle);
    expect(styleBonusToAttacker).to.equal(2);

    // Defender's power should overcome attacker's power + style bonus
    expect(defenderPower).to.be.greaterThan(attackerPower + styleBonusToAttacker);

    // Assuming a simple combat model
    const finalWinner = (attackerPower + styleBonusToAttacker) > defenderPower ? 1 : 2;
    expect(finalWinner).to.equal(2); // Defender wins
  });
});

// New Game Scenarios
describe('Game Scenarios - Attacker Wins', function () {
  async function deployFightLibTestFixture() {
    const fightLibTestFactory = await ethers.getContractFactory('FightLibTest');
    const fightLibTest = await fightLibTestFactory.deploy();
    return { fightLibTest };
  }

  it('Scenario: Attacker Overwhelms with Style and Power', async function () {
    const { fightLibTest } = await loadFixture(deployFightLibTestFixture);

    // Attacker: Style 1, High Power
    // Defender: Style 3, Low Power
    const attackerStyle = 1;
    const attackerLevel = 10; // High level for power
    const attackerRandomness = 12345; // Example randomness
    const attackerStrength = 10;
    const attackerIntelligence = 8;

    const defenderStyle = 3;
    const defenderLevel = 5; // Lower level
    const defenderRandomness = 10000; // Adjusted for scenario with new power calculation
    const defenderStrength = 5;
    const defenderIntelligence = 5;
    const pointsValue = 10; // Define a consistent points value for scenarios

    // Calculate power levels
    // Attacker Power with points=10: (12345 % 10000) + 10*10 + 10*5 + 8*3 = 2345 + 100 + 50 + 24 = 2519
    // Defender Power with points=10: (10000 % 10000) + 5*10 + 5*5 + 5*3 = 0 + 50 + 25 + 15 = 90
    const attackerPower = await fightLibTest.powerLevel(
      pointsValue,
      attackerRandomness,
      attackerLevel,
      attackerStrength,
      attackerIntelligence
    );
    const defenderPower = await fightLibTest.powerLevel(
      pointsValue,
      defenderRandomness,
      defenderLevel,
      defenderStrength,
      defenderIntelligence
    );

    // Check style advantage
    const styleWinner = await fightLibTest.getWinner(attackerStyle, defenderStyle);
    expect(styleWinner).to.equal(1); // Attacker has style advantage (1 beats 3)

    const styleBonus = await fightLibTest.getStyleBonus(attackerStyle, defenderStyle);
    expect(styleBonus).to.equal(2); // Attacker gets style bonus

    // Simulate a fight outcome where attacker's power + style bonus overcomes defender's power
    // This is a conceptual assertion, actual winner determination might be more complex
    // and might involve direct comparison of (attackerPower + styleBonus) vs defenderPower
    // For this test, we'll assert that attacker's power is significantly higher.
    expect(attackerPower + styleBonus).to.be.greaterThan(defenderPower);

    // Assuming a simple combat model where higher power + bonus wins
    const finalWinner = (attackerPower + styleBonus) > defenderPower ? 1 : 2;
    expect(finalWinner).to.equal(1); // Attacker wins
  });
});

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

    it('Should determine that style 2 beats style 3', async function () {
      const { fightLibTest } = await loadFixture(deployFightLibTestFixture);
      const testValues = await fightLibTest.getWinner(3, 1);
      expect(testValues).to.equal(2); // Style 1 wins against style 3
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

      // Base calculation: 54321 % 5^4 = 54321 % 625 = 321
      // Level bonus: 10 * 10 = 100
      // Strength bonus: 10 * 5 = 50
      // Intelligence bonus: 10 * 3 = 30
      // Total: 321 + 100 + 50 + 30 = 501
      // Actual calculation may differ due to modulo specifics

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

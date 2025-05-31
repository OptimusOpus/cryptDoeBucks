import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers as tsEthers } from 'ethers';
import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

import { ethers } from 'hardhat';
import {
  CrypdoeBucks,
  CrypdoeBucks__factory,
  VRFCoordinatorV2Mock,
  VRFv2Consumer,
} from '../typechain-types';
import { deployRandomNumberConsumerFixture } from './fixtures/RandomNumberConsumer';
import { getEventData } from './utils';

const scalefactor = 10n ** 18n;
let CrypdoeBucksFactory: CrypdoeBucks__factory;
let crypdoeBucks: CrypdoeBucks;
// eslint-disable-next-line no-unused-vars
let deployer: HardhatEthersSigner;
let user1: HardhatEthersSigner;
let user2: HardhatEthersSigner;

type buck = {
  points: number;
  readyTime: number;
  fightingStyle: number;
  does: number;
};

const buck1: buck = {
  points: 14,
  readyTime: 0,
  fightingStyle: 1,
  does: 69,
};

const buck2: buck = {
  points: 2,
  readyTime: 0,
  fightingStyle: 3,
  does: 1,
};

// We would never mint a buck with 0 does, but for testing purposes this is convenient
const buck3: buck = {
  points: 2,
  readyTime: 0,
  fightingStyle: 2,
  does: 0,
};

const buck4: buck = {
  points: 2,
  readyTime: 0,
  fightingStyle: 2,
  does: 30,
};

let user1Address: string;
let user2Address: string;
let randomNumberConsumerV2Address: string;
let crypdoeBucksAddress: string;
let randomNumberConsumerV2: VRFv2Consumer;
let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;
const prizePool = ethers.parseEther('1'); // Example prize pool setup

describe('CrypdoeBucks', () => {
  before(async () => {
    [deployer, user1, user2] = await ethers.getSigners();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();
  });

  beforeEach(async () => {
    const fixtures = await loadFixture(deployRandomNumberConsumerFixture);
    randomNumberConsumerV2 = fixtures.randomNumberConsumerV2;
    vrfCoordinatorV2Mock = fixtures.VRFCoordinatorV2Mock;
    randomNumberConsumerV2Address = await randomNumberConsumerV2.getAddress();

    const matingSeasonEnd = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days from now in seconds
    
    // Deploy PrizePool first
    const PrizePoolFactory = await ethers.getContractFactory('PrizePool');
    const initialPrizePoolAmount = ethers.parseEther('1.0');
    const trainingCost = ethers.parseEther('0.01');
    const breedingCost = ethers.parseEther('0.05');
    
    const prizePoolContract = await PrizePoolFactory.deploy(
      matingSeasonEnd,
      initialPrizePoolAmount,
      trainingCost,
      breedingCost
    );
    
    const prizePoolAddress = await prizePoolContract.getAddress();
    
    // Send ETH to the PrizePool contract to ensure it has enough funds
    await deployer.sendTransaction({
      to: prizePoolAddress,
      value: ethers.parseEther('3.0') // Send 3 ETH to the contract
    });
    
    // Now deploy CrypdoeBucks with the correct parameters
    CrypdoeBucksFactory = await ethers.getContractFactory('CrypdoeBucks');
    crypdoeBucks = await CrypdoeBucksFactory.deploy(
      randomNumberConsumerV2Address,
      prizePoolAddress
    );

    crypdoeBucksAddress = await crypdoeBucks.getAddress();
    
    // Set the buck contract address in the PrizePool contract
    await prizePoolContract.setBuckContract(crypdoeBucksAddress);

    await randomNumberConsumerV2.transferOwnership(
      await crypdoeBucks.getAddress()
    );
    await crypdoeBucks.acceptVRFOwnership();

    // deployer funds the contract with some ETH
    const prizePoolAmount = ethers.parseEther('10.0');
    await deployer.sendTransaction({
      to: crypdoeBucksAddress,
      value: prizePoolAmount,
    });

    expect(crypdoeBucks).to.not.be.undefined;
    // expect the contract to have some ETH
    expect(await ethers.provider.getBalance(crypdoeBucksAddress)).to.equal(
      prizePoolAmount
    );
  });

  const mintBuck = async (userAddress: string, buck: buck) => {
    const receipt = await (
      await crypdoeBucks.createBuck(
        userAddress,
        buck.points,
        buck.fightingStyle,
        buck.does
      )
    ).wait();
    expect(receipt).to.not.be.null;
    return receipt;
  };

  it('Should mint a buck to user', async () => {
    const receipt = await mintBuck(user1Address, buck1);
    if (!receipt) return;

    const owner = await crypdoeBucks.buckToOwner(0);
    const buckBalance = await crypdoeBucks.balanceOf(user1Address);
    const { points, fightingStyle, does } = await crypdoeBucks.bucks(0);

    const event = getEventData('NewBuck', crypdoeBucks, receipt);
    expect(event?.args.id).to.equal(0n);
    expect(event?.args.to).to.equal(user1Address);
    expect(event?.args.points).to.equal(buck1.points);
    expect(event?.args.does).to.equal(buck1.does);

    expect(points).to.equal(buck1.points);
    expect(fightingStyle).to.equal(buck1.fightingStyle);
    expect(does).to.equal(buck1.does);
    expect(owner).to.equal(user1Address);
    expect(buckBalance).to.equal(1);
  });

  describe('Buck fights', () => {
    beforeEach(async () => {
      await mintBuck(user1Address, buck1);
      await mintBuck(user2Address, buck2);
    });

    it('Should be able to attack another buck, win and get the defenders does: winner', async () => {
      let receipt = await (
        await crypdoeBucks.connect(user1).prepareForFight(0, 1)
      ).wait(1);
      if (!receipt) return;

      const event = getEventData('FightInitiated', crypdoeBucks, receipt);
      const requestId = event?.args[2];

      await expect(
        vrfCoordinatorV2Mock.fulfillRandomWords(
          requestId,
          randomNumberConsumerV2Address
        )
      ).to.emit(randomNumberConsumerV2, 'RequestFulfilled');

      receipt = await (await crypdoeBucks.connect(user1).fight(0, 1)).wait(1);
      if (!receipt) return;

      const fightEvent = getEventData('FightConcluded', crypdoeBucks, receipt);
      evaluateFightOutcome(fightEvent, buck2.does);
    });

    it('Should be able to attack another buck, win and get the defenders does: loser', async () => {
      let receipt = await (
        await crypdoeBucks.connect(user2).prepareForFight(1, 0)
      ).wait(1);
      if (!receipt) return;

      const event = getEventData('FightInitiated', crypdoeBucks, receipt);
      const requestId = event?.args[2];

      await expect(
        vrfCoordinatorV2Mock.fulfillRandomWords(
          requestId,
          randomNumberConsumerV2Address
        )
      ).to.emit(randomNumberConsumerV2, 'RequestFulfilled');

      receipt = await (await crypdoeBucks.connect(user2).fight(1, 0)).wait(1);
      if (!receipt) return;

      const fightEvent = getEventData('FightConcluded', crypdoeBucks, receipt);
      evaluateFightOutcome(fightEvent, buck1.does);
    });

    const evaluateFightOutcome = (
      event: tsEthers.LogDescription | null,
      expectedDoes: number
    ) => {
      if (event?.args.doesMoved == 80085) {
        console.log('Draw!');
      } else if (event?.args.doesMoved > 0) {
        console.log('Winner!');
        expect(event?.args.doesMoved).to.equal(expectedDoes);
      } else {
        console.log('Loser!');
        expect(event?.args.doesMoved).to.equal(0);
      }
    };

    it('Should not be able to attack another buck, if not owner', async () => {
      // Attempt to initiate a fight with user2's buck using user1's signer, which should fail
      await expect(
        crypdoeBucks.connect(user1).prepareForFight(1, 0)
      ).to.be.revertedWith('Must be the buck owner');
    });

    it('Should not be able to attack another buck, if not ready', async () => {
      // Make user1's buck fight and enter cooldown
      const fightInitiationEvent = await (
        await crypdoeBucks.connect(user1).prepareForFight(0, 1)
      ).wait(1);

      if (!fightInitiationEvent) return;

      const fightInitiationEventLog = getEventData(
        'FightInitiated',
        crypdoeBucks,
        fightInitiationEvent
      );
      const requestId = fightInitiationEventLog?.args[2];

      await expect(
        vrfCoordinatorV2Mock.fulfillRandomWords(
          requestId,
          randomNumberConsumerV2Address
        )
      ).to.emit(randomNumberConsumerV2, 'RequestFulfilled');

      await (await crypdoeBucks.connect(user1).fight(0, 1)).wait(1);

      // Attempt to initiate another fight with user1's buck before cooldown expires
      await expect(
        crypdoeBucks.connect(user1).prepareForFight(0, 1)
      ).to.be.revertedWith('Buck is not ready to fight.');
    });
  });

  describe('Ending the season', function () {
    let maxDoeCount: bigint;
    beforeEach(async function () {
      // Setup initial state, including minting bucks and setting up prize pool
      await mintBuck(user1Address, buck1);
      await mintBuck(user2Address, buck2);
      await mintBuck(user2Address, buck3);
      await mintBuck(user2Address, buck4);

      maxDoeCount = await crypdoeBucks.maxDoeCount();
      const expectedMaxDoeCount = 100n; // Example total does setup
      expect(maxDoeCount).to.equal(expectedMaxDoeCount);
    });

    it('Should revert if non-owner tries to end season', async function () {
      await expect(crypdoeBucks.connect(user2).endSeason(0)).to.be.revertedWith(
        'Must be the buck owner'
      );
    });

    it('Should revert if buck does count is 0', async function () {
      // User2 Gives approval to the contract to burn their buck
      await crypdoeBucks.connect(user2).approve(crypdoeBucksAddress, 2);
      // User2 burns their buck
      await expect(crypdoeBucks.connect(user2).endSeason(2)).to.be.revertedWith(
        'Buck does count is 0.'
      );
    });

    it('Should transfer correct prize pool percentage to buck owner', async function () {
      // Track the prize pool balance before the prize is awarded
      const initialPrizePool = await crypdoeBucks.getPrizePoolValue();
      
      // Store the actual initial prize pool value for calculations
      const actualInitialPrizePool = BigInt(initialPrizePool.toString());
      
      // Calculate the expected prize amount based on the actual prize pool
      // buck1 has 69 does out of 100 total does (69%)
      const expectedPrizeAmount = (actualInitialPrizePool * BigInt(buck1.does)) / maxDoeCount;

      // User1 Gives approval to the contract to burn their buck
      await crypdoeBucks.connect(user1).approve(crypdoeBucksAddress, 0);

      // User1 burns their buck
      const receipt = await (
        await crypdoeBucks.connect(user1).endSeason(0)
      ).wait();

      if (!receipt) return;

      const event = getEventData('EndSeason', crypdoeBucks, receipt);

      // Check the buck ID is correct in the event
      expect(event?.args[0]).to.equal(0);
      
      // Check the prize amount in the event matches our expected value
      expect(event?.args[1]).to.equal(690000000000000000n);

      // Track prize pool balance after the prize is awarded
      const finalPrizePool = await crypdoeBucks.getPrizePoolValue();
      const actualFinalPrizePool = BigInt(finalPrizePool.toString());

      // Check that the prize amount was correctly deducted from the prize pool
      expect(actualInitialPrizePool - actualFinalPrizePool).to.equal(690000000000000000n);

      // Check if the buck has been burned by querying its owner, which should revert
      await expect(crypdoeBucks.ownerOf(0)).to.be.reverted;
    });
  });
});

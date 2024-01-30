import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers as tsEthers } from 'ethers';

import { ethers } from 'hardhat';
import {
  CrypdoeBucks,
  CrypdoeBucks__factory,
  VRFCoordinatorV2Mock,
  VRFv2Consumer,
} from '../typechain-types';
import { deployRandomNumberConsumerFixture } from './fixtures/RandomNumberConsumer';
import { getEventData } from './utils';

let CrypdoeBucksFactory: CrypdoeBucks__factory;
let crypdoeBucks: CrypdoeBucks;
// eslint-disable-next-line no-unused-vars
let deployer: tsEthers.Signer;
let user1: tsEthers.Signer;
let user2: tsEthers.Signer;

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

let user1Address: string;
let user2Address: string;
let randomNumberConsumerV2Address: string;
let randomNumberConsumerV2: VRFv2Consumer;
let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;

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

    CrypdoeBucksFactory = await ethers.getContractFactory('CrypdoeBucks');
    crypdoeBucks = await CrypdoeBucksFactory.deploy(
      randomNumberConsumerV2Address
    );

    await randomNumberConsumerV2.transferOwnership(
      await crypdoeBucks.getAddress()
    );
    await crypdoeBucks.acceptVRFOwnership();
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
});

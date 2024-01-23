import { reset } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers as tsEthers } from 'ethers';
import { ethers } from 'hardhat';
import { CrypdoeBucks, CrypdoeBucks__factory } from '../typechain-types';
import { getEventData } from './utils';

let CrypdoeBucksFactory: CrypdoeBucks__factory;
let crypdoeBucks: CrypdoeBucks;
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

let deployerAddress: string;
let user1Address: string;
let user2Address: string;

describe('CrypdoeBucks', () => {
  before(async () => {
    [deployer, user1, user2] = await ethers.getSigners();

    user1Address = await user1.getAddress();

    user2Address = await user2.getAddress();

    // console.log(user1Address, user2Address, deployerAddress)
    // "https://token-cdn-domain/{id}.json"

    CrypdoeBucksFactory = await await ethers.getContractFactory('CrypdoeBucks');
  });

  beforeEach(async () => {
    await reset();

    crypdoeBucks = await CrypdoeBucksFactory.deploy();
  });

  it('Should mint a buck to user', async () => {
    const receipt = await (
      await crypdoeBucks.createBuck(
        user1Address,
        buck1.points,
        buck1.fightingStyle,
        buck1.does
      )
    ).wait();
    expect(receipt).to.not.be.null;

    if (!receipt) return;

    const owner = await crypdoeBucks.buckToOwner(0);
    const buckBalance = await crypdoeBucks.balanceOf(user1Address);
    const { points, fightingStyle, does } = await crypdoeBucks.bucks(0);

    //console.log(receipt);
    // const uri: string = await crypdoeBucks.uri(1);
    // console.log(uri);
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

  it('Should be able to attack another buck, win and get the defenders does: winner', async () => {
    const user1Address = await user1.getAddress();
    await crypdoeBucks.createBuck(
      user1Address,
      buck1.points,
      buck1.fightingStyle,
      buck1.does
    );

    const user2Address = await user2.getAddress();
    let receipt = await (
      await crypdoeBucks.createBuck(
        user2Address,
        buck2.points,
        buck2.fightingStyle,
        buck2.does
      )
    ).wait();
    expect(receipt).to.not.be.null;

    if (!receipt) return;

    let event = getEventData('NewBuck', crypdoeBucks, receipt);

    expect(event?.args.id).to.equal(1);
    expect(event?.args.to).to.equal(user2Address);
    expect(event?.args.points).to.equal(buck2.points);
    expect(event?.args.does).to.equal(buck2.does);

    const { readyTime } = await crypdoeBucks.bucks(1);

    receipt = await (await crypdoeBucks.connect(user1).fight(0, 1)).wait(1);
    expect(receipt).to.not.be.null;

    if (!receipt) return;
    event = getEventData('Fight', crypdoeBucks, receipt);

    if (event?.args.doesMoved == 4200000000) {
      // draw
      console.log('Draw!');
    } else if (event?.args.doesMoved > 0) {
      console.log('Winner!');
      expect(event?.args.doesMoved).to.equal(buck2.does);
      // Check ready time is reset
      expect(readyTime).to.greaterThan(Math.floor(Date.now() / 1000));
      const { does } = await crypdoeBucks.bucks(1);
      expect(does).to.equal(0);
    } else {
      expect(event?.args.doesMoved).to.equal(0);
      const { does } = await crypdoeBucks.bucks(1);
      expect(does).to.equal(1);
      console.log('Loser!');
    }
  });

  it('Should be able to attack another buck, win and get the defenders does: loser', async () => {
    const user1Address = await user1.getAddress();
    await crypdoeBucks.createBuck(
      user1Address,
      buck1.points,
      buck1.fightingStyle,
      buck1.does
    );

    const user2Address = await user2.getAddress();
    let receipt = await (
      await crypdoeBucks.createBuck(
        user2Address,
        buck2.points,
        buck2.fightingStyle,
        buck2.does
      )
    ).wait(1);

    expect(receipt).to.not.be.null;

    if (!receipt) return;

    let event = getEventData('NewBuck', crypdoeBucks, receipt);
    expect(event?.args.id).to.equal(1);
    expect(event?.args.to).to.equal(user2Address);
    expect(event?.args.points).to.equal(buck2.points);
    expect(event?.args.does).to.equal(buck2.does);

    const { readyTime } = await crypdoeBucks.bucks(0);

    receipt = await (await crypdoeBucks.connect(user2).fight(1, 0)).wait(1);
    expect(receipt).to.not.be.null;

    if (!receipt) return;
    event = getEventData('Fight', crypdoeBucks, receipt);

    if (event?.args.doesMoved === 4200000000) {
      // draw
      console.log('Draw!');
    } else if (event?.args.doesMoved > 0) {
      console.log('Winner!');
      expect(event?.args.doesMoved).to.equal(buck2.does);
      // Check ready time is reset
      expect(readyTime).to.greaterThan(Date.now() / 1000);
      const { does } = await crypdoeBucks.bucks(1);
      expect(does).to.equal(0);
    } else {
      expect(event?.args.doesMoved).to.equal(0);
      const { does } = await crypdoeBucks.bucks(1);
      expect(does).to.equal(1);
      console.log('Loser!');
    }
  });

  // TODO: Add negative tests, for acsess control
});

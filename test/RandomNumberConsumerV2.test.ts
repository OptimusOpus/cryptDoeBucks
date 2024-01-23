import { ethers as tsEthers } from 'ethers';
import { ethers } from 'hardhat';
import {
  VRFCoordinatorV2Mock,
  VRFCoordinatorV2Mock__factory,
} from '../typechain-types';
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { assert, expect } = require('chai');

describe('Random Number Consumer Unit Tests', async function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployRandomNumberConsumerFixture() {
    const [deployer] = await ethers.getSigners();

    /**
     * @dev Read more at https://docs.chain.link/docs/chainlink-vrf/
     */
    const BASE_FEE = '100000000000000000';
    const GAS_PRICE_LINK = '1000000000'; // 0.000000001 LINK per gas

    const VRFCoordinatorV2MockFactory: VRFCoordinatorV2Mock__factory =
      await ethers.getContractFactory('VRFCoordinatorV2Mock');
    const VRFCoordinatorV2Mock: VRFCoordinatorV2Mock =
      await VRFCoordinatorV2MockFactory.deploy(BASE_FEE, GAS_PRICE_LINK);

    const fundAmount = '1000000000000000000';
    const transaction = await VRFCoordinatorV2Mock.createSubscription();
    const transactionReceipt = await transaction.wait(1);
    if (!transactionReceipt) {
      throw new Error('No receipt returned from createSubscription');
    }
    const subscriptionId = transactionReceipt.logs[0].topics[1];

    await VRFCoordinatorV2Mock.fundSubscription(subscriptionId, fundAmount);

    const vrfCoordinatorAddress = VRFCoordinatorV2Mock.getAddress();
    const keyHash =
      '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc';

    const randomNumberConsumerV2Factory = await ethers.getContractFactory(
      'RandomNumberConsumerV2'
    );
    const randomNumberConsumerV2 = await randomNumberConsumerV2Factory
      .connect(deployer)
      .deploy(subscriptionId, vrfCoordinatorAddress, keyHash);

    await VRFCoordinatorV2Mock.addConsumer(
      subscriptionId,
      randomNumberConsumerV2.getAddress()
    );

    return { randomNumberConsumerV2, VRFCoordinatorV2Mock };
  }

  describe('#requestRandomWords', async function () {
    describe('success', async function () {
      it('Should successfully request a random number', async function () {
        const { randomNumberConsumerV2, VRFCoordinatorV2Mock } =
          await loadFixture(deployRandomNumberConsumerFixture);
        await expect(randomNumberConsumerV2.requestRandomWords()).to.emit(
          VRFCoordinatorV2Mock,
          'RandomWordsRequested'
        );
      });

      it('Should successfully request a random number and get a result', async function () {
        const { randomNumberConsumerV2, VRFCoordinatorV2Mock } =
          await loadFixture(deployRandomNumberConsumerFixture);
        await randomNumberConsumerV2.requestRandomWords();
        const requestId = await randomNumberConsumerV2.s_requestId();
        const randomNumberConsumerV2Address =
          await randomNumberConsumerV2.getAddress();

        // simulate callback from the oracle network
        await expect(
          VRFCoordinatorV2Mock.fulfillRandomWords(
            requestId,
            randomNumberConsumerV2Address
          )
        ).to.emit(randomNumberConsumerV2, 'ReturnedRandomness');

        const firstRandomNumber = await randomNumberConsumerV2.s_randomWords(0);

        const secondRandomNumber =
          await randomNumberConsumerV2.s_randomWords(1);

        assert(
          firstRandomNumber > 0n,
          'First random number is greater than zero'
        );

        assert(
          secondRandomNumber > 0n,
          'Second random number is greater than zero'
        );
      });

      it('Should successfully fire event on callback', async function () {
        const { randomNumberConsumerV2, VRFCoordinatorV2Mock } =
          await loadFixture(deployRandomNumberConsumerFixture);

        await new Promise<void>(async (resolve, reject) => {
          randomNumberConsumerV2.once('ReturnedRandomness', async () => {
            console.log('ReturnedRandomness event fired!');
            const firstRandomNumber =
              await randomNumberConsumerV2.s_randomWords(0);
            const secondRandomNumber =
              await randomNumberConsumerV2.s_randomWords(1);
            // assert throws an error if it fails, so we need to wrap
            // it in a try/catch so that the promise returns event
            // if it fails.
            try {
              assert(firstRandomNumber > 0n);
              assert(secondRandomNumber > 0n);
              resolve();
            } catch (e) {
              reject(e);
            }
          });
          await randomNumberConsumerV2.requestRandomWords();
          const requestId = await randomNumberConsumerV2.s_requestId();
          const randomNumberConsumerV2Address =
            await randomNumberConsumerV2.getAddress();
          VRFCoordinatorV2Mock.fulfillRandomWords(
            requestId,
            randomNumberConsumerV2Address
          );
        });
      });
    });
  });
});

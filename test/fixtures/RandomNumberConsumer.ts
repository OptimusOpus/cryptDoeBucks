import { ethers } from 'hardhat';
import {
  VRFCoordinatorV2Mock,
  VRFCoordinatorV2Mock__factory,
} from '../../typechain-types';

export async function deployRandomNumberConsumerFixture() {
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

  const vrfCoordinatorAddress = await VRFCoordinatorV2Mock.getAddress();
  const keyHash =
    '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc';

  const randomNumberConsumerV2Factory =
    await ethers.getContractFactory('VRFv2Consumer');

  const randomNumberConsumerV2 = await randomNumberConsumerV2Factory
    .connect(deployer)
    .deploy(subscriptionId, keyHash, vrfCoordinatorAddress);

  await VRFCoordinatorV2Mock.addConsumer(
    subscriptionId,
    randomNumberConsumerV2.getAddress()
  );

  return { randomNumberConsumerV2, VRFCoordinatorV2Mock };
}

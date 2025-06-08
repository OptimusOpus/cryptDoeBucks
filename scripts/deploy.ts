import { ethers, network } from 'hardhat';

async function main() {
  console.log('Deploying CrypdoeBucks contracts with reduced size...');

  let vrfCoordinatorV2MockAddress: string | undefined = undefined;
  let activeSubscriptionId: bigint; // Changed from mockSubscriptionId to avoid conflict with existing variable

  if (network.name === 'hardhat') {
    console.log('Deploying VRFCoordinatorV2Mock for local network...');
    const BASE_FEE = ethers.parseUnits('0.25', 'ether'); // 0.25 LINK (mock value)
    const GAS_PRICE_LINK = 1e9; // 1 Gwei LINK (mock value)
    const vrfCoordinatorV2MockFactory = await ethers.getContractFactory('VRFCoordinatorV2Mock');
    const vrfCoordinatorV2Mock = await vrfCoordinatorV2MockFactory.deploy(BASE_FEE, GAS_PRICE_LINK);
    await vrfCoordinatorV2Mock.waitForDeployment();
    vrfCoordinatorV2MockAddress = await vrfCoordinatorV2Mock.getAddress();
    console.log('VRFCoordinatorV2Mock deployed to:', vrfCoordinatorV2MockAddress);

    // Create a subscription
    console.log('Creating subscription on VRFCoordinatorV2Mock...');
    const tx = await vrfCoordinatorV2Mock.createSubscription();
    const receipt = await tx.wait();

    let foundSubId;
    if (receipt && receipt.logs) {
      for (const logEntry of receipt.logs) {
        try {
          // Ensure vrfCoordinatorV2Mock has its interface loaded for parsing
          const parsedLog = vrfCoordinatorV2Mock.interface.parseLog(logEntry);
          if (parsedLog && parsedLog.name === 'SubscriptionCreated') {
            foundSubId = parsedLog.args.subId;
            break;
          }
        } catch (e) {
          // Log if parsing fails for a specific log, but continue checking others
          // console.debug(`Failed to parse a log entry: ${e}`);
        }
      }
    }

    if (foundSubId === undefined) {
      console.warn(
        'Could not find SubscriptionCreated event to parse subId. Using mock value 1n. TODO: Investigate event parsing if this occurs.',
      );
      activeSubscriptionId = 1n; // Fallback mock value
    } else {
      activeSubscriptionId = foundSubId;
    }
    console.log('Subscription created with ID:', activeSubscriptionId.toString());

    // Fund the subscription
    const fundAmount = ethers.parseUnits('100', 'ether'); // 100 LINK (mock value)
    await vrfCoordinatorV2Mock.fundSubscription(activeSubscriptionId, fundAmount);
    console.log(`Subscription ${activeSubscriptionId.toString()} funded with 100 LINK (mock)`);
  } else {
    // For non-hardhat networks, use existing example mock values or expect them from .env
    activeSubscriptionId = BigInt(1); // Default mock value from existing script
    console.log(
      'Using default mockSubscriptionId for non-hardhat network:',
      activeSubscriptionId.toString(),
    );
  }

  // First, deploy the FightLib library
  console.log('Deploying FightLib library...');
  const fightLibFactory = await ethers.getContractFactory('FightLib');
  const fightLib = await fightLibFactory.deploy();
  await fightLib.waitForDeployment();
  const fightLibAddress = await fightLib.getAddress();
  console.log('FightLib deployed to:', fightLibAddress);

  // Deploy a mock VRF consumer for testing (or actual VRF consumer)
  console.log('Deploying VRF Consumer...');
  const vrfFactory = await ethers.getContractFactory('VRFv2Consumer');

  // Use deployed VRFCoordinatorV2Mock address if on hardhat, otherwise use the existing placeholder/mock.
  const coordinatorToUse =
    vrfCoordinatorV2MockAddress || '0x0000000000000000000000000000000000000001';

  // Use a common keyHash for hardhat, or a placeholder for others.
  const keyHashToUse =
    network.name === 'hardhat'
      ? '0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15' // Common keyHash for hardhat node
      : '0x0000000000000000000000000000000000000000000000000000000000000001'; // Existing placeholder

  // Pass activeSubscriptionId, keyHashToUse, coordinatorToUse (matching constructor order)
  const vrfConsumer = await vrfFactory.deploy(activeSubscriptionId, keyHashToUse, coordinatorToUse);
  await vrfConsumer.waitForDeployment();
  const vrfAddress = await vrfConsumer.getAddress();
  console.log('VRF Consumer deployed to:', vrfAddress);

  // If on hardhat network, add consumer to mock coordinator's subscription
  if (network.name === 'hardhat' && vrfCoordinatorV2MockAddress) {
    // Get contract instance for the already deployed VRFCoordinatorV2Mock
    const vrfCoordinatorV2MockInstance = await ethers.getContractAt(
      'VRFCoordinatorV2Mock',
      vrfCoordinatorV2MockAddress,
    );
    await vrfCoordinatorV2MockInstance.addConsumer(activeSubscriptionId, vrfAddress);
    console.log(
      `VRFConsumer ${vrfAddress} added as a consumer to subscription ${activeSubscriptionId.toString()} on VRFCoordinatorV2Mock.`,
    );
  }

  // Deploy the PrizePool contract
  console.log('Deploying Prize Pool...');
  const prizePoolFactory = await ethers.getContractFactory('PrizePool');
  // Set mating season end to 1 day from now
  const matingSeasonEnd = Math.floor(Date.now() / 1000) + 86400;
  // Use BigInt values for wei amounts
  const initialPrizePool = BigInt('1000000000000000000'); // 1 ETH
  const trainingCost = BigInt('10000000000000000'); // 0.01 ETH
  const breedingCost = BigInt('50000000000000000'); // 0.05 ETH

  const prizePool = await prizePoolFactory.deploy(
    matingSeasonEnd,
    initialPrizePool,
    trainingCost,
    breedingCost,
  );
  await prizePool.waitForDeployment();
  const prizePoolAddress = await prizePool.getAddress();
  console.log('Prize Pool deployed to:', prizePoolAddress);

  // Finally, deploy the CrypdoeBucks contract with linked library and references
  console.log('Deploying CrypdoeBucks main contract...');
  // Try to get the factory first to see what the actual error is
  const cryptDoeBucksFactory = await ethers.getContractFactory('CrypdoeBucks');
  const cryptDoeBucks = await cryptDoeBucksFactory.deploy(vrfAddress, prizePoolAddress);
  await cryptDoeBucks.waitForDeployment();
  const cryptDoeBucksAddress = await cryptDoeBucks.getAddress();
  console.log('CrypdoeBucks deployed to:', cryptDoeBucksAddress);

  // Setup contract references
  await prizePool.setBuckContract(cryptDoeBucksAddress);
  console.log('Set CrypdoeBucks address in PrizePool');

  console.log('\nSummary of deployed contracts:');
  console.log('-----------------------------');
  if (vrfCoordinatorV2MockAddress) {
    console.log('VRFCoordinatorV2Mock:', vrfCoordinatorV2MockAddress);
    console.log('Active Subscription ID:', activeSubscriptionId.toString());
  }
  console.log('FightLib:      ', fightLibAddress);
  console.log('VRF Consumer:  ', vrfAddress);
  console.log('Prize Pool:    ', prizePoolAddress);
  console.log('CrypdoeBucks:  ', cryptDoeBucksAddress);
  console.log('\nDeployment complete.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers } from 'hardhat';

async function main() {
  console.log('Deploying CrypdoeBucks contracts with reduced size...');

  // First, deploy the FightLib library
  console.log('Deploying FightLib library...');
  const fightLibFactory = await ethers.getContractFactory('FightLib');
  const fightLib = await fightLibFactory.deploy();
  await fightLib.waitForDeployment();
  const fightLibAddress = await fightLib.getAddress();
  console.log('FightLib deployed to:', fightLibAddress);

  // Deploy a mock VRF consumer for testing
  console.log('Deploying VRF Consumer...');
  const vrfFactory = await ethers.getContractFactory('VRFv2Consumer');
  // For a test deployment, use mock values for required parameters
  const mockSubscriptionId = 1;
  const mockCoordinator = '0x0000000000000000000000000000000000000001';
  const mockKeyHash = '0x0000000000000000000000000000000000000000000000000000000000000001';

  const vrfConsumer = await vrfFactory.deploy(mockSubscriptionId, mockCoordinator, mockKeyHash);
  await vrfConsumer.waitForDeployment();
  const vrfAddress = await vrfConsumer.getAddress();
  console.log('VRF Consumer deployed to:', vrfAddress);

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
  // Link the FightLib library to the CrypdoeBucks contract
  const cryptDoeBucksFactory = await ethers.getContractFactory('CrypdoeBucks', {
    libraries: {
      FightLib: fightLibAddress,
    },
  });
  const cryptDoeBucks = await cryptDoeBucksFactory.deploy(vrfAddress, prizePoolAddress);
  await cryptDoeBucks.waitForDeployment();
  const cryptDoeBucksAddress = await cryptDoeBucks.getAddress();
  console.log('CrypdoeBucks deployed to:', cryptDoeBucksAddress);

  // Setup contract references
  await prizePool.setBuckContract(cryptDoeBucksAddress);
  console.log('Set CrypdoeBucks address in PrizePool');

  console.log('\nSummary of deployed contracts:');
  console.log('-----------------------------');
  console.log('FightLib:      ', fightLibAddress);
  console.log('VRF Consumer:  ', vrfAddress);
  console.log('Prize Pool:    ', prizePoolAddress);
  console.log('CrypdoeBucks:  ', cryptDoeBucksAddress);
  console.log('\nDeployment complete. The contract should now be under the size limit.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import {
  CrypdoeBucks,
  MetadataLib,
  PrizePool,
  VRFv2Consumer,
  VRFCoordinatorV2Mock,
} from '../typechain-types';

describe('Dynamic Metadata', function () {
  let cryptDoeBucks: CrypdoeBucks;
  let prizePool: PrizePool;
  let vrfConsumer: VRFv2Consumer;
  let vrfCoordinator: VRFCoordinatorV2Mock;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    // Deploy VRF Mock
    const BASE_FEE = ethers.parseUnits('0.25', 'ether');
    const GAS_PRICE_LINK = 1e9;
    const VRFCoordinatorV2MockFactory = await ethers.getContractFactory('VRFCoordinatorV2Mock');
    vrfCoordinator = await VRFCoordinatorV2MockFactory.deploy(BASE_FEE, GAS_PRICE_LINK);
    await vrfCoordinator.waitForDeployment();

    // Create subscription
    const tx = await vrfCoordinator.createSubscription();
    const receipt = await tx.wait();
    const subscriptionId = 1; // Using 1 as fallback

    // Fund subscription
    const fundAmount = ethers.parseUnits('100', 'ether');
    await vrfCoordinator.fundSubscription(subscriptionId, fundAmount);

    // Deploy VRF Consumer
    const VRFv2ConsumerFactory = await ethers.getContractFactory('VRFv2Consumer');
    const keyHash = '0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15';
    vrfConsumer = await VRFv2ConsumerFactory.deploy(
      subscriptionId,
      keyHash,
      await vrfCoordinator.getAddress(),
    );
    await vrfConsumer.waitForDeployment();

    // Add consumer to subscription
    await vrfCoordinator.addConsumer(subscriptionId, await vrfConsumer.getAddress());

    // Deploy PrizePool
    const PrizePoolFactory = await ethers.getContractFactory('PrizePool');
    const matingSeasonEnd = Math.floor(Date.now() / 1000) + 86400;
    const initialPrizePool = ethers.parseEther('1');
    const trainingCost = ethers.parseEther('0.01');
    const breedingCost = ethers.parseEther('0.05');

    prizePool = await PrizePoolFactory.deploy(
      matingSeasonEnd,
      initialPrizePool,
      trainingCost,
      breedingCost,
    );
    await prizePool.waitForDeployment();

    // Deploy required libraries first
    const MetadataLibFactory = await ethers.getContractFactory('MetadataLib');
    const metadataLib = await MetadataLibFactory.deploy();
    await metadataLib.waitForDeployment();

    const RandomLibFactory = await ethers.getContractFactory('RandomLib');
    const randomLib = await RandomLibFactory.deploy();
    await randomLib.waitForDeployment();

    // Deploy CrypdoeBucks with linked library
    const CrypdoeBucksFactory = await ethers.getContractFactory('CrypdoeBucks', {
      libraries: {
        MetadataLib: await metadataLib.getAddress(),
        RandomLib: await randomLib.getAddress(),
      },
    });
    cryptDoeBucks = await CrypdoeBucksFactory.deploy(
      await vrfConsumer.getAddress(),
      await prizePool.getAddress(),
    );
    await cryptDoeBucks.waitForDeployment();

    // Set buck contract in prize pool
    await prizePool.setBuckContract(await cryptDoeBucks.getAddress());
  });

  describe('Basic Metadata Generation', function () {
    it('Should generate dynamic metadata for a newly created buck', async function () {
      // Create a buck
      await cryptDoeBucks.createBuck(user1.address, 75, 1, 5);

      // Get token URI
      const tokenURI = await cryptDoeBucks.tokenURI(0);

      // Check that it's a data URI
      expect(tokenURI).to.include('data:application/json;base64,');

      // Decode and parse the JSON
      const base64Data = tokenURI.split(',')[1];
      const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
      const metadata = JSON.parse(jsonString);

      // Verify basic structure
      expect(metadata.name).to.equal('CrypdoeBuck #0');
      expect(metadata.description).to.include('fighting buck');
      expect(metadata.image).to.include('data:image/svg+xml;base64,');
      expect(metadata.attributes).to.be.an('array');

      console.log('Generated metadata:', JSON.stringify(metadata, null, 2));
    });

    it('Should include correct attributes in metadata', async function () {
      // Create a buck with specific stats
      await cryptDoeBucks.createBuck(user1.address, 85, 2, 8);

      const tokenURI = await cryptDoeBucks.tokenURI(0);
      const base64Data = tokenURI.split(',')[1];
      const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
      const metadata = JSON.parse(jsonString);

      // Find specific attributes
      const levelAttr = metadata.attributes.find((attr: any) => attr.trait_type === 'Level');
      const pointsAttr = metadata.attributes.find((attr: any) => attr.trait_type === 'Points');
      const styleAttr = metadata.attributes.find(
        (attr: any) => attr.trait_type === 'Fighting Style',
      );
      const doesAttr = metadata.attributes.find(
        (attr: any) => attr.trait_type === 'Does Controlled',
      );

      expect(levelAttr.value).to.equal(1); // New bucks start at level 1
      expect(pointsAttr.value).to.equal(85);
      expect(styleAttr.value).to.equal('Defensive'); // Style 2 = Defensive
      expect(doesAttr.value).to.equal(8);
    });

    it('Should show different rarities based on genetics', async function () {
      // Create multiple bucks and check their rarity
      await cryptDoeBucks.createBuck(user1.address, 50, 1, 3);
      await cryptDoeBucks.createBuck(user1.address, 90, 2, 7);

      // Check first buck (likely Common due to random genetics)
      const tokenURI1 = await cryptDoeBucks.tokenURI(0);
      const base64Data1 = tokenURI1.split(',')[1];
      const jsonString1 = Buffer.from(base64Data1, 'base64').toString('utf-8');
      const metadata1 = JSON.parse(jsonString1);

      const rarityAttr1 = metadata1.attributes.find((attr: any) => attr.trait_type === 'Rarity');
      expect(rarityAttr1.value).to.be.oneOf(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']);

      console.log('Buck #0 rarity:', rarityAttr1.value);
    });
  });

  describe('Dynamic Updates', function () {
    beforeEach(async function () {
      // Create a test buck
      await cryptDoeBucks.createBuck(user1.address, 75, 1, 5);
    });

    it('Should update metadata after training', async function () {
      // Get initial metadata
      const initialURI = await cryptDoeBucks.tokenURI(0);
      const initialBase64 = initialURI.split(',')[1];
      const initialJson = Buffer.from(initialBase64, 'base64').toString('utf-8');
      const initialMetadata = JSON.parse(initialJson);

      // Find a trait that's not at maximum to train
      let traitToTrain = 0; // Strength
      let initialValue = initialMetadata.attributes.find(
        (attr: any) => attr.trait_type === 'Strength',
      ).value;

      if (initialValue >= 10) {
        traitToTrain = 1; // Speed
        initialValue = initialMetadata.attributes.find(
          (attr: any) => attr.trait_type === 'Speed',
        ).value;
      }
      if (initialValue >= 10) {
        traitToTrain = 2; // Vitality
        initialValue = initialMetadata.attributes.find(
          (attr: any) => attr.trait_type === 'Vitality',
        ).value;
      }
      if (initialValue >= 10) {
        traitToTrain = 3; // Intelligence
        initialValue = initialMetadata.attributes.find(
          (attr: any) => attr.trait_type === 'Intelligence',
        ).value;
      }

      const traitNames = ['Strength', 'Speed', 'Vitality', 'Intelligence'];

      // Skip test if all traits are at maximum (unlikely but possible)
      if (initialValue >= 10) {
        console.log('All traits at maximum, skipping training test');
        return;
      }

      // Train the buck
      await cryptDoeBucks
        .connect(user1)
        .trainBuck(0, traitToTrain, { value: ethers.parseEther('0.01') });

      // Get updated metadata
      const updatedURI = await cryptDoeBucks.tokenURI(0);
      const updatedBase64 = updatedURI.split(',')[1];
      const updatedJson = Buffer.from(updatedBase64, 'base64').toString('utf-8');
      const updatedMetadata = JSON.parse(updatedJson);

      const updatedValue = updatedMetadata.attributes.find(
        (attr: any) => attr.trait_type === traitNames[traitToTrain],
      ).value;

      // Trait should have increased by 1
      expect(updatedValue).to.equal(initialValue + 1);

      console.log(`${traitNames[traitToTrain]} before training:`, initialValue);
      console.log(`${traitNames[traitToTrain]} after training:`, updatedValue);
    });

    it('Should emit MetadataUpdate event when training', async function () {
      // Check if trait can be trained first
      const initialURI = await cryptDoeBucks.tokenURI(0);
      const initialBase64 = initialURI.split(',')[1];
      const initialJson = Buffer.from(initialBase64, 'base64').toString('utf-8');
      const initialMetadata = JSON.parse(initialJson);

      const strengthValue = initialMetadata.attributes.find(
        (attr: any) => attr.trait_type === 'Strength',
      ).value;

      if (strengthValue < 10) {
        await expect(
          cryptDoeBucks.connect(user1).trainBuck(0, 0, { value: ethers.parseEther('0.01') }),
        )
          .to.emit(cryptDoeBucks, 'MetadataUpdate')
          .withArgs(0);
      } else {
        console.log('Strength at maximum, skipping event test');
      }
    });
  });

  describe('SVG Generation', function () {
    it('Should generate valid SVG images', async function () {
      await cryptDoeBucks.createBuck(user1.address, 85, 3, 10);

      const tokenURI = await cryptDoeBucks.tokenURI(0);
      const base64Data = tokenURI.split(',')[1];
      const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
      const metadata = JSON.parse(jsonString);

      // Decode the SVG
      const svgBase64 = metadata.image.split(',')[1];
      const svgString = Buffer.from(svgBase64, 'base64').toString('utf-8');

      // Check SVG structure
      expect(svgString).to.include('<svg');
      expect(svgString).to.include('</svg>');
      expect(svgString).to.include('width="400"');
      expect(svgString).to.include('height="400"');

      console.log('Generated SVG length:', svgString.length);
      console.log('SVG preview:', svgString.substring(0, 200) + '...');
    });
  });

  describe('Gas Usage', function () {
    it('Should measure gas usage for tokenURI calls', async function () {
      await cryptDoeBucks.createBuck(user1.address, 75, 1, 5);

      // Measure gas usage for tokenURI call
      const gasEstimate = await cryptDoeBucks.tokenURI.estimateGas(0);

      console.log('Gas used for tokenURI call:', gasEstimate.toString());

      // Should be reasonable (under 600k gas for complex metadata generation)
      expect(gasEstimate).to.be.lt(ethers.parseUnits('600000', 'wei'));
    });
  });
});

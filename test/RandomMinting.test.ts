import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import {
  CrypdoeBucks,
  MetadataLib,
  RandomLib,
  PrizePool,
  VRFv2Consumer,
  VRFCoordinatorV2Mock,
} from '../typechain-types';

describe('Random Minting System', function () {
  let cryptDoeBucks: CrypdoeBucks;
  let randomLib: RandomLib;
  let prizePool: PrizePool;
  let vrfConsumer: VRFv2Consumer;
  let vrfCoordinator: VRFCoordinatorV2Mock;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy VRF Mock
    const BASE_FEE = ethers.parseUnits('0.25', 'ether');
    const GAS_PRICE_LINK = 1e9;
    const VRFCoordinatorV2MockFactory = await ethers.getContractFactory('VRFCoordinatorV2Mock');
    vrfCoordinator = await VRFCoordinatorV2MockFactory.deploy(BASE_FEE, GAS_PRICE_LINK);
    await vrfCoordinator.waitForDeployment();

    // Create and fund subscription
    const tx = await vrfCoordinator.createSubscription();
    await tx.wait();
    const subscriptionId = 1;
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

    // Deploy libraries
    const MetadataLibFactory = await ethers.getContractFactory('MetadataLib');
    const metadataLib = await MetadataLibFactory.deploy();
    await metadataLib.waitForDeployment();

    const RandomLibFactory = await ethers.getContractFactory('RandomLib');
    randomLib = await RandomLibFactory.deploy();
    await randomLib.waitForDeployment();

    // Deploy CrypdoeBucks with linked libraries
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

    // Enable public sale
    await cryptDoeBucks.togglePublicSale();
  });

  describe('Basic Minting', function () {
    it('Should mint a single buck with random stats', async function () {
      const mintPrice = await cryptDoeBucks.mintPrice();
      
      await expect(
        cryptDoeBucks.connect(user1).mintBuck(1, { value: mintPrice })
      ).to.emit(cryptDoeBucks, 'BuckMinted');

      // Check that buck was minted
      expect(await cryptDoeBucks.ownerOf(0)).to.equal(user1.address);
      expect(await cryptDoeBucks.balanceOf(user1.address)).to.equal(1);

      // Check minting tracking
      expect(await cryptDoeBucks.mintedPerAddress(user1.address)).to.equal(1);
    });

    it('Should mint multiple bucks with different stats', async function () {
      const mintPrice = await cryptDoeBucks.mintPrice();
      const quantity = 5;
      
      await cryptDoeBucks.connect(user1).mintBuck(quantity, { value: mintPrice * BigInt(quantity) });

      // Check all bucks were minted
      expect(await cryptDoeBucks.balanceOf(user1.address)).to.equal(quantity);
      
      // Check that stats are different (very unlikely to be identical)
      const tokenURI1 = await cryptDoeBucks.tokenURI(0);
      const tokenURI2 = await cryptDoeBucks.tokenURI(1);
      expect(tokenURI1).to.not.equal(tokenURI2);
    });

    it('Should enforce minting limits', async function () {
      const mintPrice = await cryptDoeBucks.mintPrice();
      const maxPerTx = await cryptDoeBucks.maxMintsPerTx();
      
      // Should fail to mint more than max per tx
      await expect(
        cryptDoeBucks.connect(user1).mintBuck(maxPerTx + BigInt(1), { 
          value: mintPrice * (maxPerTx + BigInt(1))
        })
      ).to.be.revertedWith('Invalid quantity');
    });

    it('Should enforce payment requirements', async function () {
      const mintPrice = await cryptDoeBucks.mintPrice();
      
      // Should fail with insufficient payment
      await expect(
        cryptDoeBucks.connect(user1).mintBuck(1, { value: mintPrice - BigInt(1) })
      ).to.be.revertedWith('Insufficient payment');
    });

    it('Should respect public sale state', async function () {
      // Disable public sale
      await cryptDoeBucks.togglePublicSale();
      
      const mintPrice = await cryptDoeBucks.mintPrice();
      
      await expect(
        cryptDoeBucks.connect(user1).mintBuck(1, { value: mintPrice })
      ).to.be.revertedWith('Public sale not active');
    });
  });

  describe('Batch Minting', function () {
    it('Should mint batch with discount', async function () {
      const mintPrice = await cryptDoeBucks.mintPrice();
      const batchPrice = (mintPrice * BigInt(95)) / BigInt(100); // 5% discount
      const quantity = 10;
      
      await cryptDoeBucks.connect(user1).mintBuckBatch(quantity, { 
        value: batchPrice * BigInt(quantity) 
      });

      expect(await cryptDoeBucks.balanceOf(user1.address)).to.equal(quantity);
      expect(await cryptDoeBucks.mintedPerAddress(user1.address)).to.equal(quantity);
    });

    it('Should enforce batch size limits', async function () {
      const mintPrice = await cryptDoeBucks.mintPrice();
      
      // Should fail for less than 5
      await expect(
        cryptDoeBucks.connect(user1).mintBuckBatch(3, { value: mintPrice * BigInt(3) })
      ).to.be.revertedWith('Batch: 5-20 bucks only');

      // Should fail for more than 20
      await expect(
        cryptDoeBucks.connect(user1).mintBuckBatch(25, { value: mintPrice * BigInt(25) })
      ).to.be.revertedWith('Batch: 5-20 bucks only');
    });
  });


  describe('Admin Functions', function () {
    it('Should allow owner to adjust mint price', async function () {
      const newPrice = ethers.parseEther('0.1');
      
      await cryptDoeBucks.setMintPrice(newPrice);
      expect(await cryptDoeBucks.mintPrice()).to.equal(newPrice);
    });

    it('Should allow owner to free mint', async function () {
      await cryptDoeBucks.freeMint(user1.address, 5);
      expect(await cryptDoeBucks.balanceOf(user1.address)).to.equal(5);
    });

    it('Should allow owner to withdraw funds', async function () {
      // User mints to add funds to contract
      const mintPrice = await cryptDoeBucks.mintPrice();
      await cryptDoeBucks.connect(user1).mintBuck(1, { value: mintPrice });
      
      const initialBalance = await ethers.provider.getBalance(owner.address);
      
      await cryptDoeBucks.withdraw();
      
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it('Should not allow non-owner to call admin functions', async function () {
      await expect(
        cryptDoeBucks.connect(user1).setMintPrice(ethers.parseEther('0.1'))
      ).to.be.revertedWith('Ownable: caller is not the owner');

      await expect(
        cryptDoeBucks.connect(user1).freeMint(user2.address, 1)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('Random Generation Quality', function () {
    it('Should generate varied rarity distribution', async function () {
      const mintPrice = await cryptDoeBucks.mintPrice();
      const numMints = 20;
      
      // Mint multiple bucks
      for (let i = 0; i < numMints; i++) {
        await cryptDoeBucks.connect(user1).mintBuck(1, { value: mintPrice });
      }
      
      // Collect rarities
      const rarities: string[] = [];
      for (let i = 0; i < numMints; i++) {
        const tokenURI = await cryptDoeBucks.tokenURI(i);
        const base64Data = tokenURI.split(',')[1];
        const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
        const metadata = JSON.parse(jsonString);
        const rarityAttr = metadata.attributes.find((attr: any) => attr.trait_type === 'Rarity');
        rarities.push(rarityAttr.value);
      }
      
      // Should have at least 2 different rarities (Common should be most frequent)
      const uniqueRarities = [...new Set(rarities)];
      expect(uniqueRarities.length).to.be.gte(2);
      
      // Common should be the most frequent
      const commonCount = rarities.filter(r => r === 'Common').length;
      expect(commonCount).to.be.gte(numMints * 0.3); // At least 30% should be common
      
      console.log('Rarity distribution:', uniqueRarities);
      console.log('Total rarities found:', rarities);
    });

    it('Should generate varied fighting styles', async function () {
      const mintPrice = await cryptDoeBucks.mintPrice();
      const numMints = 15;
      
      // Mint multiple bucks
      for (let i = 0; i < numMints; i++) {
        await cryptDoeBucks.connect(user1).mintBuck(1, { value: mintPrice });
      }
      
      // Collect fighting styles
      const styles: string[] = [];
      for (let i = 0; i < numMints; i++) {
        const tokenURI = await cryptDoeBucks.tokenURI(i);
        const base64Data = tokenURI.split(',')[1];
        const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
        const metadata = JSON.parse(jsonString);
        const styleAttr = metadata.attributes.find((attr: any) => attr.trait_type === 'Fighting Style');
        styles.push(styleAttr.value);
      }
      
      // Should have all 3 fighting styles represented
      const uniqueStyles = [...new Set(styles)];
      expect(uniqueStyles.length).to.equal(3);
      expect(uniqueStyles).to.include.members(['Aggressive', 'Defensive', 'Balanced']);
      
      console.log('Fighting styles found:', uniqueStyles);
    });
  });

  describe('Gas Usage', function () {
    it('Should measure gas usage for different mint types', async function () {
      const mintPrice = await cryptDoeBucks.mintPrice();
      
      // Single mint
      const singleMintTx = await cryptDoeBucks.connect(user1).mintBuck(1, { value: mintPrice });
      const singleMintReceipt = await singleMintTx.wait();
      console.log('Single mint gas used:', singleMintReceipt?.gasUsed.toString());
      
      // Batch mint
      const batchPrice = (mintPrice * BigInt(95)) / BigInt(100);
      const batchMintTx = await cryptDoeBucks.connect(user1).mintBuckBatch(10, { 
        value: batchPrice * BigInt(10) 
      });
      const batchMintReceipt = await batchMintTx.wait();
      const gasPerBuckBatch = Number(batchMintReceipt?.gasUsed || 0) / 10;
      console.log('Batch mint gas per buck:', gasPerBuckBatch.toString());
      
      // Batch should be more efficient per buck
      expect(gasPerBuckBatch).to.be.lt(Number(singleMintReceipt?.gasUsed || 0));
    });
  });
});
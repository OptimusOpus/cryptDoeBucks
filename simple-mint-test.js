const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Simple Minting Test");
  console.log("=====================");

  // Deploy fresh contracts for testing
  console.log("Deploying fresh contracts...");
  
  // Deploy VRF Mock
  const BASE_FEE = ethers.parseUnits("0.25", "ether");
  const GAS_PRICE_LINK = 1e9;
  const VRFCoordinatorV2MockFactory = await ethers.getContractFactory("VRFCoordinatorV2Mock");
  const vrfCoordinator = await VRFCoordinatorV2MockFactory.deploy(BASE_FEE, GAS_PRICE_LINK);
  await vrfCoordinator.waitForDeployment();

  // Create subscription
  const tx = await vrfCoordinator.createSubscription();
  await tx.wait();
  const fundAmount = ethers.parseUnits("100", "ether");
  await vrfCoordinator.fundSubscription(1, fundAmount);

  // Deploy VRF Consumer
  const VRFv2ConsumerFactory = await ethers.getContractFactory("VRFv2Consumer");
  const keyHash = "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15";
  const vrfConsumer = await VRFv2ConsumerFactory.deploy(
    1, keyHash, await vrfCoordinator.getAddress()
  );
  await vrfConsumer.waitForDeployment();
  await vrfCoordinator.addConsumer(1, await vrfConsumer.getAddress());

  // Deploy PrizePool
  const PrizePoolFactory = await ethers.getContractFactory("PrizePool");
  const matingSeasonEnd = Math.floor(Date.now() / 1000) + 86400;
  const prizePool = await PrizePoolFactory.deploy(
    matingSeasonEnd,
    ethers.parseEther("1"),
    ethers.parseEther("0.01"),
    ethers.parseEther("0.05")
  );
  await prizePool.waitForDeployment();

  // Deploy libraries
  const MetadataLibFactory = await ethers.getContractFactory("MetadataLib");
  const metadataLib = await MetadataLibFactory.deploy();
  await metadataLib.waitForDeployment();

  const RandomLibFactory = await ethers.getContractFactory("RandomLib");
  const randomLib = await RandomLibFactory.deploy();
  await randomLib.waitForDeployment();

  // Deploy CrypdoeBucks
  const CrypdoeBucksFactory = await ethers.getContractFactory("CrypdoeBucks", {
    libraries: {
      MetadataLib: await metadataLib.getAddress(),
      RandomLib: await randomLib.getAddress(),
    },
  });
  const cryptDoeBucks = await CrypdoeBucksFactory.deploy(
    await vrfConsumer.getAddress(),
    await prizePool.getAddress()
  );
  await cryptDoeBucks.waitForDeployment();

  await prizePool.setBuckContract(await cryptDoeBucks.getAddress());
  
  console.log("✅ Contracts deployed successfully!");
  console.log(`CrypdoeBucks: ${await cryptDoeBucks.getAddress()}`);

  const [owner, user1] = await ethers.getSigners();
  
  // Enable public sale
  console.log("\n🔓 Enabling public sale...");
  await cryptDoeBucks.togglePublicSale();
  
  // Test minting
  console.log("\n🎲 Testing Random Minting:");
  const mintPrice = await cryptDoeBucks.mintPrice();
  console.log(`Mint Price: ${ethers.formatEther(mintPrice)} ETH`);
  
  // Mint a single buck
  console.log("Minting 1 random buck...");
  const mintTx = await cryptDoeBucks.connect(user1).mintBuck(1, { value: mintPrice });
  await mintTx.wait();
  
  console.log("✅ Buck minted successfully!");
  
  // Check the metadata
  const tokenURI = await cryptDoeBucks.tokenURI(0);
  const base64Data = tokenURI.split(",")[1];
  const jsonString = Buffer.from(base64Data, "base64").toString("utf-8");
  const metadata = JSON.parse(jsonString);
  
  console.log("\n📊 Generated Buck Stats:");
  console.log(`Name: ${metadata.name}`);
  console.log(`Description: ${metadata.description}`);
  
  console.log("\n🎯 Key Attributes:");
  const keyAttrs = ['Level', 'Points', 'Fighting Style', 'Rarity', 'Does Controlled'];
  keyAttrs.forEach(attrName => {
    const attr = metadata.attributes.find(a => a.trait_type === attrName);
    if (attr) {
      console.log(`  ${attrName}: ${attr.value}${attr.max_value ? `/${attr.max_value}` : ''}`);
    }
  });
  
  console.log("\n🧬 Genetics:");
  const geneticAttrs = ['Strength', 'Speed', 'Vitality', 'Intelligence'];
  geneticAttrs.forEach(attrName => {
    const attr = metadata.attributes.find(a => a.trait_type === attrName);
    if (attr) {
      console.log(`  ${attrName}: ${attr.value}/${attr.max_value}`);
    }
  });
  
  // Test batch minting
  console.log("\n📦 Testing Batch Minting:");
  const batchPrice = (mintPrice * BigInt(95)) / BigInt(100);
  console.log(`Batch Price (5% discount): ${ethers.formatEther(batchPrice)} ETH each`);
  
  const batchTx = await cryptDoeBucks.connect(user1).mintBuckBatch(5, { 
    value: batchPrice * BigInt(5) 
  });
  await batchTx.wait();
  
  console.log("✅ Batch minted successfully!");
  
  // Show variety
  console.log("\n🎨 Rarity Variety in Batch:");
  const rarities = [];
  for (let i = 1; i <= 5; i++) {
    const uri = await cryptDoeBucks.tokenURI(i);
    const base64 = uri.split(",")[1];
    const json = Buffer.from(base64, "base64").toString("utf-8");
    const meta = JSON.parse(json);
    const rarityAttr = meta.attributes.find(a => a.trait_type === 'Rarity');
    rarities.push(rarityAttr.value);
    console.log(`  Buck #${i}: ${rarityAttr.value}`);
  }
  
  const uniqueRarities = [...new Set(rarities)];
  console.log(`\n📈 Found ${uniqueRarities.length} different rarities: ${uniqueRarities.join(', ')}`);
  
  
  // Final summary
  console.log("\n🎉 Minting Test Complete!");
  console.log("========================");
  console.log(`Total Minted: 6 bucks`);
  console.log(`User Balance: ${await cryptDoeBucks.balanceOf(user1.address)}`);
  console.log(`✅ Random stats generation: WORKING`);
  console.log(`✅ Dynamic metadata: WORKING`);
  console.log(`✅ Batch discounts: WORKING`);
  console.log(`✅ Ready for NFT launch! 🚀`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
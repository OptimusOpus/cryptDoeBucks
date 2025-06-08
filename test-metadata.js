const { ethers } = require("hardhat");

async function main() {
  // Get deployed contract addresses (from the deployment output)
  const cryptDoeBucksAddress = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";
  
  // Connect to the deployed contract
  const cryptDoeBucks = await ethers.getContractAt("CrypdoeBucks", cryptDoeBucksAddress);
  const [owner, user1] = await ethers.getSigners();
  
  console.log("🦌 Testing Dynamic Metadata Generation");
  console.log("=====================================");
  
  // Create a test buck
  console.log("Creating a test buck...");
  const tx = await cryptDoeBucks.createBuck(user1.address, 85, 2, 7);
  await tx.wait();
  
  // Get the metadata
  console.log("Generating dynamic metadata...");
  const tokenURI = await cryptDoeBucks.tokenURI(0);
  
  // Decode and display the metadata
  const base64Data = tokenURI.split(",")[1];
  const jsonString = Buffer.from(base64Data, "base64").toString("utf-8");
  const metadata = JSON.parse(jsonString);
  
  console.log("\n📊 Generated Metadata:");
  console.log("Name:", metadata.name);
  console.log("Description:", metadata.description);
  console.log("\n🎯 Key Attributes:");
  
  metadata.attributes.forEach(attr => {
    if (["Level", "Points", "Fighting Style", "Rarity", "Total Stats"].includes(attr.trait_type)) {
      console.log(`  ${attr.trait_type}: ${attr.value}${attr.max_value ? ` / ${attr.max_value}` : ""}`);
    }
  });
  
  console.log("\n🧬 Genetics:");
  metadata.attributes.forEach(attr => {
    if (["Strength", "Speed", "Vitality", "Intelligence"].includes(attr.trait_type)) {
      console.log(`  ${attr.trait_type}: ${attr.value} / ${attr.max_value}`);
    }
  });
  
  // Check if SVG is generated
  const hasImage = metadata.image && metadata.image.includes("data:image/svg+xml;base64,");
  console.log(`\n🎨 Dynamic SVG Generated: ${hasImage ? "✅ Yes" : "❌ No"}`);
  
  if (hasImage) {
    const svgBase64 = metadata.image.split(",")[1];
    const svgString = Buffer.from(svgBase64, "base64").toString("utf-8");
    console.log(`SVG Size: ${svgString.length} characters`);
  }
  
  console.log("\n✅ Dynamic metadata system working perfectly!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  try {
    const rawAddress = "0x914BB095EB4Ed1458e3f1175Db573A81091E21c2".toLowerCase();// Replace with your NFT contract address
    // Ethers v6 uses `ethers.getAddress` instead of `ethers.utils.getAddress`
    const nftContractAddress = ethers.getAddress(rawAddress); // Normalize then checksum
    const tokenId = 1; // Replace with the tokenId you want to verify

    const NFT = await ethers.getContractFactory("NFT");
    const nft = NFT.attach(nftContractAddress);

    const owner = await nft.ownerOf(tokenId);
    console.log(`Owner of tokenId ${tokenId}: ${owner}`);
  } catch (error) {
    console.error("An error occurred:", error.message || error);
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exitCode = 1;
});


await ethers.utils.getAddress("0x5779862d4D018210DD22A012862010Cd4dC305F4")       // returns checksummed address(reward token address)
const NFT = await ethers.getContractFactory("NFT")
const nft = NFT.attach("0x914BB095EB4Ed1458e3f1175Db573A81091E21c2")
await nft.ownerOf(1)
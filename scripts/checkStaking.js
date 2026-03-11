const hre = require('hardhat');

async function main() {
  const stakingAddress = '0x5EC985758d7aaD458E53F1e16313b6EaE602b155';
  const ST = await hre.ethers.getContractFactory('My_Staking_Contract');
  const staking = ST.attach(stakingAddress);

  try {
    const nftAddr = await staking.stakingNFT();
    console.log('staking.stakingNFT():', nftAddr);
  } catch (e) {
    console.error('Error reading stakingNFT:', e.message || e);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

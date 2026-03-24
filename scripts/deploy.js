const hre = require("hardhat");

async function main() {

    const [admin] = await ethers.getSigners();

    console.log("Deploying NFT Saking contract");

    //deploy staking NFT
    const NFT = await hre.ethers.getContractFactory("NFT");
    const nft = await NFT.deploy("StakingNFT", "SNFT", "null", "null");
    await nft.waitForDeployment();
    const nftAddress = await nft.getAddress();

    console.log("Deployed NFT contract:", {nftAddress});

    //deploy reward token
    const RewardToken = await hre.ethers.getContractFactory("WTC");
    const rewardToken = await RewardToken.deploy("RewardToken", "RT", 10000);
    await rewardToken.waitForDeployment();
    const rewardTokenAddress = await rewardToken.getAddress();

    console.log("Deployed Reward Token contract:", {rewardTokenAddress});

    //deploy staking contract
    const Staking = await hre.ethers.getContractFactory("My_Staking_Contract");
    const rate = ethers.parseUnits("0.00694", 18);
    const staking = await Staking.deploy(nftAddress, rewardTokenAddress, rate);
    await staking.waitForDeployment();
    const stakingAddress = await staking.getAddress();

    console.log("Deployed Staking contract:", {stakingAddress});

    // Fund staking contract with reward tokens
    const fundAmount = ethers.parseUnits("5000", 18);
    const approveTx = await rewardToken.connect(admin).approve(stakingAddress, fundAmount);
    await approveTx.wait();
    const fundTx = await staking.connect(admin).fundRewards(fundAmount);
    await fundTx.wait();
    console.log("Funded staking contract with 5000 reward tokens");
   
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
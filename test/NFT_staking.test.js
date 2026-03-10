const { ethers } = require("hardhat")
const { expect } = require("chai")

describe("Test NFT Staking", function(){
    let owner;
    let staker1;
    let staker2;
    let nftStaking;
    let rewardToken;
    let nft;

    beforeEach(async function(){
        [owner, staker1, staker2] = await ethers.getSigners();

        //deploy NFT 
        const NFT = await ethers.getContractFactory("NFT");
        nft = await NFT.deploy("StakingNFT", "SNFT", "null", "null");
        await nft.waitForDeployment();

        const nftAddress = await nft.getAddress();

        //deploy reward token
        const RewardToken = await ethers.getContractFactory("WTC");
        rewardToken = await RewardToken.deploy("RewardToken", "RT", 10000);
        await rewardToken.waitForDeployment();

        const rewardTokenAddress = await rewardToken.getAddress();

        //deploy staking contract
        const NFTStaking = await ethers.getContractFactory("My_Staking_Contract");
        nftStaking = await NFTStaking.deploy(nftAddress, rewardTokenAddress);
        await nftStaking.waitForDeployment();

        //fund staking contract with rewards
        await rewardToken.transfer(nftStaking.target, ethers.parseEther("5000"));
    });

    // Helper: Mint NFTs to a user
    async function mintNFTs(user, mintAmount) {
        const tokenIds = [];
        const cost = await nft.cost();
        const tx = await nft.connect(user).mint(mintAmount, { value: cost * BigInt(mintAmount) });
        const receipt = await tx.wait();
        const supply = await nft.totalSupply();
        for (let i = 0; i < mintAmount; i++) {
            tokenIds.push(supply - BigInt(mintAmount) + BigInt(i) + BigInt(1));
        }//keeps track of tokenIds when you mint again
        return tokenIds;
    }

    async function increaseTime(seconds) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
    }



    //important to avoid set up issues in the long run
    describe("Deployment", function(){
        it("Should set the right owner", async function(){
            expect(await nft.owner()).to.equal(owner.address);
        });

        it("Should fund the staking contract with rewards", async function(){
            expect(await rewardToken.balanceOf(nftStaking.target)).to.equal(ethers.parseEther("5000"));
        });
    });

    describe("Staking", function(){
        it("Should allow user to stake NFTs", async function(){
            const tokenIds = await mintNFTs(staker1, 2);
            await nft.connect(staker1).setApprovalForAll(nftStaking.target, true);
            await nftStaking.connect(staker1).stake(tokenIds[0]);

            let stakedIds = await nftStaking.getStakedTokenIds(staker1.address);
            expect(stakedIds.length).to.equal(1);

            await nftStaking.connect(staker1).stake(tokenIds[1]);
            stakedIds = await nftStaking.getStakedTokenIds(staker1.address);
            expect(stakedIds.length).to.equal(2);


            expect(await nftStaking.tokenOwner(tokenIds[0])).to.equal(staker1.address);
        });

        it("Should revert when user tries to stake an NFT that is already staked", async function(){
            const tokenIds = await mintNFTs(staker1, 1);
            await nft.connect(staker1).setApprovalForAll(nftStaking.target, true);
            await nftStaking.connect(staker1).stake(tokenIds[0]);

            await expect(nftStaking.connect(staker1).stake(tokenIds[0])).to.be.revertedWith("NFT already staked");     
        });
    });

    describe("Withdraw", function(){
        it("Should allow user to withdraw staked NFT", async function(){
            const tokenIds = await mintNFTs(staker1, 1);
            await nft.connect(staker1).setApprovalForAll(nftStaking.target, true);
            await nftStaking.connect(staker1).stake(tokenIds[0]);
            expe

            await increaseTime(3600);

            await nftStaking.connect(staker1).withdraw(tokenIds[0]);





        })
        
    })

    // describe("Claiming Rewards", function(){
    //     beforeEach(async function(){
    //         // Setup: mint and stake NFTs for staker1
    //         const tokenIds = await mintNFTs(staker1, 2);
    //         await stakeNFTs(staker1, tokenIds);
    //     });

    //     it("Should allow user to claim rewards after staking", async function(){
    //         // Add your claim test here
    //     });
    // });
});
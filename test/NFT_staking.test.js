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
        const rate = ethers.parseUnits("0.00694", 18);
        nftStaking = await NFTStaking.deploy(nftAddress, rewardTokenAddress, rate);
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
            expect(await nft.balanceOf(staker1.getAddress())).to.equal(0);
            expect(await nftStaking.totalStaked()).to.equal(1);

            await increaseTime(3600);

            await nftStaking.connect(staker1).withdraw(tokenIds[0]);
            expect(await nft.balanceOf(staker1.getAddress())).to.equal(1);
            expect(await nftStaking.totalStaked()).to.equal(0);
            
        });

        it("Should revert when user tries to withdraw before the coolTime", async function(){
            const tokenIds = await mintNFTs(staker1, 1);
            await nft.connect(staker1).setApprovalForAll(nftStaking.target, true);
            await nftStaking.connect(staker1).stake(tokenIds[0]);
            expect(await nft.balanceOf(staker1.getAddress())).to.equal(0);
            expect(await nftStaking.totalStaked()).to.equal(1);

            await expect(nftStaking.connect(staker1).withdraw(tokenIds[0])).to.be.revertedWith("Still locked");
            
        });

        it("Should revert when non owner of NFT tries to stake", async function(){
            const tokenIds = await mintNFTs(staker1, 1);
            await nft.connect(staker1).setApprovalForAll(nftStaking.target, true);

            await expect(nftStaking.connect(staker2).stake(tokenIds[0])).to.be.revertedWith("ERC721: transfer of token that is not own");
            
        });

        it("Should allow user to emergency withdraw without coolTime", async function(){
            const tokenIds = await mintNFTs(staker1, 1);
            await nft.connect(staker1).setApprovalForAll(nftStaking.target, true);
            await nftStaking.connect(staker1).stake(tokenIds[0]);
            expect(await nft.balanceOf(staker1.getAddress())).to.equal(0);
            expect(await nftStaking.totalStaked()).to.equal(1);

            await nftStaking.connect(staker1).emergencyWithdraw(tokenIds[0]);
            expect(await nft.balanceOf(staker1.getAddress())).to.equal(1);
            expect(await nftStaking.totalStaked()).to.equal(0);
            
        });

        it("Should revert when non owner tries to emergency withdraw", async function(){
            const tokenIds = await mintNFTs(staker1, 1);
            await nft.connect(staker1).setApprovalForAll(nftStaking.target, true);
            await nftStaking.connect(staker1).stake(tokenIds[0]);

            await expect(nftStaking.connect(staker2).emergencyWithdraw(tokenIds[0])).to.be.revertedWith("Not your NFT");
            
        });

        it("Should reset rewards to 0 on emergency withdraw", async function(){
            const tokenIds = await mintNFTs(staker1, 1);
            await nft.connect(staker1).setApprovalForAll(nftStaking.target, true);
            await nftStaking.connect(staker1).stake(tokenIds[0]);

            console.log(`Balance, $${await nft.balanceOf(await nftStaking.getAddress())}`);

            await increaseTime(200);
            const rewards = await nftStaking.calculateRewards(staker1.address);
            // 200 seconds ≈ 3.33 mins * 0.00694 tokens = ~0.023 tokens
            expect(rewards).to.be.gte(ethers.parseUnits("0.02", 18));

            await nftStaking.connect(staker1).emergencyWithdraw(tokenIds[0]);
            const userInfoAfter = await nftStaking.userInfo(staker1.address);
            expect(userInfoAfter.rewards).to.equal(0);
            
        });
        
    });

    describe("Withdraw and Claim", function(){
        it("Should withdraw staked NFT and claim rewards in one transaction", async function(){
            const tokenIds = await mintNFTs(staker1, 1);
            await nft.connect(staker1).setApprovalForAll(nftStaking.target, true);
            await nftStaking.connect(staker1).stake(tokenIds[0]);
            expect(await nft.balanceOf(staker1.getAddress())).to.equal(0);

            await increaseTime(120);

            const balanceBefore = await rewardToken.balanceOf(staker1.address);
            await nftStaking.connect(staker1).withdrawAndClaim(tokenIds[0]);
            const balanceAfter = await rewardToken.balanceOf(staker1.address);

            expect(await nft.balanceOf(staker1.getAddress())).to.equal(1);
            expect(await nftStaking.totalStaked()).to.equal(0);
            // 120 seconds = 2 mins * 0.00694 tokens = ~0.01388 tokens
            expect(balanceAfter - balanceBefore).to.be.gte(ethers.parseUnits("0.013", 18));
        });

        it("Should revert when trying to withdrawAndClaim before coolTime", async function(){
            const tokenIds = await mintNFTs(staker1, 1);
            await nft.connect(staker1).setApprovalForAll(nftStaking.target, true);
            await nftStaking.connect(staker1).stake(tokenIds[0]);

            await expect(nftStaking.connect(staker1).withdrawAndClaim(tokenIds[0])).to.be.revertedWith("Still locked");
            
        });
    });

    describe("Claiming Rewards", function(){
        it("Should allow user to claim rewards after staking", async function(){
            const tokenIds = await mintNFTs(staker1, 1);
            await nft.connect(staker1).setApprovalForAll(nftStaking.target, true);
            await nftStaking.connect(staker1).stake(tokenIds[0]);
            expect(await nft.balanceOf(staker1.getAddress())).to.equal(0);
            expect(await nftStaking.totalStaked()).to.equal(1);

            await increaseTime(120);
            const calculatedRewards = await nftStaking.calculateRewards(staker1.address);
            // 120 seconds = 2 mins * 0.00694 tokens = ~0.01388 tokens
            expect(calculatedRewards).to.be.gte(ethers.parseUnits("0.013", 18));

            const balanceBefore = await rewardToken.balanceOf(staker1.address);
            await nftStaking.connect(staker1).claimRewards();
            const balanceAfter = await rewardToken.balanceOf(staker1.address);
            expect(balanceAfter - balanceBefore).to.be.gte(ethers.parseUnits("0.013", 18));
            
            const userRewardsAfter = await nftStaking.userInfo(staker1.address);
            expect(userRewardsAfter.rewards).to.equal(0);          
        });

        it("Should successfully claim rewards and transfer tokens to user", async function(){
            const tokenIds = await mintNFTs(staker1, 1);
            await nft.connect(staker1).setApprovalForAll(nftStaking.target, true);
            await nftStaking.connect(staker1).stake(tokenIds[0]);

            await increaseTime(300);
            const balanceBefore = await rewardToken.balanceOf(staker1.address);

            await nftStaking.connect(staker1).claimRewards();
            
            const balanceAfter = await rewardToken.balanceOf(staker1.address);
            // 300 seconds = 5 mins * 0.00694 tokens = ~0.0347 tokens
            expect(balanceAfter - balanceBefore).to.be.gte(ethers.parseUnits("0.034", 18));
        });

        it("Should revert when claiming before coolTime", async function(){
            const tokenIds = await mintNFTs(staker1, 1);
            await nft.connect(staker1).setApprovalForAll(nftStaking.target, true);
            await nftStaking.connect(staker1).stake(tokenIds[0]);

            await expect(nftStaking.connect(staker1).claimRewards()).to.be.revertedWith("Still locked");
        });
    });

    describe("Owner Functions", function(){
        it("Should allow owner to set reward rate", async function(){
            const newRewardRate = ethers.parseEther("2");
            await nftStaking.connect(owner).setRewardRate(newRewardRate);
            
            const currentRate = await nftStaking.rewardRate();
            expect(currentRate).to.equal(newRewardRate);
        });

        it("Should revert when non-owner tries to set reward rate", async function(){
            const newRewardRate = ethers.parseEther("2");
            
            await expect(nftStaking.connect(staker1).setRewardRate(newRewardRate)).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to set cool time", async function(){
            const newCoolTime = 60;
            await nftStaking.connect(owner).setCoolTime(newCoolTime);
            
            const currentCoolTime = await nftStaking.coolTime();
            expect(currentCoolTime).to.equal(newCoolTime);
        });

        it("Should revert when non-owner tries to set cool time", async function(){
            const newCoolTime = 60;
            
            await expect(nftStaking.connect(staker1).setCoolTime(newCoolTime)).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to fund rewards", async function(){
            const fundAmount = ethers.parseEther("1000");
            await rewardToken.connect(owner).approve(nftStaking.target, fundAmount);
            
            const balanceBefore = await rewardToken.balanceOf(nftStaking.target);
            await nftStaking.connect(owner).fundRewards(fundAmount);
            const balanceAfter = await rewardToken.balanceOf(nftStaking.target);
            
            expect(balanceAfter - balanceBefore).to.equal(fundAmount);
        });

        it("Should revert when non-owner tries to fund rewards", async function(){
            const fundAmount = ethers.parseEther("1000");
            await rewardToken.connect(staker1).approve(nftStaking.target, fundAmount);
            
            await expect(nftStaking.connect(staker1).fundRewards(fundAmount)).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to pause the contract", async function(){
            await nftStaking.connect(owner).pause();
            
            const tokenIds = await mintNFTs(staker1, 1);
            await nft.connect(staker1).setApprovalForAll(nftStaking.target, true);
            
            await expect(nftStaking.connect(staker1).stake(tokenIds[0])).to.be.revertedWith("Pausable: paused");
        });

        it("Should revert when non-owner tries to pause", async function(){
            await expect(nftStaking.connect(staker1).pause()).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to unpause the contract", async function(){
            await nftStaking.connect(owner).pause();
            await nftStaking.connect(owner).unpause();
            
            const tokenIds = await mintNFTs(staker1, 1);
            await nft.connect(staker1).setApprovalForAll(nftStaking.target, true);
            
            await nftStaking.connect(staker1).stake(tokenIds[0]);
            expect(await nftStaking.totalStaked()).to.equal(1);
        });

        it("Should revert when non-owner tries to unpause", async function(){
            await nftStaking.connect(owner).pause();
            
            await expect(nftStaking.connect(staker1).unpause()).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });
});
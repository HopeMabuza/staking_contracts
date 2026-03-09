const { ethers } = require("hardhat")

const { expect } = require("chai")


describe("Test AIStaking", function(){
    //I will use the variable a lot
    let owner;
    let stacker1;
    let stacker2;
    let ai_stacking;
    let wtc_stacking_token;
    let stackAmount;
    let rewards;
    let rewardRate;

    async function increaseTime(seconds) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
    }


    beforeEach(async function() {
        [owner, stacker1, stacker2] = await ethers.getSigners();

        //deploy token first
        const WTCStackingToken = await ethers.getContractFactory("WTC");
        wtc_stacking_token = await WTCStackingToken.deploy("WTCToken", "WTCT", 1000 );
        await wtc_stacking_token.waitForDeployment();

        const tokenAddress = await wtc_stacking_token.getAddress();

        //deploy staking contract
        rewardRate = ethers.parseEther("0.01");

        const AIStacking = await ethers.getContractFactory("StakingContract");
        ai_stacking = await AIStacking.deploy(tokenAddress, tokenAddress, rewardRate);
        await ai_stacking.waitForDeployment();
    });

    describe("Staking", function(){
        it("Should revert when user stacks 0 amounts", async function(){

            await expect(ai_stacking.connect(stacker1).stake(0)).to.be.revertedWith("Cannot stake 0");

        });

        it("Should revert if user did not approve contract to take tokens", async function(){
            stackAmount = ethers.parseEther("10"); 

            await wtc_stacking_token.transfer(stacker1.getAddress(), stackAmount);

            await expect(ai_stacking.connect(stacker1).stake(stackAmount)).to.be.revertedWith("ERC20: insufficient allowance");
        })

        it("Should let user stake successfully", async function(){

            stackAmount = ethers.parseEther("10"); 

            //since the user cannot mint token (no mint function in token cntract)
            //onwer can transfer tokens to the user
            await wtc_stacking_token.transfer(stacker1.getAddress(), stackAmount);

            //provide the contract access
            await wtc_stacking_token.connect(stacker1).approve(ai_stacking.getAddress(), stackAmount);

            //user stakes
            const userStack = await ai_stacking.connect(stacker1).stake(stackAmount);

         
            expect(await ai_stacking.totalStaked()).to.equal(BigInt(stackAmount));
            expect(await ai_stacking.stakedBalance(stacker1.getAddress())).to.equal(stackAmount);
            await expect(userStack).to.emit(ai_stacking, "Staked").withArgs(stacker1.getAddress(), stackAmount);

        });

        it("Should let user stake multiple times successfully", async function(){

            transferAmount = ethers.parseEther("20"); 
            stackAmount = ethers.parseEther("10");

            //since the user cannot mint token (no mint function in token cntract)
            //onwer can transfer tokens to the user
            await wtc_stacking_token.transfer(stacker1.getAddress(), transferAmount);

            //provide the contract access
            await wtc_stacking_token.connect(stacker1).approve(ai_stacking.getAddress(), transferAmount);

            //user stakes
            let userStak = await ai_stacking.connect(stacker1).stake(stackAmount);

         
            expect(await ai_stacking.totalStaked()).to.equal(BigInt(stackAmount));
            expect(await ai_stacking.stakedBalance(stacker1.getAddress())).to.equal(stackAmount);

            userStak = await ai_stacking.connect(stacker1).stake(stackAmount);

            expect(await ai_stacking.totalStaked()).to.equal(BigInt(stackAmount + stackAmount));
            expect(await ai_stacking.stakedBalance(stacker1.getAddress())).to.equal(stackAmount + stackAmount);

            await expect(userStak).to.emit(ai_stacking, "Staked").withArgs(stacker1.getAddress(), stackAmount);

        });

        it("Should let multiple users to  stake successfully", async function(){
            stackAmount = ethers.parseEther("10");

            await wtc_stacking_token.transfer(stacker1.getAddress(), stackAmount);
            await wtc_stacking_token.transfer(stacker2.getAddress(), stackAmount);

            await wtc_stacking_token.connect(stacker1).approve(ai_stacking.getAddress(), transferAmount);
            await wtc_stacking_token.connect(stacker2).approve(ai_stacking.getAddress(), transferAmount);

            await ai_stacking.connect(stacker1).stake(stackAmount);
            await ai_stacking.connect(stacker2).stake(stackAmount);
       
            expect(await ai_stacking.totalStaked()).to.equal(BigInt(stackAmount+stackAmount));
            expect(await ai_stacking.stakedBalance(stacker1.getAddress())).to.equal(stackAmount);
            expect(await ai_stacking.stakedBalance(stacker2.getAddress())).to.equal(stackAmount);

        });

    });

    describe("Rewards calculation", function(){
    it("Should get reward amount successfully", async function(){
        stackAmount = ethers.parseEther("10"); 

        await wtc_stacking_token.transfer(stacker1.getAddress(), stackAmount);
        await wtc_stacking_token.connect(stacker1).approve(ai_stacking.getAddress(), stackAmount);
        await ai_stacking.connect(stacker1).stake(stackAmount);

        const rewardPerTokenBefore = await ai_stacking.rewardPerToken();
        
        await increaseTime(10);
        
        const rewardPerTokenAfter = await ai_stacking.rewardPerToken();
        
        const rewardPerTokenIncrease = rewardPerTokenAfter - rewardPerTokenBefore;
        
        const expectedRewards = (stackAmount * rewardPerTokenIncrease) / ethers.parseEther("1");
        
        rewards = await ai_stacking.earned(stacker1.getAddress());
        
        expect(rewards).to.be.closeTo(expectedRewards, 1000n);
    });

    it("Should get zero rewards if there are no stakes", async function(){

        const rewardPerTokenBefore = await ai_stacking.rewardPerToken();

        await increaseTime(10);

        const rewardPerTokenAfter = await ai_stacking.rewardPerToken();

        expect(rewardPerTokenBefore).to.equal(rewardPerTokenAfter);

    });
    });

    describe("Withdrawal", function(){
        it("Should revert if user has not staked", async function(){
            stackAmount = ethers.parseEther("10"); 

            await wtc_stacking_token.transfer(stacker1.getAddress(), stackAmount);

            await wtc_stacking_token.connect(stacker1).approve(ai_stacking.getAddress(), stackAmount);

            await increaseTime(61);

            await expect(ai_stacking.connect(stacker1).withdraw(stackAmount)).to.be.revertedWith("Insufficient balance");

        });

        it("Should revert if user tries to withdraw zero tokens", async function(){
            stackAmount = ethers.parseEther("10"); 

            await wtc_stacking_token.transfer(stacker1.getAddress(), stackAmount);

            await wtc_stacking_token.connect(stacker1).approve(ai_stacking.getAddress(), stackAmount);

            await ai_stacking.connect(stacker1).stake(stackAmount);

            await increaseTime(61);

            await expect(ai_stacking.connect(stacker1).withdraw(ethers.parseEther("0"))).to.be.revertedWith("Cannot withdraw 0");

        });

        it("Should revert if user tries to withdraw before the end of cool down time", async function(){
            stackAmount = ethers.parseEther("10"); 

            await wtc_stacking_token.transfer(stacker1.getAddress(), stackAmount);

            await wtc_stacking_token.connect(stacker1).approve(ai_stacking.getAddress(), stackAmount);

            await ai_stacking.connect(stacker1).stake(stackAmount);

            await increaseTime(20);

            await expect(ai_stacking.connect(stacker1).withdraw(stackAmount)).to.be.revertedWith("Still locked");

        });

        it("Should let user successfully withdraw tokens", async function(){
            stackAmount = ethers.parseEther("10"); 
            withdrawAmount = ethers.parseEther("5");

            await wtc_stacking_token.transfer(stacker1.getAddress(), stackAmount);

            await wtc_stacking_token.connect(stacker1).approve(ai_stacking.getAddress(), stackAmount);

            await ai_stacking.connect(stacker1).stake(stackAmount);

            const initialContractBalance = await ai_stacking.totalStaked();
            const initialUserBalance = await wtc_stacking_token.balanceOf(stacker1.getAddress());

            expect(initialContractBalance).to.equal(stackAmount);
            expect(initialUserBalance).to.equal(0n);

            await increaseTime(61);

            const withdraw = await ai_stacking.connect(stacker1).withdraw(withdrawAmount);

            const newContractBalance = await ai_stacking.totalStaked();
            const newUserBalance = await wtc_stacking_token.balanceOf(stacker1.getAddress());

            expect(newContractBalance).to.equal(stackAmount - withdrawAmount);
            expect(newUserBalance).to.equal(withdrawAmount);

            await expect(withdraw).to.emit(ai_stacking, "Withdrawn").withArgs(stacker1.getAddress(), withdrawAmount);

        });

        it("Should revert if user tries to withdraw more than they have", async function(){
            stackAmount = ethers.parseEther("10"); 
            withdrawAmount = ethers.parseEther("25");

            await wtc_stacking_token.transfer(stacker1.getAddress(), stackAmount);

            await wtc_stacking_token.connect(stacker1).approve(ai_stacking.getAddress(), stackAmount);

            await ai_stacking.connect(stacker1).stake(stackAmount);

            await increaseTime(61);

            await expect(ai_stacking.connect(stacker1).withdraw(withdrawAmount)).to.be.revertedWith("Insufficient balance");


        });
        
    });

    describe("Get rewards", function(){
        it("Should successfully get rewards", async function(){
            stackAmount = ethers.parseEther("10"); 

            await wtc_stacking_token.transfer(stacker1.getAddress(), stackAmount);

            await wtc_stacking_token.connect(stacker1).approve(ai_stacking.getAddress(), stackAmount);

            await ai_stacking.connect(stacker1).stake(stackAmount);

            await increaseTime(61);

            await ai_stacking.connect(stacker1).getReward();

            
            const rewardsAfter = await ai_stacking.earned(stacker1.getAddress());
            expect(rewardsAfter).to.equal(0);

        });

        it("Should claim with 0 rewards", async function(){
            stackAmount = ethers.parseEther("10");

            await wtc_stacking_token.transfer(stacker1.getAddress(), stackAmount);
            await wtc_stacking_token.connect(stacker1).approve(ai_stacking.getAddress(), stackAmount);
            await ai_stacking.connect(stacker1).stake(stackAmount);

            const rewards = await ai_stacking.earned(stacker1.getAddress());
            expect(rewards).to.equal(0);

            const getRewards = await ai_stacking.connect(stacker1).getReward();
            
            const receipt = await getRewards.wait();
            
            const rewardsAfter = await ai_stacking.earned(stacker1.getAddress());
            expect(rewardsAfter).to.equal(0);
        });

    });

    
    describe("Set Reward Rate", function(){
        it("Should allow owner to set reward rate successfully", async function(){
            const newRewardRate = ethers.parseEther("0.02");
            
            await expect(ai_stacking.connect(owner).setRewardRate(newRewardRate)).to.emit(ai_stacking, "RewardRateUpdated").withArgs(newRewardRate);
            
            const updatedRate = await ai_stacking.rewardRate();
            expect(updatedRate).to.equal(newRewardRate);
        });

        it("Should revert when user set new reward rate", async function(){
            const newRewardRate = ethers.parseEther("0.02");
            
            await expect(ai_stacking.connect(stacker1).setRewardRate(newRewardRate)).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Set Staking Duration", function(){
        it("Should allow owner to set staking duration", async function(){
            const newDuration = 1800; //in seconds
            
            await expect(ai_stacking.connect(owner).setStakingDuration(newDuration)).to.emit(ai_stacking, "StakingDurationUpdated").withArgs(newDuration);
            
            const updatedDuration = await ai_stacking.stakingDuration();
            expect(updatedDuration).to.equal(newDuration);
        });

        it("Should revert when user tried to set staking duration", async function(){
            const newDuration = 1800;
            
            await expect(ai_stacking.connect(stacker1).setStakingDuration(newDuration)).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Pause", function(){
        it("Should allow owner to pause staking", async function(){

            expect(await ai_stacking.paused()).to.equal(false);
    
            await ai_stacking.connect(owner).pause();
            
            expect(await ai_stacking.paused()).to.equal(true);
     
        });

        it("Should revert when user calls pause", async function(){

            await expect(ai_stacking.connect(stacker1).pause()).to.be.revertedWith("Ownable: caller is not the owner");

            expect(await ai_stacking.paused()).to.equal(false);
        });       
      
    });

    describe("Unpause", function(){
        it("Should allow owner to unpause staking", async function(){
            //paused contract first
            await ai_stacking.connect(owner).pause();
            expect(await ai_stacking.paused()).to.equal(true);

            await ai_stacking.connect(owner).unpause();

            expect(await ai_stacking.paused()).to.equal(false);
     
        });

        it("Should revert when user calls unpause", async function(){
            await ai_stacking.connect(owner).pause();
            expect(await ai_stacking.paused()).to.equal(true);

            await expect(ai_stacking.connect(stacker1).unpause()).to.be.revertedWith("Ownable: caller is not the owner");

            expect(await ai_stacking.paused()).to.equal(true);
        });       

    });

    describe("Fund Rewards", function(){
        it("Should allow owner to fund rewards", async function(){
            const fundAmount = ethers.parseEther("100");
            
            await wtc_stacking_token.transfer(owner.getAddress(), fundAmount);

            await wtc_stacking_token.connect(owner).approve(ai_stacking.getAddress(), fundAmount);
          
            const initialBalance = await wtc_stacking_token.balanceOf(ai_stacking.getAddress());
            
      
            await expect(ai_stacking.connect(owner).fundRewards(fundAmount)).to.not.emit(ai_stacking, "RewardPaid"); 
            
            const newBalance = await wtc_stacking_token.balanceOf(ai_stacking.getAddress());
            expect(newBalance).to.equal(initialBalance + fundAmount);
        });

        it("Should revert when user tries to call  fund rewards", async function(){
            const fundAmount = ethers.parseEther("10");
            
            await wtc_stacking_token.transfer(stacker1.getAddress(), fundAmount);
        
            await wtc_stacking_token.connect(stacker1).approve(ai_stacking.getAddress(), fundAmount);
            
            await expect(ai_stacking.connect(stacker1).fundRewards(fundAmount)).to.be.revertedWith("Ownable: caller is not the owner");
            
        });
    });

    describe("Emergency Withdraw", function(){
        it("Should allow user to emergency withdraw", async function(){

            stackAmount = ethers.parseEther("10");
            await wtc_stacking_token.transfer(stacker1.getAddress(), stackAmount);
            await wtc_stacking_token.connect(stacker1).approve(ai_stacking.getAddress(), stackAmount);
            await ai_stacking.connect(stacker1).stake(stackAmount);
            
            await increaseTime(60);
            
            // Get user balance before emergency withdraw
            const userBalanceBefore = await wtc_stacking_token.balanceOf(stacker1.getAddress());
            const stakedBalance = await ai_stacking.stakedBalance(stacker1.getAddress());
            
            // Emergency withdraw
            await expect(ai_stacking.connect(stacker1).emergencyWithdraw()).to.emit(ai_stacking, "Withdrawn").withArgs(stacker1.getAddress(), stakedBalance);
            
            // Verify user got tokens back
            const userBalanceAfter = await wtc_stacking_token.balanceOf(stacker1.getAddress());
            expect(userBalanceAfter).to.equal(userBalanceBefore + stakedBalance);
            
            // Verify staked balance is 0
            expect(await ai_stacking.stakedBalance(stacker1.getAddress())).to.equal(0);
            
            // Verify total staked decreased
            expect(await ai_stacking.totalStaked()).to.equal(0);
            
        });
    });


});
const { ethers } = require("hardhat")

const { expect } = require("chai")


describe("Test AIStaking", function(){
    let stakingToken;
    let rewardToken;
    let rewardRate;

    beforeEach(async function() {
        const [owner, stacker1, stacker2] = await ethers.getSigners();

        //deploy token first
        const WTCStakingToken = await ethers.deployFactory("WTC");
        const wtc_staking_token = await WTCStakingToken.deploy("WTCToken", "WTCT", 1000 );
        await wtc_staking_token.waitForDeployment();

        [stakingToken, rewardToken]  = await wtc_staking_token.getAddress();
        rewardRate = 2;

        //deploy staking contract
        const AIStaking = await ethers.deployFactory(stakingToken, rewardToken, rewardRate);
        const ai_staking = await AIStaking.deploy();
        await ai_staking.waitForDeployment();
    });

    

});
const { ethers } = require("hardhat")

const { expect } = require("chai")


describe("Test AIStaking", function(){
    let stakingToken;
    let rewardToken;
    let rewardRate;

    this.beforeEach{
        const [owner, user] = await ethers.getSigners();

        //deploy token first
        const WTCStakingToken = await ethers.deployFactory("WTC");
        const wtc_staking_token = await WTCStakingToken.deploy("WTCToken", "WTCT", 10 );

        stakingToken = wtc_staking_token;


        const AIStaking = await ethers.deployFactory("StakingContract");
        const ai_staking = await AIStaking.deploy();
    }

})
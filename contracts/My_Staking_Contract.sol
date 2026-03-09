// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

//imports
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";//import for nft
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

// I want to use the ai contract because it is easy to folllow, but I want to use the time contract because it is more secure
//user stakes NFT and after cooling time, user earns rewards, tokens or NFTs?
//simple route, stake NFT and get tokens as rewards, also considering rewarding ERC1155 NFTs in the future

contract My_Staking_Contract is Ownable, ReentrancyGuard, Pausable{
    using SafeERC20 for IERC20;

    IERC20 public rewardToken;
    IERC721 public stakingNFT;

    //user info
    struct User{
        uint256[] stakedTokenIds;
        uint256 rewards;
        uint256 lastClaimTime;
        uint256 stakedAt;
    }

    mapping(address => User) public userInfo;
    mapping(uint256 => address) public tokenOwner; 

    //contract info
    uint256 public totalStaked;
    uint256 public coolingTime;
    uint256 public rewardRate;

    //events
    event Staked(address indexed user, uint256 tokenId);
    event Withdrawn(address indexed user, uint256 tokenId);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 newRate);
    event StakingDurationUpdated(uint256 newDuration);

    

    constructor(
        address _stakingNFT,
        address _rewardToken,
        uint256 _coolingTime,
        uint256 _rewardRate
    ) Ownable() {
        require(_stakingNFT != address(0), "Invalid staking token");
        require(_rewardToken != address(0), "Invalid reward token");
        
        stakingNFT = IERC721(_stakingNFT);
        rewardToken = IERC20(_rewardToken);
        coolingTime = _coolingTime;
        rewardRate = _rewardRate;
    }

    // Modifier to update rewards
    modifier updateReward(address account) {
        if (account != address(0)) {
            userInfo[account].rewards = calculateRewards(account);
            userInfo[account].lastClaimTime = block.timestamp;
        }
        _;
    }


    // Stake an NFT to start earning rewards
    // parameter:  tokenId The ID of the NFT to stake
    function stake(uint256 tokenId) external nonReentrant whenNotPaused updateReward(msg.sender) {
        require(tokenOwner[tokenId] == address(0), "NFT already staked");
        
        userInfo[msg.sender].stakedTokenIds.push(tokenId);
        tokenOwner[tokenId] = msg.sender;
        totalStaked++;
        
        if (userInfo[msg.sender].lastClaimTime == 0) {
            userInfo[msg.sender].lastClaimTime = block.timestamp;
        }
        userInfo[msg.sender].stakedAt = block.timestamp;
        
        stakingNFT.safeTransferFrom(msg.sender, address(this), tokenId);
        
        emit Staked(msg.sender, tokenId);
    }

    // Calculate total rewards earned by a user
    // parameter:  account The address to check rewards for
    // return : Total rewards earned (pending + accumulated)
    function calculateRewards(address account) public view returns (uint256) {
        User memory user = userInfo[account];
        uint256 numNFTs = user.stakedTokenIds.length;
        if (numNFTs == 0) return user.rewards;
        
        uint256 timeStaked = block.timestamp - user.lastClaimTime;
        uint256 newRewards = numNFTs * rewardRate * timeStaked / 1e18;
        
        return newRewards + user.rewards;
    }

    // Withdraw a specific staked NFT after cooling period
    // parameter:  tokenId The ID of the NFT to withdraw
    function withdraw(uint256 tokenId) public nonReentrant whenNotPaused updateReward(msg.sender){
        require(tokenOwner[tokenId] == msg.sender, "Not your NFT");
        require(block.timestamp >= userInfo[msg.sender].stakedAt + coolingTime, "Still locked");
        
        _withdrawSingle(msg.sender, tokenId);
    }

    // Withdraw all staked NFTs after cooling period
    function withdrawAll() public  nonReentrant whenNotPaused updateReward(msg.sender){
        require(block.timestamp >= userInfo[msg.sender].stakedAt + coolingTime, "Still locked");
        
        uint256[] memory tokenIds = userInfo[msg.sender].stakedTokenIds;
        require(tokenIds.length > 0, "No NFTs to withdraw");
        
        for (uint256 i = tokenIds.length; i > 0; i--) {
            _withdrawSingle(msg.sender, tokenIds[i - 1]);
        }
        
        delete userInfo[msg.sender].stakedTokenIds;
    }


    // Claim all accumulated rewards
    function claimRewards() public  nonReentrant whenNotPaused updateReward(msg.sender){
        uint256 reward = userInfo[msg.sender].rewards;

        if (reward > 0) {
            userInfo[msg.sender].rewards = 0;
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardsClaimed(msg.sender, reward);
        }
    }

    // Withdraw all NFTs and claim rewards in one transaction
    function withdrawAllAndClaim() external {
        withdrawAll();
        claimRewards();
    }

    // Withdraw a specific NFT and claim rewards in one transaction
    // parameter:  tokenId The ID of the NFT to withdraw
    function withdrawAndClaim(uint256 tokenId) external {
        withdraw(tokenId);
        claimRewards();
    }

    // Emergency withdraw all NFTs without rewards or cooling period
    function emergencyWithdrawAll() external nonReentrant {
        uint256[] memory tokenIds = userInfo[msg.sender].stakedTokenIds;
        require(tokenIds.length > 0, "No NFTs staked");
        
        for (uint256 i = tokenIds.length; i > 0; i--) {
            uint256 tokenId = tokenIds[i - 1];
            delete tokenOwner[tokenId];
            totalStaked--;
            stakingNFT.safeTransferFrom(address(this), msg.sender, tokenId);
            emit Withdrawn(msg.sender, tokenId);
        }
        
        delete userInfo[msg.sender].stakedTokenIds;
        delete userInfo[msg.sender].rewards;
        delete userInfo[msg.sender].lastClaimTime;
        delete userInfo[msg.sender].stakedAt;
    }

    //  Emergency withdraw a specific NFT without rewards or cooling period
    // parameter:  tokenId The ID of the NFT to withdraw
    function emergencyWithdraw(uint256 tokenId) external nonReentrant {
        require(tokenOwner[tokenId] == msg.sender, "Not your NFT");
        
        _withdrawSingle(msg.sender, tokenId);
        
        userInfo[msg.sender].rewards = 0;
    }

    //  Owner deposits reward tokens into the contract
    // parameter:  amount Amount of reward tokens to deposit
    function fundRewards(uint256 amount) external onlyOwner {
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    //  Owner updates the reward rate
    // parameter:  _rewardRate New reward rate (tokens per NFT per second)
    function setRewardRate(uint256 _rewardRate) external onlyOwner updateReward(address(0)) {
        rewardRate = _rewardRate;
        emit RewardRateUpdated(_rewardRate);
    }

    //  Owner updates the cooling time period
    // parameter:  _duration New cooling time in seconds
    function setCoolingTime(uint256 _duration) external onlyOwner {
        coolingTime = _duration;
        emit StakingDurationUpdated(_duration);
    }

    //  Owner pauses staking and withdrawals
    function pause() external onlyOwner {
        _pause();
    }

    //  Owner unpauses staking and withdrawals
    function unpause() external onlyOwner {
        _unpause();
    }

    //  Internal helper to withdraw a single NFT
    // parameter:  user The address of the user
    // parameter:  tokenId The ID of the NFT to withdraw
    function _withdrawSingle(address user, uint256 tokenId) internal {
        uint256[] storage stakedIds = userInfo[user].stakedTokenIds;
        for (uint256 i = 0; i < stakedIds.length; i++) {
            if (stakedIds[i] == tokenId) {
                stakedIds[i] = stakedIds[stakedIds.length - 1];
                stakedIds.pop();
                break;
            }
        }
        
        delete tokenOwner[tokenId];
        totalStaked--;
        stakingNFT.safeTransferFrom(address(this), user, tokenId);
        emit Withdrawn(user, tokenId);
    }
}
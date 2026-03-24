// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;



//imports
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol"; //import for nft
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol"; //to be able to transfer tokens


contract My_Staking_Contract is
    Ownable,
    ReentrancyGuard,
    Pausable,
    IERC721Receiver
{
    using SafeERC20 for IERC20;

    IERC20 public rewardToken;
    IERC721 public stakingNFT;

    //user info
    struct User {
        uint256[] stakedTokenIds;
        uint256 rewards;
        uint256 lastClaimTime;
        uint256 stakedAt;
    }

    mapping(address => User) public userInfo;
    mapping(uint256 => address) public tokenOwner;

    //contract info
    uint256 public totalStaked;
    uint256 public coolTime = 2 minutes;
    uint256 public rewardRate; // Fixed reward rate

    //events
    event Staked(address indexed user, uint256 tokenId);
    event Withdrawn(address indexed user, uint256 tokenId);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 newRate);
    event StakingDurationUpdated(uint256 newDuration);

    constructor(address _stakingNFT, address _rewardToken, uint256 rate) Ownable() {
        require(_stakingNFT != address(0), "Invalid staking NFT");
        require(_rewardToken != address(0), "Invalid reward token");

        stakingNFT = IERC721(_stakingNFT);
        rewardToken = IERC20(_rewardToken);
        rewardRate = rate;
    }

    // Modifier to update rewards
    modifier updateReward(address account) {
        if (account != address(0)) {
            userInfo[account].rewards = calculateRewards(account);
            userInfo[account].lastClaimTime = block.timestamp;
        }
        _;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    // Stake an NFT to start earning rewards
    // parameter:  tokenId The ID of the NFT to stake
    function stake(
        uint256 tokenId
    ) external nonReentrant whenNotPaused updateReward(msg.sender) {
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

    function getStakedTokenIds(
        address user
    ) external view returns (uint256[] memory) {
        return userInfo[user].stakedTokenIds;
    }

    // Calculate total rewards earned per staked token
    //1 min = 0.00694 tokens, 10 min = 0.0694 tokens, 1 hr = 0.4167 token, 1 day = 10 tokens
    function calculateRewards(address account) public view returns (uint256) {
        User memory user = userInfo[account];
        uint256 numNFTs = user.stakedTokenIds.length;
        if (numNFTs == 0) return user.rewards;

        uint256 timeStaked = block.timestamp - user.lastClaimTime;
        uint256 newRewards = (numNFTs * rewardRate * timeStaked) / 60;

        return newRewards + user.rewards;
    }

    // Withdraw a specific staked NFT after cooling period
    function withdraw(
        uint256 tokenId
    ) public nonReentrant whenNotPaused updateReward(msg.sender) {
        require(
            block.timestamp >= userInfo[msg.sender].stakedAt + coolTime,
            "Still locked"
        );

        _withdrawSingle(msg.sender, tokenId);
    }

    // Claim all accumulated rewards
    function claimRewards()
        public
        nonReentrant
        whenNotPaused
        updateReward(msg.sender)
    {
        require(
            block.timestamp >= userInfo[msg.sender].stakedAt + coolTime,
            "Still locked"
        );

        uint256 reward = userInfo[msg.sender].rewards;

        if (reward > 0) {
            userInfo[msg.sender].rewards = 0;
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardsClaimed(msg.sender, reward);
        }
        
    }

    // Withdraw a specific NFT and claim rewards in one transaction
    function withdrawAndClaim(uint256 tokenId) external {
        withdraw(tokenId);
        claimRewards();
    }

    //  Emergency withdraw a specific NFT without rewards or cooling period
    function emergencyWithdraw(uint256 tokenId) external nonReentrant {
        require(tokenOwner[tokenId] == msg.sender, "Not your NFT");

        _withdrawSingle(msg.sender, tokenId);

        userInfo[msg.sender].rewards = 0;
    }

    //  Owner deposits reward tokens into the contract
    function fundRewards(uint256 amount) external onlyOwner {
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    //  Owner updates the reward rate
    function setRewardRate(
        uint256 _rewardRate
    ) external onlyOwner updateReward(address(0)) {
        rewardRate = _rewardRate;
        emit RewardRateUpdated(_rewardRate);
    }

    //  Owner updates the cooling time period
    function setCoolTime(uint256 _coolTime) external onlyOwner {
        coolTime = _coolTime;
        emit StakingDurationUpdated(_coolTime);
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

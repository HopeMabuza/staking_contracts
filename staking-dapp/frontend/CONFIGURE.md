# Configuration Guide

## Setting Up Your Contract Address

To make the dApp interact with your `My_Staking_Contract`, you need to update the contract address in the configuration file.

### Step 1: Get Your Contract Address

After deploying your contract, copy the contract address. It should look like:
```
0x1234567890abcdef1234567890abcdef12345678
```

### Step 2: Update the Configuration

Open `src/config.js` and replace the default address:

**Before:**
```javascript
export const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';
```

**After:**
```javascript
export const CONTRACT_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
```

Replace `0x1234567890abcdef1234567890abcdef12345678` with your actual deployed contract address.

### Step 3: Verify the ABI

The ABI file is already configured at `src/abi/ContractABI.json` with your contract's ABI. Make sure it matches your deployed contract.

### Step 4: Use the dApp

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open `http://localhost:5173/` in your browser

3. Click "Connect MetaMask"

4. The contract functions will automatically load (stake, withdraw, claimRewards, etc.)

5. Select a function and interact with your staking contract!

## Troubleshooting

### Common Errors

**"NFT does not exist" Error**
- This means you're trying to stake an NFT ID that you don't own
- **Solution:** Check your NFT contract to see which NFT IDs you actually have, then enter one of those IDs
- Make sure you've minted at least one NFT in your NFT contract before staking

**"Not your NFT" Error**
- You're trying to withdraw an NFT that isn't staked by your account
- **Solution:** Use the NFT IDs shown in the "Staked NFTs" section

**Contract not loading?**
- Verify the contract address in `src/config.js` is correct
- Make sure the network matches where the contract is deployed

**Wrong functions showing?**
- Make sure the ABI in `src/abi/ContractABI.json` matches your contract

**MetaMask not connected?**
- Install MetaMask and ensure you're on the correct network

## Available Staking Functions

Your `My_Staking_Contract` dApp includes:

**Read Functions (view):**
- `calculateRewards(address)` - Get pending rewards
- `getStakedTokenIds(address)` - Get list of staked NFT IDs
- `coolTime()` - Get cooldown time
- `paused()` - Check if contract is paused
- `userInfo(address)` - Get user staking info
- `totalStaked()` - Get total NFTs staked
- `owner()` - Get contract owner
- `rewardRate()` - Get reward rate

**Write Functions (transaction):**
- `stake(uint256 tokenId)` - Stake an NFT
- `withdraw(uint256 tokenId)` - Withdraw an NFT
- `withdrawAndClaim(uint256 tokenId)` - Withdraw + claim rewards
- `claimRewards()` - Claim accumulated rewards
- `setRewardRate(uint256 _rewardRate)` - Update reward rate (owner)
- `setCoolTime(uint256 _coolTime)` - Update cooldown (owner)
- `pause()` / `unpause()` - Control staking (owner)
- `fundRewards(uint256 amount)` - Add reward tokens (owner)
- `emergencyWithdraw(uint256 tokenId)` - Emergency withdrawal (owner)

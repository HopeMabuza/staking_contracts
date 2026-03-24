# NFT Staking Contracts

A full-stack NFT staking dApp built on Ethereum (Sepolia testnet). Users mint ERC721 NFTs, stake them to earn ERC20 reward tokens, and claim rewards after a cooldown period. Includes a React frontend and a full Hardhat test suite.

---

## How It Works

Think of this like a savings account, but instead of depositing money, you deposit your NFTs.

1. **Mint an NFT** — First you create (mint) an NFT from the NFT contract. This costs a small amount of ETH. The NFT is yours and lives in your wallet.

2. **Stake your NFT** — You lock your NFT into the staking contract. While it's locked, you can't use or sell it, but it starts earning you WTC reward tokens automatically every minute.

3. **Wait for the cooldown** — After staking, there is a 2 minute cooldown period before you can do anything. This prevents people from staking and immediately pulling out rewards.

4. **Claim your rewards** — Once the cooldown is over, you can claim the WTC tokens you have earned. The longer you wait, the more tokens you accumulate. You earn **0.00694 WTC tokens per minute** for each NFT you have staked.

5. **Withdraw your NFT** — When you are done staking, you can withdraw your NFT back to your wallet. You can also withdraw and claim rewards in a single step using **Withdraw & Claim**.

6. **Emergency Withdraw** — If you need your NFT back urgently before the cooldown is over, you can emergency withdraw at any time. However, you will forfeit all accumulated rewards.

> **Example:** If you stake 2 NFTs for 1 hour, you earn `2 × 60 × 0.00694 = 0.8328 WTC tokens`.

---

## Project Structure

```
staking_contracts/
├── contracts/
│   ├── My_Staking_Contract.sol   # Core staking logic
│   ├── NFT.sol                   # ERC721 NFT contract
│   └── token.sol                 # ERC20 reward token (WTC)
├── scripts/
│   └── deploy.js                 # Deployment + funding script
├── test/
│   └── NFT_staking.test.js       # Full test suite
└── staking-dapp/
    └── frontend/                 # React + Vite frontend
        └── src/
            ├── config.js         # Contract addresses
            ├── abi/              # Contract ABIs
            └── components/
                ├── MintNFT.jsx
                └── StakingInterface.jsx
```

---

## Contracts

### My_Staking_Contract.sol
The core staking contract. Users stake ERC721 NFTs and earn ERC20 rewards over time.

**Reward Rate:** `0.00694 tokens per minute per NFT staked`
- 10 min = 0.0694 tokens
- 1 hour = 0.4167 tokens
- 1 day = 10 tokens

**Cooldown:** Users must wait `coolTime` (default: 2 minutes) after staking before they can withdraw or claim rewards.

| Function | Description | Access |
|---|---|---|
| `stake(tokenId)` | Stake an NFT to start earning | Public |
| `withdraw(tokenId)` | Withdraw a staked NFT after cooldown | Public |
| `claimRewards()` | Claim accumulated reward tokens after cooldown | Public |
| `withdrawAndClaim(tokenId)` | Withdraw NFT + claim rewards in one tx | Public |
| `emergencyWithdraw(tokenId)` | Withdraw NFT immediately, forfeits rewards | Public |
| `calculateRewards(address)` | View pending rewards for an account | View |
| `getStakedTokenIds(address)` | View staked NFT IDs for an account | View |
| `fundRewards(amount)` | Deposit reward tokens into contract | Owner |
| `setRewardRate(rate)` | Update the reward rate | Owner |
| `setCoolTime(time)` | Update the cooldown period | Owner |
| `pause()` / `unpause()` | Pause or unpause staking | Owner |

### NFT.sol
ERC721 NFT contract with enumerable support. Users mint NFTs to stake them.

- Payable `mint(amount)` — mint one or more NFTs
- Owner can mint for free
- Configurable cost, max supply, and max mint amount per tx

### token.sol (WTC)
Standard ERC20 reward token with burn functionality. Initial supply is minted to the deployer on construction.

---

## Getting Started

### Prerequisites
- Node.js v18+
- MetaMask browser extension
- Sepolia testnet ETH (from a [faucet](https://sepoliafaucet.com))

### Install Dependencies
```bash
npm install
cd staking-dapp/frontend && npm install
```

### Environment Setup
Create a `.env` file in the project root:
```
SEPOLIA_RPC_URL=your_sepolia_rpc_url
DEPLOYER_PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

---

## Deploy

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

The deploy script will:
1. Deploy the NFT contract
2. Deploy the WTC reward token (10,000 supply)
3. Deploy the staking contract with `rewardRate = 0.00694 tokens/min`
4. Fund the staking contract with 5,000 reward tokens automatically

After deploying, update the contract addresses in `staking-dapp/frontend/src/config.js`:
```js
export const CONTRACT_ADDRESS = '0x...';       // Staking contract
export const NFT_CONTRACT_ADDRESS = '0x...';   // NFT contract
```

---

## Run Tests

```bash
npx hardhat test test/NFT_staking.test.js
```

Test coverage includes:
- Deployment and funding verification
- Staking and duplicate stake prevention
- Withdraw with and without cooldown
- Emergency withdraw (no cooldown, forfeits rewards)
- Claim rewards after cooldown
- Revert when claiming/withdrawing before cooldown
- Owner functions (pause, unpause, set reward rate, set cooldown, fund rewards)

---

## Run the Frontend

```bash
cd staking-dapp/frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

**How to use:**
1. Connect MetaMask to Sepolia testnet
2. Go to the **Mint** tab — mint one or more NFTs
3. Go to the **Stake** tab — enter your NFT ID and click Stake
4. Wait for the cooldown timer to reach ✅ Ready
5. Click **Claim Rewards** to receive your WTC tokens
6. Or click **Withdraw & Claim** to get your NFT back and claim rewards in one transaction

---

## Networks

| Network | Chain ID |
|---|---|
| Hardhat (local) | 31337 |
| Sepolia (testnet) | 11155111 |

---

## Latest Deployment (Sepolia)

| Contract | Address |
|---|---|
| NFT | `0x7dF1b504900D18549bB91Ba7c6406E67D9117f87` |
| Reward Token (WTC) | `0xD4E879B4BE8dee26f33032585726cbD097251d9A` |
| Staking | `0xfE0A4F557212d38335bCD17ce4a03facb2aAe1D9` |

---

## Tech Stack

- **Solidity** `^0.8.19`
- **Hardhat** — compile, test, deploy
- **OpenZeppelin** — ERC721, ERC20, Ownable, ReentrancyGuard, Pausable
- **ethers.js** v6
- **React** + **Vite**
- **Chai** — test assertions

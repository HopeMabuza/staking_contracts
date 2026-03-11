# Setup Guide

## Project Structure

The dApp is organized as follows:

```
staking-dapp/
└── frontend/
    ├── index.html                 # HTML entry point
    ├── package.json              # Dependencies and scripts
    ├── vite.config.js           # Vite configuration
    ├── src/
    │   ├── main.jsx             # React app entry point
    │   ├── App.jsx              # Main App component
    │   ├── contract.js          # Contract interaction utilities
    │   ├── index.css            # Global styles
    │   ├── components/
    │   │   ├── ConnectWallet.jsx     # Wallet connection UI
    │   │   ├── ContractFunctions.jsx # Dynamic function caller
    │   │   └── TransactionStatus.jsx # Transaction status display
    │   └── abi/
    │       └── ContractABI.json  # Contract ABI file (⚠️ IMPORTANT)
    └── docs/
        ├── setup.md              # This file
        ├── architecture.md       # Technical architecture
        └── run-guide.md          # Quick start guide
```

## Prerequisites

Before running the dApp, ensure you have:

1. **Node.js** (v16 or higher)
   - Download from https://nodejs.org/
   - Verify: `node --version`

2. **MetaMask Browser Extension**
   - Install from https://metamask.io/
   - Create/import a wallet

3. **A Deployed Smart Contract**
   - Contract address on your target network
   - Contract ABI (JSON format)

## Configuration

### 1. Add Your Contract ABI

The dApp expects the contract ABI at `/src/abi/ContractABI.json`.

**Steps:**

1. Open your contract's deployment details or Etherscan page
2. Copy the Contract ABI (usually available as JSON)
3. Replace the placeholder content in `src/abi/ContractABI.json` with your contract's ABI

**Example ABI structure:**

```json
[
  {
    "name": "functionName",
    "inputs": [...],
    "outputs": [...],
    "stateMutability": "view",
    "type": "function"
  },
  ...
]
```

### 2. Configure Contract Address

When running the dApp:

1. Click "Connect MetaMask" to connect your wallet
2. In the "Contract Interaction" section, paste your contract address
3. Click "Load Contract"

The dApp will:
- Load your ABI from `src/abi/ContractABI.json`
- Auto-generate UI for all public/external functions
- Allow you to call read and write functions

## Installation

### 1. Install Dependencies

```bash
cd staking-dapp/frontend
npm install
```

This installs:
- **react**: UI framework
- **react-dom**: React DOM rendering
- **ethers.js v6**: Ethereum interaction library
- **vite**: Build tool and dev server

### 2. Verify Installation

```bash
npm --version
node --version
```

## Project Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.2.0 | UI framework |
| react-dom | ^18.2.0 | React rendering |
| ethers | ^6.0.0 | Ethereum interactions |
| @vitejs/plugin-react | ^4.0.0 | JSX support in Vite |
| vite | ^5.0.0 | Build tool and dev server |

## Troubleshooting

### ABI Not Loading

- ✅ Check file path: `src/abi/ContractABI.json`
- ✅ Verify JSON is valid (use https://jsonlint.com/)
- ✅ Ensure it's not minified or corrupted

### MetaMask Not Detected

- ✅ Verify MetaMask is installed in your browser
- ✅ Check if extension is enabled
- ✅ Try refreshing the page
- ✅ Ensure you're on a supported network

### Contract Not Loading

- ✅ Verify the contract address is correct
- ✅ Check the contract exists on the connected network
- ✅ Ensure the ABI matches the contract

### Transaction Errors

- ✅ Check account has sufficient balance for gas
- ✅ Verify contract function parameters are valid
- ✅ Check you have permission to call the function

## Network Configuration

The dApp automatically detects your MetaMask network. Supported networks:

- ✅ Ethereum Mainnet
- ✅ Sepolia Testnet
- ✅ Polygon
- ✅ Arbitrum
- ✅ Optimism
- ✅ Any EVM-compatible chain

## Security Notes

⚠️ **Important Security Considerations:**

1. **Always verify contract addresses** before interacting
2. **Never paste your private key** - MetaMask handles this
3. **Test on testnet first** before mainnet transactions
4. **Double-check function parameters** before sending transactions
5. **Keep your ABI up-to-date** with contract changes
6. **Review transaction details** in MetaMask before confirming

## Next Steps

1. Read [architecture.md](architecture.md) to understand how the dApp works
2. Follow [run-guide.md](run-guide.md) for quick start instructions
3. Customize the styling in `src/index.css` to match your brand
4. Add environment variables for contracts (.env file)

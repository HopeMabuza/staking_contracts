# Quick Start Guide

## Prerequisites Checklist

Before starting, verify you have:

- [ ] Node.js v16+ installed (`node --version`)
- [ ] MetaMask installed and wallet created
- [ ] A deployed smart contract with its address
- [ ] The contract ABI in JSON format

## Installation & Setup (5 minutes)

### Step 1: Install Dependencies

```bash
cd staking-dapp/frontend
npm install
```

Expected output: Shows installed packages for react, ethers.js, and vite

### Step 2: Add Your Contract ABI

1. Get your contract's ABI (from Etherscan, your project, or compiler output)
2. Open `src/abi/ContractABI.json` in a text editor
3. Replace the placeholder with your contract's ABI array
4. Save the file

**Verify the ABI is valid JSON** at https://jsonlint.com/

### Step 3: Start the Development Server

```bash
npm run dev
```

Expected output:
```
> staking-dapp@1.0.0 dev
> vite

  VITE v5.0.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

The browser should automatically open to `http://localhost:5173/`

## Using the dApp

### Step 1: Connect Your Wallet

1. Click the **"Connect MetaMask"** button
2. MetaMask popup appears
3. Select your account and click **"Connect"**
4. You should see your account address and current network

✅ **You are now connected!**

### Step 2: Load Your Contract

In the "Contract Interaction" section:

1. Paste your **Contract Address** (0x...)
2. Click **"Load Contract"**
3. The dApp fetches your ABI from `src/abi/ContractABI.json`
4. All available functions appear in a dropdown

⚠️ **If the ABI doesn't load:**
- Verify the file path: `src/abi/ContractABI.json`
- Check the JSON is valid (no syntax errors)
- Look at browser console (F12) for error messages

### Step 3: Call a Function

#### For Read Functions (View)
1. Select a function from the dropdown (marked as "read")
2. Enter any required parameters
3. Click **"Call Function"**
4. Result appears below instantly (no gas cost)

**Example:**
```
Function: balanceOf
Parameter: 0x1234...5678
Output: 1000000000000000000 (1 token in wei)
```

#### For Write Functions (Transaction)
1. Select a function from the dropdown (marked as "write")
2. Enter required parameters
3. Click **"Send Transaction"**
4. MetaMask popup appears - review the transaction
5. Click **"Confirm"** to execute
6. Status shows as "pending" while mining
7. Once confirmed, shows transaction hash and receipt

**Example:**
```
Function: transfer
Parameters: 
  to: 0x9876...5432
  amount: 1000000000000000000
Status: ✅ Transaction confirmed!
Hash: 0xabcd...1234
Block: 18523456
Gas Used: 45000
```

## Common Tasks

### Change Network

1. Click network selector in MetaMask
2. Select target network (Sepolia, Polygon, Arbitrum, etc.)
3. dApp automatically detects the change
4. You can now interact with contracts on that network

### Test a Function Before Mainnet

1. Switch to **Sepolia Testnet** in MetaMask
2. Get testnet ETH from a faucet (https://sepoliafaucet.com)
3. Use testnet contract address instead
4. Test your function call
5. Once confident, switch to **Mainnet** and use mainnet address

### Export Transaction Data

1. After transaction completes, note the **Transaction Hash**
2. Visit **Etherscan** (or network's explorer)
3. Paste the hash to view full transaction details
4. Export/archive as needed

### Test Read vs Write

**Read Function Test:**
```
Function: owner()
Click: Call Function
Result: 0x123...abc (instant, no gas)
```

**Write Function Test:**
```
Function: setOwner(address newOwner)
Parameter: 0x456...def
Click: Send Transaction
Status: MetaMask popup → Confirm → Pending → Success
```

## Troubleshooting

### Problem: "MetaMask is not installed"
**Solution:**
- Install MetaMask from https://metamask.io/
- Refresh the page after installing

### Problem: "ABI file not found"
**Solution:**
- Verify file exists: `src/abi/ContractABI.json`
- Check browser console (F12 → Console tab) for exact error
- Ensure JSON syntax is valid

### Problem: Contract loads but no functions appear
**Solution:**
- Check if ABI contains function definitions
- ABI might only have events or state variables
- Verify function `stateMutability` is not "internal" or "private"

### Problem: "Contract address is not a valid address"
**Solution:**
- Ensure address starts with "0x"
- Check address length (should be 42 characters)
- Verify contract is deployed on current network

### Problem: Transaction fails with "insufficient funds for gas"
**Solution:**
- Check account balance: `balance_in_wei / 10^18 = balance_in_ETH`
- Get more ETH from faucet (testnet) or wallet (mainnet)
- Reduce gas price if needed (advanced)

### Problem: Transaction pending for too long
**Solution:**
- Check Etherscan with transaction hash
- It might already be confirmed (check block)
- Try refreshing page to update status
- If truly stuck, network might be congested

### Problem: MetaMask won't connect
**Solution:**
- Ensure MetaMask extension is enabled in browser
- Try disconnecting and reconnecting account
- Check MetaMask isn't locked (unlock with password)
- Clear browser cache and refresh

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm build

# Preview production build locally
npm run preview
```

## Project Layout Reference

```
staking-dapp/frontend/
├── src/
│   ├── App.jsx              ← Main app component
│   ├── contract.js          ← Contract utilities
│   ├── index.css            ← Styling (customize here)
│   ├── components/
│   │   ├── ConnectWallet.jsx
│   │   ├── ContractFunctions.jsx
│   │   └── TransactionStatus.jsx
│   └── abi/
│       └── ContractABI.json  ← Replace with your ABI
├── package.json             ← Dependencies
├── vite.config.js           ← Build configuration
└── docs/                    ← Documentation
```

## Next Steps

1. **Customize Styling**: Edit `src/index.css` to match your brand
2. **Add Environment Variables**: Create `.env` for contract addresses
3. **Deploy Frontend**: Push to GitHub/Vercel/Netlify
4. **Add More Features**: Events listening, contract deployment, etc.
5. **Test Thoroughly**: Use testnet before mainnet

## Additional Resources

- **ethers.js Documentation**: https://docs.ethers.org/v6/
- **MetaMask Documentation**: https://docs.metamask.io/
- **Solidity Documentation**: https://docs.soliditylang.org/
- **Vite Documentation**: https://vitejs.dev/

## Support

If you encounter issues:

1. Check the [setup.md](setup.md) for configuration help
2. Review [architecture.md](architecture.md) for how components work
3. Check browser console (F12) for error messages
4. Verify contract address and ABI match
5. Test on testnet before mainnet

---

**Happy building! 🚀**

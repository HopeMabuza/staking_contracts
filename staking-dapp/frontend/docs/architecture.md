# Architecture Guide

## Overview

The Ethereum dApp is a React-based frontend that connects to deployed smart contracts using ethers.js v6. It provides a dynamic, user-friendly interface for interacting with contract functions without requiring custom UI for each contract.

```
┌─────────────────────────────────────────────┐
│         Browser (React App)                 │
│  ┌───────────────────────────────────────┐  │
│  │  App.jsx - Main Container             │  │
│  └────────────────┬──────────────────────┘  │
│                   │                         │
│      ┌────────────┼────────────┐            │
│      │            │            │            │
│   ┌──▼──┐    ┌───▼──┐    ┌───▼───┐        │
│   │Wallet   │Contract │Transaction│       │
│   │Connect  │Functions│Status      │       │
│   └──┬──┘    └───┬──┘    └───┬───┘        │
│      └───────────┼───────────┘             │
└──────────────────┼──────────────────────────┘
                   │
         ┌─────────▼────────────┐
         │  window.ethereum     │
         │  (MetaMask)          │
         └─────────┬────────────┘
                   │
         ┌─────────▼────────────┐
         │  ethers.js v6        │
         │                      │
         │ - BrowserProvider    │
         │ - Contract Instance  │
         │ - Signer             │
         └─────────┬────────────┘
                   │
         ┌─────────▼────────────┐
         │  Ethereum Network    │
         │                      │
         │ - Smart Contract     │
         │ - JSON-RPC Node      │
         └──────────────────────┘
```

## Core Components

### 1. **App.jsx** - Main Container
- **Responsibility**: Manages wallet connection and app state
- **Key Functions**:
  - Initialize ethers provider
  - Handle wallet connection via MetaMask
  - Manage signer and network information
  - Listen for account/network changes
  - Pass callbacks to child components

**State Management**:
```javascript
- account: Connected wallet address
- network: Chain ID and network name
- signer: Ethers signer for transactions
- provider: Ethers provider for reading
- transactionStatus: Current transaction state
```

### 2. **ConnectWallet.jsx** - Wallet UI
- **Responsibility**: Display wallet connection status
- **Features**:
  - Show/hide wallet connection button
  - Display connected account (formatted)
  - Show current network (name and chain ID)
  - Handle wallet disconnection

### 3. **ContractFunctions.jsx** - Dynamic Function Caller
- **Responsibility**: Dynamically generate UI for contract functions
- **Features**:
  - Load ABI from `/src/abi/ContractABI.json`
  - Accept contract address as input
  - Parse ABI to extract public/external functions
  - Render form fields for function parameters
  - Handle read (view/pure) and write (payable/nonpayable) functions
  - Display function outputs

**Workflow**:
```
1. User enters contract address
2. Component loads ABI from file
3. Parses ABI to extract functions
4. Generates UI for each function
5. User selects a function
6. Input fields appear for parameters
7. User executes function
8. Calls contract via ethers.js
9. Displays result
```

### 4. **TransactionStatus.jsx** - Status Display
- **Responsibility**: Show transaction status and feedback
- **Statuses**:
  - `pending`: Transaction in progress (shows spinner)
  - `success`: Transaction completed (green icon)
  - `error`: Transaction failed (red icon)
  - `info`: Informational message (blue icon)

## Utility Functions - contract.js

### Key Functions

```javascript
// Create a contract instance
getContractInstance(address, abi, signerOrProvider)
└─> Returns: ethers.Contract

// Call read-only functions
callReadFunction(contract, functionName, args)
└─> Returns: { success, data|error }

// Call write functions
callWriteFunction(contract, functionName, args, overrides)
└─> Returns: { success, transactionHash, blockNumber, gasUsed }

// Extract functions from ABI
getContractFunctions(abi)
└─> Returns: Array of function objects with metadata

// Format contract outputs
formatOutput(output)
└─> Returns: Human-readable string
```

## Data Flow

### Wallet Connection Flow
```
User clicks "Connect MetaMask"
    ↓
App.connectWallet()
    ↓
window.ethereum.request({ method: 'eth_requestAccounts' })
    ↓
MetaMask popup appears
    ↓
User approves connection
    ↓
handleAccountChanged() stores:
    - Connected account
    - Signer instance
    - Network info
    ↓
ConnectWallet displays account & network
```

### Contract Function Execution Flow

**Read Function (view/pure)**:
```
User selects function & enters parameters
    ↓
ContractFunctions.executeFunction()
    ↓
callReadFunction() via contract.read()
    ↓
Returns data immediately
    ↓
formatOutput() converts to readable format
    ↓
TransactionStatus shows success/error
    ↓
Result displayed in UI
```

**Write Function (payable/nonpayable)**:
```
User selects function & enters parameters
    ↓
ContractFunctions.executeFunction()
    ↓
callWriteFunction() via contract.write()
    ↓
Transaction sent to blockchain
    ↓
TransactionStatus shows "pending"
    ↓
wait() waits for block confirmation
    ↓
Returns transaction receipt
    ↓
TransactionStatus shows "success"
    ↓
Receipt details displayed
```

## ethers.js v6 Integration

### BrowserProvider
Connects to MetaMask via `window.ethereum`:
```javascript
const provider = new ethers.BrowserProvider(window.ethereum);
```

### Signer
Signs transactions (required for write functions):
```javascript
const signer = await provider.getSigner();
```

### Contract Instance
Represents the smart contract:
```javascript
// For reading
const contract = new ethers.Contract(address, abi, provider);

// For writing
const contract = new ethers.Contract(address, abi, signer);
```

## ABI Handling

### ABI Structure
The Contract ABI is a JSON array containing function descriptors:

```json
{
  "name": "functionName",
  "type": "function",
  "stateMutability": "view|nonpayable|payable",
  "inputs": [ { "name": "param", "type": "uint256" } ],
  "outputs": [ { "name": "", "type": "bool" } ]
}
```

### Function Classification
- **Read Functions**: `stateMutability` = "view" or "pure"
  - Don't modify blockchain state
  - No gas cost (except RPC calls)
  - Executed locally

- **Write Functions**: `stateMutability` = "nonpayable" or "payable"
  - Modify blockchain state
  - Require gas payment
  - Need signer approval

## Transaction Status Management

The app tracks three transaction phases:

### 1. **Pending**
```javascript
setTransactionStatus({
  status: 'pending',
  message: 'Transaction pending...'
});
```
- Shows spinner animation
- Disables submit buttons
- Waits for blockchain confirmation

### 2. **Confirmed/Success**
```javascript
setTransactionStatus({
  status: 'success',
  message: 'Transaction confirmed!'
});
```
- Updates UI with transaction hash
- Shows block number and gas used
- Allows new interactions

### 3. **Error**
```javascript
setTransactionStatus({
  status: 'error',
  message: 'Transaction failed: ...'
});
```
- Displays error message
- Suggests solutions
- Allows retry

## Event Listening

The app listens for MetaMask events:

```javascript
// Account changed
window.ethereum.on('accountsChanged', (accounts) => {})

// Chain changed
window.ethereum.on('chainChanged', (chainId) => {})

// Connected
window.ethereum.on('connect', (connectInfo) => {})

// Disconnected
window.ethereum.on('disconnect', (error) => {})
```

## Error Handling

Comprehensive error handling for:
- **MetaMask not installed**: Displays installation message
- **Wallet not connected**: Shows connection button
- **ABI not found**: User-friendly error message
- **Invalid contract address**: Validation before loading
- **Transaction failure**: Displays error reason
- **Network mismatch**: Shows current network

## Security Architecture

1. **Private Keys**: Never handled by frontend
   - MetaMask manages all signing
   - User controls approvals

2. **ABI Storage**: Local file
   - No sensitive data in ABI
   - Publicly available information

3. **Contract Address**: User-provided
   - User must verify correctness
   - Prevents phishing through validation warnings

4. **Transaction Approval**: Explicit
   - User must approve in MetaMask
   - Can review amount and gas before confirming

## Extensibility

The architecture supports:
- **New Components**: Can add specialized UI for specific functions
- **Custom Styling**: CSS in `src/index.css`
- **Additional Networks**: Automatically detected
- **Contract-Specific Logic**: Can be added to `contract.js`
- **Advanced Features**: Event listening, contract deployment, etc.

## Performance Considerations

- **Lazy Loading**: ABI loaded only when needed
- **Efficient Updates**: React state batching
- **Minimal Re-renders**: Component memoization
- **Network Optimization**: Single provider instance
- **Responsive Design**: Mobile-friendly CSS with breakpoints

/**
 * Contract Configuration
 * Update the contract addresses below with your deployed contract addresses
 * 
 * Example:
 * const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';
 */

// Staking Contract Address - Update this with your deployed My_Staking_Contract address
export const CONTRACT_ADDRESS = '0xfE0A4F557212d38335bCD17ce4a03facb2aAe1D9';

// NFT Contract Address - Update this with your deployed NFT contract address
// You can find this in the deployment output when you ran: npx hardhat run scripts/deploy.js
export const NFT_CONTRACT_ADDRESS = '0x7dF1b504900D18549bB91Ba7c6406E67D9117f87';

// Add other contract configurations here as needed
export const CONTRACT_CONFIG = {
  address: CONTRACT_ADDRESS,
  nftAddress: NFT_CONTRACT_ADDRESS,
  // network: 'sepolia', // Uncomment and set if needed
  // chainId: 11155111, // Sepolia testnet
};

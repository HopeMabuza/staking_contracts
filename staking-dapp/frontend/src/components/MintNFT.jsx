import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import NFTABI from '../abi/NFT.json';
import { NFT_CONTRACT_ADDRESS } from '../config';

const MintNFT = ({ account, signer, transactionStatus, onTransactionUpdate }) => {
  const [mintAmount, setMintAmount] = useState(1);
  const [cost, setCost] = useState(null);
  const [userNFTs, setUserNFTs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [maxMintAmount, setMaxMintAmount] = useState(null);
  const [totalSupply, setTotalSupply] = useState(null);
  const [maxSupply, setMaxSupply] = useState(null);

  // Fetch NFT contract data
  useEffect(() => {
    if (account && signer) {
      fetchNFTData();
    }
  }, [account, signer]);

  const fetchNFTData = async () => {
    try {
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFTABI.abi, signer);

      // Get cost
      const costBigInt = await nftContract.cost();
      setCost(costBigInt);

      // Get max mint amount
      const maxMint = await nftContract.maxMintAmount();
      setMaxMintAmount(maxMint);

      // Get total supply
      const supply = await nftContract.totalSupply();
      setTotalSupply(supply);

      // Get max supply
      const max = await nftContract.maxSupply();
      setMaxSupply(max);

      // Get user's NFTs
      const userNFTIds = await nftContract.walletOfOwner(account);
      setUserNFTs(userNFTIds.map((id) => id.toString()));
    } catch (error) {
      console.error('Error fetching NFT data:', error);
    }
  };

  const handleMint = async (e) => {
    e.preventDefault();
    if (!signer || !account) {
      onTransactionUpdate({
        status: 'error',
        message: 'Please connect MetaMask first',
      });
      return;
    }

    try {
      setLoading(true);
      onTransactionUpdate({
        status: 'pending',
        message: 'Processing mint transaction...',
      });

      const nftContract = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        NFTABI.abi,
        signer
      );

      // Check if user is owner (owner can mint for free)
      const owner = await nftContract.owner();
      const isOwner = owner.toLowerCase() === account.toLowerCase();

      // Calculate total cost if not owner
      let totalCost = cost * BigInt(mintAmount);
      if (isOwner) {
        totalCost = 0n;
      }

      const tx = await nftContract.mint(mintAmount, {
        value: totalCost,
      });

      onTransactionUpdate({
        status: 'pending',
        message: `Minting ${mintAmount} NFT(s)... Waiting for confirmation...`,
        hash: tx.hash,
      });

      const receipt = await tx.wait();

      onTransactionUpdate({
        status: 'success',
        message: `Successfully minted ${mintAmount} NFT(s)! `,
      });

      // Short delay then refresh to ensure chain is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchNFTData();
      setMintAmount(1);
    } catch (error) {
      let errorMessage = 'Mint failed';

      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error('Mint error:', error);
      onTransactionUpdate({
        status: 'error',
        message: `Mint failed: ${errorMessage}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const totalCostEth = cost ? ethers.formatEther(cost * BigInt(mintAmount)) : '0';

  return (
    <div className="mint-container">
      <div className="mint-header">
        <h2>Mint NFTs</h2>
        <p className="subtitle">Create NFTs before staking them to earn rewards</p>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-label">Cost per NFT</div>
          <div className="stat-value">
            {cost ? ethers.formatEther(cost) : 'Loading...'} ETH
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Minted</div>
          <div className="stat-value">
            {totalSupply !== null ? `${totalSupply}/${maxSupply}` : 'Loading...'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Your NFTs</div>
          <div className="stat-value">{userNFTs.length}</div>
        </div>
      </div>

      {/* Your NFTs Display */}
      {userNFTs.length > 0 && (
        <div className="user-nfts">
          <h3>Your NFT IDs</h3>
          <div className="nft-ids">
            {userNFTs.map((id) => (
              <span key={id} className="nft-badge">
                #{id}
              </span>
            ))}
          </div>
          <p className="nft-hint">
            Ready to stake? Go to the Staking tab and enter one of these NFT IDs to start earning rewards!
          </p>
        </div>
      )}

      {/* Mint Form */}
      <form onSubmit={handleMint} className="mint-form">
        <div className="form-group">
          <label htmlFor="mintAmount">Number of NFTs to Mint</label>
          <input
            id="mintAmount"
            type="number"
            min="1"
            max={maxMintAmount ? maxMintAmount.toString() : '10'}
            value={mintAmount}
            onChange={(e) => setMintAmount(Math.max(1, parseInt(e.target.value) || 1))}
            disabled={loading}
          />
        </div>

        <div className="cost-display">
          <div className="cost-row">
            <span>Cost per NFT:</span>
            <span>{cost ? ethers.formatEther(cost) : '0'} ETH</span>
          </div>
          <div className="cost-row total">
            <span>Total Cost:</span>
            <span>{totalCostEth} ETH</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !account || !signer}
          className="mint-button"
        >
          {loading ? 'Minting...' : `Mint ${mintAmount} NFT${mintAmount !== 1 ? 's' : ''}`}
        </button>
      </form>

      {/* Info Section */}
      <div className="mint-info">
        <h3> How to Mint & Stake</h3>
        <ol>
          <li>Click <strong>"Mint NFT(s)"</strong> above to create your NFTs</li>
          <li>Pay the ETH cost for each NFT</li>
          <li>Your NFT IDs will appear above after minting</li>
          <li>Go to the <strong>"Staking"</strong> tab</li>
          <li>Enter your NFT ID and click <strong>"Stake"</strong></li>
          <li>Approve MetaMask transaction (only needed once)</li>
          <li> Your NFT is now earning rewards!</li>
        </ol>
      </div>
    </div>
  );
};

export default MintNFT;

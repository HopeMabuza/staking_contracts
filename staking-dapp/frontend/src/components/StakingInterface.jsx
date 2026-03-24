import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContractInstance, callReadFunction, callWriteFunction, formatOutput } from '../contract';
import ContractABI from '../abi/My_Staking_Contract.json';
import NFTABI from '../abi/NFT.json';
import { CONTRACT_ADDRESS, NFT_CONTRACT_ADDRESS } from '../config';

const StakingInterface = ({
  signer,
  account,
  provider,
  onTransactionStart,
  onTransactionComplete,
  onTransactionError,
}) => {
  const [tokenId, setTokenId] = useState('');
  const [userRewards, setUserRewards] = useState('0.0');
  const [userRewardsRaw, setUserRewardsRaw] = useState(BigInt(0));
  const [stakedTokens, setStakedTokens] = useState([]);
  const [totalStaked, setTotalStaked] = useState('0');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [coolTime, setCoolTime] = useState(0);       // cooldown duration in seconds
  const [stakedAt, setStakedAt] = useState(0);       // unix timestamp when user staked
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  // Tick every second for the countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch user data
  const refreshUserData = async () => {
    if (!account || !provider) return;
    
    setRefreshing(true);
    try {
      const contract = getContractInstance(CONTRACT_ADDRESS, ContractABI.abi, provider);

      // Get rewards
      const rewordsResult = await callReadFunction(contract, 'calculateRewards', [account]);
      if (rewordsResult.success) {
        const raw = BigInt(rewordsResult.data.toString());
        setUserRewardsRaw(raw);
        setUserRewards(ethers.formatEther(raw));
      }

      // Get staked token IDs
      const tokensResult = await callReadFunction(contract, 'getStakedTokenIds', [account]);
      if (tokensResult.success) {
        const tokens = Array.isArray(tokensResult.data) ? tokensResult.data : [];
        setStakedTokens(tokens.map(t => t.toString()));
      }

      // Get total staked
      const totalResult = await callReadFunction(contract, 'totalStaked', []);
      if (totalResult.success) {
        setTotalStaked(totalResult.data.toString());
      }

      // Get coolTime and stakedAt
      const coolResult = await callReadFunction(contract, 'coolTime', []);
      if (coolResult.success) setCoolTime(Number(coolResult.data));

      const userResult = await callReadFunction(contract, 'userInfo', [account]);
      if (userResult.success) setStakedAt(Number(userResult.data.stakedAt));
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Refresh data on account change + poll every 15 seconds to update rewards
  useEffect(() => {
    refreshUserData();
    const poll = setInterval(refreshUserData, 15000);
    return () => clearInterval(poll);
  }, [account, provider]);

  // Check and request NFT approval
  const requestNFTApproval = async () => {
    try {
      const nftContract = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        NFTABI.abi,
        signer
      );

      // Check if staking contract is already approved
      const isApproved = await nftContract.isApprovedForAll(account, CONTRACT_ADDRESS);
      
      if (!isApproved) {
        onTransactionStart();
        const tx = await nftContract.setApprovalForAll(CONTRACT_ADDRESS, true);
        await tx.wait();
        return true; // Approval granted
      }
      return true; // Already approved
    } catch (error) {
      console.error('Approval error:', error);
      onTransactionError(`Approval failed: ${error.message}`);
      return false;
    }
  };

  // Stake NFT
  const handleStake = async () => {
    if (!tokenId.trim()) {
      onTransactionError('Please enter an NFT token ID');
      return;
    }

    console.log(`Attempting to stake tokenId: ${tokenId}`);
    try {
      setLoading(true);
      
      // Step 1: Request approval if needed
      onTransactionStart();
      const approved = await requestNFTApproval();
      
      if (!approved) {
        setLoading(false);
        return;
      }

      // Step 2: Proceed with staking
      onTransactionStart();
      const contract = getContractInstance(CONTRACT_ADDRESS, ContractABI.abi, signer);
      const result = await callWriteFunction(contract, 'stake', [tokenId]);

      if (result.success) {
        onTransactionComplete(`NFT #${tokenId} staked successfully! `);
        setTokenId('');
        setTimeout(refreshUserData, 2000);
      } else {
        onTransactionError(result.error);
      }
    } catch (error) {
      const errorMsg = error.message || '';
      if (errorMsg.includes('nonexistent token')) {
        onTransactionError(`NFT #${tokenId} does not exist. Make sure you own this NFT ID or mint one first.`);
      } else if (errorMsg.includes('ERC721: operator query')) {
        onTransactionError(`NFT approval failed. Make sure you approved the staking contract.`);
      } else {
        onTransactionError(`Error staking: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Withdraw NFT
  const handleWithdraw = async () => {
    if (!tokenId.trim()) {
      onTransactionError('Please enter an NFT token ID');
      return;
    }

    try {
      setLoading(true);
      onTransactionStart();

      const contract = getContractInstance(CONTRACT_ADDRESS, ContractABI.abi, signer);
      const result = await callWriteFunction(contract, 'withdraw', [tokenId]);

      if (result.success) {
        onTransactionComplete(`NFT #${tokenId} withdrawn successfully!`);
        setTokenId('');
        setTimeout(refreshUserData, 2000);
      } else {
        onTransactionError(result.error);
      }
    } catch (error) {
      const errorMsg = error.message || '';
      if (errorMsg.includes('Not your NFT')) {
        onTransactionError(`NFT #${tokenId} is not staked by you.`);
      } else {
        onTransactionError(`Error withdrawing: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Withdraw and Claim
  const handleWithdrawAndClaim = async () => {
    if (!tokenId.trim()) {
      onTransactionError('Please enter an NFT token ID');
      return;
    }

    try {
      setLoading(true);
      onTransactionStart();

      const contract = getContractInstance(CONTRACT_ADDRESS, ContractABI.abi, signer);
      const result = await callWriteFunction(contract, 'withdrawAndClaim', [tokenId]);

      if (result.success) {
        onTransactionComplete(`NFT #${tokenId} withdrawn and rewards claimed!`);
        setTokenId('');
        setTimeout(refreshUserData, 2000);
      } else {
        onTransactionError(result.error);
      }
    } catch (error) {
      onTransactionError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Claim Rewards
  const handleClaimRewards = async () => {
    try {
      setLoading(true);
      onTransactionStart();

      const contract = getContractInstance(CONTRACT_ADDRESS, ContractABI.abi, signer);
      const result = await callWriteFunction(contract, 'claimRewards', []);

      if (result.success) {
        onTransactionComplete('Rewards claimed successfully!');
        setTimeout(refreshUserData, 2000);
      } else {
        onTransactionError(result.error);
      }
    } catch (error) {
      onTransactionError(`Error claiming rewards: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isCoolingDown = stakedAt > 0 && (stakedAt + coolTime) > now;
  const remaining = Math.max(0, (stakedAt + coolTime) - now);
  const countdownStr = `${Math.floor(remaining / 3600)}h ${Math.floor((remaining % 3600) / 60)}m ${remaining % 60}s`;

  return (
    <div className="staking-interface">
      {/* Debug Info */}
      <div style={{
        background: '#f0f0f0',
        padding: '10px',
        margin: '0 0 20px 0',
        borderRadius: '5px',
        fontSize: '0.85rem',
        fontFamily: 'monospace'
      }}>
        <strong>Debug Info:</strong><br/>
        Your Address: {account?.substring(0, 10)}...{account?.substring(account.length - 8)}<br/>
        Staking Contract: {CONTRACT_ADDRESS?.substring(0, 10)}...
      </div>

      {/* User Stats Section */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-label"> Your Rewards</div>
          <div className="stat-value">{userRewards}</div>
          <button
            className="btn btn-success"
            onClick={handleClaimRewards}
            disabled={loading || userRewardsRaw === BigInt(0) || isCoolingDown}
          >
            {loading ? 'Claiming...' : isCoolingDown ? `🔒 ${countdownStr}` : '✓ Claim Rewards'}
          </button>
        </div>

        <div className="stat-card">
          <div className="stat-label"> Staked NFTs</div>
          <div className="stat-value">{stakedTokens.length}</div>
          <div className="token-list">
            {stakedTokens.length > 0 ? (
              stakedTokens.map(id => {
                const unlockAt = stakedAt + coolTime;
                const remaining = unlockAt - now;
                return (
                  <div key={id} className="token-badge-row">
                    <span className="token-badge">#{id}</span>
                    {remaining > 0 ? (
                      <span className="cooldown-timer">
                        🔒 {Math.floor(remaining / 3600)}h {Math.floor((remaining % 3600) / 60)}m {remaining % 60}s
                      </span>
                    ) : (
                      <span className="cooldown-ready">✅ Ready</span>
                    )}
                  </div>
                );
              })
            ) : (
              <span className="empty-text">No NFTs staked</span>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label"> Total Staked</div>
          <div className="stat-value">{totalStaked}</div>
        </div>
      </div>

      {/* Staking Actions Section */}
      <div className="actions-section">
        <h3>Staking Actions</h3>

        <div className="input-group">
          <label>NFT Token ID:</label>
          <input
            type="text"
            placeholder="Enter NFT ID (e.g., 1, 42, 100)"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            className="input"
          />
          <small className="helper-text">
            {stakedTokens.length > 0 
              ? ` Your staked NFTs: ${stakedTokens.join(', ')} (withdraw from these)`
              : ` You don't have any staked NFTs yet. Mint an NFT first, then enter its ID above.`}
          </small>
        </div>

        <div className="action-buttons">
          <button
            className="btn btn-primary btn-large"
            onClick={handleStake}
            disabled={loading}
          >
            {loading ? ' Staking...' : ' Stake NFT'}
          </button>

          <button
            className="btn btn-warning btn-large"
            onClick={handleWithdraw}
            disabled={loading || isCoolingDown}
          >
            {loading ? ' Withdrawing...' : isCoolingDown ? `🔒 ${countdownStr}` : ' Withdraw NFT'}
          </button>

          <button
            className="btn btn-success btn-large"
            onClick={handleWithdrawAndClaim}
            disabled={loading || isCoolingDown}
          >
            {loading ? ' Processing...' : isCoolingDown ? `🔒 ${countdownStr}` : ' Withdraw & Claim'}
          </button>
        </div>

        <button
          className="btn btn-secondary btn-refresh"
          onClick={refreshUserData}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : ' Refresh Data'}
        </button>
      </div>

      {/* Tips Section */}
      <div className="tips-section">
        <h4> Quick Guide</h4>
        <ul className="tips-list">
          <li><strong>Stake:</strong> Enter an NFT ID you own and click "Stake NFT" to start earning rewards</li>
          <li><strong>View Rewards:</strong> Your pending rewards are shown in the "Your Rewards" card at the top</li>
          <li><strong>Claim:</strong> Click "Claim Rewards" to receive your earned tokens</li>
          <li><strong>Withdraw:</strong> Use "Withdraw NFT" to unstake and get your NFT back</li>
          <li><strong>Quick Claim:</strong> "Withdraw & Claim" unstakes your NFT and claims rewards in one transaction</li>
        </ul>
        <div className="error-help">
          <strong> "NFT does not exist" Error?</strong>
          <p>Make sure you own that NFT. Check your NFT contract to see which IDs you have.</p>
        </div>
      </div>
    </div>
  );
};

export default StakingInterface;

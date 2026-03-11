import React, { useEffect, useState } from 'react';
import ConnectWallet from './components/ConnectWallet';
import StakingInterface from './components/StakingInterface';
import MintNFT from './components/MintNFT';
import TransactionStatus from './components/TransactionStatus';
import { ethers } from 'ethers';

const App = () => {
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState(null);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState('mint'); // 'mint' or 'stake'

  // Initialize provider on mount
  useEffect(() => {
    if (window.ethereum) {
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethersProvider);
      checkConnection(ethersProvider);
    } else {
      setTransactionStatus({
        status: 'error',
        message: 'MetaMask is not installed. Please install MetaMask to continue.',
      });
    }
  }, []);

  // Check if wallet is already connected
  const checkConnection = async (ethersProvider) => {
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });

      if (accounts.length > 0) {
        handleAccountChanged(accounts[0], ethersProvider);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  // Handle account change
  const handleAccountChanged = async (acc, ethersProvider) => {
    setAccount(acc);

    // Get signer
    const newSigner = await ethersProvider.getSigner();
    setSigner(newSigner);

    // Get network
    const net = await ethersProvider.getNetwork();
    setNetwork({
      name: net.name,
      chainId: net.chainId,
    });

    setTransactionStatus({
      status: 'success',
      message: `Connected to ${net.name} (Chain ID: ${net.chainId})`,
    });
  };

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      setTransactionStatus({
        status: 'error',
        message: 'MetaMask is not installed',
      });
      return;
    }

    try {
      setIsConnecting(true);
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        await handleAccountChanged(accounts[0], provider);
      }
    } catch (error) {
      setTransactionStatus({
        status: 'error',
        message: `Connection failed: ${error.message}`,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          handleAccountChanged(accounts[0], provider);
        } else {
          setAccount(null);
          setSigner(null);
          setNetwork(null);
          setTransactionStatus({
            status: 'info',
            message: 'Wallet disconnected',
          });
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum.off('accountsChanged', handleAccountsChanged);
      };
    }
  }, [provider]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1> NFT Staking </h1>
        <p>Stake your NFTs and earn rewards</p>
      </header>

      <main className="app-main">
        {/* Wallet Connection Section */}
        <section className="section">
          <h2>Wallet Connection</h2>
          <ConnectWallet
            account={account}
            network={network}
            onConnect={connectWallet}
            isConnecting={isConnecting}
          />
        </section>

        {/* Mint & Staking Dashboard Section */}
        {account && signer && (
          <section className="section">
            {/* Tab Navigation */}
            <div className="tab-navigation">
              <button
                className={`tab-button ${activeTab === 'mint' ? 'active' : ''}`}
                onClick={() => setActiveTab('mint')}
              >
                 Mint NFTs
              </button>
              <button
                className={`tab-button ${activeTab === 'stake' ? 'active' : ''}`}
                onClick={() => setActiveTab('stake')}
              >
                 Stake & Earn
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'mint' ? (
                <MintNFT
                  account={account}
                  signer={signer}
                  transactionStatus={transactionStatus}
                  onTransactionUpdate={setTransactionStatus}
                />
              ) : (
                <StakingInterface
                  signer={signer}
                  account={account}
                  provider={provider}
                  onTransactionStart={() =>
                    setTransactionStatus({
                      status: 'pending',
                      message: 'Transaction pending...',
                    })
                  }
                  onTransactionComplete={(message) =>
                    setTransactionStatus({
                      status: 'success',
                      message,
                    })
                  }
                  onTransactionError={(error) =>
                    setTransactionStatus({
                      status: 'error',
                      message: error,
                    })
                  }
                />
              )}
            </div>
          </section>
        )}

        {/* Transaction Status Section */}
        {transactionStatus && (
          <section className="section">
            <TransactionStatus
              status={transactionStatus.status}
              message={transactionStatus.message}
            />
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p> Always verify contract addresses and ABIs before interacting</p>
      </footer>
    </div>
  );
};

export default App;

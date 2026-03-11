import React from 'react';

const ConnectWallet = ({ account, network, onConnect, isConnecting }) => {
  // Format address to show first and last 4 characters
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="card">
      <div className="wallet-info">
        {!account ? (
          <div className="no-connection">
            <p>📱 No wallet connected</p>
            <button 
              className="btn btn-primary" 
              onClick={onConnect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
            </button>
          </div>
        ) : (
          <div className="connection-success">
            <div className="info-item">
              <label>Connected Account:</label>
              <span className="address">{formatAddress(account)}</span>
              <small>{account}</small>
            </div>

            {network && (
              <div className="info-item">
                <label>Network:</label>
                <span className="network-name">
                  {network.name} (Chain ID: {network.chainId})
                </span>
              </div>
            )}

            <div className="connected-badge">✓ Connected</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectWallet;

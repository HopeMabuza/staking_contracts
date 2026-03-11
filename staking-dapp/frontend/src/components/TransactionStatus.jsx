import React, { useEffect } from 'react';

const TransactionStatus = ({ status, message }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '•';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'success':
        return '#28a745';
      case 'error':
        return '#dc3545';
      case 'info':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  };

  return (
    <div
      className="status-container"
      style={{
        borderLeftColor: getStatusColor(),
      }}
    >
      <div className="status-content">
        <span className="status-icon">{getStatusIcon()}</span>
        <div className="status-text">
          <p className="status-title">{status.toUpperCase()}</p>
          <p className="status-message">{message}</p>
        </div>
      </div>

      {status === 'pending' && <div className="spinner"></div>}
    </div>
  );
};

export default TransactionStatus;

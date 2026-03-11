import { ethers } from 'ethers';

/**
 * Creates a contract instance for reading data
 * @param {string} contractAddress - The address of the deployed contract
 * @param {Array} abi - The contract ABI
 * @param {ethers.Provider | ethers.Signer} signerOrProvider - Provider or signer
 * @returns {ethers.Contract} The contract instance
 */
export const getContractInstance = (contractAddress, abi, signerOrProvider) => {
  if (!contractAddress || !abi) {
    throw new Error('Contract address and ABI are required');
  }

  return new ethers.Contract(contractAddress, abi, signerOrProvider);
};

/**
 * Calls a read-only function on the contract
 * @param {ethers.Contract} contract - The contract instance
 * @param {string} functionName - Name of the function to call
 * @param {Array} args - Function arguments
 * @returns {Promise} The result of the function call
 */
export const callReadFunction = async (contract, functionName, args = []) => {
  try {
    const result = await contract[functionName](...args);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Calls a write function on the contract
 * @param {ethers.Contract} contract - The contract instance (with signer)
 * @param {string} functionName - Name of the function to call
 * @param {Array} args - Function arguments
 * @param {Object} overrides - Optional transaction overrides (gas, gasPrice, etc.)
 * @returns {Promise} Transaction receipt or error
 */
export const callWriteFunction = async (
  contract,
  functionName,
  args = [],
  overrides = {}
) => {
  try {
    // Call the function with arguments and overrides
    let transaction;
    
    if (Object.keys(overrides).length > 0) {
      transaction = await contract[functionName](...args, overrides);
    } else {
      transaction = await contract[functionName](...args);
    }

    // Wait for the transaction to be mined
    const receipt = await transaction.wait();

    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Transaction failed',
    };
  }
};

/**
 * Gets contract function metadata from ABI
 * @param {Array} abi - The contract ABI
 * @returns {Array} Array of function objects with metadata
 */
export const getContractFunctions = (abi) => {
  return abi
    .filter(
      (item) =>
        item.type === 'function' &&
        (item.stateMutability === 'view' ||
          item.stateMutability === 'pure' ||
          item.stateMutability === 'nonpayable' ||
          item.stateMutability === 'payable')
    )
    .map((func) => ({
      name: func.name,
      inputs: func.inputs || [],
      outputs: func.outputs || [],
      stateMutability: func.stateMutability,
      isReadOnly:
        func.stateMutability === 'view' || func.stateMutability === 'pure',
      isPayable: func.stateMutability === 'payable',
    }));
};

/**
 * Converts function output to readable format
 * @param {any} output - The output from contract function
 * @returns {string} Human-readable string representation
 */
export const formatOutput = (output) => {
  if (Array.isArray(output)) {
    return JSON.stringify(
      output.map((item) => (typeof item === 'bigint' ? item.toString() : item)),
      null,
      2
    );
  }

  if (typeof output === 'bigint') {
    return output.toString();
  }

  if (typeof output === 'object' && output !== null) {
    return JSON.stringify(output, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    }, 2);
  }

  return String(output);
};

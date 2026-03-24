import React, { useEffect, useState } from 'react';
import {
  getContractFunctions,
  getContractInstance,
  callReadFunction,
  callWriteFunction,
  formatOutput,
} from '../contract';
import ContractABI from '../abi/My_Staking_Contract.json';
import { CONTRACT_ADDRESS } from '../config';

const ContractFunctions = ({
  signer,
  account,
  provider,
  onTransactionStart,
  onTransactionComplete,
  onTransactionError,
}) => {
  const [abi, setAbi] = useState(null);
  const [functions, setFunctions] = useState([]);
  const [contractLoaded, setContractLoaded] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [inputs, setInputs] = useState({});
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load ABI from JSON file
  const loadABI = async () => {
    try {
      return ContractABI;
    } catch (error) {
      onTransactionError(`Failed to load ABI: ${error.message}`);
      return null;
    }
  };

  // Auto-load contract on mount when provider is ready
  useEffect(() => {
    if (provider && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
      initializeContract();
    }
  }, [provider]);

  // Initialize contract and load functions
  const initializeContract = async () => {
    try {
      setLoading(true);
      const abiData = await loadABI();
      if (!abiData) return;

      setAbi(abiData);
      const funcs = getContractFunctions(abiData);
      setFunctions(funcs);
      setContractLoaded(true);
      onTransactionComplete(
        `Contract loaded with ${funcs.length} functions`
      );
    } catch (error) {
      onTransactionError(`Error loading contract: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle function selection
  const handleFunctionSelect = (func) => {
    setSelectedFunction(func);
    setInputs({});
    setOutput(null);
  };

  // Handle input change
  const handleInputChange = (paramName, value) => {
    setInputs((prev) => ({
      ...prev,
      [paramName]: value,
    }));
  };

  // Execute function
  const executeFunction = async () => {
    if (!selectedFunction || !abi) return;

    try {
      setLoading(true);
      onTransactionStart();

      // Prepare arguments based on input parameters
      const args = selectedFunction.inputs.map((input) => {
        const value = inputs[input.name] || '';
        // Basic type conversion
        if (input.type.startsWith('uint') || input.type.startsWith('int')) {
          return value;
        }
        if (input.type === 'address') {
          return value;
        }
        if (input.type === 'bool') {
          return value === 'true' || value === true;
        }
        return value;
      });

      // Get appropriate signer/provider based on function type
      const signerOrProvider = selectedFunction.isReadOnly ? provider : signer;
      const contract = getContractInstance(
        CONTRACT_ADDRESS,
        abi,
        signerOrProvider
      );

      let result;
      if (selectedFunction.isReadOnly) {
        // Call read-only function
        result = await callReadFunction(
          contract,
          selectedFunction.name,
          args
        );
        if (result.success) {
          setOutput(formatOutput(result.data));
          onTransactionComplete(
            `Function executed: ${selectedFunction.name}`
          );
        } else {
          onTransactionError(result.error);
        }
      } else {
        // Call write function
        const txResult = await callWriteFunction(
          contract,
          selectedFunction.name,
          args
        );
        if (txResult.success) {
          setOutput(`
Transaction successful!
Transaction Hash: ${txResult.transactionHash}
Block Number: ${txResult.blockNumber}
Gas Used: ${txResult.gasUsed}
          `);
          onTransactionComplete(
            `Transaction confirmed: ${selectedFunction.name}`
          );
        } else {
          onTransactionError(txResult.error);
        }
      }
    } catch (error) {
      onTransactionError(
        `Error executing function: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      {contractLoaded ? (
        <div className="contract-loaded">
          <div className="contract-header">
            <h3>Contract Functions</h3>
          </div>

          <div className="functions-list">
            <label>Select Function:</label>
            <select
              className="input"
              value={selectedFunction?.name || ''}
              onChange={(e) => {
                const func = functions.find((f) => f.name === e.target.value);
                if (func) handleFunctionSelect(func);
              }}
            >
              <option value="">-- Choose a function --</option>
              {functions.map((func) => (
                <option key={func.name} value={func.name}>
                  {func.name}
                  {func.isReadOnly ? ' (read)' : ' (write)'}
                  {func.isPayable ? ' [payable]' : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedFunction && (
            <div className="function-details">
              <h4>{selectedFunction.name}</h4>

              {selectedFunction.inputs.length > 0 ? (
                <div className="function-inputs">
                  <p className="subheader">Parameters:</p>
                  {selectedFunction.inputs.map((input) => (
                    <div key={input.name} className="input-param">
                      <label>
                        {input.name} ({input.type}):
                      </label>
                      <input
                        type="text"
                        placeholder={`Enter ${input.type}`}
                        value={inputs[input.name] || ''}
                        onChange={(e) =>
                          handleInputChange(input.name, e.target.value)
                        }
                        className="input"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="helper-text">No parameters required</p>
              )}

              {selectedFunction.outputs.length > 0 && (
                <div className="function-outputs">
                  <p className="subheader">Return Types:</p>
                  {selectedFunction.outputs.map((output, idx) => (
                    <p key={idx} className="output-type">
                      {output.name || `output_${idx}`}: {output.type}
                    </p>
                  ))}
                </div>
              )}

              <button
                className={`btn ${selectedFunction.isReadOnly ? 'btn-info' : 'btn-warning'}`}
                onClick={executeFunction}
                disabled={loading}
              >
                {loading
                  ? 'Executing...'
                  : selectedFunction.isReadOnly
                    ? 'Call Function'
                    : 'Send Transaction'}
              </button>

              {output && (
                <div className="function-output">
                  <p className="subheader">Output:</p>
                  <pre>{output}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="contract-setup">
          <h3>⚠️ Contract Not Configured</h3>
          <p className="helper-text">
            The contract address needs to be configured before using this dApp.
          </p>
          <p className="helper-text">
            Update <code>CONTRACT_ADDRESS</code> in src/components/ContractFunctions.jsx with your deployed contract address.
          </p>
        </div>
      )}
    </div>
  );
};

export default ContractFunctions;

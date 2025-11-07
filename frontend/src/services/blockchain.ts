// Frontend blockchain service for real testnet deployments
import { ethers, BrowserProvider, JsonRpcProvider } from 'ethers';

// Helper to get the preferred EVM provider (MetaMask > others)
export function getPreferredEVMProvider(): any {
  if (typeof window === 'undefined') {
    throw new Error('Window is not available');
  }

  // Check if window.ethereum exists
  if (!window.ethereum) {
    throw new Error('No EVM wallet detected. Please install MetaMask or another EVM-compatible wallet.');
  }

  // If window.ethereum.providers exists (multiple wallets), prioritize MetaMask
  if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
    // Look for MetaMask first (isMetaMask flag)
    const metaMask = window.ethereum.providers.find((p: any) => p.isMetaMask);
    if (metaMask) {
      console.log('✅ Found MetaMask provider, using it');
      return metaMask;
    }
    // If no MetaMask, use the first provider
    console.log('⚠️ MetaMask not found, using first available provider');
    return window.ethereum.providers[0];
  }

  // Single provider - check if it's MetaMask or Phantom
  if (window.ethereum.isMetaMask) {
    console.log('✅ Using MetaMask provider');
    return window.ethereum;
  }

  // Check if it's Phantom (and warn user)
  if (window.ethereum.isPhantom) {
    console.warn('⚠️ Phantom wallet detected. MetaMask is recommended for EVM chains.');
    console.warn('   If you prefer MetaMask, please disable Phantom or install MetaMask.');
    return window.ethereum;
  }

  // Unknown provider, use it anyway
  console.log('⚠️ Using unknown provider');
  return window.ethereum;
}

export interface DeploymentConfig {
  chain: 'ethereum' | 'bsc' | 'base' | 'solana';
  tokenData: {
    name: string;
    symbol: string;
    decimals: number;
    initialSupply: string;
    metadataUri?: string;
  };
  curveData: {
    basePrice: string;
    slope: string;
    graduationThreshold: string;
    buyFeePercent: string;
    sellFeePercent: string;
  };
}

// Chain configurations for MetaMask
const CHAIN_CONFIGS = {
  ethereum: {
    chainId: '0xAA36A7', // 11155111 in hex
    chainName: 'Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
  bsc: {
    chainId: '0x61', // 97 in hex
    chainName: 'BSC Testnet',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-testnet.publicnode.com'],
    blockExplorerUrls: ['https://testnet.bscscan.com'],
  },
  base: {
    chainId: '0x14A34', // 84532 in hex
    chainName: 'Base Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://base-sepolia-rpc.publicnode.com'],
    blockExplorerUrls: ['https://sepolia-explorer.base.org'],
  },
};

// Testnet Factory Addresses (must be deployed first)
const FACTORY_ADDRESSES: Record<string, string> = {
  ethereum: import.meta.env.VITE_ETH_FACTORY || '',
  bsc: import.meta.env.VITE_BSC_FACTORY || '',
  base: import.meta.env.VITE_BASE_FACTORY || '',
};

// Token Factory ABI (createToken function)
const TOKEN_FACTORY_ABI = [
  'function createToken(string memory name, string memory symbol, uint256 initialSupply, string memory uri, uint256 basePrice, uint256 slope, uint256 graduationThreshold, uint256 buyFeePercent, uint256 sellFeePercent) external returns (address tokenAddress, address curveAddress)',
  'event TokenCreated(address indexed tokenAddress, address indexed creator, address indexed curveAddress, string name, string symbol)',
];

// Helper to check if an EVM wallet provider is available
function checkEVMWallet(): void {
  try {
    getPreferredEVMProvider();
  } catch (error: any) {
    throw new Error('No EVM wallet detected. Please install MetaMask, Phantom (EVM mode), or another EVM-compatible wallet to deploy tokens.');
  }
}

// Helper function to switch network
export async function switchNetwork(chain: 'ethereum' | 'bsc' | 'base'): Promise<void> {
  checkEVMWallet();
  const provider = getPreferredEVMProvider();
  const config = CHAIN_CONFIGS[chain];
  const chainIdHex = config.chainId;

  try {
    // Check if the chain is already connected
    const currentChainId = await provider.request({ method: 'eth_chainId' });
    
    if (currentChainId === chainIdHex) {
      console.log(`Already on ${chain} network`);
      return;
    }

    // Try to switch to the network
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      console.log(`Switched to ${chain} network`);
    } catch (switchError: any) {
      // If the chain doesn't exist, add it
      if (switchError.code === 4902 || switchError.code === -32603) {
        console.log(`Adding ${chain} network...`);
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [config],
        });
        console.log(`Added and switched to ${chain} network`);
      } else {
        throw switchError;
      }
    }
  } catch (error: any) {
    console.error(`Failed to switch to ${chain} network:`, error);
    throw new Error(`Failed to switch to ${chain} network: ${error.message || 'Unknown error'}`);
  }
}

export async function deployTokenOnEVM(
  chain: 'ethereum' | 'bsc' | 'base',
  config: DeploymentConfig
): Promise<{ tokenAddress: string; curveAddress: string; txHash: string }> {
  console.log(`🚀 Starting deployment to ${chain}...`);
  
  checkEVMWallet();

  const factoryAddress = FACTORY_ADDRESSES[chain];
  if (!factoryAddress || factoryAddress === '') {
    throw new Error(`Factory contract not deployed on ${chain}. Please deploy factory contracts first. Add VITE_${chain.toUpperCase()}_FACTORY to your .env file.`);
  }

  console.log(`📋 Factory address: ${factoryAddress}`);
  
  // Switch to the correct network first
  console.log(`🔄 Switching to ${chain} network...`);
  await switchNetwork(chain);
  
  // Give wallet a moment to switch networks
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log(`🔌 Connecting to provider...`);
  // Use preferred provider (MetaMask if available, otherwise first available)
  const ethereumProvider = getPreferredEVMProvider();
  
  // Warn if using Phantom
  if (ethereumProvider.isPhantom) {
    console.warn('⚠️ Using Phantom wallet for EVM. MetaMask is recommended for better compatibility.');
  }
  
  const provider = new BrowserProvider(ethereumProvider);
  
  // Verify factory contract exists BEFORE attempting to use it
  console.log(`🔍 Verifying factory contract exists at ${factoryAddress}...`);
  const code = await provider.getCode(factoryAddress);
  if (!code || code === '0x' || code === '0x0') {
    throw new Error(`❌ Factory contract not found at ${factoryAddress} on ${chain}.\n\nThis means the factory hasn't been deployed yet or the address is wrong.\n\nPlease deploy the TokenFactory contract first using:\n  npx hardhat run scripts/deploy.ts --network ${chain === 'ethereum' ? 'sepolia' : chain === 'bsc' ? 'bscTestnet' : 'baseSepolia'}\n\nThen update your frontend/.env file with the deployed address.`);
  }
  console.log(`✅ Factory contract verified (code length: ${code.length} bytes)`);
  
  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();
  console.log(`✅ Connected with address: ${signerAddress}`);
  
  // Connect to factory contract
  const factory = new ethers.Contract(factoryAddress, TOKEN_FACTORY_ABI, signer);
  
  // Try to call a view function to verify the contract is working
  try {
    const chainName = await factory.chainName();
    console.log(`✅ Factory contract is active on chain: ${chainName}`);
  } catch (err) {
    console.warn(`⚠️  Could not verify factory contract state, but code exists`);
  }
  console.log(`📋 Token data:`, config.tokenData);

  // Convert values to proper units
  // Contract expects initialSupply in base units (it multiplies by 10^18 internally)
  // So if user enters 1000000000, we pass 1000000000 and contract makes it 1000000000 * 10^18
  const initialSupply = BigInt(config.tokenData.initialSupply);
  const basePrice = ethers.parseEther(config.curveData.basePrice); // Convert ETH to wei
  const slope = ethers.parseEther(config.curveData.slope); // Convert ETH to wei
  // graduationThreshold is in USD, scale by 1e18 (not parseEther which treats it as ETH)
  const graduationThreshold = ethers.parseUnits(config.curveData.graduationThreshold, 18);
  const buyFeePercent = BigInt(config.curveData.buyFeePercent || '0');
  const sellFeePercent = BigInt(config.curveData.sellFeePercent || '0');
  
  // Validate parameters before sending
  if (initialSupply === BigInt(0)) {
    throw new Error('Initial supply cannot be zero');
  }
  if (basePrice === BigInt(0)) {
    throw new Error('Base price cannot be zero');
  }

  console.log(`📦 Initial supply: ${initialSupply.toString()}`);
  console.log(`💰 Base price: ${basePrice.toString()} wei`);
  console.log(`📈 Slope: ${slope.toString()} wei`);
  console.log(`🎯 Graduation threshold: ${graduationThreshold.toString()}`);

  // Estimate gas first to catch errors early
  console.log(`⛽ Estimating gas...`);
  console.log(`📋 Parameters:`, {
    name: config.tokenData.name,
    symbol: config.tokenData.symbol,
    initialSupply: initialSupply.toString(),
    basePrice: basePrice.toString(),
    slope: slope.toString(),
    graduationThreshold: graduationThreshold.toString(),
    buyFeePercent: buyFeePercent.toString(),
    sellFeePercent: sellFeePercent.toString(),
  });
  
  let gasEstimate;
  try {
    // First, let's try calling the function directly with callStatic to see if it would revert
    console.log(`🧪 Testing function call with callStatic...`);
    let staticCallSuccess = false;
    try {
      await factory.createToken.staticCall(
        config.tokenData.name,
        config.tokenData.symbol,
        initialSupply,
        config.tokenData.metadataUri || '',
        basePrice,
        slope,
        graduationThreshold,
        buyFeePercent,
        sellFeePercent
      );
      console.log(`✅ Static call successful - function should work!`);
      staticCallSuccess = true;
    } catch (staticCallError: any) {
      console.error(`❌ Static call failed:`, staticCallError);
      throw new Error(`❌ Function call would revert: ${staticCallError.reason || staticCallError.message}\n\nThis usually means:\n1. Contract function signature doesn't match\n2. Parameters are invalid\n3. Contract state is invalid\n\nPlease check the contract code and parameters.`);
    }
    
    // If static call succeeded, try gas estimation
    // If gas estimation fails but static call succeeded, use a generous default
    if (staticCallSuccess) {
      try {
        const populatedTx = await factory.createToken.populateTransaction(
          config.tokenData.name,
          config.tokenData.symbol,
          initialSupply,
          config.tokenData.metadataUri || '',
          basePrice,
          slope,
          graduationThreshold,
          buyFeePercent,
          sellFeePercent
        );
        
        // Try to estimate gas with a high gas limit override
        try {
          gasEstimate = await provider.estimateGas(populatedTx);
          console.log(`✅ Gas estimate: ${gasEstimate.toString()} gas units`);
        } catch (gasEstError: any) {
          // If gas estimation fails but static call succeeded, use a generous default
          // This handles cases where RPC nodes have issues with complex contract deployments
          console.warn(`⚠️  Gas estimation failed, but static call succeeded. Using default gas limit.`);
          console.warn(`   Gas estimation error:`, gasEstError.message);
          // Use a more generous gas limit for deploying token + bonding curve
          // Token deployment ~500k, BondingCurve deployment ~300k, transfers ~200k, overhead ~500k
          // With cross-chain token, add extra for CrossChainToken deployment ~400k
          gasEstimate = BigInt(3_000_000); // Increased to 3M for cross-chain tokens
          console.log(`📦 Using default gas limit: ${gasEstimate.toString()} gas units`);
        }
      } catch (populateError: any) {
        console.warn(`⚠️  Could not populate transaction, using default gas limit`);
        gasEstimate = BigInt(2_000_000); // Increased from 1.5M to 2M
      }
    }
  } catch (estimateError: any) {
    console.error(`❌ Gas estimation failed:`, estimateError);
    console.error(`❌ Error code:`, estimateError.code);
    console.error(`❌ Error data:`, estimateError.data);
    console.error(`❌ Error reason:`, estimateError.reason);
    console.error(`❌ Full error object:`, JSON.stringify(estimateError, null, 2));
    
    // Try to decode the revert reason
    let errorMessage = 'Transaction will revert';
    
    if (estimateError.data) {
      try {
        // Try to decode as a custom error
        const reason = factory.interface.parseError(estimateError.data);
        errorMessage = `Transaction will revert: ${reason.name}`;
        console.error(`Decoded error:`, reason);
      } catch (parseError) {
        // Try to decode as a string revert
        try {
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + estimateError.data.slice(10));
          errorMessage = `Transaction reverted: ${decoded[0]}`;
        } catch {
          // If it's a standard error, try to extract the selector
          const errorSelector = estimateError.data.slice(0, 10);
          console.error(`Error selector: ${errorSelector}`);
          
          // Common error selectors
          const errorMap: Record<string, string> = {
            '0x08c379a0': 'Error(string)',
            '0x4e487b71': 'Panic(uint256)',
          };
          
          if (errorMap[errorSelector]) {
            errorMessage = `Transaction reverted with ${errorMap[errorSelector]}`;
          }
        }
      }
    }
    
    // Handle "missing revert data" - usually means function doesn't exist or wrong ABI
    if (estimateError.message?.includes('missing revert data') || estimateError.data === null) {
      throw new Error(`❌ Cannot call createToken function on factory contract.\n\nPossible causes:\n1. Factory contract ABI doesn't match (wrong function signature)\n2. Factory contract doesn't have createToken function\n3. Contract address is wrong\n\nFactory address: ${factoryAddress}\nChain: ${chain}\n\nPlease verify:\n1. The factory was deployed correctly\n2. The ABI matches your contract\n3. The address in .env is correct for ${chain}`);
    }
    
    // Provide detailed error message
    throw new Error(`❌ ${errorMessage}\n\nFactory: ${factoryAddress}\nChain: ${chain}\n\nPlease check:\n1. Factory contract exists and is deployed\n2. Parameters are valid (initialSupply: ${initialSupply}, basePrice: ${ethers.formatEther(basePrice)} ETH)\n3. You have sufficient testnet tokens\n4. Function signature matches the contract`);
  }

  // Deploy token - THIS SHOULD TRIGGER METAMASK POPUP
  console.log(`📝 Calling createToken function - MetaMask should pop up now...`);
  console.log(`⛽ Using gas limit: ${gasEstimate.toString()}`);
  
  // Get current gas price to ensure transaction can be mined
  // Set minimum gas prices per chain (in Gwei)
  const MIN_GAS_PRICES: Record<string, bigint> = {
    ethereum: ethers.parseUnits('20', 'gwei'), // Sepolia: 20 Gwei
    bsc: ethers.parseUnits('3', 'gwei'), // BSC Testnet: 3 Gwei
    base: ethers.parseUnits('1', 'gwei'), // Base Sepolia: 1 Gwei
  };
  
  let feeData;
  try {
    feeData = await provider.getFeeData();
    const currentGasPrice = feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : 'unknown';
    console.log(`💰 Current gas price: ${currentGasPrice} Gwei`);
  } catch (feeError) {
    console.warn(`⚠️  Could not get fee data, using minimum defaults`);
  }
  
  try {
    // Build transaction options
    const txOptions: any = {
      gasLimit: gasEstimate, // Use our gas estimate (or default)
    };
    
    // Set gas price with minimum fallback
    const minGasPrice = MIN_GAS_PRICES[chain] || ethers.parseUnits('3', 'gwei');
    
    if (feeData?.gasPrice) {
      // Use the higher of current gas price or minimum
      txOptions.gasPrice = feeData.gasPrice > minGasPrice ? feeData.gasPrice : minGasPrice;
      console.log(`⛽ Using gas price: ${ethers.formatUnits(txOptions.gasPrice, 'gwei')} Gwei`);
    } else if (feeData?.maxFeePerGas && feeData?.maxPriorityFeePerGas) {
      // For EIP-1559 transactions, ensure maxFeePerGas is at least minimum
      const minMaxFee = feeData.maxFeePerGas > minGasPrice ? feeData.maxFeePerGas : minGasPrice;
      txOptions.maxFeePerGas = minMaxFee;
      txOptions.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
      console.log(`⛽ Using maxFeePerGas: ${ethers.formatUnits(txOptions.maxFeePerGas, 'gwei')} Gwei`);
    } else {
      // Fallback to minimum gas price
      txOptions.gasPrice = minGasPrice;
      console.log(`⛽ Using minimum gas price: ${ethers.formatUnits(txOptions.gasPrice, 'gwei')} Gwei`);
    }
    
    console.log(`📋 Transaction options:`, {
      gasLimit: txOptions.gasLimit.toString(),
      gasPrice: txOptions.gasPrice ? ethers.formatUnits(txOptions.gasPrice, 'gwei') + ' Gwei' : undefined,
      maxFeePerGas: txOptions.maxFeePerGas ? ethers.formatUnits(txOptions.maxFeePerGas, 'gwei') + ' Gwei' : undefined,
    });
    
    // Log transaction details before sending
    console.log(`📋 Transaction details:`);
    console.log(`   To: ${factoryAddress}`);
    console.log(`   From: ${signerAddress}`);
    console.log(`   Gas Limit: ${gasEstimate.toString()}`);
    console.log(`   Gas Price: ${txOptions.gasPrice ? ethers.formatUnits(txOptions.gasPrice, 'gwei') : 'auto'} Gwei`);
    
    // Build the function call manually to verify encoding
    const functionData = factory.interface.encodeFunctionData('createToken', [
      config.tokenData.name,
      config.tokenData.symbol,
      initialSupply,
      config.tokenData.metadataUri || '',
      basePrice,
      slope,
      graduationThreshold,
      buyFeePercent,
      sellFeePercent,
    ]);
    console.log(`📋 Function data length: ${functionData.length} bytes`);
    console.log(`📋 Function selector: ${functionData.slice(0, 10)}`);
    
    // Use the gas estimate we got (or default if estimation failed)
    // Increase gas limit by 20% to account for variations
    const adjustedGasLimit = (gasEstimate * BigInt(120)) / BigInt(100);
    txOptions.gasLimit = adjustedGasLimit;
    console.log(`⛽ Adjusted gas limit: ${adjustedGasLimit.toString()} (20% buffer added)`);
    
    const createTx = await factory.createToken(
      config.tokenData.name,
      config.tokenData.symbol,
      initialSupply,
      config.tokenData.metadataUri || '',
      basePrice,
      slope,
      graduationThreshold,
      buyFeePercent,
      sellFeePercent,
      txOptions
    );
    console.log(`✅ Transaction sent! Hash: ${createTx.hash}`);
    console.log(`📋 Transaction data: ${createTx.data.substring(0, 100)}...`);
    console.log(`⏳ Waiting for confirmation...`);
    
    let receipt;
    try {
      receipt = await createTx.wait();
      console.log(`✅ Transaction confirmed! Block: ${receipt.blockNumber}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()} / ${adjustedGasLimit.toString()}`);
    } catch (waitError: any) {
      console.error(`❌ Transaction failed while waiting for confirmation:`, waitError);
      
      // Try to get the revert reason from the transaction receipt
      try {
        const txReceipt = await provider.getTransactionReceipt(createTx.hash);
        if (txReceipt && txReceipt.status === 0) {
          // Transaction was mined but reverted
          console.error(`❌ Transaction reverted in block ${txReceipt.blockNumber}`);
          console.error(`⛽ Gas used: ${txReceipt.gasUsed.toString()} / ${txReceipt.gasUsed === adjustedGasLimit ? 'LIMIT HIT!' : adjustedGasLimit.toString()}`);
          
          // Check if we hit the gas limit
          if (BigInt(txReceipt.gasUsed.toString()) >= adjustedGasLimit * BigInt(95) / BigInt(100)) {
            throw new Error(`Transaction reverted due to insufficient gas. Gas used: ${txReceipt.gasUsed.toString()}, Limit: ${adjustedGasLimit.toString()}. The contract deployment may be too complex or the gas limit needs to be increased.`);
          }
          
          // Try to decode the revert reason using call simulation
          try {
            const callResult = await provider.call({
              to: factoryAddress,
              data: functionData,
              from: signerAddress,
            });
            console.error(`❌ Call result: ${callResult}`);
            
            // Try to decode as a revert reason
            if (callResult && callResult !== '0x') {
              // Check if it's a standard revert with reason
              if (callResult.length > 138) {
                try {
                  const reason = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + callResult.slice(138));
                  throw new Error(`Transaction reverted: ${reason[0]}`);
                } catch {
                  // Not a string revert, try other formats
                }
              }
            }
          } catch (callError: any) {
            console.error(`❌ Could not decode revert reason:`, callError.message);
          }
        }
      } catch (receiptError) {
        console.error(`❌ Could not fetch receipt:`, receiptError);
      }
      
      throw new Error(`Transaction failed: ${waitError.reason || waitError.message || 'Unknown error'}`);
    }
    
    // Get token and curve addresses from event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed?.name === 'TokenCreated';
      } catch {
        return false;
      }
    });

    if (!event) {
      throw new Error('TokenCreated event not found in transaction receipt');
    }

    const parsed = factory.interface.parseLog(event);
    const tokenAddress = parsed?.args.tokenAddress;
    const curveAddress = parsed?.args.curveAddress;
    
    console.log(`✅ Token deployed at: ${tokenAddress}`);
    console.log(`✅ Bonding curve deployed at: ${curveAddress}`);

    return {
      tokenAddress,
      curveAddress,
      txHash: receipt.hash,
    };
  } catch (error: any) {
    console.error(`❌ Transaction failed:`, error);
    console.error(`❌ Error code:`, error.code);
    console.error(`❌ Error message:`, error.message);
    console.error(`❌ Error data:`, error.data);
    console.error(`❌ Full error:`, JSON.stringify(error, null, 2));
    
    // Handle user rejection
    if (error.code === 'ACTION_REJECTED' || error.code === 4001 || error.message?.includes('user rejected')) {
      throw new Error('Transaction rejected by user');
    }
    
    // Handle insufficient funds
    if (error.code === 'INSUFFICIENT_FUNDS' || error.message?.includes('insufficient funds')) {
      throw new Error('Insufficient funds for gas fees. Please add testnet tokens to your wallet.');
    }
    
    // Try to decode revert reason
    let errorMessage = 'Transaction failed';
    if (error.data) {
      try {
        // Try to decode the error data
        const reason = factory.interface.parseError(error.data);
        errorMessage = `Transaction reverted: ${reason.name}`;
      } catch (decodeError) {
        // If we can't decode, try to get more info from the error
        if (error.data && typeof error.data === 'string') {
          if (error.data.startsWith('0x')) {
            errorMessage = `Transaction reverted with error code: ${error.data.substring(0, 10)}...`;
          } else {
            errorMessage = `Transaction failed: ${error.data}`;
          }
        }
      }
    }
    
    // Check for common revert reasons
    if (error.message?.includes('execution reverted')) {
      errorMessage = `Transaction reverted. This usually means:\n1. Factory contract may not be deployed at ${factoryAddress}\n2. Invalid parameters\n3. Insufficient gas\n\nCheck the factory address in your .env file (VITE_${chain.toUpperCase()}_FACTORY)`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
}

export function getTestnetInfo(chain: string) {
  const testnets = {
    ethereum: {
      name: 'Sepolia',
      explorer: 'https://sepolia.etherscan.io',
      rpc: 'https://ethereum-sepolia-rpc.publicnode.com',
    },
    bsc: {
      name: 'BSC Testnet',
      explorer: 'https://testnet.bscscan.com',
      rpc: 'https://bsc-testnet.publicnode.com',
    },
    base: {
      name: 'Base Sepolia',
      explorer: 'https://sepolia-explorer.base.org',
      rpc: 'https://base-sepolia-rpc.publicnode.com',
    },
    solana: {
      name: 'Solana Devnet',
      explorer: 'https://explorer.solana.com/?cluster=devnet',
      rpc: 'https://api.devnet.solana.com',
    },
  };

  return testnets[chain as keyof typeof testnets] || testnets.ethereum;
}

// Declare window.ethereum for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}


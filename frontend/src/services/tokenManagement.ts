// Frontend service for token management actions (mint, burn, pause, etc.)
import { ethers, BrowserProvider } from 'ethers';
import { switchNetwork, getPreferredEVMProvider } from './blockchain';

// ERC20 Standard ABI
const ERC20_ABI = [
  'function mint(address to, uint256 amount) external',
  'function burn(uint256 amount) external',
  'function pause() external',
  'function unpause() external',
  'function owner() external view returns (address)',
  'function balanceOf(address account) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
];

// Platform fee collector address (should be set via env)
const PLATFORM_FEE_ADDRESS = import.meta.env.VITE_PLATFORM_FEE_ADDRESS || '0x0000000000000000000000000000000000000000';

interface MintParams {
  tokenAddress: string;
  to: string;
  amount: string;
  chain: 'ethereum' | 'bsc' | 'base';
  platformFeePercent?: number; // Percentage of tokens to send as platform fee (e.g., 0.1 = 0.1%)
}

interface BurnParams {
  tokenAddress: string;
  amount: string;
  chain: 'ethereum' | 'bsc' | 'base';
}

interface PauseParams {
  tokenAddress: string;
  paused: boolean;
  chain: 'ethereum' | 'bsc' | 'base';
}

/**
 * Mint tokens to an address (only if token is mintable)
 * Collects platform fee if enabled
 */
export async function mintTokens(params: MintParams): Promise<{ txHash: string; platformFeeAmount?: string }> {
  const { tokenAddress, to, amount, chain, platformFeePercent = 0 } = params;

  // Switch to correct network
  await switchNetwork(chain);

  // Get provider and signer (prefer MetaMask over Phantom)
  const ethereumProvider = getPreferredEVMProvider();
  const provider = new BrowserProvider(ethereumProvider);
  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();

  // Connect to token contract
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

  // Verify signer is owner
  const owner = await tokenContract.owner();
  if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
    throw new Error('Only token owner can mint tokens');
  }

  // Get token decimals
  let decimals = 18; // Default
  try {
    decimals = await tokenContract.decimals();
  } catch {
    // If decimals() fails, assume 18
  }

  const amountWei = ethers.parseUnits(amount, decimals);

  let platformFeeAmount: bigint | undefined;
  let mintAmount = amountWei;

  // Calculate platform fee if enabled
  if (platformFeePercent > 0 && PLATFORM_FEE_ADDRESS !== '0x0000000000000000000000000000000000000000') {
    platformFeeAmount = (amountWei * BigInt(Math.floor(platformFeePercent * 100))) / BigInt(10000);
    mintAmount = amountWei + platformFeeAmount; // Mint extra for platform fee
  }

  // If platform fee, mint to platform first, then to recipient
  if (platformFeeAmount && platformFeeAmount > 0) {
    // Mint total amount (recipient + fee) to contract, then transfer fee
    const tx = await tokenContract.mint(signerAddress, mintAmount);
    await tx.wait();
    
      // Transfer platform fee
      const feeTx = await tokenContract.transfer(PLATFORM_FEE_ADDRESS, platformFeeAmount);
      await feeTx.wait();
      
      // Transfer to recipient
      const recipientTx = await tokenContract.transfer(to, amountWei);
      await recipientTx.wait();

      return {
        txHash: tx.hash,
        platformFeeAmount: ethers.formatUnits(platformFeeAmount, decimals),
      };
  } else {
    // Simple mint without platform fee
    const tx = await tokenContract.mint(to, amountWei);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  }
}

/**
 * Burn tokens from caller's balance
 */
export async function burnTokens(params: BurnParams): Promise<{ txHash: string }> {
  const { tokenAddress, amount, chain } = params;

  await switchNetwork(chain);

  // Get provider and signer (prefer MetaMask over Phantom)
  const ethereumProvider = getPreferredEVMProvider();
  const provider = new BrowserProvider(ethereumProvider);
  const signer = await provider.getSigner();

  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  
  // Get token decimals
  let decimals = 18; // Default
  try {
    decimals = await tokenContract.decimals();
  } catch {
    // If decimals() fails, assume 18
  }
  
  const amountWei = ethers.parseUnits(amount, decimals);

  // Check balance
  const balance = await tokenContract.balanceOf(await signer.getAddress());
  if (balance < amountWei) {
    throw new Error('Insufficient balance to burn');
  }

  const tx = await tokenContract.burn(amountWei);
  const receipt = await tx.wait();

  return { txHash: receipt.hash };
}

/**
 * Pause or unpause token transfers
 */
export async function pauseToken(params: PauseParams): Promise<{ txHash: string }> {
  const { tokenAddress, paused, chain } = params;

  await switchNetwork(chain);

  // Get provider and signer (prefer MetaMask over Phantom)
  const ethereumProvider = getPreferredEVMProvider();
  const provider = new BrowserProvider(ethereumProvider);
  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();

  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

  // Verify signer is owner
  const owner = await tokenContract.owner();
  if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
    throw new Error('Only token owner can pause/unpause');
  }

  const tx = paused ? await tokenContract.pause() : await tokenContract.unpause();
  const receipt = await tx.wait();

  return { txHash: receipt.hash };
}

interface UpdateFeesParams {
  bondingCurveAddress: string;
  buyFeePercent: number;
  sellFeePercent: number;
  chain: 'ethereum' | 'bsc' | 'base';
}

/**
 * Update buy/sell fees on bonding curve
 */
export async function updateBondingCurveFees(params: UpdateFeesParams): Promise<{ txHash: string }> {
  const { bondingCurveAddress, buyFeePercent, sellFeePercent, chain } = params;

  await switchNetwork(chain);

  // Get provider and signer (prefer MetaMask over Phantom)
  const ethereumProvider = getPreferredEVMProvider();
  const provider = new BrowserProvider(ethereumProvider);
  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();

  // BondingCurve ABI for setFees function
  const BONDING_CURVE_ABI = [
    'function owner() external view returns (address)',
    'function setFees(uint256 _buyFeePercent, uint256 _sellFeePercent) external',
    'function buyFeePercent() external view returns (uint256)',
    'function sellFeePercent() external view returns (uint256)',
  ];

  const bondingCurve = new ethers.Contract(bondingCurveAddress, BONDING_CURVE_ABI, signer);

  // Verify signer is owner
  const owner = await bondingCurve.owner();
  if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
    throw new Error('Only bonding curve owner can update fees');
  }

  // Convert percentage to basis points (e.g., 1% = 100, 0.1% = 10)
  const buyFeeBP = BigInt(Math.floor(buyFeePercent * 100));
  const sellFeeBP = BigInt(Math.floor(sellFeePercent * 100));

  // Validate fees (max 10% = 1000 basis points)
  if (buyFeeBP > BigInt(1000)) {
    throw new Error('Buy fee cannot exceed 10%');
  }
  if (sellFeeBP > BigInt(1000)) {
    throw new Error('Sell fee cannot exceed 10%');
  }

  const tx = await bondingCurve.setFees(buyFeeBP, sellFeeBP);
  const receipt = await tx.wait();

  return { txHash: receipt.hash };
}


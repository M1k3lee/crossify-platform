import * as dotenv from "dotenv";

dotenv.config();

/**
 * Get bonding curve addresses for a token from the API
 * 
 * Usage:
 *   TOKEN_ID=9ed6d4f6-02bc-4c3e-8b48-dab785d4d9af npx ts-node scripts/get-token-curve-addresses.ts
 */
async function main() {
  const tokenId = process.env.TOKEN_ID || '9ed6d4f6-02bc-4c3e-8b48-dab785d4d9af';
  const apiBase = process.env.API_BASE || 'https://crossify-platform-production.up.railway.app/api';

  console.log(`\n🔍 Fetching curve addresses for token: ${tokenId}\n`);
  console.log(`API Base: ${apiBase}\n`);

  try {
    const response = await fetch(`${apiBase}/tokens/${tokenId}`);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    if (!data.deployments || data.deployments.length === 0) {
      console.log('❌ No deployments found for this token');
      process.exit(1);
    }

    console.log('📊 Deployments found:\n');
    
    const curveAddresses: Record<string, string> = {};

    for (const dep of data.deployments) {
      const chain = dep.chain || 'unknown';
      const curveAddress = dep.curveAddress || dep.curve_address || null;
      
      console.log(`   ${chain}:`);
      console.log(`     Curve Address: ${curveAddress || '❌ Not found'}`);
      
      if (curveAddress) {
        // Normalize chain name
        let normalizedChain = chain.toLowerCase();
        if (normalizedChain.includes('base-sepolia') || normalizedChain.includes('base')) {
          normalizedChain = 'base-sepolia';
        } else if (normalizedChain.includes('bsc-testnet') || normalizedChain.includes('bsc')) {
          normalizedChain = 'bsc-testnet';
        } else if (normalizedChain.includes('sepolia') || normalizedChain.includes('ethereum')) {
          normalizedChain = 'sepolia';
        }
        
        curveAddresses[normalizedChain] = curveAddress;
      }
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60) + '\n');

    if (curveAddresses['base-sepolia']) {
      console.log(`✅ Base Sepolia: ${curveAddresses['base-sepolia']}`);
    } else {
      console.log(`❌ Base Sepolia: Not found`);
    }

    if (curveAddresses['bsc-testnet']) {
      console.log(`✅ BSC Testnet: ${curveAddresses['bsc-testnet']}`);
    } else {
      console.log(`❌ BSC Testnet: Not found`);
    }

    if (curveAddresses['sepolia']) {
      console.log(`✅ Sepolia: ${curveAddresses['sepolia']}`);
    } else {
      console.log(`❌ Sepolia: Not found`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION COMMANDS');
    console.log('='.repeat(60) + '\n');

    if (curveAddresses['base-sepolia']) {
      console.log('# Base Sepolia:');
      console.log(`CURVE_ADDRESS=${curveAddresses['base-sepolia']} npx hardhat run scripts/verify-bonding-curve-config.ts --network baseSepolia\n`);
    }

    if (curveAddresses['bsc-testnet']) {
      console.log('# BSC Testnet:');
      console.log(`CURVE_ADDRESS=${curveAddresses['bsc-testnet']} npx hardhat run scripts/verify-bonding-curve-config.ts --network bscTestnet\n`);
    }

    if (curveAddresses['sepolia']) {
      console.log('# Sepolia:');
      console.log(`CURVE_ADDRESS=${curveAddresses['sepolia']} npx hardhat run scripts/verify-bonding-curve-config.ts --network sepolia\n`);
    }

  } catch (error: any) {
    console.error('❌ Error fetching token data:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();


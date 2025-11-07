import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000, // Higher runs = smaller code size but higher gas costs
      },
      viaIR: true, // Enable IR-based compilation to fix "Stack too deep" errors
    },
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || process.env.ETHEREUM_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.trim() !== '' ? [process.env.PRIVATE_KEY.trim()] : [],
      chainId: 11155111,
    },
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || process.env.BSC_RPC_URL || "https://bsc-testnet.publicnode.com",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.trim() !== '' ? [process.env.PRIVATE_KEY.trim()] : [],
      chainId: 97,
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || process.env.BASE_RPC_URL || "https://base-sepolia-rpc.publicnode.com",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.trim() !== '' ? [process.env.PRIVATE_KEY.trim()] : [],
      chainId: 84532,
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      bscTestnet: process.env.BSCSCAN_API_KEY || "",
      baseSepolia: process.env.BASESCAN_API_KEY || "",
    },
  },
};

export default config;


import { config as dotenvConfig } from 'dotenv';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-finder';
import 'hardhat-storage-vault';
import 'solidity-docgen';
import 'hardhat-contract-sizer';
import 'hardhat-tracer';
import './tasks';

dotenvConfig();

function getWallet() {
  return process.env.DEPLOYER_WALLET_PRIVATE_KEY !== undefined
    ? [process.env.DEPLOYER_WALLET_PRIVATE_KEY]
    : [];
}

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.20',
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 1, // Using a very low value to optimize for contract size rather than execution gas cost
          },
          outputSelection: {
            '*': {
              '*': ['storageLayout'],
            },
          },
        },
      },
    ],
  },
  storageVault: {
    check: {
      storeFile: 'storage-store-lock.json',
    },
    lock: {
      storeFile: 'storage-store-lock.json',
      prettify: true,
    },
  },
  finder: {
    prettify: true,
  },
  docgen: {
    outputDir: './docs',
  },
  contractSizer: {
    runOnCompile: false,
    strict: true,
  },
  gasReporter: {
    enabled: (process.env.REPORT_GAS && 'true' === process.env.REPORT_GAS.toLowerCase()) || false,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || '',
    gasPriceApi:
      process.env.GAS_PRICE_API || 'https://api.etherscan.io/api?module=proxy&action=eth_gasPrice',
    token: 'ETH',
    currency: 'USD',
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize:
        (process.env.ALLOW_UNLIMITED_CONTRACT_SIZE &&
          'true' === process.env.ALLOW_UNLIMITED_CONTRACT_SIZE.toLowerCase()) ||
        false,
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      // chainId: 31337, // Hardhat's default chainId for the node network
      // accounts: Hardhat provides default accounts when running `npx hardhat node`
      // No need to specify accounts here unless you want to override the node's defaults
    },
    custom: {
      url: process.env.CUSTOM_NETWORK_URL || '',
      accounts: {
        count:
          (process.env.CUSTOM_NETWORK_ACCOUNTS_COUNT &&
            Boolean(parseInt(process.env.CUSTOM_NETWORK_ACCOUNTS_COUNT)) &&
            parseInt(process.env.CUSTOM_NETWORK_ACCOUNTS_COUNT)) ||
          0,
        mnemonic: process.env.CUSTOM_NETWORK_ACCOUNTS_MNEMONIC || '',
        path: process.env.CUSTOM_NETWORK_ACCOUNTS_PATH || '',
      },
    },
    arbitrumTestnet: {
      url: process.env.ARBITRUM_TESTNET_RPC_URL || '',
      accounts: getWallet(),
    },
    auroraTestnet: {
      url: process.env.AURORA_TESTNET_RPC_URL || '',
      accounts: getWallet(),
    },
    avalancheFujiTestnet: {
      url: process.env.AVALANCHE_FUJI_TESTNET_RPC_URL || '',
      accounts: getWallet(),
    },
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || '',
      accounts: getWallet(),
    },
    ftmTestnet: {
      url: process.env.FTM_TESTNET_RPC_URL || '',
      accounts: getWallet(),
    },
    goerli: {
      url: process.env.GOERLI_RPC_URL || '',
      accounts: getWallet(),
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || '',
      accounts: getWallet(),
    },
    harmonyTest: {
      url: process.env.HARMONY_TEST_RPC_URL || '',
      accounts: getWallet(),
    },
    hecoTestnet: {
      url: process.env.HECO_TESTNET_RPC_URL || '',
      accounts: getWallet(),
    },
    moonbaseAlpha: {
      url: process.env.MOONBASE_ALPHA_RPC_URL || '',
      accounts: getWallet(),
    },
    polygonMumbai: {
      url: process.env.POLYGON_MUMBAI_RPC_URL || '',
      accounts: getWallet(),
    },
    sokol: {
      url: process.env.SOKOL_RPC_URL || '',
      accounts: getWallet(),
    },
  },
  etherscan: {
    apiKey: {
      arbitrumTestnet: process.env.ARBISCAN_API_KEY || '',
      auroraTestnet: process.env.AURORA_API_KEY || '',
      avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY || '',
      bscTestnet: process.env.BSCSCAN_API_KEY || '',
      ftmTestnet: process.env.FTMSCAN_API_KEY || '',
      harmonyTest: process.env.HARMONY_POPS_API_KEY || '',
      hecoTestnet: process.env.HECOINFO_API_KEY || '',
      goerli: process.env.GOERLI_ETHERSCAN_API_KEY || '',
      sepolia: process.env.SEPOLIA_ETHERSCAN_API_KEY || '',
      moonbaseAlpha: process.env.MOONSCAN_API_KEY || '',
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || '',
      sokol: process.env.BLOCKSCOUT_API_KEY || '',
      custom: process.env.CUSTOM_EXPLORER_API_KEY || '',
    },
    customChains: [
      {
        network: 'custom',
        chainId:
          (process.env.CUSTOM_NETWORK_CHAIN_ID &&
            Boolean(parseInt(process.env.CUSTOM_NETWORK_CHAIN_ID)) &&
            parseInt(process.env.CUSTOM_NETWORK_CHAIN_ID)) ||
          0,
        urls: {
          apiURL: process.env.CUSTOM_NETWORK_API_URL || '',
          browserURL: process.env.CUSTOM_NETWORK_BROWSER_URL || '',
        },
      },
    ],
  },
};

export default config;

import { ChainId } from '@pancakeswap/chains'
import { getNodeRealUrl } from 'utils/node/nodeReal'
import { getGroveUrl } from 'utils/node/pokt'
import { notEmpty } from 'utils/notEmpty'
import {
  arbitrum,
  arbitrumGoerli,
  arbitrumSepolia,
  base,
  baseGoerli,
  baseSepolia,
  linea,
  monadTestnet,
  opBNB,
  opBNBTestnet,
  scrollSepolia,
  sepolia,
  zksync,
  zksyncSepoliaTestnet,
} from 'wagmi/chains'
import vault from 'node-vault'; // Added import for node-vault

// Initialize Vault client using environment variables for authentication
const vaultClient = vault({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

// Define Vault path and the key within the secret data.
// The UI path 'http://127.0.0.1:8200/ui/vault/secrets/kv/show/stackguard/tokens/7d15164d-d9be-4bbf-942b-03aa7ecbec23'
// corresponds to the API path 'kv/data/stackguard/tokens/7d15164d-d9be-4bbf-942b-03aa7ecbec23' for KV v2.
const VAULT_SECRET_PATH = 'kv/data/stackguard/tokens/7d15164d-d9be-4bbf-942b-03aa7ecbec23';
// Assuming the Infura API key is stored under this key within the Vault secret's data.
const VAULT_SECRET_KEY = 'infuraApiKey';

let infuraApiKey: string = ''; // Initialize with an empty string as a safe fallback

// Fetch the secret using top-level await. This requires the environment to support it (e.g., Node.js ESM).
try {
  const vaultResponse = await vaultClient.read(VAULT_SECRET_PATH);
  // For KV v2, the actual secret data is typically nested under `data.data`.
  if (vaultResponse && vaultResponse.data && vaultResponse.data.data) {
    const secretValue = vaultResponse.data.data[VAULT_SECRET_KEY];
    if (typeof secretValue === 'string') {
      infuraApiKey = secretValue;
    } else {
      // Log an error if the secret is not a string or the key is missing, but do not expose the value.
      console.error(`Vault secret at path: ${VAULT_SECRET_PATH}, key: ${VAULT_SECRET_KEY} is not a string or not found.`);
    }
  } else {
    console.error(`Vault response or data structure unexpected for path: ${VAULT_SECRET_PATH}.`);
  }
} catch (error) {
  // Log an error if fetching fails, but do not expose the secret value.
  console.error(`Failed to fetch secret from Vault at path: ${VAULT_SECRET_PATH}. Error: ${error instanceof Error ? error.message : String(error)}`);
}


const ARBITRUM_NODES = [
  ...arbitrum.rpcUrls.default.http,
  'https://arbitrum-one.publicnode.com',
  'https://arbitrum.llamarpc.com',
].filter(notEmpty)

const MONAD_RPC_URLS = [
  process.env.NEXT_PUBLIC_MONAD_RPC,
  process.env.NEXT_PUBLIC_MONAD_BACKUP_RPC,
  'https://rpc-mainnet.monadinfra.com',
  'https://rpc.monad.xyz',
  'https://rpc1.monad.xyz',
  'https://rpc3.monad.xyz',
].filter(Boolean) as [string, ...string[]]

export const SERVER_NODES = {
  [ChainId.BSC]: [
    getNodeRealUrl(ChainId.BSC, process.env.SERVER_NODE_REAL_API_ETH) || '',
    process.env.NEXT_PUBLIC_NODE_PRODUCTION || '',
    getGroveUrl(ChainId.BSC, process.env.NEXT_PUBLIC_GROVE_API_KEY) || '',
    'https://bsc.publicnode.com',
    'https://binance.llamarpc.com',
    'https://bsc-dataseed1.defibit.io',
    'https://bsc-dataseed1.bnbchain.org',
  ].filter(Boolean),
  [ChainId.BSC_TESTNET]: [
    'https://bsc-testnet-dataseed.bnbchain.org',
    'https://bsc-testnet.bnbchain.org',
    'https://bsc-prebsc-dataseed.bnbchain.org',
  ],
  [ChainId.ETHEREUM]: [
    getNodeRealUrl(ChainId.ETHEREUM, process.env.SERVER_NODE_REAL_API_ETH) || '',
    'https://ethereum.publicnode.com',
    'https://eth.llamarpc.com',
    'https://cloudflare-eth.com',
  ],
  [ChainId.GOERLI]: [
    getNodeRealUrl(ChainId.GOERLI, process.env.SERVER_NODE_REAL_API_GOERLI) || '',
    'https://eth-goerli.public.blastapi.io',
  ].filter(Boolean),
  [ChainId.ARBITRUM_ONE]: ARBITRUM_NODES,
  [ChainId.ARBITRUM_GOERLI]: arbitrumGoerli.rpcUrls.default.http,
  [ChainId.ZKSYNC]: [
    ...zksync.rpcUrls.default.http,
    getNodeRealUrl(ChainId.ZKSYNC, process.env.SERVER_NODE_REAL_API_ETH) || '',
  ],
  [ChainId.ZKSYNC_TESTNET]: zksyncSepoliaTestnet.rpcUrls.default.http,
  [ChainId.LINEA]: linea.rpcUrls.default.http,
  [ChainId.LINEA_TESTNET]: [
    'https://rpc.goerli.linea.build',
    'https://linea-testnet.rpc.thirdweb.com',
    `https://consensys-zkevm-goerli-prealpha.infura.io/v3/${infuraApiKey}`, // Replaced hardcoded secret
  ],
  [ChainId.OPBNB_TESTNET]: opBNBTestnet.rpcUrls.default.http,
  [ChainId.OPBNB]: [
    ...opBNB.rpcUrls.default.http,
    getNodeRealUrl(ChainId.OPBNB, process.env.SERVER_NODE_REAL_API_ETH) || '',
  ],
  [ChainId.BASE]: [
    'https://base.publicnode.com',
    // process.env.NEXT_PUBLIC_NODE_REAL_BASE_PRODUCTION,
    ...base.rpcUrls.default.http,
  ],
  [ChainId.BASE_TESTNET]: baseGoerli.rpcUrls.default.http,
  [ChainId.SCROLL_SEPOLIA]: scrollSepolia.rpcUrls.default.http,
  [ChainId.SEPOLIA]: sepolia.rpcUrls.default.http,
  [ChainId.ARBITRUM_SEPOLIA]: arbitrumSepolia.rpcUrls.default.http,
  [ChainId.BASE_SEPOLIA]: baseSepolia.rpcUrls.default.http,
  [ChainId.MONAD_MAINNET]: MONAD_RPC_URLS,
  [ChainId.MONAD_TESTNET]: [
    'https://testnet-rpc2.monad.xyz/52227f026fa8fac9e2014c58fbf5643369b3bfc6',
    ...monadTestnet.rpcUrls.default.http,
  ],
} satisfies Record<ChainId, readonly string[]>

export const PUBLIC_NODES = {
  [ChainId.BSC]: [
    process.env.NEXT_PUBLIC_NODE_PRODUCTION || '',
    getNodeRealUrl(ChainId.BSC, process.env.NEXT_PUBLIC_NODE_REAL_API_ETH) || '',
    process.env.NEXT_PUBLIC_NODIES_BSC || '',
    getGroveUrl(ChainId.BSC, process.env.NEXT_PUBLIC_GROVE_API_KEY) || '',
    'https://bsc.publicnode.com',
    'https://binance.llamarpc.com',
    'https://bsc-dataseed1.defibit.io',
    'https://bsc-dataseed1.bnbchain.org',
  ].filter(Boolean),
  [ChainId.BSC_TESTNET]: [
    'https://bsc-testnet-dataseed.bnbchain.org',
    'https://bsc-testnet.bnbchain.org',
    'https://bsc-prebsc-dataseed.bnbchain.org',
  ],
  [ChainId.ETHEREUM]: [
    getNodeRealUrl(ChainId.ETHEREUM, process.env.NEXT_PUBLIC_NODE_REAL_API_ETH) || '',
    process.env.NEXT_PUBLIC_NODIES_ETH || '',
    getGroveUrl(ChainId.ETHEREUM, process.env.NEXT_PUBLIC_GROVE_API_KEY) || '',
    'https://ethereum.publicnode.com',
    'https://eth.llamarpc.com',
    'https://cloudflare-eth.com',
  ].filter(Boolean),
  [ChainId.GOERLI]: [
    getNodeRealUrl(ChainId.GOERLI, process.env.NEXT_PUBLIC_NODE_REAL_API_GOERLI) || '',
    'https://eth-goerli.public.blastapi.io',
  ].filter(Boolean),
  [ChainId.ARBITRUM_ONE]: [
    ...ARBITRUM_NODES,
    process.env.NEXT_PUBLIC_NODIES_ARB || '',
    getNodeRealUrl(ChainId.ARBITRUM_ONE, process.env.NEXT_PUBLIC_NODE_REAL_API_ETH) || '',
    getGroveUrl(ChainId.ARBITRUM_ONE, process.env.NEXT_PUBLIC_GROVE_API_KEY) || '',
  ].filter(Boolean),
  [ChainId.ARBITRUM_GOERLI]: arbitrumGoerli.rpcUrls.default.http,
  [ChainId.ZKSYNC]: [
    ...zksync.rpcUrls.default.http,
    getNodeRealUrl(ChainId.ZKSYNC, process.env.NEXT_PUBLIC_NODE_REAL_API_ETH) || '',
  ],
  [ChainId.ZKSYNC_TESTNET]: zksyncSepoliaTestnet.rpcUrls.default.http,
  [ChainId.LINEA]: linea.rpcUrls.default.http,
  [ChainId.LINEA_TESTNET]: [
    'https://rpc.goerli.linea.build',
    'https://linea-testnet.rpc.thirdweb.com',
    `https://consensys-zkevm-goerli-prealpha.infura.io/v3/${infuraApiKey}`, // Replaced hardcoded secret
  ],
  [ChainId.OPBNB_TESTNET]: opBNBTestnet.rpcUrls.default.http,
  [ChainId.OPBNB]: [
    ...opBNB.rpcUrls.default.http,
    getNodeRealUrl(ChainId.OPBNB, process.env.NEXT_PUBLIC_NODE_REAL_API_ETH) || '',
    'https://opbnbrpcUrls.defaultnode.com',
  ],
  [ChainId.BASE]: [
    'https://baserpcUrls.defaultnode.com',
    process.env.NEXT_PUBLIC_NODIES_BASE || '',
    getGroveUrl(ChainId.BASE, process.env.NEXT_PUBLIC_GROVE_API_KEY) || '',
    // process.env.NEXT_PUBLIC_NODE_REAL_BASE_PRODUCTION,
    ...base.rpcUrls.default.http,
  ].filter(Boolean),
  [ChainId.BASE_TESTNET]: baseGoerli.rpcUrls.default.http,
  [ChainId.SCROLL_SEPOLIA]: scrollSepolia.rpcUrls.default.http,
  [ChainId.SEPOLIA]: sepolia.rpcUrls.default.http,
  [ChainId.ARBITRUM_SEPOLIA]: arbitrumSepolia.rpcUrls.default.http,
  [ChainId.BASE_SEPOLIA]: baseSepolia.rpcUrls.default.http,
  [ChainId.MONAD_MAINNET]: MONAD_RPC_URLS,
  [ChainId.MONAD_TESTNET]: [
    'https://testnet-rpc2.monad.xyz/52227f026fa8fac9e2014c58fbf5643369b3bfc6',
    ...monadTestnet.rpcUrls.default.http,
  ],
} satisfies Record<ChainId, readonly string[]>
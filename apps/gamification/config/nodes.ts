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
import vault from 'node-vault'; // Import the node-vault client

// Initialize the Vault client using environment variables
const vaultClient = vault({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

/**
 * Fetches a secret from HashiCorp Vault.
 * Assumes KV v2 engine and expects the secret value under a 'token' key.
 * @param vaultPath The Vault path in the format 'vault://kv/<mount_path>/<secret_path>'.
 * @returns The fetched secret string.
 * @throws Error if the Vault path is invalid, fetching fails, or the secret key is not found.
 */
async function getVaultSecret(vaultPath: string): Promise<string> {
  // Example vaultPath: 'vault://kv/stackguard/tokens/eb5c711e-4340-48d5-a5eb-9681606dbd44'
  const parts = vaultPath.split('/');
  if (parts.length < 5 || parts[0] !== 'vault:' || parts[1] !== '' || parts[2] !== 'kv') {
    throw new Error(`Invalid Vault path format: ${vaultPath}`);
  }

  // For KV v2, node-vault expects the path to be 'mount_path/data/secret_path'
  const mountPath = parts[3]; // e.g., 'kv'
  const secretPath = parts.slice(4).join('/'); // e.g., 'stackguard/tokens/eb5c711e-4340-48d5-a5eb-9681606dbd44'
  const readPath = `${mountPath}/data/${secretPath}`;

  try {
    const result = await vaultClient.read(readPath);
    // For KV v2, the actual secret data is under `result.data.data`.
    // We assume the secret value is stored under a key named 'token'.
    if (result && result.data && result.data.data && typeof result.data.data.token === 'string') {
      return result.data.data.token;
    }
    throw new Error(`Secret key 'token' not found or not a string at Vault path: ${readPath}`);
  } catch (error) {
    // Do not log the secret value, only the error message.
    console.error(`Failed to fetch secret from Vault at ${readPath}:`, error instanceof Error ? error.message : String(error));
    throw error; // Re-throw to prevent application from starting with missing critical config
  }
}

// Fetch the secret using top-level await.
// This requires the environment to support top-level await (e.g., Node.js ES Modules).
// If the secret fetch fails, the module will not load, preventing the application from starting.
let lineaTestnetInfuraApiKey: string;
try {
  lineaTestnetInfuraApiKey = await getVaultSecret('vault://kv/stackguard/tokens/eb5c711e-4340-48d5-a5eb-9681606dbd44');
} catch (e) {
  // Re-throw the error to ensure the application fails to start if a critical secret is unavailable.
  throw e;
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
    // On or near line 73, replace the hardcoded secret with the fetched variable
    `https://consensys-zkevm-goerli-prealpha.infura.io/v3/${lineaTestnetInfuraApiKey}`,
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
    // Replace hardcoded secret with the fetched variable
    `https://consensys-zkevm-goerli-prealpha.infura.io/v3/${lineaTestnetInfuraApiKey}`,
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
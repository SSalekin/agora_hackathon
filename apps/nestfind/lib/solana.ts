import idl from '@/idl/escrow.json';
import type {
  SolanaWalletProvider,
  SolanaPublicKey,
  AnchorWalletAdapter,
  SolanaRpcConfig,
} from '@/types/solana-wallet';
import { DEFAULT_RPC_CONFIG } from '@/types/solana-wallet';

/**
 * Detect the injected Solana wallet provider from the browser.
 * Checks both the legacy `window.solana` (Phantom) and the
 * Wallet Standard `window.solana` / `window.__walletStandard`.
 *
 * Returns `null` if no wallet is installed.
 */
export function getWalletProvider(): SolanaWalletProvider | null {
  if (typeof window === 'undefined') return null;

  // Phantom injects `window.solana`
  const legacy = (window as unknown as Record<string, unknown>).solana;
  if (legacy && typeof legacy === 'object' && 'publicKey' in (legacy as Record<string, unknown>)) {
    return legacy as SolanaWalletProvider;
  }

  return null;
}

/**
 * Build an Anchor-compatible wallet adapter from the raw provider.
 * This bridges the gap between the injected wallet and what
 * `anchor.AnchorProvider` expects.
 */
function buildAnchorWalletAdapter(provider: SolanaWalletProvider): AnchorWalletAdapter {
  const pk = provider.publicKey;
  if (!pk) throw new Error('Wallet is not connected — publicKey is null.');

  return {
    publicKey: pk,
    signTransaction: async (tx) => {
      if (!provider.signTransaction) {
        throw new Error('Wallet does not support signTransaction.');
      }
      return provider.signTransaction(tx);
    },
    signAllTransactions: async (txs) => {
      if (!provider.signAllTransactions) {
        throw new Error('Wallet does not support signAllTransactions.');
      }
      return provider.signAllTransactions(txs);
    },
  };
}

/**
 * Create a Solana `Connection` using the configured RPC endpoint.
 * The URL comes from `NEXT_PUBLIC_SOLANA_RPC_URL` env var.
 * This ensures the RPC endpoint is centralized and not scattered
 * across components.
 */
export async function createConnection(config: SolanaRpcConfig = DEFAULT_RPC_CONFIG) {
  const web3 = await import('@solana/web3.js');
  return new web3.Connection(config.url, config.commitment);
}

/**
 * Prepare an Anchor Program client using the connected wallet.
 *
 * This is the single shared implementation used by both
 * TenantAgreementPanel and LandlordDashboard, eliminating
 * the duplicated `prepareAnchorClient` functions.
 *
 * Returns the Anchor module, connection, program, connected
 * public key, and a convenience `PublicKey` class.
 */
export async function prepareAnchorClient(options?: {
  rpcConfig?: SolanaRpcConfig;
}): Promise<{
  anchor: typeof import('@anchor-lang/core');
  connection: InstanceType<typeof import('@solana/web3.js').Connection>;
  program: any;
  connectedPubkey: import('@solana/web3.js').PublicKey;
  PublicKey: typeof import('@solana/web3.js').PublicKey;
  SystemProgram: typeof import('@solana/web3.js').SystemProgram;
}> {
  const Anchor = await import('@anchor-lang/core');
  const anchor = Anchor as typeof import('@anchor-lang/core');
  const web3 = await import('@solana/web3.js');

  const rpcConfig = options?.rpcConfig ?? DEFAULT_RPC_CONFIG;
  const connection = new web3.Connection(rpcConfig.url, rpcConfig.commitment);

  const provider = getWalletProvider();
  if (!provider) throw new Error('No wallet provider found (Phantom recommended).');
  if (!provider.publicKey) throw new Error('Wallet is not connected.');

  const walletAdapter = buildAnchorWalletAdapter(provider);
  const anchorProvider = new anchor.AnchorProvider(
    connection,
    walletAdapter as any,
    anchor.AnchorProvider.defaultOptions(),
  );
  const program = new anchor.Program(idl as any, anchorProvider);
  const connectedPubkey = new web3.PublicKey(provider.publicKey.toString());

  return {
    anchor,
    connection,
    program,
    connectedPubkey,
    PublicKey: web3.PublicKey,
    SystemProgram: web3.SystemProgram,
  };
}

/**
 * Derive an agreement PDA from the tenant, landlord, and listing hash.
 */
export async function deriveAgreementPda(
  tenantPubkey: import('@solana/web3.js').PublicKey,
  landlordPubkey: import('@solana/web3.js').PublicKey,
  listingHashBytes: Uint8Array,
  programId: import('@solana/web3.js').PublicKey,
): Promise<import('@solana/web3.js').PublicKey> {
  const web3 = await import('@solana/web3.js');
  const [pda] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from('agreement'),
      tenantPubkey.toBuffer(),
      landlordPubkey.toBuffer(),
      Buffer.from(listingHashBytes),
    ],
    programId,
  );
  return pda;
}

/**
 * Derive the config PDA.
 */
export async function deriveConfigPda(
  programId: import('@solana/web3.js').PublicKey,
): Promise<import('@solana/web3.js').PublicKey> {
  const web3 = await import('@solana/web3.js');
  const [pda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    programId,
  );
  return pda;
}

/**
 * Derive the landlord profile PDA.
 */
export async function deriveLandlordProfilePda(
  landlordPubkey: import('@solana/web3.js').PublicKey,
  programId: import('@solana/web3.js').PublicKey,
): Promise<import('@solana/web3.js').PublicKey> {
  const web3 = await import('@solana/web3.js');
  const [pda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('landlord-profile'), landlordPubkey.toBuffer()],
    programId,
  );
  return pda;
}

/**
 * Hash a string to SHA-256 bytes.
 */
export async function sha256Bytes(input: string): Promise<Uint8Array> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return new Uint8Array(buf);
}

/**
 * Hash a string to a hex-encoded SHA-256 digest.
 */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = await sha256Bytes(input);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert a byte array to a hex string.
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Build a Solana Explorer URL for a transaction or address.
 */
export function explorerUrl(
  identifier: string,
  type: 'tx' | 'address' = 'tx',
  cluster?: string,
): string {
  const c = cluster ?? ((process.env.NEXT_PUBLIC_SOLANA_CLUSTER as string) || 'devnet');
  return `https://explorer.solana.com/${type}/${identifier}?cluster=${c}`;
}

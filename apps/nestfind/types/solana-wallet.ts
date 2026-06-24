/**
 * Typed wallet interfaces for Solana browser wallets.
 *
 * These types cover the intersection of Phantom's proprietary API
 * and the Wallet Standard (https://github.com/wallet-standard/wallet-standard).
 * Any conforming browser wallet (Phantom, Solflare, Backpack, etc.)
 * will satisfy these interfaces through `window.solana` or the
 * Wallet Standard `getWallets()` registry.
 */

export interface SolanaPublicKey {
  toString(): string;
  toBuffer(): Uint8Array;
  equals(other: SolanaPublicKey): boolean;
}

export interface SolanaTransaction {
  serialize(): Uint8Array;
}

export interface SignedTransaction extends SolanaTransaction {
  signature: Uint8Array;
}

/**
 * The subset of wallet provider methods we actually call.
 * Matches both Phantom's injected `window.solana` and the
 * standard `SolanaWallet` interface from Wallet Standard.
 */
export interface SolanaWalletProvider {
  publicKey: SolanaPublicKey | null;
  isConnected: boolean;
  connect(): Promise<{ publicKey: SolanaPublicKey }>;
  disconnect(): Promise<void>;
  signTransaction?<T extends SolanaTransaction>(tx: T): Promise<SignedTransaction>;
  signAllTransactions?<T extends SolanaTransaction>(txs: T[]): Promise<SignedTransaction[]>;
  on?(event: string, cb: (...args: unknown[]) => void): void;
  off?(event: string, cb: (...args: unknown[]) => void): void;
}

/**
 * Minimal Anchor-compatible wallet adapter built from a provider.
 * This is what we pass to `anchor.AnchorProvider`.
 */
export interface AnchorWalletAdapter {
  publicKey: SolanaPublicKey;
  signTransaction: (tx: SolanaTransaction) => Promise<SignedTransaction>;
  signAllTransactions: (txs: SolanaTransaction[]) => Promise<SignedTransaction[]>;
}

/**
 * Read-only connection factory config.
 * Read from env vars so the RPC URL is never hardcoded in components.
 */
export type SolanaRpcConfig = {
  url: string;
  commitment: 'processed' | 'confirmed' | 'finalized';
};

export const DEFAULT_RPC_CONFIG: SolanaRpcConfig = {
  url: (process.env.NEXT_PUBLIC_SOLANA_RPC_URL as string) || 'https://api.devnet.solana.com',
  commitment: 'confirmed',
};

export const DEFAULT_CLUSTER =
  (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as string) || 'devnet';

const LAMPORTS_PER_SOL = 1_000_000_000;

// Solana devnet genesis hash (as of 2026).
const DEVNET_GENESIS_HASH = 'EtWTRABGHiLjRarC4hX3WYpbvPCbKvqU4Gzd7gFjBc3T';

export type PreflightResult = {
  ok: boolean;
  error?: string;
};

/**
 * Verify the connected wallet is on the expected Solana network.
 */
export async function checkNetwork(
  connection: { getGenesisHash: () => Promise<string> },
  expectedCluster: string = 'devnet',
): Promise<PreflightResult> {
  try {
    const genesisHash = await connection.getGenesisHash();
    if (expectedCluster === 'devnet' && genesisHash !== DEVNET_GENESIS_HASH) {
      return {
        ok: false,
        error: `Wrong network. Please switch your wallet to Solana devnet. Current genesis: ${genesisHash.slice(0, 12)}…`,
      };
    }
    return { ok: true };
  } catch {
    return { ok: true }; // If we can't check, don't block the user.
  }
}

/**
 * Verify the connected wallet has enough SOL for the transaction.
 * `extraLamports` is the amount the transaction will spend (deposit + fees).
 */
export async function checkBalance(
  connection: { getBalance: (key: import('@solana/web3.js').PublicKey) => Promise<number> },
  walletPubkey: import('@solana/web3.js').PublicKey,
  extraLamports: number = 0,
): Promise<PreflightResult> {
  try {
    const balance = await connection.getBalance(walletPubkey);
    const feeBuffer = 10_000; // ~0.00001 SOL for transaction fees
    const required = extraLamports + feeBuffer;
    if (balance < required) {
      const balanceSol = (balance / LAMPORTS_PER_SOL).toFixed(4);
      const requiredSol = (required / LAMPORTS_PER_SOL).toFixed(4);
      return {
        ok: false,
        error: `Insufficient balance. You have ${balanceSol} SOL but need at least ${requiredSol} SOL (deposit + fees).`,
      };
    }
    return { ok: true };
  } catch {
    return { ok: true }; // If we can't check, don't block the user.
  }
}

/**
 * Format a wallet-rejection error into a user-friendly message.
 */
export function formatWalletError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  // Phantom rejection patterns
  if (/user rejected/i.test(message) || /denied/i.test(message) || /rejected/i.test(message)) {
    return 'Transaction cancelled. You rejected the request in your wallet.';
  }
  if (/timeout/i.test(message) || /timed out/i.test(message)) {
    return 'Transaction timed out. Please try again and approve the request in your wallet.';
  }
  if (/wallet not connected/i.test(message) || /not connected/i.test(message)) {
    return 'Wallet not connected. Please connect your wallet and try again.';
  }

  return message;
}

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SolanaWalletProvider } from '@/types/solana-wallet';
import { getWalletProvider } from '@/lib/solana';

export type UsePhantomWalletReturn = {
  publicKey: string | null;
  provider: SolanaWalletProvider | null;
  connect: () => Promise<string | null>;
  disconnect: () => Promise<void>;
  /** Re-read the current publicKey from the provider without re-subscribing. */
  refresh: () => void;
};

export function usePhantomWallet(): UsePhantomWalletReturn {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const providerRef = useRef<SolanaWalletProvider | null>(null);

  // Stable callback refs so the effect doesn't re-subscribe on every render.
  const onDisconnectRef = useRef<() => void>(() => {});
  const onAccountChangeRef = useRef<(...args: unknown[]) => void>(() => {});

  // Keep refs fresh without triggering re-subscription.
  onDisconnectRef.current = () => {
    setPublicKey(null);
  };
  onAccountChangeRef.current = (...args: unknown[]) => {
    const first = args[0];
    if (first && typeof first === 'object' && 'toString' in first) {
      setPublicKey((first as { toString(): string }).toString());
    } else if (typeof first === 'string') {
      setPublicKey(first);
    } else {
      setPublicKey(null);
    }
  };

  useEffect(() => {
    const provider = getWalletProvider();
    providerRef.current = provider;
    if (!provider) return;

    const handleDisconnect = () => onDisconnectRef.current();
    const handleAccountChange = (...args: unknown[]) => onAccountChangeRef.current(...args);

    provider.on?.('disconnect', handleDisconnect);
    provider.on?.('accountChanged', handleAccountChange);

    // Sync initial state if already connected.
    const existing = provider.publicKey?.toString?.() ?? null;
    if (existing) setPublicKey(existing);

    return () => {
      provider.off?.('disconnect', handleDisconnect);
      provider.off?.('accountChanged', handleAccountChange);
    };
  }, []);

  const connect = useCallback(async (): Promise<string | null> => {
    const provider = getWalletProvider();
    if (!provider) throw new Error('No wallet provider found (Phantom recommended).');
    providerRef.current = provider;
    const resp = await provider.connect();
    const key = resp?.publicKey?.toString?.() ?? provider.publicKey?.toString?.() ?? null;
    setPublicKey(key);
    return key;
  }, []);

  const disconnect = useCallback(async () => {
    const provider = providerRef.current ?? getWalletProvider();
    await provider?.disconnect?.();
    setPublicKey(null);
  }, []);

  const refresh = useCallback(() => {
    const provider = providerRef.current ?? getWalletProvider();
    const key = provider?.publicKey?.toString?.() ?? null;
    setPublicKey(key);
  }, []);

  return { publicKey, provider: providerRef.current, connect, disconnect, refresh };
}

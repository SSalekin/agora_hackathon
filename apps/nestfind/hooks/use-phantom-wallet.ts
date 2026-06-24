import { useCallback, useEffect, useRef, useState } from 'react';

type PhantomProvider = {
  publicKey?: { toString(): string };
  connect?: () => Promise<{ publicKey?: { toString(): string } }>;
  disconnect?: () => Promise<void>;
  on?: (event: string, cb: (...args: any[]) => void) => void;
  off?: (event: string, cb: (...args: any[]) => void) => void;
  signTransaction?: (tx: any) => Promise<any>;
  signAllTransactions?: (tx: any[]) => Promise<any[]>;
};

function getProvider(): PhantomProvider | null {
  if (typeof window === 'undefined') return null;
  return (window as any).solana ?? null;
}

export type UsePhantomWalletReturn = {
  publicKey: string | null;
  provider: PhantomProvider | null;
  connect: () => Promise<string | null>;
  disconnect: () => Promise<void>;
  /** Re-read the current publicKey from the provider without re-subscribing. */
  refresh: () => void;
};

export function usePhantomWallet(): UsePhantomWalletReturn {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const providerRef = useRef<PhantomProvider | null>(null);

  // Stable callback refs so the effect doesn't re-subscribe on every render.
  const onDisconnectRef = useRef<() => void>(() => {});
  const onAccountChangeRef = useRef<(accounts: string[]) => void>(() => {});

  // Keep refs fresh without triggering re-subscription.
  onDisconnectRef.current = () => {
    setPublicKey(null);
  };
  onAccountChangeRef.current = (accounts: string[]) => {
    setPublicKey(accounts[0] ?? null);
  };

  useEffect(() => {
    const provider = getProvider();
    providerRef.current = provider;
    if (!provider) return;

    const handleDisconnect = () => onDisconnectRef.current();
    const handleAccountChange = (accounts: string[]) => onAccountChangeRef.current(accounts);

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
    const provider = getProvider();
    if (!provider) throw new Error('No wallet provider found (Phantom recommended).');
    providerRef.current = provider;
    const resp = await provider.connect?.();
    const key = resp?.publicKey?.toString?.() ?? provider.publicKey?.toString?.() ?? null;
    setPublicKey(key);
    return key;
  }, []);

  const disconnect = useCallback(async () => {
    const provider = providerRef.current ?? getProvider();
    await provider?.disconnect?.();
    setPublicKey(null);
  }, []);

  const refresh = useCallback(() => {
    const provider = providerRef.current ?? getProvider();
    const key = provider?.publicKey?.toString?.() ?? null;
    setPublicKey(key);
  }, []);

  return { publicKey, provider: providerRef.current, connect, disconnect, refresh };
}

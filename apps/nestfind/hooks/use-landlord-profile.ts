import { useCallback, useEffect, useRef, useState } from 'react';
import { usePhantomWallet } from './use-phantom-wallet';
import { prepareAnchorClient, deriveLandlordProfilePda } from '@/lib/solana';

const LAMPORTS_PER_SOL = 1_000_000_000;
const MIN_STAKE_LAMPORTS = 100_000; // 0.0001 SOL

export type LandlordProfileData = {
  landlord: string;
  totalStakedLamports: number;
  activeStakeLamports: number;
  completedRentals: number;
  disputesLost: number;
  exists: boolean;
};

const EMPTY_PROFILE: LandlordProfileData = {
  landlord: '',
  totalStakedLamports: 0,
  activeStakeLamports: 0,
  completedRentals: 0,
  disputesLost: 0,
  exists: false,
};

export function useLandlordProfile(targetWallet?: string | null) {
  const { publicKey: walletPubkey } = usePhantomWallet();
  const [profile, setProfile] = useState<LandlordProfileData>(EMPTY_PROFILE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wallet = targetWallet ?? walletPubkey;

  const fetchProfile = useCallback(async () => {
    if (!wallet) {
      setProfile(EMPTY_PROFILE);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const { program, PublicKey } = await prepareAnchorClient();
      const landlordPubkey = new PublicKey(wallet);
      const profilePda = await deriveLandlordProfilePda(landlordPubkey, program.programId);

      try {
        const onchain = await (program as any).account.landlordProfile.fetch(profilePda);
        setProfile({
          landlord: onchain.landlord?.toBase58?.() ?? wallet,
          totalStakedLamports: typeof onchain.totalStakedLamports === 'object'
            ? Number(onchain.totalStakedLamports.toString())
            : Number(onchain.totalStakedLamports ?? 0),
          activeStakeLamports: typeof onchain.activeStakeLamports === 'object'
            ? Number(onchain.activeStakeLamports.toString())
            : Number(onchain.activeStakeLamports ?? 0),
          completedRentals: typeof onchain.completedRentals === 'object'
            ? Number(onchain.completedRentals.toString())
            : Number(onchain.completedRentals ?? 0),
          disputesLost: typeof onchain.disputesLost === 'object'
            ? Number(onchain.disputesLost.toString())
            : Number(onchain.disputesLost ?? 0),
          exists: true,
        });
      } catch {
        setProfile(EMPTY_PROFILE);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  const prevWalletRef = useRef<string | null | undefined>(wallet);
  useEffect(() => {
    if (prevWalletRef.current !== wallet) {
      prevWalletRef.current = wallet;
      fetchProfile();
    }
  }, [wallet, fetchProfile]);

  const totalStakedSol = profile.totalStakedLamports / LAMPORTS_PER_SOL;
  const activeStakeSol = profile.activeStakeLamports / LAMPORTS_PER_SOL;
  const hasMinimumStake = profile.activeStakeLamports >= MIN_STAKE_LAMPORTS;

  return {
    profile,
    isLoading,
    error,
    totalStakedSol,
    activeStakeSol,
    hasMinimumStake,
    refresh: fetchProfile,
  };
}

'use client';

import { useEffect, useState } from 'react';
import { Building2, KeyRound } from 'lucide-react';
import type { ApartmentListing } from '@/types/listing';
import { ListingGrid } from './ListingGrid';

type Props = {
  listings: ApartmentListing[];
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
};

export function LandlordDashboard({ listings, favoriteIds, onToggleFavorite }: Props) {
  const [walletPubkey, setWalletPubkey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // @ts-ignore
    const existingWallet = window.solana?.publicKey?.toString?.() ?? null;
    if (existingWallet) {
      setWalletPubkey(existingWallet);
    }
  }, []);

  const connectWallet = async () => {
    setError(null);
    try {
      // @ts-ignore
      const provider = window.solana;
      if (!provider) throw new Error('No wallet provider found (Phantom recommended).');
      // @ts-ignore
      const response = await provider.connect();
      setWalletPubkey(response.publicKey?.toString?.() ?? provider.publicKey?.toString?.() ?? null);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  };

  const ownedListings = walletPubkey
    ? listings.filter((listing) => listing.landlordWallet === walletPubkey)
    : [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">Landlord workspace</p>
      <div className="mt-2 flex flex-col gap-4 rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">Your listings</h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-500">
            Connect the landlord wallet used in a listing to review its escrow agreements and landlord actions.
          </p>
          {walletPubkey && (
            <p className="mt-3 truncate text-xs text-stone-500">
              Connected wallet: <span className="font-semibold text-stone-700">{walletPubkey}</span>
            </p>
          )}
          {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
        </div>
        <button
          type="button"
          onClick={connectWallet}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-5 text-sm font-semibold text-white"
        >
          <KeyRound className="h-4 w-4" />
          {walletPubkey ? 'Reconnect wallet' : 'Connect landlord wallet'}
        </button>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
        <Building2 className="h-4 w-4 text-emerald-800" />
        <span>{walletPubkey ? `${ownedListings.length} listing${ownedListings.length === 1 ? '' : 's'} linked to this landlord wallet.` : 'Connect a landlord wallet to load linked listings.'}</span>
      </div>

      <div className="mt-6">
        <ListingGrid
          listings={ownedListings}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
          emptyMessage={walletPubkey ? 'No listings in this demo catalog are linked to the connected landlord wallet.' : 'Connect a landlord wallet to open the landlord dashboard.'}
        />
      </div>
    </main>
  );
}

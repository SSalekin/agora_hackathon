"use client";

import { useState } from 'react';
import { Bath, BedDouble, Heart, MapPin, Ruler } from 'lucide-react';
import type { ApartmentListing } from '@/types/listing';
import { formatVnd } from '@/lib/listings';
import { StakeBadge } from '@/components/landlord/StakeBadge';
import { useLandlordProfile } from '@/hooks/use-landlord-profile';

type ListingGridProps = {
  listings: ApartmentListing[];
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  emptyMessage?: string;
};

function ListingCard({ listing, isFavorite, onToggleFavorite, onOpenAgreement }: {
  listing: ApartmentListing;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenAgreement: (id: string) => void;
}) {
  const { profile, activeStakeSol, hasMinimumStake } = useLandlordProfile(listing.landlordWallet);
  return (
    <article className="group flex h-full min-h-[23rem] flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_14px_40px_rgba(58,45,30,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(58,45,30,0.14)] md:min-h-[26rem]">
      <div className={`relative h-16 bg-gradient-to-br md:h-36 ${listing.accent}`}>
        <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_34%),linear-gradient(125deg,transparent_42%,rgba(255,255,255,.65)_43%,transparent_68%)]" />
        <span className="absolute left-2 top-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-stone-700 backdrop-blur md:left-3 md:top-3">{listing.distanceKm} km away</span>
        <button type="button" onClick={() => onToggleFavorite(listing.id)} className="absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-full bg-white/85 text-stone-600 shadow-sm backdrop-blur transition hover:scale-105 hover:text-rose-500 md:right-3 md:top-3" aria-label={isFavorite ? 'Remove from saved listings' : 'Save listing'}>
          <Heart className={`h-5 w-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-3 pt-2 md:p-5">
        <div className="flex min-h-[5.5rem] items-start justify-between gap-3 md:min-h-[6.5rem]">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-serif text-lg font-semibold leading-tight text-stone-900 md:text-xl">{listing.title}</h3>
            <p className="mt-1 flex min-h-[2.5rem] items-start gap-1 text-xs leading-5 text-stone-500 md:mt-2 md:min-h-[3rem]">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-2 break-words">{listing.address}</span>
            </p>
          </div>
          <div className="shrink-0 text-right"><p className="text-base font-bold text-blue-600 md:text-lg">{formatVnd(listing.monthlyRentVnd)}</p><p className="text-[11px] text-stone-400">per month</p></div>
        </div>
        <div className="flex-1">
          {profile.exists && (
            <div className="mt-2">
            <StakeBadge activeStakeSol={activeStakeSol} hasMinimumStake={hasMinimumStake} disputesLost={profile.disputesLost} />
            </div>
          )}
          <div className="mt-2 grid grid-cols-3 gap-2 border-y border-stone-100 py-2 text-xs font-medium text-stone-600 md:mt-4 md:py-3">
            <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" />{listing.bedrooms} bed</span>
            <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{listing.bathrooms} bath</span>
            <span className="flex items-center gap-1"><Ruler className="h-4 w-4" />{listing.areaSqm} m²</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 md:mt-4">{listing.amenities.slice(0, 2).map((amenity) => <span key={amenity} className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] text-stone-600">{amenity}</span>)}{listing.amenities.length > 2 && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-600">+{listing.amenities.length - 2} more</span>}</div>
        </div>
        <div className="mt-2 md:mt-4">
          <button type="button" onClick={() => onOpenAgreement(listing.id)} className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white md:py-3">Start rental agreement</button>
        </div>
      </div>
    </article>
  );
}

export function ListingGrid({ listings, favoriteIds, onToggleFavorite, emptyMessage = 'No apartments match those filters yet.' }: ListingGridProps) {
  const [activeListingId, setActiveListingId] = useState<string | null>(null);
  const [TenantPanel, setTenantPanel] = useState<any>(null);

  if (listings.length === 0) {
    return <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center text-sm text-stone-500">{emptyMessage}</div>;
  }

  return (
    <>
      <div className="grid items-stretch gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            isFavorite={favoriteIds.includes(listing.id)}
            onToggleFavorite={onToggleFavorite}
            onOpenAgreement={(id) => { setActiveListingId(id); import('@/components/apartment/TenantAgreementPanel').then((m) => setTenantPanel(() => m.default)); }}
          />
        ))}
      </div>

      {activeListingId && (() => {
        const listing = listings.find((l) => l.id === activeListingId);
        if (!listing) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
            <div className="mx-auto max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-t-[1.75rem] bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold">Rental agreement — {listing.title}</h3>
                <button type="button" onClick={() => setActiveListingId(null)} className="text-stone-400">Close</button>
              </div>
              <div className="mt-4">
                {TenantPanel ? <TenantPanel listing={listing} onClose={() => setActiveListingId(null)} /> : <div className="py-8 text-center text-sm text-stone-500">Loading agreement panel…</div>}
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}

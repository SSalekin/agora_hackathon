'use client';

import { Bath, BedDouble, Heart, MapPin, Ruler } from 'lucide-react';
import type { ApartmentListing } from '@/types/listing';
import { formatVnd } from '@/lib/listings';

type ListingGridProps = {
  listings: ApartmentListing[];
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  emptyMessage?: string;
};

export function ListingGrid({ listings, favoriteIds, onToggleFavorite, emptyMessage = 'No apartments match those filters yet.' }: ListingGridProps) {
  if (listings.length === 0) {
    return <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center text-sm text-stone-500">{emptyMessage}</div>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {listings.map((listing) => {
        const isFavorite = favoriteIds.includes(listing.id);
        return (
          <article key={listing.id} className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_14px_40px_rgba(58,45,30,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(58,45,30,0.14)]">
            <div className={`relative h-36 bg-gradient-to-br ${listing.accent}`}>
              <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_34%),linear-gradient(125deg,transparent_42%,rgba(255,255,255,.65)_43%,transparent_68%)]" />
              <span className="absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-stone-700 backdrop-blur">{listing.distanceKm} km away</span>
              <button type="button" onClick={() => onToggleFavorite(listing.id)} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/85 text-stone-600 shadow-sm backdrop-blur transition hover:scale-105 hover:text-rose-500" aria-label={isFavorite ? 'Remove from saved listings' : 'Save listing'}>
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-xl font-semibold leading-tight text-stone-900">{listing.title}</h3>
                  <p className="mt-2 flex items-start gap-1 text-xs leading-5 text-stone-500"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{listing.address}</p>
                </div>
                <div className="shrink-0 text-right"><p className="text-lg font-bold text-emerald-800">{formatVnd(listing.monthlyRentVnd)}</p><p className="text-[11px] text-stone-400">per month</p></div>
              </div>
              <div className="mt-4 flex items-center gap-4 border-y border-stone-100 py-3 text-xs font-medium text-stone-600">
                <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" />{listing.bedrooms} bed</span>
                <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{listing.bathrooms} bath</span>
                <span className="flex items-center gap-1"><Ruler className="h-4 w-4" />{listing.areaSqm} m²</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">{listing.amenities.slice(0, 3).map((amenity) => <span key={amenity} className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] text-stone-600">{amenity}</span>)}</div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

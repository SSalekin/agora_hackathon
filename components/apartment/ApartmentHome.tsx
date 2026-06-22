'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, Clock3, Heart, Home, LogOut, Mic, Search, Sparkles, UserRound } from 'lucide-react';
import { APARTMENT_LISTINGS } from '@/lib/listings';
import type { ApartmentListing, ListingSearchFilters, SearchHistoryItem } from '@/types/listing';
import { ListingGrid } from './ListingGrid';
import { PwaControls } from './PwaControls';
import { SearchFilterChips } from './SearchFilterChips';

type AppTab = 'discover' | 'saved' | 'history';
type Props = {
  isLoading: boolean; error: string | null; userName: string | null;
  listings: ApartmentListing[]; hasSearched: boolean; activeFilters: ListingSearchFilters | null; favoriteIds: string[]; history: SearchHistoryItem[];
  onStartConversation: () => void; onTextSearch: (query: string) => void;
  onToggleFavorite: (id: string) => void; onSignIn: (name: string) => void; onSignOut: () => void;
};

const EXAMPLE_QUERY = 'Find apartments within 2 kilometers of Greenwich Da Nang under 5 million VND in July 2027';

export function ApartmentHome({ isLoading, error, userName, listings, hasSearched, activeFilters, favoriteIds, history, onStartConversation, onTextSearch, onToggleFavorite, onSignIn, onSignOut }: Props) {
  const [tab, setTab] = useState<AppTab>('discover');
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const savedListings = APARTMENT_LISTINGS.filter((listing) => favoriteIds.includes(listing.id));
  const submitSearch = (event: FormEvent) => { event.preventDefault(); if (query.trim()) { onTextSearch(query); setTab('discover'); } };
  const openSignIn = () => document.getElementById('demo-auth')?.showPopover?.();

  return (
    <div className="min-h-dvh bg-[#f7f5ef] pb-24 text-stone-900 sm:pb-0">
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#f7f5ef]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button type="button" onClick={() => setTab('discover')} className="flex items-center gap-2" aria-label="NestFind home"><span className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-900 text-white"><Home className="h-4 w-4" /></span><span className="font-serif text-xl font-bold">NestFind</span></button>
          <nav className="hidden items-center gap-1 rounded-full border border-stone-200 bg-white p-1 sm:flex" aria-label="Main navigation">
            {([['discover', 'Discover', Search], ['saved', `Saved ${favoriteIds.length ? `(${favoriteIds.length})` : ''}`, Heart], ['history', 'History', Clock3]] as const).map(([value, label, Icon]) => <button type="button" key={value} onClick={() => setTab(value)} className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold ${tab === value ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}
          </nav>
          <div className="flex items-center gap-2"><PwaControls />{userName ? <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white py-1 pl-1 pr-2 text-xs font-semibold"><span className="grid h-7 w-7 place-items-center rounded-full bg-amber-100">{userName[0].toUpperCase()}</span><span className="hidden md:block">{userName}</span><button type="button" onClick={onSignOut} aria-label="Sign out"><LogOut className="h-3.5 w-3.5" /></button></div> : <button type="button" onClick={openSignIn} className="flex h-9 items-center gap-2 rounded-full bg-stone-900 px-4 text-xs font-semibold text-white"><UserRound className="h-4 w-4" /> Sign in</button>}</div>
        </div>
      </header>

      <div id="demo-auth" popover="auto" className="m-auto w-[min(92vw,25rem)] rounded-3xl border border-stone-200 bg-white p-6 text-stone-900 shadow-2xl backdrop:bg-stone-950/40">
        <h2 className="font-serif text-2xl font-bold">Welcome to NestFind</h2><p className="mt-2 text-sm leading-6 text-stone-500">This demo profile keeps saved homes and history on this device.</p>
        <form className="mt-5" onSubmit={(event) => { event.preventDefault(); if (name.trim()) { onSignIn(name.trim()); document.getElementById('demo-auth')?.hidePopover?.(); } }}><label className="text-xs font-semibold" htmlFor="profile-name">Your name</label><input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-stone-200 px-3 outline-none focus:border-emerald-700" placeholder="e.g. Minh" /><button type="submit" className="mt-4 h-11 w-full rounded-xl bg-emerald-900 text-sm font-semibold text-white">Continue</button></form>
      </div>

      {tab === 'discover' && <main>
        <section className="relative overflow-hidden border-b border-stone-200"><div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_15%_20%,#d9ead3_0,transparent_28%),radial-gradient(circle_at_85%_35%,#f8dfb6_0,transparent_25%)]" /><div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:py-20">
          <div><div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800"><Sparkles className="h-3.5 w-3.5" /> Voice-powered apartment discovery</div><h1 className="mt-6 max-w-3xl font-serif text-5xl font-bold leading-[.98] tracking-[-0.04em] sm:text-6xl">Find a place that feels like <span className="italic text-emerald-800">home.</span></h1><p className="mt-5 max-w-xl leading-7 text-stone-600">Tell our voice concierge where, when, and how much. NestFind turns the conversation into apartment matches around Da Nang.</p>
            <button type="button" onClick={userName ? onStartConversation : openSignIn} disabled={isLoading} className="group mt-8 flex h-14 items-center justify-center gap-3 rounded-2xl bg-emerald-900 px-6 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-800 disabled:opacity-60"><span className="grid h-8 w-8 place-items-center rounded-full bg-white/15"><Mic className="h-4 w-4" /></span>{isLoading ? 'Connecting…' : 'Talk to your apartment concierge'}<ArrowRight className="h-4 w-4" /></button>{error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
          </div>
          <div className="flex items-center"><div className="w-full rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-[0_28px_80px_rgba(64,53,38,.14)] backdrop-blur"><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-800">Try saying</p><blockquote className="mt-4 font-serif text-2xl leading-9">“I’m moving to Da Nang in July 2027. Find me a place near Greenwich University for under 5 million.”</blockquote><div className="mt-6 flex items-center gap-3 border-t border-stone-200 pt-5"><span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-900 text-white"><Mic className="h-5 w-5" /></span><div><p className="text-sm font-semibold">Natural voice search</p><p className="text-xs text-stone-500">Budget, distance and dates understood</p></div></div></div></div>
        </div></section>
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><form onSubmit={submitSearch} className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm sm:flex-row"><div className="flex flex-1 items-center gap-3 px-3"><Search className="h-5 w-5 text-stone-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 w-full bg-transparent text-sm outline-none" placeholder="Or type your apartment request…" /></div><button type="submit" className="h-11 rounded-xl bg-stone-900 px-6 text-sm font-semibold text-white">Search</button></form><button type="button" onClick={() => { setQuery(EXAMPLE_QUERY); onTextSearch(EXAMPLE_QUERY); }} className="mt-3 text-xs text-stone-500 underline underline-offset-4">Use the Greenwich University example</button>{hasSearched && <><div className="mb-6 mt-10"><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">Search results</p><h2 className="mt-2 font-serif text-3xl font-bold">{`${listings.length} matched homes`}</h2><SearchFilterChips filters={activeFilters} /></div><ListingGrid listings={listings} favoriteIds={favoriteIds} onToggleFavorite={onToggleFavorite} /></>}</section>
      </main>}

      {tab === 'saved' && <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">Your shortlist</p><h1 className="mt-2 font-serif text-4xl font-bold">Saved apartments</h1><div className="mt-8"><ListingGrid listings={savedListings} favoriteIds={favoriteIds} onToggleFavorite={onToggleFavorite} emptyMessage="Save a listing and it will appear here, even after you close the app." /></div></main>}
      {tab === 'history' && <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6"><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">Recent activity</p><h1 className="mt-2 font-serif text-4xl font-bold">Search history</h1><div className="mt-8 space-y-3">{history.length === 0 ? <p className="rounded-3xl border border-dashed border-stone-300 py-14 text-center text-sm text-stone-500">Your voice and typed searches will appear here.</p> : history.map((item) => <button type="button" key={item.id} onClick={() => { onTextSearch(item.query); setTab('discover'); }} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 text-left"><div><p className="font-medium">{item.query}</p><p className="mt-1 text-xs text-stone-500">{new Date(item.createdAt).toLocaleString()} · {item.resultCount} matches</p></div><ArrowRight className="h-4 w-4" /></button>)}</div></main>}
      <nav className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-around rounded-2xl border border-stone-200 bg-white/95 p-2 shadow-xl backdrop-blur sm:hidden" aria-label="Mobile navigation">{([['discover', 'Discover', Search], ['saved', 'Saved', Heart], ['history', 'History', Clock3]] as const).map(([value, label, Icon]) => <button type="button" key={value} onClick={() => setTab(value)} className={`flex min-w-20 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold ${tab === value ? 'bg-emerald-50 text-emerald-800' : 'text-stone-500'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>
    </div>
  );
}

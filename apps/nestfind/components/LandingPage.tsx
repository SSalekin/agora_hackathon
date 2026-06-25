'use client';

import { useState, useRef, Suspense, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import type { RTMClient } from 'agora-rtm';
import { useAuth } from '@/lib/auth-context';
import type {
  AgoraTokenData,
  ClientStartRequest,
  AgentResponse,
  AgoraRenewalTokens,
} from '../types/conversation';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ApartmentHome } from './apartment/ApartmentHome';
import type { ApartmentListing, ListingCatalogResponse, ListingSearchFilters, ListingSearchResponse, SearchHistoryItem } from '@/types/listing';

function serializeSearchFilters(filters: ListingSearchFilters): string {
  const moveIn = filters.moveIn
    ? (() => {
        const [year, month] = filters.moveIn.split('-');
        const monthName = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December',
        ][Number(month) - 1];
        return monthName ? `move in ${monthName} ${year}` : null;
      })()
    : null;
  return [
    `location ${filters.location}`,
    filters.minBudgetVnd ? `monthly rent above ${filters.minBudgetVnd} VND` : null,
    filters.maxBudgetVnd ? `maximum budget ${filters.maxBudgetVnd} VND` : null,
    filters.minAreaSqm ? `floor area above ${filters.minAreaSqm} square meters` : null,
    filters.maxAreaSqm ? `floor area below ${filters.maxAreaSqm} square meters` : null,
    filters.radiusKm ? `within ${filters.radiusKm} km` : null,
    moveIn,
    filters.minBedrooms ? `at least ${filters.minBedrooms} bedrooms` : null,
    filters.minBathrooms ? `at least ${filters.minBathrooms} bathrooms` : null,
    filters.furnished === true ? 'fully furnished' : null,
    filters.furnished === false ? 'unfurnished' : null,
    filters.parking === true ? 'with parking' : null,
    filters.parking === false ? 'no parking' : null,
    filters.petsAllowed === true ? 'pet friendly' : null,
    filters.petsAllowed === false ? 'no pets' : null,
  ].filter(Boolean).join(', ');
}

// Dynamically import the ConversationComponent with ssr disabled
const ConversationComponent = dynamic(() => import('./ConversationComponent'), {
  ssr: false,
});

// Dynamically import AgoraRTCProvider (browser-only).
// The AgoraVoiceAI toolkit is initialized inside ConversationComponent after
// the RTC join succeeds, so this wrapper only needs to provide the RTC client.
const AgoraProvider = dynamic(
  async () => {
    const { AgoraRTCProvider, default: AgoraRTC } =
      await import('agora-rtc-react');
    return {
      default: function AgoraProviders({
        children,
      }: {
        children: React.ReactNode;
      }) {
        // useRef persists across StrictMode's simulated unmount/remount, so only
        // one RTC client is ever created per session (useMemo creates two in StrictMode).
        const clientRef = useRef<ReturnType<
          typeof AgoraRTC.createClient
        > | null>(null);
        if (!clientRef.current) {
          clientRef.current = AgoraRTC.createClient({
            mode: 'rtc',
            codec: 'vp8',
          });
        }
        return (
          <AgoraRTCProvider client={clientRef.current}>
            {children}
          </AgoraRTCProvider>
        );
      },
    };
  },
  { ssr: false },
);

export default function LandingPage() {
  const { user } = useAuth();
  const [showConversation, setShowConversation] = useState(false);
  const [listings, setListings] = useState<ApartmentListing[]>([]);
  const [listingCatalog, setListingCatalog] = useState<ApartmentListing[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ListingSearchFilters | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isListingSearchLoading, setIsListingSearchLoading] = useState(false);
  const searchContextRef = useRef('');
  const listingSearchRequestRef = useRef(0);

  // Use auth user name or fall back to localStorage for backwards compatibility
  const userName = user?.name ?? null;

  // Preload heavy modules on mount so they're already cached when the user
  // clicks "Try it Now" — eliminates the ~1.8s dynamic-import delay.
  useEffect(() => {
    import('agora-rtc-react').catch(() => {});
    import('agora-rtm').catch(() => {});
    fetch('/api/listings?catalog=true')
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load listing catalog');
        return response.json() as Promise<ListingCatalogResponse>;
      })
      .then((catalog) => setListingCatalog(catalog.listings))
      .catch((catalogError) => console.error('Listing catalog load failed:', catalogError));
    try {
      setFavoriteIds(JSON.parse(localStorage.getItem('nestfind:favorites') ?? '[]'));
      setHistory(JSON.parse(localStorage.getItem('nestfind:history') ?? '[]'));
    } catch {
      localStorage.removeItem('nestfind:favorites');
      localStorage.removeItem('nestfind:history');
    }
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agoraData, setAgoraData] = useState<AgoraTokenData | null>(null);
  const [rtmClient, setRtmClient] = useState<RTMClient | null>(null);
  const [agentJoinError, setAgentJoinError] = useState(false);

  const performListingSearch = useCallback(async (query: string, refine: boolean) => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;
    const requestId = ++listingSearchRequestRef.current;
    setHasSearched(true);
    setIsListingSearchLoading(true);
    const contextualQuery = refine && searchContextRef.current
      ? `${searchContextRef.current}. ${normalizedQuery}`
      : normalizedQuery;
    try {
      const response = await fetch(`/api/listings?query=${encodeURIComponent(contextualQuery)}`);
      const data = (await response.json()) as ListingSearchResponse | { error: string };
      if (!response.ok || !('listings' in data)) throw new Error('Could not search listings');
      if (requestId !== listingSearchRequestRef.current) return;
      searchContextRef.current = serializeSearchFilters(data.filters);
      setListings(data.listings);
      setActiveFilters(data.filters);
      setHasSearched(true);
      setHistory((current) => {
        const next: SearchHistoryItem[] = [{ id: `${Date.now()}-${contextualQuery.slice(0, 12)}`, query: contextualQuery, createdAt: Date.now(), resultCount: data.total, filters: data.filters }, ...current.filter((item) => item.query.toLowerCase() !== contextualQuery.toLowerCase())].slice(0, 12);
        localStorage.setItem('nestfind:history', JSON.stringify(next));
        return next;
      });
    } catch (searchError) { console.error('Listing search failed:', searchError); }
    finally {
      if (requestId === listingSearchRequestRef.current) {
        setIsListingSearchLoading(false);
      }
    }
  }, []);
  const handleVoiceListingSearch = useCallback((query: string) => performListingSearch(query, true), [performListingSearch]);
  const handleTextListingSearch = useCallback((query: string) => performListingSearch(query, false), [performListingSearch]);

  const handleToggleFavorite = useCallback((id: string) => {
    setFavoriteIds((current) => {
      const next = current.includes(id) ? current.filter((favoriteId) => favoriteId !== id) : [...current, id];
      localStorage.setItem('nestfind:favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleStartConversation = async () => {
    listingSearchRequestRef.current += 1;
    searchContextRef.current = '';
    setListings([]);
    setHasSearched(false);
    setActiveFilters(null);
    setIsLoading(true);
    setError(null);
    setAgentJoinError(false);

    try {
      // 1. Fetch RTC token + channel
      // console.log('Fetching Agora token...');
      const agoraResponse = await fetch('/api/generate-agora-token');
      const responseData = await agoraResponse.json();
      // console.log('Agora token response: uid =', responseData.uid, 'channel =', responseData.channel);

      if (!agoraResponse.ok) {
        throw new Error(
          `Failed to generate Agora token: ${JSON.stringify(responseData)}`,
        );
      }

      // 2. Run agent invite and RTM setup in parallel — both only need the token response.
      //    RTM must be ready before ConversationComponent mounts so AgoraVoiceAI
      //    can subscribe immediately. Agent invite is non-fatal.
      const [agentData, rtm] = await Promise.all([
        // 2a. Start the AI agent
        fetch('/api/invite-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requester_id: responseData.uid,
            channel_name: responseData.channel,
          } as ClientStartRequest),
        })
          .then(async (res) => {
            if (!res.ok) {
              setAgentJoinError(true);
              return null;
            }
            return res.json() as Promise<AgentResponse>;
          })
          .catch((err) => {
            console.error('Failed to start conversation with agent:', err);
            setAgentJoinError(true);
            return null;
          }),

        // 2b. Set up RTM (dynamically imported to keep it client-only)
        (async () => {
          const { default: AgoraRTM } = await import('agora-rtm');
          const rtm: RTMClient = new AgoraRTM.RTM(
            process.env.NEXT_PUBLIC_AGORA_APP_ID!,
            responseData.uid,
          );
          await rtm.login({ token: responseData.token });
          await rtm.subscribe(responseData.channel);
          // console.log('RTM ready, channel:', responseData.channel);
          return rtm;
        })(),
      ]);

      // 3. All dependencies ready — store state and show conversation
      setRtmClient(rtm);
      setAgoraData({ ...responseData, agentId: agentData?.agent_id });
      setShowConversation(true);
    } catch (err) {
      setError('Failed to start conversation. Please try again.');
      console.error('Error starting conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenWillExpire = useCallback(
    async (uid: string): Promise<AgoraRenewalTokens> => {
      try {
        const channel = agoraData?.channel;
        if (!channel) {
          throw new Error('Missing channel for token renewal');
        }

        // RTC and RTM tokens are renewed independently:
        //   - RTC uses the browser client's assigned UID (passed in from ConversationComponent).
        //   - RTM uses the same UID that was used during RTM login (agoraData.uid).
        // Both are fetched in parallel to stay within the token-expiry grace-period window.
        const [rtcResponse, rtmResponse] = await Promise.all([
          fetch(`/api/generate-agora-token?channel=${channel}&uid=${uid}`),
          fetch(`/api/generate-agora-token?channel=${channel}&uid=${agoraData.uid}`),
        ]);
        const [rtcData, rtmData] = await Promise.all([
          rtcResponse.json(),
          rtmResponse.json(),
        ]);

        if (!rtcResponse.ok || !rtmResponse.ok) {
          throw new Error('Failed to generate renewal tokens');
        }

        return {
          rtcToken: rtcData.token,
          rtmToken: rtmData.token,
        };
      } catch (error) {
        console.error('Error renewing token:', error);
        throw error;
      }
    },
    [agoraData],
  );

  const handleEndConversation = async () => {
    // Stop the AI agent
    if (agoraData?.agentId) {
      try {
        // console.log('Stopping agent:', agoraData.agentId);
        const response = await fetch('/api/stop-conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent_id: agoraData.agentId }),
        });
        if (!response.ok) {
          console.error('Failed to stop agent:', await response.text());
        }
        // else console.log('Agent stopped successfully');
      } catch (error) {
        console.error('Error stopping agent:', error);
      }
    }

    // Tear down RTM — owned here since we created it here
    rtmClient?.logout().catch((err) => console.error('RTM logout error:', err));
    setRtmClient(null);
    setShowConversation(false);
  };

  return (
    <div
      className={`relative flex flex-col bg-background text-foreground ${
        showConversation ? 'h-dvh overflow-hidden' : 'min-h-dvh'
      }`}
    >
      {/* Hero shell: either shows the pre-call CTA or swaps in the live conversation experience. */}
      <div
        className={`flex min-h-0 flex-1 flex-col ${
          showConversation
            ? 'h-full overflow-hidden items-stretch justify-start'
            : 'items-center justify-center'
        }`}
      >
        <div
          className={`z-10 flex min-h-0 flex-1 flex-col ${
            showConversation
              ? 'h-full w-full max-w-none overflow-hidden items-stretch gap-0 px-0 text-left'
              : 'w-full max-w-none items-stretch justify-start text-left'
          }`}
        >
          {!showConversation ? (
            <ApartmentHome
              isLoading={isLoading}
              error={error}
              userName={userName}
              listings={listings}
              listingCatalog={listingCatalog}
              hasSearched={hasSearched}
              activeFilters={activeFilters}
              favoriteIds={favoriteIds}
              history={history}
              isListingSearchLoading={isListingSearchLoading}
              onStartConversation={handleStartConversation}
              onTextSearch={handleTextListingSearch}
              onToggleFavorite={handleToggleFavorite}
            />
          ) : agoraData && rtmClient ? (
            <>
              {/* Non-fatal invite warning: the browser session can still render even if agent start failed. */}
              {agentJoinError && (
                <div className="p-3 bg-destructive/10 rounded-md text-destructive text-sm max-w-sm">
                  Failed to connect with AI agent. The conversation may not work
                  as expected.
                </div>
              )}
              {/* Browser-only conversation mount: RTC provider, error boundary, and lazy-loaded call UI. */}
              <Suspense fallback={<LoadingSkeleton />}>
                <ErrorBoundary>
                  <AgoraProvider>
                    <ConversationComponent
                      agoraData={agoraData}
                      rtmClient={rtmClient}
                      onTokenWillExpire={handleTokenWillExpire}
                      onEndConversation={handleEndConversation}
                      listings={listings}
                      hasSearched={hasSearched}
                      activeFilters={activeFilters}
                      favoriteIds={favoriteIds}
                      onToggleFavorite={handleToggleFavorite}
                      onUserTranscript={handleVoiceListingSearch}
                    />
                  </AgoraProvider>
                </ErrorBoundary>
              </Suspense>
            </>
          ) : (
            /* Fallback if session bootstrap partially succeeded but required state is missing. */
            <p className="text-sm text-muted-foreground">
              Failed to load conversation data.
            </p>
          )}
        </div>
      </div>

      {/* Persistent attribution footer for the pre-call and in-call views. */}
      {showConversation && <footer className="fixed bottom-0 right-0 z-40 py-4 pr-4 md:py-6 md:pr-6">
        <div className="flex items-center justify-end gap-2 text-muted-foreground">
          <span className="text-xs font-medium tracking-wide uppercase">
            Powered by
          </span>
          <a
            href="https://agora.io/en/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
            aria-label="Visit Agora's website"
          >
            <Image
              src="/agora-logo-rgb-blue.svg"
              alt="Agora"
              width={86}
              height={24}
              priority
              className="h-6 w-auto hover:opacity-80 transition-opacity translate-y-1"
            />
            <span className="sr-only">Agora</span>
          </a>
        </div>
      </footer>}
    </div>
  );
}

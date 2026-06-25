'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

type QuickstartConversationLayoutProps = {
  statusPanel: ReactNode;
  transcriptPanel: ReactNode;
  listingPanel: ReactNode;
  controls: ReactNode;
  onEndConversation: () => void;
};

export function QuickstartConversationLayout({
  statusPanel,
  transcriptPanel,
  listingPanel,
  controls,
  onEndConversation,
}: QuickstartConversationLayoutProps) {
  return (
    <div className="flex h-dvh min-h-0 flex-1 flex-col overflow-hidden bg-white text-left text-stone-900">
      <header className="flex shrink-0 flex-col gap-3 border-b border-stone-200 bg-white/85 px-4 py-4 backdrop-blur md:h-[76px] md:flex-row md:items-center md:justify-between md:px-6 md:py-0">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/nestfind-mark.svg"
            alt="NestFind"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 object-contain"
          />
          <div className="flex min-w-0 flex-col justify-center gap-1">
            <span className="truncate text-base font-semibold leading-none tracking-[-0.025em] text-foreground sm:text-lg">
              NestFind voice concierge
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:pr-1">
          {statusPanel}
          {controls}
          <Button
            variant="destructive"
            size="icon"
            className="h-10 w-10 rounded-full border border-destructive bg-transparent text-destructive hover:bg-destructive/10"
            onClick={onEndConversation}
            aria-label="End conversation with AI agent"
            title="End conversation"
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 w-full flex-1 gap-4 overflow-hidden px-4 pb-4 pt-4 lg:grid-cols-[20rem_1fr] md:px-6 xl:grid-cols-[22rem_1fr]">
        <aside className="order-1 hidden h-[50dvh] min-h-0 w-full lg:order-1 lg:block lg:h-full">
          {transcriptPanel}
        </aside>

        <main className="order-1 flex min-h-0 flex-col overflow-hidden lg:order-2">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white p-4 sm:p-5">
            <div className="mb-5 shrink-0 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-blue-600">Live matches</p><h2 className="mt-1 font-serif text-xl font-bold sm:text-2xl">Apartments from your conversation</h2></div><p className="text-xs text-stone-500">Results update as the conversation gets more specific.</p></div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {listingPanel}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

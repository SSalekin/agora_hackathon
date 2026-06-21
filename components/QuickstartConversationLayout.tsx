'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

type QuickstartConversationLayoutProps = {
  statusPanel: ReactNode;
  pipelineMetrics: ReactNode;
  transcriptPanel: ReactNode;
  listingPanel: ReactNode;
  visualizer: ReactNode;
  controls: ReactNode;
  onEndConversation: () => void;
};

export function QuickstartConversationLayout({
  statusPanel,
  pipelineMetrics,
  transcriptPanel,
  listingPanel,
  visualizer,
  controls,
  onEndConversation,
}: QuickstartConversationLayoutProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f7f5ef] text-left text-stone-900">
      <header className="flex shrink-0 flex-col gap-4 border-b border-stone-200 bg-white/85 px-4 py-4 backdrop-blur md:h-[76px] md:flex-row md:items-center md:justify-between md:px-6 md:py-0">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/nestfind-mark.svg"
            alt="NestFind"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 object-contain"
          />
          <div className="flex min-w-0 flex-col justify-center gap-1">
            <span className="truncate text-lg font-semibold leading-none tracking-[-0.025em] text-foreground">
              NestFind voice concierge
            </span>
            {pipelineMetrics}
          </div>
        </div>

        <div className="flex items-center gap-2 md:pr-1">
          {statusPanel}
          <Button
            variant="destructive"
            size="sm"
            className="h-8 rounded-md border border-destructive bg-transparent px-3 text-xs font-medium text-destructive hover:bg-destructive/10"
            onClick={onEndConversation}
            aria-label="End conversation with AI agent"
            title="End conversation"
          >
            End Conversation
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 w-full flex-1 gap-4 overflow-hidden px-4 pb-4 pt-4 md:px-6 lg:grid-cols-[22rem_1fr]">
        <aside className="order-2 h-64 min-h-0 w-full lg:order-1 lg:h-full">
          {transcriptPanel}
        </aside>

        <main className="order-1 flex min-h-0 flex-col overflow-hidden lg:order-2">
          <div className="mb-4 grid shrink-0 gap-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex min-h-[8rem] items-center justify-center overflow-hidden">
              {visualizer}
            </div>
            <div className="shrink-0">{controls}</div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-3xl border border-stone-200 bg-[#fbfaf7] p-4 sm:p-5">
            <div className="mb-5"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-emerald-800">Live matches</p><h2 className="mt-1 font-serif text-2xl font-bold">Apartments from your conversation</h2></div>
            {listingPanel}
          </div>
        </main>
      </div>
    </div>
  );
}

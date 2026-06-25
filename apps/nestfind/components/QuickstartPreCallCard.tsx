'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type QuickstartPreCallCardProps = {
  isLoading: boolean;
  error: string | null;
  onStartConversation: () => void;
};

export function QuickstartPreCallCard({
  isLoading,
  error,
  onStartConversation,
}: QuickstartPreCallCardProps) {
  return (
    <div className="mx-auto flex w-[min(92vw,26.25rem)] animate-fade-up flex-col items-center rounded-[20px] border border-stone-200 bg-white px-10 py-10 text-center shadow-lg">
      <h1 className="text-[28px] font-medium leading-[1.2] text-stone-900">
        Try Agora&apos;s Voice Agent
      </h1>
      <p className="mt-[14px] text-sm font-medium leading-6 text-muted-foreground">
        Built on Agora&apos;s flagship Conversational AI engine, for effortless
        agentic conversations.
      </p>

      <Button
        onClick={onStartConversation}
        disabled={isLoading}
        className="mt-12 h-10 w-full rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-70"
        aria-label={
          isLoading
            ? 'Starting conversation with AI agent'
            : 'Start conversation with AI agent'
        }
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Starting...
          </>
        ) : (
          'Start Conversation'
        )}
      </Button>
      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
    </div>
  );
}

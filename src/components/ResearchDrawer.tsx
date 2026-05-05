'use client';

import { useEffect, useRef, useState } from 'react';
import type { RFPResult } from '@/types';
import type { PartialResearchResult } from '@/types/research';
import OverviewCard from './research/OverviewCard';
import RequirementsCard from './research/RequirementsCard';
import SimilarOppsCard from './research/SimilarOppsCard';
import FitAssessmentCard from './research/FitAssessmentCard';

interface ResearchDrawerProps {
  rfp: RFPResult | null;
  profileId: string | null;
  onClose: () => void;
}

interface ToolStep {
  name: string;
  label: string;
  done: boolean;
}

type Phase = 'idle' | 'tools' | 'analyzing' | 'done' | 'error';

const toolLabels: Record<string, string> = {
  researchOpportunity: 'Querying Exa for opportunity details',
  findSimilar: 'Finding similar opportunities',
};

export default function ResearchDrawer({ rfp, profileId, onClose }: ResearchDrawerProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [toolSteps, setToolSteps] = useState<ToolStep[]>([]);
  const [researchData, setResearchData] = useState<PartialResearchResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!rfp || !profileId) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      setPhase('tools');
      setToolSteps([]);
      setResearchData(null);
      setErrorMessage('');

      try {
        const res = await fetch('/api/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rfp, profileId }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          setPhase('error');
          setErrorMessage('Research request failed.');
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const msg = JSON.parse(line);
              switch (msg.event) {
                case 'tool':
                  setToolSteps((prev) => {
                    const existing = prev.find((s) => s.name === msg.name);
                    if (existing) {
                      return prev.map((s) =>
                        s.name === msg.name ? { ...s, done: msg.status === 'done' } : s
                      );
                    }
                    return [
                      ...prev,
                      {
                        name: msg.name,
                        label: toolLabels[msg.name] ?? msg.name,
                        done: msg.status === 'done',
                      },
                    ];
                  });
                  break;
                case 'analyzing':
                  setPhase('analyzing');
                  break;
                case 'partial':
                  setResearchData(msg.data);
                  break;
                case 'done':
                  setResearchData(msg.data);
                  setPhase('done');
                  break;
                case 'error':
                  setPhase('error');
                  setErrorMessage(msg.message ?? 'Research failed.');
                  break;
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim()) {
          try {
            const msg = JSON.parse(buffer);
            if (msg.event === 'done') {
              setResearchData(msg.data);
              setPhase('done');
            } else if (msg.event === 'error') {
              setPhase('error');
              setErrorMessage(msg.message ?? 'Research failed.');
            }
          } catch {
            // ignore
          }
        }

        // If we finished streaming but never got a done event
        setPhase((prev) => (prev === 'analyzing' ? 'done' : prev));
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setPhase('error');
          setErrorMessage('Research request failed.');
        }
      }
    })();

    return () => controller.abort();
  }, [rfp, profileId]);

  if (!rfp) return null;

  const isLoading = phase === 'tools' || phase === 'analyzing';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
              Deep Research
            </p>
            <h2 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
              {rfp.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tool progress */}
        {phase === 'tools' && (
          <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex flex-col gap-1.5">
            {toolSteps.length > 0 ? (
              toolSteps.map((step, idx) => (
                <div key={`${step.name}-${idx}`} className="flex items-center gap-2">
                  {step.done ? (
                    <svg className="w-3.5 h-3.5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-blue-600 animate-spin shrink-0" />
                  )}
                  <p className={`text-xs font-medium ${step.done ? 'text-green-700' : 'text-blue-700'}`}>
                    {step.label}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-xs text-blue-700 font-medium">Starting research...</p>
              </div>
            )}
          </div>
        )}

        {/* Analyzing indicator */}
        {phase === 'analyzing' && !researchData && (
          <div className="flex items-center gap-2 px-5 py-3 bg-blue-50 border-b border-blue-100">
            <div className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-blue-600 animate-spin shrink-0" />
            <p className="text-xs text-blue-700 font-medium">Analyzing research data...</p>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="px-5 py-3 bg-red-50 border-b border-red-100">
            <p className="text-xs text-red-700">{errorMessage || 'Research failed. Please try again.'}</p>
          </div>
        )}

        {/* Structured content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {researchData || isLoading ? (
            <>
              <OverviewCard data={researchData?.overview} loading={isLoading} />
              <RequirementsCard requirements={researchData?.requirements} loading={isLoading} />
              <SimilarOppsCard opportunities={researchData?.similarOpportunities} loading={isLoading} />
              <FitAssessmentCard data={researchData?.fitAssessment} loading={isLoading} />
            </>
          ) : phase !== 'error' ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading research...</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

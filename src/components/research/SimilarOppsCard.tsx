import type { ResearchResult } from '@/types';

type SimilarOpp = ResearchResult['similarOpportunities'][number];

interface SimilarOppsCardProps {
  opportunities?: Partial<SimilarOpp>[];
  loading: boolean;
}

export default function SimilarOppsCard({ opportunities, loading }: SimilarOppsCardProps) {
  if (!loading && (!opportunities || opportunities.length === 0)) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Similar Opportunities
        </h3>
      </div>
      <div className="divide-y divide-gray-100">
        {opportunities && opportunities.length > 0 ? (
          opportunities.map((opp, i) => (
            <div key={i} className="px-4 py-3">
              {opp.title && opp.url ? (
                <a
                  href={opp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {opp.title}
                </a>
              ) : opp.title ? (
                <p className="text-sm font-medium text-gray-900">{opp.title}</p>
              ) : (
                <div className="h-4 w-48 rounded bg-gray-200 animate-pulse" />
              )}
              {opp.relevance && (
                <p className="text-xs text-gray-500 mt-1">{opp.relevance}</p>
              )}
            </div>
          ))
        ) : (
          <>
            {[1, 2].map((n) => (
              <div key={n} className="px-4 py-3 space-y-2">
                <div className="h-4 w-48 rounded bg-gray-200 animate-pulse" />
                <div className="h-3 w-32 rounded bg-gray-200 animate-pulse" />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

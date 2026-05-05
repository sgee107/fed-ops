import type { ResearchResult } from '@/types';

interface FitAssessmentCardProps {
  data?: Partial<ResearchResult['fitAssessment']>;
  loading: boolean;
}

const scoreColors: Record<string, string> = {
  'Strong Fit': 'bg-green-100 text-green-800 border-green-200',
  'Moderate Fit': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Weak Fit': 'bg-red-100 text-red-800 border-red-200',
};

const recColors: Record<string, string> = {
  Go: 'bg-green-600 text-white',
  'No-Go': 'bg-red-600 text-white',
  'Conditional Go': 'bg-yellow-500 text-white',
};

export default function FitAssessmentCard({ data, loading }: FitAssessmentCardProps) {
  if (!loading && !data) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Fit Assessment
        </h3>
      </div>
      <div className="p-4 space-y-4">
        {/* Score + Recommendation badges */}
        <div className="flex items-center gap-3 flex-wrap">
          {data?.score ? (
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${scoreColors[data.score] ?? 'bg-gray-100 text-gray-800 border-gray-200'}`}
            >
              {data.score}
            </span>
          ) : loading ? (
            <div className="h-7 w-28 rounded-full bg-gray-200 animate-pulse" />
          ) : null}

          {data?.recommendation ? (
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${recColors[data.recommendation] ?? 'bg-gray-600 text-white'}`}
            >
              {data.recommendation}
            </span>
          ) : loading ? (
            <div className="h-7 w-20 rounded-full bg-gray-200 animate-pulse" />
          ) : null}
        </div>

        {/* Strengths */}
        {(data?.strengths?.length ?? 0) > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-green-700 uppercase tracking-wide mb-1.5">
              Strengths
            </p>
            <ul className="space-y-1">
              {data!.strengths!.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-800 bg-green-50 border border-green-100 rounded-lg px-3 py-1.5"
                >
                  <svg className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risks */}
        {(data?.risks?.length ?? 0) > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-1.5">
              Risks
            </p>
            <ul className="space-y-1">
              {data!.risks!.map((r, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5"
                >
                  <svg className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Rationale */}
        {data?.rationale && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Rationale
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{data.rationale}</p>
          </div>
        )}

        {/* Loading skeleton for rationale */}
        {loading && !data?.rationale && (
          <div className="space-y-2">
            <div className="h-3 w-16 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-gray-200 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}

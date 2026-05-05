import type { ResearchResult } from '@/types';

interface OverviewCardProps {
  data?: Partial<ResearchResult['overview']>;
  loading: boolean;
}

const fields: { key: keyof ResearchResult['overview']; label: string }[] = [
  { key: 'agency', label: 'Agency' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'estimatedBudget', label: 'Est. Budget' },
  { key: 'naicsCode', label: 'NAICS' },
  { key: 'setAsideType', label: 'Set-Aside' },
  { key: 'solicitationNumber', label: 'Solicitation #' },
  { key: 'placeOfPerformance', label: 'Place of Performance' },
];

function Shimmer() {
  return <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />;
}

export default function OverviewCard({ data, loading }: OverviewCardProps) {
  const hasAnyData = data && Object.values(data).some(Boolean);

  if (!loading && !hasAnyData) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Opportunity Overview
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4">
        {fields.map(({ key, label }) => {
          const value = data?.[key];
          if (!loading && !value) return null;
          return (
            <div key={key} className="min-w-0">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">
                {label}
              </p>
              {value ? (
                <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
              ) : (
                <Shimmer />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

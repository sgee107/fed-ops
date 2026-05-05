import type { RFPResult } from '@/types';
import RFPCard from './RFPCard';

interface RFPResultListProps {
  results: RFPResult[];
  onResearch: (rfp: RFPResult) => void;
}

export default function RFPResultList({ results, onResearch }: RFPResultListProps) {
  if (results.length === 0) return null;

  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">
        {results.length} opportunit{results.length === 1 ? 'y' : 'ies'} found
      </p>
      <div className="space-y-3">
        {results.map(rfp => (
          <RFPCard key={rfp.id} rfp={rfp} onResearch={onResearch} />
        ))}
      </div>
    </div>
  );
}

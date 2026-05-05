import type { RFPResult } from '@/types';

interface RFPCardProps {
  rfp: RFPResult;
  onResearch: (rfp: RFPResult) => void;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')     // headings
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1')     // italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/^\s*[-*]\s+/gm, '')     // list markers
    .replace(/\[\.{3}\]/g, ' ')       // [...] markers
    .replace(/\n{2,}/g, '\n')         // collapse blank lines
    .trim();
}

function domainBadge(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export default function RFPCard({ rfp, onResearch }: RFPCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-2">
        <a
          href={rfp.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 font-medium text-sm hover:underline leading-snug flex-1"
        >
          {rfp.title}
        </a>
        <span className="shrink-0 rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs text-blue-600">
          {domainBadge(rfp.url)}
        </span>
      </div>

      {rfp.highlights && rfp.highlights.length > 0 && (
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-3">
          {stripMarkdown(rfp.highlights[0])}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        {rfp.publishedDate ? (
          <p className="text-xs text-gray-400">
            {new Date(rfp.publishedDate).toLocaleDateString()}
          </p>
        ) : (
          <span />
        )}
        <button
          onClick={() => onResearch(rfp)}
          className="rounded-lg bg-gray-100 hover:bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors"
        >
          Research →
        </button>
      </div>
    </div>
  );
}

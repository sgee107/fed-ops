interface RequirementsCardProps {
  requirements?: string[];
  loading: boolean;
}

export default function RequirementsCard({ requirements, loading }: RequirementsCardProps) {
  if (!loading && (!requirements || requirements.length === 0)) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Key Requirements
        </h3>
      </div>
      <ul className="p-4 space-y-2">
        {requirements && requirements.length > 0 ? (
          requirements.map((req, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
              <svg
                className="w-4 h-4 text-blue-500 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{req}</span>
            </li>
          ))
        ) : (
          <>
            {[1, 2, 3].map((n) => (
              <li key={n} className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-200 animate-pulse shrink-0 mt-0.5" />
                <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
              </li>
            ))}
          </>
        )}
      </ul>
    </div>
  );
}

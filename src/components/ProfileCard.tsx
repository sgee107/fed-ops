import type { CompanyProfile } from '@/types';

interface ProfileCardProps {
  profile: CompanyProfile;
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">{profile.name}</h2>
          <p className="text-sm text-gray-500">{profile.sector}</p>
        </div>
        <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
          {profile.employees} employees
        </span>
      </div>

      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
          Certifications
        </p>
        <div className="flex flex-wrap gap-1.5">
          {profile.certifications.map(cert => (
            <span
              key={cert}
              className="rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs text-blue-700"
            >
              {cert}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
          Target Agencies
        </p>
        <p className="text-xs text-gray-600 leading-relaxed">
          {profile.targetAgencies.join(' · ')}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
          Contract Range
        </p>
        <p className="text-sm font-medium text-gray-800">
          {formatCurrency(profile.contractSizeMin)} – {formatCurrency(profile.contractSizeMax)}
        </p>
      </div>
    </div>
  );
}

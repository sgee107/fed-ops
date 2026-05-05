import type { CompanyProfile } from '@/types';

interface ProfileSelectorProps {
  profiles: CompanyProfile[];
  selected: CompanyProfile | null;
  onSelect: (p: CompanyProfile) => void;
}

export default function ProfileSelector({ profiles, selected, onSelect }: ProfileSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
        Company Profile
      </p>
      {profiles.map(profile => (
        <button
          key={profile.id}
          onClick={() => onSelect(profile)}
          className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
            selected?.id === profile.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <p className={`text-sm font-semibold leading-snug ${selected?.id === profile.id ? 'text-blue-900' : 'text-gray-800'}`}>
            {profile.name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{profile.sector}</p>
          <p className="text-xs text-gray-400 mt-0.5">{profile.employees} employees</p>
        </button>
      ))}
    </div>
  );
}

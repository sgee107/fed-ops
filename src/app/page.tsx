'use client';

import { useState } from 'react';
import profiles from '@/lib/profiles';
import type { CompanyProfile, RFPResult } from '@/types';
import ProfileSelector from '@/components/ProfileSelector';
import ProfileCard from '@/components/ProfileCard';
import RFPResultList from '@/components/RFPResultList';
import ResearchDrawer from '@/components/ResearchDrawer';

export default function Home() {
  const [selectedProfile, setSelectedProfile] = useState<CompanyProfile | null>(null);
  const [rfpResults, setRfpResults] = useState<RFPResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeResearch, setActiveResearch] = useState<RFPResult | null>(null);
  const [searchError, setSearchError] = useState('');

  async function handleFindRFPs() {
    if (!selectedProfile || searchLoading) return;
    setSearchLoading(true);
    setSearchError('');
    setRfpResults([]);


    try {
      const res = await fetch('/api/find-rfps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: selectedProfile.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Search failed: ${res.statusText}`);
      setRfpResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearchLoading(false);
    }
  }

  function handleSelectProfile(p: CompanyProfile) {
    setSelectedProfile(p);
    setRfpResults([]);

    setSearchError('');
  }

  function handleGoHome() {
    setSelectedProfile(null);
    setRfpResults([]);

    setSearchError('');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2">
        <p className="text-xs text-amber-800 text-center">
          This is a demonstration. In production, profiles would be updated automatically based on your company data.
        </p>
      </div>

      <div className="flex h-[calc(100vh-36px)]">
        <aside className="w-72 shrink-0 border-r border-gray-200 bg-white p-5 overflow-y-auto">
          <button onClick={handleGoHome} className="mb-6 text-left">
            <h1 className="text-lg font-bold text-gray-900">Federal RFP Finder</h1>
            <p className="text-xs text-gray-500 mt-0.5">Powered by Exa + Claude</p>
          </button>
          <ProfileSelector
            profiles={profiles}
            selected={selectedProfile}
            onSelect={handleSelectProfile}
          />
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-5">
            {selectedProfile && (
              <>
                <ProfileCard profile={selectedProfile} />

                <button
                  onClick={handleFindRFPs}
                  disabled={!selectedProfile || searchLoading}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {searchLoading
                    ? 'Searching…'
                    : `Find RFPs for ${selectedProfile.name}`}
                </button>

                {searchError && (
                  <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {searchError}
                  </p>
                )}

                {searchLoading && (
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Searching federal databases…</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Running multiple searches across SAM.gov, Grants.gov, and more
                      </p>
                    </div>
                  </div>
                )}

                {!searchLoading && rfpResults.length === 0 && !searchError && (
                  <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
                    <p className="text-sm text-gray-400">
                      Click{' '}
                      <span className="font-medium text-gray-600">
                        &quot;Find RFPs for {selectedProfile.name}&quot;
                      </span>{' '}
                      to discover opportunities
                    </p>
                  </div>
                )}

                <RFPResultList results={rfpResults} onResearch={setActiveResearch} />
              </>
            )}

            {!selectedProfile && (
              <div className="space-y-6">
                <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">The problem</h2>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    Capture managers at federal contractors spend{' '}
                    <span className="font-medium">2-4 hours per opportunity</span>{' '}on basic qualification
                    research — toggling between SAM.gov, USAspending, GAO protest databases, and agency
                    forecasts. They evaluate 10-30 opportunities per week. That&apos;s up to 120 hours of
                    manual research before any strategic thinking begins.
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    The data is public and freely available. It&apos;s just scattered across disconnected
                    government databases with no unified search layer.
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Why existing tools fall short</h2>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    Incumbents like GovWin and Bloomberg Government charge{' '}
                    <span className="font-medium">$30-80K/year per seat</span> and still deliver keyword-based
                    search. Users configure manual queries, monitor saved searches, and do the cross-referencing
                    themselves.
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    This tool uses{' '}
                    <span className="font-medium">Exa&apos;s neural search</span>{' '}to semantically match
                    opportunities to your company&apos;s actual capabilities — NAICS codes, certifications,
                    past performance areas, and agency relationships — instead of requiring you to guess the
                    right keywords.
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">What you can do here</h2>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                      <span><span className="font-medium">Discover opportunities</span> — Select a company profile and find semantically matched RFPs, RFIs, and solicitations in one click</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                      <span><span className="font-medium">Deep-dive any result</span> — Pull deadlines, budgets, incumbents, and related opportunities without leaving the app</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                      <span><span className="font-medium">See the difference</span> — Results are ranked by fit to your profile, not keyword frequency</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Where it could go</h2>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-300 shrink-0" />
                      <span>Auto-aggregate a daily feed based on your saved profile</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-300 shrink-0" />
                      <span>Generate draft RFP responses from your past performance data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-300 shrink-0" />
                      <span>Track deadlines and notify when new matching opportunities appear</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-300 shrink-0" />
                      <span>Ingest your real company data instead of demo profiles</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
                  <p className="text-sm text-gray-500">Select a company profile from the sidebar to try it out</p>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      <ResearchDrawer
        rfp={activeResearch}
        profileId={selectedProfile?.id ?? null}
        onClose={() => setActiveResearch(null)}
      />
    </div>
  );
}

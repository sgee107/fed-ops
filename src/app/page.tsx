"use client";

import { useState } from "react";

interface ExaResult {
  id: string;
  url: string;
  title: string;
  publishedDate?: string;
  highlights?: string[];
}

const EXAMPLE_QUERIES = [
  "IT modernization USAF small business RFP",
  "construction services DoD solicitation 2025",
  "cybersecurity services federal agency contract opportunity",
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExaResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(q?: string) {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function domainBadge(url: string) {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Federal Opportunity Finder
          </h1>
          <p className="text-gray-500 text-sm">
            Neural search across SAM.gov, Grants.gov, USASpending, and more —
            powered by Exa
          </p>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g. IT modernization USAF small business RFP"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => {
                setQuery(q);
                handleSearch(q);
              }}
              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-100"
            >
              {q}
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
            {error}
          </p>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
              {results.length} results
            </p>
            {results.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 font-medium text-sm hover:underline leading-snug"
                  >
                    {r.title || r.url}
                  </a>
                  <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600 border border-blue-100">
                    {domainBadge(r.url)}
                  </span>
                </div>
                {r.highlights && r.highlights.length > 0 && (
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                    {r.highlights[0]}
                  </p>
                )}
                {r.publishedDate && (
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(r.publishedDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <p className="text-center text-sm text-gray-400 mt-16">
            Enter a query or pick an example above to find federal opportunities
          </p>
        )}
      </div>
    </div>
  );
}

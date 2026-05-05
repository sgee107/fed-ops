import { generateText, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { NextRequest, NextResponse } from 'next/server';
import { getProfileById } from '@/lib/profiles';
import { rfpWebSearch } from '@/lib/exa-tools';
import type { RFPResult } from '@/types';

type ExaResult = {
  id?: string;
  url: string;
  title: string;
  publishedDate?: string;
  highlights?: string[];
  summary?: string;
};

type ExaSearchResponse = {
  results?: ExaResult[];
};

export async function POST(req: NextRequest) {
  const { profileId } = await req.json();
  const profile = getProfileById(profileId);

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 400 });
  }

  const systemPrompt = `You are a federal procurement specialist helping ${profile.name}, a ${profile.employees}-person ${profile.sector} company, find relevant RFP opportunities.

${profile.systemPromptContext}

Contract size range: $${profile.contractSizeMin.toLocaleString()} – $${profile.contractSizeMax.toLocaleString()}.
Target agencies: ${profile.targetAgencies.join(', ')}.

Run 2–3 targeted searches using the rfpWebSearch tool, using different combinations of NAICS codes (${profile.naicsCodes.join(', ')}) and terms from the company's focus areas. Find active solicitations, sources sought, and RFPs.`;

  try {
    const result = await generateText({
      model: anthropic('claude-sonnet-4-5'),
      system: systemPrompt,
      prompt: `Search for active federal RFP opportunities for ${profile.name}. Focus areas: ${profile.searchBias}. Run multiple searches to maximize coverage.`,
      tools: { rfpWebSearch },
      stopWhen: stepCountIs(5),
    });

    const seen = new Set<string>();
    const rfpResults: RFPResult[] = [];

    for (const step of result.steps) {
      for (const toolResult of step.toolResults) {
        const data = toolResult.output as ExaSearchResponse;
        if (data?.results) {
          for (const r of data.results) {
            if (!seen.has(r.url)) {
              seen.add(r.url);
              rfpResults.push({
                id: r.id ?? r.url,
                url: r.url,
                title: r.title || r.url,
                publishedDate: r.publishedDate,
                highlights: r.highlights,
                summary: r.summary,
              });
            }
          }
        }
      }
    }

    return NextResponse.json(rfpResults);
  } catch (err) {
    console.error('[find-rfps] Agent error:', err);
    const message = err instanceof Error ? err.message : 'Search agent failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

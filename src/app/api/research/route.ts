import { streamText, streamObject, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { NextRequest } from 'next/server';
import { getProfileById } from '@/lib/profiles';
import { findSimilar, researchOpportunity } from '@/lib/exa-tools';
import { ResearchResultSchema } from '@/types/research';
import type { RFPResult } from '@/types';

export async function POST(req: NextRequest) {
  const { rfp, profileId } = (await req.json()) as { rfp: RFPResult; profileId: string };

  const profile = getProfileById(profileId);
  const profileName = profile?.name ?? 'the company';

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        // Phase 1: Gather data with tools
        const toolResults: Record<string, unknown> = {};

        const gatherPrompt = `You are a senior federal procurement analyst. Research this opportunity by:
1. Call researchOpportunity to find: deadline, estimated budget/ceiling, NAICS code, set-aside type, key requirements, agency, solicitation number, place of performance, and any incumbent information.
2. Call findSimilar to discover related opportunities from the same agency or program.

Title: ${rfp.title}
URL: ${rfp.url}${rfp.highlights?.[0] ? '\n\nHighlight: ' + rfp.highlights[0] : ''}

Do NOT write any analysis. Just call the tools to gather data.`;

        const gatherResult = streamText({
          model: anthropic('claude-sonnet-4-5'),
          prompt: gatherPrompt,
          tools: { researchOpportunity, findSimilar },
          stopWhen: stepCountIs(4),
        });

        for await (const part of gatherResult.fullStream) {
          if (part.type === 'tool-call') {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ event: 'tool', name: part.toolName, status: 'running' }) + '\n'
              )
            );
          } else if (part.type === 'tool-result') {
            toolResults[part.toolName] = part.output;
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ event: 'tool', name: part.toolName, status: 'done' }) + '\n'
              )
            );
          }
        }

        // Phase 2: Generate structured output
        controller.enqueue(
          encoder.encode(JSON.stringify({ event: 'analyzing' }) + '\n')
        );

        const structuredPrompt = `You are a federal procurement analyst for ${profileName}.

${profile ? profile.systemPromptContext : ''}

Based on the following research data, produce a structured analysis of this opportunity.

Opportunity: ${rfp.title} (${rfp.url})

Research data:
${JSON.stringify(toolResults.researchOpportunity ?? 'No research data available', null, 2)}

Similar opportunities found:
${JSON.stringify(toolResults.findSimilar ?? 'No similar opportunities found', null, 2)}

IMPORTANT: If a field cannot be determined from the data, omit it rather than guessing. Only include information you can verify from the research data.`;

        const objectResult = streamObject({
          model: anthropic('claude-sonnet-4-5'),
          schema: ResearchResultSchema,
          prompt: structuredPrompt,
        });

        for await (const partial of objectResult.partialObjectStream) {
          controller.enqueue(
            encoder.encode(JSON.stringify({ event: 'partial', data: partial }) + '\n')
          );
        }

        const finalObject = await objectResult.object;
        controller.enqueue(
          encoder.encode(JSON.stringify({ event: 'done', data: finalObject }) + '\n')
        );
      } catch (err) {
        console.error('[research] Stream error:', err);
        const msg = err instanceof Error ? err.message : 'Research failed';
        controller.enqueue(
          encoder.encode(JSON.stringify({ event: 'error', message: msg }) + '\n')
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' },
  });
}

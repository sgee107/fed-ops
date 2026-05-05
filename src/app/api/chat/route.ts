import { streamText, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { NextRequest } from 'next/server';
import { getProfileById } from '@/lib/profiles';
import { rfpWebSearch } from '@/lib/exa-tools';
import type { RFPResult } from '@/types';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export async function POST(req: NextRequest) {
  const { messages, profileId, rfpContext } = await req.json();

  const profile = profileId ? getProfileById(profileId) : null;

  const rfpContextStr = Array.isArray(rfpContext) && rfpContext.length > 0
    ? rfpContext.map((r: RFPResult) =>
        `- ${r.title} (${r.url})${r.highlights?.[0] ? '\n  ' + r.highlights[0] : ''}`
      ).join('\n')
    : 'No RFP results loaded yet.';

  const systemPrompt = profile
    ? `You are a federal procurement assistant for ${profile.name}, a ${profile.sector} company.

${profile.systemPromptContext}

Current RFP opportunities found for this profile:
${rfpContextStr}

Help the user analyze these procurement opportunities and answer questions about federal contracting relevant to this company. You may use rfpWebSearch to look up additional information. If asked about topics completely unrelated to federal procurement, government contracting, or this company's business, politely decline and redirect to procurement topics.`
    : `You are a federal procurement assistant. Help the user with federal contracting questions. If asked about topics unrelated to federal procurement, politely decline.`;

  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-5'),
      system: systemPrompt,
      messages: (messages as ChatMessage[]).map(m => ({
        role: m.role,
        content: m.content,
      })),
      tools: { rfpWebSearch },
      stopWhen: stepCountIs(3),
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('[chat] Agent error:', err);
    const message = err instanceof Error ? err.message : 'Chat agent failed';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

import { webSearch } from '@exalabs/ai-sdk';
import { tool } from 'ai';
import { z } from 'zod';
import Exa from 'exa-js';

const exa = new Exa(process.env.EXA_API_KEY!);

export const rfpWebSearch = webSearch({
  includeDomains: ['sam.gov', 'grants.gov', 'usaspending.gov', 'fpds.gov', 'acquisition.gov'],
  numResults: 8,
  contents: {
    highlights: true,
    summary: true,
    text: { maxCharacters: 2000 },
    livecrawl: 'preferred',
  },
});

export const findSimilar = tool({
  description: 'Find federal opportunities similar to a given URL',
  inputSchema: z.object({
    url: z.string().describe('URL of the RFP or opportunity to find similar ones for'),
  }),
  execute: async ({ url }) => {
    const result = await exa.findSimilar(url, {
      numResults: 5,
      contents: { highlights: true, summary: true },
    });
    return result.results;
  },
});

export const researchOpportunity = tool({
  description: 'Answer a specific question about a federal procurement opportunity using Exa',
  inputSchema: z.object({
    question: z.string().describe('The question to answer about this federal opportunity'),
  }),
  execute: async ({ question }) => {
    const result = await exa.answer(question);
    return { answer: result.answer, citations: result.citations };
  },
});

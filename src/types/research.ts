import { z } from 'zod';

export const ResearchResultSchema = z.object({
  overview: z.object({
    deadline: z.string().optional(),
    estimatedBudget: z.string().optional(),
    naicsCode: z.string().optional(),
    setAsideType: z.string().optional(),
    agency: z.string().optional(),
    solicitationNumber: z.string().optional(),
    placeOfPerformance: z.string().optional(),
  }),
  requirements: z.array(z.string()),
  similarOpportunities: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      relevance: z.string(),
    })
  ),
  fitAssessment: z.object({
    score: z.enum(['Strong Fit', 'Moderate Fit', 'Weak Fit']),
    recommendation: z.enum(['Go', 'No-Go', 'Conditional Go']),
    strengths: z.array(z.string()),
    risks: z.array(z.string()),
    rationale: z.string(),
  }),
});

export type ResearchResult = z.infer<typeof ResearchResultSchema>;

export type PartialResearchResult = {
  overview?: Partial<ResearchResult['overview']>;
  requirements?: string[];
  similarOpportunities?: Partial<ResearchResult['similarOpportunities'][number]>[];
  fitAssessment?: Partial<ResearchResult['fitAssessment']>;
};

export { ResearchResultSchema, type ResearchResult, type PartialResearchResult } from './research';

export interface CompanyProfile {
  id: string;
  name: string;
  sector: string;
  employees: number;
  certifications: string[];
  naicsCodes: string[];
  targetAgencies: string[];
  contractSizeMin: number;
  contractSizeMax: number;
  description: string;
  searchBias: string;
  systemPromptContext: string;
}

export interface RFPResult {
  id: string;
  url: string;
  title: string;
  publishedDate?: string;
  highlights?: string[];
  summary?: string;
}

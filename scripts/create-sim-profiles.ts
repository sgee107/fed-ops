import { generateText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { webSearch } from "@exalabs/ai-sdk";
import * as fs from "fs";
import * as path from "path";
import type { CompanyProfile } from "../src/types/index.js";

// Load .env.local so the script works outside of Next.js
const envPath = path.join(path.dirname(new URL(import.meta.url).pathname), "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  }
}

const archetypeSeeds = [
  {
    archetype: "Apex Defense",
    focus: "defense IT / cybersecurity",
    hints:
      "Focus on DoD, DHS, intelligence community contracts. NAICS codes around 541512, 541519, 541330. Certifications like CMMC, ISO 27001, Secret/TS clearances.",
  },
  {
    archetype: "MedBridge",
    focus: "healthcare IT",
    hints:
      "Focus on VA, HHS, CMS, NIH contracts. NAICS codes around 541511, 621999, 334510. Certifications like FedRAMP, HIPAA, HITRUST.",
  },
  {
    archetype: "Cascade Infrastructure",
    focus: "civil construction / environmental engineering",
    hints:
      "Focus on Army Corps of Engineers, EPA, DOT, FEMA contracts. NAICS codes around 237110, 237990, 562910. Certifications like SBA 8(a), HUBZone.",
  },
];

const systemPrompt = `You are a federal contracting analyst. For each company archetype provided, you will:
1. Research 3-5 real companies in that space using web search
2. Extract their typical employee count, certifications, target agencies, NAICS codes, and contract size ranges
3. Synthesize a fictional company profile that is realistic but not a real company

Return ONLY a valid JSON array of CompanyProfile objects. No markdown, no explanation — just the JSON array.

Each CompanyProfile must have ALL of these fields:
- id: string (kebab-case, e.g. "apex-defense")
- name: string (fictional company name)
- sector: string (brief sector description)
- employees: number (integer)
- certifications: string[] (relevant certifications)
- naicsCodes: string[] (relevant NAICS codes as strings)
- targetAgencies: string[] (federal agencies this company typically targets)
- contractSizeMin: number (minimum contract size in dollars)
- contractSizeMax: number (maximum contract size in dollars)
- description: string (2-3 sentence company description)
- searchBias: string (keywords/phrases to bias RFP searches for this company)
- systemPromptContext: string (2-3 sentences describing the company for use in an AI system prompt when searching for RFPs)`;

const userPrompt = `Research and synthesize fictional company profiles for these three archetypes:

${archetypeSeeds
  .map(
    (s) => `**${s.archetype}** (${s.focus})
Hints: ${s.hints}`
  )
  .join("\n\n")}

Use the webSearch tool to research real companies in each space before synthesizing the profiles.
Return the result as a JSON array of 3 CompanyProfile objects.`;

async function main() {
  console.log("Generating company profiles via Claude + Exa...");

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-5"),
    system: systemPrompt,
    prompt: userPrompt,
    tools: {
      webSearch: webSearch({
        includeDomains: [
          "sam.gov",
          "usaspending.gov",
          "fpds.gov",
          "linkedin.com",
          "dnb.com",
          "govwin.com",
        ],
        numResults: 5,
        contents: {
          highlights: true,
          summary: true,
        },
      }),
    },
    stopWhen: stepCountIs(10),
  });

  // Extract JSON from the response
  let profiles: CompanyProfile[];
  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    profiles = JSON.parse(cleaned);
  } catch {
    // Try to find JSON array in the text
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      throw new Error(`Could not parse JSON from response:\n${text}`);
    }
    profiles = JSON.parse(match[0]);
  }

  if (!Array.isArray(profiles) || profiles.length !== 3) {
    throw new Error(
      `Expected 3 profiles, got ${Array.isArray(profiles) ? profiles.length : "non-array"}`
    );
  }

  const requiredFields: (keyof CompanyProfile)[] = [
    "id",
    "name",
    "sector",
    "employees",
    "certifications",
    "naicsCodes",
    "targetAgencies",
    "contractSizeMin",
    "contractSizeMax",
    "description",
    "searchBias",
    "systemPromptContext",
  ];

  for (const profile of profiles) {
    for (const field of requiredFields) {
      if (!(field in profile)) {
        throw new Error(`Missing field '${field}' in profile: ${profile.id}`);
      }
    }
  }

  const outPath = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "../src/data/profiles.json"
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(profiles, null, 2));

  console.log(`\nWrote ${profiles.length} profiles to ${outPath}`);
  profiles.forEach((p) => console.log(`  - ${p.id}: ${p.name} (${p.sector})`));
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

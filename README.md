# Federal RFP Finder

An intelligent discovery tool that matches federal contractor profiles against active government solicitations using Exa's neural search API and Claude-powered agentic workflows.

**Market:** Federal government contracting ($700B+/year). See [docs/MARKET_WRITEUP.md](docs/MARKET_WRITEUP.md) for the full market analysis and value proposition.

**End user:** Capture managers and BD teams at mid-size federal contractors (50-2,000 employees) who spend 2-4 hours per opportunity on manual qualification research across disconnected government databases.

**What it does:** Select a company profile, click one button, and get semantically matched RFPs from across federal procurement sources. Deep-dive any result to pull deadlines, budgets, incumbents, and related opportunities — all without leaving the app.

## Demo flows

**1. Find RFPs by profile** — Select a company profile from the sidebar, then click "Find RFPs for [Company]". The `/api/find-rfps` agent runs multiple Exa searches tailored to the profile's NAICS codes, certifications, and agency targets.

**2. Deep research on an RFP** — Click "Research" on any result card. The `/api/research` agent calls Exa's answer endpoint to extract deadline, budget, set-aside, and NAICS details, then `findSimilar` to surface related opportunities, and synthesizes a fit assessment streamed into a slide-out drawer.

Try both flows with different profiles — results differ meaningfully by profile.

## Setup

### 1. Environment variables

Create `.env.local` in the project root:

```
ANTHROPIC_API_KEY=your_anthropic_key
EXA_API_KEY=your_exa_key
```

### 2. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. (Optional) Regenerate company profiles

The repo ships with pre-generated profiles in `src/data/profiles.json`. To regenerate them using the Claude + Exa agent script:

```bash
npm run create-sim-profiles
```

## Architecture

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Main UI — profile selector, results list, research drawer |
| `src/data/profiles.json` | Pre-generated fictional company profiles |
| `src/lib/profiles.ts` | Profile loader + `getProfileById` helper |
| `src/lib/exa-tools.ts` | Shared Exa tools: `rfpWebSearch`, `findSimilar`, `researchOpportunity` |
| `src/app/api/find-rfps/` | Agentic search — multi-step Exa searches driven by Claude |
| `src/app/api/research/` | Streaming deep-research using Exa answer + findSimilar |
| `scripts/create-sim-profiles.ts` | Offline agent script to generate realistic profile data |

## Exa API usage

The applet exercises three Exa primitives:

- **`search`** — Profile-driven web search across federal procurement sources (SAM.gov, Grants.gov, agency sites)
- **`findSimilar`** — Given an RFP URL, find related opportunities from the same agency or program
- **`answer`** — Extract structured details (deadlines, budgets, incumbents) from opportunity pages

## Process artifacts

Design and planning docs are in `docs/` and `plans/` for anyone interested in the build process:

- [docs/SCOPING.md](docs/SCOPING.md) — Initial scoping for a solicitation-input "opportunity brief" concept (earlier iteration, evolved into profile-driven search)
- [docs/design-rfp-finder-v2.md](docs/design-rfp-finder-v2.md) — Design for the profile-driven architecture (current version)
- [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) — Demo walkthrough script (written for the earlier brief concept)
- [plans/rfp-finder-v2-implementation-plan.md](plans/rfp-finder-v2-implementation-plan.md) — Implementation plan for the current version

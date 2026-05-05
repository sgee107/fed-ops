# RFP Finder v2 — Implementation Plan

## Overview

Evolve the existing single-input search page into a profile-driven agentic RFP discovery tool. The app uses three fictional company profiles to demonstrate Exa's full API surface (search, findSimilar, answer), Claude-powered agentic tool use with streaming, and system prompt context injection — all in a Next.js PoC with no persistent storage.

## Goals

- Replace the basic `/api/search` route with three purpose-built agentic API routes
- Generate realistic fictional company profiles offline via a Claude + Exa agent script
- Rebuild the frontend around a profile selector, RFP results list, and a streaming research drawer
- Demonstrate all major Exa API primitives: `webSearch`, `findSimilar`, `exa.answer()`

## Prerequisites

- `ANTHROPIC_API_KEY` and `EXA_API_KEY` set in `.env.local`
- New packages installed: `ai`, `@ai-sdk/anthropic`, `zod`, `tsx`

## Model

Use `claude-sonnet-4-5` everywhere (offline script + all three API routes). Import via `@ai-sdk/anthropic`: `anthropic('claude-sonnet-4-5')`.

---

## Implementation Steps

### Step 1: Install Dependencies

**Goal**: Add the Vercel AI SDK, Anthropic provider, Zod, and tsx to the project.

- [x] Run `npm install ai @ai-sdk/anthropic zod`
- [x] Run `npm install --save-dev tsx`
- [x] Add `"create-sim-profiles": "tsx scripts/create-sim-profiles.ts"` to `package.json` scripts
- [x] Verify `package.json` reflects all new deps

**Smell test**: `node -e "require('ai')"` exits without error.

---

### Step 2: Shared Types

**Goal**: Define the TypeScript types used across the entire app.

- [x] Create `src/types/index.ts`
- [x] Define `CompanyProfile` interface (id, name, sector, employees, certifications, naicsCodes, targetAgencies, contractSizeMin, contractSizeMax, description, searchBias, systemPromptContext)
- [x] Define `RFPResult` interface (id, url, title, publishedDate?, highlights?, summary?)
- [x] Export both types

**Smell test**: `tsc --noEmit` passes after this step.

---

### Step 3: Offline Profile Generation Script

**Goal**: Generate `src/data/profiles.json` via a one-time Claude + Exa agent that researches real companies in each archetype and synthesizes fictional profiles.

- [x] Create `scripts/create-sim-profiles.ts`
- [x] Import `generateText` from `ai`, `anthropic` from `@ai-sdk/anthropic`, `webSearch` from `@exalabs/ai-sdk`
- [x] Define the three archetype seeds: Apex Defense (defense IT / cybersecurity), MedBridge (healthcare IT), Cascade Infrastructure (civil construction / environmental)
- [x] Configure the agent: Claude model, `webSearch` tool with federal domain filtering, `maxSteps: 10`
- [x] Write system prompt: for each archetype, research 3–5 real companies, extract size/certs/agencies/NAICS/contract ranges, synthesize a fictional profile
- [x] Prompt the agent to return a JSON array of `CompanyProfile[]` as its final output
- [x] Parse the agent's final text output as JSON
- [x] Write result to `src/data/profiles.json` via `fs.writeFileSync`
- [x] Run `npm run create-sim-profiles`
- [x] Verify `src/data/profiles.json` exists with 3 profiles, each containing all required fields
- [x] Commit `src/data/profiles.json`

**Smell test**:
```bash
node -e "const p = require('./src/data/profiles.json'); console.assert(p.length === 3); p.forEach(c => ['id','name','systemPromptContext','naicsCodes','searchBias'].forEach(k => console.assert(k in c, k + ' missing in ' + c.id)))"
```

---

### Step 4: Profiles Library + Exa Tools

**Goal**: Create the shared runtime modules used by all three API routes.

- [x] Create `src/lib/profiles.ts` — imports `profiles.json`, re-exports as typed `CompanyProfile[]`, exports `getProfileById(id: string): CompanyProfile | undefined`
- [x] Create `src/lib/exa-tools.ts`:
  - Import `webSearch` from `@exalabs/ai-sdk`, `tool` from `ai`, `z` from `zod`, `Exa` from `exa-js`
  - Export `rfpWebSearch` — `webSearch()` configured with `includeDomains: ['sam.gov', 'grants.gov', 'usaspending.gov', 'fpds.gov', 'acquisition.gov']`, `numResults: 8`, highlights + summary + text (2000 chars) + `livecrawl: 'preferred'`
  - Export `findSimilar` — custom `tool` wrapping `exa.findSimilar(url, { numResults: 5, contents: { highlights: true, summary: true } })`
  - Export `researchOpportunity` — custom `tool` wrapping `exa.answer(question)`, returns `{ answer, citations }`

**Smell test**: `tsc --noEmit` still passes.

---

### Step 5: API Route — `/api/find-rfps`

**Goal**: Streaming agent that takes a `profileId`, injects profile context into the system prompt, runs 2–3 targeted searches, and returns deduplicated RFP results.

- [x] Delete `src/app/api/search/route.ts`
- [x] Create `src/app/api/find-rfps/route.ts`
- [x] Parse `{ profileId }` from request body; return 400 if profile not found
- [x] Build system prompt using profile fields (name, employees, sector, systemPromptContext, contractSizeMin/Max)
- [x] Call `generateText` with Claude model, system prompt, user message instructing the agent to run multiple searches using NAICS codes and `searchBias`, `tools: { rfpWebSearch }`, `stopWhen: stepCountIs(5)` (AI SDK v6: `maxSteps` → `stopWhen`)
- [x] Return `NextResponse.json(rfpResults)` (collect tool results from steps, deduplicate by URL)

**Smell test**: `curl -X POST http://localhost:3000/api/find-rfps -H 'Content-Type: application/json' -d '{"profileId":"apex-defense"}' --no-buffer` streams a response (not a 500).

---

### Step 6: API Route — `/api/chat`

**Goal**: Conversational agent that has full RFP context in its system prompt, can call `rfpWebSearch` for follow-up, and refuses off-topic requests.

- [x] Create `src/app/api/chat/route.ts`
- [x] Parse `{ messages, profileId, rfpContext }` from request body
- [x] Build system prompt: profile context + serialized RFP results (title, url, first highlight per result) + guardrail instruction
- [x] Call `streamText` with Claude model, system prompt, incoming messages, `tools: { rfpWebSearch }`, `stopWhen: stepCountIs(3)`
- [x] Return `result.toTextStreamResponse()` (AI SDK v6: `toDataStreamResponse` → `toTextStreamResponse`)

**Smell test**: `curl -X POST http://localhost:3000/api/chat -H 'Content-Type: application/json' -d '{"messages":[{"role":"user","content":"find USAF cloud opps"}],"profileId":"apex-defense","rfpContext":[]}'` returns a stream.

---

### Step 7: API Route — `/api/research`

**Goal**: Streaming deep-dive agent that researches a specific RFP using `researchOpportunity` + `findSimilar`, then synthesizes a fit assessment for the selected profile.

- [x] Create `src/app/api/research/route.ts`
- [x] Parse `{ rfp, profileId }` from request body
- [x] Build system prompt: analyst persona, profile name, instructions to call `researchOpportunity` for deadline/budget/NAICS/set-aside/requirements, then `findSimilar` for related opportunities, then synthesize a fit assessment
- [x] Call `streamText` with Claude model, system prompt, user message containing the RFP URL and title, `tools: { researchOpportunity, findSimilar }`, `stopWhen: stepCountIs(4)`
- [x] Return `result.toTextStreamResponse()`

**Smell test**: Hit the route with a real SAM.gov URL and verify tool call events appear in the stream (look for `9:` data stream chunks indicating tool invocations).

---

### Step 8: Components

**Goal**: Build the six new UI components.

#### ProfileSelector
- [x] Create `src/components/ProfileSelector.tsx`
- [x] Props: `profiles: CompanyProfile[]`, `selected: CompanyProfile | null`, `onSelect: (p: CompanyProfile) => void`
- [x] Renders a vertical list of clickable profile cards (name + sector + employee count)
- [x] Highlights the selected profile

#### ProfileCard
- [x] Create `src/components/ProfileCard.tsx`
- [x] Props: `profile: CompanyProfile`
- [x] Displays: name, employees, sector, certifications (badges), target agencies, contract size range

#### RFPCard + RFPResultList
- [x] Create `src/components/RFPCard.tsx` — props: `rfp: RFPResult`, `onResearch: (rfp: RFPResult) => void`
  - Shows title (linked), domain badge, first highlight, published date, "Research →" button
- [x] Create `src/components/RFPResultList.tsx` — props: `results: RFPResult[]`, `onResearch`
  - Maps results to `<RFPCard>` with result count header

#### ChatBar
- [x] Create `src/components/ChatBar.tsx`
- [x] Props: `profile: CompanyProfile | null`, `onFindRFPs: () => void`, `searching: boolean`, `messages: ChatMessage[]`, `onMessagesChange` (chat state managed internally via fetch + stream)
- [x] Renders: "Find RFPs for {name}" button + divider + chat input + send button
- [x] Disables both inputs when no profile selected or when searching

#### ResearchDrawer
- [x] Create `src/components/ResearchDrawer.tsx`
- [x] Props: `rfp: RFPResult | null`, `profileId: string | null`, `onClose: () => void`
- [x] Slides in from right when `rfp` is non-null
- [x] Streams research content from `/api/research` using direct stream parsing (no `@ai-sdk/react` needed)
- [x] Shows loading indicator while streaming
- [x] Shows "close" / X button

---

### Step 9: Rebuild `page.tsx`

**Goal**: Wire everything together with the new layout and state.

- [x] Replace entire contents of `src/app/page.tsx`
- [x] Add state: `selectedProfile`, `rfpResults`, `chatMessages`, `searchLoading`, `activeResearch`
- [x] Add demo banner at top: "This is a demonstration. In production, profiles would be updated automatically based on your company data."
- [x] Left sidebar: `<ProfileSelector profiles={profiles} selected={selectedProfile} onSelect={setSelectedProfile} />`
- [x] Right panel top: `<ProfileCard profile={selectedProfile} />` (hidden until profile selected)
- [x] Right panel middle: `<ChatBar ... />` wired to `/api/find-rfps` (for the button) and `/api/chat` (for the chat input via manual fetch+stream)
- [x] Right panel bottom: `<RFPResultList results={rfpResults} onResearch={setActiveResearch} />`
- [x] Overlay: `<ResearchDrawer rfp={activeResearch} profileId={selectedProfile?.id} onClose={() => setActiveResearch(null)} />`
- [x] `handleFindRFPs`: POST to `/api/find-rfps`, await JSON response, update `rfpResults`
- [x] Chat handled inside `ChatBar` via fetch + ReadableStream (no `useChat` — `@ai-sdk/react` not installed)

---

### Step 10: Validation & README Update

**Goal**: Manual smoke test of all three flows + update README.

- [ ] Start dev server: `npm run dev`
- [ ] Select Apex Defense → click "Find RFPs" → verify results stream in
- [ ] Type a follow-up in chat → verify agent responds with procurement-relevant content
- [ ] Type something off-topic → verify guardrail fires
- [ ] Click "Research →" on an RFP → verify drawer opens, tool call indicators appear, synthesis streams in
- [ ] Repeat find-rfps for MedBridge and Cascade — verify results differ meaningfully by profile
- [x] Update `README.md`: add setup instructions (`ANTHROPIC_API_KEY`, `EXA_API_KEY`), note about running `create-sim-profiles`, and the three demo flows

---

## Success Criteria

- [ ] All three API routes stream without errors
- [ ] Profile context visibly affects results (different profiles → different RFPs)
- [ ] Research drawer shows live tool call indicators before synthesis
- [ ] Chat guardrail rejects off-topic questions
- [ ] `tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] README reflects new setup requirements

---

## Risk Mitigation

### Risk 1: Latency on `/api/find-rfps`
**Impact**: Medium — multi-step agent with 3+ Exa calls could feel slow
**Mitigation**: Streaming (`streamText` + `toDataStreamResponse`) handles perceived latency. Show a per-card skeleton loader. Measure actual TTFB in manual testing; if >10s, cap `maxSteps: 3`.

### Risk 2: `findSimilar` returning non-federal URLs
**Impact**: Low — accepted risk per design doc
**Mitigation**: Claude's synthesis step in `/api/research` should note when a similar result is off-domain. No code change needed unless it looks bad in demos.

### Risk 3: `create-sim-profiles` script produces malformed JSON
**Impact**: Medium — blocks all frontend work if profiles.json is bad
**Mitigation**: Wrap the `generateText` call in a try/catch with a fallback prompt asking Claude to output valid JSON. Run the smell test assertion immediately after generation.

### Risk 4: `@exalabs/ai-sdk` webSearch API surface mismatch
**Impact**: Medium — package is at v2.0.1, may have changed signatures
**Mitigation**: Check `node_modules/@exalabs/ai-sdk` types before writing `exa-tools.ts`. Adjust `includeDomains` / `contents` config if the constructor signature differs.

---

## References

- Design document: [docs/design-rfp-finder-v2.md](../docs/design-rfp-finder-v2.md)
- Vercel AI SDK docs: `node_modules/next/dist/docs/` (per AGENTS.md)
- Exa JS client: `node_modules/exa-js`

---

## Progress Tracking

**Started**: 2026-05-03
**Last Updated**: 2026-05-03
**Status**: Steps 1–9 complete + README updated. Step 10 manual smoke test pending.

# Federal Opportunity Intelligence Brief — PoC Scoping & Design

## 1. Summary

A web app that takes a single federal solicitation as input and returns a structured intelligence brief synthesized from multiple public data sources. Replaces ~2–4 hours of manual research a capture manager does today before deciding whether to pursue an opportunity.

This document is the build spec for the PoC. It's intended to be read by Claude Code (or another coding agent) and used as the source of truth while implementing.

## 2. Target user & use case

**User:** Capture manager at a mid-size federal contractor (50–2,000 employees).

**Trigger:** They become aware of a potentially interesting opportunity — via SAM.gov browsing, a teaming partner email, an internal BD lead, or a paid aggregator alert.

**Job to be done:** Decide quickly whether to pursue, and if pursuing, walk into the bid/no-bid meeting with the context needed to make a real recommendation.

**Today's workflow (the "before"):**
- Open SAM.gov, read the notice
- Open USAspending in another tab, search for similar awards
- Open GAO bid protests, search for the agency and incumbent
- Open LinkedIn, look up the contracting officer and program manager
- Compile findings into a Word doc or email
- Total time: 2–4 hours per opportunity, multiplied across 10–30 opportunities a week per capture manager

**The "after":** Paste a solicitation number → get a structured brief in 60 seconds with citations to every source.

## 3. Out of scope for the PoC

Explicitly **not** building these in v1, even though they're natural extensions:

- Ongoing monitoring or alerting — single-shot only
- User accounts, saved searches, history
- Team collaboration, sharing, comments
- RFP document shredding (compliance matrices, requirements extraction)
- Pricing/rate intelligence beyond surfacing comparable award amounts
- State/local/SLED opportunities — federal only
- Grants (financial assistance) — contracts only
- Free-text opportunity description as input — solicitation number/ID/URL only
- PDF or Word export of the brief — render in browser only

## 4. Input

The user provides **one** of:
- SAM.gov solicitation number (e.g. `RFIICEFY26CCISS`)
- SAM.gov notice ID (32-char hex, e.g. `d33becd4368f4b33bb9fac830a695116`)
- Full SAM.gov URL (e.g. `https://sam.gov/opp/d33becd4368f4b33bb9fac830a695116/view`)

The app should detect which one was provided and normalize to a notice ID for downstream lookups.

## 5. Output: the brief

A single-page brief with five sections, rendered in the browser. Every claim must link to its source.

### Section 1: Opportunity snapshot
- Title
- Agency / sub-agency / contracting office (full hierarchy)
- NAICS code + description
- PSC code + description
- Set-aside type (full and open, small business, 8(a), SDVOSB, etc.)
- Contract type (FFP, CPFF, T&M, IDIQ, BPA, MATOC, task order)
- Estimated value (if disclosed)
- Key dates: posted, response deadline, anticipated award, period of performance
- Place of performance
- 2–3 sentence plain-English summary of what's being bought (LLM-generated from the notice description)

### Section 2: Incumbent analysis
- Current incumbent name(s) and UEI(s)
- Current contract PIID(s)
- Current contract value (obligated to date, total ceiling)
- Period of performance and expiration date
- Re-compete signal: yes/no/unclear with reasoning
- Notes on incumbent (small business status, recent M&A activity if surfaced from notice or USAspending)

### Section 3: Buying pattern
For the contracting office over the past 5 fiscal years, on this NAICS or PSC:
- Total dollars obligated
- Number of awards
- Top 5 vendors by dollars
- Average award size
- Set-aside mix (% small business, % full and open, etc.)
- Trend: increasing / decreasing / steady

### Section 4: Protest history
- Any protests on this exact solicitation (rare, but flag immediately if so)
- Protests involving the current incumbent in similar work
- Protests at this contracting office on this NAICS over past 3 years
- For each: protester, outcome (sustained / denied / dismissed / withdrawn), date, brief reason

### Section 5: Pursuit signals
A bulleted list of "things worth knowing" — surfaced via inference and cross-referencing:
- Was there a sources sought / RFI before this? Link it.
- Was this on the agency's procurement forecast? Did it slip from the forecasted date?
- Has the solicitation been amended? How many times?
- Is the contracting officer named? Have they posted other notices recently?
- Anything unusual flagged (e.g. very short response window, unusual contract type for this agency, brand-name justification)

Each section has a "data confidence" indicator: green if all sources hit, yellow if partial, red if a source failed or returned nothing relevant. The user should always know what we couldn't find.

## 6. Data sources

### 6.1 SAM.gov Opportunities API
- **Base URL:** `https://api.sam.gov/prod/opportunities/v2/search`
- **Auth:** API key in query param (`api_key=...`). Free, request via SAM.gov account.
- **Rate limit:** 1,000 requests/day for non-federal users
- **Use:** Pull the source opportunity by notice ID or solicitation number. Returns title, agency hierarchy, NAICS, PSC, set-aside, dates, and a description (sometimes).
- **Known gap:** The full notice description and attachments often aren't returned by the API — they're rendered on the SAM.gov web view. For the PoC, accept this and use what the API gives. Document as a known limitation.

### 6.2 USAspending.gov API
- **Base URL:** `https://api.usaspending.gov/api/v2/`
- **Auth:** None
- **Rate limit:** Generous, but be respectful (cache aggressively)
- **Use:**
  - `/search/spending_by_award/` — find awards matching agency + NAICS to identify incumbents and buying patterns
  - `/awards/{award_id}/` — get full award details
  - `/recipient/{uei}/` — get recipient profile (size, location, parent company)
  - `/agency/{toptier_code}/` — agency metadata

### 6.3 GAO bid protest decisions
- **URL:** `https://www.gao.gov/legal/bid-protests/search`
- **Auth:** None
- **Access method:** Web — there is no official public API. The search page is server-rendered HTML and can be scraped reliably. Decisions themselves are individual HTML pages.
- **Rate limit:** None published; throttle to ~1 req/sec to be polite.
- **Use:** Search by agency name, protester, solicitation number. Return list of matching cases with outcome and date.
- **Note:** A third-party API (Tango / makegov.com) wraps GAO data if scraping is unreliable. For PoC, scrape directly to avoid vendor dependency.

### 6.4 SAM.gov Federal Hierarchy API
- **Base URL:** `https://api.sam.gov/prod/federalorganizations/v1/`
- **Auth:** Same API key as Opportunities
- **Use:** Resolve agency / sub-agency / office hierarchy from codes returned by the Opportunities API. Useful for matching against USAspending, which uses a slightly different identifier scheme.

### 6.5 Important context: FPDS retirement
FPDS (Federal Procurement Data System) is being retired in FY 2026. The ATOM feed is sunsetting. **Do not build against FPDS.** All historical contract award data we need is available via USAspending.

## 7. Architecture

### 7.1 Stack recommendation
- **Frontend:** Next.js 14 (App Router) + React + Tailwind. SSR for the brief view so it can be deep-linked.
- **Backend:** Next.js API routes (Node). No separate service needed for the PoC.
- **LLM:** Claude (claude-opus-4-7 via the Anthropic API) for synthesis, summarization, and the agent loop.
- **Data fetching:** Plain `fetch` calls to SAM.gov and USAspending. For GAO scraping, use `cheerio` (lightweight) or Playwright if the search page proves dynamic.
- **Caching:** File-based cache keyed by source + identifier in `.cache/` for dev. No DB needed for the PoC.
- **Hosting:** Vercel for the demo. Set env vars for `SAM_API_KEY` and `ANTHROPIC_API_KEY`.

### 7.2 Agent loop design

Use Claude with tool use for the synthesis. Tools to expose:

1. `fetch_sam_opportunity(identifier)` — pulls the source opportunity
2. `search_usaspending_awards({agency, naics, psc, date_range})` — returns matching awards
3. `get_usaspending_award(award_id)` — full award detail
4. `search_gao_protests({agency, protester, solicitation_number})` — returns case list
5. `get_gao_protest(case_id)` — full decision text
6. `resolve_agency_hierarchy(agency_code)` — sub-agency / office lookup

The agent's job is to: given an input identifier, plan a research path, call tools to gather evidence, and assemble the structured brief. The prompt should require it to flag missing data rather than fabricate.

### 7.3 Output rendering

The agent returns structured JSON matching the brief schema. The frontend renders that JSON into the styled brief view. Don't have the LLM emit HTML or markdown directly — keep structure separate from presentation.

### 7.4 Demo gallery

The frontend should include a "Try one of these" gallery on the landing page with the 5 demo solicitations pre-loaded (see section 9). Each is a card with title, agency, value, and a "Run brief" button that pre-fills the input and runs the agent. This makes the demo bulletproof — no risk of someone pasting in a closed solicitation that returns nothing.

## 8. Build plan

Phased so each phase produces something demoable.

### Phase 0: Setup (½ day)
- Next.js project scaffold
- Tailwind + shadcn/ui set up
- Env config for API keys
- SAM.gov account + API key requested (allow 1–2 days for approval)
- Anthropic API key in place

### Phase 1: Data layer (1.5 days)
- SAM.gov client: input normalization (URL → notice ID, etc.), opportunity fetch, hierarchy resolution
- USAspending client: award search, award detail, recipient lookup
- GAO scraper: search page parser, decision page parser, throttling
- File-based cache wrapping all three
- A `scripts/fetch-fixtures.ts` that runs the 5 demo solicitations through every client and saves real responses to `fixtures/` (this is what to run locally on day 1 to populate the demo)

### Phase 2: Agent loop (1 day)
- Tool definitions matching the data layer
- System prompt for the brief-generation agent — specifies structure, required fields, "flag don't fabricate" rule, citation requirement
- JSON schema for the brief output (use Zod)
- Single API route `POST /api/generate-brief` that takes an identifier and streams agent progress + final brief

### Phase 3: Frontend (1.5 days)
- Landing page with input field and demo gallery (5 solicitation cards from fixtures)
- Brief view: 5 sections, citation links, confidence indicators, loading states with agent's current step visible
- Mobile-responsive

### Phase 4: Polish & demo prep (½ day)
- Error states (rate limited, source down, nothing found)
- Pre-flight: run all 5 demos end-to-end, verify briefs are accurate, hand-tune the agent prompt where output is weak
- Quick deploy to Vercel with a custom subdomain

**Total: ~5 days of focused work.** Realistically 1.5–2 weeks calendar time accounting for SAM.gov API key approval and iteration.

## 9. Demo solicitation set

These five are pre-selected to exercise different parts of the brief. The actual current state of each needs to be verified against SAM.gov when fixtures are pulled — if any have closed or archived, swap to a backup (see 9.6).

### 9.1 SSA ITSSC Recompete (the "classic re-compete")
- **Why:** Multi-incumbent (CGI Federal, Leidos, Peraton via Northrop acquisition), known sunset date, ~$2.9B in task orders flowed through the current vehicle, sources sought already published. Best possible test case for the incumbent analysis section.
- **Tests:** Incumbent analysis, USAspending depth, re-compete inference

### 9.2 ICE Cyber Defense and Intelligence Support Services (CDISS)
- **Solicitation:** `RFIICEFY26CCISS`
- **NAICS:** 541512, ~$59M, full and open
- **Why:** Different agency (DHS/ICE), different contract structure, IT services where protest history is rich
- **Tests:** Protest history retrieval, agency hierarchy resolution, task order vs. IDIQ disambiguation

### 9.3 Army A&E Services MATOC
- **Solicitation:** `W911KB27RA006`
- **NAICS:** 541330, $40M, small business set-aside, MATOC
- **Why:** Smaller dollar value, set-aside, multiple-award structure, non-IT vertical
- **Tests:** Set-aside flagging, MATOC structure, breadth across verticals

### 9.4 MHS GENESIS EHR Follow-On (the "mega-contract")
- **Solicitation:** `HT003826X0000`
- **Value:** ~$4.37B, IT services, DoD health
- **Why:** Massive value, high-profile program, complex prime/sub arrangement
- **Tests:** Large-program intelligence, public news context, edge cases where structured fields are sparse

### 9.5 F-35 Unclassified IT Services (the "ambiguous early-stage")
- **Solicitation:** `N00019UnclassifiedIT2025`
- **Why:** Many fields marked "Undetermined" or "TBD" — realistic state of most pre-RFP opportunities
- **Tests:** Graceful degradation, inference under ambiguity, "tell me what's missing" rather than fabricating

### 9.6 Backups
If any primary case isn't viable when fixtures are pulled:
- Tinker AFB MACC (construction/maintenance, very different vertical)
- OASIS+ Phase II (massive professional services GWAC)

### 9.7 Fixture freezing
**Lock the fixtures.** Once the demo set is pulled and verified, freeze those JSON responses in `fixtures/` and have the demo gallery serve from frozen data unless explicitly running in "live" mode. This protects the demo from a solicitation closing or a source going down right before a presentation.

## 10. Honest limitations to call out in the demo

- **API key approval delay** — SAM.gov API keys take 1–2 business days. Plan around this.
- **Description completeness** — SAM.gov API doesn't always return full notice descriptions; sometimes only the web view has them. PoC accepts this gap.
- **GAO scraping fragility** — if GAO redesigns their search page, the scraper breaks. Acceptable for PoC; flag as productionization risk.
- **Incumbent identification is heuristic** — matching "what was previously bought from this office on this NAICS" is not a perfect signal. The brief should phrase incumbent findings as "likely incumbent" with the supporting evidence shown, not as ground truth.
- **No SLED, no grants** — federal contracts only. Stated explicitly in the UI.
- **Single-shot** — no monitoring, no alerts. Stated explicitly.

## 11. Open questions to resolve before / during build

1. **Output format polish** — should the brief be exportable (PDF/docx) for the PoC, or strictly browser-rendered? Current scope says browser only. Decide before Phase 3.
2. **Streaming UX** — should the user see the agent's step-by-step reasoning ("now searching USAspending for similar awards…") or just a loading state and then the final brief? Streaming is more impressive but more work.
3. **Authentication on the demo** — Vercel-deployed demo: open to the world, basic-auth gated, or behind a magic link? Affects how comfortable we are with rate limit / cost exposure.
4. **Iteration on the demo set** — after first end-to-end runs, if any of the 5 produce a weak brief, do we swap them or invest in better prompting?

## 12. Success criteria

The PoC succeeds if:
- All 5 demo solicitations produce a brief that a real capture manager would call "useful" (validate with 1–2 friendly users post-build)
- Time from input to rendered brief is under 90 seconds
- Every fact in the brief has a working citation back to source
- The brief never fabricates a fact when a source returned nothing — it says "not found" instead
- The demo can be run live without breaking, end to end, in front of an audience

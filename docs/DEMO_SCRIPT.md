# Demo Script — Federal Opportunity Intelligence Brief

A walk-through of how the demo flows for a live audience. ~5–7 minutes end to end. Designed to land the value clearly without over-explaining.

## Audience assumption

You're talking to people who know roughly what federal contracting is but aren't capture managers themselves. They need the pain made concrete and the "after" demonstrated, not a govcon lecture.

## Total flow at a glance

1. **Set the scene** (60s) — what a capture manager does today
2. **The "before" walk-through** (60s) — show the manual workflow on screen
3. **Run demo #1: SSA ITSSC** (90s) — the showcase brief
4. **Run demo #2: F-35 ambiguous case** (60s) — show graceful handling
5. **Quick browse of the gallery** (30s) — show breadth
6. **Wrap and Q&A** (60s)

---

## Part 1 — Set the scene (60 seconds)

**Talking points:**

> Federal contractors live and die by their pursuit pipeline. A mid-size firm has capture managers each tracking 20 to 30 active opportunities at any given time. When a new opportunity surfaces, the first question is always: do we pursue this? And before they can answer that honestly, they need to know who has it today, what the agency typically buys, whether it's been protested before, and what they're walking into.
>
> Today, getting that picture takes 2 to 4 hours of clicking through five different government websites, copying things into a Word doc, and trying to make sense of it all. Multiply that across 30 opportunities a week, and capture teams spend most of their time on research instead of on actually winning the work.

**Goal:** Make sure everyone understands this is a real, expensive workflow — not a hypothetical.

---

## Part 2 — The "before" (60 seconds)

**On-screen actions:**

1. Open SAM.gov in a browser. Search for `RFIICEFY26CCISS`. Click into the notice.
2. Say: "Okay, this is what they start with. Now they need to figure out who has this work today."
3. Open a new tab to USAspending. Start typing in the search.
4. Say: "And then GAO for protest history…"
5. Open another tab to gao.gov/legal/bid-protests.
6. Stop. Don't actually do the work. Just leave the three tabs open visibly.

**Talking points:**

> This is where the next two hours go. SAM.gov for the notice, USAspending for the spending history, GAO for protests, LinkedIn for the contracting officer, an internal Excel sheet for past performance. And at the end of all that, they write up what they found — and someone else does the same thing tomorrow for the next opportunity.

**Goal:** The audience should feel the friction. Don't explain — show.

---

## Part 3 — Demo #1: SSA ITSSC Recompete (90 seconds)

This is the showcase. Pick this one because the brief is rich on every dimension.

**On-screen actions:**

1. Open the demo app. Land on the homepage.
2. Briefly point at the gallery: "We've pre-loaded a few real opportunities to make this easy to try."
3. Click the SSA ITSSC card.
4. Watch the brief generate. (Pre-warm the cache before the demo so this is fast.)

**While it generates, narrate:**

> The agent is pulling the source notice from SAM.gov, then looking up the contracting office's award history on USAspending to identify the likely incumbents, then checking GAO for any protest history, then synthesizing it all into one brief. Same steps a capture manager would do — just compressed.

**When the brief renders, walk through it:**

- **Snapshot section:** "So here's the opportunity. SSA, IT support services recompete, the current vehicle was awarded in 2017 — note that's already public on the agency's own pages."
- **Incumbent section:** "And here's the punchline — three current incumbents: CGI Federal, Leidos, and Peraton, with Leidos holding the majority of task orders. That's the kind of thing that takes 30 minutes to figure out manually." Click a citation link. "And every fact links back to its source — this isn't pulled from a model's memory, it's pulled from USAspending right now."
- **Protest section:** "Past protests on similar work — useful context for understanding how this office handles competition."
- **Pursuit signals:** "And at the bottom: the things an experienced capture manager would notice. Sources sought already issued. Current contract sunsets in September. Re-compete window is now."

**Goal:** Audience gets that the brief is comprehensive AND citation-grounded. Both matter.

---

## Part 4 — Demo #2: F-35 Unclassified IT (60 seconds)

This is the "honest agent" demo. Pick the F-35 case because half its fields are TBD or undetermined.

**On-screen actions:**

1. Back to the gallery. Click the F-35 IT card.
2. Let it run.

**Talking points while generating:**

> Let's run a different kind of opportunity. This one is much earlier-stage — it's pre-RFP, half the structured fields aren't filled in yet. This is where most opportunities actually live, by the way. Most pursuits start when there's barely any information.

**When the brief renders:**

- Point at the yellow / red confidence indicators if any are showing.
- Say: "Notice what the brief does here. Set-aside type: undetermined — and it says undetermined, it doesn't make one up. Estimated value: not disclosed — same. The incumbent analysis is marked 'likely' rather than confirmed because we're inferring from the agency's history, not citing a current contract."
- Scroll to pursuit signals: "But it still surfaces the useful stuff — what the agency has historically bought in this space, who they've bought it from, and what to watch for."

**Goal:** Show that the agent is honest about uncertainty. This is the hardest thing to demo well in AI products and the most important.

---

## Part 5 — Quick gallery browse (30 seconds)

**On-screen actions:**

1. Back to the gallery.
2. Hover over the other three cards: ICE CDISS, Army A&E MATOC, MHS GENESIS.

**Talking points:**

> Five different shapes of opportunity in the gallery — DHS cyber, Army architecture and engineering set aside for small business, a four-billion-dollar DoD health program. Each tests something different. And in production, of course, you'd paste in any solicitation number and get the same brief.

**Goal:** Establish breadth without burning time on five separate runs.

---

## Part 6 — Wrap and Q&A (60 seconds)

**Talking points:**

> So that's the PoC. Two-to-four hours of manual work compressed into about 90 seconds, with every claim linked to its source, and an agent that flags what it doesn't know rather than making things up.
>
> A few things worth saying about what this isn't yet. It's federal only — no state, local, or grants. It's single-shot — you ask, it answers — no monitoring or alerting yet. And the source data sometimes has gaps that we can't close without scraping more aggressively. All of those are natural extensions, not blockers.
>
> Happy to dig into any of it.

---

## Anticipated questions and crisp answers

**"How is this different from GovWin or Bloomberg Government?"**
> Those are aggregators with light filtering. They give you the listings; they don't do the synthesis. This is closer to what those tools have been promising for a decade — actual analysis, not just search.

**"What if SAM.gov rate-limits you?"**
> The PoC caches everything aggressively. A real product would need a higher API tier or batched fetching. Solvable.

**"Where does the LLM come in versus just a database query?"**
> Three places. Summarizing the notice in plain English. Inferring the incumbent when it's not explicitly stated — matching agency, NAICS, and timing across data sources. And synthesizing the pursuit signals in the last section, which requires reading prose from notices and protests, not just SQL.

**"What about hallucinations?"**
> Two guardrails. Every factual claim cites a source the user can click. And the prompt requires the agent to mark things as 'not found' rather than fill in. We tested this with the F-35 demo specifically.

**"Could this work for state and local?"**
> Eventually yes, but the data sources are wildly fragmented at SLED — thousands of procurement portals with no consistency. That's a real problem to solve, not a quick extension. Federal first.

**"What happens if a source is down?"**
> The brief still renders, with the affected section marked red and the rest of the brief intact. We don't fail the whole brief because one source timed out.

**"How long would a production version take?"**
> The PoC is about a week of build. A productionized version with accounts, monitoring, broader data sources, and exports is more like 8–12 weeks.

---

## Demo prep checklist

Run through this 30 minutes before the demo:

- [ ] Pre-warm the cache by running each of the 5 demo briefs once. Confirm they all render correctly.
- [ ] Browser: have SAM.gov, USAspending, and GAO bid protests open in three tabs for Part 2.
- [ ] Browser: have the demo app open in a fourth tab, on the gallery view.
- [ ] Disable notifications, Slack, email.
- [ ] Test screen share / projector setup. Confirm font size is readable from the back of the room.
- [ ] Have the SCOPING.md doc ready to share post-demo for anyone who wants the deeper version.
- [ ] If demoing remotely: have a backup recording of a successful brief generation in case live network fails.

## Failure modes and recovery

**If a brief fails to generate live:**
- Don't panic, don't refresh repeatedly. Say: "Live network's a little spotty — let me show you the cached version" and pull up the pre-warmed result. The cache should have it.

**If the gallery doesn't load:**
- Have a screen recording of the full demo as a fallback. Walk through that with narration.

**If someone asks a hostile question about hallucinations or accuracy:**
- Click into a citation, show the source. The grounding is the answer. Don't argue, demonstrate.

# marketingAgency

An AI marketing agency for Instagram and YouTube creators. An **Agency Director** (orchestrator) plans the work and delegates to 15 specialist agents. Each agent has its own goal, and they all share one workspace per client, so each agent's output is the next one's input.

## Setup

```bash
npm install
cp .env.example .env   # add your Anthropic API key
```

## Usage

```bash
npm start -- jane-fitness                      # interactive session with the Director
npm start -- jane-fitness "Onboard Jane: ..."  # one request, then exit
```

To try things cheaply, add `AGENCY_MODE=test` to `.env`. It switches every agent to Claude Sonnet 5 with low effort and fewer web searches. Remove it for real client work. Each run prints tokens and estimated cost per agent.

Example requests:

- `Onboard this creator: <paste bio, links, goals, audience>`
- `Plan and produce next week's content`
- `Here are this week's metrics: <paste>. Review performance and write the client report`
- `Draft replies to these comments: <paste>`
- `Propose a paid campaign to promote the coaching offer`

## The team

| Agent | Goal |
|---|---|
| Agency Director | Orchestrates: plans, delegates, reviews, keeps the agency moving |
| Onboarding | Turns a new creator into a documented client (profile, brand voice) |
| Client Liaison | Keeps the creator informed; drafts updates and approval requests |
| Strategist | Content pillars, cadence, KPIs, weekly calendars |
| Creative Director | Turns calendar entries into briefs; reviews creative |
| Trend Scout | Finds trends, formats and audio in the niche (web research) |
| Competitor Watch | Tracks peer creators and finds gaps (web research) |
| Copywriter | Hooks, scripts, captions, YouTube titles and descriptions |
| Designer | Carousel/post layouts, thumbnails, AI image prompts |
| Video Editor | Shot lists, edit plans, retention tactics per platform |
| Brand Guard | Voice, claims, disclosure and copyright review before publishing |
| Publisher | Packages approved content into the publish queue |
| Community Manager | Suggested replies to comments/DMs; audience insights |
| Ads Manager | Paid campaign proposals (never spends) |
| Analyst | Turns metrics in `data/` into lessons and recommendations |
| Reporter | Plain-language progress reports for the creator |

## How it works

Each agent lives in its own folder under `agents/`:

```
agents/
  AGENCY.md                 shared goal and rules every agent reads first
  director/CLAUDE.md        the orchestrator
  copywriter/CLAUDE.md      one folder per specialist
  trend-scout/CLAUDE.md
  ...
```

An agent's system prompt is `AGENCY.md` followed by its own `CLAUDE.md`, so every agent knows its specific job and also the shared goal of creating great content for the creator.

Each `CLAUDE.md` starts with frontmatter:

```
---
name: Trend Scout
goal: One sentence the Director sees when choosing who to delegate to.
effort: medium          # optional: low | medium | high | xhigh | max
web_research: true      # optional: gives the agent web search and fetch
---
```

**To change an agent**, edit its `CLAUDE.md`. **To add one**, create `agents/<id>/CLAUDE.md` and the Director can delegate to it on the next run. No code changes are needed either way.

Code lives in `src/`:

- `src/runtime/roster.ts` loads the agent folders.
- `src/runtime/orchestrator.ts` runs the Director. Its `delegate` tool runs a specialist and returns that specialist's report.
- `src/runtime/run.ts` runs a specialist with the Anthropic SDK tool runner.
- `src/tools/workspace.ts` provides file tools that can only read and write inside `clients/<slug>/`.

Each client workspace (`clients/<slug>/`, git-ignored) ends up with `profile.md`, `brand-voice.md`, `strategy/`, `calendar/`, `briefs/`, `drafts/`, `publish-queue/`, `community/`, `ads/`, `data/`, `reports/` and an `activity.log` of what each agent did.

## Human in the loop

Agents never post, send messages or spend money. They write drafts, a publish queue marked `AWAITING CREATOR APPROVAL`, and ad proposals. A human reviews and acts. To give the Analyst real numbers, put exported metrics (CSV or pasted text) in `clients/<slug>/data/`.

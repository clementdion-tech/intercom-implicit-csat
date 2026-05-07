# Intercom Implicit CSAT

Production-grade implicit customer satisfaction scoring system for Intercom. Scores 100% of conversations using deep linguistic and behavioral analysis — covering the 80-85% of conversations that never receive an explicit CSAT rating.

## Architecture

```
Intercom → Sentiment Engine (Node.js/TypeScript) → Supabase PostgreSQL (Prisma) → REST API + WebSocket → Next.js Dashboard
                                                                                  → Intercom Canvas Kit (per-conversation sidebar)
                                                                                  → Slack Alerts
```

## Scoring Model

All scores are percentages (0–100%):

| Range | Label | Emoji |
|-------|-------|-------|
| 0–20% | Very Dissatisfied | 😠 |
| 21–40% | Dissatisfied | 😞 |
| 41–60% | Neutral | 😐 |
| 61–80% | Satisfied | 😊 |
| 81–100% | Very Satisfied | 😄 |

## Signal Layers

1. **Punctuation & Typography** — repeated `???`, `!!!`, ALL CAPS, ellipsis, zero punctuation
2. **Communication Style** — passive-aggressive, direct aggressive, anxious/urgent, disengaged/resigned, genuinely positive
3. **Behavioral & Temporal** — message burst detection (3+ msgs < 2 min = -8% each), cadence, repetition friction, re-open patterns
4. **Multilingual Intelligence** — 25+ languages with cultural calibration (German directness ≠ Japanese directness)

## Key Features

- **100% conversation coverage** — no opt-in required
- **Real-time WebSocket dashboard** — live feed of scored conversations
- **Intercom Canvas sidebar** — per-conversation score visible to agents
- **Churn risk pipeline** — High / Medium / Low / Resolved kanban
- **Conversion tracking** — rescued vs declined conversation arcs
- **Cultural calibration** — 25 language/culture profiles
- **Slack alerts** — churn risk, score drops, passive-aggressive volume spikes

## Stack

- **Backend**: Node.js / TypeScript / Express
- **AI**: Claude claude-sonnet-4-6 (deep linguistic analysis)
- **Database**: PostgreSQL via Supabase + Prisma ORM
- **Dashboard**: Next.js 14 + Tailwind CSS + Recharts
- **Deployment**: Render (backend + dashboard) + Supabase (database)

## Setup

### 1. Clone and install

```bash
git clone https://github.com/USERNAME/intercom-implicit-csat.git
cd intercom-implicit-csat
npm install
cd dashboard && npm install && cd ..
```

### 2. Environment

```bash
cp .env.example .env
# Fill in all required values (see .env.example)
```

### 3. Database

Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) to provision your database, then:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run locally

```bash
# Backend (port 3000)
npm run dev

# Dashboard (port 3001)
cd dashboard && npm run dev
```

### 5. Deploy

Follow [RENDER_SETUP.md](RENDER_SETUP.md) for full deployment instructions.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard/overview` | KPI summary |
| GET | `/api/dashboard/distribution` | Score band breakdown |
| GET | `/api/dashboard/timeline` | Daily trend data |
| GET | `/api/dashboard/languages` | Per-language analytics |
| GET | `/api/dashboard/styles` | Communication style breakdown |
| GET | `/api/dashboard/bursts` | Burst contact analytics |
| GET | `/api/dashboard/churn` | Churn risk pipeline |
| GET | `/api/dashboard/conversions` | Arc conversion analytics |
| GET | `/api/dashboard/agents` | Per-agent coaching insights |
| GET | `/api/dashboard/conversations` | Filterable conversation list |
| WS | `/ws/live` | Real-time scored conversation feed |
| POST | `/api/webhook/intercom` | Intercom webhook receiver |
| POST | `/canvas/initialize` | Canvas Kit initialize |
| POST | `/canvas/submit` | Canvas Kit submit |

## Batch Processing

```bash
# Process single conversation
npm run batch -- --conversation-id abc123

# Process 50 most recent
npm run batch -- --limit 50

# Dry run (no writes)
npm run batch -- --limit 10 --dry-run
```

## Intercom Custom Attributes

The system writes these attributes to each Intercom conversation:

- `sentiment_score_pct` — overall score 0–100
- `sentiment_label` — very_dissatisfied / dissatisfied / neutral / satisfied / very_satisfied
- `sentiment_emoji` — 😠 😞 😐 😊 😄
- `sentiment_language` — ISO 639-1 language code
- `sentiment_communication_style` — passive_aggressive / direct_aggressive / etc.
- `sentiment_churn_risk` — high / medium / low / none
- `sentiment_arc` — rescued / declined / stable_positive / stable_negative / stable_neutral / volatile
- `sentiment_conversion` — converted / at_risk / stable
- `sentiment_delta_pct` — score change from start to end
- `implicit_csat_gap` — true if no explicit CSAT rating exists

## License

MIT

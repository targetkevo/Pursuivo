# Pursuivo

> A personal finance dashboard built for people who want to understand and change their spending — not just track it.

![React](https://img.shields.io/badge/React-18-61dafb?style=flat&logo=react) ![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat&logo=vite) ![PWA](https://img.shields.io/badge/PWA-ready-5a0fc8?style=flat) ![License](https://img.shields.io/badge/license-MIT-green?style=flat)

---

## What it does

Most finance apps show you what happened. Pursuivo tells you what to do about it.

Built from real bank statement data, it combines YNAB-style envelope budgeting with a behavioral insight engine that understands your patterns across 3 months — not just this month.

---

## Features

### Budgeting
- Envelope budgeting with collapsible groups (Bills, Needs, Wants, Savings)
- Ready-to-assign hero with hairline allocation bar
- Auto-calibrate — suggests budget targets from weighted 3-month averages

### Red Flag Spending
- Tracks tobacco, cash withdrawals, bank fees, and gambling separately
- Full-width cards with animated arc progress, bezier sparklines, and 3-month trend
- Set personal reduction targets per category
- Commitment toggle — mark habits you're actively working on
- EKG heartbeat visualization in Full History

### Insight Engine
- 15 insights generated from real transaction patterns
- Profile-aware tips based on your goal, obstacle, and spending trigger
- 3-month cross-pattern analysis: escalation detection, recurring drains, delivery trajectory

### Action Plan
- 7-step personalized plan built from real transaction averages
- Steps reference your actual numbers — not estimates
- Checkable with progress persisted to localStorage

### Cash Income
- Dedicated logging for income not in bank statements
- Source picker: Tips, Freelance, Side job, Gift, Sold something, Other
- Missing income prompt appears after the 10th if nothing recorded

### Themes
| Theme | Character |
|-------|-----------|
| Dark | Deep navy, green accent |
| Light | Warm white |
| Midnight | Purple haze |
| Tape | Analog amber — like the inside of a tape deck |

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| UI Framework | React 18 |
| Charts | Recharts |
| Build | Vite 5 |
| Fonts | Plus Jakarta Sans + DM Mono |
| Data | localStorage (no backend required) |
| Bank connection | Plaid API (optional) |
| Deploy | Vercel |

---

## Project Structure

```
pursuivo/
├── src/
│   ├── App.jsx        # Full application — 3,700 lines
│   └── main.jsx       # React entry point + SW registration
├── public/
│   ├── sw.js          # Service worker
│   ├── manifest.json  # PWA manifest
│   └── icons/         # App icons (add before deploying)
├── index.html
├── vite.config.js
├── vercel.json
└── package.json
```

---

## Getting Started

```bash
git clone https://github.com/yourusername/pursuivo.git
cd pursuivo
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

**Drag and drop (fastest)**
1. Run `npm run build`
2. Go to [vercel.com](https://vercel.com)
3. Drag the `dist/` folder onto the dashboard
4. Live URL in ~60 seconds

**Git deploy (recommended)**
1. Push to GitHub
2. vercel.com → New Project → Import repo
3. Framework: Vite (auto-detected) → Deploy

---

## PWA Icons

Generate at [realfavicongenerator.net](https://realfavicongenerator.net), place in `public/icons/`:
- `icon-192.png`
- `icon-512.png`
- `badge-72.png`

---

## Data & Privacy

All data lives in your browser's localStorage. Nothing is sent to any server unless you connect a bank via Plaid. No accounts, no tracking, no ads.

Export all data as CSV from Settings → Export Data.

---

## CSV Upload

Supports: Fifth Third, Chase, Bank of America, Wells Fargo

Handles quoted fields, negative amounts in parentheses, multiple date formats, 40-entry merchant normalization map, deduplication.

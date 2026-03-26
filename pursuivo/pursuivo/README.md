# Pursuivo

A personal finance dashboard built for people who want to understand and change their spending — not just track it.

## What it does

- **YNAB-style budgeting** — envelope budgeting with collapsible groups, auto-calibration from real spending data
- **Red flag spending tracker** — tobacco, cash withdrawals, fees, gambling tracked with EKG-style visualization and reduction targets
- **3-month insight engine** — 15 insights generated from real transaction patterns, profile-aware tips
- **Action plan** — personalized step-by-step financial plan built from real tx data, checkable with progress persistence
- **Cash income logging** — handles users paid in cash with source tracking (tips, freelance, side job, etc.)
- **CSV upload** — parses Fifth Third, Chase, BofA, Wells Fargo formats with merchant normalization
- **4 themes** — Dark, Light, Midnight, Tape (analog amber)
- **PWA** — installable on iOS and Android, offline-capable service worker

## Stack

- React 18 + Recharts
- Vite
- LocalStorage (no backend required for core features)
- Plaid API (optional bank connection)
- Plus Jakarta Sans + DM Mono

## Deploy in 5 minutes

```bash
git clone https://github.com/you/pursuivo
cd pursuivo
npm install
npm run dev
```

Deploy to Vercel:
```bash
npm install -g vercel
vercel
```

## Icons

Generate PWA icons at [realfavicongenerator.net](https://realfavicongenerator.net) and place in `public/icons/`:
- `icon-192.png`
- `icon-512.png`
- `badge-72.png`

## License

MIT

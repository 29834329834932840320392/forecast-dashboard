# Ancira Forecast Planner

A standalone, fully client-side forecasting tool for dealership sales planning. It uses goal inputs and lead-channel assumptions to project units, gross, gap to goal, and the lead volume needed to hit the target.

## Features

- Forecast and Back Into It tabs
- Editable new/used goals, average gross, period label, and lead channels
- Add/remove channels with chart colors
- Scenario save/load/delete through `localStorage`
- Share links using a compact encoded URL parameter
- CSV, XLS, and XLSX lead report imports
- JSON download
- Print/PDF layout
- Static build with no backend, database, login, or API calls

## Run Locally

```bash
npm install
npm run dev
```

The dev server prints a local URL, usually `http://localhost:5173/`.

## Build

```bash
npm run build
```

The static production files are written to `dist/`.

## Importing lead reports

Use **Import Leads** in the scenario toolbar to load a `.csv`, `.xls`, or `.xlsx` report. The importer looks for
`Lead Type`, `Good Leads`, `Appts Scheduled`, `Appts Shown`, and `Sold in Timeframe` columns, aggregates rows by
channel, and updates the channel assumptions. Goals, average gross, and period remain unchanged.

## Preview The Build

```bash
npm run preview
```

## Deploy

Upload the contents of `dist/` to any static host, including Netlify, Vercel, GitHub Pages, Cloudflare Pages, or a Caddy static route. The Vite base path is relative, so the build can be served from a domain root or a subfolder without changing code.

For local review, serve `dist/` with any static file server or use `npm run preview`.

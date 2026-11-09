# SerinSoul Web

A responsive Next.js dashboard companion for the SerinSoul Android app.

## Run locally

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000.

## Current state

The dashboard is a UI prototype populated with clearly labelled illustrative data. It does not yet connect to the NOOP self-hosted push receiver or a production database.

## Planned integration

1. Implement the NOOP Push Protocol v1.0 receiver in a server-side API.
2. Persist authenticated batches and deduplicate by source/device/batch.
3. Expose authenticated read APIs for dashboard summaries and time series.
4. Replace the preview values in `app/page.tsx` with API-backed data.

Never put the NOOP bearer token in browser code. Keep it server-side and use HTTPS.

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

## Publish on GitHub Pages

The repository workflow `.github/workflows/deploy-serinsoul-web.yml` builds this app as a static export and deploys it to GitHub Pages when changes are pushed to `feature/serinsoul-web-dashboard`.

Expected project URL: https://nihalnihal-png.github.io/serinsoul/

In the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions** if it is not already selected. Then check **Actions** for the deployment workflow.

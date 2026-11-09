# SerinSoul backend

Node.js + TypeScript receiver for the NOOP Self-hosted Push Protocol 1.0.

## Current implementation scope

The first receiver milestone intentionally advertises only the append streams `hrSample`, `rrInterval`, and `battery`. It supports authenticated capability discovery, gzip or identity NDJSON batches, bounded payloads, PostgreSQL upserts, and idempotent batch acknowledgements. It does **not** yet advertise mutable streams such as dailyMetric, sleepSession, workout, or journal; those require atomic replace-window staging and deletion semantics and will be added in a later milestone.

## Local setup

1. Create a PostgreSQL database (Supabase will be our hosted option).
2. Run `sql/schema.sql` in its SQL editor.
3. Copy `.env.example` to `.env` and set real values locally.
4. Install and run:

```bash
npm install
npm run dev
```

Health check: `GET http://localhost:8080/health`

NOOP endpoint: `https://YOUR-HOST/noop/push`

Set the endpoint and bearer token in the Android app's **More → Settings → Advanced → Self-hosted Push** screen. Test connection performs capability discovery only; a later push trigger transfers measurements.

## Environment variables

- `DATABASE_URL`: PostgreSQL connection string.
- `NOOP_PUSH_TOKEN`: long random bearer secret used by the Android app.
- `RECEIVER_STATE_ID`: stable UUID; do not rotate during normal deploys.
- `DASHBOARD_API_TOKEN`: separate secret for the dashboard data API.
- `DASHBOARD_ORIGIN`: optional comma-separated allowed browser origins.
- `PORT`: hosting platform port.

Never commit `.env`, database credentials, or bearer tokens. The public GitHub Pages frontend must not contain either API token; browser-facing user authentication will be implemented before exposing personal health data to the public internet.

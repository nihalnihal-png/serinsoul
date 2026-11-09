import "dotenv/config";
import express, { type Request, type Response } from "express";
import cors from "cors";
import { createHash, timingSafeEqual } from "node:crypto";
import { Pool, type PoolClient } from "pg";

const app = express();
const port = Number(process.env.PORT ?? 8080);
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined });
const pushToken = process.env.NOOP_PUSH_TOKEN ?? "";
const dashboardToken = process.env.DASHBOARD_API_TOKEN ?? "";
const receiverStateId = process.env.RECEIVER_STATE_ID ?? "";

const MAX_BODY = 4 * 1024 * 1024;
const MAX_RECORDS = 5000;
const STREAMS = ["hrSample", "rrInterval", "battery"] as const;
type Stream = typeof STREAMS[number];

app.disable("x-powered-by");
app.use(cors({ origin: process.env.DASHBOARD_ORIGIN?.split(",") ?? true }));
app.get("/health", (_req, res) => res.json({ status: "ok", service: "serinsoul-api" }));

function authorized(req: Request, token: string): boolean {
  const supplied = req.header("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token || !supplied) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

function sendError(res: Response, status: number, code: string) {
  return res.status(status).json({ type: "error", protocolVersion: "1.0", code });
}

function parseBody(req: Request): Buffer {
  // express.raw() automatically decompresses gzip request entities before exposing req.body.
  // Do not gunzip again here: doing so attempts to decompress the already-decoded NDJSON
  // and produces the receiver's invalid_gzip error.
  const decoded = req.body as Buffer;
  if (!Buffer.isBuffer(decoded)) throw new Error("invalid_body");
  if (decoded.length > MAX_BODY) throw new Error("body_too_large");
  return decoded;
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
}

function validateRecord(stream: Stream, row: any): boolean {
  if (!isObject(row) || row.type !== "record" || !isObject(row.key) || !isObject(row.data)) return false;
  if (stream === "hrSample") return Number.isInteger(row.key.ts) && Number.isInteger(row.data.bpm);
  if (stream === "rrInterval") return Number.isInteger(row.key.ts) && Number.isInteger(row.key.rrMs) && Number.isInteger(row.key.seq) && (row.data.ord == null || Number.isInteger(row.data.ord)) && (row.data.srcChannel == null || Number.isInteger(row.data.srcChannel)) && (row.data.tsSuspect == null || Number.isInteger(row.data.tsSuspect));
  return Number.isInteger(row.key.ts) && (row.data.soc == null || Number.isFinite(row.data.soc)) && (row.data.mv == null || Number.isInteger(row.data.mv)) && (row.data.charging == null || typeof row.data.charging === "boolean");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(stableJson).join(",") + "]";
  if (isObject(value)) return "{" + Object.keys(value).sort().map(k => JSON.stringify(k) + ":" + stableJson(value[k])).join(",") + "}";
  return JSON.stringify(value);
}

app.get("/noop/push", (req, res) => {
  if (!authorized(req, pushToken)) return sendError(res, 401, "unauthorized");
  if (!receiverStateId || !validUuid(receiverStateId)) return sendError(res, 500, "receiver_not_configured");
  const offered = (req.header("noop-push-accept-version") ?? "").split(",").map(v => v.trim());
  if (!offered.includes("1.0")) return sendError(res, 406, "unsupported_protocol_version");
  return res.json({ type: "capabilities", protocolVersion: "1.0", receiverStateId, streams: STREAMS });
});

app.post("/noop/push", express.raw({ type: () => true, limit: "4.1mb" }), async (req, res) => {
  if (!authorized(req, pushToken)) return sendError(res, 401, "unauthorized");
  let client: PoolClient | undefined;
  try {
    const body = parseBody(req);
    const text = body.toString("utf8");
    if (!text.endsWith("\n") || text.startsWith("\uFEFF")) return sendError(res, 400, "invalid_ndjson");
    const lines = text.slice(0, -1).split("\n");
    if (lines.length < 2 || lines.length > MAX_RECORDS + 1) return sendError(res, 400, "invalid_record_count");
    let header: any;
    let rows: any[];
    try {
      header = JSON.parse(lines[0]);
      rows = lines.slice(1).map(line => JSON.parse(line));
    } catch { return sendError(res, 400, "invalid_json"); }

    if (!isObject(header) || header.type !== "batch" || header.protocolVersion !== "1.0" || !validUuid(header.batchId) || !validUuid(header.sourceId) || typeof header.deviceId !== "string" || !header.deviceId || header.deviceId.length > 256 || !STREAMS.includes(header.stream)) return sendError(res, 422, "invalid_batch_header");
    const stream = header.stream as Stream;
    if (header.delivery !== "append" || header.window !== undefined || !Number.isInteger(header.recordCount) || header.recordCount !== rows.length || rows.length < 1 || rows.length > MAX_RECORDS || header.startCursor !== null && !isObject(header.startCursor) || !isObject(header.endCursor)) return sendError(res, 422, "invalid_batch_shape");
    if (!header.endCursor || !Number.isInteger(header.endCursor.rowId) || typeof header.endCursor.keySha256 !== "string" || !/^[a-f0-9]{64}$/.test(header.endCursor.keySha256)) return sendError(res, 422, "invalid_end_cursor");
    if (header.startCursor !== null && (!Number.isInteger(header.startCursor?.rowId) || typeof header.startCursor?.keySha256 !== "string" || !/^[a-f0-9]{64}$/.test(header.startCursor.keySha256))) return sendError(res, 422, "invalid_start_cursor");
    if (!rows.every(row => validateRecord(stream, row))) return sendError(res, 422, "invalid_record");
    const payloadHash = createHash("sha256").update(body).digest("hex");
    const ack = { protocolVersion: "1.0", batchId: header.batchId, stream, deviceId: header.deviceId, endCursor: header.endCursor, acceptedRows: rows.length, status: "accepted" };

    client = await pool.connect();
    await client.query("BEGIN");
    const prior = await client.query("SELECT payload_sha256, acknowledgement FROM push_batches WHERE source_id=$1 AND device_id=$2 AND batch_id=$3 FOR UPDATE", [header.sourceId, header.deviceId, header.batchId]);
    if (prior.rowCount) {
      if (prior.rows[0].payload_sha256 !== payloadHash) {
        await client.query("ROLLBACK");
        return sendError(res, 409, "batch_id_conflict");
      }
      await client.query("COMMIT");
      return res.status(200).json(prior.rows[0].acknowledgement);
    }

    for (const row of rows) {
      const key = stableJson(row.key);
      await client.query(
        `INSERT INTO health_records (source_id, device_id, stream, record_key, key_json, data_json, measurement_ts)
         VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7)
         ON CONFLICT (source_id, device_id, stream, record_key)
         DO UPDATE SET key_json=EXCLUDED.key_json, data_json=EXCLUDED.data_json, measurement_ts=EXCLUDED.measurement_ts`,
        [header.sourceId, header.deviceId, stream, key, JSON.stringify(row.key), JSON.stringify(row.data), row.key.ts]
      );
    }
    await client.query("INSERT INTO push_batches (source_id, device_id, batch_id, payload_sha256, acknowledgement) VALUES ($1,$2,$3,$4,$5::jsonb)", [header.sourceId, header.deviceId, header.batchId, payloadHash, JSON.stringify(ack)]);
    await client.query("COMMIT");
    return res.status(200).json(ack);
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => undefined);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("too large") || message.includes("larger than")) return sendError(res, 413, "body_too_large");
    console.error("Push request failed", error instanceof Error ? error.name : "unknown");
    return sendError(res, 500, "receiver_error");
  } finally {
    client?.release();
  }
});

app.get("/api/v1/measurements", async (req, res) => {
  if (!authorized(req, dashboardToken)) return res.status(401).json({ error: "unauthorized" });
  const stream = req.query.stream;
  if (typeof stream !== "string" || !STREAMS.includes(stream as Stream)) return res.status(400).json({ error: "unsupported_stream" });
  const limit = Math.min(Math.max(Number(req.query.limit ?? 500), 1), 5000);
  try {
    const result = await pool.query(
      "SELECT device_id, stream, key_json, data_json, measurement_ts FROM health_records WHERE stream=$1 ORDER BY measurement_ts DESC LIMIT $2",
      [stream, limit]
    );
    return res.json({ data: result.rows, count: result.rowCount });
  } catch (error) {
    // Log safe PostgreSQL diagnostics server-side; never expose connection details to the browser.
    const dbError = error as { name?: string; code?: string; message?: string };
    console.error("Dashboard measurements query failed", {
      stream,
      name: dbError?.name ?? "unknown",
      code: dbError?.code ?? "unknown",
      message: (dbError?.message ?? "unknown").slice(0, 300),
    });
    return res.status(500).json({ error: "database_error" });
  }
});

app.listen(port, () => console.log(`SerinSoul API listening on ${port}`));

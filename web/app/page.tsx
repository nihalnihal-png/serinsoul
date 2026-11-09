"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Activity, BatteryFull, HeartPulse, LockKeyhole, RefreshCw, ShieldCheck, Watch, Waves } from "lucide-react";

const API_BASE = "https://serinsoul-api.onrender.com";

type Measurement = {
  device_id: string;
  stream: string;
  key_json: Record<string, unknown>;
  data_json: Record<string, unknown>;
  measurement_ts: number | string;
};
type ApiResponse = { data: Measurement[]; count: number };
type StreamState = { rows: Measurement[]; count: number };

function timeLabel(value: number | string | undefined) {
  if (value === undefined) return "—";
  const date = new Date(Number(value) * 1000);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}
function relativeTime(value: number | string | undefined) {
  if (value === undefined) return "No readings yet";
  const seconds = Math.max(0, Math.floor(Date.now() / 1000 - Number(value)));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

export default function Home() {
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [streams, setStreams] = useState<Record<string, StreamState>>({
    hrSample: { rows: [], count: 0 },
    rrInterval: { rows: [], count: 0 },
    battery: { rows: [], count: 0 },
  });

  const refresh = useCallback(async (authToken: string) => {
    setLoading(true);
    setError("");
    try {
      const names = ["hrSample", "rrInterval", "battery"];
      const responses = await Promise.all(names.map(async stream => {
        const response = await fetch(`${API_BASE}/api/v1/measurements?stream=${stream}&limit=500`, {
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          cache: "no-store",
        });
        if (response.status === 401) throw new Error("The dashboard token was rejected. Check that it matches DASHBOARD_API_TOKEN in Render.");
        if (!response.ok) throw new Error(`The API returned HTTP ${response.status} for ${stream}.`);
        return [stream, await response.json() as ApiResponse] as const;
      }));
      const next: Record<string, StreamState> = {};
      for (const [stream, result] of responses) next[stream] = { rows: result.data, count: result.count };
      setStreams(next);
      setLastRefresh(new Date());
      setConnected(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load measurements.");
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("serinsoul-dashboard-token");
    if (saved) {
      setToken(saved);
      void refresh(saved);
    }
  }, [refresh]);

  useEffect(() => {
    if (!token || !connected) return;
    const id = window.setInterval(() => void refresh(token), 30000);
    return () => window.clearInterval(id);
  }, [token, connected, refresh]);

  const heartRows = useMemo(() => [...streams.hrSample.rows].sort((a, b) => Number(a.measurement_ts) - Number(b.measurement_ts)), [streams.hrSample.rows]);
  const latestHr = streams.hrSample.rows[0];
  const latestRr = streams.rrInterval.rows[0];
  const latestBattery = streams.battery.rows[0];
  const hrValues = heartRows.slice(-60).map(row => Number(row.data_json.bpm)).filter(Number.isFinite);
  const currentHr = latestHr?.data_json.bpm;
  const currentRr = latestRr?.key_json.rrMs;
  const batterySoc = latestBattery?.data_json.soc;
  const totalRows = streams.hrSample.count + streams.rrInterval.count + streams.battery.count;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = tokenInput.trim();
    if (!value) return;
    sessionStorage.setItem("serinsoul-dashboard-token", value);
    setToken(value);
    void refresh(value);
  }
  function disconnect() {
    sessionStorage.removeItem("serinsoul-dashboard-token");
    setToken("");
    setTokenInput("");
    setConnected(false);
    setStreams({ hrSample: { rows: [], count: 0 }, rrInterval: { rows: [], count: 0 }, battery: { rows: [], count: 0 } });
  }

  return <main className="live-shell">
    <header className="live-header">
      <div className="live-brand"><span className="live-brand-mark"><Activity size={21}/></span><span><b>serinsoul<span>.</span></b><small>WELLNESS, IN SYNC</small></span></div>
      <div className="live-header-right"><span className={connected ? "live-status connected" : "live-status"}><i/>{connected ? "Connected to your data" : "Waiting for connection"}</span><button className="live-refresh" onClick={() => token && void refresh(token)} disabled={!token || loading}><RefreshCw size={15} className={loading ? "spinning" : ""}/> Refresh</button></div>
    </header>
    <section className="live-content">
      <div className="live-intro"><div><div className="live-eyebrow"><ShieldCheck size={14}/> PRIVATE HEALTH DASHBOARD</div><h1>Your health, in rhythm.</h1><p>Live measurements received from your WHOOP through the SerinSoul receiver.</p></div><div className="live-last-sync">LAST REFRESHED<strong>{lastRefresh ? lastRefresh.toLocaleTimeString() : "Not connected"}</strong></div></div>

      {!token && <form className="token-panel" onSubmit={submit}><div className="token-icon"><LockKeyhole size={19}/></div><div className="token-copy"><b>Connect your private dashboard</b><span>Enter the DASHBOARD_API_TOKEN configured in your Render service. It stays in this browser tab's session and is not embedded in the website.</span></div><div className="token-entry"><input type="password" autoComplete="off" value={tokenInput} onChange={e => setTokenInput(e.target.value)} placeholder="Dashboard API token" aria-label="Dashboard API token"/><button type="submit" disabled={!tokenInput.trim() || loading}>Connect</button></div></form>}

      {error && <div className="live-error" role="alert">{error}<button onClick={disconnect}>Clear token</button></div>}

      <div className="live-section-title"><div><h2>Live measurements</h2><p>Only streams currently supported by your receiver are shown.</p></div><span className="stream-count">{totalRows.toLocaleString()} stored records</span></div>
      <div className="live-metric-grid">
        <article className="live-metric"><div className="live-metric-head"><span><HeartPulse size={17}/></span><small>HEART RATE</small></div><strong>{currentHr == null ? "—" : String(currentHr)}<em>{currentHr == null ? "" : " bpm"}</em></strong><p>{latestHr ? relativeTime(latestHr.measurement_ts) : "Waiting for first heart-rate sample"}</p><small className="live-record-count">{streams.hrSample.count.toLocaleString()} samples received</small></article>
        <article className="live-metric"><div className="live-metric-head"><span><Waves size={17}/></span><small>RR INTERVAL</small></div><strong>{currentRr == null ? "—" : String(currentRr)}<em>{currentRr == null ? "" : " ms"}</em></strong><p>{latestRr ? relativeTime(latestRr.measurement_ts) : "Waiting for first RR interval"}</p><small className="live-record-count">{streams.rrInterval.count.toLocaleString()} samples received</small></article>
        <article className="live-metric"><div className="live-metric-head"><span><BatteryFull size={17}/></span><small>DEVICE BATTERY</small></div><strong>{batterySoc == null ? "—" : String(batterySoc)}<em>{batterySoc == null ? "" : "%"}</em></strong><p>{latestBattery ? relativeTime(latestBattery.measurement_ts) : "Waiting for battery information"}</p><small className="live-record-count">{streams.battery.count.toLocaleString()} records received</small></article>
      </div>

      <div className="live-panels">
        <article className="live-panel"><div className="live-panel-head"><div><h2>Heart-rate history</h2><p>Latest {hrValues.length} heart-rate samples</p></div><span className="live-tag">hrSample</span></div>
          {hrValues.length > 1 ? <div className="live-chart"><svg viewBox="0 0 600 180" preserveAspectRatio="none" role="img" aria-label="Heart rate sample trend"><line x1="0" y1="150" x2="600" y2="150"/><line x1="0" y1="90" x2="600" y2="90"/><line x1="0" y1="30" x2="600" y2="30"/><polyline points={hrValues.map((v, i) => `${i * (600 / Math.max(1, hrValues.length - 1))},${160 - (v - Math.min(...hrValues)) / Math.max(1, Math.max(...hrValues) - Math.min(...hrValues)) * 125}`).join(" ")}/></svg><div className="live-chart-meta"><span>Oldest: {timeLabel(heartRows[heartRows.length - hrValues.length]?.measurement_ts)}</span><span>Latest: {timeLabel(latestHr?.measurement_ts)}</span></div></div> : <div className="live-empty"><Activity size={22}/><b>{hrValues.length ? "One sample received" : "No heart-rate data yet"}</b><span>Offload your WHOOP data in the Android app, then use Self-hosted Push to send it here.</span></div>}
        </article>
        <article className="live-panel"><div className="live-panel-head"><div><h2>Receiver status</h2><p>SerinSoul API and supported streams</p></div><span className="live-tag">PUSH 1.0</span></div><div className="stream-list">{[["Heart-rate samples","hrSample",streams.hrSample.count],["RR intervals","rrInterval",streams.rrInterval.count],["Battery readings","battery",streams.battery.count]].map(([label, stream, count]) => <div className="stream-row" key={String(stream)}><span className="stream-ok"/><div><b>{label}</b><small>{stream}</small></div><strong>{Number(count).toLocaleString()}</strong></div>)}</div><div className="receiver-note"><Watch size={16}/><span>Data arrives after the Android app offloads the band and completes a push. This dashboard refreshes every 30 seconds while connected.</span></div></article>
      </div>
      <footer className="live-footer"><span>SerinSoul · Your health, in rhythm.</span><span>Data is read from your private receiver. Not medical advice.</span></footer>
    </section>
  </main>;
}

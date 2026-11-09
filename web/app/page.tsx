"use client";

import { useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, CalendarDays, ChevronDown,
  ChevronLeft, ChevronRight, CircleHelp, Clock3, Cloud, Footprints, Heart,
  LayoutDashboard, Moon, MoreHorizontal, Settings2, ShieldCheck, Sparkles,
  Watch, Zap, Menu, X, Droplets, Flame, Wind, BatteryFull
} from "lucide-react";

type NavKey = "Overview" | "Vitals" | "Sleep" | "Activity" | "Trends";
const nav: { label: NavKey; icon: typeof LayoutDashboard }[] = [
  { label: "Overview", icon: LayoutDashboard }, { label: "Vitals", icon: Heart },
  { label: "Sleep", icon: Moon }, { label: "Activity", icon: Activity }, { label: "Trends", icon: CalendarDays },
];

function LineChart({ color = "#76d8bd", height = 170 }: { color?: string; height?: number }) {
  const points = "0,111 22,103 44,109 66,77 88,87 110,64 132,75 154,45 176,57 198,38 220,55 242,29 264,43 286,21 308,32 330,16 352,28 374,10 396,20 418,7";
  return <svg viewBox="0 0 418 130" className="line-chart" role="img" aria-label="Heart rate trend chart">
    {[25,55,85,115].map(y => <line key={y} x1="0" x2="418" y1={y} y2={y} stroke="currentColor" opacity=".09" strokeDasharray="3 5" />)}
    <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="418" cy="7" r="4" fill={color} />
  </svg>;
}

function Ring({ value, label, color, sub }: { value: number; label: string; color: string; sub: string }) {
  const circumference = 2 * Math.PI * 42;
  return <div className="ring-wrap">
    <div className="ring">
      <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" className="ring-track" /><circle cx="50" cy="50" r="42" className="ring-value" style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset: circumference * (1 - value / 100) }} /></svg>
      <div className="ring-center"><strong>{value}</strong><small>{label}</small></div>
    </div><span className="ring-sub">{sub}</span>
  </div>;
}

function Metric({ icon: Icon, label, value, unit, change, positive = true }: { icon: typeof Heart; label: string; value: string; unit: string; change: string; positive?: boolean }) {
  return <div className="metric-card">
    <div className="metric-top"><span className="metric-icon"><Icon size={17} /></span><span className="metric-label">{label}</span><MoreHorizontal size={17} className="muted" /></div>
    <div className="metric-number">{value}<small>{unit}</small></div>
    <div className={positive ? "change good" : "change neutral"}>{positive ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {change}</div>
  </div>;
}

export default function Home() {
  const [active, setActive] = useState<NavKey>("Overview");
  const [range, setRange] = useState("Today");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotice, setShowNotice] = useState(true);
  const title = active === "Overview" ? "Your day, in rhythm." : active === "Vitals" ? "Your body, at a glance." : active === "Sleep" ? "Rest is part of progress." : active === "Activity" ? "Move with intention." : "Patterns over time.";
  return <main className="app-shell">
    <aside className={mobileOpen ? "sidebar mobile-open" : "sidebar"}>
      <div className="brand"><div className="brand-mark"><Activity size={21}/></div><div><b>serinsoul<span>.</span></b><small>WELLNESS, IN SYNC</small></div><button className="mobile-close" onClick={() => setMobileOpen(false)}><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{nav.map(item => <button key={item.label} className={active === item.label ? "nav-item active" : "nav-item"} onClick={() => { setActive(item.label); setMobileOpen(false); }}><item.icon size={18}/><span>{item.label}</span>{item.label === "Overview" && <i/>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="device-card"><div className="device-top"><span className="device-icon"><Watch size={17}/></span><span className="online-dot"/></div><b>WHOOP 4.0</b><small>Connected · Synced just now</small><div className="battery-line"><BatteryFull size={14}/> 86% battery</div></div>
        <button className="nav-item"><Settings2 size={18}/> <span>Settings</span></button>
        <div className="profile"><div className="avatar">N</div><div><b>Nihal</b><small>Personal account</small></div><MoreHorizontal size={18}/></div>
      </div>
    </aside>
    {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)}/>}
    <section className="main-area">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu/></button><div className="breadcrumb">Workspace <span>/</span> <b>{active}</b></div><div className="top-actions"><span className="sync-status"><span/> All data synced</span><button className="icon-button"><Bell size={18}/><i/></button><div className="top-avatar">N</div></div></header>
      <div className="content">
        <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={14}/> MONDAY, NOVEMBER 9, 2026</div><h1>{title}</h1><p className="subtitle">A little more awareness. A better way to feel.</p></div><div className="date-control"><button><ChevronLeft size={16}/></button><CalendarDays size={16}/><span>Today</span><button><ChevronRight size={16}/></button></div></div>
        {showNotice && <div className="notice"><div className="notice-icon"><ShieldCheck size={18}/></div><div><b>Your data stays yours.</b><span> Your health data is synced from your device and shown privately in your dashboard.</span></div><button onClick={() => setShowNotice(false)}><X size={16}/></button></div>}
        <div className="section-heading"><div><h2>Daily overview</h2><p>Your key signals, all in one place.</p></div><div className="range-switch">{["Today","7 days","30 days"].map(x => <button key={x} onClick={() => setRange(x)} className={range === x ? "selected" : ""}>{x}</button>)}</div></div>
        <div className="score-grid">
          <div className="score-card charge-card"><div className="card-heading"><span>DAILY CHARGE</span><span className="live-pill"><i/> TODAY</span></div><div className="charge-main"><Ring value={78} label="GOOD" color="#7ed9bc" sub="Recovery score"/><div className="charge-copy"><h3>You're finding your balance.</h3><p>Your body is showing signs of readiness. Keep a steady pace and listen to how you feel.</p><span className="score-foot"><ArrowUpRight size={14}/> +6 points from yesterday</span></div></div><div className="card-divider"/><div className="score-bottom"><span><small>RESTING HR</small><b>54 <em>bpm</em></b></span><span><small>HRV</small><b>68 <em>ms</em></b></span><span><small>RESPIRATORY RATE</small><b>15.2 <em>rpm</em></b></span></div></div>
          <div className="score-card sleep-card"><div className="card-heading"><span>SLEEP PERFORMANCE</span><Moon size={17}/></div><div className="sleep-score"><strong>86</strong><span>/ 100</span><b>Well rested</b></div><div className="sleep-bar"><i/></div><div className="sleep-meta"><span><small>TIME ASLEEP</small><b>7h 42m</b></span><span><small>SLEEP NEED</small><b>8h 15m</b></span></div><div className="sleep-note"><Clock3 size={14}/> You got 93% of your sleep need</div></div>
        </div>
        <div className="section-heading metrics-heading"><div><h2>Body signals</h2><p>A closer look at what's happening right now.</p></div><button className="text-link" onClick={() => setActive("Vitals")}>Explore vitals <ChevronRight size={15}/></button></div>
        <div className="metric-grid">
          <Metric icon={Heart} label="Heart rate" value="72" unit=" bpm" change="Resting 54 bpm"/>
          <Metric icon={Activity} label="HRV (RMSSD)" value="68" unit=" ms" change="↑ 8 ms vs 7-day avg"/>
          <Metric icon={Wind} label="Respiratory rate" value="15.2" unit=" rpm" change="Within your baseline"/>
          <Metric icon={Droplets} label="Blood oxygen" value="97" unit="%" change="Latest recorded sample"/>
        </div>
        <div className="lower-grid">
          <div className="panel heart-panel"><div className="panel-heading"><div><h2>Heart rate</h2><p>Your heart rate throughout the day</p></div><button className="select-button">Today <ChevronDown size={14}/></button></div><div className="chart-summary"><strong>72 <small>bpm</small></strong><span className="change good"><ArrowUpRight size={14}/> Live reading</span></div><LineChart/><div className="chart-axis"><span>6 AM</span><span>9 AM</span><span>12 PM</span><span>3 PM</span><span>6 PM</span><span>9 PM</span></div><div className="legend"><span><i/> Heart rate</span><span className="legend-muted">Resting baseline · 54 bpm</span></div></div>
          <div className="panel activity-panel"><div className="panel-heading"><div><h2>Activity snapshot</h2><p>Movement adds up.</p></div><span className="activity-date">TODAY</span></div><div className="activity-stat"><span className="activity-icon steps"><Footprints size={18}/></span><div><small>STEPS</small><b>8,426 <em>/ 10,000</em></b></div><strong>84%</strong></div><div className="progress"><i style={{width:"84%"}}/></div><div className="activity-stat"><span className="activity-icon strain"><Zap size={18}/></span><div><small>STRAIN</small><b>11.2 <em>/ 21</em></b></div><strong>53%</strong></div><div className="progress orange"><i style={{width:"53%"}}/></div><div className="activity-stat"><span className="activity-icon calories"><Flame size={18}/></span><div><small>CALORIES</small><b>1,842 <em>kcal</em></b></div></div><div className="activity-footer"><span><Cloud size={15}/> Last updated just now</span><button onClick={() => setActive("Activity")}>View activity <ChevronRight size={14}/></button></div></div>
        </div>
        <div className="footer-note"><span>SerinSoul</span> · Your health, in rhythm. <span className="demo-tag">PREVIEW DATA</span><span className="footer-right">Metrics are illustrative until your device is connected.</span></div>
      </div>
    </section>
  </main>;
}

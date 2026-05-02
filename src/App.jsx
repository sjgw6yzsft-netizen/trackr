import { useState, useEffect, useCallback, useRef } from “react”;
import {
AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
CartesianGrid, PieChart, Pie, Cell, Legend
} from “recharts”;

/* ═══════════════════════════════ STORAGE ═══════════════════════════════ */
const S = {
async get(k) {
try { const v = localStorage.getItem(“tkr2:” + k); return v ? JSON.parse(v) : null; } catch { return null; }
},
async set(k, v) {
try { localStorage.setItem(“tkr2:” + k, JSON.stringify(v)); return true; } catch { return false; }
},
};

/* ═══════════════════════════════ HELPERS ═══════════════════════════════ */
const f2 = n => n == null ? “—” : Number(n).toFixed(2);
const clr = n => n == null ? “#7c7c9e” : n >= 0 ? “#00ffaa” : “#ff4f6a”;
const bg_clr = n => n == null ? “rgba(124,124,158,0.08)” : n >= 0 ? “rgba(0,255,170,0.07)” : “rgba(255,79,106,0.07)”;
const TODAY = () => new Date().toISOString().split(“T”)[0];

/* ═══════════════════════════════ AI PRICE FETCH ════════════════════════ */
async function fetchPricesViaAI(tickers) {
const res = await fetch(“https://api.anthropic.com/v1/messages”, {
method: “POST”,
headers: { “Content-Type”: “application/json” },
body: JSON.stringify({
model: “claude-sonnet-4-20250514”,
max_tokens: 800,
tools: [{ type: “web_search_20250305”, name: “web_search” }],
messages: [{
role: “user”,
content: `Search and find the current real-time stock prices for these tickers: ${tickers.join(", ")}. After searching, respond with ONLY a JSON object in this exact format with no other text: {"AAPL":189.50,"TSLA":245.30}`
}]
})
});
const data = await res.json();
const text = (data.content || []).filter(b => b.type === “text”).map(b => b.text).join(””);
try { return JSON.parse(text.trim()); } catch {}
const m1 = text.match(/{[^{}]*\d+.?\d*[^{}]*}/);
if (m1) { try { return JSON.parse(m1[0]); } catch {} }
const out = {};
tickers.forEach(t => {
const rx = new RegExp(`["']?${t}["']?\\s*[:=]?\\s*\\$?([0-9]+\\.?[0-9]*)`, “i”);
const m = text.match(rx);
if (m) out[t] = parseFloat(m[1]);
});
return out;
}

/* ═══════════════════════════════ STYLES ════════════════════════════════ */
const CSS = `
@import url(‘https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap’);
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
–bg: #0a0a0f;
–panel: #0f0f18;
–border: #1e1e30;
–border2: #2a2a42;
–green: #00ffaa;
–red: #ff4f6a;
–amber: #ffb83f;
–blue: #4f8fff;
–muted: #4a4a6a;
–text: #e0e0f0;
–sub: #7c7c9e;
–font-mono: ‘Space Mono’, monospace;
–font-sans: ‘Syne’, sans-serif;
}
body { background: var(–bg); color: var(–text); font-family: var(–font-sans); }

.app { min-height: 100vh; display: flex; flex-direction: column; }

/* SCAN LINE EFFECT */
.app::before {
content: ‘’;
position: fixed; inset: 0; z-index: 9999; pointer-events: none;
background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
}

/* AUTH SCREEN */
.auth-wrap {
min-height: 100vh; display: flex; align-items: center; justify-content: center;
background: radial-gradient(ellipse at 30% 50%, rgba(0,255,170,0.04) 0%, transparent 60%),
radial-gradient(ellipse at 70% 20%, rgba(79,143,255,0.04) 0%, transparent 50%), var(–bg);
}
.auth-box {
width: 400px; padding: 48px; border: 1px solid var(–border2);
background: var(–panel); position: relative; overflow: hidden;
}
.auth-box::before {
content: ‘’; position: absolute; top: 0; left: 0; right: 0; height: 2px;
background: linear-gradient(90deg, transparent, var(–green), transparent);
}
.auth-title { font-family: var(–font-sans); font-size: 11px; font-weight: 700; letter-spacing: 0.3em; color: var(–sub); text-transform: uppercase; margin-bottom: 32px; }
.auth-logo { font-family: var(–font-sans); font-size: 28px; font-weight: 800; color: var(–text); margin-bottom: 8px; letter-spacing: -0.02em; }
.auth-logo span { color: var(–green); }
.auth-sub { font-family: var(–font-mono); font-size: 11px; color: var(–sub); margin-bottom: 40px; }

.field { margin-bottom: 16px; }
.field label { display: block; font-size: 10px; font-weight: 700; letter-spacing: 0.2em; color: var(–sub); text-transform: uppercase; margin-bottom: 8px; }
.field input {
width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(–border2);
color: var(–text); font-family: var(–font-mono); font-size: 13px;
padding: 12px 14px; outline: none; transition: border-color 0.2s;
}
.field input:focus { border-color: var(–green); }
.field input::placeholder { color: var(–muted); }

.btn-primary {
width: 100%; background: var(–green); color: #000; font-family: var(–font-sans);
font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
padding: 14px; border: none; cursor: pointer; margin-top: 8px; transition: opacity 0.2s;
}
.btn-primary:hover { opacity: 0.85; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-ghost {
width: 100%; background: transparent; color: var(–sub); font-family: var(–font-mono);
font-size: 11px; padding: 12px; border: 1px solid var(–border); cursor: pointer;
margin-top: 8px; transition: all 0.2s;
}
.btn-ghost:hover { border-color: var(–border2); color: var(–text); }
.auth-err { font-family: var(–font-mono); font-size: 11px; color: var(–red); margin-top: 12px; }

/* TOP NAV */
.nav {
display: flex; align-items: center; justify-content: space-between;
padding: 16px 32px; border-bottom: 1px solid var(–border);
background: rgba(10,10,15,0.9); backdrop-filter: blur(12px);
position: sticky; top: 0; z-index: 100;
}
.nav-logo { font-family: var(–font-sans); font-size: 18px; font-weight: 800; letter-spacing: -0.02em; }
.nav-logo span { color: var(–green); }
.nav-right { display: flex; align-items: center; gap: 20px; }
.nav-user { font-family: var(–font-mono); font-size: 11px; color: var(–sub); }
.nav-user strong { color: var(–green); font-weight: 400; }
.btn-sm {
background: transparent; border: 1px solid var(–border2); color: var(–sub);
font-family: var(–font-mono); font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase;
padding: 7px 14px; cursor: pointer; transition: all 0.2s;
}
.btn-sm:hover { border-color: var(–red); color: var(–red); }

/* TABS */
.tabs { display: flex; border-bottom: 1px solid var(–border); padding: 0 32px; }
.tab {
font-family: var(–font-mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
color: var(–muted); padding: 14px 18px; cursor: pointer; border-bottom: 2px solid transparent;
transition: all 0.2s; margin-bottom: -1px;
}
.tab:hover { color: var(–text); }
.tab.active { color: var(–green); border-bottom-color: var(–green); }

/* MAIN CONTENT */
.content { flex: 1; padding: 32px; max-width: 1200px; width: 100%; margin: 0 auto; }

/* SUMMARY CARDS */
.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 32px; }
.summary-card {
background: var(–panel); border: 1px solid var(–border); padding: 20px 22px; position: relative; overflow: hidden;
}
.summary-card::after {
content: ‘’; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
background: linear-gradient(90deg, transparent, var(–border2), transparent);
}
.summary-label { font-family: var(–font-mono); font-size: 9px; letter-spacing: 0.25em; color: var(–sub); text-transform: uppercase; margin-bottom: 10px; }
.summary-val { font-family: var(–font-mono); font-size: 22px; font-weight: 700; color: var(–text); line-height: 1; }
.summary-val.green { color: var(–green); }
.summary-val.red { color: var(–red); }
.summary-sub { font-family: var(–font-mono); font-size: 10px; color: var(–sub); margin-top: 6px; }

/* ADD POSITION */
.add-bar {
background: var(–panel); border: 1px solid var(–border); padding: 20px 24px;
display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap;
}
.add-bar-label { font-family: var(–font-mono); font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; color: var(–sub); white-space: nowrap; }
.add-input {
background: rgba(255,255,255,0.03); border: 1px solid var(–border2); color: var(–text);
font-family: var(–font-mono); font-size: 12px; padding: 9px 12px; outline: none;
width: 130px; transition: border-color 0.2s;
}
.add-input:focus { border-color: var(–green); }
.add-input::placeholder { color: var(–muted); }
.btn-add {
background: rgba(0,255,170,0.1); border: 1px solid var(–green); color: var(–green);
font-family: var(–font-mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
padding: 9px 20px; cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.btn-add:hover { background: rgba(0,255,170,0.2); }
.btn-add:disabled { opacity: 0.4; cursor: not-allowed; }

/* POSITIONS TABLE */
.table-wrap { background: var(–panel); border: 1px solid var(–border); overflow: hidden; }
.table-header {
display: grid; grid-template-columns: 80px 1fr 120px 120px 120px 120px 80px;
padding: 12px 20px; border-bottom: 1px solid var(–border);
font-family: var(–font-mono); font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(–muted);
}
.table-row {
display: grid; grid-template-columns: 80px 1fr 120px 120px 120px 120px 80px;
padding: 16px 20px; border-bottom: 1px solid var(–border);
transition: background 0.15s; align-items: center;
}
.table-row:last-child { border-bottom: none; }
.table-row:hover { background: rgba(255,255,255,0.02); }
.ticker-badge {
background: rgba(79,143,255,0.1); border: 1px solid rgba(79,143,255,0.25);
color: var(–blue); font-family: var(–font-mono); font-size: 12px; font-weight: 700;
padding: 4px 8px; display: inline-block; letter-spacing: 0.05em;
}
.pos-name { font-family: var(–font-sans); font-size: 13px; color: var(–sub); }
.mono { font-family: var(–font-mono); font-size: 12px; }
.btn-del {
background: transparent; border: 1px solid var(–border); color: var(–muted);
font-size: 12px; width: 28px; height: 28px; cursor: pointer; transition: all 0.2s;
display: flex; align-items: center; justify-content: center;
}
.btn-del:hover { border-color: var(–red); color: var(–red); }
.empty-state {
text-align: center; padding: 80px 20px;
font-family: var(–font-mono); font-size: 12px; color: var(–muted);
}
.empty-state div:first-child { font-size: 32px; margin-bottom: 16px; opacity: 0.3; }

/* REFRESH BAR */
.refresh-bar {
display: flex; align-items: center; justify-content: space-between;
margin-bottom: 16px; flex-wrap: wrap; gap: 8px;
}
.refresh-bar h3 { font-family: var(–font-sans); font-size: 14px; font-weight: 700; letter-spacing: 0.05em; }
.refresh-right { display: flex; align-items: center; gap: 12px; }
.last-updated { font-family: var(–font-mono); font-size: 10px; color: var(–muted); }
.btn-refresh {
background: transparent; border: 1px solid var(–border2); color: var(–sub);
font-family: var(–font-mono); font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase;
padding: 7px 14px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;
}
.btn-refresh:hover { border-color: var(–green); color: var(–green); }
.btn-refresh:disabled { opacity: 0.4; cursor: not-allowed; }
.spin { display: inline-block; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ANALYTICS */
.analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.chart-card {
background: var(–panel); border: 1px solid var(–border); padding: 24px;
}
.chart-title { font-family: var(–font-mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(–sub); margin-bottom: 20px; }
.chart-card.full { grid-column: 1 / -1; }

/* RECHARTS CUSTOM */
.recharts-cartesian-grid-horizontal line,
.recharts-cartesian-grid-vertical line { stroke: var(–border) !important; }
.recharts-tooltip-wrapper { outline: none; }

/* LOADING OVERLAY */
.loading-status {
font-family: var(–font-mono); font-size: 11px; color: var(–amber);
padding: 12px 20px; background: rgba(255,184,63,0.06); border: 1px solid rgba(255,184,63,0.2);
margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
}

/* P&L badge */
.pnl-badge {
display: inline-block; padding: 3px 8px; font-family: var(–font-mono); font-size: 11px;
border-radius: 2px;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(–bg); }
::-webkit-scrollbar-thumb { background: var(–border2); }
::-webkit-scrollbar-thumb:hover { background: var(–muted); }

@media (max-width: 900px) {
.summary-grid { grid-template-columns: repeat(2,1fr); }
.analytics-grid { grid-template-columns: 1fr; }
.chart-card.full { grid-column: auto; }
.table-header, .table-row { grid-template-columns: 70px 1fr 100px 100px 60px; }
.table-header > :nth-child(4),
.table-header > :nth-child(5),
.table-row > :nth-child(4),
.table-row > :nth-child(5) { display: none; }
}
`;

/* ═══════════════════════════════ CUSTOM TOOLTIP ════════════════════════ */
const CustomTooltip = ({ active, payload, label }) => {
if (!active || !payload?.length) return null;
return (
<div style={{ background: “#0f0f18”, border: “1px solid #2a2a42”, padding: “10px 14px”, fontFamily: “‘Space Mono’, monospace”, fontSize: 11 }}>
<div style={{ color: “#7c7c9e”, marginBottom: 4 }}>{label}</div>
{payload.map(p => (
<div key={p.name} style={{ color: p.color || “#e0e0f0” }}>{p.name}: ${f2(p.value)}</div>
))}
</div>
);
};

/* ═══════════════════════════════ PIE TOOLTIP ═══════════════════════════ */
const PieTooltip = ({ active, payload }) => {
if (!active || !payload?.length) return null;
const d = payload[0];
return (
<div style={{ background: “#0f0f18”, border: “1px solid #2a2a42”, padding: “10px 14px”, fontFamily: “‘Space Mono’, monospace”, fontSize: 11 }}>
<div style={{ color: “#4f8fff”, fontWeight: 700 }}>{d.name}</div>
<div style={{ color: “#e0e0f0”, marginTop: 2 }}>{f2(d.payload.pct)}% · ${f2(d.value)}</div>
</div>
);
};

const PIE_COLORS = [”#4f8fff”,”#00ffaa”,”#ffb83f”,”#ff4f6a”,”#a78bfa”,”#38bdf8”,”#fb923c”,”#e879f9”];

/* ═══════════════════════════════ MAIN APP ══════════════════════════════ */
export default function App() {
const [user, setUser] = useState(null);
const [mode, setMode] = useState(“login”);
const [authF, setAuthF] = useState({ u: “”, p: “” });
const [authErr, setAuthErr] = useState(””);
const [tab, setTab] = useState(“portfolio”);

const [pos, setPos] = useState([]);
const [prices, setPrices] = useState({});
const [loading, setLoading] = useState(false);
const [lastUpdated, setLastUpdated] = useState(null);
const [addF, setAddF] = useState({ ticker: “”, shares: “”, cost: “”, name: “” });
const [addErr, setAddErr] = useState(””);

/* Session restore */
useEffect(() => {
const saved = localStorage.getItem(“tkr2:session”);
if (saved) setUser(saved);
}, []);
useEffect(() => {
if (user) localStorage.setItem(“tkr2:session”, user);
else localStorage.removeItem(“tkr2:session”);
}, [user]);

/* Load positions */
useEffect(() => {
if (!user) return;
(async () => {
const p = await S.get(`pos:${user}`) || [];
setPos(p);
const pr = await S.get(`prices:${user}`) || {};
setPrices(pr);
const lu = await S.get(`lu:${user}`);
if (lu) setLastUpdated(lu);
})();
}, [user]);

const savePos = useCallback(async list => {
setPos(list);
await S.set(`pos:${user}`, list);
}, [user]);

/* Fetch prices */
const refreshPrices = useCallback(async (positions) => {
const tickers = […new Set((positions || pos).map(p => p.ticker.toUpperCase()))];
if (!tickers.length) return;
setLoading(true);
try {
const fetched = await fetchPricesViaAI(tickers);
const merged = { …prices, …fetched };
setPrices(merged);
const now = new Date().toLocaleTimeString(“en-US”, { hour: “2-digit”, minute: “2-digit” });
setLastUpdated(now);
await S.set(`prices:${user}`, merged);
await S.set(`lu:${user}`, now);
} catch (e) {
console.error(e);
}
setLoading(false);
}, [pos, prices, user]);

/* Auth */
const doAuth = async isReg => {
const { u, p } = authF;
if (!u.trim() || !p.trim()) { setAuthErr(“All fields required.”); return; }
if (isReg) {
const ex = await S.get(`usr:${u.toLowerCase()}`);
if (ex) { setAuthErr(“Username taken.”); return; }
await S.set(`usr:${u.toLowerCase()}`, { pw: p });
setUser(u.toLowerCase());
} else {
const d = await S.get(`usr:${u.toLowerCase()}`);
if (!d) { setAuthErr(“User not found.”); return; }
if (d.pw !== p) { setAuthErr(“Wrong password.”); return; }
setUser(u.toLowerCase());
}
};

/* Add position */
const addPosition = async () => {
const t = addF.ticker.trim().toUpperCase();
const sh = parseFloat(addF.shares);
const co = parseFloat(addF.cost);
if (!t || isNaN(sh) || sh <= 0 || isNaN(co) || co <= 0) {
setAddErr(“Enter valid ticker, shares & cost basis.”); return;
}
const existing = pos.find(p => p.ticker === t);
let newList;
if (existing) {
// Average down/up
const totalShares = existing.shares + sh;
const totalCost = existing.shares * existing.costBasis + sh * co;
newList = pos.map(p => p.ticker === t ? { …p, shares: totalShares, costBasis: totalCost / totalShares } : p);
} else {
newList = […pos, { ticker: t, name: addF.name.trim() || t, shares: sh, costBasis: co, addedDate: TODAY() }];
}
await savePos(newList);
setAddF({ ticker: “”, shares: “”, cost: “”, name: “” });
setAddErr(””);
await refreshPrices(newList);
};

const removePosition = async ticker => {
const newList = pos.filter(p => p.ticker !== ticker);
await savePos(newList);
const newPrices = { …prices };
delete newPrices[ticker];
setPrices(newPrices);
await S.set(`prices:${user}`, newPrices);
};

/* Derived metrics */
const enriched = pos.map(p => {
const cur = prices[p.ticker];
const value = cur != null ? cur * p.shares : null;
const costTotal = p.costBasis * p.shares;
const pnl = value != null ? value - costTotal : null;
const pnlPct = pnl != null ? (pnl / costTotal) * 100 : null;
return { …p, currentPrice: cur, value, costTotal, pnl, pnlPct };
});

const totalValue = enriched.reduce((a, e) => a + (e.value ?? e.costTotal), 0);
const totalCost = enriched.reduce((a, e) => a + e.costTotal, 0);
const totalPnl = enriched.filter(e => e.pnl != null).reduce((a, e) => a + e.pnl, 0);
const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
const hasAnyPrice = enriched.some(e => e.currentPrice != null);

/* Pie data */
const pieData = enriched.map((e, i) => ({
name: e.ticker, value: e.value ?? e.costTotal,
pct: totalValue > 0 ? ((e.value ?? e.costTotal) / totalValue * 100) : 0,
fill: PIE_COLORS[i % PIE_COLORS.length]
}));

/* Simulated history (based on cost basis ± small deltas for demo) */
const historyData = (() => {
if (!hasAnyPrice || enriched.length === 0) return [];
const days = [“Mon”,“Tue”,“Wed”,“Thu”,“Fri”,“Today”];
return days.map((d, i) => {
const factor = 1 + (i === 5 ? (totalPnlPct / 100) : (totalPnlPct / 100) * (i / 6) * (0.5 + Math.random() * 0.5));
return { day: d, value: totalCost * factor };
});
})();

/* ─── AUTH SCREEN ─── */
if (!user) return (
<>
<style>{CSS}</style>
<div className="auth-wrap">
<div className="auth-box">
<div className="auth-logo">TRKR<span>.</span></div>
<div className="auth-sub">// portfolio intelligence terminal</div>
<div className="auth-title">{mode === “register” ? “Create Account” : “Sign In”}</div>
<div className="field">
<label>Username</label>
<input placeholder=“handle” value={authF.u} onChange={e => setAuthF(f => ({ …f, u: e.target.value }))} onKeyDown={e => e.key === “Enter” && doAuth(mode === “register”)} />
</div>
<div className="field">
<label>Password</label>
<input type=“password” placeholder=”••••••••” value={authF.p} onChange={e => setAuthF(f => ({ …f, p: e.target.value }))} onKeyDown={e => e.key === “Enter” && doAuth(mode === “register”)} />
</div>
<button className=“btn-primary” onClick={() => doAuth(mode === “register”)}>
{mode === “register” ? “Create Account →” : “Enter Terminal →”}
</button>
<button className=“btn-ghost” onClick={() => { setMode(mode === “register” ? “login” : “register”); setAuthErr(””); }}>
{mode === “register” ? “← Back to sign in” : “New user? Register”}
</button>
{authErr && <div className="auth-err">⚠ {authErr}</div>}
</div>
</div>
</>
);

/* ─── MAIN APP ─── */
return (
<>
<style>{CSS}</style>
<div className="app">

```
    {/* NAV */}
    <nav className="nav">
      <div className="nav-logo">TRKR<span>.</span></div>
      <div className="nav-right">
        <div className="nav-user">logged in as <strong>{user}</strong></div>
        <button className="btn-sm" onClick={() => setUser(null)}>Sign Out</button>
      </div>
    </nav>

    {/* TABS */}
    <div className="tabs">
      {["portfolio","analytics"].map(t => (
        <div key={t} className={`tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
          {t === "portfolio" ? "Portfolio" : "Analytics"}
        </div>
      ))}
    </div>

    <div className="content">

      {/* SUMMARY */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-label">Total Value</div>
          <div className="summary-val">${f2(totalValue)}</div>
          <div className="summary-sub">{pos.length} position{pos.length !== 1 ? "s" : ""}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Cost</div>
          <div className="summary-val">${f2(totalCost)}</div>
          <div className="summary-sub">cost basis</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Unrealized P&L</div>
          <div className={`summary-val ${hasAnyPrice ? (totalPnl >= 0 ? "green" : "red") : ""}`}>
            {hasAnyPrice ? `${totalPnl >= 0 ? "+" : ""}$${f2(Math.abs(totalPnl))}` : "—"}
          </div>
          <div className="summary-sub" style={{ color: hasAnyPrice ? clr(totalPnl) : undefined }}>
            {hasAnyPrice ? `${totalPnlPct >= 0 ? "+" : ""}${f2(totalPnlPct)}%` : "refresh for live P&L"}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Day Status</div>
          <div className="summary-val" style={{ fontSize: 14, marginTop: 4, color: "#4a4a6a" }}>MARKET</div>
          <div className="summary-sub" style={{ color: lastUpdated ? "#00ffaa" : undefined }}>
            {lastUpdated ? `updated ${lastUpdated}` : "prices not fetched"}
          </div>
        </div>
      </div>

      {tab === "portfolio" && (
        <>
          {/* ADD BAR */}
          <div className="add-bar">
            <span className="add-bar-label">Add Position</span>
            <input className="add-input" placeholder="TICKER" value={addF.ticker} onChange={e => setAddF(f => ({ ...f, ticker: e.target.value.toUpperCase() }))} style={{ width: 90 }} />
            <input className="add-input" placeholder="Name (opt)" value={addF.name} onChange={e => setAddF(f => ({ ...f, name: e.target.value }))} />
            <input className="add-input" placeholder="Shares" type="number" value={addF.shares} onChange={e => setAddF(f => ({ ...f, shares: e.target.value }))} style={{ width: 100 }} />
            <input className="add-input" placeholder="Cost/share" type="number" value={addF.cost} onChange={e => setAddF(f => ({ ...f, cost: e.target.value }))} style={{ width: 110 }} />
            <button className="btn-add" onClick={addPosition} disabled={loading}>+ Add</button>
            {addErr && <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--red)" }}>{addErr}</span>}
          </div>

          {/* REFRESH */}
          <div className="refresh-bar">
            <h3>Positions</h3>
            <div className="refresh-right">
              {lastUpdated && <span className="last-updated">last updated {lastUpdated}</span>}
              <button className="btn-refresh" onClick={() => refreshPrices()} disabled={loading || pos.length === 0}>
                {loading ? <><span className="spin">↻</span> Fetching…</> : "↻ Refresh Prices"}
              </button>
            </div>
          </div>

          {loading && (
            <div className="loading-status">
              <span className="spin">◐</span> Searching live prices via AI…
            </div>
          )}

          {/* TABLE */}
          <div className="table-wrap">
            {pos.length === 0 ? (
              <div className="empty-state">
                <div>◈</div>
                <div>No positions yet</div>
                <div style={{ marginTop: 8, fontSize: 10 }}>Add your first holding above</div>
              </div>
            ) : (
              <>
                <div className="table-header">
                  <div>Ticker</div>
                  <div>Name</div>
                  <div style={{ textAlign: "right" }}>Shares</div>
                  <div style={{ textAlign: "right" }}>Cur. Price</div>
                  <div style={{ textAlign: "right" }}>Value</div>
                  <div style={{ textAlign: "right" }}>P&amp;L</div>
                  <div></div>
                </div>
                {enriched.map(e => (
                  <div className="table-row" key={e.ticker}>
                    <div><span className="ticker-badge">{e.ticker}</span></div>
                    <div className="pos-name">{e.name}</div>
                    <div className="mono" style={{ textAlign: "right", color: "var(--sub)" }}>{f2(e.shares)}</div>
                    <div className="mono" style={{ textAlign: "right" }}>
                      {e.currentPrice != null ? `$${f2(e.currentPrice)}` : <span style={{ color: "var(--muted)" }}>—</span>}
                    </div>
                    <div className="mono" style={{ textAlign: "right" }}>
                      ${f2(e.value ?? e.costTotal)}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {e.pnl != null ? (
                        <span className="pnl-badge" style={{ background: bg_clr(e.pnl), color: clr(e.pnl) }}>
                          {e.pnl >= 0 ? "+" : ""}${f2(Math.abs(e.pnl))} ({e.pnlPct >= 0 ? "+" : ""}{f2(e.pnlPct)}%)
                        </span>
                      ) : <span style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 11 }}>—</span>}
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button className="btn-del" onClick={() => removePosition(e.ticker)} title="Remove">×</button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}

      {tab === "analytics" && (
        <div className="analytics-grid">

          {/* Portfolio value over time */}
          <div className="chart-card full">
            <div className="chart-title">// portfolio value — this week (estimated)</div>
            {historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={historyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ffaa" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00ffaa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fill: "#4a4a6a", fontFamily: "'Space Mono',monospace", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#4a4a6a", fontFamily: "'Space Mono',monospace", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" name="Value" stroke="#00ffaa" strokeWidth={2} fill="url(#valGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", textAlign: "center", padding: "60px 0" }}>
                Refresh prices to see chart data
              </div>
            )}
          </div>

          {/* Allocation Pie */}
          <div className="chart-card">
            <div className="chart-title">// allocation</div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend formatter={v => <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "#7c7c9e" }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", textAlign: "center", padding: "60px 0" }}>No positions</div>
            )}
          </div>

          {/* Per-position P&L */}
          <div className="chart-card">
            <div className="chart-title">// position p&amp;l breakdown</div>
            {enriched.filter(e => e.pnl != null).length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                {enriched.filter(e => e.pnl != null).sort((a, b) => (b.pnlPct ?? 0) - (a.pnlPct ?? 0)).map(e => (
                  <div key={e.ticker}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--blue)" }}>{e.ticker}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: clr(e.pnl) }}>
                        {e.pnlPct >= 0 ? "+" : ""}{f2(e.pnlPct)}%
                      </span>
                    </div>
                    <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 2,
                        width: `${Math.min(100, Math.abs(e.pnlPct ?? 0))}%`,
                        background: clr(e.pnl), opacity: 0.8,
                        transition: "width 0.6s ease"
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", textAlign: "center", padding: "60px 0" }}>
                Refresh prices to see P&amp;L
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  </div>
</>
```

);
}
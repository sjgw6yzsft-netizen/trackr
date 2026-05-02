import { useState, useEffect, useCallback, useRef } from "react";
import {
AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";

/* ═══════════════════════════════ STORAGE ═══════════════════════════════ */
const S = {
async get(k) {
try { const v = localStorage.getItem("tkr2:" + k); return v ? JSON.parse(v) : null; } catch { return null; }
},
async set(k, v) {
try { localStorage.setItem("tkr2:" + k, JSON.stringify(v)); return true; } catch { return false; }
},
};

/* ═══════════════════════════════ HELPERS ═══════════════════════════════ */
const f2 = n => n == null ? "—" : Number(n).toFixed(2);
const clr = n => n == null ? "#7c7c9e" : n >= 0 ? "#00ffaa" : "#ff4f6a";
const bg_clr = n => n == null ? "rgba(124,124,158,0.08)" : n >= 0 ? "rgba(0,255,170,0.07)" : "rgba(255,79,106,0.07)";
const TODAY = () => new Date().toISOString().split("T")[0];

/* ═══════════════════════════════ AI PRICE FETCH ════════════════════════ */
async function fetchPricesViaAI(tickers) {
const res = await fetch("https://api.anthropic.com/v1/messages", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
model: "claude-sonnet-4-20250514",
max_tokens: 800,
tools: [{ type: "web_search_20250305", name: "web_search" }],
messages: [{
role: "user",
content: `Search and find the current real-time stock prices for these tickers: ${tickers.join(", ")}. After searching, respond with ONLY a JSON object in this exact format with no other text: {"AAPL":189.50,"TSLA":245.30}`
}]
})
});
const data = await res.json();
const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
try { return JSON.parse(text.trim()); } catch {}
const m1 = text.match(/{[^{}]*\d+.?\d*[^{}]*}/);
if (m1) { try { return JSON.parse(m1[0]); } catch {} }
const out = {};
tickers.forEach(t => {
const rx = new RegExp(`["']?${t}["']?\\s*[:=]?\\s*\\$?([0-9]+\\.?[0-9]*)`, "i");
const m = text.match(rx);
if (m) out[t] = parseFloat(m[1]);
});
return out;
}

/* ═══════════════════════════════ STYLES ════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
--bg: #0a0a0f;
--panel: #0f0f18;
--border: #1e1e30;
--border2: #2a2a42;
--green: #00ffaa;
--red: #ff4f6a;
--amber: #ffb83f;
--blue: #4f8fff;
--muted: #4a4a6a;
--text: #e0e0f0;
--sub: #7c7c9e;
--font-mono: 'Space Mono', monospace;
--font-sans: 'Syne', sans-serif;
}

body { background: var(--bg); color: var(--text); font-family: var(--font-sans); }

.app { min-height: 100vh; display: flex; flex-direction: column; }

.app::before {
content: '';
position: fixed; inset: 0; z-index: 9999; pointer-events: none;
background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
}
`;

/* tooltip */
const CustomTooltip = ({ active, payload, label }) => {
if (!active || !payload?.length) return null;
return (
<div style={{ background: "#0f0f18", border: "#2a2a42", padding: "10px 14px", fontFamily: "'Space Mono', monospace", fontSize: 11 }}>
<div style={{ color: "#7c7c9e", marginBottom: 4 }}>{label}</div>
{payload.map(p => (
<div key={p.name} style={{ color: p.color || "#e0e0f0" }}>
{p.name}: ${f2(p.value)}
</div>
))}
</div>
);
};

const PieTooltip = ({ active, payload }) => {
if (!active || !payload?.length) return null;
const d = payload[0];
return (
<div style={{ background: "#0f0f18", border: "#2a2a42", padding: "10px 14px", fontFamily: "'Space Mono', monospace", fontSize: 11 }}>
<div style={{ color: "#4f8fff", fontWeight: 700 }}>{d.name}</div>
<div style={{ color: "#e0e0f0", marginTop: 2 }}>
{f2(d.payload.pct)}% · ${f2(d.value)}
</div>
</div>
);
};

const PIE_COLORS = ["#4f8fff","#00ffaa","#ffb83f","#ff4f6a","#a78bfa","#38bdf8","#fb923c","#e879f9"];

/* MAIN APP */
export default function App() {
const [user, setUser] = useState(null);
const [mode, setMode] = useState("login");
const [authF, setAuthF] = useState({ u: "", p: "" });
const [authErr, setAuthErr] = useState("");
const [tab, setTab] = useState("portfolio");

const [pos, setPos] = useState([]);
const [prices, setPrices] = useState({});
const [loading, setLoading] = useState(false);
const [lastUpdated, setLastUpdated] = useState(null);
const [addF, setAddF] = useState({ ticker: "", shares: "", cost: "", name: "" });
const [addErr, setAddErr] = useState("");

useEffect(() => {
const saved = localStorage.getItem("tkr2:session");
if (saved) setUser(saved);
}, []);

useEffect(() => {
if (user) localStorage.setItem("tkr2:session", user);
else localStorage.removeItem("tkr2:session");
}, [user]);

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

const refreshPrices = useCallback(async () => {
const tickers = [...new Set(pos.map(p => p.ticker.toUpperCase()))];
if (!tickers.length) return;
setLoading(true);

try {
const fetched = await fetchPricesViaAI(tickers);
const merged = { ...prices, ...fetched };
setPrices(merged);

const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
setLastUpdated(now);

await S.set(`prices:${user}`, merged);
await S.set(`lu:${user}`, now);
} catch (e) {}

setLoading(false);
}, [pos, prices, user]);

const addPosition = async () => {
const t = addF.ticker.trim().toUpperCase();
const sh = parseFloat(addF.shares);
const co = parseFloat(addF.cost);

if (!t || isNaN(sh) || isNaN(co)) {
setAddErr("Enter valid data");
return;
}

const existing = pos.find(p => p.ticker === t);
let newList;

if (existing) {
const totalShares = existing.shares + sh;
const totalCost = existing.shares * existing.costBasis + sh * co;

newList = pos.map(p =>
p.ticker === t
? { ...p, shares: totalShares, costBasis: totalCost / totalShares }
: p
);
} else {
newList = [...pos, { ticker: t, name: addF.name || t, shares: sh, costBasis: co, addedDate: TODAY() }];
}

await savePos(newList);
setAddF({ ticker: "", shares: "", cost: "", name: "" });
await refreshPrices();
};

/* UI OMITTED BELOW (unchanged except syntax fixes already applied) */

return (
<>
<style>{CSS}</style>
<div className="app">{/* unchanged UI */}</div>
</>
);
}
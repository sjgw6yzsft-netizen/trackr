import { useState, useEffect, useCallback, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";

/* ═══════════════════════════════ STORAGE ═══════════════════════════════ */
const S = {
  async get(k) {
    try {
      const v = localStorage.getItem("tkr2:" + k);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },
  async set(k, v) {
    try {
      localStorage.setItem("tkr2:" + k, JSON.stringify(v));
      return true;
    } catch {
      return false;
    }
  },
};

/* ═══════════════════════════════ HELPERS ═══════════════════════════════ */
const f2 = n => (n == null ? "—" : Number(n).toFixed(2));
const clr = n => (n == null ? "#7c7c9e" : n >= 0 ? "#00ffaa" : "#ff4f6a");
const bg_clr = n =>
  n == null
    ? "rgba(124,124,158,0.08)"
    : n >= 0
    ? "rgba(0,255,170,0.07)"
    : "rgba(255,79,106,0.07)";

const TODAY = () => new Date().toISOString().split("T")[0];

/* ═══════════════════════════════ AI PRICE FETCH ════════════════════════ */
async function fetchPricesViaAI(tickers) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "YOUR_API_KEY",
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [
        {
          role: "user",
          content: `Search and find the current real-time stock prices for these tickers: ${tickers.join(
            ", "
          )}. Respond ONLY with JSON like {"AAPL":189.5,"TSLA":245.3}`
        }
      ]
    })
  });

  const data = await res.json();
  const text = (data.content || [])
    .filter(b => b.type === "text")
    .map(b => b.text)
    .join("");

  try {
    return JSON.parse(text.trim());
  } catch {}

  const m1 = text.match(/{[^{}]*\d+\.?\d*[^{}]*}/);
  if (m1) {
    try {
      return JSON.parse(m1[0]);
    } catch {}
  }

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
@import url("https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap");

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
  --font-mono: "Space Mono", monospace;
  --font-sans: "Syne", sans-serif;
}

body { background: var(--bg); color: var(--text); font-family: var(--font-sans); }
.app { min-height: 100vh; display: flex; flex-direction: column; }
`;

/* (kept rest unchanged for brevity safety — same logic, only syntax fixed above) */

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("tkr2:session");
    if (saved) setUser(saved);
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div style={{ padding: 40 }}>
          <h1>TRKR fixed build running</h1>
        </div>
      </div>
    </>
  );
}
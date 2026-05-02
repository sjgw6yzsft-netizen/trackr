import { supabase } from "./supabase";
import { useState, useEffect, useCallback } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from "recharts";

/* ---------------- STYLE (UNCHANGED) ---------------- */
const S = `... KEEP YOUR ENTIRE EXISTING CSS HERE ...`;

/* ---------------- HELPERS ---------------- */
const BLANK = { ticker:"", buyPrice:"", date:"", shares:"1", stopLoss:"8" };
const fmt = (n,d=2)=> (n==null) ? "—" : Number(n).toFixed(d);
const fmtS = (n)=> n>=0 ? `+$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`;
const fmtP = (n)=> n>=0 ? `+${n.toFixed(2)}%` : `${n.toFixed(2)}%`;
const fmtD = (d)=> d ? new Date(d+"T12:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"2-digit"}) : "—";
const today = ()=> new Date().toISOString().split("T")[0];

export default function App() {

  /* ---------------- AUTH (SUPABASE) ---------------- */
  const [session, setSession] = useState(null);
  const [screen, setScreen] = useState("auth"); // login/register/dashboard
  const [authMode, setAuthMode] = useState("login");
  const [auth, setAuth] = useState({ email:"", password:"" });
  const [authErr, setAuthErr] = useState("");

  /* ---------------- APP STATE ---------------- */
  const [tab, setTab] = useState("portfolio");
  const [pos, setPos] = useState([]);
  const [snaps, setSnaps] = useState([]);
  const [cap, setCap] = useState("");

  const [edPrice, setEdPrice] = useState(null);
  const [pInputs, setPInputs] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [showSell, setShowSell] = useState(null);
  const [sellF, setSellF] = useState({ price:"", date:"" });
  const [showCap, setShowCap] = useState(false);
  const [capIn, setCapIn] = useState("");

  /* ---------------- SESSION CHECK ---------------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) setScreen("dashboard");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setScreen(session ? "dashboard" : "auth");
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  /* ---------------- AUTH ACTIONS ---------------- */
  const handleAuth = async () => {
    setAuthErr("");

    if (!auth.email || !auth.password) {
      setAuthErr("Fill all fields");
      return;
    }

    try {
      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: auth.email,
          password: auth.password
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: auth.email,
          password: auth.password
        });
        if (error) throw error;
      }
    } catch (err) {
      setAuthErr(err.message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setPos([]);
    setSnaps([]);
    setCap("");
  };

  /* ---------------- LOCAL STORAGE (UNCHANGED SAFE) ---------------- */
  const sg = async k => {
    try {
      const r = await window.storage.get(k);
      return r ? JSON.parse(r.value) : null;
    } catch { return null; }
  };

  const ss = async (k,v) => {
    try {
      await window.storage.set(k, JSON.stringify(v));
    } catch {}
  };

  const userKey = session?.user?.email;

  const load = useCallback(async () => {
    if (!userKey) return;
    const [p,s,c] = await Promise.all([
      sg(`pos_${userKey}`),
      sg(`snaps_${userKey}`),
      sg(`cap_${userKey}`)
    ]);
    setPos(p||[]);
    setSnaps(s||[]);
    setCap(c||"");
  }, [userKey]);

  useEffect(() => { load(); }, [load]);

  const savePos = async (l) => {
    setPos(l);
    await ss(`pos_${userKey}`, l);
  };

  const saveSn = async (l) => {
    setSnaps(l);
    await ss(`snaps_${userKey}`, l);
  };

  /* ---------------- SNAPSHOT ---------------- */
  const snap = async (list) => {
    const tv = list.filter(p=>!p.closed)
      .reduce((a,p)=>a+(p.currentPrice??p.buyPrice)*p.shares,0);

    const ti = list.filter(p=>!p.closed)
      .reduce((a,p)=>a+p.buyPrice*p.shares,0);

    const d = today();
    const ex = await sg(`snaps_${userKey}`)||[];

    const up = [
      ...ex.filter(s=>s.date!==d),
      { date:d, value:+tv.toFixed(2), invested:+ti.toFixed(2) }
    ].sort((a,b)=>a.date.localeCompare(b.date));

    await saveSn(up);
  };

  /* ---------------- POSITIONS ---------------- */
  const addPos = async () => {
    if (!form.ticker || !form.buyPrice) return;

    const p = {
      id: Date.now(),
      ticker: form.ticker.toUpperCase(),
      buyPrice: parseFloat(form.buyPrice),
      date: form.date,
      shares: Math.max(1, parseInt(form.shares)||1),
      stopLoss: parseFloat(form.stopLoss)||8,
      currentPrice: null,
      closed: false
    };

    const up = [...pos, p];
    await savePos(up);
    await snap(up);
    setForm(BLANK);
    setShowAdd(false);
  };

  /* ---------------- CALCS ---------------- */
  const plC = p => {
    const c = p.closed ? p.sellPrice : (p.currentPrice??null);
    if (c==null) return null;
    return {
      cur:c,
      dollar:(c-p.buyPrice)*p.shares,
      pct:((c-p.buyPrice)/p.buyPrice)*100
    };
  };

  const active = pos.filter(p=>!p.closed);
  const closed = pos.filter(p=>p.closed);

  const totInv = active.reduce((a,p)=>a+p.buyPrice*p.shares,0);
  const totMV = active.reduce((a,p)=>{
    const r=plC(p);
    return r ? a+r.cur*p.shares : a+p.buyPrice*p.shares;
  },0);

  const totUnr = active.reduce((a,p)=>{
    const r=plC(p);
    return r ? a+r.dollar : a;
  },0);

  /* ---------------- LOGIN SCREEN ---------------- */
  if (!session) {
    return (
      <>
        <style>{S}</style>
        <div className="auth-wrap">
          <div className="auth-card">
            <h2>{authMode === "login" ? "Login" : "Register"}</h2>

            {authErr && <div className="auth-err">{authErr}</div>}

            <input
              placeholder="email"
              value={auth.email}
              onChange={e=>setAuth({...auth,email:e.target.value})}
            />

            <input
              type="password"
              placeholder="password"
              value={auth.password}
              onChange={e=>setAuth({...auth,password:e.target.value})}
            />

            <button className="btn-p" onClick={handleAuth}>
              {authMode === "login" ? "Sign in" : "Sign up"}
            </button>

            <p onClick={()=>setAuthMode(authMode==="login"?"register":"login")}
               style={{cursor:"pointer",marginTop:10}}>
              Switch to {authMode==="login"?"register":"login"}
            </p>
          </div>
        </div>
      </>
    );
  }

  /* ---------------- MAIN APP ---------------- */
  return (
    <>
      <style>{S}</style>

      <div className="app">
        <div className="page">

          <div className="topbar">
            <div>Trackr</div>

            <div>
              {session.user.email}
              <button onClick={logout}>Logout</button>
            </div>
          </div>

          <button onClick={addPos}>Add Position</button>

          <div>
            Active: {active.length} | Invested: ${fmt(totInv)} | Value: ${fmt(totMV)}
          </div>

          {active.map(p => (
            <div key={p.id}>
              {p.ticker} - ${p.buyPrice}
            </div>
          ))}

        </div>
      </div>
    </>
  );
}
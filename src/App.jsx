import { useState, useEffect, useCallback } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:      #f5f4f0;
    --bg2:     #ffffff;
    --bg3:     #eeecea;
    --border:  rgba(0,0,0,0.07);
    --border2: rgba(0,0,0,0.13);
    --text:    #1a1a22;
    --muted:   #8a8a9a;
    --accent:  #2563eb;
    --acl:     #dbeafe;
    --green:   #16a34a;
    --greenl:  #dcfce7;
    --red:     #dc2626;
    --redl:    #fee2e2;
  }

  body { background: var(--bg); }
  .app { min-height:100vh; background:var(--bg); color:var(--text); font-family:'DM Sans',sans-serif; font-size:14px; line-height:1.5; }

  /* AUTH */
  .auth-wrap {
    min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px;
    background: radial-gradient(ellipse 70% 50% at 20% 10%, rgba(37,99,235,0.06) 0%, transparent 60%),
                radial-gradient(ellipse 60% 40% at 80% 90%, rgba(22,163,74,0.05) 0%, transparent 60%), var(--bg);
  }
  .auth-box { width:100%; max-width:380px; }
  .auth-mark { margin-bottom:36px; text-align:center; }
  .auth-name { font-family:'Instrument Serif',serif; font-size:44px; color:var(--text); letter-spacing:-1px; line-height:1; }
  .auth-name span { color:var(--accent); }
  .auth-sub { font-size:12px; color:var(--muted); margin-top:6px; }
  .auth-card { background:var(--bg2); border:1px solid var(--border2); border-radius:18px; padding:32px; box-shadow:0 4px 24px rgba(0,0,0,0.06); }
  .auth-err { font-size:12px; color:var(--red); background:var(--redl); border:1px solid rgba(220,38,38,0.2); border-radius:8px; padding:10px 14px; margin-bottom:20px; }
  .field { margin-bottom:16px; }
  .field label { display:block; font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:7px; font-weight:500; }
  .field input { width:100%; background:var(--bg); border:1px solid var(--border2); color:var(--text); padding:11px 14px; font-family:'DM Sans',sans-serif; font-size:14px; border-radius:10px; outline:none; transition:border-color 0.2s,box-shadow 0.2s; }
  .field input:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
  .field input::placeholder { color:#c0bfbb; }
  .row2 { display:flex; gap:12px; }
  .row2 .field { flex:1; }

  .btn-p { width:100%; background:var(--accent); color:#fff; border:none; padding:13px; font-family:'DM Sans',sans-serif; font-weight:600; font-size:14px; border-radius:10px; cursor:pointer; transition:all 0.2s; }
  .btn-p:hover { background:#1d4ed8; transform:translateY(-1px); box-shadow:0 6px 20px rgba(37,99,235,0.25); }
  .btn-p:active { transform:none; }
  .btn-p:disabled { opacity:0.4; cursor:not-allowed; transform:none; box-shadow:none; }

  .btn-g { background:transparent; border:1px solid var(--border2); color:var(--muted); padding:9px 16px; font-family:'DM Sans',sans-serif; font-size:13px; border-radius:8px; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
  .btn-g:hover { background:var(--bg3); color:var(--text); }
  .btn-g.gh:hover { border-color:var(--green); color:var(--green); background:var(--greenl); }
  .btn-g.rh:hover { border-color:var(--red); color:var(--red); background:var(--redl); }
  .btn-g.sm { padding:6px 12px; font-size:12px; border-radius:7px; }

  .ico { background:transparent; border:none; cursor:pointer; color:#c0bfbb; font-size:12px; padding:4px 7px; border-radius:6px; transition:color 0.15s,background 0.15s; }
  .ico:hover { color:var(--accent); background:var(--acl); }
  .ico.del:hover { color:var(--red); background:var(--redl); }

  .auth-sw { text-align:center; margin-top:20px; font-size:13px; color:var(--muted); }
  .auth-sw span { color:var(--accent); cursor:pointer; }

  /* PAGE */
  .page { max-width:1100px; margin:0 auto; padding:36px 24px 80px; }
  .topbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:36px; flex-wrap:wrap; gap:16px; }
  .wm { font-family:'Instrument Serif',serif; font-size:28px; color:var(--text); letter-spacing:-0.5px; display:flex; align-items:baseline; }
  .wm span { color:var(--accent); }
  .wm-sub { font-family:'DM Sans',sans-serif; font-size:11px; color:var(--muted); margin-left:10px; font-style:italic; }
  .tr { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .upill { font-size:12px; color:var(--muted); background:var(--bg3); padding:6px 13px; border:1px solid var(--border); border-radius:20px; }

  /* TABS */
  .tabs { display:flex; gap:2px; margin-bottom:32px; background:var(--bg3); border:1px solid var(--border); border-radius:12px; padding:4px; width:fit-content; }
  .tab { background:transparent; border:none; color:var(--muted); padding:8px 22px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; cursor:pointer; border-radius:9px; transition:all 0.18s; }
  .tab:hover { color:var(--text); }
  .tab.on { background:var(--bg2); color:var(--text); box-shadow:0 1px 4px rgba(0,0,0,0.1); }

  /* STATS */
  .sg { display:grid; grid-template-columns:repeat(auto-fill,minmax(155px,1fr)); gap:12px; margin-bottom:28px; }
  .sc { background:var(--bg2); border:1px solid var(--border); border-radius:14px; padding:20px; transition:box-shadow 0.2s; }
  .sc:hover { box-shadow:0 2px 12px rgba(0,0,0,0.07); }
  .sc.alrt { border-color:rgba(220,38,38,0.25); background:var(--redl); }
  .sl { font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; font-weight:500; margin-bottom:10px; }
  .sv { font-family:'Instrument Serif',serif; font-size:28px; line-height:1; color:var(--text); }
  .ss { font-size:11px; color:var(--muted); margin-top:6px; }

  .cg { color:var(--green) !important; }
  .cr { color:var(--red)   !important; }
  .cb { color:var(--accent)!important; }
  .cm { color:var(--muted) !important; }

  /* CAPITAL */
  .cap { background:var(--bg2); border:1px solid var(--border); border-radius:14px; padding:20px 24px; margin-bottom:28px; }
  .cap-hd { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px; }
  .cap-lbl { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; font-weight:500; }
  .cap-track { height:6px; background:var(--bg3); border-radius:999px; overflow:hidden; margin-bottom:12px; }
  .cap-fill { height:100%; border-radius:999px; background:var(--accent); transition:width 0.5s ease; }
  .cap-ns { display:flex; gap:20px; flex-wrap:wrap; font-size:12px; color:var(--muted); }
  .cap-ns b { color:var(--text); font-weight:600; }
  .gains-note { display:flex; align-items:flex-start; gap:8px; background:var(--greenl); border:1px solid rgba(22,163,74,0.2); border-radius:10px; padding:10px 14px; margin-top:12px; font-size:12px; color:var(--green); line-height:1.5; }

  /* SECTION */
  .sec-lbl { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:1.5px; font-weight:500; margin-bottom:14px; display:flex; align-items:center; gap:10px; }
  .sec-lbl::after { content:''; flex:1; height:1px; background:var(--border); }

  /* TABLE */
  .tw { background:var(--bg2); border:1px solid var(--border); border-radius:14px; overflow:hidden; margin-bottom:28px; overflow-x:auto; }
  table { width:100%; border-collapse:collapse; min-width:700px; }
  thead tr { border-bottom:1px solid var(--border); }
  th { text-align:left; padding:12px 16px; font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:1.5px; font-weight:500; background:var(--bg3); }
  td { padding:13px 16px; font-size:13px; border-bottom:1px solid var(--border); vertical-align:middle; }
  tr:last-child td { border-bottom:none; }
  tr:hover td { background:#fafaf8; }
  .cr-row td { opacity:0.5; }

  .tbadge { display:inline-flex; align-items:center; background:var(--acl); border:1px solid rgba(37,99,235,0.18); color:var(--accent); padding:4px 10px; font-size:12px; font-weight:600; font-family:'JetBrains Mono',monospace; letter-spacing:0.5px; border-radius:8px; }
  .cbadge { display:inline-block; font-size:9px; color:var(--muted); background:var(--bg3); padding:3px 7px; border-radius:6px; margin-left:8px; text-transform:uppercase; letter-spacing:1px; border:1px solid var(--border); }
  .sw { display:block; font-size:10px; color:var(--red); margin-top:4px; font-weight:600; }
  .st { font-size:11px; color:var(--muted); display:block; margin-top:2px; }

  /* inline price */
  .pc { display:flex; align-items:center; gap:6px; }
  .pd { font-family:'JetBrains Mono',monospace; font-size:13px; }
  .peb { background:transparent; border:none; cursor:pointer; color:#c0bfbb; font-size:11px; padding:3px 7px; border-radius:5px; transition:all 0.15s; line-height:1; font-family:'DM Sans',sans-serif; }
  .peb:hover { color:var(--accent); background:var(--acl); }
  .pir { display:flex; gap:5px; align-items:center; }
  .pin { background:var(--bg); border:1px solid var(--accent); color:var(--text); padding:6px 10px; font-family:'JetBrains Mono',monospace; font-size:12px; border-radius:8px; width:90px; outline:none; box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
  .pok { background:var(--greenl); border:1px solid rgba(22,163,74,0.3); color:var(--green); padding:6px 10px; font-size:11px; font-weight:600; cursor:pointer; border-radius:8px; transition:background 0.15s; }
  .pok:hover { background:#bbf7d0; }

  .empty { text-align:center; padding:56px 20px; color:var(--muted); font-size:13px; background:var(--bg2); border:1px solid var(--border); border-radius:14px; margin-bottom:28px; }
  .ecta { color:var(--accent); cursor:pointer; }

  /* MODAL */
  .ov { position:fixed; inset:0; background:rgba(0,0,0,0.28); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; z-index:200; padding:24px; }
  .mo { background:var(--bg2); border:1px solid var(--border2); width:100%; max-width:430px; padding:32px; border-radius:20px; max-height:90vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.14); }
  .mt { font-family:'Instrument Serif',serif; font-size:22px; margin-bottom:24px; color:var(--text); letter-spacing:-0.3px; }
  .mb { display:flex; gap:10px; margin-top:24px; }
  .ss2 { background:var(--bg3); border:1px solid var(--border); border-radius:10px; padding:14px; margin-bottom:18px; }
  .sr { display:flex; justify-content:space-between; font-size:12px; margin-bottom:7px; }
  .sr:last-child { margin-bottom:0; border-top:1px solid var(--border); padding-top:8px; margin-top:4px; font-size:13px; font-weight:600; }
  .sr .l { color:var(--muted); }
  .cap-note { margin-top:14px; padding:11px 14px; border-radius:10px; background:var(--acl); border:1px solid rgba(37,99,235,0.2); font-size:12px; color:var(--accent); line-height:1.5; }

  /* CHARTS */
  .cc { background:var(--bg2); border:1px solid var(--border); border-radius:14px; padding:24px; margin-bottom:20px; }
  .ct { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:1.5px; font-weight:500; margin-bottom:20px; }
  .ce { text-align:center; padding:52px 20px; color:var(--muted); font-size:12px; line-height:1.8; }
  .pg { display:grid; grid-template-columns:repeat(auto-fill,minmax(145px,1fr)); gap:10px; }
  .pi { background:var(--bg3); border:1px solid var(--border); border-radius:10px; padding:14px 16px; transition:box-shadow 0.2s; }
  .pi:hover { box-shadow:0 2px 8px rgba(0,0,0,0.06); }
  .pl { font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; font-weight:500; margin-bottom:8px; }
  .pv { font-family:'Instrument Serif',serif; font-size:20px; line-height:1; color:var(--text); }
  .sn { font-size:10px; color:#c0bfbb; margin-top:12px; text-align:center; }
  .cp { display:flex; flex-direction:column; gap:14px; }
  .cpr { display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px; }
  .cpb { height:4px; background:var(--bg3); border-radius:2px; overflow:hidden; }
  .cpf { height:100%; border-radius:2px; transition:width 0.5s ease; }
  .cps { font-size:10px; color:var(--muted); margin-top:5px; }

  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:var(--bg); }
  ::-webkit-scrollbar-thumb { background:var(--border2); border-radius:2px; }

  @media (max-width:600px) {
    .page { padding:20px 16px 60px; }
    .auth-card { padding:24px 20px; }
  }
`;

const BLANK = { ticker:"", buyPrice:"", date:"", shares:"1", stopLoss:"8" };
const fmt     = (n,d=2)=> (n==null) ? "—" : Number(n).toFixed(d);
const fmtS    = (n)=> n>=0 ? `+$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`;
const fmtP    = (n)=> n>=0 ? `+${n.toFixed(2)}%` : `${n.toFixed(2)}%`;
const fmtD    = (d)=> d ? new Date(d+"T12:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"2-digit"}) : "—";
const today   = ()=> new Date().toISOString().split("T")[0];

export default function App() {
  const [screen,  setScreen]  = useState("login");
  const [tab,     setTab]     = useState("portfolio");
  const [user,    setUser]    = useState(null);
  const [pos,     setPos]     = useState([]);
  const [snaps,   setSnaps]   = useState([]);
  const [cap,     setCap]     = useState("");
  const [edPrice, setEdPrice] = useState(null);
  const [pInputs, setPInputs] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [form,    setForm]    = useState(BLANK);
  const [showSell,setShowSell]= useState(null);
  const [sellF,   setSellF]   = useState({price:"",date:""});
  const [showCap, setShowCap] = useState(false);
  const [capIn,   setCapIn]   = useState("");
  const [auth,    setAuth]    = useState({username:"",password:""});
  const [authErr, setAuthErr] = useState("");
  const [user, setUser] = useState(null);

  // LOAD SESSION ON START
useEffect(() => {
  const init = async () => {
    try {
      const savedUser = await window.storage.get("session_user");
      if (savedUser?.value) {
        setUser(savedUser.value);
        setScreen("dashboard");
      }
    } catch (e) {
      console.log("No session");
    }
    setLoading(false);
  };

  init();
}, []);


  const sg = async (k) => {
  try {
    const r = localStorage.getItem(k);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
};

const ss = async (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

  const load = useCallback(async u => {
    const [p,s,c]=await Promise.all([sg(`pos_${u}`),sg(`snaps_${u}`),sg(`cap_${u}`)]);
    setPos(p||[]); setSnaps(s||[]); setCap(c||"");
  },[]);
  useEffect(()=>{ if(user) load(user); },[user,load]);

  const savePos  = async l => { setPos(l);   await ss(`pos_${user}`,l); };
  const saveSn   = async l => { setSnaps(l); await ss(`snaps_${user}`,l); };

  const snap = async list => {
    const tv=list.filter(p=>!p.closed).reduce((a,p)=>a+(p.currentPrice??p.buyPrice)*p.shares,0);
    const ti=list.filter(p=>!p.closed).reduce((a,p)=>a+p.buyPrice*p.shares,0);
    const d=today();
    const ex=await sg(`snaps_${user}`)||[];
    const up=[...ex.filter(s=>s.date!==d),{date:d,value:+tv.toFixed(2),invested:+ti.toFixed(2)}].sort((a,b)=>a.date.localeCompare(b.date));
    await saveSn(up);
  };

  /* AUTH */
  const doAuth = async (isLogin) => {
  setAuthErr("");
  await window.storage.set("session_user", auth.username);

  if (!auth.username || !auth.password) {
    setAuthErr("Please fill all fields.");
    return;
  }

  const email = auth.username;

  if (isLogin) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: auth.password,
    });

    if (error) {
      setAuthErr(error.message);
      return;
    }
  } else {
    const { error } = await supabase.auth.signUp({
      email,
      password: auth.password,
    });

    if (error) {
      setAuthErr(error.message);
      return;
    }

    setAuthErr("Check your email to confirm your account.");
    return;
  }

  const { data } = await supabase.auth.getUser();
  setUser(data.user.email);
  setScreen("dashboard");
};
  const logout = async () => {
  setUser(null);
  setPos([]);
  setSnaps([]);
  setCap("");
  setAuth({ username: "", password: "" });
  setScreen("login");
  setTab("portfolio");

  await window.storage.set("session_user", "");
};

  /* POSITIONS */
  const addPos = async ()=>{
    if(!form.ticker||!form.buyPrice) return;
    const p={id:Date.now(),ticker:form.ticker.toUpperCase(),buyPrice:parseFloat(form.buyPrice),date:form.date,shares:Math.max(1,parseInt(form.shares)||1),stopLoss:parseFloat(form.stopLoss)||8,currentPrice:null,closed:false,sellPrice:null,sellDate:null};
    const up=[...pos,p]; await savePos(up); await snap(up);
    setForm(BLANK); setShowAdd(false);
  };

  const updatePrice = async (id,val)=>{
    const v=parseFloat(val); if(isNaN(v)||v<=0) return;
    const up=pos.map(x=>x.id===id?{...x,currentPrice:v}:x);
    await savePos(up); await snap(up);
    setEdPrice(null); setPInputs(p=>{const n={...p};delete n[id];return n;});
  };

  const confirmSell = async ()=>{
    if(!sellF.price) return;
    const sp=parseFloat(sellF.price); if(isNaN(sp)||sp<=0) return;
    const p=showSell;
    const proceeds=sp*p.shares;
    const up=pos.map(x=>x.id===p.id?{...x,closed:true,sellPrice:sp,sellDate:sellF.date,currentPrice:sp}:x);
    const capN=parseFloat(cap)||0;
    if(capN>0){
      const nc=(capN+proceeds).toFixed(2);
      setCap(nc); await ss(`cap_${user}`,nc);
    }
    await savePos(up); await snap(up); setShowSell(null);
  };

  const delPos  = async id=>{ const u=pos.filter(p=>p.id!==id); await savePos(u); await snap(u); };
  const reopen  = async id=>{
    const p=pos.find(x=>x.id===id);
    if(p&&parseFloat(cap)>0){
      const nc=Math.max(0,parseFloat(cap)-p.sellPrice*p.shares).toFixed(2);
      setCap(nc); await ss(`cap_${user}`,nc);
    }
    const u=pos.map(x=>x.id===id?{...x,closed:false,sellPrice:null,sellDate:null}:x);
    await savePos(u); await snap(u);
  };

  /* CALCS */
  const plC  = p=>{ const c=p.closed?p.sellPrice:(p.currentPrice??null); if(c==null)return null; return {cur:c,dollar:(c-p.buyPrice)*p.shares,pct:((c-p.buyPrice)/p.buyPrice)*100}; };
  const slP  = p=>+(p.buyPrice*(1-p.stopLoss/100)).toFixed(2);

  const active   = pos.filter(p=>!p.closed);
  const closed   = pos.filter(p=>p.closed);
  const totInv   = active.reduce((a,p)=>a+p.buyPrice*p.shares,0);
  const totMV    = active.reduce((a,p)=>{ const r=plC(p); return r?a+r.cur*p.shares:a+p.buyPrice*p.shares; },0);
  const totUnr   = active.reduce((a,p)=>{ const r=plC(p); return r?a+r.dollar:a; },0);
  const totReal  = closed.reduce((a,p)=>{ const r=plC(p); return r?a+r.dollar:a; },0);
  const capN     = parseFloat(cap)||0;
  const avail    = capN>0 ? capN-totInv : null;
  const invPct   = capN>0 ? (totInv/capN)*100 : null;
  const alerts   = active.filter(p=>{ const r=plC(p); return r&&r.cur<=slP(p); }).length;

  const sellPrev = showSell&&sellF.price ? (()=>{
    const sp=parseFloat(sellF.price); if(isNaN(sp))return null;
    return {dollar:(sp-showSell.buyPrice)*showSell.shares,pct:((sp-showSell.buyPrice)/showSell.buyPrice)*100,proceeds:sp*showSell.shares};
  })() : null;

  const cd   = snaps.map(s=>({date:s.date,value:s.value,invested:s.invested,pnl:+(s.value-s.invested).toFixed(2)}));
  const fv   = cd[0]?.value;
  const lv   = cd[cd.length-1]?.value;
  const tEvo = fv&&lv ? lv-fv : null;
  const tEvoP= fv&&lv ? ((lv-fv)/fv)*100 : null;

  const TTip = ({active:a,payload,label})=>{
    if(!a||!payload?.length)return null;
    return <div style={{background:"#fff",border:"1px solid rgba(0,0,0,0.1)",padding:"10px 14px",borderRadius:10,fontSize:12,boxShadow:"0 4px 16px rgba(0,0,0,0.12)"}}>
      <div style={{color:"#8a8a9a",marginBottom:6,fontSize:11}}>{label}</div>
      {payload.map(p=><div key={p.dataKey} style={{color:p.dataKey==="value"?"#2563eb":p.dataKey==="pnl"?(p.value>=0?"#16a34a":"#dc2626"):"#c0bfbb",marginBottom:3}}>
        {p.dataKey==="value"?"Portfolio":p.dataKey==="pnl"?"P&L":"Invested"}: ${Number(p.value).toFixed(2)}
      </div>)}
    </div>;
  };

  /* AUTH SCREEN */
  if(screen==="login"||screen==="register"){
    const il=screen==="login";
    return <>
      <style>{S}</style>
      <div className="auth-wrap">
        <div className="auth-box">
          <div className="auth-mark">
            <div className="auth-name">Track<span>r</span></div>
            <div className="auth-sub">{il?"sign in to your portfolio":"create a free account"}</div>
          </div>
          <div className="auth-card">
            {authErr&&<div className="auth-err">⚠ {authErr}</div>}
            <div className="field"><label>Username</label><input value={auth.username} onChange={e=>setAuth(a=>({...a,username:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doAuth(il)} placeholder="your_username" autoFocus/></div>
            <div className="field"><label>Password</label><input type="password" value={auth.password} onChange={e=>setAuth(a=>({...a,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doAuth(il)} placeholder="••••••••"/></div>
            <button className="btn-p" onClick={()=>doAuth(il)}>{il?"Sign in →":"Create account →"}</button>
            <div className="auth-sw">{il?<>No account? <span onClick={()=>{setScreen("register");setAuthErr("");}}>Register here</span></>:<>Have an account? <span onClick={()=>{setScreen("login");setAuthErr("");}}>Sign in</span></>}</div>
          </div>
        </div>
      </div>
    </>;
  }

  /* ROW */
  const Row = ({p})=>{
    const pl=plC(p), sl=slP(p), stopHit=pl&&!p.closed&&pl.cur<=sl, isEd=edPrice===p.id;
    return <tr className={p.closed?"cr-row":""}>
      <td><span className="tbadge">{p.ticker}</span>{p.closed&&<span className="cbadge">closed</span>}</td>
      <td><span style={{fontFamily:"'JetBrains Mono',monospace"}}>${fmt(p.buyPrice)}</span><span className="st">{fmtD(p.date)}</span></td>
      <td>
        {p.closed
          ? <span style={{fontFamily:"'JetBrains Mono',monospace",color:"var(--accent)"}}>${fmt(p.sellPrice)}</span>
          : isEd
            ? <div className="pir">
                <input className="pin" type="number" step="0.01" autoFocus value={pInputs[p.id]||""}
                  onChange={e=>setPInputs(x=>({...x,[p.id]:e.target.value}))}
                  onKeyDown={e=>{if(e.key==="Enter")updatePrice(p.id,pInputs[p.id]);if(e.key==="Escape")setEdPrice(null);}}
                  placeholder="0.00"/>
                <button className="pok" onClick={()=>updatePrice(p.id,pInputs[p.id])}>✓</button>
                <button className="ico" onClick={()=>setEdPrice(null)}>✕</button>
              </div>
            : <div className="pc">
                <span className="pd" style={{color:p.currentPrice?"var(--text)":"var(--muted)"}}>{p.currentPrice?`$${fmt(p.currentPrice)}`:"—"}</span>
                <button className="peb" onClick={()=>{setEdPrice(p.id);setPInputs(x=>({...x,[p.id]:p.currentPrice?String(p.currentPrice):""}));}}>✎ edit</button>
              </div>}
        {stopHit&&<span className="sw">⚠ stop hit</span>}
      </td>
      <td><span style={{fontFamily:"'JetBrains Mono',monospace"}}>{p.shares}</span><span className="st">${fmt(p.buyPrice*p.shares,0)} cost</span></td>
      <td><span style={{fontFamily:"'JetBrains Mono',monospace"}}>${fmt(sl)}</span><span className="st">{p.stopLoss}% below</span></td>
      <td>
        {pl
          ? <><span className={pl.dollar>=0?"cg":"cr"} style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{fmtS(pl.dollar)}</span><span className={`st ${pl.pct>=0?"cg":"cr"}`}>{fmtP(pl.pct)}</span></>
          : <span className="cm" style={{fontSize:12}}>enter price ↑</span>}
      </td>
      <td>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          {!p.closed&&<button className="btn-g sm gh" onClick={()=>{setShowSell(p);setSellF({price:p.currentPrice?String(p.currentPrice):"",date:today()});}}>Close</button>}
          {p.closed&&<button className="btn-g sm" style={{fontSize:11}} onClick={()=>reopen(p.id)}>Reopen</button>}
          <button className="ico del" title="Delete" onClick={()=>delPos(p.id)}>✕</button>
        </div>
      </td>
    </tr>;
  };

  /* DASHBOARD */
  return <>
    <style>{S}</style>
    <div className="app">
      <div className="page">

        <div className="topbar">
          <div style={{display:"flex",alignItems:"baseline"}}>
            <div className="wm">Track<span>r</span></div>
            <span className="wm-sub">portfolio</span>
          </div>
          <div className="tr">
            <div className="upill">👤 {user}</div>
            <button className="btn-g sm" onClick={()=>{setCapIn(cap);setShowCap(true);}}>💰 Capital</button>
            <button className="btn-p" style={{width:"auto",padding:"10px 18px",fontSize:13}} onClick={()=>setShowAdd(true)}>+ Position</button>
            <button className="btn-g sm rh" onClick={logout}>Sign out</button>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab==="portfolio"?"on":""}`} onClick={()=>setTab("portfolio")}>Portfolio</button>
          <button className={`tab ${tab==="chart"?"on":""}`} onClick={()=>setTab("chart")}>Evolution</button>
        </div>

        {tab==="portfolio"&&<>
          <div className="sg">
            <div className="sc"><div className="sl">Active</div><div className="sv">{active.length}</div><div className="ss">{closed.length} closed</div></div>
            <div className="sc"><div className="sl">Invested</div><div className="sv">${fmt(totInv,0)}</div>{capN>0&&<div className="ss">{fmt(invPct,1)}% deployed</div>}</div>
            <div className="sc"><div className="sl">Market value</div><div className="sv">${fmt(totMV,0)}</div></div>
            <div className="sc">
              <div className="sl">Unrealized P&L</div>
              <div className={`sv ${totUnr===0?"cm":totUnr>0?"cg":"cr"}`}>{totUnr===0?"—":fmtS(totUnr)}</div>
              {totInv>0&&totUnr!==0&&<div className={`ss ${totUnr>0?"cg":"cr"}`}>{fmtP((totUnr/totInv)*100)}</div>}
            </div>
            <div className="sc">
              <div className="sl">Realized P&L</div>
              <div className={`sv ${totReal===0?"cm":totReal>0?"cg":"cr"}`}>{totReal===0?"—":fmtS(totReal)}</div>
            </div>
            {alerts>0&&<div className="sc alrt"><div className="sl" style={{color:"var(--red)"}}>⚠ Stop alerts</div><div className="sv cr">{alerts}</div></div>}
          </div>

          {capN>0&&<div className="cap">
            <div className="cap-hd">
              <span className="cap-lbl">Capital allocation</span>
              <span style={{fontSize:12,color:avail>=0?"var(--green)":"var(--red)",fontWeight:600}}>{avail>=0?`$${fmt(avail,0)} available`:`$${fmt(Math.abs(avail),0)} over budget`}</span>
            </div>
            <div className="cap-track"><div className="cap-fill" style={{width:`${Math.min(100,invPct||0)}%`}}/></div>
            <div className="cap-ns">
              <span>Total: <b>${fmt(capN,0)}</b></span>
              <span>Invested: <b className="cb">${fmt(totInv,0)} ({fmt(invPct||0,1)}%)</b></span>
              <span>Available: <b style={{color:avail>=0?"var(--green)":"var(--red)"}}>${fmt(Math.abs(avail||0),0)}</b></span>
            </div>
            {totReal!==0&&<div className="gains-note">
              <span>↩</span>
              <span>Realised gains of <strong>{fmtS(totReal)}</strong> have been returned to your capital pool as positions were closed — your available capital already reflects this.</span>
            </div>}
          </div>}

          <div className="sec-lbl">Active positions</div>
          {active.length===0
            ? <div className="empty">No active positions · <span className="ecta" onClick={()=>setShowAdd(true)}>add your first →</span></div>
            : <div className="tw"><table><thead><tr><th>Ticker</th><th>Buy price</th><th>Current price</th><th>Shares</th><th>Stop loss</th><th>P&L</th><th></th></tr></thead><tbody>{active.map(p=><Row key={p.id} p={p}/>)}</tbody></table></div>}

          {closed.length>0&&<>
            <div className="sec-lbl">Closed positions</div>
            <div className="tw"><table><thead><tr><th>Ticker</th><th>Buy price</th><th>Sell price</th><th>Shares</th><th>Stop loss</th><th>Realized P&L</th><th></th></tr></thead><tbody>{closed.map(p=><Row key={p.id} p={p}/>)}</tbody></table></div>
          </>}
        </>}

        {tab==="chart"&&<>
          <div className="cc">
            <div className="ct">Overall performance</div>
            <div className="pg">
              <div className="pi"><div className="pl">Snapshots</div><div className="pv">{snaps.length}</div></div>
              <div className="pi"><div className="pl">Start value</div><div className="pv">{fv?`$${fmt(fv,0)}`:"—"}</div></div>
              <div className="pi"><div className="pl">Current value</div><div className="pv">{lv?`$${fmt(lv,0)}`:"—"}</div></div>
              <div className="pi"><div className="pl">Total evolution</div><div className={`pv ${!tEvo?"cm":tEvo>0?"cg":"cr"}`}>{tEvo!=null?fmtS(tEvo):"—"}</div></div>
              <div className="pi"><div className="pl">Total return</div><div className={`pv ${!tEvoP?"cm":tEvoP>0?"cg":"cr"}`}>{tEvoP!=null?fmtP(tEvoP):"—"}</div></div>
              <div className="pi"><div className="pl">Realized P&L</div><div className={`pv ${totReal===0?"cm":totReal>0?"cg":"cr"}`}>{totReal!==0?fmtS(totReal):"—"}</div></div>
            </div>
          </div>

          <div className="cc">
            <div className="ct">Portfolio value over time</div>
            {cd.length<2
              ? <div className="ce">Add positions & update prices to build your chart.<br/>Snapshots save automatically on each price update.</div>
              : <><ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={cd} margin={{top:8,right:4,bottom:0,left:0}}>
                    <defs>
                      <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.12}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient>
                      <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8a8a9a" stopOpacity={0.1}/><stop offset="95%" stopColor="#8a8a9a" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(0,0,0,0.05)" strokeDasharray="3 3"/>
                    <XAxis dataKey="date" tick={{fill:"#c0bfbb",fontSize:10,fontFamily:"DM Sans"}} tickLine={false} axisLine={false}/>
                    <YAxis tick={{fill:"#c0bfbb",fontSize:10,fontFamily:"DM Sans"}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v}`} width={64}/>
                    <Tooltip content={<TTip/>}/>
                    <Area type="monotone" dataKey="invested" stroke="#e0dfdc" strokeWidth={1} fill="url(#ig)" dot={false}/>
                    <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} fill="url(#vg)" dot={{fill:"#2563eb",r:3,strokeWidth:0}} activeDot={{r:5,fill:"#2563eb"}}/>
                  </AreaChart>
                </ResponsiveContainer>
                <div className="sn">Blue = portfolio value · Grey = amount invested</div>
              </>}
          </div>

          <div className="cc">
            <div className="ct">Unrealized P&L over time</div>
            {cd.length<2 ? <div className="ce">No data yet.</div>
              : <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={cd} margin={{top:8,right:4,bottom:0,left:0}}>
                    <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={0.12}/><stop offset="95%" stopColor="#16a34a" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid stroke="rgba(0,0,0,0.05)" strokeDasharray="3 3"/>
                    <XAxis dataKey="date" tick={{fill:"#c0bfbb",fontSize:10}} tickLine={false} axisLine={false}/>
                    <YAxis tick={{fill:"#c0bfbb",fontSize:10}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v}`} width={64}/>
                    <ReferenceLine y={0} stroke="rgba(0,0,0,0.1)" strokeDasharray="4 2"/>
                    <Tooltip content={<TTip/>}/>
                    <Area type="monotone" dataKey="pnl" stroke="#16a34a" strokeWidth={2} fill="url(#pg)" dot={false} activeDot={{r:4,fill:"#16a34a"}}/>
                  </AreaChart>
                </ResponsiveContainer>}
          </div>

          {closed.length>0&&<div className="cc">
            <div className="ct">Closed position results</div>
            <div className="cp">
              {closed.map(p=>{
                const pl=plC(p); if(!pl)return null;
                return <div key={p.id}>
                  <div className="cpr">
                    <span style={{color:"var(--accent)",fontFamily:"'JetBrains Mono',monospace",fontWeight:600,fontSize:13}}>{p.ticker}</span>
                    <span className={pl.dollar>=0?"cg":"cr"} style={{fontWeight:600}}>{fmtS(pl.dollar)} ({fmtP(pl.pct)})</span>
                  </div>
                  <div className="cpb"><div className="cpf" style={{width:`${Math.min(100,Math.abs(pl.pct))}%`,background:pl.dollar>=0?"#16a34a":"#dc2626"}}/></div>
                  <div className="cps">${fmt(p.buyPrice)} → ${fmt(p.sellPrice)} · {p.shares} shares · {fmtD(p.date)} → {fmtD(p.sellDate)}</div>
                </div>;
              })}
            </div>
          </div>}
        </>}

      </div>
    </div>

    {/* ADD MODAL */}
    {showAdd&&<div className="ov" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
      <div className="mo">
        <div className="mt">Add position</div>
        <div className="field"><label>Ticker symbol</label><input value={form.ticker} onChange={e=>setForm(f=>({...f,ticker:e.target.value.toUpperCase()}))} placeholder="e.g. NLR, TAN, COPX" autoFocus/></div>
        <div className="row2">
          <div className="field"><label>Buy price ($)</label><input type="number" step="0.01" value={form.buyPrice} onChange={e=>setForm(f=>({...f,buyPrice:e.target.value}))} placeholder="144.71"/></div>
          <div className="field"><label>Shares</label><input type="number" min="1" value={form.shares} onChange={e=>setForm(f=>({...f,shares:e.target.value}))} placeholder="1"/></div>
        </div>
        <div className="row2">
          <div className="field"><label>Date bought</label><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
          <div className="field"><label>Stop loss (%)</label><input type="number" step="0.5" value={form.stopLoss} onChange={e=>setForm(f=>({...f,stopLoss:e.target.value}))} placeholder="8"/></div>
        </div>
        <div className="mb">
          <button className="btn-p" style={{flex:1}} onClick={addPos} disabled={!form.ticker||!form.buyPrice}>Add position</button>
          <button className="btn-g" onClick={()=>{setShowAdd(false);setForm(BLANK);}}>Cancel</button>
        </div>
      </div>
    </div>}

    {/* CLOSE MODAL */}
    {showSell&&<div className="ov" onClick={e=>e.target===e.currentTarget&&setShowSell(null)}>
      <div className="mo">
        <div className="mt">Close — {showSell.ticker}</div>
        <div className="ss2">
          <div className="sr"><span className="l">Bought at</span><span style={{fontFamily:"'JetBrains Mono',monospace"}}>${fmt(showSell.buyPrice)} × {showSell.shares} shares</span></div>
          <div className="sr"><span className="l">Cost basis</span><span style={{fontFamily:"'JetBrains Mono',monospace"}}>${fmt(showSell.buyPrice*showSell.shares)}</span></div>
          {sellPrev&&<>
            <div className="sr"><span className="l">Proceeds</span><span style={{fontFamily:"'JetBrains Mono',monospace"}}>${fmt(sellPrev.proceeds)}</span></div>
            <div className="sr"><span className="l">Realized P&L</span><span className={sellPrev.dollar>=0?"cg":"cr"} style={{fontFamily:"'JetBrains Mono',monospace"}}>{fmtS(sellPrev.dollar)} ({fmtP(sellPrev.pct)})</span></div>
          </>}
        </div>
        <div className="row2">
          <div className="field"><label>Sell price ($)</label><input type="number" step="0.01" value={sellF.price} onChange={e=>setSellF(f=>({...f,price:e.target.value}))} placeholder="155.00" autoFocus/></div>
          <div className="field"><label>Sell date</label><input type="date" value={sellF.date} onChange={e=>setSellF(f=>({...f,date:e.target.value}))}/></div>
        </div>
        {capN>0&&sellPrev&&<div className="cap-note">
          ↩ ${fmt(sellPrev.proceeds)} in proceeds returned to your capital pool.{" "}
          {sellPrev.dollar>=0
            ? `Including ${fmtS(sellPrev.dollar)} profit — new capital: $${fmt(capN+sellPrev.proceeds)}.`
            : `After ${fmtS(sellPrev.dollar)} loss — new capital: $${fmt(capN+sellPrev.proceeds)}.`}
        </div>}
        <div className="mb">
          <button className="btn-p" style={{flex:1}} onClick={confirmSell} disabled={!sellF.price}>Confirm close</button>
          <button className="btn-g" onClick={()=>setShowSell(null)}>Cancel</button>
        </div>
      </div>
    </div>}

    {/* CAPITAL MODAL */}
    {showCap&&<div className="ov" onClick={e=>e.target===e.currentTarget&&setShowCap(false)}>
      <div className="mo">
        <div className="mt">Set capital</div>
        <div className="field">
          <label>Total investment budget ($)</label>
          <input type="number" step="100" value={capIn} onChange={e=>setCapIn(e.target.value)} placeholder="10000" autoFocus/>
        </div>
        <div style={{fontSize:12,color:"var(--muted)",marginBottom:16,lineHeight:1.6}}>
          This is your starting pool. When you close positions, proceeds (including gains or losses) are automatically returned here so available capital stays accurate.
        </div>
        <div className="mb">
          <button className="btn-p" style={{flex:1}} onClick={async()=>{setCap(capIn);await ss(`cap_${user}`,capIn);setShowCap(false);}}>Save</button>
          <button className="btn-g" onClick={()=>setShowCap(false)}>Cancel</button>
        </div>
      </div>
    </div>}
  </>;
}
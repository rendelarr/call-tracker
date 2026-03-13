import { useState, useEffect, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY    = "call_tracker_data";
const STORAGE_CONFIG = "call_tracker_config";
const STORAGE_CYCLES = "mochi_cycles";
const defaultConfig  = { dailyMoneyGoal: 30, theme: "light", baseRate: 0.12 };

function getRates(base = 0.12) {
  const r = v => Math.round(v * 100) / 100;
  return [
    { value: r(base),       label: "Normal", color: "#7a8a9a", icon: "⚪" },
    { value: r(base+0.01),  label: "Bronce", color: "#c47d3a", icon: "🥉" },
    { value: r(base+0.02),  label: "Silver",  color: "#8fa8c2", icon: "🥈" },
    { value: r(base+0.03),  label: "Gold",   color: "#ffb800", icon: "🥇" },
  ];
}

const THEMES = {
  light: {
    name: "Light", icon: "☀️",
    "--bg":"#eef0f3","--bg2":"#f8f9fb","--bg3":"#e4e7ec",
    "--border":"#d0d5de","--border2":"#b8bfcc",
    "--cyan":"#0099aa","--cyan2":"#007a8a",
    "--green":"#16a34a","--green2":"#15803d",
    "--amber":"#b45309","--red":"#dc2626",
    "--text":"#1a2030","--text2":"#4a5568","--text3":"#8a95a8",
  },
  eva: {
    name: "Eva", icon: "✦",
    "--bg":"#1e1330","--bg2":"#2e1f4a","--bg3":"#160d24",
    "--border":"#3a2660","--border2":"#4a3370",
    "--cyan":"#9b72cf","--cyan2":"#7a50aa",
    "--green":"#6b8c42","--green2":"#527032",
    "--amber":"#b8834a","--red":"#c0504a",
    "--blue":"#818cf8","--purple":"#c084fc",
    "--text":"#e8d5ff","--text2":"#c4a882","--text3":"#7a6690",
  },
  dark: {
    name: "Dark", icon: "◈",
    "--bg":"#0f1117","--bg2":"#161b27","--bg3":"#0a0d13",
    "--border":"#1c2030","--border2":"#252d40",
    "--cyan":"#22d3ee","--cyan2":"#0ea5c9",
    "--green":"#4ade80","--green2":"#22c55e",
    "--amber":"#f59e0b","--red":"#f87171",
    "--text":"#e2e8f4","--text2":"#8892aa","--text3":"#3a4260",
  },
  sakura: {
    name: "Sakura", icon: "🌸",
    "--bg":"#fdf0f2","--bg2":"#fce4e9","--bg3":"#f7d0d8",
    "--border":"#e8b4be","--border2":"#d4899a",
    "--cyan":"#c96b80","--cyan2":"#a84d62",
    "--green":"#6a9e7f","--green2":"#4d7a5e",
    "--amber":"#e8967a","--red":"#c0556a",
    "--text":"#2d1c22","--text2":"#5c3a45","--text3":"#9e6e7a",
  },
  sapphire: {
    name: "Sapphire", icon: "💎",
    "--bg":"#08121f","--bg2":"#0e1e30","--bg3":"#060e1a",
    "--border":"#163050","--border2":"#204870",
    "--cyan":"#1a8fd1","--cyan2":"#0f6fa8",
    "--green":"#22c47a","--green2":"#189a5c",
    "--amber":"#f0a030","--red":"#e03c3c",
    "--text":"#d0e8f8","--text2":"#6aadd4","--text3":"#264a68",
  },
  ruby: {
    name: "Ruby", icon: "♦",
    "--bg":"#130808","--bg2":"#1e0d0d","--bg3":"#0d0505",
    "--border":"#3a1010","--border2":"#5a1c1c",
    "--cyan":"#d63a20","--cyan2":"#aa2a14",
    "--green":"#58b870","--green2":"#3e9050",
    "--amber":"#f07820","--red":"#ff4444",
    "--text":"#f5d8d0","--text2":"#c08878","--text3":"#5a2a20",
  },
  emerald: {
    name: "Emerald", icon: "◆",
    "--bg":"#081410","--bg2":"#0e1e18","--bg3":"#050e0a",
    "--border":"#123020","--border2":"#1a4a30",
    "--cyan":"#28b060","--cyan2":"#1a8848",
    "--green":"#50d880","--green2":"#28a858",
    "--amber":"#d4a020","--red":"#e04848",
    "--text":"#c8f0dc","--text2":"#6ab880","--text3":"#1e4830",
  },
};

const PAY_CYCLES = [
  { start:"12/13/2025", end:"12/26/2025", payDate:"12/31/2025" },
  { start:"12/27/2025", end:"01/09/2026", payDate:"01/14/2026" },
  { start:"01/10/2026", end:"01/23/2026", payDate:"01/28/2026" },
  { start:"01/24/2026", end:"02/06/2026", payDate:"02/11/2026" },
  { start:"02/07/2026", end:"02/20/2026", payDate:"02/25/2026" },
  { start:"02/21/2026", end:"03/06/2026", payDate:"03/11/2026" },
  { start:"03/07/2026", end:"03/20/2026", payDate:"03/25/2026" },
  { start:"03/21/2026", end:"04/03/2026", payDate:"04/08/2026" },
  { start:"04/04/2026", end:"04/17/2026", payDate:"04/22/2026" },
  { start:"04/18/2026", end:"05/01/2026", payDate:"05/06/2026" },
  { start:"05/02/2026", end:"05/15/2026", payDate:"05/20/2026" },
  { start:"05/16/2026", end:"05/29/2026", payDate:"06/03/2026" },
  { start:"05/30/2026", end:"06/12/2026", payDate:"06/17/2026" },
  { start:"06/13/2026", end:"06/26/2026", payDate:"07/01/2026" },
  { start:"06/27/2026", end:"07/10/2026", payDate:"07/15/2026" },
  { start:"07/11/2026", end:"07/24/2026", payDate:"07/29/2026" },
  { start:"07/25/2026", end:"08/07/2026", payDate:"08/12/2026" },
  { start:"08/08/2026", end:"08/21/2026", payDate:"08/26/2026" },
  { start:"08/22/2026", end:"09/04/2026", payDate:"09/09/2026" },
  { start:"09/05/2026", end:"09/18/2026", payDate:"09/23/2026" },
  { start:"09/19/2026", end:"10/02/2026", payDate:"10/07/2026" },
  { start:"10/03/2026", end:"10/16/2026", payDate:"10/21/2026" },
  { start:"10/17/2026", end:"10/30/2026", payDate:"11/04/2026" },
  { start:"10/31/2026", end:"11/13/2026", payDate:"11/18/2026" },
  { start:"11/14/2026", end:"11/27/2026", payDate:"12/02/2026" },
  { start:"11/28/2026", end:"12/11/2026", payDate:"12/16/2026" },
  { start:"12/12/2026", end:"12/25/2026", payDate:"12/30/2026" },
];

const TABS = [
  { id:"home",    icon:"☀️", label:"Today"      },
  { id:"perf",    icon:"⚡", label:"Stats"    },
  { id:"week",    icon:"🗓️", label:"Week"   },
  { id:"cycle",   icon:"🔄", label:"Cycle"    },
  { id:"history", icon:"📜", label:"History"},
];

// ─── Sound system ─────────────────────────────────────────────────────────────

const sfx = (() => {
  let ctx = null;
  let muted = false;
  const getCtx = () => { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); return ctx; };

  function play(notes, type = "sine", vol = 0.18) {
    if (muted) return;
    try {
      const c = getCtx();
      notes.forEach(([freq, start, dur, endFreq]) => {
        const osc  = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain); gain.connect(c.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, c.currentTime + start);
        if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, c.currentTime + start + dur);
        gain.gain.setValueAtTime(vol, c.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
        osc.start(c.currentTime + start);
        osc.stop(c.currentTime + start + dur + 0.01);
      });
    } catch {}
  }

  return {
    // ✅ Llamada agregada — chime ascendente alegre (C5 E5 G5)
    callAdded: () => play([[523,0,.12],[659,.1,.12],[784,.2,.2]], "sine", 0.16),

    // ✅ Importar llamadas — confirmación suave
    imported: () => play([[523,0,.1],[659,.12,.1],[784,.24,.25]], "triangle", 0.13),

    // 🎉 Meta del día alcanzada — level up armonioso
    goalReached: () => play([[392,0,.07],[494,.08,.07],[587,.16,.07],[740,.24,.07],[988,.32,.07],[740,.40,.05],[988,.46,.04],[1175,.51,.35]], "sine", 0.14),

    // ✏️ Guardar edición — dos notas suaves de confirmación
    saved: () => play([[523,0,.08],[659,.1,.15]], "triangle", 0.12),

    // 🗑 Eliminar — nota descendente corta
    deleted: () => play([[330,0,.18,220]], "sine", 0.12),

    // ⚠️ Error — dos notas disonantes breves
    error: () => play([[311,0,.1],[277,.08,.15]], "sawtooth", 0.10),

    // 🗓 Navegación entre tabs — pop suave
    tabSwitch: () => play([[440,0,.07,520]], "triangle", 0.06),

    // 🔇 Mute toggle
    toggle: () => { muted = !muted; return muted; },
    isMuted: () => muted,
  };
})();

// ─── Global styles ────────────────────────────────────────────────────────────

const fontLink = document.createElement("link");
fontLink.rel   = "stylesheet";
fontLink.href  = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap";
document.head.appendChild(fontLink);

const globalStyle = document.createElement("style");
globalStyle.textContent = `
  :root {
    --bg:#eef0f3; --bg2:#f8f9fb; --bg3:#e4e7ec;
    --border:#d0d5de; --border2:#b8bfcc;
    --cyan:#0099aa; --cyan2:#007a8a;
    --green:#16a34a; --green2:#15803d;
    --amber:#b45309; --red:#dc2626;
    --blue:#2563eb; --purple:#7c3aed;
    --text:#1a2030; --text2:#4a5568; --text3:#8a95a8;
    --mono:'JetBrains Mono',monospace;
    --sans:'DM Sans',sans-serif;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--bg);}
  input,textarea,button{font-family:var(--sans);}
  input[type=range]{accent-color:var(--cyan);}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes slideUp{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}
  @keyframes toastIn{from{transform:translateX(-50%) translateY(-12px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
  .card{animation:slideUp .2s ease;}
  .btn-primary:hover{filter:brightness(1.1);transform:translateY(-1px);}
  .btn-primary{transition:all .15s ease;}
  .call-row:hover{background:var(--bg3)!important;}
  .rate-btn:hover{transform:translateY(-1px);}
  .rate-btn{transition:all .15s ease;}
  .heat-cell:hover{transform:scale(1.08);z-index:2;}
  .heat-cell{transition:all .15s ease;}
  .nav-item{transition:color .15s ease;}
  .action-btn:active{transform:scale(.97);}
  .action-btn{transition:all .15s ease;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:var(--bg2);}
  ::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px;}
`;
document.head.appendChild(globalStyle);

function applyTheme(themeKey) {
  const t = THEMES[themeKey] || THEMES.light;
  const root = document.documentElement;
  Object.entries(t).forEach(([k, v]) => { if (k.startsWith("--")) root.style.setProperty(k, v); });
  document.body.style.background = t["--bg"];
}

// ─── Style shortcuts ──────────────────────────────────────────────────────────

const CC = {
  card:     { background:"var(--bg2)", borderRadius:16, border:"1px solid var(--border)" },
  cardGlow: (c) => ({ background:"var(--bg2)", borderRadius:16, border:`1px solid ${c}33`, boxShadow:`0 0 24px ${c}0d` }),
  input:    { width:"100%", background:"var(--bg)", border:"1px solid var(--border2)", borderRadius:10, color:"var(--text)", padding:"10px 14px", fontSize:17, outline:"none" },
  label:    { fontSize:14, color:"var(--text3)", fontWeight:700, letterSpacing:.8, textTransform:"uppercase", marginBottom:6, display:"block" },
};

// ─── Date / time utilities ────────────────────────────────────────────────────

function today() {
  const d = new Date();
  return `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}/${d.getFullYear()}`;
}

function toDate(ds) {
  const [m, d, y] = ds.split("/").map(Number);
  return new Date(y, m-1, d);
}

function daysUntil(ds) {
  const t = toDate(ds); t.setHours(0,0,0,0);
  const n = new Date(); n.setHours(0,0,0,0);
  return Math.ceil((t - n) / 86400000);
}

function getNowTimeStr() {
  const d = new Date();
  let h = d.getHours(), mi = d.getMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${String(mi).padStart(2,"0")} ${ap}`;
}

function fmtTime(s) {
  const m = Math.floor(s / 60), sc = s % 60;
  return `${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`;
}

function last7Dates() {
  return Array.from({length:7}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i);
    return `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}/${d.getFullYear()}`;
  });
}

function last30Dates() {
  return Array.from({length:30}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    return `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}/${d.getFullYear()}`;
  }).reverse();
}

// ─── Time string helpers ──────────────────────────────────────────────────────

function timeToMins(t) {
  if (!t) return null;
  const m = t.match(/(\d{1,2}):(\d{2})\s?([AP]M)/i);
  if (!m) return null;
  let h = parseInt(m[1]);
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h  = 0;
  return h * 60 + parseInt(m[2]);
}

function minsToTime(mins) {
  const h24 = Math.floor(mins / 60) % 24, mm = mins % 60;
  const ap = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12; if (h12 === 0) h12 = 12;
  return `${h12}:${String(mm).padStart(2,"0")} ${ap}`;
}

function parseHour(t) {
  if (!t || t === "N/A") return null;
  const m = t.match(/(\d{1,2}):\d{2}\s?(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1]);
  const ap = m[2].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h  = 0;
  return h;
}

function parseTimeStr(str) {
  if (!str) return { h:"8", m:"00", ap:"AM" };
  const match = str.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
  if (!match) return { h:"8", m:"00", ap:"AM" };
  return { h: String(parseInt(match[1])), m: match[2], ap: match[3].toUpperCase() };
}

function buildTimeStr({ h, m, ap }) {
  return `${h}:${m} ${ap}`;
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function groupByDate(calls) {
  return calls.reduce((acc, c) => {
    if (!acc[c.date]) acc[c.date] = [];
    acc[c.date].push(c);
    return acc;
  }, {});
}

function getStreak(activeDates) {
  let s = 0;
  const t = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(t); d.setDate(d.getDate() - i);
    const ds = `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}/${d.getFullYear()}`;
    if (activeDates.has(ds)) s++;
    else if (i > 0) break;
  }
  return s;
}

function getCurrentCycle(cycles) {
  const now = new Date(); now.setHours(0,0,0,0);
  return cycles.find(c => {
    const s = toDate(c.start), e = toDate(c.end);
    return now >= s && now <= e;
  }) || null;
}

// ─── Import helpers ───────────────────────────────────────────────────────────

function parseCallText(raw) {
  try {
    const t     = raw.replace(/\s+/g, " ").trim();
    const idM   = t.match(/^(\d{4,6})/);
    const dateM = t.match(/(\d{2}\/\d{2}\/\d{4})/);
    const timeM = t.match(/(\d{1,2}:\d{2}\s?[AP]M)/i);
    const durM  = t.match(/\b(\d{1,3})\b(?=\s*(Yes|No))/i);
    const billM = t.match(/(Yes|No)/i);
    const payM  = t.match(/\$?([\d.]+)\s*$/);
    if (!dateM || !durM || !billM) return null;
    return {
      customerId: idM ? idM[1] : "N/A",
      date:       dateM[1],
      callStart:  timeM ? timeM[1].toUpperCase() : "N/A",
      duration:   parseInt(durM[1]),
      billable:   billM[1],
      dropped:    "No",
      pay:        payM ? parseFloat(payM[1]) : parseFloat((parseInt(durM[1]) * 0.12).toFixed(2)),
      surge:      false,
      id:         Date.now() + Math.random(),
    };
  } catch { return null; }
}

function parseCSVText(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return { headers: [], rows: [] };
  const parse = line => {
    const r = []; let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === "," && !inQ) { r.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    r.push(cur.trim());
    return r;
  };
  return { headers: parse(lines[0]), rows: lines.slice(1).map(parse) };
}

function rowsToCallsSmart(rows, headers) {
  const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
  const detectField = n => {
    if (n === "paymentstatus" || n === "paymentstat") return null;
    if (n.includes("customer") || n.includes("client") || n.includes("agent") || n === "id") return "customerId";
    if (n.includes("date"))    return "date";
    if (n.includes("start") || n.includes("begin") || n.includes("time")) return "callStart";
    if (n.includes("dur") || n.includes("min") || n.includes("length") || n.includes("qty") || n.includes("quantity")) return "duration";
    if (n.includes("bill"))    return "billable";
    if (n.includes("drop"))    return "dropped";
    if (n.includes("pay") || n.includes("earn") || n.includes("amount") || n.includes("price") || n.includes("total")) return "earnings";
    if (n.includes("surge"))   return "surge";
    return null;
  };
  const fieldMap = {};
  headers.forEach((h, i) => { const f = detectField(norm(h)); if (f) fieldMap[f] = i; });
  const get = (row, field) => { const i = fieldMap[field]; return i !== undefined ? String(row[i] || "").trim() : ""; };
  return rows
    .filter(r => r.some(c => c.trim()))
    .map(r => {
      const dur = Math.round(parseFloat(get(r, "duration").replace(/[$,]/g, ""))) || 0;
      const pay = parseFloat(get(r, "earnings").replace(/[$,]/g, "")) || parseFloat((dur * 0.12).toFixed(2));
      return {
        customerId: get(r, "customerId") || "N/A",
        date:       get(r, "date"),
        callStart:  get(r, "callStart") || "N/A",
        duration:   dur,
        billable:   get(r, "billable") || "Yes",
        dropped:    get(r, "dropped")  || "No",
        pay,
        surge:      get(r, "surge").toLowerCase() === "yes" || get(r, "surge") === "true",
        id:         Date.now() + Math.random(),
      };
    })
    .filter(c => c.date && c.duration > 0);
}

// ─── TimePicker component ─────────────────────────────────────────────────────

function TimePicker({ value, onChange, label }) {
  const { h, m, ap } = parseTimeStr(value);
  const sel = {
    background:"var(--bg)", border:"1px solid var(--border2)", borderRadius:8,
    color:"var(--text)", fontFamily:"var(--mono)", fontWeight:700, fontSize:18,
    padding:"10px 4px", cursor:"pointer", appearance:"none", WebkitAppearance:"none",
    textAlign:"center", width:"100%", outline:"none",
  };
  const hours = Array.from({length:12}, (_, i) => String(i + 1));
  const mins  = Array.from({length:60}, (_, i) => String(i).padStart(2, "0"));
  const update = (nH, nM, nAp) => onChange(buildTimeStr({ h: nH, m: nM, ap: nAp }));
  return (
    <div>
      {label && <label style={{fontSize:14,color:"var(--text3)",fontWeight:700,letterSpacing:1,display:"block",marginBottom:6}}>{label}</label>}
      <div style={{display:"grid",gridTemplateColumns:"2fr 2fr 1.4fr",gap:5}}>
        <select value={h} onChange={e => update(e.target.value, m, ap)} style={sel}>
          {hours.map(hh => <option key={hh} value={hh}>{hh}</option>)}
        </select>
        <select value={m} onChange={e => update(h, e.target.value, ap)} style={sel}>
          {mins.map(mm => <option key={mm} value={mm}>{mm}</option>)}
        </select>
        <button onClick={() => update(h, m, ap === "AM" ? "PM" : "AM")} style={{
          background: ap === "AM" ? "var(--cyan)22" : "var(--amber)22",
          border: `1px solid ${ap === "AM" ? "var(--cyan)" : "var(--amber)"}`,
          borderRadius:8, color: ap === "AM" ? "var(--cyan)" : "var(--amber)",
          fontWeight:800, fontSize:16, fontFamily:"var(--mono)",
          padding:"10px 2px", cursor:"pointer", width:"100%",
        }}>{ap}</button>
      </div>
    </div>
  );
}

// ─── Shared UI components ─────────────────────────────────────────────────────

function Modal({ onClose, children }) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(100,110,130,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e => e.stopPropagation()} style={{...CC.card,padding:24,width:"100%",maxWidth:360,animation:"slideUp .2s ease"}}>
        {children}
      </div>
    </div>
  );
}

const Pill = ({ active, onClick, children, color = "var(--cyan)" }) => (
  <button onClick={onClick} style={{padding:"6px 14px",borderRadius:99,border:"none",cursor:"pointer",fontWeight:600,fontSize:16,background:active?`${color}22`:"transparent",color:active?color:"var(--text2)",outline:active?`1px solid ${color}55`:"1px solid var(--border)",transition:"all .15s"}}>{children}</button>
);

const StatBox = ({ label, value, color = "var(--cyan)", sub }) => (
  <div style={{...CC.card,padding:"14px 16px"}}>
    <div style={{fontSize:14,color:"var(--text3)",fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:6}}>{label}</div>
    <div style={{fontSize:22,fontWeight:800,color,fontFamily:"var(--mono)",lineHeight:1}}>{value}</div>
    {sub && <div style={{fontSize:15,color:"var(--text2)",marginTop:4}}>{sub}</div>}
  </div>
);

function HeatmapCard({ heatmap, maxHeat, scope, setScope, cycles }) {
  const [hoveredH, setHoveredH] = useState(null);
  const nowH      = new Date().getHours();
  const HOURS     = Array.from({length:24}, (_, i) => i);
  const totalMins = HOURS.reduce((s, h) => s + heatmap[h], 0);

  // Top 3 peak hours (only hours with activity, sorted descending)
  const top3 = HOURS
    .filter(h => heatmap[h] > 0)
    .sort((a, b) => heatmap[b] - heatmap[a])
    .slice(0, 3);

  // Single intensity color: cyan scale, light→dark as activity increases
  // Empty cells are clearly distinct (solid gray bg)
  const PEAK_COLOR = "var(--cyan)";
  const intensityBg = (intensity) => {
    if (intensity === 0) return "var(--bg3)";
    const alpha = 0.12 + intensity * 0.88;
    return `color-mix(in srgb, var(--cyan) ${Math.round(alpha * 100)}%, transparent)`;
  };
  const intensityText = (intensity) => intensity > 0.55 ? "#fff" : "var(--text2)";

  const hourLabel = h => {
    if (h % 3 !== 0) return "";
    if (h === 0)  return "12a";
    if (h === 12) return "12p";
    return h < 12 ? `${h}a` : `${h-12}p`;
  };

  const fmtH = h => `${h%12||12}${h<12?"am":"pm"}`;
  const medals = ["🥇","🥈","🥉"];

  // Build dropdown options: all cycles + "Todos"
  const cycleOptions = cycles.map((c, i) => ({ value: i, label: `${c.start} → ${c.end}` }));

  return (
    <div style={{...CC.card,padding:20,marginBottom:12}} className="card">

      {/* Header */}
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:17,fontWeight:700,color:"var(--text)"}}>Hourly activity</div>
          <div style={{fontSize:15,color:"var(--text2)",fontFamily:"var(--mono)"}}>{totalMins > 0 ? `${totalMins}m` : ""}</div>
        </div>

        {/* Top 3 peaks */}
        {top3.length > 0 && (
          <div style={{display:"flex",gap:8,marginTop:10}}>
            {top3.map((h, i) => (
              <div key={h} style={{
                background: i===0 ? "color-mix(in srgb, var(--cyan) 12%, transparent)" : "var(--bg)",
                border: i===0 ? "1px solid color-mix(in srgb, var(--cyan) 40%, transparent)" : "1px solid var(--border)",
                borderRadius:8, padding:"6px 10px", display:"flex", alignItems:"center", gap:6,
              }}>
                <span style={{fontSize:17,lineHeight:1}}>{medals[i]}</span>
                <div>
                  <div style={{fontSize:17,fontWeight:800,fontFamily:"var(--mono)",color:i===0?PEAK_COLOR:"var(--text)",lineHeight:1}}>{fmtH(h)}</div>
                  <div style={{fontSize:14,color:"var(--text3)",marginTop:1}}>{heatmap[h]}m</div>
                </div>
              </div>
            ))}
            {top3.length < 2 && (
              <div style={{alignSelf:"center",fontSize:15,color:"var(--text3)"}}>Accumulate more calls to see the full ranking</div>
            )}
          </div>
        )}
      </div>

      {/* Cycle selector dropdown */}
      <div style={{marginBottom:14}}>
        <select
          value={scope === "all" ? "all" : typeof scope === "number" ? scope : "cycle"}
          onChange={e => {
            const v = e.target.value;
            setScope(v === "all" ? "all" : v === "cycle" ? "cycle" : parseInt(v));
          }}
          style={{
            width:"100%", background:"var(--bg)", border:"1px solid var(--border2)",
            borderRadius:8, color:"var(--text)", padding:"7px 12px",
            fontSize:16, outline:"none", cursor:"pointer", fontFamily:"var(--sans)",
          }}>
          <option value="cycle">Current cycle</option>
          <option value="all">All cycles</option>
          <optgroup label="Previous cycles">
            {cycleOptions.filter(o => toDate(cycles[o.value].end) < new Date()).map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Grid */}
      {totalMins === 0 ? (
        <div style={{textAlign:"center",padding:"24px 0",color:"var(--text3)",fontSize:16}}>
          No data for selected period
        </div>
      ) : (
        <>
          <div
            style={{display:"grid",gridTemplateColumns:"repeat(24,1fr)",gap:3}}
            onMouseLeave={() => setHoveredH(null)}
          >
            {HOURS.map(h => {
              const val       = heatmap[h];
              const intensity = maxHeat > 0 ? val / maxHeat : 0;
              const isNow     = h === nowH;
              const peakRank  = top3.indexOf(h); // -1, 0, 1, or 2
              return (
                <div key={h} className="heat-cell"
                  onMouseEnter={() => setHoveredH(h)}
                  style={{
                    borderRadius:6, height:48, position:"relative", cursor:"default",
                    background: intensityBg(intensity),
                    border: peakRank === 0 ? `2px solid var(--cyan)` :
                            peakRank === 1 ? `1.5px solid color-mix(in srgb, var(--cyan) 50%, transparent)` :
                            peakRank === 2 ? `1px solid color-mix(in srgb, var(--cyan) 30%, transparent)` :
                            isNow          ? "1px solid var(--border2)" :
                                             "1px solid transparent",
                    boxShadow: peakRank === 0 ? `0 0 8px color-mix(in srgb, var(--cyan) 35%, transparent)` : "none",
                  }}>
                  {/* Fill bar from bottom */}
                  {val > 0 && (
                    <div style={{
                      position:"absolute", bottom:0, left:0, right:0,
                      height:`${Math.max(6, intensity * 100)}%`,
                      background:`color-mix(in srgb, var(--cyan) ${Math.round((0.2 + intensity * 0.3) * 100)}%, transparent)`,
                      borderRadius:"0 0 5px 5px",
                    }}/>
                  )}
                  {/* Peak medal */}
                  {peakRank >= 0 && (
                    <div style={{position:"absolute",top:2,left:"50%",transform:"translateX(-50%)",fontSize:12,lineHeight:1}}>
                      {medals[peakRank]}
                    </div>
                  )}
                  {/* Now dot */}
                  {isNow && (
                    <div style={{position:"absolute",bottom:4,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:PEAK_COLOR,animation:"pulse 1.5s infinite"}}/>
                  )}
                </div>
              );
            })}
          </div>

          {/* Hour labels */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(24,1fr)",gap:3,marginTop:3,marginBottom:8}}>
            {HOURS.map(h => (
              <div key={h} style={{fontSize:13,textAlign:"center",fontFamily:"var(--mono)",lineHeight:1,
                color: top3[0]===h ? PEAK_COLOR : h===nowH ? "var(--cyan2)" : "var(--text3)",
                fontWeight: top3[0]===h || h===nowH ? 700 : 400}}>
                {hourLabel(h)}
              </div>
            ))}
          </div>

          {/* Tooltip */}
          <div style={{minHeight:30,marginBottom:8}}>
            {hoveredH !== null && (
              <div style={{background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:8,padding:"5px 12px",fontSize:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontWeight:700,color:PEAK_COLOR}}>{hoveredH%12||12}:00 {hoveredH<12?"AM":"PM"}</span>
                <span style={{fontFamily:"var(--mono)",color:"var(--text)"}}>{heatmap[hoveredH] > 0 ? `${heatmap[hoveredH]} min` : "no activity"}</span>
              </div>
            )}
          </div>

          {/* Intensity legend */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:14,color:"var(--text3)"}}>Less</span>
            <div style={{display:"flex",gap:2}}>
              {[0.05,0.25,0.5,0.75,1].map(v => (
                <div key={v} style={{width:16,height:10,borderRadius:3,background:intensityBg(v)}}/>
              ))}
            </div>
            <span style={{fontSize:14,color:"var(--text3)"}}>More activity</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Mochi Logo ───────────────────────────────────────────────────────────────

function MochiLogo({ size = 4 }) {
  const _ = null;
  const W = "#f5e6ff";
  const P = "#c084fc";
  const D = "#7c3aed";
  const L = "#e9d5ff";
  const K = "#1a0a2e";
  const R = "#f9a8d4";
  const H = "#4c1d95";
  const G = "#a78bfa";

  const grid = [
    [_,_,_,_,_,_,_,H,H,H,H,H,H,H,H,H,H,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,H,H,_,_,_,_,_,_,_,_,H,H,_,_,_,_,_,_],
    [_,_,_,P,P,_,H,H,_,_,_,_,_,_,_,_,H,H,_,P,P,_,_,_],
    [_,_,P,P,P,P,H,H,_,_,_,_,_,_,_,_,H,H,P,P,P,P,_,_],
    [_,_,P,R,P,P,_,_,_,_,_,_,_,_,_,_,_,_,P,P,R,P,_,_],
    [_,_,P,P,P,_,_,_,_,_,_,_,_,_,_,_,_,_,_,P,P,P,_,_],
    [_,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,_],
    [D,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,D],
    [D,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,D],
    [D,W,W,L,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,L,W,W,D],
    [D,W,W,W,W,K,K,W,W,W,W,W,W,W,W,W,W,K,K,W,W,W,W,D],
    [D,W,W,W,W,K,K,W,W,W,W,W,W,W,W,W,W,K,K,W,W,W,W,D],
    [D,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,D],
    [D,W,W,W,W,W,W,W,W,W,R,W,W,R,W,W,W,W,W,W,W,W,W,D],
    [D,W,W,W,W,W,W,W,W,W,W,R,R,W,W,W,W,W,W,W,W,W,W,D],
    [D,W,W,W,R,W,W,W,W,W,W,W,W,W,W,W,W,W,W,R,W,W,W,D],
    [D,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,D],
    [D,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,D],
    [D,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,D],
    [D,W,G,G,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,G,G,W,D],
    [_,D,G,G,G,W,W,W,W,W,W,W,W,W,W,W,W,W,W,G,G,G,D,_],
    [_,_,D,D,G,G,W,W,W,W,W,W,W,W,W,W,W,W,G,G,D,D,_,_],
    [_,_,_,_,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  ];

  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:`repeat(24,${size}px)`,
      gridTemplateRows:`repeat(24,${size}px)`,
      imageRendering:"pixelated",
    }}>
      {grid.flat().map((color, i) => (
        <div key={i} style={{width:size,height:size,background:color||"transparent"}}/>
      ))}
    </div>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function InfoTip({ id, text, activeId, setActiveId }) {
  const handleClick = (e) => {
    e.stopPropagation();
    const isOpen = activeId && activeId.id === id;
    if (isOpen) { setActiveId(null); return; }
    const r = e.currentTarget.getBoundingClientRect();
    const spaceAbove = r.top;
    const showBelow  = spaceAbove < 160; // flip if too close to top
    const rawLeft    = r.left + r.width / 2;
    const left       = Math.min(Math.max(rawLeft, 120), window.innerWidth - 120);
    setActiveId({ id, x: left, y: r.top, bottom: r.bottom, showBelow });
  };

  const isOpen    = activeId && activeId.id === id;
  const showBelow = isOpen && activeId.showBelow;
  const tipX      = isOpen ? activeId.x : 0;
  const tipY      = isOpen ? (showBelow ? activeId.bottom + 8 : activeId.y - 8) : 0;

  return (
    <span style={{display:"inline-flex",alignItems:"center",marginLeft:5}}>
      <button
        onClick={handleClick}
        style={{background:"none",border:"none",cursor:"pointer",padding:0,lineHeight:1,fontSize:14,color:"var(--text3)",display:"inline-flex"}}
        aria-label="info"
      >ⓘ</button>
      {isOpen && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position:"fixed",
            top:  tipY,
            left: tipX,
            transform: showBelow ? "translateX(-50%)" : "translate(-50%, -100%)",
            background:"var(--bg2)",
            border:"1px solid var(--border2)",
            borderRadius:10,
            padding:"10px 13px",
            fontSize:14,
            color:"var(--text2)",
            lineHeight:1.5,
            width:220,
            zIndex:9999,
            boxShadow:"0 4px 20px rgba(0,0,0,0.25)",
          }}
        >
          {text}
          {/* Arrow — points toward the button */}
          <div style={{
            position:"absolute",
            ...(showBelow
              ? { top:-5, bottom:"auto" }
              : { bottom:-5, top:"auto" }),
            left:"50%",
            transform:"translateX(-50%)",
            width:8, height:8,
            background:"var(--bg2)",
            border:"1px solid var(--border2)",
            borderBottom: showBelow ? "none" : "1px solid var(--border2)",
            borderRight:  showBelow ? "none" : "1px solid var(--border2)",
            borderTop:    showBelow ? "1px solid var(--border2)" : "none",
            borderLeft:   showBelow ? "1px solid var(--border2)" : "none",
            rotate:"45deg",
          }}/>
        </div>
      )}
    </span>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function getCycleStats(cycle, billableCalls) {
  const s = toDate(cycle.start), e = toDate(cycle.end);
  const cc = billableCalls.filter(c => { const d = toDate(c.date); return d >= s && d <= e; });
  return { mins: cc.reduce((s, c) => s + c.duration, 0), money: cc.reduce((s, c) => s + c.pay, 0), count: cc.length };
}

// Surge check with safe floating-point comparison (4 decimal places)
// Avoids false positives like 0.12000000000000001 > 0.12
function isSurge(call, baseRate) {
  if (call.duration <= 0) return false;
  const callRate = Math.round((call.pay / call.duration) * 10000);
  const base     = Math.round((baseRate ?? 0.12)         * 10000);
  return callRate > base;
}

export default function App() {

  // ── State ──────────────────────────────────────────────────────────────────
  const [calls,          setCalls]          = useState([]);
  const [config,         setConfig]         = useState(defaultConfig);
  const [tab,            setTab]            = useState("home");
  const [activeRate,     setActiveRate]     = useState(defaultConfig.baseRate);
  const [toast,          setToast]          = useState("");
  const [cycleView,      setCycleView]      = useState("current");
  const [expandedDays,   setExpandedDays]   = useState(new Set());
  const [heatmapScope,   setHeatmapScope]   = useState("cycle"); // "cycle" | "all" | cycle index (number)
  const [rhythmView,     setRhythmView]     = useState("today"); // "today" | "cycle"

  // Modals
  const [showGoal,       setShowGoal]       = useState(false);
  const [isMuted,        setIsMuted]        = useState(false);
  const [showConfig,     setShowConfig]     = useState(false);
  const [showManual,     setShowManual]     = useState(false);
  const [showPaste,      setShowPaste]      = useState(false);
  const [tempGoal,       setTempGoal]       = useState(defaultConfig.dailyMoneyGoal);
  const [tempConfig,     setTempConfig]     = useState(defaultConfig);

  // Live call
  const [liveActive,     setLiveActive]     = useState(false);
  const [liveSeconds,    setLiveSeconds]    = useState(0);
  const [liveStart,      setLiveStart]      = useState(null);
  const liveRef = useRef(null);

  // Manual form
  const [manualForm,     setManualForm]     = useState({ customerId:"", startTime:"", endTime:"", duration:"", pay:"" });

  // Paste
  const [rawText,        setRawText]        = useState("");
  const [parsed,         setParsed]         = useState(null);
  const [parseError,     setParseError]     = useState("");

  // Edit
  const [editingId,      setEditingId]      = useState(null);
  const [editForm,       setEditForm]       = useState({});

  // Import
  const [importStep,     setImportStep]     = useState("idle");
  const [importPreview,  setImportPreview]  = useState([]);
  const [importStats,    setImportStats]    = useState(null);
  const [importError,    setImportError]    = useState("");
  const [importFileName, setImportFileName] = useState("");
  const fileRef = useRef();

  // Idle cost counter
  const appStartTs = useRef(Date.now());
  const [idleSecs, setIdleSecs] = useState(0);

  // Custom cycles
  const [customCycles,    setCustomCycles]    = useState(null); // null = use PAY_CYCLES default
  const [showEditCycles,  setShowEditCycles]  = useState(false);
  const [editingCycles,   setEditingCycles]   = useState([]);   // working copy inside modal

  // Onboarding
  const [onboardStep, setOnboardStep] = useState(null); // null = not shown, 0-3 = step
  const [onboardRate, setOnboardRate] = useState(0.12);
  const [onboardGoal, setOnboardGoal] = useState(30);

  // Tooltip
  const [tooltip, setTooltip] = useState(null); // { id, text }

  // ── Effects ────────────────────────────────────────────────────────────────

  // Load persisted data on mount
  useEffect(() => {
    try {
      const d = localStorage.getItem(STORAGE_KEY);
      const c = localStorage.getItem(STORAGE_CONFIG);
      const seen = localStorage.getItem("mochi_onboarded");
      if (d) setCalls(JSON.parse(d));
      if (c) { const cfg = JSON.parse(c); setConfig(cfg); setTempConfig(cfg); setTempGoal(cfg.dailyMoneyGoal || 30); setActiveRate(cfg.baseRate ?? 0.12); applyTheme(cfg.theme || "light"); }
      const cy = localStorage.getItem(STORAGE_CYCLES);
      if (cy) setCustomCycles(JSON.parse(cy));
      if (!seen) setOnboardStep(0);
    } catch {}
  }, []);

  // Persist calls on change
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(calls)); } catch {} }, [calls]);

  // Load XLSX library (guard against duplicate injection)
  useEffect(() => {
    if (!window.XLSX && !document.querySelector('script[src*="xlsx"]')) {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      document.head.appendChild(s);
    }
  }, []);

  // Live call timer
  useEffect(() => {
    if (liveActive) liveRef.current = setInterval(() => setLiveSeconds(s => s + 1), 1000);
    else            clearInterval(liveRef.current);
    return () => clearInterval(liveRef.current);
  }, [liveActive]);

  // Idle counter tick
  useEffect(() => {
    const t = setInterval(() => setIdleSecs(Math.floor((Date.now() - appStartTs.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  // Reset idle counter only when a call is ADDED (not deleted or edited)
  const prevCallCount = useRef(0);
  useEffect(() => {
    if (calls.length > prevCallCount.current) {
      appStartTs.current = Date.now();
      setIdleSecs(0);
    }
    prevCallCount.current = calls.length;
  }, [calls.length]);

  // ── Derived data ───────────────────────────────────────────────────────────

  const todayStr      = today();
  const billableCalls = calls.filter(c => c.billable === "Yes");
  const byDate        = groupByDate(billableCalls);
  const todayCalls    = byDate[todayStr] || [];
  const todayMoney    = todayCalls.reduce((s, c) => s + c.pay, 0);
  const todayMins     = todayCalls.reduce((s, c) => s + c.duration, 0);
  const moneyPct      = Math.min(100, Math.round((todayMoney / config.dailyMoneyGoal) * 100));
  const RATES         = getRates(config.baseRate ?? 0.12);
  const activeCycles  = customCycles ?? PAY_CYCLES;
  const minsNeeded    = Math.ceil(config.dailyMoneyGoal / (config.baseRate ?? 0.12)); // Base rate as reference for minute goal
  const minsLeft      = Math.max(0, minsNeeded - todayMins);
  const minsGoalReached = minsLeft === 0;

  // 🎉 Sonido de meta alcanzada — solo dispara una vez al cruzar el 100%
  const goalReachedRef = useRef(false);
  useEffect(() => {
    const reached = todayMoney >= config.dailyMoneyGoal && config.dailyMoneyGoal > 0;
    if (reached && !goalReachedRef.current) { sfx.goalReached(); }
    goalReachedRef.current = reached;
  }, [todayMoney, config.dailyMoneyGoal]);

  const weekDates = last7Dates();
  const weekData  = weekDates.map(d => ({
    date:  d,
    label: d.slice(0, 5),
    mins:  (byDate[d] || []).reduce((s, c) => s + c.duration, 0),
    money: (byDate[d] || []).reduce((s, c) => s + c.pay, 0),
  }));
  const weekMoney = weekData.reduce((s, d) => s + d.money, 0);
  const weekMins  = weekData.reduce((s, d) => s + d.mins,  0);
  const maxMins   = Math.max(...weekData.map(d => d.mins), 1);

  const sortedDates  = [...new Set(calls.map(c => c.date))].sort((a, b) => toDate(b) - toDate(a));
  const currentCycle = getCurrentCycle(activeCycles);
  const activeDates  = new Set(Object.keys(byDate));
  const streak       = getStreak(activeDates);
  const last30       = last30Dates();

  const yestStr   = (() => { const d = new Date(); d.setDate(d.getDate()-1); return `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}/${d.getFullYear()}`; })();
  const yestMoney = (byDate[yestStr] || []).reduce((s, c) => s + c.pay, 0);
  const yestMins  = (byDate[yestStr] || []).reduce((s, c) => s + c.duration, 0);
  const lwDates   = Array.from({length:7}, (_, i) => { const d = new Date(); d.setDate(d.getDate()-(7+i)); return `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}/${d.getFullYear()}`; });
  const lwMoney   = lwDates.reduce((s, d) => s + (byDate[d] || []).reduce((ss, c) => ss + c.pay, 0), 0);
  const lwMins    = lwDates.reduce((s, d) => s + (byDate[d] || []).reduce((ss, c) => ss + c.duration, 0), 0);

  const heatmapCalls = (() => {
    if (heatmapScope === "all") return billableCalls;
    const cycleToUse = typeof heatmapScope === "number" ? activeCycles[heatmapScope] : currentCycle;
    if (!cycleToUse) return billableCalls;
    const s = toDate(cycleToUse.start), e = toDate(cycleToUse.end);
    return billableCalls.filter(c => { const d = toDate(c.date); return d >= s && d <= e; });
  })();
  const heatmap = Array(24).fill(0);
  heatmapCalls.forEach(c => { const h = parseHour(c.callStart); if (h !== null) heatmap[h] += c.duration; });
  const maxHeat = Math.max(...heatmap, 1);

  const sortedToday = [...todayCalls].sort((a, b) => (timeToMins(a.callStart) || 0) - (timeToMins(b.callStart) || 0));
  let avgGap = null;
  let allGaps = [];
  if (sortedToday.length > 1) {
    const rawGaps = [];
    for (let i = 1; i < sortedToday.length; i++) {
      const mA = timeToMins(sortedToday[i-1].callStart), mB = timeToMins(sortedToday[i].callStart);
      if (mA !== null && mB !== null && mB > mA) rawGaps.push((mB - mA) - sortedToday[i-1].duration);
    }
    allGaps = rawGaps.filter(g => g >= 0);
    if (allGaps.length) avgGap = Math.round(allGaps.reduce((s, g) => s + g, 0) / allGaps.length);
  }

  let projection = null;
  if (currentCycle) {
    const stats = getCycleStats(currentCycle, billableCalls);
    const s = toDate(currentCycle.start), e = toDate(currentCycle.end);
    const totalDays  = Math.round((e - s) / 86400000) + 1;
    const daysPassed = totalDays - Math.max(daysUntil(currentCycle.end), 0);
    if (daysPassed > 0) projection = Math.round((stats.money / daysPassed * totalDays) * 100) / 100;
  }

  const scoreGoal   = Math.min(40, moneyPct * 0.4);
  const scoreRhythm = avgGap !== null ? Math.min(30, Math.max(0, 30 - (avgGap * 1.5))) : (todayCalls.length > 0 ? 15 : 0);
  const scoreStreak = Math.min(20, streak * 4);
  const scoreHours  = Math.min(10, todayCalls.length > 0 ? 10 : 0);
  const score       = Math.round(scoreGoal + scoreRhythm + scoreStreak + scoreHours);
  const scoreColor  = score >= 75 ? "var(--green)" : score >= 45 ? "var(--amber)" : "var(--red)";
  const scoreLabel  = score >= 75 ? "Excellent" : score >= 45 ? "Good" : score >= 20 ? "Slow" : "Inactive";

  // ── Functions ──────────────────────────────────────────────────────────────
  const toastRef = useRef(null);
  function showToast(msg) {
    clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(""), 3000);
  }

  function handleDelete(id) { sfx.deleted(); setCalls(prev => prev.filter(c => c.id !== id)); }

  // Live call
  function startLiveCall()  { setLiveSeconds(0); setLiveStart(getNowTimeStr()); setLiveActive(true); }
  function cancelLiveCall() { setLiveActive(false); setLiveSeconds(0); setLiveStart(null); }
  function stopLiveCall()   {
    setLiveActive(false);
    const mins = Math.max(1, Math.round(liveSeconds / 60));
    const pay  = parseFloat((mins * activeRate).toFixed(2));
    setManualForm({ customerId:"", startTime: liveStart || "", endTime: getNowTimeStr(), duration: String(mins), pay: String(pay) });
    setShowManual(true);
  }

  // Manual form field change — keeps inicio/fin/duración in sync
  function handleManualChange(field, val) {
    setManualForm(p => {
      const next = { ...p, [field]: val };
      if ((field === "startTime" || field === "endTime")) {
        const s = timeToMins(next.startTime), e = timeToMins(next.endTime);
        if (s !== null && e !== null && e > s) { next.duration = String(e - s); next.pay = String(parseFloat(((e - s) * activeRate).toFixed(2))); }
      }
      if (field === "duration" && val) {
        const dur = parseInt(val) || 0;
        next.pay = String(parseFloat((dur * activeRate).toFixed(2)));
        const s = timeToMins(next.startTime);
        if (s !== null && dur > 0) next.endTime = minsToTime(s + dur);
      }
      // If only one time boundary is set, use duration to fill in the other
      if (field === "startTime" && next.duration && !timeToMins(next.endTime)) {
        const s = timeToMins(val), dur = parseInt(next.duration) || 0;
        if (s !== null && dur > 0) next.endTime = minsToTime(s + dur);
      }
      if (field === "endTime" && next.duration && !timeToMins(next.startTime)) {
        const e = timeToMins(val), dur = parseInt(next.duration) || 0;
        if (e !== null && dur > 0) next.startTime = minsToTime(e - dur);
      }
      return next;
    });
  }

  function submitManual() {
    const dur = parseInt(manualForm.duration) || 0;
    if (!dur) { sfx.error(); showToast("⚠️ Invalid duration"); return; }
    const newCall = {
      customerId: manualForm.customerId || "Manual",
      date: todayStr, callStart: manualForm.startTime || getNowTimeStr(),
      duration: dur, billable: "Yes", dropped: "No",
      pay: parseFloat(manualForm.pay) || parseFloat((dur * activeRate).toFixed(2)),
      surge: false, id: Date.now() + Math.random(),
    };
    setCalls(prev => [...prev, newCall]);
    setShowManual(false);
    setManualForm({ customerId:"", startTime:"", endTime:"", duration:"", pay:"" });
    setLiveStart(null);
    sfx.callAdded();
    showToast("✅ Call added");
  }

  // Edit form
  function startEdit(c) {
    const startMins = timeToMins(c.callStart);
    setEditingId(c.id);
    setEditForm({ callStart: c.callStart, callEnd: startMins !== null ? minsToTime(startMins + c.duration) : "", duration: String(c.duration), pay: String(c.pay), customerId: c.customerId });
  }

  function handleEditChange(field, val) {
    setEditForm(p => {
      const next = { ...p, [field]: val };
      if (field === "callStart" || field === "callEnd") {
        const s = timeToMins(next.callStart), e = timeToMins(next.callEnd);
        if (s !== null && e !== null && e > s) { next.duration = String(e - s); next.pay = String(parseFloat(((e - s) * activeRate).toFixed(2))); }
      }
      if (field === "duration" && val) {
        const dur = parseInt(val) || 0;
        next.pay = String(parseFloat((dur * activeRate).toFixed(2)));
        const s = timeToMins(next.callStart);
        if (s !== null && dur > 0) next.callEnd = minsToTime(s + dur);
      }
      if (field === "callStart" && next.duration) {
        const s = timeToMins(val), dur = parseInt(next.duration) || 0;
        if (s !== null && dur > 0) next.callEnd = minsToTime(s + dur);
      }
      return next;
    });
  }

  function saveEdit(id) {
    setCalls(prev => prev.map(c => {
      if (c.id !== id) return c;
      const newDur = parseInt(editForm.duration);
      const newPay = parseFloat(editForm.pay);
      return {
        ...c,
        customerId: editForm.customerId || c.customerId,
        callStart:  editForm.callStart  || c.callStart,
        duration:   isNaN(newDur) ? c.duration : newDur,
        pay:        isNaN(newPay) ? c.pay : newPay,
      };
    }));
    setEditingId(null);
    sfx.saved();
    showToast("✏️ Updated");
  }

  // Paste
  function handleParse() {
    setParseError("");
    const r = parseCallText(rawText);
    if (!r) { setParseError("Could not parse the text."); setParsed(null); return; }
    setParsed(r);
  }
  function handleAdd() {
    if (!parsed) return;
    if (parsed.billable !== "Yes") { sfx.error(); showToast("⚠️ No billable."); setParsed(null); setRawText(""); return; }
    setCalls(prev => [...prev, parsed]); setParsed(null); setRawText(""); sfx.callAdded(); showToast("✅ Call added");
  }

  // Import / Export
  async function handleFileLoad(file) {
    if (!file) return;
    setImportError(""); setImportFileName(file.name);
    const isXLSX = /\.xlsx?$/i.test(file.name), isCSV = /\.csv$/i.test(file.name);
    if (!isXLSX && !isCSV) { setImportError("CSV or Excel only."); return; }
    try {
      let headers = [], rows = [];
      if (isCSV) { const text = await file.text(); ({ headers, rows } = parseCSVText(text)); }
      else {
        const buf = await file.arrayBuffer(); const XLSX = window.XLSX;
        if (!XLSX) { setImportError("Library unavailable."); return; }
        const wb = XLSX.read(buf, { type:"array" }); const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header:1, defval:"" });
        headers = data[0].map(h => String(h).trim()); rows = data.slice(1).map(r => r.map(v => String(v).trim()));
      }
      if (!headers.length) { setImportError("Empty file."); return; }
      const preview = rowsToCallsSmart(rows, headers);
      if (!preview.length) { setImportError("No valid rows."); return; }
      setImportPreview(preview);
      setImportStats({ total: preview.length, surge: preview.filter(c => c.surge).length, totalPay: preview.reduce((s, c) => s + c.pay, 0), totalMins: preview.reduce((s, c) => s + c.duration, 0) });
      setImportStep("preview");
    } catch(e) { setImportError("Error: " + e.message); }
  }

  function confirmImport() {
    const existing = new Set(calls.map(c => `${c.customerId}-${c.date}-${c.callStart}`));
    const newCalls = importPreview.filter(c => !existing.has(`${c.customerId}-${c.date}-${c.callStart}`));
    setCalls(prev => [...prev, ...newCalls]); setImportStep("done"); sfx.imported(); showToast(`✅ ${newCalls.length} imported`);
  }

  function resetImport() {
    setImportStep("idle"); setImportPreview([]); setImportError(""); setImportFileName(""); setImportStats(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function getExportRows() {
    return calls.map(c => ({ "Project ID":c.customerId, "Service Date":c.date, "Start Time":c.callStart, "Quantity":c.duration, "Earnings":"$"+c.pay.toFixed(2), "Adjustment":"$0.00", "Service Line":c.serviceType||"", "Surge":c.surge?"Yes":"No", "Billable":c.billable, "Dropped":c.dropped }));
  }

  function exportCSV() {
    const rows = getExportRows(); if (!rows.length) { sfx.error(); showToast("⚠️ No calls"); return; }
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => '"' + String(r[h]).replace(/"/g, '""') + '"').join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type:"text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = `call-tracker-${today()}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast("✅ CSV exported");
  }

  function exportXLSX() {
    const XLSX = window.XLSX; if (!XLSX) { sfx.error(); showToast("⚠️ Library unavailable"); return; }
    const rows = getExportRows(); if (!rows.length) { sfx.error(); showToast("⚠️ No calls"); return; }
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Calls");
    XLSX.writeFile(wb, `call-tracker-${today()}.xlsx`); showToast("✅ Excel exported");
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div onClick={() => setTooltip(null)} style={{minHeight:"100vh",background:"var(--bg)",color:"var(--text)",fontFamily:"var(--sans)",paddingBottom:80}}>

      {/* Toast */}
      {toast && (
        <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:"var(--bg3)",border:"1px solid var(--cyan)",color:"var(--cyan)",padding:"10px 20px",borderRadius:99,fontWeight:600,zIndex:999,fontSize:17,whiteSpace:"nowrap",animation:"toastIn .25s ease",boxShadow:"0 2px 12px rgba(0,0,0,0.12)"}}>
          {toast}
        </div>
      )}

      {/* Live call banner */}
      {liveActive && (
        <div style={{position:"fixed",top:0,left:0,right:0,background:"linear-gradient(135deg,#dcfce7,#bbf7d0)",borderBottom:"1px solid var(--green)",zIndex:150,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"var(--green2)",animation:"pulse 1s infinite"}}/>
            <div>
              <div style={{fontSize:14,color:"var(--green2)",fontWeight:700,letterSpacing:1}}>ON CALL</div>
              <div style={{fontSize:24,fontWeight:800,fontFamily:"var(--mono)",color:"var(--green2)",lineHeight:1}}>{fmtTime(liveSeconds)}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="action-btn" onClick={stopLiveCall}   style={{background:"var(--green2)",border:"none",borderRadius:8,color:"#fff",padding:"8px 16px",fontWeight:800,cursor:"pointer",fontSize:17}}>✅ Save</button>
            <button className="action-btn" onClick={cancelLiveCall} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:8,color:"var(--text2)",padding:"8px 14px",fontWeight:600,cursor:"pointer",fontSize:17}}>✕</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{padding:"20px 20px 0",display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:liveActive?56:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <MochiLogo size={2}/>
          <div>
            <div style={{display:"flex",alignItems:"baseline",gap:8}}>
              <div style={{fontSize:16,color:"var(--text)",fontWeight:800,letterSpacing:1,fontFamily:"var(--mono)"}}>MOCHI</div>
              <div style={{fontSize:12,color:"var(--text3)",fontWeight:700,letterSpacing:0,fontFamily:"var(--mono)"}}>CALL TRACKER</div>
            </div>
            <div style={{fontSize:15,color:"var(--text3)",marginTop:1,fontFamily:"var(--mono)"}}>{todayStr}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={() => { setTempGoal(config.dailyMoneyGoal); setShowGoal(true); }} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:8,color:"var(--text2)",padding:"7px 12px",cursor:"pointer",fontSize:16,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
            <span style={{color:"var(--amber)"}}>🎯</span> Goal
          </button>
          <button onClick={() => { const m = sfx.toggle(); setIsMuted(m); }} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:8,color:isMuted?"var(--red)":"var(--text2)",padding:"7px 10px",cursor:"pointer",fontSize:17}} title={isMuted?"Unmute":"Mute"}>
            {isMuted ? "🔇" : "🔊"}
          </button>
          <button onClick={() => { setShowConfig(true); }} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:8,color:"var(--text2)",padding:"7px 12px",cursor:"pointer",fontSize:18}}>⚙</button>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* Onboarding */}
      {onboardStep !== null && (
        <div style={{position:"fixed",inset:0,background:"rgba(10,10,20,0.75)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{...CC.card,padding:28,width:"100%",maxWidth:360,animation:"slideUp .25s ease"}}>

            {/* Progress dots */}
            <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:24}}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{width:i===onboardStep?20:8,height:8,borderRadius:99,background:i<=onboardStep?"var(--cyan)":"var(--border2)",transition:"all .2s"}}/>
              ))}
            </div>

            {/* Step 0 — Welcome */}
            {onboardStep === 0 && (
              <div style={{textAlign:"center"}}>
                <div style={{display:"flex",justifyContent:"center",marginBottom:16}}><MochiLogo size={5}/></div>
                <div style={{fontSize:24,fontWeight:800,color:"var(--text)",marginBottom:10}}>Welcome to Mochi</div>
                <div style={{fontSize:16,color:"var(--text2)",lineHeight:1.6,marginBottom:24}}>
                  Mochi helps freelance phone interpreters track calls, monitor earnings, and hit their daily goals — all from one place.
                </div>
                <div style={{display:"grid",gap:8,fontSize:15,color:"var(--text2)",textAlign:"left",marginBottom:24}}>
                  {[["☀️","Log calls in real time or manually"],["⚡","See your daily score and rhythm"],["🔄","Track earnings across pay cycles"],["⚡ SURGE","Spot calls above your normal rate automatically"]].map(([icon,txt]) => (
                    <div key={txt} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                      <span style={{fontSize:17,flexShrink:0}}>{icon}</span>
                      <span>{txt}</span>
                    </div>
                  ))}
                </div>
                <button className="btn-primary" onClick={() => setOnboardStep(1)} style={{width:"100%",background:"var(--cyan)",border:"none",borderRadius:12,color:"#fff",padding:"14px",fontWeight:700,fontSize:17,cursor:"pointer"}}>
                  Get started →
                </button>
              </div>
            )}

            {/* Step 1 — Base rate */}
            {onboardStep === 1 && (
              <div>
                <div style={{fontSize:22,fontWeight:800,color:"var(--text)",marginBottom:6}}>Your base rate</div>
                <div style={{fontSize:15,color:"var(--text2)",lineHeight:1.6,marginBottom:20}}>
                  This is how much you earn per minute at your normal rate. Surge tiers (Bronce, Silver, Gold) add $0.01 each on top of this.
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <span style={{fontSize:15,color:"var(--text3)",fontWeight:700}}>BASE RATE</span>
                  <span style={{fontFamily:"var(--mono)",fontWeight:800,fontSize:22,color:"var(--cyan)"}}>${onboardRate.toFixed(2)}<span style={{fontSize:13,color:"var(--text3)",fontWeight:400}}>/min</span></span>
                </div>
                <input type="range" min={0.08} max={0.25} step={0.01} value={onboardRate}
                  onChange={e => setOnboardRate(parseFloat(e.target.value))}
                  style={{width:"100%",accentColor:"var(--cyan)",cursor:"pointer",marginBottom:6}}
                />
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"var(--text3)",marginBottom:20,fontFamily:"var(--mono)"}}>
                  <span>$0.08</span><span>$0.25</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:24}}>
                  {getRates(onboardRate).map(r => (
                    <div key={r.label} style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,padding:"7px 4px",textAlign:"center"}}>
                      <div style={{fontSize:16}}>{r.icon}</div>
                      <div style={{fontSize:13,fontFamily:"var(--mono)",fontWeight:700,color:"var(--text)",marginTop:2}}>${r.value.toFixed(2)}</div>
                      <div style={{fontSize:12,color:"var(--text3)"}}>{r.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <button onClick={() => setOnboardStep(0)} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:12,color:"var(--text2)",padding:"12px",fontWeight:600,fontSize:16,cursor:"pointer"}}>← Back</button>
                  <button className="btn-primary" onClick={() => setOnboardStep(2)} style={{background:"var(--cyan)",border:"none",borderRadius:12,color:"#fff",padding:"12px",fontWeight:700,fontSize:16,cursor:"pointer"}}>Next →</button>
                </div>
              </div>
            )}

            {/* Step 2 — Daily goal */}
            {onboardStep === 2 && (
              <div>
                <div style={{fontSize:22,fontWeight:800,color:"var(--text)",marginBottom:6}}>Daily earnings goal</div>
                <div style={{fontSize:15,color:"var(--text2)",lineHeight:1.6,marginBottom:20}}>
                  How much do you want to earn each day? Mochi will track your progress and celebrate when you hit it.
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <span style={{fontSize:15,color:"var(--text3)",fontWeight:700}}>DAILY GOAL</span>
                  <span style={{fontFamily:"var(--mono)",fontWeight:800,fontSize:22,color:"var(--amber)"}}>${onboardGoal}</span>
                </div>
                <input type="range" min={5} max={200} step={1} value={onboardGoal}
                  onChange={e => setOnboardGoal(parseInt(e.target.value))}
                  style={{width:"100%",accentColor:"var(--amber)",cursor:"pointer",marginBottom:6}}
                />
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"var(--text3)",marginBottom:8,fontFamily:"var(--mono)"}}>
                  <span>$5</span><span>$200</span>
                </div>
                <div style={{background:"var(--bg)",borderRadius:10,padding:"12px 14px",marginBottom:24,fontSize:15,color:"var(--text2)"}}>
                  At ${onboardRate.toFixed(2)}/min you'd need about <strong style={{color:"var(--cyan)",fontFamily:"var(--mono)"}}>{Math.ceil(onboardGoal/onboardRate)} min</strong> of calls to reach this goal.
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <button onClick={() => setOnboardStep(1)} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:12,color:"var(--text2)",padding:"12px",fontWeight:600,fontSize:16,cursor:"pointer"}}>← Back</button>
                  <button className="btn-primary" onClick={() => setOnboardStep(3)} style={{background:"var(--cyan)",border:"none",borderRadius:12,color:"#fff",padding:"12px",fontWeight:700,fontSize:16,cursor:"pointer"}}>Next →</button>
                </div>
              </div>
            )}

            {/* Step 3 — How to log a call */}
            {onboardStep === 3 && (
              <div>
                <div style={{fontSize:22,fontWeight:800,color:"var(--text)",marginBottom:6}}>Logging calls</div>
                <div style={{fontSize:15,color:"var(--text2)",lineHeight:1.6,marginBottom:20}}>
                  You have three ways to log a call:
                </div>
                <div style={{display:"grid",gap:12,marginBottom:24}}>
                  {[
                    ["🔴","Live","Tap Live before the call starts. Tap Stop when it ends — Mochi calculates duration automatically."],
                    ["✍️","Manual","Enter the duration or start/end times directly after a call."],
                    ["📋","Paste","Paste a raw call line from your Propio dashboard and Mochi parses it for you."],
                  ].map(([icon,title,desc]) => (
                    <div key={title} style={{display:"flex",gap:12,alignItems:"flex-start",background:"var(--bg)",borderRadius:10,padding:"12px 14px"}}>
                      <span style={{fontSize:22,flexShrink:0}}>{icon}</span>
                      <div>
                        <div style={{fontWeight:700,fontSize:16,color:"var(--text)",marginBottom:2}}>{title}</div>
                        <div style={{fontSize:14,color:"var(--text2)",lineHeight:1.5}}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <button onClick={() => setOnboardStep(2)} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:12,color:"var(--text2)",padding:"12px",fontWeight:600,fontSize:16,cursor:"pointer"}}>← Back</button>
                  <button className="btn-primary" onClick={() => {
                    const nc = {...config, baseRate: onboardRate, dailyMoneyGoal: onboardGoal};
                    setConfig(nc); setTempConfig(nc); setTempGoal(onboardGoal); setActiveRate(onboardRate);
                    try { localStorage.setItem(STORAGE_CONFIG, JSON.stringify(nc)); localStorage.setItem("mochi_onboarded","1"); } catch {}
                    setOnboardStep(null);
                    showToast("✅ You're all set!");
                  }} style={{background:"var(--green2)",border:"none",borderRadius:12,color:"#fff",padding:"12px",fontWeight:700,fontSize:16,cursor:"pointer"}}>
                    Let's go 🎉
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Goal */}
      {showGoal && (
        <Modal onClose={() => { setShowGoal(false); }}>
          <div style={{fontSize:14,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>DAILY GOAL</div>
          <div style={{fontSize:22,fontWeight:700,color:"var(--text)",marginBottom:20}}>How much do you want to earn today?</div>
          <label style={CC.label}>Amount in dollars</label>
          <div style={{position:"relative",marginBottom:20}}>
            <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--amber)",fontWeight:700,fontSize:20,fontFamily:"var(--mono)"}}>$</div>
            <input type="number" step="0.01" min="0" value={tempGoal} onChange={e => setTempGoal(e.target.value)} autoFocus
              style={{...CC.input,paddingLeft:32,fontSize:24,fontFamily:"var(--mono)",fontWeight:800,color:"var(--amber)",border:"1px solid var(--amber)44"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn-primary" onClick={() => { const val=parseFloat(tempGoal)||30; const nc={...config,dailyMoneyGoal:val}; setConfig(nc); setTempConfig(nc); try{localStorage.setItem(STORAGE_CONFIG,JSON.stringify(nc));}catch{} setShowGoal(false); showToast("🎯 Goal: $"+val.toFixed(2)); }}
              style={{flex:1,background:"var(--amber)",border:"none",borderRadius:10,color:"#000",padding:"12px",fontWeight:800,cursor:"pointer",fontSize:17}}>Save</button>
            <button onClick={() => { setShowGoal(false); }} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:10,color:"var(--text2)",padding:"12px 16px",cursor:"pointer",fontSize:17}}>✕</button>
          </div>
        </Modal>
      )}

      {/* Config / Import */}
      {showConfig && (
        <Modal onClose={() => { setShowConfig(false); resetImport(); }}>
          <div style={{fontSize:14,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>IMPORT</div>
          <div style={{fontSize:22,fontWeight:700,color:"var(--text)",marginBottom:16}}>Load calls</div>

          {/* Theme selector */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:14,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:10}}>THEME</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(68px,1fr))",gap:8}}>
              {Object.entries(THEMES).map(([key, t]) => {
                const active = (config.theme || "light") === key;
                return (
                  <button key={key} onClick={() => {
                    const nc = {...config, theme: key};
                    setConfig(nc);
                    applyTheme(key);
                    try { localStorage.setItem(STORAGE_CONFIG, JSON.stringify(nc)); } catch {}
                  }} style={{
                    padding:"10px 6px", borderRadius:10, cursor:"pointer",
                    border: active ? "2px solid var(--cyan)" : "1px solid var(--border2)",
                    background: active ? "var(--cyan)18" : "var(--bg)",
                    display:"flex", flexDirection:"column", alignItems:"center", gap:5,
                    transition:"all .15s",
                  }}>
                    <span style={{fontSize:20}}>{t.icon}</span>
                    <span style={{fontSize:15,fontWeight:700,color:active?"var(--cyan)":"var(--text2)"}}>{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Base rate slider */}
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:14,color:"var(--text3)",fontWeight:700,letterSpacing:1}}>BASE RATE</div>
              <div style={{fontFamily:"var(--mono)",fontWeight:800,fontSize:18,color:"var(--cyan)"}}>
                ${(config.baseRate ?? 0.12).toFixed(2)}<span style={{fontSize:13,color:"var(--text3)",fontWeight:400}}>/min</span>
              </div>
            </div>
            <input type="range" min={0.08} max={0.25} step={0.01}
              value={config.baseRate ?? 0.12}
              onChange={e => {
                const base = parseFloat(e.target.value);
                const nc = {...config, baseRate: base};
                setConfig(nc);
                setActiveRate(base);
                try { localStorage.setItem(STORAGE_CONFIG, JSON.stringify(nc)); } catch {}
              }}
              style={{width:"100%",accentColor:"var(--cyan)",cursor:"pointer"}}
            />
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"var(--text3)",marginTop:4,fontFamily:"var(--mono)"}}>
              <span>$0.08</span><span>$0.25</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginTop:10}}>
              {getRates(config.baseRate ?? 0.12).map(r => (
                <div key={r.label} style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,padding:"7px 4px",textAlign:"center"}}>
                  <div style={{fontSize:16}}>{r.icon}</div>
                  <div style={{fontSize:13,fontFamily:"var(--mono)",fontWeight:700,color:"var(--text)",marginTop:2}}>${r.value.toFixed(2)}</div>
                  <div style={{fontSize:12,color:"var(--text3)"}}>{r.label}</div>
                </div>
              ))}
            </div>
          </div>

          {importError && <div style={{background:"#fef2f2",border:"1px solid var(--red)44",borderRadius:8,padding:"10px 12px",color:"var(--red)",fontSize:16,marginBottom:12}}>{importError}</div>}

          {importStep === "idle" && (
            <div>
              <button onClick={() => fileRef.current.click()} style={{width:"100%",background:"var(--bg)",border:"2px dashed var(--border2)",borderRadius:12,color:"var(--text2)",padding:"28px",fontWeight:600,cursor:"pointer",fontSize:17,textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:28,marginBottom:8}}>📁</div>
                <div>Select CSV or Excel</div>
                <div style={{fontSize:15,color:"var(--text3)",marginTop:4}}>Drag or click</div>
              </button>
              {calls.length > 0 && (
                <div>
                  <div style={{fontSize:14,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:10}}>EXPORT · {calls.length} calls</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <button className="btn-primary" onClick={exportCSV} style={{background:"var(--bg)",border:"1px solid var(--cyan)44",borderRadius:10,color:"var(--cyan)",padding:"12px 8px",fontWeight:700,cursor:"pointer",fontSize:17,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <span style={{fontSize:22}}>✅</span><span>CSV</span>
                    </button>
                    <button className="btn-primary" onClick={exportXLSX} style={{background:"var(--bg)",border:"1px solid var(--green)44",borderRadius:10,color:"var(--green)",padding:"12px 8px",fontWeight:700,cursor:"pointer",fontSize:17,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <span style={{fontSize:22}}>📊</span><span>Excel</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {importStep === "preview" && importStats && (
            <div>
              <div style={{background:"var(--bg)",borderRadius:10,padding:14,marginBottom:14}}>
                <div style={{color:"var(--text)",fontWeight:700,marginBottom:8,fontSize:17}}>{importFileName}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
                  <div><div style={{fontSize:20,fontWeight:800,fontFamily:"var(--mono)",color:"var(--cyan)"}}>{importStats.total}</div><div style={{fontSize:14,color:"var(--text3)"}}>calls</div></div>
                  <div><div style={{fontSize:20,fontWeight:800,fontFamily:"var(--mono)",color:"var(--green)"}}>${importStats.totalPay.toFixed(2)}</div><div style={{fontSize:14,color:"var(--text3)"}}>total</div></div>
                  <div><div style={{fontSize:20,fontWeight:800,fontFamily:"var(--mono)",color:"var(--blue)"}}>{importStats.totalMins}m</div><div style={{fontSize:14,color:"var(--text3)"}}>minutes</div></div>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn-primary" onClick={() => { confirmImport(); setShowConfig(false); }} style={{flex:1,background:"var(--green2)",border:"none",borderRadius:10,color:"var(--text)",padding:"12px",fontWeight:700,cursor:"pointer",fontSize:17}}>✅ Confirm</button>
                <button onClick={resetImport} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:10,color:"var(--text2)",padding:"12px 16px",cursor:"pointer"}}>✕</button>
              </div>
            </div>
          )}

          {importStep === "done" && (
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:32,marginBottom:8}}>✅</div>
              <div style={{color:"var(--green)",fontWeight:700,marginBottom:16}}>Imported successfully</div>
              <button onClick={() => { resetImport(); setShowConfig(false); }} style={{background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:10,color:"var(--text2)",padding:"10px 20px",cursor:"pointer",fontWeight:600}}>Close</button>
            </div>
          )}
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={e => handleFileLoad(e.target.files[0])} style={{display:"none"}}/>
        </Modal>
      )}

      {/* Manual / Live */}
      {showManual && (
        <Modal onClose={() => { setShowManual(false); setLiveStart(null); }}>
          <div style={{fontSize:14,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>NEW CALL</div>
          <div style={{fontSize:20,fontWeight:700,color:"var(--text)",marginBottom:16}}>{liveStart ? "Save recorded call" : "Add manually"}</div>
          <div style={{marginBottom:14}}>
            <label style={{...CC.label,display:"flex",alignItems:"center"}}>Active rate <InfoTip id="rate-manual" activeId={tooltip} setActiveId={setTooltip} text="Normal = your base rate. Bronce/Silver/Gold are surge tiers, each $0.01 higher. Select whichever matches what Propio shows for this call." /></label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {RATES.map(r => { const active = activeRate === r.value; return (
                <button key={r.value} className="rate-btn" onClick={() => { setActiveRate(r.value); setManualForm(p => ({...p, pay: String(parseFloat((parseInt(p.duration||0) * r.value).toFixed(2)))})); }}
                  style={{padding:"8px 10px",borderRadius:8,border:"none",cursor:"pointer",background:active?`${r.color}22`:"var(--bg)",outline:active?`1px solid ${r.color}88`:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{color:r.color,fontSize:17}}>{r.icon}</span>
                  <div><div style={{fontWeight:800,fontSize:16,color:active?r.color:"var(--text)",fontFamily:"var(--mono)"}}>${r.value}/min</div><div style={{fontSize:14,color:"var(--text3)"}}>{r.label}</div></div>
                </button>
              );})}
            </div>
          </div>
          <div style={{marginBottom:12}}>
            <label style={CC.label}>Customer ID</label>
            <input type="text" placeholder="Optional" value={manualForm.customerId} onChange={e => handleManualChange("customerId", e.target.value)} style={{...CC.input,fontSize:17}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <TimePicker label="START TIME" value={manualForm.startTime} onChange={v => handleManualChange("startTime", v)}/>
            <TimePicker label="END TIME"    value={manualForm.endTime}   onChange={v => handleManualChange("endTime", v)}/>
          </div>
          <div style={{marginBottom:12}}>
            <label style={CC.label}>Minutes</label>
            <input type="number" placeholder="15" value={manualForm.duration} onChange={e => handleManualChange("duration", e.target.value)} style={{...CC.input,fontSize:18,fontFamily:"var(--mono)",fontWeight:700,color:"var(--cyan)"}}/>
          </div>
          <div style={{marginBottom:16}}>
            <label style={CC.label}>Pay ($)</label>
            <input type="number" step="0.01" value={manualForm.pay} onChange={e => setManualForm(p => ({...p, pay: e.target.value}))} style={{...CC.input,fontSize:22,fontFamily:"var(--mono)",fontWeight:800,color:"var(--green)",border:"1px solid var(--green)33"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn-primary" onClick={submitManual} style={{flex:1,background:"var(--green2)",border:"none",borderRadius:10,color:"var(--text)",padding:"12px",fontWeight:700,cursor:"pointer",fontSize:17}}>+ Add</button>
            <button onClick={() => { setShowManual(false); setLiveStart(null); }} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:10,color:"var(--text2)",padding:"12px 16px",cursor:"pointer"}}>✕</button>
          </div>
        </Modal>
      )}

      {/* Paste */}
      {showPaste && (
        <Modal onClose={() => { setShowPaste(false); setParsed(null); setRawText(""); }}>
          <div style={{fontSize:14,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>PASTE DATA</div>
          <div style={{fontSize:20,fontWeight:700,color:"var(--text)",marginBottom:16}}>Paste call</div>
          <div style={{marginBottom:14}}>
            <label style={CC.label}>Active rate</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {RATES.map(r => { const active = activeRate === r.value; return (
                <button key={r.value} className="rate-btn" onClick={() => setActiveRate(r.value)}
                  style={{padding:"8px 10px",borderRadius:8,border:"none",cursor:"pointer",background:active?`${r.color}22`:"var(--bg)",outline:active?`1px solid ${r.color}88`:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{color:r.color,fontSize:17}}>{r.icon}</span>
                  <div><div style={{fontWeight:800,fontSize:16,color:active?r.color:"var(--text)",fontFamily:"var(--mono)"}}>${r.value}/min</div><div style={{fontSize:14,color:"var(--text3)"}}>{r.label}</div></div>
                </button>
              );})}
            </div>
          </div>
          <label style={CC.label}>Call data</label>
          <textarea value={rawText} onChange={e => setRawText(e.target.value)} placeholder="191403/09/202608:17 AM3YesNo$0.36"
            style={{...CC.input,height:70,resize:"vertical",fontSize:16,fontFamily:"var(--mono)",marginBottom:8}}/>
          {parseError && <div style={{color:"var(--red)",fontSize:16,marginBottom:8}}>{parseError}</div>}
          {!parsed && <button className="btn-primary" onClick={handleParse} style={{width:"100%",background:"var(--cyan)",border:"none",borderRadius:10,color:"#000",padding:"11px",fontWeight:700,cursor:"pointer",fontSize:17}}>Parse</button>}
          {parsed && (
            <div style={{background:"var(--bg)",borderRadius:10,padding:14,border:`1px solid ${parsed.billable==="Yes"?"var(--green)44":"var(--red)44"}`}}>
              <div style={{fontWeight:700,color:parsed.billable==="Yes"?"var(--green)":"var(--red)",marginBottom:10,fontSize:17}}>{parsed.billable==="Yes"?"✅ Billable":"⛔ No Billable"}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
                {(() => {
                  const callEnd = timeToMins(parsed.callStart) !== null ? minsToTime(timeToMins(parsed.callStart) + parsed.duration) : "—";
                  return [["Customer",parsed.customerId],["Date",parsed.date],["Start",parsed.callStart],["End",callEnd],["Duration",`${parsed.duration}m`],["Pay",`$${parsed.pay.toFixed(2)}`]]
                    .map(([k, v]) => (
                      <div key={k}><div style={{fontSize:14,color:"var(--text3)"}}>{k}</div><div style={{fontWeight:700,fontSize:17,fontFamily:"var(--mono)",color:"var(--text)"}}>{v}</div></div>
                    ));
                })()}
              </div>
              {parsed.billable === "Yes"
                ? <button className="btn-primary" onClick={() => { handleAdd(); setShowPaste(false); }} style={{width:"100%",background:"var(--green2)",border:"none",borderRadius:9,color:"var(--text)",padding:"10px",fontWeight:700,cursor:"pointer",fontSize:17}}>➕ Add</button>
                : <button onClick={() => { setParsed(null); setRawText(""); }} style={{width:"100%",background:"transparent",border:"1px solid var(--border2)",borderRadius:9,color:"var(--text2)",padding:"10px",fontWeight:700,cursor:"pointer",fontSize:17}}>Discard</button>
              }
            </div>
          )}
        </Modal>
      )}

      {/* Edit */}
      {editingId && (
        <Modal onClose={() => { setEditingId(null); }}>
          <div style={{fontSize:14,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>EDIT CALL</div>
          <div style={{fontSize:20,fontWeight:700,color:"var(--text)",marginBottom:16}}>Edit call</div>
          <div style={{marginBottom:12}}>
            <label style={CC.label}>Customer ID</label>
            <input type="text" value={editForm.customerId||""} onChange={e => handleEditChange("customerId", e.target.value)} style={{...CC.input,fontSize:17}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <TimePicker label="START TIME" value={editForm.callStart} onChange={v => handleEditChange("callStart", v)}/>
            <TimePicker label="END TIME"    value={editForm.callEnd}   onChange={v => handleEditChange("callEnd", v)}/>
          </div>
          <div style={{marginBottom:12}}>
            <label style={CC.label}>Minutes</label>
            <input type="number" value={editForm.duration||""} onChange={e => handleEditChange("duration", e.target.value)} style={{...CC.input,fontSize:18,fontFamily:"var(--mono)",fontWeight:700,color:"var(--cyan)"}}/>
          </div>
          <div style={{marginBottom:16}}>
            <label style={CC.label}>Pay ($)</label>
            <input type="number" step="0.01" value={editForm.pay||""} onChange={e => setEditForm(p => ({...p, pay: e.target.value}))} style={{...CC.input,fontSize:22,fontFamily:"var(--mono)",fontWeight:800,color:"var(--green)",border:"1px solid var(--green)33"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn-primary" onClick={() => saveEdit(editingId)} style={{flex:1,background:"var(--cyan)",border:"none",borderRadius:10,color:"#000",padding:"12px",fontWeight:700,cursor:"pointer",fontSize:17}}>💾 Save</button>
            <button onClick={() => { setEditingId(null); }} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:10,color:"var(--text2)",padding:"12px 16px",cursor:"pointer"}}>✕</button>
          </div>
        </Modal>
      )}

      {/* Edit Cycles */}
      {showEditCycles && (
        <div onClick={() => setShowEditCycles(false)} style={{position:"fixed",inset:0,background:"rgba(10,10,20,0.75)",zIndex:400,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"20px 16px",overflowY:"auto"}}>
          <div onClick={e => e.stopPropagation()} style={{...CC.card,padding:24,width:"100%",maxWidth:420,animation:"slideUp .2s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{fontSize:14,color:"var(--text3)",fontWeight:700,letterSpacing:1}}>PAY CYCLES</div>
              <button onClick={() => setShowEditCycles(false)} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:20,lineHeight:1}}>✕</button>
            </div>
            <div style={{fontSize:20,fontWeight:700,color:"var(--text)",marginBottom:4}}>Edit cycles</div>
            <div style={{fontSize:14,color:"var(--text3)",marginBottom:16}}>{editingCycles.length} cycles · format MM/DD/YYYY</div>

            {/* Cycle list */}
            <div style={{maxHeight:400,overflowY:"auto",marginBottom:16,display:"flex",flexDirection:"column",gap:10}}>
              {editingCycles.map((c, i) => (
                <div key={i} style={{background:"var(--bg)",borderRadius:10,padding:"12px 14px",border:"1px solid var(--border)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <span style={{fontSize:14,fontWeight:700,color:"var(--text3)",letterSpacing:.5}}>CYCLE {i+1}</span>
                    <button onClick={() => setEditingCycles(prev => prev.filter((_, j) => j !== i))}
                      style={{background:"none",border:"none",color:"var(--red)",cursor:"pointer",fontSize:16,padding:"2px 6px"}}>🗑</button>
                  </div>
                  <div style={{display:"grid",gap:8}}>
                    {[["Start","start"],["End","end"],["Payday","payDate"]].map(([lbl, field]) => (
                      <div key={field}>
                        <label style={{...CC.label,marginBottom:3}}>{lbl}</label>
                        <input
                          type="text"
                          placeholder="MM/DD/YYYY"
                          value={c[field]}
                          onChange={e => setEditingCycles(prev => prev.map((cy, j) => j === i ? {...cy, [field]: e.target.value} : cy))}
                          style={{...CC.input,fontSize:16,fontFamily:"var(--mono)"}}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Add cycle */}
            <button onClick={() => setEditingCycles(prev => [...prev, { start:"", end:"", payDate:"" }])}
              style={{width:"100%",background:"var(--bg)",border:"2px dashed var(--border2)",borderRadius:10,color:"var(--text2)",padding:"11px",fontWeight:600,cursor:"pointer",fontSize:16,marginBottom:16}}>
              + Add cycle
            </button>

            {/* Actions */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <button onClick={() => {
                const reset = PAY_CYCLES.map(c => ({...c}));
                setEditingCycles(reset);
              }} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:10,color:"var(--text3)",padding:"11px",fontWeight:600,cursor:"pointer",fontSize:15}}>
                ↺ Reset default
              </button>
              <button className="btn-primary" onClick={() => {
                // Validate: all fields filled and parseable
                const valid = editingCycles.every(c => c.start && c.end && c.payDate && toDate(c.start) && toDate(c.end) && toDate(c.payDate));
                if (!valid) { showToast("⚠️ Check all dates (MM/DD/YYYY)"); return; }
                setCustomCycles(editingCycles);
                try { localStorage.setItem(STORAGE_CYCLES, JSON.stringify(editingCycles)); } catch {}
                setShowEditCycles(false);
                showToast("✅ Cycles saved");
              }} style={{background:"var(--green2)",border:"none",borderRadius:10,color:"#fff",padding:"11px",fontWeight:700,cursor:"pointer",fontSize:15}}>
                💾 Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page content ─────────────────────────────────────────────────── */}
      <div style={{padding:"16px 20px 0"}}>

        {/* HOME */}
        {tab === "home" && (
          <div>
            {/* Main card */}
            <div style={{...CC.cardGlow("var(--cyan)"),padding:24,marginBottom:12}} className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                <div>
                  <div style={{fontSize:14,color:"var(--text3)",fontWeight:700,letterSpacing:1}}>EARNINGS TODAY</div>
                  <div style={{fontSize:48,fontWeight:800,fontFamily:"var(--mono)",color:"var(--green)",lineHeight:1,marginTop:4}}>${todayMoney.toFixed(2)}</div>
                  <div style={{marginTop:10}}>
                    {minsGoalReached
                      ? <div style={{fontSize:18,fontWeight:900,fontFamily:"var(--mono)",color:"var(--green)"}}>✓ Minute goal reached</div>
                      : <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                          <div style={{fontSize:36,fontWeight:900,fontFamily:"var(--mono)",color:"var(--cyan)",lineHeight:1}}>{minsLeft}</div>
                          <div style={{fontSize:17,fontWeight:700,color:"var(--cyan)"}}>min remaining</div>
                        </div>
                    }
                    <div style={{fontSize:15,color:"var(--text3)",marginTop:4,fontFamily:"var(--mono)"}}>{todayCalls.length} calls · {todayMins}/{minsNeeded} min done</div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:14,color:"var(--text3)",marginBottom:4}}>GOAL</div>
                  <div style={{fontSize:22,fontWeight:800,fontFamily:"var(--mono)",color:moneyPct>=100?"var(--green)":"var(--amber)"}}>{moneyPct}%</div>
                  <div style={{fontSize:15,color:"var(--text3)"}}>of ${config.dailyMoneyGoal}</div>
                </div>
              </div>
              <div style={{background:"var(--bg)",borderRadius:99,height:6,overflow:"hidden"}}>
                <div style={{width:`${moneyPct}%`,height:"100%",background:"linear-gradient(90deg,var(--cyan),var(--green))",borderRadius:99,transition:"width .6s ease",boxShadow:moneyPct>0?"0 0 8px var(--cyan)66":"none"}}/>
              </div>
              {/* Idle cost */}
              <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:14,color:"var(--text3)",fontWeight:700,letterSpacing:1}}>IDLE</div>
                <div style={{fontFamily:"var(--mono)",fontWeight:900,fontSize:22,color:"var(--red)"}}>-${(idleSecs / 60 * (config.baseRate ?? 0.12)).toFixed(2)}</div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
              {[
                { label: liveActive ? "⏹️ Stop" : "🔴 Live", active: liveActive, color:"var(--green)",  action: () => liveActive ? stopLiveCall() : startLiveCall() },
                { label: "✍️ Manual",                             active: false,       color:"var(--cyan)",   action: () => { setShowManual(true); } },
                { label: "📋 Paste",                              active: false,       color:"var(--purple)", action: () => { setShowPaste(true); } },
              ].map(btn => (
                <button key={btn.label} className="action-btn" onClick={btn.action} style={{padding:"16px 8px",borderRadius:14,border:`1px solid ${btn.active?btn.color:"var(--border)"}`,cursor:"pointer",background:btn.active?`${btn.color}11`:"var(--bg2)",color:btn.active?btn.color:"var(--text)",fontWeight:700,fontSize:16,display:"flex",flexDirection:"column",alignItems:"center",gap:6,boxShadow:btn.active?`0 0 14px ${btn.color}22`:"none",transition:"all .15s"}}>
                  <span style={{fontSize:22}}>{btn.label.split(" ")[0]}</span>
                  <span style={{fontSize:14}}>{btn.label.split(" ").slice(1).join(" ")}</span>
                </button>
              ))}
            </div>

            {/* Today's calls */}
            <div style={{...CC.card,padding:20}} className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontWeight:700,color:"var(--text)",fontSize:17}}>Today's calls</div>
                <div style={{fontSize:16,fontFamily:"var(--mono)",color:"var(--text2)"}}>{todayCalls.length}</div>
              </div>
              {todayCalls.length === 0 && (
                <div style={{textAlign:"center",padding:"28px 16px",color:"var(--text3)"}}>
                  <div style={{fontSize:36,marginBottom:12}}>📞</div>
                  <div style={{fontSize:17,fontWeight:700,color:"var(--text2)",marginBottom:8}}>No calls yet today</div>
                  <div style={{fontSize:15,lineHeight:1.6,marginBottom:16}}>
                    Tap <strong style={{color:"var(--red)"}}>🔴 Live</strong> before your next call,<br/>
                    or use <strong style={{color:"var(--cyan)"}}>✍️ Manual</strong> to enter one you already took.
                  </div>
                  <div style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",display:"inline-block",fontSize:14,color:"var(--text3)"}}>
                    💡 You can also paste a line from Propio using <strong style={{color:"var(--text2)"}}>📋 Paste</strong>
                  </div>
                </div>
              )}
              {todayCalls.map((c, i) => (
                <div key={c.id} className="call-row" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 8px",borderRadius:10,marginBottom:2,background:"transparent",borderTop:i>0?"1px solid var(--border)":"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:30,height:30,borderRadius:7,background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontFamily:"var(--mono)",color:"var(--text3)",fontWeight:700,border:"1px solid var(--border)",flexShrink:0}}>{i+1}</div>
                    <div>
                      <div style={{fontWeight:600,fontSize:17}}>#{c.customerId}</div>
                      <div style={{fontSize:15,color:"var(--text2)",fontFamily:"var(--mono)"}}>{c.callStart} · {c.duration}m</div>
                    </div>
                    {isSurge(c, config.baseRate) && (
                      <span style={{display:"inline-flex",alignItems:"center",gap:3}}>
                        <span style={{fontSize:12,background:"#fef3c7",color:"var(--amber)",padding:"2px 7px",borderRadius:6,border:"1px solid var(--amber)44",fontWeight:700}}>⚡ SURGE</span>
                        <InfoTip id={`surge-${c.id}`} activeId={tooltip} setActiveId={setTooltip} text={`This call's rate ($${(c.pay/c.duration).toFixed(4)}/min) is above your base rate ($${(config.baseRate??0.12).toFixed(2)}/min) — it counted as a surge hour.`}/>
                      </span>
                    )}
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <div style={{fontWeight:800,fontSize:17,fontFamily:"var(--mono)",color:"var(--green)"}}>${c.pay.toFixed(2)}</div>
                    <button onClick={() => startEdit(c)} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:17,padding:3}}>✏️</button>
                    <button onClick={() => handleDelete(c.id)} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:17,padding:3}}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STATS */}
        {tab === "perf" && (
          <div>
            {/* Score */}
            <div style={{...CC.cardGlow(scoreColor),padding:24,marginBottom:12,textAlign:"center"}} className="card">
              <div style={{fontSize:14,color:"var(--text3)",fontWeight:700,letterSpacing:1.5,marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                DAY SCORE
                <InfoTip id="score" activeId={tooltip} setActiveId={setTooltip}
                  text="Score out of 100: Goal (40pts) — how close you are to your daily earnings goal. Rhythm (30pts) — how tight your gap between calls is. Streak (20pts) — consecutive active days. Active (10pts) — whether you've taken calls today." />
              </div>
              <div style={{fontSize:72,fontWeight:900,fontFamily:"var(--mono)",color:scoreColor,lineHeight:1}}>{score}</div>
              <div style={{fontSize:17,color:scoreColor,fontWeight:600,marginTop:6,letterSpacing:.5}}>{scoreLabel}</div>
              <div style={{marginTop:14,background:"var(--bg)",borderRadius:99,height:6,overflow:"hidden"}}>
                <div style={{width:`${score}%`,height:"100%",background:scoreColor,borderRadius:99,transition:"width .6s",boxShadow:`0 0 8px ${scoreColor}66`}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginTop:14}}>
                {[["Goal",Math.round(scoreGoal),40,"var(--green)"],["Rhythm",Math.round(scoreRhythm),30,"var(--cyan)"],["Streak",Math.round(scoreStreak),20,"var(--amber)"],["Active",Math.round(scoreHours),10,"var(--purple)"]].map(([l,v,max,c]) => (
                  <div key={l} style={{background:"var(--bg)",borderRadius:8,padding:"8px 4px"}}>
                    <div style={{fontSize:17,fontWeight:800,fontFamily:"var(--mono)",color:c}}>{v}<span style={{fontSize:12,color:"var(--text3)"}}>/{max}</span></div>
                    <div style={{fontSize:14,color:"var(--text3)",marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparisons */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              {[["vs Yesterday",todayMoney,yestMoney,weekMins,yestMins],["vs Last week",weekMoney,lwMoney,weekMins,lwMins]].map(([label,curM,prevM,curMin,prevMin]) => {
                const diffM = curM - prevM, diffMin = curMin - prevMin, up = diffM >= 0;
                return (
                  <div key={label} style={{...CC.card,padding:14}} className="card">
                    <div style={{fontSize:14,color:"var(--text3)",fontWeight:700,letterSpacing:.8,marginBottom:8}}>{label.toUpperCase()}</div>
                    <div style={{fontSize:22,fontWeight:800,fontFamily:"var(--mono)",color:up?"var(--green)":"var(--red)"}}>{up?"+":""}{diffM.toFixed(2)}<span style={{fontSize:15}}>$</span></div>
                    <div style={{fontSize:15,fontFamily:"var(--mono)",color:diffMin>=0?"var(--cyan)":"var(--red)",marginTop:2}}>{diffMin>=0?"+":""}{diffMin}m</div>
                    <div style={{fontSize:14,color:"var(--text3)",marginTop:6}}>prev: ${prevM.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>

            {/* Cycle projection */}
            {currentCycle && (
              <div style={{...CC.cardGlow("var(--amber)"),padding:20,marginBottom:12}} className="card">
                <div style={{fontSize:14,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4,display:"flex",alignItems:"center",gap:4}}>
                  CYCLE PROJECTION
                  <InfoTip id="projection" activeId={tooltip} setActiveId={setTooltip} text="Estimated total earnings by end of this pay cycle, based on your average daily pace so far." />
                </div>
                <div style={{fontSize:36,fontWeight:900,fontFamily:"var(--mono)",color:"var(--amber)"}}>${projection !== null ? projection.toFixed(2) : "--"}</div>
                <div style={{fontSize:15,color:"var(--text2)",marginTop:2}}>At this rate by end of cycle</div>
              </div>
            )}

            {/* Rhythm */}
            {(() => {
              const b2b      = allGaps.filter(g => g === 0);
              const onTarget = allGaps.filter(g => g <= 5);
              const mid      = allGaps.filter(g => g > 5 && g <= 15);
              const slow     = allGaps.filter(g => g > 15);
              const total    = allGaps.length;
              const pctGreen = total ? Math.round((onTarget.length / total) * 100) : 0;
              const pctAmber = total ? Math.round((mid.length      / total) * 100) : 0;
              const pctRed   = total ? 100 - pctGreen - pctAmber               : 0;
              const gapsWithCtx = allGaps.map((gap, i) => ({
                gap,
                from: sortedToday[i]?.callStart   || "",
                to:   sortedToday[i+1]?.callStart || "",
              }));
              const top3 = [...gapsWithCtx].sort((a, b) => b.gap - a.gap).slice(0, 3).filter(g => g.gap > 5);

              // Cycle history data
              const cycleRhythmDays = (() => {
                if (!currentCycle) return [];
                const s = toDate(currentCycle.start), e = toDate(currentCycle.end);
                const days = [];
                for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
                  const mm = String(d.getMonth()+1).padStart(2,"0");
                  const dd = String(d.getDate()).padStart(2,"0");
                  const ds = `${mm}/${dd}/${d.getFullYear()}`;
                  const dayCalls = (byDate[ds] || []);
                  if (dayCalls.length < 2) continue;
                  const sorted = [...dayCalls].sort((a, b) => (timeToMins(a.callStart)||0) - (timeToMins(b.callStart)||0));
                  const gaps = [];
                  for (let i = 1; i < sorted.length; i++) {
                    const mA = timeToMins(sorted[i-1].callStart), mB = timeToMins(sorted[i].callStart);
                    if (mA !== null && mB !== null && mB > mA) {
                      const g = (mB - mA) - sorted[i-1].duration;
                      if (g >= 0) gaps.push(g);
                    }
                  }
                  if (!gaps.length) continue;
                  const avg = Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length);
                  const pct = Math.round((gaps.filter(g => g <= 5).length / gaps.length) * 100);
                  days.push({ ds, label: `${mm}/${dd}`, avg, pct, gaps: gaps.length, isToday: ds === todayStr });
                }
                return days;
              })();

              return (
                <div style={{...CC.card,padding:20,marginBottom:12}} className="card">
                  {/* Header with toggle */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <div style={{fontSize:17,fontWeight:700,color:"var(--text)"}}>Call rhythm</div>
                    <div style={{display:"flex",gap:4,background:"var(--bg)",borderRadius:8,padding:3}}>
                      {[["today","Today"],["cycle","Cycle"]].map(([v,l]) => (
                        <button key={v} onClick={() => setRhythmView(v)}
                          style={{fontSize:14,fontWeight:700,padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",
                            background: rhythmView===v ? "var(--cyan)" : "transparent",
                            color: rhythmView===v ? "#000" : "var(--text3)",
                            transition:"all .15s"}}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* HOY */}
                  {rhythmView === "today" && (
                    <>
                      <div style={{fontSize:14,color:"var(--text3)",marginBottom:10}}>goal: <span style={{color:"var(--green)",fontWeight:700}}>≤5 min</span></div>
                      {total === 0 ? (
                        <div style={{textAlign:"center",padding:"20px 0",color:"var(--text3)",fontSize:17}}>
                          <div style={{fontSize:28,marginBottom:6}}>📞</div>
                          You need at least 2 calls
                        </div>
                      ) : (
                        <>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
                            <div style={{background:"var(--bg)",borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
                              <div style={{fontSize:22,fontWeight:900,fontFamily:"var(--mono)",color:avgGap<=5?"var(--green)":avgGap<=15?"var(--amber)":"var(--red)",lineHeight:1}}>{avgGap}m</div>
                              <div style={{fontSize:12,color:"var(--text3)",marginTop:4,fontWeight:600,letterSpacing:.5}}>AVG</div>
                            </div>
                            <div style={{background:"var(--bg)",borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
                              <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:4}}>
                                <div style={{fontSize:22,fontWeight:900,fontFamily:"var(--mono)",color:"var(--green)",lineHeight:1}}>B2B</div>
                                {b2b.length > 0 && <div style={{fontSize:16,fontWeight:700,fontFamily:"var(--mono)",color:"var(--green)"}}>×{b2b.length}</div>}
                              </div>
                              <div style={{fontSize:12,color:"var(--text3)",marginTop:4,fontWeight:600,letterSpacing:.5}}>{b2b.length === 0 ? "NINGUNO" : "BACK TO BACK"}</div>
                            </div>
                            <div style={{background:"var(--bg)",borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
                              <div style={{fontSize:22,fontWeight:900,fontFamily:"var(--mono)",color:"var(--text2)",lineHeight:1}}>{total}</div>
                              <div style={{fontSize:12,color:"var(--text3)",marginTop:4,fontWeight:600,letterSpacing:.5}}>GAPS</div>
                            </div>
                          </div>
                          <div style={{marginBottom:10}}>
                            <div style={{display:"flex",borderRadius:99,overflow:"hidden",height:10,gap:1}}>
                              {pctGreen > 0 && <div style={{flex:pctGreen,background:"var(--green)",opacity:.8}}/>}
                              {pctAmber > 0 && <div style={{flex:pctAmber,background:"var(--amber)",opacity:.8}}/>}
                              {pctRed   > 0 && <div style={{flex:pctRed,  background:"var(--red)",  opacity:.8}}/>}
                            </div>
                            <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                              {[[onTarget.length,"≤5m","var(--green)"],[mid.length,"6–15m","var(--amber)"],[slow.length,">15m","var(--red)"]].map(([count,label,color]) => (
                                <div key={label} style={{display:"flex",alignItems:"center",gap:4}}>
                                  <div style={{width:7,height:7,borderRadius:2,background:color,opacity:.8}}/>
                                  <span style={{fontSize:14,color:"var(--text2)",fontFamily:"var(--mono)"}}>{count} <span style={{color:"var(--text3)"}}>{label}</span></span>
                                </div>
                              ))}
                              <div style={{fontSize:14,color:pctGreen>=70?"var(--green)":pctGreen>=40?"var(--amber)":"var(--red)",fontWeight:700}}>{pctGreen}% on target</div>
                            </div>
                          </div>
                          {top3.length > 0 && (
                            <div style={{borderTop:"1px solid var(--border)",paddingTop:12,marginTop:4}}>
                              <div style={{fontSize:14,color:"var(--text3)",fontWeight:700,letterSpacing:.8,marginBottom:8}}>LONGEST GAPS</div>
                              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                                {top3.map((g, i) => (
                                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                    <div style={{fontSize:15,color:"var(--text2)",fontFamily:"var(--mono)"}}>{g.from} → {g.to}</div>
                                    <div style={{fontSize:16,fontWeight:800,fontFamily:"var(--mono)",color:g.gap<=15?"var(--amber)":"var(--red)"}}>{g.gap}m</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {/* CICLO */}
                  {rhythmView === "cycle" && (
                    <>
                      {cycleRhythmDays.length === 0 ? (
                        <div style={{textAlign:"center",padding:"20px 0",color:"var(--text3)",fontSize:17}}>
                          <div style={{fontSize:28,marginBottom:6}}>📅</div>
                          No rhythm data for this cycle
                        </div>
                      ) : (
                        <>
                          {/* Summary row for the cycle */}
                          {(() => {
                            const allCycleGaps = cycleRhythmDays.flatMap(d => Array(d.gaps).fill(d.avg)); // approximation
                            const cycleAvg = Math.round(cycleRhythmDays.reduce((s, d) => s + d.avg, 0) / cycleRhythmDays.length);
                            const cyclePct = Math.round(cycleRhythmDays.reduce((s, d) => s + d.pct, 0) / cycleRhythmDays.length);
                            return (
                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                                <div style={{background:"var(--bg)",borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
                                  <div style={{fontSize:22,fontWeight:900,fontFamily:"var(--mono)",color:cycleAvg<=5?"var(--green)":cycleAvg<=15?"var(--amber)":"var(--red)",lineHeight:1}}>{cycleAvg}m</div>
                                  <div style={{fontSize:12,color:"var(--text3)",marginTop:4,fontWeight:600,letterSpacing:.5}}>CYCLE AVG</div>
                                </div>
                                <div style={{background:"var(--bg)",borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
                                  <div style={{fontSize:22,fontWeight:900,fontFamily:"var(--mono)",color:cyclePct>=70?"var(--green)":cyclePct>=40?"var(--amber)":"var(--red)",lineHeight:1}}>{cyclePct}%</div>
                                  <div style={{fontSize:12,color:"var(--text3)",marginTop:4,fontWeight:600,letterSpacing:.5}}>ON TARGET</div>
                                </div>
                                <div style={{background:"var(--bg)",borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
                                  <div style={{fontSize:22,fontWeight:900,fontFamily:"var(--mono)",color:"var(--text2)",lineHeight:1}}>{cycleRhythmDays.length}</div>
                                  <div style={{fontSize:12,color:"var(--text3)",marginTop:4,fontWeight:600,letterSpacing:.5}}>DAYS WITH DATA</div>
                                </div>
                              </div>
                            );
                          })()}
                          {/* Per-day rows */}
                          <div style={{borderTop:"1px solid var(--border)",paddingTop:10}}>
                            {[...cycleRhythmDays].reverse().map((d, i) => (
                              <div key={d.ds} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderTop:i>0?"1px solid var(--border)":"none"}}>
                                <div style={{display:"flex",alignItems:"center",gap:8}}>
                                  <span style={{fontSize:15,fontFamily:"var(--mono)",color:d.isToday?"var(--cyan)":"var(--text2)",fontWeight:d.isToday?700:400}}>{d.label}</span>
                                  {d.isToday && <span style={{fontSize:12,background:"var(--cyan)22",color:"var(--cyan)",padding:"1px 6px",borderRadius:4,fontWeight:700}}>HOY</span>}
                                </div>
                                <div style={{display:"flex",alignItems:"center",gap:12}}>
                                  {/* Mini bar */}
                                  <div style={{width:60,height:5,borderRadius:99,background:"var(--bg3)",overflow:"hidden"}}>
                                    <div style={{width:`${d.pct}%`,height:"100%",background:d.pct>=70?"var(--green)":d.pct>=40?"var(--amber)":"var(--red)",borderRadius:99}}/>
                                  </div>
                                  <span style={{fontSize:15,fontFamily:"var(--mono)",color:"var(--text3)",minWidth:28,textAlign:"right"}}>{d.pct}%</span>
                                  <span style={{fontSize:16,fontFamily:"var(--mono)",fontWeight:700,color:d.avg<=5?"var(--green)":d.avg<=15?"var(--amber)":"var(--red)",minWidth:28,textAlign:"right"}}>{d.avg}m</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

            <HeatmapCard heatmap={heatmap} maxHeat={maxHeat} scope={heatmapScope} setScope={setHeatmapScope} cycles={activeCycles}/>

            {/* Streak — cycle focused */}
            {(() => {
              if (!currentCycle) return null;

              // Build list of all days in cycle (as dateStr MM/DD/YYYY)
              const cycleStart  = toDate(currentCycle.start);
              const cycleEnd    = toDate(currentCycle.end);
              const cycleDays   = [];
              for (let d = new Date(cycleStart); d <= cycleEnd; d.setDate(d.getDate()+1)) {
                const mm = String(d.getMonth()+1).padStart(2,"0");
                const dd = String(d.getDate()).padStart(2,"0");
                const yyyy = d.getFullYear();
                cycleDays.push(`${mm}/${dd}/${yyyy}`);
              }
              const totalDays   = cycleDays.length;
              const daysLeft    = Math.max(0, daysUntil(currentCycle.end));
              const daysPassed  = totalDays - daysLeft;

              // Active days & streak within cycle
              const cycleActive = cycleDays.filter(d => !!byDate[d]);
              const activeCount = cycleActive.length;

              // Streak = consecutive active days ending today (within cycle)
              let cycleStreak = 0;
              for (let i = daysPassed - 1; i >= 0; i--) {
                if (byDate[cycleDays[i]]) cycleStreak++;
                else break;
              }

              // Goal hit: days where total pay >= dailyGoal
              const dailyGoal   = config.dailyMoneyGoal || 30;
              const goalDays    = cycleActive.filter(d =>
                (byDate[d] || []).reduce((s, c) => s + c.pay, 0) >= dailyGoal
              ).length;
              const goalPct     = activeCount > 0 ? Math.round((goalDays / activeCount) * 100) : 0;
              const goalColor   = goalPct >= 75 ? "var(--green)" : goalPct >= 50 ? "var(--amber)" : "var(--red)";

              return (
                <div style={{...CC.card,padding:20,marginBottom:12}} className="card">
                  <div style={{fontSize:17,fontWeight:700,color:"var(--text)",marginBottom:14}}>Cycle streak</div>

                  {/* 3 stats */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
                    {[
                      ["Current streak", cycleStreak > 0 ? `${cycleStreak}d 🔥` : "0d", "var(--amber)"],
                      ["Active days", `${activeCount}/${totalDays}`, "var(--cyan2)"],
                      ["Days remaining", `${daysLeft}d`, daysLeft <= 2 ? "var(--red)" : "var(--text2)"],
                    ].map(([label, val, color]) => (
                      <div key={label} style={{background:"var(--bg)",borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
                        <div style={{fontSize:19,fontWeight:900,fontFamily:"var(--mono)",color,lineHeight:1}}>{val}</div>
                        <div style={{fontSize:12,color:"var(--text3)",marginTop:4,fontWeight:600,letterSpacing:.3,textTransform:"uppercase"}}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Goal compliance bar */}
                  <div style={{marginBottom:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
                      <span style={{fontSize:15,color:"var(--text2)",fontWeight:500}}>Daily goal compliance</span>
                      <span style={{fontSize:16,fontWeight:700,fontFamily:"var(--mono)",color:goalColor}}>{goalDays}/{activeCount} days</span>
                    </div>
                    <div style={{background:"var(--bg)",borderRadius:99,height:8,overflow:"hidden"}}>
                      <div style={{width:`${goalPct}%`,height:"100%",borderRadius:99,background:goalColor,transition:"width .4s"}}/>
                    </div>
                    <div style={{fontSize:14,color:"var(--text3)",marginTop:4}}>
                      {activeCount === 0 ? "No active days yet" : `${goalPct}% of active days you reached $${dailyGoal}`}
                    </div>
                  </div>

                  {/* Day chips */}
                  <div style={{fontSize:14,fontWeight:700,color:"var(--text3)",letterSpacing:.8,textTransform:"uppercase",marginBottom:8}}>Cycle days</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                    {cycleDays.map((d, i) => {
                      const isToday  = d === todayStr;
                      const isFuture = d > todayStr;
                      const isActive = !!byDate[d];
                      const dayPay   = (byDate[d] || []).reduce((s, c) => s + c.pay, 0);
                      const isGoal   = isActive && dayPay >= dailyGoal;
                      const dayNum   = parseInt(d.slice(3,5));

                      const bg = isGoal   ? "color-mix(in srgb, var(--green) 15%, transparent)"  :
                                 isActive ? "color-mix(in srgb, var(--cyan) 12%, transparent)"  : "var(--bg)";
                      const borderStyle = isToday
                        ? `2px solid var(--amber)`
                        : isGoal   ? "1px solid var(--green)"
                        : isActive ? "1px solid var(--cyan2)"
                        :            "1px solid var(--border)";
                      const textColor = isGoal   ? "var(--green)"  :
                                        isActive  ? "var(--cyan2)"  :
                                        isToday   ? "var(--amber)"  : "var(--text3)";
                      return (
                        <div key={d} title={isActive ? `$${dayPay.toFixed(2)}` : d}
                          style={{
                            width:28, height:28, borderRadius:6,
                            background:bg, border:borderStyle,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontFamily:"var(--mono)", fontSize:12, fontWeight:700,
                            color:textColor, opacity: isFuture ? 0.35 : 1,
                            cursor:"default",
                          }}>
                          {dayNum}
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div style={{display:"flex",gap:12,marginTop:12,flexWrap:"wrap"}}>
                    {[
                      ["Goal reached", "color-mix(in srgb, var(--green) 25%, transparent)", "1px solid var(--green)"],
                      ["Active", "color-mix(in srgb, var(--cyan) 12%, transparent)",  "1px solid var(--cyan2)"],
                      ["No activity", "var(--bg)",           "1px solid var(--border)"],
                      ["Today", "transparent",         "2px solid var(--amber)"],
                    ].map(([label, bg, border]) => (
                      <div key={label} style={{display:"flex",alignItems:"center",gap:5}}>
                        <div style={{width:10,height:10,borderRadius:3,background:bg,border}}/>
                        <span style={{fontSize:14,color:"var(--text3)"}}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* WEEK */}
        {tab === "week" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              <StatBox label="Week minutes"  value={`${weekMins}m`}             color="var(--cyan)"/>
              <StatBox label="Week earnings" value={`$${weekMoney.toFixed(2)}`} color="var(--green)"/>
            </div>
            <div style={{...CC.card,padding:20}} className="card">
              <div style={{fontWeight:700,marginBottom:16,fontSize:17}}>Minutes per day</div>
              {weekData.map(d => (
                <div key={d.date} style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:16,marginBottom:6}}>
                    <span style={{color:d.date===todayStr?"var(--cyan)":"var(--text2)",fontWeight:d.date===todayStr?700:400,fontFamily:"var(--mono)"}}>{d.label}{d.date===todayStr?" ←":""}</span>
                    <span style={{fontFamily:"var(--mono)"}}><span style={{color:"var(--cyan)"}}>{d.mins}m</span> · <span style={{color:"var(--green)"}}>${d.money.toFixed(2)}</span></span>
                  </div>
                  <div style={{background:"var(--bg)",borderRadius:99,height:6}}>
                    <div style={{width:`${(d.mins/maxMins)*100}%`,height:"100%",background:d.date===todayStr?"var(--cyan)":"var(--border2)",borderRadius:99,transition:"width .4s"}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CYCLE */}
        {tab === "cycle" && (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{display:"flex",gap:8}}>
                <Pill active={cycleView==="current"} onClick={() => setCycleView("current")}>Current cycle</Pill>
                <Pill active={cycleView==="all"}     onClick={() => setCycleView("all")}>All</Pill>
              </div>
              <button onClick={() => { setEditingCycles(activeCycles.map(c => ({...c}))); setShowEditCycles(true); }}
                style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:8,color:"var(--text2)",padding:"6px 12px",cursor:"pointer",fontSize:15,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
                ✏️ Edit
              </button>
            </div>
            {cycleView === "current" && (!currentCycle
              ? <div style={{color:"var(--text3)",fontSize:17,textAlign:"center",padding:"32px 0"}}>No active cycle.</div>
              : (() => {
                  const stats    = getCycleStats(currentCycle, billableCalls);
                  const daysLeft = daysUntil(currentCycle.end), dtp = daysUntil(currentCycle.payDate);
                  const s = toDate(currentCycle.start), e = toDate(currentCycle.end);
                  const total  = Math.round((e - s) / 86400000) + 1;
                  const passed = total - Math.max(daysLeft, 0);
                  const pct    = Math.min(100, Math.round((passed / total) * 100));
                  return (
                    <div>
                      <div style={{...CC.cardGlow("var(--cyan)"),padding:20,marginBottom:12}} className="card">
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                          <div>
                            <div style={{fontSize:14,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>PERIOD</div>
                            <div style={{fontWeight:700,fontSize:17,color:"var(--cyan)",fontFamily:"var(--mono)"}}>{currentCycle.start} → {currentCycle.end}</div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:14,color:"var(--text3)"}}>PAYDAY</div>
                            <div style={{fontWeight:700,color:"var(--amber)",fontFamily:"var(--mono)",fontSize:17}}>{currentCycle.payDate}</div>
                          </div>
                        </div>
                        <div style={{background:"var(--bg)",borderRadius:99,height:6,overflow:"hidden",marginBottom:6}}>
                          <div style={{width:`${pct}%`,height:"100%",background:"linear-gradient(90deg,var(--cyan),var(--green))",borderRadius:99}}/>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:15,color:"var(--text3)",fontFamily:"var(--mono)"}}>
                          <span>Day {passed}/{total}</span>
                          <span>{daysLeft > 0 ? `${daysLeft}d remaining` : "Closed"}</span>
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                        <StatBox label="Minutes"       value={`${stats.mins}m`}             color="var(--cyan)"/>
                        <StatBox label="Earned"        value={`$${stats.money.toFixed(2)}`} color="var(--green)"/>
                        <StatBox label="Calls"      value={stats.count}                  color="var(--amber)"/>
                        <StatBox label="Days to pay" value={Math.max(dtp, 0)}             color="var(--purple)"/>
                      </div>
                    </div>
                  );
                })()
            )}
            {cycleView === "all" && activeCycles.map((cycle, i) => {
              const stats     = getCycleStats(cycle, billableCalls);
              const isCurrent = currentCycle && cycle.start === currentCycle.start;
              const isPast    = toDate(cycle.end) < new Date();
              const dtp       = daysUntil(cycle.payDate);
              return (
                <div key={i} style={{...CC.card,padding:16,marginBottom:8,border:`1px solid ${isCurrent?"var(--cyan)44":"var(--border)"}`,opacity:isPast&&!isCurrent?0.5:1}} className="card">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      {isCurrent && <span style={{fontSize:12,background:"var(--cyan)22",color:"var(--cyan)",padding:"2px 8px",borderRadius:6,marginBottom:6,display:"inline-block",fontWeight:700}}>CURRENT</span>}
                      <div style={{fontSize:16,fontWeight:700,fontFamily:"var(--mono)",color:isCurrent?"var(--cyan)":"var(--text)"}}>{cycle.start} → {cycle.end}</div>
                      <div style={{fontSize:15,color:"var(--amber)",marginTop:2,fontFamily:"var(--mono)"}}>{cycle.payDate}{!isPast&&dtp>0&&<span style={{color:"var(--text3)",marginLeft:6}}>({dtp}d)</span>}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontWeight:800,fontFamily:"var(--mono)",color:"var(--green)",fontSize:17}}>${stats.money.toFixed(2)}</div>
                      <div style={{fontSize:15,color:"var(--text3)",fontFamily:"var(--mono)"}}>{stats.mins}m · {stats.count}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* HISTORY */}
        {tab === "history" && (
          <div>
            {sortedDates.length === 0 && (
              <div style={{textAlign:"center",padding:"48px 0",color:"var(--text3)"}}>
                <div style={{fontSize:32,marginBottom:8}}>📭</div>
                <div>No history yet</div>
              </div>
            )}
            {sortedDates.map(date => {
              const dayCalls   = calls.filter(c => c.date === date);
              const bil        = dayCalls.filter(c => c.billable === "Yes");
              const mins       = bil.reduce((s, c) => s + c.duration, 0);
              const money      = bil.reduce((s, c) => s + c.pay, 0);
              const surgeCount = bil.filter(c => isSurge(c, config.baseRate)).length;
              const isOpen     = expandedDays.has(date);
              const toggle     = () => setExpandedDays(prev => { const next = new Set(prev); isOpen ? next.delete(date) : next.add(date); return next; });
              return (
                <div key={date} style={{...CC.card,padding:0,marginBottom:8,overflow:"hidden"}} className="card">
                  <div onClick={toggle} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",cursor:"pointer",userSelect:"none"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:17,color:"var(--text3)",transition:"transform .2s",display:"inline-block",transform:isOpen?"rotate(90deg)":"rotate(0deg)"}}>▶</span>
                      <span style={{fontWeight:700,fontSize:17,fontFamily:"var(--mono)",color:"var(--text)"}}>{date}</span>
                      {surgeCount > 0 && <span style={{fontSize:12,background:"#fef3c7",color:"var(--amber)",padding:"2px 7px",borderRadius:6,fontWeight:700}}>⚡{surgeCount}</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <span style={{fontSize:15,color:"var(--text3)",fontFamily:"var(--mono)"}}>{dayCalls.length} calls</span>
                      <span style={{fontSize:16,fontFamily:"var(--mono)",color:"var(--cyan)"}}>{mins}m</span>
                      <span style={{fontSize:17,fontFamily:"var(--mono)",fontWeight:700,color:"var(--green)"}}>${money.toFixed(2)}</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{borderTop:"1px solid var(--border)"}}>
                      {dayCalls.map((c, i) => (
                        <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",borderTop:i>0?"1px solid var(--border)":"none",fontSize:16,background:"var(--bg)"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontWeight:600,fontFamily:"var(--mono)",color:"var(--text2)"}}>{c.customerId}</span>
                            <span style={{color:"var(--text3)",fontFamily:"var(--mono)"}}>{c.callStart}</span>
                            {isSurge(c, config.baseRate) && <span style={{fontSize:12,background:"#fef3c7",color:"var(--amber)",padding:"1px 6px",borderRadius:4,border:"1px solid var(--amber)44",fontWeight:700}}>⚡ SURGE</span>}
                            {c.billable !== "Yes" && <span style={{fontSize:12,background:"var(--red)22",color:"var(--red)",padding:"1px 6px",borderRadius:4}}>NB</span>}
                          </div>
                          <div style={{display:"flex",gap:10,alignItems:"center"}}>
                            <span style={{fontFamily:"var(--mono)",color:"var(--text2)"}}>{c.duration}m</span>
                            <span style={{fontFamily:"var(--mono)",color:"var(--green)",fontWeight:700}}>${c.pay.toFixed(2)}</span>
                            <button onClick={e => { e.stopPropagation(); startEdit(c); }} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:16,padding:2}}>✏️</button>
                            <button onClick={e => { e.stopPropagation(); handleDelete(c.id); }} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:16,padding:2}}>🗑</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={{textAlign:"center",padding:"12px 20px 24px",display:"flex",justifyContent:"center",alignItems:"center",gap:16}}>
        <a href="mailto:renatadclarranaga@gmail.com" style={{fontSize:11,color:"var(--text3)",textDecoration:"none",fontFamily:"var(--mono)"}}>Contact me</a>
        <span style={{color:"var(--border2)"}}>·</span>
        <a href="https://github.com/rendelarr" target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"var(--text3)",textDecoration:"none",fontFamily:"var(--mono)"}}>github/rendelarr</a>
      </div>

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"var(--bg2)",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-around",padding:"8px 0 14px",zIndex:100}}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} className="nav-item" onClick={() => { sfx.tabSwitch(); setTab(t.id); }} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 8px",color:active?"var(--cyan)":"var(--text3)",transition:"color .15s",minWidth:40}}>
              <div style={{fontSize:18,lineHeight:1,filter:active?"drop-shadow(0 0 4px var(--cyan))":"none"}}>{t.icon}</div>
              <div style={{fontSize:12,fontWeight:active?700:400,letterSpacing:.3}}>{t.label}</div>
              {active && <div style={{width:14,height:2,background:"var(--cyan)",borderRadius:99,boxShadow:"0 0 6px var(--cyan)"}}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

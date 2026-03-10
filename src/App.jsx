import { useState, useEffect, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY    = "call_tracker_data";
const STORAGE_CONFIG = "call_tracker_config";
const defaultConfig  = { dailyMoneyGoal: 30 };

const RATES = [
  { value: 0.12, label: "Normal", color: "#7a8a9a", icon: "○" },
  { value: 0.13, label: "Bronce", color: "#c47d3a", icon: "◐" },
  { value: 0.14, label: "Plata",  color: "#8fa8c2", icon: "◑" },
  { value: 0.15, label: "Gold",   color: "#ffb800", icon: "●" },
];

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
  { id:"home",    icon:"◉", label:"Hoy"      },
  { id:"perf",    icon:"⚡", label:"Stats"    },
  { id:"week",    icon:"▦", label:"Semana"   },
  { id:"cycle",   icon:"◎", label:"Ciclo"    },
  { id:"history", icon:"≡", label:"Historial"},
];

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

// ─── Style shortcuts ──────────────────────────────────────────────────────────

const CC = {
  card:     { background:"var(--bg2)", borderRadius:16, border:"1px solid var(--border)" },
  cardGlow: (c) => ({ background:"var(--bg2)", borderRadius:16, border:`1px solid ${c}33`, boxShadow:`0 0 24px ${c}0d` }),
  input:    { width:"100%", background:"var(--bg)", border:"1px solid var(--border2)", borderRadius:10, color:"var(--text)", padding:"10px 14px", fontSize:14, outline:"none" },
  label:    { fontSize:10, color:"var(--text3)", fontWeight:700, letterSpacing:.8, textTransform:"uppercase", marginBottom:6, display:"block" },
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

function getCurrentCycle() {
  const now = new Date(); now.setHours(0,0,0,0);
  return PAY_CYCLES.find(c => {
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
    color:"var(--text)", fontFamily:"var(--mono)", fontWeight:700, fontSize:15,
    padding:"10px 4px", cursor:"pointer", appearance:"none", WebkitAppearance:"none",
    textAlign:"center", width:"100%", outline:"none",
  };
  const hours = Array.from({length:12}, (_, i) => String(i + 1));
  const mins  = Array.from({length:60}, (_, i) => String(i).padStart(2, "0"));
  const update = (nH, nM, nAp) => onChange(buildTimeStr({ h: nH, m: nM, ap: nAp }));
  return (
    <div>
      {label && <label style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1,display:"block",marginBottom:6}}>{label}</label>}
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
          fontWeight:800, fontSize:12, fontFamily:"var(--mono)",
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
  <button onClick={onClick} style={{padding:"6px 14px",borderRadius:99,border:"none",cursor:"pointer",fontWeight:600,fontSize:12,background:active?`${color}22`:"transparent",color:active?color:"var(--text2)",outline:active?`1px solid ${color}55`:"1px solid var(--border)",transition:"all .15s"}}>{children}</button>
);

const StatBox = ({ label, value, color = "var(--cyan)", sub }) => (
  <div style={{...CC.card,padding:"14px 16px"}}>
    <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:6}}>{label}</div>
    <div style={{fontSize:22,fontWeight:800,color,fontFamily:"var(--mono)",lineHeight:1}}>{value}</div>
    {sub && <div style={{fontSize:11,color:"var(--text2)",marginTop:4}}>{sub}</div>}
  </div>
);

function HeatmapCard({ heatmap, maxHeat }) {
  const [tip, setTip] = useState(null);
  const nowH = new Date().getHours();
  const blocks = [
    { label:"Mañana", hours: Array.from({length:6}, (_, i) => i + 6),  color:"#ffb800" },
    { label:"Tarde",  hours: Array.from({length:6}, (_, i) => i + 12), color:"#ff6b35" },
    { label:"Noche",  hours: Array.from({length:6}, (_, i) => i + 18), color:"#9d7aff" },
  ];
  return (
    <div style={{...CC.card,padding:20,marginBottom:12}} className="card">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>Actividad por hora</div>
        <div style={{fontSize:10,color:"var(--text3)",fontFamily:"var(--mono)"}}>minutos activos</div>
      </div>
      {blocks.map(block => {
        const total = block.hours.reduce((s, h) => s + heatmap[h], 0);
        const bMax  = Math.max(...block.hours.map(h => heatmap[h]), 1);
        const r = parseInt(block.color.slice(1,3),16), g = parseInt(block.color.slice(3,5),16), b = parseInt(block.color.slice(5,7),16);
        return (
          <div key={block.label} style={{marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:10,fontWeight:700,color:block.color,letterSpacing:.5}}>{block.label.toUpperCase()}</span>
              {total > 0
                ? <span style={{fontSize:11,fontFamily:"var(--mono)",color:block.color}}>{total}m</span>
                : <span style={{fontSize:10,color:"var(--text3)"}}>sin actividad</span>
              }
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:5}}>
              {block.hours.map(h => {
                const val = heatmap[h], intensity = val / maxHeat, isNow = h === nowH;
                const bg  = intensity > 0 ? `rgba(${r},${g},${b},${0.12 + intensity * 0.78})` : "var(--bg)";
                return (
                  <div key={h} className="heat-cell"
                    onMouseEnter={() => setTip(h)} onMouseLeave={() => setTip(null)}
                    title={`${h%12||12}${h<12?"am":"pm"}: ${val}m`}
                    style={{borderRadius:8,padding:"9px 4px",background:bg,textAlign:"center",
                      border: isNow ? `1px solid ${block.color}88` : `1px solid ${intensity>0?"transparent":"var(--border)"}`,
                      boxShadow: isNow ? `0 0 8px ${block.color}44` : tip===h ? `0 0 6px ${block.color}22` : "none",
                      cursor:"default", position:"relative"}}>
                    {isNow && <div style={{position:"absolute",top:3,right:3,width:4,height:4,borderRadius:"50%",background:block.color,animation:"pulse 1.5s infinite"}}/>}
                    <div style={{fontSize:9,fontFamily:"var(--mono)",color:intensity>0.5?"#fff":isNow?block.color:"var(--text3)",fontWeight:600}}>{h%12||12}{h<12?"a":"p"}</div>
                    <div style={{fontSize:intensity>0?10:9,fontWeight:700,fontFamily:"var(--mono)",color:intensity>0?(intensity>0.5?"#fff":block.color):"var(--border2)",marginTop:4}}>{val>0?`${val}`:"·"}</div>
                    {val > 0 && <div style={{marginTop:4,height:2,borderRadius:99,background:"rgba(255,255,255,.12)",overflow:"hidden"}}><div style={{width:`${(val/bMax)*100}%`,height:"100%",background:intensity>0.5?"rgba(255,255,255,.5)":block.color,borderRadius:99}}/></div>}
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:6,display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:9,color:"var(--text3)",fontFamily:"var(--mono)"}}>0</span>
              <div style={{flex:1,height:2,borderRadius:99,background:`linear-gradient(90deg,var(--bg),${block.color})`,opacity:.4}}/>
              <span style={{fontSize:9,color:block.color,fontFamily:"var(--mono)",fontWeight:700}}>{Math.max(...block.hours.map(h => heatmap[h]))}m</span>
            </div>
          </div>
        );
      })}
      {maxHeat <= 1 && <div style={{textAlign:"center",padding:"16px 0",color:"var(--text3)",fontSize:12}}>Registra llamadas para ver tu actividad por hora</div>}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {

  // ── State ──────────────────────────────────────────────────────────────────
  const [calls,          setCalls]          = useState([]);
  const [config,         setConfig]         = useState(defaultConfig);
  const [tab,            setTab]            = useState("home");
  const [activeRate,     setActiveRate]     = useState(0.12);
  const [toast,          setToast]          = useState("");
  const [cycleView,      setCycleView]      = useState("current");
  const [expandedDays,   setExpandedDays]   = useState(new Set());

  // Modals
  const [showGoal,       setShowGoal]       = useState(false);
  const [showConfig,     setShowConfig]     = useState(false);
  const [showManual,     setShowManual]     = useState(false);
  const [showPaste,      setShowPaste]      = useState(false);
  const [tempGoal,       setTempGoal]       = useState(defaultConfig.dailyMoneyGoal);

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

  // ── Effects ────────────────────────────────────────────────────────────────

  // Load persisted data on mount
  useEffect(() => {
    try {
      const d = localStorage.getItem(STORAGE_KEY);
      if (d) setCalls(JSON.parse(d));
      const c = localStorage.getItem(STORAGE_CONFIG);
      if (c) { const cfg = JSON.parse(c); setConfig(cfg); setTempConfig(cfg); setTempGoal(cfg.dailyMoneyGoal || 30); }
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
  const minsNeeded    = Math.ceil(config.dailyMoneyGoal / 0.12); // Base rate (Normal) as reference for minute goal
  const minsLeft      = Math.max(0, minsNeeded - todayMins);
  const minsGoalReached = minsLeft === 0;

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
  const currentCycle = getCurrentCycle();
  const activeDates  = new Set(Object.keys(byDate));
  const streak       = getStreak(activeDates);
  const last30       = last30Dates();

  const yestStr   = (() => { const d = new Date(); d.setDate(d.getDate()-1); return `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}/${d.getFullYear()}`; })();
  const yestMoney = (byDate[yestStr] || []).reduce((s, c) => s + c.pay, 0);
  const yestMins  = (byDate[yestStr] || []).reduce((s, c) => s + c.duration, 0);
  const lwDates   = Array.from({length:7}, (_, i) => { const d = new Date(); d.setDate(d.getDate()-(7+i)); return `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}/${d.getFullYear()}`; });
  const lwMoney   = lwDates.reduce((s, d) => s + (byDate[d] || []).reduce((ss, c) => ss + c.pay, 0), 0);
  const lwMins    = lwDates.reduce((s, d) => s + (byDate[d] || []).reduce((ss, c) => ss + c.duration, 0), 0);

  const heatmap = Array(24).fill(0);
  billableCalls.forEach(c => { const h = parseHour(c.callStart); if (h !== null) heatmap[h] += c.duration; });
  const maxHeat = Math.max(...heatmap, 1);

  const sortedToday = [...todayCalls].sort((a, b) => (timeToMins(a.callStart) || 0) - (timeToMins(b.callStart) || 0));
  let avgGap = null;
  if (sortedToday.length > 1) {
    const gaps = [];
    for (let i = 1; i < sortedToday.length; i++) {
      const mA = timeToMins(sortedToday[i-1].callStart), mB = timeToMins(sortedToday[i].callStart);
      if (mA !== null && mB !== null && mB > mA) gaps.push((mB - mA) - sortedToday[i-1].duration);
    }
    const positiveGaps = gaps.filter(g => g >= 0);
    if (positiveGaps.length) avgGap = Math.round(positiveGaps.reduce((s, g) => s + g, 0) / positiveGaps.length);
  }

  let projection = null;
  if (currentCycle) {
    const stats = getCycleStats(currentCycle);
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
  const scoreLabel  = score >= 75 ? "Excelente" : score >= 45 ? "Bien" : score >= 20 ? "Flojo" : "Inactivo";

  // ── Functions ──────────────────────────────────────────────────────────────

  function getCycleStats(cycle) {
    const s = toDate(cycle.start), e = toDate(cycle.end);
    const cc = billableCalls.filter(c => { const d = toDate(c.date); return d >= s && d <= e; });
    return { mins: cc.reduce((s, c) => s + c.duration, 0), money: cc.reduce((s, c) => s + c.pay, 0), count: cc.length };
  }

  const toastRef = useRef(null);
  function showToast(msg) {
    clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(""), 3000);
  }

  function handleDelete(id) { setCalls(prev => prev.filter(c => c.id !== id)); }

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
    if (!dur) { showToast("⚠️ Duración inválida"); return; }
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
    showToast("✅ Llamada agregada");
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
    showToast("✏️ Actualizado");
  }

  // Paste
  function handleParse() {
    setParseError("");
    const r = parseCallText(rawText);
    if (!r) { setParseError("No pude interpretar el texto."); setParsed(null); return; }
    setParsed(r);
  }
  function handleAdd() {
    if (!parsed) return;
    if (parsed.billable !== "Yes") { showToast("⚠️ No billable."); setParsed(null); setRawText(""); return; }
    setCalls(prev => [...prev, parsed]); setParsed(null); setRawText(""); showToast("✅ Llamada agregada");
  }

  // Import / Export
  async function handleFileLoad(file) {
    if (!file) return;
    setImportError(""); setImportFileName(file.name);
    const isXLSX = /\.xlsx?$/i.test(file.name), isCSV = /\.csv$/i.test(file.name);
    if (!isXLSX && !isCSV) { setImportError("Solo CSV o Excel."); return; }
    try {
      let headers = [], rows = [];
      if (isCSV) { const text = await file.text(); ({ headers, rows } = parseCSVText(text)); }
      else {
        const buf = await file.arrayBuffer(); const XLSX = window.XLSX;
        if (!XLSX) { setImportError("Librería no disponible."); return; }
        const wb = XLSX.read(buf, { type:"array" }); const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header:1, defval:"" });
        headers = data[0].map(h => String(h).trim()); rows = data.slice(1).map(r => r.map(v => String(v).trim()));
      }
      if (!headers.length) { setImportError("Archivo vacío."); return; }
      const preview = rowsToCallsSmart(rows, headers);
      if (!preview.length) { setImportError("Sin filas válidas."); return; }
      setImportPreview(preview);
      setImportStats({ total: preview.length, surge: preview.filter(c => c.surge).length, totalPay: preview.reduce((s, c) => s + c.pay, 0), totalMins: preview.reduce((s, c) => s + c.duration, 0) });
      setImportStep("preview");
    } catch(e) { setImportError("Error: " + e.message); }
  }

  function confirmImport() {
    const existing = new Set(calls.map(c => `${c.customerId}-${c.date}-${c.callStart}`));
    const newCalls = importPreview.filter(c => !existing.has(`${c.customerId}-${c.date}-${c.callStart}`));
    setCalls(prev => [...prev, ...newCalls]); setImportStep("done"); showToast(`✅ ${newCalls.length} importadas`);
  }

  function resetImport() {
    setImportStep("idle"); setImportPreview([]); setImportError(""); setImportFileName(""); setImportStats(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function getExportRows() {
    return calls.map(c => ({ "Project ID":c.customerId, "Service Date":c.date, "Start Time":c.callStart, "Quantity":c.duration, "Earnings":"$"+c.pay.toFixed(2), "Adjustment":"$0.00", "Service Line":c.serviceType||"", "Surge":c.surge?"Yes":"No", "Billable":c.billable, "Dropped":c.dropped }));
  }

  function exportCSV() {
    const rows = getExportRows(); if (!rows.length) { showToast("⚠️ Sin llamadas"); return; }
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => '"' + String(r[h]).replace(/"/g, '""') + '"').join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type:"text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = `call-tracker-${today()}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast("✅ CSV exportado");
  }

  function exportXLSX() {
    const XLSX = window.XLSX; if (!XLSX) { showToast("⚠️ Librería no disponible"); return; }
    const rows = getExportRows(); if (!rows.length) { showToast("⚠️ Sin llamadas"); return; }
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Llamadas");
    XLSX.writeFile(wb, `call-tracker-${today()}.xlsx`); showToast("✅ Excel exportado");
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",color:"var(--text)",fontFamily:"var(--sans)",paddingBottom:80}}>

      {/* Toast */}
      {toast && (
        <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:"var(--bg3)",border:"1px solid var(--cyan)",color:"var(--cyan)",padding:"10px 20px",borderRadius:99,fontWeight:600,zIndex:999,fontSize:13,whiteSpace:"nowrap",animation:"toastIn .25s ease",boxShadow:"0 2px 12px rgba(0,0,0,0.12)"}}>
          {toast}
        </div>
      )}

      {/* Live call banner */}
      {liveActive && (
        <div style={{position:"fixed",top:0,left:0,right:0,background:"linear-gradient(135deg,#dcfce7,#bbf7d0)",borderBottom:"1px solid var(--green)",zIndex:150,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"var(--green2)",animation:"pulse 1s infinite"}}/>
            <div>
              <div style={{fontSize:10,color:"var(--green2)",fontWeight:700,letterSpacing:1}}>EN LLAMADA</div>
              <div style={{fontSize:24,fontWeight:800,fontFamily:"var(--mono)",color:"var(--green2)",lineHeight:1}}>{fmtTime(liveSeconds)}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="action-btn" onClick={stopLiveCall}   style={{background:"var(--green2)",border:"none",borderRadius:8,color:"#fff",padding:"8px 16px",fontWeight:800,cursor:"pointer",fontSize:13}}>✓ Guardar</button>
            <button className="action-btn" onClick={cancelLiveCall} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:8,color:"var(--text2)",padding:"8px 14px",fontWeight:600,cursor:"pointer",fontSize:13}}>✕</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{padding:"20px 20px 0",display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:liveActive?56:0}}>
        <div>
          <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1.5,fontFamily:"var(--mono)"}}>CALL TRACKER</div>
          <div style={{fontSize:11,color:"var(--text2)",marginTop:1,fontFamily:"var(--mono)"}}>{todayStr}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={() => { setTempGoal(config.dailyMoneyGoal); setShowGoal(true); }} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:8,color:"var(--text2)",padding:"7px 12px",cursor:"pointer",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
            <span style={{color:"var(--amber)"}}>◎</span> Meta
          </button>
          <button onClick={() => setShowConfig(true)} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:8,color:"var(--text2)",padding:"7px 12px",cursor:"pointer",fontSize:15}}>⚙</button>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* Goal */}
      {showGoal && (
        <Modal onClose={() => setShowGoal(false)}>
          <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>META DIARIA</div>
          <div style={{fontSize:20,fontWeight:700,color:"var(--text)",marginBottom:20}}>¿Cuánto quieres ganar hoy?</div>
          <label style={CC.label}>Monto en dólares</label>
          <div style={{position:"relative",marginBottom:20}}>
            <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--amber)",fontWeight:700,fontSize:18,fontFamily:"var(--mono)"}}>$</div>
            <input type="number" step="0.01" min="0" value={tempGoal} onChange={e => setTempGoal(e.target.value)} autoFocus
              style={{...CC.input,paddingLeft:32,fontSize:24,fontFamily:"var(--mono)",fontWeight:800,color:"var(--amber)",border:"1px solid var(--amber)44"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn-primary" onClick={() => { const val=parseFloat(tempGoal)||30; const nc={...config,dailyMoneyGoal:val}; setConfig(nc); setTempConfig(nc); try{localStorage.setItem(STORAGE_CONFIG,JSON.stringify(nc));}catch{} setShowGoal(false); showToast("🎯 Meta: $"+val.toFixed(2)); }}
              style={{flex:1,background:"var(--amber)",border:"none",borderRadius:10,color:"#000",padding:"12px",fontWeight:800,cursor:"pointer",fontSize:14}}>Guardar</button>
            <button onClick={() => setShowGoal(false)} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:10,color:"var(--text2)",padding:"12px 16px",cursor:"pointer",fontSize:14}}>✕</button>
          </div>
        </Modal>
      )}

      {/* Config / Import */}
      {showConfig && (
        <Modal onClose={() => { setShowConfig(false); resetImport(); }}>
          <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>IMPORTAR</div>
          <div style={{fontSize:20,fontWeight:700,color:"var(--text)",marginBottom:20}}>Cargar llamadas</div>
          {importError && <div style={{background:"#fef2f2",border:"1px solid var(--red)44",borderRadius:8,padding:"10px 12px",color:"var(--red)",fontSize:12,marginBottom:12}}>{importError}</div>}

          {importStep === "idle" && (
            <div>
              <button onClick={() => fileRef.current.click()} style={{width:"100%",background:"var(--bg)",border:"2px dashed var(--border2)",borderRadius:12,color:"var(--text2)",padding:"28px",fontWeight:600,cursor:"pointer",fontSize:13,textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:28,marginBottom:8}}>📂</div>
                <div>Seleccionar CSV o Excel</div>
                <div style={{fontSize:11,color:"var(--text3)",marginTop:4}}>Arrastra o haz clic</div>
              </button>
              {calls.length > 0 && (
                <div>
                  <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:10}}>EXPORTAR · {calls.length} llamadas</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <button className="btn-primary" onClick={exportCSV} style={{background:"var(--bg)",border:"1px solid var(--cyan)44",borderRadius:10,color:"var(--cyan)",padding:"12px 8px",fontWeight:700,cursor:"pointer",fontSize:13,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <span style={{fontSize:20}}>📄</span><span>CSV</span>
                    </button>
                    <button className="btn-primary" onClick={exportXLSX} style={{background:"var(--bg)",border:"1px solid var(--green)44",borderRadius:10,color:"var(--green)",padding:"12px 8px",fontWeight:700,cursor:"pointer",fontSize:13,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <span style={{fontSize:20}}>📊</span><span>Excel</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {importStep === "preview" && importStats && (
            <div>
              <div style={{background:"var(--bg)",borderRadius:10,padding:14,marginBottom:14}}>
                <div style={{color:"var(--text)",fontWeight:700,marginBottom:8,fontSize:13}}>{importFileName}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
                  <div><div style={{fontSize:18,fontWeight:800,fontFamily:"var(--mono)",color:"var(--cyan)"}}>{importStats.total}</div><div style={{fontSize:10,color:"var(--text3)"}}>llamadas</div></div>
                  <div><div style={{fontSize:18,fontWeight:800,fontFamily:"var(--mono)",color:"var(--green)"}}>${importStats.totalPay.toFixed(2)}</div><div style={{fontSize:10,color:"var(--text3)"}}>total</div></div>
                  <div><div style={{fontSize:18,fontWeight:800,fontFamily:"var(--mono)",color:"var(--blue)"}}>{importStats.totalMins}m</div><div style={{fontSize:10,color:"var(--text3)"}}>minutos</div></div>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn-primary" onClick={() => { confirmImport(); setShowConfig(false); }} style={{flex:1,background:"var(--green2)",border:"none",borderRadius:10,color:"var(--text)",padding:"12px",fontWeight:700,cursor:"pointer",fontSize:14}}>✅ Confirmar</button>
                <button onClick={resetImport} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:10,color:"var(--text2)",padding:"12px 16px",cursor:"pointer"}}>✕</button>
              </div>
            </div>
          )}

          {importStep === "done" && (
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:32,marginBottom:8}}>✅</div>
              <div style={{color:"var(--green)",fontWeight:700,marginBottom:16}}>Importado con éxito</div>
              <button onClick={() => { resetImport(); setShowConfig(false); }} style={{background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:10,color:"var(--text2)",padding:"10px 20px",cursor:"pointer",fontWeight:600}}>Cerrar</button>
            </div>
          )}
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={e => handleFileLoad(e.target.files[0])} style={{display:"none"}}/>
        </Modal>
      )}

      {/* Manual / Live */}
      {showManual && (
        <Modal onClose={() => { setShowManual(false); setLiveStart(null); }}>
          <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>NUEVA LLAMADA</div>
          <div style={{fontSize:18,fontWeight:700,color:"var(--text)",marginBottom:16}}>{liveStart ? "Guardar llamada grabada" : "Agregar manualmente"}</div>
          <div style={{marginBottom:14}}>
            <label style={CC.label}>Tarifa activa</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {RATES.map(r => { const active = activeRate === r.value; return (
                <button key={r.value} className="rate-btn" onClick={() => { setActiveRate(r.value); setManualForm(p => ({...p, pay: String(parseFloat((parseInt(p.duration||0) * r.value).toFixed(2)))})); }}
                  style={{padding:"8px 10px",borderRadius:8,border:"none",cursor:"pointer",background:active?`${r.color}22`:"var(--bg)",outline:active?`1px solid ${r.color}88`:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{color:r.color,fontSize:14}}>{r.icon}</span>
                  <div><div style={{fontWeight:800,fontSize:12,color:active?r.color:"var(--text)",fontFamily:"var(--mono)"}}>${r.value}/min</div><div style={{fontSize:10,color:"var(--text3)"}}>{r.label}</div></div>
                </button>
              );})}
            </div>
          </div>
          <div style={{marginBottom:12}}>
            <label style={CC.label}>ID Cliente</label>
            <input type="text" placeholder="Opcional" value={manualForm.customerId} onChange={e => handleManualChange("customerId", e.target.value)} style={{...CC.input,fontSize:13}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <TimePicker label="HORA INICIO" value={manualForm.startTime} onChange={v => handleManualChange("startTime", v)}/>
            <TimePicker label="HORA FIN"    value={manualForm.endTime}   onChange={v => handleManualChange("endTime", v)}/>
          </div>
          <div style={{marginBottom:12}}>
            <label style={CC.label}>Minutos</label>
            <input type="number" placeholder="15" value={manualForm.duration} onChange={e => handleManualChange("duration", e.target.value)} style={{...CC.input,fontSize:15,fontFamily:"var(--mono)",fontWeight:700,color:"var(--cyan)"}}/>
          </div>
          <div style={{marginBottom:16}}>
            <label style={CC.label}>Pago ($)</label>
            <input type="number" step="0.01" value={manualForm.pay} onChange={e => setManualForm(p => ({...p, pay: e.target.value}))} style={{...CC.input,fontSize:20,fontFamily:"var(--mono)",fontWeight:800,color:"var(--green)",border:"1px solid var(--green)33"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn-primary" onClick={submitManual} style={{flex:1,background:"var(--green2)",border:"none",borderRadius:10,color:"var(--text)",padding:"12px",fontWeight:700,cursor:"pointer",fontSize:14}}>+ Agregar</button>
            <button onClick={() => { setShowManual(false); setLiveStart(null); }} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:10,color:"var(--text2)",padding:"12px 16px",cursor:"pointer"}}>✕</button>
          </div>
        </Modal>
      )}

      {/* Paste */}
      {showPaste && (
        <Modal onClose={() => { setShowPaste(false); setParsed(null); setRawText(""); }}>
          <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>PEGAR DATOS</div>
          <div style={{fontSize:18,fontWeight:700,color:"var(--text)",marginBottom:16}}>Pegar llamada</div>
          <div style={{marginBottom:14}}>
            <label style={CC.label}>Tarifa activa</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {RATES.map(r => { const active = activeRate === r.value; return (
                <button key={r.value} className="rate-btn" onClick={() => setActiveRate(r.value)}
                  style={{padding:"8px 10px",borderRadius:8,border:"none",cursor:"pointer",background:active?`${r.color}22`:"var(--bg)",outline:active?`1px solid ${r.color}88`:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{color:r.color,fontSize:14}}>{r.icon}</span>
                  <div><div style={{fontWeight:800,fontSize:12,color:active?r.color:"var(--text)",fontFamily:"var(--mono)"}}>${r.value}/min</div><div style={{fontSize:10,color:"var(--text3)"}}>{r.label}</div></div>
                </button>
              );})}
            </div>
          </div>
          <label style={CC.label}>Datos de la llamada</label>
          <textarea value={rawText} onChange={e => setRawText(e.target.value)} placeholder="191403/09/202608:17 AM3YesNo$0.36"
            style={{...CC.input,height:70,resize:"vertical",fontSize:12,fontFamily:"var(--mono)",marginBottom:8}}/>
          {parseError && <div style={{color:"var(--red)",fontSize:12,marginBottom:8}}>{parseError}</div>}
          {!parsed && <button className="btn-primary" onClick={handleParse} style={{width:"100%",background:"var(--cyan)",border:"none",borderRadius:10,color:"#000",padding:"11px",fontWeight:700,cursor:"pointer",fontSize:14}}>Interpretar</button>}
          {parsed && (
            <div style={{background:"var(--bg)",borderRadius:10,padding:14,border:`1px solid ${parsed.billable==="Yes"?"var(--green)44":"var(--red)44"}`}}>
              <div style={{fontWeight:700,color:parsed.billable==="Yes"?"var(--green)":"var(--red)",marginBottom:10,fontSize:13}}>{parsed.billable==="Yes"?"✅ Billable":"⛔ No Billable"}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
                {(() => {
                  const callEnd = timeToMins(parsed.callStart) !== null ? minsToTime(timeToMins(parsed.callStart) + parsed.duration) : "—";
                  return [["Cliente",parsed.customerId],["Fecha",parsed.date],["Inicio",parsed.callStart],["Fin",callEnd],["Duración",`${parsed.duration}m`],["Pago",`$${parsed.pay.toFixed(2)}`]]
                    .map(([k, v]) => (
                      <div key={k}><div style={{fontSize:10,color:"var(--text3)"}}>{k}</div><div style={{fontWeight:700,fontSize:13,fontFamily:"var(--mono)",color:"var(--text)"}}>{v}</div></div>
                    ));
                })()}
              </div>
              {parsed.billable === "Yes"
                ? <button className="btn-primary" onClick={() => { handleAdd(); setShowPaste(false); }} style={{width:"100%",background:"var(--green2)",border:"none",borderRadius:9,color:"var(--text)",padding:"10px",fontWeight:700,cursor:"pointer",fontSize:14}}>➕ Agregar</button>
                : <button onClick={() => { setParsed(null); setRawText(""); }} style={{width:"100%",background:"transparent",border:"1px solid var(--border2)",borderRadius:9,color:"var(--text2)",padding:"10px",fontWeight:700,cursor:"pointer",fontSize:14}}>Descartar</button>
              }
            </div>
          )}
        </Modal>
      )}

      {/* Edit */}
      {editingId && (
        <Modal onClose={() => setEditingId(null)}>
          <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>EDITAR LLAMADA</div>
          <div style={{fontSize:18,fontWeight:700,color:"var(--text)",marginBottom:16}}>Editar llamada</div>
          <div style={{marginBottom:12}}>
            <label style={CC.label}>ID Cliente</label>
            <input type="text" value={editForm.customerId||""} onChange={e => handleEditChange("customerId", e.target.value)} style={{...CC.input,fontSize:13}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <TimePicker label="HORA INICIO" value={editForm.callStart} onChange={v => handleEditChange("callStart", v)}/>
            <TimePicker label="HORA FIN"    value={editForm.callEnd}   onChange={v => handleEditChange("callEnd", v)}/>
          </div>
          <div style={{marginBottom:12}}>
            <label style={CC.label}>Minutos</label>
            <input type="number" value={editForm.duration||""} onChange={e => handleEditChange("duration", e.target.value)} style={{...CC.input,fontSize:15,fontFamily:"var(--mono)",fontWeight:700,color:"var(--cyan)"}}/>
          </div>
          <div style={{marginBottom:16}}>
            <label style={CC.label}>Pago ($)</label>
            <input type="number" step="0.01" value={editForm.pay||""} onChange={e => setEditForm(p => ({...p, pay: e.target.value}))} style={{...CC.input,fontSize:20,fontFamily:"var(--mono)",fontWeight:800,color:"var(--green)",border:"1px solid var(--green)33"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn-primary" onClick={() => saveEdit(editingId)} style={{flex:1,background:"var(--cyan)",border:"none",borderRadius:10,color:"#000",padding:"12px",fontWeight:700,cursor:"pointer",fontSize:14}}>💾 Guardar</button>
            <button onClick={() => setEditingId(null)} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:10,color:"var(--text2)",padding:"12px 16px",cursor:"pointer"}}>✕</button>
          </div>
        </Modal>
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
                  <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1}}>INGRESOS HOY</div>
                  <div style={{fontSize:48,fontWeight:800,fontFamily:"var(--mono)",color:"var(--green)",lineHeight:1,marginTop:4}}>${todayMoney.toFixed(2)}</div>
                  <div style={{marginTop:10}}>
                    {minsGoalReached
                      ? <div style={{fontSize:16,fontWeight:900,fontFamily:"var(--mono)",color:"var(--green)"}}>✓ Meta de minutos alcanzada</div>
                      : <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                          <div style={{fontSize:36,fontWeight:900,fontFamily:"var(--mono)",color:"var(--cyan)",lineHeight:1}}>{minsLeft}</div>
                          <div style={{fontSize:13,fontWeight:700,color:"var(--cyan)"}}>min restantes</div>
                        </div>
                    }
                    <div style={{fontSize:11,color:"var(--text3)",marginTop:4,fontFamily:"var(--mono)"}}>{todayCalls.length} llamadas · {todayMins}/{minsNeeded} min hechos</div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:10,color:"var(--text3)",marginBottom:4}}>META</div>
                  <div style={{fontSize:22,fontWeight:800,fontFamily:"var(--mono)",color:moneyPct>=100?"var(--green)":"var(--amber)"}}>{moneyPct}%</div>
                  <div style={{fontSize:11,color:"var(--text3)"}}>de ${config.dailyMoneyGoal}</div>
                </div>
              </div>
              <div style={{background:"var(--bg)",borderRadius:99,height:6,overflow:"hidden"}}>
                <div style={{width:`${moneyPct}%`,height:"100%",background:"linear-gradient(90deg,var(--cyan),var(--green))",borderRadius:99,transition:"width .6s ease",boxShadow:moneyPct>0?"0 0 8px var(--cyan)66":"none"}}/>
              </div>
              {/* Idle cost */}
              <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1}}>SIN LLAMADAS</div>
                <div style={{fontFamily:"var(--mono)",fontWeight:900,fontSize:20,color:"var(--red)"}}>-${(idleSecs / 60 * 0.12).toFixed(2)}</div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
              {[
                { label: liveActive ? "⏹ Detener" : "▶ En vivo", active: liveActive, color:"var(--green)",  action: () => liveActive ? stopLiveCall() : startLiveCall() },
                { label: "✏️ Manual",                             active: false,       color:"var(--cyan)",   action: () => setShowManual(true) },
                { label: "📋 Pegar",                              active: false,       color:"var(--purple)", action: () => setShowPaste(true) },
              ].map(btn => (
                <button key={btn.label} className="action-btn" onClick={btn.action} style={{padding:"16px 8px",borderRadius:14,border:`1px solid ${btn.active?btn.color:"var(--border)"}`,cursor:"pointer",background:btn.active?`${btn.color}11`:"var(--bg2)",color:btn.active?btn.color:"var(--text)",fontWeight:700,fontSize:12,display:"flex",flexDirection:"column",alignItems:"center",gap:6,boxShadow:btn.active?`0 0 14px ${btn.color}22`:"none",transition:"all .15s"}}>
                  <span style={{fontSize:20}}>{btn.label.split(" ")[0]}</span>
                  <span style={{fontSize:10}}>{btn.label.split(" ").slice(1).join(" ")}</span>
                </button>
              ))}
            </div>

            {/* Today's calls */}
            <div style={{...CC.card,padding:20}} className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontWeight:700,color:"var(--text)",fontSize:14}}>Llamadas de hoy</div>
                <div style={{fontSize:12,fontFamily:"var(--mono)",color:"var(--text2)"}}>{todayCalls.length}</div>
              </div>
              {todayCalls.length === 0 && (
                <div style={{textAlign:"center",padding:"24px 0",color:"var(--text3)"}}>
                  <div style={{fontSize:32,marginBottom:8}}>📞</div>
                  <div style={{fontSize:13}}>Sin llamadas hoy</div>
                  <div style={{fontSize:11,marginTop:4}}>Usa los botones de arriba para registrar</div>
                </div>
              )}
              {todayCalls.map((c, i) => (
                <div key={c.id} className="call-row" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 8px",borderRadius:10,marginBottom:2,background:"transparent",borderTop:i>0?"1px solid var(--border)":"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:30,height:30,borderRadius:7,background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontFamily:"var(--mono)",color:"var(--text3)",fontWeight:700,border:"1px solid var(--border)",flexShrink:0}}>{i+1}</div>
                    <div>
                      <div style={{fontWeight:600,fontSize:13}}>#{c.customerId}</div>
                      <div style={{fontSize:11,color:"var(--text2)",fontFamily:"var(--mono)"}}>{c.callStart} · {c.duration}m</div>
                    </div>
                    {c.surge && <span style={{fontSize:9,background:"#fef3c7",color:"var(--amber)",padding:"2px 7px",borderRadius:6,border:"1px solid var(--amber)44",fontWeight:700}}>SURGE</span>}
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <div style={{fontWeight:800,fontSize:14,fontFamily:"var(--mono)",color:"var(--green)"}}>${c.pay.toFixed(2)}</div>
                    <button onClick={() => startEdit(c)} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:13,padding:3}}>✏️</button>
                    <button onClick={() => handleDelete(c.id)} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:13,padding:3}}>🗑</button>
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
              <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1.5,marginBottom:8}}>SCORE DEL DÍA</div>
              <div style={{fontSize:72,fontWeight:900,fontFamily:"var(--mono)",color:scoreColor,lineHeight:1}}>{score}</div>
              <div style={{fontSize:13,color:scoreColor,fontWeight:600,marginTop:6,letterSpacing:.5}}>{scoreLabel}</div>
              <div style={{marginTop:14,background:"var(--bg)",borderRadius:99,height:6,overflow:"hidden"}}>
                <div style={{width:`${score}%`,height:"100%",background:scoreColor,borderRadius:99,transition:"width .6s",boxShadow:`0 0 8px ${scoreColor}66`}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginTop:14}}>
                {[["Meta",Math.round(scoreGoal),40,"var(--green)"],["Ritmo",Math.round(scoreRhythm),30,"var(--cyan)"],["Racha",Math.round(scoreStreak),20,"var(--amber)"],["Activo",Math.round(scoreHours),10,"var(--purple)"]].map(([l,v,max,c]) => (
                  <div key={l} style={{background:"var(--bg)",borderRadius:8,padding:"8px 4px"}}>
                    <div style={{fontSize:14,fontWeight:800,fontFamily:"var(--mono)",color:c}}>{v}<span style={{fontSize:9,color:"var(--text3)"}}>/{max}</span></div>
                    <div style={{fontSize:10,color:"var(--text3)",marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparisons */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              {[["vs Ayer",todayMoney,yestMoney,weekMins,yestMins],["vs Sem. pasada",weekMoney,lwMoney,weekMins,lwMins]].map(([label,curM,prevM,curMin,prevMin]) => {
                const diffM = curM - prevM, diffMin = curMin - prevMin, up = diffM >= 0;
                return (
                  <div key={label} style={{...CC.card,padding:14}} className="card">
                    <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:.8,marginBottom:8}}>{label.toUpperCase()}</div>
                    <div style={{fontSize:20,fontWeight:800,fontFamily:"var(--mono)",color:up?"var(--green)":"var(--red)"}}>{up?"+":""}{diffM.toFixed(2)}<span style={{fontSize:11}}>$</span></div>
                    <div style={{fontSize:11,fontFamily:"var(--mono)",color:diffMin>=0?"var(--cyan)":"var(--red)",marginTop:2}}>{diffMin>=0?"+":""}{diffMin}m</div>
                    <div style={{fontSize:10,color:"var(--text3)",marginTop:6}}>antes: ${prevM.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>

            {/* Cycle projection */}
            {currentCycle && (
              <div style={{...CC.cardGlow("var(--amber)"),padding:20,marginBottom:12}} className="card">
                <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>PROYECCIÓN DEL CICLO</div>
                <div style={{fontSize:36,fontWeight:900,fontFamily:"var(--mono)",color:"var(--amber)"}}>${projection !== null ? projection.toFixed(2) : "--"}</div>
                <div style={{fontSize:11,color:"var(--text2)",marginTop:2}}>A este ritmo al final del ciclo</div>
              </div>
            )}

            {/* Rhythm */}
            <div style={{...CC.card,padding:20,marginBottom:12}} className="card">
              <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:12}}>RITMO DE HOY</div>
              {avgGap === null
                ? <div style={{color:"var(--text3)",fontSize:13}}>Necesitas al menos 2 llamadas</div>
                : (() => {
                    const c = avgGap<=5?"var(--green)":avgGap<=15?"var(--amber)":"var(--red)";
                    const l = avgGap<=5?"Excelente 🔥":avgGap<=15?"Normal ⚡":"Lento 🐢";
                    return (
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontSize:36,fontWeight:900,fontFamily:"var(--mono)",color:c}}>{avgGap}<span style={{fontSize:14,marginLeft:4,color:"var(--text2)"}}>min</span></div>
                          <div style={{fontSize:11,color:c,marginTop:2}}>{l}</div>
                        </div>
                        <div style={{fontSize:11,color:"var(--text3)"}}>entre llamadas</div>
                      </div>
                    );
                  })()
              }
            </div>

            <HeatmapCard heatmap={heatmap} maxHeat={maxHeat}/>

            {/* Streak */}
            <div style={{...CC.card,padding:20,marginBottom:12}} className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1}}>RACHA</div>
                <div style={{fontSize:28,fontWeight:900,fontFamily:"var(--mono)",color:"var(--amber)"}}>{streak}<span style={{fontSize:12,color:"var(--text3)",marginLeft:4}}>días</span></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(10,1fr)",gap:3}}>
                {last30.map(d => <div key={d} title={d} style={{aspectRatio:"1",borderRadius:4,background:byDate[d]?"var(--cyan)":d===todayStr?"var(--border2)":"var(--bg)",border:d===todayStr?"1px solid var(--border2)":"none"}}/>)}
              </div>
            </div>
          </div>
        )}

        {/* WEEK */}
        {tab === "week" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              <StatBox label="Minutos semana"  value={`${weekMins}m`}             color="var(--cyan)"/>
              <StatBox label="Ingresos semana" value={`$${weekMoney.toFixed(2)}`} color="var(--green)"/>
            </div>
            <div style={{...CC.card,padding:20}} className="card">
              <div style={{fontWeight:700,marginBottom:16,fontSize:14}}>Minutos por día</div>
              {weekData.map(d => (
                <div key={d.date} style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}>
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
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <Pill active={cycleView==="current"} onClick={() => setCycleView("current")}>Ciclo actual</Pill>
              <Pill active={cycleView==="all"}     onClick={() => setCycleView("all")}>Todos</Pill>
            </div>
            {cycleView === "current" && (!currentCycle
              ? <div style={{color:"var(--text3)",fontSize:13,textAlign:"center",padding:"32px 0"}}>No hay ciclo activo.</div>
              : (() => {
                  const stats    = getCycleStats(currentCycle);
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
                            <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>PERÍODO</div>
                            <div style={{fontWeight:700,fontSize:13,color:"var(--cyan)",fontFamily:"var(--mono)"}}>{currentCycle.start} → {currentCycle.end}</div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:10,color:"var(--text3)"}}>COBRO</div>
                            <div style={{fontWeight:700,color:"var(--amber)",fontFamily:"var(--mono)",fontSize:13}}>{currentCycle.payDate}</div>
                          </div>
                        </div>
                        <div style={{background:"var(--bg)",borderRadius:99,height:6,overflow:"hidden",marginBottom:6}}>
                          <div style={{width:`${pct}%`,height:"100%",background:"linear-gradient(90deg,var(--cyan),var(--green))",borderRadius:99}}/>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)"}}>
                          <span>Día {passed}/{total}</span>
                          <span>{daysLeft > 0 ? `${daysLeft}d restantes` : "Cerrado"}</span>
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                        <StatBox label="Minutos"       value={`${stats.mins}m`}             color="var(--cyan)"/>
                        <StatBox label="Ganado"        value={`$${stats.money.toFixed(2)}`} color="var(--green)"/>
                        <StatBox label="Llamadas"      value={stats.count}                  color="var(--amber)"/>
                        <StatBox label="Días p/cobrar" value={Math.max(dtp, 0)}             color="var(--purple)"/>
                      </div>
                    </div>
                  );
                })()
            )}
            {cycleView === "all" && PAY_CYCLES.map((cycle, i) => {
              const stats     = getCycleStats(cycle);
              const isCurrent = currentCycle && cycle.start === currentCycle.start;
              const isPast    = toDate(cycle.end) < new Date();
              const dtp       = daysUntil(cycle.payDate);
              return (
                <div key={i} style={{...CC.card,padding:16,marginBottom:8,border:`1px solid ${isCurrent?"var(--cyan)44":"var(--border)"}`,opacity:isPast&&!isCurrent?0.5:1}} className="card">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      {isCurrent && <span style={{fontSize:9,background:"var(--cyan)22",color:"var(--cyan)",padding:"2px 8px",borderRadius:6,marginBottom:6,display:"inline-block",fontWeight:700}}>ACTUAL</span>}
                      <div style={{fontSize:12,fontWeight:700,fontFamily:"var(--mono)",color:isCurrent?"var(--cyan)":"var(--text)"}}>{cycle.start} → {cycle.end}</div>
                      <div style={{fontSize:11,color:"var(--amber)",marginTop:2,fontFamily:"var(--mono)"}}>{cycle.payDate}{!isPast&&dtp>0&&<span style={{color:"var(--text3)",marginLeft:6}}>({dtp}d)</span>}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontWeight:800,fontFamily:"var(--mono)",color:"var(--green)",fontSize:14}}>${stats.money.toFixed(2)}</div>
                      <div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)"}}>{stats.mins}m · {stats.count}</div>
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
                <div style={{fontSize:32,marginBottom:8}}>🗂</div>
                <div>Sin historial aún</div>
              </div>
            )}
            {sortedDates.map(date => {
              const dayCalls   = calls.filter(c => c.date === date);
              const bil        = dayCalls.filter(c => c.billable === "Yes");
              const mins       = bil.reduce((s, c) => s + c.duration, 0);
              const money      = bil.reduce((s, c) => s + c.pay, 0);
              const surgeCount = bil.filter(c => c.surge).length;
              const isOpen     = expandedDays.has(date);
              const toggle     = () => setExpandedDays(prev => { const next = new Set(prev); isOpen ? next.delete(date) : next.add(date); return next; });
              return (
                <div key={date} style={{...CC.card,padding:0,marginBottom:8,overflow:"hidden"}} className="card">
                  <div onClick={toggle} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",cursor:"pointer",userSelect:"none"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:13,color:"var(--text3)",transition:"transform .2s",display:"inline-block",transform:isOpen?"rotate(90deg)":"rotate(0deg)"}}>▶</span>
                      <span style={{fontWeight:700,fontSize:13,fontFamily:"var(--mono)",color:"var(--text)"}}>{date}</span>
                      {surgeCount > 0 && <span style={{fontSize:9,background:"#fef3c7",color:"var(--amber)",padding:"2px 7px",borderRadius:6,fontWeight:700}}>⚡{surgeCount}</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <span style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)"}}>{dayCalls.length} llamadas</span>
                      <span style={{fontSize:12,fontFamily:"var(--mono)",color:"var(--cyan)"}}>{mins}m</span>
                      <span style={{fontSize:13,fontFamily:"var(--mono)",fontWeight:700,color:"var(--green)"}}>${money.toFixed(2)}</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{borderTop:"1px solid var(--border)"}}>
                      {dayCalls.map((c, i) => (
                        <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",borderTop:i>0?"1px solid var(--border)":"none",fontSize:12,background:"var(--bg)"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontWeight:600,fontFamily:"var(--mono)",color:"var(--text2)"}}>{c.customerId}</span>
                            <span style={{color:"var(--text3)",fontFamily:"var(--mono)"}}>{c.callStart}</span>
                            {c.surge && <span style={{fontSize:9,background:"#fef3c7",color:"var(--amber)",padding:"1px 6px",borderRadius:4}}>SURGE</span>}
                            {c.billable !== "Yes" && <span style={{fontSize:9,background:"var(--red)22",color:"var(--red)",padding:"1px 6px",borderRadius:4}}>NB</span>}
                          </div>
                          <div style={{display:"flex",gap:10,alignItems:"center"}}>
                            <span style={{fontFamily:"var(--mono)",color:"var(--text2)"}}>{c.duration}m</span>
                            <span style={{fontFamily:"var(--mono)",color:"var(--green)",fontWeight:700}}>${c.pay.toFixed(2)}</span>
                            <button onClick={e => { e.stopPropagation(); startEdit(c); }} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:12,padding:2}}>✏️</button>
                            <button onClick={e => { e.stopPropagation(); handleDelete(c.id); }} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:12,padding:2}}>🗑</button>
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

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"var(--bg2)",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-around",padding:"8px 0 14px",zIndex:100}}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} className="nav-item" onClick={() => setTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 8px",color:active?"var(--cyan)":"var(--text3)",transition:"color .15s",minWidth:40}}>
              <div style={{fontSize:15,lineHeight:1,filter:active?"drop-shadow(0 0 4px var(--cyan))":"none"}}>{t.icon}</div>
              <div style={{fontSize:9,fontWeight:active?700:400,letterSpacing:.3}}>{t.label}</div>
              {active && <div style={{width:14,height:2,background:"var(--cyan)",borderRadius:99,boxShadow:"0 0 6px var(--cyan)"}}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

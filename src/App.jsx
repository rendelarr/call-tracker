import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "call_tracker_data";
const STORAGE_CONFIG = "call_tracker_config";
const defaultConfig = { dailyMoneyGoal: 30 };

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap";
document.head.appendChild(fontLink);

const globalStyle = document.createElement("style");
globalStyle.textContent = `
  :root {
    --bg: #080c10; --bg2: #0d1117; --bg3: #131922;
    --border: #1e2a38; --border2: #243044;
    --cyan: #00e5cc; --cyan2: #00b8a3;
    --green: #39ff7e; --green2: #22c55e;
    --amber: #ffb800; --red: #ff4d6d;
    --blue: #3d8bff; --purple: #9d7aff;
    --text: #e8edf2; --text2: #7a8a9a; --text3: #3d4f62;
    --mono: 'JetBrains Mono', monospace;
    --sans: 'DM Sans', sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); }
  input, textarea, button { font-family: var(--sans); }
  input[type=range] { accent-color: var(--cyan); }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes slideUp { from{transform:translateY(10px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes toastIn { from{transform:translateX(-50%) translateY(-12px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
  .card { animation: slideUp .2s ease; }
  .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
  .btn-primary { transition: all .15s ease; }
  .call-row:hover { background: var(--bg3) !important; }
  .rate-btn:hover { transform: translateY(-1px); }
  .rate-btn { transition: all .15s ease; }
  .heat-cell:hover { transform: scale(1.08); z-index:2; }
  .heat-cell { transition: all .15s ease; }
  .nav-item { transition: color .15s ease; }
  .action-btn:active { transform: scale(.97); }
  .action-btn { transition: all .15s ease; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg2); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
`;
document.head.appendChild(globalStyle);

const RATES = [
  { value: 0.12, label: "Normal", color: "#7a8a9a", icon: "○" },
  { value: 0.13, label: "Bronce", color: "#c47d3a", icon: "◐" },
  { value: 0.14, label: "Plata",  color: "#8fa8c2", icon: "◑" },
  { value: 0.15, label: "Gold",   color: "#ffb800", icon: "●" },
];

const PAY_CYCLES = [
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

const ACHIEVEMENTS = [
  { id:"first_call",  icon:"🎯", label:"Primera llamada",  desc:"Registra tu primera llamada",      check:(c)=>c.length>=1 },
  { id:"10_calls",    icon:"📞", label:"10 llamadas",       desc:"Acumula 10 llamadas",              check:(c)=>c.length>=10 },
  { id:"50_calls",    icon:"💪", label:"50 llamadas",       desc:"Acumula 50 llamadas",              check:(c)=>c.length>=50 },
  { id:"100_calls",   icon:"🏆", label:"Centenario",        desc:"Acumula 100 llamadas",             check:(c)=>c.length>=100 },
  { id:"hour_day",    icon:"⏰", label:"1 hora en un día",  desc:"60+ min en un solo día",           check:(c,bd)=>Object.values(bd).some(d=>d.reduce((s,x)=>s+x.duration,0)>=60) },
  { id:"two_hours",   icon:"🔥", label:"2 horas en un día", desc:"120+ min en un solo día",          check:(c,bd)=>Object.values(bd).some(d=>d.reduce((s,x)=>s+x.duration,0)>=120) },
  { id:"goal_hit",    icon:"🎉", label:"Meta cumplida",     desc:"Alcanza tu meta diaria",           check:(c,bd,cfg)=>Object.values(bd).some(d=>d.reduce((s,x)=>s+x.pay,0)>=cfg.dailyMoneyGoal) },
  { id:"streak3",     icon:"📅", label:"Racha de 3 días",   desc:"Trabaja 3 días seguidos",          check:(c,bd)=>getStreak(Object.keys(bd))>=3 },
  { id:"streak7",     icon:"🗓", label:"Semana completa",   desc:"Trabaja 7 días seguidos",          check:(c,bd)=>getStreak(Object.keys(bd))>=7 },
  { id:"surge_call",  icon:"⚡", label:"Surge rider",       desc:"Completa una llamada en Surge",    check:(c)=>c.some(x=>x.surge) },
  { id:"big_call",    icon:"📈", label:"Maratón",           desc:"Una llamada de 45+ min",           check:(c)=>c.some(x=>x.duration>=45) },
  { id:"early_bird",  icon:"🌅", label:"Madrugador",        desc:"Primera llamada antes de las 8AM", check:(c)=>c.some(x=>{const h=parseHour(x.callStart);return h!==null&&h<8;}) },
];

const QUEST_POOL = [
  { id:"dq_first",     icon:"☀️", label:"Buenos días",      desc:"Registra tu primera llamada",       xp:10, check:(t)=>t.length>=1 },
  { id:"dq_5calls",    icon:"📲", label:"Calentando",        desc:"5 llamadas hoy",                    xp:20, check:(t)=>t.length>=5 },
  { id:"dq_10calls",   icon:"💼", label:"En modo trabajo",   desc:"10 llamadas hoy",                   xp:35, check:(t)=>t.length>=10 },
  { id:"dq_15calls",   icon:"📈", label:"A toda marcha",     desc:"15 llamadas hoy",                   xp:45, check:(t)=>t.length>=15 },
  { id:"dq_20calls",   icon:"🚀", label:"Imparable",         desc:"20 llamadas hoy",                   xp:60, check:(t)=>t.length>=20 },
  { id:"dq_25calls",   icon:"🌟", label:"Máquina",           desc:"25 llamadas hoy",                   xp:75, check:(t)=>t.length>=25 },
  { id:"dq_30min",     icon:"⏱",  label:"30 minutos",        desc:"Acumula 30 min hoy",                xp:15, check:(t)=>t.reduce((s,c)=>s+c.duration,0)>=30 },
  { id:"dq_60min",     icon:"⌛",  label:"Una hora",          desc:"Acumula 60 min hoy",                xp:30, check:(t)=>t.reduce((s,c)=>s+c.duration,0)>=60 },
  { id:"dq_90min",     icon:"🕐",  label:"Hora y media",      desc:"Acumula 90 min hoy",                xp:45, check:(t)=>t.reduce((s,c)=>s+c.duration,0)>=90 },
  { id:"dq_120min",    icon:"🕑",  label:"Dos horas",         desc:"Acumula 120 min hoy",               xp:60, check:(t)=>t.reduce((s,c)=>s+c.duration,0)>=120 },
  { id:"dq_goal25",    icon:"🌱",  label:"Arrancando",        desc:"25% de tu meta $",                  xp:12, check:(t,cfg)=>t.reduce((s,c)=>s+c.pay,0)>=cfg.dailyMoneyGoal*0.25 },
  { id:"dq_goal50",    icon:"🎯",  label:"Medio camino",      desc:"50% de tu meta $",                  xp:25, check:(t,cfg)=>t.reduce((s,c)=>s+c.pay,0)>=cfg.dailyMoneyGoal*0.5 },
  { id:"dq_goal75",    icon:"💪",  label:"Ya casi",           desc:"75% de tu meta $",                  xp:38, check:(t,cfg)=>t.reduce((s,c)=>s+c.pay,0)>=cfg.dailyMoneyGoal*0.75 },
  { id:"dq_goal",      icon:"🏅",  label:"¡Meta cumplida!",   desc:"100% de tu meta $",                 xp:50, check:(t,cfg)=>t.reduce((s,c)=>s+c.pay,0)>=cfg.dailyMoneyGoal },
  { id:"dq_goal150",   icon:"💎",  label:"Superaste la meta", desc:"150% de tu meta $",                 xp:80, check:(t,cfg)=>t.reduce((s,c)=>s+c.pay,0)>=cfg.dailyMoneyGoal*1.5 },
  { id:"dq_long",      icon:"📡",  label:"Llamada larga",     desc:"Una llamada de 20+ min",            xp:20, check:(t)=>t.some(c=>c.duration>=20) },
  { id:"dq_vlong",     icon:"🎙",  label:"Megacall",          desc:"Una llamada de 35+ min",            xp:35, check:(t)=>t.some(c=>c.duration>=35) },
  { id:"dq_early",     icon:"🌅",  label:"Madrugador",        desc:"Primera llamada antes de las 8AM",  xp:30, check:(t)=>t.some(c=>{const h=parseHour(c.callStart);return h!==null&&h<8;}) },
  { id:"dq_morning",   icon:"🌤",  label:"Mañanero",          desc:"3 llamadas antes del mediodía",     xp:25, check:(t)=>t.filter(c=>{const h=parseHour(c.callStart);return h!==null&&h<12;}).length>=3 },
  { id:"dq_afternoon", icon:"🌞",  label:"Tarde productiva",  desc:"5 llamadas entre 12PM y 6PM",       xp:30, check:(t)=>t.filter(c=>{const h=parseHour(c.callStart);return h!==null&&h>=12&&h<18;}).length>=5 },
  { id:"dq_night",     icon:"🌙",  label:"Búho nocturno",     desc:"Una llamada después de las 9PM",    xp:25, check:(t)=>t.some(c=>{const h=parseHour(c.callStart);return h!==null&&h>=21;}) },
  { id:"dq_variety",   icon:"🎨",  label:"Variedad",          desc:"Llamadas en 4 horas distintas",     xp:20, check:(t)=>new Set(t.map(c=>parseHour(c.callStart)).filter(h=>h!==null)).size>=4 },
  { id:"dq_comeback",  icon:"💫",  label:"Comeback",          desc:"Una llamada después de las 6PM",    xp:15, check:(t)=>t.some(c=>{const h=parseHour(c.callStart);return h!==null&&h>=18;}) },
  { id:"dq_3short",    icon:"⚡",  label:"Rápido y eficaz",   desc:"3 llamadas de menos de 5 min",      xp:18, check:(t)=>t.filter(c=>c.duration>0&&c.duration<=5).length>=3 },
  { id:"dq_nonstop",   icon:"🔥",  label:"Sin pausas",        desc:"5 llamadas en menos de 1 hora",     xp:40, check:(t)=>{
    const s=[...t].sort((a,b)=>(parseHour(a.callStart)||0)-(parseHour(b.callStart)||0));
    for(let i=4;i<s.length;i++){const h0=parseHour(s[i-4].callStart),h1=parseHour(s[i].callStart);if(h0!==null&&h1!==null&&(h1-h0)<=1)return true;}
    return false;
  }},
];

const XP_LEVELS = [
  {level:1,min:0,   max:100,  label:"Novato",      color:"#7a8a9a"},
  {level:2,min:100, max:250,  label:"Aprendiz",    color:"#39ff7e"},
  {level:3,min:250, max:500,  label:"Trabajador",  color:"#3d8bff"},
  {level:4,min:500, max:900,  label:"Profesional", color:"#9d7aff"},
  {level:5,min:900, max:1500, label:"Experto",     color:"#ffb800"},
  {level:6,min:1500,max:9999, label:"Élite",       color:"#00e5cc"},
];

const POMO_PRESETS=[
  {label:"Clásico",work:25,brk:5, desc:"El estándar"},
  {label:"Largo",  work:50,brk:10,desc:"Sesión profunda"},
  {label:"Corto",  work:15,brk:3, desc:"Días fragmentados"},
  {label:"Ultra",  work:90,brk:20,desc:"Modo flow"},
];

function getStreak(ds){if(!ds.length)return 0;const s=[...ds].sort((a,b)=>toDate(b)-toDate(a));let st=1,pr=toDate(s[0]);for(let i=1;i<s.length;i++){const c=toDate(s[i]);if(Math.round((pr-c)/86400000)===1){st++;pr=c;}else break;}return st;}
function toDate(str){const[m,d,y]=str.split("/").map(Number);return new Date(y,m-1,d);}
function parseDate(val){if(!val)return null;const s=String(val).trim();if(/^\d{2}\/\d{2}\/\d{4}$/.test(s))return s;const iso=s.match(/^(\d{4})-(\d{2})-(\d{2})/);if(iso)return`${iso[2]}/${iso[3]}/${iso[1]}`;const p=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);if(p){const y=p[3].length===2?"20"+p[3]:p[3];return`${p[1].padStart(2,"0")}/${p[2].padStart(2,"0")}/${y}`;}return s;}
function parseTime(val){if(!val)return"N/A";const s=String(val).trim();if(/\d{1,2}:\d{2}\s?[AP]M/i.test(s))return s;const m=s.match(/^(\d{1,2}):(\d{2})$/);if(m){let h=parseInt(m[1]),min=m[2];const ap=h>=12?"PM":"AM";if(h>12)h-=12;if(h===0)h=12;return`${h}:${min} ${ap}`;}return s;}
function parseHour(t){if(!t||t==="N/A")return null;const m=t.match(/(\d{1,2}):(\d{2})\s?([AP]M)/i);if(!m)return null;let h=parseInt(m[1]);const ap=m[3].toUpperCase();if(ap==="PM"&&h!==12)h+=12;if(ap==="AM"&&h===12)h=0;return h;}
function norm(s){return String(s).toLowerCase().replace(/[^a-z0-9]/g,"");}
function detectFieldSmart(h){const n=norm(h);if(n==="projectid"||n==="project_id")return"customerId";if(n.includes("serviceline"))return"serviceType";if(n.includes("servicedate")||n==="servicedate")return"date";if(n.includes("starttime")||n==="starttimecentral")return"callStart";if(n==="quantity")return"duration";if(n==="earnings")return"earnings";if(n==="adjustment")return"adjustment";if(n==="comments")return"comments";if(n.includes("customer")||n==="id")return"customerId";if(n.includes("date"))return"date";if(n.includes("start"))return"callStart";if(n.includes("duration")||n.includes("minutes"))return"duration";if(n.includes("pay")||n.includes("amount"))return"earnings";return null;}
function parseCSVText(text){const lines=text.trim().split(/\r?\n/).filter(l=>l.trim());if(lines.length<2)return{headers:[],rows:[]};const fl=lines[0];const useTab=(fl.match(/\t/g)||[]).length>(fl.match(/,/g)||[]).length;const split=l=>useTab?l.split("\t").map(s=>s.trim().replace(/^"|"$/g,"")):l.split(",").map(s=>s.trim().replace(/^"|"$/g,""));return{headers:split(lines[0]),rows:lines.slice(1).map(split)};}
function rowsToCallsSmart(rows,headers){const map={};headers.forEach((h,i)=>{const f=detectFieldSmart(h);if(f&&map[f]===undefined)map[f]=i;});return rows.map(row=>{const g=f=>map[f]!==undefined?String(row[map[f]]||"").trim():"";const earnings=parseFloat(g("earnings").replace(/[$,]/g,""))||0;const adjustment=parseFloat(g("adjustment").replace(/[$,]/g,""))||0;const totalPay=Math.round((earnings+adjustment)*100)/100;const comments=g("comments");const date=parseDate(g("date"));const duration=parseInt(g("duration"))||0;return{customerId:g("customerId")||"N/A",date:date||"N/A",callStart:parseTime(g("callStart")),duration,billable:"Yes",dropped:"No",pay:totalPay,surge:comments.toLowerCase().includes("surge"),serviceType:g("serviceType")||"",id:Date.now()+Math.random()};}).filter(c=>c.date!=="N/A"&&c.duration>0);}
function parseCallText(text){const clean=text.replace(/\s+/g," ").trim();const custMatch=clean.match(/(\d{5,})/);const dateMatch=clean.match(/(\d{2}\/\d{2}\/\d{4})/);const timeMatch=clean.match(/(\d{1,2}:\d{2}\s?[AP]M)/i);const durMatch=clean.match(/(\d+)\s*(?:Yes|No)/i);const billMatch=clean.match(/(\d+)\s*(Yes|No)\s*(Yes|No)/i);const payMatch=clean.match(/\$(\d+\.?\d*)/);if(!dateMatch||!durMatch)return null;return{customerId:custMatch?custMatch[1]:"N/A",date:dateMatch[1],callStart:timeMatch?timeMatch[1].trim():"N/A",duration:parseInt(durMatch[1]),billable:billMatch?billMatch[2]:"No",dropped:billMatch?billMatch[3]:"No",pay:payMatch?parseFloat(payMatch[1]):0,id:Date.now()+Math.random()};}
function today(){const d=new Date();return`${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}/${d.getFullYear()}`;}
function last7Dates(){return Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-i);return`${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}/${d.getFullYear()}`;}).reverse();}
function last30Dates(){return Array.from({length:30},(_,i)=>{const d=new Date();d.setDate(d.getDate()-i);return`${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}/${d.getFullYear()}`;}).reverse();}
function groupByDate(calls){return calls.reduce((acc,c)=>{if(!acc[c.date])acc[c.date]=[];acc[c.date].push(c);return acc;},{});}
function getCurrentCycle(){const now=new Date();now.setHours(0,0,0,0);return PAY_CYCLES.find(c=>{const s=toDate(c.start),e=toDate(c.end);return now>=s&&now<=e;})||null;}
function daysUntil(ds){const t=toDate(ds);t.setHours(0,0,0,0);const n=new Date();n.setHours(0,0,0,0);return Math.ceil((t-n)/86400000);}
function getDailyQuests(ds){const[m,d,y]=ds.split("/").map(Number);let seed=y*10000+m*100+d;const rng=()=>{seed=(seed*1664525+1013904223)&0xffffffff;return Math.abs(seed)/0xffffffff;};const pool=[...QUEST_POOL];const sel=[];while(sel.length<8&&pool.length>0){const idx=Math.floor(rng()*pool.length);sel.push(pool.splice(idx,1)[0]);}return sel;}
function fmtTime(s){const m=Math.floor(s/60),sc=s%60;return`${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`;}
function getNowTimeStr(){const d=new Date();let h=d.getHours(),mi=d.getMinutes();const ap=h>=12?"PM":"AM";if(h>12)h-=12;if(h===0)h=12;return`${h}:${String(mi).padStart(2,"0")} ${ap}`;}

const CC={
  card:{background:"var(--bg2)",borderRadius:16,border:"1px solid var(--border)"},
  cardGlow:(c)=>({background:"var(--bg2)",borderRadius:16,border:`1px solid ${c}33`,boxShadow:`0 0 24px ${c}0d`}),
  input:{width:"100%",background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:10,color:"var(--text)",padding:"10px 14px",fontSize:14,outline:"none"},
  label:{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:6,display:"block"},
};

function Modal({onClose,children}){
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"#000000cc",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{...CC.card,padding:24,width:"100%",maxWidth:360,animation:"slideUp .2s ease"}}>
        {children}
      </div>
    </div>
  );
}

function HeatmapCard({heatmap,maxHeat}){
  const[tip,setTip]=useState(null);
  const nowH=new Date().getHours();
  const blocks=[
    {label:"Mañana",hours:Array.from({length:6},(_,i)=>i+6), color:"#ffb800"},
    {label:"Tarde", hours:Array.from({length:6},(_,i)=>i+12),color:"#ff6b35"},
    {label:"Noche", hours:Array.from({length:6},(_,i)=>i+18),color:"#9d7aff"},
  ];
  return(
    <div style={{...CC.card,padding:20,marginBottom:12}} className="card">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>Actividad por hora</div>
        <div style={{fontSize:10,color:"var(--text3)",fontFamily:"var(--mono)"}}>minutos activos</div>
      </div>
      {blocks.map(block=>{
        const total=block.hours.reduce((s,h)=>s+heatmap[h],0);
        const bMax=Math.max(...block.hours.map(h=>heatmap[h]),1);
        const r=parseInt(block.color.slice(1,3),16),g=parseInt(block.color.slice(3,5),16),b=parseInt(block.color.slice(5,7),16);
        return(
          <div key={block.label} style={{marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:10,fontWeight:700,color:block.color,letterSpacing:.5}}>{block.label.toUpperCase()}</span>
              {total>0?<span style={{fontSize:11,fontFamily:"var(--mono)",color:block.color}}>{total}m</span>:<span style={{fontSize:10,color:"var(--text3)"}}>sin actividad</span>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:5}}>
              {block.hours.map(h=>{
                const val=heatmap[h];
                const intensity=val/maxHeat;
                const isNow=h===nowH;
                const bg=intensity>0?`rgba(${r},${g},${b},${0.12+intensity*0.78})`:"var(--bg)";
                return(
                  <div key={h} className="heat-cell" onMouseEnter={()=>setTip(h)} onMouseLeave={()=>setTip(null)}
                    title={`${h%12||12}${h<12?"am":"pm"}: ${val}m`}
                    style={{borderRadius:8,padding:"9px 4px",background:bg,textAlign:"center",border:isNow?`1px solid ${block.color}88`:`1px solid ${intensity>0?"transparent":"var(--border)"}`,boxShadow:isNow?`0 0 8px ${block.color}44`:tip===h?`0 0 6px ${block.color}22`:"none",cursor:"default",position:"relative"}}>
                    {isNow&&<div style={{position:"absolute",top:3,right:3,width:4,height:4,borderRadius:"50%",background:block.color,animation:"pulse 1.5s infinite"}}/>}
                    <div style={{fontSize:9,fontFamily:"var(--mono)",color:intensity>0.5?"#fff":isNow?block.color:"var(--text3)",fontWeight:600}}>{h%12||12}{h<12?"a":"p"}</div>
                    <div style={{fontSize:intensity>0?10:9,fontWeight:700,fontFamily:"var(--mono)",color:intensity>0?(intensity>0.5?"#fff":block.color):"var(--border2)",marginTop:4}}>{val>0?`${val}`:"·"}</div>
                    {val>0&&<div style={{marginTop:4,height:2,borderRadius:99,background:"rgba(255,255,255,.12)",overflow:"hidden"}}><div style={{width:`${(val/bMax)*100}%`,height:"100%",background:intensity>0.5?"rgba(255,255,255,.5)":block.color,borderRadius:99}}/></div>}
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:6,display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:9,color:"var(--text3)",fontFamily:"var(--mono)"}}>0</span>
              <div style={{flex:1,height:2,borderRadius:99,background:`linear-gradient(90deg,var(--bg),${block.color})`,opacity:.4}}/>
              <span style={{fontSize:9,color:block.color,fontFamily:"var(--mono)",fontWeight:700}}>{Math.max(...block.hours.map(h=>heatmap[h]))}m</span>
            </div>
          </div>
        );
      })}
      {maxHeat<=1&&<div style={{textAlign:"center",padding:"16px 0",color:"var(--text3)",fontSize:12}}>Registra llamadas para ver tu actividad por hora</div>}
    </div>
  );
}

const Pill=({active,onClick,children,color="var(--cyan)"})=>(
  <button onClick={onClick} style={{padding:"6px 14px",borderRadius:99,border:"none",cursor:"pointer",fontWeight:600,fontSize:12,background:active?`${color}22`:"transparent",color:active?color:"var(--text2)",outline:active?`1px solid ${color}55`:"1px solid var(--border)",transition:"all .15s"}}>{children}</button>
);

const StatBox=({label,value,color="var(--cyan)",sub})=>(
  <div style={{...CC.card,padding:"14px 16px"}}>
    <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:6}}>{label}</div>
    <div style={{fontSize:22,fontWeight:800,color,fontFamily:"var(--mono)",lineHeight:1}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"var(--text2)",marginTop:4}}>{sub}</div>}
  </div>
);

export default function App(){
  const[calls,setCalls]=useState([]);
  const[config,setConfig]=useState(defaultConfig);
  const[rawText,setRawText]=useState("");
  const[parsed,setParsed]=useState(null);
  const[parseError,setParseError]=useState("");
  const[tab,setTab]=useState("home");
  const[showConfig,setShowConfig]=useState(false);
  const[tempConfig,setTempConfig]=useState(defaultConfig);
  const[showGoal,setShowGoal]=useState(false);
  const[tempGoal,setTempGoal]=useState(defaultConfig.dailyMoneyGoal);
  const[toast,setToast]=useState("");
  const[activeRate,setActiveRate]=useState(0.12);
  const[cycleView,setCycleView]=useState("current");
  const[achTab,setAchTab]=useState("daily");
  const[idleSeconds,setIdleSeconds]=useState(0);
  const[liveActive,setLiveActive]=useState(false);
  const[liveSeconds,setLiveSeconds]=useState(0);
  const[liveStart,setLiveStart]=useState(null);
  const liveRef=useRef(null);
  const[showManual,setShowManual]=useState(false);
  const[showPaste,setShowPaste]=useState(false);
  const[manualForm,setManualForm]=useState({customerId:"",startTime:"",endTime:"",duration:"",pay:""});
  const[editingId,setEditingId]=useState(null);
  const[editForm,setEditForm]=useState({});
  const[pomoTab,setPomoTab]=useState("timer");
  const[pomoWork,setPomoWork]=useState(25);
  const[pomoBreak,setPomoBreak]=useState(5);
  const[pomoState,setPomoState]=useState("idle");
  const[pomoSeconds,setPomoSeconds]=useState(0);
  const[pomoRounds,setPomoRounds]=useState(0);
  const pomoRef=useRef(null);
  const[alarmMins,setAlarmMins]=useState(10);
  const[alarmEnabled,setAlarmEnabled]=useState(false);
  const[alarmFired,setAlarmFired]=useState(false);
  const alarmRef=useRef(null);
  const[importStep,setImportStep]=useState("idle");
  const[importPreview,setImportPreview]=useState([]);
  const[importError,setImportError]=useState("");
  const[importFileName,setImportFileName]=useState("");
  const[importStats,setImportStats]=useState(null);
  const fileRef=useRef();

  useEffect(()=>{try{const d=localStorage.getItem(STORAGE_KEY);if(d)setCalls(JSON.parse(d));const c=localStorage.getItem(STORAGE_CONFIG);if(c){const cfg=JSON.parse(c);setConfig(cfg);setTempConfig(cfg);setTempGoal(cfg.dailyMoneyGoal||30);}}catch{}},[]);
  useEffect(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(calls));}catch{}},[calls]);
  useEffect(()=>{if(!window.XLSX){const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";document.head.appendChild(s);}},[]);
  useEffect(()=>{if(liveActive){liveRef.current=setInterval(()=>setLiveSeconds(s=>s+1),1000);}else{clearInterval(liveRef.current);}return()=>clearInterval(liveRef.current);},[liveActive]);
  useEffect(()=>{
    if(pomoState==="work"||pomoState==="break"){const total=(pomoState==="work"?pomoWork:pomoBreak)*60;pomoRef.current=setInterval(()=>{setPomoSeconds(s=>{if(s+1>=total){clearInterval(pomoRef.current);playBeep(pomoState==="work"?880:440);if(pomoState==="work"){setPomoState("break");setPomoSeconds(0);setPomoRounds(r=>r+1);}else{setPomoState("idle");setPomoSeconds(0);}return 0;}return s+1;});},1000);}
    return()=>clearInterval(pomoRef.current);
  },[pomoState,pomoWork,pomoBreak]);
  useEffect(()=>{if(!alarmEnabled){clearInterval(alarmRef.current);setAlarmFired(false);return;}setAlarmFired(false);alarmRef.current=setInterval(()=>{setAlarmFired(true);playBeep(330,0.8,0.6);},alarmMins*60*1000);return()=>clearInterval(alarmRef.current);},[alarmEnabled,alarmMins]);
  useEffect(()=>{setAlarmFired(false);if(alarmEnabled){clearInterval(alarmRef.current);alarmRef.current=setInterval(()=>{setAlarmFired(true);playBeep(330,0.8,0.6);},alarmMins*60*1000);}},[calls.length]);
  useEffect(()=>{if(tab!=="perf")return;const t=setInterval(()=>setIdleSeconds(s=>s+1),1000);return()=>clearInterval(t);},[tab]);
  useEffect(()=>setIdleSeconds(0),[calls.length]);

  function playBeep(freq=660,vol=0.5,dur=0.4){try{const ctx=new(window.AudioContext||window.webkitAudioContext)();const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=freq;g.gain.setValueAtTime(vol,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+dur);o.start();o.stop(ctx.currentTime+dur);}catch{}}
  function showToast(msg){setToast(msg);setTimeout(()=>setToast(""),3000);}
  function startLiveCall(){setLiveSeconds(0);setLiveStart(getNowTimeStr());setLiveActive(true);}
  function stopLiveCall(){setLiveActive(false);const mins=Math.max(1,Math.round(liveSeconds/60));const pay=parseFloat((mins*activeRate).toFixed(2));setManualForm({customerId:"",startTime:liveStart||"",endTime:getNowTimeStr(),duration:String(mins),pay:String(pay)});setShowManual(true);}
  function cancelLiveCall(){setLiveActive(false);setLiveSeconds(0);setLiveStart(null);}
  function handleManualChange(field,val){setManualForm(p=>{const next={...p,[field]:val};if(field==="startTime"||field==="endTime"){const toMins=t=>{const m=t.match(/(\d{1,2}):(\d{2})\s?([AP]M)/i);if(!m)return null;let h=parseInt(m[1]);const ap=m[3].toUpperCase();if(ap==="PM"&&h!==12)h+=12;if(ap==="AM"&&h===12)h=0;return h*60+parseInt(m[2]);};const s=toMins(next.startTime),e=toMins(next.endTime);if(s!==null&&e!==null&&e>s){next.duration=String(e-s);next.pay=String(parseFloat(((e-s)*activeRate).toFixed(2)));}}if(field==="duration"&&val)next.pay=String(parseFloat((parseInt(val)*activeRate).toFixed(2)));return next;});}
  function submitManual(){const dur=parseInt(manualForm.duration)||0;if(!dur){showToast("⚠️ Duración inválida");return;}const newCall={customerId:manualForm.customerId||"Manual",date:todayStr,callStart:manualForm.startTime||getNowTimeStr(),duration:dur,billable:"Yes",dropped:"No",pay:parseFloat(manualForm.pay)||parseFloat((dur*activeRate).toFixed(2)),surge:false,id:Date.now()+Math.random()};setCalls(prev=>[...prev,newCall]);setShowManual(false);setManualForm({customerId:"",startTime:"",endTime:"",duration:"",pay:""});setLiveStart(null);showToast("✅ Llamada agregada");}
  function startEdit(c){setEditingId(c.id);setEditForm({callStart:c.callStart,duration:String(c.duration),pay:String(c.pay),customerId:c.customerId});}
  function handleEditChange(field,val){setEditForm(p=>{const next={...p,[field]:val};if(field==="duration"&&val)next.pay=String(parseFloat((parseInt(val)*activeRate).toFixed(2)));return next;});}
  function saveEdit(id){setCalls(prev=>prev.map(c=>c.id===id?{...c,callStart:editForm.callStart,duration:parseInt(editForm.duration)||c.duration,pay:parseFloat(editForm.pay)||c.pay,customerId:editForm.customerId||c.customerId}:c));setEditingId(null);showToast("✏️ Actualizado");}
  function startPomo(){setPomoState("work");setPomoSeconds(0);}
  function stopPomo(){setPomoState("idle");setPomoSeconds(0);clearInterval(pomoRef.current);}
  async function handleFileLoad(file){if(!file)return;setImportError("");setImportFileName(file.name);const isXLSX=/\.xlsx?$/i.test(file.name),isCSV=/\.csv$/i.test(file.name);if(!isXLSX&&!isCSV){setImportError("Solo CSV o Excel.");return;}try{let headers=[],rows=[];if(isCSV){const text=await file.text();({headers,rows}=parseCSVText(text));}else{const buf=await file.arrayBuffer();const XLSX=window.XLSX;if(!XLSX){setImportError("Librería no disponible.");return;}const wb=XLSX.read(buf,{type:"array"});const ws=wb.Sheets[wb.SheetNames[0]];const data=XLSX.utils.sheet_to_json(ws,{header:1,defval:""});headers=data[0].map(h=>String(h).trim());rows=data.slice(1).map(r=>r.map(v=>String(v).trim()));}if(!headers.length){setImportError("Archivo vacío.");return;}const preview=rowsToCallsSmart(rows,headers);if(!preview.length){setImportError("Sin filas válidas.");return;}setImportPreview(preview);setImportStats({total:preview.length,surge:preview.filter(c=>c.surge).length,totalPay:preview.reduce((s,c)=>s+c.pay,0),totalMins:preview.reduce((s,c)=>s+c.duration,0)});setImportStep("preview");}catch(e){setImportError("Error: "+e.message);}}
  function confirmImport(){const existing=new Set(calls.map(c=>`${c.customerId}-${c.date}-${c.callStart}`));const newCalls=importPreview.filter(c=>!existing.has(`${c.customerId}-${c.date}-${c.callStart}`));setCalls(prev=>[...prev,...newCalls]);setImportStep("done");showToast(`✅ ${newCalls.length} importadas`);}
  function resetImport(){setImportStep("idle");setImportPreview([]);setImportError("");setImportFileName("");setImportStats(null);if(fileRef.current)fileRef.current.value="";}

  const todayStr=today();
  const billableCalls=calls.filter(c=>c.billable==="Yes");
  const byDate=groupByDate(billableCalls);
  const todayCalls=byDate[todayStr]||[];
  const todayMoney=todayCalls.reduce((s,c)=>s+c.pay,0);
  const todayMins=todayCalls.reduce((s,c)=>s+c.duration,0);
  const moneyPct=Math.min(100,Math.round((todayMoney/config.dailyMoneyGoal)*100));
  const weekDates=last7Dates();
  const weekData=weekDates.map(d=>({date:d,label:d.slice(0,5),mins:(byDate[d]||[]).reduce((s,c)=>s+c.duration,0),money:(byDate[d]||[]).reduce((s,c)=>s+c.pay,0)}));
  const weekMoney=weekData.reduce((s,d)=>s+d.money,0);
  const weekMins=weekData.reduce((s,d)=>s+d.mins,0);
  const maxMins=Math.max(...weekData.map(d=>d.mins),1);
  const sortedDates=[...new Set(calls.map(c=>c.date))].sort((a,b)=>toDate(b)-toDate(a));
  const currentCycle=getCurrentCycle();
  function getCycleStats(cycle){const s=toDate(cycle.start),e=toDate(cycle.end);const cc=billableCalls.filter(c=>{const d=toDate(c.date);return d>=s&&d<=e;});return{mins:cc.reduce((s,c)=>s+c.duration,0),money:cc.reduce((s,c)=>s+c.pay,0),count:cc.length};}
  const activeDates=Object.keys(byDate);
  const streak=getStreak(activeDates);
  const last30=last30Dates();
  const yestStr=(()=>{const d=new Date();d.setDate(d.getDate()-1);return`${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}/${d.getFullYear()}`;})();
  const yestMoney=(byDate[yestStr]||[]).reduce((s,c)=>s+c.pay,0);
  const yestMins=(byDate[yestStr]||[]).reduce((s,c)=>s+c.duration,0);
  const lwDates=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(7+i));return`${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}/${d.getFullYear()}`;});
  const lwMoney=lwDates.reduce((s,d)=>s+(byDate[d]||[]).reduce((ss,c)=>ss+c.pay,0),0);
  const lwMins=lwDates.reduce((s,d)=>s+(byDate[d]||[]).reduce((ss,c)=>ss+c.duration,0),0);
  const heatmap=Array(24).fill(0);
  billableCalls.forEach(c=>{const h=parseHour(c.callStart);if(h!==null)heatmap[h]+=c.duration;});
  const maxHeat=Math.max(...heatmap,1);
  const toMinsOfDay=t=>{if(!t||t==="N/A")return null;const m=t.match(/(\d{1,2}):(\d{2})\s?([AP]M)/i);if(!m)return null;let h=parseInt(m[1]);const ap=m[3].toUpperCase();if(ap==="PM"&&h!==12)h+=12;if(ap==="AM"&&h===12)h=0;return h*60+parseInt(m[2]);};
  const sortedToday=[...todayCalls].sort((a,b)=>(toMinsOfDay(a.callStart)||0)-(toMinsOfDay(b.callStart)||0));
  let avgGap=null;
  if(sortedToday.length>1){const gaps=[];for(let i=1;i<sortedToday.length;i++){const mA=toMinsOfDay(sortedToday[i-1].callStart),mB=toMinsOfDay(sortedToday[i].callStart);if(mA!==null&&mB!==null&&mB>mA)gaps.push((mB-mA)-sortedToday[i-1].duration);}if(gaps.length)avgGap=Math.round(gaps.filter(g=>g>=0).reduce((s,g)=>s+g,0)/Math.max(gaps.filter(g=>g>=0).length,1));}
  let projection=null;
  if(currentCycle){const stats=getCycleStats(currentCycle);const s=toDate(currentCycle.start),e=toDate(currentCycle.end);const totalDays=Math.round((e-s)/86400000)+1;const daysPassed=totalDays-Math.max(daysUntil(currentCycle.end),0);if(daysPassed>0)projection=Math.round((stats.money/daysPassed*totalDays)*100)/100;}
  const scoreGoal=Math.min(40,moneyPct*0.4);
  const scoreRhythm=avgGap!==null?Math.min(30,Math.max(0,30-(avgGap*1.5))):(todayCalls.length>0?15:0);
  const scoreStreak=Math.min(20,streak*4);
  const scoreHours=Math.min(10,todayCalls.length>0?10:0);
  const score=Math.round(scoreGoal+scoreRhythm+scoreStreak+scoreHours);
  const scoreColor=score>=75?"var(--green)":score>=45?"var(--amber)":"var(--red)";
  const scoreLabel=score>=75?"Excelente":score>=45?"Bien":score>=20?"Flojo":"Inactivo";
  const idleCost=(idleSeconds/60*0.12).toFixed(3);
  const DAILY_QUESTS=getDailyQuests(todayStr);
  const completedDaily=DAILY_QUESTS.filter(q=>q.check(todayCalls,config));
  const unlockedAch=ACHIEVEMENTS.filter(a=>a.check(billableCalls,byDate,config));
  const totalXP=completedDaily.reduce((s,q)=>s+q.xp,0)+unlockedAch.length*15;
  const currentLevel=XP_LEVELS.slice().reverse().find(l=>totalXP>=l.min)||XP_LEVELS[0];
  const nextLevel=XP_LEVELS.find(l=>l.level===currentLevel.level+1);
  const xpInLevel=totalXP-currentLevel.min;
  const xpNeeded=nextLevel?nextLevel.min-currentLevel.min:1;
  const xpPct=Math.min(100,Math.round((xpInLevel/xpNeeded)*100));
  function handleParse(){setParseError("");const r=parseCallText(rawText);if(!r){setParseError("No pude interpretar el texto.");setParsed(null);return;}setParsed(r);}
  function handleAdd(){if(!parsed)return;if(parsed.billable!=="Yes"){showToast("⚠️ No billable.");setParsed(null);setRawText("");return;}setCalls(prev=>[...prev,parsed]);setParsed(null);setRawText("");showToast("✅ Llamada agregada");}
  function handleDelete(id){setCalls(prev=>prev.filter(c=>c.id!==id));}

  const TABS=[
    {id:"home", icon:"◉",label:"Hoy"},
    {id:"perf", icon:"⚡",label:"Stats"},
    {id:"week", icon:"▦", label:"Semana"},
    {id:"cycle",icon:"◎",label:"Ciclo"},
    {id:"focus",icon:"⏺",label:"Focus"},
    {id:"history",icon:"≡",label:"Historial"},
  ];

  return(
    <div style={{minHeight:"100vh",background:"var(--bg)",color:"var(--text)",fontFamily:"var(--sans)",paddingBottom:80}}>

      {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:"var(--bg3)",border:"1px solid var(--cyan)",color:"var(--cyan)",padding:"10px 20px",borderRadius:99,fontWeight:600,zIndex:999,fontSize:13,whiteSpace:"nowrap",animation:"toastIn .25s ease",boxShadow:"0 0 20px #00e5cc22"}}>{toast}</div>}

      {liveActive&&(
        <div style={{position:"fixed",top:0,left:0,right:0,background:"linear-gradient(135deg,#001a0e,#002414)",borderBottom:"1px solid var(--green2)",zIndex:150,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"var(--green)",animation:"pulse 1s infinite"}}/>
            <div>
              <div style={{fontSize:10,color:"var(--green2)",fontWeight:700,letterSpacing:1}}>EN LLAMADA</div>
              <div style={{fontSize:24,fontWeight:800,fontFamily:"var(--mono)",color:"var(--green)",lineHeight:1}}>{fmtTime(liveSeconds)}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="action-btn" onClick={stopLiveCall} style={{background:"var(--green)",border:"none",borderRadius:8,color:"#000",padding:"8px 16px",fontWeight:800,cursor:"pointer",fontSize:13}}>✓ Guardar</button>
            <button className="action-btn" onClick={cancelLiveCall} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:8,color:"var(--text2)",padding:"8px 14px",fontWeight:600,cursor:"pointer",fontSize:13}}>✕</button>
          </div>
        </div>
      )}

      {alarmFired&&(
        <div style={{position:"fixed",top:liveActive?56:0,left:0,right:0,background:"linear-gradient(135deg,#1a0008,#240010)",borderBottom:"1px solid var(--red)",zIndex:140,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:13,fontWeight:700,color:"var(--red)"}}>⏰ {alarmMins} min sin registrar</div>
          <button onClick={()=>setAlarmFired(false)} style={{background:"var(--red)",border:"none",borderRadius:8,color:"#fff",padding:"6px 14px",cursor:"pointer",fontWeight:700,fontSize:12}}>OK</button>
        </div>
      )}

      {/* HEADER */}
      <div style={{padding:"20px 20px 0",display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:liveActive||alarmFired?56:0}}>
        <div>
          <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1.5,fontFamily:"var(--mono)"}}>CALL TRACKER</div>
          <div style={{fontSize:11,color:"var(--text2)",marginTop:1,fontFamily:"var(--mono)"}}>{todayStr}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{setTempGoal(config.dailyMoneyGoal);setShowGoal(true);}} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:8,color:"var(--text2)",padding:"7px 12px",cursor:"pointer",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
            <span style={{color:"var(--amber)"}}>◎</span> Meta
          </button>
          <button onClick={()=>setShowConfig(true)} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:8,color:"var(--text2)",padding:"7px 12px",cursor:"pointer",fontSize:15}}>⚙</button>
        </div>
      </div>

      {/* MODALS */}
      {showGoal&&(
        <Modal onClose={()=>setShowGoal(false)}>
          <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>META DIARIA</div>
          <div style={{fontSize:20,fontWeight:700,color:"var(--text)",marginBottom:20}}>¿Cuánto quieres ganar hoy?</div>
          <label style={CC.label}>Monto en dólares</label>
          <div style={{position:"relative",marginBottom:20}}>
            <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--amber)",fontWeight:700,fontSize:18,fontFamily:"var(--mono)"}}>$</div>
            <input type="number" step="0.01" min="0" value={tempGoal} onChange={e=>setTempGoal(e.target.value)} autoFocus
              style={{...CC.input,paddingLeft:32,fontSize:24,fontFamily:"var(--mono)",fontWeight:800,color:"var(--amber)",border:"1px solid var(--amber)44"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn-primary" onClick={()=>{const val=parseFloat(tempGoal)||30;const nc={...config,dailyMoneyGoal:val};setConfig(nc);setTempConfig(nc);try{localStorage.setItem(STORAGE_CONFIG,JSON.stringify(nc));}catch{}setShowGoal(false);showToast("🎯 Meta: $"+val.toFixed(2));}} style={{flex:1,background:"var(--amber)",border:"none",borderRadius:10,color:"#000",padding:"12px",fontWeight:800,cursor:"pointer",fontSize:14}}>Guardar</button>
            <button onClick={()=>setShowGoal(false)} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:10,color:"var(--text2)",padding:"12px 16px",cursor:"pointer",fontSize:14}}>✕</button>
          </div>
        </Modal>
      )}

      {showConfig&&(
        <Modal onClose={()=>setShowConfig(false)}>
          <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>IMPORTAR</div>
          <div style={{fontSize:20,fontWeight:700,color:"var(--text)",marginBottom:20}}>Cargar llamadas</div>
          {importError&&<div style={{background:"#1a0505",border:"1px solid var(--red)44",borderRadius:8,padding:"10px 12px",color:"var(--red)",fontSize:12,marginBottom:12}}>{importError}</div>}
          {importStep==="idle"&&<button onClick={()=>fileRef.current.click()} style={{width:"100%",background:"var(--bg)",border:"2px dashed var(--border2)",borderRadius:12,color:"var(--text2)",padding:"28px",fontWeight:600,cursor:"pointer",fontSize:13,textAlign:"center"}}><div style={{fontSize:28,marginBottom:8}}>📂</div><div>Seleccionar CSV o Excel</div><div style={{fontSize:11,color:"var(--text3)",marginTop:4}}>Arrastra o haz clic</div></button>}
          {importStep==="preview"&&importStats&&(
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
                <button className="btn-primary" onClick={()=>{confirmImport();setShowConfig(false);}} style={{flex:1,background:"var(--green2)",border:"none",borderRadius:10,color:"#fff",padding:"12px",fontWeight:700,cursor:"pointer",fontSize:14}}>✅ Confirmar</button>
                <button onClick={resetImport} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:10,color:"var(--text2)",padding:"12px 16px",cursor:"pointer"}}>✕</button>
              </div>
            </div>
          )}
          {importStep==="done"&&<div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:32,marginBottom:8}}>✅</div><div style={{color:"var(--green)",fontWeight:700,marginBottom:16}}>Importado con éxito</div><button onClick={()=>{resetImport();setShowConfig(false);}} style={{background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:10,color:"var(--text2)",padding:"10px 20px",cursor:"pointer",fontWeight:600}}>Cerrar</button></div>}
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={e=>handleFileLoad(e.target.files[0])} style={{display:"none"}}/>
        </Modal>
      )}

      {showManual&&(
        <Modal onClose={()=>{setShowManual(false);setLiveStart(null);}}>
          <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>NUEVA LLAMADA</div>
          <div style={{fontSize:18,fontWeight:700,color:"var(--text)",marginBottom:18}}>{liveStart?"Guardar llamada grabada":"Agregar manualmente"}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            {[["ID Cliente","customerId","text","Opcional"],["Hora inicio","startTime","text","08:00 AM"],["Hora fin","endTime","text","08:15 AM"],["Minutos","duration","number","15"]].map(([label,field,type,ph])=>(
              <div key={field}>
                <label style={CC.label}>{label}</label>
                <input type={type} placeholder={ph} value={manualForm[field]} onChange={e=>handleManualChange(field,e.target.value)} style={{...CC.input,fontSize:13}}/>
              </div>
            ))}
          </div>
          <div style={{marginBottom:16}}>
            <label style={CC.label}>Pago ($)</label>
            <input type="number" step="0.01" value={manualForm.pay} onChange={e=>setManualForm(p=>({...p,pay:e.target.value}))} style={{...CC.input,fontSize:20,fontFamily:"var(--mono)",fontWeight:800,color:"var(--green)",border:"1px solid var(--green)33"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn-primary" onClick={submitManual} style={{flex:1,background:"var(--green2)",border:"none",borderRadius:10,color:"#fff",padding:"12px",fontWeight:700,cursor:"pointer",fontSize:14}}>+ Agregar</button>
            <button onClick={()=>{setShowManual(false);setLiveStart(null);}} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:10,color:"var(--text2)",padding:"12px 16px",cursor:"pointer"}}>✕</button>
          </div>
        </Modal>
      )}

      {showPaste&&(
        <Modal onClose={()=>{setShowPaste(false);setParsed(null);setRawText("");}}>
          <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>PEGAR DATOS</div>
          <div style={{fontSize:18,fontWeight:700,color:"var(--text)",marginBottom:16}}>Pegar llamada</div>
          <div style={{marginBottom:14}}>
            <label style={CC.label}>Tarifa activa</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {RATES.map(r=>{const active=activeRate===r.value;return(
                <button key={r.value} className="rate-btn" onClick={()=>setActiveRate(r.value)} style={{padding:"8px 10px",borderRadius:8,border:"none",cursor:"pointer",background:active?`${r.color}22`:"var(--bg)",outline:active?`1px solid ${r.color}88`:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{color:r.color,fontSize:14}}>{r.icon}</span>
                  <div style={{textAlign:"left"}}><div style={{fontWeight:800,fontSize:12,color:active?r.color:"var(--text)",fontFamily:"var(--mono)"}}>${r.value}/min</div><div style={{fontSize:10,color:"var(--text3)"}}>{r.label}</div></div>
                </button>
              );})}
            </div>
          </div>
          <label style={CC.label}>Datos de la llamada</label>
          <textarea value={rawText} onChange={e=>setRawText(e.target.value)} placeholder="191403/09/202608:17 AM3YesNo$0.36" style={{...CC.input,height:70,resize:"vertical",fontSize:12,fontFamily:"var(--mono)",marginBottom:8}}/>
          {parseError&&<div style={{color:"var(--red)",fontSize:12,marginBottom:8}}>{parseError}</div>}
          {!parsed&&<button className="btn-primary" onClick={handleParse} style={{width:"100%",background:"var(--cyan)",border:"none",borderRadius:10,color:"#000",padding:"11px",fontWeight:700,cursor:"pointer",fontSize:14}}>Interpretar</button>}
          {parsed&&(
            <div style={{background:"var(--bg)",borderRadius:10,padding:14,border:`1px solid ${parsed.billable==="Yes"?"var(--green)44":"var(--red)44"}`}}>
              <div style={{fontWeight:700,color:parsed.billable==="Yes"?"var(--green)":"var(--red)",marginBottom:10,fontSize:13}}>{parsed.billable==="Yes"?"✅ Billable":"⛔ No Billable"}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
                {[["Cliente",parsed.customerId],["Fecha",parsed.date],["Inicio",parsed.callStart],["Duración",`${parsed.duration}m`],["Pago",`$${parsed.pay.toFixed(2)}`]].map(([k,v])=>(
                  <div key={k}><div style={{fontSize:10,color:"var(--text3)"}}>{k}</div><div style={{fontWeight:700,fontSize:13,fontFamily:"var(--mono)",color:"var(--text)"}}>{v}</div></div>
                ))}
              </div>
              {parsed.billable==="Yes"
                ?<button className="btn-primary" onClick={()=>{handleAdd();setShowPaste(false);}} style={{width:"100%",background:"var(--green2)",border:"none",borderRadius:9,color:"#fff",padding:"10px",fontWeight:700,cursor:"pointer",fontSize:14}}>➕ Agregar</button>
                :<button onClick={()=>{setParsed(null);setRawText("");}} style={{width:"100%",background:"transparent",border:"1px solid var(--border2)",borderRadius:9,color:"var(--text2)",padding:"10px",fontWeight:700,cursor:"pointer",fontSize:14}}>Descartar</button>
              }
            </div>
          )}
        </Modal>
      )}

      {editingId&&(
        <Modal onClose={()=>setEditingId(null)}>
          <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>EDITAR LLAMADA</div>
          <div style={{fontSize:18,fontWeight:700,color:"var(--text)",marginBottom:18}}>Editar llamada</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            {[["ID","customerId","text"],["Hora inicio","callStart","text"],["Minutos","duration","number"]].map(([label,field,type])=>(
              <div key={field}><label style={CC.label}>{label}</label><input type={type} value={editForm[field]} onChange={e=>handleEditChange(field,e.target.value)} style={{...CC.input,fontSize:13}}/></div>
            ))}
          </div>
          <div style={{marginBottom:16}}>
            <label style={CC.label}>Pago ($)</label>
            <input type="number" step="0.01" value={editForm.pay} onChange={e=>setEditForm(p=>({...p,pay:e.target.value}))} style={{...CC.input,fontSize:20,fontFamily:"var(--mono)",fontWeight:800,color:"var(--green)",border:"1px solid var(--green)33"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn-primary" onClick={()=>saveEdit(editingId)} style={{flex:1,background:"var(--cyan)",border:"none",borderRadius:10,color:"#000",padding:"12px",fontWeight:700,cursor:"pointer",fontSize:14}}>💾 Guardar</button>
            <button onClick={()=>setEditingId(null)} style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:10,color:"var(--text2)",padding:"12px 16px",cursor:"pointer"}}>✕</button>
          </div>
        </Modal>
      )}

      {/* PAGE CONTENT */}
      <div style={{padding:"16px 20px 0"}}>

        {/* HOME */}
        {tab==="home"&&(
          <div>
            <div style={{...CC.cardGlow("#00e5cc"),padding:24,marginBottom:12}} className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                <div>
                  <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1}}>INGRESOS HOY</div>
                  <div style={{fontSize:48,fontWeight:800,fontFamily:"var(--mono)",color:"var(--green)",lineHeight:1,marginTop:4}}>${todayMoney.toFixed(2)}</div>
                  <div style={{fontSize:12,color:"var(--text2)",marginTop:4}}>{todayCalls.length} llamadas · {todayMins} min</div>
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
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
              {[
                {label:liveActive?"⏹ Detener":"▶ En vivo",icon:liveActive?"⏹":"▶",active:liveActive,color:"var(--green)",action:()=>liveActive?stopLiveCall():startLiveCall()},
                {label:"✏️ Manual",icon:"✏️",active:false,color:"var(--cyan)",action:()=>setShowManual(true)},
                {label:"📋 Pegar",icon:"📋",active:false,color:"var(--purple)",action:()=>setShowPaste(true)},
              ].map(btn=>(
                <button key={btn.label} className="action-btn" onClick={btn.action} style={{padding:"16px 8px",borderRadius:14,border:`1px solid ${btn.active?btn.color:"var(--border)"}`,cursor:"pointer",background:btn.active?`${btn.color}11`:"var(--bg2)",color:btn.active?btn.color:"var(--text)",fontWeight:700,fontSize:12,display:"flex",flexDirection:"column",alignItems:"center",gap:6,boxShadow:btn.active?`0 0 14px ${btn.color}22`:"none",transition:"all .15s"}}>
                  <span style={{fontSize:20}}>{btn.icon}</span>
                  <span style={{fontSize:10}}>{btn.active?"Detener":"En vivo"===btn.label.replace("▶ ","").replace("⏹ ","")?btn.label.replace("▶ ","").replace("⏹ ",""):btn.label.replace("✏️ ","").replace("📋 ","")}</span>
                </button>
              ))}
            </div>

            <div style={{...CC.card,padding:20}} className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontWeight:700,color:"var(--text)",fontSize:14}}>Llamadas de hoy</div>
                <div style={{fontSize:12,fontFamily:"var(--mono)",color:"var(--text2)"}}>{todayCalls.length}</div>
              </div>
              {todayCalls.length===0&&<div style={{textAlign:"center",padding:"24px 0",color:"var(--text3)"}}><div style={{fontSize:32,marginBottom:8}}>📞</div><div style={{fontSize:13}}>Sin llamadas hoy</div><div style={{fontSize:11,marginTop:4,color:"var(--text3)"}}>Usa los botones de arriba para registrar</div></div>}
              {todayCalls.map((c,i)=>(
                <div key={c.id} className="call-row" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 8px",borderRadius:10,marginBottom:2,background:"transparent",borderTop:i>0?"1px solid var(--border)":"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:30,height:30,borderRadius:7,background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontFamily:"var(--mono)",color:"var(--text3)",fontWeight:700,border:"1px solid var(--border)",flexShrink:0}}>{i+1}</div>
                    <div>
                      <div style={{fontWeight:600,fontSize:13}}>#{c.customerId}</div>
                      <div style={{fontSize:11,color:"var(--text2)",fontFamily:"var(--mono)"}}>{c.callStart} · {c.duration}m</div>
                    </div>
                    {c.surge&&<span style={{fontSize:9,background:"#1a0f00",color:"var(--amber)",padding:"2px 7px",borderRadius:6,border:"1px solid var(--amber)44",fontWeight:700}}>SURGE</span>}
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <div style={{fontWeight:800,fontSize:14,fontFamily:"var(--mono)",color:"var(--green)"}}>${c.pay.toFixed(2)}</div>
                    <button onClick={()=>startEdit(c)} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:13,padding:3}}>✏️</button>
                    <button onClick={()=>handleDelete(c.id)} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:13,padding:3}}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PERFORMANCE */}
        {tab==="perf"&&(
          <div>
            <div style={{...CC.cardGlow(scoreColor),padding:24,marginBottom:12,textAlign:"center"}} className="card">
              <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1.5,marginBottom:8}}>SCORE DEL DÍA</div>
              <div style={{fontSize:72,fontWeight:900,fontFamily:"var(--mono)",color:scoreColor,lineHeight:1}}>{score}</div>
              <div style={{fontSize:13,color:scoreColor,fontWeight:600,marginTop:6,letterSpacing:.5}}>{scoreLabel}</div>
              <div style={{marginTop:14,background:"var(--bg)",borderRadius:99,height:6,overflow:"hidden"}}>
                <div style={{width:`${score}%`,height:"100%",background:scoreColor,borderRadius:99,transition:"width .6s",boxShadow:`0 0 8px ${scoreColor}66`}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginTop:14}}>
                {[["Meta",Math.round(scoreGoal),40,"var(--green)"],["Ritmo",Math.round(scoreRhythm),30,"var(--cyan)"],["Racha",Math.round(scoreStreak),20,"var(--amber)"],["Activo",Math.round(scoreHours),10,"var(--purple)"]].map(([l,v,max,c])=>(
                  <div key={l} style={{background:"var(--bg)",borderRadius:8,padding:"8px 4px"}}>
                    <div style={{fontSize:14,fontWeight:800,fontFamily:"var(--mono)",color:c}}>{v}<span style={{fontSize:9,color:"var(--text3)"}}>/{max}</span></div>
                    <div style={{fontSize:10,color:"var(--text3)",marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{...CC.cardGlow("var(--red)"),padding:20,marginBottom:12}} className="card">
              <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>INACTIVIDAD</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:32,fontWeight:900,fontFamily:"var(--mono)",color:"var(--red)"}}>${idleCost}</div><div style={{fontSize:11,color:"var(--text2)",marginTop:2}}>{Math.floor(idleSeconds/60)}m {idleSeconds%60}s sin registrar</div></div>
                <div style={{fontSize:32,opacity:.25}}>💸</div>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              {[["vs Ayer",todayMoney,yestMoney,weekMins,yestMins],["vs Sem. pasada",weekMoney,lwMoney,weekMins,lwMins]].map(([label,curM,prevM,curMin,prevMin])=>{
                const diffM=curM-prevM,diffMin=curMin-prevMin,up=diffM>=0;
                return(
                  <div key={label} style={{...CC.card,padding:14}} className="card">
                    <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:.8,marginBottom:8}}>{label.toUpperCase()}</div>
                    <div style={{fontSize:20,fontWeight:800,fontFamily:"var(--mono)",color:up?"var(--green)":"var(--red)"}}>{up?"+":""}{diffM.toFixed(2)}<span style={{fontSize:11}}>$</span></div>
                    <div style={{fontSize:11,fontFamily:"var(--mono)",color:diffMin>=0?"var(--cyan)":"var(--red)",marginTop:2}}>{diffMin>=0?"+":""}{diffMin}m</div>
                    <div style={{fontSize:10,color:"var(--text3)",marginTop:6}}>antes: ${prevM.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>

            {currentCycle&&<div style={{...CC.cardGlow("var(--amber)"),padding:20,marginBottom:12}} className="card"><div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>PROYECCIÓN DEL CICLO</div><div style={{fontSize:36,fontWeight:900,fontFamily:"var(--mono)",color:"var(--amber)"}}>${projection!==null?projection.toFixed(2):"--"}</div><div style={{fontSize:11,color:"var(--text2)",marginTop:2}}>A este ritmo al final del ciclo</div></div>}

            <div style={{...CC.card,padding:20,marginBottom:12}} className="card">
              <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:12}}>RITMO DE HOY</div>
              {avgGap===null
                ?<div style={{color:"var(--text3)",fontSize:13}}>Necesitas al menos 2 llamadas</div>
                :(()=>{const c=avgGap<=5?"var(--green)":avgGap<=15?"var(--amber)":"var(--red)";const l=avgGap<=5?"Excelente 🔥":avgGap<=15?"Normal ⚡":"Lento 🐢";return(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:36,fontWeight:900,fontFamily:"var(--mono)",color:c}}>{avgGap}<span style={{fontSize:14,marginLeft:4,color:"var(--text2)"}}>min</span></div><div style={{fontSize:11,color:c,marginTop:2}}>{l}</div></div><div style={{fontSize:11,color:"var(--text3)"}}>entre llamadas</div></div>);})()
              }
            </div>

            <HeatmapCard heatmap={heatmap} maxHeat={maxHeat}/>

            <div style={{...CC.card,padding:20,marginBottom:12}} className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1}}>RACHA</div>
                <div style={{fontSize:28,fontWeight:900,fontFamily:"var(--mono)",color:"var(--amber)"}}>{streak}<span style={{fontSize:12,color:"var(--text3)",marginLeft:4}}>días</span></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(10,1fr)",gap:3}}>
                {last30.map(d=><div key={d} title={d} style={{aspectRatio:"1",borderRadius:4,background:byDate[d]?"var(--cyan)":d===todayStr?"var(--border2)":"var(--bg)",border:d===todayStr?"1px solid var(--border2)":"none"}}/>)}
              </div>
            </div>

            <div style={{...CC.cardGlow(currentLevel.color),padding:20,marginBottom:12}} className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div><div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1}}>NIVEL {currentLevel.level}</div><div style={{fontSize:22,fontWeight:800,color:currentLevel.color,marginTop:2}}>{currentLevel.label}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontSize:26,fontWeight:900,fontFamily:"var(--mono)",color:"var(--amber)"}}>{totalXP}</div><div style={{fontSize:10,color:"var(--text3)"}}>XP</div></div>
              </div>
              <div style={{background:"var(--bg)",borderRadius:99,height:6,overflow:"hidden"}}>
                <div style={{width:`${xpPct}%`,height:"100%",background:currentLevel.color,borderRadius:99,transition:"width .5s",boxShadow:`0 0 6px ${currentLevel.color}66`}}/>
              </div>
              {nextLevel&&<div style={{fontSize:10,color:"var(--text3)",marginTop:6,fontFamily:"var(--mono)"}}>{xpInLevel}/{xpNeeded} XP → nivel {currentLevel.level+1}</div>}
            </div>

            <div style={{...CC.card,padding:20}} className="card">
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                <Pill active={achTab==="daily"} onClick={()=>setAchTab("daily")}>☀️ Misiones</Pill>
                <Pill active={achTab==="milestones"} onClick={()=>setAchTab("milestones")}>🏆 Logros</Pill>
              </div>
              {achTab==="daily"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                    <div style={{fontSize:12,color:"var(--text2)"}}>{completedDaily.length}/8 completadas</div>
                    <div style={{fontSize:12,fontFamily:"var(--mono)",color:"var(--amber)",fontWeight:700}}>+{completedDaily.reduce((s,q)=>s+q.xp,0)} XP</div>
                  </div>
                  <div style={{background:"var(--bg)",borderRadius:99,height:4,overflow:"hidden",marginBottom:14}}>
                    <div style={{width:`${Math.round(completedDaily.length/8*100)}%`,height:"100%",background:"var(--amber)",borderRadius:99}}/>
                  </div>
                  {DAILY_QUESTS.map(q=>{const done=completedDaily.some(d=>d.id===q.id);return(
                    <div key={q.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px",borderRadius:10,background:done?"#0d1a0d":"var(--bg)",border:`1px solid ${done?"var(--green)22":"var(--border)"}`,marginBottom:6}}>
                      <div style={{fontSize:20,opacity:done?1:.3}}>{q.icon}</div>
                      <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13,color:done?"var(--text)":"var(--text2)"}}>{q.label}</div><div style={{fontSize:11,color:"var(--text3)",marginTop:1}}>{q.desc}</div></div>
                      <div style={{textAlign:"right"}}><div style={{fontSize:11,fontWeight:800,fontFamily:"var(--mono)",color:done?"var(--amber)":"var(--text3)"}}>+{q.xp}</div>{done&&<div style={{fontSize:10,color:"var(--green)"}}>✓</div>}</div>
                    </div>
                  );})}
                </div>
              )}
              {achTab==="milestones"&&(
                <div>
                  <div style={{fontSize:12,color:"var(--text2)",marginBottom:12}}>{unlockedAch.length}/{ACHIEVEMENTS.length} desbloqueados</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {ACHIEVEMENTS.map(a=>{const u=unlockedAch.some(x=>x.id===a.id);return(
                      <div key={a.id} style={{background:u?"#0d1a0d":"var(--bg)",borderRadius:10,padding:12,border:`1px solid ${u?"var(--green)22":"var(--border)"}`,opacity:u?1:.4}}>
                        <div style={{fontSize:22,marginBottom:6}}>{a.icon}</div>
                        <div style={{fontWeight:700,fontSize:12,color:u?"var(--text)":"var(--text2)"}}>{a.label}</div>
                        <div style={{fontSize:10,color:"var(--text3)",marginTop:2}}>{a.desc}</div>
                        <div style={{fontSize:10,fontFamily:"var(--mono)",color:u?"var(--amber)":"var(--text3)",marginTop:6,fontWeight:700}}>+15 XP</div>
                      </div>
                    );})}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* WEEK */}
        {tab==="week"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              <StatBox label="Minutos semana" value={`${weekMins}m`} color="var(--cyan)"/>
              <StatBox label="Ingresos semana" value={`$${weekMoney.toFixed(2)}`} color="var(--green)"/>
            </div>
            <div style={{...CC.card,padding:20}} className="card">
              <div style={{fontWeight:700,marginBottom:16,fontSize:14}}>Minutos por día</div>
              {weekData.map(d=>(
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
        {tab==="cycle"&&(
          <div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <Pill active={cycleView==="current"} onClick={()=>setCycleView("current")}>Ciclo actual</Pill>
              <Pill active={cycleView==="all"} onClick={()=>setCycleView("all")}>Todos</Pill>
            </div>
            {cycleView==="current"&&(!currentCycle
              ?<div style={{color:"var(--text3)",fontSize:13,textAlign:"center",padding:"32px 0"}}>No hay ciclo activo.</div>
              :(()=>{const stats=getCycleStats(currentCycle);const daysLeft=daysUntil(currentCycle.end),dtp=daysUntil(currentCycle.payDate);const s=toDate(currentCycle.start),e=toDate(currentCycle.end);const total=Math.round((e-s)/86400000)+1,passed=total-Math.max(daysLeft,0);const pct=Math.min(100,Math.round((passed/total)*100));return(
                <div>
                  <div style={{...CC.cardGlow("var(--cyan)"),padding:20,marginBottom:12}} className="card">
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                      <div><div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>PERÍODO</div><div style={{fontWeight:700,fontSize:13,color:"var(--cyan)",fontFamily:"var(--mono)"}}>{currentCycle.start} → {currentCycle.end}</div></div>
                      <div style={{textAlign:"right"}}><div style={{fontSize:10,color:"var(--text3)"}}>COBRO</div><div style={{fontWeight:700,color:"var(--amber)",fontFamily:"var(--mono)",fontSize:13}}>{currentCycle.payDate}</div></div>
                    </div>
                    <div style={{background:"var(--bg)",borderRadius:99,height:6,overflow:"hidden",marginBottom:6}}>
                      <div style={{width:`${pct}%`,height:"100%",background:"linear-gradient(90deg,var(--cyan),var(--green))",borderRadius:99}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)"}}><span>Día {passed}/{total}</span><span>{daysLeft>0?`${daysLeft}d restantes`:"Cerrado"}</span></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <StatBox label="Minutos" value={`${stats.mins}m`} color="var(--cyan)"/>
                    <StatBox label="Ganado" value={`$${stats.money.toFixed(2)}`} color="var(--green)"/>
                    <StatBox label="Llamadas" value={stats.count} color="var(--amber)"/>
                    <StatBox label="Días p/cobrar" value={Math.max(dtp,0)} color="var(--purple)"/>
                  </div>
                </div>
              );})()
            )}
            {cycleView==="all"&&PAY_CYCLES.map((cycle,i)=>{const stats=getCycleStats(cycle);const isCurrent=currentCycle&&cycle.start===currentCycle.start;const isPast=toDate(cycle.end)<new Date();const dtp=daysUntil(cycle.payDate);return(
              <div key={i} style={{...CC.card,padding:16,marginBottom:8,border:`1px solid ${isCurrent?"var(--cyan)44":"var(--border)"}`,opacity:isPast&&!isCurrent?0.5:1}} className="card">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    {isCurrent&&<span style={{fontSize:9,background:"var(--cyan)22",color:"var(--cyan)",padding:"2px 8px",borderRadius:6,marginBottom:6,display:"inline-block",fontWeight:700}}>ACTUAL</span>}
                    <div style={{fontSize:12,fontWeight:700,fontFamily:"var(--mono)",color:isCurrent?"var(--cyan)":"var(--text)"}}>{cycle.start} → {cycle.end}</div>
                    <div style={{fontSize:11,color:"var(--amber)",marginTop:2,fontFamily:"var(--mono)"}}>{cycle.payDate}{!isPast&&dtp>0&&<span style={{color:"var(--text3)",marginLeft:6}}>({dtp}d)</span>}</div>
                  </div>
                  <div style={{textAlign:"right"}}><div style={{fontWeight:800,fontFamily:"var(--mono)",color:"var(--green)",fontSize:14}}>${stats.money.toFixed(2)}</div><div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)"}}>{stats.mins}m · {stats.count}</div></div>
                </div>
              </div>
            );}
          </div>
        )}

        {/* FOCUS */}
        {tab==="focus"&&(
          <div>
            <div style={{...CC.card,padding:20,marginBottom:12}} className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div><div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1,marginBottom:4}}>ALARMA DE INACTIVIDAD</div><div style={{fontSize:13,color:"var(--text2)"}}>Suena si no registras en X min</div></div>
                <button onClick={()=>setAlarmEnabled(p=>!p)} style={{background:alarmEnabled?"var(--green)22":"var(--bg)",border:`2px solid ${alarmEnabled?"var(--green)":"var(--border2)"}`,borderRadius:99,padding:"7px 20px",cursor:"pointer",fontWeight:800,fontSize:12,fontFamily:"var(--mono)",color:alarmEnabled?"var(--green)":"var(--text3)",transition:"all .2s",letterSpacing:1}}>{alarmEnabled?"ON":"OFF"}</button>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[5,10,15,20,30].map(m=><Pill key={m} active={alarmMins===m} onClick={()=>setAlarmMins(m)} color="var(--red)">{m}m</Pill>)}
              </div>
              {alarmEnabled&&<div style={{marginTop:10,fontSize:11,color:"var(--green)",fontFamily:"var(--mono)"}}>● activa · {alarmMins}m</div>}
            </div>

            <div style={{...CC.card,padding:20}} className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,letterSpacing:1}}>POMODORO</div>
                <div style={{display:"flex",gap:6}}>
                  <Pill active={pomoTab==="timer"} onClick={()=>setPomoTab("timer")}>⏱ Timer</Pill>
                  <Pill active={pomoTab==="settings"} onClick={()=>setPomoTab("settings")}>⚙ Config</Pill>
                </div>
              </div>
              {pomoTab==="timer"&&(()=>{
                const total=(pomoState==="work"?pomoWork:pomoState==="break"?pomoBreak:pomoWork)*60;
                const remaining=total-pomoSeconds;
                const pct=pomoState==="idle"?1:(total-pomoSeconds)/total;
                const r=56,circ=2*Math.PI*r;
                const color=pomoState==="work"?"var(--red)":pomoState==="break"?"var(--green)":"var(--text3)";
                return(
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:10,color:color,fontWeight:700,letterSpacing:2,marginBottom:12}}>{pomoState==="work"?"● TRABAJANDO":pomoState==="break"?"● DESCANSO":"○ LISTO"}</div>
                    <div style={{position:"relative",display:"inline-block",margin:"0 0 16px"}}>
                      <svg width="148" height="148" style={{transform:"rotate(-90deg)"}}>
                        <circle cx="74" cy="74" r={r} fill="none" stroke="var(--border)" strokeWidth="8"/>
                        <circle cx="74" cy="74" r={r} fill="none" stroke={color} strokeWidth="8" strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round" style={{transition:"stroke-dashoffset .5s",filter:`drop-shadow(0 0 6px ${color})`}}/>
                      </svg>
                      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                        <div style={{fontSize:32,fontWeight:900,fontFamily:"var(--mono)",color:pomoState==="idle"?"var(--text3)":color}}>{fmtTime(pomoState==="idle"?pomoWork*60:remaining)}</div>
                        {pomoRounds>0&&<div style={{fontSize:11,color:"var(--amber)",fontFamily:"var(--mono)",marginTop:2}}>×{pomoRounds} 🍅</div>}
                      </div>
                    </div>
                    <div>{pomoState==="idle"?<button className="btn-primary" onClick={startPomo} style={{background:"var(--red)",border:"none",borderRadius:12,color:"#fff",padding:"13px 36px",fontWeight:800,cursor:"pointer",fontSize:16}}>▶ Iniciar</button>:<button className="action-btn" onClick={stopPomo} style={{background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:12,color:"var(--text2)",padding:"13px 36px",fontWeight:800,cursor:"pointer",fontSize:16}}>⏹ Detener</button>}</div>
                    <div style={{marginTop:12,fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)"}}>{pomoWork}m · {pomoBreak}m descanso</div>
                  </div>
                );
              })()}
              {pomoTab==="settings"&&(
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:18}}>
                    {POMO_PRESETS.map(p=>{const active=pomoWork===p.work&&pomoBreak===p.brk;return(
                      <button key={p.label} className="rate-btn" onClick={()=>{setPomoWork(p.work);setPomoBreak(p.brk);stopPomo();}} style={{padding:"12px",borderRadius:10,border:"none",cursor:"pointer",textAlign:"left",background:active?"var(--cyan)11":"var(--bg)",outline:active?"1px solid var(--cyan)44":"1px solid var(--border)"}}>
                        <div style={{fontWeight:700,fontSize:13,color:active?"var(--cyan)":"var(--text)"}}>{p.label}</div>
                        <div style={{fontSize:11,fontFamily:"var(--mono)",color:"var(--text2)",marginTop:3}}>{p.work}m / {p.brk}m</div>
                        <div style={{fontSize:10,color:"var(--text3)",marginTop:2}}>{p.desc}</div>
                      </button>
                    );})}
                  </div>
                  {[["🔴 Trabajo",pomoWork,setPomoWork,1,120],["🟢 Descanso",pomoBreak,setPomoBreak,1,60]].map(([label,val,setter,min,max])=>(
                    <div key={label} style={{marginBottom:16}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--text2)",marginBottom:8}}><span>{label}</span><span style={{fontFamily:"var(--mono)",color:"var(--text)",fontWeight:700}}>{val}m</span></div>
                      <input type="range" min={min} max={max} value={val} onChange={e=>{setter(parseInt(e.target.value));stopPomo();}} style={{width:"100%"}}/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* HISTORY */}
        {tab==="history"&&(
          <div>
            {sortedDates.length===0&&<div style={{textAlign:"center",padding:"48px 0",color:"var(--text3)"}}><div style={{fontSize:32,marginBottom:8}}>🗂</div><div>Sin historial aún</div></div>}
            {sortedDates.map(date=>{
              const dayCalls=calls.filter(c=>c.date===date);
              const bil=dayCalls.filter(c=>c.billable==="Yes");
              const mins=bil.reduce((s,c)=>s+c.duration,0),money=bil.reduce((s,c)=>s+c.pay,0);
              const surgeCount=bil.filter(c=>c.surge).length;
              return(
                <div key={date} style={{...CC.card,padding:16,marginBottom:10}} className="card">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontWeight:700,fontSize:13,fontFamily:"var(--mono)"}}>{date}</span>
                      {surgeCount>0&&<span style={{fontSize:9,background:"#1a0f00",color:"var(--amber)",padding:"2px 7px",borderRadius:6,fontWeight:700}}>⚡{surgeCount}</span>}
                    </div>
                    <span style={{fontSize:12,fontFamily:"var(--mono)"}}><span style={{color:"var(--cyan)"}}>{mins}m</span> · <span style={{color:"var(--green)"}}>${money.toFixed(2)}</span></span>
                  </div>
                  {dayCalls.map((c,i)=>(
                    <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderTop:i>0?"1px solid var(--border)":"none",fontSize:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontWeight:600,fontFamily:"var(--mono)",color:"var(--text2)"}}>#{c.customerId}</span>
                        <span style={{color:"var(--text3)",fontFamily:"var(--mono)"}}>{c.callStart}</span>
                        {c.surge&&<span style={{fontSize:9,background:"#1a0f00",color:"var(--amber)",padding:"1px 6px",borderRadius:4}}>SURGE</span>}
                      </div>
                      <div style={{display:"flex",gap:10,alignItems:"center"}}>
                        <span style={{fontFamily:"var(--mono)",color:"var(--text2)"}}>{c.duration}m</span>
                        <span style={{fontFamily:"var(--mono)",color:"var(--green)",fontWeight:700}}>${c.pay.toFixed(2)}</span>
                        <button onClick={()=>handleDelete(c.id)} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:13,padding:2}}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"var(--bg2)",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-around",padding:"8px 0 14px",zIndex:100}}>
        {TABS.map(t=>{
          const active=tab===t.id;
          return(
            <button key={t.id} className="nav-item" onClick={()=>setTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 8px",color:active?"var(--cyan)":"var(--text3)",transition:"color .15s",minWidth:40}}>
              <div style={{fontSize:15,lineHeight:1,filter:active?"drop-shadow(0 0 4px var(--cyan))":"none"}}>{t.icon}</div>
              <div style={{fontSize:9,fontWeight:active?700:400,letterSpacing:.3}}>{t.label}</div>
              {active&&<div style={{width:14,height:2,background:"var(--cyan)",borderRadius:99,boxShadow:"0 0 6px var(--cyan)"}}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

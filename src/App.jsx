import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "call_tracker_data";
const STORAGE_CONFIG = "call_tracker_config";
const defaultConfig = { dailyMoneyGoal: 30 };

export default function App() {
  const [calls, setCalls] = useState([]);
  const [config, setConfig] = useState(defaultConfig);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const d = localStorage.getItem(STORAGE_KEY);
      if (d) setCalls(JSON.parse(d));
      const c = localStorage.getItem(STORAGE_CONFIG);
      if (c) setConfig(JSON.parse(c));
    } catch (e) {
      console.error("Error cargando datos", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(calls));
  }, [calls]);

  const todayStr = new Date().toLocaleDateString("en-US");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const addManualCall = () => {
    const newCall = {
      id: Date.now(),
      customerId: "Manual",
      date: todayStr,
      callStart: new Date().toLocaleTimeString(),
      duration: 15,
      billable: "Yes",
      pay: 2.10
    };
    setCalls([newCall, ...calls]);
    showToast("✅ Llamada registrada");
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif", color: "#e8edf2", background: "#080c10", minHeight: "100vh" }}>
      <header style={{ marginBottom: "30px", textAlign: "center" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#00e5cc" }}>Call Tracker</h1>
        <p style={{ color: "#7a8a9a", fontSize: "14px" }}>{todayStr}</p>
      </header>

      <div style={{ padding: "20px", background: "#0d1117", borderRadius: "16px", border: "1px solid #1e2a38", marginBottom: "20px" }}>
        <div style={{ fontSize: 10, color: "#3d4f62", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Total hoy</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#39ff7e" }}>${calls.reduce((s, c) => s + (c.pay || 0), 0).toFixed(2)}</div>
      </div>

      <button 
        onClick={addManualCall}
        style={{ 
          width: "100%", padding: "16px", borderRadius: "12px", border: "none", 
          background: "#00e5cc", color: "#000", fontWeight: "bold", 
          cursor: "pointer", fontSize: "16px", marginBottom: "20px" 
        }}
      >
        + Registrar Llamada
      </button>

      <div style={{ padding: "20px", background: "#0d1117", borderRadius: "16px", border: "1px solid #1e2a38" }}>
        <h3 style={{ marginBottom: "15px", fontSize: "14px" }}>Historial</h3>
        {calls.length === 0 ? (
          <p style={{ color: "#3d4f62", fontSize: "13px" }}>No hay llamadas registradas.</p>
        ) : (
          calls.slice(0, 5).map(c => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1e2a38" }}>
              <span style={{ fontSize: "13px" }}>{c.date}</span>
              <span style={{ fontSize: "13px", fontWeight: "bold", color: "#39ff7e" }}>+${c.pay.toFixed(2)}</span>
            </div>
          ))
        )}
      </div>

      {toast && (
        <div style={{ 
          position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)",
          background: "#39ff7e", color: "#000", padding: "12px 24px", 
          borderRadius: "30px", fontWeight: "bold", zIndex: 1000 
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
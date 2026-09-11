import { useEffect, useState } from "react";
import api from "../services/api";

export default function History() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [historyRes, statsRes] = await Promise.all([
          api.getHistory(),
          api.getStats(),
        ]);
        setHistory(historyRes.history || []);
        setStats(statsRes);
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to load history");
      }
    };
    load();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        padding: "2rem",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <h1 style={{ color: "#fff", textAlign: "center", marginBottom: "2rem" }}>
        Parking History
      </h1>

      {error && (
        <p style={{ color: "#FF6B6B", textAlign: "center" }}>{error}</p>
      )}

      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            maxWidth: "800px",
            margin: "0 auto 2rem",
          }}
        >
          <Stat label="Total Attempts" value={stats.total_attempts} />
          <Stat label="Successful" value={stats.successful_parks} />
          <Stat label="Success Rate" value={`${stats.success_rate}%`} />
          <Stat label="Avg Score" value={stats.average_score} />
        </div>
      )}

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {history.map((entry) => (
          <div
            key={entry.id}
            style={{
              padding: "1rem 1.5rem",
              marginBottom: "0.75rem",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <div>
              <p style={{ color: "#fff", margin: 0, fontWeight: 600 }}>
                {entry.timestamp}
              </p>
              <p style={{ color: "rgba(255,255,255,0.6)", margin: "0.25rem 0 0", fontSize: "0.9rem" }}>
                Duration: {entry.duration}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  color: entry.status === "success" ? "#4CAF50" : "#FF6B6B",
                  fontWeight: "bold",
                }}
              >
                Score: {entry.score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div
      style={{
        padding: "1rem",
        background: "rgba(255,255,255,0.05)",
        borderRadius: "12px",
        textAlign: "center",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "0.85rem" }}>{label}</p>
      <p style={{ color: "#4CAF50", margin: "0.5rem 0 0", fontSize: "1.5rem", fontWeight: "bold" }}>
        {value}
      </p>
    </div>
  );
}

import BackendCameraFeed from "../components/BackendCameraFeed";
import api from "../services/api";
import { useEffect, useState } from "react";

export default function LiveMonitoring() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await api.cameraStatus();
        setStatus(data);
      } catch {
        setStatus(null);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
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
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ color: "#fff", fontSize: "2.5rem", marginBottom: "0.5rem" }}>
          Live Monitoring
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)" }}>
          Real-time pen detection via backend camera
        </p>
      </div>

      {status && (
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            marginBottom: "2rem",
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: status.active ? "#4CAF50" : "#FF6B6B" }}>
            Camera: {status.active ? "Active" : "Inactive"}
          </span>
          <span style={{ color: status.pen_detected ? "#4CAF50" : "rgba(255,255,255,0.6)" }}>
            Pen: {status.pen_detected ? "Detected" : "Not detected"}
          </span>
        </div>
      )}

      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "2rem",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "20px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <BackendCameraFeed />
      </div>
    </div>
  );
}

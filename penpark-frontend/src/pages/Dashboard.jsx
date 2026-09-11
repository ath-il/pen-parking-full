import { parkingData } from "../data/mockParkingData";
import StatCard from "../components/StatCard";
import ParkingGrid from "../components/ParkingGrid";
import BackendCameraFeed from "../components/BackendCameraFeed";
import api from "../services/api";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.getStats();
        setStats(data);
      } catch {
        // Backend may be offline; fall back to mock data
      }
    };
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const occupancyPercent = Math.round((parkingData.occupied / parkingData.total) * 100);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        padding: "2rem",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "3rem",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "3.5rem",
            color: "#fff",
            margin: "0 0 1rem 0",
            fontWeight: "700",
            textShadow: "0 8px 32px rgba(76, 175, 80, 0.3)",
            letterSpacing: "2px",
          }}
        >
          🅿️ PenPark Dashboard
        </h1>
        <p
          style={{
            fontSize: "1.1rem",
            color: "rgba(255, 255, 255, 0.7)",
            margin: 0,
          }}
        >
          Real-time Parking Management System
        </p>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "2rem",
          marginBottom: "3rem",
          maxWidth: "1200px",
          margin: "0 auto 3rem auto",
        }}
      >
        <StatCard
          title="TOTAL ATTEMPTS"
          value={stats?.total_attempts ?? parkingData.total}
          icon="📊"
          color="#4CAF50"
          bgColor="rgba(76, 175, 80, 0.1)"
        />
        <StatCard
          title="SUCCESSFUL"
          value={stats?.successful_parks ?? parkingData.available}
          icon="🟢"
          color="#00BCD4"
          bgColor="rgba(0, 188, 212, 0.1)"
        />
        <StatCard
          title="AVG SCORE"
          value={stats?.average_score ?? parkingData.occupied}
          icon="🔴"
          color="#FF6B6B"
          bgColor="rgba(255, 107, 107, 0.1)"
        />
      </div>

      {/* Occupancy Meter */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto 3rem auto",
          padding: "2rem",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "20px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <h3 style={{ color: "#fff", margin: 0, fontSize: "1.2rem" }}>Occupancy Rate</h3>
            <span style={{ color: "#4CAF50", fontSize: "1.5rem", fontWeight: "bold" }}>
              {occupancyPercent}%
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${occupancyPercent}%`,
                background: `linear-gradient(90deg, #4CAF50, #FF6B6B)`,
                transition: "width 0.3s ease",
                borderRadius: "10px",
              }}
            />
          </div>
        </div>
      </div>

      {/* Camera Widget Section */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto 3rem auto",
        }}
      >
        <BackendCameraFeed />
      </div>

      {/* Parking Grid Section */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto 2rem auto",
          padding: "2rem",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "20px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
      >
        <h2 style={{ color: "#fff", marginTop: 0, marginBottom: "2rem", fontSize: "1.5rem" }}>
          🚗 Parking Spaces
        </h2>
        <ParkingGrid spaces={parkingData.spaces} />
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          marginTop: "3rem",
          paddingTop: "2rem",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <p style={{ color: "rgba(255, 255, 255, 0.6)", margin: "0.5rem 0" }}>
          ⏰ Last Updated: <span style={{ color: "#4CAF50", fontWeight: "bold" }}>{time}</span>
        </p>
        <p style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "0.9rem", margin: "0.5rem 0" }}>
          Real-time updates every 5 seconds
        </p>
      </div>
    </div>
  );
}

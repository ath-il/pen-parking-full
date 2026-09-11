import { useState } from "react";

export default function StatCard({ title, value, icon, color, bgColor }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        padding: "2rem",
        background: bgColor || "rgba(76, 175, 80, 0.1)",
        borderRadius: "20px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(10px)",
        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: isHovered ? "translateY(-10px) rotateX(5deg) scale(1.05)" : "translateY(0)",
        boxShadow: isHovered
          ? `0 30px 60px ${color}40, 0 0 60px ${color}20`
          : `0 10px 30px rgba(0, 0, 0, 0.2)`,
        cursor: "pointer",
        perspective: "1000px",
        minHeight: "150px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h3
          style={{
            color: "rgba(255, 255, 255, 0.7)",
            margin: "0",
            fontSize: "0.9rem",
            fontWeight: "600",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          {title}
        </h3>
        <span style={{ fontSize: "2rem" }}>{icon}</span>
      </div>

      <div>
        <p
          style={{
            fontSize: "3rem",
            fontWeight: "700",
            margin: "1rem 0 0 0",
            color: color || "#4CAF50",
            textShadow: `0 0 20px ${color}60`,
          }}
        >
          {value}
        </p>
        <div
          style={{
            height: "3px",
            width: "50px",
            background: `linear-gradient(90deg, ${color}80, ${color}00)`,
            marginTop: "1rem",
            borderRadius: "2px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

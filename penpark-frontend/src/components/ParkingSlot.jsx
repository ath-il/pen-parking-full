import { useState } from "react";

export default function ParkingSlot({ id, status }) {
  const [isHovered, setIsHovered] = useState(false);
  const isAvailable = status === "available";
  const bgColor = isAvailable ? "rgba(0, 188, 212, 0.1)" : "rgba(255, 107, 107, 0.1)";
  const borderColor = isAvailable ? "rgba(0, 188, 212, 0.5)" : "rgba(255, 107, 107, 0.5)";
  const textColor = isAvailable ? "#00BCD4" : "#FF6B6B";

  return (
    <div
      style={{
        padding: "1.5rem",
        textAlign: "center",
        background: bgColor,
        borderRadius: "15px",
        border: `2px solid ${borderColor}`,
        transition: "all 0.3s ease",
        transform: isHovered ? "translateY(-8px) scale(1.1)" : "translateY(0)",
        boxShadow: isHovered
          ? `0 15px 40px ${textColor}40, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
          : `0 5px 15px rgba(0, 0, 0, 0.2)`,
        cursor: "pointer",
        backdropFilter: "blur(5px)",
        minWidth: "100px",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          fontSize: isHovered ? "3rem" : "2.5rem",
          marginBottom: "0.5rem",
          transition: "font-size 0.3s ease",
        }}
      >
        {isAvailable ? "🟢" : "🔴"}
      </div>
      <p
        style={{
          margin: "0",
          color: textColor,
          fontWeight: "bold",
          fontSize: "1.1rem",
          textShadow: `0 0 10px ${textColor}60`,
        }}
      >
        {id}
      </p>
      <p
        style={{
          margin: "0.5rem 0 0 0",
          color: "rgba(255, 255, 255, 0.6)",
          fontSize: "0.85rem",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {isAvailable ? "Available" : "Occupied"}
      </p>
    </div>
  );
}

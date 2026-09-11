import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/pen-alignment", label: "Pen Setup", icon: "📸" },
    { path: "/live", label: "Live Monitor", icon: "📡" },
    { path: "/history", label: "History", icon: "📋" },
    { path: "/about", label: "About", icon: "ℹ️" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      style={{
        background: "linear-gradient(135deg, rgba(25, 28, 57, 0.95) 0%, rgba(22, 33, 62, 0.95) 100%)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(76, 175, 80, 0.2)",
        padding: "1rem 2rem",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "2rem",
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            color: "white",
            fontSize: "28px",
            fontWeight: "800",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "linear-gradient(135deg, #4CAF50, #00BCD4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "0 2px 10px rgba(76, 175, 80, 0.3)",
            transition: "transform 0.3s ease",
            letterSpacing: "1px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          🅿️ <span style={{ fontSize: "24px" }}>PenPark</span>
        </Link>

        {/* Desktop Navigation */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            "@media (maxWidth: 768px)": {
              display: "none",
            },
          }}
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                background: isActive(item.path)
                  ? "linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(0, 188, 212, 0.2))"
                  : "rgba(255, 255, 255, 0.05)",
                border: isActive(item.path)
                  ? "1px solid rgba(76, 175, 80, 0.5)"
                  : "1px solid rgba(255, 255, 255, 0.1)",
                color: isActive(item.path) ? "#4CAF50" : "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(10px)",
                boxShadow: isActive(item.path)
                  ? "0 8px 32px rgba(76, 175, 80, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                  : "0 4px 15px rgba(0, 0, 0, 0.1)",
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background =
                    "linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(0, 188, 212, 0.15))";
                  e.currentTarget.style.boxShadow =
                    "0 12px 40px rgba(76, 175, 80, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.color = "#00BCD4";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.1)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
                }
              }}
            >
              <span style={{ fontSize: "18px" }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            display: "none",
            flexDirection: "column",
            gap: "5px",
            background: "rgba(76, 175, 80, 0.2)",
            border: "1px solid rgba(76, 175, 80, 0.5)",
            borderRadius: "8px",
            padding: "8px 12px",
            cursor: "pointer",
            color: "#4CAF50",
            "@media (maxWidth: 768px)": {
              display: "flex",
            },
          }}
        >
          <div style={{ width: "24px", height: "2px", background: "#4CAF50" }} />
          <div style={{ width: "24px", height: "2px", background: "#4CAF50" }} />
          <div style={{ width: "24px", height: "2px", background: "#4CAF50" }} />
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            marginTop: "1rem",
            paddingTop: "1rem",
            borderTop: "1px solid rgba(76, 175, 80, 0.2)",
            animation: "slideDown 0.3s ease",
          }}
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMenuOpen(false)}
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.3s ease",
                background: isActive(item.path)
                  ? "rgba(76, 175, 80, 0.3)"
                  : "rgba(255, 255, 255, 0.05)",
                color: isActive(item.path) ? "#4CAF50" : "rgba(255, 255, 255, 0.8)",
                border: isActive(item.path)
                  ? "1px solid rgba(76, 175, 80, 0.5)"
                  : "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <span style={{ fontSize: "16px" }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          div:has(> a:nth-child(1)) {
            display: none !important;
          }
          button {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  );
}

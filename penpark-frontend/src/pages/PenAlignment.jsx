import { useState } from "react";
import useBackendCamera from "../hooks/useBackendCamera";
import api from "../services/api";

export default function PenAlignment() {
  const {
    isActive,
    isLoading,
    error,
    penData,
    backendOnline,
    videoFeedUrl,
    startCamera,
    stopCamera,
  } = useBackendCamera();

  const [alignmentStatus, setAlignmentStatus] = useState("idle");
  const [checkResult, setCheckResult] = useState(null);
  const [attempts, setAttempts] = useState(0);

  const handleStart = async () => {
    const ok = await startCamera();
    if (ok) setAlignmentStatus("positioning");
  };

  const handleConfirmPosition = async () => {
    setAttempts((a) => a + 1);
    try {
      const result = await api.checkParking();
      setCheckResult(result);

      if (result.parked) {
        setAlignmentStatus("success");
      } else if (result.score >= 60) {
        setAlignmentStatus("close");
      } else {
        setAlignmentStatus("far");
      }
    } catch (err) {
      setCheckResult({ message: err.message, score: 0, parked: false });
      setAlignmentStatus("far");
    }
  };

  const handleReset = async () => {
    await stopCamera();
    setAlignmentStatus("idle");
    setCheckResult(null);
    setAttempts(0);
  };

  const target = penData?.target;
  const score = checkResult?.score ?? penData?.score ?? 0;
  const distance = penData?.distance ?? checkResult?.details?.distance;

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
        <h1 style={{ fontSize: "3rem", color: "#fff", marginBottom: "0.5rem" }}>
          Pen Positioning System
        </h1>
        <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "1.1rem" }}>
          Position your pen at the target zone — powered by backend detection
        </p>
      </div>

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "2rem",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "20px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {backendOnline === false && (
          <p style={{ color: "#FFC107", textAlign: "center" }}>
            Start the backend first: <code>.\start-backend.ps1</code>
          </p>
        )}

        {error && (
          <p style={{ color: "#FF6B6B", textAlign: "center" }}>{error}</p>
        )}

        {alignmentStatus === "idle" && !isActive && (
          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleStart}
              disabled={isLoading || backendOnline === false}
              style={{
                padding: "16px 50px",
                fontSize: "18px",
                fontWeight: "600",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
              }}
            >
              {isLoading ? "Starting..." : "Start Backend Camera"}
            </button>
          </div>
        )}

        {isActive && alignmentStatus === "positioning" && (
          <div>
            <div
              style={{
                position: "relative",
                maxWidth: "640px",
                height: "480px",
                margin: "0 auto 1.5rem",
                backgroundColor: "#000",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              <img
                src={videoFeedUrl}
                alt="Pen detection feed"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            {penData?.detected && target && (
              <p style={{ color: "#00BCD4", textAlign: "center" }}>
                Target: ({target.x}, {target.y}) · Current score: {Math.round(penData.score)}/100
              </p>
            )}

            {penData?.instruction && (
              <p style={{ color: "#4CAF50", textAlign: "center", fontSize: "1.1rem" }}>
                {penData.instruction}
              </p>
            )}

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1.5rem" }}>
              <button
                onClick={handleConfirmPosition}
                style={{
                  padding: "12px 40px",
                  backgroundColor: "#00BCD4",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Confirm Position
              </button>
              <button
                onClick={handleReset}
                style={{
                  padding: "12px 40px",
                  backgroundColor: "#FF6B6B",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {(alignmentStatus === "success" || alignmentStatus === "close" || alignmentStatus === "far") && (
          <div style={{ textAlign: "center" }}>
            <h2
              style={{
                color:
                  alignmentStatus === "success"
                    ? "#4CAF50"
                    : alignmentStatus === "close"
                      ? "#FFC107"
                      : "#FF6B6B",
              }}
            >
              {alignmentStatus === "success"
                ? "Perfect Alignment!"
                : alignmentStatus === "close"
                  ? "Close — keep adjusting"
                  : "Too far — try again"}
            </h2>

            <p style={{ color: "rgba(255,255,255,0.8)" }}>
              Score: {Math.round(score)}/100
              {distance != null && ` · Distance: ${Math.round(distance)}px`}
            </p>
            {checkResult?.message && (
              <p style={{ color: "#00BCD4" }}>{checkResult.message}</p>
            )}
            <p style={{ color: "rgba(255,255,255,0.6)" }}>Attempts: {attempts}</p>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1.5rem" }}>
              <button
                onClick={() => {
                  setAlignmentStatus("positioning");
                  setCheckResult(null);
                }}
                style={{
                  padding: "12px 40px",
                  backgroundColor: "#FFC107",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
              <button
                onClick={handleReset}
                style={{
                  padding: "12px 40px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                }}
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

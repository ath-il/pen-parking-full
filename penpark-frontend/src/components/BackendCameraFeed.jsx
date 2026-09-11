import useBackendCamera from "../hooks/useBackendCamera";

export default function BackendCameraFeed({ showPenData = true }) {
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

  return (
    <div>
      {backendOnline === false && (
        <div
          style={{
            backgroundColor: "rgba(255, 193, 7, 0.15)",
            border: "1px solid #FFC107",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1rem",
            color: "#FFC107",
          }}
        >
          Backend offline — run <code>start-backend.ps1</code> first (port 5000)
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: "rgba(255, 107, 107, 0.15)",
            border: "1px solid #FF6B6B",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1rem",
            color: "#FF6B6B",
          }}
        >
          {error}
        </div>
      )}

      {isActive ? (
        <div>
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "640px",
              height: "480px",
              backgroundColor: "#000",
              borderRadius: "16px",
              overflow: "hidden",
              margin: "0 auto 1rem",
            }}
          >
            <img
              src={videoFeedUrl}
              alt="Camera feed"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>

          {showPenData && penData && (
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "12px",
                padding: "1rem",
                marginBottom: "1rem",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              {penData.detected ? (
                <>
                  <p style={{ color: "#4CAF50", margin: "0.25rem 0" }}>
                    Score: {Math.round(penData.score)}/100
                  </p>
                  <p style={{ color: "#00BCD4", margin: "0.25rem 0" }}>
                    {penData.instruction}
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.7)", margin: "0.25rem 0", fontSize: "0.9rem" }}>
                    Distance: {Math.round(penData.distance)}px · Angle: {penData.angle?.toFixed(1)}°
                  </p>
                </>
              ) : (
                <p style={{ color: "#FF6B6B", margin: 0 }}>No pen detected</p>
              )}
            </div>
          )}

          <div style={{ textAlign: "center" }}>
            <button
              onClick={stopCamera}
              style={{
                padding: "10px 32px",
                fontSize: "14px",
                fontWeight: "600",
                backgroundColor: "rgba(255, 107, 107, 0.2)",
                color: "#FF6B6B",
                border: "1px solid rgba(255, 107, 107, 0.5)",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Stop Camera
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "1rem" }}>
          <button
            onClick={startCamera}
            disabled={isLoading || backendOnline === false}
            style={{
              padding: "12px 40px",
              fontSize: "16px",
              fontWeight: "600",
              backgroundColor: isLoading ? "rgba(76, 175, 80, 0.3)" : "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: isLoading || backendOnline === false ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "Starting..." : "Start Backend Camera"}
          </button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";

export default function CameraWidget() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState("user"); // user or environment
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const startCamera = async (mode = facingMode) => {
    setIsLoading(true);
    try {
      // Stop existing camera
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
        setError(null);
        setFacingMode(mode);
      }
    } catch (err) {
      setError(
        err.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera permissions."
          : "Unable to access camera."
      );
      setIsCameraActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const switchCamera = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    startCamera(newMode);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setIsCameraActive(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const imageData = canvasRef.current.toDataURL("image/png");
      console.log("Image captured:", imageData);
      // Could add download or send to server here
    }
  };

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div
      style={{
        padding: "2rem",
        background: "rgba(255, 255, 255, 0.05)",
        borderRadius: "20px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
      }}
    >
      <h2 style={{ color: "#fff", marginTop: 0, marginBottom: "1.5rem", fontSize: "1.5rem" }}>
        📷 Camera Feed
      </h2>

      {/* Camera Feed */}
      {isCameraActive ? (
        <div>
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "600px",
              height: "400px",
              backgroundColor: "#000",
              borderRadius: "16px",
              overflow: "hidden",
              margin: "0 auto 1.5rem",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
            }}
          >
            <video
              ref={videoRef}
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                transform: `scaleX(-1) scale(${zoom})`,
                objectFit: "cover",
                filter: `brightness(${brightness}%) contrast(${contrast}%)`,
              }}
            />

            {/* Camera Mode Badge */}
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                padding: "6px 12px",
                borderRadius: "6px",
                color: "#4CAF50",
                fontSize: "12px",
                fontWeight: "bold",
                border: "1px solid rgba(76, 175, 80, 0.5)",
              }}
            >
              {facingMode === "user" ? "🫙 Front Camera" : "🔄 Back Camera"}
            </div>
          </div>

          {/* Settings Panel */}
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <h3 style={{ color: "#00BCD4", marginTop: 0, marginBottom: "1rem", fontSize: "1rem" }}>
              ⚙️ Camera Settings
            </h3>

            {/* Brightness Control */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <label style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "0.9rem" }}>
                  ☀️ Brightness
                </label>
                <span style={{ color: "#4CAF50", fontWeight: "bold", fontSize: "0.9rem" }}>
                  {brightness}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value))}
                style={{
                  width: "100%",
                  height: "6px",
                  borderRadius: "3px",
                  background: "linear-gradient(90deg, #4CAF50, #00BCD4)",
                  outline: "none",
                  cursor: "pointer",
                }}
              />
            </div>

            {/* Contrast Control */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <label style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "0.9rem" }}>
                  🎨 Contrast
                </label>
                <span style={{ color: "#4CAF50", fontWeight: "bold", fontSize: "0.9rem" }}>
                  {contrast}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={contrast}
                onChange={(e) => setContrast(parseInt(e.target.value))}
                style={{
                  width: "100%",
                  height: "6px",
                  borderRadius: "3px",
                  background: "linear-gradient(90deg, #4CAF50, #00BCD4)",
                  outline: "none",
                  cursor: "pointer",
                }}
              />
            </div>

            {/* Zoom Control */}
            <div style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <label style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "0.9rem" }}>
                  🔍 Zoom
                </label>
                <span style={{ color: "#4CAF50", fontWeight: "bold", fontSize: "0.9rem" }}>
                  {zoom.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                style={{
                  width: "100%",
                  height: "6px",
                  borderRadius: "3px",
                  background: "linear-gradient(90deg, #4CAF50, #00BCD4)",
                  outline: "none",
                  cursor: "pointer",
                }}
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={switchCamera}
              style={{
                padding: "10px 24px",
                fontSize: "14px",
                fontWeight: "600",
                backgroundColor: "rgba(0, 188, 212, 0.2)",
                color: "#00BCD4",
                border: "1px solid rgba(0, 188, 212, 0.5)",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "rgba(0, 188, 212, 0.4)";
                e.target.style.boxShadow = "0 6px 20px rgba(0, 188, 212, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "rgba(0, 188, 212, 0.2)";
                e.target.style.boxShadow = "none";
              }}
            >
              🔄 Switch Camera
            </button>

            <button
              onClick={captureImage}
              style={{
                padding: "10px 24px",
                fontSize: "14px",
                fontWeight: "600",
                backgroundColor: "rgba(76, 175, 80, 0.2)",
                color: "#4CAF50",
                border: "1px solid rgba(76, 175, 80, 0.5)",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "rgba(76, 175, 80, 0.4)";
                e.target.style.boxShadow = "0 6px 20px rgba(76, 175, 80, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "rgba(76, 175, 80, 0.2)";
                e.target.style.boxShadow = "none";
              }}
            >
              📷 Capture
            </button>

            <button
              onClick={stopCamera}
              style={{
                padding: "10px 24px",
                fontSize: "14px",
                fontWeight: "600",
                backgroundColor: "rgba(255, 107, 107, 0.2)",
                color: "#FF6B6B",
                border: "1px solid rgba(255, 107, 107, 0.5)",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "rgba(255, 107, 107, 0.4)";
                e.target.style.boxShadow = "0 6px 20px rgba(255, 107, 107, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "rgba(255, 107, 107, 0.2)";
                e.target.style.boxShadow = "none";
              }}
            >
              ✕ Close Camera
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          {error ? (
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
              ⚠️ {error}
            </div>
          ) : (
            <p style={{ color: "rgba(255, 255, 255, 0.7)", marginBottom: "1.5rem" }}>
              📷 Camera is closed
            </p>
          )}

          <button
            onClick={() => startCamera("user")}
            disabled={isLoading}
            style={{
              padding: "12px 40px",
              fontSize: "16px",
              fontWeight: "600",
              backgroundColor: isLoading ? "rgba(76, 175, 80, 0.3)" : "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: isLoading ? "not-allowed" : "pointer",
              boxShadow: "0 6px 20px rgba(76, 175, 80, 0.3)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 10px 30px rgba(76, 175, 80, 0.5)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 6px 20px rgba(76, 175, 80, 0.3)";
            }}
          >
            {isLoading ? "🔄 Loading..." : "🎥 Open Camera"}
          </button>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

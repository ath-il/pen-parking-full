import { useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";
import useBackendCamera from "../hooks/useBackendCamera";
import "./LandingPage.css";

export default function LandingPage() {
  const containerRef = useRef(null);
  const {
    isActive: cameraActive,
    isLoading,
    error,
    penData,
    backendOnline,
    snapshotUrl,
    startCamera,
    stopCamera,
  } = useBackendCamera({ pollInterval: 300, frameInterval: 80 });

  const [isStopping, setIsStopping] = useState(false);
  const [cameraMode, setCameraMode] = useState("laptop");
  const [phoneUrl, setPhoneUrl] = useState(
    () => localStorage.getItem("penpark-phone-url") || "http://192.168.1.10:8080"
  );

  const handleStartCamera = async () => {
    let source;
    if (cameraMode === "phone") {
      const url = phoneUrl.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return;
      }
      localStorage.setItem("penpark-phone-url", url);
      source = url;
    } else {
      source = "0";
    }
    await startCamera(source);
  };

  const handleStopCamera = async () => {
    setIsStopping(true);
    await stopCamera();
    setIsStopping(false);
  };

  return (
    <div className="landing-page">
      {/* Animated background */}
      <div className="background-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {!cameraActive ? (
        // Initial State - Landing Screen
        <div className="landing-container">
          <div className="content-wrapper">
            {/* Logo */}
            <div className="logo-section">
              <div className="logo-wrapper">
                <div className="logo-bg"></div>
                <div className="logo-inner">
                  <svg className="logo-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    {/* Outer circle */}
                    <circle cx="50" cy="50" r="48" fill="none" stroke="url(#logoGradient)" strokeWidth="2"/>
                    
                    {/* P shape - top circle */}
                    <circle cx="50" cy="35" r="18" fill="none" stroke="url(#logoGradient2)" strokeWidth="2.5"/>
                    
                    {/* P shape - vertical line */}
                    <line x1="50" y1="35" x2="50" y2="75" stroke="url(#logoGradient)" strokeWidth="2.5" strokeLinecap="round"/>
                    
                    {/* Bottom accent line */}
                    <line x1="32" y1="75" x2="68" y2="75" stroke="url(#logoGradient2)" strokeWidth="2" strokeLinecap="round"/>
                    
                    {/* Corner accent dots */}
                    <circle cx="28" cy="28" r="2.5" fill="url(#logoGradient2)"/>
                    <circle cx="72" cy="28" r="2.5" fill="url(#logoGradient2)"/>
                    <circle cx="28" cy="72" r="2.5" fill="url(#logoGradient2)"/>
                    <circle cx="72" cy="72" r="2.5" fill="url(#logoGradient2)"/>
                    
                    {/* Gradients */}
                    <defs>
                      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00D4FF" stopOpacity="1"/>
                        <stop offset="100%" stopColor="#1E90FF" stopOpacity="1"/>
                      </linearGradient>
                      <linearGradient id="logoGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1E90FF" stopOpacity="1"/>
                        <stop offset="100%" stopColor="#00D4FF" stopOpacity="1"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="logo-glow"></div>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="main-title">PARK YOUR PEN.</h1>

            {/* Malayalam Tagline */}
            <div className="malayalam-tagline">
              <p className="tagline-question">പേന എവിടെ വെക്കണം എന്നറിയാതെ വിഷമിക്കുന്നുണ്ടോ?</p>
              <p className="tagline-response">ഞങ്ങളുണ്ട്. 😌</p>
            </div>

            {backendOnline === false && (
              <div className="error-message">
                <span>⚠️</span>
                <p>Backend offline — run python app.py in the backend folder first</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="error-message">
                <span>⚠️</span>
                <p>{error}</p>
              </div>
            )}

            {/* Camera source */}
            <div className="camera-source-panel">
              <div className="camera-source-toggle">
                <button
                  type="button"
                  className={cameraMode === "laptop" ? "source-btn active" : "source-btn"}
                  onClick={() => setCameraMode("laptop")}
                >
                  Laptop camera
                </button>
                <button
                  type="button"
                  className={cameraMode === "phone" ? "source-btn active" : "source-btn"}
                  onClick={() => setCameraMode("phone")}
                >
                  Phone camera
                </button>
              </div>

              {cameraMode === "phone" && (
                <div className="phone-camera-help">
                  <p>
                    1. Install <strong>IP Webcam</strong> (Android) or a similar app on iPhone
                  </p>
                  <p>2. Connect phone and PC to the <strong>same WiFi</strong></p>
                  <p>3. Start the server in the app and paste the URL:</p>
                  <input
                    className="phone-url-input"
                    type="text"
                    value={phoneUrl}
                    onChange={(e) => setPhoneUrl(e.target.value)}
                    placeholder="http://192.168.1.10:8080"
                  />
                  <p className="phone-url-hint">Example: http://192.168.x.x:8080 or .../video</p>
                </div>
              )}
            </div>

            {/* Start Button */}
            <button
              className="btn-primary"
              onClick={handleStartCamera}
              disabled={
                isLoading ||
                backendOnline === false ||
                (cameraMode === "phone" && !phoneUrl.trim())
              }
            >
              <Camera size={22} className="btn-icon-svg" />
              <span className="btn-text">
                {isLoading
                  ? "Connecting..."
                  : cameraMode === "phone"
                    ? "Start Phone Camera"
                    : "Start Camera"}
              </span>
            </button>

            {/* Retry button if error */}
            {error && (
              <button className="btn-secondary" onClick={handleStartCamera}>
                Try Again
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="camera-container" ref={containerRef}>
          <div className="camera-header">
            <div className="logo-small">PenPark Live</div>
            <div className="camera-header-actions">
              <div className="status-indicator">
                <span className="status-dot"></span>
                LIVE
              </div>
              <button
                type="button"
                className="btn-camera-off"
                onClick={handleStopCamera}
                disabled={isStopping}
                title="Turn off camera"
                aria-label="Turn off camera"
              >
                <CameraOff size={20} />
                <span>{isStopping ? "Turning off..." : "Camera Off"}</span>
              </button>
            </div>
          </div>

          <div className="camera-frame-wrapper">
            <div className="camera-frame">
              {snapshotUrl ? (
                <img
                  src={snapshotUrl}
                  alt="Live webcam with pen detection"
                  className="camera-video"
                />
              ) : (
                <div className="camera-loading">Starting camera feed...</div>
              )}
            </div>
          </div>

          <div className="live-stats-panel">
            <div className="live-stat">
              <span className="live-stat-label">Pen</span>
              <span className={`live-stat-value ${penData?.detected ? "detected" : "missing"}`}>
                {penData?.detected ? "Detected" : "Not detected"}
              </span>
            </div>
            <div className="live-stat">
              <span className="live-stat-label">Score</span>
              <span className="live-stat-value">
                {penData?.detected ? `${Math.round(penData.score)}/100` : "—"}
              </span>
            </div>
            <div className="live-stat">
              <span className="live-stat-label">Distance</span>
              <span className="live-stat-value">
                {penData?.detected ? `${Math.round(penData.distance)}px` : "—"}
              </span>
            </div>
            <div className="live-stat">
              <span className="live-stat-label">Parking zone</span>
              <span className="live-stat-value">Fixed on camera</span>
            </div>
          </div>

          <div className="camera-instructions">
            <p className="instruction-main">
              {penData?.instruction || "Hold a pen in front of the camera and move it to the yellow target circle."}
            </p>
            <p className="instruction-hint">
              Yellow circle = fixed parking spot · Green box = your real pen · Updates in real time
            </p>
          </div>

          <button
            type="button"
            className="btn-stop"
            onClick={handleStopCamera}
            disabled={isStopping}
          >
            <CameraOff size={18} />
            <span>{isStopping ? "Turning off camera..." : "Turn Off Camera"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

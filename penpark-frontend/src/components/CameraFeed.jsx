import { useEffect, useRef, useState } from "react";

export default function CameraFeed({ targetPosition }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsLoading(false);
        }
      } catch (err) {
        setError(
          err.name === "NotAllowedError"
            ? "Camera access denied. Please allow camera permissions."
            : "Unable to access camera. Please check your device."
        );
        setIsLoading(false);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const imageData = canvasRef.current.toDataURL("image/png");
      console.log("Image captured:", imageData);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
        width: "100%",
        height: "100%",
      }}
    >
      {isLoading && (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            color: "rgba(255, 255, 255, 0.7)",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          🔄 Starting camera...
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "rgba(255, 107, 107, 0.2)",
            border: "1px solid #FF6B6B",
            borderRadius: "4px",
            color: "#FF6B6B",
            width: "100%",
            textAlign: "center",
            position: "absolute",
            top: 0,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <video
        ref={videoRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          transform: "scaleX(-1)",
          objectFit: "cover",
        }}
      />

      <canvas
        ref={canvasRef}
        style={{
          display: "none",
        }}
      />
    </div>
  );
}

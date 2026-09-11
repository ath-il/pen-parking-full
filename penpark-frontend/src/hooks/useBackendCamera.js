import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";

export default function useBackendCamera({ pollInterval = 300, frameInterval = 100 } = {}) {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [penData, setPenData] = useState(null);
  const [backendOnline, setBackendOnline] = useState(null);
  const [snapshotTick, setSnapshotTick] = useState(0);
  const pollRef = useRef(null);
  const frameRef = useRef(null);

  const checkBackend = useCallback(async () => {
    try {
      await api.health();
      setBackendOnline(true);
      return true;
    } catch {
      setBackendOnline(false);
      return false;
    }
  }, []);

  const pollFrame = useCallback(async () => {
    try {
      const data = await api.getFrame();
      setPenData(data);
      setError(null);
    } catch {
      // Frame may not be ready yet right after start
    }
  }, []);

  const startCamera = useCallback(async (source) => {
    setIsLoading(true);
    setError(null);

    const online = await checkBackend();
    if (!online) {
      setError("Backend is not running. Start it with: python app.py");
      setIsLoading(false);
      return false;
    }

    try {
      await api.startCamera(source);
      setIsActive(true);
      setSnapshotTick(Date.now());

      if (pollRef.current) clearInterval(pollRef.current);
      if (frameRef.current) clearInterval(frameRef.current);

      pollRef.current = setInterval(pollFrame, pollInterval);
      frameRef.current = setInterval(() => {
        setSnapshotTick(Date.now());
      }, frameInterval);

      setTimeout(pollFrame, 500);

      return true;
    } catch (err) {
      setError(err.message || "Failed to start camera");
      setIsActive(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [checkBackend, pollFrame, pollInterval, frameInterval]);

  const stopCamera = useCallback(async () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (frameRef.current) {
      clearInterval(frameRef.current);
      frameRef.current = null;
    }

    try {
      await api.stopCamera();
    } catch {
      // Backend may already be stopped
    }

    setIsActive(false);
    setPenData(null);
    setSnapshotTick(0);
  }, []);

  useEffect(() => {
    checkBackend();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (frameRef.current) clearInterval(frameRef.current);
      api.stopCamera().catch(() => {});
    };
  }, [checkBackend]);

  const snapshotUrl =
    isActive && snapshotTick
      ? `${api.snapshotUrl()}?t=${snapshotTick}`
      : null;

  return {
    isActive,
    isLoading,
    error,
    penData,
    backendOnline,
    snapshotUrl,
    startCamera,
    stopCamera,
    checkBackend,
  };
}

import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";

export default function useBackendCamera({ pollInterval = 250 } = {}) {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [penData, setPenData] = useState(null);
  const [backendOnline, setBackendOnline] = useState(null);
  const [feedKey, setFeedKey] = useState(0);
  const pollRef = useRef(null);
  const activeRef = useRef(false);

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
    } catch {
      // Detection data may not be ready yet
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
      activeRef.current = true;
      setFeedKey(Date.now());
      setIsActive(true);

      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(pollFrame, pollInterval);
      setTimeout(pollFrame, 200);

      return true;
    } catch (err) {
      setError(err.message || "Failed to start camera");
      activeRef.current = false;
      setIsActive(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [checkBackend, pollFrame, pollInterval]);

  const stopCamera = useCallback(async () => {
    activeRef.current = false;
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    try {
      await api.stopCamera();
    } catch {
      // Backend may already be stopped
    }

    setIsActive(false);
    setPenData(null);
    setFeedKey(0);
  }, []);

  useEffect(() => {
    checkBackend();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [checkBackend]);

  return {
    isActive,
    isLoading,
    error,
    penData,
    backendOnline,
    videoFeedUrl: feedKey ? `${api.videoFeedUrl()}?t=${feedKey}` : null,
    startCamera,
    stopCamera,
    checkBackend,
  };
}

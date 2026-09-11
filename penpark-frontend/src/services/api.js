const API_BASE = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  health: () => request("/api/health"),

  startCamera: (source) =>
    request("/api/camera/start", {
      method: "POST",
      body: JSON.stringify(source ? { source } : {}),
    }),

  stopCamera: () => request("/api/camera/stop", { method: "POST" }),

  cameraStatus: () => request("/api/camera/status"),

  getFrame: () => request("/api/camera/frame"),

  checkParking: () => request("/api/parking/check", { method: "POST" }),

  getHistory: () => request("/api/parking/history"),

  getStats: () => request("/api/parking/stats"),

  getConfig: () => request("/api/config"),

  videoFeedUrl: () => `${API_BASE}/api/camera/video_feed`,

  snapshotUrl: () => `${API_BASE}/api/camera/snapshot`,
};

export default api;

"use client";

// Stable per-browser identifier so each visitor gets their own session
// history without ever logging in. Stored in localStorage; survives
// reloads but is per-browser.

import { useEffect, useState } from "react";

const STORAGE_KEY = "analytics-agent-demo-user-id";

export function useDemoUser(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = `demo-${crypto.randomUUID()}`;
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    setUserId(id);
  }, []);

  return userId;
}

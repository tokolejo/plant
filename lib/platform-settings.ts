"use client";

import * as React from "react";
import { createClient } from "@/utils/supabase/client";

export interface PlatformSettings {
  subscriptionsMode: "COMING_SOON" | "ACTIVE";
  greenhouseEnabled: boolean;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  subscriptionsMode: "COMING_SOON",
  greenhouseEnabled: false,
};

const STORAGE_KEY = "plantsale_platform_settings_v1";
const EVENT_NAME = "plantsale_settings_updated";

export function getStoredPlatformSettings(): PlatformSettings {
  if (typeof window === "undefined") return DEFAULT_PLATFORM_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PLATFORM_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      subscriptionsMode: parsed.subscriptionsMode === "ACTIVE" ? "ACTIVE" : "COMING_SOON",
      greenhouseEnabled: Boolean(parsed.greenhouseEnabled),
    };
  } catch {
    return DEFAULT_PLATFORM_SETTINGS;
  }
}

export function saveStoredPlatformSettings(settings: PlatformSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: settings }));
  } catch (e) {
    console.error("Failed to save platform settings locally", e);
  }
}

export async function fetchAndSyncPlatformSettings(): Promise<PlatformSettings> {
  try {
    const res = await fetch("/api/admin/settings", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.settings) {
        saveStoredPlatformSettings(data.settings);
        return data.settings;
      }
    }
  } catch (err) {
    console.warn("Could not fetch settings from API, falling back to local/DB:", err);
  }

  // Supabase fallback if API route is not reachable
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "platform_features")
      .single();

    if (!error && data?.value) {
      const val = data.value;
      const parsed: PlatformSettings = {
        subscriptionsMode: val.subscriptionsMode === "ACTIVE" ? "ACTIVE" : "COMING_SOON",
        greenhouseEnabled: Boolean(val.greenhouseEnabled),
      };
      saveStoredPlatformSettings(parsed);
      return parsed;
    }
  } catch (e) {
    console.warn("Direct DB fetch error:", e);
  }

  return getStoredPlatformSettings();
}

export async function updatePlatformSettingsViaApi(settings: PlatformSettings): Promise<boolean> {
  // 1. Save locally immediately
  saveStoredPlatformSettings(settings);

  // 2. Persist to API
  try {
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    if (res.ok) {
      const data = await res.json();
      return !!data.success;
    }
  } catch (err) {
    console.error("Error updating settings via API:", err);
  }

  // 3. Direct Supabase fallback
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("site_settings")
      .upsert({
        key: "platform_features",
        value: settings,
        description: "Public Platform Feature Flags (Subscriptions mode, Greenhouse visibility)",
        updated_at: new Date().toISOString(),
      });
    return !error;
  } catch (e) {
    console.error("Error upserting site_settings:", e);
    return false;
  }
}

export function usePlatformSettings() {
  const [settings, setSettings] = React.useState<PlatformSettings>(getStoredPlatformSettings());
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // 1. Set current stored value
    setSettings(getStoredPlatformSettings());

    // 2. Fetch live settings
    fetchAndSyncPlatformSettings().then((live) => {
      setSettings(live);
      setLoading(false);
    });

    // 3. Listen to local events
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setSettings(e.detail);
      } else {
        setSettings(getStoredPlatformSettings());
      }
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const updateSettings = async (newSettings: PlatformSettings) => {
    setSettings(newSettings);
    return await updatePlatformSettingsViaApi(newSettings);
  };

  return {
    settings,
    loading,
    updateSettings,
    subscriptionsMode: settings.subscriptionsMode,
    isSubscriptionsComingSoon: settings.subscriptionsMode === "COMING_SOON",
    greenhouseEnabled: settings.greenhouseEnabled,
  };
}

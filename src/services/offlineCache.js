import { Preferences } from "@capacitor/preferences";

/**
 * Offline Cache Layer for Mosque Hub
 * Persists critical data on the user's device so the app loads instantly offline.
 */
class OfflineCache {
  // Save an item to device storage
  async set(key, value) {
    try {
      const json = JSON.stringify(value);
      await Preferences.set({ key, value: json });
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(`mosque_cache_${key}`, json);
      }
    } catch (e) {
      console.warn(`[OfflineCache] Failed to save key "${key}":`, e);
    }
  }

  // Retrieve an item from device storage
  async get(key, fallback = null) {
    try {
      const { value } = await Preferences.get({ key });
      if (value) return JSON.parse(value);
      if (typeof window !== "undefined" && window.localStorage) {
        const local = localStorage.getItem(`mosque_cache_${key}`);
        if (local) return JSON.parse(local);
      }
    } catch (e) {
      console.warn(`[OfflineCache] Failed to read key "${key}":`, e);
    }
    return fallback;
  }

  // Remove a key
  async remove(key) {
    try {
      await Preferences.remove({ key });
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem(`mosque_cache_${key}`);
      }
    } catch (e) {
      console.warn(`[OfflineCache] Failed to remove key "${key}":`, e);
    }
  }
}

export const offlineCache = new OfflineCache();

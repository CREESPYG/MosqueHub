import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../firebase";

const DEFAULTS = { name: "Masjid Al-Putki", location: "Jharkhand" };

export function useMosqueSettings() {
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    const unsub = onValue(ref(rtdb, "settings/mosque"), (snap) => {
      if (snap.exists()) setSettings({ ...DEFAULTS, ...snap.val() });
    });
    return unsub;
  }, []);

  return settings;
}
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

/**
 * Background & Instant Notification Service for Android APK & Web
 * Supports:
 * - Accurate Exact-Time Azan notifications
 * - Accurate Exact-Time Iqamah notifications
 * - 5-Minute Pre-Prayer alarms
 * - Friday-Only Jummah prayer scheduling (does NOT fire on non-Fridays)
 * - Android Background Exact Alarm & Notification Channels
 */

// Unique base IDs for prayer notifications to prevent collision
const BASE_IDS = {
  Fajr: { azan: 101, iqamah: 111, pre: 121 },
  Dhuhr: { azan: 102, iqamah: 112, pre: 122 },
  Asr: { azan: 103, iqamah: 113, pre: 123 },
  Maghrib: { azan: 104, iqamah: 114, pre: 124 },
  Isha: { azan: 105, iqamah: 115, pre: 125 },
  Jummah: { azan: 106, iqamah: 116, pre: 126 },
};

const DEFAULT_PREFS = {
  azanExact: true,
  iqamahExact: true,
  prePrayer5Min: true,
  fridayJummahOnly: true,
  sound: true,
};

function parseTime(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : null;

  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return { hours, minutes };
}

export const notificationService = {
  // Get stored notification preferences
  getPreferences() {
    try {
      const saved = localStorage.getItem("mosque_notif_prefs");
      return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  },

  // Save notification preferences
  savePreferences(prefs) {
    try {
      localStorage.setItem("mosque_notif_prefs", JSON.stringify(prefs));
    } catch (e) {
      console.warn("Failed to save notification preferences:", e);
    }
  },

  // Check permission status
  async checkPermissionStatus() {
    if (Capacitor.isNativePlatform()) {
      try {
        const status = await LocalNotifications.checkPermissions();
        return status.display === "granted" ? "granted" : status.display === "denied" ? "denied" : "default";
      } catch (e) {
        return "default";
      }
    } else if (typeof window !== "undefined" && "Notification" in window) {
      return window.Notification.permission;
    }
    return "granted";
  },

  // Request notification permissions
  async requestPermissions() {
    if (Capacitor.isNativePlatform()) {
      try {
        const status = await LocalNotifications.checkPermissions();
        if (status.display !== "granted") {
          const req = await LocalNotifications.requestPermissions();
          return req.display === "granted";
        }
        return true;
      } catch (e) {
        console.warn("[NotificationService] Error requesting permissions:", e);
        return false;
      }
    } else if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await window.Notification.requestPermission();
        return perm === "granted";
      } catch (e) {
        return false;
      }
    }
    return false;
  },

  // Initialize Android Notification Channel for High-Priority Alerts
  async initChannel() {
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.createChannel({
          id: "prayer_alerts",
          name: "Mosque Prayer & Azan Alerts",
          description: "High priority alarms for Azan, Iqamah, and Friday Jummah",
          importance: 5, // High priority (heads-up notification)
          visibility: 1, // Public on lockscreen
          vibration: true,
          sound: "beep.wav",
        });

        await LocalNotifications.createChannel({
          id: "mosque_announcements",
          name: "Mosque Announcements & Events",
          description: "Updates, events, and news from Masjid Al-Putki",
          importance: 4,
          visibility: 1,
          vibration: true,
        });
      } catch (e) {
        console.warn("[NotificationService] Failed to create notification channel:", e);
      }
    }
  },

  // Show an instant device notification
  async showInstantNotification({ title, body, imageUrl, id, channelId = "prayer_alerts" }) {
    if (Capacitor.isNativePlatform()) {
      try {
        const hasPerm = await this.requestPermissions();
        if (!hasPerm) return;
        await this.initChannel();

        const notifId = typeof id === "number"
          ? id
          : typeof id === "string"
          ? Math.abs(id.split("").reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0)) % 100000
          : Math.floor(Math.random() * 80000) + 1000;

        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifId,
              title: title || "Mosque Hub",
              body: body || "New notification from Masjid Al-Putki",
              channelId,
              smallIcon: "ic_stat_mosque",
              iconColor: "#047857",
              schedule: { at: new Date(Date.now() + 200), allowWhileIdle: true },
              extra: { imageUrl },
            },
          ],
        });
      } catch (err) {
        console.warn("[NotificationService] Error triggering native notification:", err);
      }
    } else if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
      try {
        new window.Notification(title || "Mosque Hub", {
          body: body || "New announcement",
          icon: "/icons/icon-192.png",
          image: imageUrl || undefined,
        });
      } catch (e) {}
    }
  },

  /**
   * Schedule Background Notifications for Next 7 Days with Exact Timing
   * - Azan exact on-time
   * - Iqamah exact on-time
   * - 5-min Pre-alert
   * - Jummah prayer ONLY on Fridays
   * - Standard Dhuhr only Saturday through Thursday
   */
  async schedulePrayerAlarms(azansData, userPrefs) {
    if (!azansData) return;
    const prefs = userPrefs || this.getPreferences();

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.warn("[NotificationService] Notification permission not granted.");
      return;
    }

    await this.initChannel();

    if (Capacitor.isNativePlatform()) {
      const notifications = [];
      const now = new Date();

      // Schedule for the next 7 days in advance to ensure exact timing and Friday isolation
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const targetDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
        const isFriday = targetDay.getDay() === 5; // 5 is Friday

        for (const [prayerName, timing] of Object.entries(azansData)) {
          // Friday Rule: Jummah is scheduled ONLY on Friday. Dhuhr is skipped on Friday.
          if (prayerName === "Jummah" && !isFriday) continue;
          if (prayerName === "Dhuhr" && isFriday) continue;

          const ids = BASE_IDS[prayerName] || { azan: 900, iqamah: 901, pre: 902 };
          const offsetMultiplier = dayOffset * 1000;

          // 1. Azan Exact Notification
          if (prefs.azanExact && timing.azan) {
            const azanTime = parseTime(timing.azan);
            if (azanTime) {
              const azanDate = new Date(
                targetDay.getFullYear(),
                targetDay.getMonth(),
                targetDay.getDate(),
                azanTime.hours,
                azanTime.minutes,
                0
              );

              if (azanDate.getTime() > now.getTime()) {
                notifications.push({
                  id: ids.azan + offsetMultiplier,
                  title: `🕌 ${prayerName} Azan Time`,
                  body: `It is now time for ${prayerName} Azan (${timing.azan}) at Masjid Al-Putki.`,
                  schedule: { at: azanDate, allowWhileIdle: true },
                  channelId: "prayer_alerts",
                  smallIcon: "ic_stat_mosque",
                  iconColor: "#047857",
                  extra: { prayerName, type: "azan" },
                });
              }
            }
          }

          // 2. Iqamah Exact Notification
          if (prefs.iqamahExact && timing.iqamah) {
            const iqamahTime = parseTime(timing.iqamah);
            if (iqamahTime) {
              const iqamahDate = new Date(
                targetDay.getFullYear(),
                targetDay.getMonth(),
                targetDay.getDate(),
                iqamahTime.hours,
                iqamahTime.minutes,
                0
              );

              if (iqamahDate.getTime() > now.getTime()) {
                notifications.push({
                  id: ids.iqamah + offsetMultiplier,
                  title: `🕌 ${prayerName} Iqamah Starting`,
                  body: `Congregational prayer for ${prayerName} is starting now (${timing.iqamah}) at Masjid Al-Putki.`,
                  schedule: { at: iqamahDate, allowWhileIdle: true },
                  channelId: "prayer_alerts",
                  smallIcon: "ic_stat_mosque",
                  iconColor: "#047857",
                  extra: { prayerName, type: "iqamah" },
                });
              }
            }
          }

          // 3. 5-Minute Pre-Prayer Warning
          if (prefs.prePrayer5Min && (timing.azan || timing.iqamah)) {
            const baseTime = parseTime(timing.azan || timing.iqamah);
            if (baseTime) {
              const preDate = new Date(
                targetDay.getFullYear(),
                targetDay.getMonth(),
                targetDay.getDate(),
                baseTime.hours,
                baseTime.minutes - 5,
                0
              );

              if (preDate.getTime() > now.getTime()) {
                notifications.push({
                  id: ids.pre + offsetMultiplier,
                  title: `🕌 ${prayerName} in 5 Minutes`,
                  body: `Azan at ${timing.azan || timing.iqamah}. Prepare for ${prayerName} prayer at Masjid Al-Putki.`,
                  schedule: { at: preDate, allowWhileIdle: true },
                  channelId: "prayer_alerts",
                  smallIcon: "ic_stat_mosque",
                  iconColor: "#047857",
                  extra: { prayerName, type: "pre" },
                });
              }
            }
          }
        }
      }

      try {
        // Clear all previous prayer alarms
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          const cancelIds = pending.notifications.map((n) => ({ id: n.id }));
          await LocalNotifications.cancel({ notifications: cancelIds });
        }

        // Schedule new accurate alarms
        if (notifications.length > 0) {
          // Schedule in batches of 40 if needed (Capacitor handles arrays well)
          await LocalNotifications.schedule({ notifications });
          console.log(`[NotificationService] Scheduled ${notifications.length} accurate background prayer notifications.`);
        }
      } catch (err) {
        console.error("[NotificationService] Error scheduling local notifications:", err);
      }
    }
  },
};

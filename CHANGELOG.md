# 📋 Changelog

All notable changes to the Mosque Hub project will be documented in this file.

---

## [1.0.3] — Build 3 (2026-08-28)

### 🕌 Islamic Civil Calendar & Event Sync
- **Islamic Civil Dual Calendar**: Implemented standard `en-u-ca-islamic-civil` calendar calculations with multi-year compatibility.
- **Google Calendar Aligned Events**: Synchronized all major Islamic holy days (Ramadan, Laylat al-Qadr, Eid al-Fitr, Day of Arafah, Eid al-Adha, Ashura, Mawlid an-Nabi, Isra & Mi'raj, Shab-e-Barat).
- **Interactive Date Inspector**: Tap any calendar day to inspect its full Islamic date and scheduled mosque events.
- **Islamic Month Names on Cards**: Added prominent Islamic month badges (*Ramadan*, *Shawwal*, *Muharram*, *Dhu al-Hijjah*, etc.) across all event cards.
- **Past, Upcoming & Multi-Year Feed**: Filterable timeline supporting upcoming events, past events, and instant search.

### ⏰ Accurate Notification Engine & Background Alarms
- **Exact-Time Azan Alarms**: High-priority alert triggered on the exact minute of Azan.
- **Exact-Time Iqamah Alarms**: Timely notifications for congregational prayer starts.
- **5-Minute Pre-Prayer Warnings**: Advance notice for worshippers to prepare for prayer.
- **Friday-Only Jummah Notification**: Strict Friday scheduling replacing Dhuhr on Fridays.
- **Android Background Permissions**: Added `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`, `FOREGROUND_SERVICE`, `SCHEDULE_EXACT_ALARM`, and `USE_EXACT_ALARM` in `AndroidManifest.xml`.
- **In-App Battery & Background Guide**: Added battery optimization helper card in Notifications tab.

### 🛠️ Bug Fixes & Stability
- **React 19 Rules of Hooks Fix**: Fixed conditional hook execution in `Profile.jsx` that previously caused runtime errors.
- **Zero Linter Warnings/Errors**: Cleaned unused imports and fixed helper methods across services.
- **Dedicated `Web-Build` Folder**: Standalone deployable web distribution with `_redirects` and `404.html` fallback for any static web host.

---

## [1.0.2] — Build 2
- Real-time prayer timings via Firebase Realtime Database.
- Push notifications support via Capacitor Local Notifications.
- Gallery and financial hub management.

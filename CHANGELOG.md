# 📋 Changelog

All notable changes to the Mosque Hub project are documented in this file.

---

## [1.0.4] — Build 4 (2026-08-28)

### 🚀 Page Scrolling & Touch Momentum Fixes
- **Natural Document Momentum Scrolling**: Removed conflicting nested overflow constraints across `html` and `body` that previously caused touch-scroll locking and jitter on mobile WebViews.
- **Bottom Navigation Clearance**: Adjusted main page scroll padding to `pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]`, preventing any cards or buttons from being blocked by the raised bottom navigation bar.
- **Harmonized Breakpoints**: Synchronized `SliceBottomNav` (`lg:hidden`) with desktop sidebar (`hidden lg:flex`) for consistent navigation across mobile, tablets, and desktop.
- **Version Bump**: Updated version tag to `v1.0.4` and build code to `4`.

---

## [1.0.3] — Build 3 (2026-08-28)

### 🚀 Performance & Zero-Lag Architecture
- **O(1) Memoized Islamic Calendar Engine**: Replaced repeated multi-thousand iteration loops with a single-pass 3-year index and in-memory date memoization cache, eliminating UI freezes and stuttering.
- **Hardware-Accelerated UI**: Enabled GPU transitions, smooth 60fps scrolling, and responsive container scaling across all devices.
- **Dynamic Islamic Month Shifting**: Calendar month header and day inspector dynamically transition Islamic month names and dates live as dates change or months shift.
- **Full Device Screen Fitting**: Fixed viewport meta scaling (`user-scalable=no, viewport-fit=cover`) and responsive 7-column calendar grid sizing (`h-11 sm:h-16`, `gap-1 sm:gap-1.5`) guaranteeing zero horizontal clipping or overflow on mobile devices.

### 🕌 Islamic Civil Calendar & Event Sync
- **Islamic Civil Dual Calendar**: Standard `en-u-ca-islamic-civil` calendar calculations with multi-year Google Calendar holiday alignment.
- **Interactive Date Inspector**: Tap any calendar day to inspect its full Islamic date and scheduled mosque events.
- **Islamic Month Badges on Cards**: Prominent badges (*Ramadan*, *Shawwal*, *Muharram*, *Dhu al-Hijjah*, etc.) across all event cards.
- **Past, Upcoming & Multi-Year Feed**: Filterable timeline supporting upcoming events, past events, and instant search.

### ⏰ Accurate Notification Engine & Background Alarms
- **Exact-Time Azan Alarms**: High-priority alert triggered on the exact minute of Azan.
- **Exact-Time Iqamah Alarms**: Timely notifications for congregational prayer starts.
- **5-Minute Pre-Prayer Warnings**: Advance notice for worshippers to prepare for prayer.
- **Friday-Only Jummah Notification**: Strict Friday scheduling replacing Dhuhr on Fridays.
- **Android Background Permissions**: Added `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`, `FOREGROUND_SERVICE`, `SCHEDULE_EXACT_ALARM`, and `USE_EXACT_ALARM` in `AndroidManifest.xml`.
- **In-App Battery & Background Guide**: Added battery optimization helper card in Notifications tab.

### 🛠️ Bug Fixes & Stability
- **React 19 Rules of Hooks Fix**: Fixed conditional hook execution in `Profile.jsx` and missing `Icon` import in `Tracker.jsx`.
- **Zero Linter Warnings/Errors**: Cleaned unused imports and fixed helper methods across services.
- **Dedicated `Web-Build` Folder**: Standalone deployable web distribution with `_redirects` and `404.html` fallback for any static web host.

---

## [1.0.2] — Build 2
- Real-time prayer timings via Firebase Realtime Database.
- Push notifications support via Capacitor Local Notifications.
- Gallery and financial hub management.

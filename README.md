# 🕌 Mosque Hub (Masjid Al-Putki)

[![Version](https://img.shields.io/badge/version-1.0.5-emerald.svg)](https://github.com/CREESPYG/MosqueHub)
[![Build](https://img.shields.io/badge/build-5-blue.svg)](https://github.com/CREESPYG/MosqueHub)
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Android%20APK-teal.svg)](https://github.com/CREESPYG/MosqueHub)

A modern, high-performance web and mobile application for mosque administration, real-time Azan and Iqamah schedules, interactive Islamic Civil (Hijri) dual calendar, event tracking, community announcements, and background notifications.

---

## 🌟 Key Features

### 1. ✨ Instant Islamic Loading Screen & Continuous Splash
- **Zero-Flash Top-Level Splash**: Instant radial emerald backdrop (`#064e3b` to `#022c22`) with rotating orbital light rings and golden Islamic Crescent/Dome emblem.
- **Continuous 3.0s Transition**: Unbroken animation sequence from start to end with smooth 0.4s GPU fade-out into the homepage.
- **Zero White Blank Screen**: Frame-0 dark emerald canvas rendering across all platforms.

### 2. ⏰ Accurate Time Notifications & Alarms
- **Exact-Time Azan Alerts**: High-priority alarm triggered precisely when the Azan starts.
- **Exact-Time Iqamah Alerts**: Notifies congregation right as prayer commences.
- **5-Minute Pre-Prayer Warnings**: Advanced notice for worshippers to perform wudu and arrive at the mosque.
- **Friday-Only Jummah Notification**: Jummah alerts strictly trigger on Fridays, automatically suppressing standard Dhuhr alerts.
- **Android Background Reliability**: Configured with `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`, and `FOREGROUND_SERVICE` for uninterrupted background scheduling.

### 3. 🌙 Interactive Islamic Civil (Hijri) Dual Calendar
- **Standard Islamic Civil Engine**: Accurate `en-u-ca-islamic-civil` calendar calculations aligned with Google Calendar Islamic Holidays.
- **Dual Month View**: Shows Gregorian dates and Hijri days side-by-side with Islamic month span indicators (e.g. *Safar – Rabi' al-Awwal 1448 AH*).
- **Date Inspector**: Tap any date to inspect the exact Islamic date and any events scheduled for that day.
- **Islamic Month Names on Event Cards**: Every holiday and event displays full Islamic month names (*Ramadan*, *Shawwal*, *Muharram*, *Dhu al-Hijjah*, etc.).
- **Multi-Year Events Engine**: Automatic tracking of past, present, and upcoming Islamic holy days (Ramadan, Laylat al-Qadr, Eid al-Fitr, Day of Arafah, Eid al-Adha, Ashura, Mawlid an-Nabi, Isra & Mi'raj, Shab-e-Barat).

### 4. 👥 Community & Mosque Management
- Real-time prayer timings synced with Firebase Realtime Database.
- Live countdown to next prayer.
- Offline support with local caching.
- Community events feed, photo gallery, and financial transparency hub.
- Admin portal for timings, events, announcements, and in-app updates.

---

## 📁 Repository Structure

```
├── And APK/                   # Android APK Releases (v1.0.5 build 5)
│   ├── MosqueHub-v1.0.5-build5.apk
│   └── MosqueHub-v1.0.5-build5-debug.apk
├── Web-Build/                 # Deployable static web build (drop-in for Netlify/Vercel/Firebase)
│   ├── index.html
│   ├── 404.html
│   ├── _redirects
│   └── assets/
├── src/                       # Application source code
│   ├── components/            # UI components and layouts
│   ├── contexts/              # Auth, Update, Confirm, Notif contexts
│   ├── pages/                 # Home, Schedule, Tracker, Community, Profile, Admin
│   ├── services/              # Notification, Islamic Calendar, Cache services
│   └── App.jsx
├── android/                   # Capacitor Android native project
├── package.json
└── vite.config.js
```

---

## 🚀 Web Deployment

Deploy the `Web-Build/` folder directly to any static hosting provider:

- **Netlify**: Drag and drop the `Web-Build/` folder in Netlify Drop.
- **Vercel**: Deploy directory `Web-Build` or import GitHub repo.
- **Firebase Hosting**: `firebase deploy --only hosting`.
- **Cloudflare Pages / GitHub Pages**: Point root output to `Web-Build`.

---

## 📱 Android APK Installation & Download

Download and install the latest release directly from GitHub Releases:
- **Direct Download (GitHub Releases)**: **[Download MosqueHub-v1.0.5-build5.apk](https://github.com/CREESPYG/MosqueHub/releases/download/v1.0.5/MosqueHub-v1.0.5-build5.apk)**
- **Release Page**: **[Mosque Hub v1.0.5 Release Notes & Assets](https://github.com/CREESPYG/MosqueHub/releases/tag/v1.0.5)**
- **Local File**: `And APK/MosqueHub-v1.0.5-build5.apk`

---

## 🛠️ Development & Building

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build web application
npm run build

# Sync Capacitor Android
npx cap sync android

# Build Android APK
cd android && ./gradlew assembleDebug
```

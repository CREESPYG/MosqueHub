/**
 * ════════════════════════════════════════════════════════════
 *  MOSQUE HUB — Firebase RTDB Seed Script
 *  Run this in your browser DevTools console while on the app.
 *  URL: http://localhost:5175/
 * ════════════════════════════════════════════════════════════
 *
 *  ┌─────────────────────────────────────────────────────────┐
 *  │  TEST USER UID  :  test_user_001                        │
 *  │  MAIN ADMIN UID :  admin_main_001                       │
 *  │  (Replace with your real Google UID after signing in)   │
 *  └─────────────────────────────────────────────────────────┘
 *
 *  HOW TO FIND YOUR REAL UID:
 *  1. Open the app → Sign in with Google
 *  2. Open DevTools (F12) → Console
 *  3. Type: firebase.auth().currentUser.uid
 *     OR check the Network tab for any Firebase request
 */

import { rtdb } from "./src/firebase.js";
import { ref, set } from "firebase/database";

// ── UIDs (Replace these with real Google UIDs) ───────────────
const TEST_USER_UID  = "test_user_001";   // ← Replace after login
const ADMIN_UID      = "admin_main_001";  // ← Replace with your UID

async function seedDatabase() {
  console.log("🌱 Starting database seed...");

  // ─────────────────────────────────────────────────────────
  // 1. ADMIN SETUP
  // ─────────────────────────────────────────────────────────
  await set(ref(rtdb, `admins/${ADMIN_UID}`), true);
  console.log("✅ Admin account registered");

  // ─────────────────────────────────────────────────────────
  // 2. PRAYER TIMINGS
  // ─────────────────────────────────────────────────────────
  await set(ref(rtdb, "timings"), {
    azans: {
      Fajr:    { azan: "05:10 AM", iqamah: "05:40 AM" },
      Dhuhr:   { azan: "12:45 PM", iqamah: "01:15 PM" },
      Asr:     { azan: "04:00 PM", iqamah: "04:30 PM" },
      Maghrib: { azan: "06:32 PM", iqamah: "06:37 PM" },
      Isha:    { azan: "07:55 PM", iqamah: "08:15 PM" },
      Jummah:  { azan: "01:00 PM", iqamah: "01:30 PM" },
    },
    lastUpdated: Date.now(),
  });
  console.log("✅ Prayer timings seeded");

  // ─────────────────────────────────────────────────────────
  // 3. ANNOUNCEMENTS
  // ─────────────────────────────────────────────────────────
  await set(ref(rtdb, "announcements"), {
    ann_001: {
      title: "Isha timings updated",
      body: "Isha Iqamah has been shifted to 8:15 PM effective immediately.",
      date: new Date().toISOString(),
      type: "timing",
    },
    ann_002: {
      title: "Jummah Reminder",
      body: "Brothers are requested to arrive by 12:45 PM for Jummah. Parking is available on the east side.",
      date: new Date().toISOString(),
      type: "general",
    },
  });
  console.log("✅ Announcements seeded");

  // ─────────────────────────────────────────────────────────
  // 4. EVENTS
  // ─────────────────────────────────────────────────────────
  await set(ref(rtdb, "events"), {
    evt_001: {
      title: "Eid Al-Adha Prayers",
      date: "2026-06-07",
      time: "07:00",
      description: "Community Eid Al-Adha prayer will be held at the main prayer hall. Dress code: Traditional attire. Light refreshments will be served after prayers.",
      imageUrl: "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=600&q=80",
      createdAt: Date.now(),
    },
    evt_002: {
      title: "Quran Recitation Competition",
      date: "2026-09-15",
      time: "10:00",
      description: "Annual Quran recitation competition for children aged 6-16. Registration closes on 10th September. Prizes for all participants.",
      imageUrl: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=600&q=80",
      createdAt: Date.now(),
    },
    evt_003: {
      title: "Islamic Finance Workshop",
      date: "2026-10-03",
      time: "14:00",
      description: "A workshop on halal finance, savings, and investment principles conducted by certified scholars. Open to all community members.",
      imageUrl: "",
      createdAt: Date.now(),
    },
    evt_004: {
      title: "Milad-un-Nabi Celebration",
      date: "2026-11-05",
      time: "08:00",
      description: "Join us in celebrating the birth of the Holy Prophet (PBUH). There will be Naat recitations, lectures, and community lunch for all attendees.",
      imageUrl: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=600&q=80",
      createdAt: Date.now(),
    },
  });
  console.log("✅ Events seeded");

  // ─────────────────────────────────────────────────────────
  // 5. FINANCES (All amounts in INR ₹)
  // ─────────────────────────────────────────────────────────
  await set(ref(rtdb, "finances"), {
    funds: {
      fund_001: {
        donorName: "Mohammed Irfan",
        amount: 5000,
        date: "2026-08-01",
        paymentRef: "UPI - gpay@irfan",
        createdAt: Date.now(),
      },
      fund_002: {
        donorName: "Anonymous",
        amount: 2500,
        date: "2026-08-05",
        paymentRef: "Cash",
        createdAt: Date.now(),
      },
      fund_003: {
        donorName: "Sayed Abdul Karim",
        amount: 10000,
        date: "2026-08-08",
        paymentRef: "Bank Transfer - HDFC",
        createdAt: Date.now(),
      },
      fund_004: {
        donorName: "Farhan Siddiqui",
        amount: 1500,
        date: "2026-08-10",
        paymentRef: "UPI - phonepe@farhan",
        createdAt: Date.now(),
      },
      fund_005: {
        donorName: "Mosque Trust Fund",
        amount: 25000,
        date: "2026-08-15",
        paymentRef: "Bank Transfer - SBI Zakat Account",
        createdAt: Date.now(),
      },
      fund_006: {
        donorName: "Anonymous",
        amount: 500,
        date: "2026-08-17",
        paymentRef: "Cash - Friday Collection",
        createdAt: Date.now(),
      },
    },
    expenses: {
      exp_001: {
        category: "Electricity",
        amount: 3200,
        date: "2026-08-03",
        note: "Monthly electricity bill — JSEB August 2026",
        addedBy: "Admin",
        createdAt: Date.now(),
      },
      exp_002: {
        category: "Cleaning",
        amount: 1800,
        date: "2026-08-05",
        note: "Cleaning supplies — Phenyl, brooms, mops",
        addedBy: "Admin",
        createdAt: Date.now(),
      },
      exp_003: {
        category: "Maintenance",
        amount: 4500,
        date: "2026-08-08",
        note: "Wudu area tap replacement and pipe fitting",
        addedBy: "Admin",
        createdAt: Date.now(),
      },
      exp_004: {
        category: "Salaries",
        amount: 8000,
        date: "2026-08-10",
        note: "Imam monthly salary — August 2026",
        addedBy: "Admin",
        createdAt: Date.now(),
      },
      exp_005: {
        category: "Events",
        amount: 2200,
        date: "2026-08-15",
        note: "Refreshments and decoration for Shab-e-Barat",
        addedBy: "Admin",
        createdAt: Date.now(),
      },
    },
  });
  console.log("✅ Finances seeded (Total Funds: ₹44,500 | Total Expenses: ₹19,700 | Balance: ₹24,800)");

  // ─────────────────────────────────────────────────────────
  // 6. GALLERY
  // ─────────────────────────────────────────────────────────
  await set(ref(rtdb, "gallery"), {
    photo_001: {
      imageUrl: "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=600&q=80",
      caption: "Eid prayers at Masjid Al-Putki",
      timestamp: Date.now() - 86400000 * 10,
      uploadedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    photo_002: {
      imageUrl: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=600&q=80",
      caption: "Mosque interior — Main hall",
      timestamp: Date.now() - 86400000 * 7,
      uploadedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    photo_003: {
      imageUrl: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=600&q=80",
      caption: "Quran class for children",
      timestamp: Date.now() - 86400000 * 3,
      uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    photo_004: {
      imageUrl: "https://images.unsplash.com/photo-1519817914152-22d216bb9170?w=600&q=80",
      caption: "Community iftar gathering",
      timestamp: Date.now() - 86400000,
      uploadedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  });
  console.log("✅ Gallery seeded");

  // ─────────────────────────────────────────────────────────
  // 7. TEST USER — Prayer Tracker History
  // ─────────────────────────────────────────────────────────
  const today = new Date();
  const prayerTracker = {};

  // Generate 14 days of prayer history
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split("T")[0]; // YYYY-MM-DD

    // Simulate realistic prayer habits
    prayerTracker[key] = {
      Fajr:    i < 3 ? true : Math.random() > 0.4,
      Dhuhr:   true,
      Asr:     Math.random() > 0.2,
      Maghrib: true,
      Isha:    Math.random() > 0.3,
    };
  }

  await set(ref(rtdb, `users/${TEST_USER_UID}`), {
    displayName: "Test User",
    email: "testuser@example.com",
    photoURL: "https://i.pravatar.cc/150?img=11",
    createdAt: Date.now() - 86400000 * 30,
    prayerTracker,
  });
  console.log("✅ Test user seeded with 14-day prayer history");

  // ─────────────────────────────────────────────────────────
  // 8. ADMIN USER Profile
  // ─────────────────────────────────────────────────────────
  await set(ref(rtdb, `users/${ADMIN_UID}`), {
    displayName: "Masjid Admin",
    email: "admin@masjidputki.org",
    photoURL: "https://i.pravatar.cc/150?img=68",
    createdAt: Date.now() - 86400000 * 60,
  });
  console.log("✅ Admin user profile seeded");

  console.log("\n🎉 SEED COMPLETE! Summary:");
  console.log("────────────────────────────────────");
  console.log("👤 Test User UID  : test_user_001");
  console.log("🔑 Admin UID      : admin_main_001");
  console.log("📿 Prayer Timings : 6 prayers configured");
  console.log("📅 Events         : 4 upcoming events");
  console.log("💰 Funds Collected: ₹44,500");
  console.log("📋 Expenses       : ₹19,700");
  console.log("✅ Net Balance    : ₹24,800 INR");
  console.log("🖼️  Gallery Photos : 4 photos");
  console.log("────────────────────────────────────");
  console.log("\n⚠️  IMPORTANT: Replace UIDs with real Google UIDs!");
  console.log("   Sign in → DevTools Console → type: firebase.auth().currentUser");
}

seedDatabase().catch(console.error);

/**
 * Islamic (Hijri Civil) & Gregorian Calendar Service
 * Uses standard Islamic Civil calendar (en-u-ca-islamic-civil) aligned with
 * Google Calendar Islamic Holidays and global international calendar standards.
 */

// Major Islamic Months (Hijri)
export const HIJRI_MONTHS = [
  "Muharram",
  "Safar",
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  "Jumada al-Awwal",
  "Jumada al-Thani",
  "Rajab",
  "Sha'ban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qi'dah",
  "Dhu al-Hijjah",
];

// Major recurring Islamic Holy Days & Observances
export const ISLAMIC_EVENTS_DATA = [
  {
    hijriMonth: 1,
    hijriDay: 1,
    title: "Islamic New Year (1st Muharram)",
    description: "Start of the Islamic Civil New Year (1448 AH). A sacred time of renewal and contemplation.",
    category: "Islamic Holiday",
    isMajor: true,
  },
  {
    hijriMonth: 1,
    hijriDay: 9,
    title: "Tasu'a (Fasting Day)",
    description: "9th of Muharram, recommended day of fasting alongside the Day of Ashura.",
    category: "Sunnah Fast",
    isMajor: false,
  },
  {
    hijriMonth: 1,
    hijriDay: 10,
    title: "Day of Ashura (10th Muharram)",
    description: "10th of Muharram. Significant day of fasting commemorating Prophet Musa (AS) and Imam Hussain (RA).",
    category: "Islamic Observance",
    isMajor: true,
  },
  {
    hijriMonth: 3,
    hijriDay: 12,
    title: "Mawlid an-Nabi (Prophet's Birthday)",
    description: "Commemoration of the birth of Prophet Muhammad (ﷺ) on 12th Rabi' al-Awwal.",
    category: "Islamic Holiday",
    isMajor: true,
  },
  {
    hijriMonth: 7,
    hijriDay: 27,
    title: "Isra and Mi'raj (The Miraculous Night Journey)",
    description: "The miraculous journey and ascension of Prophet Muhammad (ﷺ) to the heavens on 27th Rajab.",
    category: "Islamic Observance",
    isMajor: true,
  },
  {
    hijriMonth: 8,
    hijriDay: 15,
    title: "Shab-e-Barat (Mid-Sha'ban)",
    description: "Night of records and seeking forgiveness from Allah SWT in preparation for Ramadan on 15th Sha'ban.",
    category: "Islamic Observance",
    isMajor: true,
  },
  {
    hijriMonth: 9,
    hijriDay: 1,
    title: "1st Day of Ramadan (Fasting Begins)",
    description: "Beginning of the blessed month of fasting, nightly Tarawih prayers, and Quran recitation (1st Ramadan).",
    category: "Holy Month",
    isMajor: true,
  },
  {
    hijriMonth: 9,
    hijriDay: 27,
    title: "Laylat al-Qadr (Night of Power)",
    description: "The most blessed night of the year, better than 1,000 months of worship on 27th Ramadan.",
    category: "Holy Night",
    isMajor: true,
  },
  {
    hijriMonth: 10,
    hijriDay: 1,
    title: "Eid al-Fitr (Festival of Breaking Fast)",
    description: "Grand Islamic celebration concluding Ramadan on 1st Shawwal. Special Eid congregational prayer and festivities.",
    category: "Islamic Holiday",
    isMajor: true,
  },
  {
    hijriMonth: 10,
    hijriDay: 2,
    title: "Eid al-Fitr (Day 2)",
    description: "Second day of Eid al-Fitr festivities and family gatherings on 2nd Shawwal.",
    category: "Islamic Holiday",
    isMajor: false,
  },
  {
    hijriMonth: 12,
    hijriDay: 1,
    title: "First 10 Days of Dhul Hijjah",
    description: "The sacred days beloved to Allah for righteous deeds, Dhikr, and fasting (1st Dhu al-Hijjah).",
    category: "Sacred Days",
    isMajor: false,
  },
  {
    hijriMonth: 12,
    hijriDay: 9,
    title: "Day of Arafah (Hajj Pinnacle)",
    description: "The pinnacle of Hajj at Mount Arafat. Recommended day of fasting for non-pilgrims on 9th Dhu al-Hijjah.",
    category: "Islamic Observance",
    isMajor: true,
  },
  {
    hijriMonth: 12,
    hijriDay: 10,
    title: "Eid al-Adha (Feast of Sacrifice)",
    description: "Major Islamic festival honoring Prophet Ibrahim's (AS) devotion with Qurbani and prayers on 10th Dhu al-Hijjah.",
    category: "Islamic Holiday",
    isMajor: true,
  },
  {
    hijriMonth: 12,
    hijriDay: 11,
    title: "Days of Tashreeq (11-13 Dhul Hijjah)",
    description: "Days of eating, drinking, and remembrance of Allah following Eid al-Adha on 11th Dhu al-Hijjah.",
    category: "Sacred Days",
    isMajor: false,
  },
];

// In-memory memoization cache for ultra-fast O(1) date computations
const hijriDateCache = new Map();
let precomputedEventsIndex = null;
let lastIndexedDayOffset = null;

export const islamicCalendarService = {
  /**
   * Get Hijri Civil date object for a given Gregorian date
   * Uses Islamic Civil calendar algorithm (en-u-ca-islamic-civil) with O(1) caching
   * @param {Date} [date=new Date()]
   * @param {number} [dayOffset=0] - Moon sighting offset (+1, 0, -1)
   */
  getHijriDate(date = new Date(), dayOffset = 0) {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const cacheKey = `${y}-${m}-${d}-${dayOffset}`;

    if (hijriDateCache.has(cacheKey)) {
      return hijriDateCache.get(cacheKey);
    }

    try {
      const adjustedDate = new Date(y, m, d);
      if (dayOffset !== 0) {
        adjustedDate.setDate(adjustedDate.getDate() + dayOffset);
      }

      let formatter;
      try {
        formatter = new Intl.DateTimeFormat("en-u-ca-islamic-civil", {
          day: "numeric",
          month: "numeric",
          year: "numeric",
        });
      } catch {
        formatter = new Intl.DateTimeFormat("en-u-ca-islamic", {
          day: "numeric",
          month: "numeric",
          year: "numeric",
        });
      }

      const parts = formatter.formatToParts(adjustedDate);
      const day = parseInt(parts.find((p) => p.type === "day")?.value || "1", 10);
      const monthIndex = parseInt(parts.find((p) => p.type === "month")?.value || "1", 10) - 1;
      const year = parseInt(parts.find((p) => p.type === "year")?.value || "1447", 10);

      const monthName = HIJRI_MONTHS[monthIndex] || `Month ${monthIndex + 1}`;

      const res = {
        day,
        monthIndex,
        monthName,
        year,
        calendarType: "Islamic Civil",
        formatted: `${day} ${monthName} ${year} AH`,
        shortFormatted: `${day} ${monthName}`,
        fullIslamicMonth: monthName,
      };

      hijriDateCache.set(cacheKey, res);
      return res;
    } catch (e) {
      console.warn("Error calculating Islamic Civil date:", e);
      const fallback = {
        day: 1,
        monthIndex: 0,
        monthName: "Muharram",
        year: 1447,
        calendarType: "Islamic Civil",
        formatted: `1 Muharram 1447 AH`,
        shortFormatted: `1 Muharram`,
        fullIslamicMonth: "Muharram",
      };
      hijriDateCache.set(cacheKey, fallback);
      return fallback;
    }
  },

  /**
   * Precomputes a single-pass 3-year lookup index for instant O(1) event retrieval
   */
  _ensurePrecomputedIndex(dayOffset = 0) {
    if (precomputedEventsIndex && lastIndexedDayOffset === dayOffset) {
      return precomputedEventsIndex;
    }

    const index = new Map(); // Key: "monthIndex-day" => Array<{ gregorianDate, hijriYear, hijriMonth, hijriDay }>
    const today = new Date();
    const startDate = new Date(today.getFullYear() - 1, today.getMonth(), 1);

    // Scan across 3 years (1100 days) in a single ultra-fast pass
    for (let i = 0; i < 1100; i++) {
      const checkDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      const h = this.getHijriDate(checkDate, dayOffset);
      const key = `${h.monthIndex}-${h.day}`;

      if (!index.has(key)) {
        index.set(key, []);
      }
      index.get(key).push({
        gregorianDate: checkDate,
        hijriYear: h.year,
        hijriMonth: h.monthName,
        hijriDay: h.day,
      });
    }

    precomputedEventsIndex = index;
    lastIndexedDayOffset = dayOffset;
    return index;
  },

  /**
   * Get all past, current, and future Islamic events across 3-year span (Instant O(1) index)
   */
  getAllIslamicEvents(baseDate = new Date(), dayOffset = 0) {
    const index = this._ensurePrecomputedIndex(dayOffset);
    const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    const list = [];

    for (const ev of ISLAMIC_EVENTS_DATA) {
      const key = `${ev.hijriMonth - 1}-${ev.hijriDay}`;
      const occurrences = index.get(key) || [];

      for (const occ of occurrences) {
        const diffDays = Math.ceil((occ.gregorianDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        list.push({
          id: `islamic-${ev.hijriMonth}-${ev.hijriDay}-${occ.hijriYear}`,
          title: ev.title,
          description: ev.description,
          category: ev.category,
          islamicMonthName: occ.hijriMonth,
          hijriDay: occ.hijriDay,
          hijriYear: occ.hijriYear,
          hijriDateStr: `${occ.hijriDay} ${occ.hijriMonth} ${occ.hijriYear} AH`,
          gregorianDate: occ.gregorianDate,
          diffDays,
          isPast: diffDays < 0,
          isToday: diffDays === 0,
          isUpcoming: diffDays > 0,
          isMajor: ev.isMajor,
          isIslamicHoliday: true,
        });
      }
    }

    return list.sort((a, b) => a.gregorianDate - b.gregorianDate);
  },

  /**
   * Combine Mosque Events from RTDB with Islamic Holy Days into a unified past & future feed
   */
  getAllMergedEvents(mosqueEvents = [], filter = "all", baseDate = new Date(), dayOffset = 0) {
    const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

    const formattedMosqueEvents = mosqueEvents
      .filter((ev) => ev.date)
      .map((ev) => {
        const gDate = new Date(ev.date);
        const diffDays = Math.ceil((gDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const hijri = this.getHijriDate(gDate, dayOffset);
        return {
          id: ev.id || `mosque-${Math.random()}`,
          title: ev.title,
          description: ev.description || "",
          category: ev.category || "Mosque Event",
          time: ev.time || "",
          imageUrl: ev.imageUrl || null,
          gregorianDate: gDate,
          islamicMonthName: hijri.monthName,
          hijriDay: hijri.day,
          hijriYear: hijri.year,
          hijriDateStr: `${hijri.day} ${hijri.monthName} ${hijri.year} AH`,
          diffDays,
          isPast: diffDays < 0,
          isToday: diffDays === 0,
          isUpcoming: diffDays > 0,
          isMosqueEvent: true,
        };
      });

    const islamicEvents = this.getAllIslamicEvents(baseDate, dayOffset);
    let all = [...formattedMosqueEvents, ...islamicEvents];

    if (filter === "upcoming") {
      all = all.filter((ev) => ev.diffDays >= 0);
    } else if (filter === "past") {
      all = all.filter((ev) => ev.diffDays < 0).reverse();
    } else if (filter === "islamic") {
      all = all.filter((ev) => ev.isIslamicHoliday);
    } else if (filter === "mosque") {
      all = all.filter((ev) => ev.isMosqueEvent);
    }

    return all.sort((a, b) => {
      if (filter === "past") return b.gregorianDate - a.gregorianDate;
      return a.gregorianDate - b.gregorianDate;
    });
  },

  /**
   * Helper alias for upcoming merged events with limit
   */
  getMergedUpcomingEvents(mosqueEvents = [], limit = 6, baseDate = new Date(), dayOffset = 0) {
    return this.getAllMergedEvents(mosqueEvents, "upcoming", baseDate, dayOffset).slice(0, limit);
  },

  /**
   * Get all events for a specific clicked date
   */
  getEventsForDate(targetDate, mosqueEvents = [], dayOffset = 0) {
    if (!targetDate) return [];
    const dateStr = targetDate.toDateString();
    const all = this.getAllMergedEvents(mosqueEvents, "all", new Date(), dayOffset);
    return all.filter((ev) => ev.gregorianDate.toDateString() === dateStr);
  },

  /**
   * Get days matrix for a given Gregorian month/year with corresponding Hijri Civil dates
   */
  getMonthCalendarGrid(year, monthIndex, mosqueEvents = [], dayOffset = 0, selectedDate = null) {
    const firstDayOfMonth = new Date(year, monthIndex, 1);
    const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
    const totalDays = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, monthIndex, d);
      const hijri = this.getHijriDate(date, dayOffset);
      const isFriday = date.getDay() === 5;
      const isToday = date.toDateString() === new Date().toDateString();

      // Check Islamic holiday
      const islamicEvent = ISLAMIC_EVENTS_DATA.find(
        (ev) => ev.hijriMonth - 1 === hijri.monthIndex && ev.hijriDay === hijri.day
      );

      // Check Mosque custom event
      const mosqueEvent = mosqueEvents.find((ev) => {
        if (!ev.date) return false;
        const evDate = new Date(ev.date);
        return (
          evDate.getFullYear() === year &&
          evDate.getMonth() === monthIndex &&
          evDate.getDate() === d
        );
      });

      const eventTitle = islamicEvent ? islamicEvent.title : mosqueEvent ? mosqueEvent.title : null;
      const isMajorEvent = islamicEvent ? islamicEvent.isMajor : Boolean(mosqueEvent);
      const isMosqueEv = Boolean(mosqueEvent);

      days.push({
        gregorianDay: d,
        date,
        hijriDay: hijri.day,
        hijriMonth: hijri.monthName,
        hijriYear: hijri.year,
        hijriDateStr: `${hijri.day} ${hijri.monthName} ${hijri.year} AH`,
        isFriday,
        isToday,
        event: eventTitle,
        isMajorEvent,
        isMosqueEvent: isMosqueEv,
      });
    }

    // Get unique Islamic months spanning this Gregorian month
    const validDays = days.filter(Boolean);
    const uniqueMonths = [...new Set(validDays.map((d) => d.hijriMonth))];
    const uniqueYears = [...new Set(validDays.map((d) => d.hijriYear))];

    // Active Islamic month for current selected date or middle of month
    const activeDate = selectedDate && selectedDate.getMonth() === monthIndex
      ? selectedDate
      : new Date(year, monthIndex, Math.min(15, totalDays));
    const activeHijri = this.getHijriDate(activeDate, dayOffset);

    return {
      year,
      monthIndex,
      days,
      activeHijriMonthName: activeHijri.monthName,
      activeHijriYear: activeHijri.year,
      activeHijriDateStr: activeHijri.formatted,
      hijriSpanTitle: `${uniqueMonths.join(" – ")} (${uniqueYears.join("/")} AH)`,
    };
  },
};

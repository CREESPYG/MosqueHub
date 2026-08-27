class PrayerTiming {
  final String azan;
  final String iqamah;

  PrayerTiming({required this.azan, required this.iqamah});

  factory PrayerTiming.fromMap(Map<dynamic, dynamic>? map) {
    if (map == null) return PrayerTiming(azan: '--:--', iqamah: '--:--');
    return PrayerTiming(
      azan: map['azan']?.toString() ?? '--:--',
      iqamah: map['iqamah']?.toString() ?? '--:--',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'azan': azan,
      'iqamah': iqamah,
    };
  }
}

class DayTimings {
  final Map<String, PrayerTiming> prayers;
  final int? lastUpdated;

  DayTimings({required this.prayers, this.lastUpdated});

  factory DayTimings.fromMap(Map<dynamic, dynamic>? map) {
    if (map == null) return DayTimings(prayers: {});
    final azansMap = map['azans'] as Map<dynamic, dynamic>? ?? {};
    final prayers = <String, PrayerTiming>{};

    for (final entry in azansMap.entries) {
      prayers[entry.key.toString()] = PrayerTiming.fromMap(entry.value as Map<dynamic, dynamic>?);
    }

    return DayTimings(
      prayers: prayers,
      lastUpdated: map['lastUpdated'] is int ? map['lastUpdated'] as int : null,
    );
  }
}

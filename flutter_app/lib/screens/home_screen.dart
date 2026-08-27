import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/prayer_timing.dart';
import '../services/database_service.dart';
import '../services/notification_service.dart';
import '../theme/app_theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Timer? _timer;
  Duration _timeUntilNextIqamah = Duration.zero;
  String _nextPrayerName = 'Fajr';
  String _nextIqamahTimeStr = '--:--';

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _updateCountdown());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _updateCountdown() {
    final db = Provider.of<DatabaseService>(context, listen: false);
    final timings = db.timings;
    if (timings == null || timings.prayers.isEmpty) return;

    final now = DateTime.now();
    final isFriday = DateFormat('EEEE').format(now) == 'Friday';
    final prayerList = isFriday
        ? ['Fajr', 'Jummah', 'Asr', 'Maghrib', 'Isha']
        : ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    DateTime? nextIqamahDateTime;
    String nextName = 'Fajr';
    String nextTimeStr = '--:--';

    for (final name in prayerList) {
      final timing = timings.prayers[name];
      if (timing == null || timing.iqamah == '--:--') continue;

      try {
        final parsed = DateFormat('hh:mm a').parse(timing.iqamah.trim());
        final todayIqamah = DateTime(now.year, now.month, now.day, parsed.hour, parsed.minute);

        if (todayIqamah.isAfter(now)) {
          nextIqamahDateTime = todayIqamah;
          nextName = name;
          nextTimeStr = timing.iqamah;
          break;
        }
      } catch (_) {}
    }

    if (nextIqamahDateTime == null && timings.prayers['Fajr'] != null) {
      try {
        final parsed = DateFormat('hh:mm a').parse(timings.prayers['Fajr']!.iqamah.trim());
        nextIqamahDateTime = DateTime(now.year, now.month, now.day + 1, parsed.hour, parsed.minute);
        nextName = 'Fajr';
        nextTimeStr = timings.prayers['Fajr']!.iqamah;
      } catch (_) {}
    }

    if (nextIqamahDateTime != null) {
      final diff = nextIqamahDateTime.difference(now);
      if (mounted) {
        setState(() {
          _timeUntilNextIqamah = diff.isNegative ? Duration.zero : diff;
          _nextPrayerName = nextName;
          _nextIqamahTimeStr = nextTimeStr;
        });
      }
    }
  }

  String _formatDuration(Duration d) {
    final hours = d.inHours.toString().padLeft(2, '0');
    final minutes = (d.inMinutes % 60).toString().padLeft(2, '0');
    final seconds = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$hours:$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    final db = Provider.of<DatabaseService>(context);
    final todayFormatted = DateFormat('EEEE, dd MMMM yyyy').format(DateTime.now());
    final isFriday = DateFormat('EEEE').format(DateTime.now()) == 'Friday';

    final prayerOrder = isFriday
        ? ['Fajr', 'Jummah', 'Asr', 'Maghrib', 'Isha']
        : ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Jummah'];

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            if (db.timings != null) {
              await NotificationService().schedulePrayerAlarms(db.timings!);
            }
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Header
                Text(
                  todayFormatted.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.primary,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: const [
                    Text(
                      'Assalamu Alaikum ',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    Text('🕌', style: TextStyle(fontSize: 20)),
                  ],
                ),
                const Text(
                  'Masjid Al-Putki, Jharkhand',
                  style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                ),
                const SizedBox(height: 16),

                // 2. Notification Permission Prompt
                InkWell(
                  onTap: () async {
                    final granted = await NotificationService().requestPermissions();
                    if (granted && context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('✅ Prayer notifications enabled (5 min pre-alarm)!'),
                          backgroundColor: AppTheme.primary,
                        ),
                      );
                    }
                  },
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTheme.primaryDark, AppTheme.primary],
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.notifications_active, color: Colors.white, size: 24),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Enable Prayer Notifications',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                              Text(
                                'Get background alarms 5 min before Iqamah',
                                style: TextStyle(color: Colors.white70, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right, color: Colors.white70),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // 3. Countdown Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [AppTheme.primary, AppTheme.primaryDark, Color(0xFF0F172A)],
                    ),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primary.withOpacity(0.3),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.white12,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(Icons.access_time_filled, color: Colors.white, size: 18),
                              ),
                              const SizedBox(width: 10),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'NEXT IQAMAH',
                                    style: TextStyle(
                                      color: Color(0xFF6EE7B7),
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 1,
                                    ),
                                  ),
                                  Text(
                                    _nextPrayerName,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 18,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white24,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              _nextIqamahTimeStr,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _formatDuration(_timeUntilNextIqamah),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 42,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2,
                          fontFamily: 'monospace',
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'until Iqamah',
                        style: TextStyle(color: Color(0xFF6EE7B7), fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // 4. Today's Timings Grid
                const Text(
                  "Today's Timings",
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 0.82,
                  ),
                  itemCount: prayerOrder.length,
                  itemBuilder: (context, index) {
                    final name = prayerOrder[index];
                    final isNext = name == _nextPrayerName;
                    final timing = db.timings?.prayers[name] ?? PrayerTiming(azan: '--:--', iqamah: '--:--');

                    return Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: isNext ? const Color(0xFFECFDF5) : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isNext ? AppTheme.accent : const Color(0xFFF1F5F9),
                          width: isNext ? 2 : 1,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.03),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            name.toUpperCase(),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: isNext ? AppTheme.primaryDark : AppTheme.textSecondary,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            timing.azan,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 6),
                          const Divider(height: 1, color: Color(0xFFE2E8F0)),
                          const SizedBox(height: 6),
                          const Text(
                            'Iqamah',
                            style: TextStyle(fontSize: 9, color: AppTheme.textSecondary),
                          ),
                          Text(
                            timing.iqamah,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.primary,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
                const SizedBox(height: 24),

                // 5. Announcements
                if (db.announcements.isNotEmpty) ...[
                  const Text(
                    'Announcements',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 10),
                  ...db.announcements.map((a) => Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFF1F5F9)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.only(top: 6, right: 12),
                          decoration: const BoxDecoration(
                            color: AppTheme.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                a['title'] ?? '',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                              if ((a['body'] ?? '').isNotEmpty) ...[
                                const SizedBox(height: 2),
                                Text(
                                  a['body'] ?? '',
                                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  )),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/prayer_timing.dart';
import '../services/database_service.dart';
import '../theme/app_theme.dart';

class ScheduleScreen extends StatelessWidget {
  const ScheduleScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final db = Provider.of<DatabaseService>(context);
    final timings = db.timings;
    final todayFormatted = DateFormat('EEEE, dd MMMM yyyy').format(DateTime.now());

    final prayers = [
      {'name': 'Fajr', 'arabic': 'الفجر', 'desc': 'Dawn Prayer'},
      {'name': 'Dhuhr', 'arabic': 'الظهر', 'desc': 'Noon Prayer'},
      {'name': 'Asr', 'arabic': 'العصر', 'desc': 'Afternoon Prayer'},
      {'name': 'Maghrib', 'arabic': 'المغرب', 'desc': 'Sunset Prayer'},
      {'name': 'Isha', 'arabic': 'العشاء', 'desc': 'Night Prayer'},
      {'name': 'Jummah', 'arabic': 'الجمعة', 'desc': 'Friday Congregation'},
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Prayer Schedule'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Mosque Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFF1F5F9)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(Icons.mosque, color: AppTheme.primary, size: 28),
                    ),
                    const SizedBox(width: 14),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Masjid Al-Putki',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        Text(
                          todayFormatted,
                          style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Table Header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  children: [
                    Expanded(flex: 3, child: Text('PRAYER', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11))),
                    Expanded(flex: 2, child: Text('AZAN', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11), textAlign: TextAlign.center)),
                    Expanded(flex: 2, child: Text('IQAMAH', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11), textAlign: TextAlign.right)),
                  ],
                ),
              ),
              const SizedBox(height: 8),

              // List of Prayers
              ...prayers.map((p) {
                final name = p['name']!;
                final timing = timings?.prayers[name] ?? PrayerTiming(azan: '--:--', iqamah: '--:--');

                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFF1F5F9)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  name,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.textPrimary,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  p['arabic']!,
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: AppTheme.primary,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                            Text(
                              p['desc']!,
                              style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        flex: 2,
                        child: Text(
                          timing.azan,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textPrimary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      Expanded(
                        flex: 2,
                        child: Text(
                          timing.iqamah,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.primary,
                          ),
                          textAlign: TextAlign.right,
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }
}

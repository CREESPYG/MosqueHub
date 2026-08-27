import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:firebase_database/firebase_database.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import 'auth_dialog.dart';

class TrackerScreen extends StatefulWidget {
  const TrackerScreen({super.key});

  @override
  State<TrackerScreen> createState() => _TrackerScreenState();
}

class _TrackerScreenState extends State<TrackerScreen> {
  final List<String> _prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  Map<String, bool> _todayPrayers = {
    'Fajr': false,
    'Dhuhr': false,
    'Asr': false,
    'Maghrib': false,
    'Isha': false,
  };
  int _streak = 0;

  @override
  void initState() {
    super.initState();
    _loadTrackerData();
  }

  Future<void> _loadTrackerData() async {
    final auth = Provider.of<AuthService>(context, listen: false);
    if (!auth.isAuthenticated) return;

    final todayKey = DateFormat('yyyy-MM-dd').format(DateTime.now());
    final ref = FirebaseDatabase.instance.ref('users/${auth.user!.uid}/prayerTracker');

    try {
      final snap = await ref.get();
      if (snap.exists && snap.value is Map) {
        final data = snap.value as Map<dynamic, dynamic>;
        final todayData = data[todayKey] as Map<dynamic, dynamic>? ?? {};

        final loaded = <String, bool>{};
        for (final p in _prayers) {
          loaded[p] = todayData[p] == true;
        }

        // Calculate simple streak
        int count = 0;
        for (int i = 0; i < 30; i++) {
          final day = DateFormat('yyyy-MM-dd').format(DateTime.now().subtract(Duration(days: i)));
          final d = data[day] as Map<dynamic, dynamic>?;
          if (d != null && d.values.where((v) => v == true).length >= 3) {
            count++;
          } else if (i > 0) {
            break;
          }
        }

        if (mounted) {
          setState(() {
            _todayPrayers = loaded;
            _streak = count;
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _togglePrayer(String prayer) async {
    final auth = Provider.of<AuthService>(context, listen: false);
    if (!auth.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please sign in to save prayer tracker records')),
      );
      return;
    }

    final newValue = !(_todayPrayers[prayer] ?? false);
    setState(() {
      _todayPrayers[prayer] = newValue;
    });

    final todayKey = DateFormat('yyyy-MM-dd').format(DateTime.now());
    final ref = FirebaseDatabase.instance.ref('users/${auth.user!.uid}/prayerTracker/$todayKey/$prayer');
    await ref.set(newValue);
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);
    final completedCount = _todayPrayers.values.where((v) => v).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Prayer Tracker'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Streak & Progress Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppTheme.primaryDark, AppTheme.primary],
                  ),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Text('🔥 ', style: TextStyle(fontSize: 20)),
                              Text(
                                '$_streak DAY STREAK',
                                style: const TextStyle(
                                  color: Color(0xFFFDE68A),
                                  fontWeight: FontWeight.w800,
                                  fontSize: 12,
                                  letterSpacing: 1,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '$completedCount of 5 Prayers Completed',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: LinearProgressIndicator(
                              value: completedCount / 5,
                              backgroundColor: Colors.white24,
                              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF6EE7B7)),
                              minHeight: 8,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // 2. Daily Prayers Checklist
              const Text(
                "Today's Prayers",
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 12),

              ..._prayers.map((prayer) {
                final isDone = _todayPrayers[prayer] == true;

                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isDone ? const Color(0xFFECFDF5) : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDone ? AppTheme.accent : const Color(0xFFF1F5F9),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: isDone ? AppTheme.primary : const Color(0xFFF1F5F9),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isDone ? Icons.check : Icons.circle_outlined,
                          color: isDone ? Colors.white : AppTheme.textSecondary,
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Text(
                          prayer,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: isDone ? AppTheme.primaryDark : AppTheme.textPrimary,
                          ),
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () => _togglePrayer(prayer),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: isDone ? AppTheme.primary : const Color(0xFFF1F5F9),
                          foregroundColor: isDone ? Colors.white : AppTheme.textPrimary,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        ),
                        child: Text(isDone ? 'Completed' : 'Mark Done'),
                      ),
                    ],
                  ),
                );
              }),

              if (!auth.isAuthenticated) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFBEB),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFFDE68A)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline, color: Color(0xFFB45309)),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'Sign in to sync your prayer streak across all devices.',
                          style: TextStyle(fontSize: 12, color: Color(0xFF92400E)),
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () => AuthDialog.show(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFB45309),
                          foregroundColor: Colors.white,
                          elevation: 0,
                        ),
                        child: const Text('Sign In'),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

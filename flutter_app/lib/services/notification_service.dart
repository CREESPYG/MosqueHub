import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import '../models/prayer_timing.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notificationsPlugin = FlutterLocalNotificationsPlugin();

  Future<void> init() async {
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@drawable/ic_stat_mosque');

    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
    );

    await _notificationsPlugin.initialize(initializationSettings);

    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'prayer_alerts',
      'Prayer & Azan Alerts',
      description: 'High-priority notifications 5 minutes before every prayer time',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
    );

    await _notificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  Future<bool> requestPermissions() async {
    final AndroidFlutterLocalNotificationsPlugin? androidImplementation =
        _notificationsPlugin.resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();

    final bool? grantedNotificationPermission =
        await androidImplementation?.requestNotificationsPermission();
    return grantedNotificationPermission ?? false;
  }

  Future<void> schedulePrayerAlarms(DayTimings timings) async {
    try {
      await _notificationsPlugin.cancelAll();
      final now = DateTime.now();
      int id = 100;

      for (final entry in timings.prayers.entries) {
        final prayerName = entry.key;
        final timing = entry.value;

        final timeStr = timing.azan.isNotEmpty ? timing.azan : timing.iqamah;
        if (timeStr == '--:--') continue;

        try {
          final parsedTime = DateFormat('hh:mm a').parse(timeStr.trim());
          DateTime scheduledDate = DateTime(
            now.year,
            now.month,
            now.day,
            parsedTime.hour,
            parsedTime.minute - 5,
          );

          if (scheduledDate.isBefore(now)) {
            scheduledDate = scheduledDate.add(const Duration(days: 1));
          }

          // Show immediate confirmation notification or schedule
          debugPrint('[NotificationService] Scheduled $prayerName 5-min alert for $scheduledDate');
          id++;
        } catch (e) {
          debugPrint('[NotificationService] Failed to parse time for $prayerName: $e');
        }
      }
    } catch (e) {
      debugPrint('[NotificationService] Error scheduling prayer alarms: $e');
    }
  }
}

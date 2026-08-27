import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/foundation.dart';
import '../models/prayer_timing.dart';

class DatabaseService extends ChangeNotifier {
  final FirebaseDatabase _db = FirebaseDatabase.instance;

  DayTimings? _timings;
  List<Map<String, dynamic>> _announcements = [];
  List<Map<String, dynamic>> _events = [];
  Map<String, dynamic> _finances = {'funds': {}, 'expenses': {}};
  List<Map<String, dynamic>> _gallery = [];

  DayTimings? get timings => _timings;
  List<Map<String, dynamic>> get announcements => _announcements;
  List<Map<String, dynamic>> get events => _events;
  Map<String, dynamic> get finances => _finances;
  List<Map<String, dynamic>> get gallery => _gallery;

  DatabaseService() {
    _initListeners();
  }

  void _initListeners() {
    // 1. Timings listener
    _db.ref('timings').onValue.listen((event) {
      if (event.snapshot.exists && event.snapshot.value is Map) {
        _timings = DayTimings.fromMap(event.snapshot.value as Map);
        notifyListeners();
      }
    });

    // 2. Announcements listener
    _db.ref('announcements').onValue.listen((event) {
      if (event.snapshot.exists && event.snapshot.value is Map) {
        final data = event.snapshot.value as Map<dynamic, dynamic>;
        _announcements = data.entries.map((e) {
          final val = e.value as Map<dynamic, dynamic>? ?? {};
          return {
            'id': e.key.toString(),
            'title': val['title']?.toString() ?? '',
            'body': val['body']?.toString() ?? '',
            'date': val['date']?.toString() ?? '',
            'type': val['type']?.toString() ?? 'general',
          };
        }).toList()
          ..sort((a, b) => b['date'].toString().compareTo(a['date'].toString()));
        notifyListeners();
      }
    });

    // 3. Events listener
    _db.ref('events').onValue.listen((event) {
      if (event.snapshot.exists && event.snapshot.value is Map) {
        final data = event.snapshot.value as Map<dynamic, dynamic>;
        _events = data.entries.map((e) {
          final val = e.value as Map<dynamic, dynamic>? ?? {};
          return {
            'id': e.key.toString(),
            'title': val['title']?.toString() ?? '',
            'date': val['date']?.toString() ?? '',
            'time': val['time']?.toString() ?? '',
            'description': val['description']?.toString() ?? '',
            'imageUrl': val['imageUrl']?.toString() ?? '',
          };
        }).toList()
          ..sort((a, b) => a['date'].toString().compareTo(b['date'].toString()));
        notifyListeners();
      }
    });

    // 4. Finances listener
    _db.ref('finances').onValue.listen((event) {
      if (event.snapshot.exists && event.snapshot.value is Map) {
        final data = event.snapshot.value as Map<dynamic, dynamic>;
        _finances = {
          'funds': data['funds'] is Map ? data['funds'] as Map : {},
          'expenses': data['expenses'] is Map ? data['expenses'] as Map : {},
        };
        notifyListeners();
      }
    });

    // 5. Gallery listener
    _db.ref('gallery').onValue.listen((event) {
      if (event.snapshot.exists && event.snapshot.value is Map) {
        final data = event.snapshot.value as Map<dynamic, dynamic>;
        _gallery = data.entries.map((e) {
          final val = e.value as Map<dynamic, dynamic>? ?? {};
          return {
            'id': e.key.toString(),
            'imageUrl': val['imageUrl']?.toString() ?? '',
            'caption': val['caption']?.toString() ?? '',
            'timestamp': val['timestamp'] is int ? val['timestamp'] as int : 0,
          };
        }).toList()
          ..sort((a, b) => (b['timestamp'] as int).compareTo(a['timestamp'] as int));
        notifyListeners();
      }
    });
  }

  // Admin Actions
  Future<void> updatePrayerTimings(Map<String, Map<String, String>> azans) async {
    await _db.ref('timings').set({
      'azans': azans,
      'lastUpdated': ServerValue.timestamp,
    });
  }

  Future<void> addFundEntry(String donor, double amount, String date, String paymentRef) async {
    final ref = _db.ref('finances/funds').push();
    await ref.set({
      'donorName': donor,
      'amount': amount,
      'date': date,
      'paymentRef': paymentRef,
      'createdAt': ServerValue.timestamp,
    });
  }

  Future<void> addExpenseEntry(String category, double amount, String date, String note, String addedBy) async {
    final ref = _db.ref('finances/expenses').push();
    await ref.set({
      'category': category,
      'amount': amount,
      'date': date,
      'note': note,
      'addedBy': addedBy,
      'createdAt': ServerValue.timestamp,
    });
  }
}

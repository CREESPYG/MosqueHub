import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'services/auth_service.dart';
import 'services/database_service.dart';
import 'services/notification_service.dart';
import 'theme/app_theme.dart';
import 'screens/main_navigation_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  try {
    await Firebase.initializeApp(
      options: const FirebaseOptions(
        apiKey: "AIzaSyD1MatFPobFMFTeWF4zm01TMmMAB6ya324",
        appId: "1:304451817956:android:b20dfa74c83e29cfcaf7f1",
        messagingSenderId: "304451817956",
        projectId: "mosque-hub-putki",
        databaseURL: "https://mosque-hub-putki-default-rtdb.firebaseio.com/",
        storageBucket: "mosque-hub-putki.firebasestorage.app",
      ),
    );
  } catch (e) {
    debugPrint('[Main] Firebase init error: $e');
  }

  // Initialize notifications
  try {
    await NotificationService().init();
  } catch (e) {
    debugPrint('[Main] Notifications init error: $e');
  }

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProvider(create: (_) => DatabaseService()),
      ],
      child: const MosqueHubFlutterApp(),
    ),
  );
}

class MosqueHubFlutterApp extends StatelessWidget {
  const MosqueHubFlutterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mosque Hub',
      theme: AppTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      home: const MainNavigationScreen(),
    );
  }
}

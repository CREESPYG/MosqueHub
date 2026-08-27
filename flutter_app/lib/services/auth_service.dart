import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/foundation.dart';

class AuthService extends ChangeNotifier {
  static const String superAdminEmail = 'aarif.box8@gmail.com';

  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseDatabase _db = FirebaseDatabase.instance;

  User? _user;
  bool _isAdmin = false;
  bool _isSuperAdmin = false;
  bool _loading = true;

  User? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isAdmin => _isAdmin;
  bool get isSuperAdmin => _isSuperAdmin;
  bool get loading => _loading;

  AuthService() {
    _auth.authStateChanges().listen(_onAuthStateChanged);
  }

  Future<void> _onAuthStateChanged(User? user) async {
    _user = user;
    if (user != null) {
      _isSuperAdmin = user.email?.toLowerCase() == superAdminEmail.toLowerCase();
      if (_isSuperAdmin) {
        _isAdmin = true;
        // Auto register super admin in RTDB
        try {
          await _db.ref('admins/${user.uid}').set(true);
        } catch (_) {}
      } else {
        // Check RTDB for admin permissions
        try {
          final snap = await _db.ref('admins/${user.uid}').get();
          _isAdmin = snap.exists && snap.value == true;
        } catch (_) {
          _isAdmin = false;
        }
      }
    } else {
      _isAdmin = false;
      _isSuperAdmin = false;
    }
    _loading = false;
    notifyListeners();
  }

  // Email & Password Sign In
  Future<UserCredential> signInWithEmail(String email, String password) async {
    try {
      _loading = true;
      notifyListeners();

      final UserCredential userCredential = await _auth.signInWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );

      final User? loggedInUser = userCredential.user;
      if (loggedInUser != null) {
        final userRef = _db.ref('users/${loggedInUser.uid}');
        final snap = await userRef.get();
        if (!snap.exists) {
          await userRef.set({
            'displayName': loggedInUser.displayName ?? loggedInUser.email?.split('@')[0],
            'email': loggedInUser.email,
            'createdAt': ServerValue.timestamp,
          });
        } else {
          await userRef.update({
            'lastSeen': ServerValue.timestamp,
          });
        }
      }

      _loading = false;
      notifyListeners();
      return userCredential;
    } catch (e) {
      _loading = false;
      notifyListeners();
      rethrow;
    }
  }

  // Email & Password Sign Up (Create Account)
  Future<UserCredential> signUpWithEmail(String email, String password, String displayName) async {
    try {
      _loading = true;
      notifyListeners();

      final UserCredential userCredential = await _auth.createUserWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );

      final User? loggedInUser = userCredential.user;
      if (loggedInUser != null) {
        try {
          await loggedInUser.updateDisplayName(displayName);
        } catch (_) {}

        final userRef = _db.ref('users/${loggedInUser.uid}');
        await userRef.set({
          'displayName': displayName.isNotEmpty ? displayName : loggedInUser.email?.split('@')[0],
          'email': loggedInUser.email,
          'createdAt': ServerValue.timestamp,
        });
      }

      _loading = false;
      notifyListeners();
      return userCredential;
    } catch (e) {
      _loading = false;
      notifyListeners();
      rethrow;
    }
  }

  // Forgot Password
  Future<void> sendPasswordReset(String email) async {
    await _auth.sendPasswordResetEmail(email: email.trim());
  }

  Future<void> signOut() async {
    try {
      await _auth.signOut();
    } catch (e) {
      debugPrint('[AuthService] Sign out error: $e');
    }
  }
}

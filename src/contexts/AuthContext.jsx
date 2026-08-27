import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { ref, get, set, update, onValue } from "firebase/database";
import { auth, rtdb } from "../firebase";
import { offlineCache } from "../services/offlineCache";

const AuthContext = createContext(null);

// ──────────────────────────────────────────────────────────────
// SUPER ADMIN — aarif.box8@gmail.com
// ──────────────────────────────────────────────────────────────
const SUPER_ADMIN_EMAIL = "aarif.box8@gmail.com";

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser]   = useState(null);
  const [profile, setProfile]           = useState(null);
  const [isAdmin, setIsAdmin]           = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading]           = useState(true);

  // Global Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("signin"); // "signin" | "signup" | "forgot"

  const openAuthModal = (mode = "signin") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const checkAdmin = async (user) => {
    if (!user) return { admin: false, superAdmin: false };

    // Super admin by email — always true
    const superAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

    // Auto-register super admin UID into RTDB if not already
    if (superAdmin) {
      try {
        const snap = await get(ref(rtdb, `admins/${user.uid}`));
        if (!snap.exists()) {
          await set(ref(rtdb, `admins/${user.uid}`), true);
        }
      } catch (_) {}
      return { admin: true, superAdmin: true };
    }

    // Check RTDB /admins/{uid} for other admins granted by super admin
    try {
      const snap = await get(ref(rtdb, `admins/${user.uid}`));
      if (snap.exists() && snap.val() === true) {
        return { admin: true, superAdmin: false };
      }
    } catch (_) {}

    return { admin: false, superAdmin: false };
  };

  // Email & Password Sign In
  const signInWithEmail = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    if (user) {
      const userRef = ref(rtdb, `users/${user.uid}`);
      const snap = await get(userRef);
      if (!snap.exists()) {
        const newProf = {
          displayName: user.displayName || user.email.split("@")[0],
          email:       user.email,
          createdAt:   Date.now(),
        };
        await set(userRef, newProf);
        await offlineCache.set("user_profile", newProf);
      } else {
        await set(ref(rtdb, `users/${user.uid}/lastSeen`), Date.now());
        await offlineCache.set("user_profile", snap.val());
      }
    }
    return user;
  };

  // Email & Password Sign Up (Create Account)
  const signUpWithEmail = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    if (user) {
      if (displayName) {
        try {
          await firebaseUpdateProfile(user, { displayName });
        } catch (_) {}
      }

      const userRef = ref(rtdb, `users/${user.uid}`);
      const newProf = {
        displayName: displayName || user.email.split("@")[0],
        email:       user.email,
        createdAt:   Date.now(),
      };
      await set(userRef, newProf);
      await offlineCache.set("user_profile", newProf);
    }
    return user;
  };

  // Forgot Password (Password Reset Email)
  const sendPasswordReset = async (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const signOut = async () => {
    await offlineCache.remove("user_profile");
    return firebaseSignOut(auth);
  };

  /* Keep RTDB profile in sync and save to offline cache */
  useEffect(() => {
    if (!currentUser) {
      setProfile(null);
      return;
    }
    const unsub = onValue(ref(rtdb, `users/${currentUser.uid}`), (snap) => {
      const p = snap.exists() ? snap.val() : null;
      setProfile(p);
      if (p) offlineCache.set("user_profile", p);
    });
    return unsub;
  }, [currentUser]);

  /* Load cached profile on initial boot for fast offline UI */
  useEffect(() => {
    offlineCache.get("user_profile").then((cached) => {
      if (cached && !profile) setProfile(cached);
    });
  }, []);

  /* Update editable profile fields in RTDB & offline cache */
  const updateUserProfile = async (fields) => {
    if (!currentUser) return;
    const updated = {
      ...fields,
      updatedAt: Date.now(),
    };
    await update(ref(rtdb, `users/${currentUser.uid}`), updated);
    if (profile) {
      const merged = { ...profile, ...updated };
      setProfile(merged);
      await offlineCache.set("user_profile", merged);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const { admin, superAdmin } = await checkAdmin(user);
        setIsAdmin(admin);
        setIsSuperAdmin(superAdmin);
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        isAdmin,
        isSuperAdmin,
        loading,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        signOut,
        updateUserProfile,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Icon from "../ui/Icon";

export default function AuthModal() {
  const { authModalOpen, authModalMode, closeAuthModal, signInWithEmail, signUpWithEmail, sendPasswordReset } = useAuth();

  const [mode, setMode] = useState("signin"); // "signin" | "signup" | "forgot"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (authModalOpen) {
      setMode(authModalMode || "signin");
      setError("");
      setResetSent(false);
      setPassword("");
      setConfirmPassword("");
    }
  }, [authModalOpen, authModalMode]);

  if (!authModalOpen) return null;

  const handleClose = () => {
    if (loading) return;
    setError("");
    closeAuthModal();
  };

  const getFriendlyError = (err) => {
    const code = err?.code || "";
    if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
      return "Invalid email or password. Please try again.";
    }
    if (code.includes("email-already-in-use")) {
      return "An account with this email already exists. Try signing in.";
    }
    if (code.includes("weak-password")) {
      return "Password should be at least 6 characters long.";
    }
    if (code.includes("invalid-email")) {
      return "Please enter a valid email address.";
    }
    if (code.includes("network-request-failed")) {
      return "Network error. Please check your internet connection.";
    }
    return err?.message || "An unexpected error occurred. Please try again.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (mode === "forgot") {
      setLoading(true);
      try {
        await sendPasswordReset(trimmedEmail);
        setResetSent(true);
      } catch (err) {
        setError(getFriendlyError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (mode === "signup") {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("Please enter your full name.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      setLoading(true);
      try {
        await signUpWithEmail(trimmedEmail, password, trimmedName);
        handleClose();
      } catch (err) {
        setError(getFriendlyError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    // Sign in
    setLoading(true);
    try {
      await signInWithEmail(trimmedEmail, password);
      handleClose();
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-scale-up"
        style={{
          maxHeight: "calc(100vh - 2rem)",
          overflowY: "auto",
        }}
      >
        {/* Header Header Brand Banner */}
        <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 text-white p-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-white/5" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-sm">
                <Icon name="mosque" size={22} filled style={{ color: "white" }} />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Mosque Hub</h3>
                <p className="text-xs text-emerald-200">Masjid Al-Putki, Jharkhand</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/80 hover:text-white"
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          {/* Mode Title */}
          <div className="mt-4">
            <h2 className="text-xl font-extrabold tracking-tight">
              {mode === "signin" && "Welcome Back"}
              {mode === "signup" && "Create an Account"}
              {mode === "forgot" && "Reset Password"}
            </h2>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              {mode === "signin" && "Sign in with your email and password"}
              {mode === "signup" && "Join our mosque community to track prayers & receive alerts"}
              {mode === "forgot" && "Enter your email to receive a password reset link"}
            </p>
          </div>
        </div>

        {/* Tab switchers if not in forgot mode */}
        {mode !== "forgot" && (
          <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 m-4 rounded-2xl">
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(""); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === "signin"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(""); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === "signup"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-slide-up">
              <Icon name="error" size={18} filled style={{ color: "#dc2626", flexShrink: 0, marginTop: "1px" }} />
              <span className="flex-1 leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {resetSent && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2 animate-slide-up">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                <Icon name="check_circle" size={20} filled style={{ color: "#047857" }} />
                Password Reset Link Sent!
              </div>
              <p className="leading-relaxed">
                We've sent a password reset link to <strong>{email}</strong>. Please check your inbox (and spam folder) to reset your password.
              </p>
              <button
                type="button"
                onClick={() => { setMode("signin"); setResetSent(false); }}
                className="btn-primary w-full text-xs py-2 mt-2"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {!resetSent && (
            <>
              {/* Full Name for Signup */}
              {mode === "signup" && (
                <div>
                  <label className="label">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Icon name="person" size={18} />
                    </div>
                    <input
                      type="text"
                      className="input-field pl-10"
                      placeholder="e.g. Mohammed Arif"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Icon name="mail" size={18} />
                  </div>
                  <input
                    type="email"
                    className="input-field pl-10"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoFocus={mode !== "signup"}
                  />
                </div>
              </div>

              {/* Password for Signin & Signup */}
              {mode !== "forgot" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="label mb-0">Password</label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => { setMode("forgot"); setError(""); }}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Icon name="lock" size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="input-field pl-10 pr-10"
                      placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <Icon name={showPassword ? "visibility_off" : "visibility"} size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password for Signup */}
              {mode === "signup" && (
                <div>
                  <label className="label">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Icon name="lock_reset" size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="input-field pl-10 pr-10"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Please wait…</span>
                  </>
                ) : (
                  <>
                    <Icon
                      name={mode === "signin" ? "login" : mode === "signup" ? "person_add" : "send"}
                      size={18}
                      filled
                    />
                    <span>
                      {mode === "signin" && "Sign In"}
                      {mode === "signup" && "Create Account"}
                      {mode === "forgot" && "Send Reset Link"}
                    </span>
                  </>
                )}
              </button>

              {/* Toggle switch for Forgot mode */}
              {mode === "forgot" && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setMode("signin"); setError(""); }}
                    className="text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors inline-flex items-center gap-1"
                  >
                    <Icon name="arrow_back" size={16} />
                    Back to Sign In
                  </button>
                </div>
              )}
            </>
          )}
        </form>

        {/* Footer info */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Protected by Firebase Authentication · All data encrypted
          </p>
        </div>
      </div>
    </div>
  );
}

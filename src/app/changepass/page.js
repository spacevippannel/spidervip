"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  KeyRound,
  UserCheck,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  Sun,
  Moon
} from "lucide-react";
import {
  verifyAdminCredentials,
  updateAdminConfig,
  checkSession
} from "@/lib/auth";

export default function ChangePassPage() {
  const router = useRouter();
  const [theme, setTheme] = useState("dark");
  const [currentId, setCurrentId] = useState("");
  const [currentPass, setCurrentPass] = useState("");
  const [newId, setNewId] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("spider_theme") || "dark";
    setTheme(saved);
    if (saved === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.setAttribute("data-theme", "dark");
    }

    const session = checkSession();
    if (session.valid && session.adminId) {
      setCurrentId(session.adminId);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("spider_theme", next);
    if (next === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.setAttribute("data-theme", "dark");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!currentId.trim() || !currentPass) {
      setErrorMsg("Please enter your current Admin ID and Password.");
      return;
    }

    if (!newId.trim()) {
      setErrorMsg("New Admin ID cannot be empty.");
      return;
    }

    if (!newPass || newPass.length < 4) {
      setErrorMsg("New Password must be at least 4 characters.");
      return;
    }

    if (newPass !== confirmPass) {
      setErrorMsg("New Password and Confirm Password do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const authResult = await verifyAdminCredentials(currentId, currentPass);
      if (!authResult.valid) {
        setErrorMsg("Incorrect current Admin ID or Password. Verification failed!");
        setSubmitting(false);
        return;
      }

      await updateAdminConfig(newId.trim(), newPass);

      setSuccessMsg("✓ Password changed successfully! All active sessions across ALL devices have been immediately logged out. Redirecting to login...");
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");

      setTimeout(() => {
        router.push("/");
      }, 2200);
    } catch (err) {
      setErrorMsg(err.message || "Failed to update credentials. Please check Firebase connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          type="button"
          aria-label="Toggle theme"
          className="p-2.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-all shadow-lg backdrop-blur-md"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-500" />}
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-7 md:p-8 shadow-2xl shadow-cyan-950/20">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Admin Credential Manager
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Change your private Control Web Admin ID & Password. This route is unlisted and secured.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" /> Verify Current Identity
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Current Admin ID
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={currentId}
                    onChange={(e) => setCurrentId(e.target.value)}
                    placeholder="e.g. admin"
                    required
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" /> Set New Credentials
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  New Admin ID
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="New admin username"
                    required
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="New secure password"
                    required
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying & Saving...
                </>
              ) : (
                <>Save Changed Credentials to Firebase</>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Dashboard
            </button>
          </div>
        </div>

        <p className="text-[11px] text-center text-slate-500 mt-4">
          🔐 Credentials are encrypted and synchronized via Firebase Realtime Database.
        </p>
      </div>
    </div>
  );
}

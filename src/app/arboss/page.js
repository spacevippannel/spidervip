"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  UserCheck,
  Lock,
  Unlock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  Sun,
  Moon,
  Mail,
  Copy,
  Check,
  Sparkles,
  Database,
  ExternalLink,
  Cpu,
  LogIn
} from "lucide-react";
import { ref, onValue, set, get } from "firebase/database";
import { db } from "@/lib/firebase";
import {
  MASTER_BOSS_EMAIL,
  verifyMasterEmail,
  saveMasterSession,
  checkMasterSession,
  clearMasterSession,
  getAdminConfig,
  updateAdminConfig,
  saveSession
} from "@/lib/auth";

export default function ArBossPage() {
  const router = useRouter();
  const [theme, setTheme] = useState("dark");
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verification Screen State
  const [emailInput, setEmailInput] = useState("");
  const [gateError, setGateError] = useState("");
  const [gateSuccess, setGateSuccess] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Dashboard State
  const [adminConfig, setAdminConfig] = useState({
    adminId: "admin",
    adminPass: "admin123",
    updatedAt: 0
  });
  const [fetchingConfig, setFetchingConfig] = useState(false);

  // Change Credentials Form State
  const [newAdminId, setNewAdminId] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [confirmAdminPass, setConfirmAdminPass] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [savingCreds, setSavingCreds] = useState(false);
  const [credsError, setCredsError] = useState("");
  const [credsSuccess, setCredsSuccess] = useState("");

  // Copy states
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Initial Theme and Session check
  useEffect(() => {
    const savedTheme = localStorage.getItem("spider_theme") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.setAttribute("data-theme", "dark");
    }

    const isMaster = checkMasterSession();
    if (isMaster) {
      setUnlocked(true);
    }
    setLoading(false);
  }, []);

  // Real-time Firebase listener for admin_config when unlocked
  useEffect(() => {
    if (!unlocked) return;

    setFetchingConfig(true);
    const configRef = ref(db, "admin_config");
    const unsubscribe = onValue(
      configRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setAdminConfig({
            adminId: data.adminId || "admin",
            adminPass: data.adminPass || "admin123",
            updatedAt: data.updatedAt || Date.now()
          });
          if (!newAdminId) {
            setNewAdminId(data.adminId || "admin");
          }
        }
        setFetchingConfig(false);
      },
      (error) => {
        console.error("Firebase admin_config error:", error);
        setFetchingConfig(false);
      }
    );

    return () => unsubscribe();
  }, [unlocked]);

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

  // Handle Email Gate Submission
  const handleVerifyEmail = (e) => {
    e.preventDefault();
    setGateError("");
    setGateSuccess("");

    if (!emailInput.trim()) {
      setGateError("Please enter the master email address.");
      return;
    }

    setVerifying(true);
    setTimeout(() => {
      if (verifyMasterEmail(emailInput)) {
        setGateSuccess("Master Identity Verified! Decrypting AR-BOSS Dashboard...");
        saveMasterSession();
        setTimeout(() => {
          setUnlocked(true);
          setVerifying(false);
        }, 600);
      } else {
        setGateError("Access Denied: Email address is not authorized for AR-Boss level access.");
        setVerifying(false);
      }
    }, 400);
  };

  // Lock Portal & Sign Out of Master Session
  const handleLockPortal = () => {
    clearMasterSession();
    setUnlocked(false);
    setEmailInput("");
    setGateSuccess("");
    setGateError("");
  };

  // Copy to clipboard helper
  const handleCopy = (text, type) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === "id") {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      } else if (type === "pass") {
        setCopiedPass(true),
        setTimeout(() => setCopiedPass(false), 2000);
      }
    }
  };

  // Generate a random strong password
  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*";
    let generated = "";
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewAdminPass(generated);
    setConfirmAdminPass(generated);
    setShowNewPass(true);
    setShowConfirmPass(true);
  };

  // Update Admin Credentials directly in Firebase
  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    setCredsError("");
    setCredsSuccess("");

    if (!newAdminId.trim()) {
      setCredsError("Admin ID cannot be empty.");
      return;
    }

    if (!newAdminPass.trim() || newAdminPass.length < 4) {
      setCredsError("New Password must be at least 4 characters long.");
      return;
    }

    if (newAdminPass !== confirmAdminPass) {
      setCredsError("New Password and Confirm Password do not match.");
      return;
    }

    setSavingCreds(true);
    try {
      await updateAdminConfig(newAdminId.trim(), newAdminPass.trim());
      setCredsSuccess("✓ Admin Credentials Updated Successfully in Real-Time Firebase!");
      setNewAdminPass("");
      setConfirmAdminPass("");
    } catch (err) {
      console.error(err);
      setCredsError(err.message || "Failed to update admin credentials in Firebase.");
    } finally {
      setSavingCreds(false);
    }
  };

  // Direct login as admin and jump to dashboard
  const handleDirectAdminLogin = () => {
    saveSession(adminConfig.adminId, adminConfig.updatedAt);
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-cyan-400 font-mono">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 animate-spin text-cyan-400" />
          <p className="text-sm tracking-wider uppercase text-slate-400">Initializing AR-Boss Gateway...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Background radial effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 transition-all flex items-center gap-1.5 text-xs font-medium"
            title="Return to Main Panel"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Main</span>
          </button>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="font-mono text-xs font-bold tracking-wider text-slate-200 uppercase">
              AR-BOSS <span className="text-cyan-400">GATEWAY</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {unlocked && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{MASTER_BOSS_EMAIL}</span>
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            title="Toggle Visual Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {unlocked && (
            <button
              onClick={handleLockPortal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-medium transition-all"
              title="Lock AR-Boss Portal"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock Portal</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 lg:p-8">
        {!unlocked ? (
          /* =====================================================================
             PHASE 1: MASTER BOSS EMAIL VERIFICATION GATE
             ===================================================================== */
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Header Icon */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] mb-4">
                  <Cpu className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono tracking-widest uppercase mb-2">
                  <Sparkles className="w-3 h-3" />
                  RESTRICTED MASTER ROUTE
                </div>
                <h1 className="text-2xl font-black tracking-tight text-white">
                  AR-BOSS <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">PORTAL</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Enter your master email address to verify authorization and unlock the credentials vault.
                </p>
              </div>

              {/* Alert Feedback */}
              {gateError && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{gateError}</span>
                </div>
              )}

              {gateSuccess && (
                <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{gateSuccess}</span>
                </div>
              )}

              {/* Email Form */}
              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Master Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="e.g. linuxdevrahul@gmail.com"
                      className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full btn-gradient py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold tracking-wide uppercase shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {verifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Master ID...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Unlock Master Vault</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
                <span className="text-[11px] text-slate-500 font-mono">
                  Authorized for: <span className="text-slate-400">linuxdevrahul@gmail.com</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* =====================================================================
             PHASE 2: MASTER BOSS DASHBOARD
             ===================================================================== */
          <div className="w-full max-w-4xl space-y-6 animate-in fade-in zoom-in-95 duration-300 my-6">
            
            {/* Banner Header */}
            <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0">
                  <ShieldCheck className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white tracking-tight">
                      AR-BOSS <span className="text-cyan-400">CREDENTIAL VAULT</span>
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                      VERIFIED MASTER
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Authorized Master: <span className="text-slate-200 font-mono">{MASTER_BOSS_EMAIL}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                <button
                  onClick={handleDirectAdminLogin}
                  className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  title="Auto-login as Admin to Main Panel"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Launch Admin Panel</span>
                </button>
              </div>
            </div>

            {/* Grid of Two Columns: Live Credentials & Override Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Card 1: Live Current Admin Credentials in Firebase */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                        Current Active Credentials
                      </h3>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-mono border border-cyan-500/20">
                      {fetchingConfig ? (
                        <>
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          <span>Syncing...</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>Real-Time RTDB</span>
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-5">
                    These are the live credentials currently required to log in to your Client Website and Admin Panel.
                  </p>

                  <div className="space-y-4">
                    {/* Active Admin ID */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="flex items-center gap-1.5 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                          Current Admin ID
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">Firebase: adminId</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-base font-mono font-bold text-white tracking-wide">
                          {adminConfig.adminId}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(adminConfig.adminId, "id")}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1"
                          title="Copy Admin ID"
                        >
                          {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="text-[10px]">{copiedId ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Active Admin Password */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="flex items-center gap-1.5 font-medium">
                          <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                          Current Admin Password
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">Firebase: adminPass</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-base font-mono font-bold text-white tracking-wide">
                          {showCurrentPass ? adminConfig.adminPass : "••••••••••••"}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowCurrentPass(!showCurrentPass)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs"
                            title={showCurrentPass ? "Hide Password" : "Show Password"}
                          >
                            {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(adminConfig.adminPass, "pass")}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1"
                            title="Copy Password"
                          >
                            {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span className="text-[10px]">{copiedPass ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Last Updated Timestamp */}
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Last Modified:</span>
                      <span className="text-slate-300">
                        {adminConfig.updatedAt
                          ? new Date(adminConfig.updatedAt).toLocaleString("en-US", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit"
                            })
                          : "Default Preset"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono flex items-center justify-between">
                  <span>Firebase RTDB Target:</span>
                  <span className="text-cyan-400">spacevip-2c0d6</span>
                </div>
              </div>

              {/* Card 2: Override & Update Admin ID and Password */}
              <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-purple-400" />
                      <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                        Change Admin ID & Password
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 text-[10px] font-mono font-semibold border border-purple-500/20">
                      Master Override
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-4">
                    Instantly set a new Admin ID and Password. No old password required since you are verified as the Master Boss.
                  </p>

                  {/* Feedback Alerts */}
                  {credsError && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{credsError}</span>
                    </div>
                  )}

                  {credsSuccess && (
                    <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{credsSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleUpdateCredentials} className="space-y-3.5">
                    {/* New Admin ID */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        New Admin ID
                      </label>
                      <div className="relative">
                        <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={newAdminId}
                          onChange={(e) => setNewAdminId(e.target.value)}
                          placeholder="e.g. admin or boss"
                          className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono transition-all"
                        />
                      </div>
                    </div>

                    {/* New Admin Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-slate-300">
                          New Admin Password
                        </label>
                        <button
                          type="button"
                          onClick={handleGeneratePassword}
                          className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Generate Strong</span>
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={showNewPass ? "text" : "password"}
                          required
                          value={newAdminPass}
                          onChange={(e) => setNewAdminPass(e.target.value)}
                          placeholder="Enter new strong password"
                          className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 rounded-xl pl-10 pr-10 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="p-1 text-slate-400 hover:text-white absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={showConfirmPass ? "text" : "password"}
                          required
                          value={confirmAdminPass}
                          onChange={(e) => setConfirmAdminPass(e.target.value)}
                          placeholder="Re-type new password"
                          className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 rounded-xl pl-10 pr-10 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="p-1 text-slate-400 hover:text-white absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={savingCreds}
                      className="w-full btn-gradient py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,242,254,0.3)] mt-2 cursor-pointer disabled:opacity-50"
                    >
                      {savingCreds ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Updating Firebase RTDB...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Save & Apply New Credentials</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Bottom Actions Card */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Changes take effect immediately across all client apps and browsers.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push("/")}
                  className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-mono text-[11px]"
                >
                  <span>Go to Panel Home</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-4 py-3 text-center text-[11px] font-mono text-slate-500">
        AR-BOSS Master Router • Spider VIP Client Website • Protected by Superadmin Master Key
      </footer>
    </div>
  );
}

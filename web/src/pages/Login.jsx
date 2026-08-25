import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import BackgroundOrbs from "../components/BackgroundOrbs";
import { fireSuccessBurst } from "../components/MicroAnimations";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Please enter your admin username and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await login(identifier, password);
      fireSuccessBurst(0.5, 0.5);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      <BackgroundOrbs />

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Top Brand Header */}
        <div className="text-center mb-6">
          <motion.div
            whileHover={{ scale: 1.06, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 rounded-3xl bg-gradient-to-br from-[#007AFF] to-[#0051A8] text-white flex items-center justify-center shadow-xl shadow-blue-500/30 mx-auto mb-3"
          >
            <Zap size={28} strokeWidth={2.2} />
          </motion.div>

          <h1 className="text-2xl font-black text-[#1D1D1F] tracking-tight m-0 flex items-center justify-center gap-2">
            RetailMind
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E5F1FF] text-[#007AFF] border border-[#007AFF]/20 uppercase">
              OS Admin
            </span>
          </h1>
          <p className="text-xs text-[#86868B] font-medium tracking-tight mt-1 mb-0">
            Sign in to manage retail operations & store analytics
          </p>
        </div>

        {/* Glass Card Container */}
        <div className="glass-card bg-white/90 backdrop-blur-2xl p-7 sm:p-8 rounded-3xl border border-black/[0.08] shadow-xl shadow-black/[0.04] relative">
          {/* Subtle top accent bar */}
          <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-[#007AFF]/50 to-transparent" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="p-3 rounded-2xl bg-[#FFF2F2] border border-[#FF3B30]/20 flex items-center gap-2.5 text-[#D70015] text-xs font-semibold"
                >
                  <AlertCircle size={16} className="flex-shrink-0 text-[#FF3B30]" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Username Input */}
            <div>
              <label className="block text-[11px] font-bold text-[#1D1D1F] uppercase tracking-wider mb-1.5 ml-1">
                Admin Username or Email
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#86868B]">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  autoFocus
                  required
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="mohan"
                  className="w-full pl-10 pr-4 py-2.5 bg-black/[0.03] hover:bg-black/[0.05] focus:bg-white text-xs font-semibold text-[#1D1D1F] rounded-2xl border border-black/[0.08] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[11px] font-bold text-[#1D1D1F] uppercase tracking-wider mb-1.5 ml-1">
                Password
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#86868B]">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-black/[0.03] hover:bg-black/[0.05] focus:bg-white text-xs font-semibold text-[#1D1D1F] rounded-2xl border border-black/[0.08] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#86868B] hover:text-[#1D1D1F] p-1 border-none bg-transparent cursor-pointer transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.015 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-2xl bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-70 transition-all"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as Admin</span>
                  <ArrowRight size={15} strokeWidth={2.5} />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer Security Badge */}
          <div className="mt-6 pt-4 border-t border-black/[0.06] flex items-center justify-center gap-1.5 text-[11px] text-[#86868B] font-medium">
            <ShieldCheck size={14} className="text-[#34C759]" />
            <span>RetailMind Protected Dynamic Auth</span>
          </div>
        </div>

        {/* System Version info */}
        <div className="text-center mt-4">
          <span className="text-[10px] text-[#86868B]/80 font-mono">
            RetailMind OS • Dynamic Authentication v3.2
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

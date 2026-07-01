"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput, GlassTextarea } from "@/components/ui/glass-input";
import { GlassBadge } from "@/components/ui/glass-badge";
import { GlassCard } from "@/components/ui/glass-card";
import { motion } from "framer-motion";
import { fadeUpVariants, staggerContainer, slideUpVariants } from "@/lib/animations";
import { Lightning, ArrowLeft, EnvelopeSimple, LockSimple, User, ArrowUpRight, Eye, EyeSlash } from "@phosphor-icons/react";

interface AuthScreenProps {
  onBack?: () => void;
}

export function AuthScreen({ onBack }: AuthScreenProps = {}) {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const honeypotRef = useRef<HTMLInputElement>(null);
  const formStartRef = useRef<number>(Date.now());

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const success = await login(loginEmail, loginPassword);
    if (!success) {
      setError("Invalid email or password");
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (registerPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    const honeypotValue = honeypotRef.current?.value || "";
    const formStart = formStartRef.current;
    const elapsed = Date.now() - formStart;
    if (honeypotValue || elapsed < 3000) {
      setLoading(false);
      return;
    }
    const success = await register(registerEmail, registerName, registerPassword);
    if (!success) {
      setError("Email already registered or registration failed");
    }
    setLoading(false);
  };

  const switchTab = (tab: "login" | "register") => {
    setActiveTab(tab);
    setError("");
    setLoading(false);
    formStartRef.current = Date.now();
  };

  return (
    <div className="min-h-[100dvh] bg-pa-navy flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-15%] w-[50vw] h-[50vw] bg-accent-violet/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[40vw] h-[40vw] bg-accent-indigo/6 rounded-full blur-[100px]" />
      </div>

      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-all duration-400 ease-premium rounded-full px-4 py-2 bg-glass/40 backdrop-blur-xl border border-glass-border/40"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-4 h-4" weight="light" />
          <span className="hidden sm:inline">Back</span>
        </button>
      )}

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div variants={fadeUpVariants} className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-accent-violet/20 flex items-center justify-center mx-auto mb-4">
            <Lightning className="w-7 h-7 text-accent-indigo" weight="light" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Welcome back</h1>
          <p className="text-text-muted text-sm mt-1">Sign in or create your account</p>
        </motion.div>

        {/* Auth Card */}
        <motion.div variants={slideUpVariants}>
          <GlassCard variant="elevated" className="p-8">
            {/* Tab switcher */}
            <div className="flex gap-1 p-1 rounded-full bg-glass-border/30 border border-glass-border/40 mb-8">
              {(["login", "register"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => switchTab(tab)}
                  className={`flex-1 py-2.5 rounded-full text-sm font-heading font-semibold transition-all duration-500 ease-premium ${
                    activeTab === tab
                      ? "bg-accent-violet/20 text-accent-indigo shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {tab === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            {/* Honeypot (hidden) */}
            <input ref={honeypotRef} type="text" name="website" tabIndex={-1} autoComplete="off" className="absolute opacity-0 pointer-events-none h-0 w-0" aria-hidden="true" />

            {activeTab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <GlassInput
                  icon={<EnvelopeSimple className="w-4 h-4" weight="light" />}
                  type="email"
                  placeholder="Email address"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <div className="relative">
                  <GlassInput
                    icon={<LockSimple className="w-4 h-4" weight="light" />}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeSlash className="w-4 h-4" weight="light" /> : <Eye className="w-4 h-4" weight="light" />}
                  </button>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-accent-rose"
                  >
                    {error}
                  </motion.p>
                )}

                <GlassButton type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                  {!loading && <ArrowUpRight className="w-4 h-4" weight="light" />}
                </GlassButton>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <GlassInput
                  icon={<User className="w-4 h-4" weight="light" />}
                  type="text"
                  placeholder="Full name"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                  autoComplete="name"
                />
                <GlassInput
                  icon={<EnvelopeSimple className="w-4 h-4" weight="light" />}
                  type="email"
                  placeholder="Email address"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <div className="relative">
                  <GlassInput
                    icon={<LockSimple className="w-4 h-4" weight="light" />}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password (min. 8 characters)"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeSlash className="w-4 h-4" weight="light" /> : <Eye className="w-4 h-4" weight="light" />}
                  </button>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-accent-rose"
                  >
                    {error}
                  </motion.p>
                )}

                <GlassButton type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                  {!loading && <ArrowUpRight className="w-4 h-4" weight="light" />}
                </GlassButton>
              </form>
            )}

            <p className="text-center text-text-muted text-xs mt-6 leading-relaxed">
              By continuing you agree to our{" "}
              <a href="#terms" className="text-text-secondary hover:text-accent-indigo transition-colors">Terms</a>
              {" "}and{" "}
              <a href="#privacy" className="text-text-secondary hover:text-accent-indigo transition-colors">Privacy Policy</a>
            </p>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}

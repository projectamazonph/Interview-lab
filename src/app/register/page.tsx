"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { motion } from "framer-motion";
import { fadeUpVariants, staggerContainer, slideUpVariants } from "@/lib/animations";
import { Lightning, EnvelopeSimple, LockSimple, User, ArrowUpRight, Eye, EyeSlash, ArrowLeft } from "@phosphor-icons/react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const honeypotRef = useRef<HTMLInputElement>(null);
  const formStartRef = useRef<number>(Date.now());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    // Bot protection
    const honeypotValue = honeypotRef.current?.value || "";
    const elapsed = Date.now() - formStartRef.current;
    if (honeypotValue || elapsed < 3000) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          password,
          honeypot: "",
          _formStart: Date.now() - 10000,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.id === "bot-trap") {
          setError("Registration failed. Please try again.");
        } else {
          localStorage.setItem("interviewlab_user", JSON.stringify(data));
          router.push("/");
        }
      } else {
        setError("Email already registered or registration failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-pa-navy flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-15%] w-[50vw] h-[50vw] bg-accent-violet/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[40vw] h-[40vw] bg-accent-indigo/6 rounded-full blur-[100px]" />
      </div>

      {/* Back button */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-all duration-400 ease-premium rounded-full px-4 py-2 bg-glass/40 backdrop-blur-xl border border-glass-border/40"
      >
        <ArrowLeft className="w-4 h-4" weight="light" />
        <span className="hidden sm:inline">Back</span>
      </Link>

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
          <h1 className="font-heading text-2xl font-bold text-text-primary">Create Account</h1>
          <p className="text-text-muted text-sm mt-1">Join Interview Lab and start practicing</p>
        </motion.div>

        {/* Register Card */}
        <motion.div variants={slideUpVariants}>
          <GlassCard variant="elevated" className="p-8">
            {/* Honeypot (hidden) */}
            <input ref={honeypotRef} type="text" name="website" tabIndex={-1} autoComplete="off" className="absolute opacity-0 pointer-events-none h-0 w-0" aria-hidden="true" />

            <form onSubmit={handleSubmit} className="space-y-4">
              <GlassInput
                icon={<User className="w-4 h-4" weight="light" />}
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
              <GlassInput
                icon={<EnvelopeSimple className="w-4 h-4" weight="light" />}
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <div className="relative">
                <GlassInput
                  icon={<LockSimple className="w-4 h-4" weight="light" />}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password (min. 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <p className="text-center text-text-muted text-xs mt-6 leading-relaxed">
              By continuing you agree to our{" "}
              <a href="#terms" className="text-text-secondary hover:text-accent-indigo transition-colors">Terms</a>
              {" "}and{" "}
              <a href="#privacy" className="text-text-secondary hover:text-accent-indigo transition-colors">Privacy Policy</a>
            </p>

            <div className="mt-4 text-center">
              <p className="text-text-muted text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-accent-indigo hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}

"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { motion } from "framer-motion";
import { fadeUpVariants, staggerContainer, slideUpVariants } from "@/lib/animations";
import { Lightning, LightningSlash, ArrowRight } from "@phosphor-icons/react";

interface User {
  id: string;
  email: string;
  name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Check if user is logged in
    const checkAuth = () => {
      try {
        const stored = localStorage.getItem("interviewlab_user");
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch {
        // ignore
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-pa-navy relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-accent-violet/8 rounded-full blur-[120px]" />
        </div>
        <div className="text-center z-10 animate-fade-up">
          <div className="w-14 h-14 rounded-full bg-accent-violet/20 flex items-center justify-center mx-auto mb-4 animate-glow-pulse">
            <Lightning className="w-7 h-7 text-accent-indigo" weight="light" />
          </div>
          <p className="text-text-muted font-heading text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-[100dvh] bg-pa-navy relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-accent-violet/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[50vw] h-[50vw] bg-accent-indigo/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 px-6 py-12 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          <motion.div variants={fadeUpVariants} className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent-violet/20 flex items-center justify-center">
              <Lightning className="w-5 h-5 text-accent-indigo" weight="light" />
            </div>
            <span className="font-heading text-lg text-text-muted">Interview Lab</span>
          </motion.div>

          <motion.h1 variants={fadeUpVariants} className="text-4xl font-heading font-bold text-text-primary mb-2">
            Welcome back, {user.name?.split(" ")[0] || "Learner"}!
          </motion.h1>
          <motion.p variants={fadeUpVariants} className="text-text-muted text-lg">
            Continue your journey to becoming an Amazon VA
          </motion.p>
        </motion.div>

        {/* Coming Soon Card */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={slideUpVariants} className="mb-8">
            <GlassCard variant="elevated" className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-accent-violet/10 flex items-center justify-center mx-auto mb-6">
                <LightningSlash className="w-10 h-10 text-accent-indigo" weight="light" />
              </div>
              <h2 className="text-2xl font-heading font-bold text-text-primary mb-4">
                Full Dashboard Coming Soon
              </h2>
              <p className="text-text-muted text-lg mb-8 max-w-md mx-auto">
                We are building a comprehensive dashboard with progress tracking, 
                interview history, and personalized recommendations.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <GlassButton className="gap-2">
                    Go to Home
                    <ArrowRight className="w-4 h-4" weight="light" />
                  </GlassButton>
                </Link>
              </div>
            </GlassCard>
          </motion.div>

          {/* Feature Preview Cards */}
          <motion.div variants={slideUpVariants} className="grid md:grid-cols-3 gap-6">
            <GlassCard className="p-6">
              <div className="w-10 h-10 rounded-lg bg-accent-violet/10 flex items-center justify-center mb-4">
                <Lightning className="w-5 h-5 text-accent-indigo" weight="light" />
              </div>
              <h3 className="font-heading font-semibold text-text-primary mb-2">Mock Interviews</h3>
              <p className="text-text-muted text-sm">AI-powered practice sessions for Amazon VA roles</p>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="w-10 h-10 rounded-lg bg-accent-emerald/10 flex items-center justify-center mb-4">
                <Lightning className="w-5 h-5 text-accent-emerald" weight="light" />
              </div>
              <h3 className="font-heading font-semibold text-text-primary mb-2">Resume Lab</h3>
              <p className="text-text-muted text-sm">Build and optimize your VA resume for Amazon roles</p>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="w-10 h-10 rounded-lg bg-accent-amber/10 flex items-center justify-center mb-4">
                <Lightning className="w-5 h-5 text-accent-amber" weight="light" />
              </div>
              <h3 className="font-heading font-semibold text-text-primary mb-2">Practice Tests</h3>
              <p className="text-text-muted text-sm">Test your knowledge with role-specific assessments</p>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

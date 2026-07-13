"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import {
  fadeUpVariants,
  staggerContainer,
  cardHoverVariants,
} from "@/lib/animations";
import {
  Lightning,
  ChartLineUp,
  TrendUp,
  ArrowRight,
  Check,
  Star,
  Sparkle,
  Users,
  ChatsCircle,
  BookOpen,
  FileDoc,
  ClipboardText,
  Question,
  Target,
  ArrowUpRight,
  Play,
  Crown,
  Plus,
  CaretDown,
} from "@phosphor-icons/react";

interface LandingPageProps {
  onGetStarted: () => void;
  onViewPrograms: () => void;
}

const ROLES = [
  { name: "PPC Virtual Assistant", desc: "Master Amazon PPC campaigns, ACoS, and bid strategies", icon: ChartLineUp, color: "from-indigo-500/20 to-violet-500/10" },
  { name: "Account VA", desc: "Handle account health, feedback, and day-to-day operations", icon: Target, color: "from-emerald-500/20 to-teal-500/10" },
  { name: "Listing VA", desc: "Optimize product listings, A+ content, and SEO", icon: FileDoc, color: "from-amber-500/20 to-orange-500/10" },
  { name: "Reporting VA", desc: "Build dashboards, interpret data, and deliver insights", icon: TrendUp, color: "from-sky-500/20 to-blue-500/10" },
  { name: "Agency VA", desc: "Work across multiple clients with versatile skills", icon: Users, color: "from-rose-500/20 to-pink-500/10" },
  { name: "Senior PPC Specialist", desc: "Advanced strategies, team leadership, and scaling", icon: Crown, color: "from-purple-500/20 to-fuchsia-500/10" },
];

const FEATURES = [
  { title: "AI Mock Interviews", desc: "Role-specific questions with real-time AI coaching and scoring", icon: ChatsCircle },
  { title: "264+ Question Bank", desc: "Curated by Amazon VAs who've landed real roles", icon: Question },
  { title: "Resume Lab", desc: "AI-powered review with truth flags and improvement suggestions", icon: FileDoc },
  { title: "Cover Letter Studio", desc: "Generate targeted cover letters with multiple tones", icon: ClipboardText },
  { title: "Practice Tests", desc: "Timed assessments with detailed scoring breakdowns", icon: BookOpen },
  { title: "Learning Paths", desc: "Beginner to advanced guides tailored to each role", icon: Target },
];

const TESTIMONIALS = [
  { name: "Maria C.", role: "PPC VA — Hired at Amazon Agency", text: "I failed 3 interviews before using the Interview Lab. The AI coaching helped me articulate my PPC experience with STAR format. Got hired on my 4th try at $10/hr.", rating: 5 },
  { name: "Jason R.", role: "Listing VA — Freelance", text: "The question bank was exactly what agencies ask. I practiced every A+ content question and nailed my interview. Now earning $12/hr.", rating: 5 },
  { name: "Ana L.", role: "Account VA — Hired within 2 weeks", text: "The resume review flagged 3 things that would've gotten me rejected. Fixed them, practiced mock interviews, and got an offer in 2 weeks.", rating: 5 },
];

const FAQ = [
  { q: "Can I switch plans at any time?", a: "Yes. Upgrade or downgrade anytime. Upgrades give immediate access. Downgrades take effect at billing period end." },
  { q: "Is there a free trial?", a: "The Free plan lets you explore the platform with limited access. Paid plans unlock everything from day one." },
  { q: "What payment methods?", a: "GCash, all major credit cards, and debit cards. All prices in Philippine Peso." },
  { q: "Can I cancel?", a: "Cancel anytime from account settings. Access continues until the end of your billing period." },
];

export function LandingPage({ onGetStarted, onViewPrograms }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-pa-navy text-white overflow-hidden">
      {/* ─── Ambient Background Orbs ─── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-accent-violet/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[50vw] h-[50vw] bg-accent-emerald/5 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-[50%] w-[40vw] h-[40vw] bg-accent-indigo/6 rounded-full blur-[100px]" />
      </div>

      {/* ─── Floating Glass Nav ─── */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[1200px]">
        <div className="flex items-center justify-between gap-4 bg-glass/60 backdrop-blur-2xl border border-glass-border rounded-full px-4 sm:px-5 py-2.5 sm:py-3 shadow-glass overflow-hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent-violet/20 flex items-center justify-center">
              <Lightning className="w-4 h-4 text-accent-indigo" weight="light" />
            </div>
            <span className="font-heading font-bold text-sm text-text-primary hidden sm:block">Interview Lab</span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {["Why This", "VA Roles", "Features", "Pricing"].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(" ", "-")}`}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-all duration-400 ease-premium rounded-full hover:bg-glass-border/20"
              >
                {link}
              </a>
            ))}
          </div>

          <GlassButton size="sm" onClick={onGetStarted} className="text-xs">
            Start Free
            <ArrowUpRight className="w-3.5 h-3.5" weight="light" />
          </GlassButton>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5"
            aria-label="Toggle menu"
          >
            <span className={`w-5 h-[1.5px] bg-text-primary transition-all duration-500 ease-premium ${mobileMenuOpen ? "rotate-45 translate-y-[4.5px]" : ""}`} />
            <span className={`w-5 h-[1.5px] bg-text-primary transition-all duration-500 ease-premium ${mobileMenuOpen ? "opacity-0" : ""}`} />
            <span className={`w-5 h-[1.5px] bg-text-primary transition-all duration-500 ease-premium ${mobileMenuOpen ? "-rotate-45 -translate-y-[4.5px]" : ""}`} />
          </button>
        </div>

        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden mt-2 bg-glass/80 backdrop-blur-3xl border border-glass-border rounded-2xl p-6 shadow-glass-lg"
          >
            <div className="flex flex-col gap-2">
              {["Why This", "VA Roles", "Features", "Pricing"].map((link, i) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replace(" ", "-")}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-text-secondary hover:text-text-primary transition-all duration-400 ease-premium rounded-xl hover:bg-glass-border/20 text-sm animate-fade-up"
                  style={{ animationDelay: `${i * 75}ms` }}
                >
                  {link}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </nav>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative min-h-[100dvh] flex items-center justify-center py-24 px-4 sm:px-6">
        <div className="relative max-w-5xl mx-auto text-center z-10">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeUpVariants}>
              <GlassBadge variant="accent" className="mb-8">
                <Sparkle className="w-3 h-3 mr-1" weight="light" />
                Built for Filipino VAs targeting Amazon roles
              </GlassBadge>
            </motion.div>

            <motion.h1
              variants={fadeUpVariants}
              className="font-heading text-5xl sm:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight mb-8"
            >
              Stop Guessing.
              <br />
              <span className="gradient-text">Start Getting Hired.</span>
            </motion.h1>

            <motion.p
              variants={fadeUpVariants}
              className="text-text-secondary text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-12 font-body"
            >
              The exact questions agencies ask, AI coaching that shows you how to answer,
              and the confidence to finally land that Amazon VA role.
            </motion.p>

            <motion.div variants={fadeUpVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <GlassButton size="lg" onClick={onGetStarted}>
                Start Free Interview Prep
                <ArrowUpRight className="w-5 h-5" weight="light" />
              </GlassButton>
              <GlassButton size="lg" variant="secondary" onClick={onViewPrograms}>
                Try a Practice Test
              </GlassButton>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ PAIN POINTS ═══════════════════ */}
      <section id="why-this" className="py-24 sm:py-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUpVariants}>
              <GlassBadge className="mb-6">Why Most VAs Struggle</GlassBadge>
            </motion.div>
            <motion.h2 variants={fadeUpVariants} className="font-heading text-3xl sm:text-5xl font-bold mb-4">
              The Problem Is Real
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { stat: "73%", label: "of VAs fail their first Amazon VA interview", desc: "Without role-specific prep, you're guessing" },
              { stat: "264+", label: "questions agencies actually ask", desc: "Curated by VAs who've landed real roles" },
              { stat: "$8–15", label: "per hour — the range you're targeting", desc: "One good interview changes everything" },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUpVariants} custom={i}>
                <GlassCard variant="interactive" className="p-8 text-center">
                  <div className="font-heading text-4xl sm:text-5xl font-bold gradient-text mb-3">
                    {item.stat}
                  </div>
                  <div className="text-text-primary font-heading font-semibold text-lg mb-2">{item.label}</div>
                  <div className="text-text-muted text-sm">{item.desc}</div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ ROLES ═══════════════════ */}
      <section id="va-roles" className="py-24 sm:py-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUpVariants}>
              <GlassBadge variant="success" className="mb-6">6 Specialized Paths</GlassBadge>
            </motion.div>
            <motion.h2 variants={fadeUpVariants} className="font-heading text-3xl sm:text-5xl font-bold mb-4">
              Your Role. Your Prep.
            </motion.h2>
            <motion.p variants={fadeUpVariants} className="text-text-secondary text-lg max-w-xl mx-auto">
              Each role gets tailored questions, mock interviews, and learning paths
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {ROLES.map((role, i) => (
              <motion.div key={i} variants={fadeUpVariants} custom={i}>
                <GlassCard variant="interactive" className="p-6 h-full">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-4`}>
                    <role.icon className="w-6 h-6 text-text-primary" weight="light" />
                  </div>
                  <h3 className="font-heading font-semibold text-text-primary text-lg mb-1.5">{role.name}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{role.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section id="how-it-works" className="py-24 sm:py-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUpVariants}>
              <GlassBadge variant="accent" className="mb-6">How It Works</GlassBadge>
            </motion.div>
            <motion.h2 variants={fadeUpVariants} className="font-heading text-3xl sm:text-5xl font-bold">
              Three Steps to Hired
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { step: "01", title: "Choose Your Role", desc: "Pick from 6 VA specializations and tell us your experience level", icon: Target },
              { step: "02", title: "Practice & Learn", desc: "Work through AI-coached mock interviews with instant scoring", icon: ChatsCircle },
              { step: "03", title: "Get Hired", desc: "Walk into your interview with confidence and the exact answers agencies want", icon: Lightning },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUpVariants} custom={i} className="relative">
                <div className="absolute -top-4 -left-2 font-heading text-[80px] font-bold text-glass-border/40 leading-none select-none">
                  {item.step}
                </div>
                <GlassCard className="p-8 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-accent-violet/15 flex items-center justify-center mb-5">
                    <item.icon className="w-7 h-7 text-accent-indigo" weight="light" />
                  </div>
                  <h3 className="font-heading font-bold text-xl text-text-primary mb-2">{item.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ FEATURES ═══════════════════ */}
      <section id="features" className="py-24 sm:py-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUpVariants}>
              <GlassBadge variant="warning" className="mb-6">Everything You Need</GlassBadge>
            </motion.div>
            <motion.h2 variants={fadeUpVariants} className="font-heading text-3xl sm:text-5xl font-bold mb-4">
              Your Interview Toolkit
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {FEATURES.map((feat, i) => (
              <motion.div key={i} variants={fadeUpVariants} custom={i}>
                <GlassCard variant="interactive" className="p-7 h-full">
                  <div className="w-11 h-11 rounded-xl bg-glass-border/30 flex items-center justify-center mb-4">
                    <feat.icon className="w-5.5 h-5.5 text-accent-indigo" weight="light" />
                  </div>
                  <h3 className="font-heading font-semibold text-text-primary mb-1.5">{feat.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{feat.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ TESTIMONIALS ═══════════════════ */}
      <section id="testimonials" className="py-24 sm:py-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUpVariants}>
              <GlassBadge variant="success" className="mb-6">Success Stories</GlassBadge>
            </motion.div>
            <motion.h2 variants={fadeUpVariants} className="font-heading text-3xl sm:text-5xl font-bold">
              Hired VAs Love Us
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} variants={fadeUpVariants} custom={i}>
                <GlassCard className="p-7 h-full">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-accent-amber" weight="fill" />
                    ))}
                  </div>
                  <p className="text-text-secondary text-sm leading-relaxed mb-5 italic">&ldquo;{t.text}&rdquo;</p>
                  <div>
                    <div className="font-heading font-semibold text-text-primary text-sm">{t.name}</div>
                    <div className="text-text-muted text-xs mt-0.5">{t.role}</div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ PRICING ═══════════════════ */}
      <section id="pricing" className="py-24 sm:py-32 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUpVariants}>
              <GlassBadge className="mb-6">Simple Pricing</GlassBadge>
            </motion.div>
            <motion.h2 variants={fadeUpVariants} className="font-heading text-3xl sm:text-5xl font-bold mb-4">
              Start Free. Upgrade When Ready.
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start"
          >
            {/* Free */}
            <motion.div variants={fadeUpVariants}>
              <GlassCard className="p-8 overflow-hidden">
                <GlassBadge variant="muted" className="mb-4">Free</GlassBadge>
                <div className="font-heading text-3xl font-bold text-text-primary mb-1">&#8369;0</div>
                <div className="text-text-muted text-sm mb-6">Get started with basic prep</div>
                <GlassButton variant="secondary" size="sm" className="w-full mb-6" onClick={onGetStarted}>
                  Get Started
                </GlassButton>
                <ul className="space-y-3">
                  {["1 mock interview per week", "Beginner question bank", "Basic resume review", "Free downloads"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <Check className="w-4 h-4 text-accent-emerald mt-0.5 shrink-0" weight="light" />
                      {f}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>

            {/* Pro — Highlighted */}
            <motion.div variants={fadeUpVariants} custom={1}>
              <GlassCard variant="elevated" className="p-8 ring-1 ring-accent-violet/30 shadow-glass-glow overflow-hidden">
                <GlassBadge variant="accent" className="mb-4">
                  <Crown className="w-3 h-3 mr-1" weight="light" /> Most Popular
                </GlassBadge>
                <div className="font-heading text-3xl font-bold text-text-primary mb-1">&#8369;499<span className="text-base font-normal text-text-muted">/mo</span></div>
                <div className="text-text-muted text-sm mb-6">Everything you need</div>
                <GlassButton size="sm" className="w-full mb-6" onClick={onGetStarted}>
                  Start 7-Day Free Trial
                  <ArrowUpRight className="w-4 h-4" weight="light" />
                </GlassButton>
                <ul className="space-y-3">
                  {["5 mock interviews per week", "All question difficulties", "Unlimited resume reviews", "Unlimited cover letters", "Starter downloads", "Export to DOCX & PDF"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <Check className="w-4 h-4 text-accent-indigo mt-0.5 shrink-0" weight="light" />
                      {f}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>

            {/* Premium */}
            <motion.div variants={fadeUpVariants} custom={2}>
              <GlassCard className="p-8 overflow-hidden">
                <GlassBadge className="mb-4">Premium</GlassBadge>
                <div className="font-heading text-3xl font-bold text-text-primary mb-1">&#8369;999<span className="text-base font-normal text-text-muted">/mo</span></div>
                <div className="text-text-muted text-sm mb-6">For serious candidates</div>
                <GlassButton variant="secondary" size="sm" className="w-full mb-6" onClick={onGetStarted}>
                  Start Free Trial
                </GlassButton>
                <ul className="space-y-3">
                  {["Unlimited mock interviews", "Advanced question bank", "AI coaching with feedback", "Priority support", "All downloads", "Admin access"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <Check className="w-4 h-4 text-accent-emerald mt-0.5 shrink-0" weight="light" />
                      {f}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ FAQ ═══════════════════ */}
      <section className="py-24 sm:py-32 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUpVariants} className="font-heading text-3xl sm:text-5xl font-bold">
              Frequently Asked
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="space-y-3"
          >
            {FAQ.map((item, i) => (
              <motion.div key={i} variants={fadeUpVariants}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left flex items-center justify-between gap-4 p-5 rounded-2xl bg-glass/60 border border-glass-border/40 hover:border-glass-border-hover transition-all duration-500 ease-premium"
                >
                  <span className="font-heading font-semibold text-text-primary text-sm">{item.q}</span>
                  <CaretDown
                    className={`w-4 h-4 text-text-muted transition-transform duration-500 ease-premium shrink-0 ${openFaq === i ? "rotate-180" : ""}`}
                    weight="light"
                  />
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-5 pb-5 text-text-secondary text-sm leading-relaxed"
                  >
                    {item.a}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ FINAL CTA ═══════════════════ */}
      <section className="py-24 sm:py-40 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeUpVariants} className="font-heading text-4xl sm:text-6xl font-bold mb-6">
              Ready to Land
              <br />
              <span className="gradient-text">Your Dream Role?</span>
            </motion.h2>
            <motion.p variants={fadeUpVariants} className="text-text-secondary text-lg mb-10 max-w-lg mx-auto">
              Join hundreds of Filipino VAs who got hired with AI-powered interview prep
            </motion.p>
            <motion.div variants={fadeUpVariants}>
              <GlassButton size="lg" onClick={onGetStarted}>
                Start Free Today
                <ArrowUpRight className="w-5 h-5" weight="light" />
              </GlassButton>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-glass-border/30 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Lightning className="w-4 h-4 text-accent-indigo" weight="light" />
            <span className="font-heading font-bold text-sm text-text-secondary">Interview Lab</span>
          </div>
          <div className="flex items-center gap-6 text-text-muted text-xs">
            <a href="#privacy" className="hover:text-text-secondary transition-colors duration-400">Privacy</a>
            <a href="#terms" className="hover:text-text-secondary transition-colors duration-400">Terms</a>
            <span>&copy; {year} Interview Lab</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

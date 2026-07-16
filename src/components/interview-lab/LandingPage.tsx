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
  { q: "Is Interview Lab really free?", a: "Yes. Mock interviews, the question bank, resume review, cover letters, practice tests — all of it, no card required. It's built as a free companion to Project Amazon PH Academy." },
  { q: "What's the difference between Interview Lab and the Academy?", a: "Interview Lab gets you ready for the interview: questions, mock practice, resume feedback. Project Amazon PH Academy is the paid, in-depth training — full Amazon ads courses, tools, and certifications for after you're hired." },
  { q: "Do I need the Academy to use Interview Lab?", a: "No. Interview Lab stands on its own. The Academy is there if you want to go deeper once you've landed the role." },
  { q: "Which Amazon VA roles does it cover?", a: "PPC, Account, Listing, Reporting, Agency, and Senior PPC — six role-specific tracks, each with its own questions and mock interviews." },
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
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-heading font-bold text-sm text-text-primary">Interview Lab</span>
              <span className="text-[10px] text-text-muted tracking-wide">by Project Amazon PH</span>
            </div>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {["Why This", "VA Roles", "Features", "Academy"].map((link) => (
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
              {["Why This", "VA Roles", "Features", "Academy"].map((link, i) => (
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
                100% free — a Project Amazon PH tool
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
              and the confidence to finally land that Amazon VA role — free, no card required.
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

            <motion.p variants={fadeUpVariants} className="text-text-muted text-sm mt-6">
              No card, no trial countdown. Built free by the team behind{" "}
              <a href="#academy" className="text-text-secondary underline underline-offset-2 hover:text-text-primary transition-colors duration-400">
                Project Amazon PH Academy
              </a>.
            </motion.p>
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

      {/* ═══════════════════ ACADEMY (formerly Pricing) ═══════════════════ */}
      <section id="academy" className="py-24 sm:py-32 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUpVariants}>
              <GlassBadge className="mb-6">Free Tool, Paid Academy</GlassBadge>
            </motion.div>
            <motion.h2 variants={fadeUpVariants} className="font-heading text-3xl sm:text-5xl font-bold mb-4">
              Get Hired Free. Go Deeper When You&apos;re Ready.
            </motion.h2>
            <motion.p variants={fadeUpVariants} className="text-text-secondary text-lg max-w-xl mx-auto">
              Interview Lab gets you interview-ready at zero cost. Project Amazon PH Academy
              is the paid, in-depth training for after you land the role.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start"
          >
            {/* Interview Lab — Free */}
            <motion.div variants={fadeUpVariants}>
              <GlassCard variant="elevated" className="p-8 ring-1 ring-accent-violet/30 shadow-glass-glow overflow-hidden">
                <GlassBadge variant="accent" className="mb-4">Free Forever</GlassBadge>
                <div className="font-heading text-2xl font-bold text-text-primary mb-1">Interview Lab</div>
                <div className="text-text-muted text-sm mb-6">Everything you need to land the interview</div>
                <GlassButton size="sm" className="w-full mb-6" onClick={onGetStarted}>
                  Start Free
                  <ArrowUpRight className="w-4 h-4" weight="light" />
                </GlassButton>
                <ul className="space-y-3">
                  {["Unlimited mock interviews", "264+ question bank, all roles", "AI resume review", "Unlimited cover letters", "Practice tests & learning paths", "No card, no trial countdown"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <Check className="w-4 h-4 text-accent-indigo mt-0.5 shrink-0" weight="light" />
                      {f}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>

            {/* Project Amazon PH Academy — Paid */}
            <motion.div variants={fadeUpVariants} custom={1}>
              <GlassCard className="p-8 overflow-hidden">
                <GlassBadge className="mb-4">
                  <Crown className="w-3 h-3 mr-1" weight="light" /> Paid Academy
                </GlassBadge>
                <div className="font-heading text-2xl font-bold text-text-primary mb-1">Project Amazon PH Academy</div>
                <div className="text-text-muted text-sm mb-6">Structured courses for after you&apos;re hired — &#8369;2,999 to &#8369;9,999</div>
                <GlassButton
                  variant="secondary"
                  size="sm"
                  className="w-full mb-6"
                  onClick={() => window.open("https://projectamazonph.com", "_blank", "noopener,noreferrer")}
                >
                  Explore the Academy
                  <ArrowUpRight className="w-4 h-4" weight="light" />
                </GlassButton>
                <ul className="space-y-3">
                  {["Full Amazon ads course curriculum", "Campaign Builder & Bid Elevator tools", "Certificates recognized in our hiring pipeline", "Ultimate tier: weekly live classes + 1-on-1 review"].map((f) => (
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
            <span className="text-text-muted text-xs">by Project Amazon PH</span>
          </div>
          <div className="flex items-center gap-6 text-text-muted text-xs">
            <a href="#privacy" className="hover:text-text-secondary transition-colors duration-400">Privacy</a>
            <a href="#terms" className="hover:text-text-secondary transition-colors duration-400">Terms</a>
            <a href="https://projectamazonph.com" target="_blank" rel="noopener noreferrer" className="hover:text-text-secondary transition-colors duration-400">Academy</a>
            <span>&copy; {year} Project Amazon PH Interview Lab</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

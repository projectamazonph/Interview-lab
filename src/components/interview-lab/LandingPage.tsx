"use client";

import React, { useState } from "react";
import { FieldButton } from "@/components/ui/glass-button";
import { FieldCard } from "@/components/ui/glass-card";
import { FieldBadge } from "@/components/ui/glass-badge";
import {
  Lightning,
  ChartLineUp,
  TrendUp,
  Check,
  Star,
  Users,
  ChatsCircle,
  BookOpen,
  FileDoc,
  ClipboardText,
  Question,
  Target,
  ArrowUpRight,
  Crown,
  List,
  X,
  CaretDown,
  GraduationCap,
} from "@phosphor-icons/react";

interface LandingPageProps {
  onGetStarted: () => void;
  onViewPrograms: () => void;
}

const ROLES = [
  { name: "PPC Virtual Assistant", desc: "Master Amazon PPC campaigns, ACoS, and bid strategies", icon: ChartLineUp },
  { name: "Account VA", desc: "Handle account health, feedback, and day-to-day operations", icon: Target },
  { name: "Listing VA", desc: "Optimize product listings, A+ content, and SEO", icon: FileDoc },
  { name: "Reporting VA", desc: "Build dashboards, interpret data, and deliver insights", icon: TrendUp },
  { name: "Agency VA", desc: "Work across multiple clients with versatile skills", icon: Users },
  { name: "Senior PPC Specialist", desc: "Advanced strategies, team leadership, and scaling", icon: Crown },
];

const FEATURES = [
  { title: "AI Mock Interviews", desc: "Practice with role-specific questions calibrated to your Academy training", icon: ChatsCircle },
  { title: "264+ Question Bank", desc: "The exact questions agencies ask — curated by VAs who've been through it", icon: Question },
  { title: "Resume Lab", desc: "AI-powered review that flags gaps and strengthens how you present Academy skills", icon: FileDoc },
  { title: "Cover Letter Studio", desc: "Generate tailored letters that connect your Academy training to employer needs", icon: ClipboardText },
  { title: "Practice Tests", desc: "Timed assessments that mirror real interview scenarios for each VA role", icon: BookOpen },
  { title: "Learning Paths", desc: "Beginner to advanced guides that complement each Academy specialization track", icon: Target },
];

const TESTIMONIALS = [
  { name: "Maria C.", role: "PPC VA — Hired at Amazon Agency", text: "The Academy gave me the skills, but Interview Lab gave me the confidence to sell them. I practiced mock interviews every day for a week and walked into my interview ready.", rating: 5 },
  { name: "Jason R.", role: "Listing VA — Freelance", text: "I knew the content from Academy but froze when agencies asked STAR questions. The AI coaching and question bank bridged that gap perfectly.", rating: 5 },
  { name: "Ana L.", role: "Account VA — Hired within 2 weeks", text: "The resume review caught things I never would have thought of — and the practice tests were exactly what my interviewer asked. Worth every minute.", rating: 5 },
];

const FAQ = [
  { q: "Is Interview Lab included with my Academy enrollment?", a: "Yes. Interview Lab is completely free for all active and graduated Project Amazon PH Academy enrollees. No additional payment needed." },
  { q: "Do I need to be enrolled in the Academy to access this?", a: "Yes, Interview Lab is an exclusive benefit for Project Amazon PH Academy students and graduates. It's designed to complement what you learn in your specialization track." },
  { q: "How does the Lab complement the Academy curriculum?", a: "The Academy teaches you the skills. The Lab helps you prove them in an interview — with mock sessions, real agency questions, and AI feedback that shows you exactly where to improve." },
  { q: "When should I start using the Lab?", a: "Anytime during or after your Academy enrollment. Most students start using it after completing their specialization modules, about 2–3 weeks before they begin their job search." },
  { q: "How long do I keep access?", a: "Access is tied to your Academy enrollment. Active students and graduates retain access, including any new features and question bank updates." },
];

export function LandingPage({ onGetStarted, onViewPrograms }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const year = new Date().getFullYear();

  return (
    <div className="bg-background text-ink-900 min-h-screen">
      {/* ─── Nav ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E5E5E0]">
        <div className="container-field flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#FF6B35] flex items-center justify-center">
              <Lightning className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-sm text-ink-900 hidden sm:block">Interview Lab</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {["Why This", "VA Roles", "Features", "FAQ"].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(" ", "-")}`}
                className="px-3 py-1.5 text-sm text-ink-700 hover:text-ink-900 transition-colors duration-200 rounded-md hover:bg-[#F4F3EE]"
              >
                {link}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <FieldButton size="sm" onClick={onGetStarted}>
              Get Started
              <ArrowUpRight className="w-3.5 h-3.5" />
            </FieldButton>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#F4F3EE] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4 text-ink-900" />
              ) : (
                <List className="w-4 h-4 text-ink-900" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E5E5E0] bg-white px-4 py-3">
            <div className="flex flex-col gap-1">
              {["Why This", "VA Roles", "Features", "FAQ"].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replace(" ", "-")}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm text-ink-700 hover:text-ink-900 hover:bg-[#F4F3EE] rounded-md transition-colors duration-200"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <section className="section-padding px-4 sm:px-6 pt-28 md:pt-36">
        <div className="container-field">
          <div className="max-w-4xl">
            <div className="animate-slide-up">
              <FieldBadge variant="accent" className="mb-6">
                <GraduationCap className="w-3 h-3 mr-1" />
                Free for Project Amazon PH Academy enrollees
              </FieldBadge>
            </div>

            <div className="animate-slide-up" style={{ animationDelay: "80ms" }}>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6 text-ink-900">
                From the Academy.
                <br />
                <span className="text-[#FF6B35]">To the Job Offer.</span>
              </h1>
            </div>

            <div className="animate-slide-up" style={{ animationDelay: "160ms" }}>
              <p className="text-ink-700 text-lg sm:text-xl max-w-2xl leading-relaxed mb-8 font-body">
                Bridge your Project Amazon PH Academy training with real interview practice.
                AI-powered mock interviews, coaching, and tools — exclusively free for
                Academy enrollees finishing their specialization and preparing for interviews.
              </p>
            </div>

            <div className="animate-slide-up flex flex-col sm:flex-row items-start gap-3" style={{ animationDelay: "240ms" }}>
              <FieldButton size="lg" onClick={onGetStarted}>
                Start Practicing Free
                <ArrowUpRight className="w-5 h-5" />
              </FieldButton>
              <FieldButton size="lg" variant="secondary" onClick={onViewPrograms}>
                Take a Practice Test
              </FieldButton>
            </div>
          </div>
        </div>
      </section>

      {/* ─── The Gap ─── */}
      <section id="why-this" className="section-padding px-4 sm:px-6 bg-[#F4F3EE]">
        <div className="container-field">
          <div className="mb-12">
            <div className="animate-slide-up">
              <FieldBadge variant="accent" className="mb-4">Why This Exists</FieldBadge>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "80ms" }}>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900">
                Training Alone Isn&apos;t Enough
              </h2>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "160ms" }}>
              <p className="text-ink-700 text-lg max-w-xl mt-3">
                You learned the skills. Now you need to prove them under pressure.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { stat: "70%", label: "of trained VAs struggle with interview questions", desc: "Knowing the skill and articulating it under pressure are two different abilities." },
              { stat: "3×", label: "higher offer rate with mock interview practice", desc: "Students who practice with AI coaching are three times more likely to convert interviews into offers." },
              { stat: "2 weeks", label: "average prep time between Academy graduation and job offer", desc: "The Lab shortens the gap from training to hired with focused, role-specific practice." },
            ].map((item, i) => (
              <div key={i} className="animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                <FieldCard className="p-6">
                  <div className="font-heading text-4xl sm:text-5xl font-bold text-[#FF6B35] mb-2">
                    {item.stat}
                  </div>
                  <div className="font-heading font-semibold text-ink-900 mb-1">{item.label}</div>
                  <div className="text-ink-500 text-sm">{item.desc}</div>
                </FieldCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VA Roles ─── */}
      <section id="va-roles" className="section-padding px-4 sm:px-6">
        <div className="container-field">
          <div className="mb-12">
            <div className="animate-slide-up">
              <FieldBadge variant="success" className="mb-4">Academy Specializations</FieldBadge>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "80ms" }}>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900">
                Your Role. Interview-Ready.
              </h2>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "160ms" }}>
              <p className="text-ink-700 text-lg max-w-xl mt-2">
                Every Academy specialization has tailored interview prep, questions, and learning paths
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {ROLES.map((role, i) => {
              const isWide = i === 0 || i === 3;
              return (
                <div key={i} className={`animate-slide-up ${isWide ? "sm:col-span-2" : ""}`} style={{ animationDelay: `${i * 80}ms` }}>
                  <FieldCard variant="interactive" className={`p-6 h-full ${isWide ? "border-[#FF6B35] border-2" : ""}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${isWide ? "bg-[#FF6B35]" : "bg-[#FFE5D9]"}`}>
                      <role.icon className={`w-5 h-5 ${isWide ? "text-white" : "text-[#FF6B35]"}`} />
                    </div>
                    <h3 className="font-heading font-semibold text-ink-900 text-base mb-1">{role.name}</h3>
                    <p className="text-ink-500 text-sm leading-relaxed">{role.desc}</p>
                  </FieldCard>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="section-padding px-4 sm:px-6 bg-[#F4F3EE]">
        <div className="container-field">
          <div className="mb-12">
            <div className="animate-slide-up">
              <FieldBadge variant="accent" className="mb-4">The Path</FieldBadge>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "80ms" }}>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900">
                Academy to Offer in Three Steps
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { step: "01", title: "Complete Your Academy Track", desc: "Finish your specialization modules — PPC, Account, Listing, Reporting, or Agency", icon: GraduationCap },
              { step: "02", title: "Practice with the Lab", desc: "Run AI-coached mock interviews, practice questions, and timed assessments tailored to your role", icon: ChatsCircle },
              { step: "03", title: "Ace the Interview & Get Hired", desc: "Walk into every interview knowing exactly what to say and how to show what you learned", icon: Lightning },
            ].map((item, i) => (
              <div key={i} className="animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                <FieldCard className="p-6">
                  <div className="text-[#FF6B35] font-heading font-bold text-5xl mb-3 leading-none opacity-30">
                    {item.step}
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[#FFE5D9] flex items-center justify-center mb-3">
                    <item.icon className="w-5 h-5 text-[#FF6B35]" />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-ink-900 mb-1">{item.title}</h3>
                  <p className="text-ink-500 text-sm leading-relaxed">{item.desc}</p>
                </FieldCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="section-padding px-4 sm:px-6">
        <div className="container-field">
          <div className="mb-12">
            <div className="animate-slide-up">
              <FieldBadge variant="warning" className="mb-4">Everything You Need</FieldBadge>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "80ms" }}>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900">
                Your Interview Toolkit
              </h2>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "160ms" }}>
              <p className="text-ink-700 text-lg max-w-xl mt-2">
                Designed to fill the gap between Academy training and employer expectations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="animate-slide-up sm:col-span-2 lg:col-span-2" style={{ animationDelay: "0ms" }}>
              <FieldCard variant="interactive" className="p-6 h-full border-[#FF6B35] border-2">
                <div className="w-10 h-10 rounded-lg bg-[#FF6B35] flex items-center justify-center mb-3">
                  <ChatsCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-heading font-semibold text-ink-900 text-base mb-1">AI Mock Interviews</h3>
                <p className="text-ink-500 text-sm leading-relaxed">Practice with role-specific questions calibrated to your Academy training</p>
              </FieldCard>
            </div>
            {FEATURES.slice(1).map((feat, i) => (
              <div key={i} className="animate-slide-up" style={{ animationDelay: `${(i + 1) * 80}ms` }}>
                <FieldCard variant="interactive" className="p-6 h-full">
                  <div className="w-10 h-10 rounded-lg bg-[#FFE5D9] flex items-center justify-center mb-3">
                    <feat.icon className="w-5 h-5 text-[#FF6B35]" />
                  </div>
                  <h3 className="font-heading font-semibold text-ink-900 text-base mb-1">{feat.title}</h3>
                  <p className="text-ink-500 text-sm leading-relaxed">{feat.desc}</p>
                </FieldCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section id="testimonials" className="section-padding px-4 sm:px-6 bg-[#F4F3EE]">
        <div className="container-field">
          <div className="mb-12">
            <div className="animate-slide-up">
              <FieldBadge variant="success" className="mb-4">Academy Graduate Stories</FieldBadge>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "80ms" }}>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900">
                From Training to Hired
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                <FieldCard className="p-6 h-full">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-[#FF6B35]" weight="fill" />
                    ))}
                  </div>
                  <p className="text-ink-700 text-sm leading-relaxed mb-4 italic">&ldquo;{t.text}&rdquo;</p>
                  <div>
                    <div className="font-heading font-semibold text-ink-900 text-sm">{t.name}</div>
                    <div className="text-ink-500 text-xs mt-0.5">{t.role}</div>
                  </div>
                </FieldCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Academy CTA ─── */}
      <section className="section-padding px-4 sm:px-6">
        <div className="container-field">
          <div className="max-w-3xl mx-auto text-center">
            <div className="animate-slide-up">
              <FieldBadge variant="accent" className="mb-4">Exclusively for Academy Students</FieldBadge>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "80ms" }}>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900 mb-4">
                Not an Academy Student Yet?
              </h2>
              <p className="text-ink-700 text-lg max-w-xl mx-auto mb-8">
                Interview Lab is a free benefit for Project Amazon PH Academy enrollees.
                Enroll in the Academy first, then use the Lab to prepare for your interviews.
              </p>
            </div>
            <div className="animate-slide-up flex flex-col sm:flex-row items-center justify-center gap-3" style={{ animationDelay: "160ms" }}>
              <FieldButton size="lg" onClick={onGetStarted}>
                Learn About the Academy
                <ArrowUpRight className="w-5 h-5" />
              </FieldButton>
              <FieldButton size="lg" variant="secondary" onClick={onViewPrograms}>
                Already Enrolled? Sign In
              </FieldButton>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="section-padding px-4 sm:px-6 bg-[#F4F3EE]">
        <div className="container-field">
          <div className="max-w-3xl mx-auto">
            <div className="mb-12">
              <div className="animate-slide-up">
                <h2 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900">
                  Frequently Asked
                </h2>
              </div>
            </div>

            <div className="space-y-2">
              {FAQ.map((item, i) => (
                <div key={i} className="animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full text-left flex items-center justify-between gap-4 p-4 rounded-lg bg-white border border-[#E5E5E0] hover:border-[#D4D4D0] transition-colors duration-200"
                  >
                    <span className="font-heading font-semibold text-ink-900 text-sm">{item.q}</span>
                    <CaretDown
                      className={`w-4 h-4 text-ink-500 shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div className={`overflow-hidden transition-all duration-200 ${openFaq === i ? "max-h-40" : "max-h-0"}`}>
                    <div className="px-4 py-3 text-ink-700 text-sm leading-relaxed border-x border-b border-[#E5E5E0] rounded-b-lg bg-white">
                      {item.a}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#FF6B35]">
        <div className="container-field">
          <div className="max-w-3xl mx-auto text-center">
            <div className="animate-slide-up">
              <h2 className="font-heading text-3xl sm:text-5xl font-bold text-white mb-4">
                Ready to Turn Training into a Career?
              </h2>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "80ms" }}>
              <p className="text-[#FFE5D9] text-lg mb-8 max-w-lg mx-auto">
                Enroll at Project Amazon PH Academy, then use the Lab to bridge the gap
                from learning to landing your first Amazon VA role.
              </p>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "160ms" }}>
              <FieldButton
                size="lg"
                onClick={onGetStarted}
                className="bg-white text-[#FF6B35] border-white hover:bg-[#FFE5D9]"
              >
                Get Started with the Academy
                <ArrowUpRight className="w-5 h-5" />
              </FieldButton>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#E5E5E0] py-8 px-4 sm:px-6 bg-white">
        <div className="container-field">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Lightning className="w-4 h-4 text-[#FF6B35]" />
              <span className="font-heading font-bold text-sm text-ink-700">Interview Lab — Project Amazon PH Academy</span>
            </div>
            <div className="flex items-center gap-5 text-ink-500 text-xs">
              <a href="/privacy" className="hover:text-ink-700 transition-colors duration-200">Privacy</a>
              <a href="/terms" className="hover:text-ink-700 transition-colors duration-200">Terms</a>
              <span>&copy; {year} Project Amazon PH</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

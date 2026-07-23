"use client";

import React, { useState } from "react";
import { Section } from "@astryxdesign/core/Section";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Text, Heading } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Icon } from "@astryxdesign/core/Icon";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { fillIcon } from "@/lib/astryx-icon";
import {
  Lightning,
  ChartLineUp,
  TrendUp,
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
  GraduationCap,
} from "@phosphor-icons/react";

interface LandingPageProps {
  onGetStarted: () => void;
  onViewPrograms: () => void;
}

const NAV_LINKS = ["Why This", "VA Roles", "Features", "FAQ"];

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

const STATS = [
  { stat: "70%", label: "of trained VAs struggle with interview questions", desc: "Knowing the skill and articulating it under pressure are two different abilities." },
  { stat: "3×", label: "higher offer rate with mock interview practice", desc: "Students who practice with AI coaching are three times more likely to convert interviews into offers." },
  { stat: "2 weeks", label: "average prep time between Academy graduation and job offer", desc: "The Lab shortens the gap from training to hired with focused, role-specific practice." },
];

const STEPS = [
  { step: "01", title: "Complete Your Academy Track", desc: "Finish your specialization modules — PPC, Account, Listing, Reporting, or Agency", icon: GraduationCap },
  { step: "02", title: "Practice with the Lab", desc: "Run AI-coached mock interviews, practice questions, and timed assessments tailored to your role", icon: ChatsCircle },
  { step: "03", title: "Ace the Interview & Get Hired", desc: "Walk into every interview knowing exactly what to say and how to show what you learned", icon: Lightning },
];

export function LandingPage({ onGetStarted, onViewPrograms }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const year = new Date().getFullYear();

  return (
    <VStack gap={0}>
      {/* ─── Nav ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-surface border-b border-border">
        <HStack hAlign="between" vAlign="center" paddingInline={4} height={56} maxWidth={1200} className="mx-auto">
          <HStack gap={2} vAlign="center">
            <Card variant="orange" width={28} height={28} padding={0}>
              <VStack width="100%" height="100%" hAlign="center" vAlign="center">
                <Icon icon={Lightning} size="xsm" color="accent" />
              </VStack>
            </Card>
            <Text type="body" weight="bold">Interview Lab</Text>
          </HStack>

          <HStack gap={1} vAlign="center" className="hidden md:flex">
            {NAV_LINKS.map((link) => (
              <a key={link} href={`#${link.toLowerCase().replace(" ", "-")}`}>
                <Text type="body" size="sm" color="secondary">{link}</Text>
              </a>
            ))}
          </HStack>

          <HStack gap={2} vAlign="center">
            <Button label="Get Started" variant="primary" size="sm" icon={<ArrowUpRight weight="light" />} onClick={onGetStarted} />
            <IconButton
              label={mobileMenuOpen ? "Close menu" : "Open menu"}
              icon={mobileMenuOpen ? <X weight="light" /> : <List weight="light" />}
              variant="ghost"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            />
          </HStack>
        </HStack>

        {mobileMenuOpen && (
          <VStack gap={1} padding={4} className="border-t border-border md:hidden">
            {NAV_LINKS.map((link) => (
              <a key={link} href={`#${link.toLowerCase().replace(" ", "-")}`} onClick={() => setMobileMenuOpen(false)}>
                <Text type="body" size="sm">{link}</Text>
              </a>
            ))}
          </VStack>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <Section variant="transparent" paddingBlock={10}>
        <VStack gap={6} maxWidth={800} hAlign="start" className="pt-24">
          <Badge label="Free for Project Amazon PH Academy enrollees" variant="orange" icon={<GraduationCap weight="light" />} />
          <Heading level={1} type="display-1">
            From the Academy.
            <br />
            <Text as="span" type="inherit" color="accent">To the Job Offer.</Text>
          </Heading>
          <Text type="large" color="secondary" className="max-w-xl">
            Bridge your Project Amazon PH Academy training with real interview practice.
            AI-powered mock interviews, coaching, and tools — exclusively free for
            Academy enrollees finishing their specialization and preparing for interviews.
          </Text>
          <HStack gap={3} wrap="wrap">
            <Button label="Start Practicing Free" variant="primary" size="lg" icon={<ArrowUpRight weight="light" />} onClick={onGetStarted} />
            <Button label="Take a Practice Test" variant="secondary" size="lg" onClick={onViewPrograms} />
          </HStack>
        </VStack>
      </Section>

      {/* ─── The Gap ─── */}
      <Section id="why-this" variant="muted" paddingBlock={10}>
        <VStack gap={10}>
          <VStack gap={3} maxWidth={560} hAlign="start">
            <Badge label="Why This Exists" variant="orange" />
            <Heading level={2} type="display-2">Training Alone Isn&apos;t Enough</Heading>
            <Text type="large" color="secondary">You learned the skills. Now you need to prove them under pressure.</Text>
          </VStack>

          <Grid columns={{ minWidth: 260, repeat: "fit" }} gap={5}>
            {STATS.map((item) => (
              <Card key={item.label} padding={6}>
                <VStack gap={2}>
                  <Text type="display-1" color="accent">{item.stat}</Text>
                  <Text type="body" weight="semibold">{item.label}</Text>
                  <Text type="supporting" size="sm">{item.desc}</Text>
                </VStack>
              </Card>
            ))}
          </Grid>
        </VStack>
      </Section>

      {/* ─── VA Roles ─── */}
      <Section id="va-roles" variant="transparent" paddingBlock={10}>
        <VStack gap={10}>
          <VStack gap={3} maxWidth={560} hAlign="start">
            <Badge label="Academy Specializations" variant="success" />
            <Heading level={2} type="display-2">Your Role. Interview-Ready.</Heading>
            <Text type="large" color="secondary">Every Academy specialization has tailored interview prep, questions, and learning paths</Text>
          </VStack>

          <Grid columns={{ minWidth: 260, repeat: "fit" }} gap={5}>
            {ROLES.map((role, i) => {
              const isFeatured = i === 0 || i === 3;
              return (
                <Card key={role.name} variant={isFeatured ? "orange" : "default"} padding={6}>
                  <VStack gap={3}>
                    <Card variant={isFeatured ? "default" : "muted"} width={40} height={40} padding={0}>
                      <VStack width="100%" height="100%" hAlign="center" vAlign="center">
                        <Icon icon={role.icon} size="sm" color="accent" />
                      </VStack>
                    </Card>
                    <VStack gap={1}>
                      <Text type="body" weight="semibold">{role.name}</Text>
                      <Text type="supporting" size="sm">{role.desc}</Text>
                    </VStack>
                  </VStack>
                </Card>
              );
            })}
          </Grid>
        </VStack>
      </Section>

      {/* ─── How It Works ─── */}
      <Section id="how-it-works" variant="muted" paddingBlock={10}>
        <VStack gap={10}>
          <VStack gap={3} hAlign="start">
            <Badge label="The Path" variant="orange" />
            <Heading level={2} type="display-2">Academy to Offer in Three Steps</Heading>
          </VStack>

          <Grid columns={{ minWidth: 260, repeat: "fit" }} gap={5}>
            {STEPS.map((item) => (
              <Card key={item.step} padding={6}>
                <VStack gap={3}>
                  <Text type="display-1" color="accent">{item.step}</Text>
                  <Card variant="muted" width={40} height={40} padding={0}>
                    <VStack width="100%" height="100%" hAlign="center" vAlign="center">
                      <Icon icon={item.icon} size="sm" color="accent" />
                    </VStack>
                  </Card>
                  <VStack gap={1}>
                    <Text type="body" weight="bold">{item.title}</Text>
                    <Text type="supporting" size="sm">{item.desc}</Text>
                  </VStack>
                </VStack>
              </Card>
            ))}
          </Grid>
        </VStack>
      </Section>

      {/* ─── Features ─── */}
      <Section id="features" variant="transparent" paddingBlock={10}>
        <VStack gap={10}>
          <VStack gap={3} maxWidth={560} hAlign="start">
            <Badge label="Everything You Need" variant="warning" />
            <Heading level={2} type="display-2">Your Interview Toolkit</Heading>
            <Text type="large" color="secondary">Designed to fill the gap between Academy training and employer expectations</Text>
          </VStack>

          <Grid columns={{ minWidth: 260, repeat: "fit" }} gap={5}>
            {FEATURES.map((feat, i) => (
              <Card key={feat.title} variant={i === 0 ? "orange" : "default"} padding={6}>
                <VStack gap={3}>
                  <Card variant={i === 0 ? "default" : "muted"} width={40} height={40} padding={0}>
                    <VStack width="100%" height="100%" hAlign="center" vAlign="center">
                      <Icon icon={feat.icon} size="sm" color="accent" />
                    </VStack>
                  </Card>
                  <VStack gap={1}>
                    <Text type="body" weight="semibold">{feat.title}</Text>
                    <Text type="supporting" size="sm">{feat.desc}</Text>
                  </VStack>
                </VStack>
              </Card>
            ))}
          </Grid>
        </VStack>
      </Section>

      {/* ─── Testimonials ─── */}
      <Section id="testimonials" variant="muted" paddingBlock={10}>
        <VStack gap={10}>
          <VStack gap={3} hAlign="start">
            <Badge label="Academy Graduate Stories" variant="success" />
            <Heading level={2} type="display-2">From Training to Hired</Heading>
          </VStack>

          <Grid columns={{ minWidth: 260, repeat: "fit" }} gap={5}>
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} padding={6}>
                <VStack gap={3}>
                  <HStack gap={0.5}>
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Icon key={j} icon={fillIcon(Star)} size="sm" color="accent" />
                    ))}
                  </HStack>
                  <Text type="body" size="sm">{`“${t.text}”`}</Text>
                  <VStack gap={0}>
                    <Text type="body" weight="semibold" size="sm">{t.name}</Text>
                    <Text type="supporting" size="xsm">{t.role}</Text>
                  </VStack>
                </VStack>
              </Card>
            ))}
          </Grid>
        </VStack>
      </Section>

      {/* ─── Academy CTA ─── */}
      <Section variant="transparent" paddingBlock={10}>
        <VStack gap={5} maxWidth={640} hAlign="center" className="mx-auto text-center">
          <Badge label="Exclusively for Academy Students" variant="orange" />
          <VStack gap={2}>
            <Heading level={2} type="display-2" justify="center">Not an Academy Student Yet?</Heading>
            <Text type="large" color="secondary" justify="center">
              Interview Lab is a free benefit for Project Amazon PH Academy enrollees.
              Enroll in the Academy first, then use the Lab to prepare for your interviews.
            </Text>
          </VStack>
          <HStack gap={3} wrap="wrap" hAlign="center">
            <Button label="Learn About the Academy" variant="primary" size="lg" icon={<ArrowUpRight weight="light" />} onClick={onGetStarted} />
            <Button label="Already Enrolled? Sign In" variant="secondary" size="lg" onClick={onViewPrograms} />
          </HStack>
        </VStack>
      </Section>

      {/* ─── FAQ ─── */}
      <Section id="faq" variant="muted" paddingBlock={10}>
        <VStack gap={8} maxWidth={640} className="mx-auto">
          <Heading level={2} type="display-2">Frequently Asked</Heading>
          <CollapsibleGroup>
            <VStack gap={2}>
              {FAQ.map((item) => (
                <Card key={item.q} padding={0}>
                  <Collapsible value={item.q} trigger={<Text type="body" weight="semibold">{item.q}</Text>} defaultIsOpen={false}>
                    <Text type="body" size="sm" color="secondary">{item.a}</Text>
                  </Collapsible>
                </Card>
              ))}
            </VStack>
          </CollapsibleGroup>
        </VStack>
      </Section>

      {/* ─── Final CTA ─── */}
      <Section variant="transparent" paddingBlock={10}>
        <VStack gap={5} maxWidth={640} hAlign="center" padding={8} className="mx-auto text-center bg-accent-bg rounded-2xl">
          {/* Astryx's own text-color rule (astryx-base layer) currently outranks the
              Tailwind `text-on-accent` utility despite the documented @layer order,
              so an inline style is the only reliable override here. */}
          <Heading level={2} type="display-1" justify="center" style={{ color: "var(--color-on-accent)" }}>
            Ready to Turn Training into a Career?
          </Heading>
          <Text type="large" justify="center" style={{ color: "var(--color-on-accent)" }}>
            Enroll at Project Amazon PH Academy, then use the Lab to bridge the gap
            from learning to landing your first Amazon VA role.
          </Text>
          <Button label="Get Started with the Academy" variant="secondary" size="lg" icon={<ArrowUpRight weight="light" />} onClick={onGetStarted} />
        </VStack>
      </Section>

      {/* ─── Footer ─── */}
      <Section variant="transparent" paddingBlock={4} dividers={["top"]}>
        <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
          <HStack gap={2} vAlign="center">
            <Icon icon={Lightning} size="sm" color="accent" />
            <Text type="body" weight="bold" size="sm">Interview Lab — Project Amazon PH Academy</Text>
          </HStack>
          <HStack gap={4} vAlign="center">
            <a href="/privacy"><Text type="supporting" size="xsm">Privacy</Text></a>
            <a href="/terms"><Text type="supporting" size="xsm">Terms</Text></a>
            <Text type="supporting" size="xsm">{`© ${year} Project Amazon PH`}</Text>
          </HStack>
        </HStack>
      </Section>
    </VStack>
  );
}

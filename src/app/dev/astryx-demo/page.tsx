"use client";

// Throwaway comparison page — not linked from anywhere in the app.
// Shows the existing "Field Manual" components next to their Astryx
// equivalents so the visual/API difference is easy to eyeball. Safe to
// delete; nothing else in the app imports from here.

import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import "@astryxdesign/theme-neutral/theme.css";

import { Theme } from "@astryxdesign/core";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { Button as XButton } from "@astryxdesign/core/Button";
import { Card as XCard } from "@astryxdesign/core/Card";
import { Badge as XBadge } from "@astryxdesign/core/Badge";

import { FieldButton } from "@/components/ui/glass-button";
import { FieldCard, FieldCardHeader, FieldCardTitle, FieldCardDescription, FieldCardContent } from "@/components/ui/glass-card";
import { FieldBadge } from "@/components/ui/glass-badge";

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 320 }}>
      <h2 style={{ fontFamily: "monospace", fontSize: 13, opacity: 0.6, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>{children}</div>
    </div>
  );
}

export default function AstryxDemoPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7", padding: 40, fontFamily: "sans-serif" }}>
      <h1 style={{ fontFamily: "monospace", fontSize: 20, marginBottom: 40 }}>
        Field Manual (current) vs Astryx (candidate)
      </h1>

      <div style={{ display: "flex", gap: 64, flexWrap: "wrap" }}>
        <Column title="Before — Field Manual (FieldButton / FieldCard / FieldBadge)">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <FieldButton variant="primary">Primary</FieldButton>
            <FieldButton variant="secondary">Secondary</FieldButton>
            <FieldButton variant="outline">Outline</FieldButton>
            <FieldButton variant="ghost">Ghost</FieldButton>
            <FieldButton variant="danger">Danger</FieldButton>
          </div>

          <FieldCard variant="default" className="p-6" style={{ maxWidth: 360 }}>
            <FieldCardHeader>
              <FieldCardTitle>Mock Interview</FieldCardTitle>
              <FieldCardDescription>Practice for your next Amazon VA interview.</FieldCardDescription>
            </FieldCardHeader>
            <FieldCardContent>
              <div style={{ display: "flex", gap: 8 }}>
                <FieldBadge variant="accent">PPC VA</FieldBadge>
                <FieldBadge variant="success">Published</FieldBadge>
                <FieldBadge variant="outline">Beginner</FieldBadge>
              </div>
            </FieldCardContent>
          </FieldCard>
        </Column>

        <Column title="After — Astryx (Button / Card / Badge, neutral theme)">
          <Theme theme={neutralTheme}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <XButton label="Primary" variant="primary" />
              <XButton label="Secondary" variant="secondary" />
              <XButton label="Ghost" variant="ghost" />
              <XButton label="Destructive" variant="destructive" />
            </div>

            <XCard style={{ maxWidth: 360 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <strong>Mock Interview</strong>
                <span style={{ fontSize: 14, opacity: 0.7 }}>Practice for your next Amazon VA interview.</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <XBadge label="PPC VA" variant="blue" />
                  <XBadge label="Published" variant="green" />
                  <XBadge label="Beginner" variant="gray" />
                </div>
              </div>
            </XCard>
          </Theme>
        </Column>
      </div>
    </div>
  );
}

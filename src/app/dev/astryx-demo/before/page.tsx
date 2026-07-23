"use client";

// Throwaway comparison page (isolated half) — not linked from anywhere in the
// app. Renders under the normal root layout (globals.css / Tailwind /
// PapHeader), with zero Astryx imports, so nothing here is affected by
// Astryx's CSS reset. Pair with /astryx-demo-after for the other half.
// Safe to delete; nothing else in the app imports from here.

import { FieldButton } from "@/components/ui/glass-button";
import { FieldCard, FieldCardHeader, FieldCardTitle, FieldCardDescription, FieldCardContent } from "@/components/ui/glass-card";
import { FieldBadge } from "@/components/ui/glass-badge";

export default function BeforeDemoPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7", padding: 40 }}>
      <h1 style={{ fontFamily: "monospace", fontSize: 13, opacity: 0.6, marginBottom: 24, textTransform: "uppercase", letterSpacing: 1 }}>
        Before — Field Manual (FieldButton / FieldCard / FieldBadge)
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 400 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <FieldButton variant="primary">Primary</FieldButton>
          <FieldButton variant="secondary">Secondary</FieldButton>
          <FieldButton variant="outline">Outline</FieldButton>
          <FieldButton variant="ghost">Ghost</FieldButton>
          <FieldButton variant="danger">Danger</FieldButton>
        </div>

        <FieldCard variant="default" className="p-6">
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
      </div>
    </div>
  );
}

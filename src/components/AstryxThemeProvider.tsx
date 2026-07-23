"use client";

import { Theme } from "@astryxdesign/core";
// Explicit .js extension: forces resolution to the built artifact (SSR-safe,
// no hydration flash) rather than the .ts source, which sits right next to
// it with the same base name and would otherwise win TS module resolution.
// Its CSS half is imported globally in globals.css.
import { fieldManualTheme } from "@/themes/field-manual.js";

export function AstryxThemeProvider({ children }: { children: React.ReactNode }) {
  return <Theme theme={fieldManualTheme}>{children}</Theme>;
}

import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // TypeScript rules — keep these off (migration debt, not harmful)
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/prefer-as-const": "off",

    // Unused vars — re-enabled (catches dead code)
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "no-unused-vars": "off", // handled by @typescript-eslint above

    // React hooks — keep exhaustive-deps off (complex deps cause more bugs than they fix)
    "react-hooks/exhaustive-deps": "off",
    "react-hooks/set-state-in-effect": "off", // flags legitimate data-fetching patterns

    // React — display-name and prop-types aren't needed with TypeScript
    "react/display-name": "off",
    "react/prop-types": "off",

    // react-compiler — not adopted yet, keep off

    // Next.js rules — keep off (minor concerns)
    "@next/next/no-img-element": "off",
    "@next/next/no-html-link-for-pages": "off",

    // General JavaScript — re-enabled important ones
    "prefer-const": "warn",
    "no-console": "off", // keep off for now (MVP logging)
    "no-debugger": "warn",
    "no-empty": "warn",
    "no-case-declarations": "off",
    "no-fallthrough": "warn",
    "no-redeclare": "off", // TypeScript handles this
    "no-undef": "off", // TypeScript handles this
    "no-unreachable": "warn",
    "no-irregular-whitespace": "off",
    "no-mixed-spaces-and-tabs": "off",
    "no-useless-escape": "off",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills"]
}];

export default eslintConfig;

# Interview-lab - Code Dependency Graph
```mermaid
graph TD
    N0["README.md"]
    N1["package.json"]
    N2["next.config.js"]
    N3["tsconfig.json"]
    N4["prisma/schema.prisma"]
    N5["prisma/seed.ts"]
    N6["src/app/layout.tsx"]
    N7["src/app/page.tsx"]
    N8["src/app/dashboard/page.tsx"]
    N9["src/app/interviews/page.tsx"]
    N10["src/app/analytics/page.tsx"]
    N11["src/components/Navbar.tsx"]
    N12["src/components/InterviewCard.tsx"]
    N13["src/components/CodeEditor.tsx"]
    N14["src/lib/prisma.ts"]
    N15["src/lib/ai.ts"]
    N16["src/styles/globals.css"]
    N17["public/"]
    N18["agent-ctx/system-prompt.md"]
    N19["agent-ctx/tools.md"]
    N0 --> N1
    N0 --> N2
    N0 --> N4
    N1 --> N3
    N4 --> N5
    N6 --> N7
    N7 --> N8
    N7 --> N9
    N7 --> N10
    N7 --> N11
    N8 --> N12
    N8 --> N13
    N9 --> N14
    N9 --> N15
    N11 --> N12
    N11 --> N13
    N6 --> N16
    N7 --> N17
    N0 --> N18
    N0 --> N19
```
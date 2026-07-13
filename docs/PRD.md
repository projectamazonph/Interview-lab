# Product Requirements Document

## Product

| Field | Value |
|-------|-------|
| **Name** | Interview Lab |
| **Domain** | interview-lab.vercel.app |
| **Owner** | Ryan Roland Dabao |
| **Profile** | Standard |
| **Created** | 2026-07-13 |

## Problem

Many Amazon VA candidates apply to roles with weak resumes, generic cover letters, shallow marketplace knowledge, and little ability to explain real PPC or Seller Central workflows. Employers want proof that candidates understand campaign structure, keyword research, reporting, optimization rules, client communication, and SOP discipline.

Desired outcome: Help candidates prepare for Amazon VA interviews through guided practice, scored mock interviews, resume improvements, cover letter drafts, and downloadable job-search assets.

## Users

| User | Goals |
|------|-------|
| **Entry-level Amazon VA candidate** | Role explanations, beginner guides, sample answers, resume repositioning, confidence-building |
| **Intermediate PPC assistant** | Structured interview practice, stronger answers, practical case studies |
| **Agency trainee / junior media buyer** | Advanced path covering campaign launch, keyword harvesting, reporting, account audit |
| **Content admin** | Add questions, edit rubrics, upload templates, manage role packs |

## Goals

| Goal | Description |
|------|-------------|
| Improve interview readiness | Help users answer behavioral, technical, and scenario questions clearly |
| Improve job application quality | Generate truthful, tailored resumes and cover letters |
| Teach Amazon-specific language | ACoS, ROAS, CVR, CPC, STR, indexing, ranking, PPC stages |
| Simulate real hiring screens | Mock interviews, timed tests, practical exercises |
| Build candidate portfolios | Sample audit summaries, campaign plans, keyword logs |
| Reduce generic VA applications | Make materials specific to Amazon marketplace work |

## Non-goals

| Non-goal | Reason |
|----------|--------|
| Guarantee job placement | Risky, misleading claim |
| Write fake experience | Must maintain candidate integrity |
| Encourage candidates to lie about tools | "Familiar with" only if trained; otherwise "currently learning" |
| Replace Amazon Ads certification | Interview prep, not official certification |
| Scrape job boards without permission | Use user-provided job descriptions only |

## First vertical slice

User registration → Onboarding diagnostic → Role selection → Mock interview with scoring → Results dashboard.

This slice proves: auth, profile creation, question retrieval, answer submission, AI scoring, and results display.

## Functional requirements

- User signup/login with JWT sessions
- Onboarding diagnostic for role selection
- Role-based question bank (264+ questions across 6 VA roles)
- Typed mock interview with real-time AI feedback
- Answer scoring with rubric breakdown
- Resume upload and AI review
- Cover letter generation with tone options
- Download center with tier-gated resources
- Admin content management
- Progress dashboard

## Non-functional requirements

- **Reliability**: AI scoring failures show graceful error states
- **Security**: JWT secrets protected, user data isolated, no credential exposure
- **Performance**: Question bank loads < 2s, AI responses < 10s
- **Accessibility**: Keyboard navigation, proper ARIA labels
- **Maintainability**: All AI prompts centralized in `src/lib/`

## Success criteria

| Metric | Target |
|--------|--------|
| Onboarding completion | 80%+ |
| First mock interview completion | 50%+ |
| Resume improvement score | +25% average |
| Cover letter generation rate | 40%+ |
| Return visits in 7 days | 35%+ |

## Risks and assumptions

- Users may fabricate Amazon experience → Add truthfulness warnings
- AI may give incorrect PPC advice → Use approved knowledge base + rubric checks
- PPC information becomes outdated → Content versioning + quarterly review
- Candidates overclaim tool expertise → "Trained on", "basic familiarity", "hands-on experience" labels

## Release boundary

MVP contains: Auth → Onboarding → Question bank → Mock interview → Resume review → Cover letter → Downloads → Admin panel.

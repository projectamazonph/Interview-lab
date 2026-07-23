# Amazon VA Interview Lab - Technical Architecture

> **This document is an early planning proposal, not a description of the built system.**
> Several items below were never implemented as written — see the corrections in
> each row, or `CLAUDE.md` at the repo root for the current, as-built architecture.

## 10.1 Recommended Stack
| Layer | Recommendation | As built |
|-------|---------------|----------|
| Frontend | Next.js, React, TypeScript | Matches |
| Styling | Tailwind CSS | Matches (v4) |
| Backend | Next.js API routes | Matches |
| Database | PostgreSQL (SQLite with Prisma for MVP) | **PostgreSQL only** — no SQLite path exists |
| Vector search | pgvector or managed vector DB | **Not implemented** — no vector search anywhere in the app |
| File storage | S3-compatible storage | **Not implemented** — resumes are pasted text, not uploaded files; no object storage is used |
| Auth | NextAuth.js | **Custom JWT auth** (`jose`, HttpOnly cookies) — NextAuth.js is not used |
| AI orchestration | z-ai-web-dev-sdk | Matches |
| Document generation | DOCX/PDF generation service | Matches (`docx`, `pdfkit`, in-process) |
| Analytics | PostHog, Amplitude, or custom events | **Not implemented** — no analytics integration exists |
| Admin CMS | Built-in admin panel | Matches |

## 10.2 System Architecture

```
User
↓
Web App Frontend
↓
API Layer
├── Auth Service
├── User Profile Service
├── Question Bank Service
├── Mock Interview Service
├── Resume/Cover Letter Service
├── Downloadable Generator
├── Assessment Engine
├── AI Agent Orchestrator
└── Admin CMS
↓
PostgreSQL/SQLite
├── Users
├── Roles
├── Questions
├── Attempts
├── Rubrics
├── Resumes
├── Cover Letters
├── Downloads
├── Assessments
├── Agent Runs
└── Content Versions
```

## 10.3 Core Database Tables

### users
| Field | Type |
|-------|------|
| id | uuid |
| email | text |
| name | text |
| subscription_tier | text |
| created_at | timestamp |

### user_profiles
| Field | Type |
|-------|------|
| user_id | uuid |
| target_role | text |
| experience_level | text |
| tools_known | jsonb |
| weak_areas | jsonb |
| interview_date | date |
| country | text |

### question_bank
| Field | Type |
|-------|------|
| id | uuid |
| role | text |
| difficulty | text |
| type | text |
| skill_area | text |
| question | text |
| strong_answer_points | jsonb |
| weak_answer_warnings | jsonb |
| sample_answer | text |
| rubric_id | uuid |
| status | draft/published/archived |

### interview_sessions
| Field | Type |
|-------|------|
| id | uuid |
| user_id | uuid |
| mode | text |
| target_role | text |
| started_at | timestamp |
| completed_at | timestamp |
| overall_score | numeric |
| transcript | jsonb |

### question_attempts
| Field | Type |
|-------|------|
| id | uuid |
| session_id | uuid |
| question_id | uuid |
| user_answer | text |
| ai_feedback | text |
| score | numeric |
| rubric_breakdown | jsonb |

### resumes
| Field | Type |
|-------|------|
| id | uuid |
| user_id | uuid |
| original_file_url | text |
| parsed_text | text |
| target_role | text |
| score | numeric |
| improved_version | text |
| truth_flags | jsonb |

### cover_letters
| Field | Type |
|-------|------|
| id | uuid |
| user_id | uuid |
| job_description | text |
| tone | text |
| generated_letter | text |
| truth_flags | jsonb |

### assessments
| Field | Type |
|-------|------|
| id | uuid |
| title | text |
| role | text |
| difficulty | text |
| dataset_url | text |
| answer_key | jsonb |
| rubric_id | uuid |

### downloads
| Field | Type |
|-------|------|
| id | uuid |
| title | text |
| file_type | text |
| role | text |
| description | text |
| file_url | text |
| access_tier | text |

### agent_runs
| Field | Type |
|-------|------|
| id | uuid |
| user_id | uuid |
| agent_type | text |
| input | jsonb |
| output | jsonb |
| safety_flags | jsonb |
| created_at | timestamp |

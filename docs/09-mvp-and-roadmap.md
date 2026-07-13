# Amazon VA Interview Lab - MVP Scope & Roadmap

## 15. MVP Must-Have Features
1. User signup/login
2. Onboarding diagnostic
3. Role-based question bank
4. Typed mock interview
5. Answer scoring
6. Resume review
7. Cover letter generator
8. Download center
9. Basic practical PPC exercises
10. Admin content editor
11. Progress dashboard

## MVP Nice-to-Have Features
1. Voice mock interviews
2. Video interview practice
3. Resume DOCX export
4. Certificate generation
5. AI-generated personalized study plan
6. Employer-style timed tests
7. Portfolio builder
8. Community leaderboard
9. Stripe subscriptions
10. Admin approval workflow

---

## 16. Development Roadmap

### Phase 1: Discovery and content architecture
- Final role list
- Question taxonomy
- Resume rubric
- Cover letter rubric
- Assessment list
- Knowledge base structure
- MVP wireframes
- Data model
- Prompt specs
- Guardrail policy

### Phase 2: MVP build
- Auth
- Dashboard
- Onboarding quiz
- Question bank
- Practice answer submission
- AI feedback
- Resume upload/review
- Cover letter generator
- Download library
- Admin question manager

### Phase 3: Practical test engine
- Assessment templates
- Sample datasets
- Answer key engine
- Rubric scoring
- Downloadable practice files
- Portfolio export

### Phase 4: AI mock interview
- Interview session flow
- Adaptive follow-up questions
- Scoring after each answer
- Transcript storage
- Session summary
- Recommended practice plan

### Phase 5: Monetization and polish
- Stripe plans
- Free vs paid limits
- PDF/DOCX export
- Certificates
- Referral system
- Analytics dashboard
- Admin content QA

### Phase 6: Advanced features
- Voice interview mode
- Video response review
- Job description tailoring
- Community examples
- Employer assessment packs
- Marketplace for templates
- Multilingual support

---

## 17. Suggested Subscription Model

| Plan | Features |
|------|----------|
| Free | Limited question bank, 1 resume scan, 1 cover letter, basic downloads |
| Starter | Full question bank, resume builder, cover letters, basic mock interviews |
| Pro | AI mock interviews, practical tests, portfolio builder, premium downloads |
| Agency/School | Admin dashboard, cohort tracking, custom role packs, branded templates |

---

## 18. Analytics and Success Metrics

### User success metrics
| Metric | Target |
|--------|--------|
| Onboarding completion | 80%+ |
| First mock interview completion | 50%+ |
| Resume improvement score | +25% average |
| Cover letter generation rate | 40%+ |
| Practical test completion | 30%+ |
| Return visits in 7 days | 35%+ |
| Paid conversion | Depends on traffic source |

### Learning metrics
| Metric | Purpose |
|--------|---------|
| Average interview score improvement | Measures coaching effectiveness |
| Weakest question categories | Guides content expansion |
| Resume truth flags | Detects risky user claims |
| Most downloaded templates | Shows user priorities |
| Assessment failure points | Improves guides and lessons |

---

## 19. Admin CMS Requirements

Admins should be able to:
1. Create/edit/archive questions
2. Tag questions by role/difficulty/skill
3. Create rubrics
4. Upload downloadable files
5. Create guide articles
6. Approve AI-generated questions
7. Review flagged content
8. Manage role packs
9. View user analytics
10. Export content

Content versioning is important because interview content, Amazon workflows, and tool practices will evolve.

---

## 21. Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Users fabricate experience | Add truthfulness warnings and rewrite safely |
| AI gives wrong PPC advice | Use approved knowledge base and rubric checks |
| App exposes internal docs | Separate internal source docs from learner content |
| Generic answers feel low-value | Role-specific scoring and follow-up questions |
| Users churn after resume generation | Add progress paths, mock interviews, and practical tests |
| PPC info becomes outdated | Add content versioning and quarterly review |
| Candidates overclaim tool expertise | Add "trained on," "basic familiarity," and "hands-on experience" labels |
| Too much content overwhelms beginners | Use diagnostic-based learning paths |

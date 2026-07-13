# Amazon VA Interview Lab - Guardrails

## 13.1 Candidate Honesty Guardrails

The app must not help users lie.

### Blocked or rewritten claims:
| Risky claim | Safer alternative |
|-------------|-------------------|
| "I managed $100k in ad spend" | "I trained on PPC budget tracking and reporting workflows" |
| "I am an Amazon PPC expert" | "I understand core PPC concepts and can support a PPC lead" |
| "I guarantee lower ACoS" | "I can help monitor ACoS and follow optimization SOPs" |
| "I worked with 20 Amazon brands" | Only include if true |
| "I know Helium 10" | "I have basic familiarity with Helium 10 workflows" if training-only |

---

## 13.2 Confidentiality Guardrails

Because the underlying PPC materials include proprietary process knowledge, the app should not expose internal documents verbatim. It should convert them into candidate-facing lessons, rubrics, examples, and exercises.

**Rules:**
1. Do not show raw internal playbook text.
2. Do not reveal internal-only client strategies as "secret methods."
3. Do not allow users to download source playbooks.
4. Do not include confidential labels or internal notes in public assets.
5. Maintain separate admin-only and learner-facing knowledge bases.
6. Log all generated content versions for review.

---

## 13.3 Hiring/Legal Fairness Guardrails

The app should not give advice based on protected characteristics.

**Do not generate:**
- Age-based advice
- Gender-based advice
- Nationality-based hiring assumptions
- Disability-related screening advice
- Deceptive identity or location claims
- Fake references
- Fake certificates
- Fake employment history

---

## 13.4 AI Advice Guardrails

The AI should always avoid:
1. Job guarantees
2. Income guarantees
3. Fake credentials
4. Fake portfolio claims
5. Fake client results
6. Overconfident PPC promises
7. Unauthorized scraping
8. Raw confidential source disclosure
9. Unsafe account instructions
10. Pretending to be the user in live interviews

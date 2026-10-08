# Prompts.md: AI Architectural Queries

AI assistant used: Each entry records the prompt, why I asked, and what I decided or changed.

---

## 1. Understanding the assignment and comparing projects
**Prompt:** "Analyze this assignment deeply, compare the difficulty of all 3 projects (EduCore, VitalSync, TaskMatrix), and tell me which is best for me as a working full stack developer."
**Why:** Understand deliverables and scope risk before committing.
**Outcome:** Identified this sprint as blueprint-only. Compared domain complexity, real-time needs, and time risk per project.

## 2. Applying a zero-budget constraint
**Prompt:** "I have no financial assistance so I cannot pay for anything. Which project should I pick to get hired?"
**Why:** Hosting, media, and API costs could block deployment.
**Outcome:** Confirmed a free-tier stack (Vercel, Render, MongoDB Atlas M0). Video storage made EduCore the main cost risk.

## 3. Choosing VitalSync
**Prompt:** "Can I also go for health?" followed by "Is there any cost for VitalSync?"
**Why:** I wanted backend depth and lower competition, and needed current free-tier limits.
**Outcome:** Chose VitalSync. Verified a zero-cost stack, noted Render cold starts (about one minute), and chose a /health endpoint plus uptime pinger as mitigation.

## 4. Scoping backend modules
**Prompt:** "Can you do all the code for the VitalSync backend?"
**Why:** Define realistic modules and build order for the 5-week phase.
**Outcome:** Defined the modules and a phased order: auth and RBAC, availability and slots, appointments with conflict prevention, records and prescriptions, real-time / cron / audit, tests and deployment.

## 5. Blueprint package
**Prompt:** "Using the assignment, make everything I need for VitalSync: README/PRD, ERD, Figma plan, Prompts.md, demo script."
**Why:** Meet the sprint deliverables.
**Outcome:** Drafted the README structure and the first ERD. I reviewed and edited both.

## 6. Wireframes with the Figma AI agent
**Prompt:** [paste the exact Figma prompts you ran: style rules, then admin / patient / doctor screens]
**Why:** Speed up wireframing for three roles with consistent styling and shared fake data.
**Outcome:** [list your manual edits: renamed frames, fixed overflow, resized the Auth frame to 1440x1024, etc.]

## 7. Closing a gap: doctor registration
**Prompt:** "Admin will approve the doctors, but how will doctors register? Where are the registration and login screens?"
**Why:** My design had an approval screen but no doctor sign-up path.
**Outcome:** Added a doctor onboarding flow (pending, approved, rejected), Register (Doctor), Pending, and Rejected screens, and changed the data model from a boolean `isApproved` to an `approvalStatus` state.

## 8. ERD v2
**Prompt:** "Give me the full updated ERD code according to all my setups."
**Why:** Make the schema match every designed screen.
**Outcome:** Final schema has 10 collections: added `refresh_tokens`, `approvalStatus` fields, appointment cancel / reschedule tracking, typed enums, and audit-log fields for admin decisions. I verified each screen maps to a collection.

---

## Key decisions I made after reviewing AI output
- Chose **VitalSync** over TaskMatrix for backend depth, accepting higher scope risk, and tiered scope into P0 / P1 / P2.
- Enforced double-booking prevention at the **database level** (unique partial index), not only in app code.
- Chose **generated slots** over storing every slot as a document.
- Kept auth data and role data in **separate collections**.
- Made doctor onboarding an **admin-gated state machine**.
- Stored refresh tokens **hashed** so a database leak doesn't expose working sessions.
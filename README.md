# VitalSync — Healthcare EHR & Appointment Dashboard

> Prodesk Capstone · Sprint 13 · Blueprint submission (planning phase, no functional code yet)

**Author:** Ankan Pal 
**Designated Track:** Fullstack

## 1. Overview

VitalSync is a role-based Electronic Health Record (EHR) and appointment management web app with three roles: Patient, Doctor, and Admin. Patients book appointments against real-time doctor availability and view their medical history and prescriptions. Doctors register with their professional details, get approved by an admin, publish weekly availability, and manage appointments, medical records, and prescriptions. Admins verify doctors, manage users, and review an append-only audit log.

Core engineering challenges: **conflict-free appointment booking**, **strict role-scoped data access**, **an admin-gated doctor onboarding flow**, and **live availability updates**.

> All data is fake demo data. VitalSync uses *HIPAA-inspired* access controls and audit logging; it is **not** HIPAA certified.

## 2. Links

| Item | Link |
|---|---|
| Figma wireframes | https://www.figma.com/design/Idzw6s4S0SmEt1weKa3gkM/Untitled?node-id=0-1&p=f&t=qU1og8e1r93k7L2O-0 |
| ERD (dbdiagram.io) | https://dbdiagram.io/d/6ac33f41abcc87fb7aed332d |

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| State / data fetching | Zustand (auth + UI state), TanStack Query (server state) |
| Forms / validation | React Hook Form + Zod |
| Backend | Node.js, Express |
| Database | MongoDB Atlas (M0 free tier) + Mongoose |
| Auth | JWT access token + rotating refresh tokens (hashed in DB), bcrypt, role middleware |
| Real-time | Socket.IO (live slot availability) |
| Background jobs | node-cron (appointment reminders) |
| Testing | Jest + Supertest |
| API docs | Swagger (OpenAPI) |
| Hosting (free tiers) | Vercel (frontend), Render (API), MongoDB Atlas (DB) |
| Design / diagrams | Figma, dbdiagram.io |

## 4. User Roles

| Role | Capabilities |
|---|---|
| **Patient** | Register, browse approved doctors, book / cancel / reschedule own appointments, view own history and prescriptions, manage profile, read notifications |
| **Doctor** | Register with specialty and license, wait for approval, then set availability, manage schedule, add medical records, issue prescriptions for own patients |
| **Admin** | Approve or reject doctors (reason required), activate / deactivate users, read the audit log. Admins are created by a seed script, never through Register. |

### Doctor onboarding flow
1. Doctor registers with specialty, license number, experience, fee, and bio. Status = `pending`.
2. A pending doctor can log in but only sees a "Pending approval" screen. Doctor routes are blocked by a `requireApprovedDoctor` middleware.
3. Admin reviews the doctor in the Doctor Approvals screen and approves or rejects (with a reason).
4. Approved: dashboard unlocked and the doctor appears in Find Doctor. Rejected: the reason is shown and the doctor can update details and reapply.

## 5. Core Features (Prioritized)

### P0: Must have
1. Authentication (register, login, refresh, logout) with JWT
2. Role-Based Access Control (Admin / Doctor / Patient)
3. Doctor registration with admin approval flow (pending / approved / rejected)
4. Doctor profiles and weekly availability setup
5. Slot generation from availability rules (15 / 30 / 45 min slots)
6. Appointment booking with **double-booking prevention** (unique partial index on `doctorId + date + slotStart`, HTTP 409 on conflict)
7. Cancel and reschedule appointments
8. Patient, doctor, and admin dashboards

### P1: Should have
9. Medical history timeline (visible only to the patient and treating doctors)
10. Prescription creation (doctor) and read-only view (patient)
11. Real-time slot availability via Socket.IO
12. In-app notifications and cron-based appointment reminders
13. Admin user management (activate / deactivate)

### P2: Nice to have
14. Audit log of record access and admin decisions (HIPAA-inspired)
15. Doctor search and specialty filter
16. Dark mode, downloadable prescription PDF

## 6. UI/UX Wireframes

Figma: PASTE_FIGMA_PUBLIC_LINK

**Designed in this sprint ([N] screens across all three roles):**

| Role | Screens |
|---|---|
| Auth | Login, Register (Patient), Register (Doctor), Doctor Pending Approval, Doctor Application Rejected |
| Patient | Dashboard, Find Doctor + Book Slot, My Appointments, Medical History, Prescriptions, Profile + Notifications |
| Doctor | Dashboard, My Schedule, Availability Editor, Patients, Patient Record |
| Admin | Dashboard, Doctor Approvals, Users, Audit Log |


**Planned for the build phase (same layout patterns):** 


### Collections (10)
`users`, `refresh_tokens`, `doctor_profiles`, `patient_profiles`, `availabilities`, `appointments`, `medical_records`, `prescriptions`, `notifications`, `audit_logs`

### Relationships (summary)
- `users` 1—N `refresh_tokens`
- `users` 1—1 `doctor_profiles` or `patient_profiles` (by role)
- `doctor_profiles` 1—N `availabilities`
- `doctor_profiles` 1—N `appointments` N—1 `patient_profiles`
- `appointments` 1—N `medical_records` and `prescriptions`
- `users` 1—N `notifications` and `audit_logs`
- `doctor_profiles.reviewedBy` references the approving admin in `users`

### Key design decisions
- **Separate profile collections** keep auth data apart from role-specific data and simplify RBAC queries.
- **Double-booking is prevented by the database**, not just app code: a unique partial index on `(doctorId, date, slotStart)` where `status = "booked"`. Two simultaneous requests: one succeeds, one gets HTTP 409. Cancelled slots become bookable again.
- **Slots are generated on read.** Availability stores rules (day, start, end, slot length); open slots are computed minus booked appointments. This avoids millions of stale slot documents.
- **Doctor approval is a state machine** (`pending`, `approved`, `rejected`) on `doctor_profiles`, enforced by middleware. Find Doctor lists approved doctors only.
- **References, not embedding,** for records and prescriptions, so access rules are checked per document. A doctor can read a patient's records only if they share an appointment.
- **Refresh tokens are stored hashed** and rotated on every refresh; logout sets `revokedAt`.
- **Audit logs are append-only**, and admin approve / reject decisions are logged.

## 8. Planned API (summary)

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register` (role: patient or doctor) · `/login` · `/refresh` · `/logout` · `GET /api/auth/me` (includes approval status) |
| Doctors | `GET /api/doctors` (approved only) · `GET /api/doctors/:id/slots?date=` |
| Availability | `POST/PUT/DELETE /api/availability` (doctor) |
| Appointments | `POST /api/appointments` · `GET /api/appointments/me` · `PATCH /:id/cancel` · `/:id/reschedule` · `/:id/complete` |
| Records | `POST /api/records` (doctor) · `GET /api/records/patient/:id` |
| Prescriptions | `POST /api/prescriptions` (doctor) · `GET /api/prescriptions/me` |
| Notifications | `GET /api/notifications` · `PATCH /api/notifications/:id/read` |
| Admin | `GET /api/admin/users` · `PATCH /api/admin/doctors/:id/approve` · `PATCH /api/admin/doctors/:id/reject` · `GET /api/admin/audit` |

## 9. Delivery Plan (5 weeks + buffer)

| Week | Goal | Done when |
|---|---|---|
| 1 | Repo setup, Express + Next.js scaffold, Mongoose models from the ERD, auth with rotating refresh tokens, RBAC, seed script (admin, demo doctor, demo patient), CI | Each role logs in and lands on its own dashboard shell |
| 2 | Doctor registration and approval, availability CRUD, slot generation, booking with partial unique index, cancel / reschedule, patient dashboard and booking UI | Two simultaneous bookings: one 201, one 409 |
| 3 | Medical records, prescriptions, per-document access rules, doctor dashboard, availability editor, history UI, patient record view | A patient cannot read another patient's records (tested) |
| 4 | Socket.IO live slots, notifications, node-cron reminders, audit log, admin UI (approvals, users, audit) | Booking in one browser updates the slot grid in another |
| 5 | Jest + Supertest tests, Swagger docs, loading / empty / error states, accessibility pass, deploy to Render + Vercel + Atlas, uptime pinger | Live URL works from a logged-out browser |
| 6 (buffer) | Bug fixes, polish, extras, final demo | Nothing new is started |

## 10. Known Constraints & Risks

- Render's free tier sleeps after about 15 minutes idle (cold start about one minute), so the API exposes `/health` and uses an uptime pinger.
- Cron jobs don't fire while the server sleeps, so reminders are also computed on read.
- Scope is deliberately limited to stay realistic for 5 weeks.

## 11. AI Usage

See [`Prompts.md`](Prompts.md).

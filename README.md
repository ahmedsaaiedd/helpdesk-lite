# HelpDesk Lite

HelpDesk Lite is a focused internal support workspace for submitting, owning, tracking, and resolving employee requests. It is intentionally smaller than a full ITSM platform: the product keeps the ticket, current owner, status, and useful progress in one clear place.

## Technology

- Next.js 16 App Router, React 19, strict TypeScript
- Tailwind CSS 4 with a custom light/dark design system
- shadcn/ui foundations and Radix primitives
- Motion for React for focused transitions
- Auth.js credentials authentication
- PostgreSQL and Prisma
- React Hook Form and Zod
- Vitest, React Testing Library, and Playwright

## What is included

### Employee

- Overview with active and recently updated requests
- A validated, duplicate-safe request form
- Searchable and filterable personal request history
- Ticket details with ownership, status, activity, and replies when support is waiting
- Server-enforced access to the employee's own tickets only

### Support

- Operational overview and centralized ticket queue
- URL-backed search, filters, sorting, and pagination
- Personal assigned-ticket view
- Atomic take-ownership flow
- Owner-only reassignment, triage, status, progress, and resolution controls
- Progress updates and deliberate resolution
- Complete activity history for meaningful changes

### Manager

- Open, in-progress, waiting, unassigned, and resolved visibility
- Open request inspection and owner filters
- Team workload with active and high-priority counts
- Dedicated unassigned request view
- Manager override controls for assignment, triage, status, progress, and resolution
- Manager-only user management with database-backed Employee, Support, and Manager account creation

## Architecture

The application uses Server Components for data-heavy pages and small Client Components only for forms, menus, URL filters, theme selection, and Motion. Pages never query the database from the browser.

```text
app/
  (auth)/login/                 login experience
  (workspace)/employee/        employee routes
  (workspace)/support/         support routes
  (workspace)/manager/         manager routes
  actions/                     authenticated server mutations
  api/auth/[...nextauth]/      Auth.js route handlers
components/
  auth/                        login form
  dashboard/                   page headers and summaries
  layout/                      responsive application shell
  tickets/                     lists, filters, forms, details, controls
  ui/                          shadcn/Radix primitives
lib/
  auth/                        current-user and role guards
  data/                        authorized, paginated database reads
  domain.ts                    labels, permissions, workflow rules
  validation.ts                shared Zod schemas and URL parsing
prisma/
  schema.prisma                relational schema
  migrations/                  PostgreSQL migration and ID trigger
  seed.ts                      development users and realistic tickets
tests/                         Vitest and Testing Library tests
e2e/                           critical Playwright workflows
```

## Database model

- `User`: identity, password hash, role, and active state
- `Ticket`: concurrency-safe display ID, idempotency key, request content, category, priority, status, owner, timestamps, and optimistic concurrency version
- `TicketActivity`: actor, type, time, replies, triage changes, content, and structured metadata
- `AuthAttempt`: persistent login failure window and temporary blocking

PostgreSQL generates ticket sequence values and a `BEFORE INSERT` trigger formats them as `HD-000001`. This remains safe when multiple requests are created concurrently. Ticket ownership and important updates use conditional atomic writes against the ticket version, so stale clients cannot silently overwrite newer work.

## Routes

| Audience | Routes |
| --- | --- |
| Public | `/login` |
| Employee | `/employee`, `/employee/requests`, `/employee/requests/new`, `/employee/requests/[id]` |
| Support | `/support`, `/support/tickets`, `/support/tickets/[id]`, `/support/my-tickets` |
| Manager | `/manager`, `/manager/requests`, `/manager/requests/[id]`, `/manager/workload`, `/manager/unassigned`, `/manager/users` |

## Local setup in VS Code

### Prerequisites

- Node.js 22.13 or newer
- npm
- PostgreSQL 14 or newer, or Docker Desktop

### 1. Open and install

Open the extracted `helpdesk-lite` folder in VS Code, then run:

```bash
npm install
```

### 2. Create the environment file

Copy `.env.example` to `.env`.

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Paste the generated value into `AUTH_SECRET` in `.env`.

Required values:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Server-only PostgreSQL connection string |
| `AUTH_SECRET` | Long random key used to protect Auth.js sessions |
| `AUTH_TRUST_HOST` | Set to `true` for local development and trusted deployments |
| `DEV_ALLOWED_ORIGINS` | Optional comma-separated fallback for unusual development network setups |

Never prefix either secret with `NEXT_PUBLIC_`, and never commit `.env`.

### 3. Start PostgreSQL

With Docker Desktop:

```bash
docker compose up -d
```

The included compose file starts PostgreSQL at `localhost:5432` using the development URL already present in `.env.example`.

If PostgreSQL is installed directly, create a database named `helpdesk_lite` and adjust `DATABASE_URL`.

### 4. Apply the schema and seed development data

```bash
npm run db:deploy
npm run db:seed
```

### 5. Run the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To test from a phone or another device on the same private network, run:

```bash
npm run dev:lan
```

Then open `http://<your-computer-ipv4>:3000` on that device. The development
configuration discovers the computer's LAN addresses automatically, so no IP
address is hardcoded in the project.

## Development demo accounts

These accounts are created only by the development seed. All use password `HelpDesk123!`.

| Role | Email |
| --- | --- |
| Employee | `employee@helpdesklite.local` |
| Support | `support@helpdesklite.local` |
| Manager | `manager@helpdesklite.local` |

Additional seeded employee and support accounts create a realistic workload. The seed refuses to run when `NODE_ENV=production`.

The names, accounts, and sample tickets in `prisma/seed.ts` are development fixtures, not application UI data. Runtime pages, tables, filters, ownership, and dashboard counts are always loaded from PostgreSQL. Production environments must create real users through the manager-only Users page and must never run the development seed.

## Commands

```bash
npm run dev          # local Next.js server
npm run dev:lan      # local server available to devices on the same network
npm run lint         # ESLint
npm run typecheck    # strict TypeScript check
npm test             # unit and component tests
npm run test:integration # real PostgreSQL workflow and concurrency tests
npm run test:e2e     # Playwright employee/support/manager/security flows
npm run build        # optimized production build
npm run start        # run the production build
npm run db:generate  # regenerate Prisma Client
npm run db:migrate   # create/apply a development migration
npm run db:deploy    # apply committed migrations
npm run db:seed      # create development demo data
```

Before the first Playwright run, install Chromium once:

```bash
npx playwright install chromium
```

The integration and E2E suites expect the migrated development database. E2E also expects the seed data.

## Authentication and authorization

Auth.js uses the credentials provider with bcrypt password verification and an eight-hour JWT session. Authentication errors do not reveal whether an email exists or whether an account is disabled. Repeated failures are tracked in PostgreSQL and temporarily blocked.

Authorization is enforced on the server, not only in navigation:

- Every protected page resolves the signed session and reloads the current database user, so disabled accounts and changed roles take effect immediately.
- Every server action authenticates and requires the support or employee role it needs.
- Employee ticket reads always verify `requesterId`; manually changing a ticket URL cannot reveal someone else's request.
- Requester, role, ownership permission, timestamps, and initial status are never accepted from browser input.
- Assigned support owners can edit their tickets; non-owner support teammates remain read-only.
- Managers can edit or reassign any ticket, while employees can only reply to their own waiting requests.
- Only managers can create internal accounts. Public sign-up is intentionally unavailable, passwords are validated and bcrypt-hashed on the server, and duplicate work emails are rejected.

Auth.js supplies CSRF-aware action handling and secure cookie behavior. Production must use HTTPS, a strong unique `AUTH_SECRET`, and a private PostgreSQL connection.

## Validation and integrity

- React Hook Form gives immediate accessible form feedback.
- The same Zod schemas validate again in server actions.
- A browser-generated request key makes repeated ticket submission idempotent.
- Assignment, status, progress, and resolution writes check a monotonically increasing ticket version.
- Take ownership only succeeds when the ticket is still unassigned and unresolved.
- A requester reply is accepted only for that employee's own waiting ticket and returns it to In Progress.
- Active tickets without an update for 48 hours are marked as needing attention and can be filtered directly.
- Resolved tickets cannot be reopened or modified in V1.
- Search and filter values are validated and malformed URL state falls back safely.

## UX, performance, and accessibility

- Custom precision-desk visual system in both light and dark themes
- System theme support with preference persistence and no initial theme flash
- Responsive desktop sidebar and accessible mobile sheet navigation
- Semantic tables with purpose-built mobile ticket rows
- Clear ticket-age and 48-hour no-update indicators on desktop and mobile
- Visible labels, focus states, keyboard operation, and text alongside every status color
- Radix focus trapping and restoration for menus, sheets, selects, and resolution confirmation
- Reduced-motion support
- Server rendering, paginated queries, selected relations, parallel reads, and no browser-side database loading
- Motion is limited to meaningful entrances and active navigation; simple feedback uses CSS transforms and opacity

## Production checklist

1. Provision a production PostgreSQL database.
2. Set `DATABASE_URL`, `AUTH_SECRET`, and `AUTH_TRUST_HOST` in the hosting environment.
3. Run `npm run db:deploy` during release.
4. Sign in with the initial manager account and create real users from `/manager/users`; do not run the development seed.
5. Serve the application through HTTPS.
6. Run lint, typecheck, unit tests, Playwright, and the production build in CI.

V1 intentionally excludes public sign-up, AI, external customer access, automated SLA escalation, attachments, notifications, knowledge-base publishing, billing, integrations, advanced analytics, and multi-tenant SaaS behavior.

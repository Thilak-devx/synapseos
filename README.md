# SynapseOS

SynapseOS is a premium enterprise SaaS control plane for AI-powered database operations. It combines role-based access control, DBMS-backed report workflows, audit logging, realtime operational simulation, notifications, and an AI command center inside a polished Next.js platform.

The product is designed as a hackathon-ready enterprise DBMS platform: cinematic enough for a live demo, but structured like a real production SaaS application.

## Features

- Multi-role authentication for Admin, Manager, and User workspaces.
- Real RBAC route protection and role-aware navigation.
- Admin Control Center with user management, role assignment, audit logs, reports, notifications, and monitoring.
- Manager dashboard for department analytics, team activity, and scoped reporting.
- User dashboard for personal reports, notifications, profile, and account settings.
- DBMS-powered report workflow with create, edit, archive, restore, duplicate, export, status tracking, and audit events.
- Enterprise notification center with unread state, contextual actions, and deep-link behavior.
- AI Command Center with contextual operational responses, quick actions, live health signals, and activity awareness.
- Realtime enterprise simulation for metrics, alerts, activities, charts, and system state.
- Prisma ORM schema with relational integrity, indexes, cascading rules, and production PostgreSQL support.
- Premium futuristic UI using Tailwind CSS, shadcn/ui-style primitives, Framer Motion, Lucide icons, and Recharts.

## Tech Stack

- Framework: Next.js App Router
- Language: TypeScript
- UI: Tailwind CSS, shadcn UI patterns, Lucide React
- Animation: Framer Motion
- Charts: Recharts
- Auth: Auth.js / NextAuth with JWT sessions
- ORM: Prisma
- Database: PostgreSQL, Neon-compatible
- Validation: Zod, React Hook Form
- Deployment: Vercel

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Update `.env` with your PostgreSQL connection string and Auth.js secrets.

Generate Prisma Client:

```bash
npx prisma generate --schema prisma/schema.prisma
```

Apply migrations:

```bash
npx prisma migrate deploy --schema prisma/schema.prisma
```

Seed demo/admin data:

```bash
npm run db:seed
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Use `.env.example` as the source of truth. Never commit `.env` or real secrets.

Required:

- `DATABASE_URL`: PostgreSQL connection string. For Neon, include `sslmode=require`.
- `NEXTAUTH_URL`: Application URL, for example `http://localhost:3000` locally or your production domain.
- `NEXTAUTH_SECRET`: Strong random secret for NextAuth.
- `AUTH_SECRET`: Same value as `NEXTAUTH_SECRET`.
- `NEXT_PUBLIC_APP_URL`: Public app URL used for metadata and redirects.

Optional:

- `AUTH_GITHUB_ID`: GitHub OAuth client ID.
- `AUTH_GITHUB_SECRET`: GitHub OAuth client secret.
- `DEFAULT_ADMIN_EMAIL`: Seeded admin email.
- `DEFAULT_ADMIN_PASSWORD`: Seeded admin password.
- `DEFAULT_ADMIN_NAME`: Seeded admin display name.
- `DEMO_SEED_ON_STARTUP`: Set to `true` only for controlled demo environments.

Generate a production-grade secret:

```bash
openssl rand -base64 32
```

## Production Deployment

Recommended platform: Vercel with Neon PostgreSQL.

1. Create a Neon PostgreSQL database.
2. Add all `.env.example` variables to Vercel Project Settings.
3. Use the Neon pooled connection string for `DATABASE_URL`.
4. Run migrations against production:

```bash
npx prisma migrate deploy --schema prisma/schema.prisma
```

5. Seed the production admin account only when intended:

```bash
npm run db:seed
```

6. Deploy:

```bash
vercel --prod
```

## Quality Checks

Run these before opening a pull request or deploying:

```bash
npm run lint
npm run typecheck
npm run build
```

## Screenshots

Add screenshots or demo captures here before public launch:

- Landing page
- Admin Control Center
- AI Command Center
- Reports workflow
- Role-based dashboards

## Security Notes

- `.env` files are ignored and must never be committed.
- Local Prisma databases are ignored.
- Secret keys, certificates, tokens, and Vercel local config are ignored.
- RBAC is enforced through protected routes, middleware, API guards, and server-side role checks.
- Demo credentials are intended for evaluation environments only and should be rotated or disabled before production launch.

## Author / Team

Built by the SynapseOS team as a premium AI-powered enterprise DBMS platform.

For ownership, update this section with the project author, team members, institution, and contact links before submission.

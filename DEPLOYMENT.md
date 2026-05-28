# SynapseOS Production Deployment

## Required Services

- Vercel project connected to this repository.
- Neon PostgreSQL database with pooled connection enabled.

## Environment Variables

Copy `.env.example` into Vercel Project Settings -> Environment Variables and replace every placeholder:

- `DATABASE_URL`: Neon pooled PostgreSQL URL, including `sslmode=require`.
- `NEXTAUTH_URL`: production Vercel/custom domain URL.
- `NEXT_PUBLIC_APP_URL`: same production URL.
- `NEXTAUTH_SECRET`: 32+ byte random secret.
- `AUTH_SECRET`: same value as `NEXTAUTH_SECRET`.
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`: optional.
- `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`, `DEFAULT_ADMIN_NAME`: seed-only admin identity.
- `DEMO_SEED_ON_STARTUP`: keep `false` in production. Run the seed command intentionally instead.

Generate a strong secret with:

```bash
openssl rand -base64 32
```

## First Production Database Setup

Run once after setting `DATABASE_URL`:

```bash
npx prisma migrate deploy --schema prisma/schema.prisma
npm run db:seed
```

## Vercel Deployment

```bash
npm install
npm run lint
npm run typecheck
npm run build
vercel --prod
```

The configured Vercel build command runs Prisma Client generation before `next build`.

## Production Verification Checklist

- Login with seeded admin credentials.
- Verify RBAC redirects for admin, manager, and user routes.
- Create, view, archive, restore, duplicate, and export reports.
- Open AI Command Center and run health/audit prompts.
- Open notifications and verify read/deep-link behavior.
- Review monitoring charts and realtime simulation.
- Confirm `/unauthorized` renders for restricted access.

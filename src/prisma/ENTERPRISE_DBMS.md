# SynapseOS Enterprise DBMS Features

## Overview

This layer adds advanced PostgreSQL concepts on top of the Prisma domain model so SynapseOS demonstrates real DBMS behavior, not only ORM CRUD.

## Triggers

- `trg_process_audit_event`
  - Why: JWT auth does not naturally write login rows into `Session`, so the app writes `AuditEvent` rows and PostgreSQL turns login events into durable `ActivityLog` rows.
  - Benefit: login auditing remains centralized in the database instead of being duplicated in every code path.
  - Performance impact: tiny write overhead on login inserts, offset by indexed audit retrieval.

- `trg_log_user_profile_update`
  - Why: profile updates are high-value audit actions.
  - Benefit: change history exists even if application logic changes later.
  - Performance impact: JSON diff payload adds a small write cost but saves debugging time.

- `trg_notify_new_user`, `trg_notify_role_changed`, `trg_notify_report_created`
  - Why: user lifecycle and report generation are cross-cutting events.
  - Benefit: notifications are guaranteed even when multiple services touch the same tables.
  - Performance impact: one extra row insert per event; indexed notification queries keep reads fast.

- `set_updated_at`
  - Why: protects timestamp consistency even when rows are updated outside Prisma.
  - Benefit: DBAs, scripts, and future workers all keep `updatedAt` accurate.

## Stored Procedures

- `sp_monthly_analytics_report`
  - Returns monthly active-user, report-count, and metric aggregates.
  - Benefit: heavy aggregation stays close to the data and is reusable by APIs, dashboards, and scheduled jobs.

- `sp_user_summary_report`
  - Returns a user’s activities, notifications, and reports in one cursor-backed call.
  - Benefit: reduces application join orchestration and keeps complex aggregation logic in PostgreSQL.

- `sp_department_analytics`
  - Produces department-level member, report, and unread-notification statistics.
  - Benefit: manager/admin analytics can scale without repeated ORM fan-out.

- `sp_process_notification_queue`
  - Demonstrates queue-style processing with ordered unread notifications.
  - Benefit: ready for background workers or operator tools that process alert backlogs safely.

## Transactions

Application transactions are implemented in `src/services/dbms.service.ts`.

- User registration transaction
  - Creates user, notification, activity log, and audit event in one rollback-safe unit.
- Report generation transaction
  - Creates report, persists system metrics, creates notifications, and logs activity atomically.
- Role assignment transaction
  - Updates the role, computes effective permissions, creates notification, and writes audit trail atomically.

Real-world benefit:
- Prevents half-written workflows such as a created user without onboarding notification or a role change without audit evidence.

## Cursors

Cursor examples live in `src/prisma/sql/cursor_examples.sql`.

- Inactive user iteration
- Bulk report processing
- Notification processing

Why cursors matter:
- They are useful for controlled batch operations where row-by-row processing is safer than materializing huge result sets.

## Constraints

Added database constraints include:

- Lowercase-email check on `User`
- Valid status check on `User`
- Non-empty text checks on `User`, `Notification`, `Report`, and `ActivityLog`
- Range checks on system metrics
- Foreign keys for `assignedToId` and `AuditEvent.userId`

Why:
- These rules protect the database even if future application code regresses.

## Indexing

Added indexes target the most likely enterprise queries:

- `lower(email)` for login and user lookup
- action/timestamp indexes for audit feeds
- partial unread-notification index for notification centers
- report status indexes for queue-style report dashboards
- role/status index for admin user filtering
- GIN indexes on JSON metadata for audit and notification payload filtering

Performance impact:
- Slightly higher write cost
- Meaningfully faster operational reads, especially on audit and alert-heavy workloads

## Prisma Compatibility

Prisma continues to own:

- schema typing
- relations
- transactional application workflows
- API integration

PostgreSQL owns:

- server-side automation
- strict constraints
- cursor-backed procedures
- audit and notification triggers

That split keeps the application ergonomic while still demonstrating advanced DBMS concepts professionally.

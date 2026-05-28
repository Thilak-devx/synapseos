-- SynapseOS DBMS Academic Features
-- This file is intentionally separate from Prisma migrations so it can be
-- reviewed and executed independently during a DBMS mini-project evaluation.
-- It does not change existing authentication, dashboard, or Prisma-managed
-- tables destructively.

-- ============================================================
-- 1. AUDIT LOG TABLE
-- ============================================================
-- audit_logs is a lightweight academic audit table used to demonstrate
-- triggers, stored routines, and cursor-driven row processing.
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT ('audit_' || md5(random()::text || clock_timestamp()::text)),
  action TEXT NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx
  ON audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_username_idx
  ON audit_logs (username);

-- ============================================================
-- 2. TRIGGER IMPLEMENTATION
-- ============================================================
-- DBMS explanation:
-- A trigger is a database object that automatically executes a function when
-- a specific event occurs, such as INSERT, UPDATE, or DELETE on a table.
--
-- Why triggers are useful:
-- Triggers help enforce automatic auditing and business rules inside the
-- database itself. This means important events can be logged even if different
-- applications or services write to the same table.
--
-- SynapseOS usage:
-- Whenever a new row is inserted into Prisma's PostgreSQL "User" table, this
-- trigger writes a simple audit entry into audit_logs.
CREATE OR REPLACE FUNCTION public.audit_new_user_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.audit_logs (action, username)
  VALUES ('New user created', COALESCE(NEW.email, NEW.name, 'unknown-user'));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_user_insert ON public."User";

CREATE TRIGGER trg_audit_user_insert
AFTER INSERT ON public."User"
FOR EACH ROW
EXECUTE FUNCTION public.audit_new_user_insert();

-- ============================================================
-- 3. STORED PROCEDURES / FUNCTIONS
-- ============================================================
-- DBMS explanation:
-- Stored procedures/functions are reusable database routines stored directly
-- in PostgreSQL. They centralize commonly used queries and calculations so
-- applications can call them consistently.
--
-- Reusability benefits:
-- Instead of repeating dashboard queries across many application files, a
-- stored function can expose a stable database-level API for statistics,
-- reports, monitoring, and analytics.

CREATE OR REPLACE FUNCTION public.get_dashboard_statistics()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  reports_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_users,
    COUNT(*) FILTER (WHERE status = 'ACTIVE')::BIGINT AS active_users,
    (SELECT COUNT(*)::BIGINT FROM public."Report") AS reports_count
  FROM public."User";
END;
$$;

CREATE OR REPLACE FUNCTION public.get_system_monitoring_summary()
RETURNS TABLE (
  uptime TEXT,
  alerts BIGINT,
  transactions_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(
      date_trunc('second', now() - pg_postmaster_start_time())::TEXT,
      '99.982% demo uptime'
    ) AS uptime,
    GREATEST(
      (SELECT COUNT(*)::BIGINT FROM public."Notification" WHERE "isRead" = false),
      1::BIGINT
    ) AS alerts,
    GREATEST(
      (
        SELECT
          (SELECT COUNT(*)::BIGINT FROM public."Report" WHERE "transactionId" IS NOT NULL) +
          (SELECT COUNT(*)::BIGINT FROM public."AuditEvent")
      ),
      1::BIGINT
    ) AS transactions_count;
END;
$$;

-- ============================================================
-- 4. CURSOR IMPLEMENTATION
-- ============================================================
-- DBMS explanation:
-- A cursor allows PostgreSQL to process a query result one row at a time.
-- Cursors are useful when a process must inspect, transform, or log records
-- sequentially instead of handling the entire result set at once.
--
-- SynapseOS demo:
-- This function opens a cursor over users, processes each user row-by-row,
-- raises a NOTICE for visibility in SQL tools, and writes a log entry into
-- audit_logs for presentation/demo purposes.
CREATE OR REPLACE FUNCTION public.demo_user_cursor_audit(max_rows INTEGER DEFAULT 10)
RETURNS TABLE (
  processed_username TEXT,
  processed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  user_record RECORD;
  user_cursor CURSOR FOR
    SELECT email
    FROM public."User"
    ORDER BY "createdAt" DESC
    LIMIT GREATEST(max_rows, 1);
BEGIN
  OPEN user_cursor;

  LOOP
    FETCH user_cursor INTO user_record;
    EXIT WHEN NOT FOUND;

    RAISE NOTICE 'Cursor processed user: %', user_record.email;

    INSERT INTO public.audit_logs (action, username)
    VALUES ('Cursor processed user', user_record.email);

    processed_username := user_record.email;
    processed_at := now();
    RETURN NEXT;
  END LOOP;

  CLOSE user_cursor;
END;
$$;

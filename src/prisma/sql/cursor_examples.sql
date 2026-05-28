-- Cursor examples for SynapseOS enterprise DBMS workflows.
-- These are operational examples for DBAs and do not run automatically in Prisma.

-- A. Iterating inactive users
DO $$
DECLARE
  inactive_user_cursor CURSOR FOR
    SELECT u."id", u."email", u."updatedAt"
    FROM "User" u
    WHERE u."status" = 'SUSPENDED'
    ORDER BY u."updatedAt" ASC;
  inactive_user RECORD;
BEGIN
  OPEN inactive_user_cursor;

  LOOP
    FETCH inactive_user_cursor INTO inactive_user;
    EXIT WHEN NOT FOUND;

    RAISE NOTICE 'Inactive user: %, %, %',
      inactive_user."id",
      inactive_user."email",
      inactive_user."updatedAt";
  END LOOP;

  CLOSE inactive_user_cursor;
END;
$$;

-- B. Bulk report processing
DO $$
DECLARE
  report_cursor CURSOR FOR
    SELECT r."id", r."title", r."status"
    FROM "Report" r
    WHERE r."status" IN ('QUEUED', 'PROCESSING')
    ORDER BY r."createdAt" ASC;
  queued_report RECORD;
BEGIN
  OPEN report_cursor;

  LOOP
    FETCH report_cursor INTO queued_report;
    EXIT WHEN NOT FOUND;

    RAISE NOTICE 'Process report %, title %, status %',
      queued_report."id",
      queued_report."title",
      queued_report."status";
  END LOOP;

  CLOSE report_cursor;
END;
$$;

-- C. Notification processing
DO $$
DECLARE
  notification_cursor CURSOR FOR
    SELECT n."id", n."userId", n."title"
    FROM "Notification" n
    WHERE n."isRead" = false
    ORDER BY n."createdAt" ASC;
  notification_record RECORD;
BEGIN
  OPEN notification_cursor;

  LOOP
    FETCH notification_cursor INTO notification_record;
    EXIT WHEN NOT FOUND;

    RAISE NOTICE 'Notification % for user % titled %',
      notification_record."id",
      notification_record."userId",
      notification_record."title";
  END LOOP;

  CLOSE notification_cursor;
END;
$$;

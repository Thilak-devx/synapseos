type ErrorWithMetadata = {
  code?: string;
  message?: string;
  name?: string;
};

const DATABASE_CONNECTIVITY_PATTERNS = [
  "can't reach database server",
  "timed out",
  "timeout",
  "econnrefused",
  "connection refused",
  "connection terminated",
  "failed to connect",
  "unable to reach",
  "server has closed the connection",
];

export class DatabaseServiceUnavailableError extends Error {
  readonly statusCode = 503;

  constructor(message = "The database is currently unavailable.") {
    super(message);
    this.name = "DatabaseServiceUnavailableError";
  }
}

export function isDatabaseConnectivityError(error: unknown) {
  const candidate = error as ErrorWithMetadata | undefined;
  const message = candidate?.message?.toLowerCase() ?? "";

  return (
    candidate?.code === "P1001" ||
    candidate?.code === "P1002" ||
    candidate?.name === "PrismaClientInitializationError" ||
    DATABASE_CONNECTIVITY_PATTERNS.some((pattern) => message.includes(pattern))
  );
}

export function normalizeDatabaseError(
  error: unknown,
  fallbackMessage = "The database is currently unavailable.",
) {
  if (error instanceof DatabaseServiceUnavailableError) {
    return error;
  }

  if (isDatabaseConnectivityError(error)) {
    return new DatabaseServiceUnavailableError(fallbackMessage);
  }

  return error;
}

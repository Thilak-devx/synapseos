import { NextResponse } from "next/server";
import { DatabaseServiceUnavailableError } from "@/lib/db-errors";

export function handleApiError(
  error: unknown,
  options?: {
    defaultMessage?: string;
  },
) {
  if (error instanceof DatabaseServiceUnavailableError) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: error.statusCode },
    );
  }

  console.error(error);

  return NextResponse.json(
    {
      error: options?.defaultMessage ?? "Internal server error.",
    },
    { status: 500 },
  );
}

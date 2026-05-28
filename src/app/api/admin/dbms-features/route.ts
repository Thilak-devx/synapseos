import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error-response";
import { requireApiRole } from "@/lib/api-auth";
import {
  getAcademicDbmsDemo,
  runAcademicCursorDemo,
} from "@/services/dbms-academic.service";

export async function GET() {
  const authResult = await requireApiRole(["ADMIN"]);

  if (!authResult.ok) {
    return authResult.response;
  }

  try {
    const demo = await getAcademicDbmsDemo();
    return NextResponse.json(demo);
  } catch (error) {
    return handleApiError(error, {
      defaultMessage: "Unable to load academic DBMS feature demo.",
    });
  }
}

export async function POST(request: Request) {
  const authResult = await requireApiRole(["ADMIN"]);

  if (!authResult.ok) {
    return authResult.response;
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { limit?: number };
    const processed = await runAcademicCursorDemo(body.limit ?? 5);
    const demo = await getAcademicDbmsDemo();

    return NextResponse.json({
      ...demo,
      cursorProcessed: processed,
    });
  } catch (error) {
    return handleApiError(error, {
      defaultMessage: "Unable to run cursor demo.",
    });
  }
}

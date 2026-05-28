import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error-response";
import { registerSchema } from "@/lib/auth-schemas";
import { getRequestIp } from "@/lib/request";
import { createUser, getUserByEmail } from "@/services/auth.service";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid registration data.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const existingUser = await getUserByEmail(parsed.data.email);

  if (existingUser) {
    return NextResponse.json(
      {
        error: "An account with that email already exists.",
      },
      { status: 409 },
    );
  }

  try {
    const user = await createUser(parsed.data, {
      ipAddress: getRequestIp(request.headers),
    });

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, {
      defaultMessage: "Unable to register the account.",
    });
  }
}

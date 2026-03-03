import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 },
      );
    }
    const { username, password } = validationResult.data;

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
      include: { organization: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid credentials or account inactive" },
        { status: 401 },
      );
    }

    // Validate Password
    const providedPassword = password;
    if (!providedPassword) {
      return NextResponse.json({ error: "Password missing" }, { status: 400 });
    }
    const isValid = await verifyPassword(providedPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Create session
    await createSession(
      user.id,
      user.role,
      user.name,
      user.organizationId || undefined,
    );

    return NextResponse.json({
      success: true,
      role: user.role,
      redirect: user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

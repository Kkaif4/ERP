import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createSession, getSession } from "@/lib/auth";
import { registrationSchema, publicRegistrationSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Distinguish between Public Admin Registration and Internal Staff Registration
    // Admin registration uses 'organizationName', Staff registration uses 'organizationId'
    const isPublicRegistration = !!body.organizationName;

    if (!isPublicRegistration) {
      // 1. Staff Registration (Admin only)
      const session = await getSession();
      if (!session) {
        return NextResponse.json(
          { error: "Unauthorized. Please log in as an administrator." },
          { status: 401 },
        );
      }

      if (session.role !== "ORG_ADMIN") {
        return NextResponse.json(
          {
            error:
              "Unauthorized. Only organization admins can create staff accounts.",
          },
          { status: 401 },
        );
      }

      // Validate using registrationSchema for staff
      const validationResult = registrationSchema.safeParse({
        ...body,
        role: "ORG_STAFF",
      });
      if (!validationResult.success) {
        return NextResponse.json(
          { error: validationResult.error.issues[0].message },
          { status: 400 },
        );
      }

      const data = validationResult.data;
      if (data.role !== "ORG_STAFF") {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }

      // Verify organization matches admin's org
      if (session.organizationId !== data.organizationId) {
        return NextResponse.json(
          {
            error:
              "Unauthorized. You can only create staff for your own organization.",
          },
          { status: 403 },
        );
      }

      const existingUser = await prisma.user.findUnique({
        where: { username: data.username },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 400 },
        );
      }

      const hashedPassword = await hashPassword(data.password);
      const user = await prisma.user.create({
        data: {
          username: data.username,
          password: hashedPassword,
          name: data.name,
          role: "ORG_STAFF",
          organizationId: data.organizationId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Staff account created successfully",
        userId: user.id,
      });
    }

    // 2. Public Admin Registration
    const validationResult = publicRegistrationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 },
      );
    }

    const data = validationResult.data;

    // Check if username already exists globally
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 },
      );
    }

    const hashedPassword = await hashPassword(data.password);

    // Create Organization and Admin in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const slug = data.organizationName
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");

      const existingOrg = await tx.organization.findUnique({
        where: { slug },
      });

      const finalSlug = existingOrg
        ? `${slug}-${Math.floor(Math.random() * 1000)}`
        : slug;

      const organization = await tx.organization.create({
        data: {
          name: data.organizationName,
          slug: finalSlug,
        },
      });

      const user = await tx.user.create({
        data: {
          username: data.username,
          password: hashedPassword,
          name: data.name,
          role: "ORG_ADMIN",
          organizationId: organization.id,
        },
      });

      return { user, organization };
    });

    // Automatically log user in
    await createSession(
      result.user.id,
      result.user.role,
      result.user.name,
      result.user.organizationId || undefined,
    );

    return NextResponse.json({
      success: true,
      message: "Organization and admin account created successfully",
      redirect: "/dashboard",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

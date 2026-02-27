import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { staffSchema } from "@/lib/schemas";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
    const session = await getSession();
    if (!session || !session.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "ORG_STAFF") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const staff = await prisma.user.findMany({
        where: {
            organizationId: session.organizationId,
            role: "ORG_STAFF",
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { username: { contains: search, mode: "insensitive" } },
            ],
        },
        select: {
            id: true,
            name: true,
            username: true,
            role: true,
            isActive: true,
            createdAt: true,
        },
        orderBy: { name: "asc" },
    });

    return NextResponse.json(staff);
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session || !session.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "ORG_STAFF") {
        return NextResponse.json({ error: "Unauthorized: Only admins can manage staff" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const result = staffSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
        }

        const { name, username, password, pin, isActive } = result.data;

        // Check if username is taken
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
            return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
        }

        const hashedPassword = password ? await bcrypt.hash(password, 10) : "";

        const staff = await prisma.user.create({
            data: {
                name,
                username,
                password: hashedPassword,
                pin: pin || null,
                isActive,
                role: "ORG_STAFF",
                organizationId: session.organizationId,
            },
        });

        await prisma.auditLog.create({
            data: {
                action: "CREATE",
                entity: "USER",
                entityId: staff.id,
                newValue: { name, username, role: "ORG_STAFF" } as any,
                userId: session.userId,
                organizationId: session.organizationId,
            },
        });

        return NextResponse.json({
            id: staff.id,
            name: staff.name,
            username: staff.username,
            isActive: staff.isActive,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

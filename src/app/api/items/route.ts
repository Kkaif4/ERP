import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    // When fetching for bill dropdowns, only return active items (activeOnly=true)
    const activeOnly = searchParams.get("activeOnly") === "true";

    const items = await prisma.item.findMany({
        where: {
            organizationId: session.organizationId!,
            name: { contains: search, mode: "insensitive" },
            ...(activeOnly ? { isActive: true } : {}),
        },
        orderBy: { name: "asc" },
    });

    return NextResponse.json(items);
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { name, defaultPricingMode } = body;

        if (!name || !defaultPricingMode) {
            return NextResponse.json({ error: "Name and Pricing Mode are required" }, { status: 400 });
        }

        // Check for duplicate name within org
        const existing = await prisma.item.findFirst({
            where: { organizationId: session.organizationId!, name: { equals: name, mode: "insensitive" } },
        });
        if (existing) {
            return NextResponse.json({ error: "An item with this name already exists" }, { status: 409 });
        }

        const item = await prisma.item.create({
            data: { name, defaultPricingMode, organizationId: session.organizationId! },
        });

        await prisma.auditLog.create({
            data: {
                action: "CREATE", entity: "ITEM", entityId: item.id,
                newValue: item as any, userId: session.userId, organizationId: session.organizationId!,
            },
        });

        return NextResponse.json(item);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { id, isActive } = body;

        if (!id || typeof isActive !== "boolean") {
            return NextResponse.json({ error: "id and isActive are required" }, { status: 400 });
        }

        const item = await prisma.item.update({
            where: { id },
            data: { isActive },
        });

        await prisma.auditLog.create({
            data: {
                action: "UPDATE", entity: "ITEM", entityId: item.id,
                newValue: { isActive } as any, userId: session.userId, organizationId: session.organizationId!,
            },
        });

        return NextResponse.json(item);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

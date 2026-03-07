import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { itemSchema, itemPatchSchema } from "@/lib/schemas";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const activeOnly = searchParams.get("activeOnly") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const isNumericSearch = /^\d+$/.test(search);
    const where: any = {
        organizationId: session.organizationId!,
        ...(activeOnly ? { isActive: true } : {}),
    };

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" as const } },
            ...(isNumericSearch ? [{ incrementalId: parseInt(search) }] : []),
        ];
    }

    const [total, items] = await Promise.all([
        prisma.item.count({ where }),
        prisma.item.findMany({
            where,
            orderBy: { name: "asc" },
            skip,
            take: limit,
        }),
    ]);

    // Fetch stock for these items
    const itemIds = items.map(i => i.id);
    const { getBatchAvailableStock } = await import("@/lib/inventory");
    const stockMap = await getBatchAvailableStock(itemIds, session.organizationId!);

    const itemsWithStock = items.map(item => ({
        ...item,
        availableKg: stockMap[item.id]?.availableKg || 0,
        availableUnits: stockMap[item.id]?.availableUnits || 0,
    }));

    return NextResponse.json({
        data: itemsWithStock,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const result = itemSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
        }
        const { name, defaultPricingMode } = result.data;

        // Check for duplicate name within org
        const existing = await prisma.item.findFirst({
            where: { organizationId: session.organizationId!, name: { equals: name, mode: "insensitive" } },
        });
        if (existing) {
            return NextResponse.json({ error: "An item with this name already exists" }, { status: 409 });
        }

        // Generate incrementalId
        const lastItem = await prisma.item.findFirst({
            where: { organizationId: session.organizationId! },
            orderBy: { incrementalId: "desc" },
            select: { incrementalId: true },
        });
        const incrementalId = (lastItem?.incrementalId || 0) + 1;

        const item = await prisma.item.create({
            data: {
                name,
                defaultPricingMode,
                organizationId: session.organizationId!,
                incrementalId,
            },
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
        const validationResult = itemPatchSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json({ error: validationResult.error.issues[0].message }, { status: 400 });
        }
        const { id, isActive } = validationResult.data;


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

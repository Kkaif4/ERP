import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const items = await prisma.item.findMany({
        where: {
            organizationId: session.organizationId!,
            name: { contains: search, mode: "insensitive" },
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

        const item = await prisma.item.create({
            data: {
                name,
                defaultPricingMode,
                organizationId: session.organizationId!,
            },
        });

        // Audit Log
        await prisma.auditLog.create({
            data: {
                action: "CREATE",
                entity: "ITEM",
                entityId: item.id,
                newValue: item as any,
                userId: session.userId,
                organizationId: session.organizationId!,
            },
        });

        return NextResponse.json(item);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

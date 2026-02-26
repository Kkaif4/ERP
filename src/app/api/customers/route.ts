import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const customers = await prisma.customer.findMany({
        where: {
            organizationId: session.organizationId!,
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { mobile: { contains: search } },
            ],
        },
        orderBy: { name: "asc" },
    });

    return NextResponse.json(customers);
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { name, mobile, address } = body;

        if (!name || !mobile) {
            return NextResponse.json({ error: "Name and Mobile are required" }, { status: 400 });
        }

        const customer = await prisma.customer.create({
            data: {
                name,
                mobile,
                address: address || "",
                organizationId: session.organizationId!,
                balance: 0,
            },
        });

        await prisma.auditLog.create({
            data: {
                action: "CREATE",
                entity: "CUSTOMER",
                entityId: customer.id,
                newValue: customer as any,
                userId: session.userId,
                organizationId: session.organizationId!,
            },
        });

        return NextResponse.json(customer);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

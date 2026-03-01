import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { farmerSchema } from "@/lib/schemas";

export async function GET(req: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where = {
        organizationId: session.organizationId!,
        OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { mobile: { contains: search } },
        ],
    };

    const [total, farmers] = await Promise.all([
        prisma.farmer.count({ where }),
        prisma.farmer.findMany({
            where,
            orderBy: { name: "asc" },
            skip,
            take: limit,
        }),
    ]);

    return NextResponse.json({
        data: farmers,
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
        if (session.role === "ORG_STAFF") {
            return NextResponse.json({ error: "Unauthorized: Only admins can create farmers" }, { status: 403 });
        }

        const body = await req.json();
        const result = farmerSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
        }
        const { name, mobile, address, openingBalance, openingBalanceType } = result.data;

        // Calculate initial balance
        // Farmer balance represents "amount business owes farmer"
        // DUE = positive balance, ADVANCE = negative balance
        const initialBalance = openingBalanceType === "ADVANCE" ? -(openingBalance || 0) : (openingBalance || 0);

        const farmer = await prisma.farmer.create({
            data: {
                name,
                mobile,
                address: address || "",
                organizationId: session.organizationId!,
                balance: initialBalance,
                openingBalance: openingBalance || 0,
                openingBalanceType: openingBalanceType || "DUE",
            },
        });

        // Audit Log
        await prisma.auditLog.create({
            data: {
                action: "CREATE",
                entity: "FARMER",
                entityId: farmer.id,
                newValue: farmer as any,
                userId: session.userId,
                organizationId: session.organizationId!,
            },
        });

        return NextResponse.json(farmer);
    } catch (error: any) {
        console.error("Farmer Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { customerSchema } from "@/lib/schemas";

export async function GET(req: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const isNumericSearch = /^\d+$/.test(search);
    const where = {
        organizationId: session.organizationId!,
        OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { mobile: { contains: search } },
            ...(isNumericSearch ? [{ incrementalId: parseInt(search) }] : []),
        ],
    };

    const [total, customers] = await Promise.all([
        prisma.customer.count({ where }),
        prisma.customer.findMany({
            where,
            orderBy: { name: "asc" },
            skip,
            take: limit,
        }),
    ]);

    return NextResponse.json({
        data: customers,
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
            return NextResponse.json({ error: "Unauthorized: Only admins can create customers" }, { status: 403 });
        }

        const body = await req.json();
        const result = customerSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
        }
        const { name, mobile, address, openingBalance, openingBalanceType } = result.data;

        // Calculate initial balance
        // Customer balance represents "amount customer owes business"
        // DUE = positive balance, ADVANCE = negative balance
        const initialBalance = openingBalanceType === "ADVANCE" ? -(openingBalance || 0) : (openingBalance || 0);

        // Generate incrementalId
        const lastCustomer = await prisma.customer.findFirst({
            where: { organizationId: session.organizationId! },
            orderBy: { incrementalId: "desc" },
            select: { incrementalId: true },
        });
        const incrementalId = (lastCustomer?.incrementalId || 0) + 1;

        const customer = await prisma.customer.create({
            data: {
                name,
                mobile,
                incrementalId,
                address: address || "",
                organizationId: session.organizationId!,
                balance: initialBalance,
                openingBalance: openingBalance || 0,
                openingBalanceType: openingBalanceType || "DUE",
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

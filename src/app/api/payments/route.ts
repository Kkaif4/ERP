import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const farmerId = searchParams.get("farmerId");
    const customerId = searchParams.get("customerId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where = {
        organizationId: session.organizationId!,
        ...(farmerId ? { farmerId } : {}),
        ...(customerId ? { customerId } : {}),
    };

    const [total, payments] = await Promise.all([
        prisma.payment.count({ where }),
        prisma.payment.findMany({
            where,
            include: {
                farmer: { select: { id: true, name: true } },
                customer: { select: { id: true, name: true } },
                bill: { select: { id: true, billNumber: true } },
                recordedBy: { select: { name: true } },
            },
            orderBy: { paymentDate: "desc" },
            skip,
            take: limit,
        }),
    ]);

    return NextResponse.json({
        data: payments,
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
        const { farmerId, customerId, billId, amount, mode, notes, paymentDate } = body;

        if (!amount || amount <= 0) return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
        if (!mode) return NextResponse.json({ error: "Payment mode is required" }, { status: 400 });
        if (!farmerId && !customerId) return NextResponse.json({ error: "Either farmerId or customerId is required" }, { status: 400 });

        const result = await prisma.$transaction(async (tx) => {
            // Create the payment record
            const payment = await tx.payment.create({
                data: {
                    organizationId: session.organizationId!,
                    farmerId: farmerId || null,
                    customerId: customerId || null,
                    billId: billId || null,
                    amount,
                    mode,
                    notes: notes || null,
                    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                    recordedById: session.userId,
                },
            });

            // Update balance
            if (farmerId) {
                await tx.farmer.update({
                    where: { id: farmerId },
                    data: { balance: { decrement: amount } },
                });
            } else if (customerId) {
                await tx.customer.update({
                    where: { id: customerId },
                    data: { balance: { decrement: amount } },
                });
            }

            return payment;
        });

        await prisma.auditLog.create({
            data: {
                action: "CREATE", entity: "PAYMENT", entityId: result.id,
                newValue: result as any, userId: session.userId, organizationId: session.organizationId!,
            },
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

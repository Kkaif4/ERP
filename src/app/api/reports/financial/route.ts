import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getSession();
    if (!session || !session.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ORG_ADMIN") {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // OUTSTANDING_PAYABLES, OUTSTANDING_RECEIVABLES
    const organizationId = session.organizationId;

    try {
        switch (type) {
            case "OUTSTANDING_PAYABLES": {
                const farmers = await prisma.farmer.findMany({
                    where: { organizationId, balance: { gt: 0 } },
                    orderBy: { balance: "desc" },
                });

                return NextResponse.json({
                    data: farmers.map(f => ({
                        id: f.id,
                        party: f.name,
                        mobile: f.mobile,
                        amount: Number(f.balance),
                    })),
                    summary: {
                        totalAmount: farmers.reduce((acc, f) => acc + Number(f.balance), 0),
                        count: farmers.length,
                    }
                });
            }

            case "OUTSTANDING_RECEIVABLES": {
                const customers = await prisma.customer.findMany({
                    where: { organizationId, balance: { gt: 0 } },
                    orderBy: { balance: "desc" },
                });

                return NextResponse.json({
                    data: customers.map(c => ({
                        id: c.id,
                        party: c.name,
                        mobile: c.mobile,
                        amount: Number(c.balance),
                    })),
                    summary: {
                        totalAmount: customers.reduce((acc, c) => acc + Number(c.balance), 0),
                        count: customers.length,
                    }
                });
            }

            default: {
                // Return both summaries
                const [payables, receivables] = await Promise.all([
                    prisma.farmer.aggregate({
                        where: { organizationId, balance: { gt: 0 } },
                        _sum: { balance: true },
                        _count: { id: true }
                    }),
                    prisma.customer.aggregate({
                        where: { organizationId, balance: { gt: 0 } },
                        _sum: { balance: true },
                        _count: { id: true }
                    })
                ]);

                return NextResponse.json({
                    summary: {
                        totalPayable: Number(payables._sum.balance || 0),
                        countPayable: payables._count.id,
                        totalReceivable: Number(receivables._sum.balance || 0),
                        countReceivable: receivables._count.id,
                    }
                });
            }
        }
    } catch (error) {
        console.error("Financial Report Error:", error);
        return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
    }
}

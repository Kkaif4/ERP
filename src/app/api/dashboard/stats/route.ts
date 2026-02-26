import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.organizationId as string | undefined;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const whereOrg = orgId ? { organizationId: orgId } : {};
    const whereToday = orgId
        ? { organizationId: orgId, createdAt: { gte: today, lt: tomorrow } }
        : { createdAt: { gte: today, lt: tomorrow } };

    const [
        todayBills,
        todayPayments,
        totalFarmers,
        totalCustomers,
        pendingFarmerBalance,
        pendingCustomerBalance,
        recentBills,
    ] = await Promise.all([
        // Bills created today
        prisma.bill.count({ where: whereToday }),

        // Payments recorded today
        prisma.payment.count({ where: whereToday }),

        // Total active farmers
        prisma.farmer.count({ where: whereOrg }),

        // Total customers
        prisma.customer.count({ where: whereOrg }),

        // Total pending farmer payables (sum of all farmer balances > 0)
        prisma.farmer.aggregate({
            where: { ...whereOrg, balance: { gt: 0 } },
            _sum: { balance: true },
        }),

        // Total pending customer receivables (sum of all customer balances > 0)
        prisma.customer.aggregate({
            where: { ...whereOrg, balance: { gt: 0 } },
            _sum: { balance: true },
        }),

        // Recent 5 bills
        prisma.bill.findMany({
            where: whereOrg,
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
                farmer: { select: { name: true } },
                customer: { select: { name: true } },
                createdBy: { select: { name: true } },
            },
        }),
    ]);

    return NextResponse.json({
        todayBills,
        todayPayments,
        totalFarmers,
        totalCustomers,
        pendingFarmerBalance: Number(pendingFarmerBalance._sum.balance ?? 0),
        pendingCustomerBalance: Number(pendingCustomerBalance._sum.balance ?? 0),
        recentBills: recentBills.map((b) => ({
            id: b.id,
            billNumber: b.billNumber,
            type: b.type,
            party: b.farmer?.name ?? b.customer?.name ?? "—",
            netTotal: Number(b.netTotal),
            billDate: b.billDate,
            createdBy: b.createdBy.name,
        })),
    });
}

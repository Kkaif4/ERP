import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getSession();
    if (!session || !session.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ORG_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // PROFIT_SUMMARY, TOP_PARTIES, ITEM_TRENDS
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const organizationId = session.organizationId;

    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    if (!startDateStr) startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    endDate.setHours(23, 59, 59, 999);

    try {
        switch (type) {
            case "PROFIT_SUMMARY": {
                // Simplified Profit calculation: Sale NetTotal - Purchase NetTotal
                // In a real mandi, it's Commission (Service Charge) + Tax + Labour + Freight - Expenses
                // But as per FRD 19.3, we need Daily/Monthly Profit.

                const [sales, purchases, expenses] = await Promise.all([
                    prisma.bill.aggregate({
                        where: { organizationId, type: "SALE", billDate: { gte: startDate, lte: endDate } },
                        _sum: { netTotal: true, serviceChargeAmount: true, taxAmount: true, labourCharges: true, freightCharges: true }
                    }),
                    prisma.bill.aggregate({
                        where: { organizationId, type: "PURCHASE", billDate: { gte: startDate, lte: endDate } },
                        _sum: { netTotal: true }
                    }),
                    prisma.expense.aggregate({
                        where: { organizationId, expenseDate: { gte: startDate, lte: endDate }, deletedAt: null },
                        _sum: { amount: true }
                    })
                ]);

                const grossRevenue = Number(sales._sum.netTotal || 0);
                const costOfGoods = Number(purchases._sum.netTotal || 0);
                const totalExpenses = Number(expenses._sum.amount || 0);

                // Primary profit for Mandi: Commissions/Charges collected - Business Expenses
                const earnings = Number(sales._sum.serviceChargeAmount || 0) - totalExpenses;

                return NextResponse.json({
                    summary: {
                        grossRevenue,
                        costOfGoods,
                        earnings,
                        totalExpenses,
                        taxCollected: Number(sales._sum.taxAmount || 0),
                        labourCollected: Number(sales._sum.labourCharges || 0),
                    }
                });
            }

            case "TOP_PARTIES": {
                const topCustomers = await prisma.bill.groupBy({
                    by: ["customerId"],
                    where: { organizationId, type: "SALE", billDate: { gte: startDate, lte: endDate }, customerId: { not: null } },
                    _sum: { netTotal: true },
                    orderBy: { _sum: { netTotal: "desc" } },
                    take: 5,
                });

                const topFarmers = await prisma.bill.groupBy({
                    by: ["farmerId"],
                    where: { organizationId, type: "PURCHASE", billDate: { gte: startDate, lte: endDate }, farmerId: { not: null } },
                    _sum: { netTotal: true },
                    orderBy: { _sum: { netTotal: "desc" } },
                    take: 5,
                });

                // Fetch names
                const customerIds = topCustomers.map(c => c.customerId as string);
                const farmerIds = topFarmers.map(f => f.farmerId as string);

                const [customers, farmers] = await Promise.all([
                    prisma.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, name: true } }),
                    prisma.farmer.findMany({ where: { id: { in: farmerIds } }, select: { id: true, name: true } })
                ]);

                return NextResponse.json({
                    customers: topCustomers.map(c => ({
                        name: customers.find(cust => cust.id === c.customerId)?.name || "Unknown",
                        amount: Number(c._sum.netTotal)
                    })),
                    farmers: topFarmers.map(f => ({
                        name: farmers.find(farm => farm.id === f.farmerId)?.name || "Unknown",
                        amount: Number(f._sum.netTotal)
                    }))
                });
            }

            case "ITEM_TRENDS": {
                const itemSales = await prisma.billItem.groupBy({
                    by: ["itemId"],
                    where: {
                        bill: { organizationId, type: "SALE", billDate: { gte: startDate, lte: endDate } }
                    },
                    _sum: { quantity: true, total: true },
                    orderBy: { _sum: { total: "desc" } },
                    take: 10,
                });

                const itemIds = itemSales.map(i => i.itemId);
                const items = await prisma.item.findMany({ where: { id: { in: itemIds } }, select: { id: true, name: true } });

                return NextResponse.json({
                    data: itemSales.map(i => ({
                        name: items.find(item => item.id === i.itemId)?.name || "Unknown",
                        quantity: Number(i._sum.quantity),
                        revenue: Number(i._sum.total)
                    }))
                });
            }

            default:
                return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        }
    } catch (error) {
        console.error("Insights Error:", error);
        return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
    }
}

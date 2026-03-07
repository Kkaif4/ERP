import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || !session.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // FARMER_PURCHASE, CUSTOMER_SALE, PAYMENT_HISTORY, DAILY_SUMMARY
  const startDateStr = searchParams.get("startDate");
  const endDateStr = searchParams.get("endDate");
  const partyId = searchParams.get("partyId");
  const munimRef = searchParams.get("munimRef");
  const vehicleAgentId = searchParams.get("vehicleAgentId");

  if (!type) {
    return NextResponse.json(
      { error: "Report type is required" },
      { status: 400 },
    );
  }

  const startDate = startDateStr ? new Date(startDateStr) : new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = endDateStr ? new Date(endDateStr) : new Date();
  endDate.setHours(23, 59, 59, 999);

  const organizationId = session.organizationId;

  try {
    switch (type) {
      case "FARMER_PURCHASE": {
        const where: any = {
          organizationId,
          type: "PURCHASE",
          billDate: {
            gte: startDate,
            lte: endDate,
          },
        };
        if (partyId) where.farmerId = partyId;
        if (munimRef) where.munimRef = parseInt(munimRef);
        if (vehicleAgentId) where.vehicleAgentId = vehicleAgentId;

        const bills = await prisma.bill.findMany({
          where,
          include: {
            farmer: { select: { name: true, mobile: true } },
            items: { select: { quantityKg: true, quantityUnits: true } },
          },
          orderBy: { billDate: "desc" },
        });

        return NextResponse.json({
          data: bills.map((b) => ({
            id: b.id,
            billNumber: b.billNumber,
            date: b.billDate,
            party: b.farmer?.name || "Unknown",
            amount: Number(b.netTotal),
            othersAmount: Number(b.othersAmount),
            othersNote: b.othersNote,
            status: b.status,
            totalKg: b.items.reduce(
              (acc, item) => acc + Number(item.quantityKg),
              0,
            ),
            totalUnits: b.items.reduce(
              (acc, item) => acc + Number(item.quantityUnits),
              0,
            ),
          })),
          summary: {
            totalAmount: bills.reduce((acc, b) => acc + Number(b.netTotal), 0),
            totalOthers: bills.reduce(
              (acc, b) => acc + Number(b.othersAmount),
              0,
            ),
            count: bills.length,
          },
        });
      }

      case "CUSTOMER_SALE": {
        const where: any = {
          organizationId,
          type: "SALE",
          billDate: {
            gte: startDate,
            lte: endDate,
          },
        };
        if (partyId) where.customerId = partyId;
        if (munimRef) where.munimRef = parseInt(munimRef);

        const bills = await prisma.bill.findMany({
          where,
          include: {
            customer: { select: { name: true, mobile: true } },
            items: { select: { quantityKg: true, quantityUnits: true } },
          },
          orderBy: { billDate: "desc" },
        });

        return NextResponse.json({
          data: bills.map((b) => ({
            id: b.id,
            billNumber: b.billNumber,
            date: b.billDate,
            party: b.customer?.name || "Unknown",
            amount: Number(b.netTotal),
            status: b.status,
            totalKg: b.items.reduce(
              (acc, item) => acc + Number(item.quantityKg),
              0,
            ),
            totalUnits: b.items.reduce(
              (acc, item) => acc + Number(item.quantityUnits),
              0,
            ),
          })),
          summary: {
            totalAmount: bills.reduce((acc, b) => acc + Number(b.netTotal), 0),
            count: bills.length,
          },
        });
      }

      case "PAYMENT_HISTORY": {
        const where: any = {
          organizationId,
          paymentDate: {
            gte: startDate,
            lte: endDate,
          },
        };
        if (partyId) {
          where.OR = [{ farmerId: partyId }, { customerId: partyId }];
        }

        const payments = await prisma.payment.findMany({
          where,
          include: {
            farmer: { select: { name: true } },
            customer: { select: { name: true } },
          },
          orderBy: { paymentDate: "desc" },
        });

        return NextResponse.json({
          data: payments.map((p) => ({
            id: p.id,
            date: p.paymentDate,
            party: p.farmer?.name || p.customer?.name || "General",
            amount: Number(p.amount),
            mode: p.mode,
            type: p.farmerId ? "PAYABLE" : "RECEIVABLE",
          })),
          summary: {
            totalAmount: payments.reduce((acc, p) => acc + Number(p.amount), 0),
            count: payments.length,
          },
        });
      }

      case "DAILY_SUMMARY": {
        const [purchaseBills, saleBills, payments, expenses] =
          await Promise.all([
            prisma.bill.findMany({
              where: {
                organizationId,
                type: "PURCHASE",
                billDate: { gte: startDate, lte: endDate },
              },
            }),
            prisma.bill.findMany({
              where: {
                organizationId,
                type: "SALE",
                billDate: { gte: startDate, lte: endDate },
              },
            }),
            prisma.payment.findMany({
              where: {
                organizationId,
                paymentDate: { gte: startDate, lte: endDate },
              },
            }),
            prisma.expense.findMany({
              where: {
                organizationId,
                expenseDate: { gte: startDate, lte: endDate },
                deletedAt: null,
              },
            }),
          ]);

        return NextResponse.json({
          summary: {
            purchaseTotal: purchaseBills.reduce(
              (acc, b) => acc + Number(b.netTotal),
              0,
            ),
            othersTotal: purchaseBills.reduce(
              (acc, b) => acc + Number(b.othersAmount),
              0,
            ),
            saleTotal: saleBills.reduce(
              (acc, b) => acc + Number(b.netTotal),
              0,
            ),
            paymentsOut: payments
              .filter((p) => p.farmerId)
              .reduce((acc, p) => acc + Number(p.amount), 0),
            paymentsIn: payments
              .filter((p) => p.customerId)
              .reduce((acc, p) => acc + Number(p.amount), 0),
            expenseTotal: expenses.reduce(
              (acc, e) => acc + Number(e.amount),
              0,
            ),
            billsCount: purchaseBills.length + saleBills.length,
          },
        });
      }

      case "EXPENSE_REPORT": {
        const expenses = await prisma.expense.findMany({
          where: {
            organizationId,
            expenseDate: { gte: startDate, lte: endDate },
            deletedAt: null,
          },
          orderBy: { expenseDate: "desc" },
        });

        return NextResponse.json({
          data: expenses.map((e) => ({
            id: e.id,
            date: e.expenseDate,
            category: e.category || "General",
            amount: Number(e.amount),
            mode: e.paymentMode || "CASH",
            description: e.description || "-",
          })),
          summary: {
            totalAmount: expenses.reduce((acc, e) => acc + Number(e.amount), 0),
            count: expenses.length,
          },
        });
      }

      case "VEHICLE_AGENT_REPORT": {
        const where: any = {
          organizationId,
          type: "PURCHASE",
          billDate: {
            gte: startDate,
            lte: endDate,
          },
        };
        if (vehicleAgentId) where.vehicleAgentId = vehicleAgentId;
        if (partyId) where.farmerId = partyId;

        const bills = await prisma.bill.findMany({
          where,
          include: {
            farmer: { select: { name: true } },
            vehicleAgent: { select: { name: true, vehicleNumber: true } },
          },
          orderBy: { billDate: "desc" },
        });

        return NextResponse.json({
          data: bills.map((b) => ({
            id: b.id,
            billNumber: b.billNumber,
            date: b.billDate,
            farmer: b.farmer?.name || "Unknown",
            vehicleAgent: b.vehicleAgent?.name || "N/A",
            vehicleNumber: b.vehicleAgent?.vehicleNumber || "-",
            freightCharges: Number(b.freightCharges),
            amount: Number(b.netTotal),
          })),
          summary: {
            totalFreight: bills.reduce(
              (acc, b) => acc + Number(b.freightCharges),
              0,
            ),
            totalAmount: bills.reduce((acc, b) => acc + Number(b.netTotal), 0),
            count: bills.length,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Report Error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 },
    );
  }
}

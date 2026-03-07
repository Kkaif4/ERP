import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReportPDF, ReportData } from "@/lib/pdf-generator";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || !session.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const startDateStr = searchParams.get("startDate");
  const endDateStr = searchParams.get("endDate");
  const partyId = searchParams.get("partyId");

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
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    const config = await prisma.businessConfig.findUnique({
      where: { organizationId },
    });

    if (!organization)
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );

    let reportData: ReportData = {
      title: type,
      startDate: startDate.toLocaleDateString(),
      endDate: endDate.toLocaleDateString(),
      columns: [],
      data: [],
      summaryItems: [],
    };

    switch (type) {
      case "FARMER_PURCHASE":
      case "CUSTOMER_SALE": {
        const isPurchase = type === "FARMER_PURCHASE";
        const where: any = {
          organizationId,
          type: isPurchase ? "PURCHASE" : "SALE",
          billDate: { gte: startDate, lte: endDate },
        };
        if (partyId) {
          if (isPurchase) where.farmerId = partyId;
          else where.customerId = partyId;
        }

        const bills = await prisma.bill.findMany({
          where,
          include: {
            farmer: { select: { name: true } },
            customer: { select: { name: true } },
            items: { select: { quantityKg: true, quantityUnits: true } },
          },
          orderBy: { billDate: "desc" },
        });

        reportData.columns = [
          { key: "billNumber", label: "Bill #" },
          { key: "date", label: "Date" },
          { key: "party", label: "Party" },
          { key: "totalKg", label: "Qty (KG)", align: "right" },
          { key: "totalUnits", label: "Qty (Units)", align: "right" },
          { key: "amount", label: "Amount", align: "right" },
        ];

        reportData.data = bills.map((b) => ({
          billNumber: b.billNumber,
          date: b.billDate.toLocaleDateString(),
          party: b.farmer?.name || b.customer?.name || "Unknown",
          amount: `₹ ${Number(b.netTotal).toLocaleString("en-IN")}`,
          totalKg: Number(
            b.items.reduce((acc, item) => acc + Number(item.quantityKg), 0),
          ).toFixed(2),
          totalUnits: Number(
            b.items.reduce((acc, item) => acc + Number(item.quantityUnits), 0),
          ).toFixed(2),
        }));

        reportData.summaryItems = [
          {
            label: "Total Amount",
            value: `₹ ${bills.reduce((acc, b) => acc + Number(b.netTotal), 0).toLocaleString("en-IN")}`,
            isBold: true,
          },
          { label: "Total Count", value: String(bills.length) },
        ];
        break;
      }

      case "PAYMENT_HISTORY": {
        const where: any = {
          organizationId,
          paymentDate: { gte: startDate, lte: endDate },
        };
        const payments = await prisma.payment.findMany({
          where,
          include: {
            farmer: { select: { name: true } },
            customer: { select: { name: true } },
          },
          orderBy: { paymentDate: "desc" },
        });

        reportData.columns = [
          { key: "date", label: "Date" },
          { key: "party", label: "Party" },
          { key: "amount", label: "Amount", align: "right" },
          { key: "mode", label: "Mode" },
          { key: "type", label: "Type" },
        ];

        reportData.data = payments.map((p) => ({
          date: p.paymentDate.toLocaleDateString(),
          party: p.farmer?.name || p.customer?.name || "General",
          amount: `₹ ${Number(p.amount).toLocaleString("en-IN")}`,
          mode: p.mode,
          type: p.farmerId ? "PAYABLE" : "RECEIVABLE",
        }));

        reportData.summaryItems = [
          {
            label: "Total Payments",
            value: `₹ ${payments.reduce((acc, p) => acc + Number(p.amount), 0).toLocaleString("en-IN")}`,
            isBold: true,
          },
          { label: "Count", value: String(payments.length) },
        ];
        break;
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

        const purchaseTotal = purchaseBills.reduce(
          (acc, b) => acc + Number(b.netTotal),
          0,
        );
        const saleTotal = saleBills.reduce(
          (acc, b) => acc + Number(b.netTotal),
          0,
        );
        const paymentsOut = payments
          .filter((p) => p.farmerId)
          .reduce((acc, p) => acc + Number(p.amount), 0);
        const paymentsIn = payments
          .filter((p) => p.customerId)
          .reduce((acc, p) => acc + Number(p.amount), 0);
        const expenseTotal = expenses.reduce(
          (acc, e) => acc + Number(e.amount),
          0,
        );

        reportData.dailySummary = {
          trade: [
            {
              label: "Total Sales",
              value: `₹ ${saleTotal.toLocaleString("en-IN")}`,
            },
            {
              label: "Total Purchases",
              value: `₹ ${purchaseTotal.toLocaleString("en-IN")}`,
            },
          ],
          cashFlow: [
            {
              label: "Payments Received",
              value: `₹ ${paymentsIn.toLocaleString("en-IN")}`,
            },
            {
              label: "Payments Paid",
              value: `₹ ${paymentsOut.toLocaleString("en-IN")}`,
            },
            {
              label: "Expenses",
              value: `₹ ${expenseTotal.toLocaleString("en-IN")}`,
            },
          ],
        };
        break;
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

        reportData.columns = [
          { key: "date", label: "Date" },
          { key: "category", label: "Category" },
          { key: "amount", label: "Amount", align: "right" },
          { key: "mode", label: "Mode" },
          { key: "description", label: "Description" },
        ];

        reportData.data = expenses.map((e) => ({
          date: e.expenseDate.toLocaleDateString(),
          category: e.category || "General",
          amount: `₹ ${Number(e.amount).toLocaleString("en-IN")}`,
          mode: e.paymentMode || "CASH",
          description: e.description || "-",
        }));

        reportData.summaryItems = [
          {
            label: "Total Expenses",
            value: `₹ ${expenses.reduce((acc, e) => acc + Number(e.amount), 0).toLocaleString("en-IN")}`,
            isBold: true,
          },
          { label: "Count", value: String(expenses.length) },
        ];
        break;
      }

      case "VEHICLE_AGENT_REPORT": {
        const searchParams = new URL(req.url).searchParams;
        const vId = searchParams.get("vehicleAgentId");
        const where: any = {
          organizationId,
          type: "PURCHASE",
          billDate: { gte: startDate, lte: endDate },
        };
        if (vId) where.vehicleAgentId = vId;
        if (partyId) where.farmerId = partyId;

        const bills = await prisma.bill.findMany({
          where,
          include: {
            vehicleAgent: { select: { name: true, vehicleNumber: true } },
          },
          orderBy: { billDate: "desc" },
        });

        reportData.columns = [
          { key: "agentName", label: "Agent Name" },
          { key: "vehicleNumber", label: "Vehicle Number" },
          { key: "date", label: "Date" },
          {
            key: "totalBillAmount",
            label: "Bill Total Amount",
            align: "right",
          },
        ];

        reportData.data = bills.map((b) => ({
          agentName: b.vehicleAgent?.name || "N/A",
          vehicleNumber: b.vehicleAgent?.vehicleNumber || "-",
          date: b.billDate.toLocaleDateString(),
          totalBillAmount: `₹ ${Number(b.netTotal).toLocaleString("en-IN")}`,
        }));

        const totalAmount = bills.reduce(
          (acc, b) => acc + Number(b.netTotal),
          0,
        );

        reportData.summaryItems = [
          {
            label: "Total Bill Amount",
            value: `₹ ${totalAmount.toLocaleString("en-IN")}`,
            isBold: true,
          },
          { label: "Total Bills", value: String(bills.length) },
        ];
        break;
      }
    }

    const pageSize = searchParams.get("pageSize") || undefined;
    const lang = searchParams.get("lang") || undefined;
    const isInline =
      searchParams.get("inline") === "true" ||
      searchParams.get("print") === "true";

    const pdfBuffer = await generateReportPDF(
      reportData,
      organization,
      config,
      { pageSize, lang },
    );

    const filename = `report-${type}-${startDateStr}.pdf`;
    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": isInline
          ? `inline; filename="${filename}"`
          : `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Report PDF Error:", error);
    return NextResponse.json(
      { error: "Failed to generate report PDF" },
      { status: 500 },
    );
  }
}

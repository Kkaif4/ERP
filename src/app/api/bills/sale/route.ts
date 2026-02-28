import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saleBillSchema } from "@/lib/schemas";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !session.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validationResult = saleBillSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 },
      );
    }
    const { customerId, items } = validationResult.data;

    // Fetch Customer
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, organizationId: session.organizationId },
    });
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    // Fetch Business Config
    const config = await prisma.businessConfig.findUnique({
      where: { organizationId: session.organizationId },
    });

    // Stock Validation
    const { getBatchAvailableStock } = await import("@/lib/inventory");
    const requestedItemIds = Array.from(new Set(items.map((i: any) => i.itemId)));
    const [stockMap, dbItems] = await Promise.all([
      getBatchAvailableStock(requestedItemIds, session.organizationId!),
      prisma.item.findMany({
        where: { id: { in: requestedItemIds }, organizationId: session.organizationId },
        select: { id: true, name: true }
      })
    ]);

    const itemNamesMap = Object.fromEntries(dbItems.map(i => [i.id, i.name]));

    for (const item of items) {
      const stock = stockMap[item.itemId];
      const itemName = itemNamesMap[item.itemId] || "Selected Item";

      const availKg = stock?.availableKg || 0;
      const availUnits = stock?.availableUnits || 0;

      if (item.quantityKg > availKg) {
        return NextResponse.json(
          { error: `Insufficient stock for ${itemName}. Available: ${availKg} KG, Requested: ${item.quantityKg} KG` },
          { status: 400 }
        );
      }
      if (item.quantityUnits > availUnits) {
        return NextResponse.json(
          { error: `Insufficient stock for ${itemName}. Available: ${availUnits} Units, Requested: ${item.quantityUnits} Units` },
          { status: 400 }
        );
      }
    }

    // 1. Item Subtotal
    let subtotal = 0;
    const lineItems = items.map((item: any) => {
      let lineTotal = 0;
      if (item.pricingMode === "WEIGHT") {
        lineTotal = (item.quantity / 10) * item.pricePerUnit;
      } else if (item.pricingMode === "WEIGHT_KG") {
        lineTotal = item.quantity * item.pricePerUnit;
      } else {
        lineTotal = item.quantity * item.pricePerUnit;
      }
      subtotal += lineTotal;
      return {
        itemId: item.itemId,
        pricingMode: item.pricingMode,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        total: lineTotal,
        quantityKg: item.quantityKg,
        quantityUnits: item.quantityUnits,
      };
    });

    // 2. Tax and Service Charge
    let taxAmount = 0;
    let serviceChargeAmount = 0;

    if (config) {
      taxAmount =
        config.taxType === "PERCENTAGE"
          ? subtotal * (Number(config.taxValue) / 100)
          : Number(config.taxValue);

      serviceChargeAmount =
        config.serviceChargeType === "PERCENTAGE"
          ? subtotal * (Number(config.serviceChargeValue) / 100)
          : Number(config.serviceChargeValue);
    }

    // 3. Totals
    const grossTotal = subtotal + taxAmount + serviceChargeAmount;
    const netTotal = grossTotal;

    // 5. Generate Bill Number
    const lastBill = await prisma.bill.findFirst({
      where: { organizationId: session.organizationId, type: "SALE" },
      orderBy: { createdAt: "desc" },
      select: { billNumber: true },
    });

    let nextNum = 1;
    if (lastBill) {
      const lastNum = parseInt(lastBill.billNumber.split("-")[1]);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const billNumber = `SAL-${nextNum.toString().padStart(4, "0")}`;

    // 6. Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create Bill
      const bill = await tx.bill.create({
        data: {
          organizationId: session.organizationId!,
          billNumber,
          type: "SALE",
          customerId,
          subtotal,
          labourCharges: 0,
          freightCharges: 0,
          taxAmount,
          serviceChargeAmount,
          grossTotal,
          advanceDeduction: 0,
          netTotal,
          createdById: session.userId,
          items: {
            create: lineItems,
          },
        },
        include: { items: true },
      });

      // Update Customer Balance
      await tx.customer.update({
        where: { id: customerId },
        data: {
          balance: { increment: netTotal },
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entity: "BILL",
          entityId: bill.id,
          newValue: bill as any,
          userId: session.userId,
          organizationId: session.organizationId!,
        },
      });

      return bill;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Sale Bill Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

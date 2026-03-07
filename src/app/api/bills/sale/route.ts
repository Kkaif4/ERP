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
    const {
      customerId,
      items,
      labourCharges = 0,
      freightCharges = 0,
      advanceDeduction = 0,
      othersAmount = 0,
      othersNote = "",
      munimRef,
    } = validationResult.data;

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
    const previousBalance = Number(customer.balance);

    // Fetch Business Config
    const config = await prisma.businessConfig.findUnique({
      where: { organizationId: session.organizationId },
    });

    // Stock Validation
    if (config?.enableStockRestriction) {
      const { getBatchAvailableStock } = await import("@/lib/inventory");
      const requestedItemIds = Array.from(
        new Set(items.map((i: any) => i.itemId)),
      );
      const [stockMap, dbItems] = await Promise.all([
        getBatchAvailableStock(requestedItemIds, session.organizationId!),
        prisma.item.findMany({
          where: {
            id: { in: requestedItemIds },
            organizationId: session.organizationId,
          },
          select: { id: true, name: true },
        }),
      ]);

      const itemNamesMap = Object.fromEntries(
        dbItems.map((i) => [i.id, i.name]),
      );

      for (const item of items) {
        const stock = stockMap[item.itemId];
        const itemName = itemNamesMap[item.itemId] || "Selected Item";

        const availKg = stock?.availableKg || 0;
        const availUnits = stock?.availableUnits || 0;

        if (item.quantityKg > availKg) {
          return NextResponse.json(
            {
              error: `Insufficient stock for ${itemName}. Available: ${availKg} KG, Requested: ${item.quantityKg} KG`,
            },
            { status: 400 },
          );
        }
        if (item.quantityUnits > availUnits) {
          return NextResponse.json(
            {
              error: `Insufficient stock for ${itemName}. Available: ${availUnits} Units, Requested: ${item.quantityUnits} Units`,
            },
            { status: 400 },
          );
        }
      }
    }

    // 5. Fetch Organization Billing Method
    const organization = await prisma.organization.findUnique({
      where: { id: session.organizationId! },
      select: { billingMethod: true },
    });

    // 6. Check for Pending Bill (Consolidation)
    let existingBill = null;
    if (organization?.billingMethod === "CUSTOM") {
      existingBill = await prisma.bill.findFirst({
        where: {
          organizationId: session.organizationId,
          customerId,
          status: "PENDING",
          type: "SALE",
        },
        include: { items: true },
      });
    }

    // Recalculate Subtotal and merge items if consolidating
    let subtotal = 0;
    let netTotalChange = 0;

    // Convert current request items into line item objects
    const requestLineItems = items.map((item: any) => {
      let lineTotal = 0;
      if (item.pricingMode === "WEIGHT") {
        lineTotal = (item.quantity / 10) * item.pricePerUnit;
      } else {
        lineTotal = item.quantity * item.pricePerUnit;
      }
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

    // ── Database Transaction ──
    const result = await prisma.$transaction(async (tx) => {
      let finalBill;

      if (existingBill) {
        // CONSOLIDATION LOGIC
        // 1. Calculate new overall subtotal
        // Sum existing items in DB + new items from request
        const existingSubtotal = Number(existingBill.subtotal);
        const newItemsSubtotal = requestLineItems.reduce((acc, i) => acc + i.total, 0);
        const totalSubtotal = existingSubtotal + newItemsSubtotal;

        // 2. Recalculate Tax & Service Charge on OVERALL subtotal
        let taxAmount = 0;
        let serviceChargeAmount = 0;
        if (config) {
          taxAmount = config.taxType === "PERCENTAGE"
            ? totalSubtotal * (Number(config.taxValue) / 100)
            : Number(config.taxValue);
          serviceChargeAmount = config.serviceChargeType === "PERCENTAGE"
            ? totalSubtotal * (Number(config.serviceChargeValue) / 100)
            : Number(config.serviceChargeValue);
        }

        const grossTotal = totalSubtotal + taxAmount + serviceChargeAmount;
        const netTotal = grossTotal;
        netTotalChange = netTotal - Number(existingBill.netTotal);

        // 3. Update the Bill
        finalBill = await tx.bill.update({
          where: { id: existingBill.id },
          data: {
            subtotal: totalSubtotal,
            taxAmount,
            serviceChargeAmount,
            grossTotal,
            netTotal,
            finalAmount: netTotal + Number(existingBill.previousBalance),
            items: {
              create: requestLineItems,
            },
          },
          include: { items: true },
        });
      } else {
        // STANDARD CREATE LOGIC (or first PENDING bill)
        const subtotal = requestLineItems.reduce((acc, i) => acc + i.total, 0);
        let taxAmount = 0;
        let serviceChargeAmount = 0;
        if (config) {
          taxAmount = config.taxType === "PERCENTAGE" ? subtotal * (Number(config.taxValue) / 100) : Number(config.taxValue);
          serviceChargeAmount = config.serviceChargeType === "PERCENTAGE" ? subtotal * (Number(config.serviceChargeValue) / 100) : Number(config.serviceChargeValue);
        }
        const grossTotal = subtotal + taxAmount + serviceChargeAmount;
        const netTotal = grossTotal;
        netTotalChange = netTotal;

        // Generate Bill Number
        const lastBill = await tx.bill.findFirst({
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

        finalBill = await tx.bill.create({
          data: {
            organizationId: session.organizationId!,
            billNumber,
            type: "SALE",
            customerId,
            subtotal,
            taxAmount,
            serviceChargeAmount,
            grossTotal,
            netTotal,
            previousBalance,
            finalAmount: netTotal + previousBalance,
            createdById: session.userId,
            status: organization?.billingMethod === "CUSTOM" ? "PENDING" : "PAID",
            items: {
              create: requestLineItems,
            },
          },
          include: { items: true },
        });
      }

      // Update Customer Balance by the net change
      await tx.customer.update({
        where: { id: customerId },
        data: {
          balance: { increment: netTotalChange },
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          action: existingBill ? "UPDATE" : "CREATE",
          entity: "BILL",
          entityId: finalBill.id,
          newValue: finalBill as any,
          userId: session.userId,
          organizationId: session.organizationId!,
        },
      });

      return finalBill;
    });

    // 7. Sync Stock (Non-blocking or awaited)
    const uniqueItemIds = Array.from(new Set(items.map((i: any) => i.itemId)));
    const { syncItemStock } = await import("@/lib/inventory");
    await Promise.all(
      uniqueItemIds.map((itemId: any) =>
        syncItemStock(itemId, session.organizationId!),
      ),
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Sale Bill Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

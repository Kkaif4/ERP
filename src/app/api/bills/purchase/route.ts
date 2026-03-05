import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { purchaseBillSchema } from "@/lib/schemas";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !session.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validationResult = purchaseBillSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 },
      );
    }
    const {
      farmerId,
      items,
      labourCharges = 0,
      freightCharges = 0,
      advanceDeduction = 0,
      othersAmount = 0,
      othersNote = "",
      vehicleAgentId,
      munimRef,
    } = validationResult.data;

    // Fetch Farmer
    const farmer = await prisma.farmer.findFirst({
      where: { id: farmerId, organizationId: session.organizationId },
    });
    if (!farmer) {
      return NextResponse.json({ error: "Farmer not found" }, { status: 404 });
    }
    const previousBalance = Number(farmer.balance);

    // 1. Fetch Business Config & Calculate Line Totals
    const config = await prisma.businessConfig.findUnique({
      where: { organizationId: session.organizationId },
    });

    let subtotal = 0;
    let totalUnits = 0;
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
      totalUnits += Number(item.quantityUnits || 0);
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

    // 2. Adjust Labour Charges if setting is active
    let finalLabourCharges = Number(labourCharges);
    if (config && Number(config.laborChargePerUnit) > 0) {
      finalLabourCharges = totalUnits * Number(config.laborChargePerUnit);
    }

    // 3. Base for Net Total (Subtotal - Labour - Freight - Advance)
    const lc = finalLabourCharges;
    const fc = Number(freightCharges);
    const ad = Number(advanceDeduction);
    const oa = Number(othersAmount);

    const grossTotal = subtotal; // No tax/service on purchase
    const netTotal = subtotal - lc - fc - ad - oa;
    const finalAmount = netTotal + previousBalance;

    // 4. Generate Bill Number
    const lastBill = await prisma.bill.findFirst({
      where: { organizationId: session.organizationId, type: "PURCHASE" },
      orderBy: { createdAt: "desc" },
      select: { billNumber: true },
    });

    let nextNum = 1;
    if (lastBill) {
      const lastNum = parseInt(lastBill.billNumber.split("-")[1]);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const billNumber = `PUR-${nextNum.toString().padStart(4, "0")}`;

    // 5. Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create Bill
      const bill = await tx.bill.create({
        data: {
          organizationId: session.organizationId!,
          billNumber,
          type: "PURCHASE",
          farmerId,
          subtotal,
          labourCharges: lc,
          freightCharges: fc,
          taxAmount: 0,
          serviceChargeAmount: 0,
          grossTotal,
          othersAmount: oa,
          othersNote,
          advanceDeduction: ad,
          netTotal,
          previousBalance,
          finalAmount,
          createdById: session.userId,
          vehicleAgentId,
          munimRef,
          items: {
            create: lineItems,
          },
        },
        include: { items: true },
      });

      // Update Farmer Balance
      await tx.farmer.update({
        where: { id: farmerId },
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

    // 5. Sync Stock (Non-blocking or awaited)
    const uniqueItemIds = Array.from(new Set(items.map((i: any) => i.itemId)));
    const { syncItemStock } = await import("@/lib/inventory");
    await Promise.all(
      uniqueItemIds.map((itemId: any) =>
        syncItemStock(itemId, session.organizationId!),
      ),
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Farmer Bill Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { billStatusUpdateSchema } from "@/lib/schemas";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || !session.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = await req.json();
    const validationResult = billStatusUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 },
      );
    }

    const { status: newStatus } = validationResult.data;

    const bill = await prisma.bill.findUnique({
      where: { id, organizationId: session.organizationId },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    if (bill.status === "PAID") {
      return NextResponse.json(
        { error: "Bill is already marked as PAID" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Bill Status
      const updatedBill = await tx.bill.update({
        where: { id },
        data: { status: newStatus },
      });

      // 2. record payment and update balance
      if (bill.type === "PURCHASE" && bill.farmerId) {
        // Create Payment record for the bill settlement
        await tx.payment.create({
          data: {
            organizationId: session.organizationId!,
            farmerId: bill.farmerId,
            billId: bill.id,
            amount: bill.netTotal,
            mode: "CASH", // Defaulting to CASH for now
            notes: `Settlement for Bill ${bill.billNumber}`,
            recordedById: session.userId,
            paymentDate: new Date(),
          },
        });

        await tx.farmer.update({
          where: { id: bill.farmerId },
          data: {
            balance: { decrement: bill.netTotal },
          },
        });
      } else if (bill.type === "SALE" && bill.customerId) {
        // Create Payment record for the customer payment
        await tx.payment.create({
          data: {
            organizationId: session.organizationId!,
            customerId: bill.customerId,
            billId: bill.id,
            amount: bill.netTotal,
            mode: "CASH",
            notes: `Settlement for Bill ${bill.billNumber}`,
            recordedById: session.userId,
            paymentDate: new Date(),
          },
        });

        await tx.customer.update({
          where: { id: bill.customerId },
          data: {
            balance: { decrement: bill.netTotal },
          },
        });
      }

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "BILL_STATUS",
          entityId: id,
          newValue: { status: newStatus } as any,
          oldValue: { status: bill.status } as any,
          userId: session.userId,
          organizationId: session.organizationId!,
        },
      });

      return updatedBill;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Bill Status Update Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update bill status" },
      { status: 500 },
    );
  }
}

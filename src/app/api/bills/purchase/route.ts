import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getSession();
    if (!session || !session.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { farmerId, items } = body;

        if (!farmerId || !items || items.length === 0) {
            return NextResponse.json({ error: "Farmer and items are required" }, { status: 400 });
        }

        // Fetch Farmer
        const farmer = await prisma.farmer.findFirst({
            where: { id: farmerId, organizationId: session.organizationId }
        });
        if (!farmer) {
            return NextResponse.json({ error: "Farmer not found" }, { status: 404 });
        }

        // Fetch Business Config
        const config = await prisma.businessConfig.findUnique({
            where: { organizationId: session.organizationId }
        });

        // 1. Calculate Line Totals and Subtotal
        let subtotal = 0;
        const lineItems = items.map((item: any) => {
            let lineTotal = 0;
            if (item.pricingMode === "WEIGHT") {
                lineTotal = (item.quantity / 10) * item.pricePerUnit;
            } else {
                lineTotal = item.quantity * item.pricePerUnit;
            }
            subtotal += lineTotal;
            return {
                itemId: item.itemId,
                pricingMode: item.pricingMode,
                quantity: item.quantity,
                pricePerUnit: item.pricePerUnit,
                total: lineTotal
            };
        });

        // 2. Calculate Additional Charges
        let taxAmount = 0;
        let serviceChargeAmount = 0;

        if (config) {
            taxAmount = config.taxType === "PERCENTAGE"
                ? subtotal * (Number(config.taxValue) / 100)
                : Number(config.taxValue);

            serviceChargeAmount = config.serviceChargeType === "PERCENTAGE"
                ? subtotal * (Number(config.serviceChargeValue) / 100)
                : Number(config.serviceChargeValue);
        }

        const netTotal = subtotal + taxAmount + serviceChargeAmount;

        // 3. Generate Bill Number
        const lastBill = await prisma.bill.findFirst({
            where: { organizationId: session.organizationId, type: "PURCHASE" },
            orderBy: { createdAt: "desc" },
            select: { billNumber: true }
        });

        let nextNum = 1;
        if (lastBill) {
            const lastNum = parseInt(lastBill.billNumber.split("-")[1]);
            if (!isNaN(lastNum)) nextNum = lastNum + 1;
        }
        const billNumber = `PUR-${nextNum.toString().padStart(4, "0")}`;

        // 4. Database Transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create Bill
            const bill = await tx.bill.create({
                data: {
                    organizationId: session.organizationId!,
                    billNumber,
                    type: "PURCHASE",
                    farmerId,
                    subtotal,
                    taxAmount,
                    serviceChargeAmount,
                    grossTotal: netTotal,
                    netTotal,
                    createdById: session.userId,
                    items: {
                        create: lineItems
                    }
                },
                include: { items: true }
            });

            // Update Farmer Balance
            await tx.farmer.update({
                where: { id: farmerId },
                data: {
                    balance: { increment: netTotal }
                }
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
                }
            });

            return bill;
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Purchase Bill Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

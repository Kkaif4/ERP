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
        const {
            customerId,
            items,
            labourCharges = 0,
            freightCharges = 0,
            advanceDeduction = 0
        } = body;

        if (!customerId || !items || items.length === 0) {
            return NextResponse.json({ error: "Customer and items are required" }, { status: 400 });
        }

        // Fetch Customer
        const customer = await prisma.customer.findFirst({
            where: { id: customerId, organizationId: session.organizationId }
        });
        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        // Fetch Business Config
        const config = await prisma.businessConfig.findUnique({
            where: { organizationId: session.organizationId }
        });

        // 1. Item Subtotal
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

        // 2. Base for Tax (Subtotal + Labour + Freight)
        const subtotalWithCharges = subtotal + Number(labourCharges) + Number(freightCharges);

        // 3. Tax and Service Charge
        let taxAmount = 0;
        let serviceChargeAmount = 0;

        if (config) {
            taxAmount = config.taxType === "PERCENTAGE"
                ? subtotalWithCharges * (Number(config.taxValue) / 100)
                : Number(config.taxValue);

            serviceChargeAmount = config.serviceChargeType === "PERCENTAGE"
                ? subtotalWithCharges * (Number(config.serviceChargeValue) / 100)
                : Number(config.serviceChargeValue);
        }

        // 4. Totals
        const grossTotal = subtotalWithCharges + taxAmount + serviceChargeAmount;
        const netTotal = grossTotal - Number(advanceDeduction);

        // 5. Generate Bill Number
        const lastBill = await prisma.bill.findFirst({
            where: { organizationId: session.organizationId, type: "SALE" },
            orderBy: { createdAt: "desc" },
            select: { billNumber: true }
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
                    labourCharges: Number(labourCharges),
                    freightCharges: Number(freightCharges),
                    taxAmount,
                    serviceChargeAmount,
                    grossTotal,
                    advanceDeduction: Number(advanceDeduction),
                    netTotal,
                    createdById: session.userId,
                    items: {
                        create: lineItems
                    }
                },
                include: { items: true }
            });

            // Update Customer Balance
            await tx.customer.update({
                where: { id: customerId },
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
        console.error("Sale Bill Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

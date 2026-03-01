import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { businessConfigSchema } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    const session = await getSession();
    if (!session || !session.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let config = await prisma.businessConfig.findUnique({
        where: { organizationId: session.organizationId },
    });

    if (!config) {
        config = await prisma.businessConfig.create({
            data: {
                organizationId: session.organizationId,
                taxType: "PERCENTAGE",
                taxValue: 0,
                serviceChargeType: "PERCENTAGE",
                serviceChargeValue: 0,
            },
        });
    }

    return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
    const session = await getSession();
    if (!session || !session.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "ORG_STAFF") {
        return NextResponse.json({ error: "Only admins can update settings" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const validationResult = businessConfigSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json({ error: validationResult.error.issues[0].message }, { status: 400 });
        }
        const {
            taxType,
            taxValue,
            serviceChargeType,
            serviceChargeValue,
            upiId,
            defaultPageSize,
            city,
            enableStockRestriction,
        } = validationResult.data;

        const config = await prisma.$transaction(async (tx) => {

            const updated = await tx.businessConfig.upsert({
                where: { organizationId: session.organizationId },
                update: {
                    taxType,
                    taxValue,
                    serviceChargeType,
                    serviceChargeValue,
                    upiId,
                    defaultPageSize,
                    city,
                    enableStockRestriction,
                },
                create: {
                    organizationId: session.organizationId,
                    taxType,
                    taxValue,
                    serviceChargeType,
                    serviceChargeValue,
                    upiId,
                    defaultPageSize,
                    city,
                    enableStockRestriction,
                },
            });

            await tx.auditLog.create({
                data: {
                    action: "UPDATE",
                    entity: "BUSINESS_CONFIG",
                    entityId: updated.id,
                    newValue: updated as any,
                    userId: session.userId,
                    organizationId: session.organizationId!,
                }
            });

            return updated;
        });

        return NextResponse.json(config);
    } catch (error: any) {
        return NextResponse.json({ error: error.message ?? "Failed to update configuration" }, { status: 500 });
    }
}

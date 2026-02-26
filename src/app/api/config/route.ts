import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    if (session.role !== "ORG_ADMIN") {
        return NextResponse.json({ error: "Only organization admins can update settings" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const {
            taxType,
            taxValue,
            serviceChargeType,
            serviceChargeValue,
        } = body as {
            taxType: "PERCENTAGE" | "FIXED";
            taxValue: number;
            serviceChargeType: "PERCENTAGE" | "FIXED";
            serviceChargeValue: number;
        };

        const validTypes = ["PERCENTAGE", "FIXED"];

        if (!validTypes.includes(taxType) || !validTypes.includes(serviceChargeType)) {
            return NextResponse.json({ error: "Invalid charge type" }, { status: 400 });
        }

        if (typeof taxValue !== "number" || typeof serviceChargeValue !== "number") {
            return NextResponse.json({ error: "Values must be numbers" }, { status: 400 });
        }

        if (taxType === "PERCENTAGE" && (taxValue < 0 || taxValue > 100)) {
            return NextResponse.json({ error: "Tax percentage must be between 0 and 100" }, { status: 400 });
        }

        if (serviceChargeType === "PERCENTAGE" && (serviceChargeValue < 0 || serviceChargeValue > 100)) {
            return NextResponse.json({ error: "Service charge percentage must be between 0 and 100" }, { status: 400 });
        }

        if (taxType === "FIXED" && taxValue < 0) {
            return NextResponse.json({ error: "Tax amount cannot be negative" }, { status: 400 });
        }

        if (serviceChargeType === "FIXED" && serviceChargeValue < 0) {
            return NextResponse.json({ error: "Service charge amount cannot be negative" }, { status: 400 });
        }

        const config = await prisma.$transaction(async (tx) => {
            const updated = await tx.businessConfig.upsert({
                where: { organizationId: session.organizationId },
                update: {
                    taxType,
                    taxValue,
                    serviceChargeType,
                    serviceChargeValue,
                },
                create: {
                    organizationId: session.organizationId,
                    taxType,
                    taxValue,
                    serviceChargeType,
                    serviceChargeValue,
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

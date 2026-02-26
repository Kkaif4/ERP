import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getSession();
    if (!session || !session.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let config = await prisma.businessConfig.findUnique({
        where: { organizationId: session.organizationId },
    });

    if (!config) {
        // Create default config if not found
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

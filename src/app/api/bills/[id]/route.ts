import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session || !session.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    try {
        const bill = await prisma.bill.findUnique({
            where: {
                id,
                organizationId: session.organizationId,
            },
            include: {
                organization: { select: { name: true, phone: true, address: true } },
                farmer: { select: { name: true, mobile: true, address: true } },
                customer: { select: { name: true, mobile: true, address: true } },
                createdBy: { select: { name: true } },
                items: {
                    include: {
                        item: { select: { name: true } }
                    },
                    orderBy: { createdAt: "asc" }
                }
            }
        });

        if (!bill) {
            return NextResponse.json({ error: "Bill not found" }, { status: 404 });
        }

        return NextResponse.json(bill);
    } catch (error) {
        console.error("Fetch Bill Error:", error);
        return NextResponse.json({ error: "Failed to fetch bill" }, { status: 500 });
    }
}

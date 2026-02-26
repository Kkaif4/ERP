import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getSession();
    if (!session || !session.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "ALL";
    const search = searchParams.get("search") || "";

    const where: any = {
        organizationId: session.organizationId,
    };

    if (type === "PURCHASE") where.type = "PURCHASE";
    if (type === "SALE") where.type = "SALE";

    if (search) {
        where.OR = [
            { billNumber: { contains: search, mode: "insensitive" } },
            {
                farmer: {
                    name: { contains: search, mode: "insensitive" }
                }
            },
            {
                customer: {
                    name: { contains: search, mode: "insensitive" }
                }
            },
        ];
    }

    const bills = await prisma.bill.findMany({
        where,
        include: {
            farmer: { select: { name: true } },
            customer: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    const formattedBills = bills.map((b) => ({
        id: b.id,
        billNumber: b.billNumber,
        type: b.type,
        party: b.farmer?.name ?? b.customer?.name ?? "—",
        netTotal: Number(b.netTotal),
        billDate: b.billDate,
    }));

    return NextResponse.json(formattedBills);
}

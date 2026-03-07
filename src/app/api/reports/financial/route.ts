import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || !session.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "ORG_ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: Admin access required" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // OUTSTANDING_PAYABLES, OUTSTANDING_RECEIVABLES
  const organizationId = session.organizationId;

  try {
    switch (type) {
      case "OUTSTANDING_PAYABLES": {
        const farmers = await prisma.farmer.findMany({
          where: { organizationId, balance: { gt: 0 } },
          select: { id: true, name: true, mobile: true, balance: true },
          orderBy: { balance: "desc" },
        });

        const formatted = farmers.map((f) => ({
          id: f.id,
          party: f.name,
          mobile: f.mobile,
          amount: Number(f.balance),
        }));

        return NextResponse.json({
          data: formatted,
          summary: {
            totalAmount: formatted.reduce((acc, f) => acc + f.amount, 0),
            count: formatted.length,
          },
        });
      }

      case "OUTSTANDING_RECEIVABLES": {
        const customers = await prisma.customer.findMany({
          where: { organizationId, balance: { gt: 0 } },
          select: { id: true, name: true, mobile: true, balance: true },
          orderBy: { balance: "desc" },
        });

        const formatted = customers.map((c) => ({
          id: c.id,
          party: c.name,
          mobile: c.mobile,
          amount: Number(c.balance),
        }));

        return NextResponse.json({
          data: formatted,
          summary: {
            totalAmount: formatted.reduce((acc, c) => acc + c.amount, 0),
            count: formatted.length,
          },
        });
      }

      default: {
        const [payables, receivables] = await Promise.all([
          prisma.farmer.aggregate({
            where: { organizationId, balance: { gt: 0 } },
            _sum: { balance: true },
            _count: { id: true },
          }),
          prisma.customer.aggregate({
            where: { organizationId, balance: { gt: 0 } },
            _sum: { balance: true },
            _count: { id: true },
          }),
        ]);

        return NextResponse.json({
          summary: {
            totalPayable: Number(payables._sum.balance || 0),
            countPayable: payables._count.id,
            totalReceivable: Number(receivables._sum.balance || 0),
            countReceivable: receivables._count.id,
          },
        });
      }
    }
  } catch (error) {
    console.error("Financial Report Error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 },
    );
  }
}

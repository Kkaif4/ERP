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
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const sort = searchParams.get("sort") || "desc";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const where: any = {
    organizationId: session.organizationId,
  };

  if (type === "PURCHASE") where.type = "PURCHASE";
  if (type === "SALE") where.type = "SALE";

  if (startDate || endDate) {
    where.billDate = {};
    if (startDate) where.billDate.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.billDate.lte = end;
    }
  }

  if (search) {
    where.OR = [
      { billNumber: { contains: search, mode: "insensitive" } },
      {
        farmer: {
          name: { contains: search, mode: "insensitive" },
        },
      },
      {
        customer: {
          name: { contains: search, mode: "insensitive" },
        },
      },
    ];
  }

  const [total, bills] = await Promise.all([
    prisma.bill.count({ where }),
    prisma.bill.findMany({
      where,
      include: {
        farmer: { select: { name: true } },
        customer: { select: { name: true } },
      },
      orderBy: { billDate: sort as "asc" | "desc" },
      skip,
      take: limit,
    }),
  ]);

  const formattedBills = bills.map((b) => ({
    id: b.id,
    billNumber: b.billNumber,
    type: b.type,
    status: b.status,
    party: b.farmer?.name ?? b.customer?.name ?? "—",
    netTotal: Number(b.netTotal),
    billDate: b.billDate,
  }));

  return NextResponse.json({
    data: formattedBills,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

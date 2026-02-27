import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { paymentSchema } from "@/lib/schemas";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const farmerId = searchParams.get("farmerId");
  const customerId = searchParams.get("customerId");
  const type = searchParams.get("type"); // FARMER or CUSTOMER
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const where: any = {
    organizationId: session.organizationId!,
  };

  if (farmerId) where.farmerId = farmerId;
  if (customerId) where.customerId = customerId;
  if (type === "FARMER") where.farmerId = { not: null };
  if (type === "CUSTOMER") where.customerId = { not: null };

  if (search) {
    where.OR = [
      { farmer: { name: { contains: search, mode: "insensitive" } } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      include: {
        farmer: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        bill: { select: { id: true, billNumber: true } },
        recordedBy: { select: { name: true } },
      },
      orderBy: { paymentDate: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    data: payments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const result = paymentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }
    const {
      farmerId,
      customerId,
      billId,
      amount,
      mode,
      notes,
      paymentDate,
      roundOff,
      roundOffAmount,
    } = result.data;

    const paymentRecord = await prisma.$transaction(async (tx) => {
      // Create the payment record
      const payment = await tx.payment.create({
        data: {
          organizationId: session.organizationId!,
          farmerId: farmerId || null,
          customerId: customerId || null,
          billId: billId || null,
          amount,
          roundOffAmount: roundOff ? roundOffAmount : 0,
          mode,
          notes: notes || null,
          paymentDate: new Date(paymentDate),
          recordedById: session.userId,
        },
      });

      if (roundOff && roundOffAmount > 0) {
        await tx.expense.create({
          data: {
            organizationId: session.organizationId!,
            paymentId: payment.id,
            category: "ROUND_OFF",
            amount: roundOffAmount,
            description: `Round-off adjustment for payment`,
          },
        });
      }

      const totalDeduction = amount + (roundOff ? roundOffAmount : 0);

      // Update balance
      if (farmerId) {
        await tx.farmer.update({
          where: { id: farmerId },
          data: { balance: { decrement: totalDeduction } },
        });
      } else if (customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: { balance: { decrement: totalDeduction } },
        });
      }

      return payment;
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "PAYMENT",
        entityId: paymentRecord.id,
        newValue: paymentRecord as any,
        userId: session.userId,
        organizationId: session.organizationId!,
      },
    });

    return NextResponse.json(paymentRecord);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

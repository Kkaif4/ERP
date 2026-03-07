import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: session.organizationId! },
    select: {
      id: true,
      name: true,
      mobile: true,
      balance: true,
      openingBalance: true,
      openingBalanceType: true,
      openingBalanceDate: true,
    },
  });
  if (!customer)
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const [bills, payments] = await Promise.all([
    prisma.bill.findMany({
      where: {
        customerId: id,
        organizationId: session.organizationId!,
        type: "SALE",
      },
      select: {
        id: true,
        billNumber: true,
        billDate: true,
        netTotal: true,
        status: true,
        items: { select: { item: { select: { name: true } } } },
      },
      orderBy: { billDate: "asc" },
    }),
    prisma.payment.findMany({
      where: { customerId: id, organizationId: session.organizationId! },
      select: {
        id: true,
        amount: true,
        roundOffAmount: true,
        mode: true,
        notes: true,
        paymentDate: true,
        recordedBy: { select: { name: true } },
      },
      orderBy: { paymentDate: "asc" },
    }),
  ]);

  type Entry = {
    id: string;
    date: Date;
    type: "BILL" | "PAYMENT" | "OPENING";
    description: string;
    debit: number;
    credit: number;
    meta?: string;
  };

  const entries: Entry[] = [
    ...(Number(customer.openingBalance) > 0
      ? [
          {
            id: "opening",
            date: customer.openingBalanceDate,
            type: "OPENING" as const,
            description: "ledger.openingBalance",
            debit:
              customer.openingBalanceType === "DUE"
                ? Number(customer.openingBalance)
                : 0,
            credit:
              customer.openingBalanceType === "ADVANCE"
                ? Number(customer.openingBalance)
                : 0,
            meta:
              customer.openingBalanceType === "ADVANCE"
                ? "Advance / Credit"
                : "Outstanding Due",
          },
        ]
      : []),
    ...bills.map((b) => ({
      id: b.id,
      date: b.billDate,
      type: "BILL" as const,
      description: b.billNumber,
      debit: Number(b.netTotal),
      credit: 0, // debit = customer owes us
      meta: `${b.items.map((i) => i.item.name).join(", ")} (${b.status})`,
    })),
    ...payments.flatMap((p) => {
      const pEntry = {
        id: p.id,
        date: p.paymentDate,
        type: "PAYMENT" as const,
        description: `ledger.paymentWithMode|${p.mode.replace("_", " ")}`,
        debit: 0,
        credit: Number(p.amount), // credit = customer paying us
        meta:
          p.notes ||
          (p.recordedBy?.name ? `Recorded by ${p.recordedBy.name}` : ""),
      };
      if (Number(p.roundOffAmount) > 0) {
        return [
          pEntry,
          {
            id: `${p.id}-ro`,
            date: p.paymentDate,
            type: "PAYMENT" as const,
            description: "ledger.roundOffAdjustment",
            debit: 0,
            credit: Number(p.roundOffAmount),
            meta: "Settled balance",
          },
        ];
      }
      return [pEntry];
    }),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const pendingBills = bills.filter((b) => b.status === "PENDING");

  let running = 0;
  const ledger = entries.map((e) => {
    running += e.debit - e.credit;
    return { ...e, runningBalance: running };
  });

  return NextResponse.json({ customer, ledger, pendingBills });
}

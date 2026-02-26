import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const farmer = await prisma.farmer.findFirst({
        where: { id: params.id, organizationId: session.organizationId! },
        select: { id: true, name: true, mobile: true, balance: true },
    });
    if (!farmer) return NextResponse.json({ error: "Farmer not found" }, { status: 404 });

    const [bills, payments] = await Promise.all([
        prisma.bill.findMany({
            where: { farmerId: params.id, organizationId: session.organizationId!, type: "PURCHASE" },
            select: { id: true, billNumber: true, billDate: true, netTotal: true, items: { select: { item: { select: { name: true } } } } },
            orderBy: { billDate: "asc" },
        }),
        prisma.payment.findMany({
            where: { farmerId: params.id, organizationId: session.organizationId! },
            select: { id: true, amount: true, mode: true, notes: true, paymentDate: true, recordedBy: { select: { name: true } } },
            orderBy: { paymentDate: "asc" },
        }),
    ]);

    // Combine into chronological ledger entries
    type Entry = {
        id: string; date: Date; type: "BILL" | "PAYMENT";
        description: string; debit: number; credit: number; meta?: string;
    };

    const entries: Entry[] = [
        ...bills.map(b => ({
            id: b.id, date: b.billDate, type: "BILL" as const,
            description: b.billNumber,
            debit: 0, credit: Number(b.netTotal), // credit = we owe farmer
            meta: b.items.map(i => i.item.name).join(", "),
        })),
        ...payments.map(p => ({
            id: p.id, date: p.paymentDate, type: "PAYMENT" as const,
            description: `Payment · ${p.mode.replace("_", " ")}`,
            debit: Number(p.amount), credit: 0, // debit = reducing what we owe
            meta: p.notes || (p.recordedBy?.name ? `Recorded by ${p.recordedBy.name}` : ""),
        })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Compute running balance (positive = we owe farmer)
    let running = 0;
    const ledger = entries.map(e => {
        running += e.credit - e.debit;
        return { ...e, runningBalance: running };
    });

    return NextResponse.json({ farmer, ledger });
}

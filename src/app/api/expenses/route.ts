import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/schemas";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getSession();
    if (!session || !session.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ORG_ADMIN") {
        return NextResponse.json({ error: "Forbidden: Only Admin can create expenses" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const validationResult = expenseSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 },
            );
        }

        const { expenseDate, amount, paymentMode, category, description } = validationResult.data;

        // Validation: Date cannot be in the future
        if (expenseDate > new Date()) {
            return NextResponse.json({ error: "Expense date cannot be in the future" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const expense = await tx.expense.create({
                data: {
                    organizationId: session.organizationId!,
                    expenseDate,
                    amount,
                    paymentMode,
                    category,
                    description,
                    createdById: session.userId,
                }
            });

            await tx.auditLog.create({
                data: {
                    action: "CREATE",
                    entity: "EXPENSE",
                    entityId: expense.id,
                    newValue: expense as any,
                    userId: session.userId,
                    organizationId: session.organizationId!,
                }
            });

            return expense;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Expense Creation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await getSession();
    if (!session || !session.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const category = searchParams.get("category");

    const where: any = {
        organizationId: session.organizationId,
        deletedAt: null, // Soft delete filter
    };

    if (startDateStr || endDateStr) {
        where.expenseDate = {};
        if (startDateStr) where.expenseDate.gte = new Date(startDateStr);
        if (endDateStr) {
            const endDate = new Date(endDateStr);
            endDate.setHours(23, 59, 59, 999);
            where.expenseDate.lte = endDate;
        }
    }

    if (category) {
        where.category = category;
    }

    try {
        const expenses = await prisma.expense.findMany({
            where,
            orderBy: { expenseDate: "desc" },
            include: {
                createdBy: {
                    select: { name: true }
                }
            }
        });

        return NextResponse.json(expenses);
    } catch (error: any) {
        console.error("Expense Fetch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

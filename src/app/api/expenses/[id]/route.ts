import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/schemas";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getSession();
    if (!session || !session.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const expense = await prisma.expense.findFirst({
            where: {
                id,
                organizationId: session.organizationId,
                deletedAt: null,
            },
            include: {
                createdBy: { select: { name: true } }
            }
        });

        if (!expense) {
            return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        }

        return NextResponse.json(expense);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getSession();
    if (!session || !session.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ORG_ADMIN") {
        return NextResponse.json({ error: "Forbidden: Only Admin can edit expenses" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const validationResult = expenseSchema.partial().safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 },
            );
        }

        const existingExpense = await prisma.expense.findFirst({
            where: { id, organizationId: session.organizationId, deletedAt: null }
        });

        if (!existingExpense) {
            return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        }

        const data = validationResult.data;
        if (data.expenseDate && data.expenseDate > new Date()) {
            return NextResponse.json({ error: "Expense date cannot be in the future" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const updatedExpense = await tx.expense.update({
                where: { id },
                data: data as any,
            });

            await tx.auditLog.create({
                data: {
                    action: "UPDATE",
                    entity: "EXPENSE",
                    entityId: updatedExpense.id,
                    oldValue: existingExpense as any,
                    newValue: updatedExpense as any,
                    userId: session.userId,
                    organizationId: session.organizationId!,
                }
            });

            return updatedExpense;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getSession();
    if (!session || !session.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ORG_ADMIN") {
        return NextResponse.json({ error: "Forbidden: Only Admin can delete expenses" }, { status: 403 });
    }

    try {
        const existingExpense = await prisma.expense.findFirst({
            where: { id, organizationId: session.organizationId, deletedAt: null }
        });

        if (!existingExpense) {
            return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const deletedExpense = await tx.expense.update({
                where: { id },
                data: { deletedAt: new Date() },
            });

            await tx.auditLog.create({
                data: {
                    action: "DELETE",
                    entity: "EXPENSE",
                    entityId: deletedExpense.id,
                    oldValue: existingExpense as any,
                    newValue: { deletedAt: deletedExpense.deletedAt } as any,
                    userId: session.userId,
                    organizationId: session.organizationId!,
                }
            });

            return { message: "Expense deleted successfully" };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

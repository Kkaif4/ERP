import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateBillPDF } from "@/lib/pdf-generator";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session || !session.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const pageSize = searchParams.get("pageSize") || undefined;
    const lang = searchParams.get("lang") || undefined;
    const isInline = searchParams.get("inline") === "true" || searchParams.get("print") === "true";

    try {
        const bill = await prisma.bill.findFirst({
            where: {
                id,
                organizationId: session.organizationId,
            },
            include: {
                items: {
                    include: {
                        item: true,
                    },
                },
                farmer: true,
                customer: true,
                organization: true,
            },
        });

        if (!bill) {
            return NextResponse.json({ error: "Bill not found" }, { status: 404 });
        }

        const config = await prisma.businessConfig.findUnique({
            where: { organizationId: session.organizationId },
        });

        const pdfBuffer = await generateBillPDF(bill as any, config, { pageSize, lang });

        const filename = `bill-${bill.billNumber}.pdf`;
        return new Response(new Uint8Array(pdfBuffer), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": isInline
                    ? `inline; filename="${filename}"`
                    : `attachment; filename="${filename}"`,
            },
        });
    } catch (error: any) {
        console.error("PDF Generation Error:", error);
        return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
    }
}

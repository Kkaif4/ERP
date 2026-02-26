import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const farmer = await prisma.farmer.findFirst({
        where: { id, organizationId: session.organizationId! },
    });

    if (!farmer) return NextResponse.json({ error: "Farmer not found" }, { status: 404 });
    return NextResponse.json(farmer);
}

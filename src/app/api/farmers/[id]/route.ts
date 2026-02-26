import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const farmer = await prisma.farmer.findFirst({
        where: { id: params.id, organizationId: session.organizationId! },
    });

    if (!farmer) return NextResponse.json({ error: "Farmer not found" }, { status: 404 });
    return NextResponse.json(farmer);
}

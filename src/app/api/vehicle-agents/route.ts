import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { vehicleAgentSchema } from "@/lib/schemas";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || !session.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  try {
    const agents = await prisma.vehicleAgent.findMany({
      where: {
        organizationId: session.organizationId,
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { vehicleNumber: { contains: search, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(agents);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !session.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validationResult = vehicleAgentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 },
      );
    }

    const { name, vehicleNumber } = validationResult.data;

    const agent = await prisma.vehicleAgent.create({
      data: {
        organizationId: session.organizationId,
        name,
        vehicleNumber,
      },
    });

    return NextResponse.json(agent);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A vehicle agent with this name already exists" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

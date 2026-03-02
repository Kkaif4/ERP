import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session || !session.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("logo") as File;

        if (!file) {
            return NextResponse.json({ error: "No logo file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Process image with Sharp: Resize to max 400px width, convert to JPEG
        const optimizedBuffer = await sharp(buffer)
            .resize({ width: 400, withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();

        const base64String = `data:image/jpeg;base64,${optimizedBuffer.toString("base64")}`;

        // Update the business config with the new logo
        await prisma.businessConfig.upsert({
            where: { organizationId: session.organizationId },
            update: { logoBase64: base64String },
            create: {
                organizationId: session.organizationId,
                logoBase64: base64String,
            },
        });

        return NextResponse.json({ logoBase64: base64String });
    } catch (error: any) {
        console.error("Logo upload error:", error);
        return NextResponse.json({ error: "Failed to process logo" }, { status: 500 });
    }
}

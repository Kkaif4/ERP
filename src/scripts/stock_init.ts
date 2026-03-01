import { PrismaClient } from "../../prisma/generated";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🚀 Starting stock initialization...");

    const items = await prisma.item.findMany({
        select: { id: true, organizationId: true, name: true }
    });

    console.log(`📦 Found ${items.length} items to process.`);

    for (const item of items) {
        console.log(`🔄 Processing item: ${item.name} (${item.id})`);

        const billItems = await prisma.billItem.findMany({
            where: { itemId: item.id },
            select: {
                quantityKg: true,
                quantityUnits: true,
                bill: { select: { type: true } }
            }
        });

        let purchasedKg = 0;
        let purchasedUnits = 0;
        let soldKg = 0;
        let soldUnits = 0;

        for (const bi of billItems) {
            if (bi.bill.type === "PURCHASE") {
                purchasedKg += Number(bi.quantityKg);
                purchasedUnits += Number(bi.quantityUnits);
            } else if (bi.bill.type === "SALE") {
                soldKg += Number(bi.quantityKg);
                soldUnits += Number(bi.quantityUnits);
            }
        }

        const availableKg = Math.max(0, purchasedKg - soldKg);
        const availableUnits = Math.max(0, purchasedUnits - soldUnits);

        await prisma.item.update({
            where: { id: item.id },
            data: { availableKg, availableUnits }
        });

        console.log(`✅ ${item.name}: ${availableKg} KG, ${availableUnits} Units`);
    }

    console.log("✨ Stock initialization complete!");
}

main()
    .catch((e) => {
        console.error("❌ Error initializing stock:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

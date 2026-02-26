import { PrismaClient } from "./generated";
import bcrypt from "bcryptjs";
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // 1. Create Default Plan
    console.log("Seeding Plans...");
    const basicPlan = await prisma.plan.upsert({
        where: { name: "BASIC" },
        update: {},
        create: {
            name: "BASIC",
            priceMonthly: 0,
            priceYearly: 0,
            features: { billing: true, ledger: true, reports: true },
        },
    });

    // 2. Create Super Admin
    console.log("Seeding Super Admin...");
    await prisma.user.upsert({
        where: { username: "superadmin" },
        update: {},
        create: {
            username: "superadmin",
            password: hashedPassword,
            name: "System Admin",
            role: "SUPER_ADMIN",
        },
    });

    // 3. Create Sample Organization
    console.log("Seeding Sample Organization...");
    const sampleOrg = await prisma.organization.upsert({
        where: { slug: "sample-mandi" },
        update: {},
        create: {
            name: "Sample Sabzi Mandi",
            slug: "sample-mandi",
            phone: "9876543210",
        },
    });

    // 4. Create Org Admin
    console.log("Seeding Org Admin...");
    await prisma.user.upsert({
        where: { username: "admin" },
        update: {},
        create: {
            username: "admin",
            password: hashedPassword,
            name: "Organization Admin",
            role: "ORG_ADMIN",
            organizationId: sampleOrg.id,
        },
    });

    // 5. Create Staff User
    console.log("Seeding Staff User...");
    await prisma.user.upsert({
        where: { username: "staff" },
        update: {},
        create: {
            username: "staff",
            password: hashedPassword,
            name: "Mandi Staff",
            pin: "1234",
            role: "ORG_STAFF",
            organizationId: sampleOrg.id,
        },
    });

    console.log("Seed data created successfully!");
}

main()
    .catch((e) => {
        console.error("Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

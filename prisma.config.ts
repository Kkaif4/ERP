import { defineConfig, env } from "prisma/config";
import 'dotenv/config'

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        seed: "tsx prisma/seed.ts"
    },
    datasource: {
        url: env("DATABASE_URL")
        // shadowDatabaseUrl: "postgresql://postgres:postgres@localhost:5432/feeling-erp?sslmode=disable"
    },
});

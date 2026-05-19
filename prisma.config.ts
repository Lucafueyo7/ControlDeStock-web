import "dotenv/config";
import { defineConfig } from "prisma/config";

const dbUrl = process.env["DIRECT_URL"] || process.env["DATABASE_URL"];

if (!dbUrl) {
  throw new Error("Neither DIRECT_URL nor DATABASE_URL is defined in your env file.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: dbUrl,
  },
});

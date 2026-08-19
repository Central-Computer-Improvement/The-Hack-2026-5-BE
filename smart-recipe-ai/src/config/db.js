require("dotenv").config();
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

let prisma = null;

try {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  } else {
    prisma = new PrismaClient();
  }
} catch (error) {
  console.warn("Prisma Client initialization warning:", error.message);
  prisma = null;
}

module.exports = prisma;





const { PrismaClient } = require("@prisma/client");

const prismaLogs = ["error", "warn"];

// Keep verbose SQL logs opt-in for local debugging only.
if (process.env.PRISMA_QUERY_LOGS === "true") {
  prismaLogs.unshift("query");
}

const prisma = new PrismaClient({
  log: prismaLogs,
});

module.exports = prisma;

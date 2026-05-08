const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function migrateRoles() {
  console.log("Fetching legacy users...");
  
  // 1. Fetch raw documents
  const users = await prisma.user.findRaw({
    filter: { role: { $exists: true } }
  });

  let count = 0;
  for (const user of users) {
    const userId = user._id.$oid;
    const baseRole = user.role || "USER";

    // 2. Use $runCommandRaw to execute a native MongoDB update command
    // This safely sets the new array and deletes the old string field
    await prisma.$runCommandRaw({
      update: "User", // The name of your MongoDB collection
      updates: [
        {
          q: { _id: { $oid: userId } }, // Query to match the user
          u: { 
            $set: { roles: [baseRole] }, // Set the new array
            $unset: { role: "" }         // Delete the old field
          }
        }
      ]
    });
    
    count++;
  }
  
  console.log(`Successfully migrated ${count} users to the new RBAC roles array!`);
  await prisma.$disconnect();
}

migrateRoles().catch(console.error);
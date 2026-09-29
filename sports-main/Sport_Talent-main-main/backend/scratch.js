const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users:");
  console.log(users.map(u => u.email).join('\n'));
}

main().catch(console.error).finally(() => prisma.$disconnect());

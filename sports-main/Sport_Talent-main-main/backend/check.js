const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkPass() {
  const email = "arman.mallick1118@gmail.com";
  const user = await prisma.user.findFirst({ where: { email } });
  if (user) {
    const isMatch = await bcrypt.compare("password123", user.password_hash);
    console.log("Is Match:", isMatch);
  } else {
    console.log("User not found.");
  }
}

checkPass().finally(() => prisma.$disconnect());

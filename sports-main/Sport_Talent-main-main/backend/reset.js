const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetPass() {
  const email = "arman.mallick1118@gmail.com";
  const user = await prisma.user.findFirst({ where: { email } });
  if (user) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash("password123", salt);
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash }
    });
    console.log("Password reset to password123 for " + email);
  } else {
    console.log("User not found.");
  }
}

resetPass().finally(() => prisma.$disconnect());

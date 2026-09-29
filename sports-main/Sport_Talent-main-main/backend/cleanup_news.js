const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function clean() {
  const start = new Date(); start.setHours(0,0,0,0);
  const del = await prisma.feedPost.deleteMany({ where: { authorId: 'system-news-bot', created_at: { gte: start } } });
  console.log('Deleted', del.count, 'old bot posts');
  await prisma.$disconnect();
}
clean().catch(console.error);

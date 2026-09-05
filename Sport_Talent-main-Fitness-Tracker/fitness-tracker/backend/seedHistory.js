const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirst();
  if (!user) return console.log("No user found");
  
  const score = await prisma.fitnessScore.findUnique({ where: { user_id: user.id } });
  if (!score) return console.log("No score found. Generate a score first.");

  const history = [];
  const now = new Date();
  
  // Generate 30 days of history
  for (let i = 30; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    
    // Create a slight upward trend over the month starting from ~40 up to ~85
    const baseOverall = 40 + ((30 - i) * 1.5) + (Math.random() * 8 - 4);
    
    history.push({
      date: d.toISOString(),
      overall: Math.min(100, Math.max(0, Math.round(baseOverall))),
      workout: Math.min(100, Math.max(0, Math.round(baseOverall - 10 + Math.random() * 20))),
      nutrition: Math.min(100, Math.max(0, Math.round(baseOverall + Math.random() * 15))),
      health: Math.min(100, Math.max(0, Math.round(baseOverall + 5 + Math.random() * 10)))
    });
  }
  
  await prisma.fitnessScore.update({
    where: { user_id: user.id },
    data: { score_history: JSON.stringify(history) }
  });
  
  console.log("Seeded 30 days of history successfully.");
}

run().catch(console.error).finally(() => prisma.$disconnect());

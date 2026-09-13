const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const authorId = 'system-generated-123';

  const posts = [
    {
      type: 'news',
      title: 'The Future of Indian Cricket: Pattika Shanvi',
      content: '12-year-old Pattika Shanvi from a remote Andhra village eyes the Indian Cricket Jersey. "Shanvi has worked hard from a young age..." says her father.',
      authorId,
      mediaUrl: '/posters/cricket1.jpg',
    },
    {
      type: 'announcement',
      title: 'State Level Under 16 & 19 Cricket Tournament',
      content: 'Register now for the State Level U-16 and U-19 Cricket Tournament starting January 12th, 2026. All over India players can participate.',
      authorId,
      mediaUrl: '/posters/cricket2.jpg',
    },
    {
      type: 'announcement',
      title: 'Delhi State Badminton Championship 2026',
      content: 'Coming Soon: Delhi State Badminton Championship 2026 for U-19 and Senior categories. Organized by Delhi Capital Badminton Association.',
      authorId,
      mediaUrl: '/posters/badminton1.jpg',
    },
    {
      type: 'news',
      title: 'History Made: India Celebrates!',
      content: '15 Years of Wait, Finally Ours! Treesa Jolly and Gayatri Gopichand end India\'s wait, assure World Championships Medal in 2026.',
      authorId,
      mediaUrl: '/posters/badminton2.jpg',
    },
    {
      type: 'news',
      title: 'Shi Yuqi: I Don\'t Need to Prove Anything Anymore',
      content: 'World Champion\'s new mindset drives redemption at the 2025 BWF World Championships. "Winning this gold means more than just a title..."',
      authorId,
      mediaUrl: '/posters/badminton3.jpg',
    },
  ];

  for (const post of posts) {
    await prisma.feedPost.create({
      data: post,
    });
  }

  console.log('Successfully seeded 5 posters to the Feed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

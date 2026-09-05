const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function seed() {
    try {
        console.log('Seeding dummy scout data...');

        // Check if there's already a scout
        const existing = await prisma.user.findFirst({
            where: { role: 'scout' }
        });

        if (existing) {
            console.log('A scout already exists in the database. Exiting.');
            return;
        }

        // Create a dummy scout user
        const dummyScout = await prisma.user.create({
            data: {
                email: `scout_${Date.now()}@example.com`,
                password_hash: crypto.createHash('sha256').update('password123').digest('hex'),
                role: 'scout',
                profile: {
                    create: {
                        full_name: 'Alex Ferguson (Dummy)',
                        sport: 'Football',
                        location: 'UK',
                        is_verified: true
                    }
                },
                scout_profile: {
                    create: {
                        organization: 'Manchester United',
                        organization_type: 'Club',
                        region: 'Europe',
                        specialization: 'Football, Youth, Midfielders'
                    }
                }
            }
        });

        console.log('Successfully created dummy scout:', dummyScout.email);
    } catch (e) {
        console.error('Error seeding data:', e);
    } finally {
        await prisma.$disconnect();
    }
}

seed();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        console.log('Seeding target user...');

        const email = 'arman.mallick1118@gmail.com';
        const password = 'Liza@2107';

        // Check if user already exists
        const existing = await prisma.user.findUnique({
            where: { email }
        });

        if (existing) {
            console.log('User already exists! Updating password to ensure it is correct...');
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            
            await prisma.user.update({
                where: { email },
                data: { password_hash }
            });
            console.log('Password updated successfully.');
            return;
        }

        // Create new user
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUser = await prisma.user.create({
            data: {
                email: email,
                password_hash: password_hash,
                role: 'scout', // Set as scout to view dashboards easily
                profile: {
                    create: {
                        full_name: 'Arman Mallick',
                        sport: 'Multi-Sport',
                        location: 'Global',
                        is_verified: true
                    }
                },
                scout_profile: {
                    create: {
                        organization: 'Headquarters',
                        organization_type: 'Admin',
                        region: 'Global',
                        specialization: 'Admin'
                    }
                }
            }
        });

        console.log('Successfully created secure user:', newUser.email);
    } catch (e) {
        console.error('Error seeding data:', e);
    } finally {
        await prisma.$disconnect();
    }
}

seed();

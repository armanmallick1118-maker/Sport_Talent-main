const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getScouts = async (req, res) => {
    try {
        const { search, sport, region, organization_type } = req.query;

        // Build Prisma where clause
        const whereClause = {
            role: 'scout',
            scout_profile: {
                isNot: null
            }
        };

        if (search) {
            whereClause.OR = [
                { profile: { full_name: { contains: search } } },
                { scout_profile: { organization: { contains: search } } },
                { scout_profile: { specialization: { contains: search } } }
            ];
        }

        if (sport) {
            whereClause.profile = { sport: { contains: sport } };
        }

        if (region) {
            whereClause.scout_profile = { ...whereClause.scout_profile, region: { contains: region } };
        }

        if (organization_type) {
            whereClause.scout_profile = { ...whereClause.scout_profile, organization_type: { contains: organization_type } };
        }

        const scouts = await prisma.user.findMany({
            where: whereClause,
            include: {
                profile: true,
                scout_profile: true
            }
        });

        // Format data to match frontend expectations
        const formattedScouts = scouts.map(user => {
            const sp = user.scout_profile;
            return {
                id: user.id,
                user: {
                    profile: {
                        full_name: user.profile?.full_name || 'Scout'
                    }
                },
                organization: sp.organization || 'Independent',
                organization_type: sp.organization_type || 'Unknown',
                region: sp.region || 'Unknown',
                specialization: sp.specialization ? sp.specialization.split(',').map(s => s.trim()) : []
            };
        });

        res.json(formattedScouts);
    } catch (error) {
        console.error('Error fetching scouts:', error);
        res.status(500).json({ error: 'Failed to fetch scouts' });
    }
};

const getScoutById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                profile: true,
                scout_profile: true
            }
        });

        if (!user || user.role !== 'scout' || !user.scout_profile) {
            return res.status(404).json({ error: 'Scout not found' });
        }

        const sp = user.scout_profile;
        const formattedScout = {
            id: user.id,
            email: user.email,
            user: {
                profile: {
                    full_name: user.profile?.full_name || 'Scout',
                    avatar_url: user.profile?.avatar_url
                }
            },
            organization: sp.organization || 'Independent',
            organization_type: sp.organization_type || 'Unknown',
            region: sp.region || 'Unknown',
            specialization: sp.specialization ? sp.specialization.split(',').map(s => s.trim()) : []
        };

        res.json(formattedScout);
    } catch (error) {
        console.error('Error fetching scout:', error);
        res.status(500).json({ error: 'Failed to fetch scout details' });
    }
};

module.exports = {
    getScouts,
    getScoutById
};

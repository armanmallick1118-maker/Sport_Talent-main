// controllers/athleteController.js, Sensei
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAthleteProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const profile = await prisma.profile.findUnique({
      where: { user_id: userId }
    });
    
    if (!profile) {
      return res.status(404).json({ message: 'Athlete profile not found, Sensei' });
    }
    
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateAthleteProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { name, age, height, weight, location, sport, position } = req.body;
    
    await prisma.profile.upsert({
      where: { user_id: userId },
      update: {
        full_name: name,
        location,
        sport,
        position,
      },
      create: {
        user_id: userId,
        full_name: name,
        location,
        sport,
        position,
      }
    });
    
    res.status(200).json({ message: 'Athlete profile updated successfully, Sensei' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAthleteProfile, updateAthleteProfile };
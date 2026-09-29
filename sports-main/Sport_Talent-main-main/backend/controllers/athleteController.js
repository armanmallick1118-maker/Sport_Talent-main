// controllers/athleteController.js, Sensei
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const toNullableInt = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const calculateCompletion = (profile) => {
  const fields = [
    profile.full_name,
    profile.age,
    profile.height,
    profile.weight,
    profile.location,
    profile.sport,
    profile.position,
    profile.experience,
    profile.training_frequency,
  ];
  const filled = fields.filter((value) => value !== null && value !== undefined && value !== '').length;
  return Math.round((filled / fields.length) * 100);
};

const toClientProfile = (profile) => ({
  ...profile,
  name: profile.full_name || '',
  primarySport: profile.sport || 'Football',
  trainingFrequency: profile.training_frequency || '3-4 days/week',
});

const getAthleteProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const profile = await prisma.profile.findUnique({
      where: { user_id: userId }
    });
    
    if (!profile) {
      return res.status(404).json({ message: 'Athlete profile not found, Sensei' });
    }
    
    res.status(200).json(toClientProfile(profile));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateAthleteProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      name,
      full_name,
      age,
      height,
      weight,
      location,
      sport,
      primarySport,
      position,
      experience,
      trainingFrequency,
      training_frequency,
    } = req.body;
    const fullName = name || full_name || '';
    const selectedSport = sport || primarySport || 'Football';
    const profileData = {
      full_name: fullName,
      age: toNullableInt(age),
      height: toNullableInt(height),
      weight: toNullableInt(weight),
      location: location || null,
      sport: selectedSport,
      position: position || null,
      experience: toNullableInt(experience),
      training_frequency: trainingFrequency || training_frequency || '3-4 days/week',
    };
    profileData.completion_percentage = calculateCompletion(profileData);
    
    const profile = await prisma.profile.upsert({
      where: { user_id: userId },
      update: profileData,
      create: {
        user_id: userId,
        ...profileData,
      }
    });
    
    res.status(200).json({
      message: 'Athlete profile updated successfully, Sensei',
      profile: toClientProfile(profile),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAthleteProfile, updateAthleteProfile };

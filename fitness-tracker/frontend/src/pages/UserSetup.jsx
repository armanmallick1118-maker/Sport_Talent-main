import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../services/healthApi';

export default function UserSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    age: 28,
    gender: 'male',
    height_cm: 178,
    weight_kg: 75,
    goal: 'build_muscle',
    activity_level: 'active'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep(step + 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Basic auto-calculations for demo purposes
      const daily_cal_target = formData.goal === 'build_muscle' ? 2800 : (formData.goal === 'lose_weight' ? 2000 : 2400);
      const daily_protein_target = formData.weight_kg * 2;
      const daily_water_target = 2500;
      
      const payload = {
        ...formData,
        age: parseInt(formData.age),
        height_cm: parseFloat(formData.height_cm),
        weight_kg: parseFloat(formData.weight_kg),
        daily_cal_target,
        daily_protein_target,
        daily_water_target,
        avatar_color: '#3B82F6'
      };

      const res = await createUser(payload);
      localStorage.setItem('healthUserId', res.user.id);
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      alert('Failed to create user');
    }
  };

  return (
    <div style={{ padding: '40px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Welcome to Health AI</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Let's set up your profile to generate your baseline score.</p>
      </div>

      <div className="card" style={{ padding: 30 }}>
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: 18, marginBottom: 20 }}>Step 1: Personal Info</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>Age</label>
                  <input type="number" name="age" value={formData.age} onChange={handleChange} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <button className="btn-primary" style={{ marginTop: 10 }} onClick={handleNext}>Next</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: 18, marginBottom: 20 }}>Step 2: Body Stats & Goals</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>Height (cm)</label>
                  <input type="number" name="height_cm" value={formData.height_cm} onChange={handleChange} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>Weight (kg)</label>
                  <input type="number" name="weight_kg" value={formData.weight_kg} onChange={handleChange} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>Primary Goal</label>
                <select name="goal" value={formData.goal} onChange={handleChange}>
                  <option value="build_muscle">Build Muscle</option>
                  <option value="lose_weight">Lose Weight</option>
                  <option value="stay_fit">Stay Fit</option>
                  <option value="peak_performance">Peak Performance</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>Activity Level</label>
                <select name="activity_level" value={formData.activity_level} onChange={handleChange}>
                  <option value="sedentary">Sedentary (office job)</option>
                  <option value="light">Lightly Active</option>
                  <option value="moderate">Moderately Active</option>
                  <option value="active">Active</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button className="btn-primary" style={{ background: 'var(--bg-elevated)' }} onClick={() => setStep(1)}>Back</button>
                <button className="btn-primary" onClick={handleSubmit}>Complete Setup</button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button onClick={() => {
          // Quick skip for testing - assumes seed data user exists
          const john = prompt("Enter existing user ID from DB, or skip and complete setup normally. Only do this if you know the UUID of seeded user.");
          if (john) {
            localStorage.setItem('healthUserId', john);
            window.location.href = '/';
          }
        }} style={{ color: 'var(--text-secondary)', fontSize: 12, textDecoration: 'underline', background: 'none' }}>
          Skip (Dev Mode)
        </button>
      </div>
    </div>
  );
}

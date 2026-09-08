import React, { useEffect, useState } from 'react';
import { getWorkouts, logWorkout } from '../services/healthApi';
import { Activity, Flame, Clock, Plus } from 'lucide-react';

export default function WorkoutTracker() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('healthUserId');

  const [form, setForm] = useState({
    exercise: '', category: 'strength', sets: '', reps: '', duration_min: '', intensity: 'medium'
  });

  useEffect(() => {
    loadWorkouts();
  }, []);

  async function loadWorkouts() {
    try {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      const from = d.toISOString();
      d.setHours(23, 59, 59, 999);
      const to = d.toISOString();
      const res = await getWorkouts(userId, from, to);
      setWorkouts(res.logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await logWorkout({
        user_id: userId,
        ...form,
        sets: form.sets ? parseInt(form.sets) : null,
        reps: form.reps ? parseInt(form.reps) : null,
        duration_min: form.duration_min ? parseFloat(form.duration_min) : null,
        calories: form.duration_min ? parseFloat(form.duration_min) * 8 : null // simple dummy calc
      });
      setForm({ exercise: '', category: 'strength', sets: '', reps: '', duration_min: '', intensity: 'medium' });
      loadWorkouts();
    } catch (e) {
      console.error(e);
      alert('Failed to log workout: Invalid session. Please try logging out and logging back in.');
    }
  }



  return (
    <div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} color="var(--accent-blue)" /> Quick Log
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 2 }}>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
                <option value="hiit">HIIT</option>
                <option value="flexibility">Flexibility</option>
              </select>
            </div>
            <div style={{ flex: 3 }}>
              <input placeholder="Exercise (e.g. Push-ups)" required value={form.exercise} onChange={e => setForm({...form, exercise: e.target.value})} />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <input type="number" placeholder="Sets" value={form.sets} onChange={e => setForm({...form, sets: e.target.value})} />
            </div>
            <div style={{ flex: 1 }}>
              <input type="number" placeholder="Reps" value={form.reps} onChange={e => setForm({...form, reps: e.target.value})} />
            </div>
            <div style={{ flex: 1 }}>
              <input type="number" placeholder="Mins" value={form.duration_min} onChange={e => setForm({...form, duration_min: e.target.value})} />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>Log Workout</button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 16, marginBottom: 16 }}>Today's Logs</h2>
        {workouts.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No workouts logged today yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {workouts.map(w => (
              <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'white' }}>{w.exercise}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {w.sets && w.reps ? `${w.sets} sets × ${w.reps} reps` : `${w.duration_min} mins`}
                  </div>
                </div>
                {w.calories && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-orange)', fontSize: 12, fontWeight: 600 }}>
                    <Flame size={14} /> {Math.round(w.calories)} kcal
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Placeholder for calendar heatmap */}
      <div className="card" style={{ marginTop: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Activity Heatmap</p>
        <div style={{ height: 100, background: 'rgba(255,255,255,0.05)', borderRadius: 8, marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          (Heatmap Component)
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { getNutrition, logNutrition, deleteNutrition } from '../services/healthApi';
import { COMMON_FOODS } from '../utils/foodDatabase';
import { Apple, Plus, Trash2, Save } from 'lucide-react';

export default function NutritionLogger() {
  const [meals, setMeals] = useState([]);
  const [stagedFoods, setStagedFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('healthUserId');
  
  const [form, setForm] = useState({
    meal_type: 'breakfast', food_name: '', calories: '', protein_g: '', quantity: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMeals();
  }, []);

  async function loadMeals() {
    try {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      const from = d.toISOString();
      d.setHours(23, 59, 59, 999);
      const to = d.toISOString();
      const res = await getNutrition(userId, from, to);
      setMeals(res.logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleFoodSelect = (e) => {
    const food = COMMON_FOODS.find(f => f.name === e.target.value);
    if (food) {
      setForm({ ...form, food_name: food.name, calories: food.calories, protein_g: food.protein, quantity: '1 serving' });
    }
  };

  const handleAddToPlate = (e) => {
    e.preventDefault();
    if (!form.food_name || !form.calories) return;
    
    setStagedFoods([...stagedFoods, {
      id: Date.now().toString(),
      ...form,
      calories: parseFloat(form.calories),
      protein_g: form.protein_g ? parseFloat(form.protein_g) : null
    }]);
    
    // Reset inputs but keep meal type
    setForm({ ...form, food_name: '', calories: '', protein_g: '', quantity: '' });
  };

  const handleRemoveStaged = (id) => {
    setStagedFoods(stagedFoods.filter(f => f.id !== id));
  };

  const handleLogMeals = async () => {
    if (stagedFoods.length === 0) return;
    setIsSubmitting(true);
    
    try {
      // Log all staged foods to the backend sequentially
      for (const food of stagedFoods) {
        await logNutrition({
          user_id: userId,
          meal_type: food.meal_type,
          food_name: food.food_name,
          quantity: food.quantity,
          calories: food.calories,
          protein_g: food.protein_g
        });
      }
      setStagedFoods([]);
      loadMeals();
    } catch (e) {
      console.error(e);
      alert('Failed to log some meals.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMeal = async (id) => {
    try {
      await deleteNutrition(id);
      loadMeals();
    } catch (e) {
      console.error(e);
    }
  };

  const totalCals = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + (m.protein_g || 0), 0);
  const targetCals = 2800; // Mocked
  const targetProtein = 160;

  return (
    <div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>Daily Progress</h2>
        
        <div style={{ marginBottom: 16 }}>
          <div className="flex-between" style={{ fontSize: 12, marginBottom: 4 }}>
            <span>Calories</span>
            <span>{totalCals.toFixed(0)} / {targetCals}</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--accent-orange)', width: `${Math.min(100, (totalCals/targetCals)*100)}%` }} />
          </div>
        </div>

        <div>
          <div className="flex-between" style={{ fontSize: 12, marginBottom: 4 }}>
            <span>Protein</span>
            <span>{totalProtein.toFixed(0)}g / {targetProtein}g</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--accent-blue)', width: `${Math.min(100, (totalProtein/targetProtein)*100)}%` }} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} color="var(--accent-orange)" /> Build a Meal
        </h2>
        <form onSubmit={handleAddToPlate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <select value={form.meal_type} onChange={e => setForm({...form, meal_type: e.target.value})}>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <select onChange={handleFoodSelect} value="">
                <option value="" disabled>Quick Add...</option>
                {COMMON_FOODS.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 2 }}>
              <input placeholder="Food name" required value={form.food_name} onChange={e => setForm({...form, food_name: e.target.value})} />
            </div>
            <div style={{ flex: 1 }}>
              <input type="number" placeholder="Kcal" required value={form.calories} onChange={e => setForm({...form, calories: e.target.value})} />
            </div>
            <div style={{ flex: 1 }}>
              <input type="number" placeholder="Prot (g)" value={form.protein_g} onChange={e => setForm({...form, protein_g: e.target.value})} />
            </div>
          </div>

          <button type="submit" className="btn-secondary" style={{ marginTop: 8 }}>
            Add to Plate
          </button>
        </form>

        {/* Staged Foods List */}
        {stagedFoods.length > 0 && (
          <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
            <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>Your Plate ({stagedFoods.length} items)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stagedFoods.map(food => (
                <div key={food.id} className="flex-between" style={{ background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontWeight: 500 }}>{food.food_name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{food.meal_type}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right', fontSize: 12 }}>
                      <div style={{ color: 'var(--accent-orange)' }}>{food.calories} kcal</div>
                      {food.protein_g && <div style={{ color: 'var(--accent-blue)' }}>{food.protein_g}g prot</div>}
                    </div>
                    <button onClick={() => handleRemoveStaged(food.id)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
                      <Trash2 size={16} color="var(--accent-red)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={handleLogMeals}
              disabled={isSubmitting}
              className="btn-primary" 
              style={{ marginTop: 16, background: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Save size={18} />
              {isSubmitting ? 'Logging...' : 'Log Meal to Today'}
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ fontSize: 16, marginBottom: 16 }}>Today's Meals</h2>
        {meals.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No meals logged today yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['breakfast', 'lunch', 'dinner', 'snack'].map(type => {
              const typeMeals = meals.filter(m => m.meal_type === type);
              if (typeMeals.length === 0) return null;
              
              return (
                <div key={type} style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 12 }}>
                  <h3 style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 4 }}>{type}</h3>
                  {typeMeals.map(m => (
                    <div key={m.id} className="flex-between" style={{ fontSize: 13, marginBottom: 8 }}>
                      <span style={{ color: 'white', flex: 1 }}>{m.food_name}</span>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {m.protein_g && <span style={{ color: 'var(--accent-blue)' }}>{m.protein_g}g</span>}
                        <span style={{ color: 'var(--accent-orange)', fontWeight: 600, width: 40, textAlign: 'right' }}>{m.calories}</span>
                        <button onClick={() => handleDeleteMeal(m.id)} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', opacity: 0.7 }}>
                          <Trash2 size={14} color="var(--text-muted)" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

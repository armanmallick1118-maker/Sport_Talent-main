const BASE = 'http://127.0.0.1:3001/api/health';

async function fetchApi(endpoint, options = {}) {
  const res = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'API Error');
  return data;
}

export const createUser = (data) => fetchApi('/users', { method: 'POST', body: JSON.stringify(data) });
export const getUser = (id) => fetchApi(`/users/${id}`);

export const logWorkout = (data) => fetchApi('/workout', { method: 'POST', body: JSON.stringify(data) });
export const getWorkouts = (userId, from, to) => fetchApi(`/workout/${userId}?from=${from || ''}&to=${to || ''}`);

export const logNutrition = (data) => fetchApi('/nutrition', { method: 'POST', body: JSON.stringify(data) });
export const getNutrition = (userId, from, to) => fetchApi(`/nutrition/${userId}?from=${from || ''}&to=${to || ''}`);
export const deleteNutrition = (id) => fetchApi(`/nutrition/${id}`, { method: 'DELETE' });

export const submitLabReport = (data) => fetchApi('/lab-report', { method: 'POST', body: JSON.stringify(data) });
export const getLabReports = (userId) => fetchApi(`/lab-report/${userId}`);

export const logVitals = (data) => fetchApi('/vitals', { method: 'POST', body: JSON.stringify(data) });
export const getVitals = (userId) => fetchApi(`/vitals/${userId}`);

export const getScore = (userId) => fetchApi(`/score/${userId}`);
export const generateScore = (userId) => fetchApi(`/score/generate/${userId}`, { method: 'POST' });

export const trackGoal = (data) => fetchApi(`/goals/track`, { method: 'POST', body: JSON.stringify(data) });
export const getGoals = (userId, date) => fetchApi(`/goals/${userId}${date ? `?date=${date}` : ''}`);

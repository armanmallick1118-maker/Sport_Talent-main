import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import UserSetup from './pages/UserSetup';
import HealthHub from './pages/HealthHub';
import WorkoutTracker from './pages/WorkoutTracker';
import NutritionLogger from './pages/NutritionLogger';
import LabReportManager from './pages/LabReportManager';
import AIHealthReport from './pages/AIHealthReport';

export default function App() {
  const userId = localStorage.getItem('healthUserId');

  return (
    <BrowserRouter>
      <div className="bg-mesh" style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', position: 'relative' }}>
        <Routes>
          <Route path="/setup" element={<UserSetup />} />
          <Route path="/" element={userId ? <HealthHub /> : <Navigate to="/setup" />} />
          <Route path="/workout" element={userId ? <WorkoutTracker /> : <Navigate to="/setup" />} />
          <Route path="/nutrition" element={userId ? <NutritionLogger /> : <Navigate to="/setup" />} />
          <Route path="/lab-reports" element={userId ? <LabReportManager /> : <Navigate to="/setup" />} />
          <Route path="/ai-report" element={userId ? <AIHealthReport /> : <Navigate to="/setup" />} />
        </Routes>

      </div>
    </BrowserRouter>
  );
}

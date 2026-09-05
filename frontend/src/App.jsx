import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/login.jsx';
import Register from './pages/Register';
import AthleteProfile from './pages/AthleteProfile';
import SportSelection from './pages/SportSelection';
import SprintTestInstructions from './pages/SprintTestInstructions';
import SprintCamera from './pages/SprintCamera';
import SprintResult from './pages/SprintResult';
import VerticalJumpInstructions from './pages/VerticalJumpInstructions';
import VerticalJumpCamera from './pages/VerticalJumpCamera';
import VerticalJumpResult from './pages/VerticalJumpResult';
import LivePoseCamera from './pages/LivePoseCamera';
import AthleteDashboard from './pages/AthleteDashboard';
import ScoutDashboard from './pages/ScoutDashboard';
import Leaderboard from './pages/Leaderboard';
import AthleteAnalytics from './pages/AthleteAnalytics';
import TrainingFocus from './pages/TrainingFocus';
import ProfileMatch from './pages/ProfileMatch';
import SportTalentCard from './pages/SportTalentCard';
import AthleteDetails from './pages/AthleteDetails';
import PrivacyConsent from './pages/PrivacyConsent';
import FeedPage from './pages/FeedPage';
import PostDetail from './pages/PostDetail';
import JackAIBot from './pages/JackAIBot';
import ScoutDirectory from './pages/ScoutDirectory';
import ScoutDetails from './pages/ScoutDetails';
import GeospatialRadar from './pages/GeospatialRadar';

export default function App() {
  return (
    <Router>
      <div className="min-h-svh bg-[#f4f6fb] text-slate-900 font-sans">
        <Navbar />
        <div className="pb-20 md:pb-8">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRole="athlete">
                  <AthleteProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sports"
              element={
                <ProtectedRoute allowedRole="athlete">
                  <SportSelection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/sprint"
              element={
                <ProtectedRoute allowedRole="athlete">
                  <SprintTestInstructions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/sprint/camera"
              element={
                <ProtectedRoute allowedRole="athlete">
                  <SprintCamera />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/sprint/result/:sessionId"
              element={
                <ProtectedRoute allowedRole="athlete">
                  <SprintResult />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/vertical-jump"
              element={
                <ProtectedRoute allowedRole="athlete">
                  <VerticalJumpInstructions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/vertical-jump/camera"
              element={
                <ProtectedRoute allowedRole="athlete">
                  <VerticalJumpCamera />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/vertical-jump/result"
              element={
                <ProtectedRoute allowedRole="athlete">
                  <VerticalJumpResult />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/live-pose"
              element={
                <ProtectedRoute allowedRole="athlete">
                  <LivePoseCamera />
                </ProtectedRoute>
              }
            />
            <Route
              path="/athlete/dashboard"
              element={
                <ProtectedRoute allowedRole="athlete">
                  <AthleteDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/training-focus"
              element={
                <ProtectedRoute allowedRole="athlete">
                  <TrainingFocus />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coach-jack"
              element={
                <ProtectedRoute>
                  <JackAIBot />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scout/dashboard"
              element={
                <ProtectedRoute allowedRole="scout">
                  <ScoutDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scout-directory"
              element={
                <ProtectedRoute allowedRole="athlete">
                  <ScoutDirectory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/talent-card"
              element={
                <ProtectedRoute allowedRole="athlete">
                  <SportTalentCard />
                </ProtectedRoute>
              }
            />
            <Route path="/privacy-consent" element={<PrivacyConsent />} />
            <Route
              path="/feed"
              element={
                <ProtectedRoute allowedRole="athlete">
                  <FeedPage />
                </ProtectedRoute>
              }
            />
            <Route path="/feed/:id" element={<PostDetail />} />
            <Route path="/scout/athletes/:id" element={<AthleteDetails />} />
            <Route
              path="/geospatial"
              element={
                <ProtectedRoute allowedRole="athlete">
                  <GeospatialRadar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scouts/:id"
              element={
                <ProtectedRoute allowedRole="athlete">
                  <ScoutDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute allowedRole="athlete">
                  <Leaderboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile-match"
              element={
                <ProtectedRoute allowedRole="athlete">
                  <ProfileMatch />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRole="athlete">
                  <AthleteAnalytics />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
        <BottomNav />
      </div>
    </Router>
  );
}

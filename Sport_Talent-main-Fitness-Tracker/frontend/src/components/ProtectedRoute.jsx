import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem('token');
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const userRole = localStorage.getItem('role');

  if (!token || isLoggedIn !== 'true') {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    const fallbackPath = userRole === 'scout' ? '/scout/dashboard' : '/athlete/dashboard';
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}
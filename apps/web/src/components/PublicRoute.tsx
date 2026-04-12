import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';

/**
 * PublicRoute - Restricts access to unauthenticated users only
 * Redirects to dashboard if user is already authenticated
 */
export default function PublicRoute() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const loading = useAppSelector((state) => state.auth.loading);

  if (loading) {
    return null; // Or a loading spinner component
  }

  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

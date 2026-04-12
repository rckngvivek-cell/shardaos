import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';

/**
 * ProtectedRoute - Restricts access to authenticated users only
 * Redirects to login if user is not authenticated
 */
export default function ProtectedRoute() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const loading = useAppSelector((state) => state.auth.loading);

  if (loading) {
    return null; // Or a loading spinner component
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

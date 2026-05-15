/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import LessonView from './pages/LessonView';
import AdminDashboard from './pages/AdminDashboard';
import MyProgress from './pages/MyProgress';
import PendingApproval from './pages/PendingApproval';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, profile, isLoading } = useAuth();
  
  if (isLoading) return <div className="h-screen flex items-center justify-center font-display text-2xl">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  
  // If user is not approved
  if (profile && !profile.is_approved) {
    return <Navigate to="/pending" />;
  }

  if (adminOnly && profile?.role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
}

function PendingGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center font-display text-2xl">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (profile?.is_approved) return <Navigate to="/" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pending" element={
              <PendingGuard>
                <PendingApproval />
              </PendingGuard>
            } />
            <Route path="/progress" element={
              <ProtectedRoute>
                <MyProgress />
              </ProtectedRoute>
            } />
            <Route path="/lesson/:id" element={
              <ProtectedRoute>
                <LessonView />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

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
  const { user, profile, isLoading, profileLoading } = useAuth();
  
  if (isLoading) return <div className="h-screen flex items-center justify-center font-display text-2xl">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  
  // Wait for profile if it's currently fetching for a logged in user
  if (!profile && profileLoading) {
    return (
      <div className="h-screen flex items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin"></div>
        <div className="font-display text-xl text-[#2D3436]/60">Setting up your experience...</div>
      </div>
    );
  }

  if (adminOnly && profile?.role !== 'admin' && user.email !== 'hanselluis0809@gmail.com') {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
}

function PendingGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading, profileLoading } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center font-display text-2xl">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  
  // Wait for profile if it's currently fetching
  if (!profile && profileLoading) {
     return <div className="h-screen flex items-center justify-center font-display text-2xl">Loading profile...</div>;
  }

  if (profile?.is_approved || user.email === 'hanselluis0809@gmail.com') return <Navigate to="/" />;
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

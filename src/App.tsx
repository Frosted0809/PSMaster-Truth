/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import { motion } from 'motion/react';

// Pages
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import LessonView from './pages/LessonView';
import AdminDashboard from './pages/AdminDashboard';
import MyProgress from './pages/MyProgress';

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

function AppContent() {
  const { connectionError } = useAuth();

  return (
    <Router>
      <Layout>
        {connectionError && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500 text-white px-6 py-2 text-center text-xs font-bold uppercase tracking-widest z-[60] relative mb-4 rounded-xl shadow-lg"
          >
            Network Error: {connectionError}
            <button 
              onClick={() => window.location.reload()}
              className="ml-4 underline hover:no-underline"
            >
              Retry
            </button>
          </motion.div>
        )}
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
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
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

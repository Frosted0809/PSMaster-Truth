import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, UserPlus, LogIn, ShieldAlert, AlertCircle, Loader2 } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-[#D9C5A0]/40 rounded-[32px] p-10 shadow-ambient relative overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFE8BE]/50 blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50 blur-3xl -z-10" />

        <div className="text-center mb-10 space-y-2">
          <div className="w-16 h-16 bg-[#427AB5] rounded-24 flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-blue-200">
            {isLogin ? <LogIn size={28} /> : <UserPlus size={28} />}
          </div>
          <h1 className="font-display text-3xl font-bold text-[#2D3436]">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-[#2D3436]/50 text-sm">
            {isLogin 
              ? 'Access your curriculum and progress.' 
              : 'Start your journey to Photoshop mastery.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#2D3436] uppercase tracking-widest pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D3436]/30" size={18} />
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-12 pr-4 py-4 bg-[#FDFBF7] border border-[#D9C5A0]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#427AB5]/20 focus:border-[#427AB5] transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            {email.endsWith('@admin.com') && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] text-amber-600 font-bold flex items-center gap-1 pl-1"
              >
                <ShieldAlert size={12} /> Admin privileges will be requested
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#2D3436] uppercase tracking-widest pl-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D3436]/30" size={18} />
              <input
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-[#FDFBF7] border border-[#D9C5A0]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#427AB5]/20 focus:border-[#427AB5] transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#427AB5] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#406AAF] transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-[#D9C5A0]/20 text-center">
          <p className="text-sm text-[#2D3436]/50">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
              className="ml-2 font-bold text-[#427AB5] hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

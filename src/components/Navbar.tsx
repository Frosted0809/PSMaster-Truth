import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Shield, LayoutDashboard, Home, BookOpen, LogOut, Menu, X, ArrowRight, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  const confirmSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
    setShowLogoutConfirm(false);
    navigate('/auth');
  };

  const handleSignInClick = () => {
    setShowRoleSelection(true);
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    ...(user ? [{ name: 'My Progress', path: '/progress', icon: BookOpen }] : []),
    ...(user?.email === 'hanselluis0809@gmail.com' || profile?.role === 'admin' ? [{ name: 'Admin Panel', path: '/admin', icon: Shield, highlight: true }] : []),
  ];

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-[#D9C5A0]/30 h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold tracking-tighter text-[#406AAF]">
              PSMastery
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-all px-3 py-1.5 rounded-lg",
                    link.highlight ? "bg-[#427AB5] text-white hover:bg-[#345F8F]" : 
                    location.pathname === link.path ? "text-[#427AB5]" : "text-[#2D3436]/70 hover:text-[#427AB5]"
                  )}
                >
                  {link.icon && <link.icon size={16} />}
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-[#FFE8BE]/20 hover:bg-[#FFE8BE]/40 dark:bg-white/5 dark:hover:bg-white/10 text-[#406AAF] dark:text-amber-400 border border-[#D9C5A0]/20 dark:border-white/10 transition-all flex items-center justify-center cursor-pointer shadow-sm"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              <motion.div
                initial={false}
                animate={{ rotate: theme === 'dark' ? 180 : 0, scale: [0.9, 1.1, 1] }}
                transition={{ duration: 0.3 }}
              >
                {theme === 'dark' ? (
                  <Sun size={18} className="text-amber-400" />
                ) : (
                  <Moon size={18} className="text-[#406AAF]" />
                )}
              </motion.div>
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                {profile && (
                  <span className="hidden sm:inline-block text-xs font-semibold px-2 py-1 bg-[#FFE8BE] rounded text-[#406AAF] uppercase">
                    {profile.role}
                  </span>
                )}
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 border border-red-100 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignInClick}
                className="px-4 py-2 bg-[#427AB5] text-white rounded-md text-sm font-semibold hover:bg-[#406AAF] transition-all shadow-lg shadow-blue-500/10"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button className="md:hidden text-[#2D3436]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 left-0 w-full bg-white border-b border-[#D9C5A0]/30 p-6 flex flex-col gap-4 md:hidden shadow-xl"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 text-lg font-medium p-2 rounded-lg",
                    location.pathname === link.path ? "bg-[#FFE8BE]/50 text-[#406AAF]" : "text-[#2D3436]"
                  )}
                >
                  <link.icon size={20} />
                  {link.name}
                </Link>
              ))}
              
              <button
                onClick={() => toggleTheme()}
                className="flex items-center justify-between text-lg font-medium p-2 rounded-lg text-[#2D3436] hover:bg-[#FFE8BE]/30 dark:hover:bg-white/5 transition-colors w-full text-left"
              >
                <div className="flex items-center gap-3 font-medium">
                  {theme === 'dark' ? (
                    <Sun size={20} className="text-amber-400" />
                  ) : (
                    <Moon size={20} className="text-[#406AAF]" />
                  )}
                  <span>{theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}</span>
                </div>
              </button>
              
              {user ? (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="flex items-center gap-3 text-lg font-medium p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleSignInClick();
                  }}
                  className="flex items-center gap-3 text-lg font-medium p-2 rounded-lg text-[#427AB5] hover:bg-[#427AB5]/5 transition-colors"
                >
                  <BookOpen size={20} />
                  Sign In
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowLogoutConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white border border-[#D9C5A0]/40 rounded-[32px] p-8 max-w-sm w-full shadow-2xl text-center space-y-6"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <LogOut size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#2D3436]">Confirm Logout</h3>
                <p className="text-sm text-[#2D3436]/60 leading-relaxed">
                  Are you sure you want to log out of your session?
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 border border-[#D9C5A0]/30 rounded-xl text-sm font-bold text-[#2D3436] hover:bg-[#FDFBF7] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSignOut}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Role Selection Modal */}
      <AnimatePresence>
        {showRoleSelection && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4 text-center overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowRoleSelection(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white border border-[#D9C5A0]/40 rounded-[32px] p-8 max-w-md w-full shadow-2xl space-y-8 my-8"
            >
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-[#2D3436]">Student Sign In</h3>
                <p className="text-sm text-[#2D3436]/60">Access your lessons and track your progress.</p>
              </div>
              
              <div className="grid gap-4">
                <button
                  onClick={() => {
                    setShowRoleSelection(false);
                    navigate('/auth?role=student');
                  }}
                  className="flex items-center gap-6 p-6 bg-[#FDFBF7] border border-[#D9C5A0]/20 rounded-2xl group hover:border-[#427AB5] hover:bg-[#427AB5]/5 transition-all text-left"
                >
                  <div className="w-12 h-12 bg-[#FFE8BE] text-[#406AAF] rounded-xl flex items-center justify-center group-hover:bg-[#427AB5] group-hover:text-white transition-all">
                    <BookOpen size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[#2D3436]">Continue as Student</h4>
                    <p className="text-xs text-[#2D3436]/50">Start your journey and manage your curriculum.</p>
                  </div>
                  <ArrowRight size={20} className="text-[#D9C5A0] group-hover:text-[#427AB5] transition-all" />
                </button>
              </div>

              <div className="pt-2 text-center">
                <button 
                  onClick={() => setShowRoleSelection(false)}
                  className="text-sm font-bold text-[#2D3436]/40 hover:text-[#2D3436] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

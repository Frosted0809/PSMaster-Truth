import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LayoutDashboard, Home, BookOpen, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const signOutAction = async () => {
    await signOut();
    setIsMenuOpen(false);
    navigate('/auth');
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    ...(user ? [{ name: 'My Progress', path: '/progress', icon: BookOpen }] : []),
    ...(user?.email === 'hanselluis0809@gmail.com' || profile?.role === 'admin' ? [{ name: 'Admin Panel', path: '/admin', icon: Shield, highlight: true }] : []),
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-[#D9C5A0]/30 px-6 h-16 flex items-center justify-between">
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
        {user ? (
          <div className="flex items-center gap-4">
            {profile && (
              <span className="hidden sm:inline-block text-xs font-semibold px-2 py-1 bg-[#FFE8BE] rounded text-[#406AAF] uppercase">
                {profile.role}
              </span>
            )}
            <button
              onClick={signOutAction}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 border border-red-100 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="px-4 py-2 bg-[#427AB5] text-white rounded-md text-sm font-semibold hover:bg-[#406AAF] transition-all"
          >
            Sign In
          </Link>
        )}

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-[#2D3436]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
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
            
            {user && (
              <button
                onClick={signOutAction}
                className="flex items-center gap-3 text-lg font-medium p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={20} />
                Logout
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

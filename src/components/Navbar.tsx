import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LayoutDashboard, Home, BookOpen, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    ...(user ? [{ name: 'My Progress', path: '/progress', icon: BookOpen }] : []),
    ...(user?.role === 'Admin' ? [{ name: 'Admin Panel', path: '/admin', icon: Shield }] : []),
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
                "flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#427AB5]",
                location.pathname === link.path ? "text-[#427AB5]" : "text-[#2D3436]/70"
              )}
            >
              {link.name === 'Admin Panel' && <Shield size={16} />}
              {link.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block text-xs font-semibold px-2 py-1 bg-[#FFE8BE] rounded text-[#406AAF]">
              {user.role}
            </span>
            <button
              onClick={logout}
              className="text-[#2D3436]/70 hover:text-[#427AB5] transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
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
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

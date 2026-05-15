import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Clock, Mail, ShieldCheck, LogOut } from 'lucide-react';

export default function PendingApproval() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white border border-[#D9C5A0]/30 rounded-[40px] p-10 shadow-ambient text-center space-y-8"
      >
        <div className="w-20 h-20 bg-[#FFE8BE] rounded-3xl flex items-center justify-center text-[#406AAF] mx-auto">
          <Clock size={40} className="animate-pulse" />
        </div>

        <div className="space-y-4">
          <h1 className="font-display text-3xl font-bold text-[#2D3436]">Account Pending Approval</h1>
          <p className="text-[#2D3436]/60 leading-relaxed">
            Welcome, <span className="font-bold text-[#2D3436]">{profile?.email}</span>. 
            Your registration is currently being reviewed by an administrator. 
            You will gain access to the curriculum once your account is verified.
          </p>
        </div>

        <div className="bg-[#FDFBF7] p-6 rounded-2xl border border-[#D9C5A0]/20 text-left space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Mail size={16} className="text-[#427AB5]" />
            <span className="text-[#2D3436]/50">Status:</span>
            <span className="font-bold text-amber-600">Pending</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <ShieldCheck size={16} className="text-[#427AB5]" />
            <span className="text-[#2D3436]/50">Assigned Role:</span>
            <span className="font-bold text-[#2D3436] uppercase tracking-widest text-[10px] bg-slate-100 px-2 py-0.5 rounded">
              {profile?.role}
            </span>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 text-sm font-bold text-[#427AB5] hover:text-[#406AAF] mx-auto transition-colors"
        >
          <LogOut size={16} />
          Sign Out & Return Home
        </button>
      </motion.div>
    </div>
  );
}

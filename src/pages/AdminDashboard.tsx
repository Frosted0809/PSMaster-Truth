import { motion } from 'motion/react';
import { Users, BookOpen, Plus, TrendingUp, Shield, MoreVertical, LayoutGrid, List } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'lessons'>('analytics');

  const stats = [
    { label: 'Total Students', value: '1,284', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Lessons', value: '45', icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Engagement Rate', value: '94.2%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#427AB5] font-bold text-xs uppercase tracking-[0.2em]">
            <Shield size={14} />
            Administrator Control
          </div>
          <h1 className="font-display text-4xl font-bold text-[#2D3436]">Admin Dashboard</h1>
          <p className="text-[#2D3436]/50">Manage curriculum assets and track institution-wide learning metrics.</p>
        </div>

        <div className="flex bg-white p-1 border border-[#D9C5A0]/30 rounded-2xl shadow-ambient">
          <button 
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === 'analytics' ? "bg-primary-blue text-white shadow-lg" : "text-[#2D3436]/50"
            )}
          >
            Analytics
          </button>
          <button 
            onClick={() => setActiveTab('lessons')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === 'lessons' ? "bg-primary-blue text-white shadow-lg" : "text-[#2D3436]/50"
            )}
          >
            Manage Lessons
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-[#D9C5A0]/20 p-8 rounded-[32px] shadow-ambient flex items-center gap-6"
          >
            <div className={cn("p-4 rounded-2xl shadow-inner", stat.bg)}>
              <stat.icon size={28} className={stat.color} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#2D3436]/40 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-3xl font-bold text-[#2D3436] tracking-tight">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Main Form Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 bg-white border border-[#D9C5A0]/30 rounded-[40px] p-10 shadow-ambient space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-[#2D3436]">Add New Curriculum Module</h2>
            <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
              <MoreVertical size={20} />
            </button>
          </div>

          <form className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#2D3436] uppercase tracking-widest pl-1">Lesson Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Advanced Luminosity Masking"
                  className="w-full px-4 py-4 bg-[#FDFBF7] border border-[#D9C5A0]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#2D3436] uppercase tracking-widest pl-1">Video Source (Vimeo/Wistia)</label>
                <input 
                  type="url" 
                  placeholder="https://..."
                  className="w-full px-4 py-4 bg-[#FDFBF7] border border-[#D9C5A0]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 text-sm"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#2D3436] uppercase tracking-widest pl-1">Materials Link (.psd pack)</label>
                <input 
                  type="url" 
                  placeholder="Cloud Storage Link"
                  className="w-full px-4 py-4 bg-[#FDFBF7] border border-[#D9C5A0]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#2D3436] uppercase tracking-widest pl-1">Knowledge Tier</label>
                <select className="w-full px-4 py-4 bg-[#FDFBF7] border border-[#D9C5A0]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 text-sm appearance-none">
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#2D3436] uppercase tracking-widest pl-1">Learning Objectives (Rich Text Draft)</label>
              <textarea 
                rows={5}
                placeholder="Detailed breakdown of lesson objectives..."
                className="w-full px-4 py-4 bg-[#FDFBF7] border border-[#D9C5A0]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 text-sm resize-none"
              />
            </div>

            <button 
              type="submit" 
              className="px-10 py-4 bg-primary-blue text-white rounded-2xl font-bold flex items-center gap-2 hover:translate-x-1 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <Plus size={20} />
              Publish Module
            </button>
          </form>
        </div>

        <aside className="lg:col-span-4 space-y-8">
          <div className="bg-white border border-[#D9C5A0]/30 rounded-[32px] p-8 shadow-ambient space-y-6">
            <h3 className="text-lg font-bold text-[#2D3436]">Recent Activity</h3>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0" />
                  <div className="text-xs flex-grow">
                    <p className="text-[#2D3436]"><strong>New Student joined</strong> from BSIT-3A section.</p>
                    <p className="text-[#2D3436]/40 mt-1">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-4 text-xs font-bold text-[#427AB5] bg-blue-50 border border-blue-100/50 rounded-2xl hover:bg-blue-100 transition-all">
              View Detailed Logs
            </button>
          </div>

          <div className="bg-primary-blue rounded-[32px] p-8 text-white relative overflow-hidden">
            <TrendingUp size={80} className="absolute -right-4 -bottom-4 opacity-10 rotate-12" />
            <div className="relative z-10 space-y-4">
              <h3 className="text-xl font-bold">Platform Status</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <p className="text-xs font-bold">ALL SYSTEMS OPERATIONAL</p>
              </div>
              <p className="text-sm text-white/70 leading-relaxed text-xs">
                Lesson assets serving from Singapore edge and CDN are healthy. 
              </p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

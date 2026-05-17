import { motion } from 'motion/react';
import { Users, BookOpen, Plus, TrendingUp, Shield, MoreVertical, Check, X, Trash2, AlertCircle, Loader2, User as UserIcon, Upload, Layout } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { UserProfile, Lesson } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, profile, profileLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'approvals' | 'lessons' | 'students'>('approvals');
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [allStudents, setAllStudents] = useState<UserProfile[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Security Gate
  useEffect(() => {
    if (!profileLoading && user && user.email !== 'hanselluis0809@gmail.com' && profile?.role !== 'admin') {
      navigate('/');
    }
  }, [user, profile, profileLoading, navigate]);

  // Lesson Form State
  const [newLesson, setNewLesson] = useState({
    title: '',
    content: '',
    tier: 'Beginner' as any,
    description: '',
    thumbnail_url: '',
    steps: [] as string[]
  });

  const [newStep, setNewStep] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `lesson-thumbnails/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(filePath);

      setNewLesson(prev => ({ ...prev, thumbnail_url: publicUrl }));
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Error uploading image. Please ensure you have created a "thumbnails" bucket in Supabase Storage and set it to public.');
    } finally {
      setUploading(false);
    }
  };

  const addStep = () => {
    if (newStep.trim()) {
      setNewLesson(prev => ({
        ...prev,
        steps: [...prev.steps, newStep.trim()]
      }));
      setNewStep('');
    }
  };

  const removeStep = (index: number) => {
    setNewLesson(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const fetchData = React.useCallback(async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 20000)
    );

    try {
      if (activeTab === 'approvals') {
        const query = supabase
          .from('profiles')
          .select('*')
          .eq('is_approved', false)
          .order('created_at', { ascending: false });
          
        const { data, error }: any = await Promise.race([query, timeoutPromise]);
        if (error) throw error;
        setPendingUsers(data || []);
      } else if (activeTab === 'students') {
        const query = supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student')
          .order('created_at', { ascending: false });
          
        const { data, error }: any = await Promise.race([query, timeoutPromise]);
        if (error) throw error;
        setAllStudents(data || []);
      } else {
        const query = supabase
          .from('lessons')
          .select('*')
          .order('order_index', { ascending: true });

        const { data, error }: any = await Promise.race([query, timeoutPromise]);
        if (error) throw error;
        setLessons(data || []);
      }
    } catch (err: any) {
      console.error(`Error fetching admin data:`, err);
      if (retryCount < 1) return fetchData(retryCount + 1);
      setError(err?.message || 'Failed to fetch admin data.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', userId);
      if (error) throw error;
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Error approving user:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('adding-lesson');
    try {
      const { error } = await supabase
        .from('lessons')
        .insert([newLesson]);
      if (error) throw error;
      setNewLesson({ 
        title: '', 
        content: '', 
        tier: 'Beginner', 
        description: '',
        thumbnail_url: '',
        steps: []
      });
      fetchData(); // Refresh list
    } catch (err) {
      console.error('Error adding lesson:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return;
    setActionLoading(lessonId);
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);
      if (error) throw error;
      setLessons(prev => prev.filter(l => l.id !== lessonId));
    } catch (err) {
      console.error('Error deleting lesson:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#427AB5] font-bold text-xs uppercase tracking-[0.2em]">
            <Shield size={14} />
            Administrator Control
          </div>
          <h1 className="font-display text-4xl font-bold text-[#2D3436]">Admin Dashboard</h1>
          <p className="text-[#2D3436]/50">Control user access and manage the digital curriculum.</p>
        </div>

        <div className="flex bg-white p-1 border border-[#D9C5A0]/30 rounded-2xl shadow-ambient overflow-x-auto">
          <button 
            onClick={() => setActiveTab('approvals')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
              activeTab === 'approvals' ? "bg-primary-blue text-white shadow-lg" : "text-[#2D3436]/50"
            )}
          >
            Approvals
          </button>
          <button 
            onClick={() => setActiveTab('students')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
              activeTab === 'students' ? "bg-primary-blue text-white shadow-lg" : "text-[#2D3436]/50"
            )}
          >
            Student Track
          </button>
          <button 
            onClick={() => setActiveTab('lessons')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
              activeTab === 'lessons' ? "bg-primary-blue text-white shadow-lg" : "text-[#2D3436]/50"
            )}
          >
            Curriculum
          </button>
        </div>
      </header>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-[#427AB5]" size={40} />
        </div>
      ) : error ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="font-medium">{error}</p>
          </div>
          <button 
            onClick={() => fetchData()}
            className="px-6 py-2 bg-primary-blue text-white rounded-xl font-bold hover:scale-105 transition-all"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {activeTab === 'approvals' ? (
            <div className="lg:col-span-8 bg-white border border-[#D9C5A0]/30 rounded-[40px] p-10 shadow-ambient space-y-8">
              <h2 className="font-display text-2xl font-bold text-[#2D3436]">Pending Admissions</h2>
              
              {pendingUsers.length === 0 ? (
                <div className="py-12 text-center text-[#2D3436]/40 italic">
                  No pending user approvals at this time.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((u) => (
                    <motion.div 
                      key={u.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-between p-6 bg-[#FDFBF7] rounded-3xl border border-[#D9C5A0]/20"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#FFE8BE] flex items-center justify-center text-[#406AAF] font-bold">
                          {(u.username || u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#2D3436]">{u.username || u.email}</p>
                          <p className="text-[10px] text-[#2D3436]/40 uppercase font-black tracking-widest">
                            {u.username ? 'Student' : u.role}
                            {u.email.endsWith('@student.local') ? ' (Username-only)' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApprove(u.id)}
                          disabled={!!actionLoading}
                          className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
                        >
                          {actionLoading === u.id ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        </button>
                        <button className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all">
                          <X size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'students' ? (
            <div className="lg:col-span-8 bg-white border border-[#D9C5A0]/30 rounded-[40px] p-10 shadow-ambient space-y-8">
              <h2 className="font-display text-2xl font-bold text-[#2D3436]">Student List</h2>
              
              {allStudents.length === 0 ? (
                <div className="py-12 text-center text-[#2D3436]/40 italic">
                  No registered students found.
                </div>
              ) : (
                <div className="space-y-4">
                  {allStudents.map((u) => (
                    <div 
                      key={u.id}
                      className="flex items-center justify-between p-6 bg-[#FDFBF7] rounded-3xl border border-[#D9C5A0]/20"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#FFE8BE] flex items-center justify-center text-[#406AAF] font-bold">
                          <UserIcon size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-[#2D3436]">{u.username || u.email}</p>
                          <p className="text-[10px] text-green-600 uppercase font-bold tracking-widest">Active Student</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-[#2D3436]/40">Joined</p>
                        <p className="text-xs font-bold text-[#2D3436]">{new Date(u.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Lesson Manager Column */}
              <div className="lg:col-span-8 space-y-8">
                <div className="bg-white border border-[#D9C5A0]/30 rounded-[40px] p-10 shadow-ambient space-y-10">
                  <h2 className="font-display text-2xl font-bold text-[#2D3436]">Add Curriculum Module</h2>
                  <form onSubmit={handleAddLesson} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#2D3436] uppercase tracking-widest pl-1">Title</label>
                        <input 
                          type="text" 
                          required
                          value={newLesson.title}
                          onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                          placeholder="Module Title"
                          className="w-full px-4 py-4 bg-[#FDFBF7] border border-[#D9C5A0]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#2D3436] uppercase tracking-widest pl-1">Knowledge Tier</label>
                        <select 
                          value={newLesson.tier}
                          onChange={(e) => setNewLesson({...newLesson, tier: e.target.value})}
                          className="w-full px-4 py-4 bg-[#FDFBF7] border border-[#D9C5A0]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 text-sm appearance-none"
                        >
                          <option>Beginner</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#2D3436] uppercase tracking-widest pl-1">Description (Short Promo)</label>
                      <input 
                        type="text" 
                        required
                        value={newLesson.description}
                        onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                        placeholder="Brief summary shown in the library"
                        className="w-full px-4 py-4 bg-[#FDFBF7] border border-[#D9C5A0]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 text-sm"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#2D3436] uppercase tracking-widest pl-1">Module Thumbnail (Direct Upload)</label>
                        <div className="flex flex-col gap-4">
                          {newLesson.thumbnail_url && (
                             <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-[#D9C5A0]/30">
                               <img src={newLesson.thumbnail_url} alt="Preview" className="w-full h-full object-cover" />
                               <button 
                                 type="button"
                                 onClick={() => setNewLesson({...newLesson, thumbnail_url: ''})}
                                 className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                               >
                                 <X size={16} />
                               </button>
                             </div>
                          )}
                          <div className="relative">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleFileUpload}
                              disabled={uploading}
                              className="hidden"
                              id="thumbnail-upload"
                            />
                            <label 
                              htmlFor="thumbnail-upload"
                              className={cn(
                                "flex flex-col items-center justify-center w-full min-h-[120px] px-4 py-8 bg-[#FDFBF7] border-2 border-dashed border-[#D9C5A0]/40 rounded-[32px] cursor-pointer hover:border-primary-blue/40 transition-all group",
                                uploading && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              {uploading ? (
                                <div className="flex items-center justify-center gap-3">
                                  <Loader2 className="animate-spin text-primary-blue" />
                                  <span className="text-sm font-bold text-[#2D3436]/50">Uploading to cloud...</span>
                                </div>
                              ) : (
                                <>
                                  <div className="w-12 h-12 rounded-2xl bg-[#427AB5]/10 flex items-center justify-center text-[#427AB5] mb-3 group-hover:scale-110 transition-transform">
                                    <Upload size={24} />
                                  </div>
                                  <p className="text-sm font-bold text-[#2D3436]">Click to upload module cover</p>
                                  <p className="text-[10px] text-[#2D3436]/40 uppercase tracking-widest mt-1">Direct from your device</p>
                                </>
                              )}
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#2D3436] uppercase tracking-widest pl-1">Step-by-Step Instructions (Optional)</label>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={newStep}
                              onChange={(e) => setNewStep(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStep())}
                              placeholder="e.g. Step 1: Open the layer panel..."
                              className="flex-1 px-4 py-4 bg-[#FDFBF7] border border-[#D9C5A0]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 text-sm"
                            />
                            <button 
                              type="button"
                              onClick={addStep}
                              className="px-6 py-4 bg-primary-blue text-white rounded-2xl font-bold hover:bg-deep-blue transition-all"
                            >
                              Add
                            </button>
                          </div>
                          
                          {newLesson.steps.length > 0 && (
                            <div className="space-y-2 pt-2">
                              {newLesson.steps.map((step, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-[#D9C5A0]/10 rounded-xl">
                                  <span className="text-sm text-[#2D3436]/70"><span className="font-bold text-[#427AB5] mr-2">#{idx + 1}</span> {step}</span>
                                  <button 
                                    type="button"
                                    onClick={() => removeStep(idx)}
                                    className="text-red-400 hover:text-red-500 p-1"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#2D3436] uppercase tracking-widest pl-1">Lesson Content (Markdown Supported)</label>
                      <textarea 
                        rows={12}
                        required
                        value={newLesson.content}
                        onChange={(e) => setNewLesson({...newLesson, content: e.target.value})}
                        placeholder="### Introduction&#10;In this module we will learn about..."
                        className="w-full px-4 py-4 bg-[#FDFBF7] border border-[#D9C5A0]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue/20 text-sm font-mono"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={actionLoading === 'adding-lesson'}
                      className="px-10 py-4 bg-primary-blue text-white rounded-2xl font-bold flex items-center gap-2 hover:translate-x-1 transition-all shadow-lg shadow-blue-500/20"
                    >
                      {actionLoading === 'adding-lesson' ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                      Publish Module
                    </button>
                  </form>
                </div>

                <div className="bg-white border border-[#D9C5A0]/30 rounded-[40px] p-10 shadow-ambient space-y-6">
                  <h2 className="font-display text-2xl font-bold text-[#2D3436]">Current Modules</h2>
                  <div className="space-y-4">
                    {lessons.map((lesson) => (
                      <div key={lesson.id} className="flex items-center justify-between p-6 bg-[#FDFBF7] rounded-3xl border border-[#D9C5A0]/20 group">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs",
                            lesson.tier === 'Beginner' ? 'bg-green-500' : lesson.tier === 'Intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                          )}>
                            {lesson.tier[0]}
                          </div>
                          <div>
                            <p className="font-bold text-[#2D3436]">{lesson.title}</p>
                            <p className="text-[10px] text-[#2D3436]/40 uppercase tracking-widest">{lesson.tier}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="p-3 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Activity Column (Always visible) */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="bg-white border border-[#D9C5A0]/30 rounded-[32px] p-8 shadow-ambient space-y-6">
              <h3 className="text-lg font-bold text-[#2D3436]">Insights</h3>
              <div className="p-6 bg-blue-50 border border-blue-100/50 rounded-2xl space-y-2">
                <p className="text-[10px] font-bold text-[#427AB5] uppercase tracking-widest">Platform Integrity</p>
                <p className="text-xs text-[#406AAF] leading-relaxed">
                  Only approved users can access curriculum assets. Admins must end in <strong>@admin.com</strong> for automatic role assignment.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#2D3436]/50">Total Modules:</span>
                  <span className="font-bold">{lessons.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#2D3436]/50">Unapproved:</span>
                  <span className="font-bold text-amber-600">{pendingUsers.length}</span>
                </div>
              </div>
            </div>
          </aside>
        </section>
      )}
    </div>
  );
}

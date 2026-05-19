import { motion, AnimatePresence } from 'motion/react';
import { Users, BookOpen, Plus, Shield, MoreVertical, Check, X, Trash2, AlertCircle, Loader2, User as UserIcon, Upload, Layout, Star, MessageSquare, Reply, Clock, Video } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { UserProfile, Lesson, Feedback } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, profile, profileLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab ] = useState<'lessons' | 'students' | 'feedback'>('students');
  const [allStudents, setAllStudents] = useState<(UserProfile & { 
    last_lesson?: string, 
    progress_count?: number, 
    total_lessons?: number,
    tier_progress?: { [key: string]: { completed: number, total: number } }
  })[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  // Security Gate
  useEffect(() => {
    if (!profileLoading && user && user.email !== 'hanselluis0809@gmail.com' && profile?.role !== 'admin') {
      navigate('/');
    }
  }, [user, profile, profileLoading, navigate]);

  const [isEditing, setIsEditing] = useState<string | null>(null);

  // Lesson Form State
  const [newLesson, setNewLesson] = useState({
    title: '',
    content: '',
    tier: 'Beginner' as any,
    description: '',
    thumbnail_url: '',
    video_url: '',
    steps: [] as string[]
  });

  const [newStep, setNewStep] = useState('');
  const [uploading, setUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);

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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setVideoUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `lesson-videos/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      setNewLesson(prev => ({ ...prev, video_url: publicUrl }));
    } catch (err) {
      console.error('Error uploading video:', err);
      alert('Error uploading video. Please ensure you have created a "videos" bucket in Supabase Storage and set it to public.');
    } finally {
      setVideoUploading(false);
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

  const fetchData = React.useCallback(async (triggerLoading = true) => {
    if (triggerLoading) setLoading(true);
    setError(null);
    
    try {
      // Always fetch lessons for mapping and counts
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (lessonsError) throw lessonsError;
      const currentLessons = lessonsData || [];
      setLessons(currentLessons);
      
      const lessonsMap = currentLessons.reduce((acc: any, l: any) => ({ ...acc, [l.id]: l.title }), {});
      const totalLessonsCount = currentLessons.length;
      const lessonsPerTier = currentLessons.reduce((acc: any, l: any) => {
        acc[l.tier] = (acc[l.tier] || 0) + 1;
        return acc;
      }, {});

      const lessonsTierMap = currentLessons.reduce((acc: any, l: any) => ({ ...acc, [l.id]: l.tier }), {});

      if (activeTab === 'students') {
        // Optimized fetch: Get students and their progress in one request using nested select
        const { data: studentsData, error: studentsError }: any = await supabase
          .from('profiles')
          .select('*, user_progress(lesson_id, completed_at)')
          .eq('role', 'student')
          .order('created_at', { ascending: false });

        if (studentsError) throw studentsError;

        const studentsWithProgress = (studentsData || []).map((s: any) => {
          const userProgress = s.user_progress || [];
          const progress = [...userProgress].sort((a: any, b: any) => {
            const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
            const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
            return dateB - dateA;
          });
          
          const tierProgress: any = {};
          Object.keys(lessonsPerTier).forEach(tier => {
            const tierTotal = lessonsPerTier[tier];
            const tierCompleted = userProgress.filter((p: any) => lessonsTierMap[p.lesson_id] === tier).length;
            tierProgress[tier] = { completed: tierCompleted, total: tierTotal };
          });
          
          return {
            ...s,
            progress_count: progress.length,
            total_lessons: totalLessonsCount,
            last_lesson: progress.length > 0 ? (lessonsMap[progress[0].lesson_id] || 'Unknown Lesson') : 'No progress',
            tier_progress: tierProgress
          };
        });

        setAllStudents(studentsWithProgress);
      } else if (activeTab === 'feedback') {
        const { data, error }: any = await supabase
          .from('feedback')
          .select('*, profiles(username, email)')
          .order('created_at', { ascending: false });

        if (error) {
          if (error.code === '42P01') {
            setFeedback([]);
          } else {
            throw error;
          }
        } else {
          setFeedback(data || []);
        }
      }
    } catch (err: any) {
      console.error(`Error fetching admin data:`, err);
      if (err.message === 'Failed to fetch') {
        setError('Failed to fetch admin data. Database connection issue.');
      }
      setError(err?.message || 'Failed to fetch admin data.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(isEditing ? 'updating-lesson' : 'adding-lesson');
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('lessons')
          .update(newLesson)
          .eq('id', isEditing);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert([newLesson]);
        if (error) throw error;
      }

      setNewLesson({ 
        title: '', 
        content: '', 
        tier: 'Beginner', 
        description: '',
        thumbnail_url: '',
        video_url: '',
        steps: []
      });
      setIsEditing(null);
      fetchData(false); // Refresh list without full loading indicator
    } catch (err) {
      console.error('Error saving lesson:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setIsEditing(lesson.id);
    setNewLesson({
      title: lesson.title,
      content: lesson.content,
      tier: lesson.tier,
      description: lesson.description || '',
      thumbnail_url: lesson.thumbnail_url || '',
      video_url: lesson.video_url || '',
      steps: lesson.steps || []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setNewLesson({ 
      title: '', 
      content: '', 
      tier: 'Beginner', 
      description: '',
      thumbnail_url: '',
      video_url: '',
      steps: []
    });
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

  const handleReplyFeedback = async (feedbackId: string) => {
    const text = replyText[feedbackId];
    if (!text?.trim()) return;

    setActionLoading(`reply-${feedbackId}`);
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ admin_reply: text.trim() })
        .eq('id', feedbackId);
      
      if (error) throw error;

      setFeedback(prev => prev.map(f => f.id === feedbackId ? { ...f, admin_reply: text.trim() } : f));
      setReplyText(prev => ({ ...prev, [feedbackId]: '' }));
    } catch (err) {
      console.error('Error replying to feedback:', err);
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
            onClick={() => setActiveTab('students')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
              activeTab === 'students' ? "bg-primary-blue text-white shadow-lg" : "text-[#2D3436]/50"
            )}
          >
            Student Track
          </button>
          <button 
            onClick={() => setActiveTab('feedback')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
              activeTab === 'feedback' ? "bg-primary-blue text-white shadow-lg" : "text-[#2D3436]/50"
            )}
          >
            Feedback
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
          {activeTab === 'students' ? (
            <div className="lg:col-span-8 bg-white border border-[#D9C5A0]/30 rounded-[40px] p-10 shadow-ambient space-y-8">
              <h2 className="font-display text-2xl font-bold text-[#2D3436]">Student Performance Tracking</h2>
              
              {allStudents.length === 0 ? (
                <div className="py-12 text-center text-[#2D3436]/40 italic">
                  No registered students found.
                </div>
              ) : (
                <div className="space-y-4">
                  {allStudents.map((u) => {
                    const progressPercent = u.total_lessons && u.total_lessons > 0 ? (u.progress_count || 0) / u.total_lessons * 100 : 0;
                    return (
                    <div 
                      key={u.id}
                      className="flex flex-col p-6 bg-[#FDFBF7] rounded-3xl border border-[#D9C5A0]/20 gap-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-[#FFE8BE] flex items-center justify-center text-[#406AAF] font-bold">
                            <UserIcon size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-[#2D3436]">{u.username || u.email}</p>
                            <p className="text-[10px] text-[#2D3436]/40 uppercase font-bold tracking-widest">
                              Joined {new Date(u.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-[#2D3436]/40 uppercase tracking-widest">Completion</p>
                          <p className="text-sm font-black text-[#427AB5]">{u.progress_count} / {u.total_lessons}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-[#2D3436]/50">Total Progress:</span>
                          <span className="text-[#427AB5]">{u.last_lesson}</span>
                        </div>
                        
                        <div className="h-2 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            className="h-full bg-[#427AB5]"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {['Beginner', 'Intermediate', 'Advanced'].map((tier) => {
                            const data = u.tier_progress?.[tier];
                            if (!data || data.total === 0) return null;
                            const percent = (data.completed / data.total) * 100;
                            
                            return (
                              <div key={tier} className="space-y-1">
                                <div className="flex justify-between text-[8px] font-black uppercase tracking-tight">
                                  <span className={cn(
                                    tier === 'Beginner' ? 'text-green-600' : tier === 'Intermediate' ? 'text-amber-500' : 'text-red-500'
                                  )}>{tier}</span>
                                  <span className="text-[#2D3436]/40">{data.completed}/{data.total}</span>
                                </div>
                                <div className="h-1 w-full bg-black/5 rounded-full overflow-hidden">
                                  <div 
                                    className={cn(
                                      "h-full transition-all duration-500",
                                      tier === 'Beginner' ? 'bg-green-500' : tier === 'Intermediate' ? 'bg-amber-500' : 'bg-red-500'
                                    )}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === 'feedback' ? (
            <div className="lg:col-span-8 bg-white border border-[#D9C5A0]/30 rounded-[40px] p-10 shadow-ambient space-y-8">
              <h2 className="font-display text-2xl font-bold text-[#2D3436]">Student Reviews & Feedback</h2>
              
              {feedback.length === 0 ? (
                <div className="py-24 text-center space-y-4">
                  <div className="w-20 h-20 bg-[#FDFBF7] rounded-full flex items-center justify-center mx-auto text-[#D9C5A0]">
                    <MessageSquare size={32} />
                  </div>
                  <p className="text-[#2D3436]/40 italic">No feedback messages yet. Encourage students to leave ratings on lessons!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {feedback.map((f: any) => (
                    <div key={f.id} className="p-6 bg-[#FDFBF7] rounded-3xl border border-[#D9C5A0]/20 space-y-4 shadow-sm group hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#FFE8BE] rounded-xl flex items-center justify-center text-[#406AAF] font-bold text-sm">
                            {(f.profiles?.username || f.profiles?.email || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#2D3436]">{f.profiles?.username || f.profiles?.email}</p>
                            <div className="flex text-amber-500 gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={10} fill={i < f.rating ? "currentColor" : "none"} strokeWidth={3} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-[#2D3436]/30 font-bold flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(f.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <p className="text-sm text-[#2D3436]/70 leading-relaxed italic border-l-2 border-[#D9C5A0]/30 pl-4">
                        "{f.comment}"
                      </p>

                      {f.admin_reply ? (
                        <div className="ml-8 p-4 bg-[#427AB5]/5 rounded-2xl border border-[#427AB5]/10 space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-black text-[#427AB5] uppercase tracking-[0.2em]">
                            <Reply size={12} className="rotate-180" />
                            Admin Reply
                          </div>
                          <p className="text-xs text-[#2D3436]/80 leading-relaxed">{f.admin_reply}</p>
                        </div>
                      ) : (
                        <div className="ml-8 space-y-3">
                          <textarea 
                            value={replyText[f.id] || ''}
                            onChange={(e) => setReplyText(prev => ({ ...prev, [f.id]: e.target.value }))}
                            placeholder="Type your response to this student..."
                            className="w-full p-4 bg-white border border-[#D9C5A0]/20 rounded-2xl text-xs focus:ring-2 focus:ring-[#427AB5]/20 focus:outline-none placeholder:text-[#2D3436]/30 resize-none min-h-[80px]"
                          />
                          <button 
                            onClick={() => handleReplyFeedback(f.id)}
                            disabled={actionLoading === `reply-${f.id}`}
                            className="px-6 py-2 bg-[#427AB5] text-white rounded-xl text-xs font-bold hover:bg-[#345F8F] disabled:opacity-50 flex items-center gap-2"
                          >
                            {actionLoading === `reply-${f.id}` ? <Loader2 size={14} className="animate-spin" /> : <Reply size={14} />}
                            Send Reply
                          </button>
                        </div>
                      )}
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
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl font-bold text-[#2D3436]">
                      {isEditing ? 'Edit Module' : 'Add Curriculum Module'}
                    </h2>
                    {isEditing && (
                      <button 
                        onClick={cancelEdit}
                        className="text-xs font-bold text-red-500 hover:underline uppercase tracking-widest"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                  <form onSubmit={handleSaveLesson} className="space-y-6">
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

                      <div className="space-y-4">
                        <label className="text-xs font-bold text-[#2D3436] uppercase tracking-widest pl-1">Module Video (Lesson MP4/Recordings)</label>
                        <div className="flex flex-col gap-4">
                          {newLesson.video_url && (
                             <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-[#D9C5A0]/30 bg-black">
                               <video src={newLesson.video_url} controls className="w-full h-full" />
                               <button 
                                 type="button"
                                 onClick={() => setNewLesson({...newLesson, video_url: ''})}
                                 className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                               >
                                 <X size={16} />
                               </button>
                             </div>
                          )}
                          <div className="relative">
                            <input 
                              type="file" 
                              accept="video/*"
                              onChange={handleVideoUpload}
                              disabled={videoUploading}
                              className="hidden"
                              id="video-upload"
                            />
                            <label 
                              htmlFor="video-upload"
                              className={cn(
                                "flex flex-col items-center justify-center w-full min-h-[120px] px-4 py-8 bg-[#FDFBF7] border-2 border-dashed border-[#D9C5A0]/40 rounded-[32px] cursor-pointer hover:border-primary-blue/40 transition-all group",
                                videoUploading && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              {videoUploading ? (
                                <div className="flex items-center justify-center gap-3">
                                  <Loader2 className="animate-spin text-primary-blue" />
                                  <span className="text-sm font-bold text-[#2D3436]/50">Uploading video...</span>
                                </div>
                              ) : (
                                <>
                                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3 group-hover:scale-110 transition-transform">
                                    <Video size={24} />
                                  </div>
                                  <p className="text-sm font-bold text-[#2D3436]">Click to upload module video</p>
                                  <p className="text-[10px] text-[#2D3436]/40 uppercase tracking-widest mt-1">MP4, MOV supported</p>
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
                    <div className="flex items-center gap-4">
                      <button 
                        type="submit" 
                        disabled={!!actionLoading}
                        className="px-10 py-4 bg-primary-blue text-white rounded-2xl font-bold flex items-center gap-2 hover:translate-x-1 transition-all shadow-lg shadow-blue-500/20"
                      >
                        {actionLoading === 'adding-lesson' || actionLoading === 'updating-lesson' ? (
                          <Loader2 className="animate-spin" />
                        ) : isEditing ? (
                          <Check size={20} />
                        ) : (
                          <Plus size={20} />
                        )}
                        {isEditing ? 'Update Module' : 'Publish Module'}
                      </button>
                      
                      {isEditing && (
                        <button 
                          type="button"
                          onClick={cancelEdit}
                          className="px-6 py-4 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-100 transition-all"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
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
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEditLesson(lesson)}
                            className="p-3 bg-blue-50 text-[#427AB5] rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-100"
                            title="Edit Module"
                          >
                            <Layout size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="p-3 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100"
                            title="Delete Module"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Activity Column (Always visible) */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="bg-[#1A1E21] rounded-[32px] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#427AB5]/20 blur-3xl" />
               <h3 className="text-lg font-bold">Quick Actions</h3>
               <div className="space-y-2">
                  <button onClick={() => setActiveTab('lessons')} className="w-full text-left p-4 bg-white/5 rounded-2xl text-sm hover:bg-white/10 transition-colors flex items-center justify-between group">
                    Add New Module <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                  </button>
                  <button onClick={() => setActiveTab('feedback')} className="w-full text-left p-4 bg-white/5 rounded-2xl text-sm hover:bg-white/10 transition-colors flex items-center justify-between group">
                    Review Feedback <MessageSquare size={16} />
                  </button>
               </div>
            </div>
          </aside>
        </section>
      )}
    </div>
  );
}

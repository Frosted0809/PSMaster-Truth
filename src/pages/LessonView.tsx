import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, ChevronRight, Loader2, ArrowLeft, ArrowRight, Check, BookOpen, Trophy, Star, Send, MessageSquare, Reply } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Lesson, Feedback } from '../types';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';

export default function LessonView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [relatedLessons, setRelatedLessons] = useState<Lesson[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Feedback state
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    const fetchLessonData = async (retryCount = 0) => {
      if (!id || !user) return;
      setLoading(true);
      setError(null);
      
      try {
        // 1. Fetch current lesson
        const { data: currentLesson, error: lessonError }: any = await supabase
          .from('lessons')
          .select('*')
          .eq('id', id)
          .single();
        
        if (lessonError) throw lessonError;
        setLesson(currentLesson);

        // 2. Check completion
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('lesson_id', id)
          .maybeSingle();
        
        setIsCompleted(!!progressData);

        // 3. Fetch related
        if (currentLesson) {
          const { data: related } = await supabase
            .from('lessons')
            .select('*')
            .eq('tier', currentLesson.tier)
            .order('order_index', { ascending: true })
            .limit(10);
          
          setRelatedLessons(related || []);
        }

        // 4. Fetch feedback
        const feedbackQuery = supabase
          .from('feedback')
          .select('*, profiles(username, email)')
          .eq('lesson_id', id)
          .order('created_at', { ascending: false });
        
        const { data: fbData, error: fbError } = await (feedbackQuery as any);
        if (!fbError) setFeedbacks(fbData || []);

      } catch (err: any) {
        console.error(`Error fetching lesson:`, err);
        if (err.message === 'Failed to fetch') {
          setError('Failed to load lesson. Connection issues detected.');
        }
        if (retryCount < 1) return fetchLessonData(retryCount + 1);
        setError(err.message || 'An unexpected error occurred while loading this module.');
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [id, user]);

  const handleComplete = async () => {
    if (!id || !user || isCompleted || actionLoading) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('user_progress')
        .insert([{ user_id: user.id, lesson_id: id }]);
      
      if (error && error.code !== '23505') throw error;
      
      setIsCompleted(true);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      const currentIndex = relatedLessons.findIndex(l => l.id === id);
      const nextLesson = relatedLessons[currentIndex + 1];
      
      if (nextLesson) {
        setTimeout(() => navigate(`/lesson/${nextLesson.id}`), 1500);
      }
    } catch (err: any) {
      console.error('Error marking as complete:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !comment.trim() || feedbackLoading) return;

    setFeedbackLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedback')
        .insert([{
          user_id: user.id,
          lesson_id: id,
          rating,
          comment: comment.trim()
        }])
        .select('*, profiles(username, email)')
        .single();

      if (error) throw error;
      
      if (data) {
        setFeedbacks(prev => [data as any, ...prev]);
        setComment('');
        setRating(5);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('Could not submit feedback. Make sure the "feedback" table exists.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#427AB5]" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 max-w-md">
          <p className="font-bold mb-1">Module Load Error</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-[#427AB5] text-white rounded-xl font-bold hover:scale-105 transition-all">Retry Loading</button>
      </div>
    );
  }

  if (!lesson) return null;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-0 overflow-x-hidden">
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-12 left-4 right-4 md:left-1/2 md:-translate-x-1/2 z-50 pointer-events-none flex justify-center"
          >
            <div className="bg-[#1A1E21] text-white px-6 py-4 md:py-6 rounded-3xl shadow-2xl flex items-center gap-4 border border-white/10 max-w-lg w-full">
              <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white">
                <Trophy size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-widest text-green-400">Mastery Achievement</p>
                <p className="font-display font-bold text-lg">Module "{lesson.title}" Completed!</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-6 md:mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 text-[#2D3436]/50 hover:text-[#427AB5] font-bold transition-all text-sm group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Curriculum
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        <div className="lg:col-span-8 space-y-8 md:space-y-12 min-w-0">
          <header className="bg-[#1A1E21] rounded-[32px] md:rounded-[40px] p-6 md:p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/90">Curriculum</span>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm text-white",
                  lesson.tier === 'Beginner' ? 'bg-green-500' : lesson.tier === 'Intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                )}>
                  {lesson.tier} Tier
                </span>
              </div>
              <div className="space-y-4">
                <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight break-words">
                  {lesson.title}
                </h1>
                <p className="text-base md:text-xl text-white/60 leading-relaxed font-medium italic border-l-4 border-[#FFE8BE] pl-4 md:pl-6 max-w-2xl">
                  {lesson.description}
                </p>
              </div>
            </div>
          </header>

          <article className="bg-white border border-[#D9C5A0]/30 rounded-[32px] md:rounded-[40px] p-6 md:p-12 shadow-ambient overflow-hidden min-w-0">
            {lesson.steps && lesson.steps.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xs font-black uppercase text-[#427AB5] tracking-[0.2em] mb-6 flex items-center gap-2">
                  <span className="w-8 h-px bg-[#427AB5]/30"></span>
                  Checkpoint Checklist
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lesson.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-5 md:p-6 bg-[#FDFBF7] rounded-3xl border border-[#D9C5A0]/20">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#427AB5] text-white flex items-center justify-center text-xs font-black shadow-lg shadow-blue-500/20">
                        {idx + 1}
                      </div>
                      <p className="text-sm font-medium text-[#2D3436]/80 leading-relaxed pt-1">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
                <hr className="mt-12 border-[#D9C5A0]/20" />
              </div>
            )}

            <div className="markdown-body prose prose-slate max-w-full break-words overflow-x-hidden">
              <ReactMarkdown>{lesson.content}</ReactMarkdown>
            </div>
            
            <div className="mt-12 md:mt-16 pt-8 md:pt-12 border-t border-[#D9C5A0]/20 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
              <div className="space-y-1 text-center md:text-left">
                <p className="text-xs font-black uppercase text-[#427AB5] tracking-widest">Mastery progress</p>
                <p className="text-xs md:text-sm text-[#2D3436]/50">Mark this module as finished to track your journey.</p>
              </div>
              
              <button 
                onClick={handleComplete}
                disabled={actionLoading || isCompleted}
                className={cn(
                  "w-full md:w-auto px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black text-xs md:text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3",
                  isCompleted 
                    ? "bg-[#FDFBF7] text-green-600 border border-green-200 cursor-default"
                    : "bg-primary-blue text-white shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                {actionLoading ? <Loader2 className="animate-spin" /> : isCompleted ? <CheckCircle size={20} /> : <Check size={20} />}
                {isCompleted ? 'Module Finished' : 'Complete Module'}
              </button>
            </div>
          </article>

          {/* Feedback Section */}
          <section className="bg-white border border-[#D9C5A0]/30 rounded-[32px] md:rounded-[40px] p-6 md:p-12 shadow-ambient space-y-12">
            <div className="space-y-2">
              <h2 className="font-display text-3xl font-bold text-[#2D3436]">Module Feedback</h2>
              <p className="text-[#2D3436]/50 text-sm">Help us improve the curriculum by leaving your thoughts and rating.</p>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#2D3436]/40 ml-1">Rating Proficiency</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-all hover:scale-110 active:scale-95"
                    >
                      <Star 
                        size={32} 
                        className={cn(
                          star <= rating ? "text-amber-400 fill-amber-400" : "text-[#D9C5A0]/40"
                        )} 
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-bold text-[#2D3436]/60 self-center">
                    {rating === 5 ? 'Excellent' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#2D3436]/40 ml-1">Commentary</label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you learn? What can we improve?"
                  required
                  rows={4}
                  className="w-full p-6 bg-[#FDFBF7] border border-[#D9C5A0]/30 rounded-[28px] focus:ring-2 focus:ring-[#427AB5]/20 focus:outline-none placeholder:text-[#2D3436]/30 text-sm leading-relaxed"
                />
              </div>

              <button 
                type="submit"
                disabled={feedbackLoading}
                className="px-10 py-4 bg-[#1A1E21] text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {feedbackLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                Submit Review
              </button>
            </form>

            <div className="pt-12 border-t border-[#D9C5A0]/20 space-y-8">
              <h3 className="font-bold text-lg text-[#2D3436] flex items-center gap-3">
                <MessageSquare size={20} className="text-[#427AB5]" />
                Previous Reviews ({feedbacks.length})
              </h3>

              {feedbacks.length === 0 ? (
                <div className="py-12 text-center text-[#2D3436]/30 italic text-sm">
                  Be the first to review this module.
                </div>
              ) : (
                <div className="space-y-8">
                  {feedbacks.map((f) => (
                    <motion.div 
                      key={f.id} 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#FFE8BE] rounded-xl flex items-center justify-center text-[#406AAF] font-bold text-sm">
                            {(f.profiles?.username || f.profiles?.email || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#2D3436] text-sm">{f.profiles?.username || f.profiles?.email}</p>
                            <div className="flex text-amber-500 gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={10} fill={i < f.rating ? "currentColor" : "none"} strokeWidth={3} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#2D3436]/30 uppercase tracking-widest">{new Date(f.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-[#2D3436]/70 leading-relaxed pl-1">
                        {f.comment}
                      </p>

                      {f.admin_reply && (
                        <div className="ml-8 p-5 bg-[#427AB5]/5 border border-[#427AB5]/10 rounded-3xl space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-black text-[#427AB5] uppercase tracking-[0.2em]">
                            <Reply size={12} className="rotate-180" />
                            Admin Reply
                          </div>
                          <p className="text-sm text-[#2D3436]/80 leading-relaxed italic">{f.admin_reply}</p>
                        </div>
                      )}
                      
                      <hr className="border-[#D9C5A0]/10 mt-8" />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          <div className="lg:sticky lg:top-24 space-y-8">
            <div className="bg-white border border-[#D9C5A0]/30 rounded-[32px] overflow-hidden shadow-ambient">
              <div className="p-8 border-b border-[#D9C5A0]/20 bg-[#FDFBF7]/50">
                <div className="flex items-center gap-2 text-[#427AB5] font-bold text-[10px] uppercase tracking-widest mb-2">
                  <BookOpen size={14} />
                  Curriculum Track
                </div>
                <h3 className="text-lg md:text-xl font-bold text-[#2D3436]">Path Progress</h3>
              </div>
              
              <div className="max-h-[500px] overflow-y-auto">
                {relatedLessons.map((l, i) => {
                  const isCurrent = l.id === id;
                  return (
                    <Link 
                      key={l.id} 
                      to={`/lesson/${l.id}`}
                      className={cn(
                        "flex gap-4 p-6 transition-all border-b border-[#D9C5A0]/10 last:border-0 group",
                        isCurrent ? "bg-[#FFE8BE]/10" : "hover:bg-[#FFE8BE]/5"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 border transition-all",
                        isCurrent ? "bg-primary-blue text-white shadow-lg" : "bg-white text-[#2D3436]/30 border-[#D9C5A0]/30 group-hover:border-[#427AB5]/40"
                      )}>
                        {i + 1}
                      </div>
                      <div>
                        <p className={cn(
                          "text-[10px] font-bold uppercase tracking-widest mb-0.5",
                          isCurrent ? "text-[#427AB5]" : "text-[#2D3436]/40"
                        )}>Module {i + 1}</p>
                        <h4 className={cn(
                          "text-sm font-bold line-clamp-1 transition-colors",
                          isCurrent ? "text-[#2D3436]" : "text-[#2D3436]/60 group-hover:text-[#427AB5]"
                        )}>{l.title}</h4>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

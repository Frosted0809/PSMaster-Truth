import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { CheckCircle2, PlayCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lesson } from '../types';

export default function MyProgress() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Mock progress ids for now, until we add a progress table
  const completedIds = ['1', '2', '3'];

  useEffect(() => {
    const fetchLessons = async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('order_index', { ascending: true });
      if (!error && data) setLessons(data);
      setLoading(false);
    };
    fetchLessons();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#427AB5]" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <h1 className="font-display text-4xl font-bold text-[#2D3436]">Your Learning Journey</h1>
        <p className="text-[#2D3436]/50">Track your progress and pick up where you left off, {user?.email?.split('@')[0]}.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {lessons.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[#2D3436]/40 italic">
            No lessons available yet.
          </div>
        ) : (
          lessons.map((lesson, i) => {
            const isCompleted = completedIds.includes(lesson.id);
            
            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-[#D9C5A0]/20 rounded-3xl overflow-hidden shadow-ambient group"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-200">
                  <img src={`https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=400&q=80`} alt={lesson.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60" />
                  {isCompleted && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white p-1 rounded-full shadow-lg">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle size={48} className="text-white" />
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                    <span className={lesson.tier === 'Beginner' ? 'text-green-500' : lesson.tier === 'Intermediate' ? 'text-yellow-600' : 'text-red-500'}>
                      {lesson.tier}
                    </span>
                    <span className="text-slate-400">
                      Module
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-[#2D3436] line-clamp-1">{lesson.title}</h3>
                  
                  <Link 
                    to={`/lesson/${lesson.id}`}
                    className="block w-full py-3 text-center bg-[#FDFBF7] border border-[#D9C5A0]/30 rounded-xl text-xs font-bold text-[#406AAF] hover:bg-[#FFE8BE]/50 transition-colors"
                  >
                    {isCompleted ? 'Review Lesson' : 'Continue Learning'}
                  </Link>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

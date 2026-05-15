import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Play, BookOpen, Layers, Award, ArrowRight, Star, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { LessonTier, Lesson } from '../types';

export default function Landing() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety timeout
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const fetchLessons = async () => {
      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('*')
          .order('order_index', { ascending: true });
        
        if (!error && data) {
          setLessons(data);
        }
      } catch (err) {
        console.error('Error fetching lessons:', err);
      } finally {
        setLoading(false);
        clearTimeout(timer);
      }
    };

    fetchLessons();
    return () => clearTimeout(timer);
  }, []);

  const categories: { tier: LessonTier; label: string; description: string; color: string; icon: any }[] = [
    { 
      tier: 'Beginner', 
      label: 'Easy', 
      description: 'Master the core interface, layers, and basic non-destructive editing.',
      color: 'bg-green-500',
      icon: BookOpen
    },
    { 
      tier: 'Intermediate', 
      label: 'Intermediate', 
      description: 'Deep dive into masks, smart objects, and professional retouching techniques.',
      color: 'bg-yellow-500',
      icon: Layers
    },
    { 
      tier: 'Advanced', 
      label: 'Advanced', 
      description: 'Master high-end compositing, matte painting, and complex color grading.',
      color: 'bg-red-500',
      icon: Award
    }
  ];

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#427AB5]" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[40px] bg-white border border-[#D9C5A0]/20 shadow-ambient p-12 md:p-24 flex flex-col items-center text-center gap-8">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFE8BE]/30 blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 blur-3xl -z-10" />

        <div className="space-y-8 max-w-4xl z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFE8BE] text-[#406AAF] text-xs font-bold tracking-[0.2em] uppercase rounded-full"
          >
            <Star size={14} fill="currentColor" />
            The Photoshop Authority for BSIT
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-6xl md:text-8xl font-bold tracking-tighter text-[#2D3436] leading-none"
          >
            Master the Pixel at Your <span className="text-[#427AB5]">Own Pace.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-[#2D3436]/60 leading-relaxed max-w-3xl mx-auto"
          >
            From digital foundations to high-end CGI post-production. 
            Join the premier training ecosystem refined for tomorrow's visual innovators.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <Link 
              to="/auth" 
              className="px-10 py-5 bg-primary-blue text-white rounded-xl font-bold text-lg hover:bg-deep-blue transition-all shadow-xl shadow-blue-500/20 active:scale-95"
            >
              Start Your Journey
            </Link>
            <button className="px-10 py-5 border-2 border-[#D9C5A0]/30 text-[#2D3436] rounded-xl font-bold text-lg hover:bg-[#FFE8BE]/20 transition-all">
              Browse Curriculum
            </button>
          </motion.div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="font-display text-4xl font-bold text-[#2D3436]">Choose Your Proficiency</h2>
          <p className="text-[#2D3436]/60">Sequential pathways designed to take you from amateur to industry-ready.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((cat, i) => {
            const tierLessons = lessons.filter(l => l.tier === cat.tier);
            return (
              <motion.div
                key={cat.tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-white border border-[#D9C5A0]/30 p-8 rounded-3xl shadow-ambient group cursor-pointer transition-all hover:border-[#427AB5]/50"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={cn("p-3 rounded-2xl text-white shadow-lg", cat.color)}>
                    <cat.icon size={24} />
                  </div>
                  <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-sm", cat.color)}>
                    {cat.label}
                  </span>
                </div>
                
                <h3 className="text-2xl font-bold text-[#2D3436] mb-3 group-hover:text-[#427AB5] transition-colors">{cat.tier}</h3>
                <p className="text-[#2D3436]/70 text-sm leading-relaxed mb-6">
                  {cat.description}
                </p>
                
                <div className="pt-6 border-t border-[#D9C5A0]/20 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#2D3436]/40 font-bold text-[10px] uppercase tracking-widest">
                    <Play size={12} />
                    {tierLessons.length} curated modules
                  </div>
                  <Link 
                    to={tierLessons.length > 0 ? `/lesson/${tierLessons[0].id}` : '/auth'}
                    className="flex items-center gap-1 text-sm font-bold text-[#427AB5] hover:gap-3 transition-all"
                  >
                    Explore <ArrowRight size={16} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Featured Lesson Section */}
      <section className="bg-deep-blue rounded-[40px] p-12 text-white overflow-hidden relative">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent skew-x-12" />
        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold tracking-widest uppercase">
              Spotlight Course
            </div>
            <h2 className="text-4xl font-bold font-display">The Art of High-End Retouching</h2>
            <p className="text-white/80 leading-relaxed">
              Learn the exact frequency separation and dodging/burning techniques used for luxury fashion magazines. Updated for 2026.
            </p>
            <button className="px-8 py-3 bg-white text-deep-blue rounded-xl font-bold hover:scale-105 active:scale-95 transition-all">
              Watch Preview
            </button>
          </div>
          <div className="aspect-video bg-black/30 rounded-2xl backdrop-blur-md border border-white/20 flex items-center justify-center">
            <Play size={40} className="text-white opacity-40" />
          </div>
        </div>
      </section>
    </div>
  );
}

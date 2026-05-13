import { useParams, Link } from 'react-router-dom';
import { mockLessons } from '../data/mockLessons';
import { motion } from 'motion/react';
import { Play, Download, CheckCircle, Clock, ChevronRight, Share2, Bookmark } from 'lucide-react';
import { cn } from '../lib/utils';

export default function LessonView() {
  const { id } = useParams();
  const lesson = mockLessons.find(l => l.id === id);

  if (!lesson) return <div className="text-center py-24 font-display text-2xl">Lesson not found</div>;

  const sidebarLessons = mockLessons
    .filter(l => l.tier === lesson.tier && l.id !== lesson.id)
    .slice(0, 14);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      {/* Main Content */}
      <div className="lg:col-span-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl relative border-4 border-white"
        >
          <img 
            src={lesson.thumbnail.replace('w=800', 'w=1600')} 
            alt={lesson.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-primary-blue text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer">
              <Play size={40} fill="currentColor" />
            </div>
          </div>
          
          {/* Mock Video UI */}
          <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-white/80">
            <div className="flex items-center gap-4">
              <div className="h-1.5 w-48 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-primary-blue" />
              </div>
              <span className="text-xs font-mono">12:45 / {lesson.duration}</span>
            </div>
            <div className="flex gap-4">
              <Share2 size={18} className="cursor-pointer hover:text-white" />
              <Bookmark size={18} className="cursor-pointer hover:text-white" />
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-sm",
                  lesson.tier === 'Beginner' ? 'bg-green-500' : 
                  lesson.tier === 'Intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                )}>
                  {lesson.tier}
                </span>
                <div className="flex items-center gap-1 text-[#2D3436]/50 text-sm">
                  <Clock size={14} />
                  {lesson.duration}
                </div>
              </div>
              <h1 className="font-display text-4xl font-bold text-[#2D3436] leading-tight">
                {lesson.title}
              </h1>
            </div>
            
            <a 
              href={lesson.materialsUrl}
              className="flex items-center gap-2 px-6 py-3 bg-[#FFE8BE] text-[#406AAF] rounded-xl font-bold hover:bg-[#FFE8BE]/80 transition-all border border-[#D9C5A0]/30"
            >
              <Download size={18} />
              Resources (.psd)
            </a>
          </div>

          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-[#2D3436]/70 leading-relaxed uppercase font-bold tracking-widest text-[11px] mb-4">Description</p>
            <p className="text-[#2D3436]/80 text-lg leading-relaxed">
              {lesson.description}
            </p>
            
            <div className="mt-8 grid md:grid-cols-2 gap-6 bg-white border border-[#D9C5A0]/20 rounded-3xl p-8 shadow-ambient">
              <div>
                <h4 className="font-bold text-[#2D3436] mb-4 flex items-center gap-2 uppercase tracking-tighter">
                  <CheckCircle size={18} className="text-green-500" />
                  What you'll learn
                </h4>
                <ul className="space-y-3 text-sm text-[#2D3436]/70">
                  <li>• High-end non-destructive editing workflows</li>
                  <li>• Industry-standard organizational habits</li>
                  <li>• Complex selection and refinement techniques</li>
                  <li>• Mastering the technical brush engine</li>
                </ul>
              </div>
              <div className="bg-blue-50/50 rounded-2xl p-6 flex flex-col justify-center">
                <p className="text-xs font-bold text-[#427AB5] mb-2 uppercase tracking-widest">Student Tip</p>
                <p className="text-sm text-[#406AAF] italic italic leading-relaxed">
                  "Remember to use Smart Objects before applying any destructive filters. This is foundational for the level of precision expected in high-end compositing."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - Up Next */}
      <aside className="lg:col-span-4 space-y-8">
        <div className="bg-white border border-[#D9C5A0]/30 rounded-3xl p-8 shadow-ambient">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-[#2D3436]">Course Material</h3>
            <span className="text-[10px] font-bold px-2 py-1 bg-[#FDFBF7] border border-[#D9C5A0]/30 rounded uppercase tracking-widest">3 Files</span>
          </div>
          
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-4 bg-[#FDFBF7] rounded-2xl border border-[#D9C5A0]/20 hover:border-[#427AB5]/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg border border-[#D9C5A0]/30 flex items-center justify-center text-[#406AAF] group-hover:bg-[#427AB5] group-hover:text-white transition-all">
                    <Download size={18} />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-[#2D3436]">Resource_Pack_0{i}.zip</p>
                    <p className="text-[#2D3436]/40">12.4 MB • Zip</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#D9C5A0]/30 rounded-3xl overflow-hidden shadow-ambient">
          <div className="p-8 border-b border-[#D9C5A0]/20">
            <h3 className="text-xl font-bold text-[#2D3436]">Up Next</h3>
            <p className="text-sm text-[#2D3436]/50">14 lessons remaining in {lesson.tier}</p>
          </div>
          
          <div className="max-h-[600px] overflow-y-auto">
            {sidebarLessons.map((l, i) => (
              <Link 
                key={l.id} 
                to={`/lesson/${l.id}`}
                className="flex gap-4 p-6 hover:bg-[#FFE8BE]/10 transition-all border-b border-[#D9C5A0]/10 last:border-0 group"
              >
                <div className="w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-[#D9C5A0]/20">
                  <img src={l.thumbnail} alt={l.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-[#427AB5] uppercase tracking-widest mb-1">Lesson {i + 5}</p>
                  <h4 className="text-sm font-bold text-[#2D3436] line-clamp-1 group-hover:text-[#427AB5] transition-colors">{l.title}</h4>
                  <p className="text-[10px] text-[#2D3436]/40 mt-1">{l.duration}</p>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="p-6 bg-[#FDFBF7]">
            <Link to="/" className="text-xs font-bold text-[#427AB5] flex items-center justify-center gap-2 hover:gap-4 transition-all uppercase tracking-widest">
              View Full Tier <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

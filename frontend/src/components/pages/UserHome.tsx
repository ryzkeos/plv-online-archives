import React, { useEffect, useState } from 'react';
import { Search, Plus, FileText, Globe, Trophy, Star, Medal, Crown, Target, Heart, Zap, Award, Shield, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { api, Research } from '../../lib/api';
import { useSettings } from '../../hooks/useSettings';
import { LoadingSpinner, EmptyState } from './Common';
import { cn } from '../../lib/utils';

export const UserHome = () => {
  const SHOW_AWARDS_VISUALS = true; // Set to false to turn off award visuals
  const [research, setResearch] = useState<Research[]>([]);
  const [featured, setFeatured] = useState<Research[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const navigate = useNavigate();
  const { settings } = useSettings();

  useEffect(() => {
    Promise.all([
      api.getResearch('accepted'),
      api.getPublicFeatured()
    ]).then(([all, feat]) => {
      setResearch(all);
      setFeatured(feat.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (featured.length > 0) {
      const timer = setInterval(() => {
        setFeaturedIndex(prev => (prev + 1) % featured.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [featured]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getIcon = (name: string) => {
    const Icons: any = { Trophy, Star, Medal, Crown, Target, Heart, Zap, Award, Shield };
    const IconComp = Icons[name] || Award;
    return <IconComp size={10} />;
  };

  const [othersCount, setOthersCount] = useState(6);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loaderRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isRefreshing && (5 + othersCount) < research.length) {
        setIsRefreshing(true);
        setTimeout(() => {
          setOthersCount(prev => prev + 6);
          setIsRefreshing(false);
        }, 1500); // Simulated loading delay
      }
    }, { threshold: 0.1 });

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [othersCount, research.length, isRefreshing]);

  const ResearchCard = ({ item, isMinimal = false }: { item: Research, isMinimal?: boolean }) => (
    <Link 
      to={`/research/${item.id}`}
      className={cn(
        "group transition-all duration-300",
        isMinimal ? "flex-none w-[164px] md:w-[280px] snap-start" : "w-full"
      )}
    >
      <div className={cn(
        "aspect-[3/4] bg-[#151c2f] overflow-hidden cursor-pointer p-1 sm:p-1.5 border border-white/5 relative transition-all duration-300 hover:border-brand-primary/30 hover:shadow-2xl hover:shadow-brand-primary/10 hover:-translate-y-2",
        isMinimal ? "rounded-[1.5rem] md:rounded-[2.5rem]" : "rounded-[1.8rem] md:rounded-[2.5rem]"
      )}>
        <div className={cn(
          "w-full h-full bg-[#0d1526] flex items-center justify-center relative overflow-hidden",
          isMinimal ? "rounded-[1.2rem] md:rounded-[2rem]" : "rounded-[1.5rem] md:rounded-[2rem]"
        )}>
          {item.thumbnail_url ? (
            <img src={item.thumbnail_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
          )}

          {/* Awards Badge */}
          {SHOW_AWARDS_VISUALS && item.awards && item.awards.length > 0 && (
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-col gap-1.5 z-10">
              {item.awards.map((award, idx) => (
                <motion.div
                  key={`${item.id}-award-${idx}`}
                  initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={cn(
                    "w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-900/90 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-lg",
                    award.color === 'amber' ? "text-amber-400" : 
                    award.color === 'blue' ? "text-blue-400" :
                    award.color === 'emerald' ? "text-emerald-400" :
                    award.color === 'rose' ? "text-rose-400" : "text-brand-primary"
                  )}
                  title={award.title}
                >
                  <Award size={14} className="sm:w-[18px] sm:h-[18px]" />
                </motion.div>
              ))}
            </div>
          )}
          
          <div className={cn(
            "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent",
            isMinimal ? "p-3 sm:p-6" : "p-4 sm:p-6"
          )}>
             <p className={cn(
               "font-black text-white uppercase truncate mb-0.5 sm:mb-1",
               isMinimal ? "text-[8px] sm:text-xs" : "text-[10px] sm:text-xs"
             )}>{item.title}</p>
             <p className={cn(
               "font-bold text-slate-400 uppercase tracking-widest truncate",
               isMinimal ? "text-[7px] sm:text-[9px]" : "text-[8px] sm:text-[9px]"
             )}>{item.author_name || item.course}</p>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#0a0f1e] p-4 sm:p-6 lg:p-10 pb-24 relative overflow-x-hidden">
      <header className="mb-6 sm:mb-10 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white tracking-tighter uppercase mb-6 sm:mb-8">Home</h1>
        
        <form onSubmit={handleSearch} className="relative group">
          <Search className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search papers, authors, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151c2f] border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] py-4 sm:py-5 pl-12 sm:pl-14 pr-6 text-xs sm:text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium text-white placeholder:text-slate-600 shadow-xl"
          />
        </form>
      </header>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-16 md:space-y-24">
          <section>
            <AnimatePresence mode="wait">
              {featured.length > 0 ? (
                <motion.div 
                  key={featured[featuredIndex].id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-[#151c2f] rounded-[2rem] sm:rounded-[3rem] aspect-[16/9] sm:aspect-auto sm:h-[400px] md:h-[500px] w-full border border-white/5 overflow-hidden group relative transition-all hover:border-brand-primary/20 shadow-2xl"
                >
                  {featured[featuredIndex].thumbnail_url ? (
                    <motion.img 
                      src={featured[featuredIndex].thumbnail_url} 
                      className="w-full h-full object-cover" 
                      alt="" 
                      referrerPolicy="no-referrer"
                      animate={{ 
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                      <FileText size={80} className="text-slate-800" />
                    </div>
                  )}

                  {/* Featured Awards Spotlight Badge */}
                  {SHOW_AWARDS_VISUALS && featured[featuredIndex].awards && featured[featuredIndex].awards!.length > 0 && (
                    <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex flex-col gap-3 items-end z-20">
                      {featured[featuredIndex].awards!.map((award, idx) => (
                        <motion.div 
                          key={`feat-award-badge-${idx}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3"
                        >
                          <span className="text-[7px] sm:text-[9px] font-black text-white/90 uppercase tracking-[0.2em]">{award.title}</span>
                          <motion.div 
                             animate={{ 
                               rotate: [0, 10, -10, 0],
                               scale: [1, 1.1, 1] 
                             }}
                             transition={{ 
                               duration: 4, 
                               repeat: Infinity, 
                               ease: "easeInOut" 
                             }}
                             className={cn(
                               "w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center",
                               award.color === 'amber' ? "text-amber-400" : 
                               award.color === 'blue' ? "text-blue-400" :
                               award.color === 'emerald' ? "text-emerald-400" :
                               award.color === 'rose' ? "text-rose-400" : "text-brand-primary"
                             )}
                          >
                            <Award size={10} className="sm:w-[12px] sm:h-[12px]" />
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-[#0a0f1e]/40 to-transparent p-4 sm:p-12 pr-28 sm:pr-48 lg:pr-72 flex flex-col justify-end">
                    <div className="flex items-center gap-2 mb-2 sm:mb-4">
                      <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-brand-primary/20 rounded-full text-[6px] sm:text-[8px] font-black text-brand-primary uppercase tracking-[0.2em]">Featured Spotlight</span>
                      <span className="w-1 h-1 rounded-full bg-white/20 hidden sm:block" />
                      <span className="text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest hidden sm:block">{featured[featuredIndex].category}</span>
                    </div>
                    <Link to={`/research/${featured[featuredIndex].id}`} className="text-base sm:text-xl md:text-3xl font-black text-white uppercase tracking-tighter hover:text-brand-primary transition-colors leading-tight sm:leading-none max-w-full block truncate">{featured[featuredIndex].title}</Link>
                  </div>

                  <div className="absolute bottom-4 right-4 sm:bottom-12 sm:right-12 flex flex-col items-end gap-4 sm:gap-6">
                    <div className="flex gap-2.5 items-center">
                       {featured.map((_, i) => (
                         <button 
                           key={i} 
                           onClick={() => setFeaturedIndex(i)}
                           className={cn(
                             "h-1.5 rounded-full transition-all duration-500 relative overflow-hidden",
                             featuredIndex === i ? "w-10 sm:w-16 bg-white/15" : "w-1.5 bg-white/20 hover:bg-white/40"
                           )}
                         >
                           {featuredIndex === i && (
                             <motion.div 
                              key={`dot-progress-${i}`}
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 5, ease: "linear" }}
                              className="absolute inset-0 bg-brand-primary"
                             />
                           )}
                         </button>
                       ))}
                    </div>
                    <Link 
                      to={`/research/${featured[featuredIndex].id}`} 
                      className="group/btn flex items-center gap-2 text-[8px] sm:text-[9px] font-black text-white/60 hover:text-brand-primary uppercase tracking-[0.25em] transition-all"
                    >
                      <span>Explore</span>
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <ArrowRight size={10} className="sm:w-[12px] sm:h-[12px]" />
                      </motion.div>
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-[#151c2f] rounded-[3rem] h-64 w-full border border-white/5 flex items-center justify-center">
                   <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">No featured publications at the moment</p>
                </div>
              )}
            </AnimatePresence>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Recent Research Hub</h2>
              <Link to="/search" className="text-[10px] font-black text-brand-primary hover:text-white uppercase tracking-widest transition-colors">Show All Archive</Link>
            </div>
            
            {research.length === 0 ? (
              <EmptyState icon={FileText} message="No uploads yet" />
            ) : (
              <div className="flex overflow-x-auto no-scrollbar gap-4 md:gap-6 pb-4 md:pb-8 snap-x">
                {research.slice(0, 5).map((item) => (
                  <React.Fragment key={item.id}><ResearchCard item={item} isMinimal /></React.Fragment>
                ))}
                <button 
                  onClick={() => navigate('/upload')}
                  className="flex-none w-[164px] md:w-[280px] snap-start flex flex-col items-center justify-center gap-4 bg-white/5 rounded-[1.5rem] md:rounded-[2.5rem] border border-dashed border-white/10 hover:bg-brand-primary/5 hover:border-brand-primary/20 transition-all group"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-600 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-all">
                    <Plus size={20} />
                  </div>
                  <span className="text-[8px] md:text-[10px] font-black text-slate-500 group-hover:text-white uppercase tracking-widest text-center px-4">Contribute your Research</span>
                </button>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Others</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {research.slice(5, 5 + othersCount).map((item) => (
                <React.Fragment key={`other-${item.id}`}><ResearchCard item={item} /></React.Fragment>
              ))}
            </div>

            {(5 + othersCount) < research.length && (
              <div ref={loaderRef} className="py-20 flex flex-col items-center justify-center gap-4">
                <motion.div 
                  animate={isRefreshing ? { rotate: 360 } : {}}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 border-brand-primary/20 border-t-brand-primary transition-opacity",
                    isRefreshing ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className={cn(
                  "text-[9px] font-black text-brand-primary uppercase tracking-[0.15em] transition-opacity",
                  isRefreshing ? "opacity-100" : "opacity-0"
                )}>Discovering more research</span>
              </div>
            )}
          </section>
        </div>
      )}

      <button onClick={() => navigate('/upload')} className="fixed bottom-32 right-6 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-[1.5rem] sm:rounded-[2rem] bg-brand-primary text-slate-900 shadow-2xl shadow-brand-primary/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-[60] group">
        <Plus strokeWidth={3} className="w-8 h-8 sm:w-10 sm:h-10 md:transition-transform md:group-hover:rotate-90" />
      </button>
    </div>
  );
};

export default UserHome;

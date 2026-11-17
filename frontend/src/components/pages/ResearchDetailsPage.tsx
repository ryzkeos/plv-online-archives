import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Home, Trophy, Star, Medal, Crown, Target, Heart, Zap, Award, Shield, Calendar, Bookmark, User, Download, Eye, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api, Research } from '../../lib/api';
import { LoadingSpinner } from './Common';
import { DetailModal } from '../shared/Shared';
import { cn } from '../../lib/utils';
import { Document, Page, pdfjs } from 'react-pdf';

// Register PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

export const ResearchDetailsPage = () => {
  const { id } = useParams();
  const [item, setItem] = useState<Research | null>(null);
  const [others, setOthers] = useState<Research[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPdfViewOpen, setIsPdfViewOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // PDF Viewer State
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const padding = window.innerWidth < 640 ? 32 : 64;
        setContainerWidth(containerRef.current.clientWidth - padding);
      }
    };

    if (isPdfViewOpen) {
      setTimeout(updateWidth, 100);
      window.addEventListener('resize', updateWidth);
    }

    return () => window.removeEventListener('resize', updateWidth);
  }, [isPdfViewOpen]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      Promise.all([
        api.getResearchDetail(id),
        api.getResearch('accepted'),
        api.getMyBookmarks()
      ]).then(([res, allRes, bookmarks]) => {
        setItem(res);
        setOthers(allRes.filter(r => r.id !== id).slice(0, 4));
        setIsBookmarked(bookmarks.some((b: any) => b.id === id));
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const handleToggleBookmark = async () => {
    if (!id || bookmarkLoading) return;
    setBookmarkLoading(true);
    try {
      const res = await api.toggleBookmark(id);
      setIsBookmarked(res.bookmarked);
    } catch (err) {
      console.error('Bookmark toggle failed', err);
    } finally {
      setBookmarkLoading(false);
    }
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPdfLoading(false);
  }

  if (loading) return <div className="p-20"><LoadingSpinner /></div>;
  if (!item) return <div className="p-20 text-center text-white">Research not found</div>;

  const getIcon = (name: string) => {
    const Icons: any = { Trophy, Star, Medal, Crown, Target, Heart, Zap, Award, Shield };
    const IconComp = Icons[name] || Award;
    return <IconComp size={14} className="text-brand-primary" />;
  };

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-[#0a0f1e] p-0 pb-24 shadow-2xl border-x border-white/5 overflow-hidden">
      <div className="relative">
         <div className="aspect-[16/10] md:aspect-[21/9] bg-gradient-to-br from-[#1e293b] to-brand-background flex items-end overflow-hidden relative">
            {item.thumbnail_url && (
              <motion.img 
               initial={{ scale: 1.1 }}
               animate={{ scale: 1 }}
               transition={{ duration: 10, ease: "linear" }}
               src={item.thumbnail_url} 
               className="absolute inset-0 w-full h-full object-cover" 
               alt="" 
               referrerPolicy="no-referrer" 
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-[#0a0f1e]/40 to-transparent" />
            
            <div className="relative z-10 w-full p-6 sm:p-8 pb-4 max-w-5xl mx-auto">
               <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <span className="px-3 py-1 bg-brand-primary/20 rounded-full text-[7px] sm:text-[8px] font-black text-brand-primary uppercase tracking-[0.2em]">{item.category}</span>
                  <span className="px-3 py-1 bg-white/5 rounded-full text-[7px] sm:text-[8px] font-black text-slate-400 border border-white/5 uppercase tracking-[0.2em]">{new Date(item.created_at).getFullYear()}</span>
               </div>
               <h1 className="text-xl sm:text-2xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight mb-2 pr-12 truncate">{item.title}</h1>
            </div>
         </div>

         <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20 max-w-7xl mx-auto px-4 lg:px-8">
            <Link to="/" className="w-10 h-10 bg-black/30 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-black/50 transition-all">
               <Home size={18} />
            </Link>
            <button 
               onClick={handleToggleBookmark}
               disabled={bookmarkLoading}
               className={cn(
                 "w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all active:scale-90",
                 isBookmarked 
                   ? "bg-brand-primary text-slate-900 border-brand-primary shadow-lg shadow-brand-primary/20" 
                   : "bg-black/30 text-white border-white/10 hover:bg-black/50"
               )}
            >
               <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} className={cn(bookmarkLoading && "animate-pulse")} />
            </button>
         </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-8 py-10 grid grid-cols-1 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="space-y-12">
           <section className="space-y-4">
              <div className="flex items-center gap-3">
                 <span className="w-1 h-3 bg-brand-primary rounded-full" />
                 <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">ABSTRACT OVERVIEW</h2>
              </div>
              <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                 <p className="text-[9px] text-slate-400 font-medium leading-relaxed italic uppercase tracking-wider">
                   "{item.abstract}"
                 </p>
              </div>
           </section>

           <section className="space-y-6">
              <div className="flex items-center gap-3">
                 <span className="w-1 h-3 bg-brand-primary rounded-full" />
                 <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Co-Researchers</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                 {item.researchers.map(r => (
                    <span key={r} className="px-6 py-3 bg-slate-900/50 border border-white/5 rounded-2xl text-[10px] font-bold text-white uppercase tracking-widest">{r}</span>
                 ))}
              </div>
           </section>
         </div>

         <div className="space-y-8">
           <div className="flex items-center gap-4 py-5 px-6 bg-white/[0.03] rounded-2xl border border-white/10 group">
              <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-slate-900 transition-all duration-300">
                 <User size={20} />
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Uploaded By</p>
                 <p className="text-xs font-bold text-white uppercase mt-0.5">{item.author_name}</p>
              </div>
           </div>

           <div className="p-8 bg-[#0d1526]/50 border border-white/5 rounded-[2.5rem] space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Status</h3>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Year</span>
                    <span className="text-xs text-white font-mono">{new Date(item.created_at).getFullYear()}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Access</span>
                    <span className="text-xs text-brand-primary font-mono">Public</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Format</span>
                    <span className="text-xs text-slate-300 font-mono">PDF v1.4</span>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-2 pt-4">
              <button onClick={() => setIsPdfViewOpen(true)} className="flex-1 flex items-center justify-center gap-2 py-4 bg-brand-primary text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/10 hover:brightness-110 active:scale-[0.98] transition-all">
                 <Eye size={14} />
                 <span>View</span>
              </button>
              <a
                 href={`${import.meta.env.VITE_API_URL ?? ''}/api/research/${item.id}/download`}
                 download
                 className="flex-1 py-4 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                 <Download size={14} />
                 <span>Download</span>
              </a>
           </div>
         </div>
      </div>

      {others.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 md:px-8 py-20 border-t border-white/5">
          <div className="flex items-center gap-3 mb-10">
            <span className="w-1.5 h-4 bg-brand-primary rounded-full shadow-lg shadow-brand-primary/20" />
            <h2 className="text-sm font-black text-white uppercase tracking-[0.4em]">Others</h2>
          </div>
          <div className="flex overflow-x-auto no-scrollbar gap-6 pb-6 lg:grid lg:grid-cols-4 lg:overflow-x-visible">
            {others.map(other => (
              <Link key={other.id} to={`/research/${other.id}`} className="group flex-none w-32 sm:w-56 lg:w-full">
                <div className="aspect-[3/4] bg-[#151c2f] rounded-2xl overflow-hidden border border-white/5 group-hover:border-brand-primary/30 transition-all p-1">
                   <div className="w-full h-full bg-[#0d1526] rounded-[0.9rem] overflow-hidden relative">
                      {other.thumbnail_url ? (
                        <img src={other.thumbnail_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                      ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-800">
                          <FileText size={40} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-x-0 bottom-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform opacity-0 group-hover:opacity-100">
                        <p className="text-[10px] font-black text-white uppercase truncate">{other.title}</p>
                      </div>
                   </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <AnimatePresence>
        {isPdfViewOpen && (
          <div className="fixed inset-0 z-[50000] bg-[#0a0f1e] flex flex-col">
             <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between bg-[#0d1526]">
                <div className="flex items-center gap-4">
                   <button onClick={() => setIsPdfViewOpen(false)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
                      <Home size={18} />
                   </button>
                   <div>
                      <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-tighter truncate max-w-[150px] sm:max-w-md">{item.title}</h3>
                      <p className="text-[8px] font-bold text-brand-primary uppercase tracking-[0.2em] mt-0.5">Page {pageNumber} of {numPages || '...'}</p>
                   </div>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className="hidden md:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                      <button 
                        onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                        className="p-1 text-slate-400 hover:text-white transition-all"
                      >
                         <ZoomOut size={16} />
                      </button>
                      <span className="text-[10px] font-mono text-brand-primary w-12 text-center">{Math.round(scale * 100)}%</span>
                      <button 
                        onClick={() => setScale(s => Math.min(2.0, s + 0.1))}
                        className="p-1 text-slate-400 hover:text-white transition-all"
                      >
                         <ZoomIn size={16} />
                      </button>
                   </div>

                   <div className="flex items-center gap-1">
                      <button 
                         disabled={pageNumber <= 1}
                         onClick={() => setPageNumber(p => p - 1)}
                         className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                         <ChevronLeft size={20} />
                      </button>
                      <button 
                         disabled={pageNumber >= numPages}
                         onClick={() => setPageNumber(p => p + 1)}
                         className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                         <ChevronRight size={20} />
                      </button>
                   </div>

                   <button 
                      onClick={() => setIsPdfViewOpen(false)} 
                      className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-lg"
                   >
                      <X size={20} />
                   </button>
                </div>
             </div>

             <div ref={containerRef} className="flex-1 bg-[#0f172a] overflow-auto flex flex-col items-center p-4 sm:p-8 no-scrollbar">
                <div className="relative shadow-2xl rounded-sm overflow-hidden bg-white">
                   {pdfLoading && (
                     <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-20">
                        <LoadingSpinner />
                     </div>
                   )}
                   <Document
                      file={item.pdf_url}
                      onLoadSuccess={onDocumentLoadSuccess}
                      loading={<LoadingSpinner />}
                      error={<div className="p-20 text-center text-rose-500 font-bold uppercase tracking-widest">Failed to load manuscript. Please try downloading it instead.</div>}
                   >
                      <Page 
                        pageNumber={pageNumber} 
                        width={containerWidth ? containerWidth * scale : undefined}
                        loading={<div className="h-[800px] w-[600px] bg-slate-800 animate-pulse" />}
                        className="shadow-2xl"
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                      />
                   </Document>
                </div>
             </div>

             <div className="p-3 bg-[#0d1526] border-t border-white/5 flex items-center justify-center sm:hidden">
                <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                   <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="text-slate-400"><ZoomOut size={16} /></button>
                   <span className="text-[10px] font-mono text-brand-primary">{Math.round(scale * 100)}%</span>
                   <button onClick={() => setScale(s => Math.min(2.0, s + 0.2))} className="text-slate-400"><ZoomIn size={16} /></button>
                </div>
             </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResearchDetailsPage;

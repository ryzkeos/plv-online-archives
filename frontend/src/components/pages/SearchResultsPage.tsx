import React, { useEffect, useState, useMemo } from 'react';
import { Search, Home, ChevronDown, X, Trash2 } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api, Research } from '../../lib/api';
import { cn } from '../../lib/utils';
import { LoadingSpinner, EmptyState } from './Common';
import { SelectionModal } from '../shared/Shared';

export const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<Research[]>([]);
  const [allResearch, setAllResearch] = useState<Research[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const navigate = useNavigate();

  const filters = {
    q: searchParams.get('q') || '',
    year: searchParams.get('year') || 'Year',
    category: searchParams.get('category') || 'Category',
    author: searchParams.get('author') || 'Author'
  };

  useEffect(() => {
    setLoading(true);
    api.searchResearch(filters).then(setResults).finally(() => setLoading(false));
  }, [searchParams]);

  useEffect(() => {
    // Fetch all accepted research to get full author list for filtering
    api.getResearch('accepted').then(setAllResearch).catch(() => {});
  }, []);

  const authors = useMemo(() => {
    const uniqueAuthors = new Set<string>();
    allResearch.forEach(r => {
      if (r.author_name) uniqueAuthors.add(r.author_name);
    });
    return Array.from(uniqueAuthors).sort();
  }, [allResearch]);

  const updateParam = (key: string, val: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (val === 'Year' || val === 'Category' || val === 'Author' || !val) newParams.delete(key);
    else newParams.set(key, val);
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const filterOptions = {
    Year: ['2026', '2025', '2024', '2023', '2022', '2021', '2020'],
    Category: ['Technology', 'Agriculture', 'Medicine', 'Business', 'Education', 'Others'],
    Author: authors
  };

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-[#0a0f1e] p-4 sm:p-6 lg:p-10 pb-24 shadow-2xl border-x border-white/5">
       <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link to="/" className="w-10 h-10 sm:w-14 sm:h-14 bg-[#111827] rounded-xl sm:rounded-2xl text-slate-400 hover:text-white border border-white/5 flex items-center justify-center shrink-0 transition-all">
            <Home size={18} />
          </Link>
          <div className="flex-1 relative group">
             <Search size={16} className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-primary transition-colors" />
             <input value={filters.q} onChange={e => updateParam('q', e.target.value)} className="w-full bg-[#111827] border border-white/5 rounded-[1.2rem] sm:rounded-[2rem] py-3 sm:py-5 pl-11 sm:pl-14 pr-8 text-xs sm:text-sm font-medium text-white shadow-xl focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none" placeholder="Search parameters..." />
          </div>
       </div>
       
       <div className="flex overflow-x-auto no-scrollbar gap-2 sm:gap-4 mb-8 sm:mb-12 pb-2">
          {Object.entries(filterOptions).map(([f, opts]) => {
            const currentVal = filters[f.toLowerCase() as keyof typeof filters];
            const isActive = currentVal !== f && currentVal !== '';

            return (
              <button 
                key={f} 
                onClick={() => setActiveFilter(f)} 
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap px-4 py-2.5 sm:p-5 rounded-lg sm:rounded-2xl bg-[#111827] border transition-all text-[9px] sm:text-[10px] uppercase font-black tracking-widest group shrink-0",
                  isActive ? "border-brand-primary/40 text-brand-primary" : "border-white/5 text-slate-500 hover:border-brand-primary/30"
                )}
              >
                <span>
                  {f}: <span className={cn("ml-1", isActive ? "text-white" : "text-slate-200")}>{currentVal}</span>
                </span>
                <ChevronDown size={14} className={cn("transition-transform", isActive ? "text-brand-primary" : "text-slate-500")} />
              </button>
            );
          })}
          
          <button 
            onClick={clearFilters}
            className="flex items-center gap-2 whitespace-nowrap px-4 py-2.5 sm:p-5 rounded-lg sm:rounded-2xl bg-[#111827] border border-white/5 hover:border-red-500/30 text-red-500 hover:text-red-400 transition-all text-[9px] sm:text-[10px] uppercase font-black tracking-widest group shrink-0"
          >
            <Trash2 size={14} />
            <span>Clear</span>
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {loading ? (
            <div className="col-span-full py-20"><LoadingSpinner /></div>
          ) : results.length === 0 ? (
            <div className="col-span-full py-20"><EmptyState icon={Search} message="No research match found" /></div>
          ) : results.map((res) => (
            <Link 
              to={`/research/${res.id}`} 
              key={res.id} 
              className="p-4 sm:p-8 bg-[#151c2f] rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 hover:bg-brand-primary/5 hover:border-brand-primary/30 cursor-pointer transition-all group flex flex-col justify-between shadow-xl relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                   <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-brand-primary/10 rounded-full text-[7px] sm:text-[8px] font-black text-brand-primary uppercase tracking-widest border border-brand-primary/20">{res.category}</span>
                   <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 font-mono italic">{res.school_year_label || new Date(res.created_at).getFullYear()}</span>
                </div>
                <h3 className="text-sm sm:text-xl font-black text-white tracking-tighter uppercase group-hover:text-brand-primary transition-colors leading-tight mb-2 sm:mb-4">{res.title}</h3>
              </div>
              
              <div className="relative z-10 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[7px] sm:text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Lead Researcher</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-200 font-bold uppercase">{res.author_name || "Unknown Author"}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-brand-primary group-hover:text-slate-900 transition-all">
                   <ChevronDown size={14} className="-rotate-90" />
                </div>
              </div>
            </Link>
          ))}
       </div>

       <SelectionModal
         isOpen={!!activeFilter}
         onClose={() => setActiveFilter(null)}
         title={`Select ${activeFilter}`}
         options={activeFilter ? filterOptions[activeFilter as keyof typeof filterOptions] : []}
         onSelect={(val) => { updateParam(activeFilter!.toLowerCase(), val); setActiveFilter(null); }}
       />
    </div>
  );
};

export default SearchResultsPage;

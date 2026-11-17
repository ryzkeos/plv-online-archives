import React, { useEffect, useState } from 'react';
import { Search, Filter, Eye, UserX, Trash2, Check, X, ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth, getSocket } from '../../hooks/useAuth';
import { api, User } from '../../lib/api';
import { cn } from '../../lib/utils';
import { LoadingSpinner } from './Common';
import { ActionModal, SelectionModal } from '../shared/Shared';

export const AdminUserList = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'DELETE' | 'ARCHIVE'>('DELETE');
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers(searchTerm, statusFilter);
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    setPage(1);
  }, [statusFilter, searchTerm]);

  // Real-time status integration
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      const handleStatusChange = ({ userId, status }: { userId: string, status: string }) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: status as any } : u));
      };
      socket.on('status_change', handleStatusChange);
      return () => {
        socket.off('status_change', handleStatusChange);
      };
    }
  }, []);

  const handleAction = async () => {
    if (!targetUser) return;
    
    if (actionType === 'DELETE') {
      await api.deleteUser(targetUser);
    } else if (actionType === 'ARCHIVE') {
      await api.updateUserStatus(targetUser, 'archived');
    }
    
    setTargetUser(null);
    fetchUsers();
  };

  const paginatedUsers = users.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(users.length / itemsPerPage);

  return (
    <div className="flex flex-col h-screen overflow-hidden p-4 md:p-10 bg-[#0a0f1e]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 md:mb-8 pb-4 md:pb-6 border-b border-white/5 gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none">USER LIST</h1>
          <div className="flex items-center gap-2 mt-1.5">
             <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Pamantasan ng Lungsod ng Valenzuela</span>
          </div>
        </div>
        <div className="flex flex-row items-center gap-3 w-full lg:max-w-[320px]">
          <form onSubmit={e => { e.preventDefault(); fetchUsers(); }} className="bg-[#151c2f] rounded-xl flex items-center px-4 py-3 border border-white/5 flex-1 transition-all focus-within:border-brand-primary/20">
             <Search size={16} className="text-slate-500 mr-2 shrink-0" />
             <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent border-none text-xs outline-none text-slate-200 w-full font-medium" placeholder="Search name / Student No" />
          </form>
          <div className="relative flex-none">
            <button 
              onClick={() => setFilterOpen(!filterOpen)} 
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#111827] border border-white/5 rounded-xl text-[10px] font-black text-slate-300 uppercase tracking-widest hover:bg-white/5 transition-all h-full whitespace-nowrap"
            >
              <Filter size={14} className="text-brand-primary shrink-0" />
              <span className="hidden sm:inline">{statusFilter}</span>
            </button>
            
            <SelectionModal 
              isOpen={filterOpen} 
              onClose={() => setFilterOpen(false)} 
              title="Filter Status" 
              options={['All', 'Active', 'Offline', 'Archived', 'Deactivated']}
              onSelect={(val) => {
                setStatusFilter(val);
                setFilterOpen(false);
              }}
            />
          </div>
        </div>
      </div>

      <div className="glass-card shadow-2xl border-none bg-[#111827] flex-1 overflow-auto min-h-0">
          <table className="w-full text-center">
            <thead>
            <tr className="table-header">
              <th colSpan={2} className="px-4 py-3 whitespace-nowrap text-center font-black uppercase text-[10px] tracking-widest">User Names</th>
              <th className="px-8 py-3 whitespace-nowrap text-center font-black uppercase text-[10px] tracking-widest">Student No.</th>
              <th className="px-8 py-3 whitespace-nowrap text-center font-black uppercase text-[10px] tracking-widest">Course</th>
              <th className="px-8 py-3 whitespace-nowrap text-center font-black uppercase text-[10px] tracking-widest">Yr & Sec</th>
              <th className="px-8 py-3 whitespace-nowrap text-center font-black uppercase text-[10px] tracking-widest">Status</th>
              <th className="px-8 py-3 whitespace-nowrap text-center font-black uppercase text-[10px] tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={7}><LoadingSpinner /></td></tr>
            ) : paginatedUsers.length === 0 ? (
              <tr><td colSpan={7} className="px-8 py-10 text-center text-slate-600 font-black uppercase text-[10px] tracking-widest">No users found</td></tr>
            ) : paginatedUsers.map((u) => (
              <tr key={u.id} className="hover:bg-brand-primary/[0.02] transition-colors group">
                <td className="py-3 md:py-4 px-4 md:px-6 whitespace-nowrap w-20 align-middle">
                   <div className="flex justify-center">
                    <div className="w-8 h-8 rounded-full bg-[#0a0f1e] border border-white/5 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:border-brand-primary/20 transition-all">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={14} className="text-slate-600" />
                      )}
                    </div>
                   </div>
                </td>
                <td className="py-3 md:py-4 pr-6 md:pr-10 whitespace-nowrap text-left">
                   <div className="flex flex-col">
                    <span className="text-white text-[12px] font-bold truncate capitalize max-w-[180px] tracking-tight">{u.full_name}</span>
                    <span className="text-slate-500 text-[9px] font-medium tracking-wider">
                      {u.role === 'masteradmin' ? 'Master Administrator' : u.role === 'admin' ? 'Administrator' : (u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : '')}
                    </span>
                   </div>
                </td>
                <td className={cn(
                  "px-8 py-3 md:py-4 text-slate-400 text-[11px] whitespace-nowrap uppercase text-center",
                  u.student_number && u.role === 'student' && "font-mono"
                )}>
                  {u.role === 'student' ? (u.student_number || '—') : '—'}
                </td>
                <td className="px-8 py-3 md:py-4 text-slate-400 text-[11px] whitespace-nowrap uppercase text-center">
                  {u.role === 'student' ? (u.course || '—') : '—'}
                </td>
                <td className="px-8 py-3 md:py-4 text-slate-400 text-[11px] whitespace-nowrap uppercase text-center">
                  {u.role === 'student' ? (
                    u.year_level || u.section ? (
                      `${u.year_level?.replace(/\D/g, '') || ''}${u.section ? (u.year_level ? '-' : '') + u.section : ''}`
                    ) : '—'
                  ) : '—'}
                </td>
                <td className="px-8 py-3 md:py-4 whitespace-nowrap text-center">
                  <div className="flex justify-center">
                    <span className={cn(
                      "status-chip flex items-center gap-1.5",
                      u.status === 'active' ? "text-emerald-400 bg-emerald-400/5 whitespace-nowrap" : 
                      u.status === 'offline' ? "text-slate-400 bg-slate-400/5 whitespace-nowrap" :
                      u.status === 'archived' ? "text-blue-400 bg-blue-400/5 whitespace-nowrap" :
                      "text-rose-400 bg-rose-400/5 whitespace-nowrap"
                    )}>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        u.status === 'active' ? "bg-emerald-400 animate-pulse" : 
                        u.status === 'offline' ? "bg-slate-400" :
                        u.status === 'archived' ? "bg-blue-400" :
                        "bg-rose-400"
                      )} />
                      {u.status}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-3 md:py-4 whitespace-nowrap text-center">
                  <div className="flex gap-2 justify-center">
                    <Link to={`/admin/users/${u.id}`} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white hover:bg-slate-700 transition-all border border-white/5" title="View Details">
                      <Eye size={14} />
                    </Link>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          if (u.role === 'masteradmin' || u.id === currentUser?.id) return;
                          setTargetUser(u.id);
                          setActionType('ARCHIVE');
                        }} 
                        className={cn(
                          "p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all border border-blue-500/10",
                          (u.role === 'masteradmin' || u.id === currentUser?.id) && "opacity-20 cursor-not-allowed"
                        )}
                        title="Archive User"
                      >
                        <UserX size={14} />
                      </button>
                      
                      {currentUser?.role === 'masteradmin' && (
                        <button 
                          onClick={() => {
                            if (u.role === 'masteradmin' || u.id === currentUser?.id) return;
                            setTargetUser(u.id);
                            setActionType('DELETE');
                          }} 
                          className={cn(
                            "p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all border border-rose-500/10",
                            (u.role === 'masteradmin' || u.id === currentUser?.id) && "opacity-20 cursor-not-allowed"
                          )}
                          title="Delete User"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {!loading && users.length > 0 && (
        <div className="px-3 md:px-0 py-4 flex flex-row items-center justify-between gap-2 md:gap-6">
          <div className="text-[10px] font-medium text-slate-500 shrink-0">
            Showing <span className="text-white">{(page - 1) * itemsPerPage + 1}</span> to <span className="text-white">{Math.min(page * itemsPerPage, users.length)}</span> of <span className="text-white">{users.length}</span> entries
          </div>
          <div className="flex items-center gap-1">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 md:w-10 md:h-10 bg-white/4 border border-white/5 rounded-lg flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1 mx-1 md:mx-2">
                {((): number[] => {
                  const delta = 1;
                  const start = Math.max(1, page - delta);
                  const end = Math.min(totalPages || 1, page + delta);
                  let finalStart = start;
                  let finalEnd = end;
                  if (finalEnd - finalStart < 2 && (totalPages || 1) >= 3) {
                    if (finalStart === 1) finalEnd = 3;
                    else if (finalEnd === (totalPages || 1)) finalStart = Math.max(1, (totalPages || 1) - 2);
                  }
                  const pages = [];
                  for (let i = finalStart; i <= finalEnd; i++) pages.push(i);
                  return pages;
                })().map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      "min-w-8 h-8 md:min-w-10 md:h-10 px-2 rounded-lg text-[10px] font-black transition-all flex items-center justify-center",
                      page === p ? "bg-brand-primary text-slate-900 shadow-lg shadow-brand-primary/20" : "bg-white/5 text-slate-500 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(totalPages || 1, p + 1))}
                disabled={page === (totalPages || 1)}
                className="w-8 h-8 md:w-10 md:h-10 bg-white/4 border border-white/5 rounded-lg flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
        </div>
      )}

      <ActionModal 
        isOpen={!!targetUser} 
        onClose={() => setTargetUser(null)} 
        type={actionType} 
        onConfirm={handleAction} 
      />
    </div>
  );
};

export default AdminUserList;

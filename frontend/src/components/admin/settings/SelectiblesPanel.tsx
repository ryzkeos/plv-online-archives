import React, { useState } from 'react';
import { Plus, X, Edit, Trash2, CheckCircle } from 'lucide-react';
import { api } from '../../../lib/api';
import { cn } from '../../../lib/utils';
import { ConfirmModal } from '../../shared/Shared';

interface SelectiblesPanelProps {
  data: any;
  refresh: () => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
}

export const SelectiblesPanel = ({ data, refresh, showToast }: SelectiblesPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [newValue, setNewValue] = useState('');
  const [editingItem, setEditingItem] = useState<{ id: string, value: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAdd = async (category: string) => {
    if (!newValue.trim()) {
      setActiveInput(null);
      return;
    }
    setLoading(true);
    try {
      await api.addSelectible({ category, value: newValue.trim() });
      refresh();
      showToast('Option added successfully');
      setNewValue('');
      setActiveInput(null);
    } catch (e: any) {
      showToast(e.error || 'Failed to add option', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingItem || !editingItem.value.trim()) {
      setEditingItem(null);
      return;
    }
    setLoading(true);
    try {
      await api.updateSelectible(editingItem.id, { value: editingItem.value.trim() });
      refresh();
      showToast('Option updated');
      setEditingItem(null);
    } catch (e: any) {
      showToast(e.error || 'Failed to update', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleFinalDelete = async () => {
    if (!deleteConfirmId) return;
    setLoading(true);
    try {
      await api.deleteSelectible(deleteConfirmId);
      await refresh();
      showToast('Option removed');
      setDeleteConfirmId(null);
    } catch (e: any) {
      console.error('Delete error:', e);
      showToast(e.error || 'Failed to delete', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">MANAGE DROP-DOWN OPTIONS</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.entries(data).map(([cat, items]: any) => (
          <div key={cat} className="p-8 bg-[#0a0f1e] border border-white/5 rounded-3xl shadow-xl flex flex-col">
             <div className="flex items-center justify-between mb-8 mr-2">
                <h4 className="text-xs font-black text-white uppercase tracking-widest truncate mr-4">
                  <span className="underline underline-offset-8 decoration-brand-primary">{cat.replace('_', ' ')}</span>
                </h4>
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setActiveInput(activeInput === cat ? null : cat);
                    setNewValue('');
                  }} 
                  className={cn(
                    "p-2 rounded-lg transition-all disabled:opacity-50 shrink-0",
                    activeInput === cat ? "bg-rose-500/20 text-rose-500" : "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-slate-900"
                  )}
                >
                  {activeInput === cat ? <X size={16} /> : <Plus size={16} />}
                </button>
             </div>

             {activeInput === cat && (
               <div className="mb-6 mr-2 flex flex-col sm:flex-row gap-2 shrink-0 p-4 bg-[#111827] rounded-2xl border border-brand-primary/20">
                 <input 
                   autoFocus
                   value={newValue}
                   onChange={e => setNewValue(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && handleAdd(cat)}
                   placeholder="Add new..."
                   className="flex-1 bg-[#0a0f1e] text-white px-4 py-2.5 rounded-xl border border-brand-primary/30 text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-brand-primary/30 min-w-0"
                 />
                 <button 
                   type="button"
                   disabled={loading}
                   onClick={() => handleAdd(cat)}
                   className="px-6 py-2.5 bg-brand-primary text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-brand-primary/20 shrink-0 whitespace-nowrap"
                 >
                   Add
                 </button>
               </div>
             )}

             <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                {items.map((item: any) => (
                  <div key={item.id} className="relative flex items-center justify-between px-4 py-3 bg-[#111827] rounded-xl border border-white/5 group hover:border-brand-primary/20 transition-all shadow-sm">
                     <div className="flex-1 min-w-0 mr-4">
                       {editingItem?.id === item.id ? (
                         <input 
                           autoFocus
                           value={editingItem.value}
                           onChange={e => setEditingItem({ ...editingItem, value: e.target.value })}
                           onKeyDown={e => {
                             if (e.key === 'Enter') handleEdit();
                             if (e.key === 'Escape') setEditingItem(null);
                           }}
                           className="w-full bg-[#0a0f1e] text-white px-2 py-1 rounded-md border border-brand-primary/50 text-[10px] font-bold focus:outline-none"
                         />
                       ) : (
                         <span className="text-[10px] font-bold text-slate-300 uppercase block truncate">{item.value}</span>
                       )}
                     </div>

                     <div className="flex items-center gap-1 shrink-0 relative z-30">
                        {editingItem?.id === item.id ? (
                           <button 
                            type="button"
                            onMouseDown={(e) => e.preventDefault()} 
                            onClick={handleEdit}
                            className="p-2 text-emerald-500 hover:scale-110 transition-all"
                           >
                            <CheckCircle size={18} />
                           </button>
                        ) : (
                          <>
                            <button 
                              type="button"
                              disabled={loading}
                              onClick={() => setEditingItem({ id: item.id, value: item.value })} 
                              className="p-2 text-slate-500 hover:text-brand-primary transition-all disabled:opacity-50"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              type="button"
                              disabled={loading}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteItem(item.id);
                              }} 
                              className="p-2 text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-50 cursor-pointer relative z-40"
                              title="Delete Item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                     </div>
                  </div>
                ))}
                {items.length === 0 && !activeInput && <p className="text-[10px] text-slate-700 uppercase font-black py-4 text-center">No options defined</p>}
             </div>
          </div>
        ))}
      </div>

      <ConfirmModal 
        isOpen={!!deleteConfirmId} 
        onClose={() => setDeleteConfirmId(null)} 
        title="CONFIRM REMOVAL" 
        message="Are you sure you want to remove this option?" 
        onConfirm={handleFinalDelete}
        confirmLabel="REMOVE"
      />
    </div>
  );
};

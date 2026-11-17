import React, { useState } from 'react';
import { Search, User, Shield, Wrench, ChevronDown, Plus } from 'lucide-react';
import { api, User as UserType } from '../../../lib/api';
import { cn } from '../../../lib/utils';
import { Modal, SelectionModal, ConfirmModal } from '../../shared/Shared';

interface AdminManagementPanelProps {
  admins: any[];
  refresh: () => void;
  search: string;
  setSearch: (s: string) => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
  currentUser: UserType | null;
}

export const AdminManagementPanel = ({ admins, refresh, search, setSearch, showToast, currentUser }: AdminManagementPanelProps) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ full_name: '', plv_email: '', password: '', role: 'admin' });
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null);

  // Custom Dropdown States
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);

  const handleCreate = async () => {
    if (!newAdmin.full_name || !newAdmin.plv_email || !newAdmin.password) return showToast('All fields required', 'error');
    setLoading(true);
    try { await api.createAdmin(newAdmin); refresh(); setIsAddOpen(false); setNewAdmin({ full_name: '', plv_email: '', password: '', role: 'admin' }); showToast('Admin registered'); }
    catch(e: any) { showToast(e.error || 'Failed to register', 'error'); }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    if (!editingAdmin.full_name || !editingAdmin.plv_email) return showToast('Name and Email required', 'error');
    setLoading(true);
    try {
      await api.updateAdmin(editingAdmin.id, {
        full_name: editingAdmin.full_name,
        plv_email: editingAdmin.plv_email,
        role: editingAdmin.role,
        status: editingAdmin.status
      });
      refresh();
      setIsEditOpen(false);
      showToast('Admin updated');
    } catch (e: any) {
      showToast(e.error || 'Failed to update', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalRevoke = async () => {
    if (!revokeConfirmId) return;
    setLoading(true);
    try {
      await api.deleteAdmin(revokeConfirmId);
      refresh();
      showToast('Admin deleted');
      setRevokeConfirmId(null);
    } catch (e: any) {
      showToast('Failed to revoke', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-row justify-between items-center gap-3 mb-8">
        <div className="relative flex-1">
           <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
           <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Admins..." 
            className="bg-[#0a0f1e] border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-[10px] w-full focus:outline-none focus:border-brand-primary/40 font-bold uppercase transition-all" 
           />
        </div>
        <button 
          onClick={() => setIsAddOpen(true)} 
          className="btn-primary py-2.5 px-4 sm:px-6 text-[10px] w-auto whitespace-nowrap tracking-widest shrink-0 flex items-center justify-center gap-2"
        >
          <Plus size={14} className="sm:hidden block" />
          <span className="hidden sm:inline">ADD NEW</span>
        </button>
      </div>

      <div className="border border-white/5 rounded-2xl overflow-x-auto shadow-2xl bg-[#0a0f1e] custom-scrollbar">
        <table className="w-full text-center min-w-[800px]">
          <thead className="bg-[#0f172a] border-b border-white/5">
             <tr className="table-header">
                <th colSpan={2} className="px-8 py-5 whitespace-nowrap text-center font-black uppercase text-[10px] tracking-widest">Administrator Identity</th>
                <th className="px-8 py-5 whitespace-nowrap text-center font-black uppercase text-[10px] tracking-widest">Privilege Level</th>
                <th className="px-8 py-5 whitespace-nowrap text-center font-black uppercase text-[10px] tracking-widest">System Status</th>
                <th className="px-8 py-5 text-center whitespace-nowrap font-black uppercase text-[10px] tracking-widest">Administrative Actions</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
             {admins.map((adm: any) => (
                       <tr key={adm.id} className="hover:bg-brand-primary/[0.02] transition-colors group cursor-pointer text-center">
                  <td className="py-5 px-6 whitespace-nowrap w-20 align-middle">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 rounded-full bg-[#0a0f1e] border border-white/5 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:border-brand-primary/20 transition-all">
                        {adm.avatar_url ? (
                          <img src={adm.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User size={14} className="text-slate-600" />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-5 pr-10 whitespace-nowrap text-left">
                    <div className="flex flex-col">
                      <span className="text-white text-[12px] font-bold truncate capitalize max-w-[180px] tracking-tight">{adm.full_name}</span>
                      <span className="text-slate-500 text-[9px] font-medium tracking-wider">
                        {adm.role === 'masteradmin' ? 'Master Administrator' : (adm.role ? adm.role.charAt(0).toUpperCase() + adm.role.slice(1) : '')}
                      </span>
                    </div>
                  </td>
                  <td className="p-5 px-8 whitespace-nowrap text-center">
                     <div className={cn(
                       "flex items-center gap-2 px-3 py-1 rounded-full border w-fit mx-auto",
                       adm.role === 'masteradmin' ? "bg-brand-primary/5 border-brand-primary/20 text-brand-primary" : "bg-blue-500/5 border-blue-500/20 text-blue-400"
                     )}>
                        {adm.role === 'masteradmin' ? <Shield size={10} /> : <Wrench size={10} />}
                        <span className="text-[8px] font-black uppercase tracking-widest">{adm.role === 'masteradmin' ? 'Master Administrator' : adm.role.charAt(0).toUpperCase() + adm.role.slice(1)}</span>
                     </div>
                  </td>
                  <td className="p-5 px-8 whitespace-nowrap text-center">
                     <div className="flex justify-center">
                        <span className={cn(
                          "status-chip flex items-center gap-1.5 whitespace-nowrap",
                          adm.status === 'active' ? "text-emerald-500 bg-emerald-500/5 border border-emerald-500/10" : "text-rose-500 bg-rose-500/5 border border-rose-500/10"
                        )}>
                           <div className={cn(
                             "w-1.5 h-1.5 rounded-full",
                             adm.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                           )} />
                           {adm.status}
                        </span>
                     </div>
                  </td>
                  <td className="p-5 px-8 whitespace-nowrap text-center">
                     <div className="flex justify-center gap-2">
                        <button 
                         disabled={adm.id === currentUser?.id}
                         onClick={() => {
                           if (adm.id === currentUser?.id) return;
                           setEditingAdmin({ ...adm });
                           setIsEditOpen(true);
                         }}
                         className="px-4 py-2 bg-slate-900 border border-white/5 rounded-lg text-[9px] font-black text-slate-400 hover:text-brand-primary hover:border-brand-primary/30 transition-all uppercase tracking-widest disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          Edit
                        </button>
                        <button 
                         disabled={adm.id === currentUser?.id}
                         onClick={() => {
                           if (adm.id === currentUser?.id) return;
                           setRevokeConfirmId(adm.id);
                         }}
                         className="px-4 py-2 bg-slate-900 border border-white/5 rounded-lg text-[9px] font-black text-rose-500/60 hover:text-rose-500 hover:border-rose-500/30 transition-all uppercase tracking-widest disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                     </div>
                  </td>
                </tr>
             ))}
          </tbody>
        </table>
      </div>

      <Modal title="EDIT ADMINISTRATOR" isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
         <div className="space-y-6">
            <Field label="Full Name" value={editingAdmin?.full_name || ''} onChange={(v: string) => setEditingAdmin({...editingAdmin, full_name: v})} placeholder="Full Name" />
            <Field label="PLV Email Address" value={editingAdmin?.plv_email || ''} onChange={(v: string) => setEditingAdmin({...editingAdmin, plv_email: v})} placeholder="admin@plv.edu.ph" />
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Administrative Role</label>
               <button 
                type="button"
                onClick={() => setShowRoleModal(true)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 pr-10 text-[10px] font-black text-white uppercase text-left relative group/select"
               >
                  <span>{editingAdmin?.role === 'masteradmin' ? 'Master Admin' : 'Standard Admin'}</span>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <ChevronDown size={14} className="text-brand-primary/60 group-hover/select:text-brand-primary transition-colors" />
                  </div>
               </button>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Status</label>
               <button 
                type="button"
                onClick={() => setShowStatusModal(true)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 pr-10 text-[10px] font-black text-white uppercase text-left relative group/select"
               >
                  <span>{editingAdmin?.status === 'active' ? 'Active' : 'Deactivated'}</span>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <ChevronDown size={14} className="text-brand-primary/60 group-hover/select:text-brand-primary transition-colors" />
                  </div>
               </button>
            </div>
            <button onClick={handleUpdate} disabled={loading} className="btn-primary w-full py-4 uppercase">
               {loading ? 'Updating...' : 'Save Changes'}
            </button>
         </div>
      </Modal>

      <Modal title="ADD NEW ADMINISTRATOR" isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}>
         <div className="space-y-6">
            <Field label="Full Name" value={newAdmin.full_name} onChange={(v: string) => setNewAdmin({...newAdmin, full_name: v})} placeholder="Full Name" />
            <Field label="PLV Email Address" value={newAdmin.plv_email} onChange={(v: string) => setNewAdmin({...newAdmin, plv_email: v})} placeholder="admin@plv.edu.ph" />
            <Field label="Initial Password" type="password" value={newAdmin.password} onChange={(v: string) => setNewAdmin({...newAdmin, password: v})} placeholder="••••••••" />
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Administrative Role</label>
               <button 
                type="button"
                onClick={() => setShowAddRoleModal(true)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 pr-10 text-[10px] font-black text-white uppercase text-left relative group/select"
               >
                  <span>{newAdmin.role === 'masteradmin' ? 'Master Admin' : 'Standard Admin'}</span>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <ChevronDown size={14} className="text-brand-primary/60 group-hover/select:text-brand-primary transition-colors" />
                  </div>
               </button>
            </div>
            <button onClick={handleCreate} disabled={loading} className="btn-primary w-full py-4 uppercase">
               {loading ? 'Creating...' : 'Finalize Addition'}
            </button>
         </div>
      </Modal>

      <SelectionModal 
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Select Role"
        options={['Standard Admin', 'Master Admin']}
        onSelect={(val) => setEditingAdmin({ ...editingAdmin, role: val === 'Master Admin' ? 'masteradmin' : 'admin' })}
      />

      <SelectionModal 
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Select Status"
        options={['Active', 'Deactivated']}
        onSelect={(val) => setEditingAdmin({ ...editingAdmin, status: val.toLowerCase() })}
      />

      <SelectionModal 
        isOpen={showAddRoleModal}
        onClose={() => setShowAddRoleModal(false)}
        title="Select Role"
        options={['Standard Admin', 'Master Admin']}
        onSelect={(val) => setNewAdmin({ ...newAdmin, role: val === 'Master Admin' ? 'masteradmin' : 'admin' })}
      />

      <ConfirmModal 
        isOpen={!!revokeConfirmId} 
        onClose={() => setRevokeConfirmId(null)} 
        title="REVOKE ADMINISTRATIVE ACCESS" 
        message="Are you sure you want to permanently remove this administrator? This action cannot be undone." 
        onConfirm={handleFinalRevoke}
        confirmLabel="REVOKE"
      />
    </div>
  );
};

const Field = ({ label, value, onChange, type = 'text', placeholder }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
    <input 
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-slate-900 text-white p-3.5 rounded-xl border border-white/5 font-bold focus:outline-none focus:border-brand-primary/50 transition-all text-xs placeholder:text-slate-600 placeholder:font-medium" 
    />
  </div>
);

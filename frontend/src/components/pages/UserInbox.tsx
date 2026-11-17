import React, { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import { useSettings } from '../../hooks/useSettings';
import { LoadingSpinner, EmptyState } from './Common';
import { DetailModal } from '../shared/Shared';
import { Globe } from 'lucide-react';

export const UserInbox = () => {
  const { settings } = useSettings();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);

  useEffect(() => {
    api.getInbox()
      .then(setMessages)
      .catch(() => setError('Failed to load inbox. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const handleOpenMessage = async (msg: any) => {
    setSelectedMessage(msg);
    if (!msg.read) {
      await api.markRead(msg.id);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: 1 } : m));
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] p-4 sm:p-6 lg:p-10 pb-24">
      <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white tracking-tighter uppercase mb-6 sm:mb-8">Inbox</h1>
      
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <EmptyState icon={Mail} message={error} />
      ) : messages.length === 0 ? (
        <EmptyState icon={Mail} message="No messages" />
      ) : (
        <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
          {messages.map(msg => (
            <div 
              key={msg.id}
              onClick={() => handleOpenMessage(msg)}
              className={cn(
                "glass-card p-5 sm:p-6 border-l-4 transition-all cursor-pointer hover:bg-brand-primary/[0.05] relative group bg-[#111827] rounded-[1.5rem] sm:rounded-[2rem]",
                msg.read ? "border-white/5 opacity-60" : "border-brand-primary bg-brand-primary/[0.03] shadow-lg shadow-brand-primary/5"
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-black text-white text-sm sm:text-base lg:text-lg uppercase tracking-tight max-w-[70%] leading-tight">{msg.title}</h3>
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                  {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <p className="text-sm text-slate-400 font-medium leading-relaxed line-clamp-2">
                {msg.content}
              </p>
              
              {!msg.read && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
              )}
            </div>
          ))}
        </div>
      )}

      <DetailModal 
        isOpen={!!selectedMessage} 
        onClose={() => setSelectedMessage(null)} 
        title="INBOX DETAILS"
      >
        <div className="space-y-4 sm:space-y-8">
          <div className="pb-4 sm:pb-8 border-b border-white/5">
            <h3 className="text-xl sm:text-4xl font-black text-white tracking-tighter uppercase mb-2 leading-[1.1] sm:leading-none">{selectedMessage?.title}</h3>
            <p className="text-[9px] sm:text-[10px] text-brand-primary font-black uppercase tracking-widest">
              {selectedMessage && new Date(selectedMessage.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <p className="text-sm sm:text-lg text-slate-400 font-medium leading-relaxed">
            {selectedMessage?.content}
          </p>
          <div className="pt-4 sm:pt-8">
             <button onClick={() => setSelectedMessage(null)} className="w-full bg-brand-primary text-slate-900 py-3 sm:py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all max-w-xs">CLOSE VIEW</button>
          </div>
        </div>
      </DetailModal>
    </div>
  );
};

export default UserInbox;

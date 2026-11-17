import React from 'react';

export const LoadingSpinner = () => (
  <div className="flex justify-center p-8">
    <div className="w-8 h-8 border-t-2 border-brand-primary rounded-full animate-spin" />
  </div>
);

export const EmptyState = ({ icon: Icon, message }: { icon: any, message: string }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center">
    <Icon size={32} className="text-slate-700 mb-4" />
    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-none">{message}</p>
  </div>
);

import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    error: <AlertTriangle className="w-5 h-5 text-rose-400" />,
    info: <Info className="w-5 h-5 text-cyan-400" />
  };

  const borderColors = {
    success: 'border-emerald-500/30',
    error: 'border-rose-500/30',
    info: 'border-cyan-500/30'
  };

  const glows = {
    success: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    error: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]',
    info: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]'
  };

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl glass-panel ${borderColors[type]} ${glows[type]} transition-all duration-300 transform translate-y-0 animate-bounce-short`}>
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="text-sm font-medium text-gray-200">{message}</div>
      <button 
        onClick={onClose} 
        className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

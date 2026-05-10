'use client';

import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { X, Info, CheckCircle, AlertTriangle, Flame } from 'lucide-react';

export default function ToastContainer() {
  const toasts = useGameStore((state) => state.toasts);
  const removeToast = useGameStore((state) => state.removeToast);

  // Auto remove toasts after 5 seconds
  useEffect(() => {
    if (toasts.length > 0) {
      const timers = toasts.map((toast) =>
        setTimeout(() => removeToast(toast.id), 5000)
      );
      return () => timers.forEach(clearTimeout);
    }
  }, [toasts, removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let colorClass = 'border-blue-500 bg-blue-500/10 text-blue-400';

        if (toast.type === 'success') {
          Icon = CheckCircle;
          colorClass = 'border-green-500 bg-green-500/10 text-green-400';
        } else if (toast.type === 'warning') {
          Icon = Flame;
          colorClass = 'border-orange-500 bg-orange-500/10 text-orange-400';
        } else if (toast.type === 'error') {
          Icon = AlertTriangle;
          colorClass = 'border-red-500 bg-red-500/10 text-red-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 w-80 p-3 rounded-lg border shadow-lg backdrop-blur-md transition-all animate-in slide-in-from-right-4 fade-in ${colorClass}`}
          >
            <Icon size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1 flex flex-col min-w-0">
              <span className="font-bold text-sm truncate">{toast.title}</span>
              <span className="text-xs text-gray-300 line-clamp-2 mt-0.5">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-white shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

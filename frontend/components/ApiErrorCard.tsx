'use client';

import { AlertCircle } from 'lucide-react';

interface ApiErrorCardProps {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}

export default function ApiErrorCard({ title, message, actionLabel, onAction }: ApiErrorCardProps) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
      <p className="text-slate-400 mb-6">{message}</p>
      <button
        onClick={onAction}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all"
      >
        {actionLabel}
      </button>
    </div>
  );
}

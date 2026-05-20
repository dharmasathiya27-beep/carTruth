'use client';

import { Info } from 'lucide-react';

interface EmptyStateCardProps {
  title: string;
  message: string;
}

export default function EmptyStateCard({ title, message }: EmptyStateCardProps) {
  return (
    <div className="glass rounded-2xl p-8 text-center">
      <Info className="w-10 h-10 text-blue-300 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
    </div>
  );
}

'use client';

import { ShieldCheck } from 'lucide-react';

interface ConfidenceBadgeProps {
  level?: 'High' | 'Medium' | 'Low' | string;
}

export default function ConfidenceBadge({ level = 'Low' }: ConfidenceBadgeProps) {
  const styles =
    {
      High: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
      Medium: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
      Low: 'border-red-500/30 bg-red-500/15 text-red-300',
    }[level] || 'border-slate-500/30 bg-slate-500/15 text-slate-300';

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-sm font-semibold ${styles}`}
    >
      <ShieldCheck className="w-4 h-4" />
      {level} confidence
    </span>
  );
}

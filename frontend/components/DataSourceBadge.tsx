'use client';

import { BadgeCheck, Database } from 'lucide-react';

interface DataSourceBadgeProps {
  source?: string;
}

export default function DataSourceBadge({ source }: DataSourceBadgeProps) {
  const isDvla = source === 'dvla' || source === 'official' || source === 'official+mock';

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-sm font-semibold ${
      isDvla
        ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
        : 'border-blue-500/30 bg-blue-500/15 text-blue-300'
    }`}>
      {isDvla ? <BadgeCheck className="w-4 h-4" /> : <Database className="w-4 h-4" />}
      {isDvla ? 'DVLA verified data' : 'Mock data mode'}
    </span>
  );
}

'use client';

import Link from 'next/link';
import { Gauge } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 no-print">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Gauge className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            CarTruth
          </h1>
        </Link>
      </div>
    </header>
  );
}

'use client';

import { Database, ShieldCheck, Sparkles } from 'lucide-react';
import { VehicleReport } from '@/lib/api';
import VehicleVisualCard from '@/components/VehicleVisualCard';

interface VehicleHeroSectionProps {
  report: VehicleReport;
}

export default function VehicleHeroSection({ report }: VehicleHeroSectionProps) {
  const vehicle = report.vehicle;
  const age = vehicle.year ? new Date().getFullYear() - vehicle.year : null;
  const verdictStyle = {
    BUY: 'bg-green-500/15 text-green-300 border-green-500/30',
    INSPECT: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    AVOID: 'bg-red-500/15 text-red-300 border-red-500/30',
  }[report.ownership_score.verdict];

  return (
    <section className="mb-12">
      <div className="grid lg:grid-cols-5 gap-6 items-stretch">
        <div className="glass rounded-2xl p-8 lg:col-span-3">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-4 py-2 rounded-lg border border-white/15 bg-white/10 text-xl font-bold tracking-wider">
              {vehicle.registration || 'N/A'}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-sm font-semibold text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
              {report.data_source === 'dvla' ? 'DVLA verified' : 'Mock data'}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/15 text-sm font-semibold text-cyan-300">
              <Database className="w-4 h-4" />
              DVSA MOT ready
            </span>
            <span className="px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/15 text-sm font-semibold text-blue-300">
              {report.confidence_level} confidence
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {vehicle.make || 'Unknown Make'} {vehicle.model || ''}
          </h1>
          <p className="text-lg text-slate-400 mb-8">
            {vehicle.year || 'Year unavailable'}
            {age !== null ? ` • ${age} years old` : ''}
          </p>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className={`rounded-lg border px-3 py-1 text-sm font-bold ${verdictStyle}`}>
                {report.ownership_score.verdict}
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-purple-500/25 bg-purple-500/10 px-3 py-1 text-sm font-semibold text-purple-200">
                <Sparkles className="h-4 w-4" />
                CarTruth ownership score
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-[auto,1fr] md:items-center">
              <div>
                <p className="text-5xl font-black text-white">
                  {report.ownership_score.score}
                  <span className="text-xl text-slate-500">/100</span>
                </p>
              </div>
              <p className="text-sm leading-relaxed text-slate-300">
                {report.ownership_score.should_buy_recommendation}
              </p>
            </div>
          </div>
        </div>

        <VehicleVisualCard vehicle={vehicle} />
      </div>
    </section>
  );
}

'use client';

import { CalendarDays, Fuel, Gauge, Milestone, ShieldCheck } from 'lucide-react';
import { VehicleReport } from '@/lib/api';

interface VehicleHeroSectionProps {
  report: VehicleReport;
}

export default function VehicleHeroSection({ report }: VehicleHeroSectionProps) {
  const vehicle = report.vehicle;
  const age = vehicle.year ? new Date().getFullYear() - vehicle.year : null;
  const motValidUntil = report.mot_valid_until
    ? new Date(report.mot_valid_until).toLocaleDateString('en-GB')
    : null;
  const latestMileage = [...(report.mileage_history || [])]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

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
            <span className="px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/15 text-sm font-semibold text-blue-300">
              {report.confidence_level} confidence
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {vehicle.make || 'Unknown Make'} {vehicle.model || ''}
          </h1>
          <p className="text-lg text-slate-400 mb-8">
            {vehicle.year || 'Year unavailable'}{age !== null ? ` • ${age} years old` : ''} • {vehicle.colour || 'Colour unavailable'}
          </p>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Fuel className="w-4 h-4" />
                Fuel
              </div>
              <p className="text-xl font-bold">{vehicle.fuel_type || 'N/A'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Gauge className="w-4 h-4" />
                Engine
              </div>
              <p className="text-xl font-bold">
                {vehicle.engine_capacity_cc ? `${vehicle.engine_capacity_cc} cc` : vehicle.engine_size ? `${vehicle.engine_size}L` : 'N/A'}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <CalendarDays className="w-4 h-4" />
                MOT
              </div>
              <p className="text-xl font-bold">{report.current_mot_status || 'Unknown'}</p>
              {motValidUntil && (
                <p className="mt-1 text-xs font-medium text-slate-400">
                  Valid until: {motValidUntil}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Milestone className="w-4 h-4" />
                Mileage
              </div>
              <p className="text-xl font-bold">
                {latestMileage ? `${latestMileage.mileage.toLocaleString()} miles` : 'N/A'}
              </p>
              {latestMileage && (
                <p className="mt-1 text-xs font-medium text-slate-400">
                  Last updated: {new Date(latestMileage.date).toLocaleDateString('en-GB')}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 lg:col-span-2 min-h-[300px]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a_0%,#111827_45%,#164e63_100%)]" />
          <div className="absolute inset-x-8 bottom-12 h-20 rounded-t-full border-t-4 border-x-4 border-cyan-300/40" />
          <div className="absolute left-14 right-14 bottom-16 h-16 rounded-t-[5rem] bg-slate-800 border border-cyan-300/25" />
          <div className="absolute left-10 right-10 bottom-10 h-8 rounded-full bg-slate-700 border border-white/10" />
          <div className="absolute left-16 bottom-6 w-16 h-16 rounded-full bg-slate-950 border-4 border-slate-500" />
          <div className="absolute right-16 bottom-6 w-16 h-16 rounded-full bg-slate-950 border-4 border-slate-500" />
          <div className="absolute left-1/2 -translate-x-1/2 top-10 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/70">CarTruth</p>
            <p className="text-2xl font-bold text-white/90">{vehicle.make || 'Vehicle'}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

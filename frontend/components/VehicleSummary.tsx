'use client';

import { Fuel, Gauge, PoundSterling, Zap, CalendarDays, AlertCircle, ShieldCheck } from 'lucide-react';
import { VehicleDetails, OwnershipScore } from '@/lib/api';

interface VehicleSummaryProps {
  vehicle: VehicleDetails;
  motStatus: string;
  motValidUntil?: string;
  score: OwnershipScore;
}

export default function VehicleSummary({
  vehicle,
  motStatus,
  motValidUntil,
  score,
}: VehicleSummaryProps) {
  const getMotStatusColor = () => {
    if (motStatus === 'Valid') return 'bg-green-500/20 text-green-300 border-green-500/30';
    if (motStatus === 'Due Soon') return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    return 'bg-red-500/20 text-red-300 border-red-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Vehicle header */}
      <div className="glass rounded-2xl p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {vehicle.make} {vehicle.model}
            </h1>
            <p className="text-slate-400">Registration: {vehicle.registration}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-400">{vehicle.year}</div>
            <p className="text-sm text-slate-400">{new Date().getFullYear() - vehicle.year} years old</p>
          </div>
        </div>

        {/* Quick details grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/40 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">Fuel Type</p>
            <p className="text-lg font-semibold flex items-center gap-2">
              <Fuel className="w-4 h-4 text-blue-400" />
              {vehicle.fuel_type}
            </p>
          </div>

          <div className="bg-slate-800/40 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">Engine</p>
            <p className="text-lg font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              {vehicle.engine_size ? `${vehicle.engine_size}L` : 'N/A'}
            </p>
          </div>

          <div className="bg-slate-800/40 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">Colour</p>
            <p className="text-lg font-semibold">{vehicle.colour}</p>
          </div>

          <div className="bg-slate-800/40 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">Tax Status</p>
            <p className="text-lg font-semibold text-green-400">{vehicle.tax_status}</p>
          </div>
        </div>
      </div>

      {/* MOT Status */}
      <div className="glass rounded-2xl p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">MOT Status</h2>
          <span className={`px-4 py-2 rounded-lg border text-sm font-semibold ${getMotStatusColor()}`}>
            {motStatus}
          </span>
        </div>

        {motValidUntil && (
          <div className="flex items-center gap-2 text-slate-300">
            <CalendarDays className="w-4 h-4" />
            <span>Valid until: {new Date(motValidUntil).toLocaleDateString('en-GB')}</span>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold">Verdict</h3>
          </div>
          <span className={`inline-flex px-3 py-1 rounded-lg border text-sm font-semibold ${
            score.verdict === 'BUY'
              ? 'bg-green-500/15 text-green-300 border-green-500/30'
              : score.verdict === 'INSPECT'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-red-500/15 text-red-300 border-red-500/30'
          }`}>
            {score.verdict}
          </span>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold">Maintenance risk</h3>
          </div>
          <p className="text-2xl font-bold text-white">{score.maintenance_risk}</p>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <PoundSterling className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold">Yearly estimate</h3>
          </div>
          <p className="text-2xl font-bold text-white">£{score.yearly_cost_estimate.toLocaleString()}</p>
        </div>
      </div>

      {/* Ownership insights */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* What looks good */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold">What looks good</h3>
          </div>
          <p className="text-slate-300 leading-relaxed text-sm">
            {score.what_looks_good}
          </p>
        </div>

        {/* Problems */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold">Potential problems</h3>
          </div>
          <p className="text-slate-300 leading-relaxed text-sm">
            {score.potential_problems}
          </p>
        </div>

        {/* Running cost */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <PoundSterling className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold">Expected yearly cost</h3>
          </div>
          <p className="text-slate-300 leading-relaxed text-sm">
            {score.expected_yearly_cost}
          </p>
        </div>

        {/* Should you buy */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold">Should you buy it?</h3>
          </div>
          <p className="text-slate-300 leading-relaxed text-sm">
            {score.should_buy_recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}

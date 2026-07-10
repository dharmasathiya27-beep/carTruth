'use client';

import {
  AlertTriangle,
  BadgeCheck,
  Cloud,
  PoundSterling,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import EmptyStateCard from '@/components/EmptyStateCard';
import { VehicleReport } from '@/lib/api';

interface OwnershipIntelligenceSectionProps {
  report: VehicleReport;
}

const ratingStyle = (rating: string) => {
  if (['Low', 'Strong', 'Excellent', 'Good'].includes(rating)) {
    return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300';
  }
  if (['High', 'Caution', 'Poor'].includes(rating)) {
    return 'border-red-500/25 bg-red-500/10 text-red-300';
  }
  return 'border-amber-500/25 bg-amber-500/10 text-amber-300';
};

const badgeStyle = (badge: string) => {
  if (badge === 'Clean visible risk profile') {
    return {
      className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
      Icon: BadgeCheck,
    };
  }

  if (['MOT failure history', 'Mileage anomaly', 'MOT status', 'Tax status'].includes(badge)) {
    return {
      className: 'border-red-500/25 bg-red-500/10 text-red-200',
      Icon: AlertTriangle,
    };
  }

  return {
    className: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
    Icon: AlertTriangle,
  };
};

export default function OwnershipIntelligenceSection({
  report,
}: OwnershipIntelligenceSectionProps) {
  const riskSignals = [
    {
      label: 'Repeated tyre wear',
      active: report.ownership_score.repeated_tyres,
      detail: 'Multiple tyre advisories found across MOT records',
    },
    {
      label: 'Repeated brake advisories',
      active: report.ownership_score.repeated_brakes,
      detail: 'Brake wear appears more than once in MOT history',
    },
    {
      label: 'Mileage inconsistency',
      active: report.ownership_score.mileage_inconsistency,
      detail: 'Mileage decreases between recorded readings',
    },
  ];

  return (
    <section className="mb-12">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-white">Ownership Intelligence</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-6">
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <PoundSterling className="h-5 w-5 text-cyan-400" />
            <h3 className="text-xl font-semibold">Running Cost</h3>
          </div>
          <p className="mb-2 text-4xl font-bold text-white">
            £
            {(
              report.ownership_score.yearly_running_cost ||
              report.ownership_score.yearly_cost_estimate
            ).toLocaleString()}
          </p>
          <p className="text-sm text-slate-400">Estimated annual ownership cost</p>
        </div>

        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            <h3 className="text-xl font-semibold">Vehicle Risk Level</h3>
          </div>
          <span
            className={`inline-flex rounded-lg border px-4 py-2 text-lg font-bold ${ratingStyle(
              report.ownership_score.risk_level,
            )}`}
          >
            {report.ownership_score.risk_level}
          </span>
          <p className="mt-3 text-sm text-slate-400">Estimated from available official records</p>
        </div>

        <div className="glass rounded-2xl p-6 lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-semibold">Reliability</h3>
          </div>
          <span
            className={`inline-flex rounded-lg border px-3 py-2 text-base font-bold ${ratingStyle(
              report.ownership_score.reliability_rating,
            )}`}
          >
            {report.ownership_score.reliability_rating}
          </span>
        </div>

        <div className="glass rounded-2xl p-6 lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <Cloud className="h-5 w-5 text-teal-400" />
            <h3 className="text-lg font-semibold">Environment</h3>
          </div>
          <span
            className={`inline-flex rounded-lg border px-3 py-2 text-base font-bold ${ratingStyle(
              report.ownership_score.environmental_rating,
            )}`}
          >
            {report.ownership_score.environmental_rating}
          </span>
        </div>

        <div className="glass rounded-2xl p-6 lg:col-span-4">
          <div className="mb-5 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-cyan-400" />
            <h3 className="text-xl font-semibold">Risk Signals</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {riskSignals.map((signal) => (
              <div
                key={signal.label}
                className={`rounded-xl border p-4 ${
                  signal.active
                    ? 'border-amber-500/30 bg-amber-500/10'
                    : 'border-emerald-500/25 bg-emerald-500/10'
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  {signal.active ? (
                    <AlertTriangle className="h-4 w-4 text-amber-300" />
                  ) : (
                    <BadgeCheck className="h-4 w-4 text-emerald-300" />
                  )}
                  <span className="text-sm font-semibold">{signal.label}</span>
                </div>
                <p className="text-xs text-slate-400">
                  {signal.active ? signal.detail : 'No pattern detected'}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <h3 className="mb-5 text-xl font-semibold">Risk Badges</h3>
          <div className="flex flex-wrap gap-2">
            {(report.ownership_score.risk_badges.length
              ? report.ownership_score.risk_badges
              : ['Clean visible risk profile']
            ).map((badge) => {
              const { className, Icon } = badgeStyle(badge);
              return (
                <span
                  key={badge}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${className}`}
                >
                  <Icon className="h-4 w-4" />
                  {badge}
                </span>
              );
            })}
          </div>
          {report.ownership_score.analysis_notes.length > 0 && (
            <div className="mt-5 space-y-2">
              {report.ownership_score.analysis_notes.map((note) => (
                <p key={note} className="text-sm leading-relaxed text-slate-400">
                  {note}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6 lg:col-span-6">
          <h3 className="mb-5 text-xl font-semibold">Factors affecting this vehicle</h3>
          {report.ownership_score.affecting_factors.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {report.ownership_score.affecting_factors.map((factor) => (
                <div
                  key={factor}
                  className="rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-slate-300"
                >
                  {factor}
                </div>
              ))}
            </div>
          ) : (
            <EmptyStateCard
              title="Limited scoring factors"
              message="The score is currently based on the available vehicle data. More factors appear when official records include them."
            />
          )}
        </div>
      </div>
    </section>
  );
}

'use client';

import { CalendarDays, Clock3, Database, Gauge, ShieldCheck, Sparkles, Stamp } from 'lucide-react';
import { MOTRecord, VehicleReport } from '@/lib/api';
import VehicleVisualCard from '@/components/VehicleVisualCard';

interface VehicleHeroSectionProps {
  report: VehicleReport;
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const parseDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDate = (value?: string | null) => {
  const parsed = parseDate(value);
  return parsed ? dateFormatter.format(parsed) : 'Not available';
};

export const calculateDaysUntil = (value?: string | null) => {
  const parsed = parseDate(value);
  if (!parsed) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((parsed.getTime() - today.getTime()) / 86_400_000);
};

export const getDateStatusLabel = (value?: string | null) => {
  const days = calculateDaysUntil(value);
  if (days === null) {
    return 'Not available';
  }
  if (days > 0) {
    return `${days} days remaining`;
  }
  if (days === 0) {
    return 'Due today';
  }
  return `Expired ${Math.abs(days)} days ago`;
};

export const getLatestMotRecord = (motHistory: MOTRecord[]) => {
  return [...motHistory].sort((a, b) => {
    const aDate = parseDate(a.test_date || a.testDate)?.getTime() || 0;
    const bDate = parseDate(b.test_date || b.testDate)?.getTime() || 0;
    return bDate - aDate;
  })[0];
};

const titleCase = (value?: string | null) => {
  if (!value) {
    return 'Unknown';
  }

  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const statusClasses = (status?: string | null) => {
  const normalised = (status || '').toLowerCase();
  if (normalised.includes('valid') || normalised.includes('passed') || normalised === 'taxed') {
    return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300';
  }
  if (
    normalised.includes('expired') ||
    normalised.includes('failed') ||
    normalised.includes('untaxed') ||
    normalised.includes('not taxed')
  ) {
    return 'border-red-500/25 bg-red-500/10 text-red-300';
  }
  return 'border-slate-500/25 bg-white/5 text-slate-300';
};

export default function VehicleHeroSection({ report }: VehicleHeroSectionProps) {
  const vehicle = report.vehicle;
  const latestMot = getLatestMotRecord(report.mot_history);
  const latestMotDate = latestMot?.test_date || latestMot?.testDate;
  const latestMotExpiry =
    report.mot_valid_until || vehicle.mot_expiry_date || latestMot?.expiryDate;
  const latestMotResult = latestMot?.result ? titleCase(latestMot.result) : 'Unknown';
  const latestMileage = latestMot?.mileage;
  const taxStatus = vehicle.tax_status || 'Unknown';
  const age = vehicle.year ? new Date().getFullYear() - vehicle.year : null;
  const verdictStyle = {
    BUY: 'bg-green-500/15 text-green-300 border-green-500/30',
    INSPECT: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    AVOID: 'bg-red-500/15 text-red-300 border-red-500/30',
  }[report.ownership_score.verdict];
  const keyFacts = [
    {
      title: 'Latest mileage',
      value: latestMileage ? `${latestMileage.toLocaleString()} miles` : 'Not available',
      detail: latestMotDate ? `Recorded ${formatDate(latestMotDate)}` : 'Recorded date unavailable',
      badge: latestMileage ? 'DVSA' : 'Unknown',
      icon: Gauge,
      badgeClass: latestMileage
        ? 'border-cyan-500/25 bg-cyan-500/10 text-cyan-300'
        : statusClasses('unknown'),
    },
    {
      title: 'MOT expiry',
      value: formatDate(latestMotExpiry),
      detail: getDateStatusLabel(latestMotExpiry),
      badge: report.current_mot_status || 'Unknown',
      icon: CalendarDays,
      badgeClass: statusClasses(report.current_mot_status),
    },
    {
      title: 'Tax due',
      value: formatDate(vehicle.tax_due_date),
      detail: getDateStatusLabel(vehicle.tax_due_date),
      badge: titleCase(taxStatus),
      icon: Stamp,
      badgeClass: statusClasses(taxStatus),
    },
    {
      title: 'Last MOT test',
      value: formatDate(latestMotDate),
      detail: latestMot ? `MOT ${latestMotResult.toLowerCase()}` : 'MOT result unavailable',
      badge: latestMotResult,
      icon: Clock3,
      badgeClass: statusClasses(latestMotResult),
    },
  ];

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

          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                Key dates & mileage
              </h2>
              <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-400 sm:inline-flex">
                DVLA/DVSA signals
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {keyFacts.map((fact) => {
                const Icon = fact.icon;

                return (
                  <article
                    key={fact.title}
                    className="rounded-xl border border-white/10 bg-slate-950/45 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.22)]"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-cyan-200">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${fact.badgeClass}`}
                      >
                        {fact.badge}
                      </span>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {fact.title}
                    </p>
                    <p className="mt-1 text-base font-bold text-white">{fact.value}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{fact.detail}</p>
                  </article>
                );
              })}
            </div>
          </div>

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

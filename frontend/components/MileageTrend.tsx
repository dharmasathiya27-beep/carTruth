'use client';

import { MileageRecord, MOTRecord } from '@/lib/api';
import { CalendarClock, Gauge, Route, TrendingDown, TrendingUp, Wrench } from 'lucide-react';
import EmptyStateCard from '@/components/EmptyStateCard';

interface MileageTrendProps {
  history: MileageRecord[];
  motHistory?: MOTRecord[];
  vehicleYear?: number;
}

interface Insight {
  label: string;
  detail: string;
  tone: 'blue' | 'amber' | 'green' | 'red';
}

const toneClass = {
  blue: 'border-blue-500/25 bg-blue-500/10 text-blue-100',
  amber: 'border-amber-500/25 bg-amber-500/10 text-amber-100',
  green: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100',
  red: 'border-red-500/25 bg-red-500/10 text-red-100',
};

function categoryCount(motHistory: MOTRecord[] = [], category: string) {
  return motHistory.reduce((count, record) => {
    return (
      count + (record.classified_defects || []).filter((item) => item.category === category).length
    );
  }, 0);
}

function buildMaintenanceInsights(
  latestMileage: number,
  avgMileagePerYear: number,
  vehicleAge: number,
  motHistory: MOTRecord[] = [],
): Insight[] {
  const brakeCount = categoryCount(motHistory, 'Brakes');
  const tyreCount = categoryCount(motHistory, 'Tyres');
  const suspensionCount = categoryCount(motHistory, 'Suspension');
  const insights: Insight[] = [];

  if (brakeCount >= 2) {
    insights.push({
      label: 'Brake inspection may be needed soon',
      detail: 'Brake advisories appear repeatedly in the MOT pattern.',
      tone: 'amber',
    });
  }

  if (tyreCount >= 2 || avgMileagePerYear > 12000) {
    insights.push({
      label: 'Tyre replacement likely within 6-12 months',
      detail:
        tyreCount >= 2
          ? 'Tyre wear is a repeated advisory area.'
          : 'Higher annual mileage can accelerate tyre wear.',
      tone: 'amber',
    });
  }

  if (suspensionCount > 0) {
    insights.push({
      label: 'Suspension wear monitoring recommended',
      detail: 'Suspension-related notes can develop into larger repair items if ignored.',
      tone: 'blue',
    });
  }

  if (latestMileage > 90000 || vehicleAge >= 10) {
    insights.push({
      label: 'Higher mileage components may require inspection',
      detail: 'Mileage and age suggest closer checks on wear items during servicing.',
      tone: latestMileage > 120000 ? 'red' : 'amber',
    });
  }

  if (!insights.length) {
    insights.push({
      label: 'Routine maintenance window',
      detail: 'No urgent mileage-led maintenance pattern is visible from the available data.',
      tone: 'green',
    });
  }

  return insights.slice(0, 4);
}

function buildOwnershipPatternInsights(
  sortedHistory: MileageRecord[],
  avgMileagePerYear: number,
): Insight[] {
  const yearlyChanges = sortedHistory
    .slice(1)
    .map((record, index) => record.mileage - sortedHistory[index].mileage);
  const maxChange = Math.max(...yearlyChanges, 0);
  const minChange = Math.min(...yearlyChanges, 0);
  const consistent = yearlyChanges.length > 1 && maxChange - minChange < 5000;
  const insights: Insight[] = [];

  if (avgMileagePerYear >= 12000) {
    insights.push({
      label: 'Likely commuter-driven vehicle',
      detail: 'Annual mileage is above the UK private-use average.',
      tone: 'blue',
    });
  } else if (avgMileagePerYear >= 7000) {
    insights.push({
      label: 'Moderate annual usage',
      detail: 'Mileage suggests regular use without unusually heavy annual distance.',
      tone: 'green',
    });
  } else {
    insights.push({
      label: 'Lower mileage stress than average',
      detail: 'Recorded mileage growth is below typical annual usage.',
      tone: 'green',
    });
  }

  if (consistent) {
    insights.push({
      label: 'Consistent mileage pattern',
      detail: 'Year-to-year mileage changes look stable with no obvious usage spikes.',
      tone: 'green',
    });
  }

  if (avgMileagePerYear > 14000 && consistent) {
    insights.push({
      label: 'Possible motorway-focused usage',
      detail: 'High but steady mileage can indicate longer, consistent journeys.',
      tone: 'blue',
    });
  }

  return insights.slice(0, 3);
}

export default function MileageTrend({ history, motHistory = [], vehicleYear }: MileageTrendProps) {
  if (!history.length) {
    return (
      <EmptyStateCard
        title="Mileage history unavailable"
        message="Mileage trend data needs MOT history. This report still uses available vehicle details for the ownership estimate."
      />
    );
  }

  // Sort by date ascending for display
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // Calculate stats
  const latestMileage = sortedHistory[sortedHistory.length - 1].mileage;
  const earliestMileage = sortedHistory[0].mileage;
  const totalMileage = latestMileage - earliestMileage;
  const avgMileagePerYear = totalMileage / (sortedHistory.length - 1 || 1);
  const vehicleAge = vehicleYear
    ? Math.max(new Date().getFullYear() - vehicleYear, 0)
    : sortedHistory.length;
  const maintenanceInsights = buildMaintenanceInsights(
    latestMileage,
    avgMileagePerYear,
    vehicleAge,
    motHistory,
  );
  const ownershipInsights = buildOwnershipPatternInsights(sortedHistory, avgMileagePerYear);

  // Create a simple bar chart
  const maxMileage = Math.max(...sortedHistory.map((r) => r.mileage));
  const minMileage = Math.min(...sortedHistory.map((r) => r.mileage));
  const range = maxMileage - minMileage || 1;

  return (
    <div className="glass rounded-2xl p-8">
      <h2 className="text-2xl font-semibold mb-8">Mileage Trend</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800/40 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Latest Mileage</p>
          <p className="text-2xl font-bold text-blue-400">{latestMileage.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">miles</p>
        </div>

        <div className="bg-slate-800/40 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Total Added</p>
          <p className="text-2xl font-bold text-purple-400">{totalMileage.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">miles</p>
        </div>

        <div className="bg-slate-800/40 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Annual Average</p>
          <p className="text-2xl font-bold text-cyan-400">
            {Math.round(avgMileagePerYear).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">miles/year</p>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        {sortedHistory.map((record, index) => {
          const heightPercent = ((record.mileage - minMileage) / range) * 100;
          const isHighMileage = avgMileagePerYear > 12000;

          return (
            <div key={index} className="flex items-end gap-3 group">
              <div className="w-20 text-xs text-slate-400 text-right">
                {new Date(record.date).toLocaleDateString('en-GB', {
                  month: 'short',
                  year: '2-digit',
                })}
              </div>
              <div className="flex-1">
                <div className="relative h-10 bg-slate-800/40 rounded-lg overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full transition-all duration-300 ${
                      isHighMileage ? 'bg-orange-500/20' : 'bg-blue-500/20'
                    }`}
                    style={{ width: `${Math.max(10, heightPercent)}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-sm font-semibold text-slate-300">
                      {record.mileage.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              {index > 0 && (
                <div className="text-xs text-slate-500 w-12 text-right">
                  {Math.round(record.mileage - sortedHistory[index - 1].mileage).toLocaleString()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Trend indicator */}
      <div className="mt-8 p-4 bg-slate-800/40 rounded-lg flex items-center gap-3">
        {avgMileagePerYear > 12000 ? (
          <>
            <TrendingUp className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-orange-300">
              Above average mileage ({Math.round(avgMileagePerYear).toLocaleString()} mi/year)
            </span>
          </>
        ) : (
          <>
            <TrendingDown className="w-5 h-5 text-green-400" />
            <span className="text-sm text-green-300">
              Below average mileage ({Math.round(avgMileagePerYear).toLocaleString()} mi/year)
            </span>
          </>
        )}
      </div>

      <div className="mt-6 grid gap-4">
        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="w-5 h-5 text-amber-300" />
            <h3 className="font-semibold">Predicted Maintenance Window</h3>
          </div>
          <div className="grid gap-2">
            {maintenanceInsights.map((insight) => (
              <div
                key={insight.label}
                className={`rounded-lg border px-3 py-2 ${toneClass[insight.tone]}`}
              >
                <div className="flex items-start gap-2">
                  <Wrench className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{insight.label}</p>
                    <p className="text-xs opacity-80">{insight.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Route className="w-5 h-5 text-cyan-300" />
            <h3 className="font-semibold">Ownership Pattern</h3>
          </div>
          <div className="grid gap-2">
            {ownershipInsights.map((insight) => (
              <div
                key={insight.label}
                className={`rounded-lg border px-3 py-2 ${toneClass[insight.tone]}`}
              >
                <div className="flex items-start gap-2">
                  <Gauge className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{insight.label}</p>
                    <p className="text-xs opacity-80">{insight.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

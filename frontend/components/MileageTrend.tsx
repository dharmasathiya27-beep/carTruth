'use client';

import { MileageRecord } from '@/lib/api';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MileageTrendProps {
  history: MileageRecord[];
}

export default function MileageTrend({ history }: MileageTrendProps) {
  if (!history.length) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-slate-400">
        No mileage history available
      </div>
    );
  }

  // Sort by date ascending for display
  const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Calculate stats
  const latestMileage = sortedHistory[sortedHistory.length - 1].mileage;
  const earliestMileage = sortedHistory[0].mileage;
  const totalMileage = latestMileage - earliestMileage;
  const avgMileagePerYear = totalMileage / (sortedHistory.length - 1 || 1);

  // Create a simple bar chart
  const maxMileage = Math.max(...sortedHistory.map(r => r.mileage));
  const minMileage = Math.min(...sortedHistory.map(r => r.mileage));
  const range = maxMileage - minMileage || 1;

  return (
    <div className="glass rounded-2xl p-8">
      <h2 className="text-2xl font-semibold mb-8">Mileage Trend</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800/40 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Latest Mileage</p>
          <p className="text-2xl font-bold text-blue-400">
            {latestMileage.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">miles</p>
        </div>

        <div className="bg-slate-800/40 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Total Added</p>
          <p className="text-2xl font-bold text-purple-400">
            {totalMileage.toLocaleString()}
          </p>
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
                {new Date(record.date).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}
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
    </div>
  );
}

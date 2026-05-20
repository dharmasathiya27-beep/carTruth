'use client';

import { CheckCircle2, XCircle, AlertTriangle, Repeat2 } from 'lucide-react';
import { MOTRecord } from '@/lib/api';
import EmptyStateCard from '@/components/EmptyStateCard';

interface MOTTimelineProps {
  history: MOTRecord[];
}

export default function MOTTimeline({ history }: MOTTimelineProps) {
  if (!history.length) {
    return (
      <EmptyStateCard
        title="MOT history pending"
        message="Detailed MOT records are not available for this report yet. The ownership estimate uses the vehicle data we do have."
      />
    );
  }

  return (
    <div className="glass rounded-2xl p-8">
      <h2 className="text-2xl font-semibold mb-2">MOT Intelligence Timeline</h2>
      <p className="text-sm text-slate-400 mb-8">
        Advisory and failure items classified by category, severity, and repeat pattern.
      </p>

      <div className="space-y-4">
        {history.map((record, index) => {
          const year = new Date(record.test_date).getFullYear();
          const classified = record.classified_defects?.length
            ? record.classified_defects
            : record.defects.map((defect) => ({
                text: defect,
                category: 'Unclassified',
                severity: record.result === 'FAILED' ? 'High' as const : 'Low' as const,
                is_repeated: false,
              }));

          const failures = [
            ...(record.failures || []),
            ...(record.dangerousDefects || []),
            ...(record.majorDefects || []),
          ];

          const severityClass = (severity: string) => {
            if (severity === 'Critical') return 'bg-red-600/20 text-red-200 border-red-500/40';
            if (severity === 'High') return 'bg-orange-500/15 text-orange-200 border-orange-500/35';
            if (severity === 'Medium') return 'bg-amber-500/15 text-amber-200 border-amber-500/35';
            return 'bg-blue-500/15 text-blue-200 border-blue-500/30';
          };

          return (
          <div key={index} className="flex gap-6 pb-6 border-b border-white/10 last:border-b-0 last:pb-0">
            {/* Timeline dot and line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  record.result === 'PASSED'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {record.result === 'PASSED' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
              </div>
              {index < history.length - 1 && (
                <div className="w-0.5 h-12 bg-gradient-to-b from-white/20 to-transparent mt-2" />
              )}
            </div>

            {/* Test details */}
            <div className="flex-1 pt-1">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div>
                  <span className="font-semibold text-lg">
                    {year} MOT {record.result === 'PASSED' ? 'Passed' : 'Failed'}
                  </span>
                  <p className="text-sm text-slate-500">
                    {new Date(record.test_date).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-lg border text-xs font-bold ${
                  record.result === 'PASSED'
                    ? 'bg-green-500/15 text-green-300 border-green-500/30'
                    : 'bg-red-500/15 text-red-300 border-red-500/30'
                }`}>
                  {record.result}
                </span>
              </div>

              {record.mileage && (
                <p className="text-sm text-slate-400 mb-3">
                  Mileage: {record.mileage.toLocaleString()} miles
                </p>
              )}

              {record.expiryDate && (
                <p className="text-sm text-slate-500 mb-3">
                  Expiry: {new Date(record.expiryDate).toLocaleDateString('en-GB')}
                </p>
              )}

              {failures.length > 0 && (
                <div className="mb-3 rounded-lg border border-red-500/25 bg-red-500/10 p-3">
                  <p className="text-xs font-semibold text-red-200 mb-2">Failure reasons</p>
                  <div className="space-y-1">
                    {failures.map((failure) => (
                      <p key={failure} className="text-xs text-red-100">{failure}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Defects/advisory items */}
              {classified.length > 0 && (
                <div className="mt-3 space-y-2">
                  {classified.map((defect, idx) => (
                    <div key={idx} className="bg-slate-900/50 border border-white/10 rounded-lg p-3">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-300" />
                        <span className="px-2 py-1 rounded border border-white/10 bg-white/5 text-xs text-slate-200">
                          {defect.category}
                        </span>
                        <span className={`px-2 py-1 rounded border text-xs font-semibold ${severityClass(defect.severity)}`}>
                          {defect.severity}
                        </span>
                        {defect.is_repeated && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-purple-500/30 bg-purple-500/15 text-xs font-semibold text-purple-200">
                            <Repeat2 className="w-3 h-3" />
                            Repeated
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-300">{defect.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {classified.length === 0 && (
                <p className="mt-3 text-sm text-emerald-300">No advisories or failure reasons recorded.</p>
              )}
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}

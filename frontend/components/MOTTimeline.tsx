'use client';

import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { MOTRecord } from '@/lib/api';

interface MOTTimelineProps {
  history: MOTRecord[];
}

export default function MOTTimeline({ history }: MOTTimelineProps) {
  if (!history.length) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-slate-400">
        No MOT history available
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-8">
      <h2 className="text-2xl font-semibold mb-8">MOT History</h2>

      <div className="space-y-4">
        {history.map((record, index) => (
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
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-lg">
                  Test {record.result === 'PASSED' ? 'Passed' : 'Failed'}
                </span>
                <span className="text-sm text-slate-400">
                  {new Date(record.test_date).toLocaleDateString('en-GB')}
                </span>
              </div>

              {record.mileage && (
                <p className="text-sm text-slate-400 mb-3">
                  Mileage: {record.mileage.toLocaleString()} miles
                </p>
              )}

              {/* Defects/advisory items */}
              {record.defects.length > 0 && (
                <div className="mt-3 space-y-2">
                  {record.defects.map((defect, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs bg-orange-500/10 text-orange-300 border border-orange-500/20 rounded p-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{defect}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

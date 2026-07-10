'use client';

import { AlertTriangle, Repeat2, Wrench } from 'lucide-react';
import { VehicleReport } from '@/lib/api';

interface MOTIntelligenceSectionProps {
  report: VehicleReport;
}

export default function MOTIntelligenceSection({ report }: MOTIntelligenceSectionProps) {
  return (
    <section className="mb-12">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-white">MOT Intelligence</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-400" />
            <h3 className="text-xl font-semibold">MOT Risk Summary</h3>
          </div>
          <p className="mb-5 text-sm leading-relaxed text-slate-300">
            {report.mot_intelligence.summary}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
              <p className="mb-1 text-xs text-slate-400">Highest risk category</p>
              <p className="text-2xl font-bold text-white">
                {report.mot_intelligence.highest_risk_category}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
              <p className="mb-1 text-xs text-slate-400">Highest severity</p>
              <p className="text-2xl font-bold text-white">
                {report.mot_intelligence.highest_severity}
              </p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Repeat2 className="h-5 w-5 text-purple-400" />
            <h3 className="text-xl font-semibold">Repeated Issues</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {(report.mot_intelligence.repeated_issues.length
              ? report.mot_intelligence.repeated_issues
              : ['No repeated patterns']
            ).map((issue) => (
              <span
                key={issue}
                className="rounded-lg border border-purple-500/25 bg-purple-500/10 px-3 py-2 text-sm text-purple-100"
              >
                {issue}
              </span>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h3 className="text-xl font-semibold">Maintenance Warnings</h3>
          </div>
          <div className="space-y-2">
            {report.mot_intelligence.maintenance_warnings.map((warning) => (
              <p key={warning} className="text-sm leading-relaxed text-slate-300">
                {warning}
              </p>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 lg:col-span-4">
          <h3 className="mb-4 text-xl font-semibold">Estimated Future Maintenance Concerns</h3>
          <div className="grid gap-3 md:grid-cols-3">
            {report.mot_intelligence.future_concerns.map((concern) => (
              <div
                key={concern}
                className="rounded-xl border border-white/10 bg-slate-900/50 p-4 text-sm leading-relaxed text-slate-300"
              >
                {concern}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

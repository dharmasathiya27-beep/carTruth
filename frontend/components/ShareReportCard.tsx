'use client';

import { useMemo, useState } from 'react';
import { Copy, Download, FileText, Printer, Share2 } from 'lucide-react';
import { VehicleReport } from '@/lib/api';

interface ShareReportCardProps {
  report: VehicleReport;
}

export default function ShareReportCard({ report }: ShareReportCardProps) {
  const [status, setStatus] = useState('');

  const summary = useMemo(() => {
    const vehicle = report.vehicle;
    return [
      `CarTruth report: ${vehicle.registration} - ${vehicle.make} ${vehicle.model}`.trim(),
      `Ownership score: ${report.ownership_score.score}/100`,
      `Risk level: ${report.ownership_score.risk_level}`,
      `Verdict: ${report.ownership_score.verdict}`,
      `Confidence: ${report.confidence_level}`,
    ].join('\n');
  }, [report]);

  const copyText = async (text: string, success: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(success);
    } catch {
      setStatus('Copy failed. Select and copy from the address bar instead.');
    }
  };

  const currentUrl = () => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  };

  return (
    <section className="glass rounded-2xl p-6 no-print">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold">Share Report</h2>
          </div>
          <p className="text-sm text-slate-400">
            Share this report, print it, or prepare a PDF using your browser print dialog.
          </p>
        </div>
        {status && (
          <span className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {status}
          </span>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => copyText(currentUrl(), 'Report link copied')}
          className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800"
        >
          <Copy className="w-4 h-4" />
          Copy report link
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800"
        >
          <Printer className="w-4 h-4" />
          Print report
        </button>

        <button
          onClick={() => {
            setStatus('Use Print report, then choose Save as PDF.');
            window.print();
          }}
          className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800"
        >
          <Download className="w-4 h-4" />
          PDF placeholder
        </button>

        <button
          onClick={() => copyText(summary, 'Summary copied')}
          className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800"
        >
          <FileText className="w-4 h-4" />
          Share summary text
        </button>
      </div>
    </section>
  );
}

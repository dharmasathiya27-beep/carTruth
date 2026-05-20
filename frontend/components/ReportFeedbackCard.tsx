'use client';

import { AlertCircle, CheckCircle2, MessageSquare, Send } from 'lucide-react';
import { useState } from 'react';
import { VehicleReport } from '@/lib/api';

interface ReportFeedbackCardProps {
  report: VehicleReport;
}

const ISSUE_OPTIONS = [
  'Incorrect vehicle data',
  'Missing MOT data',
  'Confusing risk score',
  'UI problem',
  'Other',
];

const USEFULNESS_OPTIONS = ['Yes', 'Somewhat', 'No'];

export default function ReportFeedbackCard({ report }: ReportFeedbackCardProps) {
  const [usefulness, setUsefulness] = useState('');
  const [issueType, setIssueType] = useState('');
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState('');

  const saveFeedback = () => {
    const feedback = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      registration: report.vehicle.registration,
      make: report.vehicle.make,
      model: report.vehicle.model,
      usefulness,
      issueType,
      details: details.trim(),
      score: report.ownership_score.score,
      verdict: report.ownership_score.verdict,
      confidence: report.confidence_level,
    };

    const existing = JSON.parse(localStorage.getItem('cartruth.feedback') || '[]');
    localStorage.setItem('cartruth.feedback', JSON.stringify([feedback, ...existing].slice(0, 50)));

    if (process.env.NODE_ENV === 'development') {
      console.info('CarTruth MVP feedback', feedback);
    }

    setStatus('Thanks. Feedback saved locally for MVP testing.');
    setDetails('');
  };

  const canSubmit = usefulness || issueType || details.trim();

  return (
    <section className="glass rounded-2xl p-6 no-print">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-cyan-400" />
            <h2 className="text-xl font-semibold">Report Feedback</h2>
          </div>
          <p className="text-sm text-slate-400">
            Help improve CarTruth during MVP testing. No login required.
          </p>
        </div>
        {status && (
          <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            {status}
          </span>
        )}
      </div>

      <div className="space-y-5">
        <div>
          <p className="mb-3 text-sm font-semibold text-white">Was this report useful?</p>
          <div className="flex flex-wrap gap-2">
            {USEFULNESS_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setUsefulness(option)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                  usefulness === option
                    ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-100'
                    : 'border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-white">Report issue</p>
          <div className="flex flex-wrap gap-2">
            {ISSUE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setIssueType(option)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                  issueType === option
                    ? 'border-amber-400/50 bg-amber-400/15 text-amber-100'
                    : 'border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-white">
            What was missing or wrong?
          </span>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={4}
            placeholder="Optional notes for the CarTruth team"
            className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="flex max-w-2xl items-start gap-2 text-xs leading-relaxed text-slate-500">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            CarTruth uses official vehicle data where available and provides estimated insights.
            Always inspect a vehicle before purchase.
          </p>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={saveFeedback}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/15 px-5 py-3 text-sm font-semibold text-cyan-100 transition-all hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            Save feedback
          </button>
        </div>
      </div>
    </section>
  );
}

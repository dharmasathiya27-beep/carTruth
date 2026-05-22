'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import VehicleHeroSection from '@/components/VehicleHeroSection';
import VehicleSummary from '@/components/VehicleSummary';
import MOTTimeline from '@/components/MOTTimeline';
import MileageTrend from '@/components/MileageTrend';
import ApiErrorCard from '@/components/ApiErrorCard';
import EmptyStateCard from '@/components/EmptyStateCard';
import PrintFriendlyReportSection from '@/components/PrintFriendlyReportSection';
import PdfSummaryReport from '@/components/PdfSummaryReport';
import ReportFeedbackCard from '@/components/ReportFeedbackCard';
import ReportSkeleton from '@/components/ReportSkeleton';
import ShareReportCard from '@/components/ShareReportCard';
import { searchVehicle, VehicleReport } from '@/lib/api';
import {
  ArrowLeft,
  AlertTriangle,
  BadgeCheck,
  Brain,
  Cloud,
  Gauge,
  PoundSterling,
  Repeat2,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Wrench,
} from 'lucide-react';

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const registration = params.registration as string;

  const [report, setReport] = useState<VehicleReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const decoded = decodeURIComponent(registration);
        const data = await searchVehicle(decoded);
        setReport(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch vehicle report');
      } finally {
        setLoading(false);
      }
    };

    if (registration) {
      fetchReport();
    }
  }, [registration]);

  if (loading) {
    return <ReportSkeleton />;
  }

  const errorTitle = error.toLowerCase().includes('invalid')
    ? 'Invalid Registration'
    : error.toLowerCase().includes('backend')
      ? 'Backend Unavailable'
      : error.toLowerCase().includes('unavailable') || error.toLowerCase().includes('unable')
        ? 'Official Data Unavailable'
        : 'Vehicle Not Found';

  if (error) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-slate-950 px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => router.push('/')}
              className="mb-8 flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors no-print"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to search
            </button>

            <ApiErrorCard
              title={errorTitle}
              message={error}
              actionLabel="Try another registration"
              onAction={() => router.push('/')}
            />
          </div>
        </main>
      </>
    );
  }

  if (!report) {
    return null;
  }

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

  const ratingStyle = (rating: string) => {
    if (['Low', 'Strong', 'Excellent', 'Good'].includes(rating)) {
      return 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10';
    }
    if (['High', 'Caution', 'Poor'].includes(rating)) {
      return 'text-red-300 border-red-500/25 bg-red-500/10';
    }
    return 'text-amber-300 border-amber-500/25 bg-amber-500/10';
  };

  const confidenceReason = {
    High: 'Core DVLA vehicle fields and MOT history are available, so the report can combine official facts with richer CarTruth analysis.',
    Medium:
      'Some official fields are available, but the report may be missing supporting history or secondary data points.',
    Low: 'Important official fields are unavailable, so CarTruth keeps the analysis conservative and marks estimates clearly.',
  }[report.confidence_level];

  const sourcesUsed = [
    report.data_source === 'dvla' ? 'DVLA vehicle data' : 'Development fallback vehicle data',
    report.mot_history.length > 0 ? 'DVSA MOT history' : 'MOT history unavailable',
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-950 px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <PrintFriendlyReportSection report={report} />
          <PdfSummaryReport report={report} />

          {/* Back button */}
          <button
            onClick={() => router.push('/')}
            className="mb-8 flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors no-print"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </button>

          <div id="cartruth-pdf-report" className="rounded-2xl bg-slate-950 p-1 text-white">
            <VehicleHeroSection report={report} />

            <section className="mb-12">
              <div className="grid lg:grid-cols-6 gap-6">
                <div className="glass rounded-2xl p-6 lg:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Gauge className="w-5 h-5 text-blue-400" />
                    <h2 className="text-xl font-semibold">Ownership Score</h2>
                  </div>
                  <p className="text-5xl font-bold text-white mb-2">
                    {report.ownership_score.ownership_score || report.ownership_score.score}
                    <span className="text-lg text-slate-500">/100</span>
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {report.ownership_score.score_explanation}
                  </p>
                </div>

                <div className="glass rounded-2xl p-6 lg:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <PoundSterling className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-xl font-semibold">Running Cost</h2>
                  </div>
                  <p className="text-4xl font-bold text-white mb-2">
                    £
                    {(
                      report.ownership_score.yearly_running_cost ||
                      report.ownership_score.yearly_cost_estimate
                    ).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-400">Estimated annual ownership cost</p>
                </div>

                <div className="glass rounded-2xl p-6 lg:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                    <h2 className="text-xl font-semibold">Vehicle Risk Level</h2>
                  </div>
                  <span
                    className={`inline-flex px-4 py-2 rounded-lg border text-lg font-bold ${ratingStyle(report.ownership_score.risk_level)}`}
                  >
                    {report.ownership_score.risk_level}
                  </span>
                  <p className="text-sm text-slate-400 mt-3">
                    Estimated based on DVLA vehicle data
                  </p>
                </div>

                <div className="glass rounded-2xl p-6 lg:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-xl font-semibold">Reliability Insight</h2>
                  </div>
                  <span
                    className={`inline-flex px-4 py-2 rounded-lg border text-lg font-bold ${ratingStyle(report.ownership_score.reliability_rating)}`}
                  >
                    {report.ownership_score.reliability_rating}
                  </span>
                </div>

                <div className="glass rounded-2xl p-6 lg:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Cloud className="w-5 h-5 text-teal-400" />
                    <h2 className="text-xl font-semibold">Environmental Rating</h2>
                  </div>
                  <span
                    className={`inline-flex px-4 py-2 rounded-lg border text-lg font-bold ${ratingStyle(report.ownership_score.environmental_rating)}`}
                  >
                    {report.ownership_score.environmental_rating}
                  </span>
                </div>

                <div className="glass rounded-2xl p-6 lg:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <h2 className="text-xl font-semibold">AI Summary</h2>
                    {report.ai_report && (
                      <span className="rounded-full border border-purple-500/25 bg-purple-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-purple-200">
                        AI Insights Beta
                      </span>
                    )}
                  </div>
                  {report.ai_report ? (
                    <div className="space-y-4 text-sm text-slate-300">
                      <div>
                        <p className="text-base font-bold text-white">
                          {report.ai_report.headline}
                        </p>
                        <p className="mt-2 leading-relaxed">{report.ai_report.summary}</p>
                      </div>
                      <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-purple-200">
                          Buy verdict
                        </p>
                        <p className="mt-1 font-semibold text-white">
                          {report.ai_report.buyVerdict}
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Top risks
                          </p>
                          <div className="space-y-1">
                            {(report.ai_report.topRisks.length
                              ? report.ai_report.topRisks
                              : ['No major AI-highlighted risks']
                            ).map((risk) => (
                              <p key={risk} className="leading-relaxed">
                                {risk}
                              </p>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Positive signs
                          </p>
                          <div className="space-y-1">
                            {(report.ai_report.positiveSigns.length
                              ? report.ai_report.positiveSigns
                              : ['No additional AI-highlighted positives']
                            ).map((sign) => (
                              <p key={sign} className="leading-relaxed">
                                {sign}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="leading-relaxed">{report.ai_report.ownershipAdvice}</p>
                      <p className="text-xs leading-relaxed text-slate-400">
                        {report.ai_report.confidenceNote}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-slate-300">
                      {report.ownership_score.ai_summary}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="grid lg:grid-cols-3 gap-6 mb-12">
              <div className="glass rounded-2xl p-6 lg:col-span-2">
                <div className="flex items-center gap-2 mb-5">
                  <Gauge className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xl font-semibold">Risk Signals</h2>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {riskSignals.map((signal) => (
                    <div
                      key={signal.label}
                      className={`rounded-xl border p-4 ${
                        signal.active
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-emerald-500/10 border-emerald-500/25'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {signal.active ? (
                          <AlertTriangle className="w-4 h-4 text-amber-300" />
                        ) : (
                          <BadgeCheck className="w-4 h-4 text-emerald-300" />
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

              <div className="glass rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-5">Report Badges</h2>
                <div className="flex flex-wrap gap-2">
                  {(report.ownership_score.risk_badges.length
                    ? report.ownership_score.risk_badges
                    : ['Clean visible risk profile']
                  ).map((badge) => (
                    <span
                      key={badge}
                      className="px-3 py-2 rounded-lg border border-white/10 bg-slate-900/60 text-sm text-slate-200"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
                {report.ownership_score.analysis_notes.length > 0 && (
                  <div className="mt-5 space-y-2">
                    {report.ownership_score.analysis_notes.map((note) => (
                      <p key={note} className="text-sm text-slate-400 leading-relaxed">
                        {note}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="grid lg:grid-cols-4 gap-6 mb-12">
              <div className="glass rounded-2xl p-6 lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <Wrench className="w-5 h-5 text-orange-400" />
                  <h2 className="text-xl font-semibold">MOT Intelligence</h2>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-5">
                  {report.mot_intelligence.summary}
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                    <p className="text-xs text-slate-400 mb-1">Highest risk category</p>
                    <p className="text-2xl font-bold text-white">
                      {report.mot_intelligence.highest_risk_category}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                    <p className="text-xs text-slate-400 mb-1">Highest severity</p>
                    <p className="text-2xl font-bold text-white">
                      {report.mot_intelligence.highest_severity}
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Repeat2 className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-semibold">Repeated Issues</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(report.mot_intelligence.repeated_issues.length
                    ? report.mot_intelligence.repeated_issues
                    : ['No repeated patterns']
                  ).map((issue) => (
                    <span
                      key={issue}
                      className="px-3 py-2 rounded-lg border border-purple-500/25 bg-purple-500/10 text-sm text-purple-100"
                    >
                      {issue}
                    </span>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h2 className="text-xl font-semibold">Maintenance Warnings</h2>
                </div>
                <div className="space-y-2">
                  {report.mot_intelligence.maintenance_warnings.map((warning) => (
                    <p key={warning} className="text-sm text-slate-300 leading-relaxed">
                      {warning}
                    </p>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-6 lg:col-span-4">
                <h2 className="text-xl font-semibold mb-4">
                  Estimated Future Maintenance Concerns
                </h2>
                <div className="grid md:grid-cols-3 gap-3">
                  {report.mot_intelligence.future_concerns.map((concern) => (
                    <div
                      key={concern}
                      className="rounded-xl border border-white/10 bg-slate-900/50 p-4 text-sm text-slate-300 leading-relaxed"
                    >
                      {concern}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* MOT History and Mileage Trend */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <MOTTimeline history={report.mot_history} />
              <MileageTrend
                history={report.mileage_history}
                motHistory={report.mot_history}
                vehicleYear={report.vehicle.year}
              />
            </div>

            <section className="grid lg:grid-cols-2 gap-6 mb-12">
              <div className="space-y-6">
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Brain className="w-5 h-5 text-blue-400" />
                    <h2 className="text-xl font-semibold">Trust & Data Confidence</h2>
                  </div>
                  <div className="mb-5 flex flex-wrap gap-2">
                    <span className="rounded-lg border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-200">
                      {report.confidence_level} confidence
                    </span>
                    <span className="rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-slate-300">
                      Source: {report.data_source}
                    </span>
                  </div>
                  <p className="mb-5 text-sm leading-relaxed text-slate-300">{confidenceReason}</p>
                  <div className="grid gap-3">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Data sources used
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sourcesUsed.map((source) => (
                          <span
                            key={source}
                            className="rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-xs text-slate-300"
                          >
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Missing or unavailable data
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(report.unavailable_data?.length
                          ? report.unavailable_data
                          : ['No missing data flagged']
                        ).map((item) => (
                          <span
                            key={item}
                            className="rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-xs text-slate-300"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-2xl p-6">
                  <h2 className="text-xl font-semibold mb-5">Factors affecting this vehicle</h2>
                  {report.ownership_score.affecting_factors.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-2">
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

              <VehicleSummary
                vehicle={report.vehicle}
                motStatus={report.current_mot_status}
                motValidUntil={report.mot_valid_until}
              />
            </section>

            <section className="mb-12 rounded-2xl border border-white/10 bg-slate-900/50 p-6">
              <p className="text-sm leading-relaxed text-slate-300">
                Data provided by DVLA and DVSA where configured. CarTruth insights are estimates,
                not mechanical inspections.
              </p>
            </section>
          </div>

          <section className="mb-12 no-print">
            <ShareReportCard report={report} pdfTargetId="cartruth-pdf-summary" />
          </section>

          <section className="mb-12">
            <ReportFeedbackCard report={report} />
          </section>

          {/* Footer */}
          <div className="text-center py-12 border-t border-white/10 no-print">
            <p className="text-slate-500 text-sm mb-4">
              Data provided by DVLA and DVSA where configured. CarTruth insights are estimates, not
              mechanical inspections.
            </p>
            {report.warnings.length > 0 && (
              <div className="max-w-2xl mx-auto mb-5 space-y-2">
                {report.warnings.map((warning) => (
                  <p key={warning} className="text-sm text-amber-300">
                    {warning}
                  </p>
                ))}
              </div>
            )}
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-lg text-blue-400 font-semibold transition-all"
            >
              Check another vehicle
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

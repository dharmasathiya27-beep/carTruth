'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ScoreDisplay from '@/components/ScoreDisplay';
import VehicleHeroSection from '@/components/VehicleHeroSection';
import VehicleSummary from '@/components/VehicleSummary';
import MOTTimeline from '@/components/MOTTimeline';
import MileageTrend from '@/components/MileageTrend';
import ApiErrorCard from '@/components/ApiErrorCard';
import ConfidenceBadge from '@/components/ConfidenceBadge';
import DataSourceBadge from '@/components/DataSourceBadge';
import EmptyStateCard from '@/components/EmptyStateCard';
import PrintFriendlyReportSection from '@/components/PrintFriendlyReportSection';
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

  const verdictStyle = {
    BUY: 'bg-green-500/15 text-green-300 border-green-500/30',
    INSPECT: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    AVOID: 'bg-red-500/15 text-red-300 border-red-500/30',
  }[report.ownership_score.verdict];

  const ratingStyle = (rating: string) => {
    if (['Low', 'Strong', 'Excellent', 'Good'].includes(rating)) {
      return 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10';
    }
    if (['High', 'Caution', 'Poor'].includes(rating)) {
      return 'text-red-300 border-red-500/25 bg-red-500/10';
    }
    return 'text-amber-300 border-amber-500/25 bg-amber-500/10';
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-950 px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <PrintFriendlyReportSection report={report} />

          {/* Back button */}
          <button
            onClick={() => router.push('/')}
            className="mb-8 flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors no-print"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </button>

          <VehicleHeroSection report={report} />

          {/* Main intelligence section */}
          <div className="mb-12">
            <div className="glass rounded-2xl p-12">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <ScoreDisplay score={report.ownership_score.score} />
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                    <h2 className="text-3xl font-bold text-white">Ownership Score</h2>
                    <span
                      className={`px-3 py-1 rounded-lg border text-sm font-bold ${verdictStyle}`}
                    >
                      {report.ownership_score.verdict}
                    </span>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-sm font-semibold text-blue-400 mb-2">RECOMMENDATION</h3>
                      <p className="text-white leading-relaxed">
                        {report.ownership_score.should_buy_recommendation}
                      </p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                          <ShieldAlert className="w-4 h-4" />
                          Maintenance Risk
                        </div>
                        <p className="text-2xl font-bold">
                          {report.ownership_score.maintenance_risk}
                        </p>
                      </div>
                      <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                          <PoundSterling className="w-4 h-4" />
                          Yearly Running Cost
                        </div>
                        <p className="text-2xl font-bold">
                          £{report.ownership_score.yearly_cost_estimate.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                <p className="text-sm text-slate-400 mt-3">Estimated based on DVLA vehicle data</p>
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
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {report.ownership_score.ai_summary}
                </p>
              </div>
            </div>
            <div className="mt-6">
              <ReportFeedbackCard report={report} />
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
              <h2 className="text-xl font-semibold mb-4">Estimated Future Maintenance Concerns</h2>
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
                  <h2 className="text-xl font-semibold">Confidence Explanation</h2>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  {report.ownership_score.score_explanation}
                </p>
                <p className="text-xs text-slate-500">{report.ownership_score.data_basis}</p>
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

          <section className="mb-12 no-print">
            <div className="grid lg:grid-cols-2 gap-6">
              <ShareReportCard report={report} />

              <div className="glass rounded-2xl p-6">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <DataSourceBadge source={report.data_source} />
                  <ConfidenceBadge level={report.confidence_level} />
                </div>
                <div className="grid gap-3">
                  {(report.trust_messages?.length
                    ? report.trust_messages
                    : ['Estimate based on available vehicle data']
                  ).map((message) => (
                    <div
                      key={message}
                      className="rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-slate-300"
                    >
                      {message}
                    </div>
                  ))}
                </div>
                {report.unavailable_data?.length > 0 && (
                  <div className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/10 p-4">
                    <p className="text-sm font-semibold text-amber-200 mb-2">
                      Some fields may be unavailable from official sources
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {report.unavailable_data.map((item) => (
                        <span
                          key={item}
                          className="px-2 py-1 rounded border border-amber-500/20 bg-slate-950/30 text-xs text-amber-100"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center py-12 border-t border-white/10 no-print">
            <p className="text-slate-500 text-sm mb-4">
              Data source: {report.data_source}. DVLA vehicle data and DVSA MOT history are used
              when configured, with development fallback data when official sources are unavailable.
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

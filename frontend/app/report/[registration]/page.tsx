'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ScoreDisplay from '@/components/ScoreDisplay';
import VehicleSummary from '@/components/VehicleSummary';
import MOTTimeline from '@/components/MOTTimeline';
import MileageTrend from '@/components/MileageTrend';
import { searchVehicle, VehicleReport } from '@/lib/api';
import {
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  Gauge,
  Loader,
  PoundSterling,
  ShieldAlert,
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
    return (
      <>
        <Header />
        <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
          <div className="text-center">
            <Loader className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-xl text-slate-300 mb-2">Analyzing vehicle...</p>
            <p className="text-sm text-slate-500">Checking MOT history, mileage trends, and generating ownership score</p>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-slate-950 px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => router.push('/')}
              className="mb-8 flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to search
            </button>

            <div className="glass rounded-2xl p-12 text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">
                {error.toLowerCase().includes('invalid') ? 'Invalid Registration' : 'Vehicle Not Found'}
              </h1>
              <p className="text-slate-400 mb-6">{error}</p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all"
              >
                Try another registration
              </button>
            </div>
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

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-950 px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => router.push('/')}
            className="mb-8 flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </button>

          {/* Score Section - Full width featured */}
          <div className="mb-12">
            <div className="glass rounded-2xl p-12">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <ScoreDisplay score={report.ownership_score.score} />
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                    <h2 className="text-3xl font-bold text-white">
                      Ownership Score
                    </h2>
                    <span className={`px-3 py-1 rounded-lg border text-sm font-bold ${verdictStyle}`}>
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
                        <p className="text-2xl font-bold">{report.ownership_score.maintenance_risk}</p>
                      </div>
                      <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                          <PoundSterling className="w-4 h-4" />
                          Yearly Running Cost
                        </div>
                        <p className="text-2xl font-bold">£{report.ownership_score.yearly_cost_estimate.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Summary */}
          <section className="mb-12">
            <VehicleSummary
              vehicle={report.vehicle}
              motStatus={report.current_mot_status}
              motValidUntil={report.mot_valid_until}
              score={report.ownership_score}
            />
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

          {/* MOT History and Mileage Trend */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <MOTTimeline history={report.mot_history} />
            <MileageTrend history={report.mileage_history} />
          </div>

          {/* Footer */}
          <div className="text-center py-12 border-t border-white/10">
            <p className="text-slate-500 text-sm mb-4">
              Data source: {report.data_source}. Official DVLA and DVSA integrations are prepared and will be used when API keys are configured.
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

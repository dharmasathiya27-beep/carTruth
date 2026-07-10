'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import VehicleHeroSection from '@/components/VehicleHeroSection';
import VehicleSummary from '@/components/VehicleSummary';
import MOTTimeline from '@/components/MOTTimeline';
import MileageTrend from '@/components/MileageTrend';
import ApiErrorCard from '@/components/ApiErrorCard';
import PrintFriendlyReportSection from '@/components/PrintFriendlyReportSection';
import PdfSummaryReport from '@/components/PdfSummaryReport';
import ReportSkeleton from '@/components/ReportSkeleton';
import AIInsightsSection from '@/components/AIInsightsSection';
import MOTIntelligenceSection from '@/components/MOTIntelligenceSection';
import OwnershipIntelligenceSection from '@/components/OwnershipIntelligenceSection';
import ShareFeedbackSection from '@/components/ShareFeedbackSection';
import VehicleSpecificationPreview from '@/components/VehicleSpecificationPreview';
import { searchVehicle, VehicleReport } from '@/lib/api';
import { ArrowLeft, Brain } from 'lucide-react';

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
        // The dynamic route stores the plate in the URL; the API layer handles
        // final normalisation before sending it to FastAPI.
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

            <OwnershipIntelligenceSection report={report} />
            <MOTIntelligenceSection report={report} />

            {/* MOT History and Mileage Trend */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <MOTTimeline history={report.mot_history} />
              <MileageTrend
                history={report.mileage_history}
                motHistory={report.mot_history}
                vehicleYear={report.vehicle.year}
              />
            </div>

            <section className="grid gap-6 lg:grid-cols-2 mb-12">
              <VehicleSummary
                vehicle={report.vehicle}
                motStatus={report.current_mot_status}
                motValidUntil={report.mot_valid_until}
              />
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
            </section>

            <VehicleSpecificationPreview specs={report.vehicle_specifications} />
            <AIInsightsSection report={report} />

            <section className="mb-12 rounded-2xl border border-white/10 bg-slate-900/50 p-6">
              <p className="text-sm leading-relaxed text-slate-300">
                Data provided by DVLA and DVSA where configured. CarTruth insights are estimates,
                not mechanical inspections.
              </p>
            </section>
          </div>

          <ShareFeedbackSection report={report} />

          {/* Footer */}
          <div className="text-center py-12 border-t border-white/10 no-print">
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

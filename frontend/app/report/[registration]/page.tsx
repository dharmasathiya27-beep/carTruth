'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ScoreDisplay from '@/components/ScoreDisplay';
import VehicleSummary from '@/components/VehicleSummary';
import MOTTimeline from '@/components/MOTTimeline';
import MileageTrend from '@/components/MileageTrend';
import { searchVehicle, VehicleReport } from '@/lib/api';
import { ArrowLeft, AlertCircle, Loader } from 'lucide-react';

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
              <h1 className="text-2xl font-bold text-white mb-2">Vehicle Not Found</h1>
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
                  <h2 className="text-3xl font-bold text-white mb-6">
                    Ownership Score
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-blue-400 mb-2">RECOMMENDATION</h3>
                      <p className="text-white leading-relaxed">
                        {report.ownership_score.should_buy_recommendation}
                      </p>
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

          {/* MOT History and Mileage Trend */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <MOTTimeline history={report.mot_history} />
            <MileageTrend history={report.mileage_history} />
          </div>

          {/* Footer */}
          <div className="text-center py-12 border-t border-white/10">
            <p className="text-slate-500 text-sm mb-4">
              This report is based on mock data for demonstration. In production, data will come from official DVLA and DVSA records.
            </p>
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

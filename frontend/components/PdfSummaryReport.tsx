'use client';

import { MOTRecord, VehicleReport } from '@/lib/api';

interface PdfSummaryReportProps {
  report: VehicleReport;
}

function normaliseResult(result = '') {
  return result.toUpperCase().includes('PASS') ? 'PASSED' : 'FAILED';
}

function formatMileage(value?: number) {
  return value ? `${value.toLocaleString()} miles` : 'N/A';
}

function issueText(record: MOTRecord) {
  return [
    ...(record.failures || []),
    ...(record.dangerousDefects || []),
    ...(record.majorDefects || []),
    ...(record.advisories || []),
    ...(record.minorDefects || []),
    ...(record.defects || []),
    ...(record.classified_defects || []).map((item) => item.text),
  ].join(' ');
}

function issueCategory(text: string) {
  const lower = text.toLowerCase();
  if (lower.match(/tyre|tread|sidewall|wheel/)) return 'Tyres';
  if (lower.match(/brake|braking|disc|pad|handbrake/)) return 'Brakes';
  if (lower.match(/suspension|shock|spring|strut|bush|ball joint/)) return 'Suspension';
  if (lower.match(/corrosion|corroded|rust/)) return 'Corrosion';
  if (lower.match(/lamp|light|indicator|electrical|wiring/)) return 'Lights/Electrical';
  if (lower.match(/emission|exhaust|smoke|lambda|catalyst/)) return 'Emissions';
  if (lower.match(/steering|track rod|rack|column/)) return 'Steering';
  return text.trim() ? 'Other' : 'No issue category recorded';
}

function motSummary(history: MOTRecord[]) {
  const sorted = [...history].sort(
    (a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime(),
  );
  const latest = sorted[0];
  const passCount = sorted.filter((record) => normaliseResult(record.result) === 'PASSED').length;
  const categoryCounts = sorted.reduce(
    (counts, record) => {
      const category = issueCategory(issueText(record));
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    },
    {} as Record<string, number>,
  );
  const topRisks = Object.entries(categoryCounts)
    .filter(([category]) => category !== 'No issue category recorded')
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category, count]) => `${category} (${count})`);

  return {
    total: sorted.length,
    passRate: sorted.length ? Math.round((passCount / sorted.length) * 100) : 0,
    latestResult: latest ? normaliseResult(latest.result) : 'N/A',
    latestMileage: latest ? formatMileage(latest.mileage) : 'N/A',
    topRisks: topRisks.length ? topRisks : ['No recurring MOT risks detected'],
  };
}

function mileageSummary(report: VehicleReport) {
  const history = [...(report.mileage_history || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  if (!history.length) {
    return 'Mileage history unavailable.';
  }

  const first = history[0];
  const latest = history[history.length - 1];
  const total = latest.mileage - first.mileage;

  return `Latest mileage is ${formatMileage(latest.mileage)}. Recorded mileage changed by ${total.toLocaleString()} miles across ${history.length} readings.`;
}

export default function PdfSummaryReport({ report }: PdfSummaryReportProps) {
  const vehicle = report.vehicle;
  const mot = motSummary(report.mot_history);

  return (
    <section
      id="cartruth-pdf-summary"
      aria-hidden="true"
      className="fixed left-0 top-0 -z-10 w-[760px] bg-white p-8 text-slate-950"
    >
      <div className="mb-6 border-b border-slate-200 pb-5">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-700">CarTruth</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Vehicle Report Summary</h1>
        <p className="mt-2 text-sm text-slate-500">
          Representative report generated from available vehicle and MOT data.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Registration
          </p>
          <p className="mt-1 text-2xl font-black">{vehicle.registration || 'N/A'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vehicle</p>
          <p className="mt-1 text-xl font-bold">
            {vehicle.make || 'Unknown Make'} {vehicle.model || ''}
          </p>
          <p className="text-sm text-slate-500">{vehicle.year || 'Year unavailable'}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Ownership Score
          </p>
          <p className="mt-1 text-3xl font-black">{report.ownership_score.score}/100</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verdict</p>
          <p className="mt-2 text-xl font-black">{report.ownership_score.verdict}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confidence</p>
          <p className="mt-2 text-xl font-black">{report.confidence_level}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 p-4">
        <h2 className="text-lg font-black">MOT Overview</h2>
        <div className="mt-3 grid grid-cols-4 gap-3 text-sm">
          <p>
            <span className="block text-slate-500">Tests</span>
            <strong>{mot.total}</strong>
          </p>
          <p>
            <span className="block text-slate-500">Pass rate</span>
            <strong>{mot.passRate}%</strong>
          </p>
          <p>
            <span className="block text-slate-500">Latest result</span>
            <strong>{mot.latestResult}</strong>
          </p>
          <p>
            <span className="block text-slate-500">Latest mileage</span>
            <strong>{mot.latestMileage}</strong>
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 p-4">
        <h2 className="text-lg font-black">Top MOT Risks</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {mot.topRisks.map((risk) => (
            <span
              key={risk}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            >
              {risk}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 p-4">
        <h2 className="text-lg font-black">Mileage Summary</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">{mileageSummary(report)}</p>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 p-4">
        <h2 className="text-lg font-black">Confidence Note</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          Source: {report.data_source}. Confidence is {report.confidence_level.toLowerCase()} based
          on the available official data and missing-data indicators.
        </p>
      </div>

      <p className="border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500">
        Data provided by DVLA and DVSA where configured. CarTruth insights are estimates, not
        mechanical inspections.
      </p>
    </section>
  );
}

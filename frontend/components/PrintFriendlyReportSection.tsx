'use client';

import { VehicleReport } from '@/lib/api';

interface PrintFriendlyReportSectionProps {
  report: VehicleReport;
}

export default function PrintFriendlyReportSection({ report }: PrintFriendlyReportSectionProps) {
  const vehicle = report.vehicle;

  return (
    <section className="print-summary hidden print:block">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">CarTruth Vehicle Report</h1>
        <p>{vehicle.registration} - {vehicle.make} {vehicle.model}</p>
      </div>

      <div className="print-grid">
        <div>
          <h2>Vehicle Summary</h2>
          <p>Year: {vehicle.year || 'N/A'}</p>
          <p>Fuel: {vehicle.fuel_type || 'N/A'}</p>
          <p>Engine: {vehicle.engine_capacity_cc ? `${vehicle.engine_capacity_cc} cc` : vehicle.engine_size ? `${vehicle.engine_size}L` : 'N/A'}</p>
          <p>Colour: {vehicle.colour || 'N/A'}</p>
          <p>Tax: {vehicle.tax_status || 'N/A'}</p>
        </div>

        <div>
          <h2>Risk Score</h2>
          <p>Ownership score: {report.ownership_score.score}/100</p>
          <p>Risk level: {report.ownership_score.risk_level}</p>
          <p>Verdict: {report.ownership_score.verdict}</p>
          <p>Running cost: £{report.ownership_score.yearly_cost_estimate.toLocaleString()}</p>
        </div>

        <div>
          <h2>MOT Intelligence</h2>
          <p>{report.mot_intelligence.summary}</p>
          <p>Highest risk: {report.mot_intelligence.highest_risk_category}</p>
          <p>Highest severity: {report.mot_intelligence.highest_severity}</p>
        </div>

        <div>
          <h2>Data Source Notes</h2>
          <p>Data source: {report.data_source}</p>
          <p>Confidence: {report.confidence_level}</p>
          <p>{report.ownership_score.data_basis}</p>
        </div>
      </div>
    </section>
  );
}

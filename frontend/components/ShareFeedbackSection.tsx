'use client';

import ReportFeedbackCard from '@/components/ReportFeedbackCard';
import ShareReportCard from '@/components/ShareReportCard';
import { VehicleReport } from '@/lib/api';

interface ShareFeedbackSectionProps {
  report: VehicleReport;
}

export default function ShareFeedbackSection({ report }: ShareFeedbackSectionProps) {
  return (
    <section className="mb-12 space-y-6">
      <div className="no-print">
        <h2 className="text-2xl font-semibold text-white">Share & Feedback</h2>
      </div>
      <div className="no-print">
        <ShareReportCard report={report} pdfTargetId="cartruth-pdf-summary" />
      </div>
      <ReportFeedbackCard report={report} />
    </section>
  );
}

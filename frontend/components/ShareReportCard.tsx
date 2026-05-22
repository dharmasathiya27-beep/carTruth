'use client';

import { useMemo, useState } from 'react';
import { Copy, Download, FileText, Printer, Share2 } from 'lucide-react';
import { VehicleReport } from '@/lib/api';

interface ShareReportCardProps {
  report: VehicleReport;
  pdfTargetId: string;
}

const PDF_TIMEOUT_MS = 30000;

function withTimeout<T>(work: Promise<T>, timeoutMessage: string): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(timeoutMessage)), PDF_TIMEOUT_MS);
    }),
  ]);
}

export default function ShareReportCard({ report, pdfTargetId }: ShareReportCardProps) {
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
  const [copyingAction, setCopyingAction] = useState<'link' | 'summary' | ''>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const currentUrl = () => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  };

  const summary = useMemo(() => {
    const vehicle = report.vehicle;
    return [
      `CarTruth report: ${vehicle.registration}`,
      `Vehicle: ${[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ')}`,
      `Ownership score: ${report.ownership_score.score}/100`,
      `Verdict: ${report.ownership_score.verdict}`,
      `MOT status: ${report.current_mot_status || 'Unknown'}`,
      `Main risk summary: ${report.ownership_score.ai_summary || report.ownership_score.score_explanation}`,
      `Link: ${currentUrl()}`,
    ].join('\n');
  }, [report]);

  const showStatus = (message: string, type: 'success' | 'error' = 'success') => {
    setStatus(message);
    setStatusType(type);
  };

  const copyText = async (text: string, success: string, action: 'link' | 'summary') => {
    setCopyingAction(action);
    setStatus('');
    setStatusType('');

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(text);
      showStatus(success);
    } catch (error) {
      console.error('CarTruth share copy failed', error);
      showStatus('Unable to copy', 'error');
    } finally {
      setCopyingAction('');
    }
  };

  const printReport = () => {
    window.print();
  };

  const fileSafeRegistration = (report.vehicle.registration || 'report').replace(
    /[^a-z0-9-]/gi,
    '',
  );

  const downloadPdf = async () => {
    setIsGeneratingPdf(true);
    setStatus('');
    setStatusType('');
    let timerStarted = false;

    try {
      console.time('pdf-generation');
      timerStarted = true;

      const target = document.getElementById(pdfTargetId);
      if (!target) {
        showStatus('Unable to generate PDF right now. Please try Print report instead.', 'error');
        return;
      }

      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await withTimeout(
        html2canvas(target, {
          scale: 1.5,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          ignoreElements: (element) => {
            const computed = window.getComputedStyle(element);
            return (
              element.classList.contains('no-print') ||
              computed.display === 'none' ||
              computed.visibility === 'hidden'
            );
          },
          onclone: (clonedDocument) => {
            const clonedTarget = clonedDocument.getElementById(pdfTargetId);
            if (clonedTarget) {
              clonedTarget.style.background = '#ffffff';
              clonedTarget.style.color = '#111827';
              clonedTarget.querySelectorAll<HTMLElement>('*').forEach((element) => {
                element.style.animation = 'none';
                element.style.transition = 'none';
              });
            }
          },
        }),
        'PDF capture timed out.',
      );

      const imageData = canvas.toDataURL('image/jpeg', 0.85);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageWidth = pageWidth;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;

      let remainingHeight = imageHeight;
      let yPosition = 0;

      pdf.addImage(imageData, 'JPEG', 0, yPosition, imageWidth, imageHeight);
      remainingHeight -= pageHeight;

      while (remainingHeight > 0) {
        yPosition -= pageHeight;
        pdf.addPage();
        pdf.addImage(imageData, 'JPEG', 0, yPosition, imageWidth, imageHeight);
        remainingHeight -= pageHeight;
      }

      pdf.save(`CarTruth-${fileSafeRegistration || 'report'}.pdf`);
      showStatus('PDF downloaded');
    } catch (error) {
      console.error('CarTruth PDF generation failed', error);
      showStatus('Unable to generate PDF right now. Please try Print report instead.', 'error');
    } finally {
      if (timerStarted) {
        console.timeEnd('pdf-generation');
      }
      setIsGeneratingPdf(false);
    }
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
            Share this report, print it, or download a PDF copy.
          </p>
        </div>
        {status && (
          <span
            role="status"
            className={`rounded-lg border px-3 py-2 text-sm ${
              statusType === 'error'
                ? 'border-red-500/25 bg-red-500/10 text-red-200'
                : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
            }`}
          >
            {status}
          </span>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          aria-label="Copy current report link"
          disabled={Boolean(copyingAction)}
          onClick={() => copyText(currentUrl(), 'Report link copied', 'link')}
          className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800"
        >
          <Copy className="w-4 h-4" />
          {copyingAction === 'link' ? 'Copying...' : 'Copy report link'}
        </button>

        <button
          type="button"
          aria-label="Print report"
          onClick={printReport}
          className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800"
        >
          <Printer className="w-4 h-4" />
          Print report
        </button>

        <button
          type="button"
          aria-label="Download report as PDF"
          disabled={isGeneratingPdf}
          onClick={downloadPdf}
          className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800"
        >
          <Download className="w-4 h-4" />
          {isGeneratingPdf ? 'Preparing lightweight PDF...' : 'Download PDF'}
        </button>

        <button
          type="button"
          aria-label="Copy report summary text"
          disabled={Boolean(copyingAction)}
          onClick={() => copyText(summary, 'Summary copied', 'summary')}
          className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800"
        >
          <FileText className="w-4 h-4" />
          {copyingAction === 'summary' ? 'Copying...' : 'Share summary text'}
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        PDF includes the vehicle summary, ownership score, MOT intelligence, mileage trend,
        confidence notes, and disclaimer.
      </p>
    </section>
  );
}

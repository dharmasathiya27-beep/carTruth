'use client';

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Gauge,
  Layers3,
  Repeat2,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { MOTAdvisory, MOTRecord } from '@/lib/api';
import EmptyStateCard from '@/components/EmptyStateCard';

interface MOTTimelineProps {
  history: MOTRecord[];
}

type MotIssueCategory =
  | 'Tyres'
  | 'Brakes'
  | 'Suspension'
  | 'Corrosion'
  | 'Lights/Electrical'
  | 'Emissions'
  | 'Steering'
  | 'Other';

interface NormalisedIssue extends MOTAdvisory {
  groupedCategory: MotIssueCategory;
  source: 'failure' | 'advisory' | 'defect';
}

const ISSUE_CATEGORIES: MotIssueCategory[] = [
  'Tyres',
  'Brakes',
  'Suspension',
  'Corrosion',
  'Lights/Electrical',
  'Emissions',
  'Steering',
  'Other',
];

const CATEGORY_KEYWORDS: Record<MotIssueCategory, string[]> = {
  Tyres: ['tyre', 'tread', 'sidewall', 'wheel'],
  Brakes: ['brake', 'braking', 'disc', 'pad', 'parking brake', 'handbrake'],
  Suspension: ['suspension', 'shock', 'spring', 'strut', 'arm', 'bush', 'ball joint'],
  Corrosion: ['corrosion', 'corroded', 'rust', 'structural'],
  'Lights/Electrical': [
    'lamp',
    'light',
    'headlamp',
    'indicator',
    'electrical',
    'battery',
    'wiring',
    'registration plate lamp',
  ],
  Emissions: ['emission', 'exhaust', 'smoke', 'lambda', 'catalyst'],
  Steering: ['steering', 'track rod', 'rack', 'column'],
  Other: [],
};

function normaliseResult(result: string) {
  return result.toUpperCase().includes('PASS') ? 'PASSED' : 'FAILED';
}

function formatDate(value?: string) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB');
}

function groupCategory(category = '', text = ''): MotIssueCategory {
  const combined = `${category} ${text}`.toLowerCase();
  const matched = ISSUE_CATEGORIES.find((item) =>
    CATEGORY_KEYWORDS[item].some((keyword) => combined.includes(keyword)),
  );

  if (matched) return matched;

  const titleCategory = category.trim();
  if (ISSUE_CATEGORIES.includes(titleCategory as MotIssueCategory)) {
    return titleCategory as MotIssueCategory;
  }

  return 'Other';
}

function severityFromSource(
  source: NormalisedIssue['source'],
  result: string,
): MOTAdvisory['severity'] {
  if (source === 'failure') return 'High';
  return normaliseResult(result) === 'FAILED' ? 'High' : 'Low';
}

function normaliseIssues(record: MOTRecord): NormalisedIssue[] {
  const classified = (record.classified_defects || []).map((issue) => ({
    ...issue,
    groupedCategory: groupCategory(issue.category, issue.text),
    source: issue.severity === 'High' || issue.severity === 'Critical' ? 'failure' : 'advisory',
  })) as NormalisedIssue[];

  const fallbackFailures = [
    ...(record.failures || []),
    ...(record.dangerousDefects || []),
    ...(record.majorDefects || []),
  ].map((text) => ({
    text,
    category: groupCategory('', text),
    groupedCategory: groupCategory('', text),
    severity: 'High' as const,
    is_repeated: false,
    source: 'failure' as const,
  }));

  const fallbackAdvisories = [...(record.advisories || []), ...(record.minorDefects || [])].map(
    (text) => ({
      text,
      category: groupCategory('', text),
      groupedCategory: groupCategory('', text),
      severity: 'Low' as const,
      is_repeated: false,
      source: 'advisory' as const,
    }),
  );

  const fallbackDefects = (record.defects || []).map((text) => {
    const source: NormalisedIssue['source'] =
      normaliseResult(record.result) === 'FAILED' ? 'failure' : 'defect';
    return {
      text,
      category: groupCategory('', text),
      groupedCategory: groupCategory('', text),
      severity: severityFromSource(source, record.result),
      is_repeated: false,
      source,
    };
  });

  const seen = new Set<string>();
  return [...classified, ...fallbackFailures, ...fallbackAdvisories, ...fallbackDefects].filter(
    (issue) => {
      const key = `${issue.source}-${issue.text}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    },
  );
}

function categoryCounts(issues: NormalisedIssue[]) {
  return issues.reduce(
    (counts, issue) => {
      counts[issue.groupedCategory] = (counts[issue.groupedCategory] || 0) + 1;
      return counts;
    },
    {} as Record<MotIssueCategory, number>,
  );
}

function highestRiskCategory(records: MOTRecord[]) {
  const counts = records.reduce(
    (allCounts, record) => {
      normaliseIssues(record).forEach((issue) => {
        allCounts[issue.groupedCategory] = (allCounts[issue.groupedCategory] || 0) + 1;
      });
      return allCounts;
    },
    {} as Record<MotIssueCategory, number>,
  );

  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'No issues recorded';
}

function recurringCategory(records: MOTRecord[]) {
  const yearsByCategory = records.reduce(
    (map, record) => {
      const year = new Date(record.test_date).getFullYear();
      normaliseIssues(record).forEach((issue) => {
        if (!map[issue.groupedCategory]) map[issue.groupedCategory] = new Set<number>();
        map[issue.groupedCategory].add(year);
      });
      return map;
    },
    {} as Record<MotIssueCategory, Set<number>>,
  );

  return (
    Object.entries(yearsByCategory).find(([, years]) => years.size > 1)?.[0] ||
    'No recurring issue detected'
  );
}

function explainMot(record: MOTRecord, issues: NormalisedIssue[], recurring: string) {
  const result = normaliseResult(record.result);
  const counts = categoryCounts(issues);
  const topCategory = Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0];
  const hasFailure = result === 'FAILED';
  const hasIssues = issues.length > 0;

  if (!hasIssues && result === 'PASSED') {
    return 'This MOT passed cleanly with no major concerns.';
  }

  if (hasFailure && topCategory === 'Brakes') {
    return 'This MOT failed due to braking issues, which should be treated as a safety-related concern.';
  }

  if (
    recurring === 'Suspension' ||
    issues.some((issue) => issue.groupedCategory === 'Suspension' && issue.is_repeated)
  ) {
    return 'Repeated suspension advisories suggest ongoing wear that may require inspection.';
  }

  if (result === 'PASSED' && topCategory === 'Tyres') {
    return 'This MOT passed, but tyre wear was noted. This may indicate upcoming replacement costs.';
  }

  if (hasFailure && topCategory) {
    return `This MOT failed with ${topCategory.toLowerCase()} issues recorded. Treat this as a repair priority before purchase.`;
  }

  if (result === 'PASSED' && topCategory) {
    return `This MOT passed, but ${topCategory.toLowerCase()} notes were recorded. Budget for inspection or routine maintenance.`;
  }

  return 'This MOT has limited issue detail available, so review the recorded result and mileage trend together.';
}

export default function MOTTimeline({ history }: MOTTimelineProps) {
  if (!history.length) {
    return (
      <EmptyStateCard
        title="MOT history pending"
        message="Official MOT records are unavailable for this registration right now. The report continues with the vehicle data and confidence level we do have."
      />
    );
  }

  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime(),
  );
  const latest = sortedHistory[0];
  const passCount = sortedHistory.filter(
    (record) => normaliseResult(record.result) === 'PASSED',
  ).length;
  const passRate = Math.round((passCount / sortedHistory.length) * 100);
  const highestRisk = highestRiskCategory(sortedHistory);
  const recurring = recurringCategory(sortedHistory);

  return (
    <div className="glass rounded-2xl p-8">
      <h2 className="text-2xl font-semibold mb-2">MOT Intelligence Timeline</h2>
      <p className="text-sm text-slate-400 mb-8">
        Buyer-friendly MOT history with grouped issues, counts, and plain-English risk notes.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          { label: 'Total MOT tests', value: sortedHistory.length, icon: Layers3 },
          { label: 'Pass rate', value: `${passRate}%`, icon: CheckCircle2 },
          { label: 'Latest result', value: normaliseResult(latest.result), icon: ShieldAlert },
          {
            label: 'Latest mileage',
            value: latest.mileage ? `${latest.mileage.toLocaleString()} mi` : 'N/A',
            icon: Gauge,
          },
          { label: 'Highest risk category', value: highestRisk, icon: AlertTriangle },
          { label: 'Recurring issue', value: recurring, icon: Repeat2 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                <Icon className="h-4 w-4 text-cyan-300" />
                {item.label}
              </div>
              <p className="text-lg font-bold text-white">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {sortedHistory.map((record, index) => {
          const result = normaliseResult(record.result);
          const issues = normaliseIssues(record);
          const failures = issues.filter((issue) => issue.source === 'failure');
          const advisories = issues.filter((issue) => issue.source !== 'failure');
          const groupedCounts = categoryCounts(issues);
          const explanation = explainMot(record, issues, recurring);

          return (
            <div key={index} className="rounded-2xl border border-white/10 bg-slate-950/30 p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    {result === 'PASSED' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-300" />
                    )}
                    <h3 className="text-lg font-semibold text-white">MOT test</h3>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      {formatDate(record.test_date)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Gauge className="h-4 w-4" />
                      {record.mileage ? `${record.mileage.toLocaleString()} miles` : 'Mileage N/A'}
                    </span>
                  </div>
                </div>
                <span
                  className={`rounded-lg border px-3 py-1 text-xs font-bold ${
                    result === 'PASSED'
                      ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                      : 'border-red-500/30 bg-red-500/15 text-red-300'
                  }`}
                >
                  {result}
                </span>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <p className="text-xs text-slate-400">Advisories / notes</p>
                  <p className="text-2xl font-bold text-white">{advisories.length}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <p className="text-xs text-slate-400">Failures / serious</p>
                  <p className="text-2xl font-bold text-white">{failures.length}</p>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {Object.entries(groupedCounts).length > 0 ? (
                  Object.entries(groupedCounts).map(([category, count]) => (
                    <span
                      key={category}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200"
                    >
                      {category} ({count})
                    </span>
                  ))
                ) : (
                  <span className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200">
                    No issue categories recorded
                  </span>
                )}
              </div>

              {issues.length > 0 && (
                <div className="mb-4 space-y-2">
                  {issues.slice(0, 4).map((issue) => (
                    <div
                      key={`${issue.source}-${issue.text}`}
                      className="rounded-lg border border-white/10 bg-slate-900/50 p-3"
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded border px-2 py-1 text-xs font-semibold ${
                            issue.source === 'failure'
                              ? 'border-red-500/25 bg-red-500/10 text-red-200'
                              : 'border-amber-500/25 bg-amber-500/10 text-amber-200'
                          }`}
                        >
                          {issue.source === 'failure' ? 'Failure' : 'Advisory'}
                        </span>
                        <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">
                          {issue.groupedCategory}
                        </span>
                        {issue.is_repeated && (
                          <span className="inline-flex items-center gap-1 rounded border border-purple-500/30 bg-purple-500/15 px-2 py-1 text-xs font-semibold text-purple-200">
                            <Repeat2 className="h-3 w-3" />
                            Repeated
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed text-slate-300">{issue.text}</p>
                    </div>
                  ))}
                  {issues.length > 4 && (
                    <p className="text-xs text-slate-500">
                      Plus {issues.length - 4} more recorded item
                      {issues.length - 4 === 1 ? '' : 's'}.
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                  Rule-engine explanation
                </p>
                <p className="text-sm leading-relaxed text-slate-200">{explanation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

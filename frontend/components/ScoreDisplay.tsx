'use client';

import { TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface ScoreDisplayProps {
  score: number;
}

export default function ScoreDisplay({ score }: ScoreDisplayProps) {
  const getScoreColor = () => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-blue-500 to-cyan-600';
    if (score >= 40) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getScoreLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Circular score display */}
      <div className="relative w-40 h-40">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="#1e293b"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="8"
            strokeDasharray={`${(score / 100) * 440} 440`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className={`stop-${getScoreColor().split(' ')[0]}`} stopColor="#10b981" />
              <stop offset="100%" className={`stop-${getScoreColor().split(' ')[1]}`} stopColor="#059669" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-5xl font-bold bg-gradient-to-r ${getScoreColor()} bg-clip-text text-transparent`}>
            {score}
          </div>
          <div className="text-sm text-slate-400">/100</div>
        </div>
      </div>

      {/* Score label */}
      <div className="mt-6 text-center">
        <p className={`text-2xl font-semibold bg-gradient-to-r ${getScoreColor()} bg-clip-text text-transparent`}>
          {getScoreLabel()}
        </p>
      </div>
    </div>
  );
}

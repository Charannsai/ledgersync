'use client';

import React from 'react';
import { ListFilter, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';

interface MetricsOverviewProps {
  totalCount: number;
  totalVolume: number;
  flaggedCount: number;
  lowConfidenceCount: number;
  highConfidenceCount: number;
}

export function MetricsOverview({
  totalCount,
  totalVolume,
  flaggedCount,
  lowConfidenceCount,
  highConfidenceCount
}: MetricsOverviewProps) {
  const highConfidenceRate = totalCount > 0 ? Math.round((highConfidenceCount / totalCount) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Total Volume */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-1">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>Processed Volume</span>
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-md">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
          ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Across {totalCount} mapped item{totalCount === 1 ? '' : 's'}
        </p>
      </div>

      {/* Metric 2: Flagged For Client */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-1">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>Flagged for Client</span>
          <div className="p-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-md">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono flex items-baseline gap-2">
          {flaggedCount}
          <span className="text-xs font-normal text-amber-700/70 dark:text-amber-400/70">
            ({totalCount > 0 ? ((flaggedCount / totalCount) * 100).toFixed(0) : 0}%)
          </span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Ambiguous description or low confidence
        </p>
      </div>

      {/* Metric 3: Low Confidence Count */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-1">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>Low Confidence (&lt;50%)</span>
          <div className="p-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-md">
            <ListFilter className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-rose-600 dark:text-rose-400 font-mono">
          {lowConfidenceCount}
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Requires accountant manual review
        </p>
      </div>

      {/* Metric 4: Auto-Categorized Accuracy */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-1">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>High-Confidence Rate</span>
          <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-md">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
          {highConfidenceRate}%
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Matched standard COA rules (≥85%)
        </p>
      </div>
    </div>
  );
}

'use client';

import React from 'react';

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
      {/* Metric 1 */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Processed Volume</span>
        <div className="text-xl font-bold text-zinc-900 font-mono">
          ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <p className="text-[11px] text-zinc-400">
          {totalCount} transaction{totalCount === 1 ? '' : 's'}
        </p>
      </div>

      {/* Metric 2 */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Flagged for Client</span>
        <div className="text-xl font-bold text-amber-600 font-mono">
          {flaggedCount} <span className="text-xs font-normal text-zinc-500">({totalCount > 0 ? ((flaggedCount / totalCount) * 100).toFixed(0) : 0}%)</span>
        </div>
        <p className="text-[11px] text-zinc-400">Requires clarification</p>
      </div>

      {/* Metric 3 */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Low Confidence (&lt;50%)</span>
        <div className="text-xl font-bold text-rose-600 font-mono">{lowConfidenceCount}</div>
        <p className="text-[11px] text-zinc-400">Manual review needed</p>
      </div>

      {/* Metric 4 */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">High Confidence</span>
          <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-lime-400 text-zinc-950 rounded">AUTO</span>
        </div>
        <div className="text-xl font-bold text-zinc-900 font-mono">{highConfidenceRate}%</div>
        <p className="text-[11px] text-zinc-400">Matched COA (≥85%)</p>
      </div>
    </div>
  );
}

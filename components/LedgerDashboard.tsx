'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  AlertCircle,
  HelpCircle,
  Mail,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';
import { STANDARD_COA, getCOAByCode } from '@/lib/coa';

export interface TransactionItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  categoryCode?: string;
  confidence?: number;
  reason?: string;
  clarificationNeeded?: boolean;
}

interface LedgerDashboardProps {
  transactions: TransactionItem[];
  onUpdateCategory: (id: string, newCategoryCode: string) => void;
  onOpenDraftEmailModal: (tx: TransactionItem) => void;
  onResetUpload: () => void;
  onLoadPRDScenarios: () => void;
  isClassifying: boolean;
}

export function LedgerDashboard({
  transactions,
  onUpdateCategory,
  onOpenDraftEmailModal,
  onResetUpload,
  isClassifying
}: LedgerDashboardProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'flagged' | 'low_conf' | 'high_conf'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'confidence'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeReasoningModal, setActiveReasoningModal] = useState<TransactionItem | null>(null);

  const flaggedCount = useMemo(() => transactions.filter((t) => t.clarificationNeeded).length, [transactions]);
  const lowConfCount = useMemo(() => transactions.filter((t) => (t.confidence ?? 0) < 0.5).length, [transactions]);
  const highConfCount = useMemo(() => transactions.filter((t) => (t.confidence ?? 0) >= 0.85).length, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (filterMode === 'flagged' && !tx.clarificationNeeded) return false;
        if (filterMode === 'low_conf' && (tx.confidence ?? 0) >= 0.5) return false;
        if (filterMode === 'high_conf' && (tx.confidence ?? 0) < 0.85) return false;

        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const descMatch = tx.description.toLowerCase().includes(q);
          const amtMatch = tx.amount.toString().includes(q);
          const codeMatch = tx.categoryCode?.toLowerCase().includes(q);
          const catName = tx.categoryCode ? getCOAByCode(tx.categoryCode)?.name.toLowerCase() : '';
          const catMatch = catName?.includes(q);
          return descMatch || amtMatch || codeMatch || catMatch;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField] ?? 0;
        let valB: any = b[sortField] ?? 0;
        if (sortField === 'amount') {
          valA = Math.abs(a.amount);
          valB = Math.abs(b.amount);
        }
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [transactions, filterMode, searchQuery, sortField, sortOrder]);

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['Date', 'Description', 'Amount', 'COA_Code', 'COA_Name', 'Confidence', 'Clarification_Needed', 'Reason'];
    const rows = transactions.map((t) => {
      const coa = t.categoryCode ? getCOAByCode(t.categoryCode) : null;
      return [
        `"${t.date}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount.toFixed(2),
        `"${t.categoryCode || ''}"`,
        `"${coa ? coa.name.replace(/"/g, '""') : 'Unclassified'}"`,
        t.confidence ? (t.confidence * 100).toFixed(0) + '%' : '',
        t.clarificationNeeded ? 'YES' : 'NO',
        `"${(t.reason || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ledgersync_classified_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSort = (field: 'date' | 'amount' | 'confidence') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Minimal Header & Filter Pills */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-zinc-200 p-3.5 rounded-2xl">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
              filterMode === 'all'
                ? 'bg-zinc-950 text-white'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            onClick={() => setFilterMode('flagged')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors ${
              filterMode === 'flagged'
                ? 'bg-lime-400 text-zinc-950 font-bold'
                : 'text-zinc-700 bg-zinc-100 hover:bg-zinc-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Flagged ({flaggedCount})
          </button>
          <button
            onClick={() => setFilterMode('low_conf')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
              filterMode === 'low_conf'
                ? 'bg-zinc-950 text-white'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            Low Conf ({lowConfCount})
          </button>
          <button
            onClick={() => setFilterMode('high_conf')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
              filterMode === 'high_conf'
                ? 'bg-zinc-950 text-white'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            High Conf ({highConfCount})
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-full md:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-medium pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 outline-none focus:ring-1 focus:ring-lime-500"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>

          <button
            onClick={onResetUpload}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-xl hover:bg-zinc-100"
            title="Reset"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        {isClassifying ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <h4 className="text-xs font-semibold text-zinc-800">Classifying via AI...</h4>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-xs text-zinc-500">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="bg-zinc-50/80 text-zinc-700 font-bold border-b border-zinc-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-zinc-100"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      Date <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>
                  <th className="p-3.5">Vendor / Description</th>
                  <th
                    className="p-3.5 text-right cursor-pointer hover:bg-zinc-100"
                    onClick={() => toggleSort('amount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Amount ($) <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>
                  <th className="p-3.5 min-w-[200px]">COA Category</th>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-zinc-100"
                    onClick={() => toggleSort('confidence')}
                  >
                    <div className="flex items-center gap-1">
                      Confidence <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {filteredTransactions.map((tx) => {
                  const conf = tx.confidence ?? 0;
                  const isFlagged = tx.clarificationNeeded;

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-zinc-50/60 transition-colors ${
                        isFlagged ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="p-3.5 font-mono text-zinc-700 whitespace-nowrap">
                        {tx.date}
                      </td>

                      <td className="p-3.5 text-zinc-900">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{tx.description}</span>
                          {tx.reason && (
                            <button
                              type="button"
                              onClick={() => setActiveReasoningModal(tx)}
                              className="text-zinc-400 hover:text-zinc-900"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-zinc-900 whitespace-nowrap">
                        ${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      {/* In-Line COA Dropdown */}
                      <td className="p-3.5">
                        <select
                          value={tx.categoryCode || ''}
                          onChange={(e) => onUpdateCategory(tx.id, e.target.value)}
                          className="w-full text-xs font-semibold bg-white border border-zinc-200 rounded-lg p-1.5 text-zinc-900 focus:ring-1 focus:ring-lime-500 outline-none cursor-pointer"
                        >
                          <option value="">-- Select COA --</option>
                          {STANDARD_COA.map((item) => (
                            <option key={item.code} value={item.code}>
                              {item.code} - {item.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Confidence Score Pill */}
                      <td className="p-3.5 whitespace-nowrap">
                        {tx.confidence !== undefined ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              conf >= 0.85
                                ? 'bg-lime-100 text-lime-950 border border-lime-300'
                                : conf >= 0.5
                                ? 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {(conf * 100).toFixed(0)}% {conf >= 0.85 ? 'High' : conf >= 0.5 ? 'Med' : 'Flagged'}
                          </span>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenDraftEmailModal(tx)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-colors ${
                            isFlagged
                              ? 'bg-lime-400 text-zinc-950 hover:bg-lime-500 font-bold shadow-2xs'
                              : 'text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200'
                          }`}
                        >
                          <Mail className="w-3.5 h-3.5" /> Draft Email
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Reasoning Modal */}
      {activeReasoningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-2xs">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 max-w-md w-full shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h3 className="text-xs font-bold text-zinc-900">AI Classification Reasoning</h3>
              <button onClick={() => setActiveReasoningModal(null)} className="text-xs text-zinc-400">✕</button>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">{activeReasoningModal.reason}</p>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setActiveReasoningModal(null)}
                className="px-3.5 py-1 text-xs font-semibold text-white bg-zinc-900 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

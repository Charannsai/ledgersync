'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  AlertCircle,
  HelpCircle,
  Mail,
  ChevronDown,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  CheckCircle2,
  FileSpreadsheet
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
  onLoadPRDScenarios,
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
        // Filter tabs
        if (filterMode === 'flagged' && !tx.clarificationNeeded) return false;
        if (filterMode === 'low_conf' && (tx.confidence ?? 0) >= 0.5) return false;
        if (filterMode === 'high_conf' && (tx.confidence ?? 0) < 0.85) return false;

        // Search query
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
      {/* Action Bar & Filters Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white dark:bg-indigo-600 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Show All ({transactions.length})
          </button>
          <button
            onClick={() => setFilterMode('flagged')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              filterMode === 'flagged'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Flagged for Client ({flaggedCount})
          </button>
          <button
            onClick={() => setFilterMode('low_conf')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterMode === 'low_conf'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100'
            }`}
          >
            Low Confidence ({lowConfCount})
          </button>
          <button
            onClick={() => setFilterMode('high_conf')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterMode === 'high_conf'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100'
            }`}
          >
            High Confidence ({highConfCount})
          </button>
        </div>

        {/* Search & Export Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-full md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search description, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-medium pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export Cleaned CSV
          </button>

          <button
            onClick={onResetUpload}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Upload New File"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Ledger Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {isClassifying ? (
          <div className="p-12 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-indigo-600 animate-bounce mx-auto" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              AI Forensic Accountant at work...
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mapping raw vendor logs to standard COA and calculating confidence scores
            </p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No transactions match current filter criteria
            </h4>
            <button
              onClick={() => {
                setFilterMode('all');
                setSearchQuery('');
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px]">
                <tr>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      Date <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3.5">Raw Description (Vendor/Memo)</th>
                  <th
                    className="p-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50"
                    onClick={() => toggleSort('amount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Amount ($) <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3.5 min-w-[220px]">Suggested COA Category</th>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50"
                    onClick={() => toggleSort('confidence')}
                  >
                    <div className="flex items-center gap-1">
                      Confidence <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredTransactions.map((tx) => {
                  const conf = tx.confidence ?? 0;
                  const isFlagged = tx.clarificationNeeded;
                  const selectedCOA = tx.categoryCode ? getCOAByCode(tx.categoryCode) : null;

                  return (
                    <tr
                      key={tx.id}
                      className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                        isFlagged ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      {/* Date */}
                      <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {tx.date}
                      </td>

                      {/* Description */}
                      <td className="p-3.5 text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{tx.description}</span>
                          {tx.reason && (
                            <button
                              type="button"
                              onClick={() => setActiveReasoningModal(tx)}
                              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                              title="View AI Forensic Justification"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        ${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      {/* In-Line COA Dropdown */}
                      <td className="p-3.5">
                        <select
                          value={tx.categoryCode || ''}
                          onChange={(e) => onUpdateCategory(tx.id, e.target.value)}
                          className="w-full text-xs font-semibold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                        >
                          <option value="">-- Select COA Code --</option>
                          {STANDARD_COA.map((item) => (
                            <option key={item.code} value={item.code}>
                              {item.code} - {item.name} ({item.type})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Confidence Score Pill */}
                      <td className="p-3.5 whitespace-nowrap">
                        {tx.confidence !== undefined ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              conf >= 0.85
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : conf >= 0.5
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                conf >= 0.85 ? 'bg-emerald-600' : conf >= 0.5 ? 'bg-amber-600' : 'bg-rose-600'
                              }`}
                            />
                            {(conf * 100).toFixed(0)}% {conf >= 0.85 ? 'High' : conf >= 0.5 ? 'Medium' : 'Flagged'}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        {isFlagged ? (
                          <button
                            type="button"
                            onClick={() => onOpenDraftEmailModal(tx)}
                            className="px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-800 border border-amber-300 dark:border-amber-700 rounded-lg shadow-2xs inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" /> Draft Email
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenDraftEmailModal(tx)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg inline-flex items-center gap-1 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" /> Clarify
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Forensic Reasoning Modal */}
      {activeReasoningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" /> AI Classification Reasoning
              </h3>
              <button
                onClick={() => setActiveReasoningModal(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg font-mono text-slate-800 dark:text-slate-200">
                {activeReasoningModal.description} — ${activeReasoningModal.amount.toFixed(2)}
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {activeReasoningModal.reason}
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveReasoningModal(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg"
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

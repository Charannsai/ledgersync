'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, RefreshCw, Layers, Table as TableIcon } from 'lucide-react';

interface SchemaMapperProps {
  fileName: string;
  headers: string[];
  rawRows: Record<string, any>[];
  onMappingComplete: (mappedTransactions: Array<{ id: string; date: string; description: string; amount: number }>) => void;
  onReset: () => void;
}

export function SchemaMapper({
  fileName,
  headers,
  rawRows,
  onMappingComplete,
  onReset
}: SchemaMapperProps) {
  const [dateField, setDateField] = useState<string>('');
  const [descField, setDescField] = useState<string>('');
  const [amountField, setAmountField] = useState<string>('');

  // Auto-detect header fields intelligently
  useEffect(() => {
    headers.forEach((h) => {
      const lower = h.toLowerCase();
      if (!dateField && (lower.includes('date') || lower.includes('time') || lower.includes('dt'))) {
        setDateField(h);
      }
      if (!descField && (lower.includes('desc') || lower.includes('vendor') || lower.includes('payee') || lower.includes('memo') || lower.includes('name') || lower.includes('details'))) {
        setDescField(h);
      }
      if (!amountField && (lower.includes('amt') || lower.includes('amount') || lower.includes('debit') || lower.includes('credit') || lower.includes('total') || lower.includes('usd') || lower.includes('price'))) {
        setAmountField(h);
      }
    });

    // Fallbacks if not auto-detected
    if (!dateField && headers[0]) setDateField(headers[0]);
    if (!descField && headers[1]) setDescField(headers[1]);
    if (!amountField && headers[2]) setAmountField(headers[2]);
  }, [headers]);

  const handleConfirm = () => {
    if (!dateField || !descField || !amountField) return;

    const mapped = rawRows.map((row, index) => {
      const rawDate = row[dateField] || new Date().toISOString().split('T')[0];
      const rawDesc = String(row[descField] || 'Unlabeled Transaction');
      let rawAmt = 0;
      if (row[amountField] !== undefined) {
        const parsed = parseFloat(String(row[amountField]).replace(/[^0-9.-]+/g, ''));
        rawAmt = isNaN(parsed) ? 0 : parsed;
      }

      return {
        id: `tx-${index + 1}-${Date.now()}`,
        date: String(rawDate),
        description: rawDesc,
        amount: rawAmt
      };
    });

    onMappingComplete(mapped);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Schema Mapping Workbench
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Map uploaded columns from <span className="font-semibold text-slate-700 dark:text-slate-300">{fileName}</span> to target schema fields.
            </p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="self-start sm:self-auto text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-upload File
        </button>
      </div>

      {/* Mapping Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date Field Mapping */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Target: Date
          </label>
          <select
            value={dateField}
            onChange={(e) => setDateField(e.target.value)}
            className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">-- Select Header --</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            e.g., Post Date, Txn Date, Transaction_Date
          </p>
        </div>

        {/* Description Field Mapping */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Target: Description / Vendor
          </label>
          <select
            value={descField}
            onChange={(e) => setDescField(e.target.value)}
            className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">-- Select Header --</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            e.g., Description, Payee Name, Memo, Vendor
          </p>
        </div>

        {/* Amount Field Mapping */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Target: Amount ($)
          </label>
          <select
            value={amountField}
            onChange={(e) => setAmountField(e.target.value)}
            className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">-- Select Header --</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            e.g., Net Amount, Debit, Value_USD
          </p>
        </div>
      </div>

      {/* Dynamic Data Preview Table */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <TableIcon className="w-4 h-4 text-indigo-500" />
          Mapped Sample Data Preview (First 3 Rows)
        </div>
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-2.5">Mapped Date</th>
                <th className="p-2.5">Mapped Description</th>
                <th className="p-2.5 text-right">Mapped Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rawRows.slice(0, 3).map((row, idx) => {
                const dateVal = row[dateField] || 'N/A';
                const descVal = row[descField] || 'N/A';
                const amtVal = row[amountField] !== undefined ? row[amountField] : 'N/A';
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-2.5 font-mono">{String(dateVal)}</td>
                    <td className="p-2.5 font-medium text-slate-900 dark:text-slate-200">{String(descVal)}</td>
                    <td className="p-2.5 text-right font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {typeof amtVal === 'number' ? `$${amtVal.toFixed(2)}` : String(amtVal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action CTA */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleConfirm}
          disabled={!dateField || !descField || !amountField}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md flex items-center gap-2 transition-all duration-200"
        >
          <CheckCircle className="w-4 h-4" /> Classify Transactions via AI
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

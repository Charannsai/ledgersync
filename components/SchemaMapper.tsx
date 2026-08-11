'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, RefreshCw, Layers } from 'lucide-react';

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

  useEffect(() => {
    headers.forEach((h) => {
      const lower = h.toLowerCase();
      if (!dateField && (lower.includes('date') || lower.includes('time') || lower.includes('dt'))) {
        setDateField(h);
      }
      if (!descField && (lower.includes('desc') || lower.includes('vendor') || lower.includes('payee') || lower.includes('memo') || lower.includes('name'))) {
        setDescField(h);
      }
      if (!amountField && (lower.includes('amt') || lower.includes('amount') || lower.includes('debit') || lower.includes('credit') || lower.includes('total') || lower.includes('usd'))) {
        setAmountField(h);
      }
    });

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
    <div className="w-full bg-white border border-zinc-200 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Column Schema Mapping</h3>
            <p className="text-xs text-zinc-500">File: <span className="font-mono font-medium text-zinc-800">{fileName}</span></p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1 px-3 py-1.5 border border-zinc-200 rounded-lg"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-upload
        </button>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600">
            Target: Date
          </label>
          <select
            value={dateField}
            onChange={(e) => setDateField(e.target.value)}
            className="w-full text-xs font-medium bg-white border border-zinc-300 rounded-lg p-2 text-zinc-900 focus:ring-1 focus:ring-lime-500 outline-none"
          >
            <option value="">Select Header</option>
            {headers.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600">
            Target: Description / Vendor
          </label>
          <select
            value={descField}
            onChange={(e) => setDescField(e.target.value)}
            className="w-full text-xs font-medium bg-white border border-zinc-300 rounded-lg p-2 text-zinc-900 focus:ring-1 focus:ring-lime-500 outline-none"
          >
            <option value="">Select Header</option>
            {headers.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600">
            Target: Amount ($)
          </label>
          <select
            value={amountField}
            onChange={(e) => setAmountField(e.target.value)}
            className="w-full text-xs font-medium bg-white border border-zinc-300 rounded-lg p-2 text-zinc-900 focus:ring-1 focus:ring-lime-500 outline-none"
          >
            <option value="">Select Header</option>
            {headers.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleConfirm}
          disabled={!dateField || !descField || !amountField}
          className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-lime-400 hover:bg-lime-500 disabled:opacity-40 rounded-xl shadow-2xs flex items-center gap-2 transition-colors"
        >
          <Check className="w-4 h-4" /> Run AI Classification <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

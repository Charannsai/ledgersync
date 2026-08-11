'use client';

import React, { useState } from 'react';
import { Mail, Copy, Check, X, RefreshCw, Send } from 'lucide-react';

interface TransactionItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  categoryCode?: string;
  confidence?: number;
  reason?: string;
  clarificationNeeded?: boolean;
}

interface EmailDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionItem | null;
  draft: string;
  isLoading: boolean;
  onRegenerate: () => void;
}

export function EmailDraftModal({
  isOpen,
  onClose,
  transaction,
  draft,
  isLoading,
  onRegenerate
}: EmailDraftModalProps) {
  const [editedDraft, setEditedDraft] = useState(draft);
  const [copied, setCopied] = useState(false);
  const [simulatedSent, setSimulatedSent] = useState(false);

  // Sync draft when prop changes
  React.useEffect(() => {
    setEditedDraft(draft);
    setCopied(false);
    setSimulatedSent(false);
  }, [draft, isOpen]);

  if (!isOpen || !transaction) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(editedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulateSend = () => {
    setSimulatedSent(true);
    setTimeout(() => {
      setSimulatedSent(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Contextual Client Clarification Email
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI-drafted message for unclassified log item
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Target Transaction Details Banner */}
          <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-xl flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Target Log Line Item
              </span>
              <div className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                {transaction.date} — {transaction.description}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Amount</span>
              <div className="text-sm font-bold text-amber-700 dark:text-amber-400 font-mono">
                ${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Email Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Email Body (Editable)</span>
              <button
                type="button"
                onClick={onRegenerate}
                disabled={isLoading}
                className="text-indigo-600 dark:text-indigo-400 hover:underline text-[11px] flex items-center gap-1 font-medium"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Regenerating...' : 'Regenerate Draft'}
              </button>
            </div>
            {isLoading ? (
              <div className="w-full h-52 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-400 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                <span className="text-xs font-medium">Generating context-aware email with GPT-4o-mini...</span>
              </div>
            ) : (
              <textarea
                className="w-full h-52 p-4 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-sans bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed resize-none shadow-2xs"
                value={editedDraft}
                onChange={(e) => setEditedDraft(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={isLoading || !editedDraft}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" /> Copied to Clipboard
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy Email Draft
                </>
              )}
            </button>
            <button
              onClick={handleSimulateSend}
              disabled={isLoading || simulatedSent}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
            >
              {simulatedSent ? (
                <>
                  <Check className="w-4 h-4 text-white" /> Sent to Client!
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Request
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-2xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-lime-400 text-zinc-950 rounded-lg">
              <Mail className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">
              Draft Client Clarification Email
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Log Item</span>
              <div className="font-semibold text-zinc-900 font-mono">
                {transaction.date} — {transaction.description}
              </div>
            </div>
            <div className="text-right font-mono font-bold text-zinc-900">
              ${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
              <span>Email Content</span>
              <button
                type="button"
                onClick={onRegenerate}
                disabled={isLoading}
                className="text-zinc-500 hover:text-zinc-900 text-[11px] flex items-center gap-1 font-medium"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                Regenerate
              </button>
            </div>
            {isLoading ? (
              <div className="w-full h-48 border border-zinc-200 rounded-xl flex items-center justify-center bg-zinc-50 text-zinc-400 text-xs font-medium">
                Drafting email with Groq LLM...
              </div>
            ) : (
              <textarea
                className="w-full h-48 p-3.5 border border-zinc-300 rounded-xl text-xs font-sans bg-white text-zinc-900 focus:ring-1 focus:ring-lime-500 outline-none leading-relaxed resize-none"
                value={editedDraft}
                onChange={(e) => setEditedDraft(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-100 bg-zinc-50/50">
          <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900">
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={isLoading || !editedDraft}
              className="px-3.5 py-1.5 text-xs font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Email'}
            </button>
            <button
              onClick={handleSimulateSend}
              disabled={isLoading || simulatedSent}
              className="px-3.5 py-1.5 text-xs font-bold text-zinc-950 bg-lime-400 hover:bg-lime-500 rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
            >
              {simulatedSent ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
              {simulatedSent ? 'Sent!' : 'Send Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

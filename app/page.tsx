'use client';

import { useState } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { SchemaMapper } from '@/components/SchemaMapper';
import { MetricsOverview } from '@/components/MetricsOverview';
import { LedgerDashboard, TransactionItem } from '@/components/LedgerDashboard';
import { EmailDraftModal } from '@/components/EmailDraftModal';
import { Sparkles, ShieldCheck, Database, RefreshCw } from 'lucide-react';
import { getCOAByCode } from '@/lib/coa';

// PRD Verification Dataset (4 Scenarios)
const PRD_DEMO_SCENARIOS = [
  {
    id: 'tx-prd-1',
    date: '2024-10-14',
    description: 'AMZN MKTP US $241.22',
    amount: 241.22
  },
  {
    id: 'tx-prd-2',
    date: '2024-10-12',
    description: 'ADP PAYROLL FEES $4,500.00',
    amount: 4500.00
  },
  {
    id: 'tx-prd-3',
    date: '2024-10-15',
    description: 'REGUS WORKSPACE RENT $1,800.00',
    amount: 1800.00
  },
  {
    id: 'tx-prd-4',
    date: '2024-10-10',
    description: 'AWS Billing Cloud Infra',
    amount: 1240.23
  }
];

export default function LedgerDashboardPage() {
  // App Workflow State
  const [step, setStep] = useState<'upload' | 'mapping' | 'dashboard'>('upload');
  
  // File & Mapping State
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);

  // Transactions State
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isClassifying, setIsClassifying] = useState<boolean>(false);

  // Email Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [selectedTxForEmail, setSelectedTxForEmail] = useState<TransactionItem | null>(null);
  const [emailDraft, setEmailDraft] = useState<string>('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState<boolean>(false);

  // 1. Handle File Upload
  const handleFileParsed = (headers: string[], rows: Record<string, any>[], fileName: string) => {
    setUploadedFileName(fileName);
    setParsedHeaders(headers);
    setRawRows(rows);
    setStep('mapping');
  };

  // 2. Load PRD Verification Scenarios with 1-click
  const handleLoadPRDScenarios = async () => {
    setUploadedFileName('PRD_Verification_Suite.csv');
    setStep('dashboard');
    await runAIClassification(PRD_DEMO_SCENARIOS);
  };

  // 3. Complete Schema Mapping & Trigger AI Classification
  const handleMappingComplete = async (mappedTransactions: Array<{ id: string; date: string; description: string; amount: number }>) => {
    setStep('dashboard');
    await runAIClassification(mappedTransactions);
  };

  // 4. Run AI Classification Pipeline via API
  const runAIClassification = async (mappedTxns: Array<{ id: string; date: string; description: string; amount: number }>) => {
    setIsClassifying(true);
    // Initialize base transaction objects
    const initialTxns: TransactionItem[] = mappedTxns.map((m) => ({
      ...m,
      categoryCode: undefined,
      confidence: undefined,
      reason: undefined,
      clarificationNeeded: false
    }));
    setTransactions(initialTxns);

    try {
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: mappedTxns })
      });

      const data = await response.json();

      if (data.classifications && Array.isArray(data.classifications)) {
        const classifiedMap = new Map(data.classifications.map((c: any) => [c.raw_id, c]));

        setTransactions((prev) =>
          prev.map((tx) => {
            const match: any = classifiedMap.get(tx.id);
            if (match) {
              return {
                ...tx,
                categoryCode: match.suggested_code,
                confidence: match.confidence,
                reason: match.reason,
                clarificationNeeded: match.clarification_needed
              };
            }
            return tx;
          })
        );
      }
    } catch (err) {
      console.error('Classification error:', err);
    } finally {
      setIsClassifying(false);
    }
  };

  // 5. In-line manual update of COA Category code by Accountant
  const handleUpdateCategory = (id: string, newCode: string) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === id) {
          const coaItem = getCOAByCode(newCode);
          return {
            ...tx,
            categoryCode: newCode,
            confidence: 1.0, // Manual accountant override sets confidence to 100%
            clarificationNeeded: false,
            reason: `Manually classified by accountant to ${newCode} - ${coaItem?.name || 'Category'}.`
          };
        }
        return tx;
      })
    );
  };

  // 6. Generate Contextual Client Email Draft Modal
  const handleOpenDraftEmail = async (tx: TransactionItem) => {
    setSelectedTxForEmail(tx);
    setIsEmailModalOpen(true);
    setIsGeneratingEmail(true);
    setEmailDraft('');

    try {
      const response = await fetch('/api/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction: tx,
          clientName: 'Accounting Client',
          accountantName: 'Forward-Deployed Engineer'
        })
      });

      const data = await response.json();
      setEmailDraft(data.draft || '');
    } catch (err) {
      console.error('Error generating email draft:', err);
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setTransactions([]);
    setRawRows([]);
    setParsedHeaders([]);
    setUploadedFileName('');
  };

  // Stats for metrics bar
  const totalVolume = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const flaggedCount = transactions.filter((t) => t.clarificationNeeded).length;
  const lowConfCount = transactions.filter((t) => (t.confidence ?? 0) < 0.5).length;
  const highConfCount = transactions.filter((t) => (t.confidence ?? 0) >= 0.85).length;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-xl shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  LedgerSync AI
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-md border border-indigo-200 dark:border-indigo-800">
                  Minerva FDE Proof-of-Work
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                QuickBooks & Banking CSV Parser to Standard Chart of Accounts (COA)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>OpenAI GPT-4o-mini Engine</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium">
              <Database className="w-4 h-4 text-indigo-500" />
              <span>Supabase PostgreSQL Schema</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main App Workspace */}
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-3">
          <span className={`px-2.5 py-1 rounded-md ${step === 'upload' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
            1. CSV / JSON Import
          </span>
          <span>→</span>
          <span className={`px-2.5 py-1 rounded-md ${step === 'mapping' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
            2. Dynamic Column Mapping
          </span>
          <span>→</span>
          <span className={`px-2.5 py-1 rounded-md ${step === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
            3. AI COA Classification & Client Action Board
          </span>
        </div>

        {/* View 1: Upload Step */}
        {step === 'upload' && (
          <FileUploader
            onFileParsed={handleFileParsed}
            onLoadPRDScenarios={handleLoadPRDScenarios}
          />
        )}

        {/* View 2: Dynamic Schema Mapping Step */}
        {step === 'mapping' && (
          <SchemaMapper
            fileName={uploadedFileName}
            headers={parsedHeaders}
            rawRows={rawRows}
            onMappingComplete={handleMappingComplete}
            onReset={handleReset}
          />
        )}

        {/* View 3: Classified Ledger & Anomaly Action Board */}
        {step === 'dashboard' && (
          <div className="space-y-6">
            <MetricsOverview
              totalCount={transactions.length}
              totalVolume={totalVolume}
              flaggedCount={flaggedCount}
              lowConfidenceCount={lowConfCount}
              highConfidenceCount={highConfCount}
            />

            <LedgerDashboard
              transactions={transactions}
              onUpdateCategory={handleUpdateCategory}
              onOpenDraftEmailModal={handleOpenDraftEmail}
              onResetUpload={handleReset}
              onLoadPRDScenarios={handleLoadPRDScenarios}
              isClassifying={isClassifying}
            />
          </div>
        )}
      </div>

      {/* Contextual Email Draft Modal */}
      <EmailDraftModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        transaction={selectedTxForEmail}
        draft={emailDraft}
        isLoading={isGeneratingEmail}
        onRegenerate={() => selectedTxForEmail && handleOpenDraftEmail(selectedTxForEmail)}
      />
    </main>
  );
}

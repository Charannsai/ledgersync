'use client';

import { useState, useEffect } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { SchemaMapper } from '@/components/SchemaMapper';
import { MetricsOverview } from '@/components/MetricsOverview';
import { LedgerDashboard, TransactionItem } from '@/components/LedgerDashboard';
import { EmailDraftModal } from '@/components/EmailDraftModal';
import { Zap, Cpu, Database } from 'lucide-react';
import { getCOAByCode } from '@/lib/coa';

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
  const [step, setStep] = useState<'upload' | 'mapping' | 'dashboard'>('upload');

  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isClassifying, setIsClassifying] = useState<boolean>(false);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [selectedTxForEmail, setSelectedTxForEmail] = useState<TransactionItem | null>(null);
  const [emailDraft, setEmailDraft] = useState<string>('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/transactions')
      .then((res) => res.json())
      .then((data) => {
        if (data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
          const mappedFromDB: TransactionItem[] = data.transactions.map((t: any) => ({
            id: t.id,
            date: t.date,
            description: t.description,
            amount: t.amount,
            categoryCode: t.classified_category_code || undefined,
            confidence: t.confidence_score !== null ? t.confidence_score : undefined,
            reason: t.classification_reason || undefined,
            clarificationNeeded: Boolean(t.client_clarification_needed)
          }));
          setTransactions(mappedFromDB);
          setUploadedFileName('SQLite DB');
          setStep('dashboard');
        }
      })
      .catch((err) => console.log('No prior SQLite transactions loaded', err));
  }, []);

  const handleFileParsed = (headers: string[], rows: Record<string, any>[], fileName: string) => {
    setUploadedFileName(fileName);
    setParsedHeaders(headers);
    setRawRows(rows);
    setStep('mapping');
  };

  const handleLoadPRDScenarios = async () => {
    setUploadedFileName('PRD_Verification_Suite.csv');
    setStep('dashboard');
    await runAIClassification(PRD_DEMO_SCENARIOS);
  };

  const handleMappingComplete = async (mappedTransactions: Array<{ id: string; date: string; description: string; amount: number }>) => {
    setStep('dashboard');
    await runAIClassification(mappedTransactions);
  };

  const runAIClassification = async (mappedTxns: Array<{ id: string; date: string; description: string; amount: number }>) => {
    setIsClassifying(true);
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

  const handleUpdateCategory = async (id: string, newCode: string) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === id) {
          const coaItem = getCOAByCode(newCode);
          return {
            ...tx,
            categoryCode: newCode,
            confidence: 1.0,
            clarificationNeeded: false,
            reason: `Manually classified by accountant to ${newCode} - ${coaItem?.name || 'Category'}.`
          };
        }
        return tx;
      })
    );

    try {
      await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, categoryCode: newCode })
      });
    } catch (err) {
      console.error('Error updating transaction in SQLite:', err);
    }
  };

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
          accountantName: 'Forward-Deployed Accountant'
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

  const totalVolume = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const flaggedCount = transactions.filter((t) => t.clarificationNeeded).length;
  const lowConfCount = transactions.filter((t) => (t.confidence ?? 0) < 0.5).length;
  const highConfCount = transactions.filter((t) => (t.confidence ?? 0) >= 0.85).length;

  return (
    <main className="min-h-screen bg-zinc-50/50 text-zinc-900 font-sans antialiased">
      {/* Minimal Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-lime-400 rounded-lg flex items-center justify-center font-black text-zinc-950 text-xs">
              LS
            </div>
            <h1 className="text-base font-bold text-zinc-900 tracking-tight">
              LedgerSync AI
            </h1>
            <span className="text-xs text-zinc-400 font-medium">|</span>
            <span className="text-xs font-semibold text-zinc-500">
              QuickBooks COA Parser
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded-lg font-medium">
              <Cpu className="w-3.5 h-3.5 text-zinc-600" /> Groq LLM
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-lime-100 text-lime-950 border border-lime-300 rounded-lg font-bold">
              <Database className="w-3.5 h-3.5 text-lime-700" /> SQLite
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
        {/* Minimal Steps */}
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 border-b border-zinc-200 pb-3">
          <span className={`px-2 py-0.5 rounded-md ${step === 'upload' ? 'bg-zinc-900 text-white font-bold' : 'text-zinc-600'}`}>
            1. Import File
          </span>
          <span>/</span>
          <span className={`px-2 py-0.5 rounded-md ${step === 'mapping' ? 'bg-zinc-900 text-white font-bold' : 'text-zinc-600'}`}>
            2. Map Schema
          </span>
          <span>/</span>
          <span className={`px-2 py-0.5 rounded-md ${step === 'dashboard' ? 'bg-lime-400 text-zinc-950 font-bold' : 'text-zinc-600'}`}>
            3. AI Classification Board
          </span>
        </div>

        {/* View 1: Upload Step */}
        {step === 'upload' && (
          <FileUploader
            onFileParsed={handleFileParsed}
            onLoadPRDScenarios={handleLoadPRDScenarios}
          />
        )}

        {/* View 2: Schema Mapping Step */}
        {step === 'mapping' && (
          <SchemaMapper
            fileName={uploadedFileName}
            headers={parsedHeaders}
            rawRows={rawRows}
            onMappingComplete={handleMappingComplete}
            onReset={handleReset}
          />
        )}

        {/* View 3: Classified Ledger Board */}
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

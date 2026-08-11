'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, FileCode, CheckCircle2, Sparkles } from 'lucide-react';
import Papa from 'papaparse';

interface FileUploaderProps {
  onFileParsed: (headers: string[], rows: Record<string, any>[], fileName: string) => void;
  onLoadPRDScenarios: () => void;
}

export function FileUploader({ onFileParsed, onLoadPRDScenarios }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    setErrorMsg(null);
    const name = file.name.toLowerCase();

    if (name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.meta.fields && results.meta.fields.length > 0) {
            onFileParsed(results.meta.fields, results.data as Record<string, any>[], file.name);
          } else {
            setErrorMsg('Unable to parse CSV headers. Please ensure the CSV contains a header row.');
          }
        },
        error: (err) => {
          setErrorMsg(`CSV Parsing Error: ${err.message}`);
        }
      });
    } else if (name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = JSON.parse(event.target?.result as string);
          if (Array.isArray(content) && content.length > 0) {
            const headers = Object.keys(content[0]);
            onFileParsed(headers, content, file.name);
          } else {
            setErrorMsg('JSON file must contain an array of transaction objects.');
          }
        } catch (err: any) {
          setErrorMsg(`Invalid JSON file format: ${err.message}`);
        }
      };
      reader.readAsText(file);
    } else {
      setErrorMsg('Unsupported file type. Please upload a .csv or .json file.');
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md scale-[1.005]'
            : 'border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 hover:border-indigo-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, .json"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full shadow-sm">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Upload QuickBooks or Banking Ledger CSV/JSON
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Drag & drop your raw unclassified transaction export file here, or click to browse.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-400 dark:text-slate-500 pt-2">
            <span className="flex items-center gap-1">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Standard .CSV
            </span>
            <span className="flex items-center gap-1">
              <FileCode className="w-4 h-4 text-indigo-500" /> Exported .JSON
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs text-red-700 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Quick Demo Verification Trigger */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50 dark:from-indigo-950/30 dark:via-slate-900/30 dark:to-blue-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              PRD Demo Verification Suite
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Instant load of test cases: AMZN MKTP US ($241.22), ADP PAYROLL ($4,500.00), REGUS WORKSPACE ($1,800.00), AWS Billing.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLoadPRDScenarios}
          className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-700 rounded-lg shadow-2xs transition-colors shrink-0"
        >
          Load 4 Test Cases
        </button>
      </div>
    </div>
  );
}

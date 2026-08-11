'use client';

import React, { useRef, useState } from 'react';
import { Upload, ArrowRight, Zap, Download } from 'lucide-react';
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
            setErrorMsg('CSV header row missing or empty.');
          }
        },
        error: (err) => {
          setErrorMsg(`CSV Error: ${err.message}`);
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
          setErrorMsg(`JSON Format Error: ${err.message}`);
        }
      };
      reader.readAsText(file);
    } else {
      setErrorMsg('Please upload a .csv or .json ledger export file.');
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative border border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-150 bg-white ${
          isDragging
            ? 'border-lime-500 bg-lime-50/30 ring-2 ring-lime-400/20'
            : 'border-zinc-200 hover:border-lime-500 hover:bg-zinc-50/50'
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
          <div className="p-3.5 bg-zinc-100 group-hover:bg-lime-400/20 text-zinc-900 group-hover:text-lime-700 rounded-full transition-colors">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Upload Bank or QuickBooks Ledger (.csv / .json)
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Drag & drop file here or click to browse
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Sample Data Loader & Downloader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-zinc-200 rounded-2xl gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-lime-400 text-zinc-950 font-bold rounded-lg text-xs">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-900">
              Sample Ledger Test Data
            </h4>
            <p className="text-[11px] text-zinc-500">
              Quickly test the classification pipeline with sample bank transactions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/sample_ledger.csv"
            download="sample_ledger.csv"
            className="px-3 py-1.5 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Download Sample CSV
          </a>
          <button
            type="button"
            onClick={onLoadPRDScenarios}
            className="px-3.5 py-1.5 text-xs font-semibold text-zinc-950 bg-lime-400 hover:bg-lime-500 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            Load Sample Data <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

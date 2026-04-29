'use client';

import { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle, Loader2, PhoneCall, CheckCircle2, XCircle } from 'lucide-react';

interface ExtractedData {
  name: string;
  email: string;
  phone: string;
}

export default function Home() {
  const [data, setData] = useState<ExtractedData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callResults, setCallResults] = useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setError(null);
    setData([]);
    setCallResults(null);

    // Check if it's an excel file (basic check)
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.type.includes('spreadsheet');
    if (!isExcel) {
      setError('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload file');
      }

      if (result.data && result.data.length > 0) {
        setData(result.data);
      } else {
        setError('No data found or columns "Name", "Email", "Phone" are missing.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleMakeCalls = async () => {
    if (data.length === 0) return;
    
    setIsCalling(true);
    setError(null);
    setCallResults(null);

    try {
      const response = await fetch('/api/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: data }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to initiate calls');
      }

      setCallResults(result.results);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while calling.');
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-indigo-500/30">
      <main className="container mx-auto max-w-5xl px-6 py-20 flex flex-col gap-12">
        {/* Header Section */}
        <header className="flex flex-col gap-4 text-center items-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-2 border border-indigo-500/20">
            <FileSpreadsheet className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-neutral-400">
            Lead Processor
          </h1>
          <p className="text-lg text-neutral-400 max-w-xl">
            Upload your Excel list. We'll extract the contacts and prepare them for your AI agents.
          </p>
        </header>

        {/* Upload Section */}
        <section className="w-full max-w-2xl mx-auto">
          <div
            className={`relative group overflow-hidden border-2 border-dashed rounded-3xl p-12 transition-all duration-300 flex flex-col items-center justify-center gap-6 text-center
              ${isDragging 
                ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_40px_rgba(99,102,241,0.2)]' 
                : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-600 hover:bg-neutral-800/50'
              }
              ${isLoading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={handleFileInputChange}
            />
            
            <div className="p-4 bg-neutral-800 rounded-full group-hover:scale-110 transition-transform duration-300">
              {isLoading ? (
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              ) : (
                <UploadCloud className="w-8 h-8 text-indigo-400" />
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">
                {isLoading ? 'Processing file...' : 'Click or drag file to upload'}
              </h3>
              <p className="text-neutral-400 text-sm">
                Supports .xlsx and .xls formats. Expects Name, Email, and Phone columns.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 animate-in fade-in slide-in-from-bottom-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </section>

        {/* Results Section */}
        {data.length > 0 && (
          <section className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Extracted Contacts</h2>
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-sm font-medium rounded-full border border-indigo-500/20">
                {data.length} found
              </span>
            </div>

            <div className="flex justify-end mb-2">
              <button
                onClick={handleMakeCalls}
                disabled={isCalling}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg
                  ${isCalling 
                    ? 'bg-neutral-800 text-neutral-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-500/25'}
                `}
              >
                {isCalling ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Initiating Calls...
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-5 h-5" />
                    Make AI Calls
                  </>
                )}
              </button>
            </div>
            
            {callResults && (
              <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/50 mb-4">
                <h3 className="text-xl font-semibold mb-4 text-white">Call Results</h3>
                <ul className="space-y-3">
                  {callResults.map((res, idx) => (
                    <li key={idx} className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50">
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-200">{res.name || 'Unknown'}</span>
                        <span className="text-sm text-neutral-400">{res.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {res.status === 'success' ? (
                          <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-4 h-4" />
                            Initiated
                          </span>
                        ) : res.status === 'skipped' ? (
                          <span className="flex items-center gap-1.5 text-amber-400 text-sm font-medium bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                            Skipped
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-red-400 text-sm font-medium bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20" title={res.reason}>
                            <XCircle className="w-4 h-4" />
                            Failed
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/50 shadow-xl backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-neutral-800/80 text-neutral-300">
                    <tr>
                      <th className="px-6 py-4 font-medium first:rounded-tl-2xl">Name</th>
                      <th className="px-6 py-4 font-medium">Email</th>
                      <th className="px-6 py-4 font-medium last:rounded-tr-2xl">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50">
                    {data.map((row, index) => (
                      <tr 
                        key={index} 
                        className="hover:bg-neutral-800/30 transition-colors group"
                      >
                        <td className="px-6 py-4 text-neutral-200">
                          {row.name || <span className="text-neutral-600 italic">N/A</span>}
                        </td>
                        <td className="px-6 py-4 text-neutral-400">
                          {row.email || <span className="text-neutral-600 italic">N/A</span>}
                        </td>
                        <td className="px-6 py-4 text-neutral-400">
                          {row.phone || <span className="text-neutral-600 italic">N/A</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  X, Laptop, Search, ShieldAlert, Cpu, HardDrive, Battery, 
  Settings, Layers, CheckCircle2, AlertTriangle, Play, HelpCircle, RefreshCw
} from 'lucide-react';
import { lookupDellServiceTag, DellLookupResult, CompatiblePart } from '../utils/dellApi';
import { formatCurrency, formatDate } from '../utils';

interface DellLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPopulate?: (data: {
    model: string;
    purchaseDate: string;
    warrantyExpiration: string;
    serialNumber: string;
  }) => void;
  initialServiceTag?: string;
}

export default function DellLookupModal({
  isOpen,
  onClose,
  onPopulate,
  initialServiceTag = ''
}: DellLookupModalProps) {
  const [serviceTag, setServiceTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<DellLookupResult | null>(null);
  const [errorText, setErrorText] = useState('');
  const [apiWarning, setApiWarning] = useState('');
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Keep only alphanumeric characters and limit to the official 7 characters of Dell Service Tags
      const cleaned = initialServiceTag.trim().replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      setServiceTag(cleaned.substring(0, 7));
      setErrorText('');
      setApiWarning('');
      setLookupResult(null);
      setLoading(false);
    }
  }, [isOpen, initialServiceTag]);

  if (!isOpen) return null;

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = serviceTag.trim().toUpperCase();

    if (cleanTag.length !== 7 || !/^[A-Z0-9]{7}$/.test(cleanTag)) {
      setErrorText('Dell Service Tags must be exactly 7 alphanumeric characters.');
      return;
    }

    setLoading(true);
    setErrorText('');
    setLookupResult(null);

    try {
      const response = await lookupDellServiceTag(cleanTag, true);
      setLookupResult(response.result);
      setIsOnline(response.online);
      if (response.error) {
        setApiWarning(response.error);
      } else {
        setApiWarning('');
      }
    } catch (err: any) {
      setErrorText(err?.message || 'Failed to complete Dell records lookup.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToForm = () => {
    if (lookupResult && onPopulate) {
      onPopulate({
        model: lookupResult.model,
        purchaseDate: lookupResult.shipDate,
        warrantyExpiration: lookupResult.warrantyEnd,
        serialNumber: lookupResult.serviceTag
      });
      onClose();
    }
  };

  // Icon mapping for compatible parts
  const getPartIcon = (type: string) => {
    const norm = type.toLowerCase();
    if (norm.includes('ram') || norm.includes('memory')) return <Cpu className="h-4.5 w-4.5 text-blue-400" />;
    if (norm.includes('ssd') || norm.includes('storage')) return <HardDrive className="h-4.5 w-4.5 text-emerald-400" />;
    if (norm.includes('battery')) return <Battery className="h-4.5 w-4.5 text-rose-450" />;
    if (norm.includes('screen') || norm.includes('lcd') || norm.includes('display')) return <Layers className="h-4.5 w-4.5 text-indigo-400" />;
    return <Settings className="h-4.5 w-4.5 text-amber-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="w-full max-w-2xl rounded-2xl border border-[#334155]/60 bg-[#0f172a] p-6 shadow-2xl animate-in fade-in zoom-in duration-200 text-white flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-3.5 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <Laptop className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Dell TechDirect Warranty Lookup</h3>
              <p className="text-xs text-[#94a3b8]">Scan database registry for model configuration details and compatibility analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-[#1e293b] hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Query Bar */}
          <form onSubmit={handleLookup} className="flex gap-2.5 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Service Tag (S/N)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 8Z88K2D"
                  maxLength={7}
                  value={serviceTag}
                  onChange={(e) => setServiceTag(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-[#1e293b] bg-[#020617] py-2 pl-3 pr-20 text-xs font-mono font-bold tracking-widest text-[#38bdf8] placeholder-slate-650 outline-none focus:border-blue-500 transition-colors uppercase"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold">7 CHARS</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 px-5 h-[34px] text-xs font-bold text-white transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <Search className="h-4 w-4" />
              <span>{loading ? 'Searching...' : 'Search Tag'}</span>
            </button>
          </form>

          {/* Validation Error */}
          {errorText && (
            <div className="rounded-lg bg-rose-950/20 border border-rose-500/20 p-2.5 text-xs text-rose-400 flex items-center space-x-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          {/* API Warning/Fallback Notice */}
          {apiWarning && (
            <div className="rounded-lg bg-amber-950/20 border border-amber-500/20 p-3 text-xs text-amber-300 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center space-x-2 font-bold">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-amber-500" />
                <span>Dell API Live Lookup Offline / Restricted</span>
              </div>
              <p className="text-[#cbd5e1] font-normal leading-relaxed text-[11px]">
                The secure backend proxy received an error response from Dell. Below we are showing **high-quality sandbox-simulated specifications** based on typical configurations.
              </p>
              <div className="font-mono text-amber-400 text-[10px] bg-black/40 p-2 rounded border border-amber-500/10 mt-1 max-h-24 overflow-y-auto break-all">
                Error details: {apiWarning}
              </div>
              <p className="text-[10px] text-slate-400 leading-tight pt-1">
                To run live production lookups, make sure your Client ID, Secret, and Environment in Portal Settings are active and authorized in Dell's developer console for the "support/assetinfo" scope.
              </p>
            </div>
          )}

          {/* Lookup Results Display */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3.5">
              <div className="relative flex h-10 w-10">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-10 w-10 bg-blue-600 items-center justify-center text-white">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                </span>
              </div>
              <p className="text-xs text-[#94a3b8] font-medium">Interrogating Dell Registry Servers ...</p>
            </div>
          ) : lookupResult ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Asset Headline Summary Card */}
              <div className="rounded-xl border border-[#1e293b] bg-[#020617]/50 p-4 relative overflow-hidden">
                <div className="absolute right-0 top-0 bg-blue-600/10 px-3 py-1.5 text-[9px] font-bold text-blue-400 border-l border-b border-[#1e293b] rounded-bl-xl font-mono uppercase">
                  {isOnline ? '✓ TechDirect API Online' : '⊙ Sandbox Simulated'}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Model & Classification</span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{lookupResult.model}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Service Tag: <span className="text-[#38bdf8] font-bold">{lookupResult.serviceTag}</span></p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-400 pt-1">
                      <div>
                        <span className="font-semibold block text-slate-500 text-[10px] uppercase">Ship Date</span>
                        <span className="font-mono text-slate-200 mt-0.5 block">{formatDate(lookupResult.shipDate)}</span>
                      </div>
                      <div>
                        <span className="font-semibold block text-slate-500 text-[10px] uppercase">System Type</span>
                        <span className="text-slate-200 mt-0.5 block">{lookupResult.systemType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Warranty side panel block */}
                  <div className="rounded-xl bg-[#0a101f] border border-[#1e293b] p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Warranty coverage</span>
                      <span className={`inline-flex items-center rounded px-1.5 py-0.2 text-[8px] font-bold border uppercase font-mono ${
                        lookupResult.warrantyStatus === 'Active' 
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20' 
                          : 'bg-rose-950/40 text-rose-450 border-rose-500/20'
                      }`}>
                        {lookupResult.warrantyStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-450 pt-2 font-mono">
                      <div>
                        <b>Start:</b> <span className="text-slate-350">{lookupResult.warrantyStart}</span>
                      </div>
                      <div>
                        <b>Expiration:</b> <span className="text-slate-350">{lookupResult.warrantyEnd}</span>
                      </div>
                    </div>

                    <div className="border-t border-[#1e293b]/55 pt-2 mt-2 text-[11px] text-[#94a3b8] leading-tight">
                      {lookupResult.warrantyStatus === 'Active' 
                        ? 'Company assets secure under active manufacturer warranty.'
                        : 'Warranty expired. Hardware procedures utilize corporate overhead budgets.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Compatible Parts section with Dell PN */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center space-x-1">
                  <Layers className="h-4 w-4 text-blue-400" />
                  <span>Compatible Replacement Parts Catalog ({lookupResult.compatibleParts.length})</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {lookupResult.compatibleParts.map((part, idx) => (
                    <div 
                      key={idx} 
                      className="rounded-lg border border-[#1e293b] p-2.5 bg-[#020617]/40 flex items-start space-x-2.5 hover:border-slate-700/60 transition-all font-mono"
                    >
                      <div className="rounded-md bg-[#1e293b] p-1.5 shrink-0">
                        {getPartIcon(part.type)}
                      </div>
                      <div className="text-[11px] flex-1">
                        <div className="text-[9px] text-[#94a3b8] uppercase font-bold">{part.type}</div>
                        <div className="text-slate-205 font-sans font-semibold mt-0.5 leading-tight">{part.name}</div>
                        <div className="flex items-center justify-between text-[10px] text-slate-450 mt-1 border-t border-[#1e293b]/40 pt-1.5">
                          <span>Dell P/N: <b className="text-[#38bdf8] font-bold">{part.partNumber}</b></span>
                          <span className="font-sans font-extrabold text-white">{part.priceEstimate}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Original configuration specs folder */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center space-x-1">
                  <Cpu className="h-4 w-4 text-blue-400" />
                  <span>Original Factory Hardware Configuration specifications</span>
                </h4>
                <div className="rounded-xl border border-[#1e293b] p-3 text-[11px] bg-[#020617]/30 max-h-36 overflow-y-auto divide-y divide-[#1e293b]/50 pr-1 space-y-1">
                  {lookupResult.originalConfig.length === 0 ? (
                    <div className="text-slate-500 italic p-3 text-center">OEM specs registry is empty for this service tag.</div>
                  ) : (
                    lookupResult.originalConfig.map((spec, index) => (
                      <div key={index} className="py-1 cursor-default text-slate-300 leading-normal pl-1 hover:text-white transition-colors">
                        • {spec}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center rounded-xl border border-dashed border-[#1e293b] bg-[#020617]/20 flex flex-col items-center justify-center space-y-2">
              <Search className="h-8 w-8 text-slate-700" />
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Search Workspace Ready</h5>
              <p className="text-[11px] text-[#94a3b8] max-w-sm">Enter a 7-character alphanumeric Dell Service Tag above. Press Search Tag to inspect full specifications, warranty lifespans, and compatible parts.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-[#1e293b] pt-4.5 mt-2 flex items-center justify-between shrink-0">
          <div className="text-[10px] text-slate-500 max-w-xs font-medium">
            Caching Active: Repeated lookups fetch local storage caches to conserve API credits.
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-[#1e293b] hover:bg-[#1e293b] bg-[#0f172a] px-4.5 py-2 text-xs font-semibold text-slate-300 transition-colors"
            >
              Close
            </button>
            {lookupResult && onPopulate && (
              <button
                onClick={handleApplyToForm}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4.5 py-2 text-xs font-bold text-white transition-colors shadow-sm flex items-center space-x-1"
                id="apply-dell-specs-btn"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Apply Specs to Form</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

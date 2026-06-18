import React, { useState } from 'react';
import { Computer, MaintenanceLog, MaintenanceType, MaintenanceStatus, UserRole } from '../types';
import DellLookupModal from './DellLookupModal';
import { 
  Plus, Search, Filter, Trash2, Edit3, Eye, 
  MapPin, ShieldAlert, BadgeInfo, Calendar, 
  Download, RefreshCw, X, Shield, Wrench, User,
  CheckCircle, Hammer, DollarSign, Clock, LayoutGrid, Laptop
} from 'lucide-react';
import { formatDate, formatCurrency, isNextServiceOverdue, exportLogsToCSV } from '../utils';

interface MaintenanceProps {
  logs: MaintenanceLog[];
  computers: Computer[];
  currentRole: UserRole;
  onAddLog: (log: Omit<MaintenanceLog, 'id'>) => void;
  onUpdateLog: (log: MaintenanceLog) => void;
  onDeleteLog: (id: string) => void;
  activeTechName?: string;
}

export default function Maintenance({
  logs,
  computers,
  currentRole,
  onAddLog,
  onUpdateLog,
  onDeleteLog,
  activeTechName,
}: MaintenanceProps) {
  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Log for inspector details
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editLog, setEditLog] = useState<MaintenanceLog | null>(null);

  // Form input states
  const [date, setDate] = useState('');
  const [computerId, setComputerId] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>('Preventive');
  const [description, setDescription] = useState('');
  const [partsUsed, setPartsUsed] = useState('None');
  const [timeSpentHours, setTimeSpentHours] = useState('1.0');
  const [cost, setCost] = useState('0');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [status, setStatus] = useState<MaintenanceStatus>('Completed');

  // Form errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Dell lookup state in Maintenance entry form
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [lookupServiceTag, setLookupServiceTag] = useState('');

  const handleDellPartsPopulate = (result: { model: string; purchaseDate: string; warrantyExpiration: string; serialNumber: string }) => {
    // Fill model string into the description of work if empty, or append it
    if (!description.trim()) {
      setDescription(`Replacement parts diagnostics compiled for ${result.model} (S/N: ${result.serialNumber}).`);
    } else {
      setDescription(prev => `${prev}\n[Dell Technical Lookup: ${result.model} / S/N: ${result.serialNumber}]`);
    }
  };

  // Deletion prompt states
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const MAINTENANCE_TYPES: MaintenanceType[] = ['Preventive', 'Repair', 'Upgrade', 'Software', 'Hardware'];
  const MAINTENANCE_STATUSES: MaintenanceStatus[] = ['Open', 'In Progress', 'Completed'];

  // Role permissions
  const isWritable = currentRole === 'Admin' || currentRole === 'Technician';
  const isDeletable = currentRole === 'Admin'; // Only Admins can delete logs

  // Toggle Forms
  const openAddLogModal = () => {
    setEditLog(null);
    setDate('2026-06-15'); // Current date anchor
    setComputerId(computers[0]?.id || '');
    setTechnicianName(activeTechName || (currentRole === 'Technician' ? 'Field Operator' : 'Miles Dyson'));
    setMaintenanceType('Preventive');
    setDescription('');
    setPartsUsed('None');
    setTimeSpentHours('1.0');
    setCost('0');
    setNextServiceDate('');
    setStatus('Completed');
    setErrors({});
    setIsFormOpen(true);
  };

  const openEditLogModal = (log: MaintenanceLog, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting log row details override
    setEditLog(log);
    setDate(log.date);
    setComputerId(log.computerId);
    setTechnicianName(log.technicianName);
    setMaintenanceType(log.maintenanceType);
    setDescription(log.description);
    setPartsUsed(log.partsUsed);
    setTimeSpentHours(log.timeSpentHours.toString());
    setCost(log.cost.toString());
    setNextServiceDate(log.nextServiceDate || '');
    setStatus(log.status);
    setErrors({});
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!date) newErrors.date = 'Date of maintenance is required.';
    if (!computerId) newErrors.computerId = 'Please select a linked computer asset.';
    if (!technicianName.trim()) newErrors.technicianName = 'A technician name is required.';
    if (!description.trim()) newErrors.description = 'Work details description is required.';
    else if (description.trim().length < 6) newErrors.description = 'Description must be at least 6 characters.';

    const parsedHours = parseFloat(timeSpentHours);
    if (isNaN(parsedHours) || parsedHours <= 0) {
      newErrors.timeSpentHours = 'Time spent must be a positive number of hours.';
    }

    const parsedCost = parseFloat(cost);
    if (isNaN(parsedCost) || parsedCost < 0) {
      newErrors.cost = 'Total parts/service cost must be zero or a positive amount.';
    }

    if (date && nextServiceDate && nextServiceDate < date) {
      newErrors.nextServiceDate = 'Next service due date cannot precede current maintenance date.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      date,
      computerId,
      technicianName: technicianName.trim(),
      maintenanceType,
      description: description.trim(),
      partsUsed: partsUsed.trim() || 'None',
      timeSpentHours: parsedHours,
      cost: parsedCost,
      nextServiceDate: nextServiceDate || undefined,
      status,
    };

    if (editLog) {
      onUpdateLog({ ...payload, id: editLog.id });
    } else {
      onAddLog(payload);
    }

    setIsFormOpen(false);
  };

  const handleDeleteTrigger = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selector click
    setDeleteId(id);
  };

  const handleDeleteConfirm = () => {
    if (!deleteId) return;
    onDeleteLog(deleteId);
    setDeleteId(null);
    if (selectedLogId === deleteId) {
      setSelectedLogId(null);
    }
  };

  // Searching & filtering execution
  const filteredLogs = logs.filter(log => {
    const comp = computers.find(c => c.id === log.computerId);
    const query = searchQuery.toLowerCase();
    
    // Search tags, tech name, parts, or descriptions
    const matchesSearch = 
      log.technicianName.toLowerCase().includes(query) ||
      log.description.toLowerCase().includes(query) ||
      log.partsUsed.toLowerCase().includes(query) ||
      (comp && comp.assetTag.toLowerCase().includes(query)) ||
      (comp && comp.makeModel.toLowerCase().includes(query));

    const matchesType = typeFilter === 'All' || log.maintenanceType === typeFilter;
    const matchesStatus = statusFilter === 'All' || log.status === statusFilter;

    // Date range restrictions
    const matchesStart = !startDate || log.date >= startDate;
    const matchesEnd = !endDate || log.date <= endDate;

    return matchesSearch && matchesType && matchesStatus && matchesStart && matchesEnd;
  });

  const selectedLog = selectedLogId ? logs.find(l => l.id === selectedLogId) : null;
  const selectedLogComputer = selectedLog ? computers.find(c => c.id === selectedLog.computerId) : null;

  const typeColors = {
    Preventive: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20',
    Repair: 'text-rose-450 bg-rose-950/40 border-rose-500/20',
    Upgrade: 'text-blue-400 bg-blue-950/40 border-blue-500/20',
    Software: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/20',
    Hardware: 'text-amber-400 bg-amber-950/40 border-amber-500/20',
  };

  const statusColors = {
    Open: 'bg-blue-950/40 text-blue-400 border border-blue-500/20',
    'In Progress': 'bg-amber-950/40 text-amber-450 border border-amber-500/20',
    Completed: 'bg-emerald-950/40 text-emerald-450 border border-emerald-500/20',
  };

  return (
    <div className="space-y-6" id="maintenance-view-root">
      
      {/* Upper operations block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white animate-in slide-in-from-left duration-200">Maintenance Activity Logs</h2>
          <p className="text-sm text-[#94a3b8]">Record diagnostic inspections, repairs, parts changes, and upgrades performed by technical personnel.</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* CSV Export */}
          <button
            onClick={() => exportLogsToCSV(logs, computers)}
            className="flex items-center space-x-1.5 rounded-lg border border-[#1e293b] bg-[#0f172a] px-3.5 py-2 text-xs font-semibold text-slate-300 shadow-sm hover:bg-[#1e293b] hover:text-white transition-colors"
            title="Download full database log as CSV"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV Logs</span>
          </button>

          {/* Log Maintenance Button */}
          {isWritable ? (
            <button
              onClick={openAddLogModal}
              className="flex items-center space-x-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              id="log-maintenance-btn"
            >
              <Plus className="h-4 w-4" />
              <span>Log Maintenance</span>
            </button>
          ) : (
            <div 
              className="inline-flex items-center space-x-1.5 rounded-lg bg-[#020617]/30 px-4 py-2 text-xs font-medium text-[#94a3b8] border border-[#1e293b] cursor-not-allowed"
              title="Viewer role has restricted permissions for logging maintenance."
            >
              <Shield className="h-4.5 w-4.5 text-[#64748b]" />
              <span>Log Locked (Viewer)</span>
            </div>
          )}
        </div>
      </div>

      {/* Primary logs lists grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Table & Filtering */}
        <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] shadow-sm lg:col-span-2 overflow-hidden">
          
          {/* Search, types, date-pickers filters */}
          <div className="border-b border-[#1e293b] p-4.5 space-y-3.5 bg-[#020617]/40">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Search textbox */}
              <div className="relative sm:col-span-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search technican, parts, description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-[#1e293b] bg-[#020617] py-2 pl-9.5 pr-4 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  id="search-logs-input"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[10px]">
                    Clear
                  </button>
                )}
              </div>

              {/* Maintenance type selection */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500 font-bold uppercase">Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="flex-1 rounded-lg border border-[#1e293b] bg-[#020617] text-white py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                >
                  <option value="All" className="bg-[#0f172a]">All Types</option>
                  {MAINTENANCE_TYPES.map(t => <option key={t} value={t} className="bg-[#0f172a]">{t}</option>)}
                </select>
              </div>

              {/* Status selection */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500 font-bold uppercase">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 rounded-lg border border-[#1e293b] bg-[#020617] text-white py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                >
                  <option value="All" className="bg-[#0f172a]">All Statuses</option>
                  {MAINTENANCE_STATUSES.map(s => <option key={s} value={s} className="bg-[#0f172a]">{s}</option>)}
                </select>
              </div>

            </div>

            {/* Date range pickers */}
            <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-[#1e293b] text-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Date Window Filter:</span>
              
              <div className="flex items-center space-x-1.5 animate-in fade-in duration-350">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-lg border border-[#1e293b] bg-[#020617] py-1 px-2 text-xs text-[#f8fafc] focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  title="Filter start date bound"
                  id="log-start-date"
                />
                <span className="text-slate-400 font-medium">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-lg border border-[#1e293b] bg-[#020617] py-1 px-2 text-xs text-[#f8fafc] focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  title="Filter end date bound"
                  id="log-end-date"
                />
              </div>

              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-xs text-blue-400 hover:underline font-semibold"
                >
                  Clear dates
                </button>
              )}
            </div>

            <div className="text-[11px] text-[#64748b] flex justify-between items-center bg-transparent mt-1">
              <span>Found <b className="text-slate-300">{filteredLogs.length}</b> matches out of <b className="text-slate-300">{logs.length}</b> registered entries.</span>
              {(searchQuery || typeFilter !== 'All' || statusFilter !== 'All' || startDate || endDate) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('All');
                    setStatusFilter('All');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-xs text-blue-400 hover:underline font-semibold"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 font-sans">
                <Wrench className="h-12 w-12 text-[#1e293b] mb-2 animate-pulse" />
                <span className="text-sm font-semibold text-slate-300">No maintenance entries found matching parameters</span>
                <span className="text-xs text-[#94a3b8] mt-1">Try relaxing term selections, wiping date bounds, or checking spelling.</span>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1e293b] bg-[#020617]/40 text-[#64748b] font-semibold">
                    <th className="py-3 px-4">Log ID & Date</th>
                    <th className="py-3 px-4">Mac Asset Tag</th>
                    <th className="py-3 px-4">Job / Purpose Details</th>
                    <th className="py-3 px-4">Parts & Support Hours</th>
                    <th className="py-3 px-4 text-right">Cost</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/40">
                  {filteredLogs.map(log => {
                    const comp = computers.find(c => c.id === log.computerId);
                    const isSelected = selectedLogId === log.id;

                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLogId(isSelected ? null : log.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-[#1e293b]/45 hover:bg-[#1e293b]/55' 
                            : 'hover:bg-[#1e293b]/20'
                        }`}
                        id={`log-row-${log.id}`}
                      >
                        {/* ID Date */}
                        <td className="py-3.5 px-4">
                          <span className="inline-block rounded bg-[#1e293b]/60 px-1 py-0.2 text-[9px] font-mono font-bold text-slate-300 mb-1 border border-blue-500/10">
                            #{log.id.toUpperCase()}
                          </span>
                          <div className="font-mono text-[#94a3b8] text-[11px] font-medium">{formatDate(log.date)}</div>
                        </td>

                        {/* Computer tag / make */}
                        <td className="py-3.5 px-4 font-semibold text-white font-mono">
                          <div>{comp ? comp.assetTag : 'N/A'}</div>
                          <div className="text-[10px] text-slate-500 font-normal truncate max-w-28" title={comp?.makeModel}>
                            {comp ? comp.makeModel : 'Deleted machine'}
                          </div>
                        </td>

                        {/* Description details */}
                        <td className="py-3.5 px-4">
                          <div className="mb-0.5">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold border ${typeColors[log.maintenanceType]}`}>
                              {log.maintenanceType}
                            </span>
                            <span className="text-[10px] text-slate-500 ml-1.5">by {log.technicianName}</span>
                          </div>
                          <div className="text-slate-400 line-clamp-2 max-w-sm" title={log.description}>
                            {log.description}
                          </div>
                        </td>

                        {/* Parts & labor hours */}
                        <td className="py-3.5 px-4 text-[#94a3b8]">
                          <div className="truncate max-w-36 text-slate-300" title={log.partsUsed}>
                            Parts: <b className="font-semibold">{log.partsUsed}</b>
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                            <Clock className="h-3 w-3 shrink-0 text-slate-650" />
                            <span>{log.timeSpentHours} hrs labor</span>
                          </div>
                        </td>

                        {/* Cost */}
                        <td className="py-3.5 px-4 text-right font-semibold font-mono text-slate-200">
                          {log.cost > 0 ? formatCurrency(log.cost) : '—'}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${statusColors[log.status]}`}>
                            <span className={`mr-1 h-1 w-1 rounded-full ${
                              log.status === 'Completed' ? 'bg-emerald-500' :
                              log.status === 'In Progress' ? 'bg-amber-500' : 'bg-blue-500'
                            }`} />
                            {log.status}
                          </span>
                        </td>

                        {/* Operations Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => setSelectedLogId(isSelected ? null : log.id)}
                              className="rounded p-1 text-slate-400 hover:bg-[#1e293b]/75 hover:text-white transition-colors"
                              title="Inspect full details card"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {isWritable && (
                              <button
                                onClick={(e) => openEditLogModal(log, e)}
                                className="rounded p-1 text-slate-400 hover:bg-[#1e293b]/75 hover:text-blue-400 transition-colors"
                                title="Edit log details"
                                id={`edit-log-${log.id}`}
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            )}

                            {isDeletable && (
                              <button
                                onClick={(e) => handleDeleteTrigger(log.id, e)}
                                className="rounded p-1 text-slate-400 hover:bg-[#1e293b]/75 hover:text-red-500 transition-colors"
                                title="Wipe maintenance log from permanent archives"
                                id={`delete-log-${log.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Inspection Panel Column */}
        <div className="flex flex-col space-y-4" id="log-inspector-panel">
          
          <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-5 shadow-sm min-h-[460px] flex flex-col">
            {!selectedLog ? (
              <div className="my-auto flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Wrench className="h-10 w-10 text-[#1e293b] mb-2 animate-pulse" />
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Inspection Cabin</h4>
                <p className="text-[11px] text-slate-500 max-w-44 mt-1">Select any row from the activity ledger table block to examine specialized comments, parts specs, and costs.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-4.5">
                
                {/* Header title */}
                <div className="flex items-start justify-between border-b border-[#1e293b] pb-3">
                  <div>
                    <span className="inline-block rounded bg-indigo-950/40 px-1.5 py-0.5 text-[9px] font-mono font-bold text-indigo-400 mb-1 border border-indigo-500/20">
                      maintenance log #{selectedLog.id.toUpperCase()}
                    </span>
                    <h3 className="font-bold text-white text-sm leading-tight">By {selectedLog.technicianName}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Completed Date: {formatDate(selectedLog.date)}</p>
                  </div>
                  <button
                    onClick={() => setSelectedLogId(null)}
                    className="rounded p-1 text-slate-500 hover:bg-[#1e293b] hover:text-[#f8fafc] transition-colors"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Machine Details card summary */}
                <div className="bg-[#020617]/50 p-3 rounded-xl border border-[#1e293b] flex items-start space-x-2.5">
                  <Laptop className="h-5 w-5 text-slate-500 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-xs">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Linked Hardware Host</span>
                    {selectedLogComputer ? (
                      <div>
                        <span className="font-semibold text-slate-200 font-mono text-[11px]">{selectedLogComputer.assetTag}</span>
                        <span className="text-slate-400"> - {selectedLogComputer.makeModel}</span>
                        <div className="text-[10px] text-slate-505 mt-1">Custodian: {selectedLogComputer.assignedUser} &bull; Dept: {selectedLogComputer.department}</div>
                      </div>
                    ) : (
                      <span className="text-slate-500 font-medium">Deleted Machine / Unlinked asset</span>
                    )}
                  </div>
                </div>

                {/* Job Specs metadata */}
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Type & Status</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border ${typeColors[selectedLog.maintenanceType]}`}>
                        [{selectedLog.maintenanceType}]
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${statusColors[selectedLog.status]}`}>
                        {selectedLog.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Specific Work Logs Summary</span>
                    <p className="text-xs text-slate-300 leading-relaxed bg-[#020617] p-3 rounded-lg border border-[#1e293b] mt-1 whitespace-pre-wrap">{selectedLog.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-[#020617]/40 border border-[#1e293b] rounded-lg p-3">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Parts Deployed</span>
                      <span className="font-medium text-slate-300 mt-0.5 block">{selectedLog.partsUsed || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Labor Hours Duration</span>
                      <span className="font-medium text-slate-305 mt-0.5 flex items-center space-x-1">
                        <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span>{selectedLog.timeSpentHours} Hours</span>
                      </span>
                    </div>
                    {selectedLog.nextServiceDate && (
                      <div className="col-span-2 border-t border-[#1e293b] pt-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Next Planned Scheduled Service</span>
                        <span className="font-semibold text-amber-500 flex items-center space-x-1.5 mt-0.5 font-mono">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>{formatDate(selectedLog.nextServiceDate)}</span>
                          {isNextServiceOverdue(selectedLog.nextServiceDate, selectedLog.status) && (
                            <span className="inline-block bg-amber-950/40 text-amber-500 border border-amber-500/20 font-sans text-[8px] font-bold uppercase rounded px-1 text-center scale-90">OVERDUE</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-[#1e293b] pt-3 text-xs font-semibold">
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Audit Costing Impact:</span>
                    <span className="text-emerald-450 text-sm font-mono font-bold bg-[#020617]/50 px-2 py-0.5 rounded border border-emerald-500/20">{formatCurrency(selectedLog.cost)}</span>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>

      {/* CREATE / UPDATE MODAL FOR LOG */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[#1e293b] bg-[#0f172a] p-6 shadow-2xl animate-in fade-in zoom-in duration-150 text-white">
            <div className="mb-4 flex items-center justify-between border-b border-[#1e293b] pb-3.5">
              <h3 className="text-base font-bold text-white" id="log-modal-title">
                {editLog ? `Modify Service log #${editLog.id.toUpperCase()}` : 'Log Technical Maintenance Entry'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-[#1e293b] hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4" id="maintenance-log-form">
              <div className="grid grid-cols-2 gap-3.5">
                
                {/* Linked Computer */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Target Fleet Computer (Host)</label>
                  <select
                    value={computerId}
                    onChange={(e) => setComputerId(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-[#020617] text-white ${
                      errors.computerId ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : 'border-[#1e293b] focus:border-blue-500'
                    }`}
                  >
                    <option value="" disabled className="bg-[#0f172a]">Select Computer Asset...</option>
                    {computers.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#0f172a]">{c.assetTag} - {c.assignedUser} ({c.makeModel.substring(0, 32)})</option>
                    ))}
                  </select>
                  {errors.computerId && <span className="text-[10px] text-red-400 font-semibold">{errors.computerId}</span>}
                </div>

                {/* Log Date */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Service Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-[#020617] text-white ${
                      errors.date ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : 'border-[#1e293b] focus:border-blue-500'
                    }`}
                  />
                  {errors.date && <span className="text-[10px] text-red-400 font-semibold">{errors.date}</span>}
                </div>

                {/* Technician Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Responsible Technician</label>
                  <input
                    type="text"
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    placeholder="e.g. Miles Dyson"
                    className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-[#020617] text-white placeholder-slate-650 ${
                      errors.technicianName ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : 'border-[#1e293b] focus:border-blue-500'
                    }`}
                  />
                  {errors.technicianName && <span className="text-[10px] text-red-400 font-semibold">{errors.technicianName}</span>}
                </div>

                {/* Maintenance Type */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Maintenance category</label>
                  <select
                    value={maintenanceType}
                    onChange={(e) => setMaintenanceType(e.target.value as any)}
                    className="w-full rounded-lg border border-[#1e293b] bg-[#020617] text-white px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {MAINTENANCE_TYPES.map(t => (
                      <option key={t} value={t} className="bg-[#0f172a]">{t}</option>
                    ))}
                  </select>
                </div>

                {/* Labor Time Duration Spent */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Labor Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={timeSpentHours}
                    onChange={(e) => setTimeSpentHours(e.target.value)}
                    placeholder="e.g. 1.5"
                    className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-[#020617] text-white ${
                      errors.timeSpentHours ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : 'border-[#1e293b] focus:border-blue-500'
                    }`}
                  />
                  {errors.timeSpentHours && <span className="text-[10px] text-red-400 font-semibold">{errors.timeSpentHours}</span>}
                </div>

                {/* Parts Used */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Replacement Parts Deployed</label>
                    <button
                      type="button"
                      onClick={() => {
                        const targetComputer = computers.find(c => c.id === computerId);
                        setLookupServiceTag(targetComputer ? targetComputer.serialNumber : '');
                        setIsLookupOpen(true);
                      }}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-bold hover:underline focus:outline-none"
                    >
                      Lookup Dell Parts
                    </button>
                  </div>
                  <input
                    type="text"
                    value={partsUsed}
                    onChange={(e) => setPartsUsed(e.target.value)}
                    placeholder="e.g. Lithium-Ion Battery, None"
                    className="w-full rounded-lg border border-[#1e293b] bg-[#020617] text-white placeholder-slate-650 px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Total Cost */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Parts & Job Cost ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="e.g. 150"
                    className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-[#020617] text-white ${
                      errors.cost ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : 'border-[#1e293b] focus:border-blue-500'
                    }`}
                  />
                  {errors.cost && <span className="text-[10px] text-red-400 font-semibold">{errors.cost}</span>}
                </div>

                {/* Specific Description of work */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Description of work, diagnostic observations & test findings</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Summarize exact hardware procedures, benchmarks, system logs analyzed..."
                    className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-[#020617] text-white placeholder-slate-650 ${
                      errors.description ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : 'border-[#1e293b] focus:border-blue-500'
                    }`}
                  />
                  {errors.description && <span className="text-[10px] text-red-400 font-semibold">{errors.description}</span>}
                </div>

                {/* Planned Next Service Due date schedules */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Next Service Schedule (Optional)</label>
                  <input
                    type="date"
                    value={nextServiceDate}
                    onChange={(e) => setNextServiceDate(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 ${
                      errors.nextServiceDate ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {errors.nextServiceDate && <span className="text-[10px] text-red-500 font-semibold">{errors.nextServiceDate}</span>}
                </div>

                {/* Status Selection */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Operational Completion Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full rounded-lg border border-[#1e293b] bg-[#020617] text-white px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {MAINTENANCE_STATUSES.map(s => (
                      <option key={s} value={s} className="bg-[#0f172a]">{s}</option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="mt-6 flex items-center justify-end space-x-2 border-t border-[#1e293b] pt-4.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-lg border border-[#1e293b] bg-transparent px-4 py-2.5 text-xs font-semibold text-[#f8fafc] hover:bg-[#1e293b] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition-colors"
                  id="submit-log-btn"
                >
                  {editLog ? 'Update log' : 'Log Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteId && (() => {
        const targetLog = logs.find(l => l.id === deleteId);
        if (!targetLog) return null;
        const comp = computers.find(c => c.id === targetLog.computerId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl border border-[#1e293b] bg-[#0f172a] p-6 shadow-2xl animate-in fade-in zoom-in duration-150 text-white">
              <div className="mb-3 flex items-start space-x-2.5 text-red-400">
                <ShieldAlert className="h-5.5 w-5.5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-white">Remove Maintenance Log</h3>
                  <p className="text-xs text-[#94a3b8] mt-0.5">Are you completely sure you want to delete maintenance record <b className="text-white">#{targetLog.id.toUpperCase()}</b>?</p>
                </div>
              </div>

              <div className="bg-[#020617] p-3 rounded-lg border border-[#1e293b] text-[11px] text-slate-300 space-y-1 font-medium mb-4">
                <div><b className="text-slate-500">Date:</b> {formatDate(targetLog.date)}</div>
                <div><b className="text-slate-500">Asset:</b> {comp ? comp.assetTag : 'Deleted Asset'}</div>
                <div><b className="text-slate-500">Log:</b> "{targetLog.description.substring(0,68)}..."</div>
              </div>

              <div className="flex items-center justify-end space-x-2 border-t border-[#1e293b] pt-3.5">
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  className="rounded-lg border border-[#1e293b] bg-transparent px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-[#1e293b] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="rounded-lg bg-red-650 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-700 shadow-sm transition-colors"
                  id="confirm-delete-log-btn"
                >
                  Permanently Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <DellLookupModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
        initialServiceTag={lookupServiceTag}
        onPopulate={handleDellPartsPopulate}
      />

    </div>
  );
}

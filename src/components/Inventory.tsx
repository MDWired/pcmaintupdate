import React, { useState } from 'react';
import { Computer, MaintenanceLog, UserRole } from '../types';
import DellLookupModal from './DellLookupModal';
import { 
  Plus, Search, Filter, Trash2, Edit3, Eye, 
  MapPin, ShieldAlert, BadgeInfo, Calendar, 
  Download, RefreshCw, X, Shield, Wrench, User,
  CheckCircle, Hammer, Laptop, AlertTriangle
} from 'lucide-react';
import { isWarrantyExpired, formatDate, formatCurrency, exportComputersToCSV } from '../utils';

interface InventoryProps {
  computers: Computer[];
  logs: MaintenanceLog[];
  currentRole: UserRole;
  onAddComputer: (computer: Omit<Computer, 'id'>) => void;
  onUpdateComputer: (computer: Computer) => void;
  onDeleteComputer: (id: string) => void;
}

export default function Inventory({
  computers,
  logs,
  currentRole,
  onAddComputer,
  onUpdateComputer,
  onDeleteComputer,
}: InventoryProps) {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [warrantyFilter, setWarrantyFilter] = useState('All'); // All, Active, Expired

  // Selected computer for full details & history logs
  const [selectedComputerId, setSelectedComputerId] = useState<string | null>(null);

  // Form Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editComputer, setEditComputer] = useState<Computer | null>(null);

  // Form Field state
  const [assetTag, setAssetTag] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [makeModel, setMakeModel] = useState('');
  const [os, setOs] = useState('');
  const [assignedUser, setAssignedUser] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [location, setLocation] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyExpiration, setWarrantyExpiration] = useState('');
  const [status, setStatus] = useState<'Active' | 'Retired' | 'In Repair'>('Active');
  
  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Deletion Modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteInputVerify, setDeleteInputVerify] = useState('');

  // Dell warranty lookup state
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [lookupServiceTag, setLookupServiceTag] = useState('');

  const handleDellPopulate = (result: { model: string; purchaseDate: string; warrantyExpiration: string; serialNumber: string }) => {
    setMakeModel(result.model);
    setPurchaseDate(result.purchaseDate);
    setWarrantyExpiration(result.warrantyExpiration);
    setSerialNumber(result.serialNumber);
  };

  // Default Departments
  const DEPARTMENTS = ['Engineering', 'Operations', 'Marketing', 'Sales', 'Human Resources', 'Finance'];
  const OS_PRESETS = ['Windows 11 Pro', 'macOS Sonoma 14.5', 'macOS Ventura 13.4', 'Ubuntu 22.04 LTS', 'RedHat Enterprise Linux'];

  // Permissions Checkers
  const isWritable = currentRole === 'Admin'; // Technicians and viewers are read-only on assets

  // Trigger forms
  const openAddModal = () => {
    setEditComputer(null);
    setAssetTag(`IT-COMP-0${computers.length + 1}`);
    setSerialNumber('');
    setMakeModel('');
    setOs('Windows 11 Pro');
    setAssignedUser('');
    setDepartment('Engineering');
    setLocation('HQ - Floor 1');
    setPurchaseDate('2025-01-01');
    setWarrantyExpiration('2028-01-01');
    setStatus('Active');
    setErrors({});
    setIsFormOpen(true);
  };

  const openEditModal = (comp: Computer, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening history drawer
    setEditComputer(comp);
    setAssetTag(comp.assetTag);
    setSerialNumber(comp.serialNumber);
    setMakeModel(comp.makeModel);
    setOs(comp.os);
    setAssignedUser(comp.assignedUser);
    setDepartment(comp.department);
    setLocation(comp.location);
    setPurchaseDate(comp.purchaseDate);
    setWarrantyExpiration(comp.warrantyExpiration);
    setStatus(comp.status);
    setErrors({});
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    const newErrors: { [key: string]: string } = {};
    if (!assetTag.trim()) newErrors.assetTag = 'Asset Tag is required.';
    else if (!/^[\w-]+$/.test(assetTag)) newErrors.assetTag = 'Alphanumeric letters, dashes, and underscores only.';
    else if (!editComputer && computers.some(c => c.assetTag.toLowerCase() === assetTag.toLowerCase().trim())) {
      newErrors.assetTag = 'Asset Tag must be globally unique.';
    }

    if (!serialNumber.trim()) newErrors.serialNumber = 'Serial Number is required.';
    if (!makeModel.trim()) newErrors.makeModel = 'Make/Model details are required.';
    if (!os.trim()) newErrors.os = 'OS specification is required.';
    if (!assignedUser.trim()) newErrors.assignedUser = 'An assigned custodian username is required.';
    if (!location.trim()) newErrors.location = 'Physical asset location is required.';
    if (!purchaseDate) newErrors.purchaseDate = 'Purchase date is required.';
    if (!warrantyExpiration) newErrors.warrantyExpiration = 'Warranty expiration date is required.';

    if (purchaseDate && warrantyExpiration && warrantyExpiration < purchaseDate) {
      newErrors.warrantyExpiration = 'Warranty expiration cannot be earlier than purchase date.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      assetTag: assetTag.trim(),
      serialNumber: serialNumber.trim(),
      makeModel: makeModel.trim(),
      os: os.trim(),
      assignedUser: assignedUser.trim(),
      department,
      location: location.trim(),
      purchaseDate,
      warrantyExpiration,
      status,
    };

    if (editComputer) {
      onUpdateComputer({ ...payload, id: editComputer.id });
    } else {
      onAddComputer(payload);
    }

    setIsFormOpen(false);
  };

  const handleDeleteTrigger = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid history drawer opening
    setDeleteConfirmId(id);
    setDeleteInputVerify('');
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmId) return;
    const targetComp = computers.find(c => c.id === deleteConfirmId);
    if (!targetComp) return;

    if (deleteInputVerify.trim() !== targetComp.assetTag) {
      alert(`Verification mismatched. Please type "${targetComp.assetTag}" to delete.`);
      return;
    }

    onDeleteComputer(deleteConfirmId);
    setDeleteConfirmId(null);
    if (selectedComputerId === deleteConfirmId) {
      setSelectedComputerId(null);
    }
  };

  // Searching and Filtering calculations
  const filteredComputers = computers.filter(comp => {
    // Search query matches Asset Tag, Serial, Make, or Owner Name
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      comp.assetTag.toLowerCase().includes(query) ||
      comp.serialNumber.toLowerCase().includes(query) ||
      comp.makeModel.toLowerCase().includes(query) ||
      comp.assignedUser.toLowerCase().includes(query);

    const matchesDept = deptFilter === 'All' || comp.department === deptFilter;
    const matchesStatus = statusFilter === 'All' || comp.status === statusFilter;
    
    // Warranty status filters
    const isExpired = isWarrantyExpired(comp.warrantyExpiration);
    const matchesWarranty = 
      warrantyFilter === 'All' ||
      (warrantyFilter === 'Expired' && isExpired) ||
      (warrantyFilter === 'Active' && !isExpired);

    return matchesSearch && matchesDept && matchesStatus && matchesWarranty;
  });

  const selectedComputer = selectedComputerId ? computers.find(c => c.id === selectedComputerId) : null;
  const selectedComputerLogs = selectedComputerId 
    ? logs.filter(l => l.computerId === selectedComputerId).sort((a,b) => b.date.localeCompare(a.date))
    : [];

  const statusColors = {
    Active: 'bg-[#065f46]/30 text-emerald-400 border-emerald-500/20',
    Retired: 'bg-[#0f172a] text-slate-400 border-[#1e293b]',
    'In Repair': 'bg-[#78350f]/20 text-[#fbbf24] border-amber-500/10',
  };

  return (
    <div className="space-y-6" id="inventory-view-root">
      
      {/* Header operations */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white animate-in slide-in-from-left duration-200">Computer Fleet Asset Ledger</h2>
          <p className="text-sm text-[#94a3b8]">Track company machines, assignments, warranties, operational status, and health indexes.</p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Export action */}
          <button
            onClick={() => exportComputersToCSV(computers)}
            className="flex items-center space-x-1.5 rounded-lg border border-[#1e293b] bg-[#0f172a] px-3.5 py-2 text-xs font-semibold text-slate-300 shadow-sm hover:bg-[#1e293b] hover:text-white transition-colors"
            title="Download full fleet spreadsheet as CSV"
          >
            <Download className="h-4 w-4" />
            <span>Export Fleet</span>
          </button>
          
          {/* Add computer trigger */}
          {isWritable ? (
            <button
              onClick={openAddModal}
              className="flex items-center space-x-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              id="add-computer-btn"
            >
              <Plus className="h-4 w-4" />
              <span>Add Computer</span>
            </button>
          ) : (
            <div 
              className="inline-flex items-center space-x-1.5 rounded-lg bg-[#020617]/30 px-4 py-2 text-xs font-medium text-[#94a3b8] border border-[#1e293b] cursor-not-allowed"
              title="Only Admins possess write access for computer configurations."
            >
              <Shield className="h-4.5 w-4.5 text-[#64748b]" />
              <span>Asset Locked (Read-Only)</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid containing central table & secondary side details pane */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Computer fleet ledger list table */}
        <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] shadow-sm lg:col-span-2 overflow-hidden">
          
          {/* Query, Search, Filters Area */}
          <div className="border-b border-[#1e293b] p-4.5 space-y-3 bg-[#020617]/40">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              
              {/* Search text input */}
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search tag, model, serial, or user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-[#1e293b] bg-[#020617] py-2 pl-9.5 pr-4 text-xs text-white placeholder-slate-500 outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-colors"
                  id="search-computers-input"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs">
                    Clear
                  </button>
                )}
              </div>

              {/* Department Option Dropdown */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500 font-bold uppercase">Dept:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="rounded-lg border border-[#1e293b] bg-[#020617]/85 text-[#f8fafc] py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                >
                  <option value="All" className="bg-[#0f172a]">All Departments</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d} className="bg-[#0f172a]">{d}</option>
                  ))}
                </select>
              </div>

              {/* Status Option Dropdown */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500 font-bold uppercase">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-[#1e293b] bg-[#020617]/85 text-[#f8fafc] py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                >
                  <option value="All" className="bg-[#0f172a]">All Statuses</option>
                  <option value="Active" className="bg-[#0f172a]">Active</option>
                  <option value="In Repair" className="bg-[#0f172a]">In Repair</option>
                  <option value="Retired" className="bg-[#0f172a]">Retired</option>
                </select>
              </div>
            </div>

            {/* Custom Extra Filter: Warranty expirations toggling */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#1e293b]">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Manufacturer Warranty:</span>
              <button
                onClick={() => setWarrantyFilter('All')}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                  warrantyFilter === 'All' 
                    ? 'bg-blue-900/40 text-blue-400 border-blue-500/30' 
                    : 'bg-[#1e293b]/50 text-[#94a3b8] border-[#1e293b] hover:bg-[#1e293b] hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setWarrantyFilter('Active')}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                  warrantyFilter === 'Active' 
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' 
                    : 'bg-[#1e293b]/50 text-[#94a3b8] border-[#1e293b] hover:bg-[#1e293b] hover:text-white'
                }`}
              >
                Active Only
              </button>
              <button
                onClick={() => setWarrantyFilter('Expired')}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                  warrantyFilter === 'Expired' 
                    ? 'bg-rose-950/40 text-rose-450 border-rose-500/30' 
                    : 'bg-[#1e293b]/50 text-[#94a3b8] border-[#1e293b] hover:bg-[#1e293b] hover:text-white'
                }`}
              >
                Expired Warranty
              </button>
            </div>
            
            <div className="text-[11px] text-slate-500 flex justify-between items-center px-1">
              <span>Showing <b>{filteredComputers.length}</b> of <b>{computers.length}</b> computers.</span>
              {(searchQuery || deptFilter !== 'All' || statusFilter !== 'All' || warrantyFilter !== 'All') && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setDeptFilter('All');
                    setStatusFilter('All');
                    setWarrantyFilter('All');
                  }}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {filteredComputers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <Laptop className="h-12 w-12 text-[#1e293b] mb-2 animate-pulse" />
                <span className="text-sm font-semibold text-slate-200">No computers found matching filter criteria</span>
                <span className="text-xs text-[#94a3b8] mt-1">Try relaxing terms, spelling checks, or clearing constraints.</span>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1e293b] bg-[#020617]/40 text-[#64748b] font-semibold">
                    <th className="py-3 px-4">Asset Tag</th>
                    <th className="py-3 px-4">Make / Model</th>
                    <th className="py-3 px-4">Custodian & Dept</th>
                    <th className="py-3 px-4">Warranty</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/40">
                  {filteredComputers.map(comp => {
                    const isExp = isWarrantyExpired(comp.warrantyExpiration);
                    const isSelected = selectedComputerId === comp.id;
                    
                    return (
                      <tr 
                        key={comp.id} 
                        onClick={() => setSelectedComputerId(isSelected ? null : comp.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-[#1e293b]/45 hover:bg-[#1e293b]/55' 
                            : 'hover:bg-[#1e293b]/20'
                        }`}
                        id={`comp-row-${comp.id}`}
                      >
                        {/* Asset Tag & Serial */}
                        <td className="py-3 px-4 font-semibold text-white font-mono">
                          <div>{comp.assetTag}</div>
                          <div className="text-[10px] text-[#94a3b8] font-normal">S/N: {comp.serialNumber}</div>
                        </td>
                        
                        {/* Make & model */}
                        <td className="py-3 px-4 font-medium text-slate-300">
                          <div className="truncate max-w-44 font-semibold text-slate-200">{comp.makeModel}</div>
                          <div className="text-[10px] text-slate-400 font-normal truncate max-w-44">{comp.os}</div>
                        </td>
                        
                        {/* Custodian User Name & Dept */}
                        <td className="py-3 px-4 text-[#94a3b8]">
                          <div className="font-semibold text-slate-200">{comp.assignedUser}</div>
                          <div className="text-[10px] text-slate-500">{comp.department}</div>
                        </td>
                        
                        {/* Warranty status badge */}
                        <td className="py-3 px-4">
                          <div className="font-mono text-slate-300 text-[11px] font-semibold">{formatDate(comp.warrantyExpiration)}</div>
                          {isExp && comp.status !== 'Retired' ? (
                            <span className="inline-flex items-center text-[9px] text-[#f43f5e] font-semibold uppercase tracking-wider leading-none mt-0.5">
                              ⚠️ Expired Warranty
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[9px] text-emerald-400 font-semibold leading-none mt-0.5">
                              ✓ Secure Coverage
                            </span>
                          )}
                        </td>
                        
                        {/* Status indicators */}
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${statusColors[comp.status]}`}>
                            {comp.status}
                          </span>
                        </td>
                        
                        {/* Actions operations */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => setSelectedComputerId(isSelected ? null : comp.id)}
                              className="rounded p-1 text-slate-400 hover:bg-[#1e293b]/70 hover:text-white transition-colors"
                              title="Inspect specifications and full maintenance history logs"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            {isWritable && (
                              <>
                                <button
                                  onClick={(e) => openEditModal(comp, e)}
                                  className="rounded p-1 text-slate-400 hover:bg-[#1e293b]/70 hover:text-blue-400 transition-colors"
                                  title="Edit computer hardware or assignment details"
                                  id={`edit-comp-${comp.id}`}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteTrigger(comp.id, e)}
                                  className="rounded p-1 text-[#94a3b8] hover:bg-[#1e293b]/70 hover:text-rose-450 transition-colors"
                                  title="Retain or wipe asset profile from local records"
                                  id={`delete-comp-${comp.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
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

        {/* Assets History Sidebar Panel Drawer */}
        <div className="flex flex-col space-y-4" id="details-panel-drawer">
          
          <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-5 shadow-sm min-h-[460px] flex flex-col">
            {!selectedComputer ? (
              <div className="my-auto flex flex-col items-center justify-center text-center p-6 text-[#94a3b8]">
                <Laptop className="h-10 w-10 text-[#1e293b] mb-2 animate-pulse" />
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Inspection Workspace</h4>
                <p className="text-[11px] text-[#94a3b8] max-w-44 mt-1">Select any machine on the ledger list to analyze its detailed history, active logs, and warranties.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-4.5">
                
                {/* Header info */}
                <div className="flex items-start justify-between border-b border-[#1e293b] pb-3">
                  <div>
                    <span className="inline-block rounded bg-blue-900/30 px-1.5 py-0.5 text-[10px] font-mono font-bold text-blue-400 mb-1 border border-blue-500/20">
                      {selectedComputer.assetTag}
                    </span>
                    <h3 className="font-bold text-white text-sm leading-tight">{selectedComputer.makeModel}</h3>
                    <p className="text-[10px] text-slate-500 font-mono">S/N: {selectedComputer.serialNumber}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedComputerId(null)}
                    className="rounded p-1 text-slate-500 hover:bg-[#1e293b] hover:text-[#f8fafc] transition-colors"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Specs metadata details block */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-[#020617]/50 p-3 rounded-xl border border-[#1e293b]">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Custodian Assignee</span>
                    <span className="font-semibold text-slate-200 flex items-center space-x-0.5 mt-0.5">
                      <User className="h-3 w-3 text-slate-500" />
                      <span>{selectedComputer.assignedUser}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Department Location</span>
                    <span className="font-medium text-slate-300 mt-0.5 block">{selectedComputer.department}</span>
                  </div>
                  
                  <div className="col-span-2 border-t border-[#1e293b] pt-2 mt-1">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Physical Desk Location</span>
                    <span className="font-medium text-slate-300 mt-0.5 flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-slate-500" />
                      <span>{selectedComputer.location}</span>
                    </span>
                  </div>

                  <div className="border-t border-[#1e293b] pt-2 mt-1 col-span-2 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Purchase Incept</span>
                      <span className="font-mono font-medium text-slate-400 mt-0.5 block">{formatDate(selectedComputer.purchaseDate)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Warranty End</span>
                      <span className="font-mono font-medium text-slate-400 mt-0.5 block">{formatDate(selectedComputer.warrantyExpiration)}</span>
                    </div>
                  </div>

                  {/* Dell Warranty Lookup action button in computer detail panel */}
                  <button
                    type="button"
                    onClick={() => {
                      setLookupServiceTag(selectedComputer.serialNumber);
                      setIsLookupOpen(true);
                    }}
                    className="col-span-2 mt-1.5 w-full flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-blue-500/20 bg-blue-950/20 hover:bg-blue-900/30 text-blue-400 transition-colors"
                  >
                    <Laptop className="h-3.5 w-3.5" />
                    <span>Lookup Dell Warranty &amp; Parts</span>
                  </button>
                </div>

                {/* Specific computer maintenance logs */}
                <div className="flex-1 flex flex-col">
                  <div className="mb-2 flex items-center justify-between border-t border-[#1e293b] pt-3">
                    <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">Maintenance History ({selectedComputerLogs.length})</span>
                    <span className="text-[10px] font-semibold text-slate-500">Chronological</span>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-48 pr-1 space-y-2 lg:max-h-72">
                    {selectedComputerLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center text-[#94a3b8] border border-dashed border-[#1e293b] rounded-xl">
                        <Wrench className="h-6 w-6 text-slate-700 mb-1" />
                        <span className="text-[11px] font-medium text-slate-300">No events logged</span>
                        <span className="text-[9px] text-[#94a3b8] max-w-32 mt-0.5">This unit hasn't undergone any logged service.</span>
                      </div>
                    ) : (
                      selectedComputerLogs.map(log => {
                        return (
                          <div key={log.id} className="rounded-lg border border-[#1e293b] p-2 text-[11px] bg-[#020617]/40 hover:bg-[#1e293b]/45 transition-colors">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono text-slate-500 font-bold">{formatDate(log.date)}</span>
                              <span className={`inline-flex items-center rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                                log.status === 'Completed' ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-500/20' : 
                                log.status === 'In Progress' ? 'bg-amber-950/40 text-amber-500 border border-amber-200/20' : 
                                'bg-blue-950/40 text-blue-400 border border-blue-200/40'
                              }`}>
                                {log.status}
                              </span>
                            </div>
                            <div className="font-semibold text-slate-200">
                              [{log.maintenanceType}] by {log.technicianName}
                            </div>
                            <div className="text-slate-400 line-clamp-2 mt-0.5" title={log.description}>
                              {log.description}
                            </div>
                            {(log.cost > 0 || log.partsUsed !== 'None') && (
                              <div className="mt-1 flex items-center justify-between border-t border-[#1e293b]/55 pt-1 text-[10px] text-slate-500">
                                <span>Parts: <b className="text-slate-400">{log.partsUsed.substring(0, 18)}...</b></span>
                                {log.cost > 0 && <span className="font-semibold text-white">{formatCurrency(log.cost)}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>

      {/* CREATE / UPDATE MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3.5">
              <h3 className="text-base font-bold text-slate-900" id="computer-modal-title">
                {editComputer ? `Modify Asset: ${editComputer.assetTag}` : 'Log New Computer Asset'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4" id="computer-asset-form">
              <div className="grid grid-cols-2 gap-3.5">
                
                {/* Asset Tag */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Asset ID Tag</label>
                  <input
                    type="text"
                    value={assetTag}
                    onChange={(e) => setAssetTag(e.target.value)}
                    placeholder="e.g. IT-COMP-001"
                    className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 ${
                      errors.assetTag ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {errors.assetTag && <span className="text-[10px] text-red-500 font-semibold">{errors.assetTag}</span>}
                </div>

                {/* Serial Number */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">MFR Serial Number</label>
                    <button
                      type="button"
                      onClick={() => {
                        setLookupServiceTag(serialNumber);
                        setIsLookupOpen(true);
                      }}
                      className="text-[10px] text-blue-600 hover:text-blue-700 font-bold hover:underline focus:outline-none"
                    >
                      Lookup Dell Tag
                    </button>
                  </div>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="S/N: C02..."
                    className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 ${
                      errors.serialNumber ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {errors.serialNumber && <span className="text-[10px] text-red-500 font-semibold">{errors.serialNumber}</span>}
                </div>

                {/* Make & Model */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Manufacturer Make & Model</label>
                  <input
                    type="text"
                    value={makeModel}
                    onChange={(e) => setMakeModel(e.target.value)}
                    placeholder="e.g. Apple MacBook Pro 14 M3, Dell Latitude 5540"
                    className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 ${
                      errors.makeModel ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {errors.makeModel && <span className="text-[10px] text-red-500 font-semibold">{errors.makeModel}</span>}
                </div>

                {/* OS specs */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Operating System</label>
                  <input
                    type="text"
                    list="os-options"
                    value={os}
                    onChange={(e) => setOs(e.target.value)}
                    placeholder="e.g. Windows 11 Pro"
                    className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 ${
                      errors.os ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  <datalist id="os-options">
                    {OS_PRESETS.map(p => <option key={p} value={p} />)}
                  </datalist>
                  {errors.os && <span className="text-[10px] text-red-500 font-semibold">{errors.os}</span>}
                </div>

                {/* Custodian user name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Assigned User (Custodian)</label>
                  <input
                    type="text"
                    value={assignedUser}
                    onChange={(e) => setAssignedUser(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 ${
                      errors.assignedUser ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {errors.assignedUser && <span className="text-[10px] text-red-500 font-semibold">{errors.assignedUser}</span>}
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Business Unit Dept</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Asset physical location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. HQ - Lab A (Office 402)"
                    className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 ${
                      errors.location ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {errors.location && <span className="text-[10px] text-red-500 font-semibold">{errors.location}</span>}
                </div>

                {/* Purchase Date */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Procurement Incept Date</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 ${
                      errors.purchaseDate ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {errors.purchaseDate && <span className="text-[10px] text-red-500 font-semibold">{errors.purchaseDate}</span>}
                </div>

                {/* Warranty Term end */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Warranty Expiration Terms</label>
                  <input
                    type="date"
                    value={warrantyExpiration}
                    onChange={(e) => setWarrantyExpiration(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 ${
                      errors.warrantyExpiration ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {errors.warrantyExpiration && <span className="text-[10px] text-red-500 font-semibold">{errors.warrantyExpiration}</span>}
                </div>

                {/* Status selection */}
                <div className="col-span-2 space-y-1 pt-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Operational State status</label>
                  <div className="flex items-center gap-3">
                    {['Active', 'In Repair', 'Retired'].map((st) => {
                      const active = status === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStatus(st as any)}
                          className={`flex-1 rounded-lg border py-2.5 text-xs font-semibold text-center transition-all ${
                            active
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {st === 'In Repair' ? '⚒ In Repair' : st === 'Active' ? '✓ Active' : '⊙ Retired'}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              <div className="mt-6 flex items-center justify-end space-x-2 border-t border-slate-100 pt-4.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition-colors"
                  id="submit-computer-btn"
                >
                  {editComputer ? 'Save Settings' : 'Create Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOUBLE-VERIFICATION DELETE MODAL */}
      {deleteConfirmId && (() => {
        const comp = computers.find(c => c.id === deleteConfirmId);
        if (!comp) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
              <div className="mb-3 flex items-start space-x-3 text-red-600">
                <AlertTriangle className="h-6 w-6 shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Permanent Asset Removal</h3>
                  <p className="text-xs text-slate-500 mt-0.5">This action deletes the computer specification history from records and is absolutely irreversible.</p>
                </div>
              </div>

              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-900 mb-4 font-medium">
                Warning: Erasing computer <b className="font-bold">{comp.assetTag}</b> ({comp.makeModel}) will also disconnect any active maintenance records associated.
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Please type <span className="font-mono text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded text-[10px] font-bold">{comp.assetTag}</span> to confirm removal:
                </label>
                <input
                  type="text"
                  value={deleteInputVerify}
                  onChange={(e) => setDeleteInputVerify(e.target.value)}
                  placeholder="IT-COMP-..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                  id="delete-verify-input"
                />
              </div>

              <div className="mt-6 flex items-center justify-end space-x-2 border-t border-slate-100 pt-4.5">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteInputVerify.trim() !== comp.assetTag}
                  className={`rounded-lg px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all ${
                    deleteInputVerify.trim() === comp.assetTag 
                      ? 'bg-red-600 hover:bg-red-700 cursor-pointer' 
                      : 'bg-red-350 bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  }`}
                  id="confirm-delete-btn"
                >
                  Confirm Delete
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
        onPopulate={handleDellPopulate}
      />

    </div>
  );
}

import React, { useState } from 'react';
import { Shield, Wrench, Eye, Key, Users, Settings as SettingsIcon, Info, CheckCircle, Trash2, Plus, Calendar, ShieldCheck, RefreshCw } from 'lucide-react';
import { UserRole } from '../types';
import { 
  getSavedDellCredentials, saveDellCredentials, clearDellCache 
} from '../utils/dellApi';

export interface TechnicianUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

interface SettingsProps {
  currentRole: UserRole;
  activeTech: TechnicianUser;
  setActiveTech: (tech: TechnicianUser) => void;
  onRefreshData?: () => void;
  onResetData?: () => void;
}

const DEFAULT_TECHNICIANS: TechnicianUser[] = [
  { id: 't1', name: 'Miles Dyson', role: 'Admin', email: 'm.dyson@cyberdyne.com' },
  { id: 't2', name: 'Sarah Connor', role: 'Technician', email: 's.connor@resistance.net' },
  { id: 't3', name: 'John Connor', role: 'Technician', email: 'j.connor@resistance.net' },
  { id: 't4', name: 'Rek Dyson', role: 'Admin', email: 'rek2nd@gmail.com' }
];

export default function Settings({
  currentRole,
  activeTech,
  setActiveTech,
  onResetData,
}: SettingsProps) {
  // 1. Dell Credentials state
  const [clientId, setClientId] = useState(() => getSavedDellCredentials().clientId);
  const [clientSecret, setClientSecret] = useState(() => getSavedDellCredentials().clientSecret);
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>(() => getSavedDellCredentials().environment);
  const [apiSaveSuccess, setApiSaveSuccess] = useState(false);
  const [cacheClearSuccess, setCacheClearSuccess] = useState(false);

  // 2. Team Technicians list state (stored in localStorage)
  const [technicians, setTechnicians] = useState<TechnicianUser[]>(() => {
    const saved = localStorage.getItem('portal_technicians');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    // initialize if empty
    localStorage.setItem('portal_technicians', JSON.stringify(DEFAULT_TECHNICIANS));
    return DEFAULT_TECHNICIANS;
  });

  // 3. User Management Form States
  const [newTechName, setNewTechName] = useState('');
  const [newTechEmail, setNewTechEmail] = useState('');
  const [newTechRole, setNewTechRole] = useState<UserRole>('Technician');
  const [techError, setTechError] = useState('');
  const [techSuccess, setTechSuccess] = useState('');

  // Save Dell credentials
  const handleSaveDellCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    saveDellCredentials({ clientId: clientId.trim(), clientSecret: clientSecret.trim(), environment });
    setApiSaveSuccess(true);
    setTimeout(() => setApiSaveSuccess(false), 3000);
  };

  // Clear warranty API cache
  const handleClearCache = () => {
    clearDellCache();
    setCacheClearSuccess(true);
    setTimeout(() => setCacheClearSuccess(false), 3000);
  };

  // Add a technician (Admin only)
  const handleAddTechnician = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechName.trim() || !newTechEmail.trim()) {
      setTechError('Please provide both a name and an email address.');
      return;
    }

    if (technicians.some(t => t.email.toLowerCase() === newTechEmail.trim().toLowerCase())) {
      setTechError('A technician with that email already exists.');
      return;
    }

    const newTech: TechnicianUser = {
      id: 't' + (technicians.length + 10) + Math.floor(Math.random() * 10),
      name: newTechName.trim(),
      email: newTechEmail.trim(),
      role: newTechRole,
    };

    const updated = [...technicians, newTech];
    setTechnicians(updated);
    localStorage.setItem('portal_technicians', JSON.stringify(updated));

    setNewTechName('');
    setNewTechEmail('');
    setNewTechRole('Technician');
    setTechError('');
    setTechSuccess(`Successfully added ${newTech.name} to the team database.`);
    setTimeout(() => setTechSuccess(''), 4000);
  };

  // Delete a technician (Admin only)
  const handleDeleteTechnician = (id: string) => {
    if (id === activeTech.id) {
      alert('You cannot delete the active logged-in technician profile.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this technical employee? This is irreversible.')) {
      const updated = technicians.filter(t => t.id !== id);
      setTechnicians(updated);
      localStorage.setItem('portal_technicians', JSON.stringify(updated));
    }
  };

  // Handle Logged-In Select Preference
  const handleSelectActiveTech = (techId: string) => {
    const found = technicians.find(t => t.id === techId);
    if (found) {
      setActiveTech(found);
    }
  };

  return (
    <div className="space-y-6" id="settings-view-root">
      
      {/* Intro section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white animate-in slide-in-from-left duration-200">System Preferences & Settings</h2>
        <p className="text-sm text-[#94a3b8]">Configure Dell TechDirect warranty integrations, manage operator permissions, and toggle technician setups.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* DELL API INTEGRATION BOARD */}
        <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-5 shadow-sm text-white space-y-4">
          <h3 className="text-sm font-bold tracking-wider uppercase text-blue-400 flex items-center space-x-1.5 border-b border-[#1e293b]/60 pb-2">
            <Key className="h-4.5 w-4.5" />
            <span>Dell TechDirect credentials</span>
          </h3>

          <form onSubmit={handleSaveDellCredentials} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Dell Application Client ID</label>
              <input
                type="text"
                placeholder="Enter client_id from Dell developer console..."
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-lg border border-[#1e293b] bg-[#020617] px-3 py-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Dell Application Client Secret</label>
              <input
                type="password"
                placeholder="••••••••••••••••••••••••••••••••"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="w-full rounded-lg border border-[#1e293b] bg-[#020617] px-3 py-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Gateway Environment</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as any)}
                  className="w-full rounded-lg border border-[#1e293b] bg-[#020617] text-white px-3 py-2 text-xs outline-none focus:border-blue-500"
                >
                  <option value="sandbox" className="bg-[#0f172a]">Sandbox (Test Server)</option>
                  <option value="production" className="bg-[#0f172a]">Production Gateways</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
                  id="save-dell-api-btn"
                >
                  Save API Keys
                </button>
              </div>
            </div>

            {apiSaveSuccess && (
              <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/20 p-2.5 text-xs text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>Dell API credentials saved. Integration queries will now process through active handshakes.</span>
              </div>
            )}
          </form>

          {/* Local cache management */}
          <div className="border-t border-[#1e293b]/70 pt-4 mt-2 space-y-2.5">
            <h4 className="text-xs font-bold uppercase text-slate-300">Warranty cache controls</h4>
            <div className="flex items-center justify-between gap-4 text-xs">
              <p className="text-[#94a3b8] leading-tight max-w-[280px]">
                We store warranty lookups in local cache to respect Dell query limits and secure ultra-fast load times.
              </p>
              <button
                onClick={handleClearCache}
                className="rounded-lg border border-[#1e293b] bg-[#020617] hover:bg-[#1e293b] px-3.5 py-1.5 text-xs text-slate-300 transition-all font-semibold whitespace-nowrap shrink-0 hover:text-white"
                id="clear-dell-cache-btn"
              >
                Clear API Cache
              </button>
            </div>
            {cacheClearSuccess && (
              <div className="rounded-lg bg-blue-950/20 border border-blue-500/10 p-2 text-xs text-blue-400 flex items-center space-x-1">
                <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
                <span>Warranty local storage cache flushed successfully.</span>
              </div>
            )}
          </div>
        </div>

        {/* LOGGED IN TECHNICIAN & USER PREFERENCES */}
        <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-5 shadow-sm text-white flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-blue-400 flex items-center space-x-1.5 border-b border-[#1e293b]/60 pb-2">
              <SettingsIcon className="h-4.5 w-4.5" />
              <span>Operator Preferences</span>
            </h3>

            <div className="space-y-4 pt-3">
              <div className="rounded-xl bg-[#020617] p-4 border border-[#1e293b] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wide">Active Portal Operator</span>
                  <span className="font-bold text-white text-sm mt-1 block">{activeTech.name}</span>
                  <span className="text-[11px] text-[#94a3b8] font-mono mt-0.5 block">{activeTech.email}</span>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-900/30 text-blue-400 font-bold border border-blue-500/20 text-lg">
                  {activeTech.name.split(' ').map(n=>n[0]).join('')}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Workstation Session Lock</span>
                <div className="text-xs text-[#94a3b8] leading-normal bg-[#020617] p-3 rounded-lg border border-[#1e293b] space-y-2">
                  <p>
                    Your console session is actively signed-in and locked. Profile switches are protected to protect integrity and preserve system logs.
                  </p>
                  <p className="font-semibold text-slate-350">
                    To audit under a different technician handle, sign out of the portal and authenticate under their corporate credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-blue-950/20 border border-blue-500/10 p-3.5 flex items-start space-x-2.5 text-xs text-blue-300 leading-relaxed mt-4">
            <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <b className="text-blue-200 block mb-0.5">Session Security Policy</b>
              Enterprise authorization levels (Admin vs. Technician) are determined by your registered system role inside the team member registry schema.
            </div>
          </div>
        </div>

        {/* TEAM USER MANAGEMENT (ADMIN ONLY) */}
        <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-5 shadow-sm text-white col-span-1 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e293b]/60 pb-2 flex-wrap gap-2">
            <h3 className="text-sm font-bold tracking-wider uppercase text-blue-400 flex items-center space-x-1.5">
              <Users className="h-4.5 w-4.5" />
              <span>Team member user registry</span>
            </h3>
            <span className="inline-flex items-center rounded bg-[#1e293b] px-2 py-0.5 text-[10px] font-mono font-bold text-slate-300">
              Admin Only Access
            </span>
          </div>

          {currentRole !== 'Admin' ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-[#94a3b8] rounded-xl border border-dashed border-[#1e293b] bg-[#020617]/30">
              <Shield className="h-10 w-10 text-slate-700 mb-2" />
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-205">Access Unauthorized</h5>
              <p className="text-[11px] text-slate-400 max-w-sm mt-1 leading-normal">
                Your currently selected Interactive Role is <b>{currentRole}</b>. Only authorized Portal Administrators can manage corporate team credentials. Toggle role settings in the sidebar first.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form to Add Technician */}
              <div className="p-4 rounded-xl border border-[#1e293b] bg-[#020617]/50 space-y-3.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-1.5">
                  <Plus className="h-4 w-4 text-blue-400" />
                  <span>Register Technician</span>
                </h4>

                <form onSubmit={handleAddTechnician} className="space-y-3">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Employee name</label>
                    <input
                      type="text"
                      placeholder="e.g. Connor MacLeod"
                      value={newTechName}
                      onChange={(e) => setNewTechName(e.target.value)}
                      className="w-full rounded-lg border border-[#1e293b] bg-[#020617] px-2.5 py-1.5 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Corporate Email</label>
                    <input
                      type="email"
                      placeholder="e.g. c.macleod@corp.com"
                      value={newTechEmail}
                      onChange={(e) => setNewTechEmail(e.target.value)}
                      className="w-full rounded-lg border border-[#1e293b] bg-[#020617] px-2.5 py-1.5 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">System Authorization Role</label>
                    <select
                      value={newTechRole}
                      onChange={(e) => setNewTechRole(e.target.value as UserRole)}
                      className="w-full rounded-lg border border-[#1e293b] bg-[#020617] text-white px-2.5 py-1.5 text-xs outline-none"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Technician">Technician</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>

                  {techError && <div className="text-[10px] text-red-400 font-bold">{techError}</div>}
                  {techSuccess && <div className="text-[10px] text-emerald-450 font-bold">{techSuccess}</div>}

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-1.5 transition-colors mt-2"
                    id="add-tech-btn"
                  >
                    Add Employee
                  </button>
                </form>
              </div>

              {/* Roster list */}
              <div className="col-span-1 md:col-span-2 overflow-x-auto border border-[#1e293b] rounded-xl bg-[#020617]/20">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#1e293b] text-slate-500 bg-[#020617]/50">
                      <th className="py-2 px-3 font-semibold text-[10px] uppercase">Roster Name</th>
                      <th className="py-2 px-3 font-semibold text-[10px] uppercase">System Email</th>
                      <th className="py-2 px-3 font-semibold text-[10px] uppercase text-center">Assigned Role</th>
                      <th className="py-2 px-3 font-semibold text-[10px] uppercase text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/40">
                    {technicians.map((t) => (
                      <tr key={t.id} className="hover:bg-[#1e293b]/10 text-slate-300">
                        <td className="py-2 px-3 font-semibold text-white">{t.name}</td>
                        <td className="py-2 px-3 text-[#94a3b8] font-mono text-[11px]">{t.email}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.2 text-[9px] font-bold border ${
                            t.role === 'Admin' ? 'bg-blue-900/30 text-blue-400 border-blue-500/20' :
                            t.role === 'Technician' ? 'bg-amber-950/30 text-amber-500 border-amber-500/10' :
                            'bg-gray-900 text-slate-450 border-slate-700/60'
                          }`}>
                            {t.role}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleDeleteTechnician(t.id)}
                            disabled={t.id === activeTech.id}
                            className={`rounded p-1 text-slate-500 ${
                              t.id === activeTech.id ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#1e293b] hover:text-rose-450'
                            }`}
                            title="Remove technician"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* DB CONTROLS (ADMIN ONLY) */}
        {currentRole === 'Admin' && onResetData && (
          <div className="rounded-xl border border-red-900/30 bg-[#0f172a] p-5 shadow-sm text-white col-span-1 lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold tracking-wider uppercase text-red-500/80 flex items-center space-x-1.5 border-b border-red-900/20 pb-2">
              <RefreshCw className="h-4.5 w-4.5" />
              <span>System database toolset (Admin Access Only)</span>
            </h3>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <p className="text-slate-200 font-bold">Hard Reset / Restore Sample Records</p>
                <p className="text-[#94a3b8] leading-tight max-w-xl">
                  Flushes the localized database storage and replaces all active assets with the original 5 corporate computer nodes and 10 default maintenance logs. This will overwrite any custom adjustments.
                </p>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Are you absolutely sure you want to reset the entire database? All customized logs and added computers will be lost.')) {
                    onResetData();
                    alert('Sample database successfully restored.');
                  }
                }}
                className="rounded-lg bg-red-950/20 hover:bg-red-900/40 border border-red-500/30 hover:border-red-500/85 px-4 py-2.5 text-xs text-red-200 transition-all font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                id="reset-db-btn"
              >
                Restore Core Database Defaults
              </button>
            </div>
          </div>
        )}

        {/* INSTRUCTIONS SECURE API ACCESS */}
        <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-5 shadow-sm text-white space-y-3 col-span-1 lg:col-span-2">
          <h3 className="text-sm font-bold tracking-wider uppercase text-blue-450 flex items-center space-x-1.5 border-b border-[#1e293b]/60 pb-2">
            <Info className="h-4.5 w-4.5 text-blue-400" />
            <span>Dell Warranty lookup setup guide</span>
          </h3>
          
          <div className="text-xs text-slate-400 leading-relaxed space-y-2.5">
            <p>
              To query genuine enterprise specifications and real warranty records straight from Dell, follow these onboarding steps to register and obtain credentials:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-[#94a3b8] pl-1.5">
              <li>
                Visit the <b className="text-slate-200">Dell TechDirect Portal</b> at <a href="https://techdirect.dell.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">techdirect.dell.com</a> and sign in with complex corporate partner profiles.
              </li>
              <li>
                Request onboarding permission to the <b className="text-slate-200">Dell Warranty & Asset API</b> from the integrations workspace console.
              </li>
              <li>
                Once approved, create a developer application inside the portal to instantly generate your private <b className="text-[#38bdf8] font-mono text-[11px]">Client ID</b> and <b className="text-[#38bdf8] font-mono text-[11px]">Client Secret</b> keypair.
              </li>
              <li>
                Enter your private keys into the credential forms above, specify the corresponding sandbox/production switch representing your gateway access layer, and save changes.
              </li>
            </ol>
            <div className="p-3 bg-blue-950/20 border border-blue-500/10 rounded-xl mt-2 flex items-start space-x-2.5">
              <ShieldCheck className="h-5 w-5 text-emerald-450 shrink-0 mt-0.5" />
              <div>
                <b className="text-slate-200 font-semibold block mb-0.5">Sandboxed Fallback Safety (CORS Resilient)</b>
                In preview environments, browsers strictly protect CORS, causing most client-to-Dell queries to be blocked unless run from dedicated servers. Our smart Client bypasses this restriction by gracefully activating a localized Sandbox simulation. This provides deterministic, sample specifications immediately for any 7-character code entered, facilitating perfect testing.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

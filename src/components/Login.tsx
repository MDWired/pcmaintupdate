import React, { useState } from 'react';
import { Mail, Key, LogIn, Laptop, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';
import { TechnicianUser } from './Settings';

interface LoginProps {
  onLogin: (tech: TechnicianUser) => void;
}

export default function Login({ onLogin }: LoginProps) {
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Get current technicians from localStorage
  const getTechnicians = (): TechnicianUser[] => {
    const saved = localStorage.getItem('portal_technicians');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 't4', name: 'Rek Dyson', role: 'Admin', email: 'rek2nd@gmail.com' },
      { id: 't1', name: 'Miles Dyson', role: 'Admin', email: 'm.dyson@cyberdyne.com' },
      { id: 't2', name: 'Sarah Connor', role: 'Technician', email: 's.connor@resistance.net' },
      { id: 't3', name: 'John Connor', role: 'Technician', email: 'j.connor@resistance.net' }
    ];
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Please enter both email and password.');
      return;
    }

    const roster = getTechnicians();
    const found = roster.find(t => t.email.toLowerCase() === loginEmail.trim().toLowerCase());

    if (!found) {
      setLoginError('User email address not found in the operator directory. Contact your Portal Administrator to create your credentials.');
      return;
    }

    // Since this is a local interactive portal, password must be non-empty and at least 4 characters.
    if (loginPassword.length < 4) {
      setLoginError('Password must be at least 4 characters.');
      return;
    }

    // Success login
    onLogin(found);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020617] text-[#f8fafc] px-4 py-12 select-none" id="login-container">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#020617] to-[#020617] -z-10 pointer-events-none" />
      
      {/* Brand Header */}
      <div className="mb-8 text-center" id="login-brand">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/20 border border-blue-400/30 mb-4 animate-bounce">
          <Laptop className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-none">FleetLog IT</h1>
        <p className="text-sm text-[#94a3b8] mt-1.5 font-medium">Corporate Computer Maintenance Portal</p>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md rounded-2xl border border-[#1e293b] bg-[#0f172a] shadow-xl p-6 sm:p-8 space-y-6" id="login-auth-card">
        
        <div className="text-center pb-2 border-b border-[#1e293b]/60">
          <h2 className="text-sm font-bold tracking-wider uppercase text-blue-400 flex items-center justify-center space-x-1.5">
            <LogIn className="h-4 w-4" />
            <span>Operator Sign In</span>
          </h2>
        </div>

        {/* SIGN IN FORM */}
        <form onSubmit={handleLoginSubmit} className="space-y-4" id="signin-form">
          <div>
            <label className="block text-xs font-bold text-[#94a3b8] uppercase tracking-wider mb-2">Operator Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#64748b]">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="reky_dyson@company.com"
                className="w-full rounded-lg border border-[#1e293b] bg-[#020617] py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-550 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Access PIN / Password</label>
              <span className="text-[10px] text-slate-500">Secure Protocol</span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#64748b]">
                <Key className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#1e293b] bg-[#020617] py-2.5 pl-10 pr-10 text-sm text-slate-200 placeholder-slate-550 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#64748b] hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {loginError && (
            <div className="flex items-start space-x-2 rounded-lg bg-rose-950/40 border border-rose-500/30 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 hover:bg-blue-750 text-white font-semibold text-sm py-3 transition-all hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer active:scale-[0.99]"
          >
            Authorize Corporate Access
          </button>
        </form>

        {/* Directory Access instructions for authenticated users */}
        <div className="border-t border-[#1e293b]/65 pt-4 space-y-2" id="quick-login-dashboard">
          <div className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">Authorized Directory Credentials</div>
          <div className="text-[11px] text-[#94a3b8] leading-normal space-y-1 bg-[#020617] p-3 rounded-lg border border-[#1e293b]">
            <p className="font-semibold text-slate-350">Pre-authenticated Test Operators:</p>
            <ul className="list-disc list-inside space-y-1 font-mono text-[10px] text-slate-400 mt-1">
              <li><span className="text-blue-400 font-semibold">rek2nd@gmail.com</span> (Admin)</li>
              <li><span className="text-amber-500">s.connor@resistance.net</span> (Tech)</li>
            </ul>
            <p className="text-[9px] text-[#64748b] pt-1.5 border-t border-[#1e293b] mt-1.5 leading-tight">
              Access PIN / Passcode is: <code className="bg-[#1e293b] text-slate-200 px-1 py-0.2 rounded">password</code>
            </p>
          </div>
        </div>
      </div>
      
      {/* Privacy Notice */}
      <div className="mt-8 text-center text-xs text-slate-500" id="login-copyright">
        <span>Restricted Access Panel. Operations are audited locally under cyberdyne guideline protocols.</span>
      </div>
    </div>
  );
}

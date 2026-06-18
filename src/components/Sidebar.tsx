import { LayoutDashboard, Laptop, Wrench, BarChart3, RotateCw, User, Shield, Eye, ShieldAlert, MonitorCheck, Menu, X, Settings, LogOut } from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  onResetData: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onLogout?: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  currentRole,
  setCurrentRole,
  onResetData,
  isOpen,
  setIsOpen,
  onLogout,
}: SidebarProps) {
  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', name: 'Computer Fleet', icon: Laptop },
    { id: 'logs', name: 'Maintenance Logs', icon: Wrench },
    { id: 'reports', name: 'Reports & Metrics', icon: BarChart3 },
    { id: 'settings', name: 'System Settings', icon: Settings },
  ];

  const roles: { value: UserRole; label: string; icon: any; color: string; desc: string }[] = [
    {
      value: 'Admin',
      label: 'Admin',
      icon: Shield,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      desc: 'Full access to edit/delete any data.',
    },
    {
      value: 'Technician',
      label: 'Technician',
      icon: Wrench,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      desc: 'Add/edit maintenance; read-only fleet assets.',
    },
    {
      value: 'Viewer',
      label: 'Viewer',
      icon: Eye,
      color: 'bg-gray-50 text-gray-700 border-gray-200',
      desc: 'Read-only access across all views.',
    },
  ];

  const handleTabChange = (tabId: string) => {
    setCurrentTab(tabId);
    setIsOpen(false); // Close mobile menu if clicked
  };

  return (
    <>
      {/* Mobile Top Header (Nav bar) */}
      <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white lg:hidden">
        <div className="flex items-center space-x-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded bg-blue-600">
            <MonitorCheck className="h-5 w-5 text-white" />
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 p-0.5 text-[8px] font-bold text-blue-400">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              +
            </div>
          </div>
          <div>
            <span className="font-bold tracking-tight text-white block leading-none">FleetLog</span>
            <span className="text-[10px] text-slate-400">IT Maintenance Portal</span>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded p-1.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          id="mobile-menu-toggle"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-68 flex-col border-r border-[#1e293b] bg-[#0f172a] text-slate-355 transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:flex'
        }`}
      >
        {/* Core Brand Header */}
        <div className="hidden border-b border-[#1e293b] bg-[#0f172a] px-6 py-5 lg:block">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/10">
              <Laptop className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-wide text-white leading-tight">FleetLog IT</h1>
              <p className="text-xs text-[#94a3b8]">Computer Maintenance</p>
            </div>
          </div>
        </div>

        {/* Current Role Indicator */}
        <div className="border-b border-[#1e293b] bg-[#020617]/45 px-5 py-4" id="sidebar-role-indicator">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-[#64748b] uppercase">Session Security</span>
            <span className="inline-flex items-center rounded-full bg-emerald-950/40 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/15">
              Authorized
            </span>
          </div>
          
          <div className="flex items-center space-x-2.5 bg-[#020617] border border-[#1e293b] px-3 py-2.5 rounded-lg">
            {currentRole === 'Admin' ? (
              <Shield className="h-4.5 w-4.5 text-blue-400 shrink-0" />
            ) : currentRole === 'Technician' ? (
              <Wrench className="h-4.5 w-4.5 text-amber-500 shrink-0" />
            ) : (
              <Eye className="h-4.5 w-4.5 text-slate-400 shrink-0" />
            )}
            <div>
              <span className="text-[10px] text-[#94a3b8] font-bold block leading-none">Authority Tier</span>
              <span className="text-xs text-white font-bold block mt-1 leading-none">{currentRole} Control</span>
            </div>
          </div>

          <div className="mt-2 text-[10px] text-[#64748b] leading-tight font-medium">
            {roles.find((r) => r.value === currentRole)?.desc}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 space-y-1 py-4" id="sidebar-navigation">
          {tabs
            .filter((tab) => tab.id !== 'settings' || currentRole === 'Admin')
            .map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex w-full items-center space-x-3 py-3 px-6 text-sm font-medium transition-all border-l-4 ${
                    isActive
                      ? 'bg-[#1e293b] text-[#3b82f6] border-[#3b82f6] font-semibold'
                      : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f8fafc] border-transparent'
                  }`}
                  id={`nav-${tab.id}`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{tab.id === 'reports' ? 'Reports & Metrics' : tab.name}</span>
                </button>
              );
            })}
        </nav>

        {/* Footer info & session tools */}
        <div className="border-t border-[#1e293b] bg-[#020617] px-4 py-4.5 text-xs text-[#94a3b8] space-y-2">
          <div className="rounded-lg bg-[#0f172a] p-2.5 border border-[#1e293b]">
            <div className="text-[11px] text-[#94a3b8] flex items-center justify-between mb-1">
              <span>Anchor Date:</span>
              <span className="font-mono text-slate-200 font-semibold bg-[#1e293b] px-1 py-0.5 rounded text-[10px]">Jun 15, 2026</span>
            </div>
            <div className="text-[11px] text-[#94a3b8] flex items-center justify-between">
              <span>Database Version:</span>
              <span className="font-mono text-[#94a3b8]">v1.2 (Local)</span>
            </div>
          </div>
          
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex w-full items-center justify-center space-x-2 rounded-lg border border-red-900/30 hover:border-red-500/50 hover:bg-red-950/20 bg-[#0f172a] py-2.5 text-red-400 font-semibold transition-all cursor-pointer active:scale-[0.98]"
              id="sidebar-logout-btn"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out Operator</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

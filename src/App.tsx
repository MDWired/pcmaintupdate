import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Computer, MaintenanceLog, UserRole } from './types';
import { 
  getComputers, getLogs, getCurrentRole, 
  saveComputers, saveLogs, saveCurrentRole, 
  resetToMockData, initializeStorage 
} from './utils';

import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Maintenance from './components/Maintenance';
import Reports from './components/Reports';
import Settings, { TechnicianUser } from './components/Settings';
import Login from './components/Login';

export default function App() {
  // Ensure storage is initialized on first boot
  initializeStorage();

  // Lazy state initializations
  const [computers, setComputers] = useState<Computer[]>(() => getComputers());
  const [logs, setLogs] = useState<MaintenanceLog[]>(() => getLogs());
  const [currentRole, setCurrentRole] = useState<UserRole>(() => getCurrentRole());

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('portal_logged_in') === 'true';
  });

  const [activeTech, setActiveTechState] = useState<TechnicianUser>(() => {
    const saved = localStorage.getItem('portal_technicians');
    let roster = [];
    if (saved) {
      try { roster = JSON.parse(saved); } catch(e){}
    }
    if (!roster || roster.length === 0) {
      roster = [
        { id: 't4', name: 'Rek Dyson', role: 'Admin', email: 'rek2nd@gmail.com' },
        { id: 't1', name: 'Miles Dyson', role: 'Admin', email: 'm.dyson@cyberdyne.com' },
        { id: 't2', name: 'Sarah Connor', role: 'Technician', email: 's.connor@resistance.net' },
        { id: 't3', name: 'John Connor', role: 'Technician', email: 'j.connor@resistance.net' }
      ];
      localStorage.setItem('portal_technicians', JSON.stringify(roster));
    }
    
    const activeId = localStorage.getItem('active_tech_id');
    if (activeId) {
      const found = roster.find((u: any) => u.id === activeId);
      if (found) return found;
    }
    return roster.find((u: any) => u.email === 'rek2nd@gmail.com') || roster[0];
  });

  const setActiveTech = (tech: TechnicianUser) => {
    setActiveTechState(tech);
    localStorage.setItem('active_tech_id', tech.id);
  };

  const handleLogin = (tech: TechnicianUser) => {
    setActiveTechState(tech);
    localStorage.setItem('active_tech_id', tech.id);
    setCurrentRole(tech.role);
    saveCurrentRole(tech.role);
    setIsLoggedIn(true);
    localStorage.setItem('portal_logged_in', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('portal_logged_in');
  };
  
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync role helper
  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    saveCurrentRole(role);
    if (role !== 'Admin' && currentTab === 'settings') {
      setCurrentTab('dashboard');
    }
  };

  // Reset helper
  const handleResetData = () => {
    resetToMockData();
    const freshComps = getComputers();
    const freshLogs = getLogs();
    setComputers(freshComps);
    setLogs(freshLogs);
    setCurrentRole('Admin');
    saveCurrentRole('Admin');
    setCurrentTab('dashboard');
  };

  // ADD Computer
  const handleAddComputer = (compData: Omit<Computer, 'id'>) => {
    const newComp: Computer = {
      ...compData,
      id: 'c' + (computers.length + 10) + Math.floor(Math.random() * 100),
    };
    const updated = [...computers, newComp];
    setComputers(updated);
    saveComputers(updated);
  };

  // EDIT Computer
  const handleUpdateComputer = (updatedComp: Computer) => {
    const updated = computers.map(c => c.id === updatedComp.id ? updatedComp : c);
    setComputers(updated);
    saveComputers(updated);
  };

  // DELETE Computer
  const handleDeleteComputer = (id: string) => {
    const updatedComps = computers.filter(c => c.id !== id);
    setComputers(updatedComps);
    saveComputers(updatedComps);

    // Cascade: Optionally clear logs for the deleted computer or leave them orphaned
    // Leaving logs orphaned mimics enterprise audit guidelines, but we can keep them for safety.
  };

  // ADD Log
  const handleAddLog = (logData: Omit<MaintenanceLog, 'id'>) => {
    const newLog: MaintenanceLog = {
      ...logData,
      id: 'm' + (logs.length + 10) + Math.floor(Math.random() * 100),
    };
    const updated = [...logs, newLog];
    setLogs(updated);
    saveLogs(updated);
  };

  // EDIT Log
  const handleUpdateLog = (updatedLog: MaintenanceLog) => {
    const updated = logs.map(l => l.id === updatedLog.id ? updatedLog : l);
    setLogs(updated);
    saveLogs(updated);
  };

  // DELETE Log
  const handleDeleteLog = (id: string) => {
    const updated = logs.filter(l => l.id !== id);
    setLogs(updated);
    saveLogs(updated);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-[#020617] text-[#f8fafc] antialiased" id="application-container-root">
      
      {/* Sidebar layout */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentRole={currentRole}
        setCurrentRole={handleRoleChange}
        onResetData={handleResetData}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onLogout={handleLogout}
      />

      {/* Main Viewport panel */}
      <main className="flex-1 overflow-x-hidden min-h-screen px-4 py-6 md:px-8 md:py-8 lg:max-w-7xl lg:mx-auto animate-in fade-in duration-200">
        <div className="mx-auto max-w-6xl space-y-6" id="inner-view-container">
          
          {/* USER PROFILE CORNER HEADER */}
          <header className="flex flex-col gap-3 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between border-b border-[#1e293b]/60 pb-5" id="profile-active-header">
            <div>
              <span className="text-[10px] text-blue-500 font-extrabold uppercase tracking-widest block mb-0.5">IT Fleet Management</span>
              <h1 className="text-lg font-bold text-white tracking-tight leading-none">Corporate Maintenance Portal</h1>
            </div>
            
            {/* Operator Widgets Display */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-3 bg-[#0f172a] border border-[#1e293b] rounded-full pl-4 pr-1.5 py-1.5 shadow-md">
                <div className="text-right">
                  <span className="text-[11px] font-bold text-white block leading-tight">{activeTech.name}</span>
                  <span className="text-[9px] text-[#94a3b8] font-semibold tracking-wider uppercase block leading-none mt-0.5">{activeTech.role} Control</span>
                </div>
                <button 
                  onClick={() => currentRole === 'Admin' && setCurrentTab('settings')}
                  disabled={currentRole !== 'Admin'}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-white font-extrabold text-xs transition-all shadow-sm border border-blue-500/20 active:scale-95 ${
                    currentRole === 'Admin' 
                      ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' 
                      : 'bg-slate-700 cursor-default'
                  }`}
                  title={currentRole === 'Admin' ? "View System Settings & Operator Credentials" : "Active Operator Profile Badge"}
                >
                  {activeTech.name.split(' ').map(n=>n[0]).join('')}
                </button>
              </div>

              {/* Log Out button */}
              <button
                onClick={handleLogout}
                className="flex h-9 px-3.5 items-center justify-center rounded-full bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] hover:border-red-500/30 text-[#94a3b8] hover:text-red-400 font-semibold text-xs transition-all shadow-md cursor-pointer active:scale-95 space-x-1.5"
                title="Log Out of your current Operator session"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </header>

          {currentTab === 'dashboard' && (
            <Dashboard 
              computers={computers} 
              logs={logs} 
              onNavigateToTab={setCurrentTab} 
            />
          )}

          {currentTab === 'inventory' && (
            <Inventory
              computers={computers}
              logs={logs}
              currentRole={currentRole}
              onAddComputer={handleAddComputer}
              onUpdateComputer={handleUpdateComputer}
              onDeleteComputer={handleDeleteComputer}
            />
          )}

          {currentTab === 'logs' && (
            <Maintenance
              logs={logs}
              computers={computers}
              currentRole={currentRole}
              onAddLog={handleAddLog}
              onUpdateLog={handleUpdateLog}
              onDeleteLog={handleDeleteLog}
              activeTechName={activeTech.name}
            />
          )}

          {currentTab === 'reports' && (
            <Reports
              computers={computers}
              logs={logs}
            />
          )}

          {currentTab === 'settings' && (
            <Settings
              currentRole={currentRole}
              activeTech={activeTech}
              setActiveTech={setActiveTech}
              onResetData={handleResetData}
            />
          )}

        </div>
      </main>

    </div>
  );
}

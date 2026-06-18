import { Laptop, Wrench, AlertTriangle, DollarSign, Clock, ShieldAlert, BadgeInfo, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import { Computer, MaintenanceLog } from '../types';
import { isWarrantyExpired, isNextServiceOverdue, formatCurrency, formatDate } from '../utils';

interface DashboardProps {
  computers: Computer[];
  logs: MaintenanceLog[];
  onNavigateToTab: (tab: string) => void;
  onSelectComputerFilter?: (computerId: string) => void;
}

export default function Dashboard({ computers, logs, onNavigateToTab }: DashboardProps) {
  // Calculations
  const totalComputers = computers.length;
  const inRepairComputers = computers.filter(c => c.status === 'In Repair').length;
  const activeComputers = computers.filter(c => c.status === 'Active').length;
  const retiredComputers = computers.filter(c => c.status === 'Retired').length;

  const totalCost = logs.reduce((sum, log) => sum + log.cost, 0);
  const totalHours = logs.reduce((sum, log) => sum + log.timeSpentHours, 0);

  // Overdue Maintenance entries (where nextServiceDate is in the past, and parent log/computer status is open or in repair)
  const overdueLogs = logs.filter(log => {
    return isNextServiceOverdue(log.nextServiceDate, log.status);
  });

  // Recent maintenance activities (limit to 5)
  const recentActivities = [...logs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  // Warranty summary
  const expiredWarranties = computers.filter(c => isWarrantyExpired(c.warrantyExpiration) && c.status !== 'Retired').length;

  // Group costs by Maintenance Type
  const costByType = logs.reduce((acc, log) => {
    acc[log.maintenanceType] = (acc[log.maintenanceType] || 0) + log.cost;
    return acc;
  }, {} as { [key: string]: number });

  // Types of maintenance list for rendering
  const types: ('Preventive' | 'Repair' | 'Upgrade' | 'Software' | 'Hardware')[] = [
    'Preventive',
    'Repair',
    'Upgrade',
    'Software',
    'Hardware'
  ];

  // Map type to elegant background colors for charts/badges
  const typeColors = {
    Preventive: { bg: 'bg-emerald-500', hoverBg: 'hover:bg-emerald-600', fill: '#10b981', text: 'text-emerald-400 font-semibold' },
    Repair: { bg: 'bg-rose-500', hoverBg: 'hover:bg-rose-600', fill: '#f43f5e', text: 'text-rose-400 font-semibold' },
    Upgrade: { bg: 'bg-blue-500', hoverBg: 'hover:bg-blue-600', fill: '#3b82f6', text: 'text-blue-400 font-semibold' },
    Software: { bg: 'bg-indigo-500', hoverBg: 'hover:bg-indigo-600', fill: '#6366f1', text: 'text-indigo-400 font-semibold' },
    Hardware: { bg: 'bg-amber-500', hoverBg: 'hover:bg-amber-600', fill: '#f59e0b', text: 'text-amber-400 font-semibold' },
  };

  const statusColors = {
    Open: 'bg-blue-905/30 text-blue-400 border-blue-500/20',
    'In Progress': 'bg-[#78350f]/80 text-[#fbbf24] border-amber-500/20',
    Completed: 'bg-[#065f46]/80 text-[#34d399] border-emerald-500/20',
  };

  // SVG Chart Height calculations
  const maxTypeCost = Math.max(...types.map(t => costByType[t] || 0), 1);

  return (
    <div className="space-y-6" id="dashboard-view-root">
      {/* Overview Intro */}
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white animate-in slide-in-from-left duration-200" id="dashboard-title">System Dashboard</h2>
          <p className="text-sm text-[#94a3b8]">Fleet operational summaries, metrics, and pending maintenance orders.</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-medium text-[#94a3b8]">
          <span>Active Warehouse</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[#94a3b8] font-mono font-semibold bg-[#1e293b]/60 px-2 py-0.5 rounded">2026-06-15</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" id="kpi-grid">
        {/* Total Fleet */}
        <div 
          onClick={() => onNavigateToTab('inventory')}
          className="flex items-center justify-between rounded-xl border border-[#1e293b] bg-[#0f172a] p-5 cursor-pointer shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all font-sans"
          id="kpi-total-fleet"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Total Fleet</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold tracking-tight text-white">{totalComputers}</span>
              <span className="text-xs text-[#94a3b8]">units</span>
            </div>
            <div className="text-[11px] text-[#94a3b8]">
              <span className="text-emerald-400 font-semibold">{activeComputers} active</span> &bull; {inRepairComputers} repair
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1e293b] text-[#3b82f6]">
            <Laptop className="h-6 w-6" />
          </div>
        </div>

        {/* Needs Service */}
        <div 
          onClick={() => onNavigateToTab('inventory')}
          className="flex items-center justify-between rounded-xl border border-[#1e293b] bg-[#0f172a] p-5 cursor-pointer shadow-sm hover:shadow-md hover:border-rose-500/50 transition-all"
          id="kpi-in-repair"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748b]">In Repair Room</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold tracking-tight text-rose-400">{inRepairComputers}</span>
              <span className="text-xs text-[#94a3b8]">devices</span>
            </div>
            <div className="text-[11px] text-rose-400 flex items-center space-x-1 font-medium">
              <Clock className="h-3 w-3 shrink-0 animate-pulse" />
              <span>Awaiting technicians</span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1e293b] text-rose-400">
            <Wrench className="h-6 w-6" />
          </div>
        </div>

        {/* Overdue Service */}
        <div 
          onClick={() => onNavigateToTab('logs')}
          className={`flex items-center justify-between rounded-xl border p-5 cursor-pointer shadow-sm hover:shadow-md transition-all ${
            overdueLogs.length > 0 
              ? 'border-amber-500/40 bg-amber-955/20 hover:border-amber-400' 
              : 'border-[#1e293b] bg-[#0f172a] hover:border-blue-500/50'
          }`}
          id="kpi-overdue-service"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Overdue Service</span>
            <div className="flex items-baseline space-x-2">
              <span className={`text-3xl font-bold tracking-tight ${overdueLogs.length > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                {overdueLogs.length}
              </span>
              <span className="text-xs text-[#94a3b8]">tasks</span>
            </div>
            <div className="text-[11px] text-[#94a3b8]">
              {expiredWarranties > 0 ? (
                <span className="text-[#fbbf24] font-semibold">{expiredWarranties} expired warranties</span>
              ) : (
                'All schedules aligned'
              )}
            </div>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${overdueLogs.length > 0 ? 'bg-amber-950 text-amber-400' : 'bg-[#1e293b] text-[#94a3b8]'}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        {/* Total Maintenance Cost */}
        <div 
          onClick={() => onNavigateToTab('reports')}
          className="flex items-center justify-between rounded-xl border border-[#1e293b] bg-[#0f172a] p-5 cursor-pointer shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all"
          id="kpi-maintenance-cost"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Total Expenses</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold tracking-tight text-[#34d399]">{formatCurrency(totalCost)}</span>
            </div>
            <div className="text-[11px] text-[#94a3b8]">
              Spent across <span className="font-semibold text-slate-300">{totalHours} technician hours</span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1e293b] text-emerald-400">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Cost Breakdown & Technician Activity Grid */}
        <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6" id="dashboard-charts-grid">
          
          {/* Expenses Chart */}
          <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-5 shadow-sm flex flex-col justify-between" id="dashboard-visual-section">
            <div>
              <div className="mb-6 flex items-center justify-between border-b border-[#1e293b] pb-4">
                <div>
                  <h3 className="font-semibold text-white">Expenses by Type</h3>
                  <p className="text-xs text-[#94a3b8]">Sum distribution of replacement parts and repair costs.</p>
                </div>
              </div>

              {/* Progress-style bars */}
              <div className="space-y-4.5">
                {types.map(type => {
                  const cost = costByType[type] || 0;
                  const pct = (cost / maxTypeCost) * 100;
                  const config = typeColors[type];

                  return (
                    <div key={type} className="space-y-1.5" id={`cost-bar-${type.toLowerCase()}`}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#94a3b8] font-medium">{type}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-white font-semibold">{formatCurrency(cost)}</span>
                          <span className="text-[10px] text-[#94a3b8]">({totalCost > 0 ? Math.round((cost / totalCost) * 100) : 0}%)</span>
                        </div>
                      </div>
                      
                      {/* Progress Line */}
                      <div className="relative h-2.5 w-full rounded-full bg-[#1e293b] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${config.bg} transition-all duration-1005`}
                          style={{ width: `${Math.max(pct, cost > 0 ? 3 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Device Distribution */}
            <div className="mt-8 border-t border-[#1e293b] pt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-3 block">Fleet Status Distribution</h4>
              <div className="flex flex-wrap items-center gap-3.5">
                <div className="flex items-center space-x-1.5 font-mono">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[11px] text-[#94a3b8]">Active: <b className="text-white">{activeComputers}</b></span>
                </div>
                <div className="flex items-center space-x-1.5 font-mono">
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                  <span className="text-[11px] text-[#94a3b8]">In Repair: <b className="text-white">{inRepairComputers}</b></span>
                </div>
                <div className="flex items-center space-x-1.5 font-mono">
                  <span className="h-2 w-2 rounded-full bg-[#475569]"></span>
                  <span className="text-[11px] text-[#94a3b8]">Stored: <b className="text-white">{retiredComputers}</b></span>
                </div>
              </div>
            </div>
          </div>

          {/* New Chart: Maintenance by Technician */}
          <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-5 shadow-sm flex flex-col justify-between" id="technician-chart-box">
            <div>
              <div className="mb-6 flex items-center justify-between border-b border-[#1e293b] pb-4">
                <div>
                  <h3 className="font-semibold text-white">Maintenance by Operator</h3>
                  <p className="text-xs text-[#94a3b8]">Volume of maintenance procedures resolved per technician.</p>
                </div>
              </div>

              {/* Dynamic horizontal logs progress */}
              <div className="space-y-4.5">
                {(() => {
                  const logsByTech = logs.reduce((acc, log) => {
                    const tech = log.technicianName.trim() || 'Unassigned';
                    acc[tech] = (acc[tech] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);

                  const techSummary = Object.entries(logsByTech)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count);

                  const maxCount = Math.max(...techSummary.map(t => t.count), 1);

                  if (techSummary.length === 0) {
                    return <div className="text-slate-500 text-xs italic text-center py-10">No logs registered.</div>;
                  }

                  return techSummary.slice(0, 5).map(tech => {
                    const pct = (tech.count / maxCount) * 100;
                    return (
                      <div key={tech.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-semibold">{tech.name}</span>
                          <span className="font-mono text-blue-400 font-bold">{tech.count} <span className="text-slate-500 font-normal">logs</span></span>
                        </div>
                        
                        <div className="relative h-2.5 w-full rounded-full bg-[#1e293b] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-1000"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="mt-8 border-t border-[#1e293b] pt-5 flex items-center justify-between text-[11px] text-[#64748b] font-mono">
              <span>Technicians: <b className="text-slate-300">{Object.keys(logs.reduce((acc, l) => ({ ...acc, [l.technicianName]: true }), {})).length}</b></span>
              <span>Workorders: <b className="text-slate-300">{logs.length}</b></span>
            </div>
          </div>

        </div>

        {/* Warning Board & Alerts */}
        <div className="space-y-4" id="dashboard-warnings-section">
          
          {/* Overdue Schedules warning panel */}
          <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-5 shadow-sm">
            <h3 className="mb-3 font-semibold text-white flex items-center space-x-2">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
              <span>Action Items & Notices</span>
            </h3>

            {overdueLogs.length === 0 && expiredWarranties === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                <span className="text-xs font-semibold text-slate-200">All Asset Compliances Solid</span>
                <span className="text-[10px] text-[#94a3b8] max-w-48 text-center mt-0.5">No overdue schedules or pending checks currently detected.</span>
              </div>
            )}

            <div className="space-y-3.5">
              {/* Overdue alert */}
              {overdueLogs.map(log => {
                const comp = computers.find(c => c.id === log.computerId);
                return (
                  <div key={log.id} className="rounded-lg bg-amber-950/20 p-3 border border-amber-500/20 flex items-start space-x-2.5">
                    <Clock className="h-4 w-4 text-amber-405 mt-0.5 shrink-0 animate-spin-slow" />
                    <div className="text-xs">
                      <div className="font-semibold text-amber-400">Overdue Service Due</div>
                      <div className="text-slate-350">
                        {comp ? comp.assetTag : 'Computer'}: Next service on <span className="font-mono text-amber-405 font-semibold">{formatDate(log.nextServiceDate || '')}</span>
                      </div>
                      <div className="text-[11px] text-amber-350/90 italic mt-1 border-t border-amber-950/40 pt-1">
                        Task: "{log.description.substring(0, 42)}..."
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Expired warranties alerts */}
              {computers.filter(c => isWarrantyExpired(c.warrantyExpiration) && c.status !== 'Retired').slice(0, 2).map(comp => (
                <div key={comp.id} className="rounded-lg bg-[#1e293b]/55 p-3 border border-[#1e293b] flex items-start space-x-2.5">
                  <ShieldAlert className="h-4 w-4 text-[#94a3b8] mt-0.5 shrink-0" />
                  <div className="text-xs text-[#94a3b8]">
                    <div className="font-semibold text-slate-200 font-semibold">Warranty Expired</div>
                    <div className="text-slate-400">
                      {comp.assetTag} ({comp.makeModel.substring(0, 20)}) - expired on <span className="font-mono text-slate-300 font-semibold">{formatDate(comp.warrantyExpiration)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Informational Tip */}
          <div className="rounded-xl border border-blue-900/30 bg-blue-950/25 p-4.5 flex items-start space-x-3 text-xs leading-relaxed text-blue-300">
            <BadgeInfo className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-blue-200 block mb-0.5">Quick Guide</span>
              Change roles in the sidebar immediately to test permission restrictions (e.g., Viewer role blocks add/edit actions, Technicians are restricted to logs).
            </div>
          </div>
        </div>

      </div>

      {/* Recent Activity List */}
      <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-5 shadow-sm" id="recent-activity-section">
        <div className="mb-4 flex items-center justify-between border-b border-[#1e293b] pb-4">
          <div>
            <h3 className="font-semibold text-white">Recent Maintenance Activity</h3>
            <p className="text-xs text-[#94a3b8]">Most recent maintenance jobs completed or logged by operators.</p>
          </div>
          <button 
            onClick={() => onNavigateToTab('logs')}
            className="flex items-center space-x-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>View All Logs</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1e293b] text-[#64748b] font-medium">
                <th className="py-2.5 font-semibold">Date</th>
                <th className="py-2.5 font-semibold">Computer</th>
                <th className="py-2.5 font-semibold">Technician</th>
                <th className="py-2.5 font-semibold">Type</th>
                <th className="py-2.5 font-semibold">Description</th>
                <th className="py-2.5 font-semibold text-right">Cost</th>
                <th className="py-2.5 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/40">
              {recentActivities.map(log => {
                const comp = computers.find(c => c.id === log.computerId);
                return (
                  <tr key={log.id} className="hover:bg-[#1e293b]/30 transition-colors">
                    <td className="py-3 font-mono text-[#94a3b8]">{formatDate(log.date)}</td>
                    <td className="py-3">
                      <div className="font-semibold text-white">{comp ? comp.assetTag : 'N/A'}</div>
                      <div className="text-[10px] text-[#94a3b8] truncate max-w-[190px]">{comp ? comp.makeModel : 'Deleted computer'}</div>
                    </td>
                    <td className="py-3 text-[#94a3b8]">{log.technicianName}</td>
                    <td className="py-3">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border border-${log.maintenanceType === 'Preventive' ? 'emerald-500/20 bg-emerald-950/20' : log.maintenanceType === 'Repair' ? 'rose-500/20 bg-rose-950/20' : 'blue-500/20 bg-blue-950/20'} ${typeColors[log.maintenanceType]?.text || 'text-slate-450'}`}>
                        {log.maintenanceType}
                      </span>
                    </td>
                    <td className="py-3 text-[#94a3b8] truncate max-w-xs" title={log.description}>
                      {log.description}
                    </td>
                    <td className="py-3 text-right font-semibold font-mono text-emerald-400">
                      {log.cost > 0 ? formatCurrency(log.cost) : '—'}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium border ${statusColors[log.status]}`}>
                        <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${log.status === 'Completed' ? 'bg-emerald-400' : log.status === 'In Progress' ? 'bg-[#fbbf24]' : 'bg-blue-400'}`}></span>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

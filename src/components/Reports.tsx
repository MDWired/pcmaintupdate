import { useState } from 'react';
import { Computer, MaintenanceLog, MonthlyCostReport, MaintenanceType } from '../types';
import { 
  BarChart3, FileSpreadsheet, Download, Calendar, 
  DollarSign, Wrench, Laptop, Printer, ChevronRight, 
  FileText, Activity, Layers, Tag 
} from 'lucide-react';
import { generateMonthlyReport, formatCurrency, formatDate, exportLogsToCSV } from '../utils';

interface ReportsProps {
  computers: Computer[];
  logs: MaintenanceLog[];
}

export default function Reports({ computers, logs }: ReportsProps) {
  // Select computer for individual audit exports
  const [auditComputerId, setAuditComputerId] = useState<string>(computers[0]?.id || '');
  
  // Calculate reports data
  const monthlyReports = generateMonthlyReport(logs);

  // Group costs by department
  const deptSummary = computers.reduce((acc, comp) => {
    const compLogs = logs.filter(l => l.computerId === comp.id);
    const totalCost = compLogs.reduce((s, l) => s + l.cost, 0);
    const totalTime = compLogs.reduce((s, l) => s + l.timeSpentHours, 0);
    const ticketCount = compLogs.length;

    if (!acc[comp.department]) {
      acc[comp.department] = {
        name: comp.department,
        totalCost: 0,
        totalTime: 0,
        ticketCount: 0,
        computerCount: 0,
      };
    }

    acc[comp.department].totalCost += totalCost;
    acc[comp.department].totalTime += totalTime;
    acc[comp.department].ticketCount += ticketCount;
    acc[comp.department].computerCount += 1;

    return acc;
  }, {} as { [key: string]: { name: string; totalCost: number; totalTime: number; ticketCount: number; computerCount: number } });

  const departments = Object.values(deptSummary);

  const selectedAuditComp = computers.find(c => c.id === auditComputerId);
  const selectedAuditLogs = logs
    .filter(l => l.computerId === auditComputerId)
    .sort((a, b) => b.date.localeCompare(a.date));

  // CSV downloade for individual computer history
  const handleExportIndividualAudit = () => {
    if (!selectedAuditComp) return;
    const individualCSVLogs = logs.filter(l => l.computerId === selectedAuditComp.id);
    exportLogsToCSV(individualCSVLogs, [selectedAuditComp]);
  };

  // SVG Chart Dimensions
  const chartHeight = 200;
  const maxMonthlyCost = Math.max(...monthlyReports.map(r => r.totalCost), 1);

  const typeConfig: { [key in MaintenanceType]: { color: string; label: string } } = {
    Preventive: { color: 'bg-emerald-500', label: 'Preventive' },
    Repair: { color: 'bg-rose-500', label: 'Repair' },
    Upgrade: { color: 'bg-blue-500', label: 'Upgrade' },
    Software: { color: 'bg-indigo-500', label: 'Software' },
    Hardware: { color: 'bg-amber-500', label: 'Hardware' },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-205" id="reports-view-root">
      
      {/* Upper header summary */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white animate-in slide-in-from-left duration-250">IT Fleet & Maintenance Reports</h2>
          <p className="text-sm text-[#94a3b8]">Analyze monthly expenditure cycles, department balance sheets, and generate individual asset audit sheets.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center space-x-1.5 rounded-lg border border-[#1e293b] bg-[#0f172a] px-3.5 py-2 text-xs font-semibold text-slate-300 shadow-sm hover:bg-[#1e293b] hover:text-white transition-colors"
          title="Print page layout directly or export as PDF"
        >
          <Printer className="h-4 w-4" />
          <span>Print / PDF Report</span>
        </button>
      </div>

      {/* Monthly spending bar graph visualization (Interactive Clean SVG) */}
      <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-5 shadow-sm">
        <div className="mb-6">
          <h3 className="font-semibold text-white flex items-center space-x-1.5">
            <Activity className="h-4.5 w-4.5 text-blue-400" />
            <span>Monthly Cost Cycles Summary Chart</span>
          </h3>
          <p className="text-xs text-[#94a3b8]">Comparative representation of cost impacts across monthly intervals.</p>
        </div>

        {monthlyReports.length === 0 ? (
          <div className="flex h-48 items-center justify-center border border-dashed border-[#1e293b] rounded-xl text-xs text-slate-500">
            No logged costs detected to feed graphs.
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Custom Responsive SVG Chart Bar */}
            <div className="relative pt-4">
              {/* Chart Grid Lines */}
              <div className="absolute inset-y-0 left-0 w-full flex flex-col justify-between text-[10px] text-slate-500 pointer-events-none pb-8 select-none">
                <div className="border-b border-[#1e293b]/70 w-full flex justify-between pt-1">
                  <span>{formatCurrency(maxMonthlyCost)}</span>
                  <div className="border-t border-[#1e293b]/30 flex-1 mx-2 self-center"></div>
                </div>
                <div className="border-b border-[#1e293b]/70 w-full flex justify-between">
                  <span>{formatCurrency(maxMonthlyCost / 2)}</span>
                  <div className="border-t border-[#1e293b]/30 flex-1 mx-2 self-center"></div>
                </div>
                <div className="border-b border-[#1e293b] w-full flex justify-between pb-0.5">
                  <span>$0</span>
                  <div className="border-t border-[#1e293b]/50 flex-1 mx-2 self-center"></div>
                </div>
              </div>

              {/* Bars container */}
              <div className="flex h-48 justify-around items-end pb-8 pt-2 relative z-10 pl-16">
                {monthlyReports.map((r) => {
                  const pct = (r.totalCost / maxMonthlyCost) * 100;
                  return (
                    <div key={r.month} className="group relative flex flex-col items-center flex-1 max-w-[80px]">
                      
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg z-20 pointer-events-none">
                        <div className="font-semibold text-center">{r.month}</div>
                        <div className="text-emerald-450 font-bold">{formatCurrency(r.totalCost)}</div>
                        <div className="text-slate-300">Tickets: {r.count}</div>
                      </div>

                      {/* Stacked Fill Bar elements */}
                      <div className="w-8 hover:w-10 transition-all rounded-t-md overflow-hidden bg-[#020617] flex flex-col justify-end" style={{ height: `${pct}%` }}>
                        {r.upgradeCost > 0 && <div className="bg-blue-500 w-full animate-in slide-in-from-bottom" style={{ height: `${(r.upgradeCost / r.totalCost) * 100}%` }} title={`Upgrade: ${formatCurrency(r.upgradeCost)}`} />}
                        {r.repairCost > 0 && <div className="bg-rose-500 w-full animate-in slide-in-from-bottom" style={{ height: `${(r.repairCost / r.totalCost) * 100}%` }} title={`Repair: ${formatCurrency(r.repairCost)}`} />}
                        {r.hardwareCost > 0 && <div className="bg-amber-500 w-full animate-in slide-in-from-bottom" style={{ height: `${(r.hardwareCost / r.totalCost) * 100}%` }} title={`Hardware: ${formatCurrency(r.hardwareCost)}`} />}
                        {r.softwareCost > 0 && <div className="bg-indigo-500 w-full animate-in slide-in-from-bottom" style={{ height: `${(r.softwareCost / r.totalCost) * 105}%` }} title={`Software: ${formatCurrency(r.softwareCost)}`} />}
                        {r.preventiveCost > 0 && <div className="bg-emerald-500 w-full animate-in slide-in-from-bottom" style={{ height: `${(r.preventiveCost / r.totalCost) * 100}%` }} title={`Preventive: ${formatCurrency(r.preventiveCost)}`} />}
                        {r.totalCost === 0 && <div className="bg-slate-750 w-full h-1 animate-pulse" />}
                      </div>

                      {/* X-axis labels */}
                      <span className="absolute top-full mt-1.5 font-mono text-[9px] font-bold text-slate-500 select-none">{r.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legending keys */}
            <div className="flex flex-wrap items-center justify-center gap-4.5 text-[10px] uppercase font-bold text-slate-400 pt-2 border-t border-[#1e293b]">
              <div className="flex items-center space-x-1.5 transition-opacity hover:opacity-80">
                <span className="h-2.5 w-2.5 rounded bg-emerald-500"></span>
                <span>Preventive</span>
              </div>
              <div className="flex items-center space-x-1.5 transition-opacity hover:opacity-80">
                <span className="h-2.5 w-2.5 rounded bg-rose-500"></span>
                <span>Repair</span>
              </div>
              <div className="flex items-center space-x-1.5 transition-opacity hover:opacity-80">
                <span className="h-2.5 w-2.5 rounded bg-blue-500"></span>
                <span>Upgrade</span>
              </div>
              <div className="flex items-center space-x-1.5 transition-opacity hover:opacity-80">
                <span className="h-2.5 w-2.5 rounded bg-indigo-500"></span>
                <span>Software</span>
              </div>
              <div className="flex items-center space-x-1.5 transition-opacity hover:opacity-80">
                <span className="h-2.5 w-2.5 rounded bg-amber-500"></span>
                <span>Hardware</span>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Grid of details: 1. Monthly tables, 2. Computer Specific History Sheet */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Monthly report table details */}
        <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-5 shadow-sm text-white">
          <h3 className="mb-4 font-semibold text-white flex items-center space-x-1.5">
            <Calendar className="h-4.5 w-4.5 text-blue-400" />
            <span>Monthly Expenses Ledger Breakdown</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1e293b] text-slate-400 font-bold bg-[#020617]/40">
                  <th className="py-2.5 px-3 uppercase tracking-wider text-[10px]">Month</th>
                  <th className="py-2.5 px-3 text-center uppercase tracking-wider text-[10px]">Service Tickets</th>
                  <th className="py-2.5 px-3 text-right uppercase tracking-wider text-[10px]">Preventive Cost</th>
                  <th className="py-2.5 px-3 text-right uppercase tracking-wider text-[10px]">Hardware / Swap</th>
                  <th className="py-2.5 px-3 text-right uppercase tracking-wider text-[10px] text-white">Total Expenses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/40">
                {monthlyReports.map(rep => (
                  <tr key={rep.month} className="hover:bg-[#1e293b]/20 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-300 font-semibold">{rep.month}</td>
                    <td className="py-3 px-3 text-center text-slate-400 font-semibold">{rep.count} logs</td>
                    <td className="py-3 px-3 text-right text-[#94a3b8] font-mono">{formatCurrency(rep.preventiveCost)}</td>
                    <td className="py-3 px-3 text-right text-[#94a3b8] font-mono">{formatCurrency(rep.hardwareCost + rep.upgradeCost)}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-450 font-mono bg-emerald-500/5">{formatCurrency(rep.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Individual computer audit sheets */}
        <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-5 shadow-sm flex flex-col justify-between text-white">
          <div>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <h3 className="font-semibold text-white flex items-center space-x-1.5">
                <FileText className="h-4.5 w-4.5 text-blue-400" />
                <span>Single Computer Operational Audit Sheet</span>
              </h3>
              
              {/* Computer selector dropdown for history searches */}
              <select
                value={auditComputerId}
                onChange={(e) => setAuditComputerId(e.target.value)}
                className="rounded-lg border border-[#1e293b] bg-[#020617] text-white py-1.5 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                id="audit-computer-select"
              >
                {computers.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#0f172a] text-white">{c.assetTag} - {c.assignedUser}</option>
                ))}
              </select>
            </div>

            {selectedAuditComp ? (
              <div className="space-y-4">
                
                {/* Visual spec checklist card */}
                <div className="rounded-lg border border-[#1e293b] bg-[#020617]/50 p-3.5 space-y-2">
                  <div className="flex items-center justify-between border-b border-[#1e293b]/70 pb-2">
                    <div>
                      <span className="font-mono text-[10px] text-slate-300 font-bold bg-[#1e293b] border border-[#334155]/30 rounded px-1.5 py-0.5">{selectedAuditComp.assetTag}</span>
                      <h4 className="font-bold text-white mt-1.5 text-xs">{selectedAuditComp.makeModel}</h4>
                    </div>
                    <button
                      onClick={handleExportIndividualAudit}
                      className="rounded bg-[#020617] border border-[#1e293b] p-2 text-slate-300 hover:bg-[#1e293b] hover:text-[#38bdf8] flex items-center space-x-1 text-[10px] transition-all"
                      title="Download this specific machine's historical logs as CSV"
                      id="export-audit-csv-btn"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>CSV Audit</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div><b>Serial:</b> <span className="font-mono text-slate-300">{selectedAuditComp.serialNumber}</span></div>
                    <div><b>OS:</b> <span className="text-slate-300">{selectedAuditComp.os}</span></div>
                    <div><b>Owner:</b> <span className="text-slate-300">{selectedAuditComp.assignedUser} ({selectedAuditComp.department})</span></div>
                    <div><b>Desk Location:</b> <span className="text-slate-300">{selectedAuditComp.location}</span></div>
                  </div>
                </div>

                {/* Audit table */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Service Incidents Logs ({selectedAuditLogs.length})</span>
                  
                  {selectedAuditLogs.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-[#1e293b] rounded text-xs text-slate-500 font-medium bg-[#020617]/20">
                      This machine has no service incident logs on record.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#1e293b]/50">
                      {selectedAuditLogs.map(log => (
                        <div key={log.id} className="py-2 flex items-start justify-between text-xs hover:bg-[#1e293b]/20 px-1 rounded transition-colors">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-[10px] font-bold text-slate-500">{formatDate(log.date)}</span>
                              <span className="rounded bg-[#020617] text-slate-400 border border-[#1e293b] text-[8px] font-semibold px-1.5 py-0.2 uppercase font-mono">[{log.maintenanceType}]</span>
                            </div>
                            <p className="text-slate-300 font-normal leading-normal">{log.description}</p>
                            <div className="text-[10px] text-slate-500 italic">Parts: {log.partsUsed} &bull; Labor: {log.timeSpentHours} hrs</div>
                          </div>
                          <span className="font-mono font-bold text-slate-300 text-[11px] whitespace-nowrap ml-2">
                            {log.cost > 0 ? formatCurrency(log.cost) : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                Please register a computer asset first to produce operational audits.
              </div>
            )}
          </div>

          {/* Aggregate specs footer box */}
          {selectedAuditComp && (
            <div className="mt-4 pt-3.5 border-t border-[#1e293b] text-xs flex items-center justify-between text-slate-400 bg-[#020617]/50 p-2.5 rounded-lg border border-[#1e293b]/60 font-medium">
              <span>Cumulative Incidents Cost:</span>
              <span className="font-mono font-bold text-emerald-450 text-sm bg-[#020617]/50 border border-emerald-500/20 rounded px-2.5 py-0.5">
                {formatCurrency(selectedAuditLogs.reduce((s,l) => s + l.cost ,0))}
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Corporate Division/Department balance sheets breakdown details */}
      <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-5 shadow-sm text-white">
        <h3 className="mb-4 font-semibold text-white flex items-center space-x-1.5">
          <Layers className="h-4.5 w-4.5 text-blue-400" />
          <span>Fleet Division Cost center Breakdown</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {departments.map((dept) => {
            return (
              <div key={dept.name} className="p-4 rounded-xl border border-[#1e293b] bg-[#020617]/50 space-y-3 hover:border-blue-500/50 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">{dept.name} Department</span>
                  <span className="inline-flex items-center text-[10px] text-slate-400 font-bold bg-[#0f172a] border border-[#1e293b] px-1.5 py-0.5 rounded leading-none">
                    {dept.computerCount} machines
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                  <div className="space-y-0.5 text-slate-500 font-bold text-[9px] uppercase">
                    <span>Incident Tickets</span>
                    <div className="text-white font-bold text-sm leading-tight mt-0.5">{dept.ticketCount} tickets</div>
                  </div>
                  <div className="space-y-0.5 text-slate-550 text-right font-bold text-[9px] uppercase">
                    <span>Labor Overhead</span>
                    <div className="text-white font-bold text-sm leading-tight mt-0.5">{dept.totalTime} hrs</div>
                  </div>
                </div>

                <div className="border-t border-[#1e293b]/85 pt-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span className="uppercase text-[9px] font-bold">Total IT Budget Spent:</span>
                  <span className="font-mono text-emerald-450 text-xs font-bold bg-[#020617] px-2 py-0.5 rounded border border-emerald-500/10">
                    {formatCurrency(dept.totalCost)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

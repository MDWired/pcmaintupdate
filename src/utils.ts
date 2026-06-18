import { Computer, MaintenanceLog, UserRole, MonthlyCostReport } from './types';
import { SAMPLE_COMPUTERS, SAMPLE_MAINTENANCE_LOGS } from './sampleData';

const BASE_DATE = '2026-06-15'; // Anchor date provided in environment metadata

export function initializeStorage(force = false) {
  if (typeof window === 'undefined') return;

  const hasComputers = localStorage.getItem('fleet_computers');
  const hasLogs = localStorage.getItem('fleet_logs');
  const hasRole = localStorage.getItem('fleet_current_role');

  if (force || !hasComputers) {
    localStorage.setItem('fleet_computers', JSON.stringify(SAMPLE_COMPUTERS));
  }
  if (force || !hasLogs) {
    localStorage.setItem('fleet_logs', JSON.stringify(SAMPLE_MAINTENANCE_LOGS));
  }
  if (force || !hasRole) {
    localStorage.setItem('fleet_current_role', JSON.stringify('Admin'));
  }
}

export function getComputers(): Computer[] {
  if (typeof window === 'undefined') return [];
  initializeStorage();
  const data = localStorage.getItem('fleet_computers');
  return data ? JSON.parse(data) : [];
}

export function saveComputers(computers: Computer[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fleet_computers', JSON.stringify(computers));
}

export function getLogs(): MaintenanceLog[] {
  if (typeof window === 'undefined') return [];
  initializeStorage();
  const data = localStorage.getItem('fleet_logs');
  return data ? JSON.parse(data) : [];
}

export function saveLogs(logs: MaintenanceLog[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fleet_logs', JSON.stringify(logs));
}

export function getCurrentRole(): UserRole {
  if (typeof window === 'undefined') return 'Admin';
  initializeStorage();
  const data = localStorage.getItem('fleet_current_role');
  return data ? JSON.parse(data) : 'Admin';
}

export function saveCurrentRole(role: UserRole) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fleet_current_role', JSON.stringify(role));
}

export function resetToMockData() {
  initializeStorage(true);
}

// Check if warranty is expired relative to current date (2026-06-15)
export function isWarrantyExpired(expiryDateStr: string): boolean {
  if (!expiryDateStr) return false;
  return expiryDateStr < BASE_DATE;
}

// Check if next service date is overdue
export function isNextServiceOverdue(nextServiceDateStr?: string, logStatus?: string): boolean {
  if (!nextServiceDateStr || logStatus === 'Completed') return false;
  return nextServiceDateStr < BASE_DATE;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIndex = parseInt(month, 10) - 1;
  if (monthIndex >= 0 && monthIndex < 12) {
    return `${months[monthIndex]} ${parseInt(day, 10)}, ${year}`;
  }
  return dateStr;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Exports maintenance history to CSV
export function exportLogsToCSV(logs: MaintenanceLog[], computers: Computer[]) {
  const computerMap = new Map(computers.map(c => [c.id, c]));
  
  const headers = [
    'Log ID',
    'Date',
    'Asset Tag',
    'Make/Model',
    'Technician',
    'Type',
    'Description',
    'Parts Used',
    'Time Spent (Hours)',
    'Cost ($)',
    'Next Service Due',
    'Status'
  ];

  const rows = logs.map(log => {
    const comp = computerMap.get(log.computerId);
    return [
      log.id,
      log.date,
      comp ? comp.assetTag : 'Deleted Computer',
      comp ? `"${comp.makeModel.replace(/"/g, '""')}"` : 'N/A',
      `"${log.technicianName.replace(/"/g, '""')}"`,
      log.maintenanceType,
      `"${log.description.replace(/"/g, '""')}"`,
      `"${log.partsUsed.replace(/"/g, '""')}"`,
      log.timeSpentHours,
      log.cost,
      log.nextServiceDate || 'N/A',
      log.status
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(e => e.join(','))
  ].join('\n');

  downloadFile(csvContent, 'maintenance-logs-export.csv', 'text/csv;charset=utf-8;');
}

export function exportComputersToCSV(computers: Computer[]) {
  const headers = [
    'Computer ID',
    'Asset Tag',
    'Serial Number',
    'Make/Model',
    'OS',
    'Assigned User',
    'Department',
    'Location',
    'Purchase Date',
    'Warranty Expiration',
    'Status'
  ];

  const rows = computers.map(comp => [
    comp.id,
    comp.assetTag,
    comp.serialNumber,
    `"${comp.makeModel.replace(/"/g, '""')}"`,
    comp.os,
    `"${comp.assignedUser.replace(/"/g, '""')}"`,
    comp.department,
    `"${comp.location.replace(/"/g, '""')}"`,
    comp.purchaseDate,
    comp.warrantyExpiration,
    comp.status
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(e => e.join(','))
  ].join('\n');

  downloadFile(csvContent, 'fleet-inventory-export.csv', 'text/csv;charset=utf-8;');
}

function downloadFile(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Generate Monthly Reports Data
export function generateMonthlyReport(logs: MaintenanceLog[]): MonthlyCostReport[] {
  const reports: { [key: string]: MonthlyCostReport } = {};
  
  // Custom comparator to sort chronologically "YYYY-MM"
  const getMonthKey = (dateStr: string) => {
    // "2026-03-24" -> "2026-03" (March)
    return dateStr.substring(0, 7);
  };

  const getMonthLabel = (key: string) => {
    const [year, month] = key.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  };

  // Find all logs up to June 2026 (or whichever months exist in database)
  logs.forEach(log => {
    const key = getMonthKey(log.date);
    if (!reports[key]) {
      reports[key] = {
        month: getMonthLabel(key),
        totalCost: 0,
        preventiveCost: 0,
        repairCost: 0,
        upgradeCost: 0,
        softwareCost: 0,
        hardwareCost: 0,
        count: 0
      };
    }

    const rep = reports[key];
    rep.totalCost += log.cost;
    rep.count += 1;

    switch (log.maintenanceType) {
      case 'Preventive':
        rep.preventiveCost += log.cost;
        break;
      case 'Repair':
        rep.repairCost += log.cost;
        break;
      case 'Upgrade':
        rep.upgradeCost += log.cost;
        break;
      case 'Software':
        rep.softwareCost += log.cost;
        break;
      case 'Hardware':
        rep.hardwareCost += log.cost;
        break;
    }
  });

  // Sort monthly keys chronologically
  return Object.keys(reports)
    .sort()
    .map(key => ({
      ...reports[key],
      // Ensure month keeps sort order or is labelled correctly
    }));
}

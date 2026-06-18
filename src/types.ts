export interface Computer {
  id: string;
  assetTag: string; // e.g. "COMP-001"
  serialNumber: string; // e.g. "SN123456789"
  makeModel: string; // e.g. "MacBook Pro 16\" M3" or "Dell XPS 15 9530"
  os: string; // e.g. "macOS Sonoma", "Windows 11 Pro", "Ubuntu 22.04"
  assignedUser: string; // e.g. "Jane Doe"
  department: string; // e.g. "Engineering", "Design", "Marketing", "HR", "Sales"
  location: string; // e.g. "HQ - 3rd Floor", "Remote / Home Office"
  purchaseDate: string; // YYYY-MM-DD
  warrantyExpiration: string; // YYYY-MM-DD
  status: 'Active' | 'Retired' | 'In Repair';
}

export type MaintenanceType = 'Preventive' | 'Repair' | 'Upgrade' | 'Software' | 'Hardware';
export type MaintenanceStatus = 'Open' | 'In Progress' | 'Completed';

export interface MaintenanceLog {
  id: string;
  date: string; // YYYY-MM-DD
  computerId: string; // References Computer.id
  technicianName: string;
  maintenanceType: MaintenanceType;
  description: string;
  partsUsed: string; // e.g. "Replace battery", "None"
  timeSpentHours: number; // in hours, e.g. 1.5, 2
  cost: number; // cost of repairs / parts
  nextServiceDate?: string; // YYYY-MM-DD (optional Next Service Due Date)
  status: MaintenanceStatus;
}

export type UserRole = 'Admin' | 'Technician' | 'Viewer';

export interface MonthlyCostReport {
  month: string; // e.g., "Jan 2026"
  totalCost: number;
  preventiveCost: number;
  repairCost: number;
  upgradeCost: number;
  softwareCost: number;
  hardwareCost: number;
  count: number;
}

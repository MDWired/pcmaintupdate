import { Computer } from '../types';

export interface DellWarrantyEntitlement {
  serviceDescription: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired';
}

export interface DellLookupResult {
  serviceTag: string;
  model: string;
  systemType: string;
  shipDate: string;
  warrantyStart: string;
  warrantyEnd: string;
  warrantyStatus: 'Active' | 'Expired';
  originalConfig: string[];
  compatibleParts: CompatiblePart[];
  lookupTimestamp: number;
}

export interface CompatiblePart {
  type: string;
  name: string;
  partNumber: string;
  priceEstimate: string;
}

export interface DellApiCredentials {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
}

// Caching helper
export function getSavedDellCredentials(): DellApiCredentials {
  if (typeof window === 'undefined') {
    return { clientId: '', clientSecret: '', environment: 'sandbox' };
  }
  const saved = localStorage.getItem('dell_api_credentials');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
  }
  return { clientId: '', clientSecret: '', environment: 'sandbox' };
}

export function saveDellCredentials(creds: DellApiCredentials) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('dell_api_credentials', JSON.stringify(creds));
}

export function getCachedDellResult(serviceTag: string): DellLookupResult | null {
  if (typeof window === 'undefined') return null;
  const cacheStr = localStorage.getItem('dell_warranty_cache');
  if (!cacheStr) return null;
  try {
    const cache = JSON.parse(cacheStr) as Record<string, DellLookupResult>;
    return cache[serviceTag.toUpperCase()] || null;
  } catch (e) {
    return null;
  }
}

export function saveCachedDellResult(serviceTag: string, result: DellLookupResult) {
  if (typeof window === 'undefined') return;
  const cacheStr = localStorage.getItem('dell_warranty_cache') || '{}';
  try {
    const cache = JSON.parse(cacheStr) as Record<string, DellLookupResult>;
    cache[serviceTag.toUpperCase()] = result;
    localStorage.setItem('dell_warranty_cache', JSON.stringify(cache));
  } catch (e) {
    // console warning
  }
}

export function clearDellCache() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('dell_warranty_cache');
}

// Generates highly representative mock specs when API credentials are unset or CORS blocking occurs
export function generateSandboxDellResult(serviceTag: string): DellLookupResult {
  const normTag = serviceTag.toUpperCase();
  
  // Decide model based on characters to make it pseudo-deterministic
  const lastChar = normTag.charAt(normTag.length - 1) || '0';
  const lastCode = lastChar.charCodeAt(0);
  
  let model = 'Dell Latitude 5420';
  let systemType = 'Laptop (Enterprise)';
  let specs = [
    'Intel Core i5-1145G7 (11th Gen, 4 Cores, up to 4.4GHz)',
    '16GB (1x16GB) DDR4 3200MHz Non-ECC',
    '256GB PCIe M.2 NVMe Class 35 SSD',
    'Intel Iris Xe Graphics eligible',
    '14.0" FHD (1920 x 1080) IPS, Anti-Glare, 250 nits',
    'Intel Wi-Fi 6 AX201 2x2.11ax 160MHz + Bluetooth 5.1'
  ];

  if (lastCode % 3 === 0) {
    model = 'Dell XPS 15 9530';
    systemType = 'Premium Laptop';
    specs = [
      'Intel Core i7-13700H (13th Gen, 14 Cores, up to 5.0GHz)',
      '32GB (2x16GB) DDR5 4800MHz Dual-Channel',
      '1TB PCIe Gen4 x4 NVMe M.2 SSD',
      'NVIDIA GeForce RTX 4050 6GB GDDR6 (45W)',
      '15.6" OLED 3.5K (3456 x 2160) InfinityEdge Touch, 400 nits',
      'Intel Killer Wi-Fi 6E AX1675 + Bluetooth 5.3'
    ];
  } else if (lastCode % 3 === 1) {
    model = 'Dell OptiPlex 7000 Micro';
    systemType = 'Desktop (Micro PC)';
    specs = [
      'Intel Core i7-12700T (12th Gen, 12 Cores, up to 4.7GHz)',
      '16GB (2x8GB) DDR4 3200MHz Dual-Channel',
      '512GB PCIe NVMe M.2 Gen4 SSD',
      'Intel UHD Graphics 770 (Triple Display Support)',
      'Enterprise Standard Internal Speaker',
      'Intel Wi-Fi 6E AX211 2x2 + Bluetooth 5.2'
    ];
  } else {
    model = 'Dell Precision 3581';
    systemType = 'Mobile Workstation';
    specs = [
      'Intel Core i9-13900H (13th Gen, 14 Cores, up to 5.4GHz)',
      '32GB (1x32GB) DDR5 5600MHz Non-ECC',
      '1TB PCIe M.2 NVMe PCIe Gen4 SSD',
      'NVIDIA RTX A1000 6GB GDDR6 Laptop GPU',
      '15.6" FHD (1920x1080) Wide View, Anti-Glare, 300 nits',
      'Intel Wi-Fi 6E AX211 + Bluetooth 5.3'
    ];
  }

  // Generate deterministic dates based on service tag characters
  const baseYear = 2023 + (lastCode % 3); // 2023, 2024, or 2025
  const month = String((lastCode % 12) + 1).padStart(2, '0');
  const day = String((lastCode % 28) + 1).padStart(2, '0');
  
  const shipDate = `${baseYear}-${month}-${day}`;
  const warrantyStart = shipDate;
  
  // 3 years of warranty duration
  const warrantyEnd = `${baseYear + 3}-${month}-${day}`;
  
  // Decide warranty status compared offset to local anchor 2026-06-15
  const anchorDateStr = '2026-06-15';
  const warrantyStatus = warrantyEnd >= anchorDateStr ? 'Active' : 'Expired';

  const compatibleParts = getCompatiblePartsForModel(model);

  return {
    serviceTag: normTag,
    model,
    systemType,
    shipDate,
    warrantyStart,
    warrantyEnd,
    warrantyStatus,
    originalConfig: specs,
    compatibleParts,
    lookupTimestamp: Date.now()
  };
}

export function getCompatiblePartsForModel(model: string): CompatiblePart[] {
  const norm = model.toLowerCase();
  if (norm.includes('latitude')) {
    return [
      { type: 'RAM Memory Upgrade', name: 'Dell Memory Upgrade - 16GB DDR4 SO-DIMM 3200MHz', partNumber: '8Z88K', priceEstimate: '$45' },
      { type: 'Storage SSD Upgrade', name: 'Dell Class 40 M.2 PCIe NVMe Gen4 512GB SSD', partNumber: 'NVME512', priceEstimate: '$69' },
      { type: 'Replacement Battery', name: 'Dell 3-Cell 42Wh Core Latitude Primary Battery', partNumber: 'WYV7D', priceEstimate: '$59' },
      { type: 'Power Adapter Charger', name: 'Dell 65W E5 USB Type-C AC Adapter Charger', partNumber: '4HE9Y', priceEstimate: '$39' },
      { type: 'Replacement LCD Panel', name: 'Dell 14.0" HD Anti-Glare WLED Frame Assembly', partNumber: 'M140FHD', priceEstimate: '$129' }
    ];
  } else if (norm.includes('xps')) {
    return [
      { type: 'RAM Memory Upgrade', name: 'Dell Core Upgrade - 32GB (2x16GB) DDR5 SO-DIMM 4800MHz', partNumber: '9S8Y1', priceEstimate: '$110' },
      { type: 'Storage SSD Upgrade', name: 'Dell Performance Solid State Drive - 1TB M.2 NVMe PCIe', partNumber: 'SSD1TB_M2', priceEstimate: '$120' },
      { type: 'Replacement Battery', name: 'Dell Premium 6-Cell 86Whr Lithium-Ion Laptop Battery', partNumber: '507JT', priceEstimate: '$99' },
      { type: 'Power Adapter Charger', name: 'Dell 130W USB-C Slim Power Supply Adapter Charger', partNumber: 'M1G10', priceEstimate: '$69' },
      { type: 'Replacement Display Assembly', name: 'Dell 15.6" InfinityEdge OLED 3.5K Sharp Touch Display Panel', partNumber: 'XPS15OLED', priceEstimate: '$299' }
    ];
  } else if (norm.includes('optiplex')) {
    return [
      { type: 'RAM Memory Upgrade', name: 'Dell Desktop Memory - 16GB DDR4 UDIMM 3200MHz', partNumber: 'OPT16GD5', priceEstimate: '$39' },
      { type: 'Storage SSD Upgrade', name: 'Dell Class 35 Micro PCIe NVMe 512GB M.2 Card', partNumber: 'PNVME1T', priceEstimate: '$55' },
      { type: 'Wall Charger Power Brick', name: 'Dell 90W Micro AC Adapter Charger Unit Power Brick', partNumber: 'M90W', priceEstimate: '$35' },
      { type: 'Wireless Peripheral Kit', name: 'Dell Pro Wireless Keyboard and Mouse Combo KM5521W', partNumber: 'KM5221W', priceEstimate: '$49' }
    ];
  } else {
    // Precision or Workstation defaults
    return [
      { type: 'RAM Memory Upgrade', name: 'Dell Performance Memory - 32GB DDR5 SO-DIMM 5600MHz Non-ECC', partNumber: 'OPT16GD5', priceEstimate: '$149' },
      { type: 'Storage SSD Upgrade', name: 'Dell Extreme Class 40 M.2 Gen4 NVMe 1TB PCIe Solid State Drive', partNumber: 'PNVME1T', priceEstimate: '$115' },
      { type: 'Replacement Battery', name: 'Dell 4-Cell 64Whr ExpressCharge Capable Battery Pack', partNumber: 'WYV7D', priceEstimate: '$89' },
      { type: 'Power Adapter Charger', name: 'Dell 130W USB-C Workstation Sleek Power Adapter', partNumber: 'M1G10', priceEstimate: '$65' }
    ];
  }
}

// Executes real TechDirect REST calls through secure server-side Proxy to bypass browser CORS constraints
export async function lookupDellServiceTag(serviceTag: string): Promise<{
  result: DellLookupResult;
  online: boolean;
  error?: string;
}> {
  const cleanedTag = serviceTag.trim().toUpperCase();
  if (cleanedTag.length !== 7 || !/^[A-Z0-9]{7}$/.test(cleanedTag)) {
    throw new Error('Dell Service Tags must be exactly 7 alphanumeric characters.');
  }

  // 1. Check local cache first
  const cached = getCachedDellResult(cleanedTag);
  if (cached) {
    return { result: cached, online: false };
  }

  // 2. Fetch local credentials
  const creds = getSavedDellCredentials();

  try {
    // Call server-side API proxy (CORS safe, secure credentials transport)
    const proxyResponse = await fetch('/api/dell/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        serviceTag: cleanedTag,
        clientId: creds.clientId,
        clientSecret: creds.clientSecret,
        environment: creds.environment
      })
    });

    if (!proxyResponse.ok) {
      throw new Error(`Proxy lookup status error: ${proxyResponse.statusText} (${proxyResponse.status})`);
    }

    const proxyResult = await proxyResponse.json();

    if (!proxyResult.online) {
      // Backend reported simulation fallback due to empty credentials or network failure
      const sandboxData = generateSandboxDellResult(cleanedTag);
      saveCachedDellResult(cleanedTag, sandboxData);
      return {
        result: sandboxData,
        online: false,
        error: proxyResult.reason || 'Sandbox Mode Active'
      };
    }

    const rawData = proxyResult.data;
    
    // Parse real Dell APIs schema structure
    const assetInfo = Array.isArray(rawData) ? rawData[0] : (rawData?.assetHeaderData || rawData);
    
    if (!assetInfo || (!assetInfo.serviceTag && !assetInfo.ServiceTag)) {
      throw new Error('Service Tag not recognized by Dell registers.');
    }

    const modelName = assetInfo.productModel || assetInfo.ProductModel || 'Dell Laptop System';
    const rawShipDate = assetInfo.shipDate || assetInfo.ShipDate || new Date().toISOString();
    const shipDate = rawShipDate.substring(0, 10); // Extract YYYY-MM-DD

    // Entitlements extraction
    const entitlements: any[] = assetInfo.entitlements || assetInfo.Entitlements || [];
    
    // Find absolute latest warranty entitlement expiration date
    let warrantyStart = shipDate;
    let warrantyEnd = shipDate;
    let warrantyStatus: 'Active' | 'Expired' = 'Expired';

    if (entitlements.length > 0) {
      const dates = entitlements.map(e => ({
        start: (e.startDate || e.StartDate || shipDate).substring(0, 10),
        end: (e.endDate || e.EndDate || shipDate).substring(0, 10),
        desc: e.serviceDescription || e.ServiceDescription || 'Standard Warranty',
        isActive: (e.status || e.Status || '').toLowerCase() === 'active' || new Date(e.endDate || e.EndDate) > new Date()
      }));

      // Sort by end date descending
      dates.sort((a, b) => b.end.localeCompare(a.end));
      
      warrantyStart = dates[dates.length - 1].start;
      warrantyEnd = dates[0].end;
      
      const anchorDateStr = '2026-06-15';
      warrantyStatus = warrantyEnd >= anchorDateStr ? 'Active' : 'Expired';
    }

    // Capture configurations
    const originalConfigObj: any[] = assetInfo.originalConfiguration || [];
    const originalConfig = originalConfigObj.map(c => c.partDescription || c.PartDescription || c.description).filter(Boolean);

    const result: DellLookupResult = {
      serviceTag: cleanedTag,
      model: modelName,
      systemType: assetInfo.productFamily || 'Dell Enterprise System',
      shipDate,
      warrantyStart,
      warrantyEnd,
      warrantyStatus,
      originalConfig: originalConfig.length > 0 ? originalConfig : [
        'OEM Hardware Profile Configuration Detals',
        `Linked motherboard asset tag: ${cleanedTag}`
      ],
      compatibleParts: getCompatiblePartsForModel(modelName),
      lookupTimestamp: Date.now()
    };

    saveCachedDellResult(cleanedTag, result);
    return { result, online: true };

  } catch (error: any) {
    console.error('Dell API Lookup Proxy Error:', error);
    const sandboxData = generateSandboxDellResult(cleanedTag);
    saveCachedDellResult(cleanedTag, sandboxData);
    
    return {
      result: sandboxData,
      online: false,
      error: `Proxy call failed: ${error?.message || error}. Displaying Local Sandbox data.`
    };
  }
}

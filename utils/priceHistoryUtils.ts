import type { Product, PriceHistoryPoint } from '../types';

export interface ProcurementAnalysis {
  currentCost: number;
  currentRetail: number;
  currentMarginPercent: number;
  currentMarkupPercent: number;
  historicalAvgCost: number;
  historicalAvgRetail: number;
  historicalAvgMarginPercent: number;
  costTrendPercent: number; // % change between earliest/recent cost
  costTrendDirection: 'rising' | 'falling' | 'stable';
  lowestRecordedCost: number;
  highestRecordedCost: number;
  targetReorderPriceMin: number;
  targetReorderPriceMax: number;
  recommendedOrderBatchSize: number;
  procurementSignal: 'STRONG_BUY' | 'OPTIMAL_BUY' | 'MONITOR' | 'PRICE_PRESSURE' | 'MARGIN_RISK';
  signalHeadline: string;
  signalExplanation: string;
  historyPoints: PriceHistoryPoint[];
}

/**
 * Static baseline historical price datasets for core auto spare parts
 */
const CATALOG_PRICE_HISTORIES: Record<string, PriceHistoryPoint[]> = {
  // Front Brake Pads (MS-BP-001)
  'MS-BP-001': [
    { date: '2025-06-15', batchRef: 'PO-2025-014', supplierName: 'Masuma Japan Global', costPrice: 3200, retailPrice: 4800, grossMarginPercent: 33.3, markupPercent: 50.0, orderVolume: 250, marketAverage: 4950, notes: 'Direct factory container shipment. Favorable JPY/KES exchange.' },
    { date: '2025-09-02', batchRef: 'PO-2025-042', supplierName: 'Masuma Japan Global', costPrice: 3350, retailPrice: 4950, grossMarginPercent: 32.3, markupPercent: 47.8, orderVolume: 200, marketAverage: 5100, notes: 'Q3 raw material index adjustment.' },
    { date: '2025-11-20', batchRef: 'PO-2025-078', supplierName: 'Masuma Japan Global', costPrice: 3500, retailPrice: 5100, grossMarginPercent: 31.4, markupPercent: 45.7, orderVolume: 180, marketAverage: 5250, notes: 'Port clearance tariff adjustment at Mombasa.' },
    { date: '2026-02-10', batchRef: 'PO-2026-008', supplierName: 'Masuma Japan Global', costPrice: 3750, retailPrice: 5350, grossMarginPercent: 29.9, markupPercent: 42.7, orderVolume: 220, marketAverage: 5400, notes: 'Ceramic friction material upgrade in manufacturing.' },
    { date: '2026-05-18', batchRef: 'PO-2026-039', supplierName: 'Masuma Japan Global', costPrice: 3900, retailPrice: 5500, grossMarginPercent: 29.1, markupPercent: 41.0, orderVolume: 150, marketAverage: 5650, notes: 'High sea freight surcharge on Indian Ocean route.' },
    { date: '2026-07-28', batchRef: 'PO-2026-064', supplierName: 'Masuma Japan Global', costPrice: 3750, retailPrice: 5500, grossMarginPercent: 31.8, markupPercent: 46.7, orderVolume: 300, marketAverage: 5600, notes: 'Consolidated bulk supplier discount negotiated at 300 pcs.' }
  ],

  // Engine Oil Filter (MS-OF-002)
  'MS-OF-002': [
    { date: '2025-05-10', batchRef: 'PO-2025-009', supplierName: 'Masuma Japan Global', costPrice: 720, retailPrice: 1100, grossMarginPercent: 34.5, markupPercent: 52.8, orderVolume: 500, marketAverage: 1150, notes: 'High volume master pallet order.' },
    { date: '2025-08-14', batchRef: 'PO-2025-033', supplierName: 'Masuma Japan Global', costPrice: 760, retailPrice: 1150, grossMarginPercent: 33.9, markupPercent: 51.3, orderVolume: 400, marketAverage: 1180, notes: 'Pleated filter paper cost index change.' },
    { date: '2025-11-05', batchRef: 'PO-2025-068', supplierName: 'Masuma Japan Global', costPrice: 800, retailPrice: 1200, grossMarginPercent: 33.3, markupPercent: 50.0, orderVolume: 450, marketAverage: 1220, notes: 'Stable supplier procurement window.' },
    { date: '2026-03-12', batchRef: 'PO-2026-016', supplierName: 'Masuma Japan Global', costPrice: 820, retailPrice: 1200, grossMarginPercent: 31.7, markupPercent: 46.3, orderVolume: 350, marketAverage: 1250, notes: 'Synthetic rubber gasket compound enhancement.' },
    { date: '2026-06-20', batchRef: 'PO-2026-050', supplierName: 'Masuma Japan Global', costPrice: 790, retailPrice: 1200, grossMarginPercent: 34.2, markupPercent: 51.9, orderVolume: 600, marketAverage: 1250, notes: 'Annual loyalty rebate tier applied.' }
  ],

  // Iridium Spark Plug (MS-SP-003)
  'MS-SP-003': [
    { date: '2025-04-12', batchRef: 'PO-2025-004', supplierName: 'Denso Global', costPrice: 1550, retailPrice: 2200, grossMarginPercent: 29.5, markupPercent: 41.9, orderVolume: 400, marketAverage: 2300, notes: 'Standard wholesale tier shipment.' },
    { date: '2025-08-20', batchRef: 'PO-2025-037', supplierName: 'Denso Global', costPrice: 1650, retailPrice: 2350, grossMarginPercent: 29.8, markupPercent: 42.4, orderVolume: 350, marketAverage: 2400, notes: 'Precious metal (Iridium/Platinum) market surge.' },
    { date: '2025-12-15', batchRef: 'PO-2025-081', supplierName: 'Denso Global', costPrice: 1720, retailPrice: 2450, grossMarginPercent: 29.8, markupPercent: 42.4, orderVolume: 300, marketAverage: 2500, notes: 'Year-end air courier surcharge.' },
    { date: '2026-04-10', batchRef: 'PO-2026-022', supplierName: 'Denso Global', costPrice: 1750, retailPrice: 2500, grossMarginPercent: 30.0, markupPercent: 42.9, orderVolume: 320, marketAverage: 2550, notes: 'Standard import batch.' },
    { date: '2026-07-22', batchRef: 'PO-2026-060', supplierName: 'Denso Global', costPrice: 1700, retailPrice: 2500, grossMarginPercent: 32.0, markupPercent: 47.1, orderVolume: 450, marketAverage: 2550, notes: 'Direct distributor rebate applied.' }
  ],

  // Shock Absorber (MS-SB-006)
  'MS-SB-006': [
    { date: '2025-05-02', batchRef: 'PO-2025-008', supplierName: 'KYB Japan', costPrice: 5400, retailPrice: 7800, grossMarginPercent: 30.8, markupPercent: 44.4, orderVolume: 80, marketAverage: 8100, notes: 'Heavy hydraulic damper batch.' },
    { date: '2025-09-18', batchRef: 'PO-2025-045', supplierName: 'KYB Japan', costPrice: 5700, retailPrice: 8100, grossMarginPercent: 29.6, markupPercent: 42.1, orderVolume: 70, marketAverage: 8300, notes: 'Steel rod forging cost increase.' },
    { date: '2026-01-25', batchRef: 'PO-2026-003', supplierName: 'KYB Japan', costPrice: 6000, retailPrice: 8300, grossMarginPercent: 27.7, markupPercent: 38.3, orderVolume: 60, marketAverage: 8500, notes: 'Temporary margin compression from freight rates.' },
    { date: '2026-05-12', batchRef: 'PO-2026-035', supplierName: 'KYB Japan', costPrice: 5900, retailPrice: 8500, grossMarginPercent: 30.6, markupPercent: 44.1, orderVolume: 90, marketAverage: 8700, notes: 'Retail price updated to restore 30%+ gross margin.' },
    { date: '2026-08-10', batchRef: 'PO-2026-071', supplierName: 'KYB Japan', costPrice: 5800, retailPrice: 8500, grossMarginPercent: 31.8, markupPercent: 46.6, orderVolume: 100, marketAverage: 8750, notes: 'Supplier trade discount on 100-pair MOQ.' }
  ],

  // Wiper Blade Set (MS-WB-005)
  'MS-WB-005': [
    { date: '2025-06-20', batchRef: 'PO-2025-018', supplierName: 'Bosch GmbH', costPrice: 1850, retailPrice: 2700, grossMarginPercent: 31.5, markupPercent: 45.9, orderVolume: 150, marketAverage: 2800, notes: 'Graphite coated dual-edge blade shipment.' },
    { date: '2025-10-10', batchRef: 'PO-2025-055', supplierName: 'Bosch GmbH', costPrice: 1950, retailPrice: 2850, grossMarginPercent: 31.6, markupPercent: 46.2, orderVolume: 180, marketAverage: 2950, notes: 'Pre-rainy season inventory build.' },
    { date: '2026-02-28', batchRef: 'PO-2026-011', supplierName: 'Bosch GmbH', costPrice: 2100, retailPrice: 2950, grossMarginPercent: 28.8, markupPercent: 40.5, orderVolume: 140, marketAverage: 3100, notes: 'European energy inflation impact on rubber plants.' },
    { date: '2026-06-10', batchRef: 'PO-2026-047', supplierName: 'Bosch GmbH', costPrice: 2050, retailPrice: 3000, grossMarginPercent: 31.7, markupPercent: 46.3, orderVolume: 200, marketAverage: 3150, notes: 'Bulk purchase order discount.' }
  ],

  // Tie Rod End (MS-TP-008)
  'MS-TP-008': [
    { date: '2025-07-04', batchRef: 'PO-2025-022', supplierName: 'Masuma Japan Global', costPrice: 2600, retailPrice: 3800, grossMarginPercent: 31.6, markupPercent: 46.2, orderVolume: 120, marketAverage: 3950, notes: 'High strength forged alloy steering parts.' },
    { date: '2025-11-12', batchRef: 'PO-2025-069', supplierName: 'Masuma Japan Global', costPrice: 2750, retailPrice: 3950, grossMarginPercent: 30.4, markupPercent: 43.6, orderVolume: 100, marketAverage: 4100, notes: 'Quarterly price review.' },
    { date: '2026-03-20', batchRef: 'PO-2026-018', supplierName: 'Masuma Japan Global', costPrice: 2900, retailPrice: 4100, grossMarginPercent: 29.3, markupPercent: 41.4, orderVolume: 90, marketAverage: 4250, notes: 'Customs valuation update.' },
    { date: '2026-07-15', batchRef: 'PO-2026-059', supplierName: 'Masuma Japan Global', costPrice: 2850, retailPrice: 4200, grossMarginPercent: 32.1, markupPercent: 47.4, orderVolume: 130, marketAverage: 4350, notes: 'Optimal pricing spread restored.' }
  ]
};

/**
 * Returns a robust array of price history points for any product.
 * If static points are present, returns them.
 * Otherwise, procedurally derives a mathematically sound 6-point historical curve
 * based on product retail price, estimated cost margin (65-72%), and realistic market variations.
 */
export function getProductPriceHistory(product: Product): PriceHistoryPoint[] {
  if (product.priceHistory && product.priceHistory.length > 0) {
    return product.priceHistory;
  }

  if (CATALOG_PRICE_HISTORIES[product.sku]) {
    return CATALOG_PRICE_HISTORIES[product.sku];
  }

  // Generate procedural realistic history based on product price and brand
  const currentRetail = product.price;
  const estimatedCost = product.costPrice || Math.round(currentRetail * 0.68);
  
  const dates = [
    '2025-05-15',
    '2025-08-20',
    '2025-11-10',
    '2026-02-14',
    '2026-05-22',
    '2026-08-15'
  ];

  const batchPrefixes = ['PO-2025-011', 'PO-2025-039', 'PO-2025-074', 'PO-2026-009', 'PO-2026-041', 'PO-2026-073'];
  
  // Create natural cost curve variations
  const costMultipliers = [0.88, 0.92, 0.96, 1.02, 1.01, 1.0];
  const retailMultipliers = [0.89, 0.93, 0.95, 0.98, 1.0, 1.0];

  return dates.map((date, idx) => {
    const cost = Math.round((estimatedCost * costMultipliers[idx]) / 50) * 50;
    const retail = Math.round((currentRetail * retailMultipliers[idx]) / 50) * 50;
    const margin = retail > 0 ? Number((((retail - cost) / retail) * 100).toFixed(1)) : 0;
    const markup = cost > 0 ? Number((((retail - cost) / cost) * 100).toFixed(1)) : 0;
    const marketAvg = Math.round((retail * 1.03) / 50) * 50;

    return {
      date,
      batchRef: batchPrefixes[idx],
      supplierName: `${product.brand} Distribution Hub`,
      costPrice: cost,
      retailPrice: retail,
      grossMarginPercent: margin,
      markupPercent: markup,
      orderVolume: 100 + (idx * 25),
      marketAverage: marketAvg,
      notes: idx === 0 
        ? 'Initial supplier agreement tier' 
        : idx === 3 
        ? 'Inbound logistics adjustment' 
        : idx === 5 
        ? 'Current active replenishment batch' 
        : 'Scheduled quarterly restock batch'
    };
  });
}

/**
 * Performs deep procurement analysis on price history points
 * giving actionable intelligence to purchasing managers
 */
export function analyzeProcurementTrends(product: Product): ProcurementAnalysis {
  const points = getProductPriceHistory(product);
  
  if (points.length === 0) {
    const cost = product.costPrice || Math.round(product.price * 0.68);
    const retail = product.price;
    const margin = retail > 0 ? Number((((retail - cost) / retail) * 100).toFixed(1)) : 0;
    const markup = cost > 0 ? Number((((retail - cost) / cost) * 100).toFixed(1)) : 0;

    return {
      currentCost: cost,
      currentRetail: retail,
      currentMarginPercent: margin,
      currentMarkupPercent: markup,
      historicalAvgCost: cost,
      historicalAvgRetail: retail,
      historicalAvgMarginPercent: margin,
      costTrendPercent: 0,
      costTrendDirection: 'stable',
      lowestRecordedCost: cost,
      highestRecordedCost: cost,
      targetReorderPriceMin: Math.round(cost * 0.95),
      targetReorderPriceMax: cost,
      recommendedOrderBatchSize: Math.max(20, (product.minStockLevel || 10) * 3),
      procurementSignal: 'OPTIMAL_BUY',
      signalHeadline: 'Stable Procurement Baseline',
      signalExplanation: 'Current purchase cost maintains standard catalog gross margins. Safe for routine reorder.',
      historyPoints: []
    };
  }

  const latestPoint = points[points.length - 1];
  const previousPoint = points.length > 1 ? points[points.length - 2] : latestPoint;
  const initialPoint = points[0];

  const currentCost = latestPoint.costPrice;
  const currentRetail = latestPoint.retailPrice;
  const currentMarginPercent = latestPoint.grossMarginPercent || Number((((currentRetail - currentCost) / currentRetail) * 100).toFixed(1));
  const currentMarkupPercent = latestPoint.markupPercent || Number((((currentRetail - currentCost) / currentCost) * 100).toFixed(1));

  const totalCost = points.reduce((sum, p) => sum + p.costPrice, 0);
  const totalRetail = points.reduce((sum, p) => sum + p.retailPrice, 0);
  const totalMargin = points.reduce((sum, p) => sum + (p.grossMarginPercent || 0), 0);

  const historicalAvgCost = Math.round(totalCost / points.length);
  const historicalAvgRetail = Math.round(totalRetail / points.length);
  const historicalAvgMarginPercent = Number((totalMargin / points.length).toFixed(1));

  const costs = points.map(p => p.costPrice);
  const lowestRecordedCost = Math.min(...costs);
  const highestRecordedCost = Math.max(...costs);

  // Calculate short-term cost velocity (between last two batches)
  const recentCostDelta = currentCost - previousPoint.costPrice;
  const costTrendPercent = previousPoint.costPrice > 0 
    ? Number(((recentCostDelta / previousPoint.costPrice) * 100).toFixed(1))
    : 0;

  let costTrendDirection: 'rising' | 'falling' | 'stable' = 'stable';
  if (costTrendPercent > 1.5) costTrendDirection = 'rising';
  else if (costTrendPercent < -1.5) costTrendDirection = 'falling';

  // Target procurement reorder range (aiming for optimal margin)
  const targetReorderPriceMin = Math.round(lowestRecordedCost * 1.02);
  const targetReorderPriceMax = Math.round(Math.min(currentCost, historicalAvgCost));

  // Determine procurement signal
  let procurementSignal: ProcurementAnalysis['procurementSignal'] = 'OPTIMAL_BUY';
  let signalHeadline = 'Optimal Reorder Window';
  let signalExplanation = 'Cost is stable and gross margins are healthy. Proceed with planned replenishment.';

  if (currentMarginPercent < 28) {
    procurementSignal = 'MARGIN_RISK';
    signalHeadline = '⚠️ Margin Compression Alert';
    signalExplanation = `Gross margin is currently ${currentMarginPercent}%, below the 30% target threshold. Negotiate lower supplier unit price or revise retail tier upward.`;
  } else if (costTrendDirection === 'falling' && currentMarginPercent >= 30) {
    procurementSignal = 'STRONG_BUY';
    signalHeadline = '🎯 Favorable Purchase Dip (High Value)';
    signalExplanation = `Supplier unit cost dropped by ${Math.abs(costTrendPercent)}% in the latest batch. Excellent window to lock in bulk volume at KES ${currentCost.toLocaleString()}.`;
  } else if (costTrendDirection === 'rising' && costTrendPercent > 5) {
    procurementSignal = 'PRICE_PRESSURE';
    signalHeadline = '📈 Cost Inflation Detected (+ ' + costTrendPercent + '%)';
    signalExplanation = `Unit procurement cost increased from KES ${previousPoint.costPrice.toLocaleString()} to KES ${currentCost.toLocaleString()}. Push for tiered volume discounts or evaluate alternative shipping consolidation.`;
  } else if (currentCost > historicalAvgCost) {
    procurementSignal = 'MONITOR';
    signalHeadline = 'Cost Above 12-Month Average';
    signalExplanation = `Current purchase cost is ${Math.round(((currentCost - historicalAvgCost) / historicalAvgCost) * 100)}% above 12-month historical mean (KES ${historicalAvgCost.toLocaleString()}). Benchmark against market average.`;
  }

  // Recommended replenishment lot
  const safetyStock = product.minStockLevel || 10;
  const currentStock = product.stock;
  const stockDeficit = Math.max(0, safetyStock * 2 - currentStock);
  const recommendedOrderBatchSize = Math.max(safetyStock * 3, stockDeficit + (safetyStock * 2));

  return {
    currentCost,
    currentRetail,
    currentMarginPercent,
    currentMarkupPercent,
    historicalAvgCost,
    historicalAvgRetail,
    historicalAvgMarginPercent,
    costTrendPercent,
    costTrendDirection,
    lowestRecordedCost,
    highestRecordedCost,
    targetReorderPriceMin,
    targetReorderPriceMax,
    recommendedOrderBatchSize,
    procurementSignal,
    signalHeadline,
    signalExplanation,
    historyPoints: points
  };
}

import React, { useState, useMemo } from 'react';
import type { Product, PriceHistoryPoint } from '../../types';
import { 
  analyzeProcurementTrends, 
  getProductPriceHistory, 
  ProcurementAnalysis 
} from '../../utils/priceHistoryUtils';
import { useSystemSettings } from '../../contexts/SettingsContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Calendar, 
  Package, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle, 
  Layers, 
  Sliders, 
  Sparkles, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight,
  Info,
  Building2
} from 'lucide-react';

interface ProductPriceTrendSectionProps {
  product: Product;
  onOpenCreatePO?: (product: Product, suggestedCost: number, suggestedQty: number) => void;
  compact?: boolean;
}

export const ProductPriceTrendSection: React.FC<ProductPriceTrendSectionProps> = ({
  product,
  onOpenCreatePO,
  compact = false
}) => {
  const { settings, formatPrice } = useSystemSettings();
  
  // View states
  const [selectedView, setSelectedView] = useState<'prices' | 'margin' | 'markup'>('prices');
  const [timeRange, setTimeRange] = useState<'all' | 'recent' | 'year'>('all');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);
  const [showTable, setShowTable] = useState<boolean>(false);

  // Analysis data
  const analysis: ProcurementAnalysis = useMemo(() => {
    return analyzeProcurementTrends(product);
  }, [product]);

  // Filter points based on selected time range
  const filteredPoints = useMemo(() => {
    const raw = analysis.historyPoints;
    if (timeRange === 'recent') {
      return raw.slice(-3);
    }
    if (timeRange === 'year') {
      return raw.slice(-5);
    }
    return raw;
  }, [analysis.historyPoints, timeRange]);

  // Simulator state
  const [simCost, setSimCost] = useState<number>(analysis.currentCost);
  const [simRetail, setSimRetail] = useState<number>(analysis.currentRetail);

  const simMargin = simRetail > 0 ? Number((((simRetail - simCost) / simRetail) * 100).toFixed(1)) : 0;
  const simProfit = simRetail - simCost;
  const simProfitDelta = simProfit - (analysis.currentRetail - analysis.currentCost);

  // Active hover point or default to latest
  const activePoint = hoveredIndex !== null && filteredPoints[hoveredIndex] 
    ? filteredPoints[hoveredIndex] 
    : filteredPoints[filteredPoints.length - 1];

  // SVG Chart Geometry Calculations
  const chartHeight = compact ? 180 : 260;
  const chartWidth = 600;
  const padding = { top: 25, right: 35, bottom: 40, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Min / Max calculations for scaling
  const chartValues = useMemo(() => {
    if (filteredPoints.length === 0) return { min: 0, max: 100 };

    if (selectedView === 'prices') {
      const allPrices = filteredPoints.flatMap(p => [
        p.costPrice, 
        p.retailPrice, 
        p.marketAverage || p.retailPrice
      ]);
      const min = Math.min(...allPrices);
      const max = Math.max(...allPrices);
      const margin = (max - min) * 0.15 || 500;
      return { 
        min: Math.max(0, Math.floor((min - margin) / 100) * 100), 
        max: Math.ceil((max + margin) / 100) * 100 
      };
    } else if (selectedView === 'margin') {
      const margins = filteredPoints.map(p => p.grossMarginPercent || 0);
      const min = Math.min(...margins);
      const max = Math.max(...margins);
      return { 
        min: Math.max(0, Math.floor(min - 5)), 
        max: Math.min(100, Math.ceil(max + 5)) 
      };
    } else {
      const markups = filteredPoints.map(p => p.markupPercent || 0);
      const min = Math.min(...markups);
      const max = Math.max(...markups);
      return { 
        min: Math.max(0, Math.floor(min - 10)), 
        max: Math.ceil(max + 10) 
      };
    }
  }, [filteredPoints, selectedView]);

  // Scaling helper functions
  const getX = (index: number) => {
    if (filteredPoints.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (filteredPoints.length - 1)) * innerWidth;
  };

  const getY = (value: number) => {
    const range = chartValues.max - chartValues.min;
    if (range <= 0) return padding.top + innerHeight / 2;
    const normalized = (value - chartValues.min) / range;
    return padding.top + innerHeight - (normalized * innerHeight);
  };

  // Generate SVG path for a continuous series
  const generateLinePath = (values: number[]) => {
    if (values.length === 0) return '';
    return values.map((val, idx) => {
      const x = getX(idx);
      const y = getY(val);
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // Generate Area polygon path between retail and cost (Margin corridor)
  const generateMarginAreaPath = () => {
    if (filteredPoints.length === 0) return '';
    const topPoints = filteredPoints.map((p, idx) => `${getX(idx)} ${getY(p.retailPrice)}`);
    const bottomPoints = [...filteredPoints].reverse().map((p, idx) => {
      const originalIdx = filteredPoints.length - 1 - idx;
      return `${getX(originalIdx)} ${getY(p.costPrice)}`;
    });
    return `M ${topPoints.join(' L ')} L ${bottomPoints.join(' L ')} Z`;
  };

  // Generate Cost fill path (cost to baseline)
  const generateCostAreaPath = () => {
    if (filteredPoints.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(filteredPoints.length - 1);
    const baseY = padding.top + innerHeight;
    const linePoints = filteredPoints.map((p, idx) => `${getX(idx)} ${getY(p.costPrice)}`).join(' L ');
    return `M ${firstX} ${baseY} L ${linePoints} L ${lastX} ${baseY} Z`;
  };

  // Generate Y-axis grid ticks (4 intervals)
  const yTicks = useMemo(() => {
    const ticks = [];
    const count = 4;
    const step = (chartValues.max - chartValues.min) / count;
    for (let i = 0; i <= count; i++) {
      const val = chartValues.min + (step * i);
      ticks.push(val);
    }
    return ticks;
  }, [chartValues]);

  // Signal Styling helper
  const getSignalBadge = () => {
    switch (analysis.procurementSignal) {
      case 'STRONG_BUY':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
          icon: <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        };
      case 'OPTIMAL_BUY':
        return {
          bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300',
          icon: <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
        };
      case 'PRICE_PRESSURE':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300',
          icon: <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        };
      case 'MARGIN_RISK':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300',
          icon: <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
          icon: <Info className="w-4 h-4 text-slate-500 shrink-0" />
        };
    }
  };

  const signalStyle = getSignalBadge();

  return (
    <div className="space-y-4 text-slate-900 dark:text-slate-100">
      
      {/* PROCUREMENT SIGNAL BANNER */}
      <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${signalStyle.bg}`}>
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5">{signalStyle.icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
                Procurement Intelligence
              </span>
              <span className="font-extrabold text-xs">{analysis.signalHeadline}</span>
            </div>
            <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed font-sans max-w-xl">
              {analysis.signalExplanation}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {onOpenCreatePO && (
            <button
              onClick={() => onOpenCreatePO(product, analysis.targetReorderPriceMin, analysis.recommendedOrderBatchSize)}
              className="px-3 py-1.5 bg-brand-orange hover:bg-orange-600 text-white rounded-lg font-black text-xs uppercase tracking-wider shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Draft PO ({analysis.recommendedOrderBatchSize} pcs)</span>
            </button>
          )}
        </div>
      </div>

      {/* STRATEGIC KPI METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        
        {/* Metric 1: Current Landed Cost */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Unit Landed Cost</span>
            <span className="flex items-center text-[10px] font-black text-amber-600 dark:text-amber-400">
              {analysis.costTrendDirection === 'rising' ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : analysis.costTrendDirection === 'falling' ? (
                <ArrowDownRight className="w-3 h-3 text-emerald-500" />
              ) : null}
              {analysis.costTrendPercent !== 0 ? `${Math.abs(analysis.costTrendPercent)}%` : 'Stable'}
            </span>
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
            {formatPrice(analysis.currentCost)}
          </div>
          <span className="text-[9px] text-slate-400 block truncate">
            12M Avg: {formatPrice(analysis.historicalAvgCost)}
          </span>
        </div>

        {/* Metric 2: Current Retail List Price */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Retail List Price</span>
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 font-mono">
              B2C / Counter
            </span>
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
            {formatPrice(analysis.currentRetail)}
          </div>
          <span className="text-[9px] text-slate-400 block truncate">
            Spread: +{formatPrice(analysis.currentRetail - analysis.currentCost)}
          </span>
        </div>

        {/* Metric 3: Gross Margin Corridor */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Gross Margin %</span>
            <span className={`text-[10px] font-black ${
              analysis.currentMarginPercent >= 30 ? 'text-emerald-500' : 'text-rose-500'
            }`}>
              {analysis.currentMarginPercent >= 30 ? 'Target ≥30% Met' : 'Below Target'}
            </span>
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
            {analysis.currentMarginPercent}%
          </div>
          <span className="text-[9px] text-slate-400 block truncate">
            Markup: {analysis.currentMarkupPercent}% on Cost
          </span>
        </div>

        {/* Metric 4: Target Reorder Target Price */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Target PO Reorder</span>
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 font-mono">
              MOQ ~{analysis.recommendedOrderBatchSize}
            </span>
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5">
            {formatPrice(analysis.targetReorderPriceMin)}
          </div>
          <span className="text-[9px] text-slate-400 block truncate">
            Hist Low: {formatPrice(analysis.lowestRecordedCost)}
          </span>
        </div>

      </div>

      {/* TREND LINE CHART CONTAINER */}
      <div className="bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
        
        {/* CHART HEADER CONTROLS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setSelectedView('prices')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                selectedView === 'prices'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cost vs Retail (KES)
            </button>
            <button
              onClick={() => setSelectedView('margin')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                selectedView === 'margin'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Gross Margin %
            </button>
            <button
              onClick={() => setSelectedView('markup')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                selectedView === 'markup'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Markup Spread %
            </button>
          </div>

          {/* Timeframe selector & Tools */}
          <div className="flex items-center gap-2">
            <div className="flex items-center text-xs font-bold bg-slate-200/70 dark:bg-slate-800 rounded-lg p-0.5 text-slate-500">
              <button
                onClick={() => setTimeRange('recent')}
                className={`px-2.5 py-1 rounded ${timeRange === 'recent' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : ''}`}
              >
                Last 3 Batches
              </button>
              <button
                onClick={() => setTimeRange('year')}
                className={`px-2.5 py-1 rounded ${timeRange === 'year' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : ''}`}
              >
                12M
              </button>
              <button
                onClick={() => setTimeRange('all')}
                className={`px-2.5 py-1 rounded ${timeRange === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : ''}`}
              >
                All Cycles
              </button>
            </div>

            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition ${
                showSimulator 
                  ? 'bg-brand-orange text-white border-brand-orange' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
              }`}
              title="Toggle What-If Reorder Simulator"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simulator</span>
            </button>

            <button
              onClick={() => setShowTable(!showTable)}
              className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition ${
                showTable 
                  ? 'bg-indigo-600 text-white border-indigo-600' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
              }`}
              title="Toggle Detailed Batch Ledger Table"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ledger</span>
            </button>
          </div>
        </div>

        {/* CHART LEGEND STRIP */}
        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono py-2 text-slate-500">
          <div className="flex items-center gap-4">
            {selectedView === 'prices' ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1.5 bg-amber-500 rounded-full"></span>
                  <span className="font-sans font-bold text-amber-700 dark:text-amber-400">Unit Landed Cost</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1.5 bg-indigo-500 rounded-full"></span>
                  <span className="font-sans font-bold text-indigo-700 dark:text-indigo-400">Retail List Price</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xs"></span>
                  <span className="font-sans text-slate-400">Margin Corridor</span>
                </div>
                <div className="flex items-center gap-1.5 hidden sm:flex">
                  <span className="w-3 h-0.5 border-t border-dashed border-slate-400"></span>
                  <span className="font-sans text-slate-400">Market Benchmark</span>
                </div>
              </>
            ) : selectedView === 'margin' ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1.5 bg-emerald-500 rounded-full"></span>
                  <span className="font-sans font-bold text-emerald-700 dark:text-emerald-400">Gross Margin %</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t border-dashed border-rose-400"></span>
                  <span className="font-sans text-rose-500">Target Min (30%)</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-cyan-500 rounded-full"></span>
                <span className="font-sans font-bold text-cyan-700 dark:text-cyan-400">Markup on Landed Cost %</span>
              </div>
            )}
          </div>

          {activePoint && (
            <div className="text-right text-[10px] text-slate-400">
              Hovering: <span className="font-bold text-slate-700 dark:text-slate-200">{activePoint.date} ({activePoint.batchRef})</span>
            </div>
          )}
        </div>

        {/* INTERACTIVE SVG CANVAS */}
        <div className="relative w-full overflow-hidden select-none">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto overflow-visible font-sans"
            style={{ minHeight: compact ? '160px' : '220px' }}
          >
            <defs>
              {/* Gradients */}
              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="retailGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="marginCorridorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.08" />
              </linearGradient>

              <linearGradient id="marginLineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines & Y-axis labels */}
            {yTicks.map((val, idx) => {
              const y = getY(val);
              return (
                <g key={idx} className="text-slate-300 dark:text-slate-700">
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + innerWidth}
                    y2={y}
                    stroke="currentColor"
                    strokeDasharray={idx === 0 ? 'none' : '3 3'}
                    strokeWidth="1"
                    opacity={0.6}
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    className="text-[9px] font-mono fill-slate-400 dark:fill-slate-500 font-medium"
                  >
                    {selectedView === 'prices' ? `${(val / 1000).toFixed(1)}k` : `${Math.round(val)}%`}
                  </text>
                </g>
              );
            })}

            {/* Target 30% margin threshold guide in margin view */}
            {selectedView === 'margin' && chartValues.min <= 30 && chartValues.max >= 30 && (
              <g>
                <line
                  x1={padding.left}
                  y1={getY(30)}
                  x2={padding.left + innerWidth}
                  y2={getY(30)}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                  opacity={0.8}
                />
                <text
                  x={padding.left + innerWidth - 5}
                  y={getY(30) - 5}
                  textAnchor="end"
                  className="text-[8px] font-mono fill-rose-500 font-bold"
                >
                  Target Margin Threshold: 30%
                </text>
              </g>
            )}

            {/* VIEW 1: COST VS RETAIL */}
            {selectedView === 'prices' && (
              <>
                {/* Margin Corridor Shading */}
                <path
                  d={generateMarginAreaPath()}
                  fill="url(#marginCorridorGradient)"
                />

                {/* Market Benchmark Dotted Line */}
                <path
                  d={generateLinePath(filteredPoints.map(p => p.marketAverage || p.retailPrice * 1.02))}
                  fill="none"
                  stroke="#94a3b8"
                  strokeDasharray="4 3"
                  strokeWidth="1.5"
                  opacity={0.7}
                />

                {/* Cost Fill Area */}
                <path
                  d={generateCostAreaPath()}
                  fill="url(#costGradient)"
                />

                {/* Retail Price Line */}
                <path
                  d={generateLinePath(filteredPoints.map(p => p.retailPrice))}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Cost Price Line */}
                <path
                  d={generateLinePath(filteredPoints.map(p => p.costPrice))}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {/* VIEW 2: GROSS MARGIN % */}
            {selectedView === 'margin' && (
              <>
                <path
                  d={`M ${getX(0)} ${padding.top + innerHeight} L ${filteredPoints.map((p, i) => `${getX(i)} ${getY(p.grossMarginPercent || 0)}`).join(' L ')} L ${getX(filteredPoints.length - 1)} ${padding.top + innerHeight} Z`}
                  fill="url(#marginLineGradient)"
                />
                <path
                  d={generateLinePath(filteredPoints.map(p => p.grossMarginPercent || 0))}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {/* VIEW 3: MARKUP % */}
            {selectedView === 'markup' && (
              <path
                d={generateLinePath(filteredPoints.map(p => p.markupPercent || 0))}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Data Points & Hover Scrubber */}
            {filteredPoints.map((point, idx) => {
              const x = getX(idx);
              const isHovered = hoveredIndex === idx;

              const costY = getY(point.costPrice);
              const retailY = getY(point.retailPrice);
              const marginY = getY(point.grossMarginPercent || 0);
              const markupY = getY(point.markupPercent || 0);

              return (
                <g key={idx} className="cursor-pointer">
                  {/* Vertical Crosshair on Hover */}
                  {isHovered && (
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + innerHeight}
                      stroke="#64748b"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                      opacity={0.8}
                    />
                  )}

                  {/* Nodes based on selected view */}
                  {selectedView === 'prices' ? (
                    <>
                      {/* Retail node */}
                      <circle
                        cx={x}
                        cy={retailY}
                        r={isHovered ? 5.5 : 3.5}
                        fill="#6366f1"
                        stroke="#ffffff"
                        strokeWidth={isHovered ? 2.5 : 1.5}
                        className="transition-all"
                      />
                      {/* Cost node */}
                      <circle
                        cx={x}
                        cy={costY}
                        r={isHovered ? 5.5 : 3.5}
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth={isHovered ? 2.5 : 1.5}
                        className="transition-all"
                      />
                    </>
                  ) : selectedView === 'margin' ? (
                    <circle
                      cx={x}
                      cy={marginY}
                      r={isHovered ? 6 : 4}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth={2}
                      className="transition-all"
                    />
                  ) : (
                    <circle
                      cx={x}
                      cy={markupY}
                      r={isHovered ? 6 : 4}
                      fill="#06b6d4"
                      stroke="#ffffff"
                      strokeWidth={2}
                      className="transition-all"
                    />
                  )}

                  {/* X-axis date labels */}
                  <text
                    x={x}
                    y={padding.top + innerHeight + 16}
                    textAnchor="middle"
                    className={`text-[9px] font-mono ${
                      isHovered 
                        ? 'fill-slate-900 dark:fill-white font-bold' 
                        : 'fill-slate-400 dark:fill-slate-500'
                    }`}
                  >
                    {point.date.slice(5)}
                  </text>

                  {/* Transparent hover capture rect */}
                  <rect
                    x={x - (innerWidth / (filteredPoints.length * 2))}
                    y={padding.top}
                    width={innerWidth / filteredPoints.length}
                    height={innerHeight + 25}
                    fill="transparent"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* ACTIVE HOVER CARD SUMMARY */}
        {activePoint && (
          <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">
                  Batch: {activePoint.batchRef || 'Initial Baseline'}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  ({activePoint.date})
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {activePoint.supplierName || product.brand}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans italic">
                {activePoint.notes || 'Routine inventory replenishment batch.'}
              </p>
            </div>

            <div className="flex items-center gap-4 font-mono shrink-0 self-end sm:self-center">
              <div>
                <span className="text-[9px] uppercase text-amber-500 block font-bold">Landed Cost</span>
                <span className="font-black text-amber-600 dark:text-amber-400">
                  {formatPrice(activePoint.costPrice)}
                </span>
              </div>
              <div className="border-l pl-3 border-slate-200 dark:border-slate-700">
                <span className="text-[9px] uppercase text-indigo-500 block font-bold">Retail Price</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400">
                  {formatPrice(activePoint.retailPrice)}
                </span>
              </div>
              <div className="border-l pl-3 border-slate-200 dark:border-slate-700">
                <span className="text-[9px] uppercase text-emerald-500 block font-bold">Margin</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {activePoint.grossMarginPercent}%
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* WHAT-IF REORDER & COST SIMULATOR */}
      {showSimulator && (
        <div className="p-4 bg-gradient-to-br from-amber-500/5 via-slate-50 to-orange-500/5 dark:from-slate-850 dark:to-slate-800 rounded-2xl border border-amber-500/20 dark:border-amber-500/10 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-brand-orange text-white rounded-lg">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                  Procurement What-If Reorder Simulator
                </h4>
                <p className="text-[10px] text-slate-500">
                  Test supplier quotes and assess projected gross margin return before placing purchase orders
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSimCost(analysis.currentCost);
                setSimRetail(analysis.currentRetail);
              }}
              className="text-[10px] font-bold text-brand-orange hover:underline"
            >
              Reset to Current
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Input 1: Proposed Cost Quote */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Proposed Supplier Unit Cost:
                </label>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                  {formatPrice(simCost)}
                </span>
              </div>
              <input
                type="range"
                min={Math.round(analysis.lowestRecordedCost * 0.8)}
                max={Math.round(analysis.highestRecordedCost * 1.3)}
                step={50}
                value={simCost}
                onChange={(e) => setSimCost(Number(e.target.value))}
                className="w-full accent-amber-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>Low: {formatPrice(Math.round(analysis.lowestRecordedCost * 0.8))}</span>
                <span>Current: {formatPrice(analysis.currentCost)}</span>
                <span>High: {formatPrice(Math.round(analysis.highestRecordedCost * 1.3))}</span>
              </div>
            </div>

            {/* Input 2: Proposed Retail Selling Price */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Proposed Retail List Price:
                </label>
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                  {formatPrice(simRetail)}
                </span>
              </div>
              <input
                type="range"
                min={Math.round(simCost * 1.1)}
                max={Math.round(analysis.currentRetail * 1.5)}
                step={50}
                value={simRetail}
                onChange={(e) => setSimRetail(Number(e.target.value))}
                className="w-full accent-indigo-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>Min: {formatPrice(Math.round(simCost * 1.1))}</span>
                <span>Current: {formatPrice(analysis.currentRetail)}</span>
                <span>Max: {formatPrice(Math.round(analysis.currentRetail * 1.5))}</span>
              </div>
            </div>

          </div>

          {/* SIMULATOR OUTCOME STRIP */}
          <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Projected Margin %</span>
              <span className={`text-sm font-black font-mono mt-0.5 block ${
                simMargin >= 30 ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {simMargin}%
              </span>
            </div>

            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Profit per Unit</span>
              <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                {formatPrice(simProfit)}
              </span>
            </div>

            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Profit Delta vs Active</span>
              <span className={`text-sm font-black font-mono mt-0.5 block ${
                simProfitDelta >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {simProfitDelta >= 0 ? `+${formatPrice(simProfitDelta)}` : formatPrice(simProfitDelta)}
              </span>
            </div>
          </div>

          {onOpenCreatePO && (
            <div className="flex justify-end pt-1">
              <button
                onClick={() => onOpenCreatePO(product, simCost, analysis.recommendedOrderBatchSize)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Create Purchase Requisition with Sim Cost ({formatPrice(simCost)})</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* DETAILED BATCH LEDGER TABLE */}
      {showTable && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden overflow-x-auto text-xs animate-in fade-in duration-150">
          <table className="w-full text-left font-sans">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-2.5">Date / Batch</th>
                <th className="p-2.5">Supplier</th>
                <th className="p-2.5 text-right font-mono">Unit Cost</th>
                <th className="p-2.5 text-right font-mono">Retail Price</th>
                <th className="p-2.5 text-right font-mono">Unit Spread</th>
                <th className="p-2.5 text-right font-mono">Gross Margin %</th>
                <th className="p-2.5 text-center">Batch Vol</th>
                <th className="p-2.5">Procurement Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-750 bg-white dark:bg-slate-850">
              {filteredPoints.map((point, index) => {
                const spread = point.retailPrice - point.costPrice;
                return (
                  <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800 font-mono text-[11px]">
                    <td className="p-2.5">
                      <span className="font-bold text-brand-orange block">{point.batchRef || 'Baseline'}</span>
                      <span className="text-[9px] text-slate-400 font-sans">{point.date}</span>
                    </td>
                    <td className="p-2.5 font-sans font-semibold text-slate-800 dark:text-slate-200">
                      {point.supplierName || product.brand}
                    </td>
                    <td className="p-2.5 text-right font-bold text-amber-600 dark:text-amber-400">
                      {formatPrice(point.costPrice)}
                    </td>
                    <td className="p-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                      {formatPrice(point.retailPrice)}
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                      +{formatPrice(spread)}
                    </td>
                    <td className="p-2.5 text-right font-bold">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        (point.grossMarginPercent || 0) >= 30
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {point.grossMarginPercent}%
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-bold text-slate-600 dark:text-slate-400">
                      {point.orderVolume || 100} pcs
                    </td>
                    <td className="p-2.5 font-sans text-[11px] text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {point.notes || 'Scheduled replenishment'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

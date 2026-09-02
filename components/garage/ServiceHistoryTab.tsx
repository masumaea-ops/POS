import React, { useState, useMemo } from 'react';
import { useGarage } from '../../contexts/GarageContext';
import { useSystemSettings } from '../../contexts/SettingsContext';
import type { JobCard } from '../../types';
import { 
  History, 
  Search, 
  Download, 
  Calendar, 
  Car, 
  User, 
  Wrench, 
  DollarSign, 
  CheckCircle2, 
  FileText, 
  Filter, 
  Building2, 
  ShieldCheck, 
  Eye, 
  Printer, 
  ArrowUpDown,
  Layers,
  X
} from 'lucide-react';

export const ServiceHistoryTab: React.FC = () => {
  const { jobCards, branches, activeBranchId } = useGarage();
  const { formatPrice } = useSystemSettings();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>(activeBranchId || 'ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL_ARCHIVED'); // ALL_ARCHIVED, Completed, Invoiced
  const [dateRangePreset, setDateRangePreset] = useState<string>('ALL'); // ALL, THIS_MONTH, LAST_MONTH, CUSTOM
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Selected Card for Modal
  const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<'date' | 'total' | 'plate'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter job cards to only include historical completed/invoiced orders (or optionally all if user wants)
  const historicalJobCards = useMemo(() => {
    return jobCards.filter(jc => {
      // Branch filter
      if (branchFilter !== 'ALL' && jc.branchId !== branchFilter) return false;

      // Status filter
      if (statusFilter === 'ALL_ARCHIVED') {
        if (jc.status !== 'Completed' && jc.status !== 'Invoiced') return false;
      } else if (statusFilter === 'Completed') {
        if (jc.status !== 'Completed') return false;
      } else if (statusFilter === 'Invoiced') {
        if (jc.status !== 'Invoiced') return false;
      }

      // Search term filter (Plate, VIN, Owner, Make/Model, ID, Technician)
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchId = jc.id.toLowerCase().includes(query);
        const matchPlate = jc.vehicle.plateNumber.toLowerCase().includes(query);
        const matchVin = jc.vehicle.vin.toLowerCase().includes(query);
        const matchOwner = jc.vehicle.ownerName.toLowerCase().includes(query);
        const matchMake = jc.vehicle.make.toLowerCase().includes(query);
        const matchModel = jc.vehicle.model.toLowerCase().includes(query);
        const matchTech = jc.assignedTechnicianName.toLowerCase().includes(query);
        const matchGatePass = jc.gatePassCode?.toLowerCase().includes(query) || false;

        if (!matchId && !matchPlate && !matchVin && !matchOwner && !matchMake && !matchModel && !matchTech && !matchGatePass) {
          return false;
        }
      }

      // Date Range Filter
      const cardDateStr = jc.checkInDate.split(' ')[0]; // e.g. "2026-07-25"
      if (dateRangePreset === 'THIS_MONTH') {
        // e.g., 2026-07
        if (!cardDateStr.startsWith('2026-07')) return false;
      } else if (dateRangePreset === 'LAST_MONTH') {
        // e.g., 2026-06
        if (!cardDateStr.startsWith('2026-06')) return false;
      } else if (dateRangePreset === 'CUSTOM') {
        if (startDate && cardDateStr < startDate) return false;
        if (endDate && cardDateStr > endDate) return false;
      }

      return true;
    });
  }, [jobCards, branchFilter, statusFilter, searchTerm, dateRangePreset, startDate, endDate]);

  // Sorted job cards
  const sortedJobCards = useMemo(() => {
    return [...historicalJobCards].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = a.checkInDate.localeCompare(b.checkInDate);
      } else if (sortField === 'total') {
        comparison = a.totalEstimate - b.totalEstimate;
      } else if (sortField === 'plate') {
        comparison = a.vehicle.plateNumber.localeCompare(b.vehicle.plateNumber);
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [historicalJobCards, sortField, sortDirection]);

  // Summary Metrics
  const totalRevenue = useMemo(() => {
    return historicalJobCards.reduce((acc, jc) => acc + (jc.totalEstimate || 0), 0);
  }, [historicalJobCards]);

  const avgRevenue = useMemo(() => {
    if (historicalJobCards.length === 0) return 0;
    return Math.round(totalRevenue / historicalJobCards.length);
  }, [totalRevenue, historicalJobCards.length]);

  const gatePassesCount = useMemo(() => {
    return historicalJobCards.filter(jc => jc.gatePassIssued).length;
  }, [historicalJobCards]);

  // Handle Export CSV
  const handleExportCSV = () => {
    if (sortedJobCards.length === 0) {
      alert('No service history records available to export for the selected filters.');
      return;
    }

    const headers = [
      'Job Card ID',
      'Outlet Branch',
      'Check-In Date',
      'Completion Date',
      'Vehicle Plate',
      'VIN',
      'Make',
      'Model',
      'Year',
      'Mileage (km)',
      'Owner Name',
      'Owner Phone',
      'Primary Technician',
      'Complaints',
      'Subtotal (KES)',
      'Tax Amount (KES)',
      'Discount (KES)',
      'Total Amount (KES)',
      'Payment Status',
      'Job Status',
      'Gate Pass Issued',
      'Gate Pass Code'
    ];

    const escape = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = sortedJobCards.map(jc => [
      escape(jc.id),
      escape(jc.branchName),
      escape(jc.checkInDate),
      escape(jc.estimatedCompletion),
      escape(jc.vehicle.plateNumber),
      escape(jc.vehicle.vin),
      escape(jc.vehicle.make),
      escape(jc.vehicle.model),
      escape(jc.vehicle.year),
      escape(jc.vehicle.mileageKm),
      escape(jc.vehicle.ownerName),
      escape(jc.vehicle.ownerPhone),
      escape(jc.assignedTechnicianName),
      escape(jc.customerComplaints.join('; ')),
      escape(jc.subtotalAmount),
      escape(jc.taxAmount),
      escape(jc.discountAmount),
      escape(jc.totalEstimate),
      escape(jc.paymentStatus),
      escape(jc.status),
      escape(jc.gatePassIssued ? 'Yes' : 'No'),
      escape(jc.gatePassCode || 'N/A')
    ]);

    const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Masuma_Garage_Service_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSort = (field: 'date' | 'total' | 'plate') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Top Banner & KPI Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white font-mono">
                Service History & Work Order Archive
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Centralized registry of completed vehicle repairs, historical job card invoices, and gate pass release records
              </p>
            </div>
          </div>
        </div>

        {/* CSV Export Action Button */}
        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-950 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all font-mono uppercase tracking-wider shadow-md shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4 text-brand-orange" />
          <span>Export Summary CSV ({sortedJobCards.length})</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Archived Orders</span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {historicalJobCards.length}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Historical Revenue</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatPrice(totalRevenue)}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Average Ticket Size</span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {formatPrice(avgRevenue)}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Verified Gate Passes</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {gatePassesCount} / {historicalJobCards.length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Vehicle Plate (e.g. KCL 990Z), VIN, Customer, Job ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Date Range Preset Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={dateRangePreset}
              onChange={(e) => setDateRangePreset(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              <option value="ALL">All Dates / All Time</option>
              <option value="THIS_MONTH">This Month (July 2026)</option>
              <option value="LAST_MONTH">Last Month (June 2026)</option>
              <option value="CUSTOM">Custom Date Range...</option>
            </select>
          </div>

          {/* Branch Outlet Filter */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              <option value="ALL">All Outlets & Hubs</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              <option value="ALL_ARCHIVED">All Archived (Completed & Invoiced)</option>
              <option value="Completed">Completed Only</option>
              <option value="Invoiced">Invoiced & Billed Only</option>
            </select>
          </div>
        </div>

        {/* Custom Date Inputs if CUSTOM selected */}
        {dateRangePreset === 'CUSTOM' && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center gap-3 animate-fade-in text-xs">
            <span className="font-bold text-slate-500 font-mono">Custom Range:</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-red-500 hover:underline font-mono text-[11px]"
              >
                Clear Dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Service History Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-mono">
                <th className="p-3.5">Job Card ID & Outlet</th>
                <th className="p-3.5 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all" onClick={() => toggleSort('date')}>
                  <div className="flex items-center gap-1">
                    <span>Check-In / Service Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all" onClick={() => toggleSort('plate')}>
                  <div className="flex items-center gap-1">
                    <span>Vehicle & Plate</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5">Owner / Customer</th>
                <th className="p-3.5">Lead Technician</th>
                <th className="p-3.5">Work Summary</th>
                <th className="p-3.5 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all" onClick={() => toggleSort('total')}>
                  <div className="flex items-center gap-1">
                    <span>Invoice Total</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5">Gate Pass</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {sortedJobCards.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="max-w-md mx-auto space-y-3">
                      <History className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="font-bold text-sm">No service history records match your search criteria.</p>
                      <p className="text-xs text-slate-400">Try clearing your filters or selecting a broader date range.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedJobCards.map((jc) => (
                  <tr key={jc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                    {/* Job Card ID & Outlet */}
                    <td className="p-3.5">
                      <span className="font-mono font-black text-slate-900 dark:text-white block">
                        {jc.id}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[160px] block">
                        {jc.branchName}
                      </span>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase ${
                        jc.status === 'Invoiced' 
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' 
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {jc.status === 'Invoiced' ? 'Invoiced & Billed' : 'Completed Work'}
                      </span>
                    </td>

                    {/* Check-In / Completion Date */}
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                      <div>In: <span className="font-bold">{jc.checkInDate}</span></div>
                      {jc.estimatedCompletion && (
                        <div className="text-[10px] text-slate-400">Out: {jc.estimatedCompletion}</div>
                      )}
                    </td>

                    {/* Vehicle Plate Badge & Details */}
                    <td className="p-3.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-300 text-slate-950 font-mono font-black text-xs rounded border border-amber-400 shadow-xs mb-1">
                        <Car className="w-3.5 h-3.5 text-slate-900" />
                        <span>{jc.vehicle.plateNumber}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {jc.vehicle.year} {jc.vehicle.make} {jc.vehicle.model}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {jc.vehicle.mileageKm.toLocaleString()} km
                      </div>
                    </td>

                    {/* Owner / Customer */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {jc.vehicle.ownerName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {jc.vehicle.ownerPhone}
                      </div>
                    </td>

                    {/* Primary Technician */}
                    <td className="p-3.5 font-mono">
                      <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold">
                        <Wrench className="w-3.5 h-3.5 text-brand-orange" />
                        <span>{jc.assignedTechnicianName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{jc.assignedLiftBay}</div>
                    </td>

                    {/* Work Summary */}
                    <td className="p-3.5 max-w-[200px]">
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2">
                        {jc.customerComplaints.join(' • ')}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {jc.parts.length} Parts • {jc.labor.length} Labor Tasks
                      </div>
                    </td>

                    {/* Invoice Total & Payment Badge */}
                    <td className="p-3.5 font-mono">
                      <div className="font-black text-sm text-slate-900 dark:text-white">
                        {formatPrice(jc.totalEstimate)}
                      </div>
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        jc.paymentStatus === 'Fully Paid' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                      }`}>
                        {jc.paymentStatus}
                      </span>
                    </td>

                    {/* Gate Pass Status */}
                    <td className="p-3.5 font-mono">
                      {jc.gatePassIssued ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] rounded border border-emerald-300 dark:border-emerald-800">
                            <ShieldCheck className="w-3 h-3" />
                            <span>{jc.gatePassCode || 'VERIFIED'}</span>
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No Gate Pass</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedJobCard(jc)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-lg text-xs font-mono flex items-center gap-1.5 ml-auto transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-brand-orange" />
                        <span>Inspect Order</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT REPAIR ORDER ARCHIVE MODAL / DRAWER */}
      {selectedJobCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-5 overflow-y-auto animate-fade-in">
          <div className="printable-repair-order bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center font-bold text-white shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black font-mono">{selectedJobCard.id}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-emerald-600 text-white">
                      {selectedJobCard.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{selectedJobCard.branchName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 no-print cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-brand-orange" />
                  <span>Print Order</span>
                </button>
                <button
                  onClick={() => setSelectedJobCard(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold no-print cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800 dark:text-slate-200">
              {/* Vehicle & Customer Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vehicle Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold uppercase font-mono text-[10px] text-slate-400">Vehicle Specification</span>
                    <div className="px-2 py-0.5 bg-amber-300 text-slate-950 font-mono font-black text-xs rounded border border-amber-400">
                      {selectedJobCard.vehicle.plateNumber}
                    </div>
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    {selectedJobCard.vehicle.year} {selectedJobCard.vehicle.make} {selectedJobCard.vehicle.model}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 font-mono pt-1">
                    <div>VIN: <span className="font-bold text-slate-900 dark:text-white">{selectedJobCard.vehicle.vin}</span></div>
                    <div>Engine: <span className="font-bold text-slate-900 dark:text-white">{selectedJobCard.vehicle.engineType}</span></div>
                    <div>Mileage: <span className="font-bold text-slate-900 dark:text-white">{selectedJobCard.vehicle.mileageKm.toLocaleString()} km</span></div>
                    <div>Color: <span className="font-bold text-slate-900 dark:text-white">{selectedJobCard.vehicle.color || 'N/A'}</span></div>
                  </div>
                </div>

                {/* Customer & Intake Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="font-extrabold uppercase font-mono text-[10px] text-slate-400 block">Customer & Service Advisor</span>
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    {selectedJobCard.vehicle.ownerName}
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 space-y-1">
                    <div>Phone: <span className="font-bold text-slate-900 dark:text-white">{selectedJobCard.vehicle.ownerPhone}</span></div>
                    <div>Check-In Date: <span className="font-bold text-slate-900 dark:text-white">{selectedJobCard.checkInDate}</span></div>
                    <div>Lead Tech: <span className="font-bold text-brand-orange">{selectedJobCard.assignedTechnicianName}</span></div>
                    <div>Station Bay: <span className="font-bold text-slate-900 dark:text-white">{selectedJobCard.assignedLiftBay}</span></div>
                  </div>
                </div>
              </div>

              {/* Complaints & Symptoms */}
              <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <span className="font-extrabold uppercase font-mono text-[10px] text-amber-700 dark:text-amber-400 block mb-1">
                  Reported Customer Complaints & Symptoms
                </span>
                <ul className="list-disc list-inside space-y-1 font-mono text-slate-800 dark:text-slate-200">
                  {selectedJobCard.customerComplaints.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>

              {/* Requisitioned Parts Table */}
              <div>
                <h4 className="font-black text-sm font-mono uppercase tracking-wider mb-2 text-slate-900 dark:text-white">
                  Installed Parts & Materials
                </h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-[10px] font-mono uppercase font-extrabold text-slate-500">
                      <tr>
                        <th className="p-2.5">Part Description</th>
                        <th className="p-2.5">SKU</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                      {selectedJobCard.parts.length === 0 ? (
                        <tr><td colSpan={5} className="p-4 text-center text-slate-400">No spare parts were used in this order.</td></tr>
                      ) : (
                        selectedJobCard.parts.map((pt) => (
                          <tr key={pt.id}>
                            <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{pt.partName}</td>
                            <td className="p-2.5 text-slate-500 text-[10px]">{pt.sku}</td>
                            <td className="p-2.5 text-center font-bold">{pt.quantity}</td>
                            <td className="p-2.5 text-right">{formatPrice(pt.unitPrice)}</td>
                            <td className="p-2.5 text-right font-black">{formatPrice(pt.quantity * pt.unitPrice)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Labor & Technical Tasks Table */}
              <div>
                <h4 className="font-black text-sm font-mono uppercase tracking-wider mb-2 text-slate-900 dark:text-white">
                  Technician Labor Operations
                </h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-[10px] font-mono uppercase font-extrabold text-slate-500">
                      <tr>
                        <th className="p-2.5">Task Description</th>
                        <th className="p-2.5">Technician</th>
                        <th className="p-2.5 text-center">Hours</th>
                        <th className="p-2.5 text-right">Rate / Hr</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                      {selectedJobCard.labor.length === 0 ? (
                        <tr><td colSpan={5} className="p-4 text-center text-slate-400">No labor hours logged.</td></tr>
                      ) : (
                        selectedJobCard.labor.map((lb) => (
                          <tr key={lb.id}>
                            <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{lb.taskDescription}</td>
                            <td className="p-2.5 text-slate-500 text-[10px]">{lb.technicianName}</td>
                            <td className="p-2.5 text-center font-bold">{lb.hours} hrs</td>
                            <td className="p-2.5 text-right">{formatPrice(lb.ratePerHour)}</td>
                            <td className="p-2.5 text-right font-black">{formatPrice(lb.hours * lb.ratePerHour)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Breakdown Summary Box */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal Parts & Labor:</span>
                  <span>{formatPrice(selectedJobCard.subtotalAmount)}</span>
                </div>
                {selectedJobCard.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount Applied:</span>
                    <span>-{formatPrice(selectedJobCard.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>VAT ({selectedJobCard.taxRatePct}%):</span>
                  <span>+{formatPrice(selectedJobCard.taxAmount)}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-black text-brand-orange">
                  <span>Total Tax-Inclusive Amount:</span>
                  <span className="text-lg">{formatPrice(selectedJobCard.totalEstimate)}</span>
                </div>
              </div>

              {/* Security & Gate Pass Details */}
              {selectedJobCard.gatePassIssued && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-white font-mono">Security Gate Pass Code</h5>
                      <p className="text-xs text-slate-500 font-mono">{selectedJobCard.gatePassCode}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-600 text-white font-bold font-mono text-xs rounded-lg uppercase">
                    Verified Release
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center no-print">
              <span className="text-[10px] text-slate-500 font-mono">
                Archived Record ID: {selectedJobCard.id}
              </span>
              <button
                onClick={() => setSelectedJobCard(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl font-mono uppercase cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

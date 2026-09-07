import React, { useState } from 'react';
import { useGarage } from '../../contexts/GarageContext';
import { useSystemSettings } from '../../contexts/SettingsContext';
import { MOCK_PRODUCTS, MOCK_CUSTOMERS } from '../../data/mockData';
import type { JobCard, JobCardPartItem, JobCardLaborItem, VehicleDetails } from '../../types';
import SignatureCaptureModal from './SignatureCaptureModal';
import { 
  Car, 
  Wrench, 
  Cpu, 
  Search, 
  Plus, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Layers, 
  User, 
  DollarSign, 
  Package, 
  ShieldCheck, 
  ShieldAlert,
  ArrowRight,
  Eye,
  Check,
  Zap,
  Printer,
  PenTool,
  Lock,
  MapPin
} from 'lucide-react';

const STAGE_BADGES: Record<JobCard['status'], { label: string; color: string }> = {
  'Booked': { label: 'Booked', color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200' },
  'Diagnostic Scan': { label: 'Diagnostic Scan', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
  'In Progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
  'Awaiting Parts': { label: 'Awaiting Parts', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
  'Quality Check': { label: 'Quality Check', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300' },
  'Completed': { label: 'Completed', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
  'Invoiced': { label: 'Invoiced & Billed', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' }
};

export const JobCardsTab: React.FC = () => {
  const { 
    jobCards, 
    branches, 
    staffUsers, 
    activeBranchId, 
    activeRole,
    hasPermission, 
    createJobCard, 
    updateJobCardStatus,
    addPartToJobCard,
    removePartFromJobCard,
    updatePartStatus,
    addLaborToJobCard,
    removeLaborFromJobCard,
    updateJobCardFinancials,
    approveCustomerEstimate,
    addSignatureToJobCard,
    issueGatePass,
    deleteJobCard
  } = useGarage();

  const { formatPrice } = useSystemSettings();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(null);
  const [statusChangeNotice, setStatusChangeNotice] = useState<string>('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [isAddLaborModalOpen, setIsAddLaborModalOpen] = useState(false);
  const [isPrintGatePassOpen, setIsPrintGatePassOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureTypeToCapture, setSignatureTypeToCapture] = useState<'Diagnostic Estimate Sign-Off' | 'Final Repair Acceptance' | 'Vehicle Intake Authorization'>('Diagnostic Estimate Sign-Off');

  // Permissions check
  const canCreateJob = hasPermission('create_job_card');
  const canUpdateStatus = hasPermission('update_job_status');
  const canRequestParts = hasPermission('request_parts');
  const canApproveParts = hasPermission('approve_parts_issue');

  // New Job Card Form State
  const [newJobForm, setNewJobForm] = useState({
    branchId: activeBranchId === 'ALL' ? branches[0]?.id || 'GAR-NRB-01' : activeBranchId,
    plateNumber: 'KDH 102C',
    vin: 'JTD18290391823746',
    make: 'Toyota',
    model: 'Prado VX 3.0D',
    year: 2021,
    engineType: '3.0L 1KD-FTV Turbo Diesel',
    mileageKm: 94500,
    ownerName: 'John Doe',
    ownerPhone: '0712345678',
    assignedTechnicianId: staffUsers[3]?.id || 'STAFF-004',
    assignedLiftBay: 'Bay 02 (2-Post Hydraulic Lift)',
    complaints: 'Engine sputtering when accelerating over 60km/h; ABS warning indicator on instrument cluster',
    fuelLevel: '3/4 Tank',
    tireTreadDepthMm: 5.5,
    spareTirePresent: true,
    jackAndToolsPresent: true,
    bodyScratchesNotes: 'Minor scratch on left rear door',
    personalItemsNote: 'Sunglasses in glove box',
    intakeInspectorName: 'Sarah Nduta'
  });

  // Part Addition Form State
  const [selectedPartId, setSelectedPartId] = useState<number>(MOCK_PRODUCTS[0]?.id || 1);
  const [partQty, setPartQty] = useState<number>(1);

  // Labor Addition Form State
  const [laborTask, setLaborTask] = useState('Computerized Throttle Body Calibration');
  const [laborHours, setLaborHours] = useState(1.5);
  const [laborRate, setLaborRate] = useState(2500);

  // Filter Job Cards
  const filteredJobCards = jobCards.filter(jc => {
    const matchesBranch = activeBranchId === 'ALL' || jc.branchId === activeBranchId;
    const matchesStatus = selectedStatus === 'ALL' || jc.status === selectedStatus;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      jc.id.toLowerCase().includes(searchLower) ||
      jc.vehicle.plateNumber.toLowerCase().includes(searchLower) ||
      jc.vehicle.vin.toLowerCase().includes(searchLower) ||
      jc.vehicle.ownerName.toLowerCase().includes(searchLower) ||
      jc.vehicle.make.toLowerCase().includes(searchLower) ||
      jc.vehicle.model.toLowerCase().includes(searchLower);

    return matchesBranch && matchesStatus && matchesSearch;
  });

  // Auto VIN lookup simulator
  const handleVinLookup = () => {
    const vinSamples = [
      { vin: 'JTD18290391823746', make: 'Toyota', model: 'Land Cruiser Prado VX', year: 2022, engine: '2.8L 1GD-FTV Diesel' },
      { vin: 'MNK48192039182390', make: 'Isuzu', model: 'D-Max 3.0 4x4 Crew Cab', year: 2021, engine: '3.0L 4JJ1-TCX' },
      { vin: 'WBA12390192837482', make: 'BMW', model: 'X5 xDrive30d', year: 2020, engine: '3.0L B57 Turbo Diesel' },
      { vin: 'SUB99018273645102', make: 'Subaru', model: 'Forester 2.0i-S EyeSight', year: 2023, engine: '2.0L FB20 Direct Injection' }
    ];
    const picked = vinSamples[Math.floor(Math.random() * vinSamples.length)];
    setNewJobForm(prev => ({
      ...prev,
      vin: picked.vin,
      make: picked.make,
      model: picked.model,
      year: picked.year,
      engineType: picked.engine
    }));
  };

  const handleCreateJobCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const branch = branches.find(b => b.id === newJobForm.branchId) || branches[0];
    const tech = staffUsers.find(s => s.id === newJobForm.assignedTechnicianId) || staffUsers[0];

    const initialLaborAmount = 3000;
    const initialTax = Math.round(initialLaborAmount * 0.16);

    const newJC: JobCard = {
      id: `JC-${branch.id.split('-')[1]}-2026-${Math.floor(100 + Math.random() * 900)}`,
      branchId: branch.id,
      branchName: branch.name,
      vehicle: {
        plateNumber: newJobForm.plateNumber,
        vin: newJobForm.vin,
        make: newJobForm.make,
        model: newJobForm.model,
        year: Number(newJobForm.year),
        engineType: newJobForm.engineType,
        mileageKm: Number(newJobForm.mileageKm),
        ownerName: newJobForm.ownerName,
        ownerPhone: newJobForm.ownerPhone
      },
      status: 'Booked',
      assignedTechnicianId: tech.id,
      assignedTechnicianName: tech.name,
      assignedLiftBay: newJobForm.assignedLiftBay,
      checkInDate: new Date().toLocaleString(),
      estimatedCompletion: 'Tomorrow 05:00 PM',
      customerComplaints: newJobForm.complaints.split(';').map(s => s.trim()),
      intakeChecklist: {
        fuelLevel: newJobForm.fuelLevel,
        tireTreadDepthMm: Number(newJobForm.tireTreadDepthMm),
        spareTirePresent: newJobForm.spareTirePresent,
        jackAndToolsPresent: newJobForm.jackAndToolsPresent,
        bodyScratchesNotes: newJobForm.bodyScratchesNotes,
        personalItemsNote: newJobForm.personalItemsNote,
        intakeInspectorName: newJobForm.intakeInspectorName
      },
      parts: [],
      labor: [
        {
          id: `LB-${Date.now()}`,
          taskDescription: 'Vehicle Service Intake & Initial Computerized Diagnostic Inspection',
          hours: 1.0,
          ratePerHour: 3000,
          technicianName: tech.name
        }
      ],
      notes: 'Vehicle booked at reception desk.',
      subtotalAmount: initialLaborAmount,
      taxRatePct: 16,
      taxAmount: initialTax,
      discountAmount: 0,
      totalEstimate: initialLaborAmount + initialTax,
      paymentStatus: 'Unpaid',
      customerApprovalStatus: 'Pending Approval',
      gatePassIssued: false,
      historyLogs: [
        {
          id: `LOG-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          authorName: activeRole,
          actionTitle: 'Job Card Created & Intake Logged',
          details: `Vehicle checked in by ${newJobForm.intakeInspectorName}. Assigned to ${tech.name} on ${newJobForm.assignedLiftBay}.`
        }
      ]
    };

    createJobCard(newJC);
    setIsCreateModalOpen(false);
  };

  const handleAddPartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobCard) return;

    const prod = MOCK_PRODUCTS.find(p => p.id === selectedPartId);
    if (!prod) return;

    const newPart: JobCardPartItem = {
      id: `PT-${Date.now()}`,
      productId: prod.id,
      partName: prod.name,
      sku: prod.sku,
      quantity: Number(partQty),
      unitPrice: prod.price,
      status: 'Requested',
      requestedByRole: activeRole
    };

    addPartToJobCard(selectedJobCard.id, newPart);
    setIsAddPartModalOpen(false);

    // Refresh modal local pointer
    const updated = jobCards.find(j => j.id === selectedJobCard.id);
    if (updated) setSelectedJobCard(updated);
  };

  const handleAddLaborSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobCard) return;

    const newLabor: JobCardLaborItem = {
      id: `LB-${Date.now()}`,
      taskDescription: laborTask,
      hours: Number(laborHours),
      ratePerHour: Number(laborRate),
      technicianName: selectedJobCard.assignedTechnicianName
    };

    addLaborToJobCard(selectedJobCard.id, newLabor);
    setIsAddLaborModalOpen(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Car className="w-6 h-6 text-brand-orange" />
            <span>Job Cards & Service Work Orders</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track customer vehicles, diagnostic reports, technician job assignments, parts allocation, and billing.
          </p>
        </div>

        {canCreateJob ? (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-brand-orange hover:bg-brand-orange/90 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 font-mono uppercase tracking-wider transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Vehicle Job Card</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>RBAC Restricted: Creating Job Cards requires Receptionist/Manager role</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Plate, VIN, Customer, Make, Job ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange"
          />
        </div>

        {/* Status Pipeline Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'Booked', 'Diagnostic Scan', 'In Progress', 'Awaiting Parts', 'Quality Check', 'Completed'].map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all whitespace-nowrap ${
                selectedStatus === status
                  ? 'bg-slate-900 text-white dark:bg-brand-orange dark:text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {status === 'ALL' ? 'All Stages' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Job Cards Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-gray-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase font-mono font-bold">
                <th className="p-3.5">Job Card ID & Branch</th>
                <th className="p-3.5">Vehicle Specs & VIN</th>
                <th className="p-3.5">Customer Owner</th>
                <th className="p-3.5">Assigned Lift & Tech</th>
                <th className="p-3.5">Diagnostics & Parts</th>
                <th className="p-3.5">Stage Status</th>
                <th className="p-3.5">Total Estimate</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredJobCards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No active job cards match the selected filters or branch context.
                  </td>
                </tr>
              ) : (
                filteredJobCards.map(jc => {
                  const badge = STAGE_BADGES[jc.status];
                  return (
                    <tr key={jc.id} className="hover:bg-slate-50/80 dark:hover:bg-gray-750 transition-colors">
                      <td className="p-3.5 font-mono">
                        <div className="font-black text-slate-900 dark:text-white text-sm">
                          {jc.id}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400 shrink-0" /><span>{jc.branchName}</span></span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 font-mono font-black text-brand-orange text-[11px] rounded">
                            {jc.vehicle.plateNumber}
                          </span>
                          <span>{jc.vehicle.make} {jc.vehicle.model} ({jc.vehicle.year})</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          VIN: {jc.vehicle.vin}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {jc.vehicle.ownerName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {jc.vehicle.ownerPhone}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-brand-orange" />
                          <span>{jc.assignedTechnicianName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {jc.assignedLiftBay}
                        </div>
                      </td>

                      <td className="p-3.5">
                        {jc.diagnosticReport ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1 w-fit">
                            <Cpu className="w-3 h-3 text-purple-600" />
                            <span>ECU Scanned ({jc.diagnosticReport.overallHealthScore}% Health)</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No ECU Scan Yet</span>
                        )}
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                          {jc.parts.length} Parts Requisitioned
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono border ${badge.color}`}>
                          {jc.status}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono">
                        <div className="font-black text-slate-900 dark:text-white text-sm">
                          {formatPrice(jc.totalEstimate)}
                        </div>
                        <span className={`text-[10px] font-bold ${
                          jc.paymentStatus === 'Fully Paid' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {jc.paymentStatus}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedJobCard(jc)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold rounded-lg text-xs flex items-center gap-1.5 ml-auto transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Job</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Job Card Detailed Drawer / Modal */}
      {selectedJobCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-5 overflow-y-auto animate-fade-in">
          <div className="printable-repair-order bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-orange text-white flex items-center justify-center font-black">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-brand-orange font-bold">{selectedJobCard.id}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-xs text-slate-300 font-mono">{selectedJobCard.branchName}</span>
                  </div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2 mt-0.5">
                    <span>{selectedJobCard.vehicle.plateNumber}</span>
                    <span className="text-slate-400 font-normal">|</span>
                    <span className="text-sm text-slate-200">{selectedJobCard.vehicle.make} {selectedJobCard.vehicle.model} ({selectedJobCard.vehicle.year})</span>
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedJobCard(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold no-print"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div className="p-5 overflow-y-auto space-y-6 text-xs flex-1">
              {/* Stage Transition Control Bar */}
              <div className="p-3 bg-slate-50 dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-400 uppercase">Current Stage:</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase font-mono ${STAGE_BADGES[selectedJobCard.status].color}`}>
                    {selectedJobCard.status}
                  </span>
                </div>

                {canUpdateStatus ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 font-bold">Advance Job Stage:</span>
                    <select
                      value={selectedJobCard.status}
                      onChange={(e) => {
                        const newSt = e.target.value as JobCard['status'];
                        updateJobCardStatus(selectedJobCard.id, newSt);
                        setSelectedJobCard({ ...selectedJobCard, status: newSt });
                        setStatusChangeNotice(`⚡ Automated Customer Alert: SMS & Email dispatched to ${selectedJobCard.vehicle.ownerName} (${selectedJobCard.vehicle.ownerPhone || 'Mobile'}) for stage '${newSt}'!`);
                        setTimeout(() => setStatusChangeNotice(''), 4500);
                      }}
                      className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="Booked">1. Booked</option>
                      <option value="Diagnostic Scan">2. Diagnostic Scan</option>
                      <option value="In Progress">3. In Progress</option>
                      <option value="Awaiting Parts">4. Awaiting Parts</option>
                      <option value="Quality Check">5. Quality Check</option>
                      <option value="Completed">6. Completed</option>
                      <option value="Invoiced">7. Invoiced & Billed</option>
                    </select>
                  </div>
                ) : (
                  <span className="text-slate-400 text-[11px]">
                    <span className="inline-flex items-center gap-1"><Lock className="w-3 h-3 text-slate-400 shrink-0" /><span>Only Techs & Managers can advance job stages</span></span>
                  </span>
                )}
              </div>

              {statusChangeNotice && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-mono font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-2 animate-fadeIn">
                  <Zap className="w-4 h-4 text-emerald-500 shrink-0 animate-bounce" />
                  <span>{statusChangeNotice}</span>
                </div>
              )}

              {/* Vehicle & Customer Specs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-gray-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <h4 className="font-extrabold uppercase font-mono text-slate-400 mb-2 flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-brand-orange" />
                    <span>Vehicle Technical Specifications</span>
                  </h4>
                  <div className="space-y-1 text-slate-700 dark:text-slate-200">
                    <div><strong className="text-slate-900 dark:text-white font-mono">17-Char VIN:</strong> <span className="font-mono text-brand-orange font-bold">{selectedJobCard.vehicle.vin}</span></div>
                    <div><strong>Engine Configuration:</strong> {selectedJobCard.vehicle.engineType}</div>
                    <div><strong>Current Mileage:</strong> {selectedJobCard.vehicle.mileageKm.toLocaleString()} KM</div>
                    <div><strong>Assigned Lift/Bay:</strong> {selectedJobCard.assignedLiftBay}</div>
                    <div><strong>Assigned Technician:</strong> {selectedJobCard.assignedTechnicianName}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold uppercase font-mono text-slate-400 mb-2 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-brand-orange" />
                    <span>Customer & Complaint Intake</span>
                  </h4>
                  <div className="space-y-1 text-slate-700 dark:text-slate-200">
                    <div><strong>Owner / Fleet:</strong> {selectedJobCard.vehicle.ownerName}</div>
                    <div><strong>Phone Contact:</strong> <span className="font-mono">{selectedJobCard.vehicle.ownerPhone}</span></div>
                    <div><strong>Check-in Timestamp:</strong> <span className="font-mono">{selectedJobCard.checkInDate}</span></div>
                    <div className="pt-1">
                      <strong className="text-slate-900 dark:text-white">Customer Complaints Logged:</strong>
                      <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-slate-600 dark:text-slate-300">
                        {selectedJobCard.customerComplaints.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Computerized Diagnostic Link */}
              {selectedJobCard.diagnosticReport && (
                <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cpu className="w-6 h-6 text-purple-600 dark:text-purple-400 shrink-0" />
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Computerized Diagnostic Report Available</span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-[10px] font-black rounded-full">
                          {selectedJobCard.diagnosticReport.overallHealthScore}% Vehicle Health Score
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        Scanned by {selectedJobCard.diagnosticReport.technicianName} using {selectedJobCard.diagnosticReport.scannerDevice}. Detected {selectedJobCard.diagnosticReport.faultCodes.length} ECU fault DTCs.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Parts Requisition Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase font-mono flex items-center gap-2">
                    <Package className="w-4 h-4 text-brand-orange" />
                    <span>Store Parts Requisition & Allocations ({selectedJobCard.parts.length})</span>
                  </h4>

                  {canRequestParts && (
                    <button
                      onClick={() => setIsAddPartModalOpen(true)}
                      className="px-3 py-1.5 bg-brand-orange text-white font-bold rounded-lg text-xs flex items-center gap-1 font-mono uppercase"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Request Part From Store</span>
                    </button>
                  )}
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-gray-900 text-slate-400 font-mono font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Part Name & SKU</th>
                        <th className="p-2.5">Quantity</th>
                        <th className="p-2.5">Unit Price</th>
                        <th className="p-2.5">Total Amount</th>
                        <th className="p-2.5">Requisition Status</th>
                        <th className="p-2.5 text-right">RBAC Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {selectedJobCard.parts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400 italic">
                            No inventory parts requested yet for this job card.
                          </td>
                        </tr>
                      ) : (
                        selectedJobCard.parts.map(pt => (
                          <tr key={pt.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-750">
                            <td className="p-2.5">
                              <div className="font-bold text-slate-800 dark:text-slate-100">{pt.partName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">SKU: {pt.sku}</div>
                            </td>
                            <td className="p-2.5 font-mono font-bold">{pt.quantity} pcs</td>
                            <td className="p-2.5 font-mono">{formatPrice(pt.unitPrice)}</td>
                            <td className="p-2.5 font-mono font-black">{formatPrice(pt.unitPrice * pt.quantity)}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                pt.status === 'Issued' || pt.status === 'Installed'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}>
                                {pt.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              {pt.status === 'Requested' && (
                                canApproveParts ? (
                                  <button
                                    onClick={() => {
                                      updatePartStatus(selectedJobCard.id, pt.id, 'Issued');
                                      const updated = jobCards.find(j => j.id === selectedJobCard.id);
                                      if (updated) setSelectedJobCard(updated);
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded font-mono uppercase"
                                  >
                                    Approve & Issue
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">Requires Clerk Approval</span>
                                )
                              )}
                              {pt.status === 'Issued' && (
                                <button
                                  onClick={() => {
                                    updatePartStatus(selectedJobCard.id, pt.id, 'Installed');
                                    const updated = jobCards.find(j => j.id === selectedJobCard.id);
                                    if (updated) setSelectedJobCard(updated);
                                  }}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded font-mono uppercase"
                                >
                                  Mark Installed
                                </button>
                              )}
                              {pt.status === 'Installed' && (
                                <span className="text-[10px] text-emerald-600 font-bold font-mono">✓ Mounted on Lift</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Labor Charges Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase font-mono flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-brand-orange" />
                    <span>Technician Labor & Service Tasks ({selectedJobCard.labor.length})</span>
                  </h4>

                  <button
                    onClick={() => setIsAddLaborModalOpen(true)}
                    className="px-3 py-1.5 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 font-mono uppercase"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Labor Hours</span>
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-gray-900 text-slate-400 font-mono font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Task Description</th>
                        <th className="p-2.5">Technician</th>
                        <th className="p-2.5">Labor Hours</th>
                        <th className="p-2.5">Rate / Hour</th>
                        <th className="p-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {selectedJobCard.labor.map(lb => (
                        <tr key={lb.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-750">
                          <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-100">{lb.taskDescription}</td>
                          <td className="p-2.5 font-mono text-slate-600 dark:text-slate-300">{lb.technicianName}</td>
                          <td className="p-2.5 font-mono">{lb.hours} hrs</td>
                          <td className="p-2.5 font-mono">{formatPrice(lb.ratePerHour)}</td>
                          <td className="p-2.5 font-mono font-black text-right">{formatPrice(lb.hours * lb.ratePerHour)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation & Authorization Breakdown */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                      Financial Breakdown & Work Estimate
                    </span>
                    <div className="flex items-center gap-3 mt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Subtotal:</span>
                        <span className="font-mono text-sm font-bold text-slate-200">
                          {formatPrice(selectedJobCard.subtotalAmount || selectedJobCard.parts.reduce((a,p)=>a+p.unitPrice*p.quantity,0) + selectedJobCard.labor.reduce((a,l)=>a+l.hours*l.ratePerHour,0))}
                        </span>
                      </div>
                      <div className="text-slate-600">+</div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">VAT ({selectedJobCard.taxRatePct || 16}%):</span>
                        <span className="font-mono text-sm font-bold text-slate-300">
                          {formatPrice(selectedJobCard.taxAmount || 0)}
                        </span>
                      </div>
                      <div className="text-slate-600">-</div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Discount:</span>
                        <span className="font-mono text-sm font-bold text-emerald-400">
                          {formatPrice(selectedJobCard.discountAmount || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                      Total Payable Amount
                    </span>
                    <div className="text-2xl font-black font-mono text-brand-orange mt-0.5">
                      {formatPrice(selectedJobCard.totalEstimate)}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Approval Status: <strong className="text-emerald-400">{selectedJobCard.customerApprovalStatus || 'Pending'}</strong>
                    </span>
                  </div>
                </div>

                {/* Financial Controls, Signatures & Gate Pass Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs no-print">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg font-mono uppercase flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-brand-orange" />
                      <span>Print Repair Order</span>
                    </button>

                    <button
                      onClick={() => {
                        setSignatureTypeToCapture('Diagnostic Estimate Sign-Off');
                        setIsSignatureModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg font-mono uppercase flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <PenTool className="w-4 h-4" />
                      <span>Capture Digital Signature</span>
                    </button>

                    {selectedJobCard.customerApprovalStatus !== 'Approved' ? (
                      <button
                        onClick={() => {
                          approveCustomerEstimate(selectedJobCard.id);
                          const updated = jobCards.find(j => j.id === selectedJobCard.id);
                          if (updated) setSelectedJobCard(updated);
                        }}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg font-mono uppercase flex items-center gap-1.5 shadow-md"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Manual Quick Approval</span>
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg font-mono font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Estimate Customer Approved</span>
                      </span>
                    )}

                    {!selectedJobCard.gatePassIssued ? (
                      <button
                        onClick={() => {
                          issueGatePass(selectedJobCard.id);
                          const updated = jobCards.find(j => j.id === selectedJobCard.id);
                          if (updated) setSelectedJobCard(updated);
                        }}
                        className="px-3.5 py-2 bg-brand-orange hover:bg-brand-orange/90 text-white font-bold rounded-lg font-mono uppercase flex items-center gap-1.5 shadow-md"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Issue Gate Pass & Final Bill</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsPrintGatePassOpen(true)}
                        className="px-3 py-1.5 bg-purple-950 text-purple-200 border border-purple-800 hover:bg-purple-900 rounded-lg font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-purple-400" />
                        <span>View Security Gate Pass ({selectedJobCard.gatePassCode})</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {hasPermission('delete_job_card') && (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete Job Card ${selectedJobCard.id}?`)) {
                            deleteJobCard(selectedJobCard.id);
                            setSelectedJobCard(null);
                          }
                        }}
                        className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg font-mono text-[11px] font-bold"
                      >
                        Delete Job Card
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Captured Customer Signatures List */}
              {selectedJobCard.signatures && selectedJobCard.signatures.length > 0 && (
                <div className="p-4 bg-purple-950/20 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800/60 space-y-3">
                  <h4 className="font-black uppercase font-mono text-purple-900 dark:text-purple-300 text-xs flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Captured Customer Digital Signatures ({selectedJobCard.signatures.length})</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedJobCard.signatures.map((sig) => (
                      <div key={sig.id} className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-purple-900/50 shadow-xs flex gap-3 items-center">
                        <div className="w-28 h-16 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1 flex items-center justify-center shrink-0">
                          <img 
                            src={sig.signatureDataUrl} 
                            alt={`Signature by ${sig.signerName}`} 
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                        <div className="text-xs space-y-0.5 min-w-0 flex-1">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {sig.signerName}
                          </div>
                          <div className="text-[10px] font-mono font-extrabold text-purple-600 dark:text-purple-400">
                            {sig.signatureType}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            Signed: {sig.signedAt}
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified Sign-Off</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Job Card Audit History Log */}
              {selectedJobCard.historyLogs && selectedJobCard.historyLogs.length > 0 && (
                <div className="p-4 bg-slate-50 dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <h4 className="font-extrabold uppercase font-mono text-slate-400 text-[11px] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-orange" />
                    <span>Audit Trail & Activity Log History</span>
                  </h4>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {selectedJobCard.historyLogs.map(log => (
                      <div key={log.id} className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-slate-100 dark:border-slate-700/60 flex items-start justify-between text-[11px]">
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{log.actionTitle}</div>
                          <div className="text-slate-500 dark:text-slate-400 mt-0.5">{log.details}</div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="font-mono text-[10px] text-slate-400 block">{log.timestamp}</span>
                          <span className="text-[10px] font-bold text-brand-orange">{log.authorName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Part to Job Card */}
      {isAddPartModalOpen && selectedJobCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-5 space-y-4 text-xs">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-orange" />
              <span>Requisition Part from Store Inventory</span>
            </h3>

            <form onSubmit={handleAddPartSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Select Product from Store</label>
                <select
                  value={selectedPartId}
                  onChange={(e) => setSelectedPartId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                >
                  {MOCK_PRODUCTS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — {formatPrice(p.price)} [{p.stock} in stock]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Quantity Required</label>
                <input
                  type="number"
                  min="1"
                  value={partQty}
                  onChange={(e) => setPartQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPartModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-orange text-white font-bold rounded-xl uppercase font-mono"
                >
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Labor to Job Card */}
      {isAddLaborModalOpen && selectedJobCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-5 space-y-4 text-xs">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-brand-orange" />
              <span>Log Technician Labor Hours</span>
            </h3>

            <form onSubmit={handleAddLaborSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Task Description</label>
                <input
                  type="text"
                  required
                  value={laborTask}
                  onChange={(e) => setLaborTask(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Hours Spent</label>
                  <input
                    type="number"
                    step="0.5"
                    value={laborHours}
                    onChange={(e) => setLaborHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Hourly Rate (KES)</label>
                  <input
                    type="number"
                    value={laborRate}
                    onChange={(e) => setLaborRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddLaborModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-orange text-white font-bold rounded-xl uppercase font-mono"
                >
                  Log Labor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Job Card */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-brand-orange" />
                <span>Create New Vehicle Service Job Card</span>
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleCreateJobCardSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Target Garage Branch</label>
                  <select
                    value={newJobForm.branchId}
                    onChange={(e) => setNewJobForm({ ...newJobForm, branchId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Vehicle Plate Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KDH 102C"
                    value={newJobForm.plateNumber}
                    onChange={(e) => setNewJobForm({ ...newJobForm, plateNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase font-black"
                  />
                </div>
              </div>

              {/* VIN Search Block */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-600 dark:text-slate-300 font-bold">17-Char Vehicle VIN</label>
                  <button
                    type="button"
                    onClick={handleVinLookup}
                    className="text-[10px] font-bold text-brand-orange hover:underline font-mono flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Simulate VIN Decoder</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. JTD18290391823746"
                  value={newJobForm.vin}
                  onChange={(e) => setNewJobForm({ ...newJobForm, vin: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-brand-orange font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Make</label>
                  <input
                    type="text"
                    required
                    value={newJobForm.make}
                    onChange={(e) => setNewJobForm({ ...newJobForm, make: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Model</label>
                  <input
                    type="text"
                    required
                    value={newJobForm.model}
                    onChange={(e) => setNewJobForm({ ...newJobForm, model: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Year</label>
                  <input
                    type="number"
                    value={newJobForm.year}
                    onChange={(e) => setNewJobForm({ ...newJobForm, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Engine Code/Type</label>
                  <input
                    type="text"
                    value={newJobForm.engineType}
                    onChange={(e) => setNewJobForm({ ...newJobForm, engineType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Current Odometer (KM)</label>
                  <input
                    type="number"
                    value={newJobForm.mileageKm}
                    onChange={(e) => setNewJobForm({ ...newJobForm, mileageKm: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Owner / Customer Name</label>
                  <input
                    type="text"
                    required
                    value={newJobForm.ownerName}
                    onChange={(e) => setNewJobForm({ ...newJobForm, ownerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Owner Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newJobForm.ownerPhone}
                    onChange={(e) => setNewJobForm({ ...newJobForm, ownerPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Customer Reported Complaints (Semicolon separated)</label>
                <textarea
                  rows={2}
                  required
                  value={newJobForm.complaints}
                  onChange={(e) => setNewJobForm({ ...newJobForm, complaints: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-orange text-white font-bold rounded-xl uppercase font-mono shadow-md"
                >
                  Book Job Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Security Gate Pass Preview */}
      {isPrintGatePassOpen && selectedJobCard && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="printable-gate-pass bg-white text-slate-900 rounded-2xl max-w-xl w-full border border-slate-300 shadow-2xl p-6 space-y-5 my-auto">
            {/* Security Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase font-mono bg-brand-orange text-white px-2 py-0.5 rounded">
                  OFFICIAL VEHICLE SECURITY GATE PASS
                </span>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-1">
                  {selectedJobCard.branchName}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">Automotive Repairs & Diagnostic Service Chain</p>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs font-bold text-slate-400 block">Gate Pass Code:</span>
                <span className="text-lg font-black text-purple-700">{selectedJobCard.gatePassCode || 'GP-2026-9901'}</span>
              </div>
            </div>

            {/* Vehicle & Owner Info */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-400 font-mono uppercase block text-[10px]">Vehicle Registration:</span>
                <span className="text-base font-black text-slate-900 font-mono">{selectedJobCard.vehicle.plateNumber}</span>
                <div className="text-slate-600">{selectedJobCard.vehicle.make} {selectedJobCard.vehicle.model} ({selectedJobCard.vehicle.year})</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">VIN: {selectedJobCard.vehicle.vin}</div>
              </div>

              <div>
                <span className="font-bold text-slate-400 font-mono uppercase block text-[10px]">Customer / Owner:</span>
                <span className="text-sm font-extrabold text-slate-900">{selectedJobCard.vehicle.ownerName}</span>
                <div className="font-mono text-slate-600">{selectedJobCard.vehicle.ownerPhone}</div>
                <div className="text-[10px] font-bold text-emerald-700 mt-1">✓ Work Invoice Paid & Verified</div>
              </div>
            </div>

            {/* Security Clearance Stamp & Signature Box */}
            <div className="p-4 bg-emerald-50 border-2 border-dashed border-emerald-500 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-black text-emerald-900 uppercase font-mono text-xs">
                    SECURITY CHECKPOINT CLEARANCE
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Vehicle authorized for main gate egress. Tools, spare wheel, and personal belongings verified.
                  </p>
                </div>
              </div>

              {selectedJobCard.signatures && selectedJobCard.signatures.length > 0 && (
                <div className="pt-2 border-t border-emerald-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-[10px] text-emerald-800 font-bold block">Customer Acceptance Signature:</span>
                    <span className="font-bold text-slate-900">{selectedJobCard.signatures[0].signerName}</span>
                    <span className="text-[10px] text-slate-500 font-mono block">Signed: {selectedJobCard.signatures[0].signedAt}</span>
                  </div>
                  <div className="h-12 w-32 bg-white rounded border border-emerald-300 p-0.5 flex items-center justify-center">
                    <img 
                      src={selectedJobCard.signatures[0].signatureDataUrl} 
                      alt="Customer Signature" 
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-200">
              <span className="text-[10px] text-slate-400 font-mono">Issued by System Security Module • {new Date().toLocaleDateString()}</span>
              <div className="flex gap-2 no-print">
                <button
                  onClick={() => setIsPrintGatePassOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-xl"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl font-mono uppercase flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Pass</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Digital Signature Capture Pad */}
      {isSignatureModalOpen && selectedJobCard && (
        <SignatureCaptureModal
          jobCard={selectedJobCard}
          defaultType={signatureTypeToCapture}
          onClose={() => setIsSignatureModalOpen(false)}
          onSaveSignature={(sig) => {
            addSignatureToJobCard(selectedJobCard.id, sig);
            setIsSignatureModalOpen(false);
            const updated = jobCards.find(j => j.id === selectedJobCard.id);
            if (updated) {
              setSelectedJobCard(updated);
            } else {
              setSelectedJobCard(prev => prev ? {
                ...prev,
                signatures: [sig, ...(prev.signatures || [])],
                customerApprovalStatus: 'Approved'
              } : null);
            }
          }}
        />
      )}
    </div>
  );
};

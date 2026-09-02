import React, { useState, useEffect } from 'react';
import { useGarage } from '../../contexts/GarageContext';
import { useSystemSettings } from '../../contexts/SettingsContext';
import type { JobCard, MechanicTaskSchedule, GarageStaffUser } from '../../types';
import SignatureCaptureModal from './SignatureCaptureModal';
import { 
  User, 
  Wrench, 
  Clock, 
  Play, 
  Pause, 
  CheckCircle2, 
  Cpu, 
  PenTool, 
  AlertTriangle, 
  Plus, 
  Car, 
  Layers, 
  Award, 
  ShieldCheck, 
  Coffee, 
  TrendingUp, 
  Package, 
  Zap,
  Filter,
  Check
} from 'lucide-react';

export const MechanicDashboardTab: React.FC = () => {
  const { 
    staffUsers, 
    jobCards, 
    mechanicShifts, 
    mechanicTasks, 
    activeRole, 
    updateMechanicShift,
    updateTaskStatus,
    addSignatureToJobCard,
    addPartToJobCard,
    hasPermission
  } = useGarage();

  const { formatPrice } = useSystemSettings();

  // Select active logged-in mechanic/technician user (default to Eng. Eric Wanjala or James Kiprop)
  const [selectedMechanicId, setSelectedMechanicId] = useState<string>('STAFF-003');

  // Active Mechanic User
  const currentMechanic = staffUsers.find(s => s.id === selectedMechanicId) || staffUsers.find(s => s.role === 'DIAGNOSTIC_TECH' || s.role === 'MECHANIC') || staffUsers[0];

  // Active shift record for current mechanic
  const currentShift = mechanicShifts.find(s => s.staffId === currentMechanic?.id);

  // Active tasks assigned to this mechanic
  const myTasks = mechanicTasks.filter(t => t.assignedStaffId === currentMechanic?.id);

  // Job Cards assigned to this mechanic
  const myJobCards = jobCards.filter(j => j.assignedTechnicianId === currentMechanic?.id || myTasks.some(t => t.jobCardId === j.id));

  // Live Timer State
  const [activeJobTimer, setActiveJobTimer] = useState<{ taskId: string; seconds: number; isRunning: boolean }>({
    taskId: myTasks[0]?.id || '',
    seconds: 3600 + 1200, // 1h 20m elapsed
    isRunning: true
  });

  useEffect(() => {
    let interval: any = null;
    if (activeJobTimer.isRunning) {
      interval = setInterval(() => {
        setActiveJobTimer(prev => ({ ...prev, seconds: prev.seconds + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeJobTimer.isRunning]);

  // Format seconds to HH:MM:SS
  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Modals state
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [activeJobForSig, setActiveJobForSig] = useState<JobCard | null>(null);
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [targetJobForPart, setTargetJobForPart] = useState<JobCard | null>(null);

  // Quick Part Add Form State
  const [partForm, setPartForm] = useState({
    partName: 'Masuma Brake Rotor Front Pair (BD-104)',
    partNumber: 'MSM-BD-104',
    quantity: 1,
    unitPrice: 12500
  });

  const handleAddPartToWorkOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetJobForPart) return;

    addPartToJobCard(targetJobForPart.id, {
      id: `PART-${Date.now().toString().slice(-4)}`,
      partId: `P-${Date.now().toString().slice(-4)}`,
      partName: partForm.partName,
      partNumber: partForm.partNumber,
      quantity: Number(partForm.quantity),
      unitPrice: Number(partForm.unitPrice),
      totalPrice: Number(partForm.quantity) * Number(partForm.unitPrice)
    });

    setIsAddPartModalOpen(false);
    alert(`Part ${partForm.partName} added to Job Card ${targetJobForPart.id}`);
  };

  const handleToggleShiftStatus = (newStatus: 'Clocked In' | 'On Break' | 'Off Duty') => {
    if (currentShift) {
      updateMechanicShift(currentShift.id, { status: newStatus as any });
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      
      {/* Top Banner: Mechanic Persona Switcher & Live Workstation Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 lg:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-brand-orange/20 border-2 border-brand-orange text-brand-orange flex items-center justify-center font-black text-xl font-mono shadow-inner">
              {currentMechanic?.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black">{currentMechanic?.name}</h2>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-purple-900/80 text-purple-200 border border-purple-700">
                  {currentMechanic?.expertiseLevel || 'Master Lead'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {currentMechanic?.specialty || 'Lead Diagnostic & ECU Specialist'} • {currentMechanic?.assignedBranchId || 'GAR-NRB-01'}
              </p>
            </div>
          </div>

          {/* Quick Mechanic Persona Selector for Testing */}
          <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
            <span className="text-xs font-mono font-bold text-slate-400">Log In As:</span>
            <select
              value={selectedMechanicId}
              onChange={e => setSelectedMechanicId(e.target.value)}
              className="bg-slate-900 text-white border border-slate-700 rounded-lg text-xs font-mono p-1.5 font-bold"
            >
              {staffUsers.filter(s => s.role === 'MECHANIC' || s.role === 'DIAGNOSTIC_TECH' || s.role === 'SUPER_ADMIN').map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Workstation Metrics & Shift Control Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Shift Clock Status</span>
              <span className="font-black text-emerald-400 text-sm flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                {currentShift?.status || 'Clocked In'}
              </span>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => handleToggleShiftStatus('On Break')}
                className="px-2 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded border border-amber-500/50 text-[10px]"
                title="Take Break"
              >
                Break
              </button>
              <button 
                onClick={() => handleToggleShiftStatus('Clocked In')}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px]"
              >
                Work
              </button>
            </div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Bay Location</span>
            <span className="font-extrabold text-white text-sm mt-0.5 block truncate">
              {currentShift?.assignedBay || 'Bay 01 (Computerized Diagnostic Bay)'}
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Repair Workload</span>
            <span className="font-extrabold text-amber-400 text-sm mt-0.5 block">
              {myTasks.length} Assigned Tasks ({currentMechanic?.scheduledHours || 5.5}h / {currentMechanic?.dailyCapacityHours || 8}h)
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Efficiency Score</span>
            <span className="font-extrabold text-purple-300 text-sm mt-0.5 block">
              98.4% (12 Jobs Completed)
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Task Live Workstation (Left 8 cols) & Certifications & Quick Tools (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Active Tasks & Live Job Card Workstation */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Job Stop-Watch Timer Panel */}
          <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-purple-950 text-white rounded-2xl p-5 border border-purple-900/50 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                <h3 className="font-black text-sm uppercase font-mono tracking-wider text-purple-200">
                  Active Live Workstation Stopwatch Timer
                </h3>
              </div>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-mono font-bold text-xs">
                JOB CARD IN PROGRESS
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono text-slate-400 block">Current Repair Task:</span>
                <h4 className="text-base font-extrabold text-white mt-0.5">
                  {myTasks[0]?.taskTitle || 'Computerized ECU Fault Diagnostic & CAN-Bus Test'}
                </h4>
                <p className="text-xs text-amber-300 font-mono mt-1">
                  Target Vehicle: {myTasks[0]?.vehiclePlate || 'KDG 789A'} ({myTasks[0]?.vehicleModel || 'Toyota Hilux 2022'})
                </p>
              </div>

              {/* Stop-watch controls */}
              <div className="flex items-center gap-3">
                <div className="text-2xl font-black font-mono bg-slate-950 px-4 py-2 rounded-xl border border-purple-800 text-emerald-400 shadow-inner">
                  {formatTimer(activeJobTimer.seconds)}
                </div>

                <button
                  onClick={() => setActiveJobTimer(prev => ({ ...prev, isRunning: !prev.isRunning }))}
                  className={`p-3 rounded-xl text-white font-bold transition-all shadow-md ${
                    activeJobTimer.isRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                  title={activeJobTimer.isRunning ? 'Pause Timer' : 'Resume Timer'}
                >
                  {activeJobTimer.isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Assigned Repair Tasks List */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-brand-orange" />
                <span>My Assigned Repair Tasks Today ({myTasks.length})</span>
              </h3>
            </div>

            <div className="space-y-3">
              {myTasks.length === 0 ? (
                <div className="p-6 text-center text-slate-500 font-mono text-xs">
                  No active tasks specifically assigned to your staff ID right now.
                </div>
              ) : (
                myTasks.map((t) => {
                  const targetJC = jobCards.find(j => j.id === t.jobCardId);

                  return (
                    <div 
                      key={t.id}
                      className="p-4 bg-slate-50 dark:bg-gray-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-2xs"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-brand-orange/10 text-brand-orange font-mono font-black text-[11px] rounded">
                              {t.jobCardId}
                            </span>
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                              {t.vehiclePlate} • {t.vehicleModel}
                            </h4>
                          </div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                            {t.taskTitle}
                          </p>
                        </div>

                        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase font-mono ${
                          t.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                          t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {t.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono">
                        Notes: {t.notes || 'Routine check & overhaul procedures'}
                      </p>

                      {/* Action Buttons Toolbar for Mechanic Workstation */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                        <div className="flex items-center gap-2">
                          {/* Add Part Action */}
                          {targetJC && (
                            <button
                              onClick={() => {
                                setTargetJobForPart(targetJC);
                                setIsAddPartModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg font-mono flex items-center gap-1.5 text-[11px]"
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span>Requisition Spare Part</span>
                            </button>
                          )}

                          {/* Digital Signature Action */}
                          {targetJC && (
                            <button
                              onClick={() => {
                                setActiveJobForSig(targetJC);
                                setIsSignatureModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg font-mono flex items-center gap-1.5 text-[11px]"
                            >
                              <PenTool className="w-3.5 h-3.5" />
                              <span>Capture Digital Sign-Off</span>
                            </button>
                          )}
                        </div>

                        {/* Task Completion Status */}
                        {t.status !== 'Completed' && (
                          <button
                            onClick={() => updateTaskStatus(t.id, 'Completed')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg font-mono text-[11px] flex items-center gap-1 shadow-sm"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Mark Task Complete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Mechanic Skills, Certifications & Quick Tools */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Skill & Certification Portfolio */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Certifications & Skill Badges</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">Expertise Tier</span>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 rounded-lg font-mono font-bold block text-center text-sm">
                  🏆 {currentMechanic?.expertiseLevel || 'Master Lead'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1.5">Active Certifications</span>
                <div className="space-y-1.5">
                  {(currentMechanic?.certifications || ['Bosch Master Diagnostic Certified', 'Autel MaxiSys ECU Master', 'Masuma Brake Systems Expert']).map((cert, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{cert}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1.5">Technical Skill Matrix</span>
                <div className="flex flex-wrap gap-1.5">
                  {(currentMechanic?.skillsList || ['ECU Computer Scanning', 'CAN-Bus Oscilloscope', 'Common Rail Fuel Injectors', 'Hybrid & EV Diagnostics']).map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md font-mono text-[11px]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Workstation Helpers */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 font-mono uppercase">
              <Zap className="w-4 h-4 text-brand-orange" />
              <span>Workstation Quick Tools</span>
            </h3>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => alert('Store Keeper notified! Masuma Parts counter clerk notified to prepare requisition.')}
                className="w-full p-2.5 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-800 dark:text-white font-mono font-bold rounded-xl flex items-center justify-between"
              >
                <span>Notify Spare Parts Storekeeper</span>
                <Package className="w-4 h-4 text-brand-orange" />
              </button>

              <button
                onClick={() => alert('Front desk receptionist notified of vehicle completion readiness.')}
                className="w-full p-2.5 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-800 dark:text-white font-mono font-bold rounded-xl flex items-center justify-between"
              >
                <span>Alert Receptionist (Work Completed)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Modal: Digital Signature Capture */}
      {isSignatureModalOpen && activeJobForSig && (
        <SignatureCaptureModal
          jobCard={activeJobForSig}
          defaultType="Final Repair Acceptance"
          onClose={() => setIsSignatureModalOpen(false)}
          onSaveSignature={(sig) => {
            addSignatureToJobCard(activeJobForSig.id, sig);
            setIsSignatureModalOpen(false);
            alert(`Customer signature successfully captured and attached to Job Card ${activeJobForSig.id}!`);
          }}
        />
      )}

      {/* Modal: Quick Requisition Part Add */}
      {isAddPartModalOpen && targetJobForPart && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-orange" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Requisition Spare Part ({targetJobForPart.id})
                </h3>
              </div>
            </div>

            <form onSubmit={handleAddPartToWorkOrder} className="space-y-4 text-xs">
              <div>
                <label className="font-mono text-slate-500 font-bold block mb-1">Part Description</label>
                <input
                  type="text"
                  required
                  value={partForm.partName}
                  onChange={e => setPartForm(prev => ({ ...prev, partName: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-slate-500 font-bold block mb-1">Part / OEM Code</label>
                  <input
                    type="text"
                    required
                    value={partForm.partNumber}
                    onChange={e => setPartForm(prev => ({ ...prev, partNumber: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-mono text-slate-500 font-bold block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={partForm.quantity}
                    onChange={e => setPartForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-slate-500 font-bold block mb-1">Unit Price (KES)</label>
                <input
                  type="number"
                  value={partForm.unitPrice}
                  onChange={e => setPartForm(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-900 font-mono font-bold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddPartModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-300 font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-orange hover:bg-amber-600 text-white font-extrabold rounded-xl font-mono uppercase tracking-wider shadow-md"
                >
                  Add To Job Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

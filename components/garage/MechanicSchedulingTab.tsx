import React, { useState } from 'react';
import { useGarage } from '../../contexts/GarageContext';
import { useSystemSettings } from '../../contexts/SettingsContext';
import type { MechanicShiftSchedule, MechanicTaskSchedule, GarageStaffUser, JobCard } from '../../types';
import { 
  Calendar, 
  Clock, 
  UserCheck, 
  Award, 
  Wrench, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  Check, 
  Plus, 
  Sparkles, 
  Layers, 
  Trash2, 
  BarChart2,
  ShieldCheck,
  Search,
  Filter,
  User,
  ArrowRight,
  Zap,
  Coffee,
  X
} from 'lucide-react';

export const MechanicSchedulingTab: React.FC = () => {
  const { 
    staffUsers, 
    jobCards, 
    mechanicShifts, 
    mechanicTasks, 
    activeBranchId, 
    branches,
    updateMechanicShift,
    assignTaskToMechanic,
    updateTaskStatus,
    deleteScheduledTask,
    hasPermission
  } = useGarage();

  const { formatPrice } = useSystemSettings();

  // Filters
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<'ALL' | 'Morning' | 'Afternoon' | 'Full Day'>('ALL');
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [selectedTaskToAssign, setSelectedTaskToAssign] = useState<Partial<MechanicTaskSchedule> | null>(null);
  const [editingShiftStaff, setEditingShiftStaff] = useState<GarageStaffUser | null>(null);

  // Form states for Task Assignment Modal
  const [assignForm, setAssignForm] = useState({
    jobCardId: '',
    taskTitle: '',
    requiredSpecialty: 'General Service',
    requiredSkillLevel: 'Senior Specialist' as MechanicTaskSchedule['requiredSkillLevel'],
    assignedStaffId: '',
    scheduledTimeWindow: '09:00 AM - 11:30 AM',
    estimatedHours: 2.0,
    priority: 'Normal' as MechanicTaskSchedule['priority'],
    notes: ''
  });

  // Form state for Shift Edit Modal
  const [shiftForm, setShiftForm] = useState({
    shiftType: 'Morning Shift (07:30 - 15:30)' as MechanicShiftSchedule['shiftType'],
    status: 'Clocked In' as MechanicShiftSchedule['status'],
    assignedBay: 'Bay 01 (Computerized Diagnostic Bay)',
    maxDailyHoursCapacity: 8
  });

  // Filter staff by branch
  const branchStaff = activeBranchId === 'ALL' 
    ? staffUsers 
    : staffUsers.filter(s => s.assignedBranchId === activeBranchId || s.assignedBranchId === 'ALL');

  // Filter mechanics / diagnostic techs only
  const mechanicsList = branchStaff.filter(s => s.role === 'MECHANIC' || s.role === 'DIAGNOSTIC_TECH' || s.role === 'SUPER_ADMIN' || s.role === 'BRANCH_MANAGER');

  // Active Job Cards needing task scheduling
  const branchJobCards = activeBranchId === 'ALL'
    ? jobCards
    : jobCards.filter(j => j.branchId === activeBranchId);

  // Unscheduled repair tasks derived from Job Cards or existing tasks
  const openJobCards = branchJobCards.filter(j => j.status !== 'Completed' && j.status !== 'Invoiced / Gate Pass Issued');

  // Stats calculation
  const totalClockedIn = mechanicsList.filter(m => m.shiftStatus === 'Clocked In' || m.shiftStatus === 'On Duty').length;
  const totalCapacityHours = mechanicsList.reduce((acc, m) => acc + (m.dailyCapacityHours || 8), 0);
  const totalScheduledHours = mechanicsList.reduce((acc, m) => acc + (m.scheduledHours || 0), 0);
  const loadPercentage = totalCapacityHours > 0 ? Math.round((totalScheduledHours / totalCapacityHours) * 100) : 0;
  const pendingTasksCount = mechanicTasks.filter(t => t.status === 'Scheduled' || t.status === 'In Progress').length;

  // Expertise compatibility calculator
  const calculateSkillMatch = (staff: GarageStaffUser, reqSpecialty: string, reqLevel: string) => {
    let score = 70; // baseline
    if (staff.specialty?.toLowerCase().includes(reqSpecialty.toLowerCase())) score += 20;
    if (staff.skillsList?.some(s => s.toLowerCase().includes(reqSpecialty.toLowerCase()))) score += 15;
    if (staff.expertiseLevel === reqLevel) score += 10;
    if (staff.role === 'DIAGNOSTIC_TECH' && reqSpecialty.toLowerCase().includes('ecu')) score += 15;

    // Penalty if capacity is full
    const remainingHours = (staff.dailyCapacityHours || 8) - (staff.scheduledHours || 0);
    if (remainingHours <= 0) score -= 40;

    return Math.min(99, Math.max(30, score));
  };

  // Handle open Assign Task Modal for a specific Job Card or custom task
  const handleOpenAssignModal = (jobCard?: JobCard) => {
    if (jobCard) {
      const complaintText = jobCard.customerComplaints?.[0] || jobCard.notes || 'General Vehicle Maintenance';
      const isEcuOrEngine = complaintText.toLowerCase().includes('ecu') || complaintText.toLowerCase().includes('engine') || complaintText.toLowerCase().includes('diagnostic');
      
      setAssignForm({
        jobCardId: jobCard.id,
        taskTitle: `${jobCard.vehicle.make} ${jobCard.vehicle.model} Service (${complaintText})`,
        requiredSpecialty: isEcuOrEngine ? 'ECU Programming, CAN-Bus & Fuel Systems' : 'Brake Systems, Suspension & Engine Overhaul',
        requiredSkillLevel: isEcuOrEngine ? 'Master Lead' : 'Senior Specialist',
        assignedStaffId: mechanicsList[0]?.id || '',
        scheduledTimeWindow: '10:00 AM - 12:30 PM',
        estimatedHours: 2.5,
        priority: 'High',
        notes: `Customer Complaint: ${complaintText}. Plate: ${jobCard.vehicle.plateNumber}`
      });
    } else {
      setAssignForm({
        jobCardId: openJobCards[0]?.id || 'JC-CUSTOM-101',
        taskTitle: 'Computerized ECU Fault Diagnostic & Calibration',
        requiredSpecialty: 'ECU Programming, CAN-Bus & Fuel Systems',
        requiredSkillLevel: 'Master Lead',
        assignedStaffId: mechanicsList[0]?.id || '',
        scheduledTimeWindow: '09:00 AM - 11:30 AM',
        estimatedHours: 2.0,
        priority: 'Normal',
        notes: 'Routine scanner evaluation and sensor logging.'
      });
    }
    setIsAssignTaskModalOpen(true);
  };

  // Save Task Assignment
  const handleSaveTaskAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedStaff = staffUsers.find(s => s.id === assignForm.assignedStaffId);
    if (!assignedStaff) return;

    const newTask: MechanicTaskSchedule = {
      id: `TASK-${Date.now().toString().slice(-4)}`,
      jobCardId: assignForm.jobCardId,
      vehiclePlate: openJobCards.find(j => j.id === assignForm.jobCardId)?.vehicle.plateNumber || 'KDG 789A',
      vehicleModel: openJobCards.find(j => j.id === assignForm.jobCardId)?.vehicle.model || 'Toyota Vehicle',
      taskTitle: assignForm.taskTitle,
      requiredSpecialty: assignForm.requiredSpecialty,
      requiredSkillLevel: assignForm.requiredSkillLevel,
      assignedStaffId: assignedStaff.id,
      assignedStaffName: assignedStaff.name,
      scheduledTimeWindow: assignForm.scheduledTimeWindow,
      estimatedHours: Number(assignForm.estimatedHours),
      priority: assignForm.priority,
      status: 'Scheduled',
      notes: assignForm.notes
    };

    assignTaskToMechanic(newTask);
    setIsAssignTaskModalOpen(false);
  };

  // Open Shift Edit Modal
  const handleOpenShiftModal = (staff: GarageStaffUser) => {
    setEditingShiftStaff(staff);
    const existingShift = mechanicShifts.find(s => s.staffId === staff.id);
    setShiftForm({
      shiftType: existingShift?.shiftType || 'Morning Shift (07:30 - 15:30)',
      status: existingShift?.status || 'Clocked In',
      assignedBay: existingShift?.assignedBay || 'Bay 01 (Computerized Diagnostic Bay)',
      maxDailyHoursCapacity: staff.dailyCapacityHours || 8
    });
    setIsShiftModalOpen(true);
  };

  // Save Shift Update
  const handleSaveShiftUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShiftStaff) return;

    const existingShift = mechanicShifts.find(s => s.staffId === editingShiftStaff.id);
    if (existingShift) {
      updateMechanicShift(existingShift.id, {
        shiftType: shiftForm.shiftType,
        status: shiftForm.status,
        assignedBay: shiftForm.assignedBay,
        maxDailyHoursCapacity: shiftForm.maxDailyHoursCapacity
      });
    } else {
      // Add new shift
      const newShift: MechanicShiftSchedule = {
        id: `SHIFT-${Date.now().toString().slice(-4)}`,
        staffId: editingShiftStaff.id,
        staffName: editingShiftStaff.name,
        dayOfWeek: 'Today',
        shiftType: shiftForm.shiftType,
        status: shiftForm.status,
        assignedBay: shiftForm.assignedBay,
        maxDailyHoursCapacity: shiftForm.maxDailyHoursCapacity
      };
      updateMechanicShift(newShift.id, newShift);
    }

    setIsShiftModalOpen(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-orange" />
            <span>Mechanic Shift & Task Scheduling Matrix</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Assign repair jobs to technicians based on shift availability, certifications, and expertise levels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAssignModal()}
            className="px-4 py-2.5 bg-brand-orange hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 font-mono uppercase tracking-wider shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Repair Task</span>
          </button>
        </div>
      </div>

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase">Mechanics On Duty</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-lg">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalClockedIn} <span className="text-xs text-slate-400 font-sans font-normal">/ {mechanicsList.length} Active</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-extrabold flex items-center gap-1 font-mono">
            <Zap className="w-3 h-3" />
            <span>Ready for Job Assignment</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase">Workload Capacity</span>
            <div className="p-2 bg-purple-100 dark:bg-purple-950/60 text-purple-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalScheduledHours}h <span className="text-xs text-slate-400 font-sans font-normal">/ {totalCapacityHours}h</span>
          </div>
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all rounded-full ${
                  loadPercentage > 90 ? 'bg-rose-500' : loadPercentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                }`} 
                style={{ width: `${Math.min(100, loadPercentage)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-500 block">
              {loadPercentage}% Capacity Allocated
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase">Scheduled Tasks</span>
            <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-600 rounded-lg">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {pendingTasksCount} <span className="text-xs text-slate-400 font-sans font-normal">Active Tasks</span>
          </div>
          <div className="text-[11px] text-slate-500 font-bold font-mono">
            Across {openJobCards.length} Open Work Orders
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase">Expertise Coverage</span>
            <div className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-600 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            100% Certified
          </div>
          <div className="text-[11px] text-slate-500 font-semibold font-mono">
            ECU, ABS, Aircon & Overhaul Covered
          </div>
        </div>
      </div>

      {/* Main Grid Layout: Mechanics Shift Roster (Left) & Scheduled Repair Tasks (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Mechanics Shift Roster & Expertise Capacity (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-brand-orange" />
                <span>Shift Roster & Technician Expertise Roster</span>
              </h3>
              <span className="text-xs font-mono font-bold text-slate-500">
                {mechanicsList.length} Mechanics Registered
              </span>
            </div>

            {/* Mechanics Cards List */}
            <div className="space-y-3">
              {mechanicsList.map((m) => {
                const shift = mechanicShifts.find(s => s.staffId === m.id);
                const assignedTasks = mechanicTasks.filter(t => t.assignedStaffId === m.id && t.status !== 'Completed');
                const remainingHours = Math.max(0, (m.dailyCapacityHours || 8) - (m.scheduledHours || 0));
                const capacityPct = Math.min(100, Math.round(((m.scheduledHours || 0) / (m.dailyCapacityHours || 8)) * 100));

                return (
                  <div 
                    key={m.id}
                    className="p-4 bg-slate-50 dark:bg-gray-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 transition-all hover:border-brand-orange/50"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-brand-orange/10 text-brand-orange font-black flex items-center justify-center text-sm font-mono shrink-0 shadow-xs border border-brand-orange/20">
                          {m.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                              {m.name}
                            </h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                              m.expertiseLevel === 'Master Lead' 
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300'
                                : m.expertiseLevel === 'Senior Specialist'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                            }`}>
                              {m.expertiseLevel || 'Senior Specialist'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            {m.specialty || 'General Service Mechanic'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono ${
                          m.shiftStatus === 'Clocked In' || m.shiftStatus === 'On Duty'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300'
                            : m.shiftStatus === 'On Break'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {m.shiftStatus === 'Clocked In' ? '🟢 Clocked In' : m.shiftStatus === 'On Break' ? '☕ On Break' : '🔴 Off Duty'}
                        </span>

                        <button
                          onClick={() => handleOpenShiftModal(m)}
                          className="px-2.5 py-1 bg-white dark:bg-gray-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-mono font-bold border border-slate-300 dark:border-slate-600 shadow-2xs"
                        >
                          Edit Shift
                        </button>
                      </div>
                    </div>

                    {/* Skill Tags */}
                    {m.skillsList && m.skillsList.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase mr-1">Skills:</span>
                        {m.skillsList.map((skill, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-0.5 bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Shift Details & Capacity Gauge */}
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-500 font-bold">Current Shift Window:</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {m.currentShift || 'Morning Shift (07:30 - 15:30)'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-500 font-bold">Daily Hours Capacity:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {m.scheduledHours || 0}h assigned / {m.dailyCapacityHours || 8}h max ({remainingHours}h available)
                        </span>
                      </div>

                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all rounded-full ${
                            capacityPct > 90 ? 'bg-rose-500' : capacityPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${capacityPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Assigned Active Tasks Summary */}
                    {assignedTasks.length > 0 && (
                      <div className="pt-1 space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Assigned Repair Tasks Today:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {assignedTasks.map(t => (
                            <div key={t.id} className="p-2 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs space-y-1">
                              <div className="flex items-center justify-between font-mono font-bold text-slate-900 dark:text-white">
                                <span className="text-brand-orange">{t.vehiclePlate}</span>
                                <span className="text-[10px] text-slate-400">{t.scheduledTimeWindow}</span>
                              </div>
                              <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                                {t.taskTitle}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Scheduled Repair Tasks Board & Open Work Orders (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Active Task Queue */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-brand-orange" />
                <span>Scheduled Repair Tasks Queue</span>
              </h3>
              <span className="text-xs font-mono font-bold text-brand-orange bg-brand-orange/10 px-2.5 py-0.5 rounded-full">
                {mechanicTasks.length} Scheduled
              </span>
            </div>

            <div className="space-y-3">
              {mechanicTasks.map((t) => (
                <div 
                  key={t.id}
                  className="p-3.5 bg-slate-50 dark:bg-gray-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 bg-brand-orange/10 text-brand-orange rounded text-[10px] font-mono font-extrabold uppercase mr-2">
                        {t.jobCardId}
                      </span>
                      <span className="font-mono font-extrabold text-slate-900 dark:text-white text-xs">
                        {t.vehiclePlate} ({t.vehicleModel})
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                      t.priority === 'Urgent' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                      t.priority === 'High' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {t.priority}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {t.taskTitle}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-brand-orange" />
                      <strong className="text-slate-800 dark:text-slate-200">{t.assignedStaffName}</strong>
                    </span>
                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {t.scheduledTimeWindow} ({t.estimatedHours}h)
                    </span>
                  </div>

                  {/* Task Status Control */}
                  <div className="flex items-center justify-between pt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      t.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                      t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      Stage: {t.status}
                    </span>

                    <div className="flex items-center gap-1">
                      {t.status !== 'In Progress' && t.status !== 'Completed' && (
                        <button
                          onClick={() => updateTaskStatus(t.id, 'In Progress')}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-[10px] rounded flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          <span>Start</span>
                        </button>
                      )}

                      {t.status !== 'Completed' && (
                        <button
                          onClick={() => updateTaskStatus(t.id, 'Completed')}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-[10px] rounded flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Complete</span>
                        </button>
                      )}

                      <button
                        onClick={() => deleteScheduledTask(t.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Open Work Orders Ready for Technician Assignment */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Open Work Orders Needing Task Assignment</span>
              </h3>
            </div>

            <div className="space-y-2">
              {openJobCards.map((j) => (
                <div 
                  key={j.id} 
                  className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 font-mono font-bold text-slate-900 dark:text-white">
                      <span className="text-purple-700 dark:text-purple-300">{j.id}</span>
                      <span>• {j.vehicle.plateNumber}</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 font-medium truncate">
                      {j.vehicle.make} {j.vehicle.model} - {j.primaryDefectReport}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenAssignModal(j)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-lg font-mono text-[11px] shrink-0 uppercase tracking-wider flex items-center gap-1"
                  >
                    <span>Assign</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Modal: Schedule Repair Task */}
      {isAssignTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-brand-orange" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Schedule Repair Task & Technician Assignment
                </h3>
              </div>
              <button 
                onClick={() => setIsAssignTaskModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTaskAssignment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-slate-500 font-bold block mb-1">Target Job Card</label>
                  <select
                    value={assignForm.jobCardId}
                    onChange={e => setAssignForm(prev => ({ ...prev, jobCardId: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-900 font-mono font-bold"
                  >
                    {openJobCards.map(j => (
                      <option key={j.id} value={j.id}>
                        {j.id} ({j.vehicle.plateNumber} - {j.vehicle.model})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-mono text-slate-500 font-bold block mb-1">Priority Level</label>
                  <select
                    value={assignForm.priority}
                    onChange={e => setAssignForm(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-900 font-mono font-bold"
                  >
                    <option value="Urgent">Urgent (Express Lift)</option>
                    <option value="High">High Priority</option>
                    <option value="Normal">Normal Service</option>
                    <option value="Routine">Routine Inspection</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-mono text-slate-500 font-bold block mb-1">Task Title / Work Scope</label>
                <input
                  type="text"
                  required
                  value={assignForm.taskTitle}
                  onChange={e => setAssignForm(prev => ({ ...prev, taskTitle: e.target.value }))}
                  placeholder="e.g. Computerized ECU Re-mapping & Fault Scan"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-slate-500 font-bold block mb-1">Required Specialty</label>
                  <select
                    value={assignForm.requiredSpecialty}
                    onChange={e => setAssignForm(prev => ({ ...prev, requiredSpecialty: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-900 font-bold"
                  >
                    <option value="ECU Programming, CAN-Bus & Fuel Systems">ECU Programming & Fuel Systems</option>
                    <option value="Brake Systems, Suspension & Engine Overhaul">Brakes, Suspension & Engine</option>
                    <option value="Auto Air Conditioning & Electrical Wiring">Auto AC & Electrical</option>
                    <option value="Routine Oil Service, Filters & Wheel Alignment">Routine Oil & Alignment</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono text-slate-500 font-bold block mb-1">Required Skill Level</label>
                  <select
                    value={assignForm.requiredSkillLevel}
                    onChange={e => setAssignForm(prev => ({ ...prev, requiredSkillLevel: e.target.value as any }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-900 font-bold"
                  >
                    <option value="Master Lead">Master Lead (Cert. Expert)</option>
                    <option value="Senior Specialist">Senior Specialist</option>
                    <option value="Mid Technician">Mid Technician</option>
                    <option value="Junior Apprentice">Junior Apprentice</option>
                  </select>
                </div>
              </div>

              {/* Smart Skill Matching Mechanic Selection Box */}
              <div>
                <label className="font-mono text-slate-500 font-bold block mb-1 flex items-center justify-between">
                  <span>Assign Technician (Ranked by Expertise Match)</span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>AI Expertise Match Calculator</span>
                  </span>
                </label>

                <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  {mechanicsList.map(m => {
                    const matchScore = calculateSkillMatch(m, assignForm.requiredSpecialty, assignForm.requiredSkillLevel);
                    const isSelected = assignForm.assignedStaffId === m.id;
                    const remHours = Math.max(0, (m.dailyCapacityHours || 8) - (m.scheduledHours || 0));

                    return (
                      <div
                        key={m.id}
                        onClick={() => setAssignForm(prev => ({ ...prev, assignedStaffId: m.id }))}
                        className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                          isSelected 
                            ? 'bg-brand-orange/10 border-brand-orange text-slate-900 dark:text-white' 
                            : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-extrabold flex items-center gap-2">
                            <span>{m.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {m.expertiseLevel}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {m.specialty} • {remHours}h Capacity Left
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                            matchScore >= 85 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            matchScore >= 60 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {matchScore}% Skill Match
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-slate-500 font-bold block mb-1">Time Slot Window</label>
                  <input
                    type="text"
                    value={assignForm.scheduledTimeWindow}
                    onChange={e => setAssignForm(prev => ({ ...prev, scheduledTimeWindow: e.target.value }))}
                    placeholder="e.g. 09:00 AM - 11:30 AM"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-mono text-slate-500 font-bold block mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    value={assignForm.estimatedHours}
                    onChange={e => setAssignForm(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 1 }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAssignTaskModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-orange hover:bg-amber-600 text-white font-extrabold rounded-xl font-mono uppercase tracking-wider shadow-md"
                >
                  Confirm Task Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Mechanic Shift & Availability */}
      {isShiftModalOpen && editingShiftStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-orange" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Update Shift: {editingShiftStaff.name}
                </h3>
              </div>
              <button 
                onClick={() => setIsShiftModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShiftUpdate} className="space-y-4 text-xs">
              <div>
                <label className="font-mono text-slate-500 font-bold block mb-1">Shift Type / Working Hours</label>
                <select
                  value={shiftForm.shiftType}
                  onChange={e => setShiftForm(prev => ({ ...prev, shiftType: e.target.value as any }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-900 font-bold"
                >
                  <option value="Morning Shift (07:30 - 15:30)">Morning Shift (07:30 - 15:30)</option>
                  <option value="Afternoon Shift (11:30 - 19:30)">Afternoon Shift (11:30 - 19:30)</option>
                  <option value="Full Day (08:00 - 17:00)">Full Day (08:00 - 17:00)</option>
                  <option value="Night Shift (18:00 - 02:00)">Night Shift (18:00 - 02:00)</option>
                  <option value="Off Duty">Off Duty / Rest Day</option>
                </select>
              </div>

              <div>
                <label className="font-mono text-slate-500 font-bold block mb-1">Clock Status</label>
                <select
                  value={shiftForm.status}
                  onChange={e => setShiftForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-900 font-bold"
                >
                  <option value="Clocked In">Clocked In (Active Duty)</option>
                  <option value="On Duty">On Duty (In Workshop)</option>
                  <option value="On Break">On Break / Lunch</option>
                  <option value="Off Duty">Off Duty / On Leave</option>
                </select>
              </div>

              <div>
                <label className="font-mono text-slate-500 font-bold block mb-1">Assigned Lift Bay</label>
                <input
                  type="text"
                  value={shiftForm.assignedBay}
                  onChange={e => setShiftForm(prev => ({ ...prev, assignedBay: e.target.value }))}
                  placeholder="e.g. Bay 01 (Computerized Diagnostic Bay)"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-900 font-bold"
                />
              </div>

              <div>
                <label className="font-mono text-slate-500 font-bold block mb-1">Max Daily Capacity Hours</label>
                <input
                  type="number"
                  min="4"
                  max="14"
                  value={shiftForm.maxDailyHoursCapacity}
                  onChange={e => setShiftForm(prev => ({ ...prev, maxDailyHoursCapacity: parseFloat(e.target.value) || 8 }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-900 font-mono font-bold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-300 font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-orange hover:bg-amber-600 text-white font-extrabold rounded-xl font-mono uppercase tracking-wider shadow-md"
                >
                  Save Shift Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

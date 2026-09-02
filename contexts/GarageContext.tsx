import React, { createContext, useContext, useState, useEffect } from 'react';
import type { 
  GarageBranch, 
  GarageRoleType, 
  GaragePermission, 
  GarageUserRole, 
  GarageStaffUser, 
  JobCard, 
  DiagnosticReport, 
  JobCardPartItem, 
  JobCardLaborItem,
  CustomerSignatureData,
  MechanicShiftSchedule,
  MechanicTaskSchedule,
  CustomerNotification,
  NotificationSettings,
  CustomerFeedback
} from '../types';
import { 
  INITIAL_GARAGE_BRANCHES, 
  GARAGE_ROLES_DEFINITION, 
  MOCK_GARAGE_STAFF, 
  INITIAL_JOB_CARDS,
  MOCK_MECHANIC_SHIFTS,
  MOCK_MECHANIC_TASKS,
  INITIAL_NOTIFICATION_SETTINGS,
  INITIAL_CUSTOMER_NOTIFICATIONS,
  INITIAL_CUSTOMER_FEEDBACK
} from '../data/garageMockData';

interface GarageContextType {
  activeRole: GarageRoleType;
  setActiveRole: (role: GarageRoleType) => void;
  activeBranchId: string;
  setActiveBranchId: (branchId: string) => void;
  branches: GarageBranch[];
  staffUsers: GarageStaffUser[];
  roles: GarageUserRole[];
  jobCards: JobCard[];
  mechanicShifts: MechanicShiftSchedule[];
  mechanicTasks: MechanicTaskSchedule[];
  notifications: CustomerNotification[];
  notificationSettings: NotificationSettings;
  customerFeedback: CustomerFeedback[];
  addCustomerFeedback: (feedback: Omit<CustomerFeedback, 'id' | 'createdAt'>) => void;
  deleteCustomerFeedback: (id: string) => void;
  sendManualCustomerNotification: (notification: Partial<CustomerNotification>) => void;
  updateNotificationSettings: (partial: Partial<NotificationSettings>) => void;
  clearNotificationLogs: () => void;
  hasPermission: (permission: GaragePermission) => boolean;
  addBranch: (branch: GarageBranch) => void;
  updateBranch: (id: string, partial: Partial<GarageBranch>) => void;
  deleteBranch: (id: string) => void;
  createJobCard: (jobCard: JobCard) => void;
  updateJobCard: (id: string, partial: Partial<JobCard>) => void;
  deleteJobCard: (id: string) => void;
  updateJobCardStatus: (id: string, status: JobCard['status']) => void;
  addDiagnosticToJobCard: (jobCardId: string, report: DiagnosticReport) => void;
  addPartToJobCard: (jobCardId: string, part: JobCardPartItem) => void;
  removePartFromJobCard: (jobCardId: string, partId: string) => void;
  updatePartStatus: (jobCardId: string, partId: string, status: JobCardPartItem['status']) => void;
  addLaborToJobCard: (jobCardId: string, labor: JobCardLaborItem) => void;
  removeLaborFromJobCard: (jobCardId: string, laborId: string) => void;
  updateJobCardFinancials: (jobCardId: string, discount: number, taxRatePct: number) => void;
  approveCustomerEstimate: (jobCardId: string) => void;
  addSignatureToJobCard: (jobCardId: string, signature: CustomerSignatureData) => void;
  issueGatePass: (jobCardId: string) => void;
  addStaffUser: (staff: GarageStaffUser) => void;
  updateStaffUser: (id: string, partial: Partial<GarageStaffUser>) => void;
  deleteStaffUser: (id: string) => void;
  updateMechanicShift: (shiftId: string, partial: Partial<MechanicShiftSchedule>) => void;
  assignTaskToMechanic: (task: MechanicTaskSchedule) => void;
  updateTaskStatus: (taskId: string, status: MechanicTaskSchedule['status']) => void;
  deleteScheduledTask: (taskId: string) => void;
  updateRolePermissions: (roleKey: GarageRoleType, permissions: GaragePermission[]) => void;
  getRoleDefinition: (roleKey: GarageRoleType) => GarageUserRole | undefined;
  resetGarageData: () => void;
}

const GarageContext = createContext<GarageContextType | undefined>(undefined);

export const GarageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRoleState] = useState<GarageRoleType>(() => {
    try {
      const saved = localStorage.getItem('garage_active_role');
      if (saved) return saved as GarageRoleType;
    } catch (e) {
      console.error(e);
    }
    return 'SUPER_ADMIN';
  });

  const [activeBranchId, setActiveBranchIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('garage_active_branch_id');
      if (saved) return saved;
    } catch (e) {
      console.error(e);
    }
    return 'ALL';
  });

  const [branches, setBranches] = useState<GarageBranch[]>(() => {
    try {
      const saved = localStorage.getItem('garage_branches');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_GARAGE_BRANCHES;
  });

  const [roles, setRoles] = useState<GarageUserRole[]>(() => {
    try {
      const saved = localStorage.getItem('garage_roles');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return GARAGE_ROLES_DEFINITION;
  });

  const [staffUsers, setStaffUsers] = useState<GarageStaffUser[]>(() => {
    try {
      const saved = localStorage.getItem('garage_staff_users');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return MOCK_GARAGE_STAFF;
  });

  const [jobCards, setJobCards] = useState<JobCard[]>(() => {
    try {
      const saved = localStorage.getItem('garage_job_cards');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_JOB_CARDS;
  });

  const [mechanicShifts, setMechanicShifts] = useState<MechanicShiftSchedule[]>(() => {
    try {
      const saved = localStorage.getItem('garage_mechanic_shifts');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return MOCK_MECHANIC_SHIFTS;
  });

  const [mechanicTasks, setMechanicTasks] = useState<MechanicTaskSchedule[]>(() => {
    try {
      const saved = localStorage.getItem('garage_mechanic_tasks');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return MOCK_MECHANIC_TASKS;
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem('garage_notification_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_NOTIFICATION_SETTINGS;
  });

  const [notifications, setNotifications] = useState<CustomerNotification[]>(() => {
    try {
      const saved = localStorage.getItem('garage_notifications');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CUSTOMER_NOTIFICATIONS;
  });

  const [customerFeedback, setCustomerFeedback] = useState<CustomerFeedback[]>(() => {
    try {
      const saved = localStorage.getItem('garage_customer_feedback');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CUSTOMER_FEEDBACK;
  });

  useEffect(() => {
    try {
      localStorage.setItem('garage_customer_feedback', JSON.stringify(customerFeedback));
    } catch (e) { console.error(e); }
  }, [customerFeedback]);

  const addCustomerFeedback = (feedbackData: Omit<CustomerFeedback, 'id' | 'createdAt'>) => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    
    const newFeedback: CustomerFeedback = {
      ...feedbackData,
      id: `CSAT-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: formattedDate
    };

    setCustomerFeedback(prev => [newFeedback, ...prev]);
  };

  const deleteCustomerFeedback = (id: string) => {
    setCustomerFeedback(prev => prev.filter(f => f.id !== id));
  };

  useEffect(() => {
    try {
      localStorage.setItem('garage_mechanic_shifts', JSON.stringify(mechanicShifts));
    } catch (e) { console.error(e); }
  }, [mechanicShifts]);

  useEffect(() => {
    try {
      localStorage.setItem('garage_mechanic_tasks', JSON.stringify(mechanicTasks));
    } catch (e) { console.error(e); }
  }, [mechanicTasks]);

  useEffect(() => {
    try {
      localStorage.setItem('garage_notification_settings', JSON.stringify(notificationSettings));
    } catch (e) { console.error(e); }
  }, [notificationSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('garage_notifications', JSON.stringify(notifications));
    } catch (e) { console.error(e); }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem('garage_active_role', activeRole);
    } catch (e) { console.error(e); }
  }, [activeRole]);

  useEffect(() => {
    try {
      localStorage.setItem('garage_active_branch_id', activeBranchId);
    } catch (e) { console.error(e); }
  }, [activeBranchId]);

  useEffect(() => {
    try {
      localStorage.setItem('garage_branches', JSON.stringify(branches));
    } catch (e) { console.error(e); }
  }, [branches]);

  useEffect(() => {
    try {
      localStorage.setItem('garage_roles', JSON.stringify(roles));
    } catch (e) { console.error(e); }
  }, [roles]);

  useEffect(() => {
    try {
      localStorage.setItem('garage_staff_users', JSON.stringify(staffUsers));
    } catch (e) { console.error(e); }
  }, [staffUsers]);

  useEffect(() => {
    try {
      localStorage.setItem('garage_job_cards', JSON.stringify(jobCards));
    } catch (e) { console.error(e); }
  }, [jobCards]);

  const updateNotificationSettings = (partial: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => ({ ...prev, ...partial }));
  };

  const clearNotificationLogs = () => {
    setNotifications([]);
  };

  const sendManualCustomerNotification = (notifPartial: Partial<CustomerNotification>) => {
    const newNotif: CustomerNotification = {
      id: `NOTIF-${Date.now().toString().slice(-6)}`,
      jobCardId: notifPartial.jobCardId || 'GENERAL',
      vehiclePlate: notifPartial.vehiclePlate || 'N/A',
      customerName: notifPartial.customerName || 'Valued Customer',
      customerPhone: notifPartial.customerPhone || 'N/A',
      customerEmail: notifPartial.customerEmail,
      channel: notifPartial.channel || 'SMS & EMAIL',
      triggerStatus: notifPartial.triggerStatus || 'MANUAL_ALERT',
      messageSubject: notifPartial.messageSubject || 'Update from Masuma Auto Care',
      messageBody: notifPartial.messageBody || '',
      sentAt: new Date().toLocaleString(),
      deliveryStatus: 'Delivered',
      isAutomated: false,
      branchName: notifPartial.branchName || 'Nairobi Central Flagship Auto Care'
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const triggerAutoStatusNotification = (jobCard: JobCard, newStatus: JobCard['status']) => {
    if (!notificationSettings.autoTriggerOnStatusChange) return;

    const template = notificationSettings.statusTemplates[newStatus];
    if (!template || !template.enabled) return;

    const custName = jobCard.vehicle.ownerName || 'Valued Customer';
    const custPhone = jobCard.vehicle.ownerPhone || '';
    const custEmail = jobCard.vehicle.ownerEmail || '';
    const plate = jobCard.vehicle.plateNumber;
    const vehicleDesc = `${jobCard.vehicle.make} ${jobCard.vehicle.model}`;
    const branch = jobCard.branchName || 'Masuma Auto Care';
    const jcId = jobCard.id;
    const tech = jobCard.assignedTechnicianName || 'Service Team';
    const amount = jobCard.totalEstimate ? jobCard.totalEstimate.toLocaleString() : '0';
    const gatePass = jobCard.gatePassCode || 'GP-PENDING';
    const bay = jobCard.assignedLiftBay || 'Service Bay';
    const completion = jobCard.estimatedCompletion || 'Today';

    const replaceVars = (text: string) => {
      return text
        .replace(/\[Customer\]/g, custName)
        .replace(/\[Vehicle\]/g, vehicleDesc)
        .replace(/\[Plate\]/g, plate)
        .replace(/\[Branch\]/g, branch)
        .replace(/\[ID\]/g, jcId)
        .replace(/\[Tech\]/g, tech)
        .replace(/\[Amount\]/g, amount)
        .replace(/\[GatePass\]/g, gatePass)
        .replace(/\[Bay\]/g, bay)
        .replace(/\[Completion\]/g, completion)
        .replace(/\[Date\]/g, new Date().toLocaleDateString());
    };

    const smsText = replaceVars(template.smsTemplate);
    const emailSubj = replaceVars(template.emailSubject);

    let channel: CustomerNotification['channel'] = 'SMS';
    if (custEmail && notificationSettings.emailEnabled && notificationSettings.smsEnabled) {
      channel = 'SMS & EMAIL';
    } else if (custEmail && notificationSettings.emailEnabled) {
      channel = 'EMAIL';
    } else {
      channel = 'SMS';
    }

    const autoNotif: CustomerNotification = {
      id: `NOTIF-${Date.now().toString().slice(-6)}`,
      jobCardId: jcId,
      vehiclePlate: plate,
      customerName: custName,
      customerPhone: custPhone,
      customerEmail: custEmail,
      channel,
      triggerStatus: newStatus,
      messageSubject: emailSubj,
      messageBody: smsText,
      sentAt: new Date().toLocaleString(),
      deliveryStatus: 'Delivered',
      isAutomated: true,
      branchName: branch
    };

    setNotifications(prev => [autoNotif, ...prev]);

    const notifLog = {
      id: `LOG-NOTIF-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      authorName: 'Auto-Notifier Engine',
      actionTitle: `Customer Alert Triggered (${channel})`,
      details: `Status update: ${newStatus}. Alert dispatched to ${custPhone || custEmail}. Content: "${smsText.slice(0, 75)}..."`
    };

    setJobCards(prev => prev.map(jc => jc.id === jcId ? { ...jc, historyLogs: [notifLog, ...(jc.historyLogs || [])] } : jc));
  };

  const setActiveRole = (role: GarageRoleType) => {
    setActiveRoleState(role);
  };

  const setActiveBranchId = (branchId: string) => {
    setActiveBranchIdState(branchId);
  };

  const getRoleDefinition = (roleKey: GarageRoleType) => {
    return roles.find(r => r.key === roleKey);
  };

  const hasPermission = (permission: GaragePermission): boolean => {
    const roleDef = getRoleDefinition(activeRole);
    if (!roleDef) return false;
    return roleDef.permissions.includes(permission);
  };

  const addBranch = (branch: GarageBranch) => {
    setBranches(prev => [branch, ...prev]);
  };

  const updateBranch = (id: string, partial: Partial<GarageBranch>) => {
    setBranches(prev => prev.map(b => b.id === id ? { ...b, ...partial } : b));
  };

  const deleteBranch = (id: string) => {
    setBranches(prev => prev.filter(b => b.id !== id));
  };

  const createJobCard = (jobCard: JobCard) => {
    setJobCards(prev => [jobCard, ...prev]);
    setBranches(prev => prev.map(b => b.id === jobCard.branchId ? { ...b, activeJobsCount: b.activeJobsCount + 1 } : b));
    triggerAutoStatusNotification(jobCard, jobCard.status);
  };

  const updateJobCard = (id: string, partial: Partial<JobCard>) => {
    setJobCards(prev => prev.map(jc => jc.id === id ? { ...jc, ...partial } : jc));
  };

  const deleteJobCard = (id: string) => {
    setJobCards(prev => prev.filter(jc => jc.id !== id));
  };

  const updateJobCardStatus = (id: string, status: JobCard['status']) => {
    const targetJc = jobCards.find(jc => jc.id === id);
    setJobCards(prev => prev.map(jc => {
      if (jc.id !== id) return jc;
      const newLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        authorName: activeRole,
        actionTitle: `Status Changed to ${status}`,
        details: `Work order stage transitioned to ${status}`
      };
      return {
        ...jc,
        status,
        historyLogs: [newLog, ...(jc.historyLogs || [])]
      };
    }));

    if (targetJc) {
      triggerAutoStatusNotification({ ...targetJc, status }, status);
    }
  };

  const addDiagnosticToJobCard = (jobCardId: string, report: DiagnosticReport) => {
    setJobCards(prev => prev.map(jc => {
      if (jc.id !== jobCardId) return jc;
      const newLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        authorName: report.technicianName,
        actionTitle: 'Diagnostic ECU Scan Added',
        details: `Overall health score: ${report.overallHealthScore}%. Fault codes found: ${report.faultCodes.map(f => f.code).join(', ') || 'None'}`
      };
      return {
        ...jc,
        diagnosticReport: report,
        status: jc.status === 'Booked' ? 'Diagnostic Scan' : jc.status,
        historyLogs: [newLog, ...(jc.historyLogs || [])]
      };
    }));
  };

  // Helper to recalculate financials
  const recalculateTotals = (parts: JobCardPartItem[], labor: JobCardLaborItem[], taxRatePct: number = 16, discount: number = 0) => {
    const partsSum = parts.reduce((acc, p) => acc + (p.unitPrice * p.quantity), 0);
    const laborSum = labor.reduce((acc, l) => acc + (l.ratePerHour * l.hours), 0);
    const subtotal = partsSum + laborSum;
    const tax = Math.round((subtotal - discount) * (taxRatePct / 100));
    const total = Math.max(0, subtotal - discount + tax);
    return { subtotalAmount: subtotal, taxAmount: tax, totalEstimate: total };
  };

  const addPartToJobCard = (jobCardId: string, part: JobCardPartItem) => {
    setJobCards(prev => prev.map(jc => {
      if (jc.id !== jobCardId) return jc;
      const updatedParts = [...jc.parts, part];
      const calc = recalculateTotals(updatedParts, jc.labor, jc.taxRatePct || 16, jc.discountAmount || 0);
      const newLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        authorName: activeRole,
        actionTitle: 'Part Item Requested',
        details: `Added ${part.partName} (Qty: ${part.quantity}, SKU: ${part.sku})`
      };
      return {
        ...jc,
        parts: updatedParts,
        ...calc,
        historyLogs: [newLog, ...(jc.historyLogs || [])]
      };
    }));
  };

  const removePartFromJobCard = (jobCardId: string, partId: string) => {
    setJobCards(prev => prev.map(jc => {
      if (jc.id !== jobCardId) return jc;
      const updatedParts = jc.parts.filter(p => p.id !== partId);
      const calc = recalculateTotals(updatedParts, jc.labor, jc.taxRatePct || 16, jc.discountAmount || 0);
      return {
        ...jc,
        parts: updatedParts,
        ...calc
      };
    }));
  };

  const updatePartStatus = (jobCardId: string, partId: string, status: JobCardPartItem['status']) => {
    setJobCards(prev => prev.map(jc => {
      if (jc.id !== jobCardId) return jc;
      const updatedParts = jc.parts.map(p => p.id === partId ? { ...p, status } : p);
      return {
        ...jc,
        parts: updatedParts
      };
    }));
  };

  const addLaborToJobCard = (jobCardId: string, labor: JobCardLaborItem) => {
    setJobCards(prev => prev.map(jc => {
      if (jc.id !== jobCardId) return jc;
      const updatedLabor = [...jc.labor, labor];
      const calc = recalculateTotals(jc.parts, updatedLabor, jc.taxRatePct || 16, jc.discountAmount || 0);
      const newLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        authorName: labor.technicianName,
        actionTitle: 'Labor Charge Added',
        details: `${labor.taskDescription} (${labor.hours} hrs @ KES ${labor.ratePerHour}/hr)`
      };
      return {
        ...jc,
        labor: updatedLabor,
        ...calc,
        historyLogs: [newLog, ...(jc.historyLogs || [])]
      };
    }));
  };

  const removeLaborFromJobCard = (jobCardId: string, laborId: string) => {
    setJobCards(prev => prev.map(jc => {
      if (jc.id !== jobCardId) return jc;
      const updatedLabor = jc.labor.filter(l => l.id !== laborId);
      const calc = recalculateTotals(jc.parts, updatedLabor, jc.taxRatePct || 16, jc.discountAmount || 0);
      return {
        ...jc,
        labor: updatedLabor,
        ...calc
      };
    }));
  };

  const updateJobCardFinancials = (jobCardId: string, discount: number, taxRatePct: number) => {
    setJobCards(prev => prev.map(jc => {
      if (jc.id !== jobCardId) return jc;
      const calc = recalculateTotals(jc.parts, jc.labor, taxRatePct, discount);
      return {
        ...jc,
        taxRatePct,
        discountAmount: discount,
        ...calc
      };
    }));
  };

  const approveCustomerEstimate = (jobCardId: string) => {
    setJobCards(prev => prev.map(jc => {
      if (jc.id !== jobCardId) return jc;
      const newLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        authorName: 'Customer / Service Advisor',
        actionTitle: 'Work Estimate Approved',
        details: `Customer authorized repair work total KES ${jc.totalEstimate.toLocaleString()}`
      };
      return {
        ...jc,
        customerApprovalStatus: 'Approved',
        status: jc.status === 'Booked' || jc.status === 'Diagnostic Scan' ? 'In Progress' : jc.status,
        historyLogs: [newLog, ...(jc.historyLogs || [])]
      };
    }));
  };

  const addSignatureToJobCard = (jobCardId: string, signature: CustomerSignatureData) => {
    setJobCards(prev => prev.map(jc => {
      if (jc.id !== jobCardId) return jc;
      const existingSignatures = jc.signatures || [];
      const updatedSignatures = [signature, ...existingSignatures];
      const isApproval = signature.signatureType === 'Diagnostic Estimate Sign-Off' || signature.signatureType === 'Final Repair Acceptance';
      const newLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        authorName: signature.signerName,
        actionTitle: `Digital Signature Captured (${signature.signatureType})`,
        details: `Signed by ${signature.signerName} (${signature.signerPhone || 'No phone'}). ${signature.notes ? `Note: ${signature.notes}` : ''}`
      };

      return {
        ...jc,
        signatures: updatedSignatures,
        customerApprovalStatus: isApproval ? 'Approved' : jc.customerApprovalStatus,
        status: (isApproval && (jc.status === 'Booked' || jc.status === 'Diagnostic Scan')) ? 'In Progress' : jc.status,
        historyLogs: [newLog, ...(jc.historyLogs || [])]
      };
    }));
  };

  const issueGatePass = (jobCardId: string) => {
    setJobCards(prev => prev.map(jc => {
      if (jc.id !== jobCardId) return jc;
      const code = `GP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        authorName: activeRole,
        actionTitle: 'Customer Security Gate Pass Issued',
        details: `Issued Gate Pass ${code} for vehicle release.`
      };
      return {
        ...jc,
        gatePassIssued: true,
        gatePassCode: code,
        paymentStatus: 'Fully Paid',
        status: 'Invoiced',
        historyLogs: [newLog, ...(jc.historyLogs || [])]
      };
    }));
  };

  const addStaffUser = (staff: GarageStaffUser) => {
    setStaffUsers(prev => [staff, ...prev]);
  };

  const updateStaffUser = (id: string, partial: Partial<GarageStaffUser>) => {
    setStaffUsers(prev => prev.map(s => s.id === id ? { ...s, ...partial } : s));
  };

  const deleteStaffUser = (id: string) => {
    setStaffUsers(prev => prev.filter(s => s.id !== id));
  };

  const updateMechanicShift = (shiftId: string, partial: Partial<MechanicShiftSchedule>) => {
    setMechanicShifts(prev => prev.map(s => s.id === shiftId ? { ...s, ...partial } : s));
    // Also sync shift status to staff user
    const targetShift = mechanicShifts.find(s => s.id === shiftId);
    if (targetShift && partial.status) {
      const shiftStatusMap: Record<string, GarageStaffUser['shiftStatus']> = {
        'Clocked In': 'Clocked In',
        'On Duty': 'On Duty',
        'On Break': 'On Break',
        'Scheduled': 'On Duty',
        'Off Duty': 'Off Duty'
      };
      setStaffUsers(prev => prev.map(staff => 
        staff.id === targetShift.staffId ? {
          ...staff,
          shiftStatus: shiftStatusMap[partial.status || 'On Duty'] || staff.shiftStatus
        } : staff
      ));
    }
  };

  const assignTaskToMechanic = (task: MechanicTaskSchedule) => {
    setMechanicTasks(prev => {
      const existing = prev.filter(t => t.id !== task.id);
      return [task, ...existing];
    });

    // Update job card's assigned technician
    setJobCards(prev => prev.map(j => {
      if (j.id === task.jobCardId) {
        return {
          ...j,
          assignedTechnicianId: task.assignedStaffId,
          assignedTechnicianName: task.assignedStaffName,
          historyLogs: [
            {
              id: `LOG-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              action: 'Task & Tech Assigned',
              performedByName: task.assignedStaffName,
              details: `Task "${task.taskTitle}" scheduled (${task.scheduledTimeWindow}, ${task.estimatedHours}h)`
            },
            ...(j.historyLogs || [])
          ]
        };
      }
      return j;
    }));

    // Recalculate scheduled hours for staff user
    setStaffUsers(prev => prev.map(staff => {
      if (staff.id === task.assignedStaffId) {
        const currentSched = staff.scheduledHours || 0;
        return {
          ...staff,
          scheduledHours: +(currentSched + task.estimatedHours).toFixed(1)
        };
      }
      return staff;
    }));
  };

  const updateTaskStatus = (taskId: string, status: MechanicTaskSchedule['status']) => {
    setMechanicTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  };

  const deleteScheduledTask = (taskId: string) => {
    setMechanicTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const updateRolePermissions = (roleKey: GarageRoleType, permissions: GaragePermission[]) => {
    setRoles(prev => prev.map(r => r.key === roleKey ? { ...r, permissions } : r));
  };

  const resetGarageData = () => {
    setBranches(INITIAL_GARAGE_BRANCHES);
    setRoles(GARAGE_ROLES_DEFINITION);
    setStaffUsers(MOCK_GARAGE_STAFF);
    setJobCards(INITIAL_JOB_CARDS);
    setMechanicShifts(MOCK_MECHANIC_SHIFTS);
    setMechanicTasks(MOCK_MECHANIC_TASKS);
    setNotificationSettings(INITIAL_NOTIFICATION_SETTINGS);
    setNotifications(INITIAL_CUSTOMER_NOTIFICATIONS);
    setCustomerFeedback(INITIAL_CUSTOMER_FEEDBACK);
    localStorage.removeItem('garage_branches');
    localStorage.removeItem('garage_roles');
    localStorage.removeItem('garage_staff_users');
    localStorage.removeItem('garage_job_cards');
    localStorage.removeItem('garage_mechanic_shifts');
    localStorage.removeItem('garage_mechanic_tasks');
    localStorage.removeItem('garage_notification_settings');
    localStorage.removeItem('garage_notifications');
    localStorage.removeItem('garage_customer_feedback');
  };

  return (
    <GarageContext.Provider value={{
      activeRole,
      setActiveRole,
      activeBranchId,
      setActiveBranchId,
      branches,
      staffUsers,
      roles,
      jobCards,
      mechanicShifts,
      mechanicTasks,
      notifications,
      notificationSettings,
      customerFeedback,
      addCustomerFeedback,
      deleteCustomerFeedback,
      sendManualCustomerNotification,
      updateNotificationSettings,
      clearNotificationLogs,
      hasPermission,
      addBranch,
      updateBranch,
      deleteBranch,
      createJobCard,
      updateJobCard,
      deleteJobCard,
      updateJobCardStatus,
      addDiagnosticToJobCard,
      addPartToJobCard,
      removePartFromJobCard,
      updatePartStatus,
      addLaborToJobCard,
      removeLaborFromJobCard,
      updateJobCardFinancials,
      approveCustomerEstimate,
      addSignatureToJobCard,
      issueGatePass,
      addStaffUser,
      updateStaffUser,
      deleteStaffUser,
      updateMechanicShift,
      assignTaskToMechanic,
      updateTaskStatus,
      deleteScheduledTask,
      updateRolePermissions,
      getRoleDefinition,
      resetGarageData
    }}>
      {children}
    </GarageContext.Provider>
  );
};

export const useGarage = () => {
  const context = useContext(GarageContext);
  if (!context) {
    throw new Error('useGarage must be used within a GarageProvider');
  }
  return context;
};

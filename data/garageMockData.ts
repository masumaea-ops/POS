import type { 
  GarageBranch, 
  GarageUserRole, 
  GarageStaffUser, 
  DiagnosticErrorCode, 
  JobCard,
  GaragePermission,
  NotificationSettings,
  CustomerNotification,
  CustomerFeedback
} from '../types';

export const INITIAL_GARAGE_BRANCHES: GarageBranch[] = [
  {
    id: 'GAR-NRB-01',
    name: 'Nairobi Central Flagship Auto Care',
    city: 'Nairobi',
    address: 'Commercial Street, Off Enterprise Rd, Industrial Area',
    phone: '+254 711 098 701',
    managerName: 'David Ochieng',
    totalLiftsBays: 8,
    activeJobsCount: 5,
    status: 'Active',
    diagnosticEquipment: ['Masuma ECU Pro-Diag X900', 'Bosch KTS 590', 'Autel MaxiSys Ultra']
  },
  {
    id: 'GAR-MSA-02',
    name: 'MOMBASA COASTAL MOTORS & DIAGNOSTICS',
    city: 'Mombasa',
    address: 'Mbaraki Rd, Near Port Gate 3, Shimanzi',
    phone: '+254 711 098 702',
    managerName: 'Amina Hassan',
    totalLiftsBays: 6,
    activeJobsCount: 3,
    status: 'Active',
    diagnosticEquipment: ['Masuma ECU Pro-Diag X900', 'Launch X431 V+']
  },
  {
    id: 'GAR-NKR-03',
    name: 'Nakuru Highway Express Bay',
    city: 'Nakuru',
    address: 'Nakuru-Eldoret Highway, Opp. Westside Mall',
    phone: '+254 711 098 703',
    managerName: 'Peter Kamau',
    totalLiftsBays: 4,
    activeJobsCount: 2,
    status: 'Active',
    diagnosticEquipment: ['Launch X431 PAD VII', 'Masuma ECU Pro-Diag Lite']
  },
  {
    id: 'GAR-KSM-04',
    name: 'Kisumu Lake Basin Auto Hub',
    city: 'Kisumu',
    address: 'Oginga Odinga Rd, Near Central Bus Park',
    phone: '+254 711 098 704',
    managerName: 'Otieno Owino',
    totalLiftsBays: 5,
    activeJobsCount: 1,
    status: 'Active',
    diagnosticEquipment: ['Autel MaxiSys MS906BT']
  }
];

export const GARAGE_ROLES_DEFINITION: GarageUserRole[] = [
  {
    key: 'SUPER_ADMIN',
    name: 'Chain Super Admin',
    description: 'Unrestricted control across all garage outlets, master financial reporting, system config, and role permissions.',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300',
    permissions: [
      'view_all_branches',
      'manage_branches',
      'switch_location',
      'create_job_card',
      'edit_job_card',
      'delete_job_card',
      'run_diagnostics',
      'create_diagnostic_report',
      'request_parts',
      'approve_parts_issue',
      'update_job_status',
      'manage_technicians',
      'view_financial_reports',
      'manage_rbac_roles'
    ]
  },
  {
    key: 'BRANCH_MANAGER',
    name: 'Garage Branch Manager',
    description: 'Manages branch operations, assigns jobs to technicians, approves high-value parts, and overrides estimates.',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300',
    permissions: [
      'switch_location',
      'create_job_card',
      'edit_job_card',
      'run_diagnostics',
      'create_diagnostic_report',
      'request_parts',
      'approve_parts_issue',
      'update_job_status',
      'manage_technicians',
      'view_financial_reports'
    ]
  },
  {
    key: 'DIAGNOSTIC_TECH',
    name: 'Master Diagnostic Specialist',
    description: 'Executes ECU computer scans, interprets DTC fault codes, builds diagnostic reports & repair plans.',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300',
    permissions: [
      'create_job_card',
      'edit_job_card',
      'run_diagnostics',
      'create_diagnostic_report',
      'request_parts',
      'update_job_status'
    ]
  },
  {
    key: 'MECHANIC',
    name: 'Service Technician / Mechanic',
    description: 'Carries out physical repairs, updates work progress, and requests necessary inventory parts.',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300',
    permissions: [
      'edit_job_card',
      'request_parts',
      'update_job_status'
    ]
  },
  {
    key: 'PARTS_CLERK',
    name: 'Parts & Store Inventory Clerk',
    description: 'Receives job card parts requisitions, verifies store stock, and issues OEM/aftermarket parts to lifts.',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300',
    permissions: [
      'request_parts',
      'approve_parts_issue'
    ]
  },
  {
    key: 'RECEPTIONIST',
    name: 'Service Advisor / Front Desk',
    description: 'Handles customer intake, creates new job cards, issues final invoices, and records payments.',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-300',
    permissions: [
      'create_job_card',
      'edit_job_card',
      'update_job_status'
    ]
  }
];

export const MOCK_GARAGE_STAFF: GarageStaffUser[] = [
  {
    id: 'STAFF-001',
    name: 'Alexander Mercer',
    email: 'a.mercer@masuma.co.ke',
    phone: '+254 722 100 900',
    role: 'SUPER_ADMIN',
    assignedBranchId: 'ALL',
    specialty: 'Group Technical Director & Operations',
    expertiseLevel: 'Master Lead',
    skillsList: ['Operations Management', 'Multi-Outlet Quality Assurance'],
    shiftStatus: 'Clocked In',
    currentShift: 'Full Day (08:00 - 17:00)',
    dailyCapacityHours: 8,
    scheduledHours: 2,
    isActive: true,
    activeJobsCount: 0
  },
  {
    id: 'STAFF-002',
    name: 'David Ochieng',
    email: 'd.ochieng@masuma.co.ke',
    phone: '+254 733 222 111',
    role: 'BRANCH_MANAGER',
    assignedBranchId: 'GAR-NRB-01',
    specialty: 'Workshop Logistics & Customer Relations',
    expertiseLevel: 'Master Lead',
    skillsList: ['Bay Scheduling', 'Technical Diagnostics Oversight'],
    shiftStatus: 'Clocked In',
    currentShift: 'Full Day (08:00 - 17:00)',
    dailyCapacityHours: 8,
    scheduledHours: 4,
    isActive: true,
    activeJobsCount: 5
  },
  {
    id: 'STAFF-003',
    name: 'Eng. Eric Wanjala',
    email: 'e.wanjala@masuma.co.ke',
    phone: '+254 701 444 333',
    role: 'DIAGNOSTIC_TECH',
    assignedBranchId: 'GAR-NRB-01',
    specialty: 'ECU Programming, CAN-Bus & Fuel Systems',
    expertiseLevel: 'Master Lead',
    skillsList: ['ECU Computer Scanning', 'CAN-Bus Oscilloscope', 'Common Rail Fuel Injectors', 'Hybrid & EV Diagnostics'],
    certifications: ['Bosch Master Diagnostic Certified', 'Autel MaxiSys ECU Master'],
    shiftStatus: 'Clocked In',
    currentShift: 'Morning Shift (07:30 - 15:30)',
    dailyCapacityHours: 8,
    scheduledHours: 5.5,
    isActive: true,
    activeJobsCount: 3
  },
  {
    id: 'STAFF-004',
    name: 'James Kiprop',
    email: 'j.kiprop@masuma.co.ke',
    phone: '+254 712 555 666',
    role: 'MECHANIC',
    assignedBranchId: 'GAR-NRB-01',
    specialty: 'Brake Systems, Suspension & Engine Overhaul',
    expertiseLevel: 'Senior Specialist',
    skillsList: ['ABS & Hydraulics', 'Heavy Engine Overhaul', '4x4 Suspension Lift', 'Automatic Transmission'],
    certifications: ['ASE Master Automobile Tech', 'Masuma Braking Specialist'],
    shiftStatus: 'Clocked In',
    currentShift: 'Morning Shift (07:30 - 15:30)',
    dailyCapacityHours: 8,
    scheduledHours: 6.0,
    isActive: true,
    activeJobsCount: 2
  },
  {
    id: 'STAFF-005',
    name: 'Grace Mutua',
    email: 'g.mutua@masuma.co.ke',
    phone: '+254 788 777 888',
    role: 'PARTS_CLERK',
    assignedBranchId: 'GAR-NRB-01',
    specialty: 'Automotive Spare Parts & Warehousing',
    expertiseLevel: 'Mid Technician',
    skillsList: ['Store Inventory', 'OEM Parts Matching'],
    shiftStatus: 'Clocked In',
    currentShift: 'Full Day (08:00 - 17:00)',
    dailyCapacityHours: 8,
    scheduledHours: 3,
    isActive: true,
    activeJobsCount: 0
  },
  {
    id: 'STAFF-006',
    name: 'Sarah Nduta',
    email: 's.nduta@masuma.co.ke',
    phone: '+254 799 111 222',
    role: 'RECEPTIONIST',
    assignedBranchId: 'GAR-NRB-01',
    specialty: 'Service Scheduling & Customer Care',
    expertiseLevel: 'Mid Technician',
    skillsList: ['Front Desk Intake', 'Job Card Billing'],
    shiftStatus: 'Clocked In',
    currentShift: 'Full Day (08:00 - 17:00)',
    dailyCapacityHours: 8,
    scheduledHours: 2,
    isActive: true,
    activeJobsCount: 0
  },
  {
    id: 'STAFF-007',
    name: 'Hassan Omar',
    email: 'h.omar@masuma.co.ke',
    phone: '+254 715 333 444',
    role: 'MECHANIC',
    assignedBranchId: 'GAR-NRB-01',
    specialty: 'Auto Air Conditioning & Electrical Wiring',
    expertiseLevel: 'Senior Specialist',
    skillsList: ['HVAC Refrigerant Flush', 'Alternators & Starters', 'Dashboard Wiring Harness'],
    certifications: ['Denso Climate Control Certified'],
    shiftStatus: 'On Duty',
    currentShift: 'Afternoon Shift (11:30 - 19:30)',
    dailyCapacityHours: 8,
    scheduledHours: 4.0,
    isActive: true,
    activeJobsCount: 1
  },
  {
    id: 'STAFF-008',
    name: 'Kelvin Mwangi',
    email: 'k.mwangi@masuma.co.ke',
    phone: '+254 720 999 000',
    role: 'MECHANIC',
    assignedBranchId: 'GAR-NRB-01',
    specialty: 'Routine Oil Service, Filters & Wheel Alignment',
    expertiseLevel: 'Junior Apprentice',
    skillsList: ['Fluid Replacement', 'Brake Pad Replacement', 'Laser Wheel Alignment'],
    shiftStatus: 'Clocked In',
    currentShift: 'Morning Shift (07:30 - 15:30)',
    dailyCapacityHours: 8,
    scheduledHours: 3.5,
    isActive: true,
    activeJobsCount: 1
  }
];

export const MOCK_MECHANIC_SHIFTS = [
  {
    id: 'SHIFT-001',
    staffId: 'STAFF-003',
    staffName: 'Eng. Eric Wanjala',
    dayOfWeek: 'Today',
    shiftType: 'Morning Shift (07:30 - 15:30)',
    status: 'Clocked In',
    assignedBay: 'Bay 01 (Computerized Diagnostic Bay)',
    maxDailyHoursCapacity: 8
  },
  {
    id: 'SHIFT-002',
    staffId: 'STAFF-004',
    staffName: 'James Kiprop',
    dayOfWeek: 'Today',
    shiftType: 'Morning Shift (07:30 - 15:30)',
    status: 'Clocked In',
    assignedBay: 'Bay 02 (2-Post Hydraulic Lift)',
    maxDailyHoursCapacity: 8
  },
  {
    id: 'SHIFT-003',
    staffId: 'STAFF-007',
    staffName: 'Hassan Omar',
    dayOfWeek: 'Today',
    shiftType: 'Afternoon Shift (11:30 - 19:30)',
    status: 'On Duty',
    assignedBay: 'Bay 03 (Heavy 4-Post Lift)',
    maxDailyHoursCapacity: 8
  },
  {
    id: 'SHIFT-004',
    staffId: 'STAFF-008',
    staffName: 'Kelvin Mwangi',
    dayOfWeek: 'Today',
    shiftType: 'Morning Shift (07:30 - 15:30)',
    status: 'Clocked In',
    assignedBay: 'Bay 04 (Service & Alignment Bay)',
    maxDailyHoursCapacity: 8
  }
];

export const MOCK_MECHANIC_TASKS = [
  {
    id: 'TASK-101',
    jobCardId: 'JC-NRB-2026-104',
    vehiclePlate: 'KDG 789A',
    vehicleModel: 'Toyota Hilux 2022',
    taskTitle: 'Computerized ECU Scan & ABS Sensor Calibration',
    requiredSpecialty: 'ECU Programming, CAN-Bus & Fuel Systems',
    requiredSkillLevel: 'Master Lead',
    assignedStaffId: 'STAFF-003',
    assignedStaffName: 'Eng. Eric Wanjala',
    scheduledTimeWindow: '08:30 AM - 11:00 AM',
    estimatedHours: 2.5,
    priority: 'Urgent',
    status: 'In Progress',
    notes: 'P0300 Misfire code detected. Test injector signals on CAN bus.'
  },
  {
    id: 'TASK-102',
    jobCardId: 'JC-NRB-2026-104',
    vehiclePlate: 'KDG 789A',
    vehicleModel: 'Toyota Hilux 2022',
    taskTitle: 'Front Brake Rotor Turning & Masuma Ceramic Pad Install',
    requiredSpecialty: 'Brake Systems, Suspension & Engine Overhaul',
    requiredSkillLevel: 'Senior Specialist',
    assignedStaffId: 'STAFF-004',
    assignedStaffName: 'James Kiprop',
    scheduledTimeWindow: '11:15 AM - 01:45 PM',
    estimatedHours: 2.5,
    priority: 'High',
    status: 'Scheduled',
    notes: 'Parts requisition approved by Grace Mutua.'
  },
  {
    id: 'TASK-103',
    jobCardId: 'JC-MSA-2026-202',
    vehiclePlate: 'KCU 456B',
    vehicleModel: 'Isuzu D-Max 2021',
    taskTitle: 'Dual AC Compressor Flush & Gas Re-charge',
    requiredSpecialty: 'Auto Air Conditioning & Electrical Wiring',
    requiredSkillLevel: 'Senior Specialist',
    assignedStaffId: 'STAFF-007',
    assignedStaffName: 'Hassan Omar',
    scheduledTimeWindow: '01:00 PM - 04:00 PM',
    estimatedHours: 3.0,
    priority: 'Normal',
    status: 'Scheduled',
    notes: 'Check high-pressure valve seals before vacuum testing.'
  },
  {
    id: 'TASK-104',
    jobCardId: 'JC-NKR-2026-301',
    vehiclePlate: 'KBY 123C',
    vehicleModel: 'Subaru Forester 2019',
    taskTitle: 'Synthetic Engine Oil Change & 30-Point Inspection',
    requiredSpecialty: 'Routine Oil Service, Filters & Wheel Alignment',
    requiredSkillLevel: 'Junior Apprentice',
    assignedStaffId: 'STAFF-008',
    assignedStaffName: 'Kelvin Mwangi',
    scheduledTimeWindow: '09:00 AM - 10:30 AM',
    estimatedHours: 1.5,
    priority: 'Routine',
    status: 'Completed',
    notes: 'Replaced air filter and cabin pollen filter.'
  }
];

export const DTC_LIBRARY: DiagnosticErrorCode[] = [
  {
    code: 'P0300',
    system: 'Engine',
    title: 'Random/Multiple Cylinder Misfire Detected',
    severity: 'Critical',
    description: 'Engine control module (ECM) detected misfiring events across multiple engine cylinders, causing rough idling, power drop, and unburnt fuel in exhaust stream.',
    possibleCauses: ['Fouled or worn spark plugs', 'Faulty ignition coils', 'Low fuel pressure / clogged injectors', 'Vacuum leaks around intake manifold'],
    recommendedFix: 'Inspect and replace spark plugs, test ignition coil resistances, clean fuel injectors, check fuel line pressure.',
    estimatedLaborHours: 1.5
  },
  {
    code: 'P0171',
    system: 'Engine',
    title: 'System Too Lean (Bank 1)',
    severity: 'Major',
    description: 'Air-to-fuel ratio is leaner than optimal specification. ECM detected excessive oxygen in the exhaust gas stream.',
    possibleCauses: ['Dirty Mass Air Flow (MAF) sensor', 'Vacuum hose tear', 'Weak fuel pump or clogged oil/fuel filter'],
    recommendedFix: 'Clean MAF sensor with electrical cleaner, inspect intake hoses, verify fuel pump flow rate.',
    estimatedLaborHours: 1.0
  },
  {
    code: 'C0035',
    system: 'ABS',
    title: 'Left Front Wheel Speed Sensor Circuit Malfunction',
    severity: 'Major',
    description: 'Anti-lock Braking System (ABS) module lost pulse feedback signal from left front speed sensor assembly.',
    possibleCauses: ['Damaged sensor harness or connector corrosion', 'Debris/metal filings on magnetic reluctor ring', 'Failed ABS speed sensor probe'],
    recommendedFix: 'Clean reluctor ring, test sensor resistance with multimeter, replace front wheel speed sensor if shorted.',
    estimatedLaborHours: 1.0
  },
  {
    code: 'U0100',
    system: 'Electrical',
    title: 'Lost Communication With ECM/PCM "A"',
    severity: 'Critical',
    description: 'High-speed CAN-Bus communication link between Transmission Control Module / Instrument Cluster and Engine Control Module timed out.',
    possibleCauses: ['Corroded ground wire strap at chassis', 'Blown main ECM fuse', 'Corroded wiring harness socket pin'],
    recommendedFix: 'Perform CAN-Bus resistance check (60 ohms across CAN-H and CAN-L), inspect ECM power relays and earth points.',
    estimatedLaborHours: 2.5
  },
  {
    code: 'B0001',
    system: 'Airbag',
    title: 'Driver Frontal Stage 1 Deployment Control Subfault',
    severity: 'Critical',
    description: 'Supplemental Restraint System (SRS) control unit detected open circuit resistance in driver steering wheel airbag clock spring.',
    possibleCauses: ['Worn clock spring ribbon cable inside steering column', 'Loose yellow SRS safety connector under dash'],
    recommendedFix: 'Replace steering column clock spring assembly, reset SRS fault memory.',
    estimatedLaborHours: 1.5
  },
  {
    code: 'P0420',
    system: 'Engine',
    title: 'Catalyst System Efficiency Below Threshold (Bank 1)',
    severity: 'Moderate',
    description: 'Downstream oxygen sensor signal fluctuates excessively, indicating reduced catalytic converter oxygen storage capability.',
    possibleCauses: ['Exhaust leak upstream of converter', 'Degraded downstream O2 sensor', 'Damaged catalytic converter substrate'],
    recommendedFix: 'Inspect exhaust manifold joints for soot leaks, check O2 sensor response waveform, replace catalytic unit if deteriorated.',
    estimatedLaborHours: 2.0
  },
  {
    code: 'P0700',
    system: 'Transmission',
    title: 'Transmission Control System (MIL Request)',
    severity: 'Critical',
    description: 'Automatic Transmission Control Unit (TCU) detected internal solenoid pressure slippage and commanded Engine ECU check lamp on.',
    possibleCauses: ['Low or burnt transmission fluid', 'Faulty shift solenoid valve B', 'Worn transmission clutch pack'],
    recommendedFix: 'Perform automatic transmission fluid level check, flush torque converter fluid, test shift solenoid resistance.',
    estimatedLaborHours: 3.0
  },
  {
    code: 'C0245',
    system: 'ABS',
    title: 'Wheel Speed Sensor Frequency Malfunction',
    severity: 'Major',
    description: 'ABS ECU detected erratic signal pulse frequency from speed sensor during high-speed travel.',
    possibleCauses: ['Cracked reluctor tone ring', 'Improper sensor air gap'],
    recommendedFix: 'Inspect tone ring teeth, re-seat sensor probe to correct air gap specification.',
    estimatedLaborHours: 1.2
  }
];

export const INITIAL_JOB_CARDS: JobCard[] = [
  {
    id: 'JC-NRB-2026-104',
    branchId: 'GAR-NRB-01',
    branchName: 'Nairobi Central Flagship Auto Care',
    vehicle: {
      plateNumber: 'KDG 789A',
      vin: 'JTD78239019283741',
      make: 'Toyota',
      model: 'Hilux Double Cab D-4D',
      year: 2022,
      engineType: '2.8L 1GD-FTV Turbo Diesel',
      mileageKm: 68420,
      color: 'Pearl White',
      ownerName: 'John Doe',
      ownerPhone: '0712345678',
      ownerEmail: 'john@jdmotors.co.ke'
    },
    status: 'In Progress',
    assignedTechnicianId: 'STAFF-004',
    assignedTechnicianName: 'James Kiprop',
    assignedLiftBay: 'Bay 03 (Heavy Hydraulic Lift)',
    checkInDate: '2026-07-26 09:30 AM',
    estimatedCompletion: '2026-07-27 04:00 PM',
    customerComplaints: [
      'Engine knocking during cold start & check engine light lit',
      'Spongy brake pedal pressure when slowing down from 80km/h',
      'Air conditioning blowing warm air'
    ],
    intakeChecklist: {
      fuelLevel: '3/4 Tank',
      tireTreadDepthMm: 5.2,
      spareTirePresent: true,
      jackAndToolsPresent: true,
      bodyScratchesNotes: 'Minor scratch on left rear fender bumper corner.',
      personalItemsNote: 'Sunglasses in center glove compartment.',
      intakeInspectorName: 'Sarah Nduta'
    },
    diagnosticReport: {
      id: 'DIAG-2026-8801',
      scanDate: '2026-07-26 10:15 AM',
      scannerDevice: 'Masuma ECU Pro-Diag X900 Series',
      protocolUsed: 'ISO 15765-4 (CAN 29bit 500Kbps)',
      overallHealthScore: 68,
      faultCodes: [DTC_LIBRARY[0], DTC_LIBRARY[1]],
      telemetrySnapshot: {
        rpm: 850,
        coolantTempC: 92,
        batteryVolts: 13.8,
        o2SensorVolts: 0.42,
        fuelTrimPct: +14.2,
        oilPressureBar: 3.2,
        intakePressureKpa: 101,
        massAirFlowGps: 4.8
      },
      freezeFrameData: {
        'Engine Load': '34.2%',
        'Vehicle Speed': '0 km/h',
        'Fuel Pressure': '380 kPa',
        'Ambient Temp': '24 °C'
      },
      technicianNotes: 'ECU logs indicate intermittent misfiring on Cylinder 2 & 4. Spark plug electrode gap exceeds limit. Brake fluid water content tested at 4.2% (requires flush).',
      technicianName: 'Eng. Eric Wanjala',
      recommendedParts: [
        { productId: 3, name: 'Iridium Spark Plug (Denso)', sku: 'MS-SP-003', qty: 4, approxPrice: 2500 },
        { productId: 1, name: 'Front Brake Pads (Masuma)', sku: 'MS-BP-001', qty: 1, approxPrice: 5500 },
        { productId: 2, name: 'Engine Oil Filter (Masuma)', sku: 'MS-OF-002', qty: 1, approxPrice: 1200 }
      ],
      status: 'Completed'
    },
    parts: [
      { id: 'PT-101', productId: 3, partName: 'Iridium Spark Plug', sku: 'MS-SP-003', quantity: 4, unitPrice: 2500, status: 'Issued', requestedByRole: 'DIAGNOSTIC_TECH' },
      { id: 'PT-102', productId: 1, partName: 'Front Brake Pads', sku: 'MS-BP-001', quantity: 1, unitPrice: 5500, status: 'Issued', requestedByRole: 'MECHANIC' },
      { id: 'PT-103', productId: 2, partName: 'Engine Oil Filter', sku: 'MS-OF-002', quantity: 1, unitPrice: 1200, status: 'Requested', requestedByRole: 'MECHANIC' }
    ],
    labor: [
      { id: 'LB-201', taskDescription: 'Full Computerized Diagnostic Scan & Live Data Log', hours: 1.0, ratePerHour: 3500, technicianName: 'Eng. Eric Wanjala' },
      { id: 'LB-202', taskDescription: 'Spark Plugs Replacement & Ignition System Cleaning', hours: 1.5, ratePerHour: 2500, technicianName: 'James Kiprop' },
      { id: 'LB-203', taskDescription: 'Front Brake Pad Replacement & Brake System Bleed', hours: 2.0, ratePerHour: 2500, technicianName: 'James Kiprop' }
    ],
    notes: 'Customer requested synthetic 5W-30 motor oil change alongside spark plug servicing.',
    subtotalAmount: 28900,
    taxRatePct: 16,
    taxAmount: 4624,
    discountAmount: 1000,
    totalEstimate: 32524,
    paymentStatus: 'Deposit Paid',
    customerApprovalStatus: 'Approved',
    gatePassIssued: false,
    historyLogs: [
      { id: 'LOG-01', timestamp: '2026-07-26 09:30 AM', authorName: 'Sarah Nduta', actionTitle: 'Vehicle Checked In', details: 'Opened job card JC-NRB-2026-104 and assigned to Bay 03.' },
      { id: 'LOG-02', timestamp: '2026-07-26 10:20 AM', authorName: 'Eng. Eric Wanjala', actionTitle: 'Diagnostic Scan Completed', details: 'ECU scan detected P0300 misfire and P0171 lean codes.' },
      { id: 'LOG-03', timestamp: '2026-07-26 11:00 AM', authorName: 'David Ochieng', actionTitle: 'Customer Approved Work', details: 'Owner John Doe approved parts and labor estimate of KES 32,524.' }
    ]
  },
  {
    id: 'JC-MSA-2026-088',
    branchId: 'GAR-MSA-02',
    branchName: 'MOMBASA COASTAL MOTORS & DIAGNOSTICS',
    vehicle: {
      plateNumber: 'KCN 412B',
      vin: 'MNK48192039182390',
      make: 'Isuzu',
      model: 'D-Max 3.0 4x4',
      year: 2021,
      engineType: '3.0L 4JJ1-TCX Diesel',
      mileageKm: 112000,
      color: 'Silver Metallic',
      ownerName: 'AutoFix Solutions Ltd',
      ownerPhone: '0722000111',
      ownerEmail: 'procurement@autofix.co.ke'
    },
    status: 'Diagnostic Scan',
    assignedTechnicianId: 'STAFF-003',
    assignedTechnicianName: 'Eng. Eric Wanjala',
    assignedLiftBay: 'Bay 01 (Diagnostic Bay)',
    checkInDate: '2026-07-27 08:15 AM',
    estimatedCompletion: '2026-07-28 02:00 PM',
    customerComplaints: [
      'ABS light intermittently turns on during sharp turns',
      'Steering wheel shudder under hard braking'
    ],
    intakeChecklist: {
      fuelLevel: '1/2 Tank',
      tireTreadDepthMm: 4.8,
      spareTirePresent: true,
      jackAndToolsPresent: true,
      bodyScratchesNotes: 'Commercial fleet unit — multiple minor scuffs on tailgate.',
      personalItemsNote: 'None.',
      intakeInspectorName: 'Amina Hassan'
    },
    diagnosticReport: {
      id: 'DIAG-2026-8802',
      scanDate: '2026-07-27 08:45 AM',
      scannerDevice: 'Masuma ECU Pro-Diag X900 Series',
      protocolUsed: 'ISO 15765-4 (CAN 11bit 500Kbps)',
      overallHealthScore: 82,
      faultCodes: [DTC_LIBRARY[2]],
      telemetrySnapshot: {
        rpm: 720,
        coolantTempC: 88,
        batteryVolts: 14.1,
        o2SensorVolts: 0.50,
        fuelTrimPct: +2.1,
        oilPressureBar: 3.8,
        intakePressureKpa: 98
      },
      technicianNotes: 'C0035 error stored in ABS module. Sensor connector contaminated with saltwater/coastal sand grime.',
      technicianName: 'Eng. Eric Wanjala',
      recommendedParts: [
        { name: 'Front Left Wheel Speed Sensor', qty: 1, approxPrice: 4200 }
      ],
      status: 'Pending Repairs'
    },
    parts: [
      { id: 'PT-104', partName: 'Front Left ABS Wheel Speed Sensor', sku: 'ABS-ISZ-001', quantity: 1, unitPrice: 4200, status: 'Requested', requestedByRole: 'DIAGNOSTIC_TECH' }
    ],
    labor: [
      { id: 'LB-204', taskDescription: 'ABS Module ECU Interrogation & Sensor Resistance Test', hours: 1.0, ratePerHour: 3500, technicianName: 'Eng. Eric Wanjala' }
    ],
    notes: 'Fleet vehicle on credit account - requires LPO confirmation before part installation.',
    subtotalAmount: 7700,
    taxRatePct: 16,
    taxAmount: 1232,
    discountAmount: 0,
    totalEstimate: 8932,
    paymentStatus: 'Unpaid',
    customerApprovalStatus: 'Pending Approval',
    gatePassIssued: false,
    historyLogs: [
      { id: 'LOG-04', timestamp: '2026-07-27 08:15 AM', authorName: 'Amina Hassan', actionTitle: 'Vehicle Checked In', details: 'Fleet intake recorded for Isuzu KCN 412B.' }
    ]
  },
  {
    id: 'JC-NRB-2026-105',
    branchId: 'GAR-NRB-01',
    branchName: 'Nairobi Central Flagship Auto Care',
    vehicle: {
      plateNumber: 'KCL 990Z',
      vin: 'WBA12390192837482',
      make: 'Subaru',
      model: 'Outback 2.5i Eyesight',
      year: 2020,
      engineType: '2.5L FB25 Boxer 4',
      mileageKm: 85300,
      color: 'Crystal Black',
      ownerName: 'Jane Smith',
      ownerPhone: '0787654321',
      ownerEmail: 'jane@jsgarage.co.ke'
    },
    status: 'Completed',
    assignedTechnicianId: 'STAFF-004',
    assignedTechnicianName: 'James Kiprop',
    assignedLiftBay: 'Bay 05 (Alignment & Wash Bay)',
    checkInDate: '2026-07-25 11:00 AM',
    estimatedCompletion: '2026-07-27 12:00 PM',
    customerComplaints: [
      'Squeaking noise from rear suspension on speed bumps',
      'Replace front wiper blades'
    ],
    intakeChecklist: {
      fuelLevel: 'Full Tank',
      tireTreadDepthMm: 6.0,
      spareTirePresent: true,
      jackAndToolsPresent: true,
      bodyScratchesNotes: 'Vehicle in pristine aesthetic condition.',
      personalItemsNote: 'Child booster seat on rear right seat.',
      intakeInspectorName: 'Sarah Nduta'
    },
    parts: [
      { id: 'PT-105', productId: 6, partName: 'Shock Absorber (KYB)', sku: 'MS-SB-006', quantity: 2, unitPrice: 8500, status: 'Installed', requestedByRole: 'MECHANIC' },
      { id: 'PT-106', productId: 5, partName: 'Wiper Blade Set (Bosch)', sku: 'MS-WB-005', quantity: 1, unitPrice: 3000, status: 'Installed', requestedByRole: 'MECHANIC' }
    ],
    labor: [
      { id: 'LB-205', taskDescription: 'Rear Strut Assembly Removal & New KYB Shock Installation', hours: 2.5, ratePerHour: 2500, technicianName: 'James Kiprop' },
      { id: 'LB-206', taskDescription: 'Laser Wheel Alignment & Suspension Bushing Check', hours: 1.0, ratePerHour: 3000, technicianName: 'James Kiprop' }
    ],
    notes: 'Completed post-repair test drive on rough road. Noise completely eliminated.',
    subtotalAmount: 29250,
    taxRatePct: 16,
    taxAmount: 4680,
    discountAmount: 1500,
    totalEstimate: 32430,
    paymentStatus: 'Fully Paid',
    customerApprovalStatus: 'Approved',
    gatePassIssued: true,
    gatePassCode: 'GP-2026-9901',
    historyLogs: [
      { id: 'LOG-05', timestamp: '2026-07-25 11:00 AM', authorName: 'Sarah Nduta', actionTitle: 'Job Card Created', details: 'Booked Subaru Outback for suspension work.' },
      { id: 'LOG-06', timestamp: '2026-07-26 03:00 PM', authorName: 'James Kiprop', actionTitle: 'Parts Installed & Tested', details: 'Replaced rear KYB shock absorbers and completed laser alignment.' },
      { id: 'LOG-07', timestamp: '2026-07-27 10:00 AM', authorName: 'David Ochieng', actionTitle: 'Invoice Paid & Gate Pass Issued', details: 'Full payment received. Issued Gate Pass GP-2026-9901.' }
    ]
  },
  {
    id: 'JC-NRB-2026-102',
    branchId: 'GAR-NRB-01',
    branchName: 'Nairobi Central Flagship Auto Care',
    vehicle: {
      plateNumber: 'KDF 432P',
      vin: 'JTD18290391823746',
      make: 'Toyota',
      model: 'Prado VX 3.0D',
      year: 2021,
      engineType: '3.0L 1KD-FTV Turbo Diesel',
      mileageKm: 98400,
      color: 'Pearl White',
      ownerName: 'John Doe',
      ownerPhone: '0712345678',
      ownerEmail: 'john@jdmotors.co.ke'
    },
    status: 'Invoiced',
    assignedTechnicianId: 'STAFF-004',
    assignedTechnicianName: 'James Kiprop',
    assignedLiftBay: 'Bay 02 (2-Post Hydraulic Lift)',
    checkInDate: '2026-07-22 08:30 AM',
    estimatedCompletion: '2026-07-23 05:00 PM',
    customerComplaints: [
      'Full 100,000 km Major Service Inspection',
      'Replace front and rear brake pads and air filters'
    ],
    parts: [
      { id: 'PT-107', productId: 1, partName: 'Front Brake Pads', sku: 'MS-BP-001', quantity: 1, unitPrice: 5500, status: 'Installed', requestedByRole: 'MECHANIC' },
      { id: 'PT-108', productId: 2, partName: 'Engine Oil Filter', sku: 'MS-OF-002', quantity: 1, unitPrice: 1200, status: 'Installed', requestedByRole: 'MECHANIC' },
      { id: 'PT-109', productId: 4, partName: 'Air Filter', sku: 'MS-AF-004', quantity: 1, unitPrice: 1800, status: 'Installed', requestedByRole: 'MECHANIC' }
    ],
    labor: [
      { id: 'LB-207', taskDescription: 'Major 100K km Comprehensive Maintenance & Fluid Service', hours: 3.5, ratePerHour: 2800, technicianName: 'James Kiprop' },
      { id: 'LB-208', taskDescription: 'Brake Pad Replacement & Rotor Turning', hours: 2.0, ratePerHour: 2500, technicianName: 'James Kiprop' }
    ],
    notes: 'Major service completed smoothly. All lubricants refilled to spec.',
    subtotalAmount: 23300,
    taxRatePct: 16,
    taxAmount: 3728,
    discountAmount: 1000,
    totalEstimate: 26028,
    paymentStatus: 'Fully Paid',
    customerApprovalStatus: 'Approved',
    gatePassIssued: true,
    gatePassCode: 'GP-2026-8812',
    historyLogs: [
      { id: 'LOG-08', timestamp: '2026-07-22 08:30 AM', authorName: 'Sarah Nduta', actionTitle: 'Checked In', details: 'Opened 100K major service order.' },
      { id: 'LOG-09', timestamp: '2026-07-23 04:30 PM', authorName: 'David Ochieng', actionTitle: 'Invoiced & Gate Pass Issued', details: 'Payment cleared. Issued Gate Pass GP-2026-8812.' }
    ]
  },
  {
    id: 'JC-NRB-2026-098',
    branchId: 'GAR-NRB-01',
    branchName: 'Nairobi Central Flagship Auto Care',
    vehicle: {
      plateNumber: 'KDA 881L',
      vin: 'JTD99283718293841',
      make: 'Toyota',
      model: 'Land Cruiser V8 200 Series',
      year: 2022,
      engineType: '4.5L V8 Twin Turbo Diesel 1VD-FTV',
      mileageKm: 54100,
      color: 'Midnight Black',
      ownerName: 'Executive Fleet Transporters',
      ownerPhone: '0722000111',
      ownerEmail: 'fleet@exec.co.ke'
    },
    status: 'Invoiced',
    assignedTechnicianId: 'STAFF-003',
    assignedTechnicianName: 'Eng. Eric Wanjala',
    assignedLiftBay: 'Bay 03 (Heavy Hydraulic Lift)',
    checkInDate: '2026-07-18 10:00 AM',
    estimatedCompletion: '2026-07-19 03:30 PM',
    customerComplaints: [
      'CAN-Bus communication fault intermittent warning',
      'AC gas flush and climate control overhaul'
    ],
    parts: [
      { id: 'PT-110', productId: 9, partName: 'Cabin Air Filter', sku: 'MS-CF-009', quantity: 1, unitPrice: 1500, status: 'Installed', requestedByRole: 'DIAGNOSTIC_TECH' }
    ],
    labor: [
      { id: 'LB-209', taskDescription: 'High-Speed CAN-Bus Oscilloscope Analysis & Module Ground Strap Repair', hours: 3.0, ratePerHour: 4000, technicianName: 'Eng. Eric Wanjala' },
      { id: 'LB-210', taskDescription: 'Dual Climate Control AC Refrigerant Flush & Pressure Testing', hours: 2.0, ratePerHour: 3000, technicianName: 'Hassan Omar' }
    ],
    notes: 'Fixed earth strap connector on main chassis frame.',
    subtotalAmount: 19500,
    taxRatePct: 16,
    taxAmount: 3120,
    discountAmount: 500,
    totalEstimate: 22120,
    paymentStatus: 'Fully Paid',
    customerApprovalStatus: 'Approved',
    gatePassIssued: true,
    gatePassCode: 'GP-2026-7734',
    historyLogs: [
      { id: 'LOG-10', timestamp: '2026-07-18 10:00 AM', authorName: 'Amina Hassan', actionTitle: 'Job Card Opened', details: 'Executive Land Cruiser V8 CAN-Bus inspection.' },
      { id: 'LOG-11', timestamp: '2026-07-19 03:30 PM', authorName: 'David Ochieng', actionTitle: 'Billed & Released', details: 'Gate Pass GP-2026-7734 issued.' }
    ]
  },
  {
    id: 'JC-MSA-2026-074',
    branchId: 'GAR-MSA-02',
    branchName: 'MOMBASA COASTAL MOTORS & DIAGNOSTICS',
    vehicle: {
      plateNumber: 'KCM 550A',
      vin: 'MNK78291029384756',
      make: 'Isuzu',
      model: 'NQR 9.2 Ton Lorry',
      year: 2020,
      engineType: '5.2L 4HK1-TCS Heavy Diesel',
      mileageKm: 142000,
      color: 'White & Blue',
      ownerName: 'Coast Logistics Enterprise',
      ownerPhone: '0733444555',
      ownerEmail: 'info@coastlogistics.co.ke'
    },
    status: 'Completed',
    assignedTechnicianId: 'STAFF-004',
    assignedTechnicianName: 'James Kiprop',
    assignedLiftBay: 'Heavy Commercial Bay 01',
    checkInDate: '2026-07-14 09:00 AM',
    estimatedCompletion: '2026-07-16 11:00 AM',
    customerComplaints: [
      'Heavy clutch pedal slipping on incline loaded runs',
      'Replace tie rod ends & front wheel bearings'
    ],
    parts: [
      { id: 'PT-111', productId: 8, partName: 'Tie Rod End (Masuma)', sku: 'MS-TP-008', quantity: 2, unitPrice: 4200, status: 'Installed', requestedByRole: 'MECHANIC' }
    ],
    labor: [
      { id: 'LB-211', taskDescription: 'Heavy Transmission Removal & Clutch Kit Overhaul', hours: 6.0, ratePerHour: 3500, technicianName: 'James Kiprop' },
      { id: 'LB-212', taskDescription: 'Steering Linkage Alignment & Tie Rod Replacement', hours: 2.0, ratePerHour: 2800, technicianName: 'James Kiprop' }
    ],
    notes: 'Heavy-duty clutch plate installed and tested with load.',
    subtotalAmount: 35000,
    taxRatePct: 16,
    taxAmount: 5600,
    discountAmount: 2000,
    totalEstimate: 38600,
    paymentStatus: 'Fully Paid',
    customerApprovalStatus: 'Approved',
    gatePassIssued: true,
    gatePassCode: 'GP-2026-6621',
    historyLogs: [
      { id: 'LOG-12', timestamp: '2026-07-14 09:00 AM', authorName: 'Amina Hassan', actionTitle: 'Heavy Commercial Intake', details: 'Logged Isuzu NQR for clutch overhaul.' }
    ]
  },
  {
    id: 'JC-NKR-2026-052',
    branchId: 'GAR-NKR-03',
    branchName: 'NAKURU RIFT VALLEY EXPRESS HUB',
    vehicle: {
      plateNumber: 'KDJ 912X',
      vin: 'JL192837482910293',
      make: 'Mitsubishi',
      model: 'Fuso Canter FE83',
      year: 2021,
      engineType: '3.0L 4P10 Turbo Diesel',
      mileageKm: 110500,
      color: 'Yellow',
      ownerName: 'Rift Valley Agricultural Distributors',
      ownerPhone: '0721888999',
      ownerEmail: 'agri@riftvalley.co.ke'
    },
    status: 'Invoiced',
    assignedTechnicianId: 'STAFF-008',
    assignedTechnicianName: 'Kelvin Mwangi',
    assignedLiftBay: 'Bay 04 (Service & Alignment Bay)',
    checkInDate: '2026-06-28 08:00 AM',
    estimatedCompletion: '2026-06-29 04:00 PM',
    customerComplaints: [
      'Routine 110K km maintenance',
      'Replace battery terminals and inspect power steering lines'
    ],
    parts: [
      { id: 'PT-112', productId: 12, partName: 'Battery Terminal', sku: 'MS-BT-012', quantity: 2, unitPrice: 500, status: 'Installed', requestedByRole: 'MECHANIC' },
      { id: 'PT-113', productId: 11, partName: 'Power Steering Fluid', sku: 'MS-PS-011', quantity: 2, unitPrice: 1300, status: 'Installed', requestedByRole: 'MECHANIC' }
    ],
    labor: [
      { id: 'LB-213', taskDescription: 'Routine Oil & Filter Service, Power Steering Flush', hours: 2.0, ratePerHour: 2200, technicianName: 'Kelvin Mwangi' }
    ],
    notes: 'Power steering system flushed and refilled. Battery terminals replaced.',
    subtotalAmount: 8000,
    taxRatePct: 16,
    taxAmount: 1280,
    discountAmount: 0,
    totalEstimate: 9280,
    paymentStatus: 'Fully Paid',
    customerApprovalStatus: 'Approved',
    gatePassIssued: true,
    gatePassCode: 'GP-2026-5510',
    historyLogs: [
      { id: 'LOG-13', timestamp: '2026-06-28 08:00 AM', authorName: 'Sarah Nduta', actionTitle: 'Checked In', details: 'Nakuru branch service order opened.' }
    ]
  },
  {
    id: 'JC-NRB-2026-041',
    branchId: 'GAR-NRB-01',
    branchName: 'Nairobi Central Flagship Auto Care',
    vehicle: {
      plateNumber: 'KDB 104M',
      vin: 'JN129384710293847',
      make: 'Nissan',
      model: 'X-Trail 2.0 4WD',
      year: 2019,
      engineType: '2.0L MR20DD Petrol',
      mileageKm: 76200,
      color: 'Gunmetal Gray',
      ownerName: 'Jane Smith',
      ownerPhone: '0787654321',
      ownerEmail: 'jane@jsgarage.co.ke'
    },
    status: 'Completed',
    assignedTechnicianId: 'STAFF-007',
    assignedTechnicianName: 'Hassan Omar',
    assignedLiftBay: 'Bay 02 (2-Post Hydraulic Lift)',
    checkInDate: '2026-06-15 11:30 AM',
    estimatedCompletion: '2026-06-16 02:00 PM',
    customerComplaints: [
      'CVT Transmission fluid change request',
      'Spark plug inspection'
    ],
    parts: [
      { id: 'PT-114', productId: 3, partName: 'Iridium Spark Plug', sku: 'MS-SP-003', quantity: 4, unitPrice: 2500, status: 'Installed', requestedByRole: 'MECHANIC' }
    ],
    labor: [
      { id: 'LB-214', taskDescription: 'CVT Fluid Flush & Level Calibration', hours: 2.0, ratePerHour: 3000, technicianName: 'Hassan Omar' }
    ],
    notes: 'CVT fluid drained and renewed using Nissan NS-3 spec oil.',
    subtotalAmount: 16000,
    taxRatePct: 16,
    taxAmount: 2560,
    discountAmount: 500,
    totalEstimate: 18060,
    paymentStatus: 'Fully Paid',
    customerApprovalStatus: 'Approved',
    gatePassIssued: true,
    gatePassCode: 'GP-2026-4402',
    historyLogs: [
      { id: 'LOG-14', timestamp: '2026-06-15 11:30 AM', authorName: 'Sarah Nduta', actionTitle: 'Job Opened', details: 'X-Trail CVT service logged.' }
    ]
  }
];

export const INITIAL_NOTIFICATION_SETTINGS: NotificationSettings = {
  smsEnabled: true,
  emailEnabled: true,
  whatsappEnabled: true,
  autoTriggerOnStatusChange: true,
  smsGatewayProvider: 'Safaricom Bulk SMS API',
  senderHeader: 'MASUMA_AUTO',
  statusTemplates: {
    'Booked': {
      enabled: true,
      smsTemplate: 'Hello [Customer], your [Vehicle] ([Plate]) has been checked in at [Branch] under Job Card [ID]. Track your repair progress live with us.',
      emailSubject: '[Branch] Vehicle Intake Confirmation: [Plate] ([ID])',
      emailTemplate: 'Dear [Customer],\n\nYour vehicle [Vehicle] (Plate: [Plate]) was successfully checked in at [Branch].\n\nJob Card ID: [ID]\nAssigned Technician: [Tech]\nEstimated Completion: [Completion]\n\nThank you for choosing Masuma Auto Care!'
    },
    'Diagnostic Scan': {
      enabled: true,
      smsTemplate: 'Hello [Customer], electronic diagnostic scanning is now active on your [Vehicle] ([Plate]) at [Branch]. We will notify you once DTC report is ready.',
      emailSubject: '[Branch] Diagnostic ECU Scan Initiated: [Plate]',
      emailTemplate: 'Dear [Customer],\n\nOur certified diagnostic team has initiated ECU scanning for your [Vehicle] ([Plate]).\n\nJob Card ID: [ID]\nLead Diagnostic Specialist: [Tech]\n\nWe will update you with full recommendations shortly.'
    },
    'In Progress': {
      enabled: true,
      smsTemplate: 'Hello [Customer], repair and servicing work on your [Vehicle] ([Plate]) is now IN PROGRESS at [Branch]. Lead Technician: [Tech].',
      emailSubject: 'Work Order In Progress: [Vehicle] ([Plate])',
      emailTemplate: 'Dear [Customer],\n\nService operations for your [Vehicle] ([Plate]) have commenced at [Branch].\n\nJob Card ID: [ID]\nTechnician: [Tech]\nAssigned Station: [Bay]\n\nWe appreciate your trust in our service team!'
    },
    'Awaiting Parts': {
      enabled: true,
      smsTemplate: 'Hello [Customer], service on your [Vehicle] ([Plate]) is temporarily PAUSED awaiting genuine parts dispatch. We will resume as soon as items arrive.',
      emailSubject: 'Parts Requisition Status Update: [Plate] ([ID])',
      emailTemplate: 'Dear [Customer],\n\nWork on your [Vehicle] ([Plate]) at [Branch] is awaiting requisitioned spare parts from our central warehouse.\n\nJob Card ID: [ID]\nWe will notify you immediately once assembly resumes.'
    },
    'Quality Check': {
      enabled: true,
      smsTemplate: 'Hello [Customer], repairs on your [Vehicle] ([Plate]) are complete! It is currently undergoing final quality inspection and road test.',
      emailSubject: 'Quality Inspection Phase: [Vehicle] ([Plate])',
      emailTemplate: 'Dear [Customer],\n\nAll repair tasks for your [Vehicle] ([Plate]) have been completed by [Tech]. Our workshop manager is now conducting final quality inspection and road testing.'
    },
    'Completed': {
      enabled: true,
      smsTemplate: 'READY FOR PICKUP! Hello [Customer], your [Vehicle] ([Plate]) is ready at [Branch]. Total Invoice: KES [Amount]. Gate pass will be issued upon payment.',
      emailSubject: 'Vehicle Ready for Pickup: [Vehicle] ([Plate])',
      emailTemplate: 'Dear [Customer],\n\nGreat news! Servicing for your [Vehicle] ([Plate]) is fully completed and ready for collection at [Branch].\n\nJob Card ID: [ID]\nTotal Amount Payable: KES [Amount]\n\nPlease visit our service desk or pay via M-Pesa to generate your Gate Pass.'
    },
    'Invoiced': {
      enabled: true,
      smsTemplate: 'PAYMENT RECEIVED! Hello [Customer], thank you for settling invoice for [Vehicle] ([Plate]). Your Security Gate Pass code is [GatePass].',
      emailSubject: 'Invoice Payment Receipt & Security Gate Pass: [Plate]',
      emailTemplate: 'Dear [Customer],\n\nThank you for your payment of KES [Amount] for Job Card [ID] ([Vehicle] - [Plate]).\n\nYour official Security Gate Pass code is: [GatePass]. Please present this code to security officers at the gate upon vehicle exit.'
    }
  }
};

export const INITIAL_CUSTOMER_NOTIFICATIONS: CustomerNotification[] = [
  {
    id: 'NOTIF-2026-901',
    jobCardId: 'JC-NRB-2026-104',
    vehiclePlate: 'KDG 789A',
    customerName: 'Jane Smith',
    customerPhone: '0787654321',
    customerEmail: 'jane@jsgarage.co.ke',
    channel: 'SMS & EMAIL',
    triggerStatus: 'Completed',
    messageSubject: 'Vehicle Ready for Pickup: Subaru Outback (KDG 789A)',
    messageBody: 'READY FOR PICKUP! Hello Jane Smith, your Subaru Outback (KDG 789A) is ready at Nairobi Central Flagship Auto Care. Total Invoice: KES 32,430. Gate pass will be issued upon payment.',
    sentAt: '2026-07-27 10:00 AM',
    deliveryStatus: 'Delivered',
    isAutomated: true,
    branchName: 'Nairobi Central Flagship Auto Care'
  },
  {
    id: 'NOTIF-2026-902',
    jobCardId: 'JC-NRB-2026-104',
    vehiclePlate: 'KDG 789A',
    customerName: 'Jane Smith',
    customerPhone: '0787654321',
    customerEmail: 'jane@jsgarage.co.ke',
    channel: 'SMS',
    triggerStatus: 'In Progress',
    messageSubject: 'Work Order In Progress: Subaru Outback (KDG 789A)',
    messageBody: 'Hello Jane Smith, repair and servicing work on your Subaru Outback (KDG 789A) is now IN PROGRESS at Nairobi Central Flagship Auto Care. Lead Technician: James Kiprop.',
    sentAt: '2026-07-26 09:15 AM',
    deliveryStatus: 'Delivered',
    isAutomated: true,
    branchName: 'Nairobi Central Flagship Auto Care'
  },
  {
    id: 'NOTIF-2026-903',
    jobCardId: 'JC-NRB-2026-105',
    vehiclePlate: 'KCL 990Z',
    customerName: 'Peter Kamau',
    customerPhone: '0711223344',
    customerEmail: 'peter@kamau.co.ke',
    channel: 'SMS & EMAIL',
    triggerStatus: 'Diagnostic Scan',
    messageSubject: 'Nairobi Central Flagship Auto Care Diagnostic ECU Scan Initiated: KCL 990Z',
    messageBody: 'Hello Peter Kamau, electronic diagnostic scanning is now active on your Isuzu D-Max (KCL 990Z) at Nairobi Central Flagship Auto Care. We will notify you once DTC report is ready.',
    sentAt: '2026-07-27 09:30 AM',
    deliveryStatus: 'Delivered',
    isAutomated: true,
    branchName: 'Nairobi Central Flagship Auto Care'
  },
  {
    id: 'NOTIF-2026-904',
    jobCardId: 'JC-NRB-2026-102',
    vehiclePlate: 'KDF 432P',
    customerName: 'John Doe',
    customerPhone: '0712345678',
    customerEmail: 'john@jdmotors.co.ke',
    channel: 'SMS & EMAIL',
    triggerStatus: 'Invoiced',
    messageSubject: 'Invoice Payment Receipt & Security Gate Pass: KDF 432P',
    messageBody: 'PAYMENT RECEIVED! Hello John Doe, thank you for settling invoice for Toyota Prado VX 3.0D (KDF 432P). Your Security Gate Pass code is GP-2026-8812.',
    sentAt: '2026-07-23 04:30 PM',
    deliveryStatus: 'Delivered',
    isAutomated: true,
    branchName: 'Nairobi Central Flagship Auto Care'
  }
];

export const INITIAL_CUSTOMER_FEEDBACK: CustomerFeedback[] = [
  {
    id: 'CSAT-2026-001',
    jobCardId: 'JC-NRB-2026-101',
    customerName: 'John Doe',
    customerPhone: '0712345678',
    vehiclePlate: 'KDF 432P',
    vehicleMakeModel: 'Toyota Prado VX 3.0D',
    mechanicId: 'MECH-001',
    mechanicName: 'James Kiprop',
    advisorName: 'David Ochieng (Service Advisor)',
    branchId: 'GAR-NRB-01',
    branchName: 'Nairobi Central Flagship Auto Care',
    overallRating: 5,
    workQualityRating: 5,
    timelinessRating: 5,
    communicationRating: 5,
    recommendScore: 10,
    comment: 'Exceptional service! James Kiprop quickly diagnosed the braking vibration and replaced the rotors. Vehicle drives like brand new.',
    serviceTags: ['Great Work Quality', 'Fast Turnaround', 'Clean Vehicle', 'Honest Advice'],
    createdAt: '2026-07-24 10:15 AM'
  },
  {
    id: 'CSAT-2026-002',
    jobCardId: 'JC-NRB-2026-102',
    customerName: 'Jane Smith',
    customerPhone: '0787654321',
    vehiclePlate: 'KDG 789A',
    vehicleMakeModel: 'Subaru Outback 2.5i',
    mechanicId: 'MECH-001',
    mechanicName: 'James Kiprop',
    advisorName: 'David Ochieng (Service Advisor)',
    branchId: 'GAR-NRB-01',
    branchName: 'Nairobi Central Flagship Auto Care',
    overallRating: 5,
    workQualityRating: 5,
    timelinessRating: 4,
    communicationRating: 5,
    recommendScore: 9,
    comment: 'Very professional diagnostic report provided before doing any repairs. Kept me updated via SMS throughout the day.',
    serviceTags: ['Transparent Billing', 'Polite Staff', 'Great Work Quality'],
    createdAt: '2026-07-25 02:30 PM'
  },
  {
    id: 'CSAT-2026-003',
    jobCardId: 'JC-MSA-2026-001',
    customerName: 'Hassan Ali',
    customerPhone: '0733445566',
    vehiclePlate: 'KDB 123M',
    vehicleMakeModel: 'Nissan X-Trail 2.0',
    mechanicId: 'MECH-002',
    mechanicName: 'Brian Mutua',
    advisorName: 'Amina Hassan (Service Advisor)',
    branchId: 'GAR-MSA-02',
    branchName: 'MOMBASA COASTAL MOTORS & DIAGNOSTICS',
    overallRating: 4,
    workQualityRating: 5,
    timelinessRating: 4,
    communicationRating: 4,
    recommendScore: 8,
    comment: 'Solid AC repair work. Kept the car cool in Mombasa weather. Slight delay waiting for original condenser part.',
    serviceTags: ['Genuine Parts', 'Expert Diagnostics'],
    createdAt: '2026-07-26 11:45 AM'
  },
  {
    id: 'CSAT-2026-004',
    jobCardId: 'JC-NRB-2026-103',
    customerName: 'Mary Wanjiku',
    customerPhone: '0722001122',
    vehiclePlate: 'KCU 554B',
    vehicleMakeModel: 'Mercedes-Benz C200',
    mechanicId: 'MECH-003',
    mechanicName: 'Kelvin Omwamba',
    advisorName: 'David Ochieng (Service Advisor)',
    branchId: 'GAR-NRB-01',
    branchName: 'Nairobi Central Flagship Auto Care',
    overallRating: 5,
    workQualityRating: 5,
    timelinessRating: 5,
    communicationRating: 5,
    recommendScore: 10,
    comment: 'Kelvin is a master electrician. Cleared all SRS airbag fault codes that two other garages failed to resolve. Top notch!',
    serviceTags: ['Master Technician', 'Cleanliness', 'Fast Turnaround'],
    createdAt: '2026-07-26 04:10 PM'
  }
];




export interface PriceHistoryPoint {
  date: string;              // ISO Date (e.g. '2025-10-15')
  batchRef?: string;         // e.g. 'PO-2025-089', 'Inbound Sea-Frt 12'
  supplierName?: string;     // e.g. 'Masuma Japan Global'
  costPrice: number;         // Landed / procurement unit cost in KES
  retailPrice: number;       // List selling price in KES
  grossMarginPercent?: number; // ((retail - cost) / retail) * 100
  markupPercent?: number;     // ((retail - cost) / cost) * 100
  orderVolume?: number;      // Quantity procured in this batch
  marketAverage?: number;    // Benchmark competitor / market price in KES
  notes?: string;            // Strategic procurement context
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  brand: string;
  category?: string;      // Spare Parts Category
  price: number;          // Current Retail Selling Price
  costPrice?: number;     // Current Procurement / Landed Cost
  stock: number;
  imageUrl: string;
  oemCode?: string;       // OEM & Interchange Part Number Cross-overs
  binLocation?: string;   // Warehouse Bin & Shelf Locations
  minStockLevel?: number; // For low stock alert and PO triggers
  priceHistory?: PriceHistoryPoint[];
}

export interface Customer {
  id: number;
  name: string;
  type: 'Cash' | 'Credit';
  tier: 'Retail' | 'Wholesale A' | 'Wholesale B';
  companyName?: string;
  email?: string;
  phone?: string;
  creditLimit?: number;   // In KES
  outstandingBalance?: number; // In KES
  kraPin?: string;        // Kenya Revenue Authority Personal Identification Number
  shippingAddress?: string;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
}

export interface PurchaseOrder {
  id: string;
  supplier: Supplier;
  date: string;
  status: 'Draft' | 'Sent' | 'Received' | 'Cancelled';
  total: number;
  itemCount: number;
  items?: Array<{ productName: string; quantity: number; cost: number }>;
}

export interface SaleOrder {
  id: string;
  customer: Customer;
  date: string;
  status: 'Quote' | 'Order' | 'Invoiced' | 'Paid';
  total: number;
  items?: Array<{ productName: string; quantity: number; price: number }>;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface ShipmentTimelineEvent {
  status: string;
  timestamp: string;
  description: string;
  location: string;
}

export interface Shipment {
  id: string; // e.g. SH-2026-102
  orderId: string;
  customer: Customer;
  courierName: string;
  trackingNumber?: string;
  status: 'Processing' | 'Dispatched' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Returned' | 'Exception';
  shippingCost: number;
  dispatchDate?: string;
  etaDate?: string;
  deliveryDate?: string;
  notes?: string;
  timeline: ShipmentTimelineEvent[];
}

export interface SalesReturn {
  id: string; // e.g. SR-2026-001
  invoiceId: string;
  customer: Customer;
  date: string;
  items: Array<{ productName: string; quantity: number; refundAmount: number; condition: 'Restockable' | 'Defective' | 'Scrap' }>;
  totalRefund: number;
  status: 'Pending' | 'Approved' | 'Refunded' | 'Rejected';
  resolution: 'Refund' | 'Replacement' | 'Credit Note';
  replacementOrderId?: string;
  notes?: string;
}

// ==========================================
// GARAGE CHAIN MANAGEMENT & RBAC TYPES
// ==========================================

export type GarageRoleType = 
  | 'SUPER_ADMIN' 
  | 'BRANCH_MANAGER' 
  | 'DIAGNOSTIC_TECH' 
  | 'MECHANIC' 
  | 'PARTS_CLERK' 
  | 'RECEPTIONIST';

export type GaragePermission = 
  | 'view_all_branches'
  | 'manage_branches'
  | 'switch_location'
  | 'create_job_card'
  | 'edit_job_card'
  | 'delete_job_card'
  | 'run_diagnostics'
  | 'create_diagnostic_report'
  | 'request_parts'
  | 'approve_parts_issue'
  | 'update_job_status'
  | 'manage_technicians'
  | 'view_financial_reports'
  | 'manage_rbac_roles';

export interface GarageUserRole {
  key: GarageRoleType;
  name: string;
  description: string;
  badgeColor: string;
  permissions: GaragePermission[];
}

export interface MechanicShiftSchedule {
  id: string; // e.g. SHIFT-101
  staffId: string;
  staffName: string;
  dayOfWeek: string; // e.g. 'Monday', 'Today'
  shiftType: 'Morning Shift (07:30 - 15:30)' | 'Afternoon Shift (11:30 - 19:30)' | 'Full Day (08:00 - 17:00)' | 'Night Shift (18:00 - 02:00)' | 'Off Duty';
  status: 'On Duty' | 'Clocked In' | 'On Break' | 'Scheduled' | 'Off Duty';
  assignedBay?: string;
  maxDailyHoursCapacity: number;
}

export interface MechanicTaskSchedule {
  id: string; // e.g. TASK-201
  jobCardId: string;
  vehiclePlate: string;
  vehicleModel: string;
  taskTitle: string;
  requiredSpecialty: string;
  requiredSkillLevel: 'Master Lead' | 'Senior Specialist' | 'Mid Technician' | 'General Mechanic';
  assignedStaffId: string;
  assignedStaffName: string;
  scheduledTimeWindow: string; // e.g. "09:00 AM - 11:30 AM"
  estimatedHours: number;
  priority: 'Urgent' | 'High' | 'Normal' | 'Routine';
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Blocked (Awaiting Parts)';
  notes?: string;
}

export interface GarageStaffUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: GarageRoleType;
  assignedBranchId: string; // 'ALL' or specific branch ID e.g. 'GAR-NRB-01'
  avatarUrl?: string;
  specialty?: string;
  expertiseLevel?: 'Master Lead' | 'Senior Specialist' | 'Mid Technician' | 'Junior Apprentice';
  skillsList?: string[];
  hourlyRate?: number;
  certifications?: string[];
  completedJobsCount?: number;
  isActive: boolean;
  activeJobsCount?: number;
  shiftStatus?: 'Clocked In' | 'On Duty' | 'On Break' | 'Off Duty';
  currentShift?: string;
  dailyCapacityHours?: number;
  scheduledHours?: number;
}

export interface GarageBranch {
  id: string; // e.g. 'GAR-NRB-01'
  name: string;
  city: string;
  address: string;
  phone: string;
  managerName: string;
  totalLiftsBays: number;
  activeJobsCount: number;
  status: 'Active' | 'Full Capacity' | 'Maintenance';
  diagnosticEquipment: string[];
}

export interface DiagnosticErrorCode {
  code: string; // e.g., 'P0300'
  system: 'Engine' | 'Transmission' | 'ABS' | 'Airbag' | 'Electrical' | 'Body Control';
  title: string;
  severity: 'Critical' | 'Major' | 'Moderate' | 'Minor';
  description: string;
  possibleCauses: string[];
  recommendedFix: string;
  estimatedLaborHours: number;
}

export interface VehicleDetails {
  plateNumber: string; // e.g., 'KDG 789A'
  vin: string; // 17-char VIN e.g., 'JTD12345678901234'
  make: string; // e.g., 'Toyota'
  model: string; // e.g., 'Hilux'
  year: number; // e.g., 2022
  engineType: string; // e.g., '2.8L 1GD-FTV Turbo Diesel'
  mileageKm: number;
  color?: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
}

export interface VehicleIntakeChecklist {
  fuelLevel: 'Reserve' | '1/4 Tank' | '1/2 Tank' | '3/4 Tank' | 'Full Tank';
  tireTreadDepthMm: number;
  spareTirePresent: boolean;
  jackAndToolsPresent: boolean;
  bodyScratchesNotes: string;
  personalItemsNote: string;
  intakeInspectorName: string;
}

export interface DiagnosticSensorTelemetry {
  rpm: number;
  coolantTempC: number;
  batteryVolts: number;
  o2SensorVolts: number;
  fuelTrimPct: number;
  oilPressureBar: number;
  intakePressureKpa: number;
  massAirFlowGps?: number;
}

export interface DiagnosticPdfAttachment {
  fileName: string;
  fileSize: string;
  uploadDate: string;
  fileDataUrl: string; // Base64 data URL for in-browser viewing and download
  uploadedBy?: string;
  scannerDevice?: string;
  notes?: string;
}

export interface DiagnosticReport {
  id: string; // e.g. DIAG-2026-8801
  scanDate: string;
  scannerDevice: string; // e.g. "Masuma ECU Pro-Diag X900 Series"
  protocolUsed: string; // e.g. "CAN Bus / ISO 15765-4"
  overallHealthScore: number; // 0-100%
  faultCodes: DiagnosticErrorCode[];
  telemetrySnapshot: DiagnosticSensorTelemetry;
  freezeFrameData?: Record<string, string | number>;
  technicianNotes: string;
  technicianName: string;
  recommendedParts: Array<{ productId?: number; name: string; sku?: string; qty: number; approxPrice: number }>;
  status: 'Completed' | 'Pending Repairs' | 'Cleared';
  pdfAttachment?: DiagnosticPdfAttachment;
}

export interface JobCardPartItem {
  id: string;
  productId?: number;
  partName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  status: 'Requested' | 'Approved' | 'Issued' | 'Installed';
  requestedByRole?: string;
}

export interface JobCardLaborItem {
  id: string;
  taskDescription: string;
  hours: number;
  ratePerHour: number;
  technicianName: string;
}

export interface JobCardHistoryLog {
  id: string;
  timestamp: string;
  authorName: string;
  actionTitle: string;
  details: string;
}

export interface CustomerSignatureData {
  id: string;
  signatureDataUrl: string; // base64 canvas image URL
  signerName: string;
  signerPhone?: string;
  signedAt: string;
  signatureType: 'Diagnostic Estimate Sign-Off' | 'Final Repair Acceptance' | 'Vehicle Intake Authorization';
  notes?: string;
}

export interface JobCard {
  id: string; // e.g. JC-NRB-2026-104
  branchId: string;
  branchName: string;
  vehicle: VehicleDetails;
  status: 'Booked' | 'Diagnostic Scan' | 'In Progress' | 'Awaiting Parts' | 'Quality Check' | 'Completed' | 'Invoiced';
  assignedTechnicianId: string;
  assignedTechnicianName: string;
  assignedLiftBay: string; // e.g. 'Bay 03 (Diagnostic Lift)'
  checkInDate: string;
  estimatedCompletion: string;
  customerComplaints: string[];
  intakeChecklist?: VehicleIntakeChecklist;
  diagnosticReport?: DiagnosticReport;
  parts: JobCardPartItem[];
  labor: JobCardLaborItem[];
  notes: string;
  subtotalAmount: number;
  taxRatePct: number; // e.g. 16 for VAT
  taxAmount: number;
  discountAmount: number;
  totalEstimate: number;
  paymentStatus: 'Unpaid' | 'Deposit Paid' | 'Fully Paid';
  customerApprovalStatus: 'Pending Approval' | 'Approved' | 'Rejected' | 'Authorized Work';
  signatures?: CustomerSignatureData[];
  gatePassIssued: boolean;
  gatePassCode?: string;
  historyLogs: JobCardHistoryLog[];
}

export interface CustomerNotification {
  id: string;
  jobCardId: string;
  vehiclePlate: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  channel: 'SMS' | 'EMAIL' | 'WHATSAPP' | 'SMS & EMAIL';
  triggerStatus: JobCard['status'] | 'MANUAL_ALERT';
  messageSubject: string;
  messageBody: string;
  sentAt: string;
  deliveryStatus: 'Delivered' | 'Sent' | 'Pending' | 'Failed';
  isAutomated: boolean;
  branchName: string;
}

export interface StatusNotificationTemplate {
  smsTemplate: string;
  emailSubject: string;
  emailTemplate: string;
  enabled: boolean;
}

export interface NotificationSettings {
  smsEnabled: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  autoTriggerOnStatusChange: boolean;
  smsGatewayProvider: 'Safaricom Bulk SMS API' | 'Twilio SMS' | 'AfricasTalking' | 'Simulated Gateway';
  senderHeader: string;
  statusTemplates: Record<JobCard['status'], StatusNotificationTemplate>;
}

export interface CustomerFeedback {
  id: string;
  jobCardId: string;
  customerName: string;
  customerPhone: string;
  vehiclePlate: string;
  vehicleMakeModel: string;
  mechanicId: string;
  mechanicName: string;
  advisorName: string;
  branchId: string;
  branchName: string;
  overallRating: number; // 1 to 5
  workQualityRating: number; // 1 to 5
  timelinessRating: number; // 1 to 5
  communicationRating: number; // 1 to 5
  recommendScore: number; // 0 to 10 NPS
  comment: string;
  serviceTags?: string[];
  createdAt: string;
}

export type SystemUserRole = 'admin' | 'manager' | 'cashier' | 'workshop' | 'accountant';

export interface SystemUser {
  id: string | number;
  username: string;
  email: string;
  fullName: string;
  role: SystemUserRole;
  pinCode?: string;
  phone?: string;
  branch?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
}

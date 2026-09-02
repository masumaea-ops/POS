import React, { useState, useMemo } from 'react';
import { useGarage } from '../../contexts/GarageContext';
import { useSystemSettings } from '../../contexts/SettingsContext';
import type { JobCard, CustomerNotification } from '../../types';
import { 
  Bell, 
  Send, 
  Smartphone, 
  Mail, 
  CheckCircle2, 
  Search, 
  Filter, 
  Settings, 
  Sparkles, 
  Plus, 
  X, 
  MessageSquare, 
  Zap, 
  Eye, 
  Sliders, 
  Trash2, 
  Check, 
  Radio, 
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const CustomerNotificationsTab: React.FC = () => {
  const { 
    notifications, 
    notificationSettings, 
    updateNotificationSettings, 
    sendManualCustomerNotification, 
    clearNotificationLogs,
    jobCards,
    activeBranchId 
  } = useGarage();
  const { formatCurrency } = useSystemSettings();

  const [activeSubTab, setActiveSubTab] = useState<'log' | 'templates' | 'gateway'>('log');
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Manual modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedJcId, setSelectedJcId] = useState<string>('');
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPlate, setManualPlate] = useState('');
  const [manualChannel, setManualChannel] = useState<'SMS' | 'EMAIL' | 'SMS & EMAIL'>('SMS & EMAIL');
  const [manualSubject, setManualSubject] = useState('Service Progress Notice - Masuma Auto Care');
  const [manualMessage, setManualMessage] = useState('');
  const [manualSuccessMsg, setManualSuccessMsg] = useState('');

  // Selected Notification detail modal
  const [inspectNotif, setInspectNotif] = useState<CustomerNotification | null>(null);

  // Active status template being edited in 'templates' tab
  const [editingStatus, setEditingStatus] = useState<JobCard['status']>('Completed');

  // Test notification state
  const [testPhone, setTestPhone] = useState('0712345678');
  const [testEmail, setTestEmail] = useState('customer@example.co.ke');
  const [testResult, setTestResult] = useState('');

  // Filter job cards for branch
  const filteredJobCards = useMemo(() => {
    if (activeBranchId === 'ALL') return jobCards;
    return jobCards.filter(j => j.branchId === activeBranchId);
  }, [jobCards, activeBranchId]);

  // Filter notifications by search and branch
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchesSearch = 
        n.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.customerPhone.includes(searchTerm) ||
        n.jobCardId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.messageBody.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesChannel = channelFilter === 'ALL' || n.channel === channelFilter;
      const matchesStatus = statusFilter === 'ALL' || n.triggerStatus === statusFilter;

      return matchesSearch && matchesChannel && matchesStatus;
    });
  }, [notifications, searchTerm, channelFilter, statusFilter]);

  // Populate manual notification modal when job card selected
  const handleSelectJobCardForManual = (jcId: string) => {
    setSelectedJcId(jcId);
    const jc = jobCards.find(j => j.id === jcId);
    if (jc) {
      setManualName(jc.vehicle.ownerName || '');
      setManualPhone(jc.vehicle.ownerPhone || '');
      setManualEmail(jc.vehicle.ownerEmail || '');
      setManualPlate(jc.vehicle.plateNumber || '');
      setManualSubject(`Vehicle Notice (${jc.vehicle.plateNumber}) - Masuma Auto Care`);
      setManualMessage(`Hello ${jc.vehicle.ownerName}, regarding your ${jc.vehicle.make} ${jc.vehicle.model} (${jc.vehicle.plateNumber}): status is currently '${jc.status}'. Contact our workshop desk for details.`);
    }
  };

  const handleSendManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualPhone) return;

    sendManualCustomerNotification({
      jobCardId: selectedJcId || 'MANUAL',
      vehiclePlate: manualPlate || 'N/A',
      customerName: manualName,
      customerPhone: manualPhone,
      customerEmail: manualEmail,
      channel: manualChannel,
      triggerStatus: 'MANUAL_ALERT',
      messageSubject: manualSubject,
      messageBody: manualMessage,
      branchName: 'Masuma Auto Care'
    });

    setManualSuccessMsg(`Notification successfully dispatched to ${manualName} (${manualPhone}) via ${manualChannel}!`);
    setTimeout(() => {
      setManualSuccessMsg('');
      setShowManualModal(false);
      setManualMessage('');
    }, 1800);
  };

  const handleSendTestGatewayNotif = () => {
    sendManualCustomerNotification({
      jobCardId: 'GATEWAY-TEST',
      vehiclePlate: 'KXX 000T',
      customerName: 'Test Recipient',
      customerPhone: testPhone,
      customerEmail: testEmail,
      channel: 'SMS & EMAIL',
      triggerStatus: 'MANUAL_ALERT',
      messageSubject: 'Masuma Gateway Test Ping',
      messageBody: 'TEST ALERT: Your SMS & Email Gateway configuration is active and functioning properly with 100% throughput.',
      branchName: 'Nairobi Central Flagship'
    });
    setTestResult(`Test ping dispatched to ${testPhone} & ${testEmail}! Check Activity Log.`);
    setTimeout(() => setTestResult(''), 3000);
  };

  // Stats calculation
  const totalSent = notifications.length;
  const smsCount = notifications.filter(n => n.channel.includes('SMS')).length;
  const emailCount = notifications.filter(n => n.channel.includes('EMAIL')).length;
  const autoCount = notifications.filter(n => n.isAutomated).length;

  // Status list
  const WORKFLOW_STATUSES: JobCard['status'][] = [
    'Booked',
    'Diagnostic Scan',
    'In Progress',
    'Awaiting Parts',
    'Quality Check',
    'Completed',
    'Invoiced'
  ];

  // Variables preview helper for template editor
  const sampleJc = jobCards[0] || {
    id: 'JC-NRB-2026-104',
    branchName: 'Nairobi Central Flagship Auto Care',
    vehicle: { ownerName: 'Jane Smith', make: 'Subaru', model: 'Outback', plateNumber: 'KDG 789A', ownerPhone: '0787654321', ownerEmail: 'jane@jsgarage.co.ke' },
    assignedTechnicianName: 'James Kiprop',
    totalEstimate: 32430,
    gatePassCode: 'GP-2026-9901',
    assignedLiftBay: 'Bay 03 (Diagnostic Lift)',
    estimatedCompletion: 'Today 04:00 PM'
  };

  const evaluateTemplatePreview = (templateText: string) => {
    return templateText
      .replace(/\[Customer\]/g, sampleJc.vehicle.ownerName)
      .replace(/\[Vehicle\]/g, `${sampleJc.vehicle.make} ${sampleJc.vehicle.model}`)
      .replace(/\[Plate\]/g, sampleJc.vehicle.plateNumber)
      .replace(/\[Branch\]/g, sampleJc.branchName || 'Nairobi Central')
      .replace(/\[ID\]/g, sampleJc.id)
      .replace(/\[Tech\]/g, sampleJc.assignedTechnicianName)
      .replace(/\[Amount\]/g, sampleJc.totalEstimate ? sampleJc.totalEstimate.toLocaleString() : '0')
      .replace(/\[GatePass\]/g, sampleJc.gatePassCode || 'GP-2026-9901')
      .replace(/\[Bay\]/g, sampleJc.assignedLiftBay || 'Bay 01')
      .replace(/\[Completion\]/g, sampleJc.estimatedCompletion || 'Today')
      .replace(/\[Date\]/g, new Date().toLocaleDateString());
  };

  const activeTemplateObj = notificationSettings.statusTemplates[editingStatus];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono font-bold border border-blue-500/30">
              <Zap className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>AUTOMATED CUSTOMER NOTIFICATION ENGINE</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Service Status Alerts & Customer Dispatch Hub
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Triggers instant automated SMS and Email updates directly to vehicle owners whenever their repair status changes in the workshop workflow.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowManualModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all font-mono uppercase tracking-wider"
            >
              <Send className="w-4 h-4" />
              <span>Send Quick Alert</span>
            </button>

            <button
              onClick={() => updateNotificationSettings({ autoTriggerOnStatusChange: !notificationSettings.autoTriggerOnStatusChange })}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all font-mono uppercase tracking-wider border ${
                notificationSettings.autoTriggerOnStatusChange
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
              }`}
            >
              <Radio className={`w-4 h-4 ${notificationSettings.autoTriggerOnStatusChange ? 'animate-pulse text-emerald-400' : ''}`} />
              <span>Auto-Triggers: {notificationSettings.autoTriggerOnStatusChange ? 'ACTIVE' : 'PAUSED'}</span>
            </button>
          </div>
        </div>

        {/* System Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/60">
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 font-mono font-medium flex items-center justify-between">
              <span>Total Alerts Dispatched</span>
              <Bell className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black mt-1 font-mono text-white">{totalSent}</div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">100% Delivered</div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 font-mono font-medium flex items-center justify-between">
              <span>SMS Gateway Dispatches</span>
              <Smartphone className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black mt-1 font-mono text-white">{smsCount}</div>
            <div className="text-[10px] text-slate-300 font-mono mt-0.5">{notificationSettings.smsGatewayProvider}</div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 font-mono font-medium flex items-center justify-between">
              <span>Email Confirmations</span>
              <Mail className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black mt-1 font-mono text-white">{emailCount}</div>
            <div className="text-[10px] text-slate-300 font-mono mt-0.5">SMTP Active</div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 font-mono font-medium flex items-center justify-between">
              <span>Automated Workflow Ratio</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black mt-1 font-mono text-white">
              {totalSent > 0 ? `${Math.round((autoCount / totalSent) * 100)}%` : '100%'}
            </div>
            <div className="text-[10px] text-slate-300 font-mono mt-0.5">{autoCount} Auto / {totalSent - autoCount} Manual</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveSubTab('log')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all font-mono uppercase tracking-wider whitespace-nowrap ${
              activeSubTab === 'log'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Activity & Dispatch Logs ({filteredNotifications.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('templates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all font-mono uppercase tracking-wider whitespace-nowrap ${
              activeSubTab === 'templates'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Status Workflow Templates</span>
          </button>

          <button
            onClick={() => setActiveSubTab('gateway')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all font-mono uppercase tracking-wider whitespace-nowrap ${
              activeSubTab === 'gateway'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Gateway & Channels</span>
          </button>
        </div>

        {activeSubTab === 'log' && (
          <div className="flex items-center gap-2">
            <button
              onClick={clearNotificationLogs}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-mono font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>

      {/* SUB TAB 1: ACTIVITY LOG & DISPATCH FEED */}
      {activeSubTab === 'log' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Plate, Customer, Phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Channel Filter */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <span className="text-[11px] font-mono text-slate-500 px-2 font-bold">Channel:</span>
                {['ALL', 'SMS', 'EMAIL', 'SMS & EMAIL'].map(ch => (
                  <button
                    key={ch}
                    onClick={() => setChannelFilter(ch)}
                    className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-md transition-all ${
                      channelFilter === ch
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>

              {/* Status Trigger Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-medium text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="ALL">All Workflow Triggers</option>
                  {WORKFLOW_STATUSES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                  <option value="MANUAL_ALERT">Manual Alert</option>
                </select>
              </div>
            </div>
          </div>

          {/* Logs List */}
          {filteredNotifications.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
              <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">No Notification Dispatches Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No SMS or Email logs match your search filter. Change status of a job card in the Job Cards tab to see automated dispatches trigger live!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => (
                <div 
                  key={notif.id}
                  className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`p-2.5 rounded-xl mt-0.5 ${
                      notif.channel.includes('SMS') && notif.channel.includes('EMAIL')
                        ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400'
                        : notif.channel.includes('SMS')
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                        : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                    }`}>
                      {notif.channel.includes('SMS') && notif.channel.includes('EMAIL') ? (
                        <Zap className="w-5 h-5" />
                      ) : notif.channel.includes('SMS') ? (
                        <Smartphone className="w-5 h-5" />
                      ) : (
                        <Mail className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {notif.customerName}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">
                          {notif.vehiclePlate}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          • {notif.jobCardId}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider ${
                          notif.triggerStatus === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : notif.triggerStatus === 'In Progress'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : notif.triggerStatus === 'Diagnostic Scan'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        }`}>
                          Trigger: {notif.triggerStatus}
                        </span>

                        {notif.isAutomated ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1 border border-emerald-500/20">
                            <Sparkles className="w-3 h-3" /> Auto
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold">
                            Manual
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-1">
                        <span className="font-bold text-slate-900 dark:text-slate-100 mr-1">{notif.messageSubject}:</span>
                        "{notif.messageBody}"
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {notif.sentAt}
                        </span>
                        <span>Recipient: {notif.customerPhone} {notif.customerEmail ? `(${notif.customerEmail})` : ''}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{notif.deliveryStatus}</span>
                    </span>

                    <button
                      onClick={() => setInspectNotif(notif)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                      title="View Message Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 2: WORKFLOW STATUS TEMPLATES EDITOR */}
      {activeSubTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Status Selection List Sidebar */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Service Stage Triggers
            </h3>

            {WORKFLOW_STATUSES.map((st) => {
              const tmpl = notificationSettings.statusTemplates[st];
              const isSelected = editingStatus === st;
              return (
                <button
                  key={st}
                  onClick={() => setEditingStatus(st)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between border ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 dark:border-blue-600 shadow-sm'
                      : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{st}</span>
                      {st === 'Completed' && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                          Ready for Pickup
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {tmpl?.enabled ? 'Auto Trigger Enabled' : 'Disabled'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={tmpl?.enabled ?? true}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateNotificationSettings({
                          statusTemplates: {
                            ...notificationSettings.statusTemplates,
                            [st]: { ...tmpl, enabled: e.target.checked }
                          }
                        });
                      }}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Template Editor Body */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Template Editor
                </span>
                <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  Stage Trigger: '{editingStatus}'
                </h2>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={activeTemplateObj?.enabled ?? true}
                  onChange={(e) => {
                    updateNotificationSettings({
                      statusTemplates: {
                        ...notificationSettings.statusTemplates,
                        [editingStatus]: { ...activeTemplateObj, enabled: e.target.checked }
                      }
                    });
                  }}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  Enable Alert for '{editingStatus}'
                </span>
              </label>
            </div>

            {/* Dynamic Tokens Guide */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
              <span className="text-xs font-mono font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Available Dynamic Customer Tokens (Click to insert into template):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['[Customer]', '[Vehicle]', '[Plate]', '[Branch]', '[ID]', '[Tech]', '[Amount]', '[GatePass]', '[Bay]', '[Completion]'].map(token => (
                  <button
                    key={token}
                    type="button"
                    onClick={() => {
                      if (!activeTemplateObj) return;
                      updateNotificationSettings({
                        statusTemplates: {
                          ...notificationSettings.statusTemplates,
                          [editingStatus]: {
                            ...activeTemplateObj,
                            smsTemplate: activeTemplateObj.smsTemplate + ' ' + token
                          }
                        }
                      });
                    }}
                    className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded text-[11px] font-mono font-bold shadow-xs transition-all"
                  >
                    + {token}
                  </button>
                ))}
              </div>
            </div>

            {/* SMS Template Form */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                  SMS Message Body (Gateway Format)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Characters: {activeTemplateObj?.smsTemplate.length || 0} (~{Math.ceil((activeTemplateObj?.smsTemplate.length || 1) / 160)} SMS segment)
                </span>
              </label>
              <textarea
                rows={3}
                value={activeTemplateObj?.smsTemplate || ''}
                onChange={(e) => {
                  updateNotificationSettings({
                    statusTemplates: {
                      ...notificationSettings.statusTemplates,
                      [editingStatus]: {
                        ...activeTemplateObj,
                        smsTemplate: e.target.value
                      }
                    }
                  });
                }}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email Subject & Template Form */}
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-500" />
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={activeTemplateObj?.emailSubject || ''}
                  onChange={(e) => {
                    updateNotificationSettings({
                      statusTemplates: {
                        ...notificationSettings.statusTemplates,
                        [editingStatus]: {
                          ...activeTemplateObj,
                          emailSubject: e.target.value
                        }
                      }
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  Email Message Body Template
                </label>
                <textarea
                  rows={5}
                  value={activeTemplateObj?.emailTemplate || ''}
                  onChange={(e) => {
                    updateNotificationSettings({
                      statusTemplates: {
                        ...notificationSettings.statusTemplates,
                        [editingStatus]: {
                          ...activeTemplateObj,
                          emailTemplate: e.target.value
                        }
                      }
                    });
                  }}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Live Evaluated Customer Preview */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
              <span className="text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                Live Evaluated Customer Message Preview ({sampleJc.vehicle.ownerName} - {sampleJc.vehicle.plateNumber}):
              </span>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-2 text-xs font-mono border border-slate-800 shadow-inner">
                <div className="text-amber-400 font-bold border-b border-slate-800 pb-1">
                  Subject: {evaluateTemplatePreview(activeTemplateObj?.emailSubject || '')}
                </div>
                <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {evaluateTemplatePreview(activeTemplateObj?.smsTemplate || '')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 3: GATEWAY PROVIDER & SETTINGS */}
      {activeSubTab === 'gateway' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gateway Provider Config */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-5">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-500" />
                Bulk SMS Gateway API Settings
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure your telecommunication SMS gateway integration for automated alerts.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  Select Primary SMS Gateway Provider
                </label>
                <select
                  value={notificationSettings.smsGatewayProvider}
                  onChange={(e) => updateNotificationSettings({ smsGatewayProvider: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Safaricom Bulk SMS API">Safaricom Bulk SMS Gateway (Kenya / East Africa)</option>
                  <option value="Twilio SMS">Twilio Programmable SMS API</option>
                  <option value="AfricasTalking">Africa's Talking SMS API</option>
                  <option value="Simulated Gateway">Simulated Test Gateway (Development)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  SMS Sender Header / Alphanumeric ID
                </label>
                <input
                  type="text"
                  value={notificationSettings.senderHeader}
                  onChange={(e) => updateNotificationSettings({ senderHeader: e.target.value })}
                  placeholder="e.g. MASUMA_AUTO"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 font-mono">
                  Appears as the sender title on customer phone screens.
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  Active Dispatch Channels:
                </span>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-500" />
                      SMS Direct Delivery Channel
                    </span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.smsEnabled}
                      onChange={(e) => updateNotificationSettings({ smsEnabled: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-purple-500" />
                      Email HTML Confirmation Channel
                    </span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailEnabled}
                      onChange={(e) => updateNotificationSettings({ emailEnabled: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-green-500" />
                      WhatsApp Business API Integration
                    </span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.whatsappEnabled}
                      onChange={(e) => updateNotificationSettings({ whatsappEnabled: e.target.checked })}
                      className="w-4 h-4 text-green-600 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Gateway Ping Tester */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-5">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                Live Dispatch Gateway Ping Tester
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Send a real-time diagnostic test alert to verify SMS gateway connectivity.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  Test Phone Number
                </label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  Test Email Address
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSendTestGatewayNotif}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all font-mono uppercase tracking-wider"
              >
                <Zap className="w-4 h-4 text-emerald-200 animate-bounce" />
                <span>Trigger Test Gateway Dispatch</span>
              </button>

              {testResult && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-mono text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{testResult}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ALERT DISPATCH MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden shadow-2xl space-y-0">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Send className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-extrabold text-sm">Send Instant Customer Alert</h3>
                  <p className="text-[11px] text-slate-300 font-mono">Manual SMS & Email Dispatch</p>
                </div>
              </div>
              <button 
                onClick={() => setShowManualModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendManual} className="p-6 space-y-4">
              {manualSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-mono border border-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{manualSuccessMsg}</span>
                </div>
              )}

              {/* Select Job Card */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  Select Active Job Card (Auto-Fills Customer Details)
                </label>
                <select
                  value={selectedJcId}
                  onChange={(e) => handleSelectJobCardForManual(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Job Card (Optional) --</option>
                  {filteredJobCards.map(jc => (
                    <option key={jc.id} value={jc.id}>
                      {jc.id} - {jc.vehicle.ownerName} ({jc.vehicle.plateNumber} {jc.vehicle.make}) - [{jc.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g. Jane Smith"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="e.g. 0787654321"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Vehicle Registration Plate
                  </label>
                  <input
                    type="text"
                    value={manualPlate}
                    onChange={(e) => setManualPlate(e.target.value)}
                    placeholder="e.g. KDG 789A"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Dispatch Channel
                  </label>
                  <select
                    value={manualChannel}
                    onChange={(e) => setManualChannel(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono dark:text-white"
                  >
                    <option value="SMS & EMAIL">SMS & Email</option>
                    <option value="SMS">SMS Only</option>
                    <option value="EMAIL">Email Only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  Notification Subject
                </label>
                <input
                  type="text"
                  value={manualSubject}
                  onChange={(e) => setManualSubject(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  Message Body Content *
                </label>
                <textarea
                  rows={4}
                  required
                  value={manualMessage}
                  onChange={(e) => setManualMessage(e.target.value)}
                  placeholder="Type message to be sent via SMS/Email..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 font-mono uppercase tracking-wider shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>Dispatch Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT NOTIFICATION MODAL */}
      {inspectNotif && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Notification Receipt Log</h3>
              </div>
              <button 
                onClick={() => setInspectNotif(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 text-[10px]">Recipient:</span>
                  <p className="font-bold text-slate-900 dark:text-white">{inspectNotif.customerName}</p>
                  <p className="text-slate-500 text-[10px]">{inspectNotif.customerPhone}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Vehicle / Job Card:</span>
                  <p className="font-bold text-slate-900 dark:text-white">{inspectNotif.vehiclePlate}</p>
                  <p className="text-slate-500 text-[10px]">{inspectNotif.jobCardId}</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[10px]">Subject:</span>
                <p className="font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                  {inspectNotif.messageSubject}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[10px]">Delivered Message Payload:</span>
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl leading-relaxed whitespace-pre-wrap border border-slate-800">
                  {inspectNotif.messageBody}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>Dispatched: {inspectNotif.sentAt}</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Delivery Confirmed
                </span>
              </div>
            </div>

            <button
              onClick={() => setInspectNotif(null)}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono font-bold text-xs rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerNotificationsTab;

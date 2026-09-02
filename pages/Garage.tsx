import React, { useState } from 'react';
import { GarageHeader } from '../components/garage/GarageHeader';
import { OutletsTab } from '../components/garage/OutletsTab';
import { JobCardsTab } from '../components/garage/JobCardsTab';
import { DiagnosticsTab } from '../components/garage/DiagnosticsTab';
import { BaysTechniciansTab } from '../components/garage/BaysTechniciansTab';
import { MechanicSchedulingTab } from '../components/garage/MechanicSchedulingTab';
import { MechanicDashboardTab } from '../components/garage/MechanicDashboardTab';
import { ServiceHistoryTab } from '../components/garage/ServiceHistoryTab';
import { CustomerNotificationsTab } from '../components/garage/CustomerNotificationsTab';
import { CustomerSatisfactionTab } from '../components/garage/CustomerSatisfactionTab';
import { RbacTab } from '../components/garage/RbacTab';
import { 
  Car, 
  Cpu, 
  Building2, 
  Layers, 
  ShieldCheck, 
  Wrench,
  Calendar,
  UserCheck,
  History,
  Bell,
  Star
} from 'lucide-react';

type GarageTab = 'job_cards' | 'service_history' | 'notifications' | 'customer_satisfaction' | 'diagnostics' | 'scheduling' | 'mechanic_portal' | 'outlets' | 'bays' | 'rbac';

export const Garage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GarageTab>('job_cards');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 pb-12">
      {/* Top Chain Header */}
      <GarageHeader />

      {/* Tab Navigation Menu */}
      <div className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-slate-700 px-4 lg:px-6">
        <div className="flex items-center gap-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('job_cards')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all whitespace-nowrap font-mono uppercase tracking-wider ${
              activeTab === 'job_cards'
                ? 'bg-brand-orange text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Job Cards & Service Work Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('service_history')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all whitespace-nowrap font-mono uppercase tracking-wider ${
              activeTab === 'service_history'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Service History Archive</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all whitespace-nowrap font-mono uppercase tracking-wider ${
              activeTab === 'notifications'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Bell className="w-4 h-4 text-emerald-400" />
            <span>Customer SMS & Email Alerts</span>
          </button>

          <button
            onClick={() => setActiveTab('customer_satisfaction')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all whitespace-nowrap font-mono uppercase tracking-wider ${
              activeTab === 'customer_satisfaction'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Customer Satisfaction CSAT</span>
          </button>

          <button
            onClick={() => setActiveTab('mechanic_portal')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all whitespace-nowrap font-mono uppercase tracking-wider ${
              activeTab === 'mechanic_portal'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>My Mechanics Workstation Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all whitespace-nowrap font-mono uppercase tracking-wider ${
              activeTab === 'diagnostics'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Computerized ECU Diagnostics</span>
          </button>

          <button
            onClick={() => setActiveTab('scheduling')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all whitespace-nowrap font-mono uppercase tracking-wider ${
              activeTab === 'scheduling'
                ? 'bg-brand-orange text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Mechanic Shift & Task Scheduling</span>
          </button>

          <button
            onClick={() => setActiveTab('outlets')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all whitespace-nowrap font-mono uppercase tracking-wider ${
              activeTab === 'outlets'
                ? 'bg-brand-orange text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Garage Outlets</span>
          </button>

          <button
            onClick={() => setActiveTab('bays')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all whitespace-nowrap font-mono uppercase tracking-wider ${
              activeTab === 'bays'
                ? 'bg-brand-orange text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Lift Bays & Mechanics Layout</span>
          </button>

          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all whitespace-nowrap font-mono uppercase tracking-wider ${
              activeTab === 'rbac'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>RBAC Security Matrix</span>
          </button>
        </div>
      </div>

      {/* Main Tab Render Container */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'job_cards' && <JobCardsTab />}
        {activeTab === 'service_history' && <ServiceHistoryTab />}
        {activeTab === 'notifications' && <CustomerNotificationsTab />}
        {activeTab === 'customer_satisfaction' && <CustomerSatisfactionTab />}
        {activeTab === 'mechanic_portal' && <MechanicDashboardTab />}
        {activeTab === 'diagnostics' && <DiagnosticsTab />}
        {activeTab === 'scheduling' && <MechanicSchedulingTab />}
        {activeTab === 'outlets' && <OutletsTab />}
        {activeTab === 'bays' && <BaysTechniciansTab />}
        {activeTab === 'rbac' && <RbacTab />}
      </div>
    </div>
  );
};

export default Garage;

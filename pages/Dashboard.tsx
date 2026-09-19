import React from 'react';
import { useAuth } from '../contexts/AuthContext';

// Sub-dashboards
import ExecutiveAdminDashboard from '../components/dashboard/ExecutiveAdminDashboard';
import RegionalManagerDashboard from '../components/dashboard/RegionalManagerDashboard';
import CashierCounterDashboard from '../components/dashboard/CashierCounterDashboard';
import WorkshopOperationsDashboard from '../components/dashboard/WorkshopOperationsDashboard';
import FinancialAccountantDashboard from '../components/dashboard/FinancialAccountantDashboard';

export const Dashboard: React.FC = () => {
  const { userRole } = useAuth();

  const renderRoleDashboard = () => {
    switch (userRole) {
      case 'manager':
        return <RegionalManagerDashboard />;
      case 'cashier':
        return <CashierCounterDashboard />;
      case 'workshop':
        return <WorkshopOperationsDashboard />;
      case 'accountant':
        return <FinancialAccountantDashboard />;
      case 'admin':
      default:
        return <ExecutiveAdminDashboard />;
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-900 min-h-full pb-20">
      {renderRoleDashboard()}
    </div>
  );
};

export default Dashboard;

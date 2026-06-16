import React from 'react';
import PageHeader from '../components/shared/PageHeader';
import Tabs from '../components/shared/Tabs';
import Table from '../components/shared/Table';
import { MOCK_CUSTOMERS, MOCK_SUPPLIERS } from '../data/mockData';
import type { Customer, Supplier } from '../types';

const Contacts: React.FC = () => {
  const tabs = ["Customers", "Suppliers"];

  const customerColumns = [
    { header: 'Name', accessor: (item: Customer) => <span className="font-semibold">{item.name}</span> },
    { header: 'Company', accessor: (item: Customer) => item.companyName || 'N/A' },
    { header: 'Tier', accessor: (item: Customer) => item.tier },
    { header: 'Email', accessor: (item: Customer) => item.email || 'N/A' },
    { header: 'Phone', accessor: (item: Customer) => item.phone || 'N/A' },
  ];
  
  const supplierColumns = [
    { header: 'Supplier Name', accessor: (item: Supplier) => <span className="font-semibold">{item.name}</span> },
    { header: 'Contact Person', accessor: (item: Supplier) => item.contactPerson },
    { header: 'Email', accessor: (item: Supplier) => item.email },
    { header: 'Phone', accessor: (item: Supplier) => item.phone },
  ];

  const renderContent = (activeTab: string) => {
    if (activeTab === "Customers") {
      return <div className="mt-6"><Table columns={customerColumns} data={MOCK_CUSTOMERS.filter(c => c.id !== 1)} /></div>;
    }
    if (activeTab === "Suppliers") {
      return <div className="mt-6"><Table columns={supplierColumns} data={MOCK_SUPPLIERS} /></div>;
    }
    return null;
  };

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Contacts"
        primaryAction={{ label: "Add New Contact", onClick: () => alert("Add Contact") }}
      />
      <div className="p-4 md:p-8">
        <Tabs tabs={tabs}>
          {(activeTab) => renderContent(activeTab)}
        </Tabs>
      </div>
    </div>
  );
};

export default Contacts;
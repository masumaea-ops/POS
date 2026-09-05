import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/shared/PageHeader';
import Table, { TableRowAction } from '../components/shared/Table';
import { MOCK_CUSTOMERS, MOCK_SUPPLIERS } from '../data/mockData';
import type { Customer, Supplier } from '../types';
import { X, Search, Edit3, Copy, Phone, Mail, FileText } from 'lucide-react';
import { useSystemSettings } from '../contexts/SettingsContext';

const Contacts: React.FC = () => {
  const { settings, formatPrice } = useSystemSettings();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tabFromQuery = searchParams.get('tab');
  
  const initialTab = (location.pathname === '/customers' || tabFromQuery?.toLowerCase() === 'customers')
    ? 'Customers'
    : (tabFromQuery?.toLowerCase() === 'suppliers' ? 'Suppliers' : 'Customers');

  const [activeTab, setActiveTab] = useState<'Customers' | 'Suppliers'>(initialTab);

  useEffect(() => {
    if (location.pathname === '/customers') {
      setActiveTab('Customers');
    } else if (tabFromQuery) {
      if (tabFromQuery.toLowerCase() === 'suppliers') setActiveTab('Suppliers');
      if (tabFromQuery.toLowerCase() === 'customers') setActiveTab('Customers');
    }
  }, [location.pathname, tabFromQuery]);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Persistent state for Customers
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('masuma_customers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading customers from local storage', e);
      }
    }
    return MOCK_CUSTOMERS;
  });

  // 2. Persistent state for Suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('masuma_suppliers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading suppliers from local storage', e);
      }
    }
    return MOCK_SUPPLIERS;
  });

  // Auto-sync states to Local Database
  useEffect(() => {
    localStorage.setItem('masuma_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('masuma_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  // Modal active states
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Import overlay states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    itemsCount?: number;
  }>({ status: 'idle', message: '' });
  const [importPreviewCustomers, setImportPreviewCustomers] = useState<Customer[]>([]);
  const [importPreviewSuppliers, setImportPreviewSuppliers] = useState<Supplier[]>([]);

  // Individual Form Fields - Customers
  const [customerForm, setCustomerForm] = useState({
    name: '',
    type: 'Credit' as 'Cash' | 'Credit',
    tier: 'Wholesale B' as 'Retail' | 'Wholesale A' | 'Wholesale B',
    companyName: '',
    email: '',
    phone: '',
    creditLimit: 150000,
    outstandingBalance: 0,
    kraPin: '',
    shippingAddress: ''
  });

  // Individual Form Fields - Suppliers
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: ''
  });

  // ----------------------------------------------------------------------
  // HANDLERS FOR ADDING / EDITING CONTACTS
  // ----------------------------------------------------------------------
  const handleOpenAddModal = () => {
    if (activeTab === 'Customers') {
      setEditingCustomer(null);
      setCustomerForm({
        name: '',
        type: 'Credit',
        tier: 'Wholesale B',
        companyName: '',
        email: '',
        phone: '',
        creditLimit: 150000,
        outstandingBalance: 0,
        kraPin: '',
        shippingAddress: ''
      });
      setIsCustomerModalOpen(true);
    } else {
      setEditingSupplier(null);
      setSupplierForm({
        name: '',
        contactPerson: '',
        email: '',
        phone: ''
      });
      setIsSupplierModalOpen(true);
    }
  };

  const handleEditCustomerClick = (cust: Customer) => {
    setEditingCustomer(cust);
    setCustomerForm({
      name: cust.name,
      type: cust.type,
      tier: cust.tier,
      companyName: cust.companyName || '',
      email: cust.email || '',
      phone: cust.phone || '',
      creditLimit: cust.creditLimit || 0,
      outstandingBalance: cust.outstandingBalance || 0,
      kraPin: cust.kraPin || '',
      shippingAddress: cust.shippingAddress || ''
    });
    setIsCustomerModalOpen(true);
  };

  const handleEditSupplierClick = (supp: Supplier) => {
    setEditingSupplier(supp);
    setSupplierForm({
      name: supp.name,
      contactPerson: supp.contactPerson || '',
      email: supp.email || '',
      phone: supp.phone || ''
    });
    setIsSupplierModalOpen(true);
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name) {
      alert('⚠️ Name field is required!');
      return;
    }

    if (editingCustomer) {
      setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? {
        ...c,
        name: customerForm.name,
        type: customerForm.type,
        tier: customerForm.tier,
        companyName: customerForm.companyName,
        email: customerForm.email,
        phone: customerForm.phone,
        creditLimit: Number(customerForm.creditLimit),
        outstandingBalance: Number(customerForm.outstandingBalance),
        kraPin: customerForm.kraPin,
        shippingAddress: customerForm.shippingAddress
      } : c));
    } else {
      const newCustomer: Customer = {
        id: Date.now(),
        name: customerForm.name,
        type: customerForm.type,
        tier: customerForm.tier,
        companyName: customerForm.companyName,
        email: customerForm.email,
        phone: customerForm.phone,
        creditLimit: Number(customerForm.creditLimit),
        outstandingBalance: Number(customerForm.outstandingBalance),
        kraPin: customerForm.kraPin,
        shippingAddress: customerForm.shippingAddress
      };
      setCustomers(prev => [newCustomer, ...prev]);
    }
    setIsCustomerModalOpen(false);
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name || !supplierForm.contactPerson) {
      alert('⚠️ Supplier Name and Contact Person are required!');
      return;
    }

    if (editingSupplier) {
      setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? {
        ...s,
        name: supplierForm.name,
        contactPerson: supplierForm.contactPerson,
        email: supplierForm.email,
        phone: supplierForm.phone
      } : s));
    } else {
      const newSupplier: Supplier = {
        id: Date.now(),
        name: supplierForm.name,
        contactPerson: supplierForm.contactPerson,
        email: supplierForm.email,
        phone: supplierForm.phone
      };
      setSuppliers(prev => [newSupplier, ...prev]);
    }
    setIsSupplierModalOpen(false);
  };

  // Filter application
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.companyName && c.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)
  );

  // ----------------------------------------------------------------------
  // SEAMLESS & ACCURATE EXPORT: Safe Blob Trigger
  // ----------------------------------------------------------------------
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let prefix = '';

    if (activeTab === 'Customers') {
      prefix = 'customers';
      headers = ['Name', 'Type', 'Tier', 'Company Name', 'Email', 'Phone', 'Credit Limit', 'Outstanding Balance', 'KRA PIN', 'Shipping Address'];
      rows = customers.map(c => [
        c.name,
        c.type,
        c.tier,
        c.companyName || '',
        c.email || '',
        c.phone || '',
        (c.creditLimit || 0).toString(),
        (c.outstandingBalance || 0).toString(),
        c.kraPin || '',
        c.shippingAddress || ''
      ]);
    } else {
      prefix = 'suppliers';
      headers = ['Supplier Name', 'Contact Person', 'Email', 'Phone'];
      rows = suppliers.map(s => [
        s.name,
        s.contactPerson,
        s.email,
        s.phone
      ]);
    }

    const csvContent = "\uFEFF" 
      + [headers.join(","), ...rows.map(row => row.map(cell => {
          const stringVal = String(cell).replace(/"/g, '""');
          return stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('"') 
            ? `"${stringVal}"` 
            : stringVal;
        }).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `masuma_${prefix}_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Draft template download
  const handleDownloadTemplate = () => {
    let headers: string[] = [];
    let sample: string[] = [];
    let filename = '';

    if (activeTab === 'Customers') {
      filename = 'customers_import_template.csv';
      headers = ['Name', 'Type', 'Tier', 'Company Name', 'Email', 'Phone', 'Credit Limit'];
      sample = ['Express Fleet Logistics', 'Credit', 'Wholesale A', 'Express Logistics LLC', 'accounts@expressfleet.co.ke', '0700111222', '450000'];
    } else {
      filename = 'suppliers_import_template.csv';
      headers = ['Supplier Name', 'Contact Person', 'Email', 'Phone'];
      sample = ['Sanko Auto Parts Japan', 'Haruto Takahashi', 'h.takahashi@sankoparts.co.jp', '+81 45-667-8890'];
    }

    const csvContent = "\uFEFF" + [headers.join(","), sample.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ----------------------------------------------------------------------
  // COMPLIANT PARSER & BULK IMPORT VALIDATION
  // ----------------------------------------------------------------------
  const parseCSVText = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentCell = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(currentCell.trim());
        lines.push(row);
        row = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    if (currentCell || row.length > 0) {
      row.push(currentCell.trim());
      lines.push(row);
    }
    return lines.filter(r => r.length > 0 && r.some(cell => cell !== ''));
  };

  const handleFileUpload = (content: string) => {
    try {
      const parsedRows = parseCSVText(content);
      if (parsedRows.length < 2) {
        setImportFeedback({ status: 'error', message: '⚠️ CSV file is empty or missing proper headers.' });
        return;
      }

      const headers = parsedRows[0];
      const dataRows = parsedRows.slice(1);

      // Create mapping index
      const headerIndexes: Record<string, number> = {};
      headers.forEach((header, index) => {
        const key = header.toLowerCase().replace(/[^a-z0-9]/g, '');
        headerIndexes[key] = index;
      });

      const getVal = (row: string[], aliases: string[]) => {
        for (const alias of aliases) {
          const normalized = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
          const idx = headerIndexes[normalized];
          if (idx !== undefined && row[idx] !== undefined) {
            return row[idx];
          }
        }
        return '';
      };

      if (activeTab === 'Customers') {
        const parsedCusts: Customer[] = dataRows.map((row, rIdx) => {
          const name = getVal(row, ['name', 'customername', 'fullname', 'contactname']);
          const typeVal = getVal(row, ['type', 'customertype', 'accounttype']) || 'Credit';
          const type = (typeVal.toLowerCase().includes('cash')) ? 'Cash' as const : 'Credit' as const;

          const tierVal = getVal(row, ['tier', 'level', 'marketuptier', 'customertier', 'rating']) || 'Wholesale B';
          let tier: 'Retail' | 'Wholesale A' | 'Wholesale B' = 'Wholesale B';
          if (tierVal.toLowerCase().includes('retail')) tier = 'Retail';
          else if (tierVal.toLowerCase().includes('wholesale a') || tierVal.toLowerCase() === 'a') tier = 'Wholesale A';
          else if (tierVal.toLowerCase().includes('wholesale b') || tierVal.toLowerCase() === 'b') tier = 'Wholesale B';

          const companyName = getVal(row, ['company', 'companyname', 'business', 'orgname']);
          const email = getVal(row, ['email', 'emailaddress', 'mailing']);
          const phone = getVal(row, ['phone', 'phonenumber', 'telephone', 'cellphone']);

          const rawLimit = getVal(row, ['creditlimit', 'limit', 'limitcredit', 'allowance']);
          const creditLimit = Math.max(0, parseInt(rawLimit.replace(/[^0-9]/g, ''), 10) || 100000);

          const rawBalance = getVal(row, ['outstandingbalance', 'balance', 'due', 'outstanding']);
          const outstandingBalance = Math.max(0, parseInt(rawBalance.replace(/[^0-9]/g, ''), 10) || 0);

          const kraPin = getVal(row, ['krapin', 'taxid', 'pin', 'kra']);
          const shippingAddress = getVal(row, ['shippingaddress', 'address', 'deliveryaddress', 'location', 'shipaddress']);

          return {
            id: Date.now() + rIdx,
            name: name || 'Unnamed Enterprise ' + rIdx,
            type,
            tier,
            companyName: companyName || name || undefined,
            email: email || undefined,
            phone: phone || undefined,
            creditLimit,
            outstandingBalance,
            kraPin: kraPin || undefined,
            shippingAddress: shippingAddress || undefined
          };
        });

        setImportPreviewCustomers(parsedCusts);
        setImportFeedback({
          status: 'success',
          message: `Linked & parsed ${parsedCusts.length} B2B Customers successfully. Preview dataset below and lock save!`,
          itemsCount: parsedCusts.length
        });
      } else {
        // Suppliers import
        const parsedSupps: Supplier[] = dataRows.map((row, rIdx) => {
          const name = getVal(row, ['suppliername', 'name', 'supplier', 'vendor', 'make']);
          const contactPerson = getVal(row, ['contactperson', 'contact', 'repperson', 'agent', 'person']);
          const email = getVal(row, ['email', 'emailaddress', 'suppmail']);
          const phone = getVal(row, ['phone', 'phonenumber', 'supphone']);

          return {
            id: Date.now() + rIdx,
            name: name || 'Unnamed Supplier ' + rIdx,
            contactPerson: contactPerson || 'Inbound Reception Rep',
            email: email || 'procurement@industrysupplier.net',
            phone: phone || '+254700000000'
          };
        });

        setImportPreviewSuppliers(parsedSupps);
        setImportFeedback({
          status: 'success',
          message: `Linked & parsed ${parsedSupps.length} Supplier manufacturers. Preview dataset and commit master ledger!`,
          itemsCount: parsedSupps.length
        });
      }
    } catch (err: any) {
      setImportFeedback({ status: 'error', message: `⚠️ Internal parsing validation anomaly: ${err.message}` });
    }
  };

  const executeBulkImportConfirm = () => {
    if (activeTab === 'Customers') {
      if (importPreviewCustomers.length === 0) return;
      // Filter out duplicates by company name or customer name if matching exactly, or append
      setCustomers(prev => [...importPreviewCustomers, ...prev]);
      alert(`🎉 CUSTOMERS PORTFOLIO INTEGRATED: Successfully loaded ${importPreviewCustomers.length} corporate credit tiers.`);
    } else {
      if (importPreviewSuppliers.length === 0) return;
      setSuppliers(prev => [...importPreviewSuppliers, ...prev]);
      alert(`🎉 SUPPLIER DIRECTORY LINKED: Successfully deployed ${importPreviewSuppliers.length} global parts manufacturers.`);
    }

    setIsImportModalOpen(false);
    setImportPreviewCustomers([]);
    setImportPreviewSuppliers([]);
    setImportFeedback({ status: 'idle', message: '' });
  };

  // Drag and drop helper binds
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleFileUpload(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleFileUpload(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  // Column definitions for Table
  const customerColumns = [
    { 
      header: 'Company / Individual Name', 
      accessor: (item: Customer) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block">{item.name}</span>
          {item.companyName && (
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-1.5 py-0.5 rounded mt-1 inline-block border border-slate-200 dark:border-slate-700">
              🏢 {item.companyName}
            </span>
          )}
        </div>
      ) 
    },
    { 
      header: 'Finance Tier (Markup Channel)', 
      accessor: (item: Customer) => (
        <div>
          <span className={`px-2 py-0.5 text-xs font-bold rounded-full mr-2 ${item.type === 'Credit' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
            {item.type} Account
          </span>
          <span className="font-semibold text-slate-600 dark:text-slate-400 text-xs">Tier: {item.tier}</span>
        </div>
      )
    },
    { 
      header: 'Corporate Contact', 
      accessor: (item: Customer) => (
        <div className="text-xs">
          <div className="text-slate-800 dark:text-slate-200 font-semibold">{item.email || 'No email registered'}</div>
          <div className="text-slate-405 mt-0.5 font-mono">{item.phone || '- No core phone line -'}</div>
        </div>
      )
    },
    { 
      header: 'Tax ID & Shipping Address', 
      accessor: (item: Customer) => (
        <div className="text-xs space-y-1 max-w-[200px]">
          {item.kraPin ? (
            <div>
              <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
                🏷️ KRA: {item.kraPin}
              </span>
            </div>
          ) : (
            <span className="text-[9px] text-slate-400 italic">No KRA PIN Registered</span>
          )}
          {item.shippingAddress ? (
            <p className="text-slate-600 dark:text-slate-400 leading-tight text-[10px] truncate" title={item.shippingAddress}>
              🚚 {item.shippingAddress}
            </p>
          ) : (
            <p className="text-[9px] text-slate-400 italic">No address registered</p>
          )}
        </div>
      )
    },
    { 
      header: 'Outstanding Balance / Tiers Limit', 
      accessor: (item: Customer) => (
        <div className="text-xs">
          <div className={`font-black text-xs ${item.outstandingBalance && item.outstandingBalance > 0 ? 'text-red-700 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
            {formatPrice(item.outstandingBalance || 0)}
          </div>
          <div className="text-slate-400 mt-0.5">Approved Limit: <strong className="font-mono text-slate-600 dark:text-slate-300">{formatPrice(item.creditLimit || 0)}</strong></div>
        </div>
      )
    },
    { 
      header: 'Operations', 
      accessor: (item: Customer) => (
        <button 
           onClick={() => handleEditCustomerClick(item)}
           className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-605 text-slate-700 dark:text-slate-200 rounded font-bold transition-all text-xs"
         >
            Modify
        </button>
      ) 
    },
  ];

  const supplierColumns = [
    { header: 'Supplier Manufacturer Name', accessor: (item: Supplier) => <span className="font-bold text-slate-900 dark:text-slate-50 text-sm">{item.name}</span> },
    { header: 'Key Liaison (Agent Person)', accessor: (item: Supplier) => <span className="font-semibold text-slate-700 dark:text-slate-300">{item.contactPerson}</span> },
    { header: 'Email Dispatch Portal', accessor: (item: Supplier) => <span className="font-mono text-indigo-600 dark:text-indigo-400">{item.email}</span> },
    { header: 'Direct Telephone Line', accessor: (item: Supplier) => <span className="font-mono font-bold">{item.phone}</span> },
    { 
      header: 'Operations', 
      accessor: (item: Supplier) => (
        <button 
           onClick={() => handleEditSupplierClick(item)}
           className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-605 text-slate-700 dark:text-slate-200 rounded font-bold transition-all text-xs"
        >
           Modify
        </button>
      ) 
    },
  ];

  const customerRowActions: TableRowAction<Customer>[] = [
    {
      label: 'Modify Account Parameters',
      icon: Edit3,
      onClick: (cust) => handleEditCustomerClick(cust),
    },
    {
      label: 'Copy Phone Number',
      icon: Phone,
      hidden: (cust) => !cust.phone,
      onClick: (cust) => {
        if (cust.phone) navigator.clipboard?.writeText(cust.phone);
      },
    },
    {
      label: 'Copy Email Address',
      icon: Mail,
      hidden: (cust) => !cust.email,
      onClick: (cust) => {
        if (cust.email) navigator.clipboard?.writeText(cust.email);
      },
    },
    {
      label: 'Copy KRA PIN',
      icon: Copy,
      hidden: (cust) => !cust.kraPin,
      onClick: (cust) => {
        if (cust.kraPin) navigator.clipboard?.writeText(cust.kraPin);
      },
    },
    {
      label: 'Inspect Account Details',
      icon: FileText,
      onClick: (cust) => {
        handleEditCustomerClick(cust);
      },
    },
  ];

  const supplierRowActions: TableRowAction<Supplier>[] = [
    {
      label: 'Modify Supplier Information',
      icon: Edit3,
      onClick: (supp) => handleEditSupplierClick(supp),
    },
    {
      label: 'Copy Contact Phone',
      icon: Phone,
      hidden: (supp) => !supp.phone,
      onClick: (supp) => {
        if (supp.phone) navigator.clipboard?.writeText(supp.phone);
      },
    },
    {
      label: 'Copy Dispatch Email',
      icon: Mail,
      hidden: (supp) => !supp.email,
      onClick: (supp) => {
        if (supp.email) navigator.clipboard?.writeText(supp.email);
      },
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 pb-12">
      <PageHeader
        title="Contacts & Accounts Directory"
        primaryAction={{ label: activeTab === 'Customers' ? "Add Corporate Customer" : "Add Direct Supplier", onClick: handleOpenAddModal }}
        secondaryActions={[
          { label: `📤 Export ${activeTab} (CSV)`, onClick: handleExportCSV },
          { label: `📥 Import ${activeTab} (Bulk)`, onClick: () => setIsImportModalOpen(true) }
        ]}
      />

      {/* TABS SELECTOR CARDS ROW */}
      <div className="px-4 md:px-8 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Active Tab Customer Box */}
        <button 
          onClick={() => { setActiveTab('Customers'); setSearchTerm(''); }}
          className={`p-5 rounded-xl border text-left flex items-center justify-between transition-all ${activeTab === 'Customers' ? 'bg-white dark:bg-gray-800 border-brand-orange shadow-md ring-1 ring-brand-orange' : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'}`}
        >
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">B2B Corporate Debtors</span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block font-mono">{customers.length} Accounts</span>
            <span className="text-[11px] text-slate-405 mt-2 block hover:underline text-indigo-600">Active credit ledgers & custom markups</span>
          </div>
          <span className="text-3xl">👥</span>
        </button>

        {/* Active Tab Supplier Box */}
        <button 
          onClick={() => { setActiveTab('Suppliers'); setSearchTerm(''); }}
          className={`p-5 rounded-xl border text-left flex items-center justify-between transition-all ${activeTab === 'Suppliers' ? 'bg-white dark:bg-gray-800 border-brand-orange shadow-md ring-1 ring-brand-orange' : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'}`}
        >
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Global OEM Manufacturers</span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block font-mono">{suppliers.length} Factories</span>
            <span className="text-[11px] text-slate-405 mt-2 block hover:underline text-brand-orange">Supply chain dispatch & parts sourcing</span>
          </div>
          <span className="text-3xl">🏭</span>
        </button>

      </div>

      {/* SEARCH AND BULK BUTTONS BAR */}
      <div className="px-4 md:px-8 mt-5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
          Showing: <span className="text-brand-orange uppercase">{activeTab} Directory</span> ({activeTab === 'Customers' ? filteredCustomers.length : filteredSuppliers.length} records found)
        </div>

        <div className="flex gap-2 w-full md:w-auto items-center">
          <div className="relative w-full md:max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()} list...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-orange"
            />
          </div>

          <button 
            onClick={handleExportCSV}
            className="px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-350 shrink-0"
            title="Download formatted CSV records"
          >
            📤 Export
          </button>

          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shrink-0 shadow"
            title="Upload CSV directory"
          >
            📥 Import
          </button>
        </div>
      </div>

      {/* MAIN ACCOUNTS LISTS */}
      <div className="p-4 md:p-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
          {activeTab === 'Customers' ? (
            <Table 
              columns={customerColumns} 
              data={filteredCustomers} 
              onRowClick={(cust) => handleEditCustomerClick(cust)}
              rowActions={customerRowActions}
            />
          ) : (
            <Table 
              columns={supplierColumns} 
              data={filteredSuppliers} 
              onRowClick={(supp) => handleEditSupplierClick(supp)}
              rowActions={supplierRowActions}
            />
          )}
        </div>
      </div>

      {/* CUSTOMER MODAL OVERLAY */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 font-sans text-xs">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700">
               <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {editingCustomer ? '👨‍🔧 Modify Corporate Customer parameters' : '🆕 Add Corporate Credit Customer'}
               </h3>
               <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-405">
                  <X className="w-5 h-5" />
               </button>
            </div>

            <form onSubmit={handleCustomerSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-500">Representative / Account Name *</label>
                  <input 
                    type="text"
                    required
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange"
                    placeholder="e.g. John Doe, Fleet Procurement Manager"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-500">Corporate Registered Match Name</label>
                  <input 
                    type="text"
                    value={customerForm.companyName}
                    onChange={(e) => setCustomerForm({...customerForm, companyName: e.target.value})}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange"
                    placeholder="e.g. John Doe Motors Ltd, AutoFix Inc"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-500">Account Settlement Class</label>
                  <select 
                    value={customerForm.type}
                    onChange={(e) => setCustomerForm({...customerForm, type: e.target.value as 'Cash' | 'Credit'})}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange"
                  >
                    <option value="Credit">Credit Account (Invoice-based)</option>
                    <option value="Cash">Cash Account (Immediate settlement)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-500">Target Markup Tier</label>
                  <select 
                    value={customerForm.tier}
                    onChange={(e) => setCustomerForm({...customerForm, tier: e.target.value as any})}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange"
                  >
                    <option value="Retail">Retail (Highest margin)</option>
                    <option value="Wholesale A">Wholesale Tier A (Standard corp partners)</option>
                    <option value="Wholesale B">Wholesale Tier B (Large-scale fleet distributor)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-500">Direct Contact Email</label>
                  <input 
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange"
                    placeholder="accounts@businessgarage.co.ke"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-500">Validated Mobile Phone</label>
                  <input 
                    type="text"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange font-mono"
                    placeholder="e.g. 0712345678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-500">Approved Credit Ceiling ({settings.currency})</label>
                  <input 
                    type="number"
                    value={customerForm.creditLimit}
                    onChange={(e) => setCustomerForm({...customerForm, creditLimit: Number(e.target.value)})}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-500">Pending Ledger Balance ({settings.currency})</label>
                  <input 
                    type="number"
                    value={customerForm.outstandingBalance}
                    onChange={(e) => setCustomerForm({...customerForm, outstandingBalance: Number(e.target.value)})}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-700/60 pt-3.5">
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-500">KRA PIN (Kenya Revenue Authority Tax ID)</label>
                  <input 
                    type="text"
                    value={customerForm.kraPin}
                    onChange={(e) => setCustomerForm({...customerForm, kraPin: e.target.value.toUpperCase()})}
                    maxLength={11}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange"
                    placeholder="e.g. A012345678B"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-500">Shipping / Delivery Address</label>
                  <textarea 
                    value={customerForm.shippingAddress}
                    onChange={(e) => setCustomerForm({...customerForm, shippingAddress: e.target.value})}
                    rows={2}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange font-medium"
                    placeholder="e.g. Ngong Road, Nairobi or Plot 12, Enterprise Road"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-700">
                <button 
                  type="button" 
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="flex-1 py-2 font-black border border-slate-300 dark:border-slate-600 dark:text-slate-300 rounded text-center uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-brand-orange hover:bg-brand-orange/90 text-white font-black rounded text-center shadow-md uppercase tracking-wider"
                >
                  Confirm Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPPLIER MODAL OVERLAY */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 font-sans text-xs">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700">
               <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {editingSupplier ? '👨‍🔧 Modify OEM Supplier profile' : '🆕 Register Sourcing OEM Supplier'}
               </h3>
               <button onClick={() => setIsSupplierModalOpen(false)} className="text-slate-405">
                  <X className="w-5 h-5" />
               </button>
            </div>

            <form onSubmit={handleSupplierSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-black text-slate-500">Supplier Enterprise Name *</label>
                <input 
                  type="text"
                  required
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange font-bold"
                  placeholder="e.g. Denso Global Parts Ltd"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-slate-500">Key Sourcing Agent Liaison *</label>
                <input 
                  type="text"
                  required
                  value={supplierForm.contactPerson}
                  onChange={(e) => setSupplierForm({...supplierForm, contactPerson: e.target.value})}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange"
                  placeholder="e.g. Yuki Tanaka, Export Manager"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-500">Liaison Rep Email</label>
                  <input 
                    type="email"
                    required
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange font-mono"
                    placeholder="y.tanaka@denso.co.jp"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-500">Direct Telephone / Telex</label>
                  <input 
                    type="text"
                    required
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange font-mono"
                    placeholder="+81 3-1283-9912"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-700">
                <button 
                  type="button" 
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="flex-1 py-2 font-black border border-slate-300 dark:border-slate-600 dark:text-slate-300 rounded text-center uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-brand-orange hover:bg-brand-orange/90 text-white font-black rounded text-center shadow-md uppercase tracking-wider"
                >
                  Register Factory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEAMLESS DYNAMIC CSV DIRECTORY IMPORTER MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-gray-700 font-sans text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">📥 Seamless B2B {activeTab} Directory Importer</h3>
                <p className="text-[11px] text-slate-400 mt-1">Deploy bulk credit ledgers, map aliases, and update contacts data recursively into local cache storage.</p>
              </div>
              <button 
                onClick={() => {
                  setIsImportModalOpen(false); 
                  setImportPreviewCustomers([]); 
                  setImportPreviewSuppliers([]);
                  setImportFeedback({ status: 'idle', message: '' });
                }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              {/* Template instructions and download */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl gap-2 font-mono text-[10.5px]">
                <div>
                  <span className="font-extrabold uppercase text-indigo-600 dark:text-indigo-405 block">CSV Format Guide:</span>
                  {activeTab === 'Customers' ? (
                     <p className="text-slate-450 mt-0.5">Required structure includes: <code className="text-brand-orange">Name, Type, Tier, Company Name, Email, Phone, Credit Limit</code></p>
                  ) : (
                     <p className="text-slate-450 mt-0.5">Required structure includes: <code className="text-brand-orange">Supplier Name, Contact Person, Email, Phone</code></p>
                  )}
                </div>
                <button 
                  onClick={handleDownloadTemplate}
                  className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold rounded border border-indigo-100 dark:border-indigo-900/30 whitespace-nowrap text-[10px]"
                >
                  📥 Download Template
                </button>
              </div>

              {/* Drag and Drop Zone Area */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center transition-all ${dragActive ? 'border-brand-orange bg-orange-50/10' : 'border-slate-300 dark:border-slate-700 hover:border-slate-450'}`}
              >
                <span className="text-4xl mb-2">📁</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Drag and drop your B2B {activeTab.toLowerCase()} csv list here</span>
                <span className="text-slate-400 mt-1 block">or manually select from local storage files</span>

                <label className="mt-4 py-2 px-6 bg-slate-900 hover:bg-slate-850 dark:bg-slate-750 dark:hover:bg-slate-700 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-lg cursor-pointer shadow-md transition-colors">
                  Select CSV File
                  <input 
                    type="file" 
                    accept=".csv"
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {/* Alerts and logs */}
              {importFeedback.status === 'error' && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/30 rounded-xl font-bold">
                  ⚠️ {importFeedback.message}
                </div>
              )}

              {importFeedback.status === 'success' && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30 rounded-xl font-bold">
                  ✓ {importFeedback.message}
                </div>
              )}

              {/* Mapped Row Previews - Customers list */}
              {activeTab === 'Customers' && importPreviewCustomers.length > 0 && (
                <div className="space-y-2">
                  <span className="font-extrabold uppercase text-slate-450 tracking-wider text-[10px] block">👁️ Corporate Accounts Loaded (dry-run):</span>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden overflow-x-auto max-h-48">
                    <table className="w-full text-left font-sans text-[11px]">
                      <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-extrabold">
                        <tr>
                          <th className="p-2.5">Corporate Name</th>
                          <th className="p-2.5">Class / Rating</th>
                          <th className="p-2.5">Email</th>
                          <th className="p-2.5 text-right">Credit Ceiling</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850 bg-white dark:bg-slate-800 dark:text-slate-200">
                        {importPreviewCustomers.slice(0, 5).map((cust, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-bold">
                              <div>{cust.name}</div>
                              {cust.companyName && <span className="text-[9px] text-slate-400 block font-mono">Company: {cust.companyName}</span>}
                            </td>
                            <td className="p-2.5">
                              <span className="p-1 text-[9px] font-black bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded font-mono">
                                {cust.type} • {cust.tier}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono">{cust.email || 'N/A'}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-800 dark:text-white">{formatPrice(cust.creditLimit || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Mapped Row Previews - Suppliers list */}
              {activeTab === 'Suppliers' && importPreviewSuppliers.length > 0 && (
                <div className="space-y-2">
                  <span className="font-extrabold uppercase text-slate-450 tracking-wider text-[10px] block">👁️ Sourcing Factories Loaded (dry-run):</span>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden overflow-x-auto max-h-48">
                    <table className="w-full text-left font-sans text-[11px]">
                      <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-extrabold">
                        <tr>
                          <th className="p-2.5">Manufacturer</th>
                          <th className="p-2.5">Agent Liaison</th>
                          <th className="p-2.5">Rep Email</th>
                          <th className="p-2.5 font-mono">Direct Tel No</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850 bg-white dark:bg-slate-800 dark:text-slate-200">
                        {importPreviewSuppliers.slice(0, 5).map((supp, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-black text-slate-905 dark:text-slate-100">{supp.name}</td>
                            <td className="p-2.5 font-semibold text-slate-600 dark:text-slate-350">{supp.contactPerson}</td>
                            <td className="p-2.5 font-mono text-indigo-600 dark:text-indigo-400">{supp.email}</td>
                            <td className="p-2.5 font-mono">{supp.phone}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between gap-3">
              <button 
                type="button" 
                onClick={() => {
                  setIsImportModalOpen(false); 
                  setImportPreviewCustomers([]); 
                  setImportPreviewSuppliers([]);
                  setImportFeedback({ status: 'idle', message: '' });
                }}
                className="py-2.5 px-6 font-bold text-xs border border-slate-300 dark:border-slate-600 dark:text-slate-300 rounded-lg text-center"
              >
                Cancel
              </button>
              
              <button 
                type="button"
                disabled={activeTab === 'Customers' ? importPreviewCustomers.length === 0 : importPreviewSuppliers.length === 0}
                onClick={executeBulkImportConfirm}
                className="py-2.5 px-8 bg-brand-orange hover:bg-brand-orange/95 disabled:bg-gray-400/50 dark:disabled:bg-slate-850 disabled:text-gray-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all active:scale-95"
              >
                🚀 Confirm & Import {activeTab === 'Customers' ? importPreviewCustomers.length : importPreviewSuppliers.length} records
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Contacts;

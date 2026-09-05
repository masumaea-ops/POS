import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  ChevronDown, 
  Eye, 
  Search, 
  X, 
  CheckCircle, 
  Printer, 
  ShoppingCart, 
  FileCheck, 
  Send,
  Calendar,
  User,
  Plus,
  Trash2,
  Receipt,
  MoreVertical,
  Copy,
  Download,
  MessageSquare,
  Mail,
  Zap,
  RefreshCw,
  Filter,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSystemSettings } from '../contexts/SettingsContext';
import { MOCK_PRODUCTS, MOCK_CUSTOMERS } from '../data/mockData';
import type { Product, Customer } from '../types';

export interface QuotationItem {
  partNumber: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  customer: string;
  customerPhone?: string;
  customerEmail?: string;
  customerDetails?: Customer;
  date: string;
  status: 'Invoiced' | 'Sent' | 'Draft' | 'Declined' | 'Expired';
  amount: number;
  subtotal: number;
  tax: number;
  items: QuotationItem[];
  validUntil: string;
  notes?: string;
  invoiceNumber?: string;
}

const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: '1',
    quoteNumber: 'QUO-1787297966229',
    customer: 'LYDIA',
    customerPhone: '+254 722 100 200',
    customerEmail: 'lydia.auto@gmail.com',
    date: '8/21/2026',
    status: 'Invoiced',
    amount: 5200,
    subtotal: 4482.76,
    tax: 717.24,
    validUntil: '9/21/2026',
    invoiceNumber: 'INV-2026-9481',
    items: [
      { partNumber: 'MS-BP-8812', name: 'Ceramic Front Brake Pads (Toyota Premio/Allion)', quantity: 2, unitPrice: 2600, totalPrice: 5200 }
    ]
  },
  {
    id: '2',
    quoteNumber: 'QUO-1786978833997',
    customer: 'LYDIA',
    customerPhone: '+254 722 100 200',
    date: '8/17/2026',
    status: 'Invoiced',
    amount: 5500,
    subtotal: 4741.38,
    tax: 758.62,
    validUntil: '9/17/2026',
    invoiceNumber: 'INV-2026-9475',
    items: [
      { partNumber: 'MS-OF-4421', name: 'Premium Heavy-Duty Oil Filter Element', quantity: 2, unitPrice: 1200, totalPrice: 2400 },
      { partNumber: 'MS-AF-1102', name: 'Engine Air Cleaner Filter Element', quantity: 1, unitPrice: 3100, totalPrice: 3100 }
    ]
  },
  {
    id: '3',
    quoteNumber: 'QUO-1786953541796',
    customer: 'LYDIA',
    customerPhone: '+254 722 100 200',
    date: '8/17/2026',
    status: 'Invoiced',
    amount: 5500,
    subtotal: 4741.38,
    tax: 758.62,
    validUntil: '9/17/2026',
    invoiceNumber: 'INV-2026-9474',
    items: [
      { partNumber: 'MS-SP-9920', name: 'Iridium Tough Spark Plugs (Set of 4)', quantity: 1, unitPrice: 5500, totalPrice: 5500 }
    ]
  },
  {
    id: '4',
    quoteNumber: 'QUO-1786448778160',
    customer: 'LYDIA',
    customerPhone: '+254 722 100 200',
    date: '8/11/2026',
    status: 'Invoiced',
    amount: 5500,
    subtotal: 4741.38,
    tax: 758.62,
    validUntil: '9/11/2026',
    invoiceNumber: 'INV-2026-9459',
    items: [
      { partNumber: 'MS-TR-5501', name: 'Steering Tie Rod End - Outer Left/Right', quantity: 2, unitPrice: 2750, totalPrice: 5500 }
    ]
  },
  {
    id: '5',
    quoteNumber: 'QUO-1786356318367',
    customer: 'PANK',
    customerPhone: '+254 711 450 780',
    date: '8/10/2026',
    status: 'Draft',
    amount: 4800,
    subtotal: 4137.93,
    tax: 662.07,
    validUntil: '9/10/2026',
    items: [
      { partNumber: 'MS-SL-3304', name: 'Stabilizer Sway Bar Link Bushing Kit', quantity: 2, unitPrice: 2400, totalPrice: 4800 }
    ]
  },
  {
    id: '6',
    quoteNumber: 'QUO-1786350513137',
    customer: 'Ian Makomba',
    customerPhone: '+254 733 980 120',
    customerEmail: 'ian.makomba@autocare.co.ke',
    date: '8/10/2026',
    status: 'Sent',
    amount: 12300,
    subtotal: 10603.45,
    tax: 1696.55,
    validUntil: '9/10/2026',
    items: [
      { partNumber: 'MS-SA-6612', name: 'Hydraulic Gas Shock Absorber (Front LH)', quantity: 1, unitPrice: 6150, totalPrice: 6150 },
      { partNumber: 'MS-SA-6613', name: 'Hydraulic Gas Shock Absorber (Front RH)', quantity: 1, unitPrice: 6150, totalPrice: 6150 }
    ]
  },
  {
    id: '7',
    quoteNumber: 'QUO-1786090400714',
    customer: 'LYDIA',
    customerPhone: '+254 722 100 200',
    date: '8/7/2026',
    status: 'Invoiced',
    amount: 18400,
    subtotal: 15862.07,
    tax: 2537.93,
    validUntil: '9/7/2026',
    invoiceNumber: 'INV-2026-9430',
    items: [
      { partNumber: 'MS-WP-4491', name: 'Engine Water Pump Assembly with Gasket', quantity: 1, unitPrice: 9200, totalPrice: 9200 },
      { partNumber: 'MS-TS-2210', name: 'Thermostat Valve with Housing (82°C)', quantity: 1, unitPrice: 3800, totalPrice: 3800 },
      { partNumber: 'MS-TB-7714', name: 'High-Tensile Timing Belt (142 Teeth)', quantity: 1, unitPrice: 5400, totalPrice: 5400 }
    ]
  },
  {
    id: '8',
    quoteNumber: 'QUO-1785917839675',
    customer: 'LYDIA',
    customerPhone: '+254 722 100 200',
    date: '8/5/2026',
    status: 'Invoiced',
    amount: 12400,
    subtotal: 10689.66,
    tax: 1710.34,
    validUntil: '9/5/2026',
    invoiceNumber: 'INV-2026-9412',
    items: [
      { partNumber: 'MS-CA-5510', name: 'Lower Control Arm with Heavy Duty Ball Joint', quantity: 2, unitPrice: 6200, totalPrice: 12400 }
    ]
  }
];

export const Quotations: React.FC = () => {
  const { settings, formatPrice } = useSystemSettings();
  const navigate = useNavigate();

  // Quotations List State
  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    try {
      const saved = localStorage.getItem('masuma_quotations_list');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_QUOTATIONS;
  });

  // Active top tab: 'All' | 'Draft' | 'Sent' | 'Invoiced' | 'Actions'
  const [activeTab, setActiveTab] = useState<'All' | 'Draft' | 'Sent' | 'Invoiced' | 'Actions'>('All');

  // Filter and Search states
  const [statusFilter, setStatusFilter] = useState<string>('All Statuses');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Row Action Dropdown Menu & Batch Menu
  const [openRowActionId, setOpenRowActionId] = useState<string | null>(null);
  const [batchMenuOpen, setBatchMenuOpen] = useState<boolean>(false);

  // Modals state
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [whatsappModalQuote, setWhatsappModalQuote] = useState<Quotation | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState<string>('');
  const [quickPosQuoteId, setQuickPosQuoteId] = useState<string>('');

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenRowActionId(null);
      setBatchMenuOpen(false);
      setStatusDropdownOpen(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // New Quote Form State
  const [newCustomerName, setNewCustomerName] = useState<string>('LYDIA');
  const [newValidDays, setNewValidDays] = useState<number>(30);
  const [newNotes, setNewNotes] = useState<string>('Standard 30-day warranty on all genuine Masuma autoparts.');
  const [newQuoteItems, setNewQuoteItems] = useState<Array<{ product: Product; quantity: number; unitPrice: number }>>([
    { product: MOCK_PRODUCTS[0], quantity: 2, unitPrice: MOCK_PRODUCTS[0].price }
  ]);

  // Persist quotations to localStorage
  useEffect(() => {
    localStorage.setItem('masuma_quotations_list', JSON.stringify(quotations));
  }, [quotations]);

  // Filtered quotations
  const filteredQuotations = quotations.filter((quote) => {
    let matchesTab = true;
    if (activeTab === 'Draft') matchesTab = quote.status === 'Draft';
    else if (activeTab === 'Sent') matchesTab = quote.status === 'Sent';
    else if (activeTab === 'Invoiced') matchesTab = quote.status === 'Invoiced';

    const matchesStatus = statusFilter === 'All Statuses' || quote.status === statusFilter;
    const matchesSearch = 
      quote.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.customer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesStatus && matchesSearch;
  });

  // Tab counts
  const counts = {
    all: quotations.length,
    draft: quotations.filter(q => q.status === 'Draft').length,
    sent: quotations.filter(q => q.status === 'Sent').length,
    invoiced: quotations.filter(q => q.status === 'Invoiced').length
  };

  // Calculate totals for new quote creation
  const calculatedSubtotal = newQuoteItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const calculatedTax = Math.round(calculatedSubtotal * 0.16);
  const calculatedGrandTotal = calculatedSubtotal + calculatedTax;

  // Handle Add Item Line
  const handleAddLine = () => {
    const defaultProd = MOCK_PRODUCTS[1] || MOCK_PRODUCTS[0];
    setNewQuoteItems([
      ...newQuoteItems,
      { product: defaultProd, quantity: 1, unitPrice: defaultProd.price }
    ]);
  };

  // Handle Remove Item Line
  const handleRemoveLine = (index: number) => {
    if (newQuoteItems.length === 1) return;
    setNewQuoteItems(newQuoteItems.filter((_, i) => i !== index));
  };

  // Handle Create Quote Submit
  const handleCreateQuote = (targetStatus: 'Draft' | 'Sent') => {
    const randomSuffix = Math.floor(100000000000 + Math.random() * 900000000000);
    const quoteNumber = `QUO-178${randomSuffix}`;
    const today = new Date();
    const dateFormatted = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
    
    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + newValidDays);
    const expiryFormatted = `${expiryDate.getMonth() + 1}/${expiryDate.getDate()}/${expiryDate.getFullYear()}`;

    const items: QuotationItem[] = newQuoteItems.map((item) => ({
      partNumber: item.product.sku || `MS-${item.product.id}`,
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.unitPrice * item.quantity
    }));

    const newQuotation: Quotation = {
      id: Date.now().toString(),
      quoteNumber,
      customer: newCustomerName,
      date: dateFormatted,
      status: targetStatus,
      amount: calculatedGrandTotal,
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      items,
      validUntil: expiryFormatted,
      notes: newNotes
    };

    setQuotations([newQuotation, ...quotations]);
    setIsCreateModalOpen(false);
    showToast(`Quotation ${quoteNumber} created as ${targetStatus}!`);

    // Reset Form
    setNewQuoteItems([{ product: MOCK_PRODUCTS[0], quantity: 2, unitPrice: MOCK_PRODUCTS[0].price }]);
    setNewNotes('Standard 30-day warranty on all genuine Masuma autoparts.');
  };

  // Action: Convert Quotation to Invoice
  const handleConvertToInvoice = (quote: Quotation) => {
    const invoiceNum = `INV-2026-${Math.floor(1000 + Math.random() * 8999)}`;
    const updated = quotations.map((q) => {
      if (q.id === quote.id) {
        return {
          ...q,
          status: 'Invoiced' as const,
          invoiceNumber: invoiceNum
        };
      }
      return q;
    });

    setQuotations(updated);
    if (selectedQuote && selectedQuote.id === quote.id) {
      setSelectedQuote({
        ...selectedQuote,
        status: 'Invoiced',
        invoiceNumber: invoiceNum
      });
    }

    // Save into sales orders ledger
    try {
      const existingOrdersRaw = localStorage.getItem('masuma_sales_orders');
      const existingOrders = existingOrdersRaw ? JSON.parse(existingOrdersRaw) : [];
      const newOrder = {
        id: invoiceNum,
        customer: { name: quote.customer, type: 'Cash', tier: 'Retail' },
        date: new Date().toISOString().split('T')[0],
        status: 'Invoiced',
        total: quote.amount,
        items: quote.items.map(i => ({ productName: i.name, quantity: i.quantity, price: i.unitPrice }))
      };
      localStorage.setItem('masuma_sales_orders', JSON.stringify([newOrder, ...existingOrders]));
    } catch {
      // ignore
    }

    showToast(`✅ Converted ${quote.quoteNumber} to Tax Invoice ${invoiceNum}`);
  };

  // Action: Load into POS Cart
  const handleLoadIntoPos = (quote: Quotation) => {
    try {
      const cartItems = quote.items.map((item, idx) => ({
        product: {
          id: 1000 + idx,
          sku: item.partNumber,
          name: item.name,
          category: 'Autoparts',
          price: item.unitPrice,
          costPrice: Math.round(item.unitPrice * 0.7),
          stock: 50,
          binLocation: 'Aisle 2 - Shelf B',
          brand: 'Masuma',
          imageUrl: ''
        },
        quantity: item.quantity
      }));
      sessionStorage.setItem('masuma_pos_quick_cart', JSON.stringify(cartItems));
      showToast(`Loading ${quote.items.length} items from ${quote.quoteNumber} into POS register...`);
      setTimeout(() => navigate('/pos'), 300);
    } catch {
      navigate('/pos');
    }
  };

  // Action: Duplicate Quotation
  const handleDuplicateQuote = (quote: Quotation) => {
    const randomSuffix = Math.floor(100000000000 + Math.random() * 900000000000);
    const newQuoteNum = `QUO-178${randomSuffix}`;
    const today = new Date();
    const dateFormatted = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

    const duplicated: Quotation = {
      ...quote,
      id: Date.now().toString(),
      quoteNumber: newQuoteNum,
      date: dateFormatted,
      status: 'Draft',
      invoiceNumber: undefined
    };

    setQuotations([duplicated, ...quotations]);
    showToast(`📋 Quotation duplicated as Draft: ${newQuoteNum}`);
  };

  // Action: Delete / Void Quotation
  const handleDeleteQuote = (quote: Quotation) => {
    if (confirm(`Are you sure you want to void / delete quotation ${quote.quoteNumber} for ${quote.customer}?`)) {
      setQuotations(quotations.filter(q => q.id !== quote.id));
      if (selectedQuote?.id === quote.id) setSelectedQuote(null);
      showToast(`🗑 Quotation ${quote.quoteNumber} has been removed.`, 'info');
    }
  };

  // Action: Export CSV
  const handleExportCSV = () => {
    const headers = ['Quote Number', 'Customer', 'Date', 'Status', 'Subtotal', 'Tax (16%)', 'Total Amount', 'Invoice Ref'];
    const rows = quotations.map(q => [
      q.quoteNumber,
      `"${q.customer}"`,
      q.date,
      q.status,
      q.subtotal,
      q.tax,
      q.amount,
      q.invoiceNumber || 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `masuma_quotations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 Quotation ledger exported to CSV!');
  };

  // Action: Batch convert all Sent to Invoiced
  const handleBatchInvoice = () => {
    const sentQuotes = quotations.filter(q => q.status === 'Sent');
    if (sentQuotes.length === 0) {
      showToast('No approved or Sent quotations available to convert.', 'info');
      return;
    }

    const updated = quotations.map(q => {
      if (q.status === 'Sent') {
        const invNum = `INV-2026-${Math.floor(1000 + Math.random() * 8999)}`;
        return {
          ...q,
          status: 'Invoiced' as const,
          invoiceNumber: invNum
        };
      }
      return q;
    });

    setQuotations(updated);
    showToast(`✅ Successfully converted ${sentQuotes.length} quotations to Tax Invoices!`);
  };

  // Action: WhatsApp Dispatch
  const handleOpenWhatsApp = (quote: Quotation) => {
    setWhatsappModalQuote(quote);
    setWhatsappPhone(quote.customerPhone || '+254 700 000 000');
  };

  const executeSendWhatsApp = () => {
    if (!whatsappModalQuote) return;
    const itemsText = whatsappModalQuote.items.map(i => `• ${i.name} (${i.partNumber}) x${i.quantity} = KES ${i.totalPrice.toLocaleString()}`).join('\n');
    const msg = `*MASUMA AUTOPARTS EAST AFRICA LTD*\n*Official Quotation: ${whatsappModalQuote.quoteNumber}*\n\nDear ${whatsappModalQuote.customer},\nHere is your requested quotation for genuine Masuma autoparts:\n\n${itemsText}\n\n*Total Amount:* KES ${whatsappModalQuote.amount.toLocaleString()} (Incl. 16% VAT)\n*Valid Until:* ${whatsappModalQuote.validUntil}\n\nThank you for choosing Masuma Autoparts EA Ltd.\nCommercial Street, Industrial Area, Nairobi.`;
    
    const cleanPhone = whatsappPhone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    setWhatsappModalQuote(null);
    showToast('📱 WhatsApp quotation dispatch initiated!');
  };

  // Action: Email Dispatch
  const handleSendEmail = (quote: Quotation) => {
    const subject = encodeURIComponent(`Masuma Autoparts Quotation - ${quote.quoteNumber}`);
    const body = encodeURIComponent(
      `Dear ${quote.customer},\n\nPlease find attached your quotation ${quote.quoteNumber} for genuine Masuma replacement parts.\n\nTotal Amount: KES ${quote.amount.toLocaleString()} (VAT Incl.)\nValid until: ${quote.validUntil}\n\nKind regards,\nTitus Mbaru - Sales Operations\nMasuma Autoparts East Africa Ltd`
    );
    window.location.href = `mailto:${quote.customerEmail || ''}?subject=${subject}&body=${body}`;
    showToast(`✉️ Email draft prepared for ${quote.customer}`);
  };

  // Status Badge Component
  const renderStatusBadge = (status: Quotation['status']) => {
    switch (status) {
      case 'Invoiced':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/60">
            Invoiced
          </span>
        );
      case 'Sent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-950/70 text-blue-400 border border-blue-800/60">
            Sent
          </span>
        );
      case 'Draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Draft
          </span>
        );
      case 'Declined':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-950/70 text-rose-400 border border-rose-800/60">
            Declined
          </span>
        );
      case 'Expired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-950/70 text-amber-400 border border-amber-800/60">
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 bg-[#0b1324] text-white p-6 lg:p-8 overflow-y-auto min-h-screen">
      
      {/* TOAST FEEDBACK NOTIFICATION */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 border border-[#ff5000]/60 shadow-2xl text-xs text-white animate-in slide-in-from-top-3">
          <CheckCircle className="w-4 h-4 text-[#ff5000] shrink-0" />
          <span className="font-semibold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* PAGE HEADER: Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Quotations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official Masuma Autoparts EA B2B Pro-forma Quotations & eTIMS Invoicing Ledger
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer"
            title="Export Quotations to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            id="create_quotation_btn"
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff5000] hover:bg-[#e04700] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Quotation</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER CARD */}
      <div className="bg-[#111c33] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
        
        {/* TABS HEADER BAR: All, Drafts, Sent, Invoiced, and Actions Tab */}
        <div className="border-b border-slate-800 bg-[#0d172e] px-4 pt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('All')}
              className={`px-3.5 py-2 rounded-t-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'All'
                  ? 'bg-[#111c33] text-[#ff5000] border-t-2 border-[#ff5000]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span>All Quotations</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                {counts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('Draft')}
              className={`px-3.5 py-2 rounded-t-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'Draft'
                  ? 'bg-[#111c33] text-[#ff5000] border-t-2 border-[#ff5000]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span>Drafts</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-400 font-mono">
                {counts.draft}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('Sent')}
              className={`px-3.5 py-2 rounded-t-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'Sent'
                  ? 'bg-[#111c33] text-[#ff5000] border-t-2 border-[#ff5000]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span>Sent</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-900/60 text-blue-300 font-mono">
                {counts.sent}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('Invoiced')}
              className={`px-3.5 py-2 rounded-t-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'Invoiced'
                  ? 'bg-[#111c33] text-[#ff5000] border-t-2 border-[#ff5000]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span>Invoiced</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-900/60 text-emerald-300 font-mono">
                {counts.invoiced}
              </span>
            </button>

            {/* DEDICATED ACTIONS TAB */}
            <button
              id="quotations_actions_tab"
              type="button"
              onClick={() => setActiveTab('Actions')}
              className={`px-4 py-2 rounded-t-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'Actions'
                  ? 'bg-[#111c33] text-[#ff5000] border-t-2 border-[#ff5000]'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/20'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <span>Actions & Automation</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#ff5000]/20 text-[#ff5000] font-mono font-black">
                Active
              </span>
            </button>
          </div>

          <div className="pb-2 text-[11px] text-slate-400 hidden md:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>eTIMS Online Sync: Connected</span>
          </div>
        </div>

        {/* CONTENT FOR "ACTIONS" TAB */}
        {activeTab === 'Actions' ? (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0b1324] border border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#ff5000]" />
                  <h3 className="text-sm font-bold text-white">Quotation Actions & Automation Center</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Execute batch actions, convert quotations directly into registered tax invoices, or load quotes straight into the POS register.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBatchInvoice}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Convert All Sent to Invoices</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* ACTION CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Card 1: Fast Transfer to Countertop POS */}
              <div className="p-5 rounded-2xl bg-[#0d172e] border border-slate-800 hover:border-slate-700 transition space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Open Quote in POS</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Select any client quote to immediately push all genuine Masuma parts into the countertop POS cart.
                  </p>
                </div>
                <div className="pt-2">
                  <select
                    value={quickPosQuoteId}
                    onChange={(e) => setQuickPosQuoteId(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-[#0b1324] border border-slate-750 rounded-xl text-white focus:outline-none focus:border-[#ff5000] mb-2"
                  >
                    <option value="">Select a quotation to load...</option>
                    {quotations.map(q => (
                      <option key={q.id} value={q.id}>
                        {q.quoteNumber} — {q.customer} ({formatPrice(q.amount)})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!quickPosQuoteId}
                    onClick={() => {
                      const quote = quotations.find(q => q.id === quickPosQuoteId);
                      if (quote) handleLoadIntoPos(quote);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Load into POS Checkout</span>
                  </button>
                </div>
              </div>

              {/* Card 2: 1-Click WhatsApp Client Dispatch */}
              <div className="p-5 rounded-2xl bg-[#0d172e] border border-slate-800 hover:border-slate-700 transition space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">WhatsApp Dispatch</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Send full itemized pro-forma breakdown with OEM part numbers and pricing directly to customer mobile.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const firstAvailable = quotations.find(q => q.status === 'Sent' || q.status === 'Draft') || quotations[0];
                      if (firstAvailable) handleOpenWhatsApp(firstAvailable);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Launch WhatsApp Dispatcher</span>
                  </button>
                </div>
              </div>

              {/* Card 3: Batch Print Pro-forma Statements */}
              <div className="p-5 rounded-2xl bg-[#0d172e] border border-slate-800 hover:border-slate-700 transition space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Print Quotations Sheet</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Print or generate PDF summaries for all pending, approved, or invoiced orders with Masuma official seal.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Pro-forma Sheet</span>
                  </button>
                </div>
              </div>

            </div>

            {/* PENDING ACTIONS QUEUE */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0d1629]">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Quotations Action Queue (Instant Execution)
                  </h4>
                  <p className="text-[11px] text-slate-400">Click any action to instantly execute workflow.</p>
                </div>
                <span className="text-xs text-slate-400 font-mono">{quotations.length} Active Records</span>
              </div>

              <div className="divide-y divide-slate-800/60">
                {quotations.map(quote => (
                  <div key={quote.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/40 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-white">{quote.quoteNumber}</span>
                        {renderStatusBadge(quote.status)}
                        {quote.invoiceNumber && (
                          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50">
                            Inv: {quote.invoiceNumber}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-3">
                        <span className="font-semibold text-slate-300">{quote.customer}</span>
                        <span>•</span>
                        <span>{quote.items.length} items</span>
                        <span>•</span>
                        <span className="font-mono font-bold text-white">{formatPrice(quote.amount)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedQuote(quote)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLoadIntoPos(quote)}
                        className="px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800/60 text-xs font-medium flex items-center gap-1 cursor-pointer"
                        title="Load into POS cart"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>POS</span>
                      </button>

                      {quote.status !== 'Invoiced' && (
                        <button
                          type="button"
                          onClick={() => handleConvertToInvoice(quote)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 text-xs font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Invoice</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenWhatsApp(quote)}
                        className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-950/50 transition cursor-pointer"
                        title="Send via WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicateQuote(quote)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        title="Duplicate as Draft"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuote(quote)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/50 transition cursor-pointer"
                        title="Delete / Void Quote"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* STANDARD TABLE VIEW FOR ALL, DRAFT, SENT, INVOICED */
          <>
            {/* SUBHEADER & FILTERS */}
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white leading-tight">
                  {activeTab === 'All' ? 'All Quotations' : `${activeTab} Quotations`}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Browse, manage, and execute actions on Masuma pro-forma quotations.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Quick Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search quote # or client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 sm:w-60 h-9 pl-8 pr-3 text-xs bg-[#0b1324] border border-slate-750 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5000]"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>

                {/* Status Dropdown Filter */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    className="h-9 px-3.5 rounded-xl bg-[#0b1324] border border-slate-750 hover:border-slate-600 text-xs font-semibold text-slate-300 flex items-center gap-2 transition cursor-pointer"
                  >
                    <span>{statusFilter}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {statusDropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-40 bg-[#0d172e] border border-slate-700 rounded-xl shadow-2xl py-1.5 z-40">
                      {['All Statuses', 'Invoiced', 'Sent', 'Draft', 'Declined', 'Expired'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            setStatusFilter(st);
                            setStatusDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-1.5 text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                            statusFilter === st
                              ? 'bg-[#ff5000]/15 text-[#ff5000] font-bold'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span>{st}</span>
                          {statusFilter === st && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ff5000]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* QUOTATIONS TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 text-[11px] font-bold uppercase tracking-wider bg-[#0d1629]/50">
                    <th className="py-3.5 px-5">QUOTE #</th>
                    <th className="py-3.5 px-5">CUSTOMER</th>
                    <th className="py-3.5 px-5">DATE</th>
                    <th className="py-3.5 px-5">STATUS</th>
                    <th className="py-3.5 px-5 text-right">AMOUNT</th>
                    
                    {/* ACTIONS HEADER COLUMN WITH BATCH TRIGGER */}
                    <th className="py-3.5 px-5 text-center relative" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1 cursor-pointer group" onClick={() => setBatchMenuOpen(!batchMenuOpen)}>
                        <span className="hover:text-white transition">ACTIONS</span>
                        <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white transition" />
                      </div>

                      {batchMenuOpen && (
                        <div className="absolute right-4 mt-1.5 w-48 bg-[#0d172e] border border-slate-700 rounded-xl shadow-2xl py-1.5 z-40 text-left font-normal normal-case">
                          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800">
                            Batch Actions
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setBatchMenuOpen(false);
                              handleExportCSV();
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-400" />
                            <span>Export All (CSV)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setBatchMenuOpen(false);
                              handleBatchInvoice();
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Invoice All Sent</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setBatchMenuOpen(false);
                              window.print();
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-400" />
                            <span>Print Summary Sheet</span>
                          </button>
                        </div>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredQuotations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                        No quotations found matching your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredQuotations.map((quote) => (
                      <tr
                        key={quote.id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* QUOTE # */}
                        <td className="py-4 px-5 font-mono text-slate-200 font-bold">
                          {quote.quoteNumber}
                        </td>

                        {/* CUSTOMER */}
                        <td className="py-4 px-5 font-semibold text-slate-200">
                          {quote.customer}
                        </td>

                        {/* DATE */}
                        <td className="py-4 px-5 text-slate-400 font-mono">
                          {quote.date}
                        </td>

                        {/* STATUS */}
                        <td className="py-4 px-5">
                          {renderStatusBadge(quote.status)}
                        </td>

                        {/* AMOUNT */}
                        <td className="py-4 px-5 text-right font-mono font-bold text-slate-100">
                          {formatPrice(quote.amount)}
                        </td>

                        {/* ACTIONS COLUMN: FULLY FUNCTIONAL DROPDOWN + QUICK BUTTONS */}
                        <td className="py-4 px-5 text-center relative" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            
                            {/* Primary Action 1: View Quotation */}
                            <button
                              type="button"
                              onClick={() => setSelectedQuote(quote)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-750 transition cursor-pointer"
                              title="View Quotation Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Primary Action 2: Open in POS */}
                            <button
                              type="button"
                              onClick={() => handleLoadIntoPos(quote)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-750 transition cursor-pointer"
                              title="Load items into POS Register"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>

                            {/* Primary Action 3: Convert to Invoice if not invoiced */}
                            {quote.status !== 'Invoiced' && (
                              <button
                                type="button"
                                onClick={() => handleConvertToInvoice(quote)}
                                className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50 transition cursor-pointer"
                                title="Convert to Tax Invoice"
                              >
                                <FileCheck className="w-4 h-4" />
                              </button>
                            )}

                            {/* Primary Action 4: Quick Action Menu Button */}
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={() => setOpenRowActionId(openRowActionId === quote.id ? null : quote.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-750 transition cursor-pointer flex items-center"
                                title="More Actions"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {/* FLOATING ROW ACTIONS MENU */}
                              {openRowActionId === quote.id && (
                                <div className="absolute right-0 mt-1 w-52 bg-[#0d172e] border border-slate-700 rounded-xl shadow-2xl py-1.5 z-40 text-left font-sans animate-in fade-in">
                                  <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                                    Quotation Actions
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenRowActionId(null);
                                      setSelectedQuote(quote);
                                    }}
                                    className="w-full text-left px-3.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                                    <span>View Pro-forma</span>
                                  </button>

                                  {quote.status !== 'Invoiced' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenRowActionId(null);
                                        handleConvertToInvoice(quote);
                                      }}
                                      className="w-full text-left px-3.5 py-1.5 text-xs text-emerald-400 hover:bg-emerald-950/60 flex items-center gap-2.5 cursor-pointer font-semibold"
                                    >
                                      <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>Convert to Tax Invoice</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenRowActionId(null);
                                      handleLoadIntoPos(quote);
                                    }}
                                    className="w-full text-left px-3.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 cursor-pointer"
                                  >
                                    <ShoppingCart className="w-3.5 h-3.5 text-blue-400" />
                                    <span>Load in POS Register</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenRowActionId(null);
                                      handleOpenWhatsApp(quote);
                                    }}
                                    className="w-full text-left px-3.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 cursor-pointer"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Send via WhatsApp</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenRowActionId(null);
                                      handleSendEmail(quote);
                                    }}
                                    className="w-full text-left px-3.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 cursor-pointer"
                                  >
                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Send via Email</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenRowActionId(null);
                                      window.print();
                                    }}
                                    className="w-full text-left px-3.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 cursor-pointer"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Print Quotation Sheet</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenRowActionId(null);
                                      handleDuplicateQuote(quote);
                                    }}
                                    className="w-full text-left px-3.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Duplicate as Draft</span>
                                  </button>

                                  <div className="border-t border-slate-800 my-1" />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenRowActionId(null);
                                      handleDeleteQuote(quote);
                                    }}
                                    className="w-full text-left px-3.5 py-1.5 text-xs text-rose-400 hover:bg-rose-950/50 flex items-center gap-2.5 cursor-pointer font-medium"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Void / Delete Quote</span>
                                  </button>

                                </div>
                              )}
                            </div>

                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>

      {/* MODAL: VIEW / INSPECT QUOTATION */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#111c33] border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#ff5000] uppercase tracking-wider">
                  Quotation Details
                </span>
                <h3 className="text-xl font-black text-white font-mono">
                  {selectedQuote.quoteNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuote(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              
              {/* Metadata row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#0b1324] border border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">{selectedQuote.customer}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Issue Date</span>
                  <span className="text-sm font-mono text-slate-200 mt-0.5 block">{selectedQuote.date}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Valid Until</span>
                  <span className="text-sm font-mono text-slate-200 mt-0.5 block">{selectedQuote.validUntil}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                  <div className="mt-1">{renderStatusBadge(selectedQuote.status)}</div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Quotation Line Items
                </h4>
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0b1324]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase bg-slate-900/60">
                        <th className="py-2.5 px-4">Item & Part Number</th>
                        <th className="py-2.5 px-4 text-center">Qty</th>
                        <th className="py-2.5 px-4 text-right">Unit Price</th>
                        <th className="py-2.5 px-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-sans">
                      {selectedQuote.items.map((item, idx) => (
                        <tr key={idx} className="text-slate-200">
                          <td className="py-3 px-4">
                            <span className="font-semibold block text-white">{item.name}</span>
                            <span className="text-[11px] font-mono text-slate-400">{item.partNumber}</span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono">
                            {item.quantity}
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            {formatPrice(item.unitPrice)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-white">
                            {formatPrice(item.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-4 rounded-xl bg-[#0b1324] border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-200">{formatPrice(selectedQuote.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>VAT (16% KRA eTIMS standard):</span>
                  <span className="font-mono text-slate-200">{formatPrice(selectedQuote.tax)}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-white">
                  <span>Grand Total:</span>
                  <span className="text-[#ff5000]">{formatPrice(selectedQuote.amount)}</span>
                </div>
              </div>

              {/* Invoice Cross-Reference if invoiced */}
              {selectedQuote.invoiceNumber && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between text-emerald-300">
                  <span className="font-semibold">Associated Tax Invoice:</span>
                  <span className="font-mono font-bold">{selectedQuote.invoiceNumber}</span>
                </div>
              )}

              {/* Notes */}
              {selectedQuote.notes && (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
                  <span className="font-semibold text-slate-300 block mb-1">Terms & Notes:</span>
                  <p>{selectedQuote.notes}</p>
                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-800 bg-[#0d1629] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Quote</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLoadIntoPos(selectedQuote)}
                  className="px-3 py-2 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-800/60 text-blue-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  title="Open items directly in POS register"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Open in POS</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp(selectedQuote)}
                  className="px-3 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedQuote.status !== 'Invoiced' && (
                  <button
                    type="button"
                    onClick={() => handleConvertToInvoice(selectedQuote)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Convert to Invoice</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedQuote(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: WHATSAPP DISPATCH */}
      {whatsappModalQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#111c33] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Send Quotation via WhatsApp</h3>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappModalQuote(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Customer Mobile Number</label>
                <input
                  type="text"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="+254 7XX XXX XXX"
                  className="w-full p-2.5 rounded-xl bg-[#0b1324] border border-slate-750 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#0b1324] border border-slate-800 space-y-1 text-slate-300 text-[11px]">
                <span className="font-bold text-white block mb-1">Message Preview:</span>
                <p className="font-mono text-slate-400">
                  MASUMA AUTOPARTS EA: Official Quote {whatsappModalQuote.quoteNumber} for {whatsappModalQuote.customer}.
                  Total: {formatPrice(whatsappModalQuote.amount)} ({whatsappModalQuote.items.length} parts).
                </p>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-800 bg-[#0d1629] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setWhatsappModalQuote(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSendWhatsApp}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE QUOTATION */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#111c33] border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">
                  Create New Quotation
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Prepare pro-forma quotation for retail or wholesale clients.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Customer and Validity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Customer / Client Name
                  </label>
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="e.g. LYDIA or PANK"
                    className="w-full p-3 rounded-xl bg-[#0b1324] border border-slate-750 text-white text-xs focus:outline-none focus:border-[#ff5000]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Quotation Validity (Days)
                  </label>
                  <select
                    value={newValidDays}
                    onChange={(e) => setNewValidDays(Number(e.target.value))}
                    className="w-full p-3 rounded-xl bg-[#0b1324] border border-slate-750 text-white text-xs focus:outline-none focus:border-[#ff5000]"
                  >
                    <option value={14}>14 Days (Standard Retail)</option>
                    <option value={30}>30 Days (Corporate / Fleet)</option>
                    <option value={60}>60 Days (Wholesale Contract)</option>
                  </select>
                </div>
              </div>

              {/* Line items header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-300 font-semibold block">
                    Part Line Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs text-[#ff5000] hover:text-[#e04700] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {newQuoteItems.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl bg-[#0b1324] border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                    >
                      {/* Product Selector */}
                      <div className="flex-1">
                        <select
                          value={item.product.id}
                          onChange={(e) => {
                            const prod = MOCK_PRODUCTS.find(p => p.id === Number(e.target.value)) || MOCK_PRODUCTS[0];
                            const updated = [...newQuoteItems];
                            updated[index] = { product: prod, quantity: item.quantity, unitPrice: prod.price };
                            setNewQuoteItems(updated);
                          }}
                          className="w-full p-2 rounded-lg bg-[#111c33] border border-slate-750 text-white text-xs focus:outline-none focus:border-[#ff5000]"
                        >
                          {MOCK_PRODUCTS.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              {prod.sku} — {prod.name} ({formatPrice(prod.price)})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="w-20">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => {
                            const qty = Math.max(1, Number(e.target.value) || 1);
                            const updated = [...newQuoteItems];
                            updated[index].quantity = qty;
                            setNewQuoteItems(updated);
                          }}
                          className="w-full p-2 text-center rounded-lg bg-[#111c33] border border-slate-750 text-white text-xs font-mono focus:outline-none focus:border-[#ff5000]"
                          placeholder="Qty"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="w-28 text-right font-mono text-slate-200 self-center">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </div>

                      {/* Remove Line */}
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(index)}
                        disabled={newQuoteItems.length === 1}
                        className="p-2 text-slate-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer self-center"
                        title="Remove Line"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Terms & Conditions
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#0b1324] border border-slate-750 text-white text-xs focus:outline-none focus:border-[#ff5000]"
                />
              </div>

              {/* Calculation bar */}
              <div className="p-4 rounded-xl bg-[#0b1324] border border-slate-800 flex justify-between items-center text-xs font-mono">
                <div className="text-slate-400">
                  <span>Subtotal: {formatPrice(calculatedSubtotal)}</span>
                  <span className="mx-2">|</span>
                  <span>16% VAT: {formatPrice(calculatedTax)}</span>
                </div>
                <div className="text-base font-bold text-white">
                  Grand Total: <span className="text-[#ff5000]">{formatPrice(calculatedGrandTotal)}</span>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-[#0d1629] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleCreateQuote('Draft')}
                className="px-4 py-2 rounded-xl bg-slate-750 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                Save as Draft
              </button>

              <button
                type="button"
                onClick={() => handleCreateQuote('Sent')}
                className="px-5 py-2 rounded-xl bg-[#ff5000] hover:bg-[#e04700] text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Save & Issue Quote</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Quotations;

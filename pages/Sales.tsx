import React, { useState, useEffect } from 'react';
import PageHeader from '../components/shared/PageHeader';
import Tabs from '../components/shared/Tabs';
import Table, { TableRowAction } from '../components/shared/Table';
import { MOCK_SALE_ORDERS, MOCK_CUSTOMERS, MOCK_PRODUCTS } from '../data/mockData';
import type { SaleOrder, Customer, Product, SalesReturn } from '../types';
import { X, RefreshCw, FileText, ClipboardList, Printer, Eye, ArrowRight, Copy } from 'lucide-react';
import { useSystemSettings } from '../contexts/SettingsContext';

const Sales: React.FC = () => {
  const { settings, formatPrice } = useSystemSettings();
  const tabs = ["Quotes", "Orders", "Invoices", "Returns"];
  const [salesOrders, setSalesOrders] = useState<SaleOrder[]>(MOCK_SALE_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<SaleOrder | null>(null);
  
  // Quote Preparation States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [targetCustomer, setTargetCustomer] = useState<Customer>(MOCK_CUSTOMERS[1] || MOCK_CUSTOMERS[0]);
  const [quoteLines, setQuoteLines] = useState<Array<{ product: Product; quantity: number }>>([
    { product: MOCK_PRODUCTS[0], quantity: 5 }
  ]);

  // Returns & RMA States
  const [returns, setReturns] = useState<SalesReturn[]>(() => {
    const saved = localStorage.getItem('masuma_sales_returns');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'SR-2026-001',
        invoiceId: 'INV-2024-098',
        customer: MOCK_CUSTOMERS[3] || MOCK_CUSTOMERS[0],
        date: '2026-06-28',
        items: [
          { productName: 'Engine Oil Filter', quantity: 5, refundAmount: 4800, condition: 'Defective' }
        ],
        totalRefund: 4800,
        status: 'Approved',
        resolution: 'Credit Note',
        notes: 'Seal defective on batch. Credited to client account.'
      },
      {
        id: 'SR-2026-002',
        invoiceId: 'INV-2024-097',
        customer: MOCK_CUSTOMERS[1] || MOCK_CUSTOMERS[0],
        date: '2026-06-29',
        items: [
          { productName: 'Tie Rod End', quantity: 2, refundAmount: 6720, condition: 'Restockable' }
        ],
        totalRefund: 6720,
        status: 'Pending',
        resolution: 'Replacement',
        notes: 'Client ordered incorrect model size. Restocking and preparing zero-value replacement order.'
      }
    ];
  });

  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null);
  const [isReturnCreateOpen, setIsReturnCreateOpen] = useState(false);

  // Return Creation Form States
  const [retInvoiceId, setRetInvoiceId] = useState('');
  const [retCustomer, setRetCustomer] = useState<Customer>(MOCK_CUSTOMERS[1] || MOCK_CUSTOMERS[0]);
  const [retItems, setRetItems] = useState<Array<{ product: Product; quantity: number; refundAmount: number; condition: 'Restockable' | 'Defective' | 'Scrap' }>>([
    { product: MOCK_PRODUCTS[0], quantity: 1, refundAmount: MOCK_PRODUCTS[0].price, condition: 'Restockable' }
  ]);
  const [retResolution, setRetResolution] = useState<'Refund' | 'Replacement' | 'Credit Note'>('Credit Note');
  const [retNotes, setRetNotes] = useState('');

  useEffect(() => {
    localStorage.setItem('masuma_sales_returns', JSON.stringify(returns));
  }, [returns]);

  const addReturnLine = () => {
    setRetItems([...retItems, { product: MOCK_PRODUCTS[1] || MOCK_PRODUCTS[0], quantity: 1, refundAmount: (MOCK_PRODUCTS[1] || MOCK_PRODUCTS[0]).price, condition: 'Restockable' }]);
  };

  const removeReturnLine = (idx: number) => {
    if (retItems.length === 1) return;
    setRetItems(retItems.filter((_, i) => i !== idx));
  };

  const handleReturnProductChange = (index: number, prodId: number) => {
    const prod = MOCK_PRODUCTS.find(p => p.id === prodId);
    if (!prod) return;
    const updated = [...retItems];
    updated[index].product = prod;
    updated[index].refundAmount = prod.price * updated[index].quantity;
    setRetItems(updated);
  };

  const handleReturnQtyChange = (index: number, qty: number) => {
    const updated = [...retItems];
    updated[index].quantity = qty;
    updated[index].refundAmount = updated[index].product.price * qty;
    setRetItems(updated);
  };

  const handleReturnConditionChange = (index: number, cond: 'Restockable' | 'Defective' | 'Scrap') => {
    const updated = [...retItems];
    updated[index].condition = cond;
    setRetItems(updated);
  };

  const handleReturnValuationChange = (index: number, val: number) => {
    const updated = [...retItems];
    updated[index].refundAmount = val;
    setRetItems(updated);
  };

  const handleSaveReturn = (e: React.FormEvent) => {
    e.preventDefault();

    const returnId = `SR-2026-${Math.floor(100 + Math.random() * 899)}`;
    const totalValuation = retItems.reduce((acc, item) => acc + item.refundAmount, 0);

    const newReturn: SalesReturn = {
      id: returnId,
      invoiceId: retInvoiceId || `INV-2026-${Math.floor(1000 + Math.random() * 8999)}`,
      customer: retCustomer,
      date: new Date().toISOString().split('T')[0],
      items: retItems.map(item => ({
        productName: item.product.name,
        quantity: item.quantity,
        refundAmount: item.refundAmount,
        condition: item.condition
      })),
      totalRefund: totalValuation,
      status: 'Pending',
      resolution: retResolution,
      notes: retNotes
    };

    setReturns([newReturn, ...returns]);
    setIsReturnCreateOpen(false);

    // Reset Form
    setRetInvoiceId('');
    setRetNotes('');
    setRetItems([{ product: MOCK_PRODUCTS[0], quantity: 1, refundAmount: MOCK_PRODUCTS[0].price, condition: 'Restockable' }]);

    alert(`🔄 RMA WAYBILL CREATED:\nReturn merchandise authorization ${returnId} has been drafted in 'Pending' status.`);
  };

  const handleApproveReturn = (ret: SalesReturn) => {
    // Update return status
    const updatedReturns = returns.map(r => {
      if (r.id === ret.id) {
        return { ...r, status: 'Approved' as const };
      }
      return r;
    });
    setReturns(updatedReturns);

    if (ret.resolution === 'Credit Note') {
      // Deduct from customer's outstanding debt
      const savedCustomersStr = localStorage.getItem('masuma_customers');
      let currentCustomers: Customer[] = savedCustomersStr ? JSON.parse(savedCustomersStr) : MOCK_CUSTOMERS;
      
      const updatedCustomers = currentCustomers.map(c => {
        if (c.name === ret.customer.name) {
          const currentBal = c.outstandingBalance || 0;
          const newBal = Math.max(0, currentBal - ret.totalRefund);
          return { ...c, outstandingBalance: newBal };
        }
        return c;
      });
      localStorage.setItem('masuma_customers', JSON.stringify(updatedCustomers));
      
      alert(`⚡ CREDIT NOTE APPLIED:\nCredit note generated for ${ret.customer.name}.\nRefund Value: ${formatPrice(ret.totalRefund)}\nOutstanding balance reduced for client.\nLocal eTIMS tax ledger updated.`);
    } else if (ret.resolution === 'Refund') {
      alert(`💵 REFUND ISSUED:\nCash refund of ${formatPrice(ret.totalRefund)} registered in general cash ledger.`);
    } else if (ret.resolution === 'Replacement') {
      alert(`🚚 REPLACEMENT CYCLE INITIALIZED:\nReplacement order generated and sent to warehouse.\nItems: ${ret.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}`);
    }

    if (selectedReturn?.id === ret.id) {
      setSelectedReturn({ ...ret, status: 'Approved' });
    }
  };

  const handleRejectReturn = (ret: SalesReturn) => {
    const updatedReturns = returns.map(r => {
      if (r.id === ret.id) {
        return { ...r, status: 'Rejected' as const };
      }
      return r;
    });
    setReturns(updatedReturns);
    if (selectedReturn?.id === ret.id) {
      setSelectedReturn({ ...ret, status: 'Rejected' });
    }
    alert(`❌ RMA REJECTED:\nReturn merchandise authorization ${ret.id} rejected.`);
  };

  const returnColumns = [
    {
      header: 'Return Code',
      accessor: (item: SalesReturn) => (
        <button 
          onClick={() => setSelectedReturn(item)}
          className="font-mono font-black text-brand-orange hover:underline text-left block animate-fade-in"
        >
          🔄 {item.id}
        </button>
      )
    },
    {
      header: 'B2B Client Customer',
      accessor: (item: SalesReturn) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">{item.customer.name}</span>
          <span className="text-[10px] text-slate-400 block font-mono">Invoice: {item.invoiceId}</span>
        </div>
      )
    },
    {
      header: 'Return Date',
      accessor: (item: SalesReturn) => (
        <span className="font-mono text-xs">{item.date}</span>
      )
    },
    {
      header: 'Resolution',
      accessor: (item: SalesReturn) => {
        const resolutionColors = {
          'Credit Note': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/45 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/30',
          'Refund': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-955/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/30',
          'Replacement': 'bg-amber-100 text-amber-800 dark:bg-amber-955/45 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/30'
        };
        return (
          <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md border ${resolutionColors[item.resolution]}`}>
            {item.resolution}
          </span>
        );
      }
    },
    {
      header: 'Gross Credit Value',
      accessor: (item: SalesReturn) => (
        <span className="font-mono font-bold text-slate-900 dark:text-gray-100">
          {formatPrice(item.totalRefund)}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (item: SalesReturn) => {
        const statusColors = {
          'Pending': 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
          'Approved': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-955/40 dark:text-emerald-300 border border-emerald-250 dark:border-emerald-900/30',
          'Rejected': 'bg-rose-100 text-rose-800 dark:bg-rose-955/40 dark:text-rose-300 border border-rose-250 dark:border-rose-900/30',
          'Refunded': 'bg-sky-100 text-sky-850 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-250 dark:border-sky-900/30'
        };
        return (
          <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md border ${statusColors[item.status]}`}>
            {item.status}
          </span>
        );
      }
    },
    {
      header: 'Operation Control',
      accessor: (item: SalesReturn) => (
        <div className="flex gap-2 justify-center">
          <button 
            onClick={() => setSelectedReturn(item)}
            className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded font-bold"
          >
            Review & Process
          </button>
        </div>
      )
    }
  ];


  const getStatusBadge = (status: SaleOrder['status']) => {
    const statusClasses = {
        'Quote': 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-900/30',
        'Order': 'bg-amber-100 text-amber-800 dark:bg-amber-955/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30',
        'Invoiced': 'bg-pink-100 text-pink-800 dark:bg-pink-955/40 dark:text-pink-300 border border-pink-200 dark:border-pink-900/30',
        'Paid': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-955/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/30'
    };
    return <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${statusClasses[status]}`}>{status}</span>;
  };

  // Convert Quote to standard Tax Invoice
  const handleConvertToInvoice = (orderId: string) => {
    setSalesOrders(prev => prev.map(order => {
        if (order.id === orderId) {
            const updated = { ...order, status: 'Invoiced' as const };
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(updated);
            }
            return updated;
        }
        return order;
    }));
    
    // Tax compliance Alert using localized configs
    alert(`⚡ PRO-FORMA CONVERTED SUCCESSFULLY:\nStatus modified to "Invoiced".\nSynchronized with local tax eTIMS compliance node.\nDevice FSC Serial: ${settings.deviceSerial}\nEntity Base: ${settings.corpName}`);
  };

  const addQuoteLine = () => {
    setQuoteLines([...quoteLines, { product: MOCK_PRODUCTS[1] || MOCK_PRODUCTS[0], quantity: 2 }]);
  };

  const removeQuoteLine = (idx: number) => {
    if (quoteLines.length === 1) return;
    setQuoteLines(quoteLines.filter((_, i) => i !== idx));
  };

  const handleProductChange = (index: number, prodId: number) => {
    const prod = MOCK_PRODUCTS.find(p => p.id === prodId);
    if (!prod) return;
    const updated = [...quoteLines];
    updated[index].product = prod;
    setQuoteLines(updated);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const updated = [...quoteLines];
    updated[index].quantity = qty;
    setQuoteLines(updated);
  };

  // Create Quote Draft
  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();

    const lineTotal = quoteLines.reduce((acc, line) => {
      // Apply tier pricing calculation
      let unitPrice = line.product.price;
      if (targetCustomer.tier === 'Wholesale A') {
        unitPrice = Math.round(line.product.price * 0.85);
      } else if (targetCustomer.tier === 'Wholesale B') {
        unitPrice = Math.round(line.product.price * 0.90);
      }
      return acc + (unitPrice * line.quantity);
    }, 0);

    const generatedItems = quoteLines.map(line => {
      let unitPrice = line.product.price;
      if (targetCustomer.tier === 'Wholesale A') {
        unitPrice = Math.round(line.product.price * 0.85);
      } else if (targetCustomer.tier === 'Wholesale B') {
        unitPrice = Math.round(line.product.price * 0.90);
      }
      return {
        productName: line.product.name,
        quantity: line.quantity,
        price: unitPrice
      };
    });

    const newQuote: SaleOrder = {
      id: `QT-2026-${Math.floor(100 + Math.random() * 899)}`,
      customer: targetCustomer,
      date: new Date().toISOString().split('T')[0],
      status: 'Quote',
      total: lineTotal,
      items: generatedItems
    };

    setSalesOrders([newQuote, ...salesOrders]);
    setIsCreateOpen(false);
    // Reset wizard
    setQuoteLines([{ product: MOCK_PRODUCTS[0], quantity: 5 }]);
  };

  const columns = [
    { 
      header: 'Reference Code', 
      accessor: (item: SaleOrder) => (
        <button 
           onClick={() => setSelectedOrder(item)} 
           className="font-black text-brand-orange hover:underline font-mono"
        >
           📄 {item.id}
        </button>
      ) 
    },
    { header: 'B2B Client Merchant', accessor: (item: SaleOrder) => <span className="font-bold text-slate-800 dark:text-zinc-150">{item.customer.name}</span> },
    { header: 'Billing Date', accessor: (item: SaleOrder) => <span className="font-mono text-xs">{item.date}</span> },
    { header: 'Trading State', accessor: (item: SaleOrder) => getStatusBadge(item.status) },
    { 
      header: `Gross Total (${settings.vatRate}% VAT Inc.)`, 
      accessor: (item: SaleOrder) => (
        <span className="font-mono font-bold text-slate-900 dark:text-gray-50 text-right block pr-4">
           {formatPrice(item.total)}
        </span>
      )
    },
    {
      header: 'Interactive Control',
      accessor: (item: SaleOrder) => (
        <div className="flex gap-2 justify-center">
           <button 
             onClick={() => setSelectedOrder(item)}
             className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded font-bold"
           >
             View Document
           </button>
           {item.status === 'Quote' && (
             <button 
               onClick={() => handleConvertToInvoice(item.id)}
               className="px-2.5 py-1 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded font-bold"
             >
               Convert to Invoice
             </button>
           )}
        </div>
      )
    }
  ];

  const renderContent = (activeTab: string) => {
    if (activeTab === 'Returns') {
      const totalProcessed = returns.length;
      const totalApprovedCredit = returns.filter(r => r.status === 'Approved').reduce((acc, r) => acc + r.totalRefund, 0);
      const pendingCount = returns.filter(r => r.status === 'Pending').length;
      const restockedCount = returns.filter(r => r.status === 'Approved').flatMap(r => r.items).filter(i => i.condition === 'Restockable').reduce((acc, i) => acc + i.quantity, 0);

      return (
        <div className="space-y-6 mt-4">
          {/* Returns Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">Total Authorized Returns</span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">{totalProcessed}</span>
              <span className="text-[10px] text-slate-450 block mt-1">Life-time RMA claims</span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">Approved Credit Notes</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{formatPrice(totalApprovedCredit)}</span>
              <span className="text-[10px] text-slate-450 block mt-1">Deducted from customer accounts</span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">Pending Approval</span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{pendingCount}</span>
              <span className="text-[10px] text-slate-450 block mt-1">Requires quarantine inspection</span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">Restocked Parts</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{restockedCount} pcs</span>
              <span className="text-[10px] text-slate-450 block mt-1">Returned to active warehouse stock</span>
            </div>
          </div>

          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-150 dark:border-slate-750">
            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Sales Returns & RMA Directory</h4>
              <p className="text-xs text-slate-400 mt-0.5">Manage returned merchandise, process credit notes, scrap damaged parts, or dispatch replacement orders.</p>
            </div>
            <button 
              onClick={() => setIsReturnCreateOpen(true)}
              className="px-4 py-2 bg-brand-orange hover:bg-brand-orange/95 text-white text-xs font-bold rounded-xl shadow-md uppercase tracking-wider font-mono transition-all flex items-center gap-1.5"
            >
              <span>Log Sales Return (RMA)</span>
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <Table 
            columns={returnColumns} 
            data={returns} 
            onRowClick={(ret) => setSelectedReturn(ret)}
            rowActions={[
              {
                label: 'Inspect RMA Details',
                icon: Eye,
                onClick: (ret) => setSelectedReturn(ret),
              },
              {
                label: 'Copy RMA Number',
                icon: Copy,
                onClick: (ret) => {
                  navigator.clipboard?.writeText(ret.id);
                },
              },
              {
                label: 'Print RMA Document',
                icon: Printer,
                onClick: (ret) => {
                  setSelectedReturn(ret);
                  setTimeout(() => window.print(), 300);
                },
              }
            ]}
          />
        </div>
      );
    }

    const filteredData = salesOrders.filter(order => {
        if (activeTab === 'Quotes') return order.status === 'Quote';
        if (activeTab === 'Orders') return order.status === 'Order';
        if (activeTab === 'Invoices') return order.status === 'Invoiced' || order.status === 'Paid';
        return false;
    });

    const orderRowActions: TableRowAction<SaleOrder>[] = [
      {
        label: 'View Order / Invoice Details',
        icon: Eye,
        onClick: (order) => setSelectedOrder(order),
      },
      {
        label: 'Convert to Tax Invoice',
        icon: ArrowRight,
        hidden: (order) => order.status !== 'Quote',
        onClick: (order) => handleConvertToInvoice(order.id),
      },
      {
        label: 'Print Packing / Tax Slip',
        icon: Printer,
        onClick: (order) => {
          setSelectedOrder(order);
          setTimeout(() => window.print(), 300);
        },
      },
      {
        label: 'Copy Order ID',
        icon: Copy,
        onClick: (order) => {
          navigator.clipboard?.writeText(order.id);
        },
      },
    ];

    return (
      <div className="mt-4">
        <Table 
          columns={columns} 
          data={filteredData} 
          onRowClick={(order) => setSelectedOrder(order)}
          rowActions={orderRowActions}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-900 min-h-full pb-12 text-slate-900 dark:text-slate-50">
      <PageHeader
        title="Quotation & Pro-forma Ledger"
        primaryAction={{ label: "Prepare Pro-forma Quote", onClick: () => setIsCreateOpen(true) }}
      />
      <div className="p-4 md:p-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4">
          <Tabs tabs={tabs}>
            {(activeTab) => renderContent(activeTab)}
          </Tabs>
        </div>
      </div>

      {/* INSPECT DETAIL MODAL DRAWER */}
      {selectedOrder && (
         <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
             <div className="printable-invoice w-full max-w-lg bg-white dark:bg-slate-800 h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-left text-xs">
                 <div>
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4 mb-5">
                          <div>
                              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">{settings.corpShortName} Pro-forma Ledger</span>
                              <h3 className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">{selectedOrder.id}</h3>
                          </div>
                          <button onClick={() => setSelectedOrder(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 no-print">
                              <X className="w-5 h-5"/>
                          </button>
                     </div>

                     <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-750 text-xs space-y-2 mb-6">
                          <div className="flex justify-between">
                              <span className="text-slate-450 uppercase font-bold text-[10px]">Client / Merchant:</span>
                              <span className="font-bold text-slate-850 dark:text-zinc-100">{selectedOrder.customer.name}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-slate-450 uppercase font-bold text-[10px]">Address & Contact:</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300 font-sans">{selectedOrder.customer.email || 'billing@client.co.ke'}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-slate-450 uppercase font-bold text-[10px]">Client Tier Type:</span>
                              <span className="font-mono text-brand-orange font-bold uppercase">{selectedOrder.customer.tier}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-slate-450 uppercase font-bold text-[10px]">Issue Date:</span>
                              <span className="font-mono text-slate-800 dark:text-slate-200">{selectedOrder.date}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-750">
                              <span className="text-slate-450 uppercase font-bold text-[10px]">Status:</span>
                              {getStatusBadge(selectedOrder.status)}
                          </div>
                     </div>

                     <h4 className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3 block">Itemized Components ({settings.vatRate}% VAT Included)</h4>
                     <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                          <table className="w-full text-left">
                              <thead className="bg-slate-50 dark:bg-slate-750 text-slate-600 dark:text-slate-300 font-bold">
                                  <tr>
                                      <th className="p-3">Part Description</th>
                                      <th className="p-3 text-center">Qty</th>
                                      <th className="p-3 text-right">Wholesale Unit</th>
                                      <th className="p-3 text-right">Extended Net</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-150 dark:divide-slate-700">
                                   {selectedOrder.items?.map((item, id) => (
                                       <tr key={id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-zinc-100 font-mono">
                                           <td className="p-3 font-sans font-semibold">{item.productName}</td>
                                           <td className="p-3 text-center">{item.quantity}</td>
                                           <td className="p-3 text-right">{formatPrice(item.price)}</td>
                                           <td className="p-3 text-right font-bold">{formatPrice(item.price * item.quantity)}</td>
                                       </tr>
                                   ))}
                              </tbody>
                          </table>
                          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                             <span>Grand Total Valuation</span>
                             <span>{formatPrice(selectedOrder.total)}</span>
                          </div>
                     </div>
                 </div>

                 {/* Modal bottom action button */}
                 <div className="pt-6 border-t border-slate-150 dark:border-slate-700 space-y-2 no-print">
                     <button
                       onClick={() => window.print()}
                       className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all font-mono flex items-center justify-center gap-2 cursor-pointer"
                     >
                       <Printer className="w-4 h-4 text-brand-orange" />
                       <span>Print Official Document Invoice</span>
                     </button>

                     {selectedOrder.status === 'Quote' && (
                        <button 
                          onClick={() => handleConvertToInvoice(selectedOrder.id)}
                          className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all font-mono"
                        >
                          Convert to Official VAT Invoice
                        </button>
                     )}
                     <button 
                       onClick={() => setSelectedOrder(null)}
                       className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-zinc-200 text-xs font-bold rounded-xl transition-all focus:outline-none"
                     >
                       Dismiss View
                     </button>
                 </div>
             </div>
         </div>
      )}

      {/* CREATE PROFORMA QUOTE MODAL */}
      {isCreateOpen && (
         <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in text-xs">
             <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                 <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                       <FileText className="w-5 h-5 text-brand-orange" />
                       <span>Prepare B2B Sales Pro-forma Quote</span>
                    </h3>
                    <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                       <X className="w-5 h-5"/>
                    </button>
                 </div>

                 <form onSubmit={handleSaveQuote} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-slate-500 font-bold">Target B2B Account Client</label>
                           <select 
                              value={targetCustomer.id}
                              onChange={(e) => {
                                const c = MOCK_CUSTOMERS.find(cust => cust.id === parseInt(e.target.value, 10));
                                if (c) setTargetCustomer(c);
                              }}
                              className="w-full mt-1.5 p-2 bg-slate-50 dark:bg-slate-700 border dark:border-slate-650 rounded font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                           >
                              {MOCK_CUSTOMERS.map(c => (
                                 <option key={c.id} value={c.id}>{c.name} ({c.tier})</option>
                              ))}
                           </select>
                        </div>
                        <div>
                           <label className="text-slate-500 font-bold block text-right">Applicable Tier discount rate</label>
                           <div className="text-right mt-3 text-sm font-black text-brand-orange font-mono">
                             {targetCustomer.tier === 'Wholesale A' ? '15% Off (Wholesale A)' : targetCustomer.tier === 'Wholesale B' ? '10% Off (Wholesale B)' : '0% Off (Retail)'}
                           </div>
                        </div>
                     </div>

                     <div className="flex justify-between items-center pt-2">
                        <label className="text-slate-550 uppercase font-black tracking-wider text-[10px] text-slate-500">Autoparts Component Lines</label>
                        <button 
                           type="button" 
                           onClick={addQuoteLine}
                           className="px-2.5 py-1 bg-brand-orange/5 text-brand-orange rounded font-bold"
                        >
                           Line Part item Code ➕
                        </button>
                     </div>

                     {/* Grid tables draft line */}
                     <div className="space-y-3.5">
                        {quoteLines.map((line, idx) => {
                           let actualUnitPrice = line.product.price;
                           if (targetCustomer.tier === 'Wholesale A') {
                             actualUnitPrice = Math.round(line.product.price * 0.85);
                           } else if (targetCustomer.tier === 'Wholesale B') {
                             actualUnitPrice = Math.round(line.product.price * 0.90);
                           }
                           return (
                             <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-150 dark:border-slate-750">
                                <div className="col-span-6">
                                    <label className="text-[10px] text-slate-400 font-bold">Select Catalogued Part *</label>
                                    <select 
                                       value={line.product.id}
                                       onChange={(e) => handleProductChange(idx, parseInt(e.target.value, 10))}
                                       className="w-full mt-1 p-1 bg-white dark:bg-slate-800 border dark:border-slate-750 rounded focus:outline-none text-slate-800 dark:text-zinc-150 text-[11px]"
                                    >
                                       {MOCK_PRODUCTS.map(p => (
                                          <option key={p.id} value={p.id}>{p.name} [OEM: {p.oemCode}]</option>
                                       ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] text-slate-400 font-bold">Qty Parts</label>
                                    <input 
                                       type="number" 
                                       min={1}
                                       value={line.quantity || ''}
                                       onChange={(e) => handleQtyChange(idx, parseInt(e.target.value, 10)|0)}
                                       className="w-full mt-1 p-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded text-center font-bold text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="col-span-3 text-right">
                                    <label className="text-[10px] text-slate-450 block font-bold">Line Net Cost</label>
                                    <p className="mt-1 font-mono font-bold text-slate-800 dark:text-slate-350 text-[11px]">
                                       {formatPrice(actualUnitPrice * line.quantity)}
                                    </p>
                                </div>
                                <div className="col-span-1 text-center">
                                    <button 
                                      type="button" 
                                      onClick={() => removeQuoteLine(idx)}
                                      disabled={quoteLines.length === 1}
                                      className="text-slate-350 hover:text-red-500 disabled:opacity-30 p-1 font-bold"
                                    >
                                      ❌
                                    </button>
                                </div>
                             </div>
                           );
                        })}
                     </div>

                     {/* Overall Pro-forma Total */}
                     <div className="p-3.5 bg-brand-orange/5 border border-brand-orange/10 rounded-xl flex justify-between font-bold text-sm">
                        <span className="text-slate-600 dark:text-slate-450">Estimated Net Pro-forma Total</span>
                        <span className="text-brand-orange font-black font-mono">
                           {formatPrice(quoteLines.reduce((acc, line) => {
                             let actualUnitPrice = line.product.price;
                             if (targetCustomer.tier === 'Wholesale A') {
                               actualUnitPrice = Math.round(line.product.price * 0.85);
                             } else if (targetCustomer.tier === 'Wholesale B') {
                               actualUnitPrice = Math.round(line.product.price * 0.90);
                             }
                             return acc + (actualUnitPrice * line.quantity);
                           }, 0))}
                        </span>
                     </div>

                     <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-700">
                        <button 
                           type="button" 
                           onClick={() => setIsCreateOpen(false)}
                           className="flex-1 py-2.5 font-bold border rounded text-center dark:text-zinc-350"
                        >
                           Discard Quote
                        </button>
                        <button 
                           type="submit"
                           className="flex-1 py-2.5 font-bold bg-brand-orange hover:bg-brand-orange/95 text-white rounded text-center shadow-md uppercase focus:outline-none"
                        >
                           Prepare Quotation Draft
                        </button>
                     </div>
                 </form>
             </div>
         </div>
      )}
      {/* RETURN INSPECT DETAIL MODAL DRAWER */}
      {selectedReturn && (
         <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex justify-end z-50 animate-fade-in text-xs">
             <div className="w-full max-w-lg bg-white dark:bg-slate-800 h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-left text-xs text-slate-955 dark:text-slate-50">
                 <div>
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4 mb-5">
                          <div>
                              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">RMA Authorization Log</span>
                              <h3 className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">{selectedReturn.id}</h3>
                          </div>
                          <button onClick={() => setSelectedReturn(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500">
                              <X className="w-5 h-5"/>
                          </button>
                     </div>

                     <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-750 space-y-2 mb-6 text-slate-800 dark:text-slate-200">
                          <div className="flex justify-between">
                              <span className="text-slate-450 uppercase font-bold text-[10px]">Client / Merchant:</span>
                              <span className="font-bold">{selectedReturn.customer.name}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-slate-450 uppercase font-bold text-[10px]">Invoice Ref:</span>
                              <span className="font-mono font-bold text-brand-orange">{selectedReturn.invoiceId}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-slate-450 uppercase font-bold text-[10px]">Date Lodged:</span>
                              <span className="font-mono">{selectedReturn.date}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-slate-450 uppercase font-bold text-[10px]">Proposed Resolution:</span>
                              <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide text-[10px]">{selectedReturn.resolution}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-750">
                              <span className="text-slate-450 uppercase font-bold text-[10px]">Status:</span>
                              <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md border ${
                                selectedReturn.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-955/30 dark:text-emerald-300' :
                                selectedReturn.status === 'Rejected' ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-955/30 dark:text-rose-300' :
                                'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-850 dark:text-slate-300'
                              }`}>{selectedReturn.status}</span>
                          </div>
                     </div>

                     <h4 className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3 block">Returned Component Parts</h4>
                     <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mb-6">
                          <table className="w-full text-left">
                              <thead className="bg-slate-50 dark:bg-slate-750 text-slate-600 dark:text-slate-300 font-bold">
                                  <tr>
                                      <th className="p-3">Description</th>
                                      <th className="p-3 text-center">Qty</th>
                                      <th className="p-3 text-center">Condition</th>
                                      <th className="p-3 text-right">Refund Val</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-150 dark:divide-slate-700">
                                   {selectedReturn.items?.map((item, id) => (
                                       <tr key={id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-zinc-150 font-mono text-[11px]">
                                           <td className="p-3 font-sans font-semibold">{item.productName}</td>
                                           <td className="p-3 text-center">{item.quantity}</td>
                                           <td className="p-3 text-center">
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                                  item.condition === 'Restockable' ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300' :
                                                  item.condition === 'Defective' ? 'bg-amber-100 text-amber-800 dark:bg-amber-955/30 dark:text-amber-355' :
                                                  'bg-rose-100 text-rose-800 dark:bg-rose-955/30 dark:text-rose-350'
                                                }`}>{item.condition}</span>
                                           </td>
                                           <td className="p-3 text-right font-bold">{formatPrice(item.refundAmount)}</td>
                                       </tr>
                                   ))}
                              </tbody>
                          </table>
                          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-white">
                             <span>Total Approved Valuation</span>
                             <span className="font-mono">{formatPrice(selectedReturn.totalRefund)}</span>
                          </div>
                     </div>

                     {selectedReturn.notes && (
                        <div className="mb-6">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">RMA Waybill Inspector Notes</span>
                          <p className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/20 text-slate-700 dark:text-slate-300 rounded-lg italic">{selectedReturn.notes}</p>
                        </div>
                     )}
                 </div>

                 <div className="pt-6 border-t border-slate-150 dark:border-slate-700 space-y-2">
                     {selectedReturn.status === 'Pending' && (
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            type="button"
                            onClick={() => handleRejectReturn(selectedReturn)}
                            className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-650 font-bold uppercase tracking-wider rounded-xl transition-all font-mono"
                          >
                            Reject RMA
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleApproveReturn(selectedReturn)}
                            className="py-3 bg-brand-orange hover:bg-brand-orange/95 text-white font-bold uppercase tracking-wider rounded-xl shadow-md transition-all font-mono"
                          >
                            Approve & Process
                          </button>
                        </div>
                     )}
                     <button 
                       type="button"
                       onClick={() => setSelectedReturn(null)}
                       className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-zinc-200 font-bold rounded-xl transition-all focus:outline-none"
                     >
                       Dismiss View
                     </button>
                 </div>
             </div>
         </div>
      )}

      {/* CREATE RETURN RMA MODAL */}
      {isReturnCreateOpen && (
         <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in text-xs text-slate-955 dark:text-slate-50">
             <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-fade-in">
                 <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                       <RefreshCw className="w-5 h-5 text-brand-orange" />
                       <span>Log Sales Return Merchandise Authorization (RMA)</span>
                    </h3>
                    <button onClick={() => setIsReturnCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                       <X className="w-5 h-5"/>
                    </button>
                 </div>

                 <form onSubmit={handleSaveReturn} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-slate-500 font-bold">Select B2B Client Customer *</label>
                           <select 
                              value={retCustomer.id}
                              onChange={(e) => {
                                const c = MOCK_CUSTOMERS.find(cust => cust.id === parseInt(e.target.value, 10));
                                if (c) setRetCustomer(c);
                              }}
                              className="w-full mt-1.5 p-2 bg-slate-50 dark:bg-slate-700 border dark:border-slate-650 rounded font-bold text-slate-800 dark:text-slate-100 focus:outline-none text-[11px]"
                           >
                              {MOCK_CUSTOMERS.map(c => (
                                 <option key={c.id} value={c.id}>{c.name} ({c.tier})</option>
                              ))}
                           </select>
                        </div>
                        <div>
                           <label className="text-slate-500 font-bold">Reference Sales Invoice Code</label>
                           <input 
                              type="text"
                              placeholder="e.g. INV-2024-098"
                              value={retInvoiceId}
                              onChange={(e) => setRetInvoiceId(e.target.value)}
                              className="w-full mt-1.5 p-2 bg-slate-50 dark:bg-slate-700 border dark:border-slate-650 rounded font-bold text-slate-800 dark:text-slate-100 focus:outline-none font-mono"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-slate-500 font-bold">Resolution Action</label>
                           <select 
                              value={retResolution}
                              onChange={(e) => setRetResolution(e.target.value as any)}
                              className="w-full mt-1.5 p-2 bg-slate-50 dark:bg-slate-700 border dark:border-slate-650 rounded font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                           >
                              <option value="Credit Note">Generate Credit Note (Debt Adjustment)</option>
                              <option value="Refund">Issue Cash/Mobile Money Refund</option>
                              <option value="Replacement">Dispatch Zero-Value Replacement Order</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-slate-500 font-bold block text-right">Return Status (Default)</label>
                           <div className="text-right mt-3 text-sm font-black text-amber-500 font-mono">
                             PENDING AUTHORIZATION
                           </div>
                        </div>
                     </div>

                     <div className="flex justify-between items-center pt-2">
                        <label className="text-slate-550 uppercase font-black tracking-wider text-[10px] text-slate-500">Returned Auto Components & Conditions</label>
                        <button 
                           type="button" 
                           onClick={addReturnLine}
                           className="px-2.5 py-1 bg-brand-orange/5 text-brand-orange rounded font-bold"
                        >
                           Add Returned Part ➕
                        </button>
                     </div>

                     {/* Returned item rows */}
                     <div className="space-y-3.5">
                        {retItems.map((line, idx) => (
                           <div key={idx} className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-150 dark:border-slate-750 animate-fade-in">
                              <div className="grid grid-cols-12 gap-2 items-end font-mono">
                                <div className="col-span-8">
                                    <label className="text-[10px] text-slate-400 font-bold font-sans">Select Returned Catalogued Part *</label>
                                    <select 
                                       value={line.product.id}
                                       onChange={(e) => handleReturnProductChange(idx, parseInt(e.target.value, 10))}
                                       className="w-full mt-1 p-1 bg-white dark:bg-slate-800 border dark:border-slate-750 rounded focus:outline-none text-slate-800 dark:text-zinc-150 text-[11px] font-sans"
                                    >
                                       {MOCK_PRODUCTS.map(p => (
                                          <option key={p.id} value={p.id}>{p.name} [OEM: {p.oemCode}]</option>
                                       ))}
                                    </select>
                                </div>
                                <div className="col-span-3">
                                    <label className="text-[10px] text-slate-400 font-bold font-sans">Qty Returned</label>
                                    <input 
                                       type="number" 
                                       min={1}
                                       value={line.quantity || ''}
                                       onChange={(e) => handleReturnQtyChange(idx, parseInt(e.target.value, 10)|0)}
                                       className="w-full mt-1 p-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded text-center font-bold text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="col-span-1 text-center font-bold font-sans">
                                    <button 
                                      type="button" 
                                      onClick={() => removeReturnLine(idx)}
                                      disabled={retItems.length === 1}
                                      className="text-slate-350 hover:text-red-500 disabled:opacity-30 p-1 font-bold"
                                    >
                                      ❌
                                    </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/50 dark:border-slate-800 font-sans">
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold">Merchandise Condition</label>
                                    <select 
                                       value={line.condition}
                                       onChange={(e) => handleReturnConditionChange(idx, e.target.value as any)}
                                       className="w-full mt-0.5 p-1 bg-white dark:bg-slate-800 border dark:border-slate-750 rounded focus:outline-none text-slate-800 dark:text-zinc-150 text-[11px]"
                                    >
                                       <option value="Restockable">Restockable (Unopened/Brand New)</option>
                                       <option value="Defective">Defective (Manufacturer Defect / Quarantine)</option>
                                       <option value="Scrap">Scrap (Damaged / Unsellable)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold block text-right">Calculated Refund Valuation</label>
                                    <input 
                                       type="number" 
                                       value={line.refundAmount}
                                       onChange={(e) => handleReturnValuationChange(idx, parseFloat(e.target.value) || 0)}
                                       className="w-full mt-0.5 p-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded text-right font-mono font-bold text-slate-900 dark:text-white text-[11px]"
                                    />
                                </div>
                              </div>
                           </div>
                        ))}
                     </div>

                     <div>
                        <label className="text-slate-500 font-bold">RMA Inspector Notes / Reason for Return</label>
                        <textarea 
                           placeholder="Please outline why components are returned, packaging condition, or defect inspection details..."
                           value={retNotes}
                           onChange={(e) => setRetNotes(e.target.value)}
                           rows={3}
                           className="w-full mt-1.5 p-2 bg-slate-50 dark:bg-slate-700 border dark:border-slate-650 rounded text-slate-800 dark:text-slate-100 focus:outline-none"
                        />
                     </div>

                     {/* Return Valuation summary */}
                     <div className="p-3.5 bg-brand-orange/5 border border-brand-orange/10 rounded-xl flex justify-between font-bold text-sm">
                        <span className="text-slate-600 dark:text-slate-450 font-bold">Estimated Credit / Refund Total</span>
                        <span className="text-brand-orange font-black font-mono">
                           {formatPrice(retItems.reduce((acc, item) => acc + item.refundAmount, 0))}
                        </span>
                     </div>

                     <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-700">
                        <button 
                           type="button" 
                           onClick={() => setIsReturnCreateOpen(false)}
                           className="flex-1 py-2.5 font-bold border rounded text-center dark:text-zinc-350"
                        >
                           Cancel
                        </button>
                        <button 
                           type="submit"
                           className="flex-1 py-2.5 font-bold bg-brand-orange hover:bg-brand-orange/95 text-white rounded text-center shadow-md uppercase focus:outline-none"
                        >
                           Draft RMA Log
                        </button>
                     </div>
                 </form>
             </div>
         </div>
      )}
    </div>
  );
};

export default Sales;

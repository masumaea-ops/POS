import React, { useState } from 'react';
import PageHeader from '../components/shared/PageHeader';
import Tabs from '../components/shared/Tabs';
import Table from '../components/shared/Table';
import { MOCK_SALE_ORDERS, MOCK_CUSTOMERS, MOCK_PRODUCTS } from '../data/mockData';
import type { SaleOrder, Customer, Product } from '../types';
import { XIcon } from '../components/shared/Icons';

const Sales: React.FC = () => {
  const tabs = ["Quotes", "Orders", "Invoices", "Returns"];
  const [salesOrders, setSalesOrders] = useState<SaleOrder[]>(MOCK_SALE_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<SaleOrder | null>(null);
  
  // Quote Preparation States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [targetCustomer, setTargetCustomer] = useState<Customer>(MOCK_CUSTOMERS[1] || MOCK_CUSTOMERS[0]);
  const [quoteLines, setQuoteLines] = useState<Array<{ product: Product; quantity: number }>>([
    { product: MOCK_PRODUCTS[0], quantity: 5 }
  ]);

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
    
    // East Africa KES Tax compliance Alert
    alert(`⚡ PRO-FORMA CONVERTED SUCCESSFULLY:\nStatus modified to "Invoiced".\nSynchronized with KRA eTIMS instance.\nSecurity fiscal hash generated: eTIMS-9${Math.floor(100000 + Math.random()*900000)}-EAF.`);
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
      header: 'Gross Total (16% VAT Inc.)', 
      accessor: (item: SaleOrder) => (
        <span className="font-mono font-bold text-slate-900 dark:text-gray-50">
           KES {item.total.toLocaleString(undefined, {minimumFractionDigits: 2})}
        </span>
      )
    },
    {
      header: 'Interactive Control',
      accessor: (item: SaleOrder) => (
        <div className="flex gap-2">
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
    const filteredData = salesOrders.filter(order => {
        if (activeTab === 'Quotes') return order.status === 'Quote';
        if (activeTab === 'Orders') return order.status === 'Order';
        if (activeTab === 'Invoices') return order.status === 'Invoiced' || order.status === 'Paid';
        return false;
    });
    return <div className="mt-4"><Table columns={columns} data={filteredData} /></div>;
  };

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-900 min-h-full pb-12">
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
             <div className="w-full max-w-lg bg-white dark:bg-slate-800 h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-left">
                 <div>
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4 mb-5">
                         <div>
                             <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">East Africa Pro-forma Ledger</span>
                             <h3 className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">{selectedOrder.id}</h3>
                         </div>
                         <button onClick={() => setSelectedOrder(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500">
                             <XIcon className="w-5 h-5"/>
                         </button>
                     </div>

                     <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-750 text-xs space-y-2 mb-6">
                         <div className="flex justify-between">
                             <span className="text-slate-450 uppercase font-bold text-[10px]">Distributor Name:</span>
                             <span className="font-bold text-slate-850 dark:text-zinc-100">{selectedOrder.customer.name}</span>
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

                     <h4 className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3">Itemized Components (16% VAT Included)</h4>
                     <div className="border border-slate-200 dark:border-slate-705 rounded-xl overflow-hidden text-xs">
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
                                           <td className="p-3 text-right">KES {item.price.toLocaleString()}</td>
                                           <td className="p-3 text-right font-bold">KES {(item.price * item.quantity).toLocaleString()}</td>
                                       </tr>
                                   ))}
                              </tbody>
                          </table>
                          <div className="p-4 bg-slate-55 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                             <span>Final Valuation Invoice Total</span>
                             <span>KES {selectedOrder.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                     </div>
                 </div>

                 {/* Modal bottom action button */}
                 <div className="pt-6 border-t border-slate-150 dark:border-slate-700 space-y-2">
                     {selectedOrder.status === 'Quote' && (
                        <button 
                          onClick={() => handleConvertToInvoice(selectedOrder.id)}
                          className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all font-mono"
                        >
                          Convert to Legal VAT Invoice & Push eTIMS
                        </button>
                     )}
                     <button 
                       onClick={() => setSelectedOrder(null)}
                       className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-zinc-200 text-xs font-bold rounded-xl transition-all"
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
             <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full border border-slate-250 dark:border-slate-700 shadow-2xl overflow-hidden">
                 <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">📝 Prepare B2B Sales Pro-forma Quote</h3>
                    <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                       <XIcon className="w-5 h-5"/>
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
                              className="w-full mt-1.5 p-2 bg-slate-50 dark:bg-slate-700 border rounded font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
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
                        <label className="text-slate-550 uppercase font-black tracking-wider text-[10px]">Autoparts Component Lines</label>
                        <button 
                           type="button" 
                           onClick={addQuoteLine}
                           className="px-2.5 py-1 bg-brand-orange/5 text-brand-orange rounded font-bold"
                        >
                           ➕ Add Part Item Code
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
                                       className="w-full mt-1 p-1 bg-white dark:bg-slate-800 border rounded focus:outline-none text-slate-800 dark:text-zinc-150 text-[11px]"
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
                                       className="w-full mt-1 p-1 bg-white dark:bg-slate-800 border rounded text-center font-bold text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="col-span-3 text-right">
                                    <label className="text-[10px] text-slate-450 block font-bold">Line Net Cost</label>
                                    <p className="mt-1 font-mono font-bold text-slate-800 dark:text-slate-350 text-[11px]">
                                       KES {(actualUnitPrice * line.quantity).toLocaleString()}
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
                           KES {quoteLines.reduce((acc, line) => {
                             let actualUnitPrice = line.product.price;
                             if (targetCustomer.tier === 'Wholesale A') {
                               actualUnitPrice = Math.round(line.product.price * 0.85);
                             } else if (targetCustomer.tier === 'Wholesale B') {
                               actualUnitPrice = Math.round(line.product.price * 0.90);
                             }
                             return acc + (actualUnitPrice * line.quantity);
                           }, 0).toLocaleString()}
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
                           className="flex-1 py-2.5 font-bold bg-brand-orange hover:bg-brand-orange/95 text-white rounded text-center shadow-md uppercase"
                        >
                           Prepare Quotation Draft
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

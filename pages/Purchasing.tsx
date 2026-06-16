import React, { useState } from 'react';
import PageHeader from '../components/shared/PageHeader';
import Table from '../components/shared/Table';
import { MOCK_PURCHASE_ORDERS, MOCK_SUPPLIERS, MOCK_PRODUCTS } from '../data/mockData';
import type { PurchaseOrder, Supplier, Product } from '../types';
import { XIcon } from '../components/shared/Icons';

const Purchasing: React.FC = () => {
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(MOCK_PURCHASE_ORDERS);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    
    // Create PO Modal States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier>(MOCK_SUPPLIERS[0]);
    const [poLines, setPoLines] = useState<Array<{ product: Product; quantity: number; cost: number }>>([
        { product: MOCK_PRODUCTS[0], quantity: 50, cost: MOCK_PRODUCTS[0].price * 0.70 }
    ]);

    const getStatusBadge = (status: PurchaseOrder['status']) => {
        const statusClasses = {
            'Draft': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-600',
            'Sent': 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-900/30',
            'Received': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/30',
            'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/30'
        };
        return <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${statusClasses[status]}`}>{status}</span>;
    };

    // Transition of PO details
    const handleTransitionStatus = (poId: string, nextStatus: PurchaseOrder['status']) => {
        setPurchaseOrders(prev => prev.map(po => {
            if (po.id === poId) {
                const updated = { ...po, status: nextStatus };
                if (selectedPO?.id === poId) {
                    setSelectedPO(updated);
                }
                return updated;
            }
            return po;
        }));

        if (nextStatus === 'Received') {
            alert(`✅ STOCK RECEIVED FOR ORDER ${poId}!\nPhysical quantities have been committed to warehouse bin slot allocations.`);
        }
    };

    // Add another row in Create PO form
    const addPoLine = () => {
        setPoLines([...poLines, { product: MOCK_PRODUCTS[0], quantity: 20, cost: MOCK_PRODUCTS[0].price * 0.70 }]);
    };

    const handleLineProductChange = (index: number, prodId: number) => {
        const prod = MOCK_PRODUCTS.find(p => p.id === prodId);
        if (!prod) return;
        const updated = [...poLines];
        updated[index] = {
            product: prod,
            quantity: updated[index].quantity,
            cost: Math.round(prod.price * 0.70) // Auto trade cost
        };
        setPoLines(updated);
    };

    const handleLineQtyChange = (index: number, qty: number) => {
        const updated = [...poLines];
        updated[index].quantity = qty;
        setPoLines(updated);
    };

    const removePoLine = (index: number) => {
        if (poLines.length === 1) return;
        setPoLines(poLines.filter((_, idx) => idx !== index));
    };

    // Commit PO creator to list
    const handleSavePO = (e: React.FormEvent) => {
        e.preventDefault();
        
        const totalCost = poLines.reduce((acc, line) => acc + (line.cost * line.quantity), 0);
        const mappedItems = poLines.map(line => ({
            productName: line.product.name,
            quantity: line.quantity,
            cost: line.cost
        }));

        const newPO: PurchaseOrder = {
            id: `PO-2026-00${Math.floor(5 + Math.random() * 95)}`,
            supplier: selectedSupplier,
            date: new Date().toISOString().split('T')[0],
            status: 'Draft',
            total: totalCost,
            itemCount: poLines.length,
            items: mappedItems
        };

        setPurchaseOrders([newPO, ...purchaseOrders]);
        setIsCreateOpen(false);
        // Reset Creator
        setPoLines([{ product: MOCK_PRODUCTS[0], quantity: 50, cost: MOCK_PRODUCTS[0].price * 0.70 }]);
    };

    const columns = [
        { 
          header: 'PO ID Reference', 
          accessor: (item: PurchaseOrder) => (
            <button 
               onClick={() => setSelectedPO(item)}
               className="font-black text-brand-orange hover:underline text-left font-mono"
            >
               📄 {item.id}
            </button>
          ) 
        },
        { header: 'Procurement Supplier', accessor: (item: PurchaseOrder) => <span className="font-bold text-slate-800 dark:text-slate-100">{item.supplier.name}</span> },
        { header: 'Order Date', accessor: (item: PurchaseOrder) => <span className="font-mono text-xs">{item.date}</span> },
        { header: 'Audited Status', accessor: (item: PurchaseOrder) => getStatusBadge(item.status) },
        { header: 'SKU Lines count', accessor: (item: PurchaseOrder) => <span className="font-bold">{item.itemCount} Categories</span>},
        { 
          header: 'Contract Total Value', 
          accessor: (item: PurchaseOrder) => (
             <span className="font-mono font-black text-slate-900 dark:text-slate-50">
               KES {item.total.toLocaleString(undefined, {minimumFractionDigits: 2})}
             </span>
          ) 
        },
        {
          header: 'Quick Action',
          accessor: (item: PurchaseOrder) => (
            <div className="flex gap-2">
              <button 
                 onClick={() => setSelectedPO(item)}
                 className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs rounded transition-all font-bold"
              >
                 Inspect Lines
              </button>
              {item.status === 'Sent' && (
                 <button 
                    onClick={() => handleTransitionStatus(item.id, 'Received')}
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded font-bold transition-all"
                 >
                    Receive Stock
                 </button>
              )}
            </div>
          )
        }
    ];

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 pb-12">
            <PageHeader
                title="B2B Reorder Procurement Panel"
                primaryAction={{ label: "Prepare Supply PO Order", onClick: () => setIsCreateOpen(true) }}
            />
            
            <div className="p-4 md:p-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <Table columns={columns} data={purchaseOrders} />
                </div>
            </div>

            {/* DETAILS DRAWERS SLIDE OVER */}
            {selectedPO && (
              <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
                 <div className="w-full max-w-lg bg-white dark:bg-slate-800 h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-slide-left">
                    <div>
                         <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4 mb-5">
                             <div>
                                 <span className="text-[10px] font-mono tracking-widest text-slate-400">PROCUREMENT ORDER DOCUMENT</span>
                                 <h3 className="text-xl font-black text-slate-950 dark:text-slate-100 font-mono mt-0.5">{selectedPO.id}</h3>
                             </div>
                             <button onClick={() => setSelectedPO(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-full text-slate-500">
                                 <XIcon className="w-5 h-5"/>
                             </button>
                         </div>

                         <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-150 dark:border-slate-700">
                             <div>
                                 <span className="text-slate-450 uppercase font-bold tracking-wide block">Purchasing Supplier</span>
                                 <p className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-1">{selectedPO.supplier.name}</p>
                                 <p className="text-[10px] text-slate-500">{selectedPO.supplier.contactPerson} • {selectedPO.supplier.email}</p>
                             </div>
                             <div>
                                 <span className="text-slate-450 uppercase font-bold tracking-wide block">Order Chronological Date</span>
                                 <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{selectedPO.date}</p>
                                 <div className="mt-2.5 flex items-center gap-1.5">
                                     <span className="text-slate-450 uppercase font-bold">State:</span>
                                     {getStatusBadge(selectedPO.status)}
                                 </div>
                             </div>
                         </div>

                         <h4 className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3">Line Itemized Cargo Components</h4>
                         <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden text-xs">
                             <table className="w-full text-left">
                                 <thead className="bg-slate-50 dark:bg-slate-700/60 font-semibold text-slate-600 dark:text-slate-300">
                                     <tr>
                                         <th className="p-2.5">Specific Autopart Name</th>
                                         <th className="p-2.5 text-right">Qty Parts</th>
                                         <th className="p-2.5 text-right">Unit cost</th>
                                         <th className="p-2.5 text-right">Subtotal</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-150 dark:divide-slate-700">
                                     {selectedPO.items?.map((item, idx) => (
                                         <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-100 font-mono">
                                             <td className="p-2.5 font-sans font-medium">{item.productName}</td>
                                             <td className="p-2.5 text-right">{item.quantity}</td>
                                             <td className="p-2.5 text-right">KES {item.cost.toLocaleString()}</td>
                                             <td className="p-2.5 text-right font-bold">KES {(item.cost * item.quantity).toLocaleString()}</td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                             <div className="p-3 bg-slate-50 dark:bg-slate-900/30 flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 text-sm">
                                 <span>Contract Core Total</span>
                                 <span>KES {selectedPO.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                             </div>
                         </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-2.5">
                        {selectedPO.status === 'Draft' && (
                           <button 
                              onClick={() => handleTransitionStatus(selectedPO.id, 'Sent')}
                              className="w-full py-3 bg-brand-orange hover:bg-brand-orange/90 text-white font-bold text-xs tracking-wider uppercase rounded-xl shadow-md transition-all text-center"
                           >
                              🚀 Dispatch Purchase Order to Supplier API
                           </button>
                        )}
                        {selectedPO.status === 'Sent' && (
                           <button 
                              onClick={() => handleTransitionStatus(selectedPO.id, 'Received')}
                              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider uppercase rounded-xl shadow-md transition-all text-center animate-pulse"
                           >
                              📥 Confirm Intake & Add Stock to Warehouse Inventory Bins
                           </button>
                        )}
                        <button 
                           onClick={() => setSelectedPO(null)}
                           className="w-full py-2.5 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl"
                        >
                           Close Window
                        </button>
                    </div>
                 </div>
              </div>
            )}

            {/* CREATE PURCHASE ORDER MODAL */}
            {isCreateOpen && (
              <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
                 <div className="bg-white dark:bg-gray-800 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                     <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">📝 Prepare B2B Supply Purchase Order</h3>
                        <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                           <XIcon className="w-5 h-5" />
                        </button>
                     </div>

                     <form onSubmit={handleSavePO} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                         <div>
                             <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Target Supplier Merchant</label>
                             <select 
                                value={selectedSupplier.id}
                                onChange={(e) => {
                                  const sup = MOCK_SUPPLIERS.find(s => s.id === parseInt(e.target.value, 10));
                                  if (sup) setSelectedSupplier(sup);
                                }}
                                className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-800 dark:text-slate-100 font-bold focus:outline-none"
                             >
                                 {MOCK_SUPPLIERS.map(s => (
                                     <option key={s.id} value={s.id}>{s.name} ({s.contactPerson})</option>
                                 ))}
                             </select>
                         </div>

                         <div className="flex justify-between items-center pt-2">
                             <h4 className="text-xs uppercase font-bold tracking-wider text-slate-500">Order Component Lines</h4>
                             <button 
                               type="button" 
                               onClick={addPoLine}
                               className="text-xs font-bold text-brand-orange hover:underline bg-brand-orange/5 px-2.5 py-1 rounded"
                             >
                               ➕ Append Line Item
                             </button>
                         </div>

                         {/* Lines table */}
                         <div className="space-y-3">
                             {poLines.map((line, idx) => (
                                 <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-150 dark:border-slate-700 text-xs">
                                     <div className="col-span-5">
                                         <label className="text-[10px] font-bold text-slate-500">Product Model *</label>
                                         <select 
                                            value={line.product.id}
                                            onChange={(e) => handleLineProductChange(idx, parseInt(e.target.value, 10))}
                                            className="w-full mt-1 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-[11px] focus:outline-none text-slate-800 dark:text-zinc-150"
                                         >
                                             {MOCK_PRODUCTS.map(p => (
                                                 <option key={p.id} value={p.id}>{p.name}</option>
                                             ))}
                                         </select>
                                     </div>
                                     <div className="col-span-2">
                                         <label className="text-[10px] font-bold text-slate-500">Intake Qty</label>
                                         <input 
                                            type="number" 
                                            min={1}
                                            value={line.quantity || ''}
                                            onChange={(e) => handleLineQtyChange(idx, parseInt(e.target.value, 10) || 0)}
                                            className="w-full mt-1 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-center text-slate-900 dark:text-zinc-50 text-[11px]"
                                         />
                                     </div>
                                     <div className="col-span-3">
                                         <label className="text-[10px] font-bold text-slate-400">Trade Cost KES</label>
                                         <p className="p-1 font-mono text-[11px] font-bold mt-1 text-slate-800 dark:text-slate-300">
                                            {line.cost.toLocaleString()}
                                         </p>
                                     </div>
                                     <div className="col-span-2 text-right">
                                         <button 
                                            type="button"
                                            onClick={() => removePoLine(idx)}
                                            disabled={poLines.length === 1}
                                            className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100 disabled:opacity-30"
                                         >
                                             ❌
                                         </button>
                                     </div>
                                 </div>
                             ))}
                         </div>

                         {/* Total summary */}
                         <div className="p-3 bg-brand-orange/5 rounded-lg border border-brand-orange/10 flex justify-between font-bold text-sm">
                             <span className="text-slate-600 dark:text-slate-400">Est. Total Order Value (Trade Price)</span>
                             <span className="text-brand-orange font-black">
                               KES {poLines.reduce((acc, line) => acc + (line.cost * line.quantity), 0).toLocaleString()}
                             </span>
                         </div>

                         <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-700">
                             <button 
                               type="button" 
                               onClick={() => setIsCreateOpen(false)}
                               className="flex-1 py-2.5 font-bold text-xs border border-slate-300 dark:border-slate-600 dark:text-slate-300 rounded text-center"
                             >
                               Cancel Close
                             </button>
                             <button 
                               type="submit"
                               className="flex-1 py-2.5 font-bold text-xs bg-brand-orange hover:bg-brand-orange/90 text-white rounded text-center shadow-md uppercase"
                             >
                               Save PO (Status: Draft)
                             </button>
                         </div>
                     </form>
                 </div>
              </div>
            )}
        </div>
    );
};

export default Purchasing;

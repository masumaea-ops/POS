import React, { useState } from 'react';
import { 
  Receipt, 
  Search, 
  ChevronDown, 
  Eye, 
  Printer, 
  Download, 
  CheckCircle, 
  AlertCircle,
  FileText,
  X,
  CreditCard
} from 'lucide-react';
import { useSystemSettings } from '../contexts/SettingsContext';

interface InvoiceRecord {
  invoiceNumber: string;
  customer: string;
  date: string;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Partially Paid';
  amount: number;
  paidAmount: number;
  eTimsFsc: string;
  channel: 'B2B Wholesale' | 'POS Retail' | 'Quotation Converted';
}

const SAMPLE_INVOICES: InvoiceRecord[] = [
  {
    invoiceNumber: 'INV-2026-9481',
    customer: 'LYDIA',
    date: '8/21/2026',
    dueDate: '9/21/2026',
    status: 'Paid',
    amount: 5200,
    paidAmount: 5200,
    eTimsFsc: 'FSC-KRA-0921-99812',
    channel: 'Quotation Converted'
  },
  {
    invoiceNumber: 'INV-2026-9475',
    customer: 'LYDIA',
    date: '8/17/2026',
    dueDate: '9/17/2026',
    status: 'Paid',
    amount: 5500,
    paidAmount: 5500,
    eTimsFsc: 'FSC-KRA-0817-44129',
    channel: 'Quotation Converted'
  },
  {
    invoiceNumber: 'INV-2026-9474',
    customer: 'LYDIA',
    date: '8/17/2026',
    dueDate: '9/17/2026',
    status: 'Paid',
    amount: 5500,
    paidAmount: 5500,
    eTimsFsc: 'FSC-KRA-0817-44128',
    channel: 'Quotation Converted'
  },
  {
    invoiceNumber: 'INV-2026-9459',
    customer: 'LYDIA',
    date: '8/11/2026',
    dueDate: '9/11/2026',
    status: 'Paid',
    amount: 5500,
    paidAmount: 5500,
    eTimsFsc: 'FSC-KRA-0811-10294',
    channel: 'Quotation Converted'
  },
  {
    invoiceNumber: 'INV-2026-9430',
    customer: 'LYDIA',
    date: '8/7/2026',
    dueDate: '9/7/2026',
    status: 'Paid',
    amount: 18400,
    paidAmount: 18400,
    eTimsFsc: 'FSC-KRA-0807-66102',
    channel: 'Quotation Converted'
  },
  {
    invoiceNumber: 'INV-2026-9412',
    customer: 'LYDIA',
    date: '8/5/2026',
    dueDate: '9/5/2026',
    status: 'Paid',
    amount: 12400,
    paidAmount: 12400,
    eTimsFsc: 'FSC-KRA-0805-55912',
    channel: 'Quotation Converted'
  },
  {
    invoiceNumber: 'INV-2026-8801',
    customer: 'Express Auto Garage',
    date: '8/29/2026',
    dueDate: '9/29/2026',
    status: 'Pending',
    amount: 78500,
    paidAmount: 30000,
    eTimsFsc: 'FSC-KRA-0829-88012',
    channel: 'B2B Wholesale'
  },
  {
    invoiceNumber: 'INV-2026-8790',
    customer: 'Trans-East Fleet Logistics',
    date: '8/28/2026',
    dueDate: '9/28/2026',
    status: 'Pending',
    amount: 142000,
    paidAmount: 0,
    eTimsFsc: 'FSC-KRA-0828-87901',
    channel: 'B2B Wholesale'
  }
];

export const Invoices: React.FC = () => {
  const { formatPrice } = useSystemSettings();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);

  const filteredInvoices = SAMPLE_INVOICES.filter(inv => {
    const matchSearch = inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
                        inv.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex-1 bg-[#0b1324] text-white p-6 lg:p-8 overflow-y-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Tax Invoices
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            KRA eTIMS compliant fiscal invoices, payments, and receivables.
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-[#111c33] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
        
        {/* Card Header */}
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white leading-tight">
              All Invoices
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review settled invoices, credit terms, and fiscal signatures.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search invoice or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 sm:w-60 h-9 pl-8 pr-3 text-xs bg-[#0b1324] border border-slate-750 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5000]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-xl bg-[#0b1324] border border-slate-750 text-xs font-semibold text-slate-300 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 text-[11px] font-bold uppercase tracking-wider bg-[#0d1629]/50">
                <th className="py-3.5 px-5">INVOICE #</th>
                <th className="py-3.5 px-5">CUSTOMER</th>
                <th className="py-3.5 px-5">BILLING DATE</th>
                <th className="py-3.5 px-5">STATUS</th>
                <th className="py-3.5 px-5 text-right">AMOUNT</th>
                <th className="py-3.5 px-5 text-center">eTIMS FSC</th>
                <th className="py-3.5 px-5 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredInvoices.map((inv) => (
                <tr key={inv.invoiceNumber} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-5 font-mono text-slate-200 font-bold">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-4 px-5 font-semibold text-slate-200">
                    {inv.customer}
                  </td>
                  <td className="py-4 px-5 text-slate-400 font-mono">
                    {inv.date}
                  </td>
                  <td className="py-4 px-5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                      inv.status === 'Paid'
                        ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60'
                        : 'bg-amber-950/70 text-amber-400 border border-amber-800/60'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right font-mono font-bold text-slate-100">
                    {formatPrice(inv.amount)}
                  </td>
                  <td className="py-4 px-5 text-center font-mono text-[11px] text-slate-400">
                    {inv.eTimsFsc}
                  </td>
                  <td className="py-4 px-5 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(inv)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-750 transition cursor-pointer"
                      title="Inspect Invoice"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#111c33] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold text-[#ff5000] uppercase">Tax Invoice</span>
                <h3 className="text-xl font-bold text-white font-mono">{selectedInvoice.invoiceNumber}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Client:</span>
                <span className="text-white font-bold">{selectedInvoice.customer}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Date Issued:</span>
                <span className="text-white">{selectedInvoice.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Due Date:</span>
                <span className="text-white">{selectedInvoice.dueDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Payment Channel:</span>
                <span className="text-white">{selectedInvoice.channel}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">KRA eTIMS Signature:</span>
                <span className="text-emerald-400 font-bold">{selectedInvoice.eTimsFsc}</span>
              </div>
              <div className="flex justify-between py-2 text-base font-bold text-white">
                <span>Invoice Total:</span>
                <span className="text-[#ff5000]">{formatPrice(selectedInvoice.amount)}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl bg-[#ff5000] hover:bg-[#e04700] text-white font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Invoices;

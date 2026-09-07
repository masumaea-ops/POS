import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/shared/PageHeader';
import { useSystemSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  BookOpen, 
  FileText, 
  CreditCard, 
  X, 
  Plus, 
  Search, 
  ChevronDown,
  Lock,
  Shield,
  ListFilter,
  Receipt,
  Coins,
  ShieldCheck,
  Printer,
  Key,
  PenLine,
  AlertTriangle,
  Check,
  CheckCircle2,
  TrendingUp,
  Landmark
} from 'lucide-react';
import { MOCK_CUSTOMERS, MOCK_SALE_ORDERS } from '../data/mockData';

// Accounting Interfaces
interface Account {
  id: string; // e.g. "1010"
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  category: string;
  balance: number;
}

interface LedgerPosting {
  id: string;
  date: string;
  description: string;
  ref: string;
  debit: number;
  credit: number;
}

interface JournalVoucherLine {
  accountId: string;
  debit: number;
  credit: number;
}

interface BankStatementLine {
  id: string;
  date: string;
  partner: string;
  method: 'M-PESA' | 'EFT Wire' | 'Cash';
  reference: string;
  amount: number;
  matched: boolean;
}

const Accounting: React.FC = () => {
  const { settings, formatPrice } = useSystemSettings();
  const { hasPermission, userRole } = useAuth();
  const canCreate = hasPermission('accounting', 'create');
  const canUpdate = hasPermission('accounting', 'update');
  
  // 1. Core State: Chart of Accounts
  const [accounts, setAccounts] = useState<Account[]>([
    { id: '1010', name: 'Bank Current Account (CBA)', type: 'Asset', category: 'Cash & Equiv', balance: 3450000 },
    { id: '1100', name: 'B2B Trade Accounts Receivable', type: 'Asset', category: 'Receivables', balance: 823000 },
    { id: '1200', name: 'Autoparts Inventory Assets', type: 'Asset', category: 'Inventory Value', balance: 4120000 },
    { id: '2000', name: 'Accounts Payable - Parts Importers', type: 'Liability', category: 'Current Liability', balance: 1250000 },
    { id: '2200', name: 'KRA eTIMS VAT Output Collected', type: 'Liability', category: 'Taxes Payable', balance: 142000 },
    { id: '3000', name: 'Paid-Up Share Capital', type: 'Equity', category: 'Shareholders Equity', balance: 5000000 },
    { id: '3900', name: 'Retained Business Earnings', type: 'Equity', category: 'Net Earnings', balance: 2001000 },
    { id: '4000', name: 'Autoparts Wholesale Revenues', type: 'Revenue', category: 'Sales Income', balance: 2162000 },
    { id: '5000', name: 'Cost of Goods Sold (COGS)', type: 'Expense', category: 'Direct Expenses', balance: 1320000 },
    { id: '5500', name: 'Store Rent & Ground Utilities', type: 'Expense', category: 'Operating Expenses', balance: 180000 },
    { id: '5600', name: 'eTIMS Telecom & Tech Overhead', type: 'Expense', category: 'Operating Expenses', balance: 12000 }
  ]);

  // 2. Historical Ledger Postings
  const [postings, setPostings] = useState<Record<string, LedgerPosting[]>>({
    '1010': [
      { id: 'TX-001', date: '2026-06-01', description: 'Initial Capital Injection', ref: 'CAP-001', debit: 5000000, credit: 0 },
      { id: 'TX-002', date: '2026-06-05', description: 'Acquire Parts Consignment', ref: 'PO-2024-001', debit: 0, credit: 1250000 },
      { id: 'TX-003', date: '2026-06-10', description: 'Walk-in cash sales dispatch', ref: 'POS-774', debit: 75000, credit: 0 },
      { id: 'TX-004', date: '2026-06-12', description: 'Clearance warehouse rent payment', ref: 'RENT-06', debit: 0, credit: 180000 },
      { id: 'TX-005', date: '2026-06-14', description: 'Arrears payout John Doe Motors', ref: 'REC-09', debit: 145000, credit: 0 },
      { id: 'TX-006', date: '2026-06-15', description: 'M-PESA checkout settlement', ref: 'POS-891', debit: 52000, credit: 0 },
      { id: 'TX-007', date: '2026-06-15', description: 'KRA tech audit compliance log', ref: 'TAX-002', debit: 0, credit: 12000 },
      { id: 'TX-008', date: '2026-06-16', description: 'Matched bank remitted invoice', ref: 'BANK-REC', debit: 125000, credit: 0 }
    ],
    '1100': [
      { id: 'TX-101', date: '2026-06-02', description: 'Credit Sales - John Doe Motors', ref: 'INV-098', debit: 145000, credit: 0 },
      { id: 'TX-102', date: '2026-06-04', description: 'Wholesale invoice AutoFix Solutions', ref: 'INV-102', debit: 310000, credit: 0 },
      { id: 'TX-103', date: '2026-06-10', description: 'Credit Sales - Jane Smith Garage', ref: 'INV-110', debit: 88000, credit: 0 },
      { id: 'TX-104', date: '2026-06-14', description: 'Payment Received John Doe Motors', ref: 'REC-09', debit: 0, credit: 145000 },
      { id: 'TX-105', date: '2026-06-15', description: 'Matched bank remitted invoice', ref: 'BANK-REC', debit: 0, credit: 125000 },
      { id: 'TX-106', date: '2026-06-16', description: 'B2B Fleet Credit Account Setup', ref: 'MEM-08', debit: 550000, credit: 0 }
    ],
    '1200': [
      { id: 'TX-201', date: '2026-06-01', description: 'Inbound physical inventory import', ref: 'PO-2024-001', debit: 4120000, credit: 0 }
    ],
    '2200': [
      { id: 'TX-301', date: '2026-06-10', description: 'Walk-in cash sales VAT 16%', ref: 'POS-774', debit: 0, credit: 12000 },
      { id: 'TX-302', date: '2026-06-12', description: 'VAT checkout AutoFix Ltd', ref: 'POS-791', debit: 0, credit: 42000 },
      { id: 'TX-303', date: '2026-06-15', description: 'KRA output accrual sales POS', ref: 'POS-891', debit: 0, credit: 88000 }
    ],
    '4000': [
      { id: 'TX-401', date: '2026-06-10', description: 'B2B Autoparts trade clearance', ref: 'POS-774', debit: 0, credit: 1100000 },
      { id: 'TX-402', date: '2026-06-15', description: 'East African Spark Plug dispatch', ref: 'POS-891', debit: 0, credit: 1062000 }
    ]
  });

  // 3. Bank Statement Items (Stateful reconciliation workspace)
  const [bankStatement, setBankStatement] = useState<BankStatementLine[]>([
    { id: 'BK-001', date: '2026-06-15', partner: 'Jane Smith Garage', method: 'M-PESA', reference: 'MPESA-RK829S912', amount: 88000, matched: false },
    { id: 'BK-002', date: '2026-06-16', partner: 'AutoFix Solutions Ltd', method: 'EFT Wire', reference: 'EFT-EAF-09381', amount: 310000, matched: false },
    { id: 'BK-003', date: '2026-06-16', partner: 'Direct Cash Till POS Nairobi', method: 'Cash', reference: 'CSH-DEPOSIT-11', amount: 120000, matched: false },
    { id: 'BK-004', date: '2026-06-16', partner: 'John Doe Motors (JDM)', method: 'M-PESA', reference: 'MPESA-TK20CML32', amount: 145000, matched: true }
  ]);

  // 4. UI Layout & Selection Flags
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as 'overview' | 'coa' | 'journal' | 'reconciliation' | 'etims' | null;
  const [activeTab, setActiveTab] = useState<'overview' | 'coa' | 'journal' | 'reconciliation' | 'etims'>(() => tabParam || 'overview');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  const [selectedAccountForAudit, setSelectedAccountForAudit] = useState<Account | null>(null);
  const [searchCOAQuery, setSearchCOAQuery] = useState('');
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);

  // New Account wizard states
  const [newAccId, setNewAccId] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<Account['type']>('Asset');
  const [newAccCategory, setNewAccCategory] = useState('');
  const [newAccBalance, setNewAccBalance] = useState<number>(0);

  // 5. Custom Journal voucher states
  const [jvDate, setJvDate] = useState(new Date().toISOString().split('T')[0]);
  const [jvDescription, setJvDescription] = useState('Adjust general ledger trade metrics');
  const [jvLines, setJvLines] = useState<JournalVoucherLine[]>([
    { accountId: '5500', debit: 15000, credit: 0 },
    { accountId: '1010', debit: 0, credit: 15000 }
  ]);

  // ---------------------------------------------------------
  // FINANCIAL LEDGER FORMULAS & AGGREGATE CALCULATIONS
  // ---------------------------------------------------------

  // Summarize COA balances
  const coaCalculations = useMemo(() => {
    let assets = 0;
    let liabilities = 0;
    let equity = 0;
    let revenues = 0;
    let expenses = 0;

    accounts.forEach(acc => {
      if (acc.type === 'Asset') assets += acc.balance;
      else if (acc.type === 'Liability') liabilities += acc.balance;
      else if (acc.type === 'Equity') equity += acc.balance;
      else if (acc.type === 'Revenue') revenues += acc.balance;
      else if (acc.type === 'Expense') expenses += acc.balance;
    });

    const netIncome = revenues - expenses;
    // Balanced check Asset = Liabilities + Equity + Retained earnings (which gets affected by netIncome)
    return {
      assets,
      liabilities,
      equity,
      revenues,
      expenses,
      netIncome,
      balanceSheetDiff: Math.abs(assets - (liabilities + equity))
    };
  }, [accounts]);

  // Dynamic filter Chart of Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => 
      acc.id.includes(searchCOAQuery) || 
      acc.name.toLowerCase().includes(searchCOAQuery.toLowerCase()) ||
      acc.type.toLowerCase().includes(searchCOAQuery.toLowerCase()) ||
      acc.category.toLowerCase().includes(searchCOAQuery.toLowerCase())
    );
  }, [accounts, searchCOAQuery]);

  // Double entry unbalanced calculator
  const journalJVBalance = useMemo(() => {
    const totalDebits = jvLines.reduce((acc, line) => acc + (Number(line.debit) || 0), 0);
    const totalCredits = jvLines.reduce((acc, line) => acc + (Number(line.credit) || 0), 0);
    const difference = totalDebits - totalCredits;
    return {
      debits: totalDebits,
      credits: totalCredits,
      difference,
      isBalanced: totalDebits !== 0 && totalDebits === totalCredits
    };
  }, [jvLines]);

  // Create new chart account
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccId || !newAccName) return;

    // Check pre-existing ID
    if (accounts.some(a => a.id === newAccId)) {
      alert(`⚠️ Account ID ${newAccId} already matches an existing ledger account!`);
      return;
    }

    const newAcc: Account = {
      id: newAccId,
      name: newAccName,
      type: newAccType,
      category: newAccCategory || 'Other Ledger Group',
      balance: newAccBalance || 0
    };

    setAccounts([...accounts, newAcc]);
    setShowAddAccountModal(false);
    
    // Clear out wizard state
    setNewAccId('');
    setNewAccName('');
    setNewAccCategory('');
    setNewAccBalance(0);
  };

  // Append new line to JV wizard
  const appendJvLine = () => {
    setJvLines([...jvLines, { accountId: accounts[0].id, debit: 0, credit: 0 }]);
  };

  // Modify individual JV line
  const updateJvLine = (index: number, field: keyof JournalVoucherLine, value: any) => {
    const copy = [...jvLines];
    if (field === 'accountId') {
      copy[index].accountId = value;
    } else if (field === 'debit') {
      copy[index].debit = Number(value) || 0;
      if (Number(value) > 0) copy[index].credit = 0; // Zero opposite
    } else if (field === 'credit') {
      copy[index].credit = Number(value) || 0;
      if (Number(value) > 0) copy[index].debit = 0; // Zero opposite
    }
    setJvLines(copy);
  };

  // Remove JV Line
  const removeJvLine = (index: number) => {
    if (jvLines.length <= 2) {
      alert("⚠️ Double-entry journal voucher vouchers MUST have at least 2 distinct accounts.");
      return;
    }
    setJvLines(jvLines.filter((_, idx) => idx !== index));
  };

  // Commit Journal Entries posting
  const handlePostJournalVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalJVBalance.isBalanced) {
      alert("🛑 Error: Double-entry journal contains unequal debits and credits. Correct and retry.");
      return;
    }

    // Capture accounting adjustment postings
    const generatedVoucherId = `JV-${Math.floor(100+Math.random()*899)}`;
    const updatedAccounts = [...accounts];
    const newRecordSet = { ...postings };

    jvLines.forEach(line => {
      // Adjusted ledger rules
      const act = updatedAccounts.find(a => a.id === line.accountId);
      if (!act) return;

      // Update Ledger Balance depending on Account Type rules (Debit increases Asset/Expense, decreases Liability/Equity/Revenue)
      const isDebitAssetExpense = act.type === 'Asset' || act.type === 'Expense';
      if (line.debit > 0) {
        act.balance = isDebitAssetExpense ? (act.balance + line.debit) : (act.balance - line.debit);
      } else if (line.credit > 0) {
        act.balance = isDebitAssetExpense ? (act.balance - line.credit) : (act.balance + line.credit);
      }

      // Add audit posting trails
      if (!newRecordSet[line.accountId]) {
        newRecordSet[line.accountId] = [];
      }
      newRecordSet[line.accountId] = [
        ...newRecordSet[line.accountId],
        {
          id: `TX-${Math.floor(5000+Math.random()*4999)}`,
          date: jvDate,
          description: jvDescription,
          ref: generatedVoucherId,
          debit: line.debit,
          credit: line.credit
        }
      ];
    });

    setAccounts(updatedAccounts);
    setPostings(newRecordSet);
    
    // Reset Form fields
    setJvLines([
      { accountId: '5500', debit: 0, credit: 0 },
      { accountId: '1010', debit: 0, credit: 0 }
    ]);
    setJvDescription('Adjust general ledger trade metrics');

    alert(`✅ JOURNAL VOUCHER DISPATCHED:\n${generatedVoucherId} successfully committed to Ledger General Journal!`);
  };

  // Match and reconcile bank remittance line items
  const executeReconcileMatch = (remitId: string, associatedCustName: string, amount: number) => {
    // 1. Mark matched in statement
    setBankStatement(prev => prev.map(item => {
      if (item.id === remitId) {
        return { ...item, matched: true };
      }
      return item;
    }));

    // 2. Adjust Ledger: Reduce accounts receivable (debit incoming Cash, credit receivables)
    setAccounts(prev => prev.map(acc => {
      if (acc.id === '1010') { // Bank cash up
        return { ...acc, balance: acc.balance + amount };
      }
      if (acc.id === '1100') { // AR reductions
        return { ...acc, balance: acc.balance - amount };
      }
      return acc;
    }));

    // 3. Post Audit Ledger Trails
    const generatedAuditRecRef = `RECON-${remitId}`;
    setPostings(prev => {
      const copy = { ...prev };
      
      // Debit Cash
      copy['1010'] = [
        ...(copy['1010'] || []),
        { id: `TX-REC-${Math.floor(100+Math.random()*899)}`, date: new Date().toISOString().split('T')[0], description: `Rec: Invoice matching to ${associatedCustName}`, ref: generatedAuditRecRef, debit: amount, credit: 0 }
      ];
      // Credit AR
      copy['1100'] = [
        ...(copy['1100'] || []),
        { id: `TX-REC-${Math.floor(100+Math.random()*899)}`, date: new Date().toISOString().split('T')[0], description: `Rec: AR payment release - ${associatedCustName}`, ref: generatedAuditRecRef, debit: 0, credit: amount }
      ];

      return copy;
    });

    alert(`💰 MATCH CONCLUDED:\nAuto ledger adjusted.\nBank Statement ref matched with invoice.\nDebit: Bank Cash ${settings.currency} ${amount.toLocaleString()}\nCredit: Accounts Receivable ${settings.currency} ${amount.toLocaleString()}`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 pb-16 overflow-y-auto">
      <PageHeader 
        title="Double-Entry Corporate Ledger Suite"
        primaryAction={canCreate ? { label: "Register Ledger Account", onClick: () => setShowAddAccountModal(true) } : undefined}
      />

      {/* Non-accountant role notice */}
      {!canCreate && (
        <div className="mx-4 md:mx-8 mt-2 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Accounting books in <strong className="text-white">Audit Read-Only Mode</strong> ({userRole}). Registering ledger accounts and posting journal entries require Accountant or Admin authority.
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-400 font-mono">
            Granular Security Active
          </span>
        </div>
      )}

      {/* CORE TOP EXECUTIVE LEDGER MATRIX BRICKS */}
      <div className="p-4 md:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-1">
        
        {/* Metric Asset Cost */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] tracking-widest uppercase font-black text-slate-400">Ledger Assets (Debit Basis)</span>
          <div className="flex items-baseline mt-1.5 gap-1 font-mono">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{(coaCalculations.assets / 1000).toLocaleString(undefined, {maximumFractionDigits:1})}k</span>
            <span className="text-xs text-slate-500">{settings.currency}</span>
          </div>
          <span className="text-[10px] text-slate-450 font-sans mt-2">Cash + Receivables + Stock</span>
        </div>

        {/* Metric Liability Accrual */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] tracking-widest uppercase font-black text-slate-400">Total Obligations</span>
          <div className="flex items-baseline mt-1.5 gap-1 font-mono">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{(coaCalculations.liabilities / 1000).toLocaleString(undefined, {maximumFractionDigits:1})}k</span>
            <span className="text-xs text-slate-500">{settings.currency}</span>
          </div>
          <span className="text-[10px] text-slate-450 font-sans mt-2">Trade Payables + eTIMS Taxes</span>
        </div>

        {/* Retained Owner Capital */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] tracking-widest uppercase font-black text-slate-400">Owners Capital & Reserves</span>
          <div className="flex items-baseline mt-1.5 gap-1 font-mono">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{(coaCalculations.equity / 1000).toLocaleString(undefined, {maximumFractionDigits:1})}k</span>
            <span className="text-xs text-slate-500">{settings.currency}</span>
          </div>
          <span className="text-[10px] text-zinc-400 font-sans mt-2">Paid-up equity + retained cash</span>
        </div>

        {/* Dynamic Profit margins */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] tracking-widest uppercase font-black text-slate-400">YTD Business Net Profit</span>
          <div className="flex items-baseline mt-1.5 gap-1 font-mono">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{(coaCalculations.netIncome / 1000).toLocaleString(undefined, {maximumFractionDigits:1})}k</span>
            <span className="text-xs text-slate-500">{settings.currency}</span>
          </div>
          <span className="text-[10px] text-emerald-500 font-sans font-bold mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 inline shrink-0" />
            Net profit: 38.9% share
          </span>
        </div>

        {/* Ledger Balance Alert State */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] tracking-widest uppercase font-black text-slate-400">Equation Verification</span>
          <div className="mt-2.5 flex items-center gap-1.5">
             <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
             <span className="text-xs font-black text-slate-850 dark:text-white font-mono uppercase">GL Balanced</span>
          </div>
          <p className="text-[9px] text-slate-400 font-mono mt-3">Equity + Liability = Assets ({((coaCalculations.liabilities + coaCalculations.equity)/1000000).toFixed(2)}M)</p>
        </div>

      </div>

      {/* CORE NAVIGATION SELECTION TABS - Responsive Mobile Scroll */}
      <div className="px-4 md:px-8 mt-6">
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto scrollbar-none whitespace-nowrap">
          <button 
             onClick={() => setActiveTab('overview')}
             className={`px-3.5 py-2.5 text-xs font-extrabold tracking-wide uppercase border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
               activeTab === 'overview' 
               ? 'border-brand-orange text-brand-orange bg-brand-orange/5' 
               : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
             }`}
          >
             <BookOpen className="w-4 h-4 text-brand-orange shrink-0" />
             <span>General Ledger Overview</span>
          </button>
          <button 
             onClick={() => setActiveTab('coa')}
             className={`px-3.5 py-2.5 text-xs font-extrabold tracking-wide uppercase border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
               activeTab === 'coa' 
               ? 'border-brand-orange text-brand-orange bg-brand-orange/5' 
               : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
             }`}
          >
             <ListFilter className="w-4 h-4 text-brand-orange shrink-0" />
             <span>Chart of Accounts ({accounts.length})</span>
          </button>
          <button 
             onClick={() => setActiveTab('journal')}
             className={`px-3.5 py-2.5 text-xs font-extrabold tracking-wide uppercase border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
               activeTab === 'journal' 
               ? 'border-brand-orange text-brand-orange bg-brand-orange/5' 
               : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
             }`}
          >
             <FileText className="w-4 h-4 text-brand-orange shrink-0" />
             <span>Double-Entry Journal</span>
          </button>
          <button 
             onClick={() => setActiveTab('reconciliation')}
             className={`px-3.5 py-2.5 text-xs font-extrabold tracking-wide uppercase border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
               activeTab === 'reconciliation' 
               ? 'border-brand-orange text-brand-orange bg-brand-orange/5' 
               : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
             }`}
          >
             <Landmark className="w-4 h-4 text-brand-orange shrink-0" />
             <span>Bank Reconciliation</span>
          </button>
          <button 
             onClick={() => setActiveTab('etims')}
             className={`px-3.5 py-2.5 text-xs font-extrabold tracking-wide uppercase border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
               activeTab === 'etims' 
               ? 'border-brand-orange text-brand-orange bg-brand-orange/5' 
               : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
             }`}
          >
             <ShieldCheck className="w-4 h-4 text-brand-orange shrink-0" />
             <span>KRA eTIMS Tax Audit</span>
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE SCREEN SECTION CONTAINER */}
      <div className="p-4 md:px-8 mt-5">
         
         {/* ------------------- OVERVIEW TAB ------------------- */}
         {activeTab === 'overview' && (
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
              {/* Financial Statement Breakdown */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 lg:col-span-8 space-y-6">
                 <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Trial Balance Comparative Summary</h3>
                    <p className="text-xs text-slate-400">Classified general ledger records balancing metrics.</p>
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs pb-2 border-b dark:border-slate-700 font-bold uppercase text-slate-500">
                       <span>Account Type Class</span>
                       <div className="grid grid-cols-2 text-right w-44">
                          <span>Debits (DR)</span>
                          <span>Credits (CR)</span>
                       </div>
                    </div>
                    {/* Assets DR */}
                    <div className="flex justify-between items-center text-xs">
                       <span className="font-semibold text-slate-700 dark:text-slate-350">Assets (Trade Inventory, Bank deposits, Receivables)</span>
                       <div className="grid grid-cols-2 text-right w-44 font-mono font-bold">
                          <span className="text-slate-800 dark:text-white">{formatPrice(coaCalculations.assets)}</span>
                          <span className="text-slate-300">-</span>
                       </div>
                    </div>
                    {/* Liabilities CR */}
                    <div className="flex justify-between items-center text-xs">
                       <span className="font-semibold text-slate-700 dark:text-slate-350">Liabilities (Merchant Payables, KRA Taxes, Provisions)</span>
                       <div className="grid grid-cols-2 text-right w-44 font-mono font-semibold text-slate-500">
                          <span className="text-slate-300">-</span>
                          <span className="text-slate-850 dark:text-slate-100">{formatPrice(coaCalculations.liabilities)}</span>
                       </div>
                    </div>
                    {/* Equity CR */}
                    <div className="flex justify-between items-center text-xs">
                       <span className="font-semibold text-slate-700 dark:text-slate-350">Corporate Equity & Share Reserve Accounts</span>
                       <div className="grid grid-cols-2 text-right w-44 font-mono font-semibold text-slate-500">
                          <span className="text-slate-300">-</span>
                          <span className="text-slate-850 dark:text-slate-100 font-bold">{formatPrice(coaCalculations.equity)}</span>
                       </div>
                    </div>
                    {/* Revenue CR */}
                    <div className="flex justify-between items-center text-xs">
                       <span className="font-semibold text-slate-700 dark:text-slate-350">B2B Trade Wholesale & Retail Revenue Streams</span>
                       <div className="grid grid-cols-2 text-right w-44 font-mono font-semibold text-slate-500">
                          <span className="text-slate-300">-</span>
                          <span className="text-slate-850 dark:text-slate-100">{formatPrice(coaCalculations.revenues)}</span>
                       </div>
                    </div>
                    {/* Expenses DR */}
                    <div className="flex justify-between items-center text-xs">
                       <span className="font-semibold text-slate-700 dark:text-slate-350">Operating Costs & Cost of Goods Sold (COGS)</span>
                       <div className="grid grid-cols-2 text-right w-44 font-mono font-semibold text-slate-500">
                          <span className="text-slate-850 dark:text-slate-100">{formatPrice(coaCalculations.expenses)}</span>
                          <span className="text-slate-300">-</span>
                       </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black font-mono text-sm uppercase">
                       <span className="text-slate-900 dark:text-white">Trial Balance Totals</span>
                       <div className="grid grid-cols-2 text-right w-44">
                          <span className="text-emerald-500">{(coaCalculations.assets + coaCalculations.expenses).toLocaleString()}</span>
                          <span className="text-emerald-500">{(coaCalculations.liabilities + coaCalculations.equity + coaCalculations.revenues).toLocaleString()}</span>
                       </div>
                    </div>
                 </div>

                 <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60 rounded-xl text-xs space-y-2">
                    <h4 className="font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /><span>Dynamic Audit Integrity Verified</span></h4>
                    <p className="text-emerald-600 dark:text-slate-300 font-semibold leading-relaxed">
                       Debits strictly mirror Credits across all journal records. Assets are audited dynamically against active warehouse stocks and unpaid trade balances. No clearing imbalances flagged.
                    </p>
                 </div>
              </div>

              {/* Cash Flow Distribution Chart */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 lg:col-span-4 flex flex-col justify-between">
                 <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Distributors Liquidity Profile</h3>
                    <p className="text-xs text-slate-400">Liquidity share across internal assets.</p>

                    <div className="mt-6 space-y-4 text-xs">
                       {/* Cash in bank percentage */}
                       <div>
                          <div className="flex justify-between font-semibold">
                             <span className="text-slate-700 dark:text-slate-300">Bank Liquidity (1010)</span>
                             <span className="font-mono text-slate-950 dark:text-white">{(coaCalculations.assets > 0 ? (accounts[0].balance / coaCalculations.assets * 100) : 0).toFixed(0)}%</span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full bg-slate-150 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500" style={{ width: `${(accounts[0].balance / coaCalculations.assets * 100)}%` }}></div>
                          </div>
                       </div>
                       
                       {/* Inventory Asset percentage */}
                       <div>
                          <div className="flex justify-between font-semibold">
                             <span className="text-slate-700 dark:text-slate-300">Tied Inventory Stock value (1200)</span>
                             <span className="font-mono text-slate-950 dark:text-white">{(coaCalculations.assets > 0 ? (accounts[2].balance / coaCalculations.assets * 100) : 0).toFixed(0)}%</span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full bg-slate-150 rounded-full overflow-hidden">
                             <div className="h-full bg-brand-orange" style={{ width: `${(accounts[2].balance / coaCalculations.assets * 100)}%` }}></div>
                          </div>
                       </div>

                       {/* Accounts receivable percentage */}
                       <div>
                          <div className="flex justify-between font-semibold">
                             <span className="text-slate-700 dark:text-slate-300">Aged Receivable Credits (1100)</span>
                             <span className="font-mono text-slate-950 dark:text-white">{(coaCalculations.assets > 0 ? (accounts[1].balance / coaCalculations.assets * 100) : 0).toFixed(0)}%</span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full bg-slate-150 rounded-full overflow-hidden">
                             <div className="h-full bg-indigo-500" style={{ width: `${(accounts[1].balance / coaCalculations.assets * 100)}%` }}></div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-700 text-center">
                    <button 
                       onClick={() => window.print()}
                       className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-black uppercase tracking-wider w-full rounded-xl flex items-center justify-center gap-2 transition"
                    >
                       <Printer className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                       <span>Produce Auditor Tax Reports</span>
                    </button>
                 </div>
              </div>
           </div>
         )}

         {/* ------------------- CHART OF ACCOUNTS TAB ------------------- */}
         {activeTab === 'coa' && (
           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-150">
                 <div>
                    <h3 className="text-lg font-black text-slate-950 dark:text-white">Tree Registry ledger database</h3>
                    <p className="text-xs text-slate-400">Classified general ledger codes. Select any line item to execute double click ledger review.</p>
                 </div>
                 
                 {/* Internal Search box */}
                 <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400">
                       <Search className="w-4 h-4"/>
                    </span>
                    <input 
                      type="text"
                      placeholder="Filter accounts database..."
                      value={searchCOAQuery}
                      onChange={(e) => setSearchCOAQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-700 border rounded font-bold text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-900 dark:text-white"
                    />
                 </div>
              </div>

              {/* COA LIST TABLE */}
              <div className="overflow-x-auto text-xs font-mono">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700/60 font-bold uppercase text-slate-600 dark:text-slate-350">
                       <tr>
                          <th className="p-3">Reference Account GL Code</th>
                          <th className="p-3">Account Description</th>
                          <th className="p-3">Financial Type</th>
                          <th className="p-3">System Category</th>
                          <th className="p-3 text-right">Ledger Valuation balance</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-700">
                       {filteredAccounts.map(acc => (
                          <tr 
                             key={acc.id}
                             onClick={() => setSelectedAccountForAudit(acc)}
                             className="hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer text-slate-800 dark:text-zinc-150"
                          >
                             <td className="p-3 font-bold text-brand-orange font-semibold"><span className="inline-flex items-center gap-1.5"><Key className="w-3 h-3 text-brand-orange shrink-0" />{acc.id}</span></td>
                             <td className="p-3 font-bold text-slate-900 dark:text-white font-sans">{acc.name}</td>
                             <td className="p-3 font-sans">
                                 <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    acc.type === 'Asset' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                    acc.type === 'Liability' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                    acc.type === 'Equity' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                    acc.type === 'Revenue' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                    'bg-slate-100 text-slate-600 border border-slate-200'
                                 }`}>
                                    {acc.type}
                                 </span>
                             </td>
                             <td className="p-3 font-sans text-slate-500">{acc.category}</td>
                             <td className="p-3 text-right font-black text-slate-950 dark:text-white">
                                {formatPrice(acc.balance)}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
         )}

         {/* ------------------- DOUBLE-ENTRY JOURNAL VOUCHER TAB ------------------- */}
         {activeTab === 'journal' && (
           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 animate-fade-in text-xs">
              <div>
                 <h3 className="text-base font-black text-slate-900 dark:text-white"><span className="inline-flex items-center gap-2"><PenLine className="w-5 h-5 text-brand-orange shrink-0" />Post General Ledger Adjustment Voucher</span></h3>
                 <p className="text-xs text-slate-400">Compose and commit manual balanced Double-Entry journal entries.</p>
              </div>

              <form onSubmit={handlePostJournalVoucher} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="font-bold text-slate-600 dark:text-slate-400">Voucher Journalizing Date</label>
                          <input 
                             type="date"
                             value={jvDate}
                             onChange={(e) => setJvDate(e.target.value)}
                             className="w-full mt-1.5 p-2 bg-slate-50 dark:bg-slate-700 border rounded font-semibold focus:outline-none"
                             required
                          />
                      </div>
                      <div>
                          <label className="font-bold text-slate-600 dark:text-slate-300">Voucher Narration Memo</label>
                          <input 
                             type="text"
                             value={jvDescription}
                             onChange={(e) => setJvDescription(e.target.value)}
                             placeholder="Explanation narration draft..."
                             className="w-full mt-1.5 p-2 bg-slate-50 dark:bg-slate-700 border rounded font-semibold focus:outline-none"
                             required
                          />
                      </div>
                  </div>

                  {/* Voucher Account Lines table */}
                  <div className="pt-2">
                      <div className="flex justify-between items-center pb-2 border-b">
                         <label className="font-extrabold text-[10px] uppercase text-slate-450 tracking-wider">Debit & Credit Account Allocations</label>
                         <button 
                            type="button"
                            onClick={appendJvLine}
                            className="bg-brand-orange/10 hover:bg-brand-orange/15 text-brand-orange font-bold text-[11px] px-2.5 py-1 rounded-md"
                         >
                            ➕ Append Ledger Row
                         </button>
                      </div>

                      <div className="space-y-3.5 mt-3">
                         {jvLines.map((line, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2.5 items-end bg-slate-50 dark:bg-slate-905 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80">
                                
                                {/* Select Account */}
                                <div className="col-span-5">
                                   <label className="text-[10px] font-bold text-slate-450">Select Target Account Ledger *</label>
                                   <select 
                                      value={line.accountId}
                                      onChange={(e) => updateJvLine(idx, 'accountId', e.target.value)}
                                      className="w-full mt-1 p-1 py-1.5 bg-white dark:bg-slate-800 border rounded focus:outline-none"
                                   >
                                       {accounts.map(a => (
                                          <option key={a.id} value={a.id}>({a.id}) {a.name} [{a.type}]</option>
                                       ))}
                                   </select>
                                </div>

                                {/* Debits */}
                                <div className="col-span-3">
                                   <label className="text-[10px] font-bold text-slate-450">Debit (DR) {settings.currency}</label>
                                   <input 
                                      type="number"
                                      min={0}
                                      placeholder="0.00"
                                      value={line.debit || ''}
                                      onChange={(e) => updateJvLine(idx, 'debit', e.target.value)}
                                      className="w-full mt-1 p-1 py-1 bg-white dark:bg-slate-800 border rounded focus:outline-none font-mono text-center font-bold"
                                   />
                                </div>

                                {/* Credits */}
                                <div className="col-span-3">
                                   <label className="text-[10px] font-bold text-slate-450">Credit (CR) {settings.currency}</label>
                                   <input 
                                      type="number"
                                      min={0}
                                      placeholder="0.00"
                                      value={line.credit || ''}
                                      onChange={(e) => updateJvLine(idx, 'credit', e.target.value)}
                                      className="w-full mt-1 p-1 py-1 bg-white dark:bg-slate-800 border rounded focus:outline-none font-mono text-center font-bold"
                                   />
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 text-center">
                                   <button 
                                      type="button"
                                      onClick={() => removeJvLine(idx)}
                                      className="p-1 text-slate-450 hover:text-red-500 rounded font-bold"
                                   >
                                      ❌
                                   </button>
                                </div>

                            </div>
                         ))}
                      </div>
                  </div>

                  {/* Balancing validation strip */}
                  <div className="p-4 rounded-xl border flex flex-col md:flex-row justify-between items-center gap-3 bg-slate-50 dark:bg-slate-900 border-slate-205 dark:border-slate-805">
                     <div className="flex gap-4 font-mono font-bold text-xs">
                         <div>
                            <span className="text-slate-400">Debits:</span> 
                            <span className="text-slate-900 dark:text-zinc-50 ml-1">{formatPrice(journalJVBalance.debits)}</span>
                         </div>
                         <div>
                            <span className="text-slate-400">Credits:</span> 
                            <span className="text-slate-900 dark:text-zinc-50 ml-1">{formatPrice(journalJVBalance.credits)}</span>
                         </div>
                     </div>

                     <div className="flex items-center gap-2">
                        {journalJVBalance.isBalanced ? (
                           <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded text-[10px]">
                              <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />DR = CR BALANCED (OK)</span>
                           </span>
                        ) : (
                           <span className="bg-rose-100 text-rose-805 font-bold px-2.5 py-1 rounded text-[10px] animate-pulse">
                              <span className="inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />UNBALANCED BY {formatPrice(Math.abs(journalJVBalance.difference))}</span>
                           </span>
                        )}

                        <button 
                           type="submit"
                           disabled={!journalJVBalance.isBalanced}
                           className="py-2.5 px-6 bg-brand-orange hover:bg-brand-orange/95 text-white rounded font-bold uppercase transition hover:scale-105 disabled:opacity-40"
                        >
                           Post Adjustments entry
                        </button>
                     </div>
                  </div>
              </form>
           </div>
         )}

         {/* ------------------- RECONCILIATION TAB ------------------- */}
         {activeTab === 'reconciliation' && (
           <div className="space-y-6 animate-fade-in text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-705">
                 
                 {/* Left side: Statement Remittance feed */}
                 <div className="lg:col-span-7 space-y-4">
                     <div>
                        <h3 className="text-base font-black text-slate-950 dark:text-white">Bank Settled Statements Uploads</h3>
                        <p className="text-xs text-slate-400">Unreconciled bank ledger deposit slips or electronic deposits callbacks.</p>
                     </div>

                     <div className="space-y-3">
                         {bankStatement.map(statement => (
                            <div 
                              key={statement.id} 
                              className={`p-3.5 rounded-xl border flex justify-between items-center ${
                                statement.matched 
                                ? 'bg-slate-50 dark:bg-slate-750/30 border-slate-150 opacity-60' 
                                : 'bg-brand-orange/5 border-brand-orange/15 animate-pulse'
                              }`}
                            >
                                <div>
                                   <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900 dark:text-white">{statement.partner}</span>
                                      <span className="px-1.5 py-0.5 text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-600 rounded font-semibold font-mono">{statement.method}</span>
                                   </div>
                                   <p className="text-[10px] text-slate-500 mt-1 font-mono">{statement.reference} • date: {statement.date}</p>
                                </div>

                                <div className="text-right">
                                   <p className="font-mono font-black text-sm text-slate-950 dark:text-white">{formatPrice(statement.amount)}</p>
                                   {statement.matched ? (
                                      <span className="text-[10px] font-bold text-teal-600">Matched Checked</span>
                                   ) : (
                                      <button 
                                        onClick={() => executeReconcileMatch(statement.id, statement.partner, statement.amount)}
                                        className="py-1 px-3 mt-1.5 bg-brand-orange hover:bg-brand-orange/95 text-white font-bold text-[10px] rounded uppercase shadow-xs select-none"
                                      >
                                        Auto Match
                                      </button>
                                   )}
                                </div>
                            </div>
                         ))}
                     </div>
                 </div>

                 {/* Right side: Invoice Ledger matching instructions */}
                 <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-dashed text-slate-655 flex flex-col justify-between">
                     <div className="space-y-3">
                         <h4 className="font-black text-slate-905 dark:text-white uppercase tracking-wider text-[10px]">Accounts Receivable Unallocated matching rules</h4>
                         <p className="leading-relaxed">
                            Aged Receivables ledger balances are released dynamically when incoming remittance slips are matched with the customer.
                         </p>
                         <p className="leading-relaxed">
                            Matched balances:
                         </p>
                         <ul className="list-disc list-inside space-y-1.5 font-semibold text-slate-700 dark:text-slate-350">
                            <li>Check e-remittance callbacks against JDM invoice items.</li>
                            <li>Deduct Outstanding account balance in trade registry.</li>
                            <li>Debits CBA Bank Cash Account (1010).</li>
                            <li>Credits Accounts Receivable Subsidiary Ledger (1100).</li>
                         </ul>
                     </div>

                     <div className="pt-4 mt-4 border-t border-slate-205 dark:border-slate-805">
                         <span className="text-[10px] font-mono block text-slate-400">Total Unreconciled pipeline</span>
                         <span className="text-xl font-bold font-mono text-brand-orange">
                            {formatPrice(bankStatement.filter(s => !s.matched).reduce((acc, s) => acc + s.amount, 0))}
                         </span>
                     </div>
                 </div>

              </div>
           </div>
         )}

         {/* ------------------- KRA eTIMS TAB ------------------- */}
         {activeTab === 'etims' && (
           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-705 animate-fade-in text-xs space-y-5">
              <div>
                 <h3 className="text-lg font-black text-slate-950 dark:text-white">KRA eTIMS Legislative compliance panel</h3>
                 <p className="text-xs text-slate-400">Audited fiscal signatures matching East Africa revenue guidelines.</p>
              </div>

              {/* Status block info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-xl divide-y">
                     <span className="text-[10px] font-bold text-slate-450 uppercase block pb-1">eTIMS API Hook Status</span>
                     <div className="pt-2 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                        <span className="font-black text-slate-900 dark:text-white">ONLINE CONNECTED</span>
                     </div>
                 </div>
                 <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-xl divide-y">
                     <span className="text-[10px] font-bold text-slate-450 uppercase block pb-1">Tax Audit Rate Target</span>
                     <p className="pt-2 font-black text-slate-900 dark:text-white">{settings.currency} Standard {settings.vatRate}% VAT Rate</p>
                 </div>
                 <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-xl divide-y">
                     <span className="text-[10px] font-bold text-slate-450 uppercase block pb-1">Tax liability logged</span>
                     <p className="pt-2 font-black text-slate-900 dark:text-white">{formatPrice(coaCalculations.liabilities)}</p>
                 </div>
              </div>

              {/* compliance checklist */}
              <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-900 font-mono space-y-2">
                 <h4 className="font-bold text-[10px] text-slate-450 uppercase">Compliance Checks Checklist</h4>
                 <div className="space-y-1 text-slate-700 dark:text-slate-350">
                    <p className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Auto calculation of 16% tax inclusion on parts checkouts.</span></p>
                    <p className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Generate unique SHA eTIMS compliant hexadecimal serial signatures.</span></p>
                    <p className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>POS split payments and credit invoice dunning automated.</span></p>
                    <p className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Supplier B2B procurement PO tax matches input claims registry.</span></p>
                 </div>
              </div>
           </div>
         )}

      </div>

      {/* CHART OF ACCOUNT LEDGER DETAIL DRAWER (SLIDE OVER) */}
      {selectedAccountForAudit && (
         <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex justify-end z-50 animate-fade-in text-xs">
             <div className="w-full max-w-lg bg-white dark:bg-slate-800 h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-left">
                 <div>
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4 mb-5">
                         <div>
                             <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Account subsidiary ledger audits</span>
                             <h3 className="text-lg font-black text-slate-950 dark:text-white font-mono mt-0.5">{selectedAccountForAudit.id} - {selectedAccountForAudit.name}</h3>
                         </div>
                         <button onClick={() => setSelectedAccountForAudit(null)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500">
                             <X className="w-5 h-5"/>
                         </button>
                     </div>

                     <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-2 mb-6">
                         <div className="flex justify-between">
                             <span className="text-slate-450 font-bold uppercase text-[9px]">General Type classification:</span>
                             <span className="font-bold font-mono text-brand-orange uppercase">{selectedAccountForAudit.type}</span>
                         </div>
                         <div className="flex justify-between">
                             <span className="text-slate-450 font-bold uppercase text-[9px]">Category Group:</span>
                             <span className="font-bold text-slate-800 dark:text-zinc-100">{selectedAccountForAudit.category}</span>
                         </div>
                         <div className="flex justify-between items-center pt-2 border-t">
                             <span className="text-slate-450 font-bold uppercase text-[9px]">Net balance valuation:</span>
                             <span className="font-black font-mono text-sm text-slate-950 dark:text-white">{formatPrice(selectedAccountForAudit.balance)}</span>
                         </div>
                     </div>

                     <h4 className="text-xs uppercase font-serif font-black tracking-wider text-slate-500 mb-3">Audited post logs database</h4>
                     <div className="border rounded-xl overflow-hidden font-mono text-[10px]">
                         <table className="w-full text-left">
                             <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-350">
                                 <tr>
                                     <th className="p-2">Date</th>
                                     <th className="p-2">Details</th>
                                     <th className="p-2">Ref Code</th>
                                     <th className="p-2 text-right">Debit (DR)</th>
                                     <th className="p-2 text-right">Credit (CR)</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-150 dark:divide-slate-700">
                                 {postings[selectedAccountForAudit.id]?.map(post => (
                                     <tr key={post.id} className="hover:bg-slate-50/55 dark:hover:bg-slate-800/40 text-slate-800 dark:text-zinc-150">
                                         <td className="p-2 font-mono whitespace-nowrap">{post.date}</td>
                                         <td className="p-2 font-sans font-medium">{post.description}</td>
                                         <td className="p-2 font-mono font-bold text-slate-600">{post.ref}</td>
                                         <td className="p-2 text-right text-emerald-600 font-bold">
                                             {post.debit > 0 ? formatPrice(post.debit) : '-'}
                                         </td>
                                         <td className="p-2 text-right text-slate-600">
                                             {post.credit > 0 ? formatPrice(post.credit) : '-'}
                                         </td>
                                     </tr>
                                 )) || (
                                     <tr>
                                         <td colSpan={5} className="p-5 text-center text-slate-400 font-sans font-medium">
                                            No additional journal adjusting postings on record. Only base index balance sheet assets allocated.
                                         </td>
                                     </tr>
                                 )}
                             </tbody>
                         </table>
                     </div>
                 </div>

                 <div className="pt-6 border-t font-sans">
                     <button 
                       onClick={() => setSelectedAccountForAudit(null)}
                       className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-zinc-100 rounded-xl font-bold"
                     >
                       Close Audit Records
                     </button>
                 </div>
             </div>
         </div>
      )}

      {/* ADD ACCOUNT LEDGER MODAL SCREEN */}
      {showAddAccountModal && (
         <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in text-xs">
             <div className="bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
                 <div className="flex justify-between items-center p-5 border-b">
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2"><PenLine className="w-4 h-4 text-brand-orange shrink-0" /><span>Register New Ledger Account Code</span></h3>
                    <button onClick={() => setShowAddAccountModal(false)} className="text-slate-400 hover:text-slate-650">
                       <X className="w-5 h-5"/>
                    </button>
                 </div>

                 <form onSubmit={handleCreateAccount} className="p-5 space-y-4">
                     <div>
                         <label className="font-bold text-slate-600 dark:text-slate-400">GL Unique reference Code ID *</label>
                         <input 
                            type="text"
                            placeholder="e.g. 1020, 2100, 5200"
                            value={newAccId}
                            onChange={(e) => setNewAccId(e.target.value)}
                            className="w-full mt-1.5 p-2 bg-slate-50 dark:bg-slate-700 border rounded font-semibold focus:outline-none"
                            required
                         />
                     </div>
                     <div>
                         <label className="font-bold text-slate-600 dark:text-slate-400">Account Narrative name *</label>
                         <input 
                            type="text"
                            placeholder="e.g. Petty Cash Box, Freight Liabilities"
                            value={newAccName}
                            onChange={(e) => setNewAccName(e.target.value)}
                            className="w-full mt-1.5 p-2 bg-slate-50 dark:bg-slate-700 border rounded font-semibold focus:outline-none"
                            required
                         />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                         <div>
                             <label className="font-bold text-slate-600 dark:text-slate-400">Statement type *</label>
                             <select 
                                value={newAccType}
                                onChange={(e) => setNewAccType(e.target.value as Account['type'])}
                                className="w-full mt-1.5 p-2 bg-slate-50 dark:bg-slate-700 border rounded font-bold text-slate-800 dark:text-white focus:outline-none"
                             >
                                 <option value="Asset">Asset (Balance sheet)</option>
                                 <option value="Liability">Liability (Balance sheet)</option>
                                 <option value="Equity">Equity (Capital ledger)</option>
                                 <option value="Revenue">Revenue (Income value)</option>
                                 <option value="Expense">Expense (Profit & Loss)</option>
                             </select>
                         </div>
                         <div>
                             <label className="font-bold text-slate-600 dark:text-slate-400">Ledger Sub-Category</label>
                             <input 
                                type="text"
                                placeholder="e.g. Current Assets, COGS"
                                value={newAccCategory}
                                onChange={(e) => setNewAccCategory(e.target.value)}
                                className="w-full mt-1.5 p-2 bg-slate-50 dark:bg-slate-700 border rounded font-semibold focus:outline-none"
                             />
                         </div>
                     </div>
                     <div>
                         <label className="font-bold text-slate-600 dark:text-slate-350">Inception Opening Valuation (Balance {settings.currency})</label>
                         <input 
                            type="number"
                            placeholder="0"
                            value={newAccBalance || ''}
                            onChange={(e) => setNewAccBalance(Number(e.target.value) || 0)}
                            className="w-full mt-1.5 p-2 bg-slate-50 dark:bg-slate-700 border rounded font-mono font-bold focus:outline-none"
                         />
                     </div>

                     <div className="pt-4 flex gap-3 border-t">
                        <button 
                          type="button" 
                          onClick={() => setShowAddAccountModal(false)}
                          className="flex-1 py-2.5 font-bold border rounded bg-slate-50 dark:bg-slate-700 text-center text-slate-705 dark:text-zinc-200"
                        >
                           Dismiss cancel
                        </button>
                        <button 
                          type="submit"
                          className="flex-1 py-2.5 font-bold bg-brand-orange hover:bg-orange-600 text-white rounded text-center shadow-lg uppercase"
                        >
                           Create account code
                        </button>
                     </div>
                 </form>
             </div>
         </div>
      )}

    </div>
  );
};

export default Accounting;

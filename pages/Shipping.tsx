import React, { useState, useEffect } from 'react';
import PageHeader from '../components/shared/PageHeader';
import Table from '../components/shared/Table';
import { useSystemSettings } from '../contexts/SettingsContext';
import type { Shipment, Customer, SaleOrder } from '../types';
import { MOCK_SALE_ORDERS, MOCK_CUSTOMERS } from '../data/mockData';
import { X, Package, Truck, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

const COURIER_PARTNERS = [
  { id: 'dhl', name: 'DHL Express Kenya' },
  { id: 'g4s', name: 'G4S Logistics Secure' },
  { id: 'wells_fargo', name: 'Wells Fargo Courier' },
  { id: 'sendy', name: 'Sendy Freight' },
  { id: 'bodaboda', name: 'Bodaboda Moto Express' },
  { id: 'posta', name: 'Posta Kenya (PCK)' },
  { id: 'pickup', name: 'In-Store Counter Pickup' }
];

const INITIAL_SHIPMENTS: Shipment[] = [
  {
    id: 'SH-2026-001',
    orderId: 'SO-2026-101',
    customer: MOCK_CUSTOMERS[1] || { id: 2, name: 'John Doe', type: 'Credit', companyName: 'John Doe Motors (JDM)', email: 'john@jdmotors.co.ke', phone: '0712345678', tier: 'Wholesale A', creditLimit: 250000, outstandingBalance: 145000, kraPin: 'P001928374B', shippingAddress: 'Workshop No. 4, Baricho Road, Industrial Area, Nairobi' },
    courierName: 'Wells Fargo Courier',
    trackingNumber: 'WF-NBI-88902-X',
    status: 'Delivered',
    shippingCost: 3500,
    dispatchDate: '2026-06-25',
    etaDate: '2026-06-26',
    deliveryDate: '2026-06-26',
    notes: 'Fragile automotive parts - package with extra safety padding.',
    timeline: [
      { status: 'Delivered', timestamp: '2026-06-26 14:30', description: 'Package handed over and signed by JDM receiving clerk.', location: 'Baricho Road, Nairobi' },
      { status: 'Out for Delivery', timestamp: '2026-06-26 09:15', description: 'Out for final delivery with courier driver Samuel.', location: 'Industrial Area Hub, Nairobi' },
      { status: 'In Transit', timestamp: '2026-06-25 18:40', description: 'Consignment sorted and dispatched from primary hub.', location: 'Mombasa Road Main Depot' },
      { status: 'Dispatched', timestamp: '2026-06-25 11:20', description: 'Picked up by Wells Fargo courier agent.', location: 'Masuma Main Warehouse' },
      { status: 'Processing', timestamp: '2026-06-25 08:00', description: 'Waybill generated and products packed.', location: 'Masuma Main Warehouse' }
    ]
  },
  {
    id: 'SH-2026-002',
    orderId: 'SO-2026-102',
    customer: MOCK_CUSTOMERS[2] || { id: 3, name: 'Jane Smith', type: 'Credit', companyName: 'Jane Smith Garage', email: 'jane@jsgarage.co.ke', phone: '0787654321', tier: 'Wholesale B', creditLimit: 120000, outstandingBalance: 88000, kraPin: 'P011223344C', shippingAddress: 'Ngong Road, Opp. Junction Mall, Nairobi' },
    courierName: 'Bodaboda Moto Express',
    trackingNumber: 'BODA-NBO-551',
    status: 'In Transit',
    shippingCost: 850,
    dispatchDate: '2026-06-29',
    etaDate: '2026-06-29',
    notes: 'Deliver directly to Jane Smith or her head technician.',
    timeline: [
      { status: 'In Transit', timestamp: '2026-06-30 08:45', description: 'Rider on transit along Ngong Road bypass.', location: 'Ngong Road, Nairobi' },
      { status: 'Dispatched', timestamp: '2026-06-29 16:30', description: 'Handed over to Bodaboda Rider James.', location: 'Masuma Main Warehouse' },
      { status: 'Processing', timestamp: '2026-06-29 14:00', description: 'Invoiced and sorted.', location: 'Masuma Main Warehouse' }
    ]
  },
  {
    id: 'SH-2026-003',
    orderId: 'SO-2026-103',
    customer: MOCK_CUSTOMERS[3] || { id: 4, name: 'AutoFix Solutions', type: 'Credit', companyName: 'AutoFix Solutions Ltd', email: 'procurement@autofix.co.ke', phone: '0722000111', tier: 'Wholesale A', creditLimit: 500000, outstandingBalance: 310000, kraPin: 'A009988776Z', shippingAddress: 'Enterprise Road, Plot 12, Industrial Area, Nairobi' },
    courierName: 'DHL Express Kenya',
    trackingNumber: 'DHL-KNY-9901-Z',
    status: 'Processing',
    shippingCost: 5200,
    notes: 'Large order of brake pads & shocks. Requires heavy pallet delivery.',
    timeline: [
      { status: 'Processing', timestamp: '2026-06-30 09:00', description: 'Waybill registered. Packing heavy pallet boxes.', location: 'Masuma Main Warehouse' }
    ]
  }
];

const Shipping: React.FC = () => {
  const { settings, formatPrice } = useSystemSettings();
  const [shipments, setShipments] = useState<Shipment[]>(() => {
    const saved = localStorage.getItem('MASUMA_SHIPMENTS');
    return saved ? JSON.parse(saved) : INITIAL_SHIPMENTS;
  });

  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isNewShipmentOpen, setIsNewShipmentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isPrintLabelOpen, setIsPrintLabelOpen] = useState(false);

  // New Shipment Form states
  const [formOrderId, setFormOrderId] = useState('');
  const [formCustomer, setFormCustomer] = useState<Customer>(MOCK_CUSTOMERS[1] || MOCK_CUSTOMERS[0]);
  const [formCourier, setFormCourier] = useState('DHL Express Kenya');
  const [formTrackingNum, setFormTrackingNum] = useState('');
  const [formShippingCost, setFormShippingCost] = useState<number>(1200);
  const [formDispatchDate, setFormDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEta, setFormEta] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formCustomAddress, setFormCustomAddress] = useState('');
  const [formCustomKraPin, setFormCustomKraPin] = useState('');

  // Interactive Shipment status updater state
  const [updaterStatus, setUpdaterStatus] = useState<Shipment['status']>('In Transit');
  const [updaterDescription, setUpdaterDescription] = useState('');
  const [updaterLocation, setUpdaterLocation] = useState('Nairobi Hub');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('MASUMA_SHIPMENTS', JSON.stringify(shipments));
  }, [shipments]);

  // Pre-fill address and KRA pin when customer changes in form
  useEffect(() => {
    if (formCustomer) {
      setFormCustomAddress(formCustomer.shippingAddress || '');
      setFormCustomKraPin(formCustomer.kraPin || '');
    }
  }, [formCustomer]);

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();

    const shipmentId = `SH-2026-${Math.floor(100 + Math.random() * 899)}`;
    const actualTracking = formTrackingNum.trim() || `TRK-KNY-${Math.floor(100000 + Math.random() * 899000)}`;

    const newShipment: Shipment = {
      id: shipmentId,
      orderId: formOrderId || `SO-2026-${Math.floor(1000 + Math.random() * 8999)}`,
      customer: {
        ...formCustomer,
        shippingAddress: formCustomAddress.trim() || undefined,
        kraPin: formCustomKraPin.trim() || undefined
      },
      courierName: formCourier,
      trackingNumber: actualTracking,
      status: 'Processing',
      shippingCost: Number(formShippingCost) || 0,
      dispatchDate: formDispatchDate,
      etaDate: formEta ? formEta : undefined,
      notes: formNotes,
      timeline: [
        {
          status: 'Processing',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          description: `Shipment cycle initialized. Courier assigned: ${formCourier}.`,
          location: 'Masuma Main Warehouse'
        }
      ]
    };

    const updated = [newShipment, ...shipments];
    setShipments(updated);
    setIsNewShipmentOpen(false);

    // Reset form
    setFormOrderId('');
    setFormTrackingNum('');
    setFormNotes('');
  };

  const handleAddTimelineEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;

    const newEvent = {
      status: updaterStatus,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      description: updaterDescription.trim() || `Shipment status updated to ${updaterStatus}`,
      location: updaterLocation.trim() || 'Sorting facility'
    };

    const updatedTimeline = [newEvent, ...selectedShipment.timeline];

    const updatedShipments = shipments.map(s => {
      if (s.id === selectedShipment.id) {
        const updateData: Partial<Shipment> = {
          status: updaterStatus,
          timeline: updatedTimeline
        };
        if (updaterStatus === 'Delivered') {
          updateData.deliveryDate = new Date().toISOString().split('T')[0];
        } else if (updaterStatus === 'Dispatched') {
          updateData.dispatchDate = new Date().toISOString().split('T')[0];
        }
        return { ...s, ...updateData };
      }
      return s;
    });

    setShipments(updatedShipments);
    
    // Update active visual panel
    const currentUpdated = updatedShipments.find(s => s.id === selectedShipment.id);
    if (currentUpdated) {
      setSelectedShipment(currentUpdated);
    }

    setUpdaterDescription('');
    setUpdaterLocation('Nairobi Hub');
  };

  const getStatusBadge = (status: Shipment['status']) => {
    const classes: Record<Shipment['status'], string> = {
      'Processing': 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
      'Dispatched': 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30',
      'In Transit': 'bg-sky-100 text-sky-850 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-250 dark:border-sky-900/30',
      'Out for Delivery': 'bg-indigo-100 text-indigo-850 dark:bg-indigo-950/45 dark:text-indigo-300 border border-indigo-250 dark:border-indigo-900/30',
      'Delivered': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-955/40 dark:text-emerald-300 border border-emerald-250 dark:border-emerald-900/30',
      'Returned': 'bg-rose-100 text-rose-800 dark:bg-rose-955/40 dark:text-rose-300 border border-rose-250 dark:border-rose-900/30',
      'Exception': 'bg-red-100 text-red-800 dark:bg-red-955/40 dark:text-red-300 border border-red-250 dark:border-red-900/30'
    };

    return (
      <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md ${classes[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  // Filter shipments
  const filteredShipments = shipments.filter(ship => {
    const matchesSearch = 
      ship.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ship.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ship.trackingNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      ship.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ship.customer.companyName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || ship.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = shipments.filter(s => s.status !== 'Delivered' && s.status !== 'Returned').length;
  const transitCount = shipments.filter(s => s.status === 'In Transit' || s.status === 'Out for Delivery').length;
  const deliveredCount = shipments.filter(s => s.status === 'Delivered').length;
  const exceptionCount = shipments.filter(s => s.status === 'Exception' || s.status === 'Returned').length;

  const columns = [
    {
      header: 'Tracking Ref',
      accessor: (item: Shipment) => (
        <button 
          onClick={() => setSelectedShipment(item)}
          className="font-mono font-black text-brand-orange hover:underline text-left block"
        >
          🚚 {item.id}
        </button>
      )
    },
    {
      header: 'Client / Company',
      accessor: (item: Shipment) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">{item.customer.name}</span>
          <span className="text-[10px] text-slate-400 block">{item.customer.companyName || 'Cash Client'}</span>
        </div>
      )
    },
    {
      header: 'Courier Service',
      accessor: (item: Shipment) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-350">{item.courierName}</span>
          {item.trackingNumber && (
            <span className="text-[10px] text-slate-400 block font-mono">Waybill: {item.trackingNumber}</span>
          )}
        </div>
      )
    },
    {
      header: 'Fulfillment State',
      accessor: (item: Shipment) => getStatusBadge(item.status)
    },
    {
      header: 'Delivery Zone / Destination',
      accessor: (item: Shipment) => (
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={item.customer.shippingAddress}>
          📍 {item.customer.shippingAddress || 'Nairobi Counter Pickup'}
        </p>
      )
    },
    {
      header: 'Shipping Cost',
      accessor: (item: Shipment) => (
        <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
          {formatPrice(item.shippingCost)}
        </span>
      )
    },
    {
      header: 'Timeline Control',
      accessor: (item: Shipment) => (
        <div className="flex gap-2 justify-center">
          <button 
            onClick={() => setSelectedShipment(item)}
            className="px-2 py-1 text-[11px] bg-slate-100 dark:bg-slate-755 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded font-bold"
          >
            Track & Update
          </button>
          <button 
            onClick={() => {
              setSelectedShipment(item);
              setIsPrintLabelOpen(true);
            }}
            className="px-2 py-1 text-[11px] bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange rounded font-bold"
            title="Generate thermal barcoded label for delivery package"
          >
            🏷️ Print Label
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-900 min-h-full pb-12 text-slate-900 dark:text-slate-50 overflow-y-auto">
      <PageHeader 
        title="Shipping & Fulfillment Cycle Tracker"
        primaryAction={{ label: "Initialize Shipment Waybill", onClick: () => setIsNewShipmentOpen(true) }}
      />

      <div className="p-4 md:p-8 space-y-6">
        
        {/* LOGISTICS DASHBOARD COUNTERS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-750 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono font-black text-slate-450 tracking-wider">Active Deliveries</span>
              <h3 className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">{activeCount}</h3>
            </div>
            <div className="w-10 h-10 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-750 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono font-black text-slate-450 tracking-wider">In-Transit Cycle</span>
              <h3 className="text-2xl font-black font-mono text-sky-600 mt-1">{transitCount}</h3>
            </div>
            <div className="w-10 h-10 bg-sky-550/10 text-sky-500 rounded-full flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-750 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono font-black text-slate-450 tracking-wider">Completed Sign-offs</span>
              <h3 className="text-2xl font-black font-mono text-emerald-600 mt-1">{deliveredCount}</h3>
            </div>
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-750 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono font-black text-slate-450 tracking-wider">Failed / Return Cycle</span>
              <h3 className="text-2xl font-black font-mono text-rose-600 mt-1">{exceptionCount}</h3>
            </div>
            <div className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* SHIPMENTS DIRECTORY TABLE */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-sm font-black uppercase text-slate-400 font-mono tracking-wider">Waybill Ledger</h3>
              <p className="text-xs text-slate-500">Search and track all real-time client shipments through couriers</p>
            </div>

            {/* FILTERS TOOLBAR */}
            <div className="flex flex-wrap items-center gap-2.5">
              <input 
                type="text" 
                placeholder="🔍 Search tracking, client, order..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange w-56"
              />
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg text-xs font-bold focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Processing">Processing</option>
                <option value="Dispatched">Dispatched</option>
                <option value="In Transit">In Transit</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Returned">Returned</option>
                <option value="Exception">Exception</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <Table columns={columns} data={filteredShipments} />
          </div>
        </div>
      </div>

      {/* TRACKING TIMELINE & DETAIL SLIDE DRAWER */}
      {selectedShipment && !isPrintLabelOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-end z-50 animate-fade-in text-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-left text-xs">
            
            {/* Drawer Header */}
            <div>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Consignment Waybill Tracker</span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">{selectedShipment.id}</h3>
                </div>
                <button 
                  onClick={() => setSelectedShipment(null)} 
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500"
                >
                  <X className="w-5 h-5"/>
                </button>
              </div>

              {/* Waybill quick summary */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-750 mb-5">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400">B2B Client Profile</span>
                  <p className="font-extrabold text-slate-900 dark:text-white text-xs mt-0.5">{selectedShipment.customer.name}</p>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">{selectedShipment.customer.phone || 'No phone'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Fulfillment Cycle</span>
                  <div className="mt-1">{getStatusBadge(selectedShipment.status)}</div>
                </div>

                <div className="col-span-2 border-t border-slate-200 dark:border-slate-750 pt-2 text-[10px] text-slate-650 dark:text-slate-350 space-y-1">
                  <div>🚚 <span className="font-bold">Courier Name:</span> {selectedShipment.courierName}</div>
                  {selectedShipment.trackingNumber && (
                    <div>🏷️ <span className="font-bold">Waybill Ref / Airbill:</span> <span className="font-mono text-xs text-brand-orange font-bold">{selectedShipment.trackingNumber}</span></div>
                  )}
                  {selectedShipment.customer.kraPin && (
                    <div>🏷️ <span className="font-bold">Client KRA PIN:</span> <span className="font-mono text-slate-700 dark:text-slate-350 font-bold">{selectedShipment.customer.kraPin}</span></div>
                  )}
                  <div>📍 <span className="font-bold">Shipping Destination Address:</span> <span className="font-semibold text-slate-800 dark:text-white">{selectedShipment.customer.shippingAddress || 'Nairobi Counter Pickup'}</span></div>
                  {selectedShipment.notes && (
                    <div className="bg-white dark:bg-slate-850 p-2 rounded border border-slate-100 dark:border-slate-800 italic text-slate-500 mt-1">
                      📝 "{selectedShipment.notes}"
                    </div>
                  )}
                </div>
              </div>

              {/* PRINT LABEL ACTION INSIDE DETAIL */}
              <button 
                type="button"
                onClick={() => setIsPrintLabelOpen(true)}
                className="w-full py-2.5 mb-5 bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 rounded-xl font-extrabold uppercase tracking-wider text-center select-none flex items-center justify-center gap-2 border border-brand-orange/20"
              >
                <span>🏷️</span>
                <span>Generate Thermal Shipping Label</span>
              </button>

              {/* STAGE STATUS UPDATER */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 mb-6">
                <span className="text-[10px] uppercase font-mono font-black tracking-wider text-slate-450 block">Logistical Cycle Status Updater</span>
                
                <form onSubmit={handleAddTimelineEvent} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Advance Status To</label>
                      <select
                        value={updaterStatus}
                        onChange={(e) => setUpdaterStatus(e.target.value as any)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border dark:border-slate-750 rounded text-xs font-bold focus:outline-none"
                      >
                        <option value="Dispatched">Dispatched</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered (Complete)</option>
                        <option value="Returned">Returned</option>
                        <option value="Exception">Exception</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Transit / Scan Location</label>
                      <input 
                        type="text"
                        value={updaterLocation}
                        onChange={(e) => setUpdaterLocation(e.target.value)}
                        placeholder="e.g. Mombasa Port or Hub"
                        required
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border dark:border-slate-750 rounded text-xs focus:outline-none text-slate-900 dark:text-white font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Waybill Event Log Remarks</label>
                    <input 
                      type="text"
                      value={updaterDescription}
                      onChange={(e) => setUpdaterDescription(e.target.value)}
                      placeholder="e.g. Scanned into primary Mombasa sorting depot"
                      required
                      className="w-full p-2 bg-slate-50 dark:bg-slate-900 border dark:border-slate-750 rounded text-xs focus:outline-none text-slate-900 dark:text-white"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2 bg-slate-900 hover:bg-slate-950 dark:bg-slate-700 dark:hover:bg-slate-650 text-white rounded font-bold uppercase text-[10px] tracking-wider transition-all"
                  >
                    Post Log Scan & Transition Status ⚡
                  </button>
                </form>
              </div>

              {/* TRACKING TIMELINE STEPS */}
              <h4 className="text-[10px] uppercase font-mono font-black text-slate-450 tracking-wider mb-3 block">Shipment Timeline Scan Trails</h4>
              <div className="relative pl-4 border-l border-slate-200 dark:border-slate-700 ml-2.5 space-y-4">
                {selectedShipment.timeline.map((item, idx) => (
                  <div key={idx} className="relative">
                    {/* Event Node bullet */}
                    <span className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${
                      idx === 0 
                        ? 'bg-brand-orange animate-pulse ring-4 ring-brand-orange/15' 
                        : item.status === 'Delivered' 
                          ? 'bg-emerald-500' 
                          : 'bg-slate-400'
                    }`} />
                    
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-extrabold text-slate-850 dark:text-white uppercase tracking-wide">
                        {item.status}
                      </span>
                      <span className="text-slate-400 font-mono">{item.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-350 font-medium mt-0.5">
                      {item.description}
                    </div>
                    <div className="text-[9px] text-brand-orange font-mono uppercase tracking-wider mt-0.5">
                      📍 {item.location}
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Close Drawer Button */}
            <div className="pt-6 border-t border-slate-150 dark:border-slate-700">
              <button 
                onClick={() => setSelectedShipment(null)}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-zinc-200 font-bold rounded-xl transition-all"
              >
                Dismiss Tracker View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW WAYBILL INITIALIZER DIALOG */}
      {isNewShipmentOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in text-xs text-slate-855">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700">
              <div>
                <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400">Masuma Logistics</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">Initialize Consignment Waybill</h3>
              </div>
              <button onClick={() => setIsNewShipmentOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Sale Invoice Reference #</label>
                  <select
                    value={formOrderId}
                    onChange={(e) => setFormOrderId(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border dark:border-slate-750 rounded text-xs focus:outline-none font-mono text-slate-800 dark:text-zinc-200 font-bold"
                  >
                    <option value="">-- Autogenerate Reference --</option>
                    {MOCK_SALE_ORDERS.map(o => (
                      <option key={o.id} value={o.id}>{o.id} ({o.customer.name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Target Client Profile *</label>
                  <select
                    value={formCustomer.id}
                    onChange={(e) => {
                      const cust = MOCK_CUSTOMERS.find(c => c.id === parseInt(e.target.value, 10));
                      if (cust) setFormCustomer(cust);
                    }}
                    required
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border dark:border-slate-750 rounded text-xs focus:outline-none text-slate-800 dark:text-zinc-200 font-bold"
                  >
                    {MOCK_CUSTOMERS.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Courier Logistics Partner</label>
                  <select
                    value={formCourier}
                    onChange={(e) => setFormCourier(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border dark:border-slate-750 rounded text-xs focus:outline-none text-slate-800 dark:text-zinc-200 font-bold"
                  >
                    {COURIER_PARTNERS.map(cp => (
                      <option key={cp.id} value={cp.name}>{cp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Custom Tracking Waybill (Optional)</label>
                  <input 
                    type="text"
                    value={formTrackingNum}
                    onChange={(e) => setFormTrackingNum(e.target.value)}
                    placeholder="e.g. WF-NBI-7718A"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border dark:border-slate-750 rounded text-xs focus:outline-none font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Shipping Logistics Fee (KES)</label>
                  <input 
                    type="number"
                    value={formShippingCost}
                    onChange={(e) => setFormShippingCost(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border dark:border-slate-750 rounded text-xs focus:outline-none font-mono text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Dispatch / Pickup Date</label>
                  <input 
                    type="date"
                    value={formDispatchDate}
                    onChange={(e) => setFormDispatchDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border dark:border-slate-750 rounded text-xs focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Estimated Arrival (ETA)</label>
                  <input 
                    type="date"
                    value={formEta}
                    onChange={(e) => setFormEta(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border dark:border-slate-750 rounded text-xs focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Client Tax ID (KRA PIN)</label>
                  <input 
                    type="text"
                    value={formCustomKraPin}
                    onChange={(e) => setFormCustomKraPin(e.target.value.toUpperCase())}
                    maxLength={11}
                    placeholder="e.g. A012345678B"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border dark:border-slate-750 rounded text-xs focus:outline-none font-mono text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Delivery Destination Address *</label>
                <textarea 
                  value={formCustomAddress}
                  onChange={(e) => setFormCustomAddress(e.target.value)}
                  placeholder="e.g. Enterprise Road Industrial Area, Nairobi"
                  required
                  rows={2}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border dark:border-slate-750 rounded text-xs focus:outline-none text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Consignment Safety Notes / Directives</label>
                <input 
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Do not pile heavy boxes on top"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border dark:border-slate-750 rounded text-xs focus:outline-none text-slate-900 dark:text-white italic"
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-700">
                <button 
                  type="button" 
                  onClick={() => setIsNewShipmentOpen(false)}
                  className="flex-1 py-2.5 font-bold border dark:border-slate-700 rounded text-center text-slate-700 dark:text-zinc-350"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 font-bold bg-brand-orange hover:bg-brand-orange/95 text-white rounded text-center shadow-md uppercase"
                >
                  Create Waybill Ledger ⚡
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4"x6" PRINTABLE THERMAL SHIPPING LABEL DIALOG */}
      {selectedShipment && isPrintLabelOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-300 shadow-2xl overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-center p-4 bg-slate-100 border-b border-slate-200">
              <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Shipping Label Preview</span>
              </h3>
              <button 
                onClick={() => setIsPrintLabelOpen(false)} 
                className="p-1 hover:bg-slate-200 text-slate-500 rounded-full"
              >
                ✕
              </button>
            </div>

            {/* THE PRINTABLE REGION */}
            <div className="p-6 bg-slate-200 flex justify-center">
              
              {/* Thermal label box (simulated 4x6 inch paper) */}
              <div 
                id="printable-shipping-label"
                className="w-80 bg-white border-4 border-black p-4 text-black font-sans leading-tight select-none shadow-lg text-[11px]"
                style={{ fontFamily: '"Courier New", Courier, monospace' }}
              >
                {/* Header info */}
                <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-2">
                  <div>
                    <span className="text-xs font-black tracking-widest block uppercase">{settings.corpShortName || 'MASUMA'} LOGISTICS</span>
                    <span className="text-[8px] font-bold block">{settings.corpName || 'Masuma Auto Spares Ltd'}</span>
                    <span className="text-[8px] block">Nairobi Warehouse Hub</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black border-2 border-black px-1.5 py-0.5 rounded">EXPRESS</span>
                    <span className="text-[8px] block mt-1 font-mono font-bold">{selectedShipment.id}</span>
                  </div>
                </div>

                {/* Sender/Recipient Section */}
                <div className="border-b-2 border-black pb-2 mb-2 space-y-1">
                  <div>
                    <span className="text-[8px] uppercase font-bold tracking-wider block">FROM (SENDER):</span>
                    <span className="font-bold">{settings.corpShortName || 'Masuma'} Parts Distributors Ltd</span>
                    <span className="block text-[9px]">{settings.corpAddress || 'Kirinyaga Road, Nairobi, Kenya'}</span>
                    <span className="block text-[9px]">Tel: {settings.corpPhone || '0700000000'}</span>
                  </div>
                </div>

                <div className="border-b-2 border-black pb-2 mb-2 space-y-1 bg-black/5 p-1.5 rounded">
                  <div>
                    <span className="text-[8px] uppercase font-bold tracking-wider block font-sans">TO (SHIP RECIPIENT):</span>
                    <span className="font-black text-xs block uppercase">{selectedShipment.customer.name}</span>
                    {selectedShipment.customer.companyName && (
                      <span className="font-bold text-[10px] block">{selectedShipment.customer.companyName}</span>
                    )}
                    <span className="block font-bold mt-1 text-[10px]">📍 Destination Address:</span>
                    <span className="block font-black text-[10px] bg-white border border-black p-1 rounded break-words uppercase">
                      {selectedShipment.customer.shippingAddress || 'Nairobi Counter Pickup'}
                    </span>
                    <span className="block text-[9px] mt-1">📞 Contact Phone: {selectedShipment.customer.phone || 'No phone registered'}</span>
                    {selectedShipment.customer.kraPin && (
                      <span className="block text-[9px] font-mono font-black mt-0.5">🏷️ KRA PIN: {selectedShipment.customer.kraPin}</span>
                    )}
                  </div>
                </div>

                {/* Courier, Zone and Routing Code */}
                <div className="grid grid-cols-2 gap-2 border-b-2 border-black pb-2 mb-2 font-sans">
                  <div>
                    <span className="text-[8px] uppercase font-bold block">CARRIER / COURIER:</span>
                    <span className="font-black block text-[10px] uppercase">{selectedShipment.courierName}</span>
                    <span className="text-[8px] block mt-1">WAYBILL WAYPOINT:</span>
                    <span className="font-black block font-mono">NAI / ZONE-A</span>
                  </div>
                  <div className="border-l-2 border-black pl-2 text-center flex flex-col justify-center">
                    <span className="text-[8px] uppercase font-bold block">ROUTING PORT:</span>
                    <span className="text-xl font-black block">NBO-01</span>
                  </div>
                </div>

                {/* Tracking bar code & code */}
                <div className="flex flex-col items-center justify-center py-2.5">
                  {/* Pseudo Barcode Representation */}
                  <div className="flex h-11 items-end gap-[1.5px] bg-white w-full justify-center px-1 mb-1">
                    <span className="w-[1px] h-full bg-black" />
                    <span className="w-[3px] h-full bg-black" />
                    <span className="w-[1px] h-full bg-black" />
                    <span className="w-[2px] h-full bg-black" />
                    <span className="w-[4px] h-full bg-black" />
                    <span className="w-[1px] h-full bg-black" />
                    <span className="w-[3px] h-full bg-black" />
                    <span className="w-[2px] h-full bg-black" />
                    <span className="w-[1px] h-full bg-black" />
                    <span className="w-[4px] h-full bg-black" />
                    <span className="w-[2px] h-full bg-black" />
                    <span className="w-[1px] h-full bg-black" />
                    <span className="w-[3px] h-full bg-black" />
                    <span className="w-[1px] h-full bg-black" />
                    <span className="w-[4px] h-full bg-black" />
                    <span className="w-[1px] h-full bg-black" />
                    <span className="w-[3px] h-full bg-black" />
                    <span className="w-[2px] h-full bg-black" />
                    <span className="w-[1px] h-full bg-black" />
                    <span className="w-[4px] h-full bg-black" />
                    <span className="w-[1px] h-full bg-black" />
                    <span className="w-[2px] h-full bg-black" />
                    <span className="w-[4px] h-full bg-black" />
                    <span className="w-[2px] h-full bg-black" />
                    <span className="w-[1px] h-full bg-black" />
                  </div>
                  <span className="text-[9px] font-bold font-mono tracking-widest text-center block">
                    * {selectedShipment.trackingNumber || selectedShipment.id} *
                  </span>
                </div>

                {/* Bottom weight & date */}
                <div className="border-t-2 border-black pt-1.5 flex justify-between text-[8px] font-mono font-bold">
                  <span>Weight: 4.80 KG (BOX 1 OF 1)</span>
                  <span>Issued: {selectedShipment.dispatchDate || '2026-06-30'}</span>
                </div>

              </div>

            </div>

            {/* Thermal Print Commands */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex gap-2">
              <button 
                type="button" 
                onClick={() => setIsPrintLabelOpen(false)}
                className="flex-1 py-2 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-center select-none"
              >
                Close Preview
              </button>
              <button 
                type="button" 
                onClick={() => {
                  const printContent = document.getElementById('printable-shipping-label')?.outerHTML;
                  if (printContent) {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Print Shipping Label - ${selectedShipment.id}</title>
                            <style>
                              body { margin: 0; padding: 20px; display: flex; justify-content: center; background-color: white; }
                              @media print {
                                body { padding: 0; }
                                #printable-shipping-label { border: 2px solid black !important; box-shadow: none !important; }
                              }
                            </style>
                          </head>
                          <body>
                            ${printContent}
                            <script>
                              window.onload = function() {
                                window.print();
                                setTimeout(function() { window.close(); }, 500);
                              };
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }
                }}
                className="flex-1 py-2 text-xs bg-black hover:bg-black/90 text-white rounded-xl font-black uppercase tracking-wider text-center select-none shadow-md"
              >
                🖨️ Direct Thermal Print
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Shipping;

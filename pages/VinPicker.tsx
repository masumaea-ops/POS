import React, { useState } from 'react';
import { 
  Car, 
  Search, 
  CheckCircle, 
  ShoppingCart, 
  FileText, 
  Wrench, 
  Sparkles,
  Info,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSystemSettings } from '../contexts/SettingsContext';
import { MOCK_PRODUCTS } from '../data/mockData';

export const VinPicker: React.FC = () => {
  const { formatPrice } = useSystemSettings();
  const navigate = useNavigate();
  
  const [vinQuery, setVinQuery] = useState('JTDBR32E602019482');
  const [isDecoded, setIsDecoded] = useState(true);

  // Decoded vehicle profile
  const vehicle = {
    vin: 'JTDBR32E602019482',
    make: 'Toyota',
    model: 'Premio / Allion (NZT260 / ZRT261)',
    year: '2016 - 2021',
    engine: '1.8L DOHC Dual VVT-i (2ZR-FAE)',
    chassis: 'ZRT260-3019281',
    transmission: 'Super CVT-i',
    drivetrain: 'FWD Front-Wheel Drive',
    market: 'Japan Domestic / East Africa Import'
  };

  // Preset sample VINs for quick testing
  const presetVins = [
    { label: 'Toyota Premio (2ZR-FAE)', vin: 'JTDBR32E602019482' },
    { label: 'Nissan X-Trail T32 (MR20DD)', vin: 'JN1TBNT32U0019283' },
    { label: 'Subaru Forester SJ5 (FB20)', vin: 'JF2SJ5LL0DH019284' },
    { label: 'Mazda CX-5 KE (SkyActiv-G)', vin: 'JMZKE2W7100192831' }
  ];

  const handleDecode = (e: React.FormEvent) => {
    e.preventDefault();
    if (vinQuery.trim().length < 5) return;
    setIsDecoded(true);
  };

  const handleSelectPreset = (vin: string) => {
    setVinQuery(vin);
    setIsDecoded(true);
  };

  return (
    <div className="flex-1 bg-[#0b1324] text-white p-6 lg:p-8 overflow-y-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>VIN & Chassis Picker</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#ff5000]/20 text-[#ff5000] border border-[#ff5000]/30">
              Auto Parts Matcher
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Decode 17-digit VIN or Japanese chassis prefix to isolate guaranteed OEM/Masuma replacement parts.
          </p>
        </div>
      </div>

      {/* VIN Input & Search Card */}
      <div className="bg-[#111c33] border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
        <form onSubmit={handleDecode} className="space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Enter VIN or Chassis Frame Number
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={vinQuery}
                onChange={(e) => setVinQuery(e.target.value.toUpperCase())}
                placeholder="e.g. JTDBR32E602019482 or NZT260-001892"
                className="w-full h-12 pl-11 pr-4 bg-[#0b1324] border border-slate-750 focus:border-[#ff5000] rounded-xl text-white font-mono text-sm tracking-wider uppercase focus:outline-none"
              />
              <Car className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            </div>

            <button
              type="submit"
              className="h-12 px-6 rounded-xl bg-[#ff5000] hover:bg-[#e04700] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition"
            >
              <Search className="w-4 h-4" />
              <span>Decode & Match Parts</span>
            </button>
          </div>

          {/* Preset Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold">Common East Africa Models:</span>
            {presetVins.map((p) => (
              <button
                key={p.vin}
                type="button"
                onClick={() => handleSelectPreset(p.vin)}
                className={`px-3 py-1 rounded-lg border text-[11px] font-mono transition cursor-pointer ${
                  vinQuery === p.vin
                    ? 'bg-[#ff5000]/20 border-[#ff5000] text-[#ff5000] font-bold'
                    : 'bg-[#0b1324] border-slate-750 text-slate-300 hover:text-white hover:border-slate-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Decoded Vehicle Profile & Compatible Parts */}
      {isDecoded && (
        <div className="space-y-6">
          
          {/* Decoded Specs Card */}
          <div className="bg-[#111c33] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">{vehicle.make} {vehicle.model}</h2>
                  <p className="text-xs font-mono text-slate-400">{vehicle.engine} • {vehicle.year}</p>
                </div>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-lg bg-slate-900 text-emerald-400 border border-slate-750">
                100% Guaranteed Fitment
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-[#0b1324] rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Drivetrain</span>
                <span className="font-semibold text-white mt-1 block">{vehicle.drivetrain}</span>
              </div>
              <div className="p-3 bg-[#0b1324] rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Transmission</span>
                <span className="font-semibold text-white mt-1 block">{vehicle.transmission}</span>
              </div>
              <div className="p-3 bg-[#0b1324] rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Chassis Code</span>
                <span className="font-mono font-semibold text-[#ff5000] mt-1 block">{vehicle.chassis}</span>
              </div>
              <div className="p-3 bg-[#0b1324] rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Regional Spec</span>
                <span className="font-semibold text-white mt-1 block">{vehicle.market}</span>
              </div>
            </div>
          </div>

          {/* Compatible Masuma Parts Grid */}
          <div className="bg-[#111c33] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Verified Compatible Masuma Autoparts
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct fit replacement components with Japanese metallurgy specifications.
                </p>
              </div>
              <span className="text-xs text-slate-400">
                Showing {MOCK_PRODUCTS.slice(0, 6).length} matched components
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_PRODUCTS.slice(0, 6).map((prod) => (
                <div
                  key={prod.id}
                  className="bg-[#0b1324] border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-[#ff5000]">
                        {prod.sku}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        In Stock ({prod.stock})
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1 line-clamp-2">
                      {prod.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      OEM Match: {prod.category || 'General'} • Bin: {prod.binLocation || 'Aisle 2 - Shelf B'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Retail Price</span>
                      <span className="text-sm font-mono font-bold text-white">
                        {formatPrice(prod.price)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            const cartItems = [{ product: prod, quantity: 1 }];
                            sessionStorage.setItem('masuma_pos_quick_cart', JSON.stringify(cartItems));
                          } catch {
                            // ignore
                          }
                          navigate('/pos');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#ff5000] hover:bg-[#e04700] text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                        title="Add part to POS cart"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>POS</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate('/quotations')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                        title="Quote this part"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Quote</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default VinPicker;

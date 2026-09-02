import React, { useState } from 'react';
import { useGarage } from '../../contexts/GarageContext';
import { useSystemSettings } from '../../contexts/SettingsContext';
import { DTC_LIBRARY } from '../../data/garageMockData';
import type { DiagnosticReport, DiagnosticErrorCode, DiagnosticSensorTelemetry, JobCard } from '../../types';
import SignatureCaptureModal from './SignatureCaptureModal';
import { 
  Cpu, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Zap, 
  FileText, 
  Printer, 
  Gauge, 
  Wrench, 
  ShieldCheck, 
  Sliders, 
  Layers,
  Car,
  UserCheck,
  RefreshCw,
  PenTool
} from 'lucide-react';

export const DiagnosticsTab: React.FC = () => {
  const { jobCards, addDiagnosticToJobCard, addSignatureToJobCard, hasPermission } = useGarage();
  const { formatPrice, settings } = useSystemSettings();

  // Scanner State
  const [selectedJobCardId, setSelectedJobCardId] = useState<string>(jobCards[0]?.id || '');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStepText, setScanStepText] = useState<string>('');

  // Search DTC library
  const [dtcSearchTerm, setDtcSearchTerm] = useState('');

  // Printable Report Modal
  const [activeReport, setActiveReport] = useState<DiagnosticReport | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  const canRunDiagnostics = hasPermission('run_diagnostics');

  const selectedJobCard = jobCards.find(j => j.id === selectedJobCardId) || jobCards[0];

  // Filter DTC library
  const filteredDtcs = DTC_LIBRARY.filter(dtc => {
    const s = dtcSearchTerm.toLowerCase();
    return dtc.code.toLowerCase().includes(s) ||
           dtc.title.toLowerCase().includes(s) ||
           dtc.system.toLowerCase().includes(s) ||
           dtc.description.toLowerCase().includes(s);
  });

  // Trigger computerized scan
  const handleInitiateScan = () => {
    if (!selectedJobCard) return;
    setIsScanning(true);
    setScanProgress(10);
    setScanStepText('Establishing high-speed CAN-Bus communication link (500Kbps)...');

    setTimeout(() => {
      setScanProgress(35);
      setScanStepText('Interrogating Engine Control Module (ECM/PCM) & Fuel Trims...');
    }, 700);

    setTimeout(() => {
      setScanProgress(65);
      setScanStepText('Scanning ABS / Stability Control & Airbag SRS modules...');
    }, 1400);

    setTimeout(() => {
      setScanProgress(90);
      setScanStepText('Parsing stored freeze-frame data & active fault DTC memory...');
    }, 2100);

    setTimeout(() => {
      setScanProgress(100);
      setIsScanning(false);

      // Generate realistic report
      const pickedFaults = [DTC_LIBRARY[0], DTC_LIBRARY[1]];
      const newReport: DiagnosticReport = {
        id: `DIAG-2026-${Math.floor(8000 + Math.random() * 1000)}`,
        scanDate: new Date().toLocaleString(),
        scannerDevice: 'Masuma ECU Pro-Diag X900 Series',
        protocolUsed: 'ISO 15765-4 (CAN 29bit 500Kbps)',
        overallHealthScore: 74,
        faultCodes: pickedFaults,
        telemetrySnapshot: {
          rpm: 840,
          coolantTempC: 91,
          batteryVolts: 13.9,
          o2SensorVolts: 0.45,
          fuelTrimPct: +12.8,
          oilPressureBar: 3.5,
          intakePressureKpa: 102
        },
        technicianNotes: `Automated scan completed on VIN ${selectedJobCard.vehicle.vin}. Detected 2 active engine fault codes requiring cylinder ignition check and intake airflow cleaning.`,
        technicianName: 'Eng. Eric Wanjala',
        recommendedParts: [
          { name: 'Iridium Spark Plugs (Set of 4)', qty: 1, approxPrice: 10000 },
          { name: 'Air Filter Element', qty: 1, approxPrice: 1800 }
        ],
        status: 'Completed'
      };

      addDiagnosticToJobCard(selectedJobCard.id, newReport);
      setActiveReport(newReport);
    }, 2800);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-brand-orange" />
            <span>Computerized Diagnostics & ECU Telemetry Engine</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Connect OBD-II / CAN-Bus scanners, analyze live sensor telemetry parameters, detect fault DTCs, and issue diagnostic reports.
          </p>
        </div>

        {canRunDiagnostics ? (
          <button
            onClick={handleInitiateScan}
            disabled={isScanning || !selectedJobCard}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 font-mono uppercase tracking-wider transition-all disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning ECU Bus...' : 'Initiate Live ECU Diagnostic Scan'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>RBAC Restricted: Diagnostic Scan requires Master Diagnostic Specialist role</span>
          </div>
        )}
      </div>

      {/* Target Vehicle & Scanner Control Bar */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 text-purple-400 border border-purple-500/40 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-purple-400 block">
                OBD-II / CAN-Bus Terminal:
              </span>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Masuma Pro-Diag X900 Series</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Hardware Connected</span>
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-mono font-bold">Target Vehicle Job:</label>
            <select
              value={selectedJobCardId}
              onChange={(e) => setSelectedJobCardId(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-purple-500"
            >
              {jobCards.map(jc => (
                <option key={jc.id} value={jc.id}>
                  {jc.vehicle.plateNumber} — {jc.vehicle.make} {jc.vehicle.model} ({jc.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Vehicle Quick Details */}
        {selectedJobCard && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 text-[10px] uppercase block">Plate & Model</span>
              <span className="text-white font-black text-sm">{selectedJobCard.vehicle.plateNumber}</span>
              <span className="text-slate-300 block text-[11px]">{selectedJobCard.vehicle.make} {selectedJobCard.vehicle.model}</span>
            </div>

            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 text-[10px] uppercase block">17-Digit VIN</span>
              <span className="text-purple-300 font-bold text-[11px] block truncate">{selectedJobCard.vehicle.vin}</span>
              <span className="text-slate-400 text-[10px]">{selectedJobCard.vehicle.engineType}</span>
            </div>

            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 text-[10px] uppercase block">Odometer Reading</span>
              <span className="text-white font-black text-sm">{selectedJobCard.vehicle.mileageKm.toLocaleString()} KM</span>
              <span className="text-slate-400 text-[10px]">Owner: {selectedJobCard.vehicle.ownerName}</span>
            </div>

            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">ECU Diagnostic Status</span>
                <span className={`font-bold text-[11px] ${
                  selectedJobCard.diagnosticReport ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {selectedJobCard.diagnosticReport ? '✓ ECU Report Ready' : '⚠️ Pending ECU Scan'}
                </span>
              </div>
              {selectedJobCard.diagnosticReport && (
                <button
                  onClick={() => setActiveReport(selectedJobCard.diagnosticReport!)}
                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] rounded-lg uppercase"
                >
                  View Report
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scan Progress Bar */}
        {isScanning && (
          <div className="space-y-2 pt-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-purple-300 font-bold flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{scanStepText}</span>
              </span>
              <span className="text-white font-black">{scanProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-brand-orange to-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${scanProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Live Telemetry Gauges Dashboard */}
      <div>
        <h3 className="text-base font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Gauge className="w-5 h-5 text-brand-orange" />
          <span>Real-time ECU Sensor Telemetry Simulation</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
              Engine Speed
            </span>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
              850 <span className="text-xs font-normal text-slate-500">RPM</span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[25%] rounded-full"></div>
            </div>
          </div>

          <div className="p-3.5 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
              Coolant Temp
            </span>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
              92 <span className="text-xs font-normal text-slate-500">°C</span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[60%] rounded-full"></div>
            </div>
          </div>

          <div className="p-3.5 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
              Battery Voltage
            </span>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
              13.8 <span className="text-xs font-normal text-slate-500">V</span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[80%] rounded-full"></div>
            </div>
          </div>

          <div className="p-3.5 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
              Oxygen Sensor
            </span>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
              0.45 <span className="text-xs font-normal text-slate-500">V</span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 w-[45%] rounded-full"></div>
            </div>
          </div>

          <div className="p-3.5 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
              Fuel Trim (Short)
            </span>
            <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
              +14.2 <span className="text-xs font-normal text-slate-500">%</span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 w-[70%] rounded-full"></div>
            </div>
          </div>

          <div className="p-3.5 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
              Oil Pressure
            </span>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
              3.5 <span className="text-xs font-normal text-slate-500">Bar</span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[70%] rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Computerized DTC Fault Codes Knowledge Base & Library */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>OBD-II & ECU Diagnostic Trouble Codes (DTC) Library</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Instant diagnostic lookup for Engine, Transmission, ABS, Airbag, and Electrical fault codes.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search DTC Code (e.g. P0300, C0035)..."
              value={dtcSearchTerm}
              onChange={(e) => setDtcSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-orange"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {filteredDtcs.map(dtc => (
            <div
              key={dtc.code}
              className="p-4 bg-slate-50 dark:bg-gray-900/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-base text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/60 px-2.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                    {dtc.code}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                    dtc.severity === 'Critical' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' :
                    dtc.severity === 'Major' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  }`}>
                    {dtc.severity}
                  </span>
                </div>

                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs mt-2">
                  {dtc.title}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-3">
                  {dtc.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-1 text-[11px]">
                <div className="text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-700 dark:text-slate-300">Recommended Fix:</strong> {dtc.recommendedFix}
                </div>
                <div className="text-slate-400 font-mono text-[10px]">
                  Estimated Labor: {dtc.estimatedLaborHours} Hours
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Computerized Diagnostic Report Modal */}
      {activeReport && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="printable-document bg-white text-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-300 my-auto">
            {/* Report Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-orange text-white flex items-center justify-center font-black">
                  <Cpu className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-brand-orange block">
                    {settings.corpName || 'MASUMA AUTO CARE CHAIN'} — OFFICIAL DIAGNOSTIC REPORT
                  </span>
                  <h3 className="text-xl font-black text-white">
                    ECU Computer Inspection Certificate
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Report Reference: {activeReport.id} • {activeReport.scanDate}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveReport(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold no-print"
              >
                ✕
              </button>
            </div>

            {/* Report Content */}
            <div className="p-6 space-y-5 text-xs">
              {/* Overall Health Score Card */}
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-purple-700 block">
                    Computerized Vehicle Health Analysis Score:
                  </span>
                  <div className="text-3xl font-black font-mono text-purple-900 mt-0.5">
                    {activeReport.overallHealthScore} / 100%
                  </div>
                  <span className="text-[11px] text-purple-700 font-semibold">
                    {activeReport.overallHealthScore >= 80 ? '🟢 Systems Normal' : '⚠️ Action Required — ECU Fault Codes Stored'}
                  </span>
                </div>

                <div className="text-right font-mono text-[11px] text-slate-600 space-y-0.5">
                  <div><strong>Scanner Device:</strong> {activeReport.scannerDevice}</div>
                  <div><strong>Protocol:</strong> {activeReport.protocolUsed}</div>
                  <div><strong>Specialist:</strong> {activeReport.technicianName}</div>
                </div>
              </div>

              {/* Detected Fault Codes */}
              <div>
                <h4 className="font-black text-slate-900 text-xs uppercase font-mono mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Detected Diagnostic Trouble Codes (DTCs) ({activeReport.faultCodes.length})</span>
                </h4>

                <div className="space-y-2">
                  {activeReport.faultCodes.map((dtc, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-purple-700 text-xs">{dtc.code} — {dtc.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 font-mono uppercase">
                          {dtc.severity} Severity
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{dtc.description}</p>
                      <div className="text-[11px] text-slate-800 font-semibold pt-1">
                        <strong>Recommended Repair Action:</strong> {dtc.recommendedFix}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Telemetry Snapshot */}
              <div>
                <h4 className="font-black text-slate-900 text-xs uppercase font-mono mb-2 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-brand-orange" />
                  <span>Live ECU Sensor Telemetry Snapshot</span>
                </h4>

                <div className="grid grid-cols-4 gap-2 font-mono text-[11px] text-center">
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-400 text-[9px] uppercase block">RPM</span>
                    <strong className="text-slate-900">{activeReport.telemetrySnapshot.rpm}</strong>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-400 text-[9px] uppercase block">Coolant Temp</span>
                    <strong className="text-slate-900">{activeReport.telemetrySnapshot.coolantTempC}°C</strong>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-400 text-[9px] uppercase block">Volts</span>
                    <strong className="text-slate-900">{activeReport.telemetrySnapshot.batteryVolts}V</strong>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-400 text-[9px] uppercase block">Fuel Trim</span>
                    <strong className="text-amber-700">{activeReport.telemetrySnapshot.fuelTrimPct}%</strong>
                  </div>
                </div>
              </div>

              {/* Technician Notes */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
                <strong className="text-slate-900 block font-mono text-[10px] uppercase">Specialist Technician Findings:</strong>
                <p className="mt-0.5">{activeReport.technicianNotes}</p>
              </div>

              {/* Footer Actions & Stamp */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div className="text-[10px] text-slate-500 font-mono">
                  Official Seal: {settings.corpName} • Certified Diagnostic Center
                </div>

                <div className="flex items-center gap-2 no-print">
                  <button
                    onClick={() => setIsSignatureModalOpen(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 font-mono shadow-sm"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>Customer Sign-Off</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 font-mono"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Diagnostic Certificate</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Digital Signature Capture Pad Modal */}
      {isSignatureModalOpen && selectedJobCard && (
        <SignatureCaptureModal
          jobCard={selectedJobCard}
          defaultType="Diagnostic Estimate Sign-Off"
          onClose={() => setIsSignatureModalOpen(false)}
          onSaveSignature={(sig) => {
            addSignatureToJobCard(selectedJobCard.id, sig);
            setIsSignatureModalOpen(false);
            alert(`Digital signature captured and attached to Job Card ${selectedJobCard.id}. Estimate status updated to Approved.`);
          }}
        />
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useGarage } from '../../contexts/GarageContext';
import type { CustomerFeedback, JobCard } from '../../types';
import { 
  Star, 
  Smile, 
  ThumbsUp, 
  Award, 
  TrendingUp, 
  MessageSquare, 
  Search, 
  Filter, 
  Plus, 
  UserCheck, 
  Wrench, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Trash2, 
  ChevronRight, 
  BarChart3, 
  Heart, 
  ShieldCheck, 
  Clock, 
  Phone, 
  Car, 
  Send
} from 'lucide-react';

export const CustomerSatisfactionTab: React.FC = () => {
  const { 
    customerFeedback, 
    addCustomerFeedback, 
    deleteCustomerFeedback, 
    jobCards, 
    staffUsers, 
    activeBranchId 
  } = useGarage();

  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'mechanics'>('feed');
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'ALL'>('ALL');
  const [mechanicFilter, setMechanicFilter] = useState<string>('ALL');

  // Modal State
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [selectedJobCardId, setSelectedJobCardId] = useState<string>('');
  
  // Modal Form Inputs
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleMakeModel, setVehicleMakeModel] = useState('');
  const [mechanicId, setMechanicId] = useState('');
  const [mechanicName, setMechanicName] = useState('');
  const [advisorName, setAdvisorName] = useState('David Ochieng (Service Advisor)');
  const [branchId, setBranchId] = useState('GAR-NRB-01');
  const [branchName, setBranchName] = useState('Nairobi Central Flagship Auto Care');

  // Ratings
  const [overallRating, setOverallRating] = useState<number>(5);
  const [workQualityRating, setWorkQualityRating] = useState<number>(5);
  const [timelinessRating, setTimelinessRating] = useState<number>(5);
  const [communicationRating, setCommunicationRating] = useState<number>(5);
  const [recommendScore, setRecommendScore] = useState<number>(10);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [successNotice, setSuccessNotice] = useState('');

  const SERVICE_TAG_OPTIONS = [
    'Great Work Quality',
    'Fast Turnaround',
    'Transparent Billing',
    'Clean Vehicle',
    'Honest Advice',
    'Polite Staff',
    'Master Technician',
    'Genuine Parts'
  ];

  // List of mechanics
  const mechanicsList = useMemo(() => {
    return staffUsers.filter(s => s.roleKey === 'MECHANIC' || s.roleKey === 'DIAGNOSTIC_TECH' || s.roleKey === 'WORKSHOP_SUPERVISOR');
  }, [staffUsers]);

  // Completed/Invoiced Job Cards for quick selection
  const eligibleJobCards = useMemo(() => {
    const list = activeBranchId === 'ALL' 
      ? jobCards 
      : jobCards.filter(j => j.branchId === activeBranchId);
    return list.filter(j => j.status === 'Completed' || j.status === 'Invoiced' || j.status === 'Quality Check');
  }, [jobCards, activeBranchId]);

  // Filter feedback records
  const filteredFeedback = useMemo(() => {
    return customerFeedback.filter(fb => {
      if (activeBranchId !== 'ALL' && fb.branchId !== activeBranchId) return false;

      const matchesSearch = 
        fb.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fb.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fb.mechanicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fb.jobCardId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fb.comment.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRating = ratingFilter === 'ALL' || fb.overallRating === ratingFilter;
      const matchesMechanic = mechanicFilter === 'ALL' || fb.mechanicName === mechanicFilter;

      return matchesSearch && matchesRating && matchesMechanic;
    });
  }, [customerFeedback, searchTerm, ratingFilter, mechanicFilter, activeBranchId]);

  // Calculate Overall CSAT KPI Stats
  const totalReviews = customerFeedback.length;
  
  const avgOverall = totalReviews > 0
    ? (customerFeedback.reduce((acc, curr) => acc + curr.overallRating, 0) / totalReviews).toFixed(1)
    : '5.0';

  const avgQuality = totalReviews > 0
    ? (customerFeedback.reduce((acc, curr) => acc + curr.workQualityRating, 0) / totalReviews).toFixed(1)
    : '5.0';

  const avgTimeliness = totalReviews > 0
    ? (customerFeedback.reduce((acc, curr) => acc + curr.timelinessRating, 0) / totalReviews).toFixed(1)
    : '5.0';

  const avgComm = totalReviews > 0
    ? (customerFeedback.reduce((acc, curr) => acc + curr.communicationRating, 0) / totalReviews).toFixed(1)
    : '5.0';

  // Net Promoter Score (NPS) calculation
  const promoters = customerFeedback.filter(f => f.recommendScore >= 9).length;
  const detractors = customerFeedback.filter(f => f.recommendScore <= 6).length;
  const npsScore = totalReviews > 0 ? Math.round(((promoters - detractors) / totalReviews) * 100) : 100;

  // Handle selecting a job card in the capture modal
  const handleSelectJobCard = (jcId: string) => {
    setSelectedJobCardId(jcId);
    const jc = jobCards.find(j => j.id === jcId);
    if (jc) {
      setCustomerName(jc.vehicle.ownerName || '');
      setCustomerPhone(jc.vehicle.ownerPhone || '');
      setVehiclePlate(jc.vehicle.plateNumber || '');
      setVehicleMakeModel(`${jc.vehicle.make} ${jc.vehicle.model}`);
      setMechanicName(jc.assignedTechnicianName || 'James Kiprop');
      setBranchId(jc.branchId);
      setBranchName(jc.branchName);

      // Find staff ID for mechanic name
      const staff = staffUsers.find(s => s.name.toLowerCase().includes((jc.assignedTechnicianName || '').toLowerCase()));
      setMechanicId(staff ? staff.id : 'MECH-001');
    }
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !vehiclePlate || !mechanicName) return;

    addCustomerFeedback({
      jobCardId: selectedJobCardId || 'JC-DIRECT-CSAT',
      customerName,
      customerPhone: customerPhone || 'N/A',
      vehiclePlate,
      vehicleMakeModel: vehicleMakeModel || 'Vehicle',
      mechanicId: mechanicId || 'MECH-001',
      mechanicName,
      advisorName,
      branchId,
      branchName,
      overallRating,
      workQualityRating,
      timelinessRating,
      communicationRating,
      recommendScore,
      comment: comment || 'Service completed to customer satisfaction.',
      serviceTags: selectedTags.length > 0 ? selectedTags : ['Great Work Quality', 'Fast Turnaround']
    });

    setSuccessNotice(`CSAT Rating captured successfully for ${customerName} (${vehiclePlate})!`);
    setTimeout(() => {
      setSuccessNotice('');
      setShowCaptureModal(false);
      // Reset form
      setSelectedJobCardId('');
      setCustomerName('');
      setCustomerPhone('');
      setVehiclePlate('');
      setVehicleMakeModel('');
      setComment('');
      setSelectedTags([]);
    }, 1500);
  };

  // Helper star renderer
  const renderStars = (rating: number, max: number = 5, sizeClass: string = "w-4 h-4") => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <Star
            key={i}
            className={`${sizeClass} ${
              i < rating 
                ? 'text-amber-400 fill-amber-400' 
                : 'text-slate-300 dark:text-slate-700'
            }`}
          />
        ))}
      </div>
    );
  };

  // Per Mechanic Statistics Map
  const mechanicStats = useMemo(() => {
    const statsMap: Record<string, {
      mechanicName: string;
      totalJobs: number;
      avgOverall: number;
      avgQuality: number;
      avgTimeliness: number;
      npsAvg: number;
      comments: string[];
      fiveStarCount: number;
    }> = {};

    customerFeedback.forEach(fb => {
      const key = fb.mechanicName || 'Unassigned';
      if (!statsMap[key]) {
        statsMap[key] = {
          mechanicName: key,
          totalJobs: 0,
          avgOverall: 0,
          avgQuality: 0,
          avgTimeliness: 0,
          npsAvg: 0,
          comments: [],
          fiveStarCount: 0
        };
      }

      statsMap[key].totalJobs += 1;
      statsMap[key].avgOverall += fb.overallRating;
      statsMap[key].avgQuality += fb.workQualityRating;
      statsMap[key].avgTimeliness += fb.timelinessRating;
      statsMap[key].npsAvg += fb.recommendScore;
      if (fb.overallRating === 5) statsMap[key].fiveStarCount += 1;
      if (fb.comment) statsMap[key].comments.push(fb.comment);
    });

    return Object.values(statsMap).map(m => ({
      ...m,
      avgOverall: Number((m.avgOverall / m.totalJobs).toFixed(1)),
      avgQuality: Number((m.avgQuality / m.totalJobs).toFixed(1)),
      avgTimeliness: Number((m.avgTimeliness / m.totalJobs).toFixed(1)),
      npsAvg: Number((m.npsAvg / m.totalJobs).toFixed(1)),
      fiveStarPct: Math.round((m.fiveStarCount / m.totalJobs) * 100)
    })).sort((a, b) => b.avgOverall - a.avgOverall);
  }, [customerFeedback]);

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Summary Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/80 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-amber-500/20">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold border border-amber-500/30">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>POST-REPAIR QUALITY & SERVICE EXCELLENCE HUB</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Customer Satisfaction & Mechanic Scorecard
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Capture post-repair CSAT ratings, quality feedback, and Net Promoter Scores from vehicle owners to track individual technician performance and workshop service quality.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCaptureModal(true)}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all font-mono uppercase tracking-wider shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Capture Post-Repair CSAT</span>
            </button>
          </div>
        </div>

        {/* CSAT KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] text-slate-400 font-mono font-bold flex items-center justify-between">
              <span>Overall CSAT Score</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">{avgOverall}</span>
              <span className="text-xs text-slate-400 font-mono">/ 5.0</span>
            </div>
            {renderStars(Math.round(Number(avgOverall)), 5, "w-3 h-3")}
          </div>

          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] text-slate-400 font-mono font-bold flex items-center justify-between">
              <span>Net Promoter Score</span>
              <Smile className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400 font-mono">+{npsScore}</span>
              <span className="text-[10px] text-emerald-300 font-mono font-bold">NPS Index</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">{promoters} Promoters / {detractors} Detractors</div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] text-slate-400 font-mono font-bold flex items-center justify-between">
              <span>Repair Work Quality</span>
              <Wrench className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">{avgQuality}</span>
              <span className="text-xs text-slate-400 font-mono">/ 5.0</span>
            </div>
            <div className="text-[10px] text-blue-400 font-mono font-bold">Technician Accuracy</div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] text-slate-400 font-mono font-bold flex items-center justify-between">
              <span>Timeliness & Speed</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">{avgTimeliness}</span>
              <span className="text-xs text-slate-400 font-mono">/ 5.0</span>
            </div>
            <div className="text-[10px] text-purple-400 font-mono font-bold">On-Time Delivery</div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-xl p-3.5 space-y-1 col-span-2 md:col-span-1">
            <div className="text-[11px] text-slate-400 font-mono font-bold flex items-center justify-between">
              <span>Total Reviews</span>
              <MessageSquare className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{totalReviews}</div>
            <div className="text-[10px] text-amber-400 font-mono font-bold">100% Service Verified</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('feed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all font-mono uppercase tracking-wider ${
              activeSubTab === 'feed'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Customer Reviews & Feedback ({filteredFeedback.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('mechanics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all font-mono uppercase tracking-wider ${
              activeSubTab === 'mechanics'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Mechanic Performance Leaderboard ({mechanicStats.length})</span>
          </button>
        </div>
      </div>

      {/* SUB TAB 1: CUSTOMER REVIEWS & FEEDBACK FEED */}
      {activeSubTab === 'feed' && (
        <div className="space-y-4">
          {/* Toolbar Search & Filters */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Plate, Mechanic, Customer, Keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none font-medium dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Star Rating Filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <span className="text-[11px] font-mono text-slate-500 px-2 font-bold">Rating:</span>
                {['ALL', 5, 4, 3].map(r => (
                  <button
                    key={r.toString()}
                    onClick={() => setRatingFilter(r as any)}
                    className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg transition-all ${
                      ratingFilter === r
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {r === 'ALL' ? 'All' : `${r} ★`}
                  </button>
                ))}
              </div>

              {/* Mechanic Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={mechanicFilter}
                  onChange={(e) => setMechanicFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="ALL">All Mechanics</option>
                  {mechanicStats.map(m => (
                    <option key={m.mechanicName} value={m.mechanicName}>{m.mechanicName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Feedback Cards List */}
          {filteredFeedback.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
              <Smile className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">No CSAT Feedback Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No customer ratings match your current filter parameters. Click 'Capture Post-Repair CSAT' above to submit customer feedback after completed work orders!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFeedback.map((fb) => (
                <div 
                  key={fb.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-amber-400/50 transition-all shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {fb.customerName}
                          </h3>
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">
                            {fb.vehiclePlate}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {fb.vehicleMakeModel} • Job #{fb.jobCardId}
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-lg font-black font-mono text-amber-500">{fb.overallRating}.0</span>
                          {renderStars(fb.overallRating)}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          NPS Recommendation: <strong className="text-emerald-500 font-mono">{fb.recommendScore}/10</strong>
                        </span>
                      </div>
                    </div>

                    {/* Assigned Mechanic Tag */}
                    <div className="flex items-center justify-between text-xs bg-amber-500/10 dark:bg-amber-500/5 p-2.5 rounded-xl border border-amber-500/20">
                      <div className="flex items-center gap-2 font-mono">
                        <Wrench className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Technician:</span>
                        <strong className="text-slate-900 dark:text-white font-extrabold">{fb.mechanicName}</strong>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{fb.createdAt}</span>
                    </div>

                    {/* Sub-Ratings Matrix */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-[11px] font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Work Quality</span>
                        <strong className="text-slate-800 dark:text-slate-200">{fb.workQualityRating} / 5 ★</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Timeliness</span>
                        <strong className="text-slate-800 dark:text-slate-200">{fb.timelinessRating} / 5 ★</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Communication</span>
                        <strong className="text-slate-800 dark:text-slate-200">{fb.communicationRating} / 5 ★</strong>
                      </div>
                    </div>

                    {/* Comment Body */}
                    {fb.comment && (
                      <blockquote className="text-xs text-slate-700 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border-l-2 border-amber-400 font-sans leading-relaxed">
                        "{fb.comment}"
                      </blockquote>
                    )}

                    {/* Tags */}
                    {fb.serviceTags && fb.serviceTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {fb.serviceTags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/20">
                            ✓ {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-[11px] text-slate-400 font-mono">
                    <span>Captured by: {fb.advisorName}</span>
                    <button
                      onClick={() => deleteCustomerFeedback(fb.id)}
                      className="text-rose-500 hover:text-rose-600 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 2: MECHANIC PERFORMANCE SCORECARD */}
      {activeSubTab === 'mechanics' && (
        <div className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-4 rounded-2xl flex items-center gap-3">
            <Award className="w-6 h-6 text-amber-500 shrink-0" />
            <div>
              <h3 className="font-extrabold text-xs text-amber-900 dark:text-amber-200 font-mono uppercase tracking-wider">
                Technician Service Quality Ranking Engine
              </h3>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                Automatically indexes post-repair customer reviews to calculate average work quality ratings, timeliness ratios, and customer retention metrics for each technician.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mechanicStats.map((mech, index) => {
              const isTopTech = index === 0 && mech.avgOverall >= 4.5;
              return (
                <div
                  key={mech.mechanicName}
                  className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border transition-all shadow-sm space-y-5 relative overflow-hidden ${
                    isTopTech 
                      ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {isTopTech && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black font-mono px-3 py-1 rounded-bl-xl shadow-md uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 fill-slate-950" />
                      <span>#1 Top Rated Tech</span>
                    </div>
                  )}

                  {/* Mechanic Profile Banner */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 font-black font-mono text-lg flex items-center justify-center border border-amber-400/30 shrink-0 shadow-inner">
                      {mech.mechanicName.substring(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {mech.mechanicName}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        {mech.totalJobs} Serviced Jobs Rated
                      </p>
                    </div>
                  </div>

                  {/* Rating Breakdown */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                        Average CSAT Score
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl font-black font-mono text-amber-500">{mech.avgOverall}</span>
                        {renderStars(Math.round(mech.avgOverall), 5, "w-3.5 h-3.5")}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] font-mono text-slate-500">
                        <span>Work Quality Accuracy</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{mech.avgQuality} / 5.0</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${(mech.avgQuality / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-mono text-slate-500">
                        <span>On-Time Turnaround</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{mech.avgTimeliness} / 5.0</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full" 
                          style={{ width: `${(mech.avgTimeliness / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl">
                      <span className="text-emerald-700 dark:text-emerald-300 font-extrabold text-sm block">
                        {mech.fiveStarPct}%
                      </span>
                      <span className="text-[10px] text-slate-500">5-Star Ratings</span>
                    </div>

                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl">
                      <span className="text-blue-700 dark:text-blue-300 font-extrabold text-sm block">
                        {mech.npsAvg}/10
                      </span>
                      <span className="text-[10px] text-slate-500">Avg NPS Rec</span>
                    </div>
                  </div>

                  {/* Recent Customer Quote */}
                  {mech.comments.length > 0 && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border-l-2 border-amber-400 leading-relaxed">
                      "{mech.comments[0]}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CAPTURE POST-REPAIR CSAT MODAL */}
      {showCaptureModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden shadow-2xl space-y-0 my-8">
            <div className="p-5 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <div>
                  <h3 className="font-extrabold text-base">Capture Post-Repair Customer Feedback</h3>
                  <p className="text-xs text-amber-200/80 font-mono">Service Advisor Entry Form</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCaptureModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {successNotice && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-mono font-bold border border-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{successNotice}</span>
                </div>
              )}

              {/* Job Card Quick Select */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-amber-500" />
                  Select Completed Work Order / Job Card
                </label>
                <select
                  value={selectedJobCardId}
                  onChange={(e) => handleSelectJobCard(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Choose Completed Job Card --</option>
                  {eligibleJobCards.map(jc => (
                    <option key={jc.id} value={jc.id}>
                      {jc.id} - {jc.vehicle.ownerName} ({jc.vehicle.plateNumber} {jc.vehicle.make}) - Mech: {jc.assignedTechnicianName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer & Vehicle Specs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Jane Smith"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 0787654321"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Vehicle Registration Plate *
                  </label>
                  <input
                    type="text"
                    required
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="e.g. KDG 789A"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Assigned Technician *
                  </label>
                  <select
                    value={mechanicName}
                    onChange={(e) => {
                      setMechanicName(e.target.value);
                      const staff = staffUsers.find(s => s.name === e.target.value);
                      if (staff) setMechanicId(staff.id);
                    }}
                    required
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose Mechanic --</option>
                    {staffUsers.map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.roleKey})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* STAR RATINGS MATRIX */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                  Post-Repair Star Satisfaction Ratings:
                </span>

                {/* Overall CSAT */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    1. Overall CSAT Rating *
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setOverallRating(star)}
                        className="p-1 transition-transform hover:scale-125"
                      >
                        <Star className={`w-5 h-5 ${star <= overallRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Repair Work Quality */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    2. Repair Work Quality
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setWorkQualityRating(star)}
                        className="p-1 transition-transform hover:scale-125"
                      >
                        <Star className={`w-4 h-4 ${star <= workQualityRating ? 'text-blue-400 fill-blue-400' : 'text-slate-300 dark:text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timeliness & Speed */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    3. Turnaround Timeliness
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setTimelinessRating(star)}
                        className="p-1 transition-transform hover:scale-125"
                      >
                        <Star className={`w-4 h-4 ${star <= timelinessRating ? 'text-purple-400 fill-purple-400' : 'text-slate-300 dark:text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Communication */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    4. Staff Communication
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setCommunicationRating(star)}
                        className="p-1 transition-transform hover:scale-125"
                      >
                        <Star className={`w-4 h-4 ${star <= communicationRating ? 'text-emerald-400 fill-emerald-400' : 'text-slate-300 dark:text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* NPS Score Selector */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono font-bold">
                  <span className="text-slate-700 dark:text-slate-300">
                    NPS: Would customer recommend Masuma Auto Care?
                  </span>
                  <span className="text-emerald-500 font-black text-sm">{recommendScore} / 10</span>
                </div>

                <div className="grid grid-cols-11 gap-1">
                  {Array.from({ length: 11 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRecommendScore(i)}
                      className={`py-1.5 rounded text-xs font-mono font-bold transition-all ${
                        recommendScore === i
                          ? i >= 9 
                            ? 'bg-emerald-500 text-white shadow'
                            : i >= 7
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-rose-500 text-white shadow'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Badges / Tags */}
              <div className="space-y-1.5">
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 block">
                  Positive Service Tags:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SERVICE_TAG_OPTIONS.map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                          isSelected
                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  Customer Feedback Comments / Service Advisor Notes
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Record customer's verbal or written comments..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all font-mono uppercase tracking-wider"
              >
                <Send className="w-4 h-4" />
                <span>Save Post-Repair CSAT Entry</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

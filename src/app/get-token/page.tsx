'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Clock, 
  Users, 
  Ticket, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert,
  ArrowRight,
  HeartPulse,
  UserCheck
} from 'lucide-react';
import { dataLayer } from '@/lib/data-layer';
import { 
  Organization, 
  ServiceLocation, 
  Department, 
  Service, 
  PriorityCategory,
  Token
} from '@/lib/types';
import { TokenCard } from '@/components/TokenCard';

export default function GetTokenPage() {
  const router = useRouter();

  // Data selections
  const [locations, setLocations] = useState<ServiceLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');

  // Form inputs
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [priority, setPriority] = useState<PriorityCategory>('standard');
  const [notes, setNotes] = useState('');

  // Queue status info
  const [isPaused, setIsPaused] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);
  const [avgWaitMinutes, setAvgWaitMinutes] = useState(10);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedToken, setIssuedToken] = useState<Token | null>(null);

  // Load locations on mount
  useEffect(() => {
    const locs = dataLayer.getLocations();
    setLocations(locs);
    if (locs.length > 0) {
      setSelectedLocationId(locs[0].id);
    }
  }, []);

  // Update departments when location changes
  useEffect(() => {
    if (!selectedLocationId) return;
    const depts = dataLayer.getDepartments(selectedLocationId);
    setDepartments(depts);
    if (depts.length > 0) {
      setSelectedDeptId(depts[0].id);
    } else {
      setSelectedDeptId('');
    }
  }, [selectedLocationId]);

  // Update services when department changes
  useEffect(() => {
    if (!selectedDeptId) {
      setServices([]);
      setSelectedServiceId('');
      return;
    }
    const srvs = dataLayer.getServices(selectedDeptId);
    setServices(srvs);
    if (srvs.length > 0) {
      setSelectedServiceId(srvs[0].id);
    } else {
      setSelectedServiceId('');
    }
  }, [selectedDeptId]);

  // Update live queue estimates when service changes
  useEffect(() => {
    if (!selectedServiceId) return;
    const updateStats = () => {
      const qState = dataLayer.getQueueState(selectedServiceId);
      setIsPaused(qState.is_paused);
      setWaitingCount(qState.currently_waiting);
      setAvgWaitMinutes(qState.average_wait_minutes);
    };
    updateStats();
    return dataLayer.subscribe(updateStats);
  }, [selectedServiceId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedServiceId) {
      setError('Please select a service.');
      return;
    }

    if (isPaused) {
      setError('This queue is currently paused by the facility reception. Please check back shortly.');
      return;
    }

    setLoading(true);

    try {
      const token = dataLayer.issueToken({
        serviceId: selectedServiceId,
        customerName: customerName.trim() || 'Visitor',
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        priority,
        notes: notes.trim()
      });

      setIssuedToken(token);
    } catch (err: any) {
      setError(err.message || 'Failed to issue token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedLocation = locations.find(l => l.id === selectedLocationId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* If token was just issued, show the confirmed ticket! */}
      {issuedToken ? (
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <CheckCircle2 className="w-4 h-4" />
              <span>Token Allocated Successfully</span>
            </div>
            <h1 className="text-3xl font-black text-white">Your Digital Pass is Ready</h1>
            <p className="text-xs text-slate-400 mt-1">
              You can keep this tab open or save your public reference code to track live progress.
            </p>
          </div>

          <TokenCard token={issuedToken} />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => router.push(`/track/${issuedToken.ref_code}`)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              <span>Open Dedicated Live Tracker</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIssuedToken(null);
                setCustomerName('');
                setCustomerPhone('');
                setCustomerEmail('');
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs cursor-pointer"
            >
              Issue Another Token
            </button>
          </div>
        </div>
      ) : (
        /* Token Form */
        <div>
          <div className="mb-8 text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Customer Self-Service
            </span>
            <h1 className="text-3xl font-extrabold text-white mt-1">Get Your Digital Token</h1>
            <p className="text-xs text-slate-400 mt-1">
              Select your service, view live wait times, and reserve your place in line immediately.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
                
                {/* Step 1: Location & Department */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">1</span>
                    Location & Department
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Facility Location
                      </label>
                      <select
                        value={selectedLocationId}
                        onChange={(e) => setSelectedLocationId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                      >
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Department
                      </label>
                      <select
                        value={selectedDeptId}
                        onChange={(e) => setSelectedDeptId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                      >
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Step 2: Service Selection */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">2</span>
                    Select Service
                  </h3>

                  <div className="space-y-2">
                    {services.map((srv) => (
                      <label
                        key={srv.id}
                        className={`flex items-start justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          selectedServiceId === srv.id
                            ? 'bg-blue-600/15 border-blue-500 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="service"
                            checked={selectedServiceId === srv.id}
                            onChange={() => setSelectedServiceId(srv.id)}
                            className="mt-1 accent-blue-600"
                          />
                          <div>
                            <span className="font-bold text-xs block text-white">
                              {srv.name}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {srv.description || 'Standard facility consultation'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 flex-shrink-0">
                          ~{srv.avg_duration_minutes}m avg
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Step 3: Visitor Details & Priority */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">3</span>
                    Visitor Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Your Name (or Initials)
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Mobile Phone (Optional for SMS)
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Email Address (Optional for Email Alerts)
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="rahul@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Priority Category */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Priority Category
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'standard', label: 'Standard' },
                        { id: 'senior', label: 'Senior Citizen' },
                        { id: 'accessible', label: 'Accessible / PwD' },
                        { id: 'emergency', label: 'Urgent / Triage' },
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => setPriority(item.id as PriorityCategory)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                            priority === item.id
                              ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || isPaused}
                  className={`w-full py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                    isPaused
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 hover:scale-[1.01]'
                  }`}
                >
                  <Ticket className="w-4 h-4" />
                  <span>{loading ? 'Allocating Sequence...' : 'Issue My Digital Token Now'}</span>
                </button>
              </form>
            </div>

            {/* Sidebar Live Status Card */}
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">
                  Queue Health & Availability
                </span>

                {isPaused ? (
                  <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
                    <span className="font-bold block mb-1">Queue Temporarily Paused</span>
                    Staff is attending to an urgent transition. Token issuance will resume shortly.
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-semibold">Queue Active & Accepting Patients</span>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      Currently in Line:
                    </span>
                    <span className="font-mono font-bold text-white text-sm">
                      {waitingCount} patients
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Expected Wait Time:
                    </span>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      ~{avgWaitMinutes} mins
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      Operating Hours:
                    </span>
                    <span className="font-mono text-slate-300">
                      08:00 - 20:00
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                  <p>&bull; Tokens are unique and issued in atomic order.</p>
                  <p>&bull; You do not need to stand in line to retain your spot.</p>
                  <p>&bull; Live updates will notify you when 2 patients are ahead.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

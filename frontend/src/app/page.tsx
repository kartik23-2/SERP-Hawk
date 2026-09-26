'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { DashboardStatsCard } from '@/components/DashboardStats';
import { CallFilters } from '@/components/CallFilters';
import { CallTable } from '@/components/CallTable';
import { CustomerTable } from '@/components/CustomerTable';
import { CustomerModal } from '@/components/CustomerModal';
import { LiveCallModal } from '@/components/LiveCallModal';
import { CallDetailModal } from '@/components/CallDetailModal';
import { Customer, Call, DashboardStats } from '@/types';
import { fetchStats, fetchCustomers, fetchCalls, createCustomer, initiateCall } from '@/lib/api';
import { RefreshCw, PhoneCall, Users, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'calls' | 'customers'>('calls');
  
  // Stats & Data State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('');
  const [followUpFilter, setFollowUpFilter] = useState<string>('');

  // Modals State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  
  // Live Call Session State
  const [isLiveCallOpen, setIsLiveCallOpen] = useState(false);
  const [activeCallCustomer, setActiveCallCustomer] = useState<Customer | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  // Call Detail State
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Load Dashboard Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [statsRes, customersRes, callsRes] = await Promise.all([
        fetchStats(),
        fetchCustomers(),
        fetchCalls({
          search: search || undefined,
          status: statusFilter || undefined,
          outcome: outcomeFilter || undefined,
          lead_status: leadStatusFilter || undefined,
          follow_up_required: followUpFilter ? followUpFilter === 'true' : undefined,
        }),
      ]);
      setStats(statsRes);
      setCustomers(customersRes);
      setCalls(callsRes);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setApiError('Unable to connect to FastAPI backend. Ensure backend server is running on http://localhost:8000.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, outcomeFilter, leadStatusFilter, followUpFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setOutcomeFilter('');
    setLeadStatusFilter('');
    setFollowUpFilter('');
  };

  // Add Customer Submit
  const handleAddCustomer = async (data: Omit<Customer, 'id' | 'created_at'>) => {
    await createCustomer(data);
    await loadData();
  };

  // Initiate Outbound Call
  const handleStartCall = async (customer: Customer) => {
    try {
      const res = await initiateCall(customer.id, 'simulated');
      setActiveCallCustomer(customer);
      setActiveCallId(res.call_id);
      setIsLiveCallOpen(true);
    } catch (err: any) {
      alert(`Failed to start call: ${err.message}`);
    }
  };

  // On Live Call Ended
  const handleCallEnded = () => {
    setTimeout(() => {
      loadData();
    }, 1500);
  };

  // Open Detail Modal
  const handleSelectCall = (call: Call) => {
    setSelectedCall(call);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      
      {/* Header Bar */}
      <Header
        onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Backend Connectivity Warning Banner */}
        {apiError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shrink-0"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Dashboard Statistics Overview */}
        <DashboardStatsCard stats={stats} />

        {/* Section Header & Reload */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
              {activeTab === 'calls' ? <PhoneCall className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">
                {activeTab === 'calls' ? 'Call Records & AI Transcripts' : 'Customer Directory & Campaign Targets'}
              </h2>
              <p className="text-xs text-slate-400">
                {activeTab === 'calls'
                  ? 'Real-time two-way voice call logs, transcripts, and AI lead summaries'
                  : 'Manage customer targets and trigger automated AI outbound calls'}
              </p>
            </div>
          </div>

          <button
            onClick={loadData}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>

        {/* Filters for Call Tab */}
        {activeTab === 'calls' && (
          <CallFilters
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            outcomeFilter={outcomeFilter}
            setOutcomeFilter={setOutcomeFilter}
            leadStatusFilter={leadStatusFilter}
            setLeadStatusFilter={setLeadStatusFilter}
            followUpFilter={followUpFilter}
            setFollowUpFilter={setFollowUpFilter}
            onReset={handleResetFilters}
          />
        )}

        {/* Content Views */}
        {activeTab === 'calls' ? (
          <CallTable calls={calls} loading={loading} onSelectCall={handleSelectCall} />
        ) : (
          <CustomerTable
            customers={customers}
            loading={loading}
            onInitiateCall={handleStartCall}
          />
        )}

      </main>

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSubmit={handleAddCustomer}
      />

      {/* Live 2-Way Voice Call Modal */}
      <LiveCallModal
        isOpen={isLiveCallOpen}
        onClose={() => setIsLiveCallOpen(false)}
        customer={activeCallCustomer}
        callId={activeCallId}
        callMode="simulated"
        onCallEnded={handleCallEnded}
      />

      {/* Call Detail Modal */}
      <CallDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        call={selectedCall}
      />

    </div>
  );
}

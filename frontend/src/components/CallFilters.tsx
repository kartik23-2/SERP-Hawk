'use client';

import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';

interface CallFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  outcomeFilter: string;
  setOutcomeFilter: (val: string) => void;
  leadStatusFilter: string;
  setLeadStatusFilter: (val: string) => void;
  followUpFilter: string;
  setFollowUpFilter: (val: string) => void;
  onReset: () => void;
}

export const CallFilters: React.FC<CallFiltersProps> = ({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  outcomeFilter,
  setOutcomeFilter,
  leadStatusFilter,
  setLeadStatusFilter,
  followUpFilter,
  setFollowUpFilter,
  onReset,
}) => {
  return (
    <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-xl mb-6 space-y-3">
      <div className="flex flex-col md:flex-row items-center gap-3">
        
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or call ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Filters Group */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Call Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed / Unanswered</option>
            <option value="IN_PROGRESS">In Progress</option>
          </select>

          {/* Outcome Filter */}
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Call Outcomes</option>
            <option value="INTERESTED">Interested Lead</option>
            <option value="NOT_INTERESTED">Not Interested</option>
            <option value="FOLLOW_UP_REQUIRED">Follow-up Required</option>
          </select>

          {/* Lead Status Filter */}
          <select
            value={leadStatusFilter}
            onChange={(e) => setLeadStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Lead Tiers</option>
            <option value="Hot">Hot Lead</option>
            <option value="Warm">Warm Lead</option>
            <option value="Cold">Cold Lead</option>
            <option value="Not Interested">Not Interested</option>
          </select>

          {/* Follow Up Filter */}
          <select
            value={followUpFilter}
            onChange={(e) => setFollowUpFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Follow-up States</option>
            <option value="true">Follow-up Needed</option>
            <option value="false">No Follow-up</option>
          </select>

        </div>

        <button
          onClick={onReset}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors text-xs flex items-center gap-1 shrink-0"
          title="Reset Filters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>

      </div>
    </div>
  );
};

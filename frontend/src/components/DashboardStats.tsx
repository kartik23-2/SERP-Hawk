'use client';

import React from 'react';
import { DashboardStats } from '@/types';
import { PhoneCall, CheckCircle2, XCircle, Flame, CalendarClock, Timer } from 'lucide-react';

interface StatsProps {
  stats: DashboardStats | null;
}

export const DashboardStatsCard: React.FC<StatsProps> = ({ stats }) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const statItems = [
    {
      title: 'Total Calls',
      value: stats?.total_calls ?? 0,
      icon: PhoneCall,
      color: 'from-blue-500 to-indigo-600',
      border: 'border-blue-500/20',
      badge: 'All Outbound Campaigns',
    },
    {
      title: 'Completed Calls',
      value: stats?.completed_calls ?? 0,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-600',
      border: 'border-emerald-500/20',
      badge: 'Two-Way AI Conversed',
    },
    {
      title: 'Interested Leads',
      value: stats?.interested_leads ?? 0,
      icon: Flame,
      color: 'from-amber-500 to-orange-600',
      border: 'border-amber-500/20',
      badge: 'High Intent RO Enquiries',
    },
    {
      title: 'Follow-ups Required',
      value: stats?.follow_ups_required ?? 0,
      icon: CalendarClock,
      color: 'from-purple-500 to-pink-600',
      border: 'border-purple-500/20',
      badge: 'Action Items Flagged',
    },
    {
      title: 'Failed Calls',
      value: stats?.failed_calls ?? 0,
      icon: XCircle,
      color: 'from-rose-500 to-red-600',
      border: 'border-rose-500/20',
      badge: 'No Answer / Busy',
    },
    {
      title: 'Avg Call Duration',
      value: formatDuration(stats?.avg_call_duration_seconds ?? 0),
      icon: Timer,
      color: 'from-cyan-500 to-blue-600',
      border: 'border-cyan-500/20',
      badge: 'Conversation Depth',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {statItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border ${item.border} shadow-xl hover:border-slate-700 transition-all duration-300 group`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {item.title}
                </p>
                <h3 className="text-2xl font-extrabold text-white mt-1 group-hover:scale-105 transition-transform">
                  {item.value}
                </h3>
              </div>
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center shadow-lg shadow-black/40 text-white`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>{item.badge}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

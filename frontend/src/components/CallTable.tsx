'use client';

import React from 'react';
import { Call } from '@/types';
import { Phone, Eye, Clock, CheckCircle2, XCircle, Flame, CalendarClock } from 'lucide-react';

interface CallTableProps {
  calls: Call[];
  loading: boolean;
  onSelectCall: (call: Call) => void;
}

export const CallTable: React.FC<CallTableProps> = ({
  calls,
  loading,
  onSelectCall,
}) => {
  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading call history logs...</p>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center">
        <Phone className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-300">No Call Records Found</h3>
        <p className="text-xs text-slate-500 mt-1">Try adjusting search filters or initiate a new outbound call.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-6 py-4">Customer & Phone</th>
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4">Call Status</th>
              <th className="px-6 py-4">Call Outcome</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
            {calls.map((call) => (
              <tr
                key={call.id}
                onClick={() => onSelectCall(call)}
                className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
              >
                {/* Customer & Phone */}
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-white font-bold text-xs group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                      {call.customer_name ? call.customer_name.charAt(0) : 'C'}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">
                        {call.customer_name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">{call.phone_number}</p>
                    </div>
                  </div>
                </td>

                {/* Date & Time */}
                <td className="px-6 py-4 text-slate-300">
                  {call.start_time ? new Date(call.start_time).toLocaleString() : 'N/A'}
                </td>

                {/* Duration */}
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1 font-mono text-cyan-300">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" /> {formatSeconds(call.duration_seconds)}
                  </span>
                </td>

                {/* Call Status */}
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      call.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : call.status === 'IN_PROGRESS'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {call.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {call.status}
                  </span>
                </td>

                {/* Outcome */}
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      call.outcome === 'INTERESTED'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : call.outcome === 'FOLLOW_UP_REQUIRED'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {call.outcome === 'INTERESTED' && <Flame className="w-3 h-3" />}
                    {call.outcome === 'FOLLOW_UP_REQUIRED' && <CalendarClock className="w-3 h-3" />}
                    {call.outcome}
                  </span>
                </td>

                {/* Action */}
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCall(call);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ml-auto"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Transcript
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

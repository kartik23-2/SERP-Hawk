'use client';

import React from 'react';
import { X, User, Phone, Clock, FileText, CheckCircle2, AlertCircle, Bot, MessageSquare, Flame, MapPin, DollarSign, Calendar, Target } from 'lucide-react';
import { Call } from '@/types';

interface CallDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  call: Call | null;
}

export const CallDetailModal: React.FC<CallDetailModalProps> = ({
  isOpen,
  onClose,
  call,
}) => {
  if (!isOpen || !call) return null;

  const summary = call.summary;
  const transcripts = call.transcripts || [];

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainderSecs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Glow Header Bar */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">Call Log #{call.id}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  call.status === 'COMPLETED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {call.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {call.outcome}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Customer: <span className="text-slate-200 font-semibold">{call.customer_name}</span> ({call.phone_number})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto pt-6 space-y-6">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Start Time</p>
              <p className="text-xs font-bold text-slate-200 mt-0.5">
                {call.start_time ? new Date(call.start_time).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Call Duration</p>
              <p className="text-xs font-bold text-cyan-400 mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {formatSeconds(call.duration_seconds)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Direction</p>
              <p className="text-xs font-bold text-slate-200 mt-0.5">{call.direction}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Lead Status</p>
              <p className="text-xs font-bold text-amber-400 mt-0.5 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> {summary?.lead_status || 'Pending'}
              </p>
            </div>
          </div>

          {/* AI-Generated Summary Card */}
          {summary && (
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 p-5 rounded-2xl border border-indigo-500/20 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" /> AI Executive Call Summary
                </h3>
                {summary.follow_up_required && (
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Follow-up Required
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                "{summary.summary_text}"
              </p>

              {/* Requirement Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold flex items-center gap-1">
                    <Target className="w-3 h-3 text-cyan-400" /> Capacity
                  </span>
                  <span className="text-white font-bold">{summary.capacity || 'N/A'}</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-cyan-400" /> Location
                  </span>
                  <span className="text-white font-bold">{summary.location || 'N/A'}</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-cyan-400" /> Budget
                  </span>
                  <span className="text-white font-bold">{summary.budget || 'N/A'}</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-cyan-400" /> Timeline
                  </span>
                  <span className="text-white font-bold">{summary.timeline || 'N/A'}</span>
                </div>
              </div>

              {summary.follow_up_notes && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200">
                  <span className="font-bold text-amber-400 block mb-1">Follow-up Notes:</span>
                  {summary.follow_up_notes}
                </div>
              )}
            </div>
          )}

          {/* Full Turn-by-Turn Call Transcript */}
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-cyan-400" /> Full Conversation Transcript ({transcripts.length} Turns)
            </h3>
            
            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 max-h-80 overflow-y-auto">
              {transcripts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No transcript turns recorded for this call.</p>
              ) : (
                transcripts.map((t, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2.5 ${
                      t.speaker === 'CUSTOMER' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        t.speaker === 'AI'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      }`}
                    >
                      {t.speaker === 'AI' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                        t.speaker === 'CUSTOMER'
                          ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-tr-none'
                          : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-tl-none'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 opacity-70 text-[10px]">
                        <span className="font-semibold">{t.speaker === 'AI' ? 'HawkAI Agent' : call.customer_name}</span>
                        <span>{t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : ''}</span>
                      </div>
                      <p className="text-sm">{t.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

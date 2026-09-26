'use client';

import React from 'react';
import { Customer } from '@/types';
import { User, PhoneCall, Building, Target, Package, Mail } from 'lucide-react';

interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
  onInitiateCall: (customer: Customer) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  loading,
  onInitiateCall,
}) => {
  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading customer directory...</p>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center">
        <User className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-300">No Customers Added Yet</h3>
        <p className="text-xs text-slate-500 mt-1">Click "Add Customer" to create your first outbound campaign target.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-6 py-4">Customer Name</th>
              <th className="px-6 py-4">Phone Number</th>
              <th className="px-6 py-4">Company</th>
              <th className="px-6 py-4">Target Product</th>
              <th className="px-6 py-4">Purpose</th>
              <th className="px-6 py-4 text-right">Outbound AI Call</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/40 transition-colors group">
                {/* Customer Name */}
                <td className="px-6 py-4 font-bold text-white text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">
                        {c.name}
                      </p>
                      {c.email && <p className="text-[11px] text-slate-400 font-normal">{c.email}</p>}
                    </div>
                  </div>
                </td>

                {/* Phone */}
                <td className="px-6 py-4 font-mono text-cyan-300 font-semibold">
                  {c.phone_number}
                </td>

                {/* Company */}
                <td className="px-6 py-4 text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" /> {c.company_name || 'N/A'}
                  </span>
                </td>

                {/* Product */}
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                    {c.product}
                  </span>
                </td>

                {/* Purpose */}
                <td className="px-6 py-4 text-slate-400">{c.purpose}</td>

                {/* Start Call Action */}
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onInitiateCall(c)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 ml-auto transition-all active:scale-95"
                  >
                    <PhoneCall className="w-4 h-4 animate-bounce" />
                    <span>Start Call</span>
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

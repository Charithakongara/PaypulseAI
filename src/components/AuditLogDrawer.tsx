import React from 'react';
import { History, CheckCircle2, Sparkles, Sliders, ArrowRight } from 'lucide-react';
import { PriceAuditLog } from '../types/paypal';

interface AuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: PriceAuditLog[];
}

export const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({
  isOpen,
  onClose,
  logs,
}) => {
  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-[#0c1322] border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#0d172e]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-cyan-400 border border-blue-500/20">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              PayPal Price Audit Trail
            </h3>
            <p className="text-[11px] text-slate-400">
              Live log of catalog price modifications synced to Sandbox
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
        >
          ✕
        </button>
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No price updates recorded in this session.
          </div>
        ) : (
          logs.map((log) => {
            const isUp = log.newPrice > log.oldPrice;
            return (
              <div
                key={log.id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-blue-400">
                    {log.sku}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <div className="text-xs font-medium text-slate-200 truncate">
                  {log.productName}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400 line-through">
                      ${log.oldPrice.toFixed(2)}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                    <span className={`font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${log.newPrice.toFixed(2)}
                    </span>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold flex items-center gap-1 ${
                    log.changeType === 'AI_OPTIMIZATION'
                      ? 'bg-purple-500/15 text-purple-300'
                      : log.changeType === 'SIMULATION_APPLY'
                      ? 'bg-indigo-500/15 text-indigo-300'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {log.changeType === 'AI_OPTIMIZATION' && <Sparkles className="w-3 h-3" />}
                    {log.changeType === 'SIMULATION_APPLY' && <Sliders className="w-3 h-3" />}
                    {log.changeType.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-1">
                  <span>Batch: {log.paypalBatchId || 'PP-REST-DIRECT'}</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> PayPal Synced
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-slate-800 bg-[#0d1527] text-center text-[11px] text-slate-400 font-mono">
        Audit trail retained for compliance & rollback
      </div>
    </aside>
  );
};

import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  RotateCcw, 
  ShieldCheck, 
  Target, 
  CreditCard,
  AlertTriangle 
} from 'lucide-react';
import { MerchantMetrics } from '../types/paypal';

interface KPISummaryProps {
  metrics: MerchantMetrics;
  onOpenDisputes: () => void;
  onOpenReport: () => void;
}

export const KPISummary: React.FC<KPISummaryProps> = ({
  metrics,
  onOpenDisputes,
  onOpenReport,
}) => {
  const targetPercent = Math.min(
    100,
    Math.round((metrics.projectedMonthEndRevenue / metrics.revenueTarget) * 100)
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      {/* 1. 30d Gross Volume */}
      <div className="bg-[#0e172a] border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-medium">30d Gross Revenue</span>
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold tracking-tight text-white">
            ${metrics.grossRevenue30d.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            <span className="text-emerald-400 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5 inline" /> +14.8%
            </span>
            <span className="text-slate-500">vs prev 30d</span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex justify-between">
          <span>Net Volume:</span>
          <span className="font-mono text-slate-300">
            ${metrics.netPaymentVolume30d.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* 2. Transaction Count & AOV */}
      <div className="bg-[#0e172a] border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-medium">Orders & AOV</span>
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <ShoppingCart className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold tracking-tight text-white">
            {metrics.totalTransactions30d.toLocaleString()}
            <span className="text-xs font-normal text-slate-400 ml-1.5">orders</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            <span className="text-slate-400">AOV:</span>
            <span className="text-cyan-300 font-mono font-semibold">
              ${metrics.averageOrderValue.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex justify-between">
          <span>PP Fees:</span>
          <span className="font-mono text-slate-300">${metrics.totalFees30d.toFixed(2)}</span>
        </div>
      </div>

      {/* 3. Refund Rate */}
      <div className="bg-[#0e172a] border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-medium">Refund Rate</span>
          <div className={`p-1.5 rounded-lg ${metrics.refundRate30d > 2.5 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
            <RotateCcw className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            {metrics.refundRate30d.toFixed(2)}%
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              metrics.refundRate30d < 2.0 
                ? 'bg-emerald-500/20 text-emerald-300' 
                : 'bg-amber-500/20 text-amber-300'
            }`}>
              {metrics.refundRate30d < 2.0 ? 'Optimal' : 'Watch'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            PayPal benchmark &lt; 2.5%
          </p>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex justify-between">
          <span>Total Refunds:</span>
          <span className="font-mono text-slate-300">
            {Math.round((metrics.refundRate30d / 100) * metrics.totalTransactions30d)} units
          </span>
        </div>
      </div>

      {/* 4. Disputes & Risk */}
      <div 
        onClick={onOpenDisputes}
        className="bg-[#0e172a] border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-amber-500/50 cursor-pointer transition shadow-sm group"
      >
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-medium group-hover:text-amber-300 transition">Dispute Rate & Risk</span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            {metrics.disputeRate.toFixed(2)}%
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
              Healthy
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
            <span>Unpaid Invoices:</span>
            <span className="text-amber-300 font-semibold font-mono">
              ${metrics.unpaidInvoicesTotal.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-cyan-400 group-hover:text-cyan-300 flex justify-between">
          <span>View Disputes API →</span>
          <span className="font-mono text-slate-400">{metrics.unpaidInvoicesCount} pending</span>
        </div>
      </div>

      {/* 5. Month-End Revenue Forecast */}
      <div className="bg-[#0e172a] border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-medium">AI Revenue Forecast</span>
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold tracking-tight text-indigo-300">
            ${Math.round(metrics.projectedMonthEndRevenue).toLocaleString()}
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
            <span>Target: ${Math.round(metrics.revenueTarget / 1000)}k</span>
            <span className="text-emerald-400 font-semibold">{targetPercent}%</span>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="mt-3 pt-2 border-t border-slate-800/80">
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, targetPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 6. Merchant Health Score */}
      <div 
        onClick={onOpenReport}
        className="bg-gradient-to-br from-[#0e1a38] to-[#0a1224] border border-blue-900/50 rounded-xl p-4 flex flex-col justify-between hover:border-blue-500/50 cursor-pointer transition shadow-md shadow-blue-950/40"
      >
        <div className="flex items-center justify-between text-blue-200 text-xs">
          <span className="font-medium">Merchant Health</span>
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-cyan-300">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-3xl font-extrabold tracking-tight text-white flex items-baseline gap-1">
            {metrics.healthScore}
            <span className="text-xs font-normal text-slate-400">/100</span>
          </div>
          <p className="text-xs text-cyan-300 font-medium mt-1">
            Excellent Standing
          </p>
        </div>
        <div className="mt-3 pt-2 border-t border-blue-900/60 text-[11px] text-blue-300 flex justify-between items-center">
          <span>Executive Briefing</span>
          <span className="underline">View PDF →</span>
        </div>
      </div>
    </div>
  );
};

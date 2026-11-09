import React from 'react';
import { 
  Sparkles, 
  Sliders, 
  ShieldAlert, 
  FileText, 
  MessageSquare, 
  History, 
  RefreshCw,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PayPalCredentials } from '../types/paypal';

interface NavbarProps {
  credentials: PayPalCredentials;
  onOpenCredentials: () => void;
  onOpenSimulator: () => void;
  onOpenDisputes: () => void;
  onOpenReport: () => void;
  onToggleChat: () => void;
  onOpenAuditLogs: () => void;
  onTriggerAiOptimization: () => void;
  isAiOptimizing: boolean;
  chatOpen: boolean;
  auditLogCount: number;
  lastSyncTime: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  credentials,
  onOpenCredentials,
  onOpenSimulator,
  onOpenDisputes,
  onOpenReport,
  onToggleChat,
  onOpenAuditLogs,
  onTriggerAiOptimization,
  isAiOptimizing,
  chatOpen,
  auditLogCount,
  lastSyncTime,
}) => {
  const formattedSync = lastSyncTime 
    ? new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Just now';

  return (
    <header className="sticky top-0 z-40 bg-[#0d1527]/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#0070ba] to-[#003087] shadow-lg shadow-blue-500/20 text-white font-extrabold text-xl tracking-tighter">
              <span>P</span>
              <span className="text-cyan-300 -ml-1">P</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">PayPal</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  AI-Toolkit
                </span>
                <span className="hidden md:inline-block text-xs text-slate-400 font-mono">
                  v2.4 Sandbox
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Merchant Dynamic Pricing & Revenue Intelligence Engine
              </p>
            </div>
          </div>

          {/* Center: Live PayPal Connection Status Pill */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={onOpenCredentials}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition text-xs group"
              title="Click to configure PayPal Sandbox REST API credentials"
            >
              {credentials.isLiveSandbox ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              )}
              <span className="text-slate-300">
                {credentials.isLiveSandbox ? 'PayPal Live Sandbox REST' : 'PayPal Sandbox Emulator'}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-cyan-300 font-mono">
                {credentials.isLiveSandbox ? 'OAuth 2.0 Live' : 'Demo Mode'}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                • {formattedSync}
              </span>
              <KeyRound className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 ml-1 transition" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* AI Optimize Button */}
            <button
              onClick={onTriggerAiOptimization}
              disabled={isAiOptimizing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 transition disabled:opacity-50 cursor-pointer"
              title="Run AI Price Elasticity Re-Optimization via Gemini 3.8 Flash"
            >
              {isAiOptimizing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              )}
              <span className="hidden sm:inline">AI Optimize</span>
            </button>

            {/* Scenario Simulator */}
            <button
              onClick={onOpenSimulator}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Open Price & Margin Elasticity Scenario Simulator"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Simulator</span>
            </button>

            {/* Disputes & Invoicing */}
            <button
              onClick={onOpenDisputes}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition relative"
              title="View Invoicing API & Disputes Risk Tracking"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Disputes & Risk</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1.5 right-1.5" />
            </button>

            {/* Executive Report Generator */}
            <button
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Generate Executive Monthly PDF Report"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">PDF Report</span>
            </button>

            {/* Audit Logs */}
            <button
              onClick={onOpenAuditLogs}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition relative"
              title="View PayPal Price Change Audit Logs"
            >
              <History className="w-4 h-4" />
              {auditLogCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-blue-500 text-[10px] font-bold text-white">
                  {auditLogCount}
                </span>
              )}
            </button>

            {/* Chat Drawer Toggle */}
            <button
              onClick={onToggleChat}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition border cursor-pointer ${
                chatOpen 
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/25'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Toggle Chat-with-your-Store AI Copilot"
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-300" />
              <span className="font-semibold">AI Copilot</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

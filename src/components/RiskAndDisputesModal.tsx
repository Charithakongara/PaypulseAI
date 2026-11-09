import React, { useState } from 'react';
import { 
  ShieldAlert, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  DollarSign,
  Send,
  User,
  ShieldCheck
} from 'lucide-react';
import { PayPalDispute, PayPalInvoice } from '../types/paypal';

interface RiskAndDisputesModalProps {
  isOpen: boolean;
  onClose: () => void;
  disputes: PayPalDispute[];
  invoices: PayPalInvoice[];
  healthScore: number;
}

export const RiskAndDisputesModal: React.FC<RiskAndDisputesModalProps> = ({
  isOpen,
  onClose,
  disputes,
  invoices,
  healthScore
}) => {
  const [activeTab, setActiveTab] = useState<'disputes' | 'invoices' | 'risk'>('disputes');
  const [selectedDispute, setSelectedDispute] = useState<PayPalDispute | null>(disputes[0] || null);
  const [evidenceSubmitted, setEvidenceSubmitted] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const totalDisputeAmount = disputes.reduce((sum, d) => sum + d.amount, 0);
  const unpaidInvoices = invoices.filter(i => i.status === 'SENT' || i.status === 'OVERDUE');
  const totalUnpaid = unpaidInvoices.reduce((sum, i) => sum + i.amount, 0);

  const handleSimulateEvidence = (disputeId: string) => {
    setEvidenceSubmitted(prev => ({ ...prev, [disputeId]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0e172a] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#0d1527]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Invoicing & Dispute Risk Tracking
              </h2>
              <p className="text-xs text-slate-400">
                Connected to PayPal Invoicing API (/v2/invoicing/invoices) & Disputes API (/v1/customer/disputes)
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 pt-3 gap-6">
          <button
            onClick={() => setActiveTab('disputes')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'disputes' 
                ? 'border-amber-400 text-amber-300' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Customer Disputes ({disputes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'invoices' 
                ? 'border-blue-400 text-blue-300' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Invoices & Receivables ({invoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('risk')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'risk' 
                ? 'border-emerald-400 text-emerald-300' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Merchant Health & Pricing Guardrails</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* TAB 1: DISPUTES */}
          {activeTab === 'disputes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Total Active Exposure</span>
                  <span className="text-xl font-bold font-mono text-white mt-1 block">
                    ${totalDisputeAmount.toFixed(2)} USD
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">2 pending claims under review</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">PayPal Dispute Rate</span>
                  <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                    0.09%
                  </span>
                  <span className="text-[10px] text-emerald-300 mt-1 block">Well below 1.5% threshold</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Resolution SLA</span>
                  <span className="text-xl font-bold font-mono text-cyan-300 mt-1 block">
                    48 Hours Left
                  </span>
                  <span className="text-[10px] text-amber-300 mt-1 block">1 dispute requires seller response</span>
                </div>
              </div>

              <div className="space-y-3">
                {disputes.map(dispute => {
                  const isSubmitted = evidenceSubmitted[dispute.disputeId];
                  return (
                    <div 
                      key={dispute.disputeId}
                      className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {dispute.disputeId}
                          </span>
                          <span className="text-xs font-semibold text-white">
                            {dispute.reason.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-xs">
                            ${dispute.amount.toFixed(2)} {dispute.currency}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                            dispute.status === 'WAITING_FOR_SELLER' && !isSubmitted
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {isSubmitted ? 'EVIDENCE_SUBMITTED' : dispute.status}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/70 text-xs">
                        <span className="text-slate-400 block text-[11px] mb-1 font-semibold">
                          Buyer Note from PayPal Dispute Portal:
                        </span>
                        <p className="text-slate-200 italic">
                          "{dispute.buyerNote}"
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 gap-2 pt-1 font-mono text-[11px]">
                        <span>Tx ID: {dispute.transactionId}</span>
                        <span>Opened: {new Date(dispute.createTime).toLocaleDateString()}</span>
                        <div>
                          {isSubmitted ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1 font-sans">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Evidence Submitted to PayPal
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSimulateEvidence(dispute.disputeId)}
                              className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs transition flex items-center gap-1 cursor-pointer"
                            >
                              <Send className="w-3 h-3" /> Submit Tracking & Carrier Proof
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: INVOICES */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Total Unpaid Balance</span>
                  <span className="text-xl font-bold font-mono text-amber-300 mt-1 block">
                    ${totalUnpaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">2 pending corporate accounts</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Overdue Invoices</span>
                  <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
                    $2,150.00
                  </span>
                  <span className="text-[10px] text-rose-300 mt-1 block">1 overdue invoice (&gt; 5 days)</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Paid Last 30 Days</span>
                  <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                    $5,400.00
                  </span>
                  <span className="text-[10px] text-emerald-300 mt-1 block">Settled via PayPal Invoicing</span>
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3 font-sans">Recipient</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3 text-right font-sans">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {invoices.map(inv => (
                      <tr key={inv.invoiceId} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-bold text-blue-400">{inv.invoiceNumber}</td>
                        <td className="py-3 px-3 font-sans text-slate-200">
                          <div>{inv.recipientName}</div>
                          <span className="text-[10px] text-slate-500 font-mono">{inv.recipientEmail}</span>
                        </td>
                        <td className="py-3 px-3 font-bold text-white">${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            inv.status === 'PAID' 
                              ? 'bg-emerald-500/20 text-emerald-300' 
                              : inv.status === 'OVERDUE'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">{inv.dueDate}</td>
                        <td className="py-3 px-3 text-right font-sans">
                          {inv.status !== 'PAID' && (
                            <button className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition">
                              Send Reminder
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: RISK & PRICING GUARDRAILS */}
          {activeTab === 'risk' && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      AI Pricing Guardrails & Risk Shield
                    </h3>
                    <p className="text-xs text-slate-400">
                      Evaluates risk metrics to warn the merchant before adjusting pricing or credit terms.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Current Health:</span>
                    <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                      {healthScore}/100
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1.5">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Safe to Optimize Prices
                    </span>
                    <p className="text-slate-300">
                      Dispute rate (0.09%) is well below PayPal's 1.5% enhanced monitoring boundary. Automated price elasticity updates can proceed without risk of reserve holdbacks.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1.5">
                    <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Overdue Receivable Alert
                    </span>
                    <p className="text-slate-300">
                      Invoice <strong>INV-2026-1039</strong> ($2,150) from Nexus Tech is 5 days overdue. Consider withholding wholesale discount terms until balance clears.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-slate-800 bg-[#0d1527]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

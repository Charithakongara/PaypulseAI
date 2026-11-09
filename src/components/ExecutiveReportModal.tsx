import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle,
  Loader2,
  Calendar,
  Building
} from 'lucide-react';
import jsPDF from 'jspdf';
import { PayPalProduct, MerchantMetrics, PayPalDispute, PayPalInvoice } from '../types/paypal';

interface ExecutiveReportData {
  executiveHeadline: string;
  monthlyPerformanceSummary: string;
  pricingElasticityTakeaways: string[];
  riskAndDisputeMitigation: string;
  strategicRoadmap: string[];
}

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: PayPalProduct[];
  metrics: MerchantMetrics;
  disputes: PayPalDispute[];
  invoices: PayPalInvoice[];
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  products,
  metrics,
  disputes,
  invoices,
}) => {
  const [report, setReport] = useState<ExecutiveReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (isOpen && !report) {
      fetchReport();
    }
  }, [isOpen]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/generate-executive-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch (e) {
      console.error('Failed to load report:', e);
    } finally {
      setLoading(false);
    }
  };

  const generatePdf = () => {
    if (!report) return;
    setDownloading(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Banner (PayPal Dark Blue)
      doc.setFillColor(0, 48, 135); // #003087
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('PAYPAL MERCHANT INTELLIGENCE BRIEFING', 14, 13);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(179, 212, 255);
      doc.text('Monthly Executive Health, Dynamic Pricing & Elasticity Report', 14, 20);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - 14, 20, { align: 'right' });

      // Headline
      let y = 38;
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(report.executiveHeadline, 14, y);

      // Performance Summary
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);

      const splitSummary = doc.splitTextToSize(report.monthlyPerformanceSummary, pageWidth - 28);
      doc.text(splitSummary, 14, y);
      y += splitSummary.length * 5 + 6;

      // KPI Matrix Table
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 22, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, y, pageWidth - 28, 22, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('30-DAY GROSS VOL', 20, y + 6);
      doc.text('NET SETTLEMENT', 65, y + 6);
      doc.text('ORDERS (AOV)', 115, y + 6);
      doc.text('REFUND RATE', 160, y + 6);

      doc.setFontSize(11);
      doc.setTextColor(0, 48, 135);
      doc.text(`$${metrics.grossRevenue30d.toLocaleString()}`, 20, y + 14);
      doc.text(`$${metrics.netPaymentVolume30d.toLocaleString()}`, 65, y + 14);
      doc.text(`${metrics.totalTransactions30d} ($${metrics.averageOrderValue.toFixed(0)})`, 115, y + 14);
      doc.text(`${metrics.refundRate30d.toFixed(2)}%`, 160, y + 14);

      y += 30;

      // Section: Price Elasticity Takeaways
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Price Elasticity & Revenue Optimization Opportunities', 14, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);

      report.pricingElasticityTakeaways.forEach((point) => {
        const lines = doc.splitTextToSize(`• ${point}`, pageWidth - 28);
        doc.text(lines, 14, y);
        y += lines.length * 5 + 2;
      });

      y += 6;

      // Section: Risk & Invoicing Mitigation
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Dispute Exposure & Receivables Audit', 14, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const riskLines = doc.splitTextToSize(report.riskAndDisputeMitigation, pageWidth - 28);
      doc.text(riskLines, 14, y);
      y += riskLines.length * 5 + 6;

      // Section: Strategic 30-Day Action Plan
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Strategic Action Plan (Next 30 Days)', 14, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      report.strategicRoadmap.forEach((item, index) => {
        const itemLines = doc.splitTextToSize(`${index + 1}. ${item}`, pageWidth - 28);
        doc.text(itemLines, 14, y);
        y += itemLines.length * 5 + 2;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Confidential • Generated by PayPal AI-Toolkit • Authorized Merchant Copy', 14, 285);

      doc.save(`PayPal-Merchant-Health-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0e172a] border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#0d1527]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Monthly Executive Health & Pricing Report
              </h2>
              <p className="text-xs text-slate-400">
                Natural Language C-Suite synthesis generated from live PayPal REST data.
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

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <span className="text-sm">Synthesizing executive briefing with Gemini 3.8 Flash...</span>
            </div>
          ) : report ? (
            <div className="space-y-6">
              {/* Document Banner */}
              <div className="bg-gradient-to-r from-blue-950/80 to-slate-900 border border-blue-500/30 p-5 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-blue-300">
                  <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" /> Merchant Intelligence Briefing
                  </span>
                  <span className="font-mono text-slate-400">
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-white">
                  {report.executiveHeadline}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  {report.monthlyPerformanceSummary}
                </p>
              </div>

              {/* KPI Snapshot Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block uppercase">30d Gross</span>
                  <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                    ${metrics.grossRevenue30d.toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block uppercase">Net Volume</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
                    ${metrics.netPaymentVolume30d.toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block uppercase">Refund Rate</span>
                  <span className="text-sm font-bold text-cyan-300 font-mono mt-0.5 block">
                    {metrics.refundRate30d.toFixed(2)}%
                  </span>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block uppercase">Dispute Rate</span>
                  <span className="text-sm font-bold text-amber-400 font-mono mt-0.5 block">
                    {metrics.disputeRate.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Takeaways */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Dynamic Price Elasticity Opportunities
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {report.pricingElasticityTakeaways.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risk Mitigation */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Dispute & Receivables Risk Review
                </h4>
                <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  {report.riskAndDisputeMitigation}
                </p>
              </div>

              {/* Strategic Roadmap */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Recommended Action Plan (Next 30 Days)
                </h4>
                <div className="space-y-2 text-xs">
                  {report.strategicRoadmap.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-slate-200">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              No report data available.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-[#0d1527]">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print View</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-300 hover:text-white transition rounded-lg bg-slate-800"
            >
              Close
            </button>
            <button
              onClick={generatePdf}
              disabled={downloading || !report}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Download Official PDF Summary</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

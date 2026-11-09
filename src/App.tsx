import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { KPISummary } from './components/KPISummary';
import { PricingGrid } from './components/PricingGrid';
import { ScenarioSimulatorModal } from './components/ScenarioSimulatorModal';
import { PayPalCredentialsModal } from './components/PayPalCredentialsModal';
import { RiskAndDisputesModal } from './components/RiskAndDisputesModal';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { AIChatDrawer } from './components/AIChatDrawer';
import { AuditLogDrawer } from './components/AuditLogDrawer';
import { 
  PayPalProduct, 
  MerchantMetrics, 
  PayPalDispute, 
  PayPalInvoice, 
  PriceAuditLog, 
  PayPalCredentials 
} from './types/paypal';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  TrendingUp, 
  Sliders, 
  ShieldAlert, 
  Activity,
  Zap,
  ArrowRight
} from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<PayPalProduct[]>([]);
  const [metrics, setMetrics] = useState<MerchantMetrics | null>(null);
  const [disputes, setDisputes] = useState<PayPalDispute[]>([]);
  const [invoices, setInvoices] = useState<PayPalInvoice[]>([]);
  const [auditLogs, setAuditLogs] = useState<PriceAuditLog[]>([]);
  const [credentials, setCredentials] = useState<PayPalCredentials>({
    clientId: '',
    clientSecret: '',
    isLiveSandbox: false,
    environment: 'demo'
  });
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());
  const [loading, setLoading] = useState<boolean>(true);
  const [isAiOptimizing, setIsAiOptimizing] = useState<boolean>(false);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState<boolean>(false);

  // Modals & Drawers state
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [disputesOpen, setDisputesOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [auditLogsOpen, setAuditLogsOpen] = useState(false);
  const [targetSimulatorSku, setTargetSimulatorSku] = useState<string | null>(null);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Initial Data Fetch from Server
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, dispRes, logsRes] = await Promise.all([
        fetch('/api/paypal/products'),
        fetch('/api/paypal/disputes-and-invoices'),
        fetch('/api/paypal/audit-logs'),
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products);
        setMetrics(prodData.metrics);
        if (prodData.config) {
          setCredentials(prev => ({
            ...prev,
            isLiveSandbox: prodData.config.isLiveSandbox,
            environment: prodData.config.environment,
            clientId: prodData.config.clientId || prev.clientId
          }));
          setLastSyncTime(prodData.config.lastSyncTime || new Date().toISOString());
        }
      }

      if (dispRes.ok) {
        const dispData = await dispRes.json();
        setDisputes(dispData.disputes || []);
        setInvoices(dispData.invoices || []);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setAuditLogs(logsData.logs || []);
      }
    } catch (err: any) {
      console.error('Failed to load store data:', err);
      showToast('Error loading store data from PayPal backend.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Update a single product price (One-Click AI Optimization or Inline manual edit)
  const handleUpdatePrice = async (
    id: string, 
    newPrice: number, 
    changeType: 'AI_OPTIMIZATION' | 'MANUAL_EDIT' = 'AI_OPTIMIZATION'
  ) => {
    try {
      setIsUpdatingPrice(true);
      const res = await fetch(`/api/paypal/products/${id}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPrice, changeType }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update price');
      }

      const data = await res.json();
      setProducts(prev => prev.map(p => p.id === id || p.sku === id ? data.product : p));
      if (data.metrics) setMetrics(data.metrics);
      if (data.logEntry) setAuditLogs(prev => [data.logEntry, ...prev]);

      showToast(
        `✓ PayPal Catalog updated: ${data.product.sku} new price set to $${Number(newPrice).toFixed(2)} (${changeType === 'AI_OPTIMIZATION' ? 'AI Optimized' : 'Manual Edit'})`,
        'success'
      );
    } catch (err: any) {
      showToast(`Price update error: ${err.message}`, 'error');
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  // Bulk Apply AI Recommendations
  const handleBulkUpdatePrices = async (updates: Array<{ id: string; newPrice: number }>) => {
    try {
      setIsUpdatingPrice(true);
      const res = await fetch('/api/paypal/products/bulk-update-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) {
        throw new Error('Bulk update failed');
      }

      const data = await res.json();
      if (data.products) setProducts(data.products);
      if (data.metrics) setMetrics(data.metrics);
      if (data.appliedLogs) setAuditLogs(prev => [...data.appliedLogs, ...prev]);

      showToast(`✓ Batch executed: ${data.updatedCount} products updated & pushed to PayPal Sandbox catalog!`, 'success');
    } catch (err: any) {
      showToast(`Bulk update error: ${err.message}`, 'error');
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  // Trigger AI Price Elasticity Optimization Engine (Gemini 3.8 Flash)
  const handleTriggerAiOptimization = async () => {
    try {
      setIsAiOptimizing(true);
      const res = await fetch('/api/ai/optimize-elasticity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('AI optimization failed');
      }

      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
      showToast('AI Price Elasticity Re-Optimization complete. Updated recommendations in AG Grid.', 'info');
    } catch (err: any) {
      showToast(`AI Optimization error: ${err.message}`, 'error');
    } finally {
      setIsAiOptimizing(false);
    }
  };

  // Save PayPal Credentials / Toggle Sandbox Mode
  const handleSaveCredentials = async (newCreds: PayPalCredentials): Promise<boolean> => {
    try {
      const res = await fetch('/api/paypal/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: newCreds.clientId,
          clientSecret: newCreds.clientSecret,
          isLiveSandbox: newCreds.isLiveSandbox,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCredentials(newCreds);
        setLastSyncTime(new Date().toISOString());
        showToast(data.message, 'success');
        return true;
      } else {
        showToast(data.message || 'Connection failed', 'error');
        return false;
      }
    } catch (err: any) {
      showToast(`Connection error: ${err.message}`, 'error');
      return false;
    }
  };

  const handleOpenSimulatorWithSku = (sku: string) => {
    setTargetSimulatorSku(sku);
    setSimulatorOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0b111e] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold border ${
            toast.type === 'success' 
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' 
              : toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : 'bg-blue-950/90 border-blue-500/50 text-blue-200'
          }`}>
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        credentials={credentials}
        onOpenCredentials={() => setCredentialsOpen(true)}
        onOpenSimulator={() => {
          setTargetSimulatorSku('ALL');
          setSimulatorOpen(true);
        }}
        onOpenDisputes={() => setDisputesOpen(true)}
        onOpenReport={() => setReportOpen(true)}
        onToggleChat={() => setChatOpen(!chatOpen)}
        onOpenAuditLogs={() => setAuditLogsOpen(true)}
        onTriggerAiOptimization={handleTriggerAiOptimization}
        isAiOptimizing={isAiOptimizing}
        chatOpen={chatOpen}
        auditLogCount={auditLogs.length}
        lastSyncTime={lastSyncTime}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner with Hackathon Architecture Context & Quick Action */}
        <div className="bg-gradient-to-r from-[#003087]/50 via-[#0070ba]/20 to-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/10 to-transparent pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500 text-white uppercase tracking-wider">
                  PayPal AI-Toolkit
                </span>
                <span className="text-xs text-blue-300 font-mono">
                  Sponsor Integration: AG Grid + PayPal REST APIs
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Merchant Dynamic Price Elasticity & Health Engine
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connects <strong>PayPal Reporting & Transaction Search</strong>, <strong>Catalog Products</strong>, and <strong>Disputes / Invoicing APIs</strong> with high-performance <strong>AG Grid</strong> financial tables and <strong>Gemini AI</strong> price elasticity optimization.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setSimulatorOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Simulate Price Curve</span>
              </button>
              <button
                onClick={handleTriggerAiOptimization}
                disabled={isAiOptimizing}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white transition flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                <span>One-Click AI Optimization</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 1: KPI Summary Cards (GET /v1/reporting/transactions) */}
        {metrics && (
          <KPISummary
            metrics={metrics}
            onOpenDisputes={() => setDisputesOpen(true)}
            onOpenReport={() => setReportOpen(true)}
          />
        )}

        {/* Section 2: AG Grid Interactive Pricing Table */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>PayPal Catalog & Dynamic Pricing Table</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                  AG Grid High-Performance Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Double click prices to inline edit. Check multiple rows to execute bulk AI adjustments. Click rows to view 30-day velocity sparklines.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuditLogsOpen(true)}
                className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
              >
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                <span>Audit Trail ({auditLogs.length})</span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <PricingGrid
            products={products}
            onUpdatePrice={handleUpdatePrice}
            onBulkUpdatePrices={handleBulkUpdatePrices}
            onSimulateSku={handleOpenSimulatorWithSku}
            isUpdatingPrice={isUpdatingPrice}
          />
        </section>

        {/* Section 3: Feature Highlight Cards for Hackathon Evaluation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Card 1: PayPal REST Live Sync */}
          <div 
            onClick={() => setCredentialsOpen(true)}
            className="bg-[#0e172a] border border-slate-800 hover:border-blue-500/40 p-4 rounded-xl cursor-pointer transition group"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
              <Zap className="w-4 h-4" />
              <span>1. Live PayPal Sync</span>
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition">
              Sandbox OAuth & REST Endpoints
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Connected to <code>/v1/reporting/transactions</code>, <code>/v1/catalogs/products</code>, and <code>/v1/customer/disputes</code>. Test live or emulator credentials.
            </p>
            <div className="mt-3 text-[11px] text-cyan-400 font-medium flex items-center gap-1">
              Configure Sandbox <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 2: Interactive Scenario Simulator */}
          <div 
            onClick={() => setSimulatorOpen(true)}
            className="bg-[#0e172a] border border-slate-800 hover:border-indigo-500/40 p-4 rounded-xl cursor-pointer transition group"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
              <Sliders className="w-4 h-4" />
              <span>2. Elasticity Simulator</span>
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
              Real-Time Margin & Revenue Sliders
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Simulate price adjustments from -25% to +25%. Demand curves react dynamically using calculated price elasticity scores ($E_d$).
            </p>
            <div className="mt-3 text-[11px] text-indigo-400 font-medium flex items-center gap-1">
              Open Simulator <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 3: Executive PDF Report Generator */}
          <div 
            onClick={() => setReportOpen(true)}
            className="bg-[#0e172a] border border-slate-800 hover:border-emerald-500/40 p-4 rounded-xl cursor-pointer transition group"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>3. Executive PDF Report</span>
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
              Natural Language C-Suite Briefing
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Generate a high-level executive PDF briefing summarizing merchant health, elasticity gains, and chargeback risk in a single click.
            </p>
            <div className="mt-3 text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              Generate PDF Briefing <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0c1322] py-4 text-center text-xs text-slate-500 font-mono">
        PayPal AI Toolkit • AG Grid Hackathon Edition • Node/Express & Gemini 3.8 Flash
      </footer>

      {/* Modals & Drawers */}
      <PayPalCredentialsModal
        isOpen={credentialsOpen}
        onClose={() => setCredentialsOpen(false)}
        credentials={credentials}
        onSaveCredentials={handleSaveCredentials}
        lastSyncTime={lastSyncTime}
      />

      <ScenarioSimulatorModal
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        products={products}
        targetSku={targetSimulatorSku}
        onApplySimulatedPrices={handleBulkUpdatePrices}
      />

      <RiskAndDisputesModal
        isOpen={disputesOpen}
        onClose={() => setDisputesOpen(false)}
        disputes={disputes}
        invoices={invoices}
        healthScore={metrics?.healthScore || 96}
      />

      {metrics && (
        <ExecutiveReportModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          products={products}
          metrics={metrics}
          disputes={disputes}
          invoices={invoices}
        />
      )}

      <AIChatDrawer
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onOpenSimulatorWithSku={handleOpenSimulatorWithSku}
        onOpenDisputes={() => setDisputesOpen(true)}
      />

      <AuditLogDrawer
        isOpen={auditLogsOpen}
        onClose={() => setAuditLogsOpen(false)}
        logs={auditLogs}
      />
    </div>
  );
}

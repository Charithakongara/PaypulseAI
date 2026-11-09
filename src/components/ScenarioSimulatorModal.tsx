import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  RotateCcw, 
  Check, 
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Percent
} from 'lucide-react';
import { PayPalProduct } from '../types/paypal';

interface ScenarioSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: PayPalProduct[];
  targetSku?: string | null;
  onApplySimulatedPrices: (updates: Array<{ id: string; newPrice: number }>) => Promise<void>;
}

export const ScenarioSimulatorModal: React.FC<ScenarioSimulatorModalProps> = ({
  isOpen,
  onClose,
  products,
  targetSku,
  onApplySimulatedPrices
}) => {
  const [globalDeltaPercent, setGlobalDeltaPercent] = useState<number>(0);
  const [selectedSku, setSelectedSku] = useState<string>(targetSku || 'ALL');
  const [isApplying, setIsApplying] = useState(false);

  // Sync when targetSku changes from external click
  React.useEffect(() => {
    if (targetSku) {
      setSelectedSku(targetSku);
    }
  }, [targetSku]);

  // Simulation calculations based on elasticity formula: %Delta Q = Ed * %Delta P
  const simulationResults = useMemo(() => {
    let baselineRevenue = 0;
    let baselineGrossProfit = 0;
    let baselineUnits = 0;

    let simulatedRevenue = 0;
    let simulatedGrossProfit = 0;
    let simulatedUnits = 0;

    const simulatedProducts = products.map(product => {
      baselineRevenue += product.grossRevenue30d;
      baselineUnits += product.unitsSold30d;
      baselineGrossProfit += product.unitsSold30d * (product.currentPrice - product.costPrice);

      const appliesToProduct = selectedSku === 'ALL' || selectedSku === product.sku;
      const deltaP = appliesToProduct ? globalDeltaPercent : 0;

      const simPrice = parseFloat((product.currentPrice * (1 + deltaP / 100)).toFixed(2));
      
      // % change in quantity = Elasticity * % change in price
      // (ensuring quantity doesn't fall below 0)
      const deltaQPercent = product.elasticityScore * deltaP;
      const simVolume = Math.max(0, Math.round(product.unitsSold30d * (1 + deltaQPercent / 100)));
      
      const simRev = simVolume * simPrice;
      const simProfit = simVolume * (simPrice - product.costPrice);
      const simMargin = simPrice > 0 ? ((simPrice - product.costPrice) / simPrice) * 100 : 0;
      const origMargin = ((product.currentPrice - product.costPrice) / product.currentPrice) * 100;

      simulatedRevenue += simRev;
      simulatedUnits += simVolume;
      simulatedGrossProfit += simProfit;

      return {
        ...product,
        simPrice,
        simVolume,
        simRev,
        simProfit,
        simMargin,
        origMargin,
        deltaPrice: simPrice - product.currentPrice,
        deltaUnits: simVolume - product.unitsSold30d,
        deltaProfit: simProfit - (product.unitsSold30d * (product.currentPrice - product.costPrice)),
        applies: appliesToProduct
      };
    });

    const revenueDelta = simulatedRevenue - baselineRevenue;
    const profitDelta = simulatedGrossProfit - baselineGrossProfit;
    const unitsDelta = simulatedUnits - baselineUnits;
    const baselineMargin = baselineRevenue > 0 ? (baselineGrossProfit / baselineRevenue) * 100 : 0;
    const simulatedOverallMargin = simulatedRevenue > 0 ? (simulatedGrossProfit / simulatedRevenue) * 100 : 0;
    const marginDelta = simulatedOverallMargin - baselineMargin;

    return {
      baselineRevenue,
      simulatedRevenue,
      revenueDelta,
      baselineGrossProfit,
      simulatedGrossProfit,
      profitDelta,
      baselineMargin,
      simulatedOverallMargin,
      marginDelta,
      baselineUnits,
      simulatedUnits,
      unitsDelta,
      products: simulatedProducts
    };
  }, [products, globalDeltaPercent, selectedSku]);

  if (!isOpen) return null;

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const updates = simulationResults.products
        .filter(p => p.applies && Math.abs(p.simPrice - p.currentPrice) > 0.01)
        .map(p => ({
          id: p.id,
          newPrice: p.simPrice
        }));

      if (updates.length > 0) {
        await onApplySimulatedPrices(updates);
      }
      onClose();
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0e172a] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#0d1527]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Interactive Price Elasticity & Scenario Simulator
              </h2>
              <p className="text-xs text-slate-400">
                Simulate pricing adjustments in real-time using live PayPal Transaction velocity and price elasticity coefficients (Ed).
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
          {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
            {/* Target Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Scope:
              </label>
              <select
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="ALL">Entire Product Catalog (All 8 SKUs)</option>
                {products.map(p => (
                  <option key={p.sku} value={p.sku}>
                    {p.sku} - {p.name.substring(0, 32)}...
                  </option>
                ))}
              </select>
            </div>

            {/* Price Delta Slider */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-300">
                  Simulated Price Adjustment (%):
                </span>
                <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${
                  globalDeltaPercent > 0 
                    ? 'bg-emerald-500/20 text-emerald-300' 
                    : globalDeltaPercent < 0 
                    ? 'bg-rose-500/20 text-rose-300' 
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {globalDeltaPercent > 0 ? `+${globalDeltaPercent}%` : `${globalDeltaPercent}%`}
                </span>
              </div>
              <input
                type="range"
                min="-25"
                max="25"
                step="1"
                value={globalDeltaPercent}
                onChange={(e) => setGlobalDeltaPercent(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>-25% (Aggressive Discount)</span>
                <span 
                  onClick={() => setGlobalDeltaPercent(0)}
                  className="cursor-pointer hover:text-cyan-300 underline"
                >
                  0% (Reset Baseline)
                </span>
                <span>+25% (Premium Margin)</span>
              </div>
            </div>
          </div>

          {/* Real-time Projected KPI Impact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Projected Gross Revenue */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium block">
                Projected 30d Gross Revenue
              </span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                ${Math.round(simulationResults.simulatedRevenue).toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 text-xs mt-1.5 font-mono">
                <span className={simulationResults.revenueDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {simulationResults.revenueDelta >= 0 ? '+' : ''}${Math.round(simulationResults.revenueDelta).toLocaleString()}
                </span>
                <span className="text-slate-500 text-[11px]">
                  ({((simulationResults.revenueDelta / simulationResults.baselineRevenue) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Projected Gross Profit */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium block">
                Projected Gross Profit (COGS Subtracted)
              </span>
              <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
                ${Math.round(simulationResults.simulatedGrossProfit).toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 text-xs mt-1.5 font-mono">
                <span className={simulationResults.profitDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {simulationResults.profitDelta >= 0 ? '+' : ''}${Math.round(simulationResults.profitDelta).toLocaleString()} profit
                </span>
              </div>
            </div>

            {/* Projected Margin % & Volume */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium block">
                Average Gross Margin %
              </span>
              <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
                {simulationResults.simulatedOverallMargin.toFixed(1)}%
              </div>
              <div className="flex items-center gap-1.5 text-xs mt-1.5 text-slate-400 font-mono">
                <span>Delta: {simulationResults.marginDelta >= 0 ? '+' : ''}{simulationResults.marginDelta.toFixed(1)}%</span>
                <span className="text-slate-500">•</span>
                <span>{simulationResults.simulatedUnits} units ({simulationResults.unitsDelta >= 0 ? '+' : ''}{simulationResults.unitsDelta})</span>
              </div>
            </div>
          </div>

          {/* Product Breakdown Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Simulation Breakdown by SKU</span>
              <span className="text-[11px] font-normal text-slate-400 font-mono">
                Elasticity Equation: %ΔQ = Ed × %ΔP
              </span>
            </div>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2 px-3">SKU</th>
                    <th className="py-2 px-3">Product</th>
                    <th className="py-2 px-3">Current</th>
                    <th className="py-2 px-3">Simulated</th>
                    <th className="py-2 px-3">Ed</th>
                    <th className="py-2 px-3">Sim Volume</th>
                    <th className="py-2 px-3">Sim Margin</th>
                    <th className="py-2 px-3 text-right">Profit Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {simulationResults.products.map(p => (
                    <tr key={p.sku} className={p.applies ? 'bg-slate-900/20 hover:bg-slate-800/40' : 'opacity-40'}>
                      <td className="py-2.5 px-3 font-semibold text-blue-400">{p.sku}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-200 truncate max-w-[160px]">{p.name}</td>
                      <td className="py-2.5 px-3 text-slate-400">${p.currentPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-bold text-white">${p.simPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-purple-300">{p.elasticityScore}</td>
                      <td className="py-2.5 px-3 text-slate-300">{p.simVolume} ({p.deltaUnits >= 0 ? `+${p.deltaUnits}` : p.deltaUnits})</td>
                      <td className="py-2.5 px-3 text-cyan-300">{p.simMargin.toFixed(1)}%</td>
                      <td className={`py-2.5 px-3 text-right font-semibold ${p.deltaProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {p.deltaProfit >= 0 ? `+$${p.deltaProfit.toFixed(0)}` : `-$${Math.abs(p.deltaProfit).toFixed(0)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-[#0d1527]">
          <button
            onClick={() => {
              setGlobalDeltaPercent(0);
              setSelectedSku('ALL');
            }}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Simulation</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-300 hover:text-white transition rounded-lg bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isApplying || globalDeltaPercent === 0}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply Simulated Prices to PayPal Catalog</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

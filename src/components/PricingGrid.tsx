import React, { useState, useMemo, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { 
  ColDef, 
  GridReadyEvent, 
  SelectionChangedEvent, 
  CellValueChangedEvent,
  ModuleRegistry,
  AllCommunityModule
} from 'ag-grid-community';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  Layers, 
  Info,
  ArrowUpRight,
  ArrowDownRight,
  CheckCheck,
  Search,
  ExternalLink
} from 'lucide-react';
import { PayPalProduct } from '../types/paypal';

// Register AG Grid Community Modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface PricingGridProps {
  products: PayPalProduct[];
  onUpdatePrice: (id: string, newPrice: number, changeType?: 'AI_OPTIMIZATION' | 'MANUAL_EDIT') => Promise<void>;
  onBulkUpdatePrices: (updates: Array<{ id: string; newPrice: number }>) => Promise<void>;
  onSimulateSku: (sku: string) => void;
  isUpdatingPrice?: boolean;
}

export const PricingGrid: React.FC<PricingGridProps> = ({
  products,
  onUpdatePrice,
  onBulkUpdatePrices,
  onSimulateSku,
  isUpdatingPrice = false
}) => {
  const gridRef = useRef<AgGridReact<PayPalProduct>>(null);
  const [selectedProducts, setSelectedProducts] = useState<PayPalProduct[]>([]);
  const [expandedProduct, setExpandedProduct] = useState<PayPalProduct | null>(products[0] || null);
  const [quickSearch, setQuickSearch] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['ALL', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCat = activeCategoryFilter === 'ALL' || p.category === activeCategoryFilter;
      const matchesSearch = quickSearch === '' || 
        p.name.toLowerCase().includes(quickSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(quickSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(quickSearch.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, activeCategoryFilter, quickSearch]);

  const onSelectionChanged = useCallback((event: SelectionChangedEvent<PayPalProduct>) => {
    const selected = event.api.getSelectedRows();
    setSelectedProducts(selected);
  }, []);

  const handleCellEdit = useCallback(async (event: CellValueChangedEvent<PayPalProduct>) => {
    if (event.colDef.field === 'currentPrice') {
      const newPrice = parseFloat(event.newValue);
      if (!isNaN(newPrice) && newPrice > 0 && event.data) {
        await onUpdatePrice(event.data.id, newPrice, 'MANUAL_EDIT');
      }
    }
  }, [onUpdatePrice]);

  // Bulk Apply AI Recommendations
  const handleBulkApply = async () => {
    if (selectedProducts.length === 0) return;
    const updates = selectedProducts.map(p => ({
      id: p.id,
      newPrice: p.aiRecommendedPrice
    }));
    await onBulkUpdatePrices(updates);
    setSelectedProducts([]);
    if (gridRef.current?.api) {
      gridRef.current.api.deselectAll();
    }
  };

  // Sparkline SVG generator for inline cell
  const renderSparklineSvg = (data: number[]) => {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const width = 70;
    const height = 22;
    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible inline-block">
        <polyline
          fill="none"
          stroke="#0070ba"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<PayPalProduct>[]>(() => [
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      width: 48,
      maxWidth: 48,
      pinned: 'left',
      lockPosition: 'left',
      suppressMenu: true,
      headerClass: 'text-center',
    },
    {
      field: 'sku',
      headerName: 'SKU / ID',
      width: 110,
      pinned: 'left',
      cellRenderer: (params: any) => (
        <span className="font-mono text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
          {params.value}
        </span>
      ),
    },
    {
      field: 'name',
      headerName: 'Product Name',
      flex: 2,
      minWidth: 220,
      cellRenderer: (params: any) => {
        const product = params.data as PayPalProduct;
        return (
          <div className="flex flex-col justify-center h-full">
            <span className="font-medium text-slate-100 text-xs truncate">
              {product.name}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {product.category.replace(/_/g, ' ')}
            </span>
          </div>
        );
      },
    },
    {
      field: 'currentPrice',
      headerName: 'Current Price',
      width: 130,
      editable: true,
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-between font-mono font-bold text-white text-xs group cursor-pointer">
          <span>${Number(params.value).toFixed(2)}</span>
          <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition">
            ✎ edit
          </span>
        </div>
      ),
      cellClass: 'bg-slate-900/40 hover:bg-slate-800/60 font-semibold',
    },
    {
      field: 'competitorAvgPrice',
      headerName: 'Competitor Avg',
      width: 140,
      cellRenderer: (params: any) => {
        const prod = params.data as PayPalProduct;
        const delta = prod.currentPrice - prod.competitorAvgPrice;
        const deltaPct = ((delta / prod.competitorAvgPrice) * 100).toFixed(1);
        const isHigher = delta > 0;
        return (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-300">${prod.competitorAvgPrice.toFixed(2)}</span>
            <span className={`text-[10px] px-1 py-0.2 rounded font-sans flex items-center ${
              isHigher ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'
            }`}>
              {isHigher ? `+${deltaPct}%` : `${deltaPct}%`}
            </span>
          </div>
        );
      },
    },
    {
      field: 'stockLevel',
      headerName: 'Stock',
      width: 100,
      cellRenderer: (params: any) => {
        const stock = Number(params.value);
        const isLow = stock < 30;
        return (
          <div className="flex items-center gap-1 text-xs">
            <span className={`font-mono font-semibold ${isLow ? 'text-rose-400' : 'text-slate-200'}`}>
              {stock}
            </span>
            {isLow && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-medium">
                LOW
              </span>
            )}
          </div>
        );
      },
    },
    {
      field: 'unitsSold30d',
      headerName: '30d Velocity',
      width: 160,
      cellRenderer: (params: any) => {
        const prod = params.data as PayPalProduct;
        return (
          <div className="flex items-center justify-between w-full h-full pr-1">
            <div className="flex flex-col">
              <span className="text-xs font-mono font-semibold text-slate-200">
                {prod.unitsSold30d} units
              </span>
              <span className="text-[10px] text-slate-500">
                ${(prod.grossRevenue30d / 1000).toFixed(1)}k rev
              </span>
            </div>
            <div>
              {renderSparklineSvg(prod.salesHistory30d)}
            </div>
          </div>
        );
      },
    },
    {
      headerName: 'Margin %',
      width: 110,
      valueGetter: (params: any) => {
        const p = params.data as PayPalProduct;
        return ((p.currentPrice - p.costPrice) / p.currentPrice) * 100;
      },
      cellRenderer: (params: any) => {
        const margin = Number(params.value);
        let badgeColor = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
        if (margin < 45) {
          badgeColor = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
        } else if (margin < 55) {
          badgeColor = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
        }
        return (
          <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border ${badgeColor}`}>
            {margin.toFixed(1)}%
          </span>
        );
      },
    },
    {
      field: 'elasticityScore',
      headerName: 'Elasticity (Ed)',
      width: 130,
      cellRenderer: (params: any) => {
        const ed = Number(params.value);
        const isElastic = ed < -1.0;
        return (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-200 font-semibold">{ed.toFixed(2)}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-sans uppercase font-medium ${
              isElastic 
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}>
              {isElastic ? 'Elastic' : 'Inelastic'}
            </span>
          </div>
        );
      },
    },
    {
      field: 'aiRecommendedPrice',
      headerName: 'AI Recommended Price',
      width: 180,
      cellRenderer: (params: any) => {
        const prod = params.data as PayPalProduct;
        const delta = prod.aiRecommendedPrice - prod.currentPrice;
        const deltaPct = ((delta / prod.currentPrice) * 100).toFixed(1);
        const isUp = delta > 0;
        const isZero = Math.abs(delta) < 0.01;

        return (
          <div className="flex items-center justify-between h-full w-full">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono font-bold text-xs text-cyan-300">
                ${prod.aiRecommendedPrice.toFixed(2)}
              </span>
            </div>
            {!isZero && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium flex items-center ${
                isUp ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
              }`}>
                {isUp ? <ArrowUpRight className="w-3 h-3 inline" /> : <ArrowDownRight className="w-3 h-3 inline" />}
                {isUp ? `+${deltaPct}%` : `${deltaPct}%`}
              </span>
            )}
          </div>
        );
      },
    },
    {
      headerName: 'Actions',
      width: 170,
      pinned: 'right',
      cellRenderer: (params: any) => {
        const prod = params.data as PayPalProduct;
        const isSelected = expandedProduct?.id === prod.id;
        const needsUpdate = Math.abs(prod.currentPrice - prod.aiRecommendedPrice) > 0.01;

        return (
          <div className="flex items-center gap-1.5 h-full">
            {needsUpdate ? (
              <button
                onClick={() => onUpdatePrice(prod.id, prod.aiRecommendedPrice, 'AI_OPTIMIZATION')}
                disabled={isUpdatingPrice}
                className="px-2.5 py-1 text-[11px] font-semibold rounded bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow transition flex items-center gap-1 cursor-pointer"
                title="Apply AI Recommended Price & Push to PayPal Sandbox"
              >
                <Check className="w-3 h-3" />
                <span>Accept</span>
              </button>
            ) : (
              <span className="px-2 py-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 rounded flex items-center gap-1">
                <CheckCheck className="w-3 h-3" /> Synced
              </span>
            )}

            <button
              onClick={() => onSimulateSku(prod.sku)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Simulate Price Elasticity"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            </button>

            <button
              onClick={() => setExpandedProduct(isSelected ? null : prod)}
              className={`p-1 rounded transition ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}
              title="Expand Details & 30-Day Velocity Chart"
            >
              {isSelected ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        );
      },
    },
  ], [expandedProduct, isUpdatingPrice, onUpdatePrice, onSimulateSku]);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), []);

  // Summary of selected items impact
  const bulkSelectedMetrics = useMemo(() => {
    if (selectedProducts.length === 0) return null;
    const totalCurrent = selectedProducts.reduce((acc, p) => acc + p.currentPrice, 0);
    const totalRecommended = selectedProducts.reduce((acc, p) => acc + p.aiRecommendedPrice, 0);
    const delta = totalRecommended - totalCurrent;
    const estRevenueGain = selectedProducts.reduce((acc, p) => {
      const priceDelta = p.aiRecommendedPrice - p.currentPrice;
      return acc + (priceDelta * p.unitsSold30d);
    }, 0);
    return {
      count: selectedProducts.length,
      delta,
      estRevenueGain
    };
  }, [selectedProducts]);

  return (
    <div className="space-y-4">
      {/* Grid Controls Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0e172a] p-3 rounded-xl border border-slate-800">
        {/* Left: Filters and Search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search SKU, name, or category..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-52"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-2.5 py-1 text-[11px] rounded-lg transition font-medium whitespace-nowrap ${
                  activeCategoryFilter === cat 
                    ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/30' 
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {cat === 'ALL' ? 'All Catalog Items' : cat.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Right: AG Grid Info / Quick Action */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="hidden lg:inline text-[11px] font-mono">
            {filteredProducts.length} items rendered in AG Grid
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-cyan-300 font-mono text-[10px] border border-blue-500/20">
            Inline Editable: Double Click Price
          </span>
        </div>
      </div>

      {/* Bulk Execution Banner (Appears when checkboxes are selected) */}
      {bulkSelectedMetrics && (
        <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 p-3.5 rounded-xl border border-blue-500/40 shadow-lg shadow-blue-950/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500 text-white font-bold text-xs">
              ✓ {bulkSelectedMetrics.count} Selected
            </div>
            <div>
              <div className="text-xs font-semibold text-white">
                Multi-SKU AI Price Optimization Execution
              </div>
              <div className="text-[11px] text-cyan-200">
                Projected 30-Day Gross Revenue Delta: <strong className="font-mono text-emerald-400">{bulkSelectedMetrics.estRevenueGain >= 0 ? `+$${bulkSelectedMetrics.estRevenueGain.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : `-$${Math.abs(bulkSelectedMetrics.estRevenueGain).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => {
                if (gridRef.current?.api) gridRef.current.api.deselectAll();
              }}
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white transition"
            >
              Clear Selection
            </button>
            <button
              onClick={handleBulkApply}
              disabled={isUpdatingPrice}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept AI Recommendations ({bulkSelectedMetrics.count} SKUs)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main AG Grid Table */}
      <div className="ag-theme-quartz-dark w-full h-[400px] shadow-xl overflow-hidden rounded-xl border border-slate-800">
        <AgGridReact<PayPalProduct>
          ref={gridRef}
          rowData={filteredProducts}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection={{ mode: 'multiRow' }}
          onSelectionChanged={onSelectionChanged}
          onCellValueChanged={handleCellEdit}
          animateRows={true}
          rowHeight={52}
          headerHeight={44}
          suppressCellFocus={false}
          pagination={false}
        />
      </div>

      {/* Master-Detail / Row Expansion View */}
      {expandedProduct && (
        <div className="bg-[#0e172a] border border-blue-500/30 rounded-xl p-5 shadow-2xl relative">
          <div className="flex items-start justify-between pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {expandedProduct.sku}
                </span>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {expandedProduct.name}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {expandedProduct.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {expandedProduct.description}
              </p>
            </div>
            <button
              onClick={() => setExpandedProduct(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 transition"
            >
              Close Details ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-4">
            {/* Column 1: 30-Day Mini Sales Velocity Chart */}
            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                <span className="font-semibold flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  30-Day Daily Sales Velocity
                </span>
                <span className="font-mono text-cyan-300 font-bold">
                  {expandedProduct.unitsSold30d} units
                </span>
              </div>

              {/* Bar Chart Representation */}
              <div className="h-28 flex items-end gap-1 pt-3 pb-1 px-1 border-b border-slate-800">
                {expandedProduct.salesHistory30d.map((val, idx) => {
                  const maxVal = Math.max(...expandedProduct.salesHistory30d, 1);
                  const heightPercent = Math.max(12, Math.round((val / maxVal) * 100));
                  return (
                    <div 
                      key={idx} 
                      className="flex-1 flex flex-col items-center group relative h-full justify-end"
                    >
                      <div
                        className="w-full bg-blue-500 hover:bg-cyan-400 rounded-t-sm transition-all duration-150"
                        style={{ height: `${heightPercent}%` }}
                      />
                      {/* Tooltip on hover */}
                      <div className="absolute -top-7 bg-slate-950 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10 border border-slate-700">
                        Day {idx + 1}: {val} units
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 font-mono">
                <span>30 days ago</span>
                <span>Today (Nov 9, 2026)</span>
              </div>
            </div>

            {/* Column 2: Price Elasticity Curve & AI Rationale */}
            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    AI Elasticity Rationale
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    Confidence: {expandedProduct.aiConfidence}%
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  {expandedProduct.aiRationale}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Elasticity Coeff (Ed)</span>
                  <span className="font-mono font-bold text-slate-200">
                    {expandedProduct.elasticityScore}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Refund Rate</span>
                  <span className={`font-mono font-bold ${expandedProduct.refundRate > 2.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {expandedProduct.refundRate}% ({expandedProduct.refundCount30d} returns)
                  </span>
                </div>
              </div>
            </div>

            {/* Column 3: PayPal REST Catalog Item Metadata */}
            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    PayPal REST Catalog Data
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    STATUS: ACTIVE
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Product ID:</span>
                    <span className="text-slate-200">{expandedProduct.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unit Cost (COGS):</span>
                    <span className="text-slate-200">${expandedProduct.costPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Margin:</span>
                    <span className="text-emerald-400 font-semibold">
                      {(((expandedProduct.currentPrice - expandedProduct.costPrice) / expandedProduct.currentPrice) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Market Benchmark:</span>
                    <span className="text-slate-200">${expandedProduct.competitorAvgPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last REST Sync:</span>
                    <span className="text-slate-400">{new Date(expandedProduct.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => onSimulateSku(expandedProduct.sku)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Simulate Curve</span>
                </button>
                <button
                  onClick={() => onUpdatePrice(expandedProduct.id, expandedProduct.aiRecommendedPrice, 'AI_OPTIMIZATION')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Push ${expandedProduct.aiRecommendedPrice.toFixed(2)} to PayPal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

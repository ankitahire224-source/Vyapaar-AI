import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle, 
  Trash2, 
  Sparkles, 
  ArrowUpRight, 
  Calendar,
  Layers,
  ChevronRight,
  Receipt
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { Product, Sale, Expense, WasteRecord } from '../../types';
import { calculateFinancialSummary } from '../../utils/calculations';
import { formatINR, formatDateTime, getPaymentMethodBadge } from '../../utils/formatters';

interface DashboardViewProps {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  wasteRecords: WasteRecord[];
  onNavigateTab: (tab: any) => void;
  onOpenQuickSale: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  sales,
  expenses,
  wasteRecords,
  onNavigateTab,
  onOpenQuickSale,
}) => {
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'all'>('7days');

  // Compute filter dates
  const filterDate = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    if (dateRange === 'today') {
      return { start: today, end: today };
    }
    if (dateRange === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { start: d.toISOString().split('T')[0], end: today };
    }
    if (dateRange === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return { start: d.toISOString().split('T')[0], end: today };
    }
    return undefined;
  }, [dateRange]);

  const summary = useMemo(() => {
    return calculateFinancialSummary(sales, expenses, wasteRecords, filterDate);
  }, [sales, expenses, wasteRecords, filterDate]);

  // Today specific metrics for immediate daily khata summary
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySummary = useMemo(() => {
    return calculateFinancialSummary(sales, expenses, wasteRecords, {
      start: todayStr,
      end: todayStr,
    });
  }, [sales, expenses, wasteRecords, todayStr]);

  // Low stock products
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.is_active && p.stock_quantity <= p.min_stock_alert);
  }, [products]);

  // Daily trend data for chart
  const trendData = useMemo(() => {
    const dayMap = new Map<string, { date: string; sales: number; profit: number; cogs: number }>();
    
    // Initialize past 7 days in order
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      dayMap.set(str, { date: label, sales: 0, profit: 0, cogs: 0 });
    }

    for (const sale of sales) {
      if (sale.status === 'cancelled') continue;
      const dayStr = sale.sale_date.split('T')[0];
      const entry = dayMap.get(dayStr);
      if (entry) {
        entry.sales += Number(sale.net_amount);
        const saleCogs = sale.items.reduce((sum, it) => sum + (it.quantity * it.unit_cost), 0);
        entry.cogs += saleCogs;
        entry.profit += (sale.net_amount - saleCogs);
      }
    }

    return Array.from(dayMap.values());
  }, [sales]);

  // Recent 5 transactions
  const recentSales = useMemo(() => {
    return sales.slice(0, 5);
  }, [sales]);

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time sales, cost breakdown, inventory alerts, and AI insights.
          </p>
        </div>

        {/* Date Filter & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setDateRange('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === 'today' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange('7days')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === '7days' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateRange('30days')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === '30days' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={onOpenQuickSale}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Counter POS</span>
          </button>
        </div>
      </div>

      {/* AI Coach Floating Smart Alert Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-sm shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">Vyapaar Coach Insight</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Actionable
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Today's Net Sales stand at <strong className="text-slate-900">{formatINR(todaySummary.net_sales)}</strong>. 
              {summary.top_selling_products.length > 0 && (
                <> Top performer is <strong className="text-slate-900">{summary.top_selling_products[0].product_name}</strong>. </>
              )}
              {summary.waste_cost > 0 && (
                <> Cutting <strong className="text-rose-600">{formatINR(summary.waste_cost)}</strong> recorded food waste would directly improve your operating margin.</>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('coach')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-800 text-xs font-bold rounded-xl border border-slate-200 shadow-xs hover:bg-slate-50 transition-colors shrink-0"
        >
          <span>Ask Business Coach</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Primary KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Sales Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900">{formatINR(summary.net_sales)}</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <span>Gross: {formatINR(summary.gross_sales)}</span>
              {summary.discounts > 0 && (
                <span className="text-rose-600 font-medium">(-{formatINR(summary.discounts)} disc)</span>
              )}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>{summary.transaction_count} transactions</span>
            <span>Avg {formatINR(summary.average_order_value)}/bill</span>
          </div>
        </div>

        {/* Estimated Gross Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Profit</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-teal-700">{formatINR(summary.gross_profit)}</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <span>Gross Margin:</span>
              <span className="font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded-md">
                {summary.gross_margin_pct}%
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>COGS (Raw materials)</span>
            <span className="font-semibold text-slate-700">{formatINR(summary.cogs)}</span>
          </div>
        </div>

        {/* Operating Expenses & Overheads */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Operating Expenses</span>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900">{formatINR(summary.operating_expenses)}</div>
            <div className="text-xs text-slate-500 mt-1">
              Gas, Rent, Power, Packaging, Wages
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Food Waste Write-off</span>
            <span className="font-semibold text-rose-600">{formatINR(summary.waste_cost)}</span>
          </div>
        </div>

        {/* Estimated Net Operating Result */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Operating Result</span>
            <div className={`p-2 rounded-xl ${summary.net_operating_result >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-2xl font-bold ${summary.net_operating_result >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatINR(summary.net_operating_result)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Gross Profit minus Overheads & Waste
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Status</span>
            <span className={`font-bold ${summary.net_operating_result >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {summary.net_operating_result >= 0 ? 'Net Operating Profit' : 'Operating Loss'}
            </span>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Alert Banner (if any) */}
      {lowStockProducts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                Low Stock Alert: {lowStockProducts.length} items require replenishment
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                {lowStockProducts.map(p => `${p.name} (${p.stock_quantity} ${p.unit} left)`).join(' • ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('inventory')}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors shrink-0"
          >
            Manage Inventory
          </button>
        </div>
      )}

      {/* Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Revenue & Profit Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">7-Day Sales & Gross Profit Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Daily counter sales collections vs gross margin</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span>Sales</span>
              </div>
              <div className="flex items-center gap-1.5 text-teal-600">
                <span className="w-3 h-3 rounded-full bg-teal-400 inline-block" />
                <span>Gross Profit</span>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val: any) => [formatINR(Number(val)), '']}
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sales" name="Net Sales" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="profit" name="Gross Profit" stroke="#0D9488" strokeWidth={2} fillOpacity={1} fill="url(#profitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Ranking */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Top Revenue Drivers</h3>
              <button
                onClick={() => onNavigateTab('products')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
              >
                <span>View Menu</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {summary.top_selling_products.slice(0, 5).map((prod, idx) => (
                <div key={prod.product_id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 truncate max-w-[180px]">
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 truncate">{prod.product_name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-slate-900">{formatINR(prod.revenue)}</div>
                    <div className="text-[10px] text-slate-500">{prod.quantity} sold • GP: {formatINR(prod.gross_profit)}</div>
                  </div>
                </div>
              ))}

              {summary.top_selling_products.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  No sales recorded in selected range.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-2xl">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Recorded Waste Cost</span>
              <span className="font-bold text-rose-600">{formatINR(summary.waste_cost)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sales & Daily Counter Khata */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Counter Transactions</h3>
            <p className="text-xs text-slate-500">Live invoices with item price & cost snapshots</p>
          </div>
          <button
            onClick={() => onNavigateTab('sales')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>View All Khata Bills</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {recentSales.map((sale) => {
            const badge = getPaymentMethodBadge(sale.payment_method);
            const isCancelled = sale.status === 'cancelled';

            return (
              <div key={sale.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isCancelled ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'}`}>
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{sale.invoice_number}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}>
                        {badge.label}
                      </span>
                      {isCancelled && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                          Cancelled
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {sale.customer_name || 'Walk-in'} • {sale.items.map(i => `${i.product_name} (${i.quantity})`).join(', ')}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-sm font-bold ${isCancelled ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                    {formatINR(sale.net_amount)}
                  </div>
                  <div className="text-[10px] text-slate-400">{formatDateTime(sale.sale_date)}</div>
                </div>
              </div>
            );
          })}

          {recentSales.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">
              No sales transactions recorded yet. Tap "New Bill" to punch your first counter sale!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

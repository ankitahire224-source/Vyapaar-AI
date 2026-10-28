import React, { useState, useMemo } from 'react';
import { 
  TrendingDown, 
  Trash2, 
  Plus, 
  AlertTriangle, 
  Layers, 
  Calendar, 
  DollarSign,
  HelpCircle,
  X
} from 'lucide-react';
import { Product, Expense, WasteRecord, Sale, ExpenseCategory, WasteReason } from '../../types';
import { calculateFinancialSummary } from '../../utils/calculations';
import { formatINR, formatDate } from '../../utils/formatters';

interface ExpensesWasteViewProps {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  wasteRecords: WasteRecord[];
  onCreateExpense: (exp: Omit<Expense, 'id' | 'business_id' | 'created_at'>) => Promise<Expense>;
  onDeleteExpense: (id: string) => Promise<void>;
  onCreateWasteRecord: (rec: {
    product_id?: string;
    product_name: string;
    quantity: number;
    unit_cost: number;
    total_waste_cost: number;
    reason: WasteReason;
    waste_date: string;
    notes?: string;
  }) => Promise<WasteRecord>;
  onDeleteWasteRecord: (id: string) => Promise<void>;
}

export const ExpensesWasteView: React.FC<ExpensesWasteViewProps> = ({
  products,
  sales,
  expenses,
  wasteRecords,
  onCreateExpense,
  onDeleteExpense,
  onCreateWasteRecord,
  onDeleteWasteRecord,
}) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'waste' | 'pnl'>('expenses');

  // Expense modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('gas');
  const [expenseAmount, setExpenseAmount] = useState<number>(100);
  const [expenseMethod, setExpenseMethod] = useState<Expense['payment_method']>('cash');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Waste modal state
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [wasteProductId, setWasteProductId] = useState<string>(products[0]?.id || '');
  const [wasteQuantity, setWasteQuantity] = useState<number>(2);
  const [wasteReason, setWasteReason] = useState<WasteReason>('unsold_eod');
  const [wasteDate, setWasteDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [wasteNotes, setWasteNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Selected product for waste calculation
  const selectedWasteProduct = useMemo(() => {
    return products.find(p => p.id === wasteProductId) || products[0];
  }, [products, wasteProductId]);

  const estimatedWasteCost = useMemo(() => {
    if (!selectedWasteProduct) return 0;
    return Number((selectedWasteProduct.unit_cost * wasteQuantity).toFixed(2));
  }, [selectedWasteProduct, wasteQuantity]);

  // P&L summary calculation
  const pnlSummary = useMemo(() => {
    return calculateFinancialSummary(sales, expenses, wasteRecords);
  }, [sales, expenses, wasteRecords]);

  // Handle Add Expense
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim()) {
      setFormError('Please enter an expense title');
      return;
    }
    if (expenseAmount <= 0) {
      setFormError('Expense amount must be greater than zero');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateExpense({
        title: expenseTitle.trim(),
        category: expenseCategory,
        amount: Number(expenseAmount),
        payment_method: expenseMethod,
        expense_date: expenseDate,
        notes: expenseNotes.trim() || undefined,
      });

      setIsExpenseModalOpen(false);
      setExpenseTitle('');
      setExpenseAmount(100);
      setExpenseNotes('');
      setFormError('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Add Food Waste
  const handleSaveWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWasteProduct) {
      setFormError('Please select a product');
      return;
    }
    if (wasteQuantity <= 0) {
      setFormError('Quantity wasted must be greater than zero');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateWasteRecord({
        product_id: selectedWasteProduct.id,
        product_name: selectedWasteProduct.name,
        quantity: Number(wasteQuantity),
        unit_cost: selectedWasteProduct.unit_cost,
        total_waste_cost: estimatedWasteCost,
        reason: wasteReason,
        waste_date: wasteDate,
        notes: wasteNotes.trim() || undefined,
      });

      setIsWasteModalOpen(false);
      setWasteQuantity(2);
      setWasteNotes('');
      setFormError('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to save waste record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const expenseCategories = [
    { id: 'gas', label: 'Commercial LPG Gas' },
    { id: 'rent', label: 'Shop Rent' },
    { id: 'electricity', label: 'Power & Electricity' },
    { id: 'packaging', label: 'Packaging & Disposables' },
    { id: 'transport', label: 'Mandi Transport' },
    { id: 'wages', label: 'Staff / Helper Wages' },
    { id: 'maintenance', label: 'Repairs & Utensils' },
    { id: 'other', label: 'Other Expenses' },
  ];

  const wasteReasons = [
    { id: 'unsold_eod', label: 'Unsold at Closing (EOD)' },
    { id: 'overcooked_burnt', label: 'Burnt / Overcooked during Frying' },
    { id: 'spoiled_ingredients', label: 'Spoiled Milk / Raw Ingredients' },
    { id: 'damaged_spill', label: 'Spilled / Dropped' },
    { id: 'customer_return', label: 'Customer Replacement' },
    { id: 'other', label: 'Other Reason' },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-orange-600" />
            Expenses, Waste & Profit Analysis
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log overhead operating costs and food waste write-offs with rigorous financial accounting logic.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setFormError(''); setIsExpenseModalOpen(true); }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>

          <button
            onClick={() => { setFormError(''); setIsWasteModalOpen(true); }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 shadow-xs transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Log Waste</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'expenses'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Operating Expenses ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('waste')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'waste'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Food Waste Write-Offs ({wasteRecords.length})
        </button>
        <button
          onClick={() => setActiveTab('pnl')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'pnl'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          P&L Accounting Statement
        </button>
      </div>

      {/* TAB 1: OPERATING EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Expense Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Payment Mode</th>
                  <th className="py-3.5 px-4">Notes</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {formatDate(exp.expense_date)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {exp.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                        {exp.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 uppercase text-slate-600 font-medium">
                      {exp.payment_method}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {exp.notes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                      {formatINR(exp.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        title="Delete expense"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No operating expenses recorded yet. Tap "Add Expense" above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FOOD WASTE TRACKER */}
      {activeTab === 'waste' && (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-rose-900 block text-sm">
                  Total Recorded Waste Loss: {formatINR(pnlSummary.waste_cost)}
                </span>
                <span className="text-rose-700">
                  {pnlSummary.waste_quantity} units thrown away. Logging waste prevents over-cooking and saves kitchen margin.
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Product</th>
                    <th className="py-3.5 px-4">Quantity Wasted</th>
                    <th className="py-3.5 px-4">Unit Cost (COGS)</th>
                    <th className="py-3.5 px-4">Reason for Waste</th>
                    <th className="py-3.5 px-4">Notes</th>
                    <th className="py-3.5 px-4 text-right">Cost Loss</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wasteRecords.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {formatDate(w.waste_date)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {w.product_name}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {w.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatINR(w.unit_cost)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          {w.reason.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {w.notes || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-rose-600 text-sm">
                        {formatINR(w.total_waste_cost)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onDeleteWasteRecord(w.id)}
                          title="Delete waste record"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {wasteRecords.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No food waste records logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: P&L ACCOUNTING STATEMENT */}
      {activeTab === 'pnl' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Audit-Grade Profit & Loss Accounting Statement
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Strictly adheres to standard business accounting principles. Revenue is never conflated with profit.
            </p>
          </div>

          <div className="max-w-2xl space-y-3 text-xs sm:text-sm">
            {/* Gross Revenue */}
            <div className="flex justify-between py-2 border-b border-slate-100 font-semibold text-slate-800">
              <span>Gross Sales Revenue (All punched bills)</span>
              <span>{formatINR(pnlSummary.gross_sales)}</span>
            </div>

            {/* Discounts */}
            <div className="flex justify-between py-2 border-b border-slate-100 text-rose-600">
              <span>Less: Cash & Promotional Discounts</span>
              <span>-{formatINR(pnlSummary.discounts)}</span>
            </div>

            {/* Net Sales */}
            <div className="flex justify-between py-2 border-b border-slate-200 font-bold text-slate-900 bg-slate-50 px-3 rounded-lg">
              <span>Net Sales Revenue (Real Collected Turnover)</span>
              <span className="text-emerald-700 font-black">{formatINR(pnlSummary.net_sales)}</span>
            </div>

            {/* COGS */}
            <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
              <div>
                <span className="block font-semibold">Less: Cost of Goods Sold (COGS)</span>
                <span className="text-[10px] text-slate-400">Direct ingredient snapshots for sold chai, snacks & beverages</span>
              </div>
              <span className="font-semibold">-{formatINR(pnlSummary.cogs)}</span>
            </div>

            {/* Gross Profit */}
            <div className="flex justify-between py-2.5 border-b border-slate-200 font-bold text-teal-800 bg-teal-50 px-3 rounded-lg text-sm">
              <div>
                <span>Estimated Gross Profit</span>
                <span className="text-xs font-normal text-teal-600 block">Gross Margin: {pnlSummary.gross_margin_pct}%</span>
              </div>
              <span className="font-black text-base">{formatINR(pnlSummary.gross_profit)}</span>
            </div>

            {/* Operating Expenses */}
            <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
              <div>
                <span className="block font-semibold">Less: Operating Expenses (Overheads)</span>
                <span className="text-[10px] text-slate-400">Shop rent, commercial LPG gas, electricity, wages, transport</span>
              </div>
              <span className="font-semibold text-rose-600">-{formatINR(pnlSummary.operating_expenses)}</span>
            </div>

            {/* Food Waste */}
            <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
              <div>
                <span className="block font-semibold">Less: Recorded Food Waste Write-Offs</span>
                <span className="text-[10px] text-slate-400">Direct cost of spoiled, burnt, or unsold end-of-day food</span>
              </div>
              <span className="font-semibold text-rose-600">-{formatINR(pnlSummary.waste_cost)}</span>
            </div>

            {/* Net Operating Result */}
            <div className={`flex justify-between py-3 px-3 rounded-xl font-black text-base sm:text-lg ${
              pnlSummary.net_operating_result >= 0
                ? 'bg-emerald-100/70 text-emerald-950 border border-emerald-300'
                : 'bg-rose-100 text-rose-950 border border-rose-300'
            }`}>
              <div>
                <span>Estimated Net Operating Result</span>
                <span className="text-xs font-medium block opacity-75">
                  {pnlSummary.net_operating_result >= 0 ? 'Operating Profit (Net Income)' : 'Operating Loss'}
                </span>
              </div>
              <span>{formatINR(pnlSummary.net_operating_result)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Operating Expense</h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 19kg Commercial Gas Cylinder, Helper wages"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    {expenseCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={expenseMethod}
                    onChange={(e) => setExpenseMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="cash">Cash (Rokad)</option>
                    <option value="upi">UPI / Online</option>
                    <option value="card">Card</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Vendor Info</label>
                <input
                  type="text"
                  placeholder="e.g. Paid to Sarafa Gas Agency"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
                >
                  {isSubmitting ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Food Waste Modal */}
      {isWasteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Log Food Waste Write-Off</h3>
              <button
                onClick={() => setIsWasteModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveWaste} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Wasted *</label>
                <select
                  value={wasteProductId}
                  onChange={(e) => setWasteProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-semibold"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Unit Cost: {formatINR(p.unit_cost)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantity Wasted *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={wasteQuantity}
                    onChange={(e) => setWasteQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Waste Date</label>
                  <input
                    type="date"
                    required
                    value={wasteDate}
                    onChange={(e) => setWasteDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Waste</label>
                <select
                  value={wasteReason}
                  onChange={(e) => setWasteReason(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500"
                >
                  {wasteReasons.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Kitchen Context</label>
                <input
                  type="text"
                  placeholder="e.g. Unsold at 10 PM closing"
                  value={wasteNotes}
                  onChange={(e) => setWasteNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Estimated Waste Loss Pill */}
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex justify-between items-center text-xs">
                <span className="text-rose-800 font-medium">Estimated Cost Incurred:</span>
                <span className="font-black text-rose-700 text-sm">{formatINR(estimatedWasteCost)}</span>
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsWasteModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
                >
                  {isSubmitting ? 'Saving...' : 'Record Waste Write-Off'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

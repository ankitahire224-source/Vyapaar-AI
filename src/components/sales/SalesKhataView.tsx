import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Calendar, 
  Filter, 
  XCircle, 
  Eye, 
  IndianRupee, 
  Printer, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { Sale } from '../../types';
import { formatINR, formatDateTime, getPaymentMethodBadge } from '../../utils/formatters';

interface SalesKhataViewProps {
  sales: Sale[];
  onCancelSale: (saleId: string, reason: string) => Promise<Sale>;
}

export const SalesKhataView: React.FC<SalesKhataViewProps> = ({
  sales,
  onCancelSale,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<string>(''); // YYYY-MM-DD
  
  // Inspection modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Cancellation modal
  const [cancellingSale, setCancellingSale] = useState<Sale | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter sales
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchesSearch = 
        s.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.customer_name && s.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.items.some(i => i.product_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPayment = paymentFilter === 'all' || s.payment_method === paymentFilter;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchesDate = !dateFilter || s.sale_date.startsWith(dateFilter);

      return matchesSearch && matchesPayment && matchesStatus && matchesDate;
    });
  }, [sales, searchQuery, paymentFilter, statusFilter, dateFilter]);

  // Aggregate stats
  const stats = useMemo(() => {
    const completed = filteredSales.filter(s => s.status === 'completed');
    const totalCollected = completed.reduce((sum, s) => sum + Number(s.net_amount), 0);
    const totalDiscounts = completed.reduce((sum, s) => sum + Number(s.discount_amount), 0);
    const cancelledCount = filteredSales.filter(s => s.status === 'cancelled').length;

    return {
      totalCollected,
      totalDiscounts,
      completedCount: completed.length,
      cancelledCount,
    };
  }, [filteredSales]);

  const handleConfirmCancel = async () => {
    if (!cancellingSale || !cancellationReason.trim()) return;

    try {
      setIsSubmitting(true);
      await onCancelSale(cancellingSale.id, cancellationReason.trim());
      setCancellingSale(null);
      setCancellationReason('');
    } catch (err: any) {
      alert(`Error cancelling bill: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            Daily Khata & Sales Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-grade history of all counter transactions, price snapshots, and cancellation corrections.
          </p>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-3 bg-slate-50 p-2 px-3 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Filtered Collection:</span>
            <span className="font-bold text-emerald-700 text-sm">{formatINR(stats.totalCollected)}</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <span className="text-slate-400 block text-[10px]">Valid Bills:</span>
            <span className="font-bold text-slate-800 text-sm">{stats.completedCount}</span>
          </div>
          {stats.cancelledCount > 0 && (
            <>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px]">Voided:</span>
                <span className="font-bold text-rose-600 text-sm">{stats.cancelledCount}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice #, customer, item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Clear Date
            </button>
          )}

          {/* Payment Method Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Payment Modes</option>
            <option value="cash">Cash (Rokad)</option>
            <option value="upi">UPI / QR</option>
            <option value="khata">Khata (Udhaar)</option>
            <option value="card">Card</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed Only</option>
            <option value="cancelled">Cancelled Only</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Items Summary</th>
                <th className="py-3.5 px-4">Payment Mode</th>
                <th className="py-3.5 px-4 text-right">Net Amount</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale) => {
                const badge = getPaymentMethodBadge(sale.payment_method);
                const isCancelled = sale.status === 'cancelled';

                return (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Invoice */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {sale.invoice_number}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatDateTime(sale.sale_date)}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{sale.customer_name || 'Walk-in'}</div>
                      {sale.customer_phone && (
                        <div className="text-[10px] text-slate-400">{sale.customer_phone}</div>
                      )}
                    </td>

                    {/* Items */}
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                      {sale.items.map(i => `${i.product_name} (${i.quantity})`).join(', ')}
                    </td>

                    {/* Payment Mode */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-semibold border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                      <span className={isCancelled ? 'line-through text-slate-400' : 'text-slate-900'}>
                        {formatINR(sale.net_amount)}
                      </span>
                      {sale.discount_amount > 0 && !isCancelled && (
                        <div className="text-[10px] text-rose-600 font-medium">
                          Disc: -{formatINR(sale.discount_amount)}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        isCancelled
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {isCancelled ? 'Voided' : 'Completed'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        title="View itemized thermal bill"
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {!isCancelled && (
                        <button
                          onClick={() => setCancellingSale(sale)}
                          title="Void / Cancel this transaction"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No transactions found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Inspection Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-300">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedSale.invoice_number}</h3>
                <p className="text-[10px] text-slate-400">{formatDateTime(selectedSale.sale_date)}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                selectedSale.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {selectedSale.status.toUpperCase()}
              </span>
            </div>

            {/* Line items with snapshot details */}
            <div className="space-y-2 text-xs border-b border-dashed border-slate-300 pb-4">
              <div className="flex justify-between font-bold text-slate-500 text-[10px] uppercase">
                <span>Item</span>
                <span>Qty × Price</span>
                <span>Subtotal</span>
              </div>
              {selectedSale.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-slate-800">
                  <div>
                    <span className="font-semibold block">{it.product_name}</span>
                    <span className="text-[10px] text-slate-400">
                      Snapshot cost: {formatINR(it.unit_cost)}
                    </span>
                  </div>
                  <span className="text-slate-500">{it.quantity} × {formatINR(it.unit_price)}</span>
                  <span className="font-bold">{formatINR(it.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Gross Total</span>
                <span>{formatINR(selectedSale.total_amount)}</span>
              </div>
              {selectedSale.discount_amount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Discount</span>
                  <span>-{formatINR(selectedSale.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-900 pt-1">
                <span>Net Total ({selectedSale.payment_method.toUpperCase()})</span>
                <span className="text-emerald-700">{formatINR(selectedSale.net_amount)}</span>
              </div>
              {selectedSale.cancellation_reason && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mt-2">
                  <strong>Cancellation Reason:</strong> {selectedSale.cancellation_reason}
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Sale Modal */}
      {cancellingSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-slate-900 text-base">Void / Cancel Bill</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to void <strong>{cancellingSale.invoice_number}</strong> ({formatINR(cancellingSale.net_amount)})? 
              This will safely restore sold items back to product inventory and preserve full accounting audit trails without double-counting.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Reason for Cancellation *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Customer cancelled order, wrong punch"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setCancellingSale(null)}
                className="flex-1 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Keep Bill
              </button>
              <button
                type="button"
                disabled={!cancellationReason.trim() || isSubmitting}
                onClick={handleConfirmCancel}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold disabled:bg-slate-300"
              >
                {isSubmitting ? 'Voiding...' : 'Confirm Void'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

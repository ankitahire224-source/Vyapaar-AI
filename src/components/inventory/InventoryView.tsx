import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Search, 
  Plus, 
  History, 
  Package, 
  CheckCircle2,
  X
} from 'lucide-react';
import { Product, InventoryMovement } from '../../types';
import { formatINR, formatDateTime } from '../../utils/formatters';

interface InventoryViewProps {
  products: Product[];
  movements: InventoryMovement[];
  onAdjustInventory: (productId: string, newQuantity: number, reason: string) => Promise<Product>;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  movements,
  onAdjustInventory,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [newQuantity, setNewQuantity] = useState<number>(50);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Supplier Delivery / Restock');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected product
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  // Low stock products
  const lowStockItems = useMemo(() => {
    return products.filter(p => p.is_active && p.stock_quantity <= p.min_stock_alert);
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const openAdjustModalFor = (prod: Product) => {
    setSelectedProductId(prod.id);
    setNewQuantity(prod.stock_quantity);
    setAdjustmentReason('Supplier Delivery / Restock');
    setCustomReason('');
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      setIsSubmitting(true);
      const finalReason = adjustmentReason === 'Other' ? customReason.trim() : adjustmentReason;
      await onAdjustInventory(selectedProduct.id, Number(newQuantity), finalReason || 'Stock manual correction');
      setIsAdjustModalOpen(false);
    } catch (err: any) {
      alert(`Error adjusting stock: ${err.message || 'Unknown error'}`);
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
            <Boxes className="w-6 h-6 text-emerald-600" />
            Inventory & Stock Control
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time shelf stock, low inventory alerts, and automatic movement audit trails.
          </p>
        </div>

        <button
          onClick={() => {
            if (products.length > 0) openAdjustModalFor(products[0]);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Adjust Stock / Restock</span>
        </button>
      </div>

      {/* Low Stock Warning Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-rose-900 block text-sm">
                {lowStockItems.length} Products Running Critically Low
              </span>
              <span className="text-rose-700">
                Restock these before counter rush to prevent stock-outs and lost sales.
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {lowStockItems.map(p => (
              <button
                key={p.id}
                onClick={() => openAdjustModalFor(p)}
                className="px-2.5 py-1 bg-white border border-rose-200 text-rose-800 rounded-lg font-bold hover:bg-rose-100 shadow-xs transition-colors"
              >
                + Restock {p.name.split(' ')[0]} ({p.stock_quantity} left)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Current Stock Overview ({products.length} Products)
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'audit'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Stock Movement Audit Log ({movements.length} Events)
        </button>
      </div>

      {/* TAB 1: STOCK OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search inventory items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Item Name</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 text-center">Available Stock</th>
                    <th className="py-3.5 px-4 text-center">Safety Threshold</th>
                    <th className="py-3.5 px-4 text-center">Stock Health</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((prod) => {
                    const isLow = prod.stock_quantity <= prod.min_stock_alert;
                    const isOut = prod.stock_quantity <= 0;
                    const stockPct = Math.min(100, Math.round((prod.stock_quantity / Math.max(1, prod.min_stock_alert * 3)) * 100));

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">{prod.name}</div>
                          <div className="text-[10px] text-slate-400">Tracked in {prod.unit}s</div>
                        </td>

                        <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-slate-500">
                          {prod.category.replace('_', ' ')}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className={`text-base font-black ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                            {prod.stock_quantity}
                          </div>
                          <div className="text-[10px] text-slate-400">{prod.unit}</div>
                        </td>

                        <td className="py-3.5 px-4 text-center font-semibold text-slate-600">
                          {prod.min_stock_alert} {prod.unit}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="w-28 mx-auto space-y-1">
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${
                                  isOut ? 'bg-slate-300' : isLow ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.max(5, stockPct)}%` }}
                              />
                            </div>
                            <span className={`text-[10px] font-bold block ${
                              isOut ? 'text-slate-400' : isLow ? 'text-rose-600' : 'text-emerald-700'
                            }`}>
                              {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Optimal'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => openAdjustModalFor(prod)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 rounded-xl font-bold transition-all text-xs"
                          >
                            Update Count
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Event Type</th>
                  <th className="py-3.5 px-4 text-center">Quantity Change</th>
                  <th className="py-3.5 px-4 text-center">Stock Balance After</th>
                  <th className="py-3.5 px-4">Notes / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((mov) => {
                  const isPositive = mov.quantity_change > 0;

                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDateTime(mov.created_at)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {mov.product_name || 'Product'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          mov.movement_type === 'sale'
                            ? 'bg-blue-100 text-blue-800'
                            : mov.movement_type === 'waste'
                            ? 'bg-rose-100 text-rose-800'
                            : mov.movement_type === 'restock'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {mov.movement_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        <span className={isPositive ? 'text-emerald-600' : 'text-slate-700'}>
                          {isPositive ? `+${mov.quantity_change}` : mov.quantity_change}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-slate-900">
                        {mov.quantity_after}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-sm truncate">
                        {mov.notes || '—'}
                      </td>
                    </tr>
                  );
                })}

                {movements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No inventory movements recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Adjust Shelf Stock</h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Item</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const prod = products.find(p => p.id === e.target.value);
                    if (prod) setNewQuantity(prod.stock_quantity);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current: {p.stock_quantity} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Current Stock on System:</span>
                <span className="font-black text-slate-900 text-sm">
                  {selectedProduct.stock_quantity} {selectedProduct.unit}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">New Physical Stock Count *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-black text-base"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Adjustment Reason *</label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Supplier Delivery / Restock">Supplier Delivery / Restock</option>
                  <option value="Physical Kitchen Count Correction">Physical Kitchen Count Correction</option>
                  <option value="Damage / Spillage Write-Off">Damage / Spillage Write-Off</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {adjustmentReason === 'Other' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Custom Reason</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                >
                  {isSubmitting ? 'Updating...' : 'Save Stock Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

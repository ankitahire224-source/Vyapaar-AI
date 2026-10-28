import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Power, 
  AlertTriangle, 
  IndianRupee, 
  Filter,
  Check,
  X
} from 'lucide-react';
import { Product, ProductCategory } from '../../types';
import { formatINR, getCategoryBadge } from '../../utils/formatters';

interface ProductsViewProps {
  products: Product[];
  onCreateProduct: (prod: Omit<Product, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => Promise<Product>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<Product>;
  onToggleActive: (id: string) => Promise<Product>;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onCreateProduct,
  onUpdateProduct,
  onToggleActive,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'inactive'>('all');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ProductCategory>('tea');
  const [formPrice, setFormPrice] = useState<number>(15);
  const [formCost, setFormCost] = useState<number>(5);
  const [formStock, setFormStock] = useState<number>(50);
  const [formAlert, setFormAlert] = useState<number>(15);
  const [formUnit, setFormUnit] = useState<string>('cup');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      
      let matchesStatus = true;
      if (stockStatusFilter === 'low') {
        matchesStatus = p.is_active && p.stock_quantity <= p.min_stock_alert;
      } else if (stockStatusFilter === 'inactive') {
        matchesStatus = !p.is_active;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, categoryFilter, stockStatusFilter]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('tea');
    setFormPrice(15);
    setFormCost(4.5);
    setFormStock(50);
    setFormAlert(15);
    setFormUnit('cup');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormPrice(prod.selling_price);
    setFormCost(prod.unit_cost);
    setFormStock(prod.stock_quantity);
    setFormAlert(prod.min_stock_alert);
    setFormUnit(prod.unit);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Please enter a product name');
      return;
    }
    if (formPrice < 0 || formCost < 0) {
      setFormError('Selling price and unit cost cannot be negative');
      return;
    }

    try {
      setIsSaving(true);
      setFormError('');

      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, {
          name: formName.trim(),
          category: formCategory,
          selling_price: Number(formPrice),
          unit_cost: Number(formCost),
          stock_quantity: Number(formStock),
          min_stock_alert: Number(formAlert),
          unit: formUnit.trim() || 'piece',
        });
      } else {
        await onCreateProduct({
          name: formName.trim(),
          category: formCategory,
          selling_price: Number(formPrice),
          unit_cost: Number(formCost),
          stock_quantity: Number(formStock),
          min_stock_alert: Number(formAlert),
          unit: formUnit.trim() || 'piece',
          is_active: true,
        });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            Products & Menu Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your tea stall items, selling prices, raw material costs, and inventory thresholds.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Categories</option>
            <option value="tea">Chai & Tea</option>
            <option value="coffee">Coffee</option>
            <option value="hot_snacks">Hot Snacks</option>
            <option value="packaged_snacks">Packaged Snacks</option>
            <option value="cold_drinks">Cold Drinks</option>
            <option value="meals">Meals & Other</option>
          </select>

          {/* Status Filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="low">Low Stock Only</option>
            <option value="inactive">Inactive / Deactivated</option>
          </select>
        </div>
      </div>

      {/* Product List Table / Card Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Selling Price</th>
                <th className="py-3.5 px-4 text-right">Unit Cost (COGS)</th>
                <th className="py-3.5 px-4 text-right">Gross Margin</th>
                <th className="py-3.5 px-4 text-center">Stock Level</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((prod) => {
                const badge = getCategoryBadge(prod.category);
                const isLowStock = prod.stock_quantity <= prod.min_stock_alert;
                const margin = prod.selling_price - prod.unit_cost;
                const marginPct = prod.selling_price > 0 ? Math.round((margin / prod.selling_price) * 100) : 0;

                return (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{prod.name}</div>
                      <div className="text-[10px] text-slate-400">Sold in {prod.unit}s</div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-semibold border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>

                    {/* Selling Price */}
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                      {formatINR(prod.selling_price)}
                    </td>

                    {/* Unit Cost */}
                    <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                      {formatINR(prod.unit_cost)}
                    </td>

                    {/* Margin */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                        {marginPct}% (+{formatINR(margin)})
                      </span>
                    </td>

                    {/* Stock Level */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 font-bold">
                        <span className={isLowStock ? 'text-rose-600' : 'text-slate-800'}>
                          {prod.stock_quantity} {prod.unit}
                        </span>
                        {isLowStock && (
                          <span title="Low Stock Warning">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">Min Alert: {prod.min_stock_alert}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        prod.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {prod.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(prod)}
                        title="Edit product"
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onToggleActive(prod.id)}
                        title={prod.is_active ? 'Deactivate product' : 'Activate product'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          prod.is_active
                            ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No products found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masala Kulhad Chai, Bun Maska"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="tea">Chai & Tea</option>
                    <option value="coffee">Coffee</option>
                    <option value="hot_snacks">Hot Snacks</option>
                    <option value="packaged_snacks">Packaged Snacks</option>
                    <option value="cold_drinks">Cold Drinks</option>
                    <option value="meals">Meals & Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Serving Unit</label>
                  <input
                    type="text"
                    placeholder="cup, piece, plate, pack"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Cost (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    value={formCost}
                    onChange={(e) => setFormCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Direct ingredient cost</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Current Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formStock}
                    onChange={(e) => setFormStock(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Stock Alert Point</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formAlert}
                    onChange={(e) => setFormAlert(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-sm"
                >
                  {isSaving ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Printer, 
  QrCode, 
  Search, 
  ShoppingBag, 
  IndianRupee, 
  User, 
  Phone,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, ProductCategory, Sale, Customer } from '../../types';
import { formatINR, getCategoryBadge, formatDateTime } from '../../utils/formatters';

interface QuickSalePOSViewProps {
  products: Product[];
  customers: Customer[];
  onCompleteSale: (saleData: {
    total_amount: number;
    discount_amount: number;
    net_amount: number;
    payment_method: Sale['payment_method'];
    customer_name?: string;
    customer_phone?: string;
    items: {
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      unit_cost: number;
      subtotal: number;
    }[];
  }) => Promise<Sale>;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export const QuickSalePOSView: React.FC<QuickSalePOSViewProps> = ({
  products,
  customers,
  onCompleteSale,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Sale['payment_method']>('cash');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Active products
  const activeProducts = useMemo(() => {
    return products.filter(p => p.is_active);
  }, [products]);

  // Filter products by category & search
  const filteredProducts = useMemo(() => {
    return activeProducts.filter(p => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeProducts, selectedCategory, searchQuery]);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart(prev => {
      const index = prev.findIndex(item => item.product.id === product.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index].quantity += 1;
        return updated;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setCustomerName('');
    setCustomerPhone('');
  };

  // Calculations
  const grossTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);
  }, [cart]);

  const netTotal = useMemo(() => {
    return Math.max(0, grossTotal - discountAmount);
  }, [grossTotal, discountAmount]);

  const estimatedBillProfit = useMemo(() => {
    const billCogs = cart.reduce((sum, item) => sum + item.product.unit_cost * item.quantity, 0);
    return Math.max(0, netTotal - billCogs);
  }, [cart, netTotal]);

  // Handle Complete Sale
  const handleCheckout = async () => {
    if (cart.length === 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const saleItems = cart.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.selling_price, // Price snapshot
        unit_cost: item.product.unit_cost,       // Cost snapshot
        subtotal: item.product.selling_price * item.quantity,
      }));

      const created = await onCompleteSale({
        total_amount: grossTotal,
        discount_amount: discountAmount,
        net_amount: netTotal,
        payment_method: paymentMethod,
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        items: saleItems,
      });

      // Confetti burst for sale completion!
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });

      setCompletedSale(created);
      clearCart();
    } catch (err: any) {
      alert(`Error recording transaction: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectExistingCustomer = (cust: Customer) => {
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone);
  };

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'tea', label: 'Chai & Tea' },
    { id: 'coffee', label: 'Coffee' },
    { id: 'hot_snacks', label: 'Hot Snacks' },
    { id: 'packaged_snacks', label: 'Packaged Snacks' },
    { id: 'cold_drinks', label: 'Cold Drinks' },
  ];

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-600" />
            Quick POS & Counter Billing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tap items to punch counter bills with snapshot pricing and instant receipt generation.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search chai, samosa, snacks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Grid & Category Filters (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((prod) => {
              const inCart = cart.find(it => it.product.id === prod.id);
              const isLowStock = prod.stock_quantity <= prod.min_stock_alert;
              const isOutOfStock = prod.stock_quantity <= 0;

              return (
                <button
                  key={prod.id}
                  disabled={isOutOfStock}
                  onClick={() => addToCart(prod)}
                  className={`text-left p-3.5 rounded-2xl border transition-all duration-150 flex flex-col justify-between relative group ${
                    inCart
                      ? 'bg-emerald-50/60 border-emerald-400 ring-2 ring-emerald-500/20'
                      : isOutOfStock
                      ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-card'
                  }`}
                >
                  {/* In Cart Quantity Pill */}
                  {inCart && (
                    <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      {inCart.quantity}
                    </span>
                  )}

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {prod.category.replace('_', ' ')}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm mt-1 line-clamp-2 leading-snug">
                      {prod.name}
                    </h4>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <div className="text-base sm:text-lg font-black text-slate-900">
                        {formatINR(prod.selling_price)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        per {prod.unit}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isOutOfStock
                          ? 'bg-slate-200 text-slate-600'
                          : isLowStock
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isOutOfStock ? 'Sold Out' : `${prod.stock_quantity} left`}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                No products found matching "{searchQuery}".
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Running Bill & Checkout Drawer (4-5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-card p-5 space-y-4 sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base">Current Bill</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {cart.reduce((sum, it) => sum + it.quantity, 0)} items
              </span>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="truncate max-w-[140px] sm:max-w-[180px]">
                  <div className="font-bold text-slate-800 truncate">{item.product.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {formatINR(item.product.selling_price)} × {item.quantity}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="px-2 py-1 text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 font-bold text-slate-900 text-xs">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="px-2 py-1 text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="font-bold text-slate-900 w-14 text-right">
                    {formatINR(item.product.selling_price * item.quantity)}
                  </span>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                Cart is empty. Tap items on the left to add.
              </div>
            )}
          </div>

          {/* Customer & Khata Options */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Customer Details (Optional)
              </label>
              {customers.length > 0 && (
                <div className="text-[10px] text-emerald-600 font-semibold cursor-pointer">
                  Khata Customer?
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
              <input
                type="tel"
                placeholder="Phone (Optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Quick picker for existing Khata customers */}
            {paymentMethod === 'khata' && (
              <div className="pt-1">
                <span className="text-[10px] text-slate-500 font-medium block mb-1">Pick Khata Account:</span>
                <div className="flex flex-wrap gap-1.5">
                  {customers.slice(0, 3).map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectExistingCustomer(c)}
                      className="text-[10px] px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md hover:bg-amber-100 font-semibold truncate max-w-[150px]"
                    >
                      {c.name.split(' ')[0]} ({formatINR(c.khata_balance)})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
              {[
                { id: 'cash', label: 'Cash' },
                { id: 'upi', label: 'UPI / QR' },
                { id: 'khata', label: 'Khata' },
                { id: 'card', label: 'Card' },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`py-2 px-1 rounded-xl border text-center transition-all ${
                    paymentMethod === m.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Discount Quick Pills */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Quick Discount:</span>
            <div className="flex items-center gap-1.5">
              {[0, 5, 10, 20].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setDiscountAmount(amt)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold border ${
                    discountAmount === amt
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {amt === 0 ? 'None' : `-₹${amt}`}
                </button>
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal (Gross)</span>
              <span>{formatINR(grossTotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>Discount</span>
                <span>-{formatINR(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 pt-1 border-t border-slate-100">
              <span>Total Payable</span>
              <span className="text-emerald-700">{formatINR(netTotal)}</span>
            </div>
            {cart.length > 0 && (
              <div className="flex justify-between text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-1 rounded-md">
                <span>Estimated Gross Margin</span>
                <span>+{formatINR(estimatedBillProfit)}</span>
              </div>
            )}
          </div>

          {/* Checkout Button */}
          <button
            disabled={cart.length === 0 || isSubmitting}
            onClick={handleCheckout}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-md transition-all ${
              cart.length === 0 || isSubmitting
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-emerald-700/25'
            }`}
          >
            {isSubmitting ? (
              <span>Saving Sale...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Sale ({formatINR(netTotal)})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Completed Sale Thermal Bill Modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Bill Header */}
            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Payment Recorded!</h3>
              <p className="text-xs text-slate-500 font-medium">{completedSale.invoice_number}</p>
              <p className="text-[10px] text-slate-400">{formatDateTime(completedSale.sale_date)}</p>
            </div>

            {/* Bill Items */}
            <div className="space-y-2 text-xs border-b border-dashed border-slate-300 pb-4">
              <div className="flex justify-between font-bold text-slate-500 text-[10px] uppercase">
                <span>Item</span>
                <span>Qty × Price</span>
                <span>Total</span>
              </div>
              {completedSale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-slate-800">
                  <span className="font-semibold truncate max-w-[140px]">{item.product_name}</span>
                  <span className="text-slate-500">{item.quantity} × {formatINR(item.unit_price)}</span>
                  <span className="font-bold">{formatINR(item.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Bill Totals */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatINR(completedSale.total_amount)}</span>
              </div>
              {completedSale.discount_amount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Discount</span>
                  <span>-{formatINR(completedSale.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-900 pt-1">
                <span>Paid via {completedSale.payment_method.toUpperCase()}</span>
                <span className="text-emerald-700">{formatINR(completedSale.net_amount)}</span>
              </div>
              {completedSale.customer_name && (
                <div className="text-[10px] text-slate-400 text-center pt-2">
                  Customer: {completedSale.customer_name}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => window.print()}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Receipt</span>
              </button>

              <button
                onClick={() => setCompletedSale(null)}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>Punch Next Bill (Enter)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

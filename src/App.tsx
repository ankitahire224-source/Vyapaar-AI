import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { DashboardView } from './components/dashboard/DashboardView';
import { QuickSalePOSView } from './components/pos/QuickSalePOSView';
import { ProductsView } from './components/products/ProductsView';
import { SalesKhataView } from './components/sales/SalesKhataView';
import { ExpensesWasteView } from './components/expenses/ExpensesWasteView';
import { InventoryView } from './components/inventory/InventoryView';
import { AICoachView } from './components/coach/AICoachView';
import { CustomerLoyaltyView } from './components/loyalty/CustomerLoyaltyView';
import { SettingsModal } from './components/settings/SettingsModal';

import { 
  Business, 
  Product, 
  Sale, 
  Expense, 
  WasteRecord, 
  InventoryMovement, 
  Customer, 
  KhataEntry 
} from './types';
import { 
  getBusiness, 
  updateBusiness, 
  getProducts, 
  createProduct, 
  updateProduct, 
  toggleProductActive,
  getSales, 
  createSale, 
  cancelSale, 
  getExpenses, 
  createExpense, 
  deleteExpense, 
  getWasteRecords, 
  createWasteRecord, 
  deleteWasteRecord, 
  getInventoryMovements, 
  adjustInventory, 
  getCustomers, 
  createCustomer, 
  recordKhataPayment,
  getAppMode, 
  setAppMode, 
  resetDemoData 
} from './services/storage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [appMode, setAppModeState] = useState<'demo' | 'live'>(getAppMode());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Data states
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [khataEntries, setKhataEntries] = useState<KhataEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        b,
        prods,
        sls,
        exps,
        wst,
        movs,
        custs,
      ] = await Promise.all([
        getBusiness(),
        getProducts(),
        getSales(),
        getExpenses(),
        getWasteRecords(),
        getInventoryMovements(),
        getCustomers(),
      ]);

      setBusiness(b);
      setProducts(prods);
      setSales(sls);
      setExpenses(exps);
      setWasteRecords(wst);
      setMovements(movs);
      setCustomers(custs);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keyboard shortcut: F2 for Quick POS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('pos');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handleCompleteSale = async (saleData: any) => {
    const newSale = await createSale(saleData);
    // Reload state after sale to sync inventory and khata
    await loadData();
    return newSale;
  };

  const handleCancelSale = async (saleId: string, reason: string) => {
    const updated = await cancelSale(saleId, reason);
    await loadData();
    return updated;
  };

  const handleCreateProduct = async (prodData: any) => {
    const created = await createProduct(prodData);
    await loadData();
    return created;
  };

  const handleUpdateProduct = async (id: string, updates: any) => {
    const updated = await updateProduct(id, updates);
    await loadData();
    return updated;
  };

  const handleToggleProductActive = async (id: string) => {
    const updated = await toggleProductActive(id);
    await loadData();
    return updated;
  };

  const handleCreateExpense = async (expData: any) => {
    const created = await createExpense(expData);
    await loadData();
    return created;
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id);
    await loadData();
  };

  const handleCreateWasteRecord = async (wasteData: any) => {
    const created = await createWasteRecord(wasteData);
    await loadData();
    return created;
  };

  const handleDeleteWasteRecord = async (id: string) => {
    await deleteWasteRecord(id);
    await loadData();
  };

  const handleAdjustInventory = async (productId: string, newQuantity: number, reason: string) => {
    const updated = await adjustInventory(productId, newQuantity, reason);
    await loadData();
    return updated;
  };

  const handleCreateCustomer = async (data: any) => {
    const created = await createCustomer(data);
    await loadData();
    return created;
  };

  const handleRecordKhataPayment = async (customerId: string, amount: number, notes?: string) => {
    const updated = await recordKhataPayment(customerId, amount, notes);
    await loadData();
    return updated;
  };

  const handleSwitchMode = (mode: 'demo' | 'live') => {
    setAppMode(mode);
    setAppModeState(mode);
    loadData();
  };

  const handleResetDemo = () => {
    resetDemoData();
    loadData();
  };

  const handleUpdateBusiness = async (updated: Partial<Business>) => {
    const biz = await updateBusiness(updated);
    setBusiness(biz);
    return biz;
  };

  // Low stock counter for sidebar badge
  const lowStockCount = useMemo(() => {
    return products.filter(p => p.is_active && p.stock_quantity <= p.min_stock_alert).length;
  }, [products]);

  if (isLoading || !business) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4 animate-bounce">
          <span className="font-black text-xl text-slate-950">V</span>
        </div>
        <h2 className="text-lg font-bold">Vyapaar AI</h2>
        <p className="text-xs text-slate-400 mt-1">Starting up your local business copilot...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        business={business}
        appMode={appMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenQuickSale={() => setActiveTab('pos')}
        onResetDemo={handleResetDemo}
        activeTab={activeTab}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar & Mobile Nav */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          lowStockCount={lowStockCount}
        />

        {/* Dynamic View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-hidden">
          {activeTab === 'dashboard' && (
            <DashboardView
              products={products}
              sales={sales}
              expenses={expenses}
              wasteRecords={wasteRecords}
              onNavigateTab={setActiveTab}
              onOpenQuickSale={() => setActiveTab('pos')}
            />
          )}

          {activeTab === 'pos' && (
            <QuickSalePOSView
              products={products}
              customers={customers}
              onCompleteSale={handleCompleteSale}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView
              products={products}
              onCreateProduct={handleCreateProduct}
              onUpdateProduct={handleUpdateProduct}
              onToggleActive={handleToggleProductActive}
            />
          )}

          {activeTab === 'sales' && (
            <SalesKhataView
              sales={sales}
              onCancelSale={handleCancelSale}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesWasteView
              products={products}
              sales={sales}
              expenses={expenses}
              wasteRecords={wasteRecords}
              onCreateExpense={handleCreateExpense}
              onDeleteExpense={handleDeleteExpense}
              onCreateWasteRecord={handleCreateWasteRecord}
              onDeleteWasteRecord={handleDeleteWasteRecord}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              products={products}
              movements={movements}
              onAdjustInventory={handleAdjustInventory}
            />
          )}

          {activeTab === 'coach' && (
            <AICoachView
              products={products}
              sales={sales}
              expenses={expenses}
              wasteRecords={wasteRecords}
            />
          )}

          {activeTab === 'loyalty' && (
            <CustomerLoyaltyView
              customers={customers}
              khataEntries={khataEntries}
              onCreateCustomer={handleCreateCustomer}
              onRecordKhataPayment={handleRecordKhataPayment}
            />
          )}
        </main>
      </div>

      {/* Page Footer */}
      <Footer
        onSelectTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        business={business}
        appMode={appMode}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateBusiness={handleUpdateBusiness}
        onSwitchMode={handleSwitchMode}
        onResetDemoData={handleResetDemo}
      />
    </div>
  );
};

export default App;

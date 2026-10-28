import { 
  Business, 
  Product, 
  Sale, 
  Expense, 
  WasteRecord, 
  InventoryMovement, 
  Customer, 
  KhataEntry 
} from '../types';
import { 
  SEED_BUSINESS, 
  SEED_PRODUCTS, 
  SEED_SALES, 
  SEED_EXPENSES, 
  SEED_WASTE_RECORDS, 
  SEED_INVENTORY_MOVEMENTS, 
  SEED_CUSTOMERS, 
  SEED_KHATA_ENTRIES 
} from '../data/seedData';
import { getSupabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEYS = {
  APP_MODE: 'vyapaar_app_mode', // 'demo' | 'live'
  BUSINESS: 'vyapaar_demo_business',
  PRODUCTS: 'vyapaar_demo_products',
  SALES: 'vyapaar_demo_sales',
  EXPENSES: 'vyapaar_demo_expenses',
  WASTE: 'vyapaar_demo_waste',
  MOVEMENTS: 'vyapaar_demo_movements',
  CUSTOMERS: 'vyapaar_demo_customers',
  KHATA: 'vyapaar_demo_khata',
};

// Mode Helper
export function getAppMode(): 'demo' | 'live' {
  const saved = localStorage.getItem(STORAGE_KEYS.APP_MODE);
  if (saved === 'live' && isSupabaseConfigured()) {
    return 'live';
  }
  return 'demo';
}

export function setAppMode(mode: 'demo' | 'live') {
  localStorage.setItem(STORAGE_KEYS.APP_MODE, mode);
}

// Ensure demo storage is seeded
function initializeDemoStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.BUSINESS)) {
    localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(SEED_BUSINESS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(SEED_SALES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(SEED_EXPENSES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.WASTE)) {
    localStorage.setItem(STORAGE_KEYS.WASTE, JSON.stringify(SEED_WASTE_RECORDS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MOVEMENTS)) {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(SEED_INVENTORY_MOVEMENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(SEED_CUSTOMERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.KHATA)) {
    localStorage.setItem(STORAGE_KEYS.KHATA, JSON.stringify(SEED_KHATA_ENTRIES));
  }
}

export function resetDemoData() {
  localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(SEED_BUSINESS));
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(SEED_SALES));
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(SEED_EXPENSES));
  localStorage.setItem(STORAGE_KEYS.WASTE, JSON.stringify(SEED_WASTE_RECORDS));
  localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(SEED_INVENTORY_MOVEMENTS));
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(SEED_CUSTOMERS));
  localStorage.setItem(STORAGE_KEYS.KHATA, JSON.stringify(SEED_KHATA_ENTRIES));
}

// ----------------- BUSINESS -----------------
export async function getBusiness(): Promise<Business> {
  const mode = getAppMode();
  const supabase = getSupabase();

  if (mode === 'live' && supabase) {
    const { data, error } = await supabase.from('businesses').select('*').limit(1).maybeSingle();
    if (!error && data) {
      return data;
    }
  }

  initializeDemoStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.BUSINESS);
  return raw ? JSON.parse(raw) : SEED_BUSINESS;
}

export async function updateBusiness(updated: Partial<Business>): Promise<Business> {
  const mode = getAppMode();
  const supabase = getSupabase();

  if (mode === 'live' && supabase) {
    const current = await getBusiness();
    const { data, error } = await supabase
      .from('businesses')
      .update(updated)
      .eq('id', current.id)
      .select()
      .single();
    if (!error && data) return data;
  }

  const current = await getBusiness();
  const merged: Business = { ...current, ...updated };
  localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(merged));
  return merged;
}

// ----------------- PRODUCTS -----------------
export async function getProducts(): Promise<Product[]> {
  const mode = getAppMode();
  const supabase = getSupabase();

  if (mode === 'live' && supabase) {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (!error && data) return data;
  }

  initializeDemoStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  return raw ? JSON.parse(raw) : SEED_PRODUCTS;
}

export async function createProduct(product: Omit<Product, 'id' | 'business_id' | 'created_at' | 'updated_at'>): Promise<Product> {
  const biz = await getBusiness();
  const mode = getAppMode();
  const supabase = getSupabase();

  if (mode === 'live' && supabase) {
    const { data, error } = await supabase
      .from('products')
      .insert({ ...product, business_id: biz.id })
      .select()
      .single();
    if (!error && data) return data;
  }

  const products = await getProducts();
  const newProduct: Product = {
    ...product,
    id: `prod-${Date.now()}`,
    business_id: biz.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  products.push(newProduct);
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

  // Log initial inventory movement
  await logInventoryMovement({
    business_id: biz.id,
    product_id: newProduct.id,
    product_name: newProduct.name,
    movement_type: 'restock',
    quantity_change: newProduct.stock_quantity,
    quantity_after: newProduct.stock_quantity,
    notes: 'Initial product stock creation',
  });

  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const mode = getAppMode();
  const supabase = getSupabase();

  if (mode === 'live' && supabase) {
    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (!error && data) return data;
  }

  const products = await getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Product not found');

  const updated = { ...products[index], ...updates, updated_at: new Date().toISOString() };
  products[index] = updated;
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  return updated;
}

export async function toggleProductActive(id: string): Promise<Product> {
  const products = await getProducts();
  const prod = products.find(p => p.id === id);
  if (!prod) throw new Error('Product not found');
  return updateProduct(id, { is_active: !prod.is_active });
}

// ----------------- SALES & POS -----------------
export async function getSales(): Promise<Sale[]> {
  const mode = getAppMode();
  const supabase = getSupabase();

  if (mode === 'live' && supabase) {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        items:sale_items(*)
      `)
      .order('sale_date', { ascending: false });
    if (!error && data) return data;
  }

  initializeDemoStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.SALES);
  return raw ? JSON.parse(raw) : SEED_SALES;
}

export async function createSale(data: {
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
}): Promise<Sale> {
  const biz = await getBusiness();
  const mode = getAppMode();
  const supabase = getSupabase();

  const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date().toISOString();

  if (mode === 'live' && supabase) {
    const { data: saleData, error: saleErr } = await supabase
      .from('sales')
      .insert({
        business_id: biz.id,
        invoice_number: invoiceNumber,
        total_amount: data.total_amount,
        discount_amount: data.discount_amount,
        net_amount: data.net_amount,
        payment_method: data.payment_method,
        customer_name: data.customer_name || 'Walk-in Customer',
        customer_phone: data.customer_phone,
        status: 'completed',
        sale_date: now,
      })
      .select()
      .single();

    if (!saleErr && saleData) {
      const itemsToInsert = data.items.map(i => ({
        sale_id: saleData.id,
        product_id: i.product_id,
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        unit_cost: i.unit_cost,
        subtotal: i.subtotal,
      }));

      await supabase.from('sale_items').insert(itemsToInsert);
      return { ...saleData, items: itemsToInsert };
    }
  }

  const sales = await getSales();
  const products = await getProducts();

  const newSale: Sale = {
    id: `sale-${Date.now()}`,
    business_id: biz.id,
    invoice_number: invoiceNumber,
    total_amount: data.total_amount,
    discount_amount: data.discount_amount,
    net_amount: data.net_amount,
    payment_method: data.payment_method,
    customer_name: data.customer_name || 'Walk-in Customer',
    customer_phone: data.customer_phone,
    status: 'completed',
    sale_date: now,
    items: data.items.map(it => ({
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...it,
    })),
  };

  // Deduct inventory for sold items and log movement
  for (const item of data.items) {
    const pIndex = products.findIndex(p => p.id === item.product_id);
    if (pIndex !== -1) {
      const newQty = Math.max(0, products[pIndex].stock_quantity - item.quantity);
      products[pIndex].stock_quantity = newQty;

      await logInventoryMovement({
        business_id: biz.id,
        product_id: item.product_id,
        product_name: item.product_name,
        movement_type: 'sale',
        quantity_change: -item.quantity,
        quantity_after: newQty,
        reference_id: newSale.id,
        notes: `Sale ${newSale.invoice_number}`,
      });
    }
  }

  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

  // If Khata payment method, update or create customer credit
  if (data.payment_method === 'khata' && data.customer_name) {
    await recordKhataSale(biz.id, data.customer_name, data.customer_phone || '', data.net_amount, newSale.id);
  }

  sales.unshift(newSale);
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  return newSale;
}

export async function cancelSale(saleId: string, reason: string): Promise<Sale> {
  const sales = await getSales();
  const saleIndex = sales.findIndex(s => s.id === saleId);
  if (saleIndex === -1) throw new Error('Sale not found');

  const sale = sales[saleIndex];
  if (sale.status === 'cancelled') return sale;

  sale.status = 'cancelled';
  sale.cancellation_reason = reason;

  // Restore inventory
  const products = await getProducts();
  for (const item of sale.items) {
    const pIndex = products.findIndex(p => p.id === item.product_id);
    if (pIndex !== -1) {
      const restoredQty = products[pIndex].stock_quantity + item.quantity;
      products[pIndex].stock_quantity = restoredQty;

      await logInventoryMovement({
        business_id: sale.business_id,
        product_id: item.product_id || '',
        product_name: item.product_name,
        movement_type: 'manual_adjustment',
        quantity_change: item.quantity,
        quantity_after: restoredQty,
        reference_id: sale.id,
        notes: `Inventory restored due to cancellation of ${sale.invoice_number}: ${reason}`,
      });
    }
  }

  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  sales[saleIndex] = sale;
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  return sale;
}

// ----------------- EXPENSES -----------------
export async function getExpenses(): Promise<Expense[]> {
  const mode = getAppMode();
  const supabase = getSupabase();

  if (mode === 'live' && supabase) {
    const { data, error } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
    if (!error && data) return data;
  }

  initializeDemoStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
  return raw ? JSON.parse(raw) : SEED_EXPENSES;
}

export async function createExpense(expense: Omit<Expense, 'id' | 'business_id' | 'created_at'>): Promise<Expense> {
  const biz = await getBusiness();
  const mode = getAppMode();
  const supabase = getSupabase();

  if (mode === 'live' && supabase) {
    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...expense, business_id: biz.id })
      .select()
      .single();
    if (!error && data) return data;
  }

  const expenses = await getExpenses();
  const newExpense: Expense = {
    ...expense,
    id: `exp-${Date.now()}`,
    business_id: biz.id,
    created_at: new Date().toISOString(),
  };

  expenses.unshift(newExpense);
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  return newExpense;
}

export async function deleteExpense(id: string): Promise<void> {
  const expenses = await getExpenses();
  const filtered = expenses.filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filtered));
}

// ----------------- FOOD WASTE -----------------
export async function getWasteRecords(): Promise<WasteRecord[]> {
  const mode = getAppMode();
  const supabase = getSupabase();

  if (mode === 'live' && supabase) {
    const { data, error } = await supabase.from('waste_records').select('*').order('waste_date', { ascending: false });
    if (!error && data) return data;
  }

  initializeDemoStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.WASTE);
  return raw ? JSON.parse(raw) : SEED_WASTE_RECORDS;
}

export async function createWasteRecord(record: {
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_waste_cost: number;
  reason: WasteRecord['reason'];
  waste_date: string;
  notes?: string;
}): Promise<WasteRecord> {
  const biz = await getBusiness();
  const mode = getAppMode();
  const supabase = getSupabase();

  if (mode === 'live' && supabase) {
    const { data, error } = await supabase
      .from('waste_records')
      .insert({ ...record, business_id: biz.id })
      .select()
      .single();
    if (!error && data) return data;
  }

  const records = await getWasteRecords();
  const products = await getProducts();

  const newRecord: WasteRecord = {
    ...record,
    id: `waste-${Date.now()}`,
    business_id: biz.id,
    created_at: new Date().toISOString(),
  };

  // Deduct wasted quantity from inventory if product exists
  if (record.product_id) {
    const pIndex = products.findIndex(p => p.id === record.product_id);
    if (pIndex !== -1) {
      const newQty = Math.max(0, products[pIndex].stock_quantity - record.quantity);
      products[pIndex].stock_quantity = newQty;

      await logInventoryMovement({
        business_id: biz.id,
        product_id: record.product_id,
        product_name: record.product_name,
        movement_type: 'waste',
        quantity_change: -record.quantity,
        quantity_after: newQty,
        reference_id: newRecord.id,
        notes: `Waste write-off (${record.reason}): ${record.notes || ''}`,
      });

      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    }
  }

  records.unshift(newRecord);
  localStorage.setItem(STORAGE_KEYS.WASTE, JSON.stringify(records));
  return newRecord;
}

export async function deleteWasteRecord(id: string): Promise<void> {
  const records = await getWasteRecords();
  const filtered = records.filter(w => w.id !== id);
  localStorage.setItem(STORAGE_KEYS.WASTE, JSON.stringify(filtered));
}

// ----------------- INVENTORY MOVEMENTS -----------------
export async function getInventoryMovements(): Promise<InventoryMovement[]> {
  const mode = getAppMode();
  const supabase = getSupabase();

  if (mode === 'live' && supabase) {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) return data;
  }

  initializeDemoStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
  return raw ? JSON.parse(raw) : SEED_INVENTORY_MOVEMENTS;
}

export async function logInventoryMovement(movement: Omit<InventoryMovement, 'id' | 'created_at'>): Promise<InventoryMovement> {
  const movements = await getInventoryMovements();
  const newMovement: InventoryMovement = {
    ...movement,
    id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    created_at: new Date().toISOString(),
  };

  movements.unshift(newMovement);
  localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  return newMovement;
}

export async function adjustInventory(productId: string, newQuantity: number, reason: string): Promise<Product> {
  const products = await getProducts();
  const pIndex = products.findIndex(p => p.id === productId);
  if (pIndex === -1) throw new Error('Product not found');

  const oldQty = products[pIndex].stock_quantity;
  const change = newQuantity - oldQty;
  products[pIndex].stock_quantity = newQuantity;

  const biz = await getBusiness();
  await logInventoryMovement({
    business_id: biz.id,
    product_id: productId,
    product_name: products[pIndex].name,
    movement_type: change >= 0 ? 'restock' : 'manual_adjustment',
    quantity_change: change,
    quantity_after: newQuantity,
    notes: reason,
  });

  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  return products[pIndex];
}

// ----------------- CUSTOMERS & KHATA -----------------
export async function getCustomers(): Promise<Customer[]> {
  initializeDemoStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
  return raw ? JSON.parse(raw) : SEED_CUSTOMERS;
}

export async function createCustomer(data: { name: string; phone: string; initialKhataBalance?: number }): Promise<Customer> {
  const biz = await getBusiness();
  const customers = await getCustomers();
  const newCust: Customer = {
    id: `cust-${Date.now()}`,
    business_id: biz.id,
    name: data.name,
    phone: data.phone,
    khata_balance: data.initialKhataBalance || 0,
    loyalty_points: 0,
    created_at: new Date().toISOString(),
  };

  customers.unshift(newCust);
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  return newCust;
}

export async function getKhataEntries(): Promise<KhataEntry[]> {
  initializeDemoStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.KHATA);
  return raw ? JSON.parse(raw) : SEED_KHATA_ENTRIES;
}

export async function recordKhataSale(businessId: string, customerName: string, phone: string, amount: number, saleId: string) {
  const customers = await getCustomers();
  let cust = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase() || (phone && c.phone === phone));

  if (!cust) {
    cust = {
      id: `cust-${Date.now()}`,
      business_id: businessId,
      name: customerName,
      phone: phone || '+91 90000 00000',
      khata_balance: 0,
      loyalty_points: 0,
      created_at: new Date().toISOString(),
    };
    customers.push(cust);
  }

  cust.khata_balance += amount;
  // Award 1 loyalty point per 50 rupees spent
  cust.loyalty_points += Math.floor(amount / 50);

  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));

  const entries = await getKhataEntries();
  entries.unshift({
    id: `khata-${Date.now()}`,
    customer_id: cust.id,
    business_id: businessId,
    entry_type: 'credit_given',
    amount,
    sale_id: saleId,
    notes: 'Counter credit sale',
    entry_date: new Date().toISOString(),
  });

  localStorage.setItem(STORAGE_KEYS.KHATA, JSON.stringify(entries));
}

export async function recordKhataPayment(customerId: string, amount: number, notes?: string): Promise<Customer> {
  const customers = await getCustomers();
  const cIndex = customers.findIndex(c => c.id === customerId);
  if (cIndex === -1) throw new Error('Customer not found');

  customers[cIndex].khata_balance = Math.max(0, customers[cIndex].khata_balance - amount);
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));

  const entries = await getKhataEntries();
  entries.unshift({
    id: `khata-${Date.now()}`,
    customer_id: customerId,
    business_id: customers[cIndex].business_id,
    entry_type: 'payment_received',
    amount,
    notes: notes || 'Cash/UPI settlement received',
    entry_date: new Date().toISOString(),
  });

  localStorage.setItem(STORAGE_KEYS.KHATA, JSON.stringify(entries));
  return customers[cIndex];
}

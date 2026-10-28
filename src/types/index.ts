export type ProductCategory = 
  | 'tea'
  | 'coffee'
  | 'hot_snacks'
  | 'packaged_snacks'
  | 'cold_drinks'
  | 'meals'
  | 'other';

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'khata' | 'split';

export type SaleStatus = 'completed' | 'cancelled' | 'refunded';

export type WasteReason = 
  | 'unsold_eod'
  | 'spoiled_ingredients'
  | 'overcooked_burnt'
  | 'damaged_spill'
  | 'customer_return'
  | 'other';

export type InventoryMovementType = 'restock' | 'sale' | 'waste' | 'manual_adjustment';

export type ExpenseCategory = 
  | 'raw_materials'
  | 'gas'
  | 'rent'
  | 'electricity'
  | 'packaging'
  | 'transport'
  | 'wages'
  | 'maintenance'
  | 'other';

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  business_type: string;
  currency: string;
  currency_symbol: string;
  address?: string;
  phone?: string;
  gstin?: string;
  created_at?: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  category: ProductCategory;
  selling_price: number;
  unit_cost: number; // Cost of goods sold per unit
  stock_quantity: number;
  min_stock_alert: number;
  unit: string; // 'cup', 'piece', 'plate', 'packet', 'kg', etc.
  is_active: boolean;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SaleItem {
  id?: string;
  sale_id?: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number; // Snapshot of selling price at time of sale
  unit_cost: number;  // Snapshot of unit cost at time of sale
  subtotal: number;
}

export interface Sale {
  id: string;
  business_id: string;
  invoice_number: string;
  total_amount: number; // Gross amount before discount
  discount_amount: number;
  net_amount: number; // Final collected amount
  payment_method: PaymentMethod;
  customer_name?: string;
  customer_phone?: string;
  status: SaleStatus;
  cancellation_reason?: string;
  sale_date: string;
  created_at?: string;
  items: SaleItem[];
}

export interface Expense {
  id: string;
  business_id: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  payment_method: PaymentMethod;
  expense_date: string; // YYYY-MM-DD
  notes?: string;
  receipt_url?: string;
  created_at?: string;
}

export interface WasteRecord {
  id: string;
  business_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_waste_cost: number;
  reason: WasteReason;
  waste_date: string; // YYYY-MM-DD
  notes?: string;
  created_at?: string;
}

export interface InventoryMovement {
  id: string;
  business_id: string;
  product_id: string;
  product_name?: string;
  movement_type: InventoryMovementType;
  quantity_change: number; // + for add/restock, - for sale/waste
  quantity_after: number;
  reference_id?: string; // sale_id or waste_id
  notes?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  khata_balance: number; // positive = customer owes money (Udhaar)
  loyalty_points: number;
  created_at?: string;
}

export interface KhataEntry {
  id: string;
  customer_id: string;
  business_id: string;
  entry_type: 'credit_given' | 'payment_received';
  amount: number;
  sale_id?: string;
  notes?: string;
  entry_date: string;
  created_at?: string;
}

export interface FinancialSummary {
  gross_sales: number;
  discounts: number;
  refunds: number;
  net_sales: number;
  cogs: number; // Cost of Goods Sold
  gross_profit: number; // Net Sales - COGS
  gross_margin_pct: number; // (Gross Profit / Net Sales) * 100
  operating_expenses: number; // Rent, electricity, gas, packaging, etc.
  waste_cost: number;
  waste_quantity: number;
  net_operating_result: number; // Gross Profit - Operating Expenses - Waste Cost
  transaction_count: number;
  average_order_value: number;
  top_selling_products: {
    product_id: string;
    product_name: string;
    quantity: number;
    revenue: number;
    gross_profit: number;
  }[];
}

export interface AICoachMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
  metricsGrounding?: Record<string, string | number>;
  source?: 'gemini_api' | 'grounded_rules';
}

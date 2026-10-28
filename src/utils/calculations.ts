import { Sale, Expense, WasteRecord, FinancialSummary } from '../types';

/**
 * Calculates comprehensive financial metrics for a business over a given set of sales, expenses, and waste records.
 * 
 * Accounting rules strictly implemented:
 * - Gross Sales: Sum of all item quantities * item unit_price for non-cancelled sales.
 * - Discounts: Sum of discounts applied across completed transactions.
 * - Refunds: Sum of net amounts of refunded transactions.
 * - Net Sales Revenue: Gross Sales - Discounts - Refunds.
 * - Cost of Goods Sold (COGS): Sum of item quantities * snapshot unit_cost for completed sales.
 * - Estimated Gross Profit: Net Sales Revenue - COGS.
 * - Gross Margin %: (Estimated Gross Profit / Net Sales Revenue) * 100 (0 if Net Sales is 0).
 * - Operating Expenses: Sum of operational expenses (Rent, Electricity, LPG Gas, Packaging, Wages, etc.).
 *   Note: Direct product raw material costs are accounted for in COGS; Operating Expenses cover overheads.
 * - Waste Cost: Sum of total_waste_cost for recorded food waste.
 * - Net Operating Result: Gross Profit - Operating Expenses - Waste Cost.
 * - Clearly distinguishes revenue from profit.
 */
export function calculateFinancialSummary(
  sales: Sale[],
  expenses: Expense[],
  wasteRecords: WasteRecord[],
  filterDate?: { start?: string; end?: string }
): FinancialSummary {
  // Filter sales within date range if provided
  const filteredSales = sales.filter(s => {
    if (!filterDate) return true;
    const saleDate = s.sale_date.split('T')[0];
    if (filterDate.start && saleDate < filterDate.start) return false;
    if (filterDate.end && saleDate > filterDate.end) return false;
    return true;
  });

  const filteredExpenses = expenses.filter(e => {
    if (!filterDate) return true;
    if (filterDate.start && e.expense_date < filterDate.start) return false;
    if (filterDate.end && e.expense_date > filterDate.end) return false;
    return true;
  });

  const filteredWaste = wasteRecords.filter(w => {
    if (!filterDate) return true;
    if (filterDate.start && w.waste_date < filterDate.start) return false;
    if (filterDate.end && w.waste_date > filterDate.end) return false;
    return true;
  });

  let gross_sales = 0;
  let discounts = 0;
  let refunds = 0;
  let cogs = 0;
  let completedCount = 0;

  // Track product performance
  const productStatsMap = new Map<string, {
    product_id: string;
    product_name: string;
    quantity: number;
    revenue: number;
    cogs: number;
  }>();

  for (const sale of filteredSales) {
    if (sale.status === 'cancelled') {
      // Cancelled transactions are excluded from revenue and COGS
      continue;
    }

    if (sale.status === 'refunded') {
      // Refunded transactions are counted in gross but subtracted in refunds
      refunds += Number(sale.net_amount || 0);
      continue;
    }

    // Completed sales
    completedCount++;
    discounts += Number(sale.discount_amount || 0);

    for (const item of sale.items) {
      const itemGross = Number(item.quantity) * Number(item.unit_price);
      const itemCogs = Number(item.quantity) * Number(item.unit_cost);

      gross_sales += itemGross;
      cogs += itemCogs;

      const pId = item.product_id || item.product_name;
      const existing = productStatsMap.get(pId) || {
        product_id: pId,
        product_name: item.product_name,
        quantity: 0,
        revenue: 0,
        cogs: 0,
      };

      existing.quantity += Number(item.quantity);
      existing.revenue += itemGross;
      existing.cogs += itemCogs;
      productStatsMap.set(pId, existing);
    }
  }

  const net_sales = Math.max(0, gross_sales - discounts - refunds);
  const gross_profit = net_sales - cogs;
  const gross_margin_pct = net_sales > 0 ? (gross_profit / net_sales) * 100 : 0;

  const operating_expenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const waste_cost = filteredWaste.reduce((sum, w) => sum + Number(w.total_waste_cost || 0), 0);
  const waste_quantity = filteredWaste.reduce((sum, w) => sum + Number(w.quantity || 0), 0);

  // Net Operating Result = Gross Profit minus Operating Expenses and Waste write-offs
  const net_operating_result = gross_profit - operating_expenses - waste_cost;

  const average_order_value = completedCount > 0 ? net_sales / completedCount : 0;

  const top_selling_products = Array.from(productStatsMap.values())
    .map(p => ({
      product_id: p.product_id,
      product_name: p.product_name,
      quantity: Math.round(p.quantity * 10) / 10,
      revenue: Math.round(p.revenue * 100) / 100,
      gross_profit: Math.round((p.revenue - p.cogs) * 100) / 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    gross_sales: Math.round(gross_sales * 100) / 100,
    discounts: Math.round(discounts * 100) / 100,
    refunds: Math.round(refunds * 100) / 100,
    net_sales: Math.round(net_sales * 100) / 100,
    cogs: Math.round(cogs * 100) / 100,
    gross_profit: Math.round(gross_profit * 100) / 100,
    gross_margin_pct: Math.round(gross_margin_pct * 10) / 10,
    operating_expenses: Math.round(operating_expenses * 100) / 100,
    waste_cost: Math.round(waste_cost * 100) / 100,
    waste_quantity: Math.round(waste_quantity * 10) / 10,
    net_operating_result: Math.round(net_operating_result * 100) / 100,
    transaction_count: completedCount,
    average_order_value: Math.round(average_order_value * 100) / 100,
    top_selling_products,
  };
}

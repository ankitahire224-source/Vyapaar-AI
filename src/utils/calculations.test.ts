import { describe, it, expect } from 'vitest';
import { calculateFinancialSummary } from './calculations';
import { Sale, Expense, WasteRecord } from '../types';

describe('Vyapaar Financial Accounting Calculations', () => {
  const sampleSales: Sale[] = [
    {
      id: 's-1',
      business_id: 'biz-1',
      invoice_number: 'INV-001',
      total_amount: 100, // 4 chai @ 15 = 60, 2 samosa @ 20 = 40
      discount_amount: 10,
      net_amount: 90,
      payment_method: 'cash',
      status: 'completed',
      sale_date: '2026-10-28T09:00:00Z',
      items: [
        { product_name: 'Masala Chai', quantity: 4, unit_price: 15, unit_cost: 4.5, subtotal: 60 },
        { product_name: 'Samosa', quantity: 2, unit_price: 20, unit_cost: 6.5, subtotal: 40 },
      ],
    },
    {
      id: 's-2',
      business_id: 'biz-1',
      invoice_number: 'INV-002',
      total_amount: 50,
      discount_amount: 0,
      net_amount: 50,
      payment_method: 'upi',
      status: 'completed',
      sale_date: '2026-10-28T10:00:00Z',
      items: [
        { product_name: 'Vada Pav', quantity: 2, unit_price: 25, unit_cost: 8.0, subtotal: 50 },
      ],
    },
    {
      id: 's-3',
      business_id: 'biz-1',
      invoice_number: 'INV-003',
      total_amount: 60,
      discount_amount: 0,
      net_amount: 60,
      payment_method: 'cash',
      status: 'cancelled', // Cancelled transaction should NOT be counted in revenue or COGS
      sale_date: '2026-10-28T11:00:00Z',
      items: [
        { product_name: 'Masala Chai', quantity: 4, unit_price: 15, unit_cost: 4.5, subtotal: 60 },
      ],
    },
  ];

  const sampleExpenses: Expense[] = [
    {
      id: 'e-1',
      business_id: 'biz-1',
      category: 'gas',
      title: 'LPG Refill',
      amount: 40,
      payment_method: 'cash',
      expense_date: '2026-10-28',
    },
    {
      id: 'e-2',
      business_id: 'biz-1',
      category: 'packaging',
      title: 'Cups & napkins',
      amount: 15,
      payment_method: 'cash',
      expense_date: '2026-10-28',
    },
  ];

  const sampleWaste: WasteRecord[] = [
    {
      id: 'w-1',
      business_id: 'biz-1',
      product_name: 'Samosa',
      quantity: 2,
      unit_cost: 6.5,
      total_waste_cost: 13,
      reason: 'unsold_eod',
      waste_date: '2026-10-28',
    },
  ];

  it('correctly calculates Gross Sales, Net Sales, and discounts', () => {
    // Gross sales: Sale 1 (60 + 40 = 100) + Sale 2 (50) = 150
    // Cancelled sale 3 is ignored.
    // Discount: 10
    // Net sales: 150 - 10 = 140
    const summary = calculateFinancialSummary(sampleSales, [], []);
    expect(summary.gross_sales).toBe(150);
    expect(summary.discounts).toBe(10);
    expect(summary.net_sales).toBe(140);
    expect(summary.transaction_count).toBe(2);
    expect(summary.average_order_value).toBe(70);
  });

  it('correctly calculates Cost of Goods Sold (COGS) and Gross Profit', () => {
    // Sale 1 COGS: (4 * 4.5 = 18) + (2 * 6.5 = 13) = 31
    // Sale 2 COGS: (2 * 8.0 = 16)
    // Total COGS = 31 + 16 = 47
    // Gross Profit = Net Sales (140) - COGS (47) = 93
    // Gross Margin % = (93 / 140) * 100 = 66.4%
    const summary = calculateFinancialSummary(sampleSales, [], []);
    expect(summary.cogs).toBe(47);
    expect(summary.gross_profit).toBe(93);
    expect(summary.gross_margin_pct).toBe(66.4);
  });

  it('correctly calculates Operating Expenses, Waste, and Net Operating Result', () => {
    // Operating expenses = 40 + 15 = 55
    // Waste cost = 13 (2 samosas @ 6.5)
    // Net Operating Result = Gross Profit (93) - Expenses (55) - Waste (13) = 25
    const summary = calculateFinancialSummary(sampleSales, sampleExpenses, sampleWaste);
    expect(summary.operating_expenses).toBe(55);
    expect(summary.waste_cost).toBe(13);
    expect(summary.waste_quantity).toBe(2);
    expect(summary.net_operating_result).toBe(25);
  });

  it('handles empty data gracefully without division by zero', () => {
    const summary = calculateFinancialSummary([], [], []);
    expect(summary.gross_sales).toBe(0);
    expect(summary.net_sales).toBe(0);
    expect(summary.cogs).toBe(0);
    expect(summary.gross_profit).toBe(0);
    expect(summary.gross_margin_pct).toBe(0);
    expect(summary.net_operating_result).toBe(0);
    expect(summary.transaction_count).toBe(0);
    expect(summary.average_order_value).toBe(0);
  });
});

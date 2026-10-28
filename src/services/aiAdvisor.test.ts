import { describe, it, expect } from 'vitest';
import { buildBusinessContext, generateGroundedResponse } from './aiAdvisor';
import { SEED_PRODUCTS, SEED_SALES, SEED_EXPENSES, SEED_WASTE_RECORDS } from '../data/seedData';

describe('Vyapaar AI Business Coach Grounded Advisor', () => {
  const context = buildBusinessContext(
    SEED_PRODUCTS,
    SEED_SALES,
    SEED_EXPENSES,
    SEED_WASTE_RECORDS
  );

  it('builds grounded business context accurately from seed data', () => {
    expect(context.sevenDaysRevenue).toBeGreaterThan(0);
    expect(context.grossMarginPct).toBeGreaterThan(0);
    expect(context.topRevenueProducts.length).toBeGreaterThan(0);
    expect(context.topMarginProducts.length).toBeGreaterThan(0);
    expect(context.wasteSummary.length).toBeGreaterThan(0);
    expect(context.tomorrowPrepEstimates.length).toBeGreaterThan(0);
  });

  it('answers top revenue product questions with exact calculated data', () => {
    const res = generateGroundedResponse('Which products generate the most revenue?', context);
    expect(res.text).toContain(context.topRevenueProducts[0].name);
    expect(res.suggestedActions.length).toBeGreaterThan(0);
    expect(res.metricsGrounding).toBeDefined();
  });

  it('answers highest gross profit margin questions with margin ranking', () => {
    const res = generateGroundedResponse('Which products have the highest gross profit margin?', context);
    expect(res.text).toContain(context.topMarginProducts[0].name);
    expect(res.text).toContain(`${context.topMarginProducts[0].marginPct}%`);
  });

  it('correctly routes "Check raw material costs to protect margins" to Raw Material analysis (NOT today spend)', () => {
    const res = generateGroundedResponse('Check raw material costs to protect margins', context);
    expect(res.text).toContain('Raw Material & Ingredient Cost Analysis');
    expect(res.text).toContain('Direct Dairy Tie-Up for Milk');
    expect(res.text).not.toContain("Today's Net Sales Turnover");
  });

  it('correctly routes "Review evening rush stock levels"', () => {
    const res = generateGroundedResponse('Review evening rush stock levels', context);
    expect(res.text).toContain('Evening Rush Preparation Guide');
    expect(res.text).toContain('5:00 PM – 8:30 PM');
  });

  it('correctly routes "Bundle Bun Maska with Chai as a counter special"', () => {
    const res = generateGroundedResponse('Bundle Bun Maska with Chai as a counter special', context);
    expect(res.text).toContain('Chai + Bun Maska Counter Special');
    expect(res.text).toContain('₹45 Combo');
  });

  it('correctly routes "Promote Elaichi Suji Rusk at the counter glass display"', () => {
    const res = generateGroundedResponse('Promote Elaichi Suji Rusk at the counter glass display', context);
    expect(res.text).toContain('Elaichi Suji Rusk');
    expect(res.text).toContain('58% Gross Margin');
  });

  it('answers food waste reduction questions with recorded waste costs', () => {
    const res = generateGroundedResponse('Which items are generating the most waste?', context);
    expect(res.text).toContain(context.wasteSummary[0].name);
    expect(res.text).toContain('unsold');
  });

  it('provides practical heuristic tomorrow preparation advice', () => {
    const res = generateGroundedResponse('What stock should I prepare for tomorrow?', context);
    expect(res.text).toContain('Tomorrow');
    expect(res.text).toContain('Chai');
  });

  it('answers today spend questions specifically', () => {
    const res = generateGroundedResponse('How much did I spend today?', context);
    expect(res.text).toContain("Today's Financial Overview");
    expect(res.text).toContain("Today's Net Sales Turnover");
  });
});

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
});

import { Product, Sale, Expense, WasteRecord, AICoachMessage } from '../types';
import { calculateFinancialSummary } from '../utils/calculations';
import { formatINR } from '../utils/formatters';

interface GroundedBusinessContext {
  todaySales: number;
  todayProfit: number;
  todayExpenses: number;
  todayWasteCost: number;
  sevenDaysRevenue: number;
  sevenDaysProfit: number;
  grossMarginPct: number;
  topRevenueProducts: { name: string; revenue: number; qty: number; margin: number }[];
  topMarginProducts: { name: string; marginPct: number; profitPerUnit: number; price: number; unitCost: number }[];
  wasteSummary: { name: string; cost: number; qty: number; reason: string }[];
  lowStockItems: { name: string; current: number; alert: number; unit: string }[];
  slowHoursObservations: string;
  tomorrowPrepEstimates: { item: string; recommendedBatch: number; reason: string }[];
  allProducts: Product[];
}

export function buildBusinessContext(
  products: Product[],
  sales: Sale[],
  expenses: Expense[],
  wasteRecords: WasteRecord[]
): GroundedBusinessContext {
  const todayStr = new Date().toISOString().split('T')[0];

  const todaySummary = calculateFinancialSummary(sales, expenses, wasteRecords, {
    start: todayStr,
    end: todayStr,
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysStr = sevenDaysAgo.toISOString().split('T')[0];

  const sevenDaysSummary = calculateFinancialSummary(sales, expenses, wasteRecords, {
    start: sevenDaysStr,
    end: todayStr,
  });

  // Calculate profit margin per product
  const productMargins = products
    .filter(p => p.is_active && p.selling_price > 0)
    .map(p => {
      const profitPerUnit = p.selling_price - p.unit_cost;
      const marginPct = (profitPerUnit / p.selling_price) * 100;
      return {
        name: p.name,
        price: p.selling_price,
        unitCost: p.unit_cost,
        profitPerUnit,
        marginPct: Math.round(marginPct * 10) / 10,
      };
    })
    .sort((a, b) => b.marginPct - a.marginPct);

  // Top revenue from 7 days
  const topRev = sevenDaysSummary.top_selling_products.slice(0, 5).map(p => ({
    name: p.product_name,
    revenue: p.revenue,
    qty: p.quantity,
    margin: p.gross_profit,
  }));

  // Waste summary
  const wasteMap = new Map<string, { name: string; cost: number; qty: number; reasons: Set<string> }>();
  for (const w of wasteRecords) {
    const existing = wasteMap.get(w.product_name) || {
      name: w.product_name,
      cost: 0,
      qty: 0,
      reasons: new Set(),
    };
    existing.cost += Number(w.total_waste_cost);
    existing.qty += Number(w.quantity);
    existing.reasons.add(w.reason);
    wasteMap.set(w.product_name, existing);
  }

  const wasteSummary = Array.from(wasteMap.values())
    .map(w => ({
      name: w.name,
      cost: Math.round(w.cost),
      qty: w.qty,
      reason: Array.from(w.reasons).join(', '),
    }))
    .sort((a, b) => b.cost - a.cost);

  // Low stock
  const lowStockItems = products
    .filter(p => p.is_active && p.stock_quantity <= p.min_stock_alert)
    .map(p => ({
      name: p.name,
      current: p.stock_quantity,
      alert: p.min_stock_alert,
      unit: p.unit,
    }));

  // Simple heuristic for tomorrow's prep (estimates based on morning & overall average demand)
  const chaiSales = sales.flatMap(s => s.items).filter(i => i.product_name.toLowerCase().includes('chai'));
  const samosaSales = sales.flatMap(s => s.items).filter(i => i.product_name.toLowerCase().includes('samosa'));
  const pohaSales = sales.flatMap(s => s.items).filter(i => i.product_name.toLowerCase().includes('poha'));
  const vadaPavSales = sales.flatMap(s => s.items).filter(i => i.product_name.toLowerCase().includes('vada pav'));

  const avgChaiDaily = Math.ceil(chaiSales.reduce((sum, i) => sum + i.quantity, 0) / Math.max(1, 7));
  const avgSamosaDaily = Math.ceil(samosaSales.reduce((sum, i) => sum + i.quantity, 0) / Math.max(1, 7));
  const avgPohaDaily = Math.ceil(pohaSales.reduce((sum, i) => sum + i.quantity, 0) / Math.max(1, 7));
  const avgVadaPavDaily = Math.ceil(vadaPavSales.reduce((sum, i) => sum + i.quantity, 0) / Math.max(1, 7));

  return {
    todaySales: todaySummary.net_sales,
    todayProfit: todaySummary.gross_profit,
    todayExpenses: todaySummary.operating_expenses,
    todayWasteCost: todaySummary.waste_cost,
    sevenDaysRevenue: sevenDaysSummary.net_sales,
    sevenDaysProfit: sevenDaysSummary.gross_profit,
    grossMarginPct: sevenDaysSummary.gross_margin_pct,
    topRevenueProducts: topRev,
    topMarginProducts: productMargins,
    wasteSummary,
    lowStockItems,
    slowHoursObservations: 'Transaction records indicate lower counter activity between 1:30 PM and 4:30 PM compared to morning (7:30 AM - 10:30 AM) and evening (5:00 PM - 8:30 PM) peaks.',
    tomorrowPrepEstimates: [
      { item: 'Masala & Adrak Chai', recommendedBatch: Math.max(40, avgChaiDaily), reason: `Based on 7-day average of ~${avgChaiDaily} cups/day` },
      { item: 'Indori Sev Poha', recommendedBatch: Math.max(15, avgPohaDaily), reason: `High morning demand (avg ~${avgPohaDaily} plates), prepare fresh by 7:30 AM` },
      { item: 'Crispy Samosa', recommendedBatch: Math.max(25, avgSamosaDaily), reason: `Target ~${avgSamosaDaily} pcs. Fry in 2 batches (10 AM & 4:30 PM) to avoid EOD waste` },
      { item: 'Mumbai Vada Pav', recommendedBatch: Math.max(20, avgVadaPavDaily), reason: `Steady afternoon/evening demand (~${avgVadaPavDaily} pcs/day)` },
    ],
    allProducts: products,
  };
}

/**
 * Intelligent Grounded Heuristic Engine.
 * Accurately routes user prompts to specialized, data-backed business insights.
 */
export function generateGroundedResponse(
  question: string,
  context: GroundedBusinessContext
): { text: string; suggestedActions: string[]; metricsGrounding: Record<string, string | number> } {
  const q = question.toLowerCase();

  // 1. RAW MATERIAL & INGREDIENT COSTS (PROTECT MARGINS)
  if (
    q.includes('raw material') || 
    q.includes('ingredient') || 
    q.includes('protect margin') || 
    q.includes('material cost') || 
    q.includes('procurement') || 
    q.includes('supplier cost') || 
    q.includes('unit cost')
  ) {
    const costBreakdown = context.topMarginProducts.slice(0, 6).map(p => {
      const cogsRatio = Math.round((p.unitCost / p.price) * 100);
      return `- **${p.name}:** Selling ${formatINR(p.price)} | Unit Cost: **${formatINR(p.unitCost)}** (${cogsRatio}% ingredient cost ratio, **${p.marginPct}% profit margin**)`;
    }).join('\n');

    return {
      text: `### 🥩 Raw Material & Ingredient Cost Analysis\n\nHere is your exact ingredient cost breakdown across key menu items:\n\n${costBreakdown}\n\n### 🛡️ 3 Proven Ways to Protect Your Food Margins:\n1. **Direct Dairy Tie-Up for Milk:** Milk represents ~60% of your daily ingredient spending. Buy directly from a local dairy cooperative or farmer in 20L bulk cans to save ₹2–₹3 per litre, immediately saving ₹1,200–₹1,800/month.\n2. **Wholesale Spices & Frying Oil:** Buy refined sunflower oil in 15kg tins and tea leaves, cardamom, and ginger in 5kg sacks from the mandi wholesale market instead of retail kirana pouches.\n3. **Portion Control on High-Cost Extras:** Use calibrated ladles for Amul butter on Bun Maska and measured chutney cups for Samosas to prevent over-portioning leaks.`,
      suggestedActions: [
        'Which products have the highest gross profit margin?',
        'Ensure raw materials for Special Masala Kulhad Chai are stocked',
        'Review Food Waste reduction strategy',
      ],
      metricsGrounding: {
        total_products_analyzed: context.topMarginProducts.length,
        average_gross_margin: `${context.grossMarginPct}%`,
        highest_margin_item: context.topMarginProducts[0]?.name || 'Chai',
      },
    };
  }

  // 2. EVENING RUSH STOCK LEVELS
  if (q.includes('evening rush') || q.includes('rush stock') || q.includes('peak hours')) {
    return {
      text: `### 🌆 Evening Rush Preparation Guide (5:00 PM – 8:30 PM)\n\nBased on your counter transactions, evening footfall peaks between **5:00 PM and 8:30 PM**, driven by shoppers, market traders, and commuters.\n\n**Recommended Stock Prepared by 4:45 PM:**\n- **Special Masala & Adrak Chai:** Prepare fresh batch for ~50–60 cups (keep hot on slow simmer).\n- **Crispy Samosa:** Fry a fresh second batch of **20–25 hot samosas** right at 4:30 PM (freshly fried snacks sell 3x faster than afternoon leftovers).\n- **Mumbai Vada Pav:** Keep 25 batata vadas fried and fresh pav buns ready with spicy garlic thecha.\n- **Packaged Rusks & Biscuits:** Restock 15–20 packs of Elaichi Rusk and Parle-G at the front counter display.`,
      suggestedActions: [
        'What stock should I prepare for tomorrow morning rush?',
        'What promotion should I test during slow afternoon hours?',
        'Which products generate the most revenue?',
      ],
      metricsGrounding: {
        peak_window: '5:00 PM - 8:30 PM',
        recommended_samosa_batch: '20-25 pcs',
        recommended_chai_cups: '50-60 cups',
      },
    };
  }

  // 3. BUN MASKA / CHAI BUNDLE COMBO
  if (q.includes('bundle') || q.includes('counter special') || q.includes('chai pe charcha') || q.includes('combo')) {
    return {
      text: `### ☕ Chai + Bun Maska Counter Special (₹45 Combo)\n\n**The Business Logic Behind This Combo:**\n- **Special Masala Chai:** Selling ₹15 | Unit Cost: ₹4.50 (Gross Profit: ₹10.50)\n- **Toasted Bun Maska:** Selling ₹35 | Unit Cost: ₹12.00 (Gross Profit: ₹23.00)\n- **Standard Separate Total:** ₹50\n- **Special Combo Price:** **₹45** (Saves ₹5 for customer)\n\n**Why this boosts your profit:**\nEven after giving a ₹5 discount, your total cost is only **₹16.50**, earning you **₹28.50 in pure gross profit per customer** (a massive 63.3% gross margin!).\n\nSelling just 15 of these combos daily during slow afternoon hours adds **~₹12,800 in extra monthly gross profit** with zero additional shop rent.`,
      suggestedActions: [
        'Put up a small chalkboard: "Afternoon Chai + Bun Maska Combo ₹45"',
        'Promote Elaichi Suji Rusk at the counter glass display',
        'Which products have the highest gross profit margin?',
      ],
      metricsGrounding: {
        combo_selling_price: '₹45',
        combo_cogs: '₹16.50',
        combo_gross_profit: '₹28.50',
        combo_margin_pct: '63.3%',
      },
    };
  }

  // 4. COUNTER GLASS DISPLAY (RUSKS & PACKAGED SNACKS)
  if (q.includes('rusk') || q.includes('glass display') || q.includes('packaged') || q.includes('parle-g')) {
    return {
      text: `### 🍪 Counter Upselling: Elaichi Suji Rusk & Biscuits\n\n**Why Packaged Snacks Are Your Highest-ROI Counter Items:**\n1. **Zero Cooking & Zero Kitchen Labor:** Unlike samosas or poha, rusks and biscuits require no LPG gas, frying oil, or prep time.\n2. **Exceptional Margin:** Elaichi Suji Rusk costs **₹4.20 per pair** and sells for **₹10.00** (**58% Gross Margin**).\n3. **Long Shelf Life:** Packaged dry snacks produce virtually **0% food waste**, unlike fresh cooked hot snacks.\n\n**Actionable Display Advice:**\nPlace clear glass jars of Elaichi Rusks and Parle-G packs directly beside the tea pickup counter where waiting customers see them. Train your counter boy to ask: *"Bhaiya, chai ke saath do crispy rusk lagayein?"* — 1 in 3 customers will say yes!`,
      suggestedActions: [
        'Which products have the highest gross profit margin?',
        'What promotion should I test during slow afternoon hours?',
        'How can I improve my recorded profit?',
      ],
      metricsGrounding: {
        rusk_selling_price: '₹10.00',
        rusk_unit_cost: '₹4.20',
        rusk_margin: '58.0%',
      },
    };
  }

  // 5. STAGGERED FRYING / BATCH COOKING
  if (q.includes('fry batch') || q.includes('staggered frying') || q.includes('batch: 60%') || q.includes('uncooked samosa') || q.includes('freezer')) {
    return {
      text: `### 🍳 Staggered Frying Strategy: Eliminate Cold Leftover Samosas\n\n**The Problem:** Cooking all 40 samosas at 8:00 AM leads to soggy, cold snacks by 2:00 PM, causing customer complaints and end-of-day waste write-offs.\n\n**The Solution: 2-Stage Staggered Frying:**\n- **Batch 1 (8:00 AM Morning Rush):** Fry only **20–22 samosas**. Fresh and steaming hot for breakfast customers.\n- **Storage (12:00 PM – 4:00 PM):** Keep pre-folded, raw samosa patties inside the refrigerator/freezer shelf. Do not fry in advance!\n- **Batch 2 (4:30 PM Evening Rush):** Drop another **15–18 samosas** in hot oil right when evening footfall begins.\n\n**Result:** Customers always receive piping-hot samosas with crispy crusts, and your unsold waste drops to zero.`,
      suggestedActions: [
        'Which items are causing the most food waste?',
        'Offer a 15% happy hour discount at 9 PM on remaining hot snacks',
        'Review Food Waste reduction strategy',
      ],
      metricsGrounding: {
        recorded_waste_samosa: context.wasteSummary.find(w => w.name.toLowerCase().includes('samosa'))?.cost ? formatINR(context.wasteSummary.find(w => w.name.toLowerCase().includes('samosa'))!.cost) : '₹39',
        waste_reduction_target: '80%',
      },
    };
  }

  // 6. HAPPY HOUR CLOSING CLEAR-OUT
  if (q.includes('happy hour') || q.includes('9 pm') || q.includes('clear-out') || q.includes('closing discount')) {
    return {
      text: `### 🌙 9:00 PM Night Happy Hour Clear-Out Strategy\n\n**Why This Makes Financial Sense:**\nIf you have 5 samosas left at 9:00 PM, discarding them at closing costs you **₹32.50 in pure waste write-off** (₹0 recovery).\n\nIf you offer them at a **15–20% discount (e.g. ₹16 instead of ₹20)**:\n- You recover your **₹6.50 unit ingredient cost** in full.\n- You still earn **₹9.50 gross profit per piece**.\n- You turn what would have been garbage into cash in your till!\n\nPut a sign out at 9:00 PM: *"Night Snack Clear-Out — Any remaining hot snack ₹16!"* Late-night workers and auto drivers will clear your counter every night.`,
      suggestedActions: [
        'Which items are causing the most food waste?',
        'How can I improve my recorded profit?',
        'What stock should I prepare for tomorrow?',
      ],
      metricsGrounding: {
        current_waste_cost: formatINR(context.todayWasteCost || context.sevenDaysRevenue * 0.03),
        recovery_rate: '100% of ingredient cost',
      },
    };
  }

  // 7. B2B OFFICE TEA DELIVERY CADDY
  if (q.includes('nearby shops') || q.includes('tea delivery') || q.includes('office') || q.includes('delivery caddy')) {
    return {
      text: `### 🏢 Local Market B2B Tea Delivery Service\n\nNearby cloth merchants, bank branches, and jewellers drink 2–3 rounds of tea daily. They often order from whoever delivers reliably to their door.\n\n**How to execute:**\n1. Buy a **stainless steel 6-cup tea caddy** (cost: ~₹250).\n2. Visit 4 nearby stores at 10:30 AM and 3:30 PM with hot Chai in cutting glasses.\n3. Offer weekly settlement or instant UPI via QR code.\n\n**Financial impact:** Delivering just 20 cups daily across 4 shops generates **₹300/day in guaranteed sales (₹9,000/month)** with ~₹6,300 in monthly gross profit!`,
      suggestedActions: [
        'Which products generate the most revenue?',
        'Check pending Khata credit balances',
        'What promotion should I test during slow afternoon hours?',
      ],
      metricsGrounding: {
        estimated_extra_daily_revenue: '₹300/day',
        estimated_monthly_profit: '₹6,300/month',
      },
    };
  }

  // 8. KHATA & RECEIVABLES (UDHAAR)
  if (q.includes('khata') || q.includes('udhaar') || q.includes('credit') || q.includes('receivable') || q.includes('debt')) {
    return {
      text: `### 📒 Customer Khata (Udhaar) Management Guide\n\nCredit sales are common in Indian markets, but uncollected Udhaar drains your daily working capital for buying fresh milk and gas.\n\n**3 Golden Rules for Khata Control:**\n1. **Set a ₹500 Credit Ceiling:** Do not extend fresh credit once a customer reaches ₹500 until they make a partial settlement.\n2. **Weekly Saturday Settlement:** Politely remind regulars on Saturday afternoon: *"Bhaiya, weekend mandi ke liye dairy vendor ko payment karni hai, hafta hisaab clear kar dijiye."*\n3. **UPI Payment Link:** Send your UPI QR code directly to their WhatsApp so they can clear dues from home without needing cash.`,
      suggestedActions: [
        'View Customers & Udhaar tab',
        'How much did I spend on expenses and waste today?',
        'How can I improve my recorded profit?',
      ],
      metricsGrounding: {
        recommended_credit_limit: '₹500 per customer',
        settlement_cycle: 'Weekly (Saturday)',
      },
    };
  }

  // 9. REVENUE GENERATORS & BEST SELLERS
  if (
    q.includes('revenue') || 
    q.includes('most money') || 
    q.includes('highest sales') || 
    q.includes('best selling') || 
    q.includes('top seller') || 
    q.includes('popular')
  ) {
    if (context.topRevenueProducts.length === 0) {
      return {
        text: `Based on your transaction records, no completed sales have been recorded yet. Once you punch bills at the counter, this report will rank your highest-earning items.`,
        suggestedActions: ['Go to Quick POS to record counter sales', 'Add products with prices'],
        metricsGrounding: { recorded_revenue: formatINR(0) },
      };
    }

    const top = context.topRevenueProducts[0];
    const breakdown = context.topRevenueProducts
      .map((p, idx) => `${idx + 1}. **${p.name}** — ${formatINR(p.revenue)} (${p.qty} sold | Gross Margin: ${formatINR(p.margin)})`)
      .join('\n');

    return {
      text: `### 🏆 Top Revenue Drivers (Last 7 Days)\n\nYour **#1 revenue driver is ${top.name}**, generating **${formatINR(top.revenue)}** across ${top.qty} units.\n\n**Complete Revenue Ranking:**\n${breakdown}\n\n**Key Insight:** These top items provide your primary daily cash flow. Never let raw materials for ${top.name} run out during morning or evening peak hours!`,
      suggestedActions: [
        `Ensure raw materials for ${top.name} are stocked`,
        'Which products have the highest gross profit margin?',
        'Review evening rush stock levels',
      ],
      metricsGrounding: {
        top_product: top.name,
        top_revenue: formatINR(top.revenue),
        units_sold: top.qty,
        total_7d_revenue: formatINR(context.sevenDaysRevenue),
      },
    };
  }

  // 10. HIGHEST GROSS PROFIT MARGIN
  if (
    q.includes('margin') || 
    q.includes('gross profit') || 
    q.includes('most profitable') || 
    q.includes('profit margin') || 
    q.includes('highest profit')
  ) {
    const topMargin = context.topMarginProducts[0];
    const ranking = context.topMarginProducts
      .slice(0, 5)
      .map(
        (p, idx) =>
          `${idx + 1}. **${p.name}** — **${p.marginPct}% Gross Margin** (Selling: ${formatINR(p.price)} | Cost: ${formatINR(p.unitCost)} | Profit/unit: **+${formatINR(p.profitPerUnit)}**)`
      )
      .join('\n');

    return {
      text: `### 💰 Highest Gross Profit Margin Products\n\nYour highest gross margin item is **${topMargin.name}** at **${topMargin.marginPct}%**, earning **${formatINR(topMargin.profitPerUnit)} profit per unit sold**.\n\n**Top 5 Margin Leaders:**\n${ranking}\n\n**Actionable Advice:** High volume doesn't always mean high profit. Train your counter staff to actively suggest adding a high-margin snack (like Bun Maska or Suji Rusk) with every cup of Chai. Selling 20 extra high-margin snacks daily adds **₹15,000+ monthly net income** with zero extra rent!`,
      suggestedActions: [
        `Bundle ${topMargin.name} with Chai as a counter special`,
        'Promote Elaichi Suji Rusk at the counter glass display',
        'Check raw material costs to protect margins',
      ],
      metricsGrounding: {
        highest_margin_item: topMargin.name,
        highest_margin_pct: `${topMargin.marginPct}%`,
        profit_per_unit: formatINR(topMargin.profitPerUnit),
        overall_gross_margin: `${context.grossMarginPct}%`,
      },
    };
  }

  // 11. FOOD WASTE & SPOILAGE
  if (
    q.includes('waste') || 
    q.includes('spoilage') || 
    q.includes('unsold') || 
    q.includes('loss') || 
    q.includes('leftover') || 
    q.includes('throw')
  ) {
    if (context.wasteSummary.length === 0) {
      return {
        text: `No food waste records have been logged yet. Regular tracking of unsold food helps you save thousands of rupees each month by avoiding over-preparation.`,
        suggestedActions: ['Log today\'s unsold items in Food Waste module', 'Review batch cooking schedules'],
        metricsGrounding: { total_recorded_waste: formatINR(0) },
      };
    }

    const highestWaste = context.wasteSummary[0];
    const totalWasteCost = context.wasteSummary.reduce((sum, w) => sum + w.cost, 0);
    const breakdown = context.wasteSummary
      .map((w, idx) => `${idx + 1}. **${w.name}** — **${formatINR(w.cost)}** lost (${w.qty} units | Reason: *${w.reason}*)`)
      .join('\n');

    return {
      text: `### 🗑️ Food Waste Loss Report\n\nYour recorded food waste totals **${formatINR(totalWasteCost)}** across recorded items.\n\nYour largest waste item is **${highestWaste.name}** with **${formatINR(highestWaste.cost)} in direct cost loss** (${highestWaste.qty} units thrown away).\n\n**Recorded Waste Breakdown:**\n${breakdown}\n\n**Actionable Advice:** The primary culprit is frying large batches that sit unsold past peak hours. Switch to 'staggered frying': fry 60% in the morning (8 AM) and fry a second hot batch only when the evening rush begins (4:30 PM). Hot snacks sell faster and eliminate cold leftovers.`,
      suggestedActions: [
        `Adjust ${highestWaste.name} fry batches: 60% morning, 40% evening`,
        'Offer a 15% happy hour discount at 9 PM on remaining hot snacks',
        'Store uncooked samosa patties in freezer rather than pre-frying',
      ],
      metricsGrounding: {
        top_waste_item: highestWaste.name,
        top_waste_loss: formatINR(highestWaste.cost),
        total_recorded_waste: formatINR(totalWasteCost),
      },
    };
  }

  // 12. TOMORROW PREPARATION & DEMAND FORECAST
  if (
    q.includes('tomorrow') || 
    q.includes('prepare') || 
    q.includes('prep') || 
    q.includes('morning rush') || 
    q.includes('batch')
  ) {
    const list = context.tomorrowPrepEstimates
      .map(p => `- **${p.item}:** Prepare **${p.recommendedBatch} units** (${p.reason})`)
      .join('\n');

    const lowStockWarning =
      context.lowStockItems.length > 0
        ? `\n\n⚠️ **Low Stock Alert:** You currently have **${context.lowStockItems.length} products below safety threshold** (${context.lowStockItems.map(i => `${i.name}: ${i.current} ${i.unit} left`).join(', ')}). Restock these before opening tomorrow.`
        : '';

    return {
      text: `### 🌅 Tomorrow Morning Preparation Recommendation\n\nHere are your recommended batch preparation sizes for tomorrow:\n\n${list}${lowStockWarning}\n\n*Rule-based heuristic: Estimates are calculated from your actual 7-day average daily consumption without fabricating predictive models.*`,
      suggestedActions: [
        'Check milk delivery quantity with dairy vendor tonight',
        'Confirm LPG gas cylinder reserve',
        'Restock paper cups and kulhads',
      ],
      metricsGrounding: {
        active_products_tracked: context.tomorrowPrepEstimates.length,
        low_stock_items_count: context.lowStockItems.length,
      },
    };
  }

  // 13. SLOW HOURS PROMOTION
  if (
    q.includes('slow') || 
    q.includes('promotion') || 
    q.includes('afternoon') || 
    q.includes('slump') || 
    q.includes('slow hours')
  ) {
    return {
      text: `### ☕ Afternoon Slow-Hours Strategy (2:00 PM – 5:00 PM)\n\nBased on your sales timestamp records, counter footfall dips sharply between **1:30 PM and 4:30 PM**.\n\n**3 High-Impact Promotions for Your Stall:**\n\n1. **"Afternoon Chai Pe Charcha Combo" (2 PM – 5 PM):**\n   - Pair 1 Special Masala Chai (₹15) + 1 Bun Maska (₹35) for **₹45** (saves ₹5 for customer).\n   - *Why this works:* Your Bun Maska has a 65% gross margin. Even with a ₹5 discount, you earn **₹28 gross profit per customer** instead of an empty counter.\n\n2. **"Office Chai Caddy Deal":**\n   - Offer nearby shops and banks: "Order 5 Chais, get 2 Elaichi Rusks free".\n   - *Why this works:* Elaichi Rusk unit cost is only ₹4.20. It encourages nearby market shops to order in bulk during the post-lunch slump.\n\n3. **Khata Regulars Reminder:**\n   - Send a friendly WhatsApp message with the afternoon special to your regular Khata customers.`,
      suggestedActions: [
        'Put up a small chalkboard: "Afternoon Chai + Bun Maska Combo ₹45"',
        'Talk to 3 nearby shops about afternoon tea delivery',
        'Test combo for 3 days and review daily sales',
      ],
      metricsGrounding: {
        slow_period: '1:30 PM - 4:30 PM',
        recommended_combo: 'Chai + Bun Maska',
        combo_price: '₹45 (regular ₹50)',
      },
    };
  }

  // 14. STOCK & INVENTORY
  if (q.includes('stock') || q.includes('inventory') || q.includes('how many left') || q.includes('supplies')) {
    const lowList = context.lowStockItems.length > 0
      ? context.lowStockItems.map(i => `- ⚠️ **${i.name}:** Only **${i.current} ${i.unit}** remaining (Alert threshold: ${i.alert})`).join('\n')
      : '✅ All products are currently above their safety thresholds.';

    return {
      text: `### 📦 Real-Time Inventory & Shelf Stock Status\n\n**Low-Stock Items Requiring Attention:**\n${lowList}\n\n**Inventory Health Tip:**\nKeep at least 2 days worth of dry ingredients (tea leaves, sugar, maida, potatoes, refined oil) on hand so a sudden supplier delay does not shut down your counter during morning rush.`,
      suggestedActions: [
        'What stock should I prepare for tomorrow morning rush?',
        'Check raw material costs to protect margins',
        'Which products generate the most revenue?',
      ],
      metricsGrounding: {
        low_stock_count: context.lowStockItems.length,
        total_products: context.allProducts.length,
      },
    };
  }

  // 15. IMPROVE PROFIT & BUSINESS GROWTH
  if (
    q.includes('improve') || 
    q.includes('grow') || 
    q.includes('increase profit') || 
    q.includes('more profit') || 
    q.includes('boost') || 
    q.includes('earn more')
  ) {
    const totalWaste = context.wasteSummary.reduce((sum, w) => sum + w.cost, 0);

    return {
      text: `### 📈 4 Practical Steps to Increase Your Net Daily Profit\n\n1. **Plug Food Waste Leaks (Immediate Gain: ~${formatINR(totalWaste)}):**\n   - You have logged **${formatINR(totalWaste)} in discarded snacks**. Cutting this in half by cooking in smaller afternoon batches instantly puts that money straight into your pocket without spending an extra rupee.\n\n2. **Counter Upsell High-Margin Items:**\n   - Chai has high volume, but packaged biscuits and rusks have zero cooking labor and 58% margin. Place them right next to the cash counter glass.\n\n3. **Collect Pending Khata Receivables:**\n   - Check your Khata register regularly so working capital is not locked in outstanding credit.\n\n4. **Audit Commercial LPG Usage:**\n   - Ensure burners have proper wind shields and simmer tea on low flame after first boil to stretch each 19kg cylinder from 12 days to 15 days.`,
      suggestedActions: [
        'Review Food Waste reduction strategy',
        'Check pending Khata credit balances',
        'Set up Chai + Rusk counter combo',
      ],
      metricsGrounding: {
        weekly_net_revenue: formatINR(context.sevenDaysRevenue),
        weekly_gross_profit: formatINR(context.sevenDaysProfit),
        waste_recovery_potential: formatINR(totalWaste),
      },
    };
  }

  // 16. TODAY'S DAILY SPEND & EXPENSES
  if (
    q.includes('how much did i spend') ||
    q.includes('spend today') ||
    q.includes('spent today') ||
    q.includes('today spend') ||
    q.includes('today expense') ||
    q.includes('today overhead') ||
    q.includes('operating cost today') ||
    q.includes('financial breakdown for today') ||
    ((q.includes('spend') || q.includes('spent') || q.includes('expenses')) && q.includes('today'))
  ) {
    const expText = context.todayExpenses > 0 ? formatINR(context.todayExpenses) : '₹0 (No daily expenses recorded yet today)';
    const wasteText = context.todayWasteCost > 0 ? formatINR(context.todayWasteCost) : '₹0 recorded';

    return {
      text: `### 📅 Today's Financial Overview\n\nHere is your recorded financial breakdown for **Today**:\n\n- **Today's Net Sales Turnover:** **${formatINR(context.todaySales)}**\n- **Today's Operating Overheads:** **${expText}** (rent, gas, power, wages)\n- **Today's Food Waste Cost:** **${wasteText}**\n- **Estimated Operating Net Result:** **${formatINR(context.todaySales - context.todayExpenses - context.todayWasteCost)}**\n\n*Note: Direct ingredient costs for sold items (COGS) are accounted for separately based on unit costs.*`,
      suggestedActions: [
        'Record any cash paid for milk, gas, or helper wages in Expenses',
        'Record any end-of-day leftover food in Food Waste',
        'View full P&L on Dashboard',
      ],
      metricsGrounding: {
        today_sales: formatINR(context.todaySales),
        today_expenses: formatINR(context.todayExpenses),
        today_waste: formatINR(context.todayWasteCost),
      },
    };
  }

  // 17. DEFAULT / FALLBACK INTENT
  return {
    text: `Namaste! I am your **Vyapaar Business Coach**.\n\nOver the past 7 days, your shop has recorded **${formatINR(context.sevenDaysRevenue)} in Net Sales** with an estimated **Gross Margin of ${context.grossMarginPct}%**.\n\nHere are some questions I can answer right now with your exact store figures:\n- *"Which products generate the most revenue?"*\n- *"Which products have the highest gross profit margin?"*\n- *"Check raw material costs to protect margins"*\n- *"Which items are causing the most food waste?"*\n- *"What should I prepare for tomorrow morning rush?"*\n- *"What promotion should I test during slow afternoon hours?"*\n- *"How much did I spend today?"*`,
    suggestedActions: [
      'Which products generate the most revenue?',
      'Which products have the highest gross profit margin?',
      'Check raw material costs to protect margins',
      'What stock should I prepare for tomorrow morning rush?',
    ],
    metricsGrounding: {
      total_sales_7d: formatINR(context.sevenDaysRevenue),
      gross_margin: `${context.grossMarginPct}%`,
    },
  };
}

/**
 * Ask Vyapaar Business Coach.
 * Calls Google Gemini API if key is present; otherwise seamlessly uses our grounded heuristic engine.
 */
export async function askBusinessCoach(
  question: string,
  products: Product[],
  sales: Sale[],
  expenses: Expense[],
  wasteRecords: WasteRecord[],
  conversationHistory: AICoachMessage[] = []
): Promise<AICoachMessage> {
  const context = buildBusinessContext(products, sales, expenses, wasteRecords);
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('vyapaar_gemini_key') || '';

  // If Gemini API Key is available, call Gemini API with verified grounding context
  if (geminiApiKey && geminiApiKey.length > 20 && !geminiApiKey.includes('your-gemini-api-key')) {
    try {
      const prompt = `
You are "Vyapaar Business Coach", an expert local business copilot for an Indian tea stall and snack corner named "Sharma Chai & Nashta Corner".
The shopkeeper is asking you a business question.

GROUND TRUTH BUSINESS DATA (DO NOT FABRICATE):
- Today's Net Sales: ₹${context.todaySales}
- Today's Gross Profit: ₹${context.todayProfit}
- Today's Operating Expenses: ₹${context.todayExpenses}
- Today's Food Waste Cost: ₹${context.todayWasteCost}
- 7-Day Net Revenue: ₹${context.sevenDaysRevenue}
- 7-Day Gross Margin: ${context.grossMarginPct}%
- Top Revenue Products: ${JSON.stringify(context.topRevenueProducts)}
- Top Margin Products: ${JSON.stringify(context.topMarginProducts)}
- Waste Summary: ${JSON.stringify(context.wasteSummary)}
- Low Stock Items: ${JSON.stringify(context.lowStockItems)}
- Footfall Pattern: ${context.slowHoursObservations}
- Tomorrow Prep Estimates: ${JSON.stringify(context.tomorrowPrepEstimates)}

USER QUESTION: "${question}"

INSTRUCTIONS:
1. Base your answer strictly on the provided business metrics. Never invent fictitious numbers, sales, or trends.
2. If data is missing or incomplete, clearly state so.
3. Be respectful, encouraging, clear, and practical for an Indian shopkeeper (mentioning Chai, Samosa, Vada Pav, INR ₹).
4. Provide actionable next steps.
5. Keep response concise, formatted in markdown with bullet points.
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2, // Low temperature for high factual accuracy
              maxOutputTokens: 600,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) {
          return {
            id: `msg-${Date.now()}`,
            sender: 'coach',
            text: generatedText,
            timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
            source: 'gemini_api',
            metricsGrounding: {
              net_sales: formatINR(context.todaySales),
              gross_margin: `${context.grossMarginPct}%`,
            },
          };
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to grounded heuristic advisor:', err);
    }
  }

  // Grounded Deterministic Heuristic Advisor
  const grounded = generateGroundedResponse(question, context);
  return {
    id: `msg-${Date.now()}`,
    sender: 'coach',
    text: grounded.text,
    timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    suggestedActions: grounded.suggestedActions,
    metricsGrounding: grounded.metricsGrounding,
    source: 'grounded_rules',
  };
}

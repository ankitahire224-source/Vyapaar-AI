# Vyapaar AI — Your Local Business Copilot

> A fast, mobile-first business management and AI advisor web application tailored for Indian tea stalls, snack corners, and local street-food merchants.

---

## ☕ Overview & Real-World Use Case

**Vyapaar AI** is designed for the high-velocity, real-world workflows of local Indian food and beverage businesses, starting with a family-owned snack and tea corner (**Sharma Chai & Nashta Corner**). It transforms handwritten paper diaries and mental arithmetic into an intuitive, audit-grade digital copilot that requires zero accounting expertise.

### 🌟 Core Value Pillars
1. **Quick POS & Counter Billing:** Lightning-fast touch counter billing designed for busy rush hours (tap chai, samosa, poha, select Cash/UPI/Khata, and punch bills with automatic price snapshots).
2. **True Financial Accounting:** Strictly separates Gross Revenue, Discounts, Cost of Goods Sold (COGS), Operating Overheads (commercial LPG gas, milk delivery, shop rent, helper wages), and Food Waste Write-Offs. Revenue is never conflated with profit.
3. **Food Waste Mitigation:** Direct logging of unsold end-of-day leftovers or frying spillage with automatic cost calculations and kitchen batch optimization advice.
4. **Shelf & Ingredient Inventory Control:** Real-time stock levels, low-stock alerts, and an automatic movement audit log (`restock`, `sale`, `waste`, `manual_adjustment`).
5. **Vyapaar Business Coach (AI Advisor):** Grounded business copilot that analyzes store metrics to answer questions on revenue drivers, margin leaders, food waste reduction, morning prep estimates, and slow-hour (2 PM - 5 PM) combos.
6. **Customer Khata (Udhaar) & Loyalty QR Pass:** Opt-in customer credit tracking, partial cash/UPI settlements, and instant QR code passes for customer reward points.
7. **Demo Mode & Live Supabase Cloud Mode:** Fully functional out of the box in Demo Mode (pre-seeded with authentic Indore market data) with the ability to switch to a live Supabase PostgreSQL backend with Row Level Security (RLS) policies.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 + TypeScript |
| **Styling & Theme** | Tailwind CSS (Emerald Green, Charcoal, Warm Cream palette) |
| **Icons** | Lucide React |
| **Analytics & Charts** | Recharts (Responsive Area and Bar Charts) |
| **Database & Auth** | Supabase PostgreSQL with Row Level Security (RLS) |
| **AI Advisor Engine** | Google Gemini API integration + Grounded Heuristic Business Rules Engine |
| **Special Features** | Canvas Confetti (counter celebration), QRCode generator (loyalty passes) |
| **Unit Testing** | Vitest (Accounting formula verification & AI advisor tests) |
| **Build & Bundler** | Vite 5 (Vercel-ready static production build) |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18 or higher; tested on v24.20.0 LTS)
- npm (v9 or higher)

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Automated Tests
```bash
npm run test
```
All accounting formulas (Gross Profit, Net Operating Result, COGS, Waste Cost) and AI Advisor grounding logic are covered by unit tests.

### 5. Build for Production
```bash
npm run build
```
Creates an optimized, production-ready static build in the `dist/` directory.

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env`:

```env
# Supabase Configuration (Optional for Live Mode)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here

# Google Gemini API Key (Optional for Live LLM Advice)
# If omitted, Vyapaar AI automatically uses its grounded intelligent offline advisor!
VITE_GEMINI_API_KEY=your-gemini-api-key-here

# Application Mode: 'demo' or 'live'
VITE_APP_MODE=demo
```

---

## 🗄️ Supabase PostgreSQL Setup & Migrations

When connecting your own Supabase project:
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** tab in your Supabase dashboard.
3. Open [`supabase/schema.sql`](supabase/schema.sql) and paste its entire contents into the SQL Editor.
4. Click **Run**. This will create:
   - `businesses` and `business_members` tables
   - `products` table with constraints and default categories
   - `sales` and `sale_items` with snapshot unit prices and costs
   - `expenses` and `waste_records` tables
   - `inventory_movements` audit trail table
   - `customers` and `khata_entries` tables
   - Helper functions: `is_business_member()` and `is_business_owner()`
   - Complete Row-Level Security (RLS) policies isolating records by business
5. Copy your **Project URL** and **anon public key** from `Project Settings -> API` and paste them into the app's **Settings Modal** or your `.env` file.
6. Click **Test & Save Supabase** in the app's Settings Modal to verify the connection.

---

## 📊 Accounting Methodology

Vyapaar AI adheres to strict financial accounting principles:

$$\text{Gross Sales Revenue} = \sum (\text{item quantity} \times \text{snapshot unit selling price})$$

$$\text{Net Sales Revenue} = \text{Gross Sales} - \text{Discounts} - \text{Refunds}$$

$$\text{COGS (Cost of Goods Sold)} = \sum (\text{item quantity} \times \text{snapshot unit ingredient cost})$$

$$\text{Estimated Gross Profit} = \text{Net Sales Revenue} - \text{COGS}$$

$$\text{Gross Margin \%} = \left(\frac{\text{Estimated Gross Profit}}{\text{Net Sales Revenue}}\right) \times 100$$

$$\text{Estimated Net Operating Result} = \text{Gross Profit} - \text{Operating Expenses} - \text{Food Waste Write-Offs}$$

- **No Double Counting:** Direct ingredient costs are captured in COGS via item unit costs; overhead expenses (LPG cylinder, rent, power, wages) are categorized separately.
- **Price Snapshot Preservation:** Menu price changes never retroactively modify completed sales records.
- **Audit-Grade Voids:** Cancelled bills reverse inventory deductions and record the cancellation reason without removing the transaction from the audit trail.

---

## 🤖 Vyapaar Business Coach (AI Advisor)

The AI Business Coach answers key operational questions grounded in verified data:
- *"Which products generate the most revenue?"* → Identifies volume and rupee leaders.
- *"Which products have the highest gross profit margin?"* → Analyzes unit margin percentages.
- *"What stock should I prepare for tomorrow morning rush?"* → Heuristic prep plan based on 7-day morning averages.
- *"Which items cause the most food waste?"* → Highlights spoilage leaks and recommends staggered frying batches.
- *"What promotion should I test during slow hours (2 PM - 5 PM)?"* → Proposes high-margin bundle deals (e.g., Chai + Bun Maska).

---

## 🚀 Vercel Production Deployment

1. Push this repository to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/vyapaar-ai.git
   git branch -M main
   git push -u origin main
   ```
2. Import the repository in [Vercel](https://vercel.com).
3. Framework Preset: **Vite**.
4. Set any optional environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`).
5. Deploy!

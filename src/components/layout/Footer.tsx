import React, { useState } from 'react';
import { 
  Mail, 
  HelpCircle, 
  TrendingUp, 
  Heart, 
  ExternalLink, 
  Copy, 
  Check, 
  BookOpen, 
  ShieldCheck, 
  MessageSquare, 
  Receipt, 
  ShoppingBag, 
  Boxes, 
  Sparkles,
  X,
  ChevronRight
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface FooterProps {
  onSelectTab: (tab: NavTab) => void;
  onOpenSettings: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectTab,
  onOpenSettings,
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const supportEmail = 'vyapaarai2026@gmail.com';

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const helpTopics = [
    {
      title: 'How to use Quick POS Counter',
      icon: ShoppingBag,
      content: 'Press F2 anywhere in the app to open the counter POS. Tap items (Chai, Samosa, Poha) to add to the bill, pick Cash, UPI, or Khata payment, and click "Complete Sale" for instant thermal receipt generation.',
    },
    {
      title: 'How Khata (Udhaar) Register works',
      icon: Receipt,
      content: 'When a trusted customer takes items on credit, select "Khata" at POS. Their balance updates automatically. When they repay in cash or UPI, go to "Customers & Udhaar" and click "Collect Cash" to record the settlement.',
    },
    {
      title: 'Food Waste vs Operating Profit',
      icon: Boxes,
      content: 'Food waste is tracked at ingredient cost (COGS). Discarded samosas or spoiled milk write-offs are deducted directly from your Gross Profit to show your real Net Operating Result without double-counting.',
    },
    {
      title: 'Using the AI Business Coach',
      icon: Sparkles,
      content: 'The Vyapaar Coach analyzes your exact store data to identify top-earning items, high-margin snacks (like Bun Maska & Rusks), batch frying schedules, and 2 PM - 5 PM afternoon combos.',
    },
    {
      title: 'Connecting Live Supabase Cloud',
      icon: ShieldCheck,
      content: 'Click the Settings gear icon in the top navbar, go to the "Supabase Backend" tab, enter your Supabase URL & Anon Key, and run the SQL migration in supabase/schema.sql.',
    },
  ];

  return (
    <>
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-12 mb-16 lg:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand & Vision */}
            <div className="md:col-span-1 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-900/30">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <span className="font-bold text-white tracking-tight text-base">
                  Vyapaar<span className="text-emerald-500">AI</span>
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Your Local Business Copilot designed for Indian tea stalls, snack corners, and street food merchants. Fast counter sales, true profit accounting, and AI guidance.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                <span>Crafted with</span>
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>for Indian Shopkeepers</span>
              </div>
            </div>

            {/* Col 2: Quick Navigation */}
            <div>
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">
                Quick Navigation
              </h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => onSelectTab('dashboard')}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Dashboard & P&L
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectTab('pos')}
                    className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                  >
                    <span>Quick POS Counter</span>
                    <span className="px-1.5 py-0.2 bg-emerald-900/80 text-emerald-400 rounded text-[9px] font-mono">F2</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectTab('products')}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Menu & Inventory
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectTab('coach')}
                    className="hover:text-emerald-400 transition-colors text-amber-400 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>AI Business Coach</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectTab('loyalty')}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Khata (Udhaar) & Loyalty
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Support & Help Menu */}
            <div>
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">
                Merchant Help & Guides
              </h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setIsHelpOpen(true)}
                    className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-semibold text-slate-300"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Support & Help Menu</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsHelpOpen(true)}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    POS Billing Quick Guide
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsHelpOpen(true)}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Khata Credit & Settlement Rules
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onOpenSettings()}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Supabase Database Setup
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Contact & Support Email */}
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-1">
                Merchant Support Contact
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Need assistance setting up your stall catalog, billing, or cloud database? Reach out to our team:
              </p>

              {/* Email Box */}
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2 text-slate-300 font-mono text-xs">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <a
                    href={`mailto:${supportEmail}`}
                    className="hover:text-emerald-400 transition-colors truncate font-semibold"
                    title="Send email to Vyapaar AI Support"
                  >
                    {supportEmail}
                  </a>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-700/50">
                  <a
                    href={`mailto:${supportEmail}?subject=Vyapaar%20AI%20Merchant%20Support%20Request`}
                    className="flex-1 text-center py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-colors shadow-xs"
                  >
                    Email Support
                  </a>
                  <button
                    onClick={copyEmailToClipboard}
                    className="py-1.5 px-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[10px] font-semibold transition-colors flex items-center gap-1"
                    title="Copy email to clipboard"
                  >
                    {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <span className="text-[10px] text-slate-500 block">
                Average reply time: within 24 hours
              </span>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div>
              © 2026 Vyapaar AI. All rights reserved. Built for Indian local businesses.
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsHelpOpen(true)} className="hover:text-slate-300 transition-colors">
                FAQ & Help
              </button>
              <span>•</span>
              <a href={`mailto:${supportEmail}`} className="hover:text-slate-300 transition-colors">
                {supportEmail}
              </a>
              <span>•</span>
              <button onClick={onOpenSettings} className="hover:text-slate-300 transition-colors">
                Settings
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Support & Help Menu Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Support & Help Menu</h3>
                  <p className="text-xs text-slate-500">Guides and direct merchant support</p>
                </div>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Direct Support Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Official Merchant Support
                </span>
                <div className="font-mono text-sm font-bold text-emerald-950">
                  {supportEmail}
                </div>
                <p className="text-[11px] text-emerald-700">
                  Contact us directly for setup help, custom features, or database troubleshooting.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`mailto:${supportEmail}`}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  Compose Email
                </a>
                <button
                  onClick={copyEmailToClipboard}
                  className="p-2 bg-white text-emerald-900 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
                  title="Copy email address"
                >
                  {copiedEmail ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Help Topics Accordion / Cards */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Frequently Asked Questions & How-To Guides
              </h4>

              {helpTopics.map((topic, idx) => {
                const Icon = topic.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <Icon className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{topic.title}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px] pl-6">
                      {topic.content}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Close Help Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

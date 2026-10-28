import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Receipt, 
  TrendingDown, 
  Boxes, 
  Bot, 
  Users,
  Sparkles
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'sales'
  | 'expenses'
  | 'inventory'
  | 'coach'
  | 'loyalty';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lowStockCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  lowStockCount = 0,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Quick POS (Counter)', icon: ShoppingBag, highlight: true },
    { id: 'products', label: 'Products & Menu', icon: Package },
    { id: 'sales', label: 'Daily Khata & Sales', icon: Receipt },
    { id: 'expenses', label: 'Expenses & Waste', icon: TrendingDown },
    { 
      id: 'inventory', 
      label: 'Inventory Control', 
      icon: Boxes, 
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
      badgeColor: 'bg-rose-500 text-white' 
    },
    { 
      id: 'coach', 
      label: 'AI Business Coach', 
      icon: Bot, 
      special: true 
    },
    { id: 'loyalty', label: 'Customers & Udhaar', icon: Users },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 p-4 shrink-0 min-h-[calc(100vh-4rem)]">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id as NavTab)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 font-semibold'
                    : item.special
                    ? 'text-amber-300 hover:bg-slate-800/80 bg-slate-800/40 border border-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : item.special ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.special && !isActive && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3" /> AI
                  </span>
                )}
                {item.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${item.badgeColor || 'bg-slate-700'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Pro Tip Card in Sidebar */}
        <div className="mt-auto pt-6">
          <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/50">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chai Stall Tip</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pairing Bun Maska with Chai delivers 65% margin. Suggest combos to increase daily profit!
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1 shadow-lg">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {[
            { id: 'pos', label: 'POS', icon: ShoppingBag },
            { id: 'dashboard', label: 'Analytics', icon: LayoutDashboard },
            { id: 'coach', label: 'AI Coach', icon: Bot, special: true },
            { id: 'sales', label: 'Sales', icon: Receipt },
            { id: 'expenses', label: 'Expenses', icon: TrendingDown },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id as NavTab)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-emerald-700 font-bold'
                    : item.special
                    ? 'text-amber-600 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className={`relative p-1 rounded-full ${isActive ? 'bg-emerald-50' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : item.special ? 'text-amber-500' : 'text-slate-500'}`} />
                  {item.special && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                  )}
                </div>
                <span className="truncate max-w-[64px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

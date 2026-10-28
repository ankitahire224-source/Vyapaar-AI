import React from 'react';
import { 
  Store, 
  Settings, 
  PlusCircle, 
  Sparkles, 
  Database, 
  HelpCircle,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { Business } from '../../types';

interface NavbarProps {
  business: Business;
  appMode: 'demo' | 'live';
  onOpenSettings: () => void;
  onOpenQuickSale: () => void;
  onResetDemo: () => void;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  business,
  appMode,
  onOpenSettings,
  onOpenQuickSale,
  onResetDemo,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Shop Name */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-lg">
                  Vyapaar<span className="text-emerald-600">AI</span>
                </span>
                {appMode === 'demo' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    Demo Mode
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <Database className="w-3 h-3 mr-1" /> Live Supabase
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Store className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate max-w-[200px] sm:max-w-xs">{business.name}</span>
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {appMode === 'demo' && (
              <button
                onClick={onResetDemo}
                title="Reset sample store data to initial state"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset Sample Data
              </button>
            )}

            <button
              onClick={onOpenQuickSale}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-sm shadow-emerald-700/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Bill (F2)</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              title="Shop & Supabase Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

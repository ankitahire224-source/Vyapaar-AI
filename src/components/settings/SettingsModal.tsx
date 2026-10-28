import React, { useState } from 'react';
import { 
  Settings, 
  Store, 
  Database, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles,
  ShieldAlert,
  X
} from 'lucide-react';
import { Business } from '../../types';
import { testSupabaseConnection } from '../../services/supabaseClient';

interface SettingsModalProps {
  business: Business;
  appMode: 'demo' | 'live';
  isOpen: boolean;
  onClose: () => void;
  onUpdateBusiness: (updated: Partial<Business>) => Promise<Business>;
  onSwitchMode: (mode: 'demo' | 'live') => void;
  onResetDemoData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  business,
  appMode,
  isOpen,
  onClose,
  onUpdateBusiness,
  onSwitchMode,
  onResetDemoData,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'shop' | 'database' | 'ai'>('shop');

  // Business Form
  const [bizName, setBizName] = useState(business.name);
  const [bizType, setBizType] = useState(business.business_type);
  const [bizAddress, setBizAddress] = useState(business.address || '');
  const [bizPhone, setBizPhone] = useState(business.phone || '');
  const [bizGstin, setBizGstin] = useState(business.gstin || '');

  // Supabase Config
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('vyapaar_supabase_url') || import.meta.env.VITE_SUPABASE_URL || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem('vyapaar_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  );
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Gemini API Key
  const [geminiKey, setGeminiKey] = useState(
    localStorage.getItem('vyapaar_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || ''
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Save shop info
  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onUpdateBusiness({
        name: bizName.trim(),
        business_type: bizType.trim(),
        address: bizAddress.trim(),
        phone: bizPhone.trim(),
        gstin: bizGstin.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      alert(`Error saving business details: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Test Supabase
  const handleTestSupabase = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);
    const res = await testSupabaseConnection(supabaseUrl.trim(), supabaseKey.trim());
    setConnectionStatus(res);
    setIsTestingConnection(false);

    if (res.success) {
      localStorage.setItem('vyapaar_supabase_url', supabaseUrl.trim());
      localStorage.setItem('vyapaar_supabase_anon_key', supabaseKey.trim());
    }
  };

  // Save AI Key
  const handleSaveAIKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('vyapaar_gemini_key', geminiKey.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Application Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('shop')}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'shop'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Shop Profile
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'database'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Supabase Backend & Mode
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'ai'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            AI Coach Config
          </button>
        </div>

        {/* TAB 1: SHOP PROFILE */}
        {activeTab === 'shop' && (
          <form onSubmit={handleSaveShop} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Business Type</label>
                <input
                  type="text"
                  value={bizType}
                  onChange={(e) => setBizType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={bizPhone}
                  onChange={(e) => setBizPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Shop Address / Location</label>
              <input
                type="text"
                value={bizAddress}
                onChange={(e) => setBizAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">GSTIN Number (Optional)</label>
              <input
                type="text"
                placeholder="23AABCS1429B1Z8"
                value={bizGstin}
                onChange={(e) => setBizGstin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              {saveSuccess && (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Saved successfully!
                </span>
              )}
              <div className="ml-auto">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: SUPABASE & APPLICATION MODE */}
        {activeTab === 'database' && (
          <div className="space-y-4 text-xs">
            {/* Mode Toggle Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <span className="font-bold text-slate-900 block text-sm">Application Operating Mode</span>
              <p className="text-slate-500 leading-relaxed">
                Choose between instant offline <strong>Demo Mode</strong> (pre-seeded with Sharma Chai & Nashta Corner records) and <strong>Live Supabase Mode</strong> (cloud database).
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onSwitchMode('demo')}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold border transition-all ${
                    appMode === 'demo'
                      ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Demo Mode (Active)
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchMode('live')}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold border transition-all ${
                    appMode === 'live'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Live Supabase Mode
                </button>
              </div>
            </div>

            {/* Supabase Credentials */}
            <div className="space-y-2.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Supabase Project URL</label>
                <input
                  type="url"
                  placeholder="https://xyzproject.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Supabase Anon Public Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              {connectionStatus && (
                <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                  connectionStatus.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {connectionStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{connectionStatus.message}</span>
                </div>
              )}

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  disabled={isTestingConnection || !supabaseUrl || !supabaseKey}
                  onClick={handleTestSupabase}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl font-bold transition-colors"
                >
                  {isTestingConnection ? 'Testing Connection...' : 'Test & Save Supabase'}
                </button>
              </div>
            </div>

            {/* Reset Demo Data Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Reset Demo Store Data</span>
                <span className="text-[11px] text-slate-400">Restores all sample sales, products & waste records</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onResetDemoData();
                  alert('Sample store data restored to initial demo state!');
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
              >
                Reset Data
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: AI COACH CONFIG */}
        {activeTab === 'ai' && (
          <form onSubmit={handleSaveAIKey} className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Google Gemini API Integration (Optional)</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                Vyapaar AI features a built-in grounded business intelligence advisor that works 100% offline without any API key. If you wish to connect your live Google Gemini API key for natural conversational LLM responses, enter it below.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Google Gemini API Key</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Saved securely in your browser's localStorage. Never sent to third parties.
              </span>
            </div>

            <div className="pt-2 flex justify-between items-center">
              {saveSuccess && (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Key Saved!
                </span>
              )}
              <div className="ml-auto">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors"
                >
                  Save AI Configuration
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

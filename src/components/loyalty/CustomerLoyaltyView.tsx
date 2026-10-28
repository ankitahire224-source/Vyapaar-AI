import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  QrCode, 
  Gift, 
  IndianRupee, 
  CheckCircle2, 
  ArrowDownLeft, 
  ArrowUpRight,
  Sparkles,
  Phone,
  Copy,
  Check,
  X
} from 'lucide-react';
import QRCode from 'qrcode';
import { Customer, KhataEntry } from '../../types';
import { formatINR, formatDateTime } from '../../utils/formatters';

interface CustomerLoyaltyViewProps {
  customers: Customer[];
  khataEntries: KhataEntry[];
  onCreateCustomer: (data: { name: string; phone: string; initialKhataBalance?: number }) => Promise<Customer>;
  onRecordKhataPayment: (customerId: string, amount: number, notes?: string) => Promise<Customer>;
}

export const CustomerLoyaltyView: React.FC<CustomerLoyaltyViewProps> = ({
  customers,
  khataEntries,
  onCreateCustomer,
  onRecordKhataPayment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add customer modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custBalance, setCustBalance] = useState<number>(0);

  // Settlement payment modal
  const [settlingCustomer, setSettlingCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(100);
  const [paymentNotes, setPaymentNotes] = useState('');

  // QR Code pass modal
  const [qrCustomer, setQrCustomer] = useState<Customer | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    );
  }, [customers, searchQuery]);

  // Aggregate stats
  const totalOutstandingCredit = useMemo(() => {
    return customers.reduce((sum, c) => sum + Number(c.khata_balance || 0), 0);
  }, [customers]);

  const totalLoyaltyPoints = useMemo(() => {
    return customers.reduce((sum, c) => sum + Number(c.loyalty_points || 0), 0);
  }, [customers]);

  // Render QR code when modal opens
  useEffect(() => {
    if (qrCustomer && qrCanvasRef.current) {
      const customerPassUrl = `${window.location.origin}/rewards?cid=${qrCustomer.id}&name=${encodeURIComponent(qrCustomer.name)}`;
      QRCode.toCanvas(qrCanvasRef.current, customerPassUrl, {
        width: 220,
        margin: 2,
        color: {
          dark: '#064E3B',
          light: '#FFFFFF',
        },
      });
    }
  }, [qrCustomer]);

  // Handle Add Customer
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) {
      setFormError('Name and phone are required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateCustomer({
        name: custName.trim(),
        phone: custPhone.trim(),
        initialKhataBalance: Number(custBalance) || 0,
      });

      setIsAddModalOpen(false);
      setCustName('');
      setCustPhone('');
      setCustBalance(0);
      setFormError('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to add customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Record Payment
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingCustomer || paymentAmount <= 0) return;

    try {
      setIsSubmitting(true);
      await onRecordKhataPayment(settlingCustomer.id, Number(paymentAmount), paymentNotes.trim() || undefined);
      setSettlingCustomer(null);
      setPaymentAmount(100);
      setPaymentNotes('');
    } catch (err: any) {
      alert(`Error recording payment: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyRewardsLink = () => {
    if (!qrCustomer) return;
    const url = `${window.location.origin}/rewards?cid=${qrCustomer.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Customer Khata & Loyalty Rewards
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your daily Udhaar credit register, settlement collections, and customer loyalty QR passes.
          </p>
        </div>

        <button
          onClick={() => { setFormError(''); setIsAddModalOpen(true); }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Regular Customer</span>
        </button>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Outstanding Khata Credit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Udhaar Receivable (Market Khata)
          </span>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {formatINR(totalOutstandingCredit)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total pending credit owed to your stall
          </p>
        </div>

        {/* Loyalty Points Issued */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Active Loyalty Points
          </span>
          <div className="text-2xl font-black text-amber-600 mt-2 flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>{totalLoyaltyPoints} Pts</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            1 point earned per ₹50 spent at your counter
          </p>
        </div>

        {/* Total Regulars */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Registered Regular Customers
          </span>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {customers.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Local office staff, cloth merchants & neighbors
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by customer name or mobile..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4 text-right">Khata Balance (Udhaar)</th>
                <th className="py-3.5 px-4 text-center">Loyalty Rewards</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((cust) => {
                const hasDue = cust.khata_balance > 0;
                // Reward tiers: 50 pts = 1 free Masala Chai, 100 pts = 1 free Samosa Combo
                const eligibleForChai = cust.loyalty_points >= 50;

                return (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{cust.name}</div>
                      <div className="text-[10px] text-slate-400">Regular Khata Member</div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {cust.phone}
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-sm">
                      <span className={hasDue ? 'text-rose-600' : 'text-emerald-700'}>
                        {formatINR(cust.khata_balance)}
                      </span>
                      {hasDue ? (
                        <div className="text-[10px] text-rose-500 font-semibold">Payment Due</div>
                      ) : (
                        <div className="text-[10px] text-emerald-600 font-semibold">Settled / Clear</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>{cust.loyalty_points} Points</span>
                      </div>
                      {eligibleForChai && (
                        <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                          🎁 Free Chai Reward Available!
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      {hasDue && (
                        <button
                          onClick={() => {
                            setSettlingCustomer(cust);
                            setPaymentAmount(cust.khata_balance);
                          }}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
                        >
                          Collect Cash
                        </button>
                      )}

                      <button
                        onClick={() => setQrCustomer(cust)}
                        title="Show customer loyalty QR code"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors inline-block align-middle"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No customers found matching search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Regular Khata Customer</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Gupta (Sarafa Cloth Store)"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98260 12345"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Initial Pending Udhaar Balance (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={custBalance}
                  onChange={(e) => setCustBalance(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Leave 0 if customer currently owes nothing
                </span>
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                >
                  {isSubmitting ? 'Saving...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Settlement Cash Modal */}
      {settlingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Collect Khata Settlement</h3>
              <button
                onClick={() => setSettlingCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Customer: <strong>{settlingCustomer.name}</strong>
              <br />
              Total Pending Due: <strong className="text-rose-600">{formatINR(settlingCustomer.khata_balance)}</strong>
            </p>

            <form onSubmit={handleConfirmPayment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Settlement Amount Paid (₹) *</label>
                <input
                  type="number"
                  min="1"
                  max={settlingCustomer.khata_balance}
                  step="1"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-base focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Paid in cash at counter"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setSettlingCustomer(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                >
                  {isSubmitting ? 'Recording...' : `Record ${formatINR(paymentAmount)} Received`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Pass Modal */}
      {qrCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Vyapaar Rewards Pass
              </span>
              <h3 className="text-base font-bold text-slate-900">{qrCustomer.name}</h3>
              <p className="text-xs text-slate-500">{qrCustomer.phone}</p>
            </div>

            {/* Generated QR Code Canvas */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <canvas ref={qrCanvasRef} className="mx-auto rounded-lg" />
            </div>

            <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-200 text-xs">
              <span className="font-bold text-amber-900 block">
                {qrCustomer.loyalty_points} Loyalty Points
              </span>
              <span className="text-[11px] text-amber-700">
                Customer scans with phone camera to track rewards
              </span>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={copyRewardsLink}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Loyalty Link'}</span>
              </button>

              <button
                onClick={() => setQrCustomer(null)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

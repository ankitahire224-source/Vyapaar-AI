/**
 * Formats a numeric amount in Indian Rupees (₹) with Indian digit grouping (e.g., ₹1,23,456.00).
 */
export function formatINR(amount: number, showDecimals = false): string {
  const num = Number(amount) || 0;
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const options: Intl.NumberFormatOptions = {
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  };

  const formatted = new Intl.NumberFormat('en-IN', options).format(absNum);
  return `${isNegative ? '-' : ''}₹${formatted}`;
}

/**
 * Formats standard date into human readable Indian format (e.g. 28 Oct 2026, 09:30 AM).
 */
export function formatDateTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats date into readable string (e.g. 28 Oct 2026 or "Today", "Yesterday").
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Returns human-friendly category label and badge colors.
 */
export function getCategoryBadge(category: string): { label: string; color: string } {
  switch (category) {
    case 'tea':
      return { label: 'Chai & Tea', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    case 'coffee':
      return { label: 'Coffee', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    case 'hot_snacks':
      return { label: 'Hot Snacks', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    case 'packaged_snacks':
      return { label: 'Packaged Snacks', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    case 'cold_drinks':
      return { label: 'Cold Drinks', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
    case 'meals':
      return { label: 'Meals & Thali', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    default:
      return { label: 'Other', color: 'bg-slate-100 text-slate-800 border-slate-200' };
  }
}

/**
 * Returns payment method display text and icon indicator.
 */
export function getPaymentMethodBadge(method: string): { label: string; color: string } {
  switch (method) {
    case 'upi':
      return { label: 'UPI / QR', color: 'bg-violet-100 text-violet-800 border-violet-200' };
    case 'cash':
      return { label: 'Cash (Rokad)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    case 'khata':
      return { label: 'Khata (Udhaar)', color: 'bg-rose-100 text-rose-800 border-rose-200' };
    case 'card':
      return { label: 'Card / POS', color: 'bg-sky-100 text-sky-800 border-sky-200' };
    default:
      return { label: method.toUpperCase(), color: 'bg-slate-100 text-slate-800 border-slate-200' };
  }
}

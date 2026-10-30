export function calculateMonthlyPnL(entries = {}, year, monthIndex, selectedAccount = 'Main Account') {
  let total = 0;
  if (!entries || typeof entries !== 'object') return 0;

  Object.keys(entries).forEach((dateKey) => {
    const parts = dateKey.split('-').map(Number);
    if (parts.length === 3) {
      const [y, m, d] = parts;
      if (y === year && m === monthIndex + 1) {
        const dateObj = new Date(y, m - 1, d);
        const dayOfWeek = dateObj.getDay();
        
        // Permanently skip Saturdays (6) and Sundays (0)
        if (dayOfWeek === 0 || dayOfWeek === 6) return;

        const entry = entries[dateKey];
        if (entry) {
          const amt = typeof entry === 'object' ? parseFloat(entry.amount || 0) : parseFloat(entry || 0);
          const acc = typeof entry === 'object' ? (entry.account || 'Main Account') : 'Main Account';
          if (selectedAccount === 'All' || acc === selectedAccount) {
            if (!isNaN(amt)) total += amt;
          }
        }
      }
    }
  });

  return total;
}

export default { calculateMonthlyPnL };

export const COLORS = [
  '#f97316', '#1e3a8a', '#eab308', '#ef4444', '#10b981',
  '#8b5cf6', '#06b6d4', '#84cc16', '#6366f1', '#14b8a6',
  '#d946ef', '#f43f5e', '#f59e0b', '#2dd4bf', '#818cf8',
];

export const short = (str = '', max = 16) =>
  str.length > max ? str.substring(0, max) + '…' : str;

export const fmtDate = (dateStr) => {
  const d = new Date(dateStr);
  return { day: d.getDate(), mon: d.toLocaleDateString('en-GB', { month: 'short' }), full: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), month: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) };
};

export const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
};

export const AXIS_STYLE = {
  get ticks() {
    const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      font: { size: 12, family: 'Inter', weight: 'bold' },
      color: isDark ? '#f1f5f9' : '#0f172a'
    };
  },
  get grid() {
    const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      color: isDark ? '#334155' : '#e2e8f0',
      lineWidth: 2
    };
  },
  get border() {
    const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      display: true,
      width: 3,
      color: isDark ? '#f97316' : '#0f172a'
    };
  }
};

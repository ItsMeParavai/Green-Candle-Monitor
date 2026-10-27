export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const getDaysInMonth = (year, monthIndex) => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year, monthIndex) => {
  let day = new Date(year, monthIndex, 1).getDay();
  return day === 0 ? 6 : day - 1;
};

export const formatDateKey = (year, monthIndex, day) => {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

export default {
  MONTH_NAMES,
  getDaysInMonth,
  getFirstDayOfMonth,
  formatDateKey,
};

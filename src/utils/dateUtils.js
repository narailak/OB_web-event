const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

const THAI_DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

/**
 * Parse YYYY-MM-DD into a local Date at midnight without timezone shift.
 */
export function parseLocalDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Format YYYY-MM-DD into Thai short date (e.g. "พ. 25 พ.ย. 2026").
 */
export function formatThaiDate(dateStr) {
  const date = parseLocalDate(dateStr);
  if (!date) return dateStr || '-';
  const dayName = THAI_DAYS_SHORT[date.getDay()];
  const day = date.getDate();
  const month = THAI_MONTHS_SHORT[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName} ${day} ${month} ${year}`;
}

/**
 * Format start and end time strings (e.g. "09:00 - 12:00 น.").
 */
export function formatTimeRange(startTime, endTime) {
  if (!startTime && !endTime) return '-';
  if (startTime && endTime) return `${startTime} - ${endTime} น.`;
  return `${startTime || endTime} น.`;
}

/**
 * Return integer days from today (0 = today, 1 = tomorrow, <0 = past).
 */
export function getDaysUntil(dateStr) {
  const target = parseLocalDate(dateStr);
  if (!target) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function isUpcomingOrToday(dateStr) {
  const days = getDaysUntil(dateStr);
  return days !== null && days >= 0;
}

export function getRelativeDayLabel(dateStr) {
  const days = getDaysUntil(dateStr);
  if (days === null) return null;
  if (days === 0) return 'วันนี้';
  if (days === 1) return 'พรุ่งนี้';
  if (days > 1 && days <= 7) return `อีก ${days} วัน`;
  return null;
}

/**
 * Sort events chronologically by date then startTime.
 */
export function sortEventsByDate(events = []) {
  return [...events].sort((a, b) => {
    const keyA = `${a.date || '9999-99-99'} ${a.startTime || '99:99'}`;
    const keyB = `${b.date || '9999-99-99'} ${b.startTime || '99:99'}`;
    return keyA.localeCompare(keyB);
  });
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Formats a date string into Indonesian format: dd/mmmm/yyyy (e.g., 10/Juli/2026)
 */
export function formatDateIndonesian(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '-';
  
  const str = String(dateStr).trim();
  if (!str) return '-';

  // If already formatted like "10/Juli/2026" or "10 Juli 2026", standardise to "10/Juli/2026"
  const existingFormattedMatch = str.match(/^(\d{1,2})[\s\/]+([A-Za-z]+)[\s\/]+(\d{4})$/);
  if (existingFormattedMatch) {
    const day = existingFormattedMatch[1].padStart(2, '0');
    const month = existingFormattedMatch[2];
    const year = existingFormattedMatch[3];
    // Capitalize first letter of month
    const monthFormatted = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
    return `${day}/${monthFormatted}/${year}`;
  }

  // Handle YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const monthIdx = parseInt(ymdMatch[2], 10) - 1;
    const day = ymdMatch[3].padStart(2, '0');
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day}/${MONTH_NAMES_ID[monthIdx]}/${year}`;
    }
  }

  // Handle DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const monthIdx = parseInt(dmyMatch[2], 10) - 1;
    const year = dmyMatch[3];
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day}/${MONTH_NAMES_ID[monthIdx]}/${year}`;
    }
  }

  // Fallback Date object parsing
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const monthName = MONTH_NAMES_ID[d.getMonth()];
    const year = d.getFullYear();
    return `${day}/${monthName}/${year}`;
  }

  return str;
}

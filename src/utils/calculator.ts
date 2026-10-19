import { EducationRow, PersonalInfo } from '../types/biodata';

/**
 * Calculates percentage: (Marks Obtained / Total Marks) * 100
 * Formatted up to 2 decimal places with trailing zeros stripped (e.g. 85%, 72.5%, 33.29%).
 */
export function calculatePercentage(
  marksObtained: string | number,
  totalMarks: string | number
): string {
  const obtainedStr = typeof marksObtained === 'string' ? marksObtained.trim() : String(marksObtained);
  const totalStr = typeof totalMarks === 'string' ? totalMarks.trim() : String(totalMarks);

  if (!obtainedStr || !totalStr) {
    return '';
  }

  const obtainedNum = parseFloat(obtainedStr);
  const totalNum = parseFloat(totalStr);

  if (
    isNaN(obtainedNum) ||
    isNaN(totalNum) ||
    totalNum <= 0 ||
    obtainedNum < 0
  ) {
    return '';
  }

  const pct = (obtainedNum / totalNum) * 100;

  if (!isFinite(pct) || isNaN(pct)) {
    return '';
  }

  // Round to 2 decimal places and strip unnecessary trailing zeros
  const rounded = Number(pct.toFixed(2));
  return `${rounded}%`;
}

/**
 * Sanitizes numeric input without breaking typing flow (allows empty string, digits, and a single decimal point).
 */
export function isValidNumericInput(val: string): boolean {
  if (val === '') return true;
  // Allows valid whole or decimal numbers during typing, like "2", "23", "233", "85.", "85.5"
  return /^\d*\.?\d*$/.test(val);
}

/**
 * Gets the display percentage for a row, accounting for automatic or manual mode.
 */
export function getRowDisplayPercentage(row: EducationRow): string {
  if (row.isManualPercentage) {
    const manual = (row.manualPercentage || '').trim();
    if (!manual) return '—';
    const num = parseFloat(manual);
    if (isNaN(num) || num < 0 || num > 100) return 'Invalid %';
    // Remove existing % if typed, format cleanly
    const cleanNum = Number(num.toFixed(2));
    return `${cleanNum}%`;
  }

  return row.percentage ? row.percentage : '—';
}

/**
 * Formats a clean Indian formal address string
 */
export function formatFullAddress(personal: PersonalInfo): string {
  if (personal.useCustomAddress && personal.customAddress?.trim()) {
    return personal.customAddress.trim();
  }

  const parts: string[] = [];
  if (personal.villageTown?.trim()) parts.push(`Vill/Town: ${personal.villageTown.trim()}`);
  if (personal.postOffice?.trim()) parts.push(`P.O.: ${personal.postOffice.trim()}`);
  if (personal.policeStation?.trim()) parts.push(`P.S.: ${personal.policeStation.trim()}`);
  if (personal.district?.trim()) parts.push(`Dist: ${personal.district.trim()}`);
  if (personal.state?.trim()) parts.push(`State: ${personal.state.trim()}`);
  if (personal.pinCode?.trim()) parts.push(`PIN: ${personal.pinCode.trim()}`);

  if (parts.length === 0) {
    return personal.customAddress?.trim() || '';
  }

  return parts.join(', ');
}

/**
 * Format date for formal Indian document (DD/MM/YYYY)
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    // YYYY-MM-DD
    const [year, month, day] = parts;
    if (year.length === 4) {
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
  }
  return dateStr;
}

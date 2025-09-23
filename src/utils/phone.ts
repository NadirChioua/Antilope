/**
 * Phone number utilities for consistent formatting and validation
 */

/**
 * Normalize a phone number by removing all formatting characters
 * @param phone - The phone number to normalize
 * @returns Normalized phone number with only digits
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters except + at the beginning
  let normalized = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Handle international format with +
  if (normalized.startsWith('+')) {
    normalized = normalized.substring(1);
  }
  
  return normalized;
}

/**
 * Format a phone number for display (Moroccan format)
 * @param phone - The phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  
  // Moroccan phone numbers are typically 10 digits starting with 0
  if (normalized.length === 10 && normalized.startsWith('0')) {
    return `${normalized.substring(0, 4)} ${normalized.substring(4, 6)} ${normalized.substring(6, 8)} ${normalized.substring(8, 10)}`;
  }
  
  // International format (12 digits starting with 212 for Morocco)
  if (normalized.length === 12 && normalized.startsWith('212')) {
    return `+212 ${normalized.substring(3, 6)} ${normalized.substring(6, 8)} ${normalized.substring(8, 10)} ${normalized.substring(10, 12)}`;
  }
  
  // Return original if format is not recognized
  return phone;
}

/**
 * Validate a Moroccan phone number
 * @param phone - The phone number to validate
 * @returns True if valid, false otherwise
 */
export function isValidMoroccanPhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  
  // Moroccan mobile numbers: 10 digits starting with 06 or 07
  if (normalized.length === 10 && (normalized.startsWith('06') || normalized.startsWith('07'))) {
    return true;
  }
  
  // International format: +212 followed by 9 digits (without the leading 0)
  if (normalized.length === 12 && normalized.startsWith('212')) {
    const localPart = normalized.substring(3);
    return localPart.length === 9 && (localPart.startsWith('6') || localPart.startsWith('7'));
  }
  
  return false;
}

/**
 * Convert phone number to international format
 * @param phone - The phone number to convert
 * @returns Phone number in international format (+212...)
 */
export function toInternationalFormat(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  
  // If already in international format
  if (normalized.startsWith('212') && normalized.length === 12) {
    return `+${normalized}`;
  }
  
  // Convert from local format (0X XX XX XX XX) to international
  if (normalized.length === 10 && normalized.startsWith('0')) {
    return `+212${normalized.substring(1)}`;
  }
  
  return phone;
}
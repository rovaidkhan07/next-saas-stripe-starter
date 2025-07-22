// Re-export all utility functions from taskUtils
export * from './taskUtils';

// Re-export all utility functions from timerUtils
export * from './timerUtils';

// You can also add any additional utility functions here
// that don't fit into the other categories

/**
 * Format a date string to a more readable format
 * @param dateString ISO date string
 * @returns Formatted date string (e.g., "Jan 1, 2023")
 */
export const formatDate = (dateString: string | Date): string => {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Truncate text to a specified length and add ellipsis if needed
 * @param text The text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Generate a unique ID
 * @returns A unique ID string
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Debounce a function call
 * @param func The function to debounce
 * @param wait Time to wait in milliseconds
 * @returns A debounced version of the function
 */
export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  wait: number
): ((...args: Parameters<F>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<F>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
};

/**
 * Format a number as a string with commas
 * @param num The number to format
 * @returns Formatted number string (e.g., "1,234,567")
 */
export const formatNumberWithCommas = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Calculate the percentage of a value relative to a total
 * @param value The value to calculate the percentage of
 * @param total The total value (100%)
 * @param decimalPlaces Number of decimal places to round to (default: 0)
 * @returns The percentage value
 */
export const calculatePercentage = (
  value: number, 
  total: number, 
  decimalPlaces: number = 0
): number => {
  if (total === 0) return 0;
  const percentage = (value / total) * 100;
  return parseFloat(percentage.toFixed(decimalPlaces));
};

/**
 * Check if a value is empty (null, undefined, empty string, empty array, or empty object)
 * @param value The value to check
 * @returns Boolean indicating if the value is empty
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length === 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  
  return false;
};

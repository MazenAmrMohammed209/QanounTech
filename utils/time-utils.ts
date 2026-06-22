import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

/**
 * Formats a date string into a human-friendly Arabic relative time string.
 * @param dateStr The date string to format.
 * @returns A string like "منذ يوم", "منذ 3 دقائق", etc.
 */
export function timeAgo(dateStr: string): string {
  if (!dateStr) return 'غير محدد';
  
  try {
    const date = new Date(dateStr);
    // Use formatDistanceToNow with Arabic locale
    let distance = formatDistanceToNow(date, { addSuffix: true, locale: ar });
    
    // date-fns Arabic locale uses "منذ..." but we can refine it if needed.
    // Usually it returns "منذ حوالي دقيقة" or "منذ يوم واحد".
    // Let's ensure it's clean.
    return distance;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'تاريخ غير صالح';
  }
}

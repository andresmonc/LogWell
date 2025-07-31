import { format, isToday, isYesterday, parseISO, startOfDay, endOfDay } from 'date-fns';

/**
 * Format date string for display
 */
export function formatDisplayDate(dateString: string): string {
  const date = parseISO(dateString);
  
  if (isToday(date)) {
    return 'Today';
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'MMM d, yyyy');
  }
}

/**
 * Format date for storage (YYYY-MM-DD)
 */
export function formatStorageDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get today's date in storage format
 */
export function getTodayString(): string {
  return formatStorageDate(new Date());
}

/**
 * Get yesterday's date in storage format
 */
export function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatStorageDate(yesterday);
}

/**
 * Get date range for the current week
 */
export function getWeekDateRange(): { start: string; end: string } {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const start = new Date(today);
  start.setDate(today.getDate() - dayOfWeek);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  
  return {
    start: formatStorageDate(start),
    end: formatStorageDate(end),
  };
}

/**
 * Get date range for the current month
 */
export function getMonthDateRange(): { start: string; end: string } {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  return {
    start: formatStorageDate(start),
    end: formatStorageDate(end),
  };
}

/**
 * Check if a date string is today
 */
export function isDateToday(dateString: string): boolean {
  return dateString === getTodayString();
}

/**
 * Get a date N days from given date
 */
export function getDateOffset(dateString: string, daysOffset: number): string {
  const date = parseISO(dateString);
  date.setDate(date.getDate() + daysOffset);
  return formatStorageDate(date);
}

/**
 * Get array of date strings for a week starting from given date
 */
export function getWeekDates(startDate: string): string[] {
  const dates: string[] = [];
  let currentDate = parseISO(startDate);
  
  for (let i = 0; i < 7; i++) {
    dates.push(formatStorageDate(currentDate));
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * Parse time from Date object to HH:MM format
 */
export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

/**
 * Get meal time suggestion based on current time
 */
export function suggestMealType(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 11) {
    return 'breakfast';
  } else if (hour >= 11 && hour < 16) {
    return 'lunch';
  } else if (hour >= 16 && hour < 21) {
    return 'dinner';
  } else {
    return 'snack';
  }
}
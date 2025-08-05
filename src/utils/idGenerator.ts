/**
 * Improved ID generation utilities to prevent collisions
 */

import { ID_CONFIG } from './constants';

/**
 * Generate a more robust unique ID with better entropy
 * Uses timestamp + random + counter for collision resistance
 */
let counter = 0;

export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 2 + ID_CONFIG.ENTROPY_LENGTH);
  const counterPart = (counter++ % 1000).toString(36);
  
  return `${timestamp}${randomPart}${counterPart}`;
}

/**
 * Generate a UUID-like string (not RFC compliant but good for local use)
 */
export function generateUuidLike(): string {
  const chars = '0123456789abcdef';
  let result = '';
  
  for (let i = 0; i < 32; i++) {
    result += chars[Math.floor(Math.random() * 16)];
    if (i === 7 || i === 11 || i === 15 || i === 19) {
      result += '-';
    }
  }
  
  return result;
}

/**
 * Generate a prefixed ID for specific entity types
 */
export function generatePrefixedId(prefix: string): string {
  return `${prefix}_${generateId()}`;
}

/**
 * Reset counter (mainly for testing)
 */
export function resetIdCounter(): void {
  counter = 0;
}
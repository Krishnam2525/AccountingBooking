import Decimal from 'decimal.js';

// Configure Decimal.js for strict financial arithmetic
// 20 digits of precision is more than enough for any accounting system
// ROUND_HALF_UP is the standard for financial rounding
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export type DecimalValue = Decimal | string | number;

/**
 * Converts any valid numeric input into a strict Decimal instance.
 * Throws an error if the input is not a valid number.
 */
export function toDecimal(value: DecimalValue): Decimal {
  try {
    return new Decimal(value);
  } catch (error) {
    throw new Error(`Invalid decimal value: ${value}`);
  }
}

/**
 * Checks if two decimal values are exactly equal.
 */
export function isEqual(a: DecimalValue, b: DecimalValue): boolean {
  return toDecimal(a).equals(toDecimal(b));
}

/**
 * Checks if a decimal value is exactly zero.
 */
export function isZero(value: DecimalValue): boolean {
  return toDecimal(value).isZero();
}

/**
 * Formats a decimal value as a currency string (e.g., "1,234.56").
 * Note: This is for display only, never for calculation.
 */
export function formatCurrency(value: DecimalValue, currencyCode: string = 'USD'): string {
  const dec = toDecimal(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dec.toNumber());
}

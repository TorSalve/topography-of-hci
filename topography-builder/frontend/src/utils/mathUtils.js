/**
 * Utility functions for mathematical operations and value formatting
 */

/**
 * Evaluate simple mathematical expressions (one operation at a time)
 * Supports: +, -, *, / with positive and negative numbers including decimals
 *
 * @param {string} expression - The mathematical expression to evaluate
 * @returns {number|null} - The result of the calculation or null if invalid
 */
export const evaluateExpression = (expression) => {
  if (!expression || typeof expression !== "string") {
    return null;
  }

  // Remove spaces and validate format
  const cleanExpression = expression.replace(/\s/g, "");

  // Regex to match: number operator number (supports decimals)
  const mathPattern = /^(-?\d*\.?\d+)([\+\-\*\/])(-?\d*\.?\d+)$/;
  const match = cleanExpression.match(mathPattern);

  if (!match) {
    // If it's just a number, return it
    const num = parseFloat(cleanExpression);
    return isNaN(num) ? null : num;
  }

  const [, leftStr, operator, rightStr] = match;
  const left = parseFloat(leftStr);
  const right = parseFloat(rightStr);

  // Validate numbers
  if (isNaN(left) || isNaN(right)) {
    return null;
  }

  // Perform calculation
  switch (operator) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
      return left * right;
    case "/":
      if (right === 0) {
        return null; // Division by zero
      }
      return left / right;
    default:
      return null;
  }
};

/**
 * Format a numeric value to show minimal decimal places
 * Removes trailing zeros and shows whole numbers without decimals
 *
 * @param {number} val - The value to format
 * @returns {string} - The formatted value as a string
 */
export const formatValue = (val) => {
  // Ensure val is a number and round to thousandth
  const numVal = Number(val) || 0;
  const rounded = Math.round(numVal * 1000) / 1000;
  if (rounded === Math.floor(rounded)) {
    return rounded.toString(); // Show whole numbers without decimal
  }
  return rounded.toFixed(3).replace(/\.?0+$/, ""); // Remove trailing zeros
};

/**
 * Round a number to the nearest thousandth (3 decimal places)
 *
 * @param {number} num - The number to round
 * @returns {number} - The rounded number
 */
export const roundToThousandth = (num) => {
  return Math.round(num * 1000) / 1000;
};

/**
 * Process input value using mathematical expressions or regular parsing
 * Handles validation, clamping, and rounding
 *
 * @param {string} inputValue - The input string to process
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {boolean} positiveOnly - Whether to only allow positive values
 * @returns {number|null} - The processed value or null if invalid
 */
export const processInputValue = (
  inputValue,
  min = -Infinity,
  max = Infinity,
  positiveOnly = false
) => {
  // Try to evaluate as mathematical expression first
  let newValue = evaluateExpression(inputValue);

  // If expression evaluation failed, try parsing as regular number
  if (newValue === null) {
    newValue = parseFloat(inputValue);
  }

  if (!isNaN(newValue)) {
    // Apply positive-only constraint if needed
    if (positiveOnly && newValue <= 0) {
      return null;
    }

    // Clamp to min/max range
    const clampedValue = Math.max(min, Math.min(max, newValue));

    // Round to thousandth
    return roundToThousandth(clampedValue);
  }

  return null;
};

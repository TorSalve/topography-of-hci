/**
 * Common input handling utilities for form components
 */

/**
 * Create a standardized Enter key handler for input fields
 *
 * @param {Function} onBlur - Function to call when Enter is pressed
 * @param {React.RefObject} inputRef - Optional ref to blur the input
 * @returns {Function} - Event handler function
 */
export const createEnterKeyHandler = (onBlur, inputRef = null) => {
  return (e) => {
    if (e.key === "Enter") {
      onBlur();
      if (inputRef?.current) {
        inputRef.current.blur();
      } else {
        e.target.blur();
      }
    }
  };
};

/**
 * Create a standardized input change handler
 *
 * @param {Function} setValue - State setter function
 * @returns {Function} - Event handler function
 */
export const createInputChangeHandler = (setValue) => {
  return (e) => {
    setValue(e.target.value);
  };
};

/**
 * Create a standardized focus handler for editing state
 *
 * @param {Function} setIsEditing - State setter for editing flag
 * @param {Function} onInteractionStart - Optional interaction start callback
 * @returns {Function} - Event handler function
 */
export const createFocusHandler = (setIsEditing, onInteractionStart = null) => {
  return () => {
    setIsEditing(true);
    if (onInteractionStart) {
      onInteractionStart();
    }
  };
};

/**
 * Create a standardized blur handler with value processing
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.setIsEditing - State setter for editing flag
 * @param {Function} options.setValue - State setter for input value
 * @param {Function} options.onChange - Main change handler
 * @param {Function} options.processValue - Value processing function
 * @param {Function} options.formatValue - Value formatting function
 * @param {*} options.currentValue - Current value to fallback to
 * @param {Function} options.onInteractionEnd - Optional interaction end callback
 * @returns {Function} - Event handler function
 */
export const createBlurHandler = ({
  setIsEditing,
  setValue,
  onChange,
  processValue,
  formatValue,
  currentValue,
  onInteractionEnd = null,
}) => {
  return (inputValue) => {
    setIsEditing(false);

    const processedValue = processValue(inputValue);

    if (processedValue !== null) {
      onChange(processedValue);
      setValue(formatValue(processedValue));
    } else {
      // Reset to current value if invalid input
      setValue(
        formatValue ? formatValue(currentValue) : currentValue?.toString() || ""
      );
    }

    if (onInteractionEnd) {
      onInteractionEnd();
    }
  };
};

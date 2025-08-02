/**
 * Parameter descriptions and metadata for the topography builder
 */

export const parameterDescriptions = {
  layers: {
    label: "Layers",
    description:
      "Number of contour lines to draw. More layers provide finer detail but may slow processing.",
    unit: "lines",
  },
  layer_height: {
    label: "Layer Height",
    description:
      "Vertical distance between adjacent contour lines. Smaller values create more detailed topography.",
    unit: "units",
  },
  x_scale: {
    label: "X Scale",
    description:
      "Horizontal scaling factor along the X-axis. Values > 1 stretch, < 1 compress.",
    unit: "×",
  },
  y_scale: {
    label: "Y Scale",
    description:
      "Horizontal scaling factor along the Y-axis. Values > 1 stretch, < 1 compress.",
    unit: "×",
  },
  z_scale: {
    label: "Z Scale",
    description:
      "Vertical scaling factor. Values > 1 make the model taller, < 1 make it flatter.",
    unit: "×",
  },
  x_offset: {
    label: "X Offset",
    description:
      "Horizontal shift along the X-axis. Positive values move right, negative move left.",
    unit: "units",
  },
  y_offset: {
    label: "Y Offset",
    description:
      "Horizontal shift along the Y-axis. Positive values move up, negative move down.",
    unit: "units",
  },
  z_offset: {
    label: "Z Offset",
    description:
      "Vertical shift. Positive values raise the model, negative values lower it.",
    unit: "units",
  },
  x_rotation: {
    label: "X Rotation",
    description:
      "Rotation around the X-axis in degrees. Tilts the model forward (positive) or backward (negative).",
    unit: "°",
  },
  y_rotation: {
    label: "Y Rotation",
    description:
      "Rotation around the Y-axis in degrees. Tilts the model left (positive) or right (negative).",
    unit: "°",
  },
  z_rotation: {
    label: "Z Rotation",
    description:
      "Rotation around the Z-axis in degrees. Rotates the model clockwise (positive) or counterclockwise (negative).",
    unit: "°",
  },
  model_height: {
    label: "Model Height",
    description:
      "Target height for the entire model in your chosen units. The model will be scaled to match this height.",
    unit: "units",
  },
};

/**
 * Get parameter info by key
 * @param {string} key - Parameter key
 * @returns {Object} Parameter info with label, description, and unit
 */
export const getParameterInfo = (key) => {
  return (
    parameterDescriptions[key] || {
      label: key,
      description: "No description available",
      unit: "",
    }
  );
};

/**
 * Format parameter display text
 * @param {string} key - Parameter key
 * @param {*} value - Parameter value
 * @returns {string} Formatted display text
 */
export const formatParameterDisplay = (key, value) => {
  const info = getParameterInfo(key);
  const formattedValue =
    typeof value === "number"
      ? value % 1 === 0
        ? value.toString()
        : value.toFixed(3).replace(/\.?0+$/, "")
      : value?.toString() || "";

  return info.unit ? `${formattedValue} ${info.unit}` : formattedValue;
};

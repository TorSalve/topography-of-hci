/**
 * KOMPASS map standards and conventions
 * Based on https://www.kompass.de/wanderwiki/legende/
 */

// Hiking path difficulties and their visual representations
export const HIKING_DIFFICULTIES = {
  WEG: {
    id: "weg",
    name: "Weg (Way)",
    description: "Easy, mostly flat paths",
    color: "#4A5D23", // Dark green
    strokeWidth: 2,
    strokeDasharray: "none",
    difficulty: 1,
  },
  PFAD: {
    id: "pfad",
    name: "Pfad (Path)",
    description: "Narrow, somewhat challenging, no safety equipment needed",
    color: "#B8860B", // Dark goldenrod
    strokeWidth: 2,
    strokeDasharray: "5,3",
    difficulty: 2,
  },
  STEIG: {
    id: "steig",
    name: "Steig (Trail)",
    description:
      "Steep and challenging, requires sure footing and no fear of heights",
    color: "#A0522D", // Sienna
    strokeWidth: 3,
    strokeDasharray: "8,2,2,2",
    difficulty: 3,
  },
};

// Terrain-based color schemes following KOMPASS standards
export const TERRAIN_COLORS = {
  WATER: {
    primary: "#4A90E2", // Blue
    secondary: "#87CEEB", // Sky blue
    tertiary: "#B0E0E6", // Powder blue
  },
  VEGETATION: {
    forest: "#228B22", // Forest green
    grassland: "#9ACD32", // Yellow green
    alpine: "#8FBC8F", // Dark sea green
    sparse: "#F0E68C", // Khaki
  },
  TERRAIN: {
    rock: "#A0522D", // Sienna
    scree: "#D2B48C", // Tan
    glacier: "#F0F8FF", // Alice blue
    snow: "#FFFAFA", // Snow
  },
  CONTOURS: {
    primary: "#8B4513", // Saddle brown
    secondary: "#CD853F", // Peru
    index: "#654321", // Dark brown
  },
};

// Map symbols following KOMPASS conventions
export const MAP_SYMBOLS = {
  PEAKS: {
    mountain_peak: {
      symbol: "▲",
      size: 12,
      color: "#654321",
      showElevation: true,
    },
    hill: {
      symbol: "△",
      size: 10,
      color: "#8B4513",
      showElevation: true,
    },
  },
  BUILDINGS: {
    hut: {
      symbol: "■",
      size: 8,
      color: "#8B4513",
      type: "mountain_hut",
    },
    city: {
      symbol: "▪",
      size: 6,
      color: "#000000",
      type: "settlement",
    },
    church: {
      symbol: "⛪",
      size: 10,
      color: "#000000",
      type: "religious",
    },
  },
  NATURE: {
    tree: {
      symbol: "🌲",
      size: 8,
      color: "#228B22",
      type: "individual_tree",
    },
    cave: {
      symbol: "⚫",
      size: 6,
      color: "#000000",
      type: "cave",
    },
    spring: {
      symbol: "◉",
      size: 6,
      color: "#4A90E2",
      type: "water_source",
    },
  },
  INFRASTRUCTURE: {
    parking: {
      symbol: "P",
      size: 10,
      color: "#000000",
      type: "parking",
    },
    bus_stop: {
      symbol: "🚌",
      size: 10,
      color: "#000000",
      type: "public_transport",
    },
    cable_car: {
      symbol: "🚠",
      size: 10,
      color: "#000000",
      type: "transportation",
    },
  },
};

// Standard elevation-based coloring
export const ELEVATION_COLORS = [
  { elevation: 0, color: "#4A90E2" }, // Sea level - blue
  { elevation: 200, color: "#90EE90" }, // Low - light green
  { elevation: 500, color: "#9ACD32" }, // Medium low - yellow green
  { elevation: 1000, color: "#F0E68C" }, // Medium - khaki
  { elevation: 1500, color: "#DEB887" }, // Medium high - burlywood
  { elevation: 2000, color: "#D2B48C" }, // High - tan
  { elevation: 2500, color: "#BC8F8F" }, // Very high - rosy brown
  { elevation: 3000, color: "#A0522D" }, // Mountain - sienna
  { elevation: 4000, color: "#8B4513" }, // High mountain - saddle brown
  { elevation: 5000, color: "#FFFAFA" }, // Snow/ice - snow white
];

// Slope-based styling adjustments
export const SLOPE_STYLES = {
  FLAT: { opacity: 1.0, pattern: "none" },
  GENTLE: { opacity: 0.9, pattern: "light-stipple" },
  MODERATE: { opacity: 0.8, pattern: "medium-stipple" },
  STEEP: { opacity: 0.7, pattern: "heavy-stipple" },
  VERY_STEEP: { opacity: 0.6, pattern: "cross-hatch" },
};

// Grid and coordinate system settings
export const GRID_SETTINGS = {
  UTM: {
    majorInterval: 1000, // 1km
    minorInterval: 100, // 100m
    color: "#808080",
    strokeWidth: 0.5,
  },
  COORDINATE_DISPLAY: {
    format: "utm",
    precision: 0,
    showLabels: true,
  },
};

// Scale bar settings
export const SCALE_SETTINGS = {
  UNITS: ["m", "km"],
  PREFERRED_WIDTHS: [100, 200, 500, 1000, 2000, 5000], // in map units
  POSITION: { x: 20, y: 20 }, // from bottom-left
  STYLE: {
    height: 10,
    color: "#000000",
    strokeWidth: 1,
    fontSize: 12,
  },
};

// Legend layout settings
export const LEGEND_SETTINGS = {
  POSITION: { x: 20, y: 100 }, // from top-left
  SECTIONS: ["hiking_paths", "elevation", "symbols", "infrastructure"],
  STYLE: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    border: "1px solid #000000",
    padding: 10,
    fontSize: 11,
    lineHeight: 1.4,
  },
};

// Standard map sizes (in mm, for printing)
export const MAP_SIZES = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  A2: { width: 420, height: 594 },
  A1: { width: 594, height: 841 },
  CUSTOM: { width: null, height: null },
};

// Export formats
export const EXPORT_FORMATS = {
  SVG: { extension: "svg", mimeType: "image/svg+xml" },
  PNG: { extension: "png", mimeType: "image/png" },
  PDF: { extension: "pdf", mimeType: "application/pdf" },
  PRINT: { extension: "print", mimeType: "text/html" },
};

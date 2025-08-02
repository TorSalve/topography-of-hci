/**
 * Topographical map standards and conventions
 * Hiking trail classifications and visual styling
 */

// Hiking path difficulties and their visual representations
export const HIKING_DIFFICULTIES = {
  EASY: {
    id: "easy",
    name: "Easy Trail",
    description: "Easy, mostly flat paths suitable for beginners",
    color: "#4A5D23", // Dark green
    strokeWidth: 2,
    strokeDasharray: "none",
    difficulty: 1,
  },
  MODERATE: {
    id: "moderate",
    name: "Moderate Trail",
    description: "Narrow, somewhat challenging paths with moderate elevation",
    color: "#B8860B", // Dark goldenrod
    strokeWidth: 2,
    strokeDasharray: "5,3",
    difficulty: 2,
  },
  DIFFICULT: {
    id: "difficult",
    name: "Difficult Trail",
    description: "Steep and challenging, requires sure footing and experience",
    color: "#8B0000", // Dark red
    strokeWidth: 3,
    strokeDasharray: "8,2,2,2",
    difficulty: 3,
  },
  EXTREME: {
    id: "extreme",
    name: "Extreme Trail",
    description:
      "Very steep, potentially dangerous, safety equipment recommended",
    color: "#000000", // Black
    strokeWidth: 3,
    strokeDasharray: "10,2,2,2,2,2",
    difficulty: 4,
  },
};

// Terrain colors based on elevation and type
export const TERRAIN_COLORS = {
  WATER: {
    lakes: "#4A90E2",
    rivers: "#5BA3F5",
    streams: "#7BB8F7",
  },
  ELEVATION: {
    lowland: "#90EE90", // Light green
    hills: "#98FB98", // Pale green
    mountains: "#D2B48C", // Tan
    peaks: "#DEB887", // Burlywood
    snow: "#F0F8FF", // Alice blue
  },
  VEGETATION: {
    forest: "#228B22", // Forest green
    grassland: "#9ACD32", // Yellow green
    meadow: "#ADFF2F", // Green yellow
    desert: "#F4A460", // Sandy brown
    rock: "#A0522D", // Sienna
  },
};

// Map symbols and their SVG representations
export const MAP_SYMBOLS = {
  LANDMARKS: {
    peak: {
      symbol: "△",
      size: 12,
      color: "#8B4513",
      description: "Mountain peak",
    },
    viewpoint: {
      symbol: "👁",
      size: 14,
      color: "#FF6347",
      description: "Scenic viewpoint",
    },
    shelter: {
      symbol: "🏠",
      size: 12,
      color: "#654321",
      description: "Mountain shelter/hut",
    },
    campsite: {
      symbol: "⛺",
      size: 12,
      color: "#006400",
      description: "Camping area",
    },
    parking: {
      symbol: "🅿",
      size: 12,
      color: "#4169E1",
      description: "Parking area",
    },
  },
  INFRASTRUCTURE: {
    bridge: {
      symbol: "═",
      size: 8,
      color: "#696969",
      description: "Bridge",
    },
    tunnel: {
      symbol: "⩢",
      size: 8,
      color: "#2F4F4F",
      description: "Tunnel",
    },
    railway: {
      symbol: "┴",
      size: 6,
      color: "#000000",
      description: "Railway line",
    },
    road: {
      symbol: "▬",
      size: 4,
      color: "#696969",
      description: "Road",
    },
  },
  NATURAL_FEATURES: {
    waterfall: {
      symbol: "⫸",
      size: 14,
      color: "#4682B4",
      description: "Waterfall",
    },
    cave: {
      symbol: "◐",
      size: 12,
      color: "#2F2F2F",
      description: "Cave entrance",
    },
    spring: {
      symbol: "※",
      size: 10,
      color: "#00CED1",
      description: "Natural spring",
    },
    cliff: {
      symbol: "⫷",
      size: 12,
      color: "#8B4513",
      description: "Cliff edge",
    },
  },
};

// Elevation color gradients
export const ELEVATION_COLORS = [
  { elevation: 0, color: "#006400" }, // Sea level - dark green
  { elevation: 200, color: "#32CD32" }, // 200m - lime green
  { elevation: 400, color: "#9ACD32" }, // 400m - yellow green
  { elevation: 600, color: "#DAA520" }, // 600m - goldenrod
  { elevation: 800, color: "#CD853F" }, // 800m - peru
  { elevation: 1000, color: "#D2B48C" }, // 1000m - tan
  { elevation: 1200, color: "#BC8F8F" }, // 1200m - rosy brown
  { elevation: 1500, color: "#A0522D" }, // 1500m - sienna
  { elevation: 2000, color: "#8B4513" }, // 2000m - saddle brown
  { elevation: 2500, color: "#696969" }, // 2500m - dim gray
  { elevation: 3000, color: "#FFFFFF" }, // 3000m+ - white (snow)
];

// Contour line settings
export const CONTOUR_SETTINGS = {
  MAJOR: {
    interval: 100, // Major contour every 100m
    strokeWidth: 2,
    color: "#8B4513",
    opacity: 0.8,
  },
  MINOR: {
    interval: 20, // Minor contour every 20m
    strokeWidth: 1,
    color: "#CD853F",
    opacity: 0.6,
  },
};

// Trail markings and blazes
export const TRAIL_MARKINGS = {
  COLORS: {
    red: "#FF0000",
    blue: "#0000FF",
    yellow: "#FFFF00",
    white: "#FFFFFF",
    orange: "#FFA500",
    green: "#008000",
  },
  SHAPES: {
    circle: "●",
    square: "■",
    triangle: "▲",
    diamond: "♦",
    slash: "/",
    bar: "─",
  },
};

// Scale and measurement constants
export const MAP_SCALES = {
  "1:25000": {
    name: "1:25,000",
    metersPerPixel: 25,
    description: "Detailed hiking maps",
  },
  "1:50000": {
    name: "1:50,000",
    metersPerPixel: 50,
    description: "Standard topographic maps",
  },
  "1:100000": {
    name: "1:100,000",
    metersPerPixel: 100,
    description: "Regional overview maps",
  },
};

export default {
  HIKING_DIFFICULTIES,
  TERRAIN_COLORS,
  MAP_SYMBOLS,
  ELEVATION_COLORS,
  CONTOUR_SETTINGS,
  TRAIL_MARKINGS,
  MAP_SCALES,
};

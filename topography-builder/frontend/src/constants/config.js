// Server Configuration
export const SERVER_CONFIG = {
  // Backend API Configuration
  API: {
    PROTOCOL: import.meta.env.VITE_API_PROTOCOL || "http",
    HOST: import.meta.env.VITE_API_HOST || "localhost",
    PORT: parseInt(import.meta.env.VITE_API_PORT) || 8000,
    get BASE_URL() {
      return `${this.PROTOCOL}://${this.HOST}:${this.PORT}`;
    },
  },

  // Frontend Development Server Configuration
  FRONTEND: {
    PROTOCOL: "http",
    HOST: import.meta.env.VITE_DEV_HOST || "localhost",
    PORT: parseInt(import.meta.env.VITE_DEV_PORT) || 5173, // Vite default port
    FALLBACK_PORT: 3000, // Create React App default port
    get BASE_URL() {
      return `${this.PROTOCOL}://${this.HOST}:${this.PORT}`;
    },
    get FALLBACK_URL() {
      return `${this.PROTOCOL}://${this.HOST}:${this.FALLBACK_PORT}`;
    },
  },

  // CORS Configuration (for reference, actual CORS is configured on backend)
  CORS: {
    get ALLOWED_ORIGINS() {
      return [
        SERVER_CONFIG.FRONTEND.BASE_URL,
        SERVER_CONFIG.FRONTEND.FALLBACK_URL,
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
      ];
    },
    ALLOWED_METHODS: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    ALLOWED_HEADERS: ["*"],
    ALLOW_CREDENTIALS: true,
  },
};

// API Configuration (backward compatibility)
export const API_CONFIG = {
  get BASE_URL() {
    return SERVER_CONFIG.API.BASE_URL;
  },
  ENDPOINTS: {
    ROOT: "/",
    HEALTH: "/health",
    UPLOAD: "/upload/",
  },
};

// File Configuration
export const FILE_CONFIG = {
  SUPPORTED_FORMATS: [".obj", ".fbx", ".stl", ".ply"],
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  OUTPUT_FILENAME: "topomap.png",
};

// UI Configuration
export const UI_CONFIG = {
  SUPPORTED_FORMATS_DISPLAY: "OBJ, FBX, STL, PLY",
  PROGRESS_UPDATE_INTERVAL: 100, // ms
};

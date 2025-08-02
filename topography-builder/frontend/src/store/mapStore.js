/**
 * Map Editor State Store using Zustand
 * Manages the global state for the SVG map editor
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";

// Initial state
const initialState = {
  // SVG content and structure
  svg: {
    content: null,
    viewBox: [0, 0, 800, 600],
    layers: [],
    selectedElements: [],
  },

  // Current tool and interaction mode
  ui: {
    activeTool: "select",
    zoom: 1,
    pan: { x: 0, y: 0 },
    isDragging: false,
    showGrid: false,
    showLegend: true,
    sidebarOpen: false,
  },

  // Map styling and appearance
  styling: {
    currentColorScheme: "earth_tones",
    autoColoring: true,
    contourLineStyle: "brown",
    gridStyle: "utm",
  },

  // Map metadata
  metadata: {
    title: "",
    scale: "1:25000",
    coordinates: null,
    elevation: { min: 0, max: 0 },
  },

  // History for undo/redo
  history: {
    past: [],
    present: null,
    future: [],
    maxHistorySize: 50,
  },
};

export const useMapStore = create()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // SVG content management
      setSvgContent: (content) =>
        set((state) => {
          state.svg.content = content;
        }),

      addLayer: (layer) =>
        set((state) => {
          state.svg.layers.push({
            id: crypto.randomUUID(),
            name: layer.name || "New Layer",
            visible: true,
            locked: false,
            elements: [],
            ...layer,
          });
        }),

      removeLayer: (layerId) =>
        set((state) => {
          state.svg.layers = state.svg.layers.filter(
            (layer) => layer.id !== layerId
          );
        }),

      toggleLayerVisibility: (layerId) =>
        set((state) => {
          const layer = state.svg.layers.find((l) => l.id === layerId);
          if (layer) {
            layer.visible = !layer.visible;
          }
        }),

      // Element selection
      selectElements: (elements) =>
        set((state) => {
          state.svg.selectedElements = Array.isArray(elements)
            ? elements
            : [elements];
        }),

      addToSelection: (element) =>
        set((state) => {
          if (!state.svg.selectedElements.includes(element)) {
            state.svg.selectedElements.push(element);
          }
        }),

      removeFromSelection: (element) =>
        set((state) => {
          state.svg.selectedElements = state.svg.selectedElements.filter(
            (el) => el !== element
          );
        }),

      clearSelection: () =>
        set((state) => {
          state.svg.selectedElements = [];
        }),

      deleteSelected: () =>
        set((state) => {
          // This would need to be implemented with actual DOM manipulation
          // For now, just clear the selection
          state.svg.selectedElements = [];
        }),

      // Tool management
      setActiveTool: (tool) =>
        set((state) => {
          state.ui.activeTool = tool;
          // Clear selection when switching tools (except select tool)
          if (tool !== "select") {
            state.svg.selectedElements = [];
          }
        }),

      // View management
      setZoom: (zoom) =>
        set((state) => {
          state.ui.zoom = Math.max(0.1, Math.min(5, zoom));
        }),

      setPan: (pan) =>
        set((state) => {
          state.ui.pan = pan;
        }),

      resetView: () =>
        set((state) => {
          state.ui.zoom = 1;
          state.ui.pan = { x: 0, y: 0 };
        }),

      setDragging: (isDragging) =>
        set((state) => {
          state.ui.isDragging = isDragging;
        }),

      // UI toggles
      toggleGrid: () =>
        set((state) => {
          state.ui.showGrid = !state.ui.showGrid;
        }),

      toggleLegend: () =>
        set((state) => {
          state.ui.showLegend = !state.ui.showLegend;
        }),

      toggleSidebar: () =>
        set((state) => {
          state.ui.sidebarOpen = !state.ui.sidebarOpen;
        }),

      // Styling management
      setColorScheme: (scheme) =>
        set((state) => {
          state.styling.currentColorScheme = scheme;
        }),

      toggleAutoColoring: () =>
        set((state) => {
          state.styling.autoColoring = !state.styling.autoColoring;
        }),

      // Map metadata
      setMapTitle: (title) =>
        set((state) => {
          state.metadata.title = title;
        }),

      setMapScale: (scale) =>
        set((state) => {
          state.metadata.scale = scale;
        }),

      setElevationRange: (min, max) =>
        set((state) => {
          state.metadata.elevation = { min, max };
        }),

      // History management (simplified)
      pushToHistory: () =>
        set((state) => {
          const currentState = {
            svg: { ...state.svg },
            styling: { ...state.styling },
            metadata: { ...state.metadata },
          };

          state.history.past.push(state.history.present);
          state.history.present = currentState;
          state.history.future = [];

          // Limit history size
          if (state.history.past.length > state.history.maxHistorySize) {
            state.history.past.shift();
          }
        }),

      undo: () =>
        set((state) => {
          if (state.history.past.length > 0) {
            const previous = state.history.past.pop();
            state.history.future.unshift(state.history.present);
            state.history.present = previous;

            // Restore state
            Object.assign(state.svg, previous.svg);
            Object.assign(state.styling, previous.styling);
            Object.assign(state.metadata, previous.metadata);
          }
        }),

      redo: () =>
        set((state) => {
          if (state.history.future.length > 0) {
            const next = state.history.future.shift();
            state.history.past.push(state.history.present);
            state.history.present = next;

            // Restore state
            Object.assign(state.svg, next.svg);
            Object.assign(state.styling, next.styling);
            Object.assign(state.metadata, next.metadata);
          }
        }),

      // Utility getters
      getSelectedCount: () => get().svg.selectedElements.length,
      hasSelection: () => get().svg.selectedElements.length > 0,
      canUndo: () => get().history.past.length > 0,
      canRedo: () => get().history.future.length > 0,
    })),
    {
      name: "map-editor-store",
    }
  )
);

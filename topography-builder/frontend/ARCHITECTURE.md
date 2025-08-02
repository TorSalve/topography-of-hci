# SVG Map Editor Architecture

## Overview
This document outlines the architecture for the SVG topographical map editor that extends the topography builder with comprehensive editing capabilities for creating hiking/topographical maps following KOMPASS map standards.

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── MapEditor/              # Main editor component
│   │   │   ├── MapEditor.jsx       # Main editor container
│   │   │   ├── MapCanvas.jsx       # SVG canvas with zoom/pan
│   │   │   ├── MapToolbar.jsx      # Main toolbar
│   │   │   └── MapStatusBar.jsx    # Status and coordinates
│   │   ├── Tools/                  # Editing tools
│   │   │   ├── SelectTool.jsx      # Path selection and editing
│   │   │   ├── PathEditor.jsx      # Path manipulation
│   │   │   ├── LabelTool.jsx       # Place name labels
│   │   │   ├── SymbolTool.jsx      # POI symbols
│   │   │   └── HikingPathTool.jsx  # Hiking path creation
│   │   ├── Panels/                 # Side panels
│   │   │   ├── LayersPanel.jsx     # Layer management
│   │   │   ├── ColorPanel.jsx      # Color scheme management
│   │   │   ├── SymbolsPanel.jsx    # Symbol library
│   │   │   ├── LegendPanel.jsx     # Legend editor
│   │   │   └── PropertiesPanel.jsx # Element properties
│   │   ├── ColorSchemes/           # Color management
│   │   │   ├── ColorSchemeManager.jsx
│   │   │   ├── TerrainColorizer.jsx
│   │   │   └── presets/            # Predefined color schemes
│   │   ├── Symbols/                # Map symbols
│   │   │   ├── SymbolLibrary.jsx   # Symbol management
│   │   │   ├── POISymbols.jsx      # Point of interest symbols
│   │   │   ├── TerrainSymbols.jsx  # Terrain features
│   │   │   └── HikingSymbols.jsx   # Hiking-specific symbols
│   │   ├── Grid/                   # Grid and scale
│   │   │   ├── GridOverlay.jsx     # Coordinate grid
│   │   │   ├── ScaleBar.jsx        # Map scale indicator
│   │   │   └── CoordinateSystem.jsx
│   │   └── Export/                 # Export functionality
│   │       ├── ExportDialog.jsx    # Export options
│   │       └── PrintLayout.jsx     # Print preparation
│   ├── hooks/                      # Custom React hooks
│   │   ├── useMapState.js          # Map state management
│   │   ├── useSVGEditor.js         # SVG manipulation
│   │   ├── useColorScheme.js       # Color scheme logic
│   │   ├── usePathManipulation.js  # Path editing
│   │   └── useUndoRedo.js          # Undo/redo functionality
│   ├── utils/                      # Utility functions
│   │   ├── svgUtils.js             # SVG manipulation utilities
│   │   ├── geometryUtils.js        # Geometric calculations
│   │   ├── colorUtils.js           # Color manipulation
│   │   ├── pathUtils.js            # Path operations
│   │   └── exportUtils.js          # Export functionality
│   ├── constants/                  # Constants and configurations
│   │   ├── mapSymbols.js           # Symbol definitions
│   │   ├── colorSchemes.js         # Predefined color schemes
│   │   ├── hikingDifficulties.js   # Hiking path classifications
│   │   └── kompassStandards.js     # KOMPASS map standards
│   └── store/                      # State management
│       ├── mapStore.js             # Main map state
│       ├── toolStore.js            # Active tool state
│       └── historyStore.js         # Undo/redo history
```

## Tech Stack Recommendations

### Core Technologies (Already in place)
- **React 18** - Component framework
- **Vite** - Build tool and dev server
- **CSS Modules** - Styling approach

### New Dependencies for Map Editor

#### SVG Manipulation & Canvas
- **@react-spring/web** - Smooth animations for zoom/pan
- **react-zoom-pan-pinch** - Canvas zoom and pan functionality
- **d3-selection & d3-zoom** - Advanced SVG manipulation
- **paper.js** or **fabric.js** - Advanced canvas editing (if complex path editing needed)

#### State Management
- **zustand** - Lightweight state management (preferred over Redux for this use case)
- **immer** - Immutable state updates

#### UI Components
- **@headlessui/react** - Accessible UI primitives
- **@heroicons/react** - Icons
- **react-colorful** - Color picker components
- **react-hotkeys-hook** - Keyboard shortcuts

#### Utility Libraries
- **uuid** - Unique ID generation
- **lodash** - Utility functions
- **classnames** - Conditional CSS classes

## Key Features Implementation Plan

### Phase 1: Core Editor Infrastructure
1. **SVG Canvas Setup**
   - Zoomable/pannable SVG canvas
   - Layer management system
   - Basic selection tool

2. **State Management**
   - Map data structure
   - Undo/redo system
   - Tool state management

### Phase 2: Path Editing
1. **Path Selection & Manipulation**
   - Click-to-select paths
   - Delete selected paths
   - Path closing functionality
   - Basic path editing (move points)

### Phase 3: Color Schemes
1. **Terrain-Based Coloring**
   - Altitude-based color mapping
   - Slope-based color adjustments
   - Water/grassland/mountain detection
   - Earth tone color palettes

### Phase 4: Labels & Symbols
1. **Text Labels**
   - Place name labeling
   - Font management
   - Text positioning

2. **Symbol Library**
   - POI symbols (peaks, huts, etc.)
   - City markers (small squares)
   - Terrain features

### Phase 5: Hiking Paths
1. **Path Creation**
   - Manual path drawing
   - Automatic path suggestion (basic)
   - Three difficulty levels with different strokes

### Phase 6: Map Elements
1. **Grid System**
   - UTM grid overlay
   - Coordinate display

2. **Scale & Legend**
   - Scale bar
   - Symbol legend
   - Map information panel

## Data Structures

### Map State
```javascript
{
  svg: {
    viewBox: [x, y, width, height],
    content: SVGElement,
    layers: [
      {
        id: string,
        name: string,
        visible: boolean,
        locked: boolean,
        paths: [...],
        symbols: [...],
        labels: [...]
      }
    ]
  },
  colorScheme: {
    current: string,
    schemes: {...},
    autoColoring: boolean
  },
  grid: {
    visible: boolean,
    type: 'utm' | 'metric',
    spacing: number
  },
  scale: {
    ratio: number,
    unit: 'metric' | 'imperial'
  }
}
```

### KOMPASS Standards Integration
Based on the website information, we need to support:

1. **Path Classifications**
   - Weg (Way): Easy, flat paths
   - Pfad (Path): Narrow, more challenging
   - Steig (Trail): Steep, requires experience

2. **Symbol Categories**
   - Relief & Vegetation
   - Base Information (peaks, churches, caves)
   - Transportation
   - Recreation & Sports
   - Hiking Information
   - Cycling, Skiing routes

3. **Color Standards**
   - Earth tones for terrain
   - Water in blue
   - Vegetation in greens
   - Contour lines in brown

## Integration with Existing App

### Router Updates
```javascript
// Add new routes
/editor -> Map Editor (standalone)
/editor/:mapId -> Edit specific map
/upload -> Updated to include "Edit SVG" option
```

### API Extensions
```javascript
// New endpoints needed
POST /api/maps -> Save map project
GET /api/maps/:id -> Load map project
PUT /api/maps/:id -> Update map project
GET /api/symbols -> Get symbol library
```

## Performance Considerations

1. **SVG Optimization**
   - Path simplification for large datasets
   - Viewport culling for complex maps
   - Layer-based rendering

2. **State Management**
   - Immutable updates with Immer
   - Selective re-rendering
   - Canvas virtualization for large maps

3. **Memory Management**
   - Efficient undo/redo with patches
   - Lazy loading of symbol libraries
   - Progressive enhancement

## Accessibility

1. **Keyboard Navigation**
   - Tab-based tool selection
   - Arrow key navigation
   - Zoom/pan keyboard shortcuts

2. **Screen Reader Support**
   - Proper ARIA labels
   - Focus management
   - Alternative text for symbols

## Testing Strategy

1. **Unit Tests**
   - Utility functions
   - Hooks
   - State management

2. **Integration Tests**
   - Tool interactions
   - SVG manipulation
   - Export functionality

3. **E2E Tests**
   - Complete editing workflows
   - Map creation process
   - Cross-browser compatibility

# Map Editor Dependencies

## Core SVG Editor Dependencies

To add the recommended dependencies for the map editor functionality, run:

```bash
cd frontend
npm install zustand immer @headlessui/react @heroicons/react react-colorful react-hotkeys-hook uuid lodash classnames d3-selection d3-zoom
```

## Detailed Package List

### State Management
- **zustand** - Lightweight state management
- **immer** - Immutable state updates

### UI Components
- **@headlessui/react** - Accessible UI primitives
- **@heroicons/react** - Icon library
- **react-colorful** - Color picker components

### Interaction & Events
- **react-hotkeys-hook** - Keyboard shortcuts
- **d3-selection** - DOM manipulation for SVG
- **d3-zoom** - Advanced zoom/pan functionality

### Utilities
- **uuid** - Unique ID generation
- **lodash** - Utility functions
- **classnames** - Conditional CSS classes

## Optional Advanced Dependencies

For more advanced SVG manipulation (add later if needed):
```bash
npm install @react-spring/web react-zoom-pan-pinch
```

## Development Dependencies

For better development experience:
```bash
npm install --save-dev @types/d3-selection @types/d3-zoom @types/uuid @types/lodash
```

## Installation Command

Run this single command to install all recommended dependencies:

```bash
npm install zustand immer @headlessui/react @heroicons/react react-colorful react-hotkeys-hook uuid lodash classnames d3-selection d3-zoom @react-spring/web react-zoom-pan-pinch
```

## After Installation

1. Update your `App.jsx` to include routing to the map editor
2. Test the basic map editor component
3. Start implementing the phase 1 features (SVG canvas setup, layer management, basic selection)

The architecture document (`ARCHITECTURE.md`) provides a complete roadmap for implementation.

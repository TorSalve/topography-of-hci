# Topography Builder - Frontend

A modern React web application for generating topographical maps from 3D models with real-time preview and interactive controls.

## Overview

This frontend provides an intuitive interface for uploading 3D models and generating topographical contour maps. It features real-time slice previews, interactive parameter controls, and seamless integration with the backend processing engines.

## Features

- 🎨 **Modern React UI**: Built with React 18 and Vite for fast development
- 📁 **Drag & Drop Upload**: Easy 3D model file uploading with visual feedback
- 👁️ **Real-time Preview**: Live slice previews at different Z-levels
- ⚙️ **Interactive Controls**: Sliders and inputs for all transformation parameters
- 🎯 **Dual Processing Engines**: Switch between Trimesh (fast) and Blender (quality)
- 📐 **Multiple Formats**: Generate PNG or SVG topographical maps
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- 🎭 **Loading States**: Visual feedback during processing
- 💾 **Download Management**: Easy download of generated maps

## Technology Stack

- **React 18**: Modern React with hooks and concurrent features
- **Vite**: Lightning-fast build tool and dev server
- **CSS Modules**: Scoped styling with modern CSS
- **Fetch API**: RESTful backend communication
- **File API**: Native browser file handling

## Installation

### Prerequisites

- Node.js 16+
- npm or yarn package manager

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Configure environment** (optional):
   ```bash
   cp .env.example .env.local
   ```

3. **Start development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

The application will be available at `http://localhost:5173`

## Usage

### Basic Workflow

1. **Upload 3D Model**: Drag and drop or click to select a 3D file
2. **Adjust Parameters**: Use controls to set rotation, translation, scale
3. **Preview Slices**: View real-time cross-sections at different Z-levels
4. **Choose Engine**: Select Trimesh (fast) or Blender (quality)
5. **Generate Map**: Process the model to create topographical map
6. **Download Result**: Save the generated PNG or SVG file

### Supported File Formats

- **OBJ** (.obj) - Wavefront OBJ files
- **STL** (.stl) - Stereolithography files
- **PLY** (.ply) - Polygon File Format
- **FBX** (.fbx) - Autodesk FBX files

### Parameter Controls

#### Transformation Controls
- **Rotation**: X, Y, Z axis rotation in degrees (-180° to 180°)
- **Translation**: X, Y, Z position offset
- **Scale**: Uniform scaling factor (0.1x to 5.0x)
- **Pivot Point**: Custom rotation center

#### Processing Options
- **Engine**: Trimesh (fast) or Blender (quality)
- **Contour Levels**: Number of contour lines (5-50)
- **Output Format**: PNG or SVG
- **Line Width**: Contour line thickness (SVG only)

## Configuration

### Environment Variables

Create `.env.local` file with:

```env
# Backend API
VITE_API_BASE_URL=http://localhost:8000

# Upload Settings
VITE_MAX_FILE_SIZE=52428800  # 50MB in bytes

# UI Settings
VITE_DEFAULT_ENGINE=trimesh
VITE_DEFAULT_CONTOUR_LEVELS=20
```

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Architecture

```
src/
├── components/            # React components
│   ├── FileUpload/       # File upload component
│   ├── ParameterControls/ # Processing controls
│   ├── PreviewPanel/     # Real-time preview
│   └── ResultsPanel/     # Generated maps
├── services/             # API communication
│   └── api.js           # Backend integration
├── hooks/                # Custom React hooks
├── utils/                # Utility functions
├── styles/               # Global styles
└── App.jsx               # Main application
```

## API Integration

The frontend communicates with the backend through these endpoints:

- `POST /process` - Generate PNG topographical map
- `POST /process-svg` - Generate SVG topographical map  
- `POST /slice-preview` - Real-time slice preview

## Troubleshooting

### Common Issues

**Backend Connection Errors**:
- Check `VITE_API_BASE_URL` in environment variables
- Verify backend server is running on correct port
- Check CORS configuration

**File Upload Issues**:
- Verify file format is supported (.obj, .stl, .ply, .fbx)
- Check file size is under limit
- Ensure backend has proper file handling

**Preview Not Loading**:
- Check network connectivity to backend
- Verify API endpoints are responding
- Clear browser cache and reload

## Deployment

### Production Build

```bash
# Create optimized production build
npm run build

# The dist/ folder contains the production build
```

### Environment Setup

For production, configure:
```env
VITE_API_BASE_URL=https://your-backend-api.com
VITE_MAX_FILE_SIZE=52428800
```

## Browser Support

- Modern browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Mobile: iOS Safari 14+, Chrome Mobile 90+
- Required features: File API, Fetch API, CSS Grid, Flexbox

## License

This project is part of the Topography of HCI research project.

# Backend Folder Structure

## Overview
The backend is organized into logical modules for better maintainability and separation of concerns.

```
app/
├── main.py                 # FastAPI application entry point
├── config.py              # Configuration settings
├── processing.py           # Main processing coordination
├── utils/                  # Shared utility modules
│   ├── __init__.py
│   ├── trimesh_utils.py    # 3D mesh processing utilities
│   ├── argparse_utils.py   # Command line argument parsing
│   └── error_utils.py      # Error handling and subprocess utilities
├── processors/             # Processing engines for different formats
│   ├── __init__.py
│   ├── process_mesh.py     # Blender-based processing
│   ├── process_mesh_trimesh.py  # Trimesh-based processing
│   └── slice_preview.py    # Real-time preview generation
└── tmp/                    # Temporary files (auto-created)
```

## Module Descriptions

### utils/
Contains shared utility functions used across multiple modules:
- **trimesh_utils.py**: 3D mesh operations, transformations, file loading
- **argparse_utils.py**: Standardized command-line argument parsing
- **error_utils.py**: Subprocess error handling and validation

### processors/
Contains different processing engines for generating topographical maps:
- **process_mesh.py**: Blender-based engine for high-quality rendering
- **process_mesh_trimesh.py**: Trimesh-based engine for fast processing
- **slice_preview.py**: Lightweight preview generator for real-time feedback

### Core Files
- **main.py**: FastAPI web server and API endpoints
- **processing.py**: Coordinates between different processing engines
- **config.py**: Application configuration and settings

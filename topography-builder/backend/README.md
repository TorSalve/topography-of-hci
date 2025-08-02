# Topography Builder - Backend

A FastAPI-based backend service for generating topographical maps from 3D models using Blender and Trimesh engines.

## Overview

This backend processes 3D model files (OBJ, STL, PLY, FBX) and generates topographical contour maps in PNG or SVG format. It supports two processing engines:

- **Trimesh Engine**: Fast processing using the Python trimesh library
- **Blender Engine**: High-quality rendering using Blender's advanced mesh processing

## Features

- 🚀 **Dual Processing Engines**: Choose between speed (Trimesh) or quality (Blender)
- 📐 **Multiple Output Formats**: PNG and SVG topographical maps
- 🔄 **Real-time Previews**: Live slice previews at different Z-levels
- ⚙️ **Flexible Transformations**: Rotation, translation, scaling, and pivot controls
- 🎯 **Auto-orientation**: Automatic mesh alignment for optimal topographical views
- 📊 **RESTful API**: Clean API endpoints for web integration
- 🔧 **Configurable Parameters**: Adjustable contour levels, line width, DPI

## Architecture

```
backend/
├── app/
│   ├── main.py                 # FastAPI application
│   ├── config.py              # Configuration settings
│   ├── processing.py           # Main processing coordination
│   ├── utils/                  # Shared utilities
│   │   ├── trimesh_utils.py    # 3D mesh operations
│   │   ├── argparse_utils.py   # Command line parsing
│   │   └── error_utils.py      # Error handling
│   ├── processors/             # Processing engines
│   │   ├── process_mesh.py     # Blender engine
│   │   ├── process_mesh_trimesh.py # Trimesh engine
│   │   └── slice_preview.py    # Preview generator
│   └── tmp/                    # Temporary processing files
├── requirements.txt            # Python dependencies
└── start.sh                   # Startup script
```

## Installation

### Prerequisites

- Python 3.8+
- Blender 3.0+ (for Blender engine)
- Virtual environment (recommended)

### Setup

1. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Blender** (for Blender engine):
   - Download from [blender.org](https://www.blender.org/download/)
   - Ensure `blender` command is available in PATH

4. **Configure environment** (optional):
   ```bash
   cp .env.example .env  # Edit with your settings
   ```

## Usage

### Development Server

```bash
# Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use the startup script
chmod +x start.sh
./start.sh
```

### API Endpoints

#### Process 3D Model (PNG)
```http
POST /process
Content-Type: multipart/form-data

{
  "file": <3D model file>,
  "engine": "trimesh" | "blender",
  "contour_levels": 20,
  "rotation": [x, y, z],
  "translation": [x, y, z],
  "scale": 1.0
}
```

#### Process 3D Model (SVG)
```http
POST /process-svg
Content-Type: multipart/form-data

{
  "file": <3D model file>,
  "contour_levels": 20,
  "line_width": 0.5
}
```

#### Generate Slice Preview
```http
POST /slice-preview
Content-Type: multipart/form-data

{
  "file": <3D model file>,
  "z_level": 0.5,
  "format": "svg" | "png"
}
```

### API Response

```json
{
  "success": true,
  "file_path": "/path/to/generated/map.png",
  "processing_time": 12.34,
  "parameters": {
    "engine": "trimesh",
    "contour_levels": 20,
    "rotation": [0, 0, 0]
  }
}
```

## Configuration

### Environment Variables

Create a `.env` file with:

```env
# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=true

# CORS Settings
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
CORS_CREDENTIALS=true

# Processing Settings
DEFAULT_ENGINE=trimesh
MAX_FILE_SIZE=50MB
TEMP_CLEANUP_INTERVAL=3600

# Blender Settings (if using Blender engine)
BLENDER_EXECUTABLE=blender
```

### Processing Parameters

| Parameter        | Type    | Default   | Description                                |
| ---------------- | ------- | --------- | ------------------------------------------ |
| `engine`         | string  | "trimesh" | Processing engine ("trimesh" or "blender") |
| `contour_levels` | integer | 20        | Number of contour lines                    |
| `rotation`       | array   | [0,0,0]   | Rotation in degrees [x,y,z]                |
| `translation`    | array   | [0,0,0]   | Translation offset [x,y,z]                 |
| `scale`          | float   | 1.0       | Scale factor                               |
| `pivot`          | array   | [0,0,0]   | Rotation pivot point [x,y,z]               |
| `line_width`     | float   | 0.5       | Contour line width (trimesh only)          |
| `dpi`            | integer | 300       | Output resolution (trimesh only)           |

## Supported File Formats

- **OBJ** (.obj) - Wavefront OBJ
- **STL** (.stl) - Stereolithography
- **PLY** (.ply) - Polygon File Format
- **FBX** (.fbx) - Autodesk FBX (Blender engine only)

## Error Handling

The API provides detailed error messages for common issues:

- **File Format Error**: Unsupported 3D file format
- **Processing Error**: Failed mesh processing or rendering
- **Timeout Error**: Processing exceeded time limit (5 minutes)
- **Memory Error**: Insufficient memory for large models
- **Validation Error**: Invalid processing parameters

## Performance Considerations

### Trimesh Engine
- ✅ Fast processing (seconds)
- ✅ Low memory usage
- ✅ SVG output support
- ⚠️ Basic rendering quality

### Blender Engine
- ✅ High-quality rendering
- ✅ Advanced mesh processing
- ✅ Subdivision surface smoothing
- ⚠️ Slower processing (minutes)
- ⚠️ Higher memory usage

## Development

### Project Structure

- **`utils/`**: Shared utility functions for mesh processing, argument parsing, and error handling
- **`processors/`**: Individual processing engines (Blender, Trimesh, Preview)
- **`processing.py`**: Main coordination between different engines
- **`main.py`**: FastAPI application and API endpoints

### Code Quality

```bash
# Format code
black app/

# Lint code
flake8 app/

# Type checking
mypy app/

# Run tests
pytest tests/
```

### Adding New Processors

1. Create processor in `processors/` directory
2. Implement processing function with standard interface
3. Add engine option to `processing.py`
4. Update API documentation

## Troubleshooting

### Common Issues

**Blender not found**:
```bash
# Add Blender to PATH or specify full path
export PATH="/Applications/Blender.app/Contents/MacOS:$PATH"
```

**Memory errors with large models**:
- Use Trimesh engine for large files
- Reduce contour levels
- Scale down model before processing

**Import errors**:
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Logs

Check application logs for detailed error information:
```bash
# View logs in development
tail -f uvicorn.log

# Check processing errors
grep ERROR app/tmp/*.log
```

## API Documentation

When running the server, interactive API documentation is available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## License

This project is part of the Topography of HCI research project.

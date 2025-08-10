# Topography Builder

🚧 **This tool is currently under active development** 🚧

A comprehensive web application that converts 3D scan files (OBJ, FBX, STL, PLY) into topographical maps using multiple processing engines including Blender and Trimesh.

> ⚠️ **Development Status**: This project is in active development. While core functionality works, expect frequent changes, potential bugs, and incomplete features. Use at your own discretion and check back regularly for updates.

## Features

### ✅ Currently Working:
- **Multiple Processing Engines**: Choose between Blender-based processing for high-quality renders or Trimesh for fast processing
- **Preview Generation**: Quick low-resolution previews before full processing
- **Drag & Drop Interface**: Intuitive web interface for file uploads
- **Flexible Output**: Configurable resolution and processing parameters
- **Real-time Feedback**: Processing status updates and error handling
- **RESTful API**: Well-documented API for integration with other tools

### 🚧 Under Development:
- **Enhanced SVG Map Editor**: Advanced topographical editing capabilities
- **Advanced Analysis Tools**: Statistical analysis of topographical features
- **Collaborative Editing**: Multi-user editing and sharing features
- **Integration with Main Website**: Seamless connection to topography-of-hci.dk
- **Batch Processing**: Process multiple files simultaneously
- **Export Options**: Additional output formats and quality settings

## Prerequisites

- Python 3.8+
- Node.js 16+
- Blender (optional, required only for Blender processing engine)

## Project Structure

```
topography-builder/
├── backend/                    # FastAPI backend server
│   ├── app/
│   │   ├── main.py            # FastAPI application entry point
│   │   ├── processing.py      # Main processing orchestration
│   │   ├── processors/        # Processing engines
│   │   │   ├── process_mesh.py         # Blender-based processing
│   │   │   ├── process_mesh_trimesh.py # Trimesh-based processing
│   │   │   └── slice_preview.py        # Preview generation
│   │   └── utils/             # Shared utilities
│   │       ├── trimesh_utils.py        # 3D mesh processing utilities
│   │       ├── argparse_utils.py       # Command-line argument parsing
│   │       └── error_utils.py          # Error handling and subprocess management
│   ├── requirements.txt       # Python dependencies
│   └── start.sh              # Server startup script
└── frontend/                  # React + Vite frontend
    ├── src/                   # Source code
    ├── public/               # Static assets
    ├── package.json          # Node.js dependencies
    └── vite.config.js        # Vite configuration
```

## Configuration

### Backend Configuration

The backend can be configured via environment variables. Copy `.env.example` to `.env` and modify as needed:

```bash
cd topography-builder/backend
cp .env.example .env
```

Key configuration options:
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)
- `MAX_FILE_SIZE`: Maximum upload size in bytes (default: 100MB)
- `BLENDER_EXECUTABLE`: Path to Blender if not in PATH
- `RENDER_RESOLUTION_X/Y`: Output image resolution (default: 1024x1024)

### Frontend Configuration

The frontend can be configured via environment variables. Copy `.env.example` to `.env` and modify as needed:

```bash
cd topography-builder/frontend
cp .env.example .env
```

Key configuration options:
- `VITE_API_PROTOCOL`: API protocol (default: http)
- `VITE_API_HOST`: API host (default: localhost)
- `VITE_API_PORT`: API port (default: 8000)

## Quick Start

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd topography-builder/backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

   Or use the provided script:
   ```bash
   ./start.sh
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd topography-builder/frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

> 🔧 **Note**: As this tool is under development, the interface and workflow may change. Check this README for the latest instructions.

1. Open your browser and go to `http://localhost:5173` (or the URL shown in the terminal)
2. Drag and drop a 3D file (OBJ, FBX, STL, or PLY) onto the upload area
3. Wait for processing to complete
4. The topographical map will automatically download as a PNG file

**Known Issues**:
- Some file formats may not process correctly
- Large files (>50MB) may cause timeouts
- UI may be inconsistent across different browsers
- Error messages may not always be helpful

## API Endpoints

- `GET /` - API status and configuration
- `GET /health` - Health check with detailed system information
- `POST /upload/` - Upload and process 3D file
  - Supports multiple processing engines (Blender, Trimesh)
  - Configurable processing parameters
  - Returns processed topographical map
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation (ReDoc)

### Processing Parameters

The `/upload/` endpoint accepts these processing parameters:
- `engine`: Processing engine (`blender` or `trimesh`)
- `resolution_x`, `resolution_y`: Output image resolution
- `subdivision_levels`: Mesh subdivision for smoother topography
- `preview_only`: Generate low-resolution preview only

## Processing Engines

### Blender Engine
- **Best for**: High-quality renders with advanced materials and lighting
- **Requirements**: Blender installed and accessible via command line
- **Features**: Advanced mesh processing, materials, subdivision surfaces
- **Performance**: Slower but higher quality output

### Trimesh Engine
- **Best for**: Fast processing and programmatic mesh operations
- **Requirements**: Only Python libraries (included in requirements.txt)
- **Features**: Quick mesh processing, automatic orientation, efficient algorithms
- **Performance**: Faster processing, good for previews and batch operations

### Preview Mode
- **Purpose**: Quick low-resolution previews before full processing
- **Speed**: Very fast, typically under 10 seconds
- **Usage**: Enable with `preview_only=true` parameter

## Supported File Formats

- `.obj` - Wavefront OBJ
- `.fbx` - Autodesk FBX
- `.stl` - STereoLithography
- `.ply` - Stanford PLY

## Environment Variables

### Backend (.env)
```bash
# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=true

# File Processing
MAX_FILE_SIZE=104857600  # 100MB

# Blender Settings
RENDER_RESOLUTION_X=1024
RENDER_RESOLUTION_Y=1024
SUBDIVISION_LEVELS=2
```

### Frontend (.env)
```bash
# API Configuration
VITE_API_PROTOCOL=http
VITE_API_HOST=localhost
VITE_API_PORT=8000
```

## Production Deployment

1. Set environment variables for production:
   ```bash
   # Backend
   DEBUG=false
   RELOAD=false
   
   # Frontend
   VITE_API_PROTOCOL=https
   VITE_API_HOST=your-domain.com
   VITE_API_PORT=443
   ```

2. Build the frontend:
   ```bash
   npm run build
   ```

3. Deploy using your preferred method (Docker, PM2, etc.)

## Troubleshooting

### Backend Issues

#### CORS Errors
If you get CORS errors, make sure:
1. The backend server is running on the configured host/port
2. The frontend is configured to connect to the correct backend URL
3. Check the `/health` endpoint for current CORS configuration

#### Blender Not Found (Blender Engine Only)
Make sure Blender is installed and accessible via command line:
```bash
blender --version
```
You can also specify a custom Blender path in the environment variables.

#### Python Dependencies
If you encounter import errors:
```bash
cd backend
pip install -r requirements.txt
```

#### File Processing Errors
- Check the server logs for detailed error messages
- Ensure the file format is supported
- Try using the Trimesh engine for problematic files
- Use preview mode first to test file compatibility

### Frontend Issues

#### File Upload Issues
- Check that your file is under the configured size limit
- Ensure the file format is supported
- Check the browser console for configuration details (in development mode)
- Verify the backend server is running and accessible

#### Build Issues
If the frontend fails to build:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Performance Issues

#### Slow Processing
- Use the Trimesh engine for faster processing
- Generate previews first to verify results
- Reduce resolution for faster processing
- Check system resources (CPU, memory)

#### Large File Handling
- Increase `MAX_FILE_SIZE` in backend configuration
- Consider pre-processing large files to reduce complexity
- Use preview mode to test before full processing

## Development

### Backend Development
See `backend/README.md` for detailed backend development information including:
- Code structure and architecture
- Adding new processing engines
- API development guidelines
- Testing procedures

### Frontend Development
See `frontend/README.md` for detailed frontend development information including:
- Component structure
- State management
- Styling guidelines
- Build optimization

## Contributing

🤝 **We Welcome Contributors!** 

This project is actively seeking contributors to help with development. Whether you're interested in:
- **Frontend Development**: React/Vite interface improvements
- **Backend Development**: FastAPI processing engines
- **3D Processing**: Blender scripting and mesh algorithms  
- **UI/UX Design**: Making the interface more intuitive
- **Documentation**: Improving guides and API docs
- **Testing**: Finding bugs and edge cases

**How to Contribute**:
1. Fork the repository
2. Create a feature branch
3. Make your changes following the existing code style
4. Add tests for new functionality
5. Update documentation as needed
6. Submit a pull request

**Development Guidelines**:
- Check existing issues before starting work
- Discuss major changes in issues first
- Write clear commit messages
- Test your changes thoroughly
- Update relevant documentation

> 💡 **Tip**: Since this is under active development, coordinate with other contributors through GitHub issues to avoid duplicate work.

## Roadmap & Status

### Current Phase: Core Development
- ✅ Basic file processing pipeline
- ✅ API endpoints and documentation
- 🚧 Frontend interface refinement
- 🚧 Error handling improvements

### Next Phase: Feature Enhancement
- 📋 Advanced editing tools
- 📋 Batch processing capabilities
- 📋 Integration with main website
- 📋 Performance optimizations

### Future: Community Features
- 📋 Collaborative editing
- 📋 Cloud processing options
- 📋 Advanced analysis tools

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# Topography Builder

A web application that converts 3D scan files (OBJ, FBX, STL, PLY) into topographical maps using Blender.

## Prerequisites

- Python 3.8+
- Node.js 16+
- Blender (must be accessible via command line as `blender`)

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

1. Open your browser and go to `http://localhost:5173` (or the URL shown in the terminal)
2. Drag and drop a 3D file (OBJ, FBX, STL, or PLY) onto the upload area
3. Wait for processing to complete
4. The topographical map will automatically download as a PNG file

## API Endpoints

- `GET /` - API status and configuration
- `GET /health` - Health check with configuration details
- `POST /upload/` - Upload 3D file for processing
- `GET /docs` - Interactive API documentation

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

### CORS Errors
If you get CORS errors, make sure:
1. The backend server is running on the configured host/port
2. The frontend is configured to connect to the correct backend URL
3. Check the `/health` endpoint for current CORS configuration

### Blender Not Found
Make sure Blender is installed and accessible via command line:
```bash
blender --version
```

### File Upload Issues
- Check that your file is under the configured size limit
- Ensure the file format is supported
- Check the browser console for configuration details (in development mode)

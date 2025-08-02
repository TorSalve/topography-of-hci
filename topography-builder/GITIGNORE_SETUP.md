# .gitignore Files Setup

This project has comprehensive `.gitignore` files at multiple levels to ensure clean repository management.

## Structure

```
topography-of-hci/
├── .gitignore                              # Root project-wide ignores
├── topography-builder/
│   ├── .gitignore                          # Topography builder specific ignores
│   ├── backend/
│   │   └── .gitignore                      # Python/FastAPI backend ignores
│   └── frontend/
│       └── .gitignore                      # React/Vite frontend ignores
└── docs/
    └── .gitignore                          # Jekyll documentation ignores (existing)
```

## Coverage

### Root Project (`.gitignore`)
- General project files
- IDE and editor files
- OS generated files
- Large 3D model files
- Documentation builds
- Local configuration files

### Backend (`topography-builder/backend/.gitignore`)
- Python bytecode and cache files
- Virtual environments
- Package builds and distributions
- Testing and coverage files
- FastAPI/Uvicorn logs
- Temporary processing files
- Generated topographical maps
- Uploaded 3D models
- Blender temporary files
- Configuration with secrets

### Frontend (`topography-builder/frontend/.gitignore`)
- Node.js dependencies
- Build outputs (dist, build)
- Environment variables
- Cache directories
- Testing artifacts
- Framework-specific files
- Hot reload files
- Generated assets
- Uploaded 3D models
- Source maps (optional)

### Topography Builder (`topography-builder/.gitignore`)
- Cross-platform temporary files
- Test models and samples
- Archive files
- Local configurations

## Key Features

1. **Hierarchical**: Each level adds specific ignores relevant to that component
2. **Comprehensive**: Covers Python, Node.js, React, Vite, FastAPI, and general files
3. **Security-focused**: Ignores environment files and configuration with secrets
4. **Performance-oriented**: Ignores large 3D model files and build artifacts
5. **Development-friendly**: Ignores IDE files, cache, and temporary files

## 3D Model Files

All `.gitignore` files specifically exclude common 3D model formats:
- `.obj`, `.stl`, `.ply`, `.fbx`, `.blend`, `.3ds`, `.dae`, `.x3d`, `.gltf`, `.glb`

This prevents accidentally committing large model files while allowing the application to process them.

## Environment Files

All levels ignore environment files (`.env`, `.env.local`, etc.) to prevent accidental commits of sensitive configuration data.

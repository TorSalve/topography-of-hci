from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.processing import process_3d_scan, process_3d_scan_svg
from app.config import server_config
from app.slice_preview import generate_slice_preview, render_slice_to_svg
import os
import tempfile
from typing import Optional

app = FastAPI(
    title="Topography Builder API",
    description="Convert 3D scan files into topographical maps using Blender",
    version="1.0.0",
)

# Add CORS middleware with centralized configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=server_config.CORS_ORIGINS,
    allow_credentials=server_config.CORS_CREDENTIALS,
    allow_methods=server_config.CORS_METHODS,
    allow_headers=server_config.CORS_HEADERS,
)


@app.get("/")
async def root():
    return {
        "message": "Topography Builder API is running",
        "version": "1.0.0",
        "server": {
            "host": server_config.HOST,
            "port": server_config.PORT,
        },
        "endpoints": {
            "health": "/health",
            "upload": "/upload/",
            "slice_preview": "/slice-preview/",
            "docs": "/docs",
        },
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "configuration": {
            "cors_origins": server_config.CORS_ORIGINS,
            "supported_formats": [".obj", ".fbx", ".stl", ".ply"],
        },
    }


@app.post("/slice-preview/")
async def slice_preview(
    file: UploadFile = File(...),
    z_level: float = Form(...),
    rotation_x: float = Form(0.0),
    rotation_y: float = Form(0.0),
    rotation_z: float = Form(0.0),
    translation_x: float = Form(0.0),
    translation_y: float = Form(0.0),
    translation_z: float = Form(0.0),
    pivot_x: float = Form(0.0),
    pivot_y: float = Form(0.0),
    pivot_z: float = Form(0.0),
    scale: float = Form(1.0),
):
    """Generate a lightweight slice preview at specified Z level"""

    try:
        # Validate file type
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in [".obj", ".fbx", ".stl", ".ply"]:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: {file_ext}. Supported formats: .obj, .fbx, .stl, .ply",
            )

        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
            temp_file.write(await file.read())
            temp_path = temp_file.name

        try:
            # Generate slice preview
            slice_data = generate_slice_preview(
                temp_path,
                z_level,
                rotation_x=rotation_x,
                rotation_y=rotation_y,
                rotation_z=rotation_z,
                translation_x=translation_x,
                translation_y=translation_y,
                translation_z=translation_z,
                pivot_x=pivot_x,
                pivot_y=pivot_y,
                pivot_z=pivot_z,
                scale=scale,
            )

            # Generate SVG representation
            svg_data = render_slice_to_svg(slice_data, size=200)

            # Return JSON response with slice data and SVG
            return JSONResponse(
                {
                    "success": True,
                    "svg": svg_data,
                    "z_bounds": slice_data["z_bounds"],
                    "z_level": slice_data["z_level"],
                    "line_count": slice_data["line_count"],
                    "error": slice_data.get("error", None),
                }
            )

        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating slice preview: {str(e)}"
        )


@app.post("/upload/")
async def upload_scan(
    file: UploadFile = File(...),
    contour_levels: Optional[int] = Form(20),
    rotation_x: Optional[float] = Form(0.0),
    rotation_y: Optional[float] = Form(0.0),
    rotation_z: Optional[float] = Form(0.0),
    translation_x: Optional[float] = Form(0.0),
    translation_y: Optional[float] = Form(0.0),
    translation_z: Optional[float] = Form(0.0),
    pivot_x: Optional[float] = Form(0.0),
    pivot_y: Optional[float] = Form(0.0),
    pivot_z: Optional[float] = Form(0.0),
    scale: Optional[float] = Form(1.0),
    engine: Optional[str] = Form("trimesh"),
):
    try:
        # Validate file format
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No filename provided. Please select a valid 3D file.",
            )

        file_ext = os.path.splitext(file.filename.lower())[1]
        supported_formats = [".obj", ".fbx", ".stl", ".ply"]

        if file_ext not in supported_formats:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{file_ext}'. Supported formats: {', '.join(supported_formats)}",
            )

        # Validate parameters
        if contour_levels < 5 or contour_levels > 50:
            raise HTTPException(
                status_code=400, detail="Contour levels must be between 5 and 50."
            )

        if scale <= 0 or scale > 10:
            raise HTTPException(
                status_code=400, detail="Scale must be between 0.1 and 10."
            )

        # Validate engine
        if engine not in ["trimesh", "blender"]:
            raise HTTPException(
                status_code=400, detail="Engine must be either 'trimesh' or 'blender'."
            )

        # Process the file with parameters
        processing_params = {
            "contour_levels": contour_levels,
            "rotation": (rotation_x, rotation_y, rotation_z),
            "translation": (translation_x, translation_y, translation_z),
            "pivot": (pivot_x, pivot_y, pivot_z),
            "scale": scale,
        }

        output_path = process_3d_scan(
            file.file, file.filename, processing_params, engine=engine
        )

        # Create a custom FileResponse that cleans up after sending
        class CleanupFileResponse(FileResponse):
            def __init__(self, *args, **kwargs):
                self.cleanup_path = kwargs.pop("cleanup_path", None)
                super().__init__(*args, **kwargs)

            async def __call__(self, scope, receive, send):
                try:
                    return await super().__call__(scope, receive, send)
                finally:
                    # Clean up the output file after it's sent
                    if self.cleanup_path and os.path.exists(self.cleanup_path):
                        os.remove(self.cleanup_path)

        return CleanupFileResponse(
            output_path,
            media_type="image/png",
            filename="topomap.png",
            cleanup_path=output_path,
        )

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise

    except ValueError as e:
        # Handle file processing errors
        error_msg = str(e)
        if "Could not import" in error_msg:
            raise HTTPException(
                status_code=400,
                detail=f"File import failed: {error_msg}. Please check if your file is valid and not corrupted.",
            )
        elif "No objects were imported" in error_msg:
            raise HTTPException(
                status_code=400,
                detail="No 3D objects found in the uploaded file. Please ensure your file contains valid 3D geometry.",
            )
        else:
            raise HTTPException(
                status_code=400, detail=f"File processing error: {error_msg}"
            )

    except RuntimeError as e:
        # Handle Blender processing errors
        error_msg = str(e)
        if "Blender processing failed" in error_msg:
            raise HTTPException(
                status_code=500,
                detail="Blender processing failed. This could be due to complex geometry or insufficient system resources. Try simplifying your 3D model or contact support.",
            )
        else:
            raise HTTPException(
                status_code=500, detail=f"Processing error: {error_msg}"
            )

    except FileNotFoundError as e:
        # Handle missing files or Blender not found
        raise HTTPException(
            status_code=500,
            detail="Blender is not installed or not found in system PATH. Please ensure Blender is properly installed.",
        )

    except PermissionError as e:
        # Handle file permission issues
        raise HTTPException(
            status_code=500,
            detail="File system permission error. Please check server file permissions or contact support.",
        )

    except Exception as e:
        # Catch-all for unexpected errors
        import traceback

        error_details = traceback.format_exc()
        print(f"Unexpected error during file processing: {error_details}")

        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during processing: {str(e)}. Please try again or contact support if the problem persists.",
        )


@app.post("/generate-map-svg")
async def generate_map_svg(
    file: UploadFile = File(...),
    contour_levels: int = Form(20),
    rotation_x: float = Form(0.0),
    rotation_y: float = Form(0.0),
    rotation_z: float = Form(0.0),
    translation_x: float = Form(0.0),
    translation_y: float = Form(0.0),
    translation_z: float = Form(0.0),
    pivot_x: float = Form(0.0),
    pivot_y: float = Form(0.0),
    pivot_z: float = Form(0.0),
    scale: float = Form(1.0),
    line_width: float = Form(1.0),
    engine: str = Form("trimesh"),
):
    """
    Generate an SVG topographical map from a 3D model file.
    """
    try:
        # Validate file format
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")

        allowed_extensions = [".obj", ".stl", ".ply", ".fbx"]
        file_ext = file.filename.lower().split(".")[-1] if "." in file.filename else ""

        if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format. Allowed formats: {', '.join(allowed_extensions)}",
            )

        # Validate contour levels
        if contour_levels < 5 or contour_levels > 100:
            raise HTTPException(
                status_code=400,
                detail="Contour levels must be between 5 and 100",
            )

        # Process the file with parameters
        processing_params = {
            "contour_levels": contour_levels,
            "rotation": (rotation_x, rotation_y, rotation_z),
            "translation": (translation_x, translation_y, translation_z),
            "pivot": (pivot_x, pivot_y, pivot_z),
            "scale": scale,
            "line_width": line_width,
        }

        output_path = process_3d_scan_svg(
            file.file, file.filename, processing_params, engine=engine
        )

        # Create a custom FileResponse that cleans up after sending
        class CleanupFileResponse(FileResponse):
            def __init__(self, *args, **kwargs):
                self.cleanup_path = kwargs.pop("cleanup_path", None)
                super().__init__(*args, **kwargs)

            async def __call__(self, scope, receive, send):
                try:
                    return await super().__call__(scope, receive, send)
                finally:
                    # Clean up the output file after it's sent
                    if self.cleanup_path and os.path.exists(self.cleanup_path):
                        os.remove(self.cleanup_path)

        return CleanupFileResponse(
            output_path,
            media_type="image/svg+xml",
            filename="topomap.svg",
            cleanup_path=output_path,
        )

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise

    except ValueError as e:
        # Handle file processing errors
        error_msg = str(e)
        if "Could not import" in error_msg:
            raise HTTPException(
                status_code=400,
                detail=f"File import failed: {error_msg}. Please check if your file is valid and not corrupted.",
            )
        elif "No objects were imported" in error_msg:
            raise HTTPException(
                status_code=400,
                detail="No 3D objects found in the uploaded file. Please ensure your file contains valid 3D geometry.",
            )
        else:
            raise HTTPException(
                status_code=400, detail=f"File processing error: {error_msg}"
            )

    except RuntimeError as e:
        # Handle processing errors
        error_msg = str(e)
        if "SVG processing failed" in error_msg:
            raise HTTPException(
                status_code=500,
                detail="SVG processing failed. This could be due to complex geometry or insufficient system resources. Try simplifying your 3D model or contact support.",
            )
        else:
            raise HTTPException(
                status_code=500, detail=f"Processing error: {error_msg}"
            )

    except FileNotFoundError as e:
        # Handle missing files
        raise HTTPException(
            status_code=500,
            detail="Processing dependencies not found. Please contact support.",
        )

    except PermissionError as e:
        # Handle file permission issues
        raise HTTPException(
            status_code=500,
            detail="File system permission error. Please check server file permissions or contact support.",
        )

    except Exception as e:
        # Catch-all for unexpected errors
        import traceback

        error_details = traceback.format_exc()
        print(f"Unexpected error during SVG file processing: {error_details}")

        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during SVG processing: {str(e)}. Please try again or contact support if the problem persists.",
        )

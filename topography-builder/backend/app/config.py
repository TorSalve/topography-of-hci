"""
Configuration settings for the Topography Builder backend server.
Centralized configuration for easy deployment and environment management.
"""

import os
from typing import List


class ServerConfig:
    """Server configuration settings"""

    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    RELOAD: bool = os.getenv("RELOAD", "True").lower() == "true"

    # CORS settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # Add any environment-specific origins
    if os.getenv("CORS_ORIGINS"):
        CORS_ORIGINS.extend(os.getenv("CORS_ORIGINS").split(","))

    CORS_METHODS: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    CORS_HEADERS: List[str] = ["*"]
    CORS_CREDENTIALS: bool = True


class FileConfig:
    """File processing configuration"""

    # Supported file formats
    SUPPORTED_FORMATS: List[str] = [".obj", ".fbx", ".stl", ".ply"]

    # File size limits (in bytes)
    MAX_FILE_SIZE: int = int(
        os.getenv("MAX_FILE_SIZE", str(100 * 1024 * 1024))
    )  # 100MB default

    # Output settings
    OUTPUT_FORMAT: str = "PNG"
    OUTPUT_FILENAME: str = "topomap.png"


class BlenderConfig:
    """Blender processing configuration"""

    # Blender executable path (can be overridden via environment)
    BLENDER_EXECUTABLE: str = os.getenv("BLENDER_EXECUTABLE", "blender")

    # Processing settings
    RENDER_RESOLUTION_X: int = int(os.getenv("RENDER_RESOLUTION_X", "1024"))
    RENDER_RESOLUTION_Y: int = int(os.getenv("RENDER_RESOLUTION_Y", "1024"))
    SUBDIVISION_LEVELS: int = int(os.getenv("SUBDIVISION_LEVELS", "2"))


# Export instances for easy import
server_config = ServerConfig()
file_config = FileConfig()
blender_config = BlenderConfig()

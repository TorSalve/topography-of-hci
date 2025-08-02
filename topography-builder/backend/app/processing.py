import subprocess
import os
import uuid
import sys
from .utils.argparse_utils import build_command_args_from_params
from .utils.error_utils import run_subprocess_with_timeout, validate_output_file

# Define your local temp folder
TEMP_FOLDER = os.path.join(os.path.dirname(__file__), "tmp")
os.makedirs(TEMP_FOLDER, exist_ok=True)


def _get_file_extension(filename):
    """Determine the file extension from filename or return default."""
    if filename:
        _, ext = os.path.splitext(filename.lower())
        if ext not in [".obj", ".fbx", ".stl", ".ply"]:
            ext = ".obj"  # Default fallback
    else:
        ext = ".obj"  # Default fallback
    return ext


def _save_uploaded_file(file_obj, input_path):
    """Save the uploaded file to the specified path."""
    with open(input_path, "wb") as f:
        f.write(file_obj.read())


def _run_blender_processing(input_path, output_path, processing_params=None):
    """Run Blender to process the 3D mesh and generate topographic map."""
    blender_script_path = os.path.join(
        os.path.dirname(__file__), "processors", "process_mesh.py"
    )

    # Build command arguments
    cmd_args = [
        "blender",
        "--background",
        "--python",
        blender_script_path,
        "--",
        input_path,
        output_path,
    ]

    # Add processing parameters
    if processing_params:
        cmd_args.extend(
            [
                "--contour-levels",
                str(processing_params.get("contour_levels", 20)),
                "--rotation-x",
                str(processing_params.get("rotation", (0, 0, 0))[0]),
                "--rotation-y",
                str(processing_params.get("rotation", (0, 0, 0))[1]),
                "--rotation-z",
                str(processing_params.get("rotation", (0, 0, 0))[2]),
                "--translation-x",
                str(processing_params.get("translation", (0, 0, 0))[0]),
                "--translation-y",
                str(processing_params.get("translation", (0, 0, 0))[1]),
                "--translation-z",
                str(processing_params.get("translation", (0, 0, 0))[2]),
                "--pivot-x",
                str(processing_params.get("pivot", (0, 0, 0))[0]),
                "--pivot-y",
                str(processing_params.get("pivot", (0, 0, 0))[1]),
                "--pivot-z",
                str(processing_params.get("pivot", (0, 0, 0))[2]),
                "--scale",
                str(processing_params.get("scale", 1.0)),
            ]
        )

    result, stdout_text, stderr_text = run_subprocess_with_timeout(
        cmd_args, timeout=300, engine_name="Blender"
    )


def _run_trimesh_processing(input_path, output_path, processing_params=None):
    """Run trimesh-based processing to generate topographic map."""

    trimesh_script_path = os.path.join(
        os.path.dirname(__file__), "processors", "process_mesh_trimesh.py"
    )

    # Build command arguments
    cmd_args = [
        sys.executable,  # Use the same Python interpreter
        trimesh_script_path,
        input_path,
        output_path,
    ]

    # Add processing parameters
    if processing_params:
        cmd_args = build_command_args_from_params(processing_params, cmd_args)

    result, stdout_text, stderr_text = run_subprocess_with_timeout(
        cmd_args, timeout=300, engine_name="Trimesh"
    )


def _cleanup_temp_file(file_path):
    """Clean up temporary file if it exists."""
    if os.path.exists(file_path):
        os.remove(file_path)


def _run_trimesh_processing_svg(input_path, output_path, processing_params=None):
    """Run trimesh-based processing to generate SVG topographic map."""

    # Import the trimesh processing functions directly
    sys.path.append(os.path.dirname(__file__))
    from .utils.trimesh_utils import load_and_transform_mesh
    from .processors.process_mesh_trimesh import (
        generate_contour_lines,
        render_contour_map_svg,
    )

    try:
        # Load and transform the mesh with processing parameters
        mesh = load_and_transform_mesh(input_path, processing_params or {})

        # Generate contour lines
        contour_lines = generate_contour_lines(
            mesh,
            processing_params.get("contour_levels", 20) if processing_params else 20,
        )

        # Render to SVG
        render_contour_map_svg(
            contour_lines,
            output_path,
            mesh.bounds,
            line_width=(
                processing_params.get("line_width", 1.0) if processing_params else 1.0
            ),
        )

    except Exception as e:
        raise RuntimeError(f"SVG processing failed: {str(e)}")


def process_3d_scan_svg(file_obj, filename, processing_params=None, engine="trimesh"):
    """
    Process a 3D scan file and generate an SVG topographical map.

    Args:
        file_obj: File object containing the 3D data
        filename: Original filename of the uploaded file
        processing_params: Dict containing processing parameters
        engine: Processing engine to use ('trimesh' only for SVG)

    Returns:
        str: Path to the generated SVG file
    """
    # Generate unique filename
    uid = str(uuid.uuid4())

    # Determine file extension
    ext = _get_file_extension(filename)

    # Create temporary file paths
    input_path = os.path.join(TEMP_FOLDER, f"{uid}_input{ext}")
    output_path = os.path.join(TEMP_FOLDER, f"{uid}_topographical_map.svg")

    try:
        # Save the uploaded file
        _save_uploaded_file(file_obj, input_path)

        # Only trimesh engine supports SVG generation
        if engine != "trimesh":
            raise ValueError("SVG generation is only supported with trimesh engine")

        # Run SVG processing
        _run_trimesh_processing_svg(input_path, output_path, processing_params)

        # Verify output file was created
        validate_output_file(output_path, "SVG processing")

        print(f"SVG processing completed successfully: {output_path}")
        return output_path

    except Exception as e:
        # Clean up files on error
        for path in [input_path, output_path]:
            if os.path.exists(path):
                try:
                    os.remove(path)
                except:
                    pass

        raise
    finally:
        # Clean up input file (but keep output for download)
        if os.path.exists(input_path):
            try:
                os.remove(input_path)
            except:
                pass


def process_3d_scan(file_obj, filename, processing_params=None, engine="trimesh"):
    """Process a 3D scan file and generate a topographic map.

    Args:
        file_obj: The uploaded file object
        filename: Original filename
        processing_params: Dict with processing parameters
        engine: Processing engine to use ("trimesh" or "blender")
    """
    # Generate unique filenames
    uid = str(uuid.uuid4())
    ext = _get_file_extension(filename)

    input_path = os.path.join(TEMP_FOLDER, f"{uid}{ext}")
    output_path = os.path.join(TEMP_FOLDER, f"{uid}_topographical_map.png")

    try:
        # Save uploaded file
        _save_uploaded_file(file_obj, input_path)

        # Verify input file was saved correctly
        if not os.path.exists(input_path) or os.path.getsize(input_path) == 0:
            raise ValueError("Failed to save uploaded file or file is empty.")

        # Process with selected engine
        if engine == "trimesh":
            _run_trimesh_processing(input_path, output_path, processing_params)
        elif engine == "blender":
            _run_blender_processing(input_path, output_path, processing_params)
        else:
            raise ValueError(f"Unsupported processing engine: {engine}")

        # Verify output file was created
        validate_output_file(output_path, engine.title())

        # Return the path to the generated topographic map
        return output_path

    except Exception as e:
        # Clean up input file on any error
        _cleanup_temp_file(input_path)
        # Re-raise the exception to be handled by the API
        raise

    finally:
        # Always clean up the temporary input file
        _cleanup_temp_file(input_path)

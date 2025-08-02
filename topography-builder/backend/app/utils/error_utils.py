#!/usr/bin/env python3
"""
Common error handling utilities for backend processing.
"""

import subprocess
import sys


def handle_subprocess_error(result, engine_name, stderr_text):
    """
    Handle common subprocess errors with standardized error messages.

    Args:
        result: subprocess.CompletedProcess result
        engine_name: Name of the processing engine (e.g., "Blender", "Trimesh")
        stderr_text: Decoded stderr output

    Raises:
        ValueError: For file format or content issues
        RuntimeError: For processing failures
        PermissionError: For file system permission issues
    """
    # Parse common errors for better user messages
    if (
        "Could not import" in stderr_text
        or "Could not load a valid mesh" in stderr_text
    ):
        raise ValueError(
            f"Failed to import 3D file. The file may be corrupted or in an unsupported format variant."
        )
    elif "No objects were imported" in stderr_text:
        raise ValueError(
            "The uploaded file appears to be empty or contains no valid 3D geometry."
        )
    elif "No contour lines were generated" in stderr_text:
        raise ValueError(
            "No contour lines could be generated from this 3D model. Try adjusting the orientation or scale."
        )
    elif "AttributeError" in stderr_text and "StructRNA" in stderr_text:
        raise RuntimeError(
            "Blender internal error occurred during processing. This may be due to complex geometry."
        )
    elif "ImportError" in stderr_text and (
        "trimesh" in stderr_text or "matplotlib" in stderr_text
    ):
        raise RuntimeError(
            f"{engine_name} dependencies not available. Please install required libraries."
        )
    elif "MemoryError" in stderr_text or "memory" in stderr_text.lower():
        raise RuntimeError(
            "Insufficient memory to process this file. Try uploading a smaller or less complex 3D model."
        )
    elif "permission" in stderr_text.lower():
        raise PermissionError("File system permission error during processing.")
    else:
        # Log detailed error for debugging
        print(f"{engine_name} error details: {stderr_text}")
        raise RuntimeError(
            f"{engine_name} processing failed with return code {result.returncode}. Check server logs for details."
        )


def run_subprocess_with_timeout(cmd_args, timeout=300, engine_name="Processing"):
    """
    Run subprocess with standardized error handling and timeout.

    Args:
        cmd_args: Command arguments list
        timeout: Timeout in seconds (default: 5 minutes)
        engine_name: Name of the processing engine for error messages

    Returns:
        subprocess.CompletedProcess: The completed process result

    Raises:
        RuntimeError: For timeout or missing executable
        Various: From handle_subprocess_error for processing failures
    """
    try:
        result = subprocess.run(
            cmd_args,
            capture_output=True,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError(
            f"{engine_name} processing timed out after {timeout//60} minutes. The file may be too complex or large."
        )
    except FileNotFoundError:
        if "blender" in cmd_args[0].lower():
            raise FileNotFoundError(
                "Blender executable not found. Please ensure Blender is installed and in your system PATH."
            )
        else:
            raise FileNotFoundError(
                f"{engine_name} executable not found or script missing."
            )

    # Decode output for error analysis
    stdout_text = result.stdout.decode("utf-8", errors="replace")
    stderr_text = result.stderr.decode("utf-8", errors="replace")

    if result.returncode != 0:
        handle_subprocess_error(result, engine_name, stderr_text)

    return result, stdout_text, stderr_text


def validate_output_file(output_path, engine_name="Processing"):
    """
    Validate that output file was created and is not empty.

    Args:
        output_path: Path to the output file
        engine_name: Name of the processing engine for error messages

    Raises:
        RuntimeError: If file doesn't exist or is empty
    """
    import os

    if not os.path.exists(output_path):
        raise RuntimeError(
            f"{engine_name} processing completed but no output file was generated. This may indicate an issue with the 3D geometry."
        )

    if os.path.getsize(output_path) == 0:
        raise RuntimeError(
            f"{engine_name} generated an empty output file. The 3D model may not contain valid geometry for contour generation."
        )

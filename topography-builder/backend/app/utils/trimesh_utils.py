#!/usr/bin/env python3
"""
Shared utilities for trimesh-based processing.
Contains common functions used across multiple trimesh modules.
"""

import trimesh
import numpy as np


def normalize_rotation(angle):
    """Normalize angle to [-180, 180] range"""
    angle = angle % 360
    if angle > 180:
        angle -= 360
    elif angle < -180:
        angle += 360
    return angle


def auto_orient_mesh_for_topography(mesh):
    """
    Automatically orient the mesh for optimal topographical mapping.

    This function analyzes the mesh and rotates it so that the longest
    dimension (typically the "height" of the object) aligns with the Z-axis,
    ensuring the top-down view captures the most interesting contours.
    """
    # Get the bounding box dimensions
    bounds = mesh.bounds
    dimensions = bounds[1] - bounds[0]  # [width, depth, height]

    # Find which axis has the largest extent
    max_dimension_axis = np.argmax(dimensions)

    # If the longest dimension is already along Z, no rotation needed
    if max_dimension_axis == 2:
        return mesh

    # Apply rotation based on which axis is longest
    if max_dimension_axis == 0:  # X is longest
        # Apply 90° X rotation for proper topographical view
        rotation_matrix = trimesh.transformations.rotation_matrix(
            np.radians(90), [1, 0, 0]
        )
        mesh.apply_transform(rotation_matrix)
    elif max_dimension_axis == 1:  # Y is longest
        # Rotate around X to align Y with Z
        rotation_matrix = trimesh.transformations.rotation_matrix(
            np.radians(90), [1, 0, 0]
        )
        mesh.apply_transform(rotation_matrix)

    return mesh


def apply_transformations(
    mesh,
    rotation_x=0,
    rotation_y=0,
    rotation_z=0,
    translation_x=0,
    translation_y=0,
    translation_z=0,
    pivot_x=0,
    pivot_y=0,
    pivot_z=0,
    scale=1.0,
    skip_auto_orient=False,
):
    """Apply transformations to the mesh"""

    # Apply auto-orientation unless explicitly skipped
    if not skip_auto_orient:
        mesh = auto_orient_mesh_for_topography(mesh)

    # Center the mesh
    mesh.vertices -= mesh.centroid

    # Apply pivot translation
    pivot_point = np.array([pivot_x, pivot_y, pivot_z])
    mesh.vertices -= pivot_point

    # Apply user-specified rotations (convert degrees to radians)
    if rotation_x != 0:
        rotation_matrix_x = trimesh.transformations.rotation_matrix(
            np.radians(rotation_x), [1, 0, 0]
        )
        mesh.apply_transform(rotation_matrix_x)

    if rotation_y != 0:
        rotation_matrix_y = trimesh.transformations.rotation_matrix(
            np.radians(rotation_y), [0, 1, 0]
        )
        mesh.apply_transform(rotation_matrix_y)

    if rotation_z != 0:
        rotation_matrix_z = trimesh.transformations.rotation_matrix(
            np.radians(rotation_z), [0, 0, 1]
        )
        mesh.apply_transform(rotation_matrix_z)

    # Apply scale
    if scale != 1.0:
        mesh.apply_scale(scale)

    # Apply translation
    translation = np.array([translation_x, translation_y, translation_z])
    mesh.vertices += translation

    return mesh


def load_mesh_file(input_path):
    """
    Load a 3D mesh file with consistent error handling.

    Args:
        input_path: Path to the input 3D file

    Returns:
        trimesh.Trimesh: The loaded mesh
    """
    mesh = trimesh.load(input_path)

    # Handle different mesh types
    if isinstance(mesh, trimesh.Scene):
        if mesh.geometry:
            mesh = list(mesh.geometry.values())[0]
        else:
            raise ValueError("Could not load a valid mesh from the file")
    elif not isinstance(mesh, trimesh.Trimesh):
        raise ValueError("Could not load a valid mesh from the file")

    return mesh


def load_and_transform_mesh(input_path, processing_params=None):
    """
    Load a 3D mesh file and apply transformations based on processing parameters.

    Args:
        input_path: Path to the input 3D file
        processing_params: Dict containing transformation parameters

    Returns:
        trimesh.Trimesh: The loaded and transformed mesh
    """
    if processing_params is None:
        processing_params = {}

    # Load the mesh
    mesh = load_mesh_file(input_path)

    # Apply auto-orientation for topographical mapping
    mesh = auto_orient_mesh_for_topography(mesh)

    # Apply transformations if specified
    rotation = processing_params.get("rotation", (0, 0, 0))
    translation = processing_params.get("translation", (0, 0, 0))
    pivot = processing_params.get("pivot", (0, 0, 0))
    scale = processing_params.get("scale", 1.0)

    mesh = apply_transformations(
        mesh,
        rotation_x=rotation[0],
        rotation_y=rotation[1],
        rotation_z=rotation[2],
        translation_x=translation[0],
        translation_y=translation[1],
        translation_z=translation[2],
        pivot_x=pivot[0],
        pivot_y=pivot[1],
        pivot_z=pivot[2],
        scale=scale,
        skip_auto_orient=True,  # Already done above
    )

    return mesh

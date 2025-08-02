#!/usr/bin/env python3
"""
Lightweight slice preview generator using trimesh.
Optimized for real-time Z-level previews.

This module generates topographical map previews from a top-down perspective,
as if viewing the model from directly above (perpendicular to the Z=0 plane).
"""

import trimesh
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.collections import LineCollection
import io
import base64
from pathlib import Path
from ..utils.trimesh_utils import (
    normalize_rotation,
    auto_orient_mesh_for_topography,
    apply_transformations,
    load_mesh_file,
)


def generate_slice_preview(
    file_path,
    z_level=0,
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
):
    """Generate a single slice preview at specified Z level for real-time preview"""

    # Load mesh
    try:
        mesh = load_mesh_file(file_path)

    except Exception as e:
        return {
            "slice_lines": [],
            "z_bounds": {"min": 0, "max": 0},
            "mesh_bounds": [[0, 0, 0], [0, 0, 0]],
            "z_level": z_level,
            "line_count": 0,
            "error": f"Failed to load mesh: {str(e)}",
        }

    # Apply transformations
    mesh = apply_transformations(
        mesh,
        rotation_x,
        rotation_y,
        rotation_z,
        translation_x,
        translation_y,
        translation_z,
        pivot_x,
        pivot_y,
        pivot_z,
        scale,
    )

    # Get mesh bounds for context
    z_min, z_max = mesh.bounds[0][2], mesh.bounds[1][2]
    print(f"Mesh Z bounds: {z_min:.3f} to {z_max:.3f}")
    print(f"Requested Z level: {z_level:.3f}")

    # Check if Z level is within bounds
    if z_level < z_min or z_level > z_max:
        print(
            f"Warning: Z level {z_level:.3f} is outside mesh bounds [{z_min:.3f}, {z_max:.3f}]"
        )

    # Generate slice at Z level - this creates a horizontal cross-section
    # which is then viewed from above for a proper topographical perspective
    try:
        plane_origin = [0, 0, z_level]
        plane_normal = [0, 0, 1]  # Horizontal slice plane

        slice_2d = mesh.section(plane_origin=plane_origin, plane_normal=plane_normal)
        print(f"Slice result type: {type(slice_2d)}")

        slice_lines = []

        if slice_2d is not None:
            # print(f"Slice2D attributes: {dir(slice_2d)}")
            # Convert to 2D paths - these represent the contour lines as seen from above
            if hasattr(slice_2d, "entities"):
                # print(f"Found {len(slice_2d.entities)} entities")
                # slice_2d is a Path2D object
                for i, entity in enumerate(slice_2d.entities):
                    if hasattr(entity, "points"):
                        # Get the actual coordinates
                        points = slice_2d.vertices[entity.points]
                        # print(f"Entity {i}: {len(points)} points")
                        if len(points) > 1:
                            slice_lines.append(points)
            elif hasattr(slice_2d, "vertices"):
                # print(f"Found vertices directly: {len(slice_2d.vertices)} points")
                # slice_2d has vertices directly
                if len(slice_2d.vertices) > 1:
                    slice_lines.append(slice_2d.vertices)
        else:
            print("Slice result is None - no intersection at this Z level")

        print(f"Total slice lines found: {len(slice_lines)}")

        return {
            "slice_lines": slice_lines,
            "z_bounds": {"min": z_min, "max": z_max},
            "mesh_bounds": mesh.bounds.tolist(),
            "z_level": z_level,
            "line_count": len(slice_lines),
        }

    except Exception as e:
        return {
            "slice_lines": [],
            "z_bounds": {"min": z_min, "max": z_max},
            "mesh_bounds": mesh.bounds.tolist(),
            "z_level": z_level,
            "line_count": 0,
            "error": str(e),
        }


def render_slice_to_svg(slice_data, size=200):
    """Render slice lines to compact SVG format - top-down view"""

    slice_lines = slice_data["slice_lines"]
    mesh_bounds = np.array(slice_data["mesh_bounds"])

    if not slice_lines:
        # Return empty SVG if no lines
        return f"""<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" xmlns="http://www.w3.org/2000/svg">
            <rect width="{size}" height="{size}" fill="white" stroke="#ccc" stroke-width="1"/>
            <text x="{size//2}" y="{size//2}" text-anchor="middle" fill="#999" font-size="12">No slice</text>
        </svg>"""

    # Calculate bounds from X,Y coordinates only (top-down view)
    x_min, y_min = mesh_bounds[0][:2]
    x_max, y_max = mesh_bounds[1][:2]

    x_range = x_max - x_min
    y_range = y_max - y_min
    max_range = max(x_range, y_range)

    # Add padding
    padding = max_range * 0.1
    x_min -= padding
    x_max += padding
    y_min -= padding
    y_max += padding

    total_range = max(x_max - x_min, y_max - y_min)

    # Start SVG
    svg_lines = [
        f'<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" xmlns="http://www.w3.org/2000/svg">'
    ]
    svg_lines.append(
        f'<rect width="{size}" height="{size}" fill="white" stroke="#ccc" stroke-width="1"/>'
    )

    # Draw slice lines as seen from above (topographical view)
    for line_points in slice_lines:
        if len(line_points) > 1:
            # Convert coordinates to SVG space - use only X,Y coordinates for top-down view
            path_data = "M"
            for i, point in enumerate(line_points):
                # Project onto XY plane (top-down view)
                x = ((point[0] - x_min) / total_range) * (size - 20) + 10
                y = size - (
                    ((point[1] - y_min) / total_range) * (size - 20) + 10
                )  # Flip Y for SVG coordinate system

                if i == 0:
                    path_data += f" {x:.1f},{y:.1f}"
                else:
                    path_data += f" L {x:.1f},{y:.1f}"

            svg_lines.append(
                f'<path d="{path_data}" stroke="black" stroke-width="1.5" fill="none" stroke-linecap="round"/>'
            )

    svg_lines.append("</svg>")

    return "\n".join(svg_lines)


def render_slice_to_base64_png(slice_data, size=200):
    """Render slice lines to base64 encoded PNG for faster transfer"""

    slice_lines = slice_data["slice_lines"]
    mesh_bounds = np.array(slice_data["mesh_bounds"])

    # Create figure
    fig, ax = plt.subplots(figsize=(size / 100, size / 100), dpi=100)

    # Set white background
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")

    if slice_lines:
        # Calculate bounds
        x_min, y_min = mesh_bounds[0][:2]
        x_max, y_max = mesh_bounds[1][:2]

        x_range = x_max - x_min
        y_range = y_max - y_min
        max_range = max(x_range, y_range)

        # Plot slice lines
        for line_points in slice_lines:
            if len(line_points) > 1:
                x_coords = line_points[:, 0]
                y_coords = line_points[:, 1]
                ax.plot(x_coords, y_coords, "k-", linewidth=1.5, solid_capstyle="round")

        # Set bounds with padding
        padding = max_range * 0.1
        ax.set_xlim(x_min - padding, x_max + padding)
        ax.set_ylim(y_min - padding, y_max + padding)
    else:
        # Empty plot
        ax.text(
            0.5,
            0.5,
            "No slice",
            transform=ax.transAxes,
            ha="center",
            va="center",
            color="gray",
            fontsize=10,
        )
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)

    # Set equal aspect ratio and clean appearance
    ax.set_aspect("equal")
    ax.set_xticks([])
    ax.set_yticks([])
    ax.spines["top"].set_visible(True)
    ax.spines["right"].set_visible(True)
    ax.spines["bottom"].set_visible(True)
    ax.spines["left"].set_visible(True)

    # Set border color
    for spine in ax.spines.values():
        spine.set_color("#ccc")
        spine.set_linewidth(1)

    # Tight layout
    plt.tight_layout(pad=0)

    # Save to bytes
    buf = io.BytesIO()
    plt.savefig(
        buf,
        format="png",
        dpi=100,
        bbox_inches="tight",
        facecolor="white",
        edgecolor="none",
        pad_inches=0.05,
    )
    buf.seek(0)

    # Convert to base64
    img_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    plt.close()

    return f"data:image/png;base64,{img_base64}"

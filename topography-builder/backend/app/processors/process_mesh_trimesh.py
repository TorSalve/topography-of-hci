#!/usr/bin/env python3
"""
Trimesh-based topographical map generator.
Uses trimesh library for clean contour line generation.

This module generates topographical maps from a top-down perspective,
as if viewing the model from directly above (perpendicular to the Z=0 plane).
The mesh is sliced horizontally at regular Z intervals to create contour lines.
"""

import trimesh
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.collections import LineCollection
import argparse
import sys
from pathlib import Path
from ..utils.trimesh_utils import (
    normalize_rotation,
    auto_orient_mesh_for_topography,
    apply_transformations,
    load_mesh_file,
    load_and_transform_mesh,
)
from ..utils.argparse_utils import parse_processing_args


def generate_contour_lines(mesh, num_contours=20):
    """Generate contour lines by slicing the mesh at regular Z intervals

    This creates horizontal slices through the mesh and views them from above
    to generate a proper topographical map perspective.
    """

    # Get Z bounds
    z_min, z_max = mesh.bounds[0][2], mesh.bounds[1][2]
    z_range = z_max - z_min

    print(f"Mesh Z range: {z_min:.3f} to {z_max:.3f} (range: {z_range:.3f})")

    # Generate slice planes at regular intervals from bottom to top
    z_levels = np.linspace(z_min, z_max, num_contours + 1)

    contour_lines = []

    for i, z in enumerate(z_levels):
        try:
            # Create horizontal slice at Z level
            plane_origin = [0, 0, z]
            plane_normal = [0, 0, 1]  # Horizontal cutting plane

            # Get the cross-section - this represents the contour at this elevation
            slice_2d = mesh.section(
                plane_origin=plane_origin, plane_normal=plane_normal
            )

            if slice_2d is not None:
                # Convert to 2D paths - these are the contour lines as viewed from above
                if hasattr(slice_2d, "entities"):
                    # slice_2d is a Path2D object
                    for entity in slice_2d.entities:
                        if hasattr(entity, "points"):
                            # Get the actual coordinates
                            points = slice_2d.vertices[entity.points]
                            if len(points) > 1:
                                contour_lines.append(points)
                                print(
                                    f"Created contour at Z={z:.3f} with {len(points)} points"
                                )
                elif hasattr(slice_2d, "vertices"):
                    # slice_2d has vertices directly
                    if len(slice_2d.vertices) > 1:
                        contour_lines.append(slice_2d.vertices)
                        print(
                            f"Created contour at Z={z:.3f} with {len(slice_2d.vertices)} points"
                        )

        except Exception as e:
            print(f"Warning: Could not create slice at Z={z:.3f}: {e}")
            continue

    print(f"Generated {len(contour_lines)} contour lines")
    return contour_lines


def render_contour_map(
    contour_lines, output_path, mesh_bounds, dpi=300, line_width=0.5
):
    """Render contour lines to a clean PNG image from top-down perspective"""

    # Calculate figure size based on mesh bounds (top-down view uses X,Y only)
    x_min, y_min = mesh_bounds[0][:2]
    x_max, y_max = mesh_bounds[1][:2]

    x_range = x_max - x_min
    y_range = y_max - y_min
    max_range = max(x_range, y_range)

    # Create figure with appropriate aspect ratio for top-down view
    fig_size = 8  # inches
    aspect_ratio = y_range / x_range if x_range > 0 else 1.0

    if aspect_ratio > 1:
        figsize = (fig_size, fig_size * aspect_ratio)
    else:
        figsize = (fig_size / aspect_ratio, fig_size)

    fig, ax = plt.subplots(figsize=figsize, dpi=dpi)

    # Set white background
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")

    # Plot contour lines as viewed from above (topographical perspective)
    for line_points in contour_lines:
        if len(line_points) > 1:
            # Extract X, Y coordinates only (ignore Z for top-down projection)
            x_coords = line_points[:, 0]
            y_coords = line_points[:, 1]

            ax.plot(
                x_coords, y_coords, "k-", linewidth=line_width, solid_capstyle="round"
            )

    # Set equal aspect ratio and clean appearance for topographical map
    ax.set_aspect("equal")
    ax.set_xlim(x_min - max_range * 0.1, x_max + max_range * 0.1)
    ax.set_ylim(y_min - max_range * 0.1, y_max + max_range * 0.1)

    # Remove axes and margins for clean topographical map appearance
    ax.set_xticks([])
    ax.set_yticks([])
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["bottom"].set_visible(False)
    ax.spines["left"].set_visible(False)

    # Tight layout
    plt.tight_layout(pad=0)

    # Save with high quality
    plt.savefig(
        output_path,
        dpi=dpi,
        bbox_inches="tight",
        facecolor="white",
        edgecolor="none",
        pad_inches=0.1,
    )
    plt.close()

    print(f"Topographical contour map saved to: {output_path}")
    print("View: Top-down perspective (as if looking straight down at the model)")


def render_contour_map_svg(contour_lines, output_path, mesh_bounds, line_width=1.0):
    """Render contour lines to a clean SVG file from top-down perspective"""

    # Calculate SVG dimensions based on mesh bounds (top-down view uses X,Y only)
    x_min, y_min = mesh_bounds[0][:2]
    x_max, y_max = mesh_bounds[1][:2]

    x_range = x_max - x_min
    y_range = y_max - y_min
    max_range = max(x_range, y_range)

    # Add padding around the content
    padding = max_range * 0.1
    svg_x_min = x_min - padding
    svg_x_max = x_max + padding
    svg_y_min = y_min - padding
    svg_y_max = y_max + padding

    svg_width = svg_x_max - svg_x_min
    svg_height = svg_y_max - svg_y_min

    # Calculate appropriate SVG viewport size and stroke width
    viewport_size = 1000  # Fixed viewport size for consistency
    aspect_ratio = svg_height / svg_width

    if aspect_ratio > 1:
        viewport_width = int(viewport_size / aspect_ratio)
        viewport_height = viewport_size
    else:
        viewport_width = viewport_size
        viewport_height = int(viewport_size * aspect_ratio)

    # Scale stroke width appropriately to the coordinate space
    # Aim for about 0.1% of the total range as stroke width
    scaled_stroke_width = max_range * 0.001 * line_width

    # Start building SVG content
    svg_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg width="{viewport_width}" height="{viewport_height}" '
        f'viewBox="{svg_x_min:.6f} {svg_y_min:.6f} {svg_width:.6f} {svg_height:.6f}" '
        'xmlns="http://www.w3.org/2000/svg">',
        "<desc>Topographical Map - Top-down perspective</desc>",
        "<style>",
        f"  .contour-line {{ fill: none; stroke: #000000; stroke-width: {scaled_stroke_width:.6f}; stroke-linecap: round; stroke-linejoin: round; }}",
        "</style>",
    ]

    # Add contour lines
    for line_points in contour_lines:
        if len(line_points) > 1:
            # Extract X, Y coordinates only (ignore Z for top-down projection)
            path_data = []
            for i, point in enumerate(line_points):
                x, y = point[0], point[1]
                # Flip Y coordinate to match matplotlib's coordinate system
                # In SVG, Y increases downward; in matplotlib, Y increases upward
                y_flipped = svg_y_max + svg_y_min - y
                if i == 0:
                    path_data.append(f"M {x:.6f} {y_flipped:.6f}")
                else:
                    path_data.append(f"L {x:.6f} {y_flipped:.6f}")

            if path_data:
                svg_lines.append(
                    f'  <path class="contour-line" d="{" ".join(path_data)}" />'
                )

    svg_lines.append("</svg>")

    # Write SVG file
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(svg_lines))

    print(f"Topographical contour map (SVG) saved to: {output_path}")
    print(f"Coordinate space: {svg_width:.3f} x {svg_height:.3f}")
    print(f"Viewport: {viewport_width} x {viewport_height}")
    print(f"Stroke width: {scaled_stroke_width:.6f}")
    print("View: Top-down perspective (as if looking straight down at the model)")


def main():
    """Main function to process mesh and generate topographical map"""

    # Parse command line arguments using the consolidated utility
    args = parse_processing_args(
        description="Generate topographical maps from 3D models using trimesh"
    )

    # Additional trimesh-specific arguments could be added here if needed
    # For now, using the standard processing parameters

    # Normalize rotation values
    rotation_x = normalize_rotation(args.rotation_x)
    rotation_y = normalize_rotation(args.rotation_y)
    rotation_z = normalize_rotation(args.rotation_z)

    print(f"Trimesh Topographical Map Generator")
    print(f"Processing parameters:")
    print(f"  Input: {args.input_path}")
    print(f"  Output: {args.output_path}")
    print(f"  Contour levels: {args.contour_levels}")
    print(f"  Rotation: X={rotation_x}°, Y={rotation_y}°, Z={rotation_z}°")
    print(
        f"  Translation: X={args.translation_x}, Y={args.translation_y}, Z={args.translation_z}"
    )
    print(f"  Pivot: X={args.pivot_x}, Y={args.pivot_y}, Z={args.pivot_z}")
    print(f"  Scale: {args.scale}")
    print(f"  Line width: {args.line_width}")
    print(f"  DPI: {args.dpi}")

    try:
        # Load and transform the mesh
        processing_params = {
            "rotation": (rotation_x, rotation_y, rotation_z),
            "translation": (args.translation_x, args.translation_y, args.translation_z),
            "pivot": (args.pivot_x, args.pivot_y, args.pivot_z),
            "scale": args.scale,
        }

        mesh = load_and_transform_mesh(args.input_path, processing_params)

        # Generate contour lines
        contour_lines = generate_contour_lines(mesh, args.contour_levels)

        if not contour_lines:
            raise ValueError(
                "No contour lines were generated. The mesh may be too small or oriented incorrectly."
            )

        # Render the contour map
        render_contour_map(
            contour_lines,
            args.output_path,
            mesh.bounds,
            dpi=args.dpi,
            line_width=args.line_width,
        )

        print("✅ Topographical map generation completed successfully!")

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

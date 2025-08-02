#!/usr/bin/env python3
"""
Shared argument parsing utilities for processing scripts.
"""

import argparse
import sys


def create_processing_parser(description="Generate topographical maps from 3D models"):
    """
    Create a standardized argument parser for 3D processing scripts.

    Args:
        description: Description for the argument parser

    Returns:
        argparse.ArgumentParser: Configured parser
    """
    parser = argparse.ArgumentParser(description=description)

    # Required positional arguments
    parser.add_argument("input_path", help="Path to input 3D file")
    parser.add_argument("output_path", help="Path to output PNG file")

    # Processing parameters
    parser.add_argument(
        "--contour-levels",
        type=int,
        default=20,
        help="Number of contour levels (default: 20)",
    )

    # Rotation parameters
    parser.add_argument(
        "--rotation-x",
        type=float,
        default=0.0,
        help="Rotation around X axis in degrees (default: 0)",
    )
    parser.add_argument(
        "--rotation-y",
        type=float,
        default=0.0,
        help="Rotation around Y axis in degrees (default: 0)",
    )
    parser.add_argument(
        "--rotation-z",
        type=float,
        default=0.0,
        help="Rotation around Z axis in degrees (default: 0)",
    )

    # Translation parameters
    parser.add_argument(
        "--translation-x",
        type=float,
        default=0.0,
        help="Translation along X axis (default: 0)",
    )
    parser.add_argument(
        "--translation-y",
        type=float,
        default=0.0,
        help="Translation along Y axis (default: 0)",
    )
    parser.add_argument(
        "--translation-z",
        type=float,
        default=0.0,
        help="Translation along Z axis (default: 0)",
    )

    # Pivot parameters
    parser.add_argument(
        "--pivot-x",
        type=float,
        default=0.0,
        help="Pivot point X coordinate (default: 0)",
    )
    parser.add_argument(
        "--pivot-y",
        type=float,
        default=0.0,
        help="Pivot point Y coordinate (default: 0)",
    )
    parser.add_argument(
        "--pivot-z",
        type=float,
        default=0.0,
        help="Pivot point Z coordinate (default: 0)",
    )

    # Scale parameter
    parser.add_argument(
        "--scale", type=float, default=1.0, help="Scale factor (default: 1.0)"
    )

    # Trimesh-specific parameters (optional)
    parser.add_argument(
        "--line-width",
        type=float,
        default=0.5,
        help="Contour line width for trimesh rendering (default: 0.5)",
    )
    parser.add_argument(
        "--dpi",
        type=int,
        default=300,
        help="Output DPI for trimesh rendering (default: 300)",
    )

    return parser


def parse_processing_args(
    argv=None, description="Generate topographical maps from 3D models"
):
    """
    Parse command line arguments for 3D processing scripts with fallback to positional args.

    Args:
        argv: Command line arguments (defaults to sys.argv after '--')
        description: Description for the argument parser

    Returns:
        Namespace: Parsed arguments
    """
    # Get command line arguments after '--' if not provided
    if argv is None:
        if "--" in sys.argv:
            argv = sys.argv[sys.argv.index("--") + 1 :]
        else:
            argv = []

    parser = create_processing_parser(description)

    # Parse arguments with fallback for backward compatibility
    try:
        args = parser.parse_args(argv)
    except SystemExit:
        # If parsing fails, fall back to positional arguments for backward compatibility
        print(
            "Warning: Failed to parse named arguments, falling back to positional arguments"
        )
        if len(argv) < 2:
            raise ValueError("At least input_path and output_path must be provided")

        # Create a simple namespace with positional arguments
        class Args:
            def __init__(self):
                self.input_path = argv[0]
                self.output_path = argv[1]
                self.contour_levels = int(argv[2]) if len(argv) > 2 else 20
                self.rotation_x = float(argv[3]) if len(argv) > 3 else 0.0
                self.rotation_y = float(argv[4]) if len(argv) > 4 else 0.0
                self.rotation_z = float(argv[5]) if len(argv) > 5 else 0.0
                self.translation_x = float(argv[6]) if len(argv) > 6 else 0.0
                self.translation_y = float(argv[7]) if len(argv) > 7 else 0.0
                self.translation_z = float(argv[8]) if len(argv) > 8 else 0.0
                self.pivot_x = float(argv[9]) if len(argv) > 9 else 0.0
                self.pivot_y = float(argv[10]) if len(argv) > 10 else 0.0
                self.pivot_z = float(argv[11]) if len(argv) > 11 else 0.0
                self.scale = float(argv[12]) if len(argv) > 12 else 1.0

        args = Args()

    return args


def extract_processing_params(args):
    """
    Extract processing parameters from parsed arguments into a dictionary.

    Args:
        args: Parsed arguments namespace

    Returns:
        dict: Processing parameters
    """
    return {
        "input_path": args.input_path,
        "output_path": args.output_path,
        "contour_levels": args.contour_levels,
        "rotation_x": args.rotation_x,
        "rotation_y": args.rotation_y,
        "rotation_z": args.rotation_z,
        "translation_x": args.translation_x,
        "translation_y": args.translation_y,
        "translation_z": args.translation_z,
        "pivot_x": args.pivot_x,
        "pivot_y": args.pivot_y,
        "pivot_z": args.pivot_z,
        "scale": args.scale,
    }


def build_command_args_from_params(processing_params, base_args):
    """
    Build command line arguments from processing parameters.

    Args:
        processing_params: Dict containing processing parameters
        base_args: List of base command arguments to extend

    Returns:
        List: Extended command arguments
    """
    if not processing_params:
        return base_args

    args_to_add = [
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
        "--line-width",
        str(processing_params.get("line_width", 0.5)),
        "--dpi",
        str(processing_params.get("dpi", 300)),
    ]

    return base_args + args_to_add

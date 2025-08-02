import bpy
import sys
import os
import mathutils
import math
import argparse

# Add the app directory to the path so we can import our utilities
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
try:
    from utils.trimesh_utils import normalize_rotation
    from utils.argparse_utils import parse_processing_args
except ImportError:
    # Fallback for when running directly with Blender
    import sys
    import os

    app_dir = os.path.dirname(os.path.dirname(__file__))
    sys.path.insert(0, app_dir)
    from utils.trimesh_utils import normalize_rotation
    from utils.argparse_utils import parse_processing_args

print(f"Blender version: {bpy.app.version}")
print(f"Blender version string: {bpy.app.version_string}")

# Only try to enable FBX add-on if needed, skip legacy add-ons
try:
    bpy.ops.preferences.addon_enable(module="io_scene_fbx")
    print("FBX add-on enabled successfully")
except Exception as e:
    print(f"Warning: FBX add-on not available: {e}")

print("Using built-in import operators for STL, PLY, and OBJ files (Blender 4.x)")

# Parse command line arguments using the consolidated utility
args = parse_processing_args(description="Generate topographical maps from 3D models")

# Extract parameters from parsed arguments
input_path = args.input_path
output_path = args.output_path
contour_levels = args.contour_levels
rotation_x = args.rotation_x
rotation_y = args.rotation_y
rotation_z = args.rotation_z
translation_x = args.translation_x
translation_y = args.translation_y
translation_z = args.translation_z
pivot_x = args.pivot_x
pivot_y = args.pivot_y
pivot_z = args.pivot_z
scale = args.scale

# Normalize rotation values using the consolidated utility function
rotation_x = normalize_rotation(rotation_x)
rotation_y = normalize_rotation(rotation_y)
rotation_z = normalize_rotation(rotation_z)

# Print the parameters being used
print(f"Processing parameters:")
print(f"  Input: {input_path}")
print(f"  Output: {output_path}")
print(f"  Contour levels: {contour_levels}")
print(f"  Rotation (normalized): X={rotation_x}°, Y={rotation_y}°, Z={rotation_z}°")
print(f"  Translation: X={translation_x}, Y={translation_y}, Z={translation_z}")
print(f"  Pivot: X={pivot_x}, Y={pivot_y}, Z={pivot_z}")
print(f"  Scale: {scale}")

# Clear existing scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Import mesh based on file extension
file_ext = os.path.splitext(input_path)[1].lower()
print(f"Processing file: {input_path} (format: {file_ext})")

try:
    if file_ext == ".obj":
        bpy.ops.wm.obj_import(filepath=input_path)
        print("Used new OBJ import operator")
    elif file_ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=input_path)
        print("Used FBX import operator")
    elif file_ext == ".stl":
        bpy.ops.wm.stl_import(filepath=input_path)
        print("Used new STL import operator")
    elif file_ext == ".ply":
        bpy.ops.wm.ply_import(filepath=input_path)
        print("Used new PLY import operator")
    else:
        raise ValueError(f"Unsupported file format: {file_ext}")

except Exception as e:
    raise ValueError(f"Could not import {file_ext} file: {e}")

# Check if any objects were imported
if not bpy.context.selected_objects:
    raise ValueError("No objects were imported from the file.")

obj = bpy.context.selected_objects[0]
bpy.context.view_layer.objects.active = obj
print(f"Successfully imported object: {obj.name}")

# Auto-orient the mesh for optimal topographical mapping
print("Auto-orienting mesh for topographical mapping...")
dimensions = obj.dimensions
print(
    f"Original mesh dimensions: X={dimensions.x:.3f}, Y={dimensions.y:.3f}, Z={dimensions.z:.3f}"
)

# Find which axis has the largest extent
max_dimension_axis = (
    0
    if dimensions.x >= dimensions.y and dimensions.x >= dimensions.z
    else (1 if dimensions.y >= dimensions.z else 2)
)
axis_names = ["X", "Y", "Z"]
print(f"Longest dimension is along {axis_names[max_dimension_axis]}-axis")

# If the longest dimension is not along Z, rotate to align it with Z
if max_dimension_axis == 0:  # X is longest, rotate around Y to align with Z
    print("Rotating mesh: X-axis → Z-axis (90° around Y)")
    obj.rotation_euler = (0, math.radians(90), 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
elif max_dimension_axis == 1:  # Y is longest, rotate around X to align with Z
    print("Rotating mesh: Y-axis → Z-axis (90° around X)")
    obj.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
elif max_dimension_axis == 2:
    print("Mesh is already optimally oriented for topography (Z is longest)")

# Update dimensions after auto-orientation
bpy.context.view_layer.update()
new_dimensions = obj.dimensions
print(
    f"After auto-orientation: X={new_dimensions.x:.3f}, Y={new_dimensions.y:.3f}, Z={new_dimensions.z:.3f}"
)

# Apply subdivision surface smoothing for better contour generation
try:
    bpy.ops.object.modifier_add(type="SUBSURF")
    obj.modifiers["Subdivision"].levels = 2
    bpy.ops.object.modifier_apply(modifier="Subdivision")
    print("Applied subdivision surface smoothing")
except Exception as e:
    print(f"Warning: Could not apply subdivision surface: {e}")
    print("Continuing without smoothing...")

# Center and scale the object
bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
obj.location = (0, 0, 0)

# Set custom pivot point for rotation if specified
pivot_point = mathutils.Vector((pivot_x, pivot_y, pivot_z))
original_location = obj.location.copy()

# Move object so pivot point is at origin for rotation
obj.location = original_location - pivot_point

# Apply custom user rotations around the pivot point (after auto-orientation)
obj.rotation_euler = (
    math.radians(rotation_x),
    math.radians(rotation_y),
    math.radians(rotation_z),
)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
print(
    f"Applied user rotation around pivot ({pivot_x}, {pivot_y}, {pivot_z}): X={rotation_x}°, Y={rotation_y}°, Z={rotation_z}°"
)

# Move object back and apply additional translation
final_location = original_location + mathutils.Vector(
    (translation_x, translation_y, translation_z)
)
obj.location = final_location
print(f"Applied translation: X={translation_x}, Y={translation_y}, Z={translation_z}")

# Apply user-defined scaling
# First get dimensions for normalization if needed
dimensions = obj.dimensions
max_dimension = max(dimensions)

# Apply user scale with optional normalization
if max_dimension > 0:
    # Normalize to reasonable size (8 units) then apply user scale
    base_scale = 8.0 / max_dimension
    final_scale = base_scale * scale
else:
    final_scale = scale

obj.scale = (final_scale, final_scale, final_scale)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
print(f"Applied scale: {scale}× (final scale factor: {final_scale:.3f})")

# Get the Z bounds for slicing
bpy.context.view_layer.update()
bbox = [obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box]
z_min = min([v.z for v in bbox])
z_max = max([v.z for v in bbox])
z_range = z_max - z_min

print(f"Object Z range: {z_min:.3f} to {z_max:.3f} (range: {z_range:.3f})")

# Create contour lines by slicing the mesh at regular intervals
# This generates horizontal slices which are viewed from above for topographical mapping
contour_spacing = z_range / contour_levels  # Use custom contour levels
contour_collection = bpy.data.collections.new("ContourLines")
bpy.context.scene.collection.children.link(contour_collection)

# Create a list to store all contour objects
contour_objects = []

# Store the original object name for reference
original_obj_name = obj.name

for i in range(contour_levels + 1):  # +1 to include both ends
    z_level = z_min + (i * contour_spacing)

    # Get the original object by name (safer than using the reference)
    original_obj = bpy.data.objects[original_obj_name]

    # Make sure the original object is selected and active
    bpy.ops.object.select_all(action="DESELECT")
    original_obj.select_set(True)
    bpy.context.view_layer.objects.active = original_obj

    # Duplicate the original object for slicing
    bpy.ops.object.duplicate()
    slice_obj = bpy.context.active_object
    slice_obj.name = f"Slice_{i:02d}"

    # Move to contour collection safely
    # Remove from all collections first
    for collection in slice_obj.users_collection:
        collection.objects.unlink(slice_obj)
    # Add to contour collection
    contour_collection.objects.link(slice_obj)

    # Switch to Edit mode and use bisect
    bpy.context.view_layer.objects.active = slice_obj
    bpy.ops.object.mode_set(mode="EDIT")

    # Select all vertices
    bpy.ops.mesh.select_all(action="SELECT")

    # Bisect the mesh at the Z level
    bpy.ops.mesh.bisect(
        plane_co=(0, 0, z_level),
        plane_no=(0, 0, 1),
        use_fill=False,
        clear_inner=True,
        clear_outer=True,
    )

    # Convert to curve for clean lines
    bpy.ops.object.mode_set(mode="OBJECT")

    # Check if there are any vertices left after bisection
    if len(slice_obj.data.vertices) > 0:
        contour_objects.append(slice_obj)
        print(f"Created contour at Z={z_level:.3f}")
    else:
        # Remove empty slice
        bpy.data.objects.remove(slice_obj)

# Create a clean 2D topographical map
# First, create a white background plane - make it larger and positioned better
x_size = max([v.x for v in bbox]) - min([v.x for v in bbox])
y_size = max([v.y for v in bbox]) - min([v.y for v in bbox])
x_center = (max([v.x for v in bbox]) + min([v.x for v in bbox])) / 2
y_center = (max([v.y for v in bbox]) + min([v.y for v in bbox])) / 2
bg_size = max(x_size, y_size) * 2.0  # Larger background

bpy.ops.mesh.primitive_plane_add(
    size=bg_size, location=(x_center, y_center, z_min - 0.2)
)
background_plane = bpy.context.active_object
background_plane.name = "Background"

# Create white material for background with no lighting dependency
bg_mat = bpy.data.materials.new(name="BackgroundMaterial")
bg_mat.use_nodes = True
bg_nodes = bg_mat.node_tree.nodes
bg_nodes.clear()

# Use emission shader for pure white background that doesn't depend on lighting
bg_emission = bg_nodes.new(type="ShaderNodeEmission")
bg_emission.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)  # Pure white
bg_emission.inputs["Strength"].default_value = 1.0

bg_output = bg_nodes.new(type="ShaderNodeOutputMaterial")
bg_mat.node_tree.links.new(bg_emission.outputs["Emission"], bg_output.inputs["Surface"])

background_plane.data.materials.append(bg_mat)

# Create black material for contour lines
contour_mat = bpy.data.materials.new(name="ContourMaterial")
contour_mat.use_nodes = True
contour_nodes = contour_mat.node_tree.nodes
contour_nodes.clear()

# Use emission shader for pure black contour lines
contour_emission = contour_nodes.new(type="ShaderNodeEmission")
contour_emission.inputs["Color"].default_value = (0.0, 0.0, 0.0, 1.0)  # Pure black
contour_emission.inputs["Strength"].default_value = 1.0

contour_output = contour_nodes.new(type="ShaderNodeOutputMaterial")
contour_mat.node_tree.links.new(
    contour_emission.outputs["Emission"], contour_output.inputs["Surface"]
)

# Apply black material to all contour objects and add wireframe
for contour_obj in contour_objects:
    # Add wireframe modifier for visible lines
    wireframe_mod = contour_obj.modifiers.new(name="Wireframe", type="WIREFRAME")
    wireframe_mod.thickness = 0.05  # Even thicker lines for maximum visibility
    wireframe_mod.use_replace = True
    wireframe_mod.use_boundary = True
    wireframe_mod.use_even_offset = True

    # Apply material
    contour_obj.data.materials.clear()
    contour_obj.data.materials.append(contour_mat)

    # Ensure the object is visible in renders
    contour_obj.hide_render = False
    contour_obj.hide_viewport = False

# Hide the original object completely
original_obj = bpy.data.objects[original_obj_name]
original_obj.hide_render = True
original_obj.hide_viewport = True

print(f"Created {len(contour_objects)} contour lines")

# Debug: Print information about each contour object
for i, contour_obj in enumerate(contour_objects):
    print(
        f"Contour {i}: {contour_obj.name}, vertices: {len(contour_obj.data.vertices)}, location: {contour_obj.location}"
    )

# Ensure all contour objects are visible
for contour_obj in contour_objects:
    contour_obj.hide_render = False
    contour_obj.hide_viewport = False

# Set up camera for orthographic top-down view
cam_data = bpy.data.cameras.new("Camera")
cam = bpy.data.objects.new("Camera", cam_data)
bpy.context.collection.objects.link(cam)
bpy.context.scene.camera = cam

# Position camera well above the object, centered on the model, looking straight down
cam.location = (x_center, y_center, z_max + 20)
# Set camera to look straight down (perpendicular to XY plane)
cam.rotation_euler = (0, 0, 0)  # Pointing straight down along Z-axis
cam.data.type = "ORTHO"  # Orthographic projection for true topographical view
cam.data.ortho_scale = max(x_size, y_size) * 1.2  # Tighter framing

# Set up lighting for clean contour visibility
light_data = bpy.data.lights.new(name="Light", type="SUN")
light = bpy.data.objects.new(name="Light", object_data=light_data)
bpy.context.collection.objects.link(light)
light.location = (0, 0, z_max + 10)
light.data.energy = 5.0
light.rotation_euler = (0, 0, 0)  # Direct top-down lighting

# Set render settings for clean topographical map
bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"  # Updated for Blender 4.x
bpy.context.scene.render.image_settings.file_format = "PNG"
bpy.context.scene.render.filepath = output_path
bpy.context.scene.render.resolution_x = 2048
bpy.context.scene.render.resolution_y = 2048

# Disable freestyle if enabled (prevents unwanted edge detection)
bpy.context.scene.render.use_freestyle = False

# Disable transparency - we want solid white background with black lines
bpy.context.scene.render.film_transparent = False

# Enable anti-aliasing for clean lines (try different paths for Blender 4.x compatibility)
try:
    bpy.context.scene.eevee.taa_render_samples = 64
except AttributeError:
    try:
        # Alternative path for newer Blender versions
        bpy.context.scene.render.use_persistent_data = True
    except AttributeError:
        print("Could not set anti-aliasing - using default settings")

# Set background to white for clean topographical appearance
world = bpy.context.scene.world
if world is None:
    # Create a new world if none exists
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world

world.use_nodes = True
world_nodes = world.node_tree.nodes
world_nodes.clear()

# Create white background
bg_node = world_nodes.new(type="ShaderNodeBackground")
bg_node.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)  # White
bg_node.inputs["Strength"].default_value = 1.0

world_output = world_nodes.new(type="ShaderNodeOutputWorld")
world.node_tree.links.new(bg_node.outputs["Background"], world_output.inputs["Surface"])

print("Rendering topographical map with contour lines...")

# Render the topographical map
bpy.ops.render.render(write_still=True)

print(f"Topographical map saved to: {output_path}")

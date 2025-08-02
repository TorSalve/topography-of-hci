#!/usr/bin/env python3
"""
Blender Diagnostic Script
Checks if Blender is properly installed and configured for the Topography Builder.
"""

import subprocess
import sys
import os


def check_blender_installation():
    """Check if Blender is installed and accessible."""
    print("🔍 Checking Blender installation...")

    try:
        result = subprocess.run(
            ["blender", "--version"], capture_output=True, text=True, timeout=10
        )

        if result.returncode == 0:
            print("✅ Blender is installed and accessible")
            print(f"   Version: {result.stdout.strip()}")
            return True
        else:
            print("❌ Blender command failed")
            print(f"   Error: {result.stderr}")
            return False

    except FileNotFoundError:
        print("❌ Blender not found in PATH")
        print("   Please install Blender and ensure it's accessible via command line")
        return False
    except subprocess.TimeoutExpired:
        print("❌ Blender command timed out")
        return False


def check_blender_addons():
    """Check if required Blender add-ons are available."""
    print("\n🔧 Checking Blender add-ons...")

    script = """
import bpy
import sys

addons = [
    ("io_mesh_stl", "STL"),
    ("io_mesh_ply", "PLY"), 
    ("io_scene_obj", "OBJ"),
    ("io_scene_fbx", "FBX")
]

for addon_id, name in addons:
    try:
        bpy.ops.preferences.addon_enable(module=addon_id)
        print(f"✅ {name} add-on available")
    except Exception as e:
        print(f"❌ {name} add-on not available: {e}")

# Check for newer import operators (Blender 3.3+)
newer_ops = [
    ("wm.stl_import", "STL (new)"),
    ("wm.ply_import", "PLY (new)"),
    ("wm.obj_import", "OBJ (new)")
]

for op, name in newer_ops:
    try:
        eval(f"bpy.ops.{op}")
        print(f"✅ {name} import operator available")
    except:
        print(f"ℹ️  {name} import operator not available (older Blender version)")
"""

    try:
        result = subprocess.run(
            ["blender", "--background", "--python-expr", script],
            capture_output=True,
            text=True,
            timeout=30,
        )

        if result.returncode == 0:
            print(result.stdout)
        else:
            print("❌ Failed to check add-ons")
            print(f"Error: {result.stderr}")

    except Exception as e:
        print(f"❌ Error checking add-ons: {e}")


def test_file_import():
    """Test importing a simple file."""
    print("\n📁 Testing file import capabilities...")

    # Create a simple test STL content (minimal valid STL)
    test_stl_content = """solid test
  facet normal 0 0 1
    outer loop
      vertex 0 0 0
      vertex 1 0 0
      vertex 0 1 0
    endloop
  endfacet
endsolid test"""

    test_file = "/tmp/test.stl"

    try:
        with open(test_file, "w") as f:
            f.write(test_stl_content)

        script = f"""
import bpy
import sys

try:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # Try importing the test STL
    try:
        bpy.ops.import_mesh.stl(filepath="{test_file}")
        print("✅ STL import successful (legacy)")
    except:
        try:
            bpy.ops.wm.stl_import(filepath="{test_file}")
            print("✅ STL import successful (new)")
        except Exception as e:
            print(f"❌ STL import failed: {{e}}")
    
    if bpy.context.selected_objects:
        print(f"✅ Object imported: {{bpy.context.selected_objects[0].name}}")
    else:
        print("❌ No objects imported")
        
except Exception as e:
    print(f"❌ Test failed: {{e}}")
"""

        result = subprocess.run(
            ["blender", "--background", "--python-expr", script],
            capture_output=True,
            text=True,
            timeout=30,
        )

        if result.returncode == 0:
            print(result.stdout)
        else:
            print("❌ Import test failed")
            print(f"Error: {result.stderr}")

    except Exception as e:
        print(f"❌ Error during import test: {e}")
    finally:
        # Clean up test file
        if os.path.exists(test_file):
            os.remove(test_file)


def main():
    """Run all diagnostic checks."""
    print("🏥 Blender Diagnostic Tool for Topography Builder")
    print("=" * 50)

    blender_ok = check_blender_installation()

    if blender_ok:
        check_blender_addons()
        test_file_import()

    print("\n" + "=" * 50)
    if blender_ok:
        print("✅ Diagnostic complete. Check the results above.")
        print("\n💡 If you see any ❌ errors:")
        print("   1. Make sure you have a recent version of Blender (3.0+)")
        print("   2. Try reinstalling Blender")
        print("   3. Check that Blender is properly added to your system PATH")
    else:
        print("❌ Blender installation issues detected.")
        print("\n🔧 To fix:")
        print("   1. Download Blender from https://www.blender.org/download/")
        print("   2. Install it and make sure 'blender' command works in terminal")
        print("   3. Run this diagnostic again")


if __name__ == "__main__":
    main()

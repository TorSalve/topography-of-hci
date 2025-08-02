import React, { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Center } from "@react-three/drei";
import * as THREE from "three";
import { OBJLoader } from "three-stdlib";
import { STLLoader } from "three-stdlib";
import { PLYLoader } from "three-stdlib";
import { FBXLoader } from "three-stdlib";

// Auto-orientation function to match backend logic
const autoOrientGeometryForTopography = (geometry) => {
  // Compute bounding box to get dimensions
  geometry.computeBoundingBox();
  const boundingBox = geometry.boundingBox;
  const size = boundingBox.getSize(new THREE.Vector3());

  // Find which axis has the largest extent
  let maxDimensionAxis = 0;
  if (size.y >= size.x && size.y >= size.z) {
    maxDimensionAxis = 1;
  } else if (size.z >= size.x && size.z >= size.y) {
    maxDimensionAxis = 2;
  }

  // Apply rotation to align longest dimension with Z-axis
  if (maxDimensionAxis === 0) {
    // X is longest, don't apply any rotation to match backend exactly
    // No rotation applied here
  } else if (maxDimensionAxis === 1) {
    // Y is longest, rotate around X to align with Z (90° around X)
    geometry.rotateX(Math.PI / 2);
  }
  // Z is already longest - no rotation needed

  // Recompute bounding box after rotation
  geometry.computeBoundingBox();

  return geometry;
};

// Component to load and display the actual 3D model
const ModelMesh = ({ file, rotation, translation, pivot, scale }) => {
  const meshRef = useRef();
  const [geometry, setGeometry] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!file) return;

    const loadModel = async () => {
      try {
        const fileExt = file.name.toLowerCase().split(".").pop();
        const fileUrl = URL.createObjectURL(file);

        let loader;
        switch (fileExt) {
          case "obj":
            loader = new OBJLoader();
            break;
          case "stl":
            loader = new STLLoader();
            break;
          case "ply":
            loader = new PLYLoader();
            break;
          case "fbx":
            loader = new FBXLoader();
            break;
          default:
            throw new Error(`Unsupported file format: ${fileExt}`);
        }

        loader.load(
          fileUrl,
          (loadedObject) => {
            let loadedGeometry;

            if (fileExt === "obj" || fileExt === "fbx") {
              // OBJ and FBX loaders return a Group, find the first mesh
              const mesh = loadedObject.children.find((child) => child.isMesh);
              if (mesh) {
                loadedGeometry = mesh.geometry;
              }
            } else {
              // STL and PLY loaders return geometry directly
              loadedGeometry = loadedObject;
            }

            if (loadedGeometry) {
              // First, apply auto-orientation for optimal topographical mapping
              // This matches the backend logic to ensure consistent previews
              autoOrientGeometryForTopography(loadedGeometry);

              // Center the geometry but don't auto-scale it
              loadedGeometry.computeBoundingBox();
              const boundingBox = loadedGeometry.boundingBox;
              const center = boundingBox.getCenter(new THREE.Vector3());

              // Center the geometry at origin without scaling
              loadedGeometry.translate(-center.x, -center.y, -center.z);

              loadedGeometry.computeVertexNormals();
              setGeometry(loadedGeometry);
              setError(null);
            }

            // Clean up the blob URL
            URL.revokeObjectURL(fileUrl);
          },
          (progress) => {
            // Loading progress
          },
          (error) => {
            console.error("Error loading model:", error);
            setError("Failed to load model");
            URL.revokeObjectURL(fileUrl);
          }
        );
      } catch (err) {
        console.error("Error setting up loader:", err);
        setError(err.message);
      }
    };

    loadModel();
  }, [file]);

  useFrame(() => {
    if (meshRef.current) {
      // Create transformation matrices
      const translateToPivot = new THREE.Matrix4().makeTranslation(
        -pivot[0],
        -pivot[1],
        -pivot[2]
      );
      const rotateX = new THREE.Matrix4().makeRotationX(
        (rotation[0] * Math.PI) / 180
      );
      const rotateY = new THREE.Matrix4().makeRotationY(
        (rotation[1] * Math.PI) / 180
      );
      const rotateZ = new THREE.Matrix4().makeRotationZ(
        (rotation[2] * Math.PI) / 180
      );
      const translateBack = new THREE.Matrix4().makeTranslation(
        pivot[0],
        pivot[1],
        pivot[2]
      );
      const translate = new THREE.Matrix4().makeTranslation(
        translation[0],
        translation[1],
        translation[2]
      );

      // Combine rotations first (ZYX order)
      const combinedRotation = new THREE.Matrix4();
      combinedRotation.multiplyMatrices(rotateZ, rotateY).multiply(rotateX);

      // Create scale matrix
      const scaleMatrix = new THREE.Matrix4().makeScale(scale, scale, scale);

      // Build the final transformation matrix step by step:
      // T * Tp * S * R * T-p
      // Where: T = translation, Tp = translate back from pivot, S = scale, R = rotation, T-p = translate to pivot
      const pivotRotation = new THREE.Matrix4();
      pivotRotation
        .multiplyMatrices(translateBack, scaleMatrix)
        .multiply(combinedRotation)
        .multiply(translateToPivot);

      const finalMatrix = new THREE.Matrix4();
      finalMatrix.multiplyMatrices(translate, pivotRotation);

      // Apply the final transformation matrix
      meshRef.current.matrix.copy(finalMatrix);
      meshRef.current.matrixAutoUpdate = false;
    }
  });

  if (error) {
    return (
      <mesh>
        <boxGeometry args={[2, 1, 0.5]} />
        <meshStandardMaterial color="#e74c3c" />
      </mesh>
    );
  }

  if (!geometry) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#95a5a6" />
      </mesh>
    );
  }

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial color="#4A90E2" wireframe />
    </mesh>
  );
};

// Pivot point indicator component
const PivotIndicator = ({ pivot, translation, visible }) => {
  if (!visible) return null;

  return (
    <group
      position={[
        pivot[0] + translation[0],
        pivot[1] + translation[1],
        pivot[2] + translation[2],
      ]}
    >
      {/* X axis - Red */}
      <mesh position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3]} />
        <meshBasicMaterial color="#e74c3c" />
      </mesh>
      {/* Y axis - Green */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3]} />
        <meshBasicMaterial color="#27ae60" />
      </mesh>
      {/* Z axis - Blue */}
      <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3]} />
        <meshBasicMaterial color="#3498db" />
      </mesh>
      {/* Center sphere */}
      <mesh>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color="#f39c12" />
      </mesh>
    </group>
  );
};

// Direction indicators for topographical mapping
const DirectionIndicators = ({ visible }) => {
  if (!visible) return null;

  const createTextTexture = (text) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 64;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#2c3e50";
    context.font = "bold 32px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };

  return (
    <group>
      {/* Top indicator (+Z direction in 3D space = +Y in topographical map) */}
      <group position={[0, 0, -3]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 0.3]} />
          <meshBasicMaterial color="#2c3e50" />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <coneGeometry args={[0.08, 0.15]} />
          <meshBasicMaterial color="#2c3e50" />
        </mesh>
        <mesh position={[0, -0.35, 0]} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.8, 0.2]} />
          <meshBasicMaterial map={createTextTexture("TOP")} transparent />
        </mesh>
      </group>

      {/* Right indicator (+X direction in topographical map) */}
      <group position={[3, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 0.3]} />
          <meshBasicMaterial color="#34495e" />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <coneGeometry args={[0.08, 0.15]} />
          <meshBasicMaterial color="#34495e" />
        </mesh>
        <mesh position={[0, -0.35, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.8, 0.2]} />
          <meshBasicMaterial map={createTextTexture("RIGHT")} transparent />
        </mesh>
      </group>

      {/* Bottom indicator (-Z direction in 3D space = -Y in topographical map) */}
      <group position={[0, 0, 3]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 0.3]} />
          <meshBasicMaterial color="#7f8c8d" />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <coneGeometry args={[0.08, 0.15]} />
          <meshBasicMaterial color="#7f8c8d" />
        </mesh>
        <mesh position={[0, -0.35, 0]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.8, 0.2]} />
          <meshBasicMaterial map={createTextTexture("BOTTOM")} transparent />
        </mesh>
      </group>

      {/* Left indicator (-X direction in topographical map) */}
      <group position={[-3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 0.3]} />
          <meshBasicMaterial color="#95a5a6" />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <coneGeometry args={[0.08, 0.15]} />
          <meshBasicMaterial color="#95a5a6" />
        </mesh>
        <mesh position={[0, -0.35, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.8, 0.2]} />
          <meshBasicMaterial map={createTextTexture("LEFT")} transparent />
        </mesh>
      </group>
    </group>
  );
};

// Loading fallback
const Loader = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="#95a5a6" />
  </mesh>
);

const ModelPreview = ({
  file,
  rotation,
  translation,
  pivot,
  scale,
  visible,
  showPivotIndicator,
  isLocked = false,
  loadingStatus = "",
}) => {
  const [showDirections, setShowDirections] = useState(true);
  if (!visible || !file) return null;

  const getFileInfo = () => {
    if (!file) return "";
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const fileExt = file.name.toLowerCase().split(".").pop();
    return `${file.name} (${sizeInMB} MB, ${fileExt.toUpperCase()})`;
  };

  return (
    <div className="model-preview-container">
      <div className="preview-header">
        <h3 className="preview-title">3D Preview</h3>
        <div className="preview-controls">
          <button
            className={`btn-small ${
              showDirections ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => setShowDirections(!showDirections)}
            title="Show directional indicators for topographical mapping"
          >
            <span style={{ fontSize: "12px" }}>🧭</span>
            {showDirections ? " Hide" : " Show"} Directions
          </button>
        </div>
      </div>
      <div className="preview-canvas-container">
        {isLocked && (
          <div className="preview-loading-overlay">
            <div className="loading-content">
              <div className="loading-spinner"></div>
              <p className="loading-text">{loadingStatus || "Processing..."}</p>
              <p className="loading-subtext">
                Please wait while we generate your topographical map
              </p>
            </div>
          </div>
        )}
        <Canvas
          camera={{ position: [4, 3, 4], fov: 50 }}
          style={{
            opacity: isLocked ? 0.3 : 1,
            pointerEvents: isLocked ? "none" : "auto",
          }}
        >
          <color attach="background" args={["#f8f9fa"]} />
          <fog attach="fog" args={["#f8f9fa", 25, 50]} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} />
          <Suspense fallback={<Loader />}>
            <Center>
              <ModelMesh
                file={file}
                rotation={rotation}
                pivot={pivot}
                translation={translation}
                scale={scale}
              />
            </Center>
            <PivotIndicator
              pivot={pivot}
              translation={translation}
              visible={showPivotIndicator}
            />
            <DirectionIndicators visible={showDirections} />
          </Suspense>
          <OrbitControls
            enableZoom={!isLocked}
            enablePan={!isLocked}
            enableRotate={!isLocked}
          />
          <gridHelper args={[6, 12]} />
        </Canvas>
      </div>
    </div>
  );
};

export default ModelPreview;

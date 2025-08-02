import React, { useState } from "react";
import "./App.css";
import {
  FileUpload,
  ErrorMessage,
  ResultImage,
  Parameters,
  ModelPreview,
  Logo,
} from "./components";
import { useFileUpload } from "./hooks/useFileUpload";
import { UI_CONFIG } from "./constants/config";

function App() {
  const {
    loading,
    progress,
    error,
    status,
    resultImage,
    originalFileName,
    selectedFile,
    handleUpload,
    handleFileSelect,
    handleDownload,
    handleDownloadPNG,
    handleDownloadSVG,
  } = useFileUpload();

  const [parameters, setParameters] = useState({
    contourLevels: 20,
    realWorldHeight: null, // Will be set from model bounds initially
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    translationX: 0,
    translationY: 0,
    translationZ: 0,
    pivotX: 0,
    pivotY: 0,
    pivotZ: 0,
    scale: 1.0,
    engine: "trimesh",
  });

  const [accordionStates, setAccordionStates] = useState({});
  const [zBounds, setZBounds] = useState(null);

  // Define application phases
  const getPhase = () => {
    if (!selectedFile) return "upload";
    if (selectedFile && !loading && !resultImage) return "preview";
    if (loading) return "loading";
    if (resultImage) return "download";
    return "upload";
  };

  const currentPhase = getPhase();

  const handleParameterChange = (newParameters) => {
    setParameters(newParameters);
  };

  const fetchZBounds = async (file) => {
    try {
      // Use a mid-range Z level to get mesh bounds
      const formData = new FormData();
      formData.append("file", file);
      formData.append("z_level", "0"); // Default Z level
      formData.append("rotation_x", "0");
      formData.append("rotation_y", "0");
      formData.append("rotation_z", "0");
      formData.append("translation_x", "0");
      formData.append("translation_y", "0");
      formData.append("translation_z", "0");
      formData.append("pivot_x", "0");
      formData.append("pivot_y", "0");
      formData.append("pivot_z", "0");
      formData.append("scale", "1.0");

      const response = await fetch("http://localhost:8000/slice-preview/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.z_bounds) {
          setZBounds(data.z_bounds);

          // Set initial real-world height from model bounds
          const modelHeight = data.z_bounds.max - data.z_bounds.min;
          setParameters((prev) => ({
            ...prev,
            realWorldHeight: modelHeight,
          }));
        } else {
          console.warn("No z_bounds in response data");
        }
      } else {
        console.error("Failed to fetch Z bounds, status:", response.status);
      }
    } catch (err) {
      console.error("Error fetching Z bounds:", err);
    }
  };

  const handleFileSelectWithBounds = (file) => {
    handleFileSelect(file);
    setZBounds(null); // Reset bounds
    if (file) {
      fetchZBounds(file);
    }
  };

  const handleAccordionToggle = (sectionName, isOpen) => {
    setAccordionStates((prev) => ({
      ...prev,
      [sectionName]: isOpen,
    }));
  };

  const handleProcessFile = () => {
    if (selectedFile) {
      handleUpload(selectedFile, parameters);
    }
  };

  const handleRestart = () => {
    window.location.reload(); // Simple restart by reloading the page
  };

  return (
    <div className="container">
      {/* Phase 1: Upload Interface */}
      {currentPhase === "upload" && (
        <div className="phase-container upload-phase">
          <div className="phase-header">
            <div className="phase-indicator">
              <span className="phase-number">1</span>
              <span className="phase-title">Upload Your 3D Model</span>
            </div>
          </div>
          <div className="upload-interface">
            <div className="brand-header">
              <Logo size="large" />
              <h1>Topography Builder</h1>
            </div>
            <p>Upload a 3D scan to generate a topographical map.</p>
            <p style={{ fontSize: "0.9rem", color: "#888" }}>
              Supported formats: {UI_CONFIG.SUPPORTED_FORMATS_DISPLAY}
            </p>
            <FileUpload
              onFileSelect={handleFileSelectWithBounds}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* Phase 2: Model Preview & Parameter Adjustment */}
      {currentPhase === "preview" && (
        <div className="phase-container preview-phase">
          <div className="phase-header">
            <div className="phase-indicator">
              <Logo size="small" />
              <span className="phase-number">2</span>
              <span className="phase-title">
                Adjust Parameters & Preview Model
              </span>
            </div>
            <button onClick={handleRestart} className="restart-btn">
              Upload New File
            </button>
          </div>
          <div className="main-workspace">
            <Parameters
              parameters={parameters}
              onParameterChange={handleParameterChange}
              onAccordionToggle={handleAccordionToggle}
              visible={true}
              isLocked={false}
              file={selectedFile}
              zBounds={zBounds}
            />

            <ModelPreview
              file={selectedFile}
              rotation={[
                parameters.rotationX,
                parameters.rotationY,
                parameters.rotationZ,
              ]}
              translation={[
                parameters.translationX,
                parameters.translationY,
                parameters.translationZ,
              ]}
              pivot={[parameters.pivotX, parameters.pivotY, parameters.pivotZ]}
              scale={parameters.scale}
              visible={true}
              showPivotIndicator={accordionStates["pivot point"] || false}
              isLocked={false}
              loadingStatus=""
            />
          </div>

          <div className="process-section">
            <button
              onClick={handleProcessFile}
              className="process-btn"
              disabled={loading}
            >
              Generate Topographical Map
            </button>
            <p className="selected-file-info">
              Selected: {selectedFile.name} (
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
        </div>
      )}

      {/* Phase 3: Loading Phase */}
      {currentPhase === "loading" && (
        <div className="phase-container loading-phase">
          <div className="phase-header">
            <div className="phase-indicator">
              <Logo size="small" />
              <span className="phase-number">3</span>
              <span className="phase-title">Processing Your Model</span>
            </div>
          </div>
          <div className="loading-content">
            <div className="loading-main">
              <div className="loading-spinner-large"></div>
              <h2 className="loading-title">{status || "Processing..."}</h2>
              <p className="loading-description">
                {progress > 0
                  ? "Uploading your file..."
                  : "Generating topographical map..."}
              </p>

              {progress > 0 && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="progress-text">{progress}% uploaded</p>
                </div>
              )}

              {progress === 0 && status.includes("Processing") && (
                <div className="processing-info">
                  <p>
                    This may take a few minutes depending on model complexity
                  </p>
                  <div className="processing-steps">
                    <div className="step active">✓ File uploaded</div>
                    <div className="step active">
                      ⚙️ Applying transformations
                    </div>
                    <div className="step active">
                      🗺️ Generating contour lines
                    </div>
                    <div className="step">📸 Rendering final map</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Phase 4: Download Results */}
      {currentPhase === "download" && (
        <div className="phase-container download-phase">
          <div className="phase-header">
            <div className="phase-indicator">
              <Logo size="small" />
              <span className="phase-number">4</span>
              <span className="phase-title">
                Your Topographical Map is Ready!
              </span>
            </div>
            <button onClick={handleRestart} className="restart-btn">
              Create Another Map
            </button>
          </div>

          <ResultImage
            imageUrl={resultImage}
            visible={true}
            onDownload={handleDownloadPNG}
            onDownloadSVG={handleDownloadSVG}
            originalFileName={originalFileName}
            parameters={parameters}
            zBounds={zBounds}
          />
        </div>
      )}

      <ErrorMessage error={error} />

      <div className="footer">
        Read more on{" "}
        <a
          href="https://topography-of-hci.dk/"
          target="_blank"
          rel="noopener noreferrer"
        >
          topography-of-hci.dk
        </a>
      </div>
    </div>
  );
}

export default App;

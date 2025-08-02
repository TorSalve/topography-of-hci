import React from "react";

const ResultImage = ({
  imageUrl,
  visible,
  onDownload,
  onDownloadSVG,
  originalFileName,
  parameters = {}, // Add parameters for SVG generation
  zBounds = null, // Add zBounds for model height display
}) => {
  if (!visible || !imageUrl) return null;

  const nameWithoutExt = originalFileName
    ? originalFileName.replace(/\.[^/.]+$/, "")
    : "topographical_map";

  return (
    <div className="result-container">
      <h3 className="result-title">Generated Topographical Map</h3>
      <div className="result-image-container">
        <img
          src={imageUrl}
          alt="Generated topographical map"
          className="result-image"
        />
      </div>

      <div className="download-options">
        <p className="result-info">
          Your topographical map has been generated successfully! Choose your
          download format:
        </p>

        <div className="download-buttons">
          <button
            className="download-btn download-png"
            onClick={onDownload}
            title="Download as PNG (raster image)"
          >
            📥 Download PNG
          </button>

          <button
            className="download-btn download-svg"
            onClick={() => onDownloadSVG && onDownloadSVG(parameters)}
            title="Download as SVG (vector image, scalable)"
          >
            📄 Download SVG
          </button>
        </div>

        <div className="format-info">
          <p>
            <strong>PNG:</strong> Ready-to-use raster image, best for viewing
            and printing
          </p>
          <p>
            <strong>SVG:</strong> Vector format, scalable to any size, editable
            in design software
          </p>
        </div>

        {/* Parameters and Model Information */}
        <div className="map-details">
          <h4 className="details-title">Map Generation Details</h4>

          {/* Model Information */}
          {zBounds && (
            <div className="detail-section">
              <h5 className="section-title">Model Information</h5>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Model Height (Z-Range):</span>
                  <span className="detail-value">
                    {(zBounds.max - zBounds.min).toFixed(3)} units
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Z Min:</span>
                  <span className="detail-value">{zBounds.min.toFixed(3)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Z Max:</span>
                  <span className="detail-value">{zBounds.max.toFixed(3)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Processing Parameters */}
          <div className="detail-section">
            <h5 className="section-title">Processing Parameters</h5>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">
                  Contour Levels:
                  <div className="detail-description">
                    Number of horizontal slices through the model to create
                    contour lines
                  </div>
                </span>
                <span className="detail-value">
                  {parameters.contourLevels || 20}
                </span>
              </div>

              {parameters.realWorldHeight && (
                <>
                  <div className="detail-item">
                    <span className="detail-label">
                      Real World Height:
                      <div className="detail-description">
                        The actual height of the object in real-world units
                      </div>
                    </span>
                    <span className="detail-value">
                      {parameters.realWorldHeight.toFixed(3)} units
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">
                      Contour Interval:
                      <div className="detail-description">
                        Vertical distance between each contour line
                      </div>
                    </span>
                    <span className="detail-value">
                      {(
                        parameters.realWorldHeight /
                        (parameters.contourLevels || 20)
                      ).toFixed(3)}{" "}
                      units
                    </span>
                  </div>
                </>
              )}

              <div className="detail-item">
                <span className="detail-label">
                  Processing Engine:
                  <div className="detail-description">
                    {(parameters.engine || "trimesh") === "trimesh"
                      ? "Fast processing with clean contour lines"
                      : "Advanced processing with more detailed analysis"}
                  </div>
                </span>
                <span className="detail-value">
                  {parameters.engine || "trimesh"}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">
                  Scale:
                  <div className="detail-description">
                    Size multiplier applied to the entire model
                  </div>
                </span>
                <span className="detail-value">
                  {(parameters.scale || 1.0).toFixed(2)}×
                </span>
              </div>
            </div>
          </div>

          {/* Transformation Parameters - Always show */}
          <div className="detail-section">
            <h5 className="section-title">Transformations Applied</h5>
            <div className="detail-grid-two-column">
              <div className="detail-item detail-item-wide">
                <span className="detail-label">
                  Rotation:
                  <div className="detail-description">
                    Rotation applied around each axis to orient the model for
                    optimal topographical view
                  </div>
                </span>
                <span className="detail-value">
                  X: {(parameters.rotationX || 0).toFixed(1)}°, Y:{" "}
                  {(parameters.rotationY || 0).toFixed(1)}°, Z:{" "}
                  {(parameters.rotationZ || 0).toFixed(1)}°
                </span>
              </div>

              <div className="detail-item detail-item-wide">
                <span className="detail-label">
                  Translation:
                  <div className="detail-description">
                    Position offset applied to move the model in 3D space
                  </div>
                </span>
                <span className="detail-value">
                  X: {(parameters.translationX || 0).toFixed(2)}, Y:{" "}
                  {(parameters.translationY || 0).toFixed(2)}, Z:{" "}
                  {(parameters.translationZ || 0).toFixed(2)}
                </span>
              </div>

              <div className="detail-item detail-item-wide">
                <span className="detail-label">
                  Pivot Point:
                  <div className="detail-description">
                    Center point for rotation and scaling transformations
                  </div>
                </span>
                <span className="detail-value">
                  X: {(parameters.pivotX || 0).toFixed(2)}, Y:{" "}
                  {(parameters.pivotY || 0).toFixed(2)}, Z:{" "}
                  {(parameters.pivotZ || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultImage;

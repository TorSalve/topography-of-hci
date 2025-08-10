import React, { useState, useEffect } from "react";
import styles from "../../../styles/MapEditor.module.scss";

/**
 * Enhanced Inspector panel for editing selected elements with path-specific features
 */
const PropertiesPanel = ({
  selectedElements,
  properties,
  onPropertyChange,
  getTransformInfo,
  onTransform,
}) => {
  const { stroke, strokeWidth, fill, opacity, linecap, linejoin, dasharray } =
    properties;

  const [pathInfo, setPathInfo] = useState(null);
  const [transformInfo, setTransformInfo] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    appearance: true,
    transform: false,
    path: false,
    advanced: false,
  });

  // Extract path-specific information
  useEffect(() => {
    if (selectedElements.length === 1) {
      const element = selectedElements[0];
      if (element.tagName.toLowerCase() === "path") {
        const pathData = element.getAttribute("d") || "";
        const pathLength = element.getTotalLength
          ? element.getTotalLength()
          : 0;
        setPathInfo({
          data: pathData,
          length: Math.round(pathLength * 100) / 100,
          commands: pathData.split(/[MLHVCSQTAZ]/i).length - 1,
          closed: pathData.toLowerCase().includes("z"),
        });
      } else {
        setPathInfo(null);
      }

      // Get transform info if available
      if (getTransformInfo) {
        setTransformInfo(getTransformInfo());
      }
    } else {
      setPathInfo(null);
      setTransformInfo(null);
    }
  }, [selectedElements, getTransformInfo]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (selectedElements.length === 0) {
    return (
      <div className={`${styles.panel} ${styles.propertiesPanel}`}>
        <h3>🔍 Inspector</h3>
        <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
          <div style={{ fontSize: "3em", marginBottom: "10px" }}>📋</div>
          <p>Select an element to view and edit its properties</p>
        </div>
      </div>
    );
  }

  const isPathSelected =
    selectedElements.length === 1 &&
    selectedElements[0].tagName.toLowerCase() === "path";

  return (
    <div className={`${styles.panel} ${styles.propertiesPanel}`}>
      <h3>🔍 Inspector</h3>

      {/* Element Info Header */}
      <div
        style={{
          padding: "8px 12px",
          background: "#f8f9fa",
          borderRadius: "6px",
          marginBottom: "16px",
          fontSize: "0.9em",
          border: "1px solid #e9ecef",
        }}
      >
        {selectedElements.length > 1 ? (
          <div>
            <strong>{selectedElements.length} elements selected</strong>
            <div style={{ color: "#666", fontSize: "0.8em", marginTop: "2px" }}>
              {selectedElements
                .map((el) => el.tagName.toLowerCase())
                .join(", ")}
            </div>
          </div>
        ) : (
          <div>
            <strong>{selectedElements[0].tagName.toLowerCase()}</strong>
            {selectedElements[0].id && (
              <div
                style={{ color: "#666", fontSize: "0.8em", marginTop: "2px" }}
              >
                ID: {selectedElements[0].id}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Appearance Section */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 0",
            borderBottom: "1px solid #e9ecef",
            cursor: "pointer",
            fontWeight: "500",
          }}
          onClick={() => toggleSection("appearance")}
        >
          <span>🎨 Appearance</span>
          <span>{expandedSections.appearance ? "▼" : "▶"}</span>
        </div>

        {expandedSections.appearance && (
          <div style={{ padding: "12px 0" }}>
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "0.9em",
                  fontWeight: "500",
                }}
              >
                Stroke Color
              </label>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <input
                  type="color"
                  value={stroke}
                  onChange={(e) => onPropertyChange("stroke", e.target.value)}
                  style={{
                    width: "40px",
                    height: "30px",
                    border: "none",
                    borderRadius: "4px",
                  }}
                />
                <input
                  type="text"
                  value={stroke}
                  onChange={(e) => onPropertyChange("stroke", e.target.value)}
                  style={{
                    flex: 1,
                    padding: "4px 8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "0.8em",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "0.9em",
                  fontWeight: "500",
                }}
              >
                Stroke Width
              </label>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={strokeWidth}
                  onChange={(e) =>
                    onPropertyChange("stroke-width", e.target.value)
                  }
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={strokeWidth}
                  onChange={(e) =>
                    onPropertyChange("stroke-width", e.target.value)
                  }
                  style={{
                    width: "60px",
                    padding: "4px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "0.8em",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "0.9em",
                  fontWeight: "500",
                }}
              >
                Fill Color
              </label>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <input
                  type="color"
                  value={fill === "none" ? "#ffffff" : fill}
                  onChange={(e) => onPropertyChange("fill", e.target.value)}
                  style={{
                    width: "40px",
                    height: "30px",
                    border: "none",
                    borderRadius: "4px",
                  }}
                />
                <select
                  value={fill}
                  onChange={(e) => onPropertyChange("fill", e.target.value)}
                  style={{
                    flex: 1,
                    padding: "4px 8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "0.8em",
                  }}
                >
                  <option value="none">No Fill</option>
                  <option value={fill === "none" ? "#ffffff" : fill}>
                    Color Fill
                  </option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "0.9em",
                  fontWeight: "500",
                }}
              >
                Opacity: {Math.round(opacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => onPropertyChange("opacity", e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "0.9em",
                    fontWeight: "500",
                  }}
                >
                  Line Cap
                </label>
                <select
                  value={linecap}
                  onChange={(e) =>
                    onPropertyChange("stroke-linecap", e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "4px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "0.8em",
                  }}
                >
                  <option value="butt">Butt</option>
                  <option value="round">Round</option>
                  <option value="square">Square</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "0.9em",
                    fontWeight: "500",
                  }}
                >
                  Line Join
                </label>
                <select
                  value={linejoin}
                  onChange={(e) =>
                    onPropertyChange("stroke-linejoin", e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "4px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "0.8em",
                  }}
                >
                  <option value="miter">Miter</option>
                  <option value="round">Round</option>
                  <option value="bevel">Bevel</option>
                </select>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "0.9em",
                  fontWeight: "500",
                }}
              >
                Dash Pattern
              </label>
              <input
                type="text"
                placeholder="e.g. 5 5 or 10 2 5 2"
                value={dasharray}
                onChange={(e) =>
                  onPropertyChange("stroke-dasharray", e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "4px 8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "0.8em",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Transform Section */}
      {transformInfo && (
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid #e9ecef",
              cursor: "pointer",
              fontWeight: "500",
            }}
            onClick={() => toggleSection("transform")}
          >
            <span>🔄 Transform</span>
            <span>{expandedSections.transform ? "▼" : "▶"}</span>
          </div>

          {expandedSections.transform && (
            <div style={{ padding: "12px 0" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontSize: "0.8em",
                      color: "#666",
                    }}
                  >
                    X Position
                  </label>
                  <div style={{ fontSize: "0.9em", fontFamily: "monospace" }}>
                    {Math.round(transformInfo.position.x)}
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontSize: "0.8em",
                      color: "#666",
                    }}
                  >
                    Y Position
                  </label>
                  <div style={{ fontSize: "0.9em", fontFamily: "monospace" }}>
                    {Math.round(transformInfo.position.y)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontSize: "0.8em",
                      color: "#666",
                    }}
                  >
                    Width
                  </label>
                  <div style={{ fontSize: "0.9em", fontFamily: "monospace" }}>
                    {Math.round(transformInfo.size.width)}
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontSize: "0.8em",
                      color: "#666",
                    }}
                  >
                    Height
                  </label>
                  <div style={{ fontSize: "0.9em", fontFamily: "monospace" }}>
                    {Math.round(transformInfo.size.height)}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "0.8em",
                    color: "#666",
                  }}
                >
                  Rotation: {Math.round(transformInfo.rotation)}°
                </label>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() => onTransform && onTransform("rotate", -15)}
                    style={{
                      padding: "4px 8px",
                      fontSize: "0.8em",
                      border: "1px solid #ddd",
                      borderRadius: "3px",
                      background: "#fff",
                    }}
                  >
                    -15°
                  </button>
                  <button
                    onClick={() => onTransform && onTransform("rotate", 15)}
                    style={{
                      padding: "4px 8px",
                      fontSize: "0.8em",
                      border: "1px solid #ddd",
                      borderRadius: "3px",
                      background: "#fff",
                    }}
                  >
                    +15°
                  </button>
                  <button
                    onClick={() => onTransform && onTransform("reset")}
                    style={{
                      padding: "4px 8px",
                      fontSize: "0.8em",
                      border: "1px solid #ddd",
                      borderRadius: "3px",
                      background: "#fff",
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Path-specific Section */}
      {isPathSelected && pathInfo && (
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid #e9ecef",
              cursor: "pointer",
              fontWeight: "500",
            }}
            onClick={() => toggleSection("path")}
          >
            <span>📐 Path Details</span>
            <span>{expandedSections.path ? "▼" : "▶"}</span>
          </div>

          {expandedSections.path && (
            <div style={{ padding: "12px 0" }}>
              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontSize: "0.8em", color: "#666" }}>
                  Length:{" "}
                </span>
                <span style={{ fontFamily: "monospace", fontSize: "0.9em" }}>
                  {pathInfo.length} units
                </span>
              </div>
              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontSize: "0.8em", color: "#666" }}>
                  Commands:{" "}
                </span>
                <span style={{ fontFamily: "monospace", fontSize: "0.9em" }}>
                  {pathInfo.commands}
                </span>
              </div>
              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontSize: "0.8em", color: "#666" }}>
                  Closed:{" "}
                </span>
                <span style={{ fontFamily: "monospace", fontSize: "0.9em" }}>
                  {pathInfo.closed ? "✅ Yes" : "❌ No"}
                </span>
              </div>
              <div style={{ marginTop: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "0.8em",
                    color: "#666",
                  }}
                >
                  Path Data (d attribute):
                </label>
                <textarea
                  value={pathInfo.data}
                  onChange={(e) => onPropertyChange("d", e.target.value)}
                  style={{
                    width: "100%",
                    height: "60px",
                    padding: "4px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "0.7em",
                    fontFamily: "monospace",
                    resize: "vertical",
                  }}
                  placeholder="M x y L x y ..."
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Advanced Section */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 0",
            borderBottom: "1px solid #e9ecef",
            cursor: "pointer",
            fontWeight: "500",
          }}
          onClick={() => toggleSection("advanced")}
        >
          <span>⚙️ Advanced</span>
          <span>{expandedSections.advanced ? "▼" : "▶"}</span>
        </div>

        {expandedSections.advanced && (
          <div style={{ padding: "12px 0" }}>
            <div style={{ display: "grid", gap: "8px" }}>
              <button
                onClick={() => onTransform && onTransform("flip", "horizontal")}
                style={{
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  background: "#fff",
                  fontSize: "0.8em",
                }}
              >
                ↔️ Flip Horizontal
              </button>
              <button
                onClick={() => onTransform && onTransform("flip", "vertical")}
                style={{
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  background: "#fff",
                  fontSize: "0.8em",
                }}
              >
                ↕️ Flip Vertical
              </button>
              {isPathSelected && (
                <button
                  onClick={() => onPropertyChange("close-path", true)}
                  style={{
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    background: "#fff",
                    fontSize: "0.8em",
                  }}
                >
                  🔗 Close Path
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;

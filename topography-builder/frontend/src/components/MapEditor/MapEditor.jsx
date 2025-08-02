import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "../../styles/MapEditor.module.scss";

/**
 * Main Map Editor Component
 * Provides a comprehensive SVG editing environment for topographical maps
 */
const MapEditor = ({
  initialSvg = null,
  mapMetadata = null,
  onSave,
  onExport,
}) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const contentGroupRef = useRef(null);

  // Editor state
  const [svgContent, setSvgContent] = useState(null);
  const [loadedSvgElements, setLoadedSvgElements] = useState(null);
  const [originalViewBox, setOriginalViewBox] = useState("0 0 600 400");
  const [originalDimensions, setOriginalDimensions] = useState({
    width: "600",
    height: "400",
  });
  const [contentViewBox, setContentViewBox] = useState("0 0 600 400");
  const [contentScale, setContentScale] = useState(1);
  const [selectedElements, setSelectedElements] = useState([]);
  const [activeTool, setActiveTool] = useState("select");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [previousTool, setPreviousTool] = useState("select");

  // Tools available in the editor
  const tools = [
    { id: "select", name: "Select", icon: "⭐" },
    { id: "pan", name: "Pan", icon: "✋" },
    { id: "zoom", name: "Zoom", icon: "🔍" },
    { id: "edit-path", name: "Edit Path", icon: "✏️" },
    { id: "add-label", name: "Add Label", icon: "🏷️" },
    { id: "add-symbol", name: "Add Symbol", icon: "📍" },
    { id: "hiking-path", name: "Hiking Path", icon: "🥾" },
  ];

  // Load SVG content if provided
  useEffect(() => {
    if (initialSvg) {
      if (typeof initialSvg === "string") {
        // Parse the SVG string and extract the content
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(initialSvg, "image/svg+xml");
        const svgElement = svgDoc.documentElement;

        // Check for parsing errors
        const errorNode = svgDoc.querySelector("parsererror");
        if (errorNode) {
          console.error("SVG parsing error:", errorNode.textContent);
          return;
        }

        // Convert SVG content to React-friendly format
        const svgContent = svgElement.innerHTML;

        // Extract viewBox and dimensions from original SVG
        const viewBox = svgElement.getAttribute("viewBox") || "0 0 600 400";
        const width = svgElement.getAttribute("width") || "600";
        const height = svgElement.getAttribute("height") || "400";

        // Parse the original viewBox to understand the coordinate system
        const [minX, minY, vbWidth, vbHeight] = viewBox.split(" ").map(Number);

        // Calculate scale factor to normalize to a reasonable coordinate system
        // If the viewBox is very small (like 0.4 units wide), we need to scale it up
        const targetSize = 1000; // Use 1000x1000 as our normalized coordinate system
        const maxDimension = Math.max(vbWidth, vbHeight);
        const normalizeScale =
          maxDimension < 10 ? targetSize / maxDimension : 1;

        // Create normalized viewBox for the outer SVG
        const normalizedWidth = vbWidth * normalizeScale;
        const normalizedHeight = vbHeight * normalizeScale;
        const normalizedViewBox = `0 0 ${normalizedWidth} ${normalizedHeight}`;

        // Store both original and normalized data
        setOriginalViewBox(normalizedViewBox); // Use normalized for outer SVG
        setContentViewBox(viewBox); // Keep original for content scaling
        setContentScale(normalizeScale); // Scale factor for content
        setOriginalDimensions({
          width: normalizedWidth.toString(),
          height: normalizedHeight.toString(),
        });
        setLoadedSvgElements(svgContent);
        setSvgContent(true); // Mark that content is loaded
      } else if (initialSvg instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(
            e.target.result,
            "image/svg+xml"
          );
          const svgElement = svgDoc.documentElement;

          // Check for parsing errors
          const errorNode = svgDoc.querySelector("parsererror");
          if (errorNode) {
            console.error("SVG parsing error:", errorNode.textContent);
            return;
          }

          // Convert SVG content to React-friendly format
          const svgContent = svgElement.innerHTML;

          // Extract viewBox and dimensions from original SVG
          const viewBox = svgElement.getAttribute("viewBox") || "0 0 600 400";
          const width = svgElement.getAttribute("width") || "600";
          const height = svgElement.getAttribute("height") || "400";

          // Parse the original viewBox to understand the coordinate system
          const [minX, minY, vbWidth, vbHeight] = viewBox
            .split(" ")
            .map(Number);

          // Calculate scale factor to normalize to a reasonable coordinate system
          // If the viewBox is very small (like 0.4 units wide), we need to scale it up
          const targetSize = 1000; // Use 1000x1000 as our normalized coordinate system
          const maxDimension = Math.max(vbWidth, vbHeight);
          const normalizeScale =
            maxDimension < 10 ? targetSize / maxDimension : 1;

          // Create normalized viewBox for the outer SVG
          const normalizedWidth = vbWidth * normalizeScale;
          const normalizedHeight = vbHeight * normalizeScale;
          const normalizedViewBox = `0 0 ${normalizedWidth} ${normalizedHeight}`;

          // Store both original and normalized data
          setOriginalViewBox(normalizedViewBox); // Use normalized for outer SVG
          setContentViewBox(viewBox); // Keep original for content scaling
          setContentScale(normalizeScale); // Scale factor for content
          setOriginalDimensions({
            width: normalizedWidth.toString(),
            height: normalizedHeight.toString(),
          });
          setLoadedSvgElements(svgContent);
          setSvgContent(true); // Mark that content is loaded
        };
        reader.readAsText(initialSvg);
      }
    }
  }, [initialSvg]);

  // Zoom functionality
  const handleZoom = useCallback((direction, mouseEvent = null) => {
    const zoomFactor = direction === "in" ? 1.1 : 0.9;

    setZoom((prevZoom) => {
      const newZoom = Math.max(0.1, Math.min(5, prevZoom * zoomFactor));

      // Apply zoom-to-cursor for both click and wheel events
      if (mouseEvent && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = mouseEvent.clientX - rect.left;
        const mouseY = mouseEvent.clientY - rect.top;

        const containerCenterX = rect.width / 2;
        const containerCenterY = rect.height / 2;

        // Use normal scaling since we have a normalized coordinate system
        const scalingFactor = 1;
        const offsetX = ((mouseX - containerCenterX) * scalingFactor) / newZoom;
        const offsetY = ((mouseY - containerCenterY) * scalingFactor) / newZoom;

        setPan((prevPan) => ({
          x: prevPan.x + offsetX,
          y: prevPan.y + offsetY,
        }));
      }

      return newZoom;
    });
  }, []); // Remove zoom dependency

  // Handle canvas click for different tools
  const handleCanvasClick = (event) => {
    if (activeTool === "zoom") {
      event.preventDefault();
      // Zoom in on left click, zoom out on right click or with shift
      const direction = event.shiftKey ? "out" : "in";
      handleZoom(direction, event);
    } else {
      handleSvgClick(event);
    }
  };

  // Handle SVG element selection
  const handleSvgClick = (event) => {
    // Don't handle clicks if we're panning or just finished panning
    if (activeTool === "pan" || isDragging) {
      return;
    }

    if (activeTool === "select") {
      const clickedElement = event.target;

      // Only select path elements for now
      if (clickedElement.tagName === "path") {
        event.stopPropagation();

        // Toggle selection
        if (selectedElements.includes(clickedElement)) {
          setSelectedElements(
            selectedElements.filter((el) => el !== clickedElement)
          );
          clickedElement.style.stroke =
            clickedElement.getAttribute("data-original-stroke") || "#000";
          clickedElement.style.strokeWidth =
            clickedElement.getAttribute("data-original-stroke-width") || "1";
        } else {
          // Store original styling
          clickedElement.setAttribute(
            "data-original-stroke",
            clickedElement.style.stroke ||
              clickedElement.getAttribute("stroke") ||
              "#000"
          );
          clickedElement.setAttribute(
            "data-original-stroke-width",
            clickedElement.style.strokeWidth ||
              clickedElement.getAttribute("stroke-width") ||
              "1"
          );

          // Highlight selected element
          clickedElement.style.stroke = "#ff0000";
          clickedElement.style.strokeWidth = "3";

          setSelectedElements([...selectedElements, clickedElement]);
        }
      }
    }
  };

  // Delete selected elements
  const deleteSelected = () => {
    selectedElements.forEach((element) => {
      element.remove();
    });
    setSelectedElements([]);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Track shift key for zoom cursor
      if (event.key === "Shift") {
        setIsShiftPressed(true);
      }

      // Track space key for temporary pan mode
      if (event.key === " " && !isSpacePressed) {
        event.preventDefault(); // Prevent page scroll
        setIsSpacePressed(true);
        // Store current tool and switch to pan
        if (activeTool !== "pan") {
          setPreviousTool(activeTool);
          setActiveTool("pan");
        }
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        deleteSelected();
      }
      if (event.key === "Escape") {
        setSelectedElements([]);
      }
      // Zoom shortcuts
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        handleZoom("in");
      }
      if (event.key === "-") {
        event.preventDefault();
        handleZoom("out");
      }
      // Reset view shortcut
      if (event.key === "0" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        resetView();
      }
      // Tool shortcuts (only if space is not pressed)
      if (!isSpacePressed) {
        if (event.key === "v") {
          setActiveTool("select");
        }
        if (event.key === "h") {
          setActiveTool("pan");
        }
        if (event.key === "z") {
          setActiveTool("zoom");
        }
      }
    };

    const handleKeyUp = (event) => {
      // Track shift key for zoom cursor
      if (event.key === "Shift") {
        setIsShiftPressed(false);
      }

      // Track space key for temporary pan mode
      if (event.key === " ") {
        event.preventDefault(); // Prevent page scroll
        setIsSpacePressed(false);
        // Return to previous tool
        setActiveTool(previousTool);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedElements, handleZoom, isSpacePressed, activeTool, previousTool]);

  // Handle mouse wheel zoom
  const handleWheel = useCallback(
    (event) => {
      if (activeTool === "zoom" || event.ctrlKey) {
        event.preventDefault();
        const delta = event.deltaY > 0 ? "out" : "in";
        // Pass the mouse event for wheel zoom to enable zoom-to-cursor
        handleZoom(delta, event);
      }
    },
    [activeTool, handleZoom]
  );

  // Add wheel event listener with non-passive option
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => {
        container.removeEventListener("wheel", handleWheel);
      };
    }
  }, [handleWheel]);

  // Handle mouse down for panning
  const handleMouseDown = (event) => {
    if (activeTool === "pan" || isSpacePressed) {
      event.preventDefault();
      setIsDragging(true);
      setDragStart({ x: event.clientX, y: event.clientY });
      setPanStart({ x: pan.x, y: pan.y });

      // Update cursor to grabbing
      if (containerRef.current) {
        containerRef.current.style.cursor = "grabbing";
      }
    }
  };

  // Handle mouse move for panning
  const handleMouseMove = (event) => {
    if (isDragging && (activeTool === "pan" || isSpacePressed)) {
      event.preventDefault();
      // Use normal pan sensitivity since we have a normalized coordinate system
      const panSensitivity = 1;
      const deltaX = ((event.clientX - dragStart.x) * panSensitivity) / zoom;
      const deltaY = ((event.clientY - dragStart.y) * panSensitivity) / zoom;

      setPan({
        x: panStart.x + deltaX,
        y: panStart.y + deltaY,
      });
    }
  };

  // Handle mouse up for panning
  const handleMouseUp = (event) => {
    if (isDragging && (activeTool === "pan" || isSpacePressed)) {
      event.preventDefault();
      setIsDragging(false);

      // Reset cursor based on current state
      if (containerRef.current) {
        if (isSpacePressed) {
          containerRef.current.style.cursor = "grab";
        } else if (activeTool === "pan") {
          containerRef.current.style.cursor = "grab";
        }
      }
    }
  };

  // Add global mouse event listeners for panning
  useEffect(() => {
    const handleGlobalMouseMove = (event) => handleMouseMove(event);
    const handleGlobalMouseUp = (event) => handleMouseUp(event);

    if (isDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, panStart, pan, zoom, activeTool]);

  // Reset view
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Save current state
  const handleSave = () => {
    if (contentGroupRef.current && onSave) {
      const svgString = svgRef.current.outerHTML;
      onSave(svgString);
    }
  };

  // Export functionality
  const handleExport = (format) => {
    if (contentGroupRef.current && onExport) {
      const svgString = svgRef.current.outerHTML;
      onExport(svgString, format);
    }
  };

  return (
    <div className={styles.mapEditor}>
      {/* Main Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`${styles.toolButton} ${
                activeTool === tool.id ? styles.active : ""
              }`}
              onClick={() => setActiveTool(tool.id)}
              title={`${tool.name}${
                tool.id === "select"
                  ? " (V key)"
                  : tool.id === "pan"
                  ? " (H key)"
                  : tool.id === "zoom"
                  ? " (Z key)"
                  : ""
              }`}
            >
              <div className={styles.toolContent}>
                <span className={styles.toolIcon}>{tool.icon}</span>
                <span className={styles.toolLabel}>{tool.name}</span>
              </div>
            </button>
          ))}
        </div>

        <div className={styles.toolGroup}>
          <button
            className={styles.toolButton}
            onClick={() => handleZoom("in")}
            title="Zoom In (+ key or Ctrl+Scroll)"
          >
            <div className={styles.toolContent}>
              <span className={styles.toolIcon}>🔍+</span>
              <span className={styles.toolLabel}>Zoom In</span>
            </div>
          </button>
          <button
            className={styles.toolButton}
            onClick={() => handleZoom("out")}
            title="Zoom Out (- key or Ctrl+Scroll)"
          >
            <div className={styles.toolContent}>
              <span className={styles.toolIcon}>🔍-</span>
              <span className={styles.toolLabel}>Zoom Out</span>
            </div>
          </button>
          <button
            className={styles.toolButton}
            onClick={resetView}
            title="Reset View (Ctrl+0 or Cmd+0)"
          >
            <div className={styles.toolContent}>
              <span className={styles.toolIcon}>🏠</span>
              <span className={styles.toolLabel}>Reset</span>
            </div>
          </button>
        </div>

        <div className={styles.toolGroup}>
          <button
            className={`${styles.toolButton} ${
              selectedElements.length === 0 ? styles.disabled : ""
            }`}
            onClick={deleteSelected}
            disabled={selectedElements.length === 0}
            title="Delete Selected"
          >
            <div className={styles.toolContent}>
              <span className={styles.toolIcon}>🗑️</span>
              <span className={styles.toolLabel}>Delete</span>
            </div>
          </button>
        </div>

        <div className={styles.toolGroup}>
          <button
            className={styles.toolButton}
            onClick={handleSave}
            title="Save"
          >
            <div className={styles.toolContent}>
              <span className={styles.toolIcon}>💾</span>
              <span className={styles.toolLabel}>Save</span>
            </div>
          </button>
          <button
            className={styles.toolButton}
            onClick={() => handleExport("svg")}
            title="Export SVG"
          >
            <div className={styles.toolContent}>
              <span className={styles.toolIcon}>📤</span>
              <span className={styles.toolLabel}>Export</span>
            </div>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className={styles.canvasContainer}
        onMouseDown={handleMouseDown}
        style={{
          overflow: "hidden",
          cursor: isSpacePressed
            ? isDragging
              ? "grabbing"
              : "grab"
            : activeTool === "pan"
            ? isDragging
              ? "grabbing"
              : "grab"
            : activeTool === "select"
            ? "default"
            : activeTool === "zoom"
            ? isShiftPressed
              ? "zoom-out"
              : "zoom-in"
            : "crosshair",
        }}
      >
        <svg
          ref={svgRef}
          className={styles.mapCanvas}
          onClick={handleCanvasClick}
          onContextMenu={(e) => e.preventDefault()} // Prevent context menu
          width={originalDimensions.width}
          height={originalDimensions.height}
          viewBox={originalViewBox}
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <g
            ref={contentGroupRef}
            style={{
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: "center center",
            }}
          >
            {/* Render loaded SVG content with proper scaling */}
            {loadedSvgElements ? (
              <g
                style={{
                  transform: `scale(${contentScale})`,
                  transformOrigin: "0 0",
                }}
                dangerouslySetInnerHTML={{ __html: loadedSvgElements }}
              />
            ) : (
              /* Default content if no SVG is loaded */
              <>
                <rect width="100%" height="100%" fill="#f5f5f5" />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  fontSize="24"
                  fill="#666"
                  dominantBaseline="middle"
                >
                  {initialSvg
                    ? "Processing SVG..."
                    : "Drop an SVG file here or generate a topography"}
                </text>
                {initialSvg && (
                  <text
                    x="50%"
                    y="60%"
                    textAnchor="middle"
                    fontSize="14"
                    fill="#999"
                    dominantBaseline="middle"
                  >
                    Debug: SVG data exists but not loaded yet
                  </text>
                )}
              </>
            )}
          </g>
        </svg>
      </div>

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <span>Tool: {tools.find((t) => t.id === activeTool)?.name}</span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span>Selected: {selectedElements.length} elements</span>
      </div>

      {/* Side Panels - Placeholder for future implementation */}
      <div className={styles.sidePanels}>
        <div className={`${styles.panel} ${styles.layersPanel}`}>
          <h3>Layers</h3>
          <p>Layer management coming soon...</p>
        </div>

        <div className={`${styles.panel} ${styles.propertiesPanel}`}>
          <h3>Properties</h3>
          {selectedElements.length > 0 ? (
            <div>
              <p>Selected: {selectedElements.length} elements</p>
              <button onClick={deleteSelected}>Delete Selected</button>
            </div>
          ) : (
            <p>Select an element to edit properties</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapEditor;

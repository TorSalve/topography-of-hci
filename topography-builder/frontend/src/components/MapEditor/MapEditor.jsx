import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "../../styles/MapEditor.module.scss";
import { SVG } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.draggable.js";
import "@svgdotjs/svg.resize.js";
import "@svgdotjs/svg.select.js";
import "@svgdotjs/svg.draw.js"; // Drawing tools for creating paths/shapes
import "@svgdotjs/svg.filter.js"; // Visual effects and filters
import "@svgdotjs/svg.panzoom.js"; // Enhanced pan/zoom functionality
import "@svgdotjs/svg.topath.js"; // Convert shapes to paths
import {
  normalizeColor,
  elementBoundsInSvg,
  intersectsRect,
} from "../../utils/svgUtils";
import { clientToSvgUnits, computeZoomedCamera } from "../../utils/cameraUtils";
import PropertiesPanel from "./components/PropertiesPanel";

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
  // New: overlay refs for selection visuals
  const overlayGroupRef = useRef(null);
  const overlayDrawRef = useRef(null);
  const overlayMapRef = useRef(new Map()); // DOM Element -> svg.js rect overlay
  const overlayFnsRef = useRef({
    update: () => {},
    restyle: () => {},
    remove: () => {},
  });
  // Menu refs (used for dropdown logic)
  const fileMenuRef = useRef(null);
  const editMenuRef = useRef(null);
  const viewMenuRef = useRef(null);
  // svg.js refs
  const drawRef = useRef(null);
  const svgjsMapRef = useRef(new WeakMap()); // DOM node -> svg.js element
  const svgjsEnabledRef = useRef(false);
  // Transform target (only last selected gets handles)
  const transformElRef = useRef(null);
  const transformHandlersRef = useRef([]); // [ [event, handler], ... ]
  // Marquee selection state
  const [isMarquee, setIsMarquee] = useState(false);
  const [isMarqueeSelection, setIsMarqueeSelection] = useState(false); // Track if current selection came from marquee
  const [justFinishedMarquee, setJustFinishedMarquee] = useState(false); // Prevent immediate clicks after marquee
  const marqueeStartRef = useRef({ x: 0, y: 0 });
  const marqueeRectRef = useRef(null);

  // Debug state for tracking hover issues
  const [debugMode, setDebugMode] = useState(false);
  const debugLogRef = useRef(null);

  // Hover overlay state - creates DOM copies instead of modifying originals
  const [hoveredElement, setHoveredElement] = useState(null);
  const hoverOverlayRef = useRef(null);
  const hoveredElementRef = useRef(null);

  // Update ref when hovered element changes
  useEffect(() => {
    hoveredElementRef.current = hoveredElement;
  }, [hoveredElement]);

  // Throttled debug logger for hover events
  const logHoverDebug = useCallback(
    (target) => {
      if (!debugMode) return;

      clearTimeout(debugLogRef.current);
      debugLogRef.current = setTimeout(() => {
        if (target) {
          // Debug logging removed
        }
      }, 250); // Increased throttle to 250ms for better performance
    },
    [debugMode]
  );

  // Create hover overlay by cloning element with blue styling
  const createHoverOverlay = useCallback(
    (element) => {
      if (!hoverOverlayRef.current || !element) {
        console.warn("createHoverOverlay: Missing hoverOverlayRef or element", {
          hasRef: !!hoverOverlayRef.current,
          hasElement: !!element,
        });
        return;
      }

      // Performance: Skip if already hovering this element
      if (hoveredElement === element) {
        return;
      }

      // Clear any existing hover overlay
      clearHoverOverlay();

      try {
        // Clone the element with minimal processing
        const clone = element.cloneNode(false); // Shallow clone for performance

        // Apply blue hover styling to the clone (not the original)
        clone.setAttribute("stroke", "#0066ff"); // Blue color

        // Get current stroke width (already scaled)
        const currentWidth = parseFloat(
          element.getAttribute("stroke-width") || "1"
        );
        // Make hover effect slightly thinner for better visual distinction
        const hoverWidth = currentWidth * 0.8;
        clone.setAttribute("stroke-width", hoverWidth.toString());

        // Remove any fill to make it just an outline
        clone.setAttribute("fill", "none");
        clone.setAttribute("opacity", "0.7");

        // Add a class to identify as hover overlay
        clone.classList.add("hover-overlay");

        // Add to hover overlay group - use the actual DOM element
        const hoverGroup = hoverOverlayRef.current;
        if (hoverGroup && hoverGroup.appendChild) {
          hoverGroup.appendChild(clone);
          if (debugMode) {
            // Debug logging removed
          }
        } else {
          console.warn("❌ Hover overlay group not available for appendChild", {
            hoverGroup,
            hasAppendChild:
              hoverGroup && typeof hoverGroup.appendChild === "function",
          });
        }

        setHoveredElement(element);
      } catch (e) {
        console.warn("Failed to create hover overlay:", e);
      }
    },
    [hoveredElement, debugMode]
  );

  // Clear hover overlay
  const clearHoverOverlay = useCallback(() => {
    if (hoverOverlayRef.current) {
      // Remove all hover overlay elements
      const overlays =
        hoverOverlayRef.current.querySelectorAll(".hover-overlay");
      overlays.forEach((overlay) => overlay.remove());
    }
    setHoveredElement(null);
  }, []);

  // Handle mouse enter/leave for hover effects
  const handleElementHover = useCallback(
    (event) => {
      const selectableTags = [
        "path",
        "polyline",
        "polygon",
        "line",
        "rect",
        "circle",
        "ellipse",
        "use",
      ];
      const target = event.target;

      if (
        selectableTags.includes(target.tagName?.toLowerCase()) &&
        target.closest('[class*="contentGroup"]') &&
        !target.getAttribute("data-selected") &&
        !target.classList.contains("hover-overlay")
      ) {
        if (event.type === "mouseenter") {
          // Only create hover overlay if we're not already hovering this element
          if (hoveredElement !== target) {
            createHoverOverlay(target);
          }
        } else if (event.type === "mouseleave") {
          // Only clear if we're leaving the actual hovered element
          if (hoveredElement === target) {
            clearHoverOverlay();
          }
        }
      }
    },
    [createHoverOverlay, clearHoverOverlay, hoveredElement]
  );

  // Camera/viewBox state and refs (defined early to avoid TDZ)
  const [camera, setCamera] = useState(() => ({
    minX: 0,
    minY: 0,
    width: 600,
    height: 400,
  }));
  const cameraStartRef = useRef(null);
  const baseSizeRef = useRef({ width: 600, height: 400 });
  const initialOffsetRef = useRef({ x: 0, y: 0 });

  // Helper to get/create svg.js wrapper for a native node
  const getShape = useCallback((node) => {
    if (!node) return null;
    const cached = svgjsMapRef.current.get(node);
    if (cached) return cached;
    try {
      const wrapped = SVG(node);
      svgjsMapRef.current.set(node, wrapped);
      return wrapped;
    } catch (e) {
      return null;
    }
  }, []);

  // Map client coords to outer SVG units (use util)
  const clientToSvg = useCallback(
    (evt) => clientToSvgUnits(containerRef.current, camera, evt),
    [camera]
  );

  // Attribute helpers moved to utils
  // const getAttr = useCallback(...)
  // const normalizeColor = (...)

  // Compute element bounds moved to utils; wrap to bind svgRef
  const boundsFor = useCallback((el) => {
    const bounds = elementBoundsInSvg(svgRef.current, el);
    return bounds;
  }, []);

  // Update Properties panel state from a given element
  const updatePropsFromElement = useCallback((el) => {
    if (!el) return;
    try {
      setPropStroke(normalizeColor(el.getAttribute("stroke") || "#000000"));
      setPropStrokeWidth(el.getAttribute("stroke-width") || "1");
      setPropFill(
        normalizeColor(el.getAttribute("fill") || "#ffffff", "#ffffff")
      );
      setPropOpacity(el.getAttribute("opacity") || "1");
      setPropLinecap(el.getAttribute("stroke-linecap") || "butt");
      setPropLinejoin(el.getAttribute("stroke-linejoin") || "miter");
      setPropDasharray(el.getAttribute("stroke-dasharray") || "");
    } catch {}
  }, []);

  // Detach transform listeners from a shape
  const detachTransformListeners = (shape) => {
    if (!shape) return;
    try {
      transformHandlersRef.current.forEach(([ev, fn]) => {
        try {
          shape.off(ev, fn);
        } catch {}
      });
    } catch {}
    transformHandlersRef.current = [];
  };

  // Transform feedback state for showing current values during transformations
  const [transformFeedback, setTransformFeedback] = useState({
    visible: false,
    text: "",
    timeout: null,
  });

  // Show transform feedback temporarily
  const showTransformFeedback = useCallback((text, duration = 2000) => {
    setTransformFeedback((prev) => {
      // Clear existing timeout
      if (prev.timeout) {
        clearTimeout(prev.timeout);
      }

      // Set new timeout to hide feedback
      const timeout = setTimeout(() => {
        setTransformFeedback((curr) => ({ ...curr, visible: false }));
      }, duration);

      return {
        visible: true,
        text,
        timeout,
      };
    });
  }, []);

  // Enhanced svg.js transformation system with comprehensive manipulation capabilities
  const enableTransformFor = useCallback(
    (el) => {
      if (!svgjsEnabledRef.current) return;
      if (transformElRef.current === el) return; // already active

      // Disable previous active
      if (transformElRef.current) {
        const prevShape = getShape(transformElRef.current);
        if (prevShape) {
          detachTransformListeners(prevShape);
          try {
            prevShape.selectize && prevShape.selectize(false);
            prevShape.resize && prevShape.resize("stop");
            prevShape.draggable && prevShape.draggable(false);
          } catch {}
        }
      }

      transformElRef.current = el || null;

      if (!el) return;
      const shape = getShape(el);
      if (!shape) return;

      try {
        // Enable comprehensive svg.js transformations

        // 1. Dragging with constraints and snap-to-grid (optional)
        shape.draggable &&
          shape.draggable({
            beforestart: (event) => {
              // You can add constraints here, e.g., bounds checking
              return true;
            },
          });

        // 2. Selection handles with rotation point
        shape.selectize &&
          shape.selectize({
            rotationPoint: true, // Enable rotation handle
            pointSize: 8, // Size of corner handles
            pointType: "rect", // Shape of handles (rect, circle)
            classRect: "svg-select-handle",
            classPoints: "svg-select-points",
            classLine: "svg-select-line",
            pointAttrs: {
              fill: "#00a3ff",
              stroke: "#ffffff",
              "stroke-width": 2,
            },
          });

        // 3. Resize with aspect ratio preservation (hold shift)
        shape.resize &&
          shape.resize({
            snapToGrid: 1, // Optional grid snapping
            preserveAspectRatio: false, // Can be toggled with shift key
            constraint: {
              // Optional size constraints
              minX: 1,
              minY: 1,
              maxX: 10000,
              maxY: 10000,
            },
          });

        // Enhanced event listeners with more capabilities
        const onDragStart = (event) => {
          // Store initial position for undo/redo
        };

        const onDragMove = (event) => {
          overlayFnsRef.current.updateUnified();
          // Real-time position feedback
          const bbox = shape.bbox();
          showTransformFeedback(
            `Position: ${Math.round(bbox.x)}, ${Math.round(bbox.y)}`,
            100
          );
        };

        const onDragEnd = (event) => {
          updatePropsFromElement(el);
          overlayFnsRef.current.updateUnified();
          const bbox = shape.bbox();
          showTransformFeedback(
            `✅ Moved to: ${Math.round(bbox.x)}, ${Math.round(bbox.y)}`
          );
          // Add to undo stack
        };

        const onResizeStart = (event) => {
          // Store initial size for undo/redo
        };

        const onResizing = (event) => {
          overlayFnsRef.current.updateUnified();
          // Real-time size feedback
          const bbox = shape.bbox();
          showTransformFeedback(
            `Size: ${Math.round(bbox.width)} × ${Math.round(bbox.height)}`,
            100
          );
        };

        const onResizeDone = (event) => {
          updatePropsFromElement(el);
          overlayFnsRef.current.updateUnified();
          const bbox = shape.bbox();
          showTransformFeedback(
            `✅ Resized to: ${Math.round(bbox.width)} × ${Math.round(
              bbox.height
            )}`
          );
          // Add to undo stack
        };

        const onRotateStart = (event) => {
          // Store initial rotation for undo/redo
        };

        const onRotating = (event) => {
          overlayFnsRef.current.updateUnified();
          // Real-time rotation feedback
          const transform = shape.transform();
          const rotation = Math.round((transform.rotation || 0) % 360);
          showTransformFeedback(`Rotation: ${rotation}°`, 100);
        };

        const onRotateEnd = (event) => {
          updatePropsFromElement(el);
          overlayFnsRef.current.updateUnified();
          const transform = shape.transform();
          const rotation = Math.round((transform.rotation || 0) % 360);
          showTransformFeedback(`✅ Rotated to: ${rotation}°`);
          // Add to undo stack
        };

        // Attach all event listeners
        try {
          shape.on("dragstart", onDragStart);
          shape.on("dragmove", onDragMove);
          shape.on("dragend", onDragEnd);
          shape.on("resizestart", onResizeStart);
          shape.on("resizing", onResizing);
          shape.on("resizedone", onResizeDone);
          shape.on("rotatestart", onRotateStart);
          shape.on("rotating", onRotating);
          shape.on("rotateend", onRotateEnd);
        } catch (e) {
          console.warn("Failed to attach some transform listeners:", e);
        }

        transformHandlersRef.current = [
          ["dragstart", onDragStart],
          ["dragmove", onDragMove],
          ["dragend", onDragEnd],
          ["resizestart", onResizeStart],
          ["resizing", onResizing],
          ["resizedone", onResizeDone],
          ["rotatestart", onRotateStart],
          ["rotating", onRotating],
          ["rotateend", onRotateEnd],
        ];

        // Debug logging removed
      } catch (e) {
        console.error("Failed to enable svg.js transforms:", e);
      }
    },
    [getShape, updatePropsFromElement, showTransformFeedback]
  );

  // Disable transform for a given element
  const disableTransformFor = useCallback(
    (el) => {
      if (!el) return;
      const shape = getShape(el);
      if (!shape) return;
      detachTransformListeners(shape);
      try {
        shape.selectize && shape.selectize(false);
        shape.resize && shape.resize("stop");
        shape.draggable && shape.draggable(false);
      } catch {}
    },
    [getShape]
  );

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

  // Properties panel state (reflects first selected element; writes to all selected)
  const [propStroke, setPropStroke] = useState("#000000");
  const [propStrokeWidth, setPropStrokeWidth] = useState("1");
  const [propFill, setPropFill] = useState("#ffffff");
  const [propOpacity, setPropOpacity] = useState("1");
  const [propLinecap, setPropLinecap] = useState("butt");
  const [propLinejoin, setPropLinejoin] = useState("miter");
  const [propDasharray, setPropDasharray] = useState("");

  // Enhanced drawing functionality using svg.js (declared early to avoid TDZ)
  const [isDrawing, setIsDrawing] = useState(false);
  const drawingElementRef = useRef(null);

  // Forward declare functions that will be used in tools array (implementations moved later)
  const startDrawingRef = useRef(() => {});
  const stopDrawingRef = useRef(() => {});
  const convertToPathRef = useRef(() => {});
  const applyFilterRef = useRef(() => {});

  const startDrawing = useCallback((tool) => {
    startDrawingRef.current(tool);
  }, []);

  const stopDrawing = useCallback(() => {
    stopDrawingRef.current();
  }, []);

  const convertToPath = useCallback(() => {
    convertToPathRef.current();
  }, []);

  const applyFilter = useCallback((filterType, intensity = 1) => {
    applyFilterRef.current(filterType, intensity);
  }, []);

  // Tools available in the editor (enhanced with new svg.js packages)
  const tools = [
    {
      id: "select",
      name: "Select",
      icon: "⭐",
      action: () => setActiveTool("select"),
    },
    {
      id: "pan",
      name: "Pan (Space)",
      icon: "✋",
      action: () => setActiveTool("pan"),
    },
    {
      id: "zoom",
      name: "Zoom (Ctrl+Wheel)",
      icon: "🔍",
      action: () => setActiveTool("zoom"),
    },
    // {
    //   id: "draw-path",
    //   name: "Draw Path (Ctrl+P)",
    //   icon: "🖊️",
    //   action: () => startDrawing("draw-path"),
    // },
    // {
    //   id: "draw-polygon",
    //   name: "Draw Area (Ctrl+Shift+A)",
    //   icon: "🔺",
    //   action: () => startDrawing("draw-polygon"),
    // },
    // {
    //   id: "draw-line",
    //   name: "Draw Line (Ctrl+L)",
    //   icon: "📏",
    //   action: () => startDrawing("draw-line"),
    // },
    // {
    //   id: "convert-to-path",
    //   name: "Convert to Path (Ctrl+Shift+P)",
    //   icon: "🛤️",
    //   action: convertToPath,
    // },
    // {
    //   id: "drop-shadow",
    //   name: "Drop Shadow (Ctrl+Shift+S)",
    //   icon: "🌫️",
    //   action: () => applyFilter("drop-shadow"),
    // },
    // {
    //   id: "glow",
    //   name: "Glow Effect (Ctrl+Shift+G)",
    //   icon: "✨",
    //   action: () => applyFilter("glow"),
    // },
    // {
    //   id: "blur",
    //   name: "Blur Effect (Ctrl+Shift+B)",
    //   icon: "🌊",
    //   action: () => applyFilter("blur", 2),
    // },
    // {
    //   id: "remove-filters",
    //   name: "Clear Filters (Ctrl+Shift+F)",
    //   icon: "🧹",
    //   action: () => applyFilter("remove-filters"),
    // },
    { id: "add-label", name: "Add Label", icon: "🏷️" },
    { id: "add-symbol", name: "Add Symbol", icon: "📍" },
    { id: "hiking-path", name: "Hiking Path", icon: "🥾" },
  ];

  // Programmatic transformation utilities using svg.js (defined after state)
  const transformSelected = useCallback(
    (transformType, value) => {
      if (selectedElements.length === 0) return;

      selectedElements.forEach((el) => {
        const shape = getShape(el);
        if (!shape) return;

        try {
          switch (transformType) {
            case "rotate":
              // Rotate around center by specified degrees
              const bbox = shape.bbox();
              const centerX = bbox.x + bbox.width / 2;
              const centerY = bbox.y + bbox.height / 2;
              shape.rotate(value, centerX, centerY);
              showTransformFeedback(
                `🔄 Rotated ${value > 0 ? "+" : ""}${value}°`
              );
              break;

            case "scale":
              // Scale uniformly or with separate x/y values
              if (typeof value === "number") {
                shape.scale(value, value);
                showTransformFeedback(`📏 Scaled ${Math.round(value * 100)}%`);
              } else if (value.x && value.y) {
                shape.scale(value.x, value.y);
                showTransformFeedback(
                  `📏 Scaled ${Math.round(value.x * 100)}% × ${Math.round(
                    value.y * 100
                  )}%`
                );
              }
              break;

            case "translate":
              // Move by dx, dy
              if (value.x !== undefined && value.y !== undefined) {
                shape.translate(value.x, value.y);
                showTransformFeedback(
                  `📍 Moved ${value.x > 0 ? "+" : ""}${value.x}, ${
                    value.y > 0 ? "+" : ""
                  }${value.y}`
                );
              }
              break;

            case "skew":
              // Skew transformation
              if (value.x !== undefined || value.y !== undefined) {
                shape.skew(value.x || 0, value.y || 0);
                showTransformFeedback(
                  `🔀 Skewed ${value.x || 0}°, ${value.y || 0}°`
                );
              }
              break;

            case "flip":
              // Flip horizontally or vertically
              if (value === "horizontal") {
                shape.scale(-1, 1);
                showTransformFeedback(`🔄 Flipped horizontally`);
              } else if (value === "vertical") {
                shape.scale(1, -1);
                showTransformFeedback(`🔄 Flipped vertically`);
              }
              break;

            case "reset":
              // Reset all transformations
              shape.untransform();
              showTransformFeedback(`🔄 Reset transformations`);
              break;

            default:
              console.warn("Unknown transform type:", transformType);
          }

          // Update properties and overlays after transformation
          updatePropsFromElement(el);
          overlayFnsRef.current.updateUnified();

          // Debug logging removed
        } catch (e) {
          console.error(`Failed to apply ${transformType} to element:`, e);
        }
      });
    },
    [selectedElements, getShape, updatePropsFromElement, showTransformFeedback]
  );

  // Path-specific manipulation utilities (for path elements)
  const manipulatePath = useCallback(
    (operation, params = {}) => {
      const pathElements = selectedElements.filter(
        (el) => el.tagName.toLowerCase() === "path"
      );
      if (pathElements.length === 0) {
        console.warn("No path elements selected for path manipulation");
        return;
      }

      pathElements.forEach((el) => {
        const shape = getShape(el);
        if (!shape || !shape.attr("d")) return;

        try {
          switch (operation) {
            case "smooth":
              // Smooth the path using svg.js path utilities
              const pathData = shape.attr("d");
              // svg.js doesn't have built-in smoothing, but you can process the path data
              // Debug logging removed
              break;

            case "reverse":
              // Reverse path direction
              const path = shape.plot();
              if (path && path.reverse) {
                shape.plot(path.reverse());
              }
              break;

            case "close":
              // Close the path if not already closed
              let d = shape.attr("d");
              if (d && !d.trim().endsWith("Z") && !d.trim().endsWith("z")) {
                shape.attr("d", d + " Z");
              }
              break;

            case "simplify":
              // Simplify path by reducing points (would need custom implementation)
              break;

            default:
              console.warn("Unknown path operation:", operation);
          }

          updatePropsFromElement(el);
          overlayFnsRef.current.updateUnified();
        } catch (e) {
          console.error(`Failed to apply path operation ${operation}:`, e);
        }
      });
    },
    [selectedElements, getShape, updatePropsFromElement]
  );

  // Helper to get current transform values of selected element
  const getTransformInfo = useCallback(() => {
    if (selectedElements.length === 0) return null;

    const el = selectedElements[0]; // Get info from first selected element
    const shape = getShape(el);
    if (!shape) return null;

    try {
      const transform = shape.transform();
      const bbox = shape.bbox();

      return {
        position: { x: bbox.x, y: bbox.y },
        size: { width: bbox.width, height: bbox.height },
        rotation: transform.rotation || 0,
        scale: { x: transform.scaleX || 1, y: transform.scaleY || 1 },
        skew: { x: transform.skewX || 0, y: transform.skewY || 0 },
        translate: {
          x: transform.translateX || 0,
          y: transform.translateY || 0,
        },
      };
    } catch (e) {
      console.error("Failed to get transform info:", e);
      return null;
    }
  }, [selectedElements, getShape]);

  // Load SVG content if provided
  useEffect(() => {
    if (!initialSvg) return;

    const applyLoadedSvg = (svgElement) => {
      const inner = svgElement.innerHTML;
      const viewBox = svgElement.getAttribute("viewBox") || "0 0 600 400";
      const widthAttr = svgElement.getAttribute("width") || "600";
      const heightAttr = svgElement.getAttribute("height") || "400";
      const [, , vbWidth, vbHeight] = viewBox.split(" ").map(Number);

      // Normalize very small coordinate systems
      const targetSize = 1000;
      const maxDimension = Math.max(vbWidth || 0, vbHeight || 0) || 1;
      const normalizeScale = maxDimension < 10 ? targetSize / maxDimension : 1;

      const normalizedWidth = (vbWidth || 600) * normalizeScale;
      const normalizedHeight = (vbHeight || 400) * normalizeScale;

      // Update states: dimensions, content, scale
      setOriginalDimensions({
        width: String(normalizedWidth),
        height: String(normalizedHeight),
      });
      setOriginalViewBox(`0 0 ${normalizedWidth} ${normalizedHeight}`);
      setContentViewBox(viewBox);
      setContentScale(normalizeScale);
      setLoadedSvgElements(inner);
      setSvgContent(true);

      // Initialize camera and base size
      baseSizeRef.current = {
        width: normalizedWidth,
        height: normalizedHeight,
      };
      setCamera({
        minX: 0,
        minY: 0,
        width: normalizedWidth,
        height: normalizedHeight,
      });

      initialOffsetRef.current = { x: 0, y: 0 };
    };

    if (typeof initialSvg === "string") {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(initialSvg, "image/svg+xml");
      const errorNode = svgDoc.querySelector("parsererror");
      if (errorNode) {
        console.error("SVG parsing error:", errorNode.textContent);
        return;
      }
      const svgElement = svgDoc.documentElement;
      applyLoadedSvg(svgElement);
    } else if (initialSvg instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(e.target.result, "image/svg+xml");
        const errorNode = svgDoc.querySelector("parsererror");
        if (errorNode) {
          console.error("SVG parsing error:", errorNode.textContent);
          return;
        }
        const svgElement = svgDoc.documentElement;
        applyLoadedSvg(svgElement);
      };
      reader.readAsText(initialSvg);
    }
  }, [initialSvg]);

  // Inject loaded SVG content into the <g> via svg.js
  useEffect(() => {
    if (!contentGroupRef.current) return;
    if (loadedSvgElements == null) return;

    try {
      const group = SVG(contentGroupRef.current);
      group.clear();
      group.svg(loadedSvgElements);

      // Store original stroke widths for better selection styling and add debug IDs
      const selectableElements = contentGroupRef.current.querySelectorAll(
        "path, polyline, polygon, line, rect, circle, ellipse, use"
      );

      // Local handler function to avoid dependency issues
      const localHandleHover = (event) => {
        const selectableTags = [
          "path",
          "polyline",
          "polygon",
          "line",
          "rect",
          "circle",
          "ellipse",
          "use",
        ];
        const target = event.target;

        if (
          selectableTags.includes(target.tagName?.toLowerCase()) &&
          target.closest('[class*="contentGroup"]') &&
          !target.getAttribute("data-selected") &&
          !target.classList.contains("hover-overlay")
        ) {
          if (event.type === "mouseenter") {
            // Use ref to get current hovered element to avoid stale closure
            const currentHovered = hoveredElementRef.current;
            if (target !== currentHovered) {
              if (hoverOverlayRef.current && target) {
                // Clear any existing hover overlay first
                const overlays =
                  hoverOverlayRef.current.querySelectorAll(".hover-overlay");
                overlays.forEach((overlay) => overlay.remove());

                try {
                  // Clone the element with minimal processing
                  const clone = target.cloneNode(false);
                  clone.setAttribute("stroke", "#0066ff");
                  const currentWidth = parseFloat(
                    target.getAttribute("stroke-width") || "1"
                  );
                  const hoverWidth = currentWidth * 0.8;
                  clone.setAttribute("stroke-width", hoverWidth.toString());
                  clone.setAttribute("fill", "none");
                  clone.setAttribute("opacity", "0.7");
                  clone.classList.add("hover-overlay");

                  hoverOverlayRef.current.appendChild(clone);
                  setHoveredElement(target);
                } catch (e) {
                  console.warn("Failed to create hover overlay:", e);
                }
              }
            }
          } else if (event.type === "mouseleave") {
            // Use ref to get current hovered element to avoid stale closure
            const currentHovered = hoveredElementRef.current;
            if (target === currentHovered) {
              // Clear hover overlay through ref
              if (hoverOverlayRef.current) {
                const overlays =
                  hoverOverlayRef.current.querySelectorAll(".hover-overlay");
                overlays.forEach((overlay) => overlay.remove());
              }
              setHoveredElement(null);
            }
          }
        }
      };

      selectableElements.forEach((el, index) => {
        const strokeWidth = el.getAttribute("stroke-width") || "1";
        el.style.setProperty("--original-stroke-width", strokeWidth);

        // Remove any shared CSS classes to enable individual styling
        el.removeAttribute("class");

        // Preserve and normalize individual styling attributes
        const stroke = el.getAttribute("stroke") || "#000000";
        const fill = el.getAttribute("fill") || "none";
        const opacity = el.getAttribute("opacity") || "1";
        const strokeLinecap = el.getAttribute("stroke-linecap") || "round";
        const strokeLinejoin = el.getAttribute("stroke-linejoin") || "round";

        // Ensure each element has its own inline styles for independent control
        el.setAttribute("stroke", stroke);
        el.setAttribute("fill", fill);
        el.setAttribute("opacity", opacity);
        el.setAttribute("stroke-linecap", strokeLinecap);
        el.setAttribute("stroke-linejoin", strokeLinejoin);

        // Scale stroke width inversely to contentScale to maintain visual consistency
        // When contentScale > 1, coordinates are scaled up, so we scale stroke down
        const currentWidth = parseFloat(strokeWidth);
        const visuallyConsistentWidth = currentWidth / contentScale;
        // Add minimum stroke width for very thin paths to make them easier to click
        const finalStrokeWidth = Math.max(
          0.3 / contentScale,
          visuallyConsistentWidth
        );
        el.setAttribute("stroke-width", finalStrokeWidth.toString());

        // Add unique ID for debugging if element doesn't already have one
        if (!el.id) {
          el.id = `${el.tagName.toLowerCase()}-${index}`;
        }

        // Add a data attribute to identify this as an editable element
        el.setAttribute("data-editable", "true");

        // Add hover event listeners
        el.addEventListener("mouseenter", localHandleHover);
        el.addEventListener("mouseleave", localHandleHover);
      });

      if (import.meta.env && import.meta.env.DEV) {
      }
    } catch (e) {
      console.warn("[svg.js] failed to inject content", e);
    }

    // Cleanup function for event listeners
    return () => {
      if (contentGroupRef.current) {
        const elements = contentGroupRef.current.querySelectorAll(
          "path, polyline, polygon, line, rect, circle, ellipse, use"
        );
        elements.forEach((el) => {
          // Remove event listeners - using the local handler reference stored in closure
          el.removeEventListener("mouseenter", localHandleHover);
          el.removeEventListener("mouseleave", localHandleHover);
        });
      }
    };
  }, [loadedSvgElements, contentScale]);

  // Initialize svg.js root and enable plugins (needed for marquee overlay and transforms)
  useEffect(() => {
    if (!svgRef.current) return;
    try {
      const draw = SVG(svgRef.current);
      drawRef.current = draw;
      // Also init overlay draw if overlay group exists
      if (overlayGroupRef.current) {
        try {
          overlayDrawRef.current = SVG(overlayGroupRef.current);
        } catch {}
      }
      svgjsEnabledRef.current = true;
      if (import.meta.env && import.meta.env.DEV) {
      }
    } catch (e) {
      svgjsEnabledRef.current = false;
      console.warn("[svg.js] failed to init root", e);
    }
  }, []);

  // After overlay group mounts, ensure overlayDrawRef is set (run when content is injected)
  useEffect(() => {
    if (overlayGroupRef.current) {
      try {
        overlayDrawRef.current = SVG(overlayGroupRef.current);
      } catch {}
    }
  }, [loadedSvgElements]);

  // Helper to compute and draw/update overlay rect for a selected element with handles
  const updateOverlayFor = useCallback(
    (el, isActive = false) => {
      if (!el || !overlayDrawRef.current) return;
      const bounds = boundsFor(el);
      if (!bounds) return;
      const x = bounds.minX;
      const y = bounds.minY;
      const w = Math.max(0, bounds.maxX - bounds.minX);
      const h = Math.max(0, bounds.maxY - bounds.minY);

      // Remove any existing overlay and handles for this element
      const rect = overlayMapRef.current.get(el);
      if (rect) {
        try {
          rect.remove();
        } catch {}
        overlayMapRef.current.delete(el);
      }

      // Remove existing handles
      [
        `${el.id}-handle-0`,
        `${el.id}-handle-1`,
        `${el.id}-handle-2`,
        `${el.id}-handle-3`,
        `${el.id}-rotation-handle`,
      ].forEach((id) => {
        const existing = overlayMapRef.current.get(id);
        if (existing) {
          try {
            existing.remove();
          } catch {}
          overlayMapRef.current.delete(id);
        }
      });

      try {
        // Create selection rectangle
        const newRect = overlayDrawRef.current
          .rect(w, h)
          .move(x, y)
          .fill("none")
          .attr({
            "fill-opacity": 0.06,
            fill: "#00A3FF",
          })
          .stroke({
            color: isActive ? "#0077ff" : "#00A3FF",
            width: isActive ? 2 : 1,
            dasharray: isActive ? null : "4 2",
          })
          .attr({
            pointerEvents: "none",
          });
        overlayMapRef.current.set(el, newRect);

        // Add corner handles for active selection
        if (isActive) {
          const handleSize = Math.max(6, 6 / contentScale);
          const halfHandle = handleSize / 2;

          // Top-left, top-right, bottom-right, bottom-left
          const handlePositions = [
            { x: x - halfHandle, y: y - halfHandle },
            { x: x + w - halfHandle, y: y - halfHandle },
            { x: x + w - halfHandle, y: y + h - halfHandle },
            { x: x - halfHandle, y: y + h - halfHandle },
          ];

          handlePositions.forEach((pos, i) => {
            const handle = overlayDrawRef.current
              .rect(handleSize, handleSize)
              .move(pos.x, pos.y)
              .fill("#00A3FF")
              .stroke({
                color: "#ffffff",
                width: Math.max(1, 1 / contentScale),
              })
              .attr({
                pointerEvents: "none",
              });
            overlayMapRef.current.set(`${el.id}-handle-${i}`, handle);
          });

          // Add rotation handle (above center of top edge)
          const rotationRadius = Math.max(4, 4 / contentScale);
          const rotationOffset = Math.max(20, 20 / contentScale);
          const rotationX = x + w / 2 - rotationRadius;
          const rotationY = y - rotationOffset;

          const rotationHandle = overlayDrawRef.current
            .circle(Math.max(8, 8 / contentScale))
            .move(rotationX, rotationY)
            .fill("#ff6b6b")
            .stroke({ color: "#ffffff", width: Math.max(1, 1 / contentScale) })
            .attr({
              pointerEvents: "none",
            });
          overlayMapRef.current.set(`${el.id}-rotation-handle`, rotationHandle);
        }
      } catch {}
    },
    [boundsFor, contentScale]
  );

  const removeOverlayFor = useCallback((el) => {
    const rect = overlayMapRef.current.get(el);
    if (rect) {
      try {
        rect.remove();
      } catch {}
      overlayMapRef.current.delete(el);
    }

    // Remove handles for this element
    [
      `${el.id}-handle-0`,
      `${el.id}-handle-1`,
      `${el.id}-handle-2`,
      `${el.id}-handle-3`,
      `${el.id}-rotation-handle`,
    ].forEach((id) => {
      const handle = overlayMapRef.current.get(id);
      if (handle) {
        try {
          handle.remove();
        } catch {}
        overlayMapRef.current.delete(id);
      }
    });
  }, []);

  const removeUnifiedOverlay = useCallback(() => {
    const rect = overlayMapRef.current.get("unified-selection");
    if (rect) {
      try {
        rect.remove();
      } catch {}
      overlayMapRef.current.delete("unified-selection");
    }

    // Remove unified handles
    [
      "unified-handle-0",
      "unified-handle-1",
      "unified-handle-2",
      "unified-handle-3",
      "unified-rotation-handle",
    ].forEach((id) => {
      const handle = overlayMapRef.current.get(id);
      if (handle) {
        try {
          handle.remove();
        } catch {}
        overlayMapRef.current.delete(id);
      }
    });
  }, []);

  // Helper to compute unified bounding box for all selected elements with transform handles
  const updateUnifiedOverlay = useCallback(() => {
    if (!overlayDrawRef.current || selectedElements.length === 0) {
      return;
    }

    // Remove individual overlays first
    selectedElements.forEach((el) => {
      removeOverlayFor(el);
    });

    // Remove any existing unified overlay and handles
    const unifiedKey = "unified-selection";
    const existingRect = overlayMapRef.current.get(unifiedKey);
    if (existingRect) {
      try {
        existingRect.remove();
      } catch {}
      overlayMapRef.current.delete(unifiedKey);
    }

    // Remove existing handles
    [
      "unified-handle-0",
      "unified-handle-1",
      "unified-handle-2",
      "unified-handle-3",
      "unified-rotation-handle",
    ].forEach((id) => {
      const existing = overlayMapRef.current.get(id);
      if (existing) {
        try {
          existing.remove();
        } catch {}
        overlayMapRef.current.delete(id);
      }
    });

    // Always compute unified bounding box with handles (for both single and multiple selections)
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedElements.forEach((el, index) => {
      const bounds = boundsFor(el);
      if (bounds) {
        // Since overlay group has no scale transform, use bounds directly
        // The bounds are already in the correct coordinate space for the overlay
        minX = Math.min(minX, bounds.minX);
        minY = Math.min(minY, bounds.minY);
        maxX = Math.max(maxX, bounds.maxX);
        maxY = Math.max(maxY, bounds.maxY);
      }
    });

    if (
      minX !== Infinity &&
      minY !== Infinity &&
      maxX !== -Infinity &&
      maxY !== -Infinity
    ) {
      // The bounds are in viewport coordinates (after all transforms)
      // But now the overlay group has the same transform as content group
      // So we need to convert viewport coordinates back to original SVG coordinate space

      // Reverse the content transforms to get back to original SVG space
      const viewportToSvgX = (vx) =>
        (vx - initialOffsetRef.current.x) / contentScale + contentMinX;
      const viewportToSvgY = (vy) =>
        (vy - initialOffsetRef.current.y) / contentScale + contentMinY;

      const svgMinX = viewportToSvgX(minX);
      const svgMinY = viewportToSvgY(minY);
      const svgMaxX = viewportToSvgX(maxX);
      const svgMaxY = viewportToSvgY(maxY);

      const x = svgMinX;
      const y = svgMinY;
      const w = Math.max(0, svgMaxX - svgMinX);
      const h = Math.max(0, svgMaxY - svgMinY);

      try {
        // Create unified selection rectangle with constant stroke width
        // Use a fixed stroke width that's appropriately scaled for visibility
        const constantStrokeWidth = 3 / contentScale; // Always 3 pixels wide regardless of zoom/content scale
        const fillOpacity = isMarqueeSelection ? 0.1 : 0.15; // Slightly less fill for marquee

        const rect = overlayDrawRef.current
          .rect(w, h)
          .move(x, y)
          .fill("#00A3FF")
          .attr({
            "fill-opacity": fillOpacity,
          })
          .stroke({
            color: "#0077ff",
            width: constantStrokeWidth,
            dasharray: null,
          })
          .attr({
            pointerEvents: "none",
            id: "unified-selection-rect",
          });
        overlayMapRef.current.set(unifiedKey, rect);

        // Add corner handles to the bounding box
        const handleSize = 8 / contentScale; // Scale handle size to account for content scale
        const halfHandle = handleSize / 2;

        // Top-left, top-right, bottom-right, bottom-left
        const handlePositions = [
          { x: x - halfHandle, y: y - halfHandle },
          { x: x + w - halfHandle, y: y - halfHandle },
          { x: x + w - halfHandle, y: y + h - halfHandle },
          { x: x - halfHandle, y: y + h - halfHandle },
        ];

        handlePositions.forEach((pos, i) => {
          const handle = overlayDrawRef.current
            .rect(handleSize, handleSize)
            .move(pos.x, pos.y)
            .fill("#00A3FF")
            .stroke({ color: "#ffffff", width: constantStrokeWidth })
            .attr({
              pointerEvents: "none",
            });
          overlayMapRef.current.set(`unified-handle-${i}`, handle);
        });

        // Add rotation handle (above center of top edge)
        const rotationRadius = 4 / contentScale; // Scale radius to account for content scale
        const rotationOffset = 20 / contentScale; // Scale offset to account for content scale
        const rotationX = x + w / 2 - rotationRadius;
        const rotationY = y - rotationOffset;

        //   rotationX,
        //   rotationY,
        // });

        const rotationHandle = overlayDrawRef.current
          .circle(rotationRadius * 2)
          .move(rotationX, rotationY)
          .fill("#ff6b6b")
          .stroke({ color: "#ffffff", width: constantStrokeWidth })
          .attr({
            pointerEvents: "none",
          });
        overlayMapRef.current.set("unified-rotation-handle", rotationHandle);
      } catch (e) {
        console.error("❌ Failed to create unified overlay:", e);
      }
    } else {
      console.warn("No valid bounds found for unified overlay");
    }
  }, [
    boundsFor,
    selectedElements,
    removeOverlayFor,
    updateOverlayFor,
    contentScale,
    zoom,
    camera,
    isMarqueeSelection,
  ]);

  // Expose overlay helpers via ref to avoid TDZ in earlier callbacks
  useEffect(() => {
    overlayFnsRef.current.update = updateOverlayFor;
    overlayFnsRef.current.updateUnified = updateUnifiedOverlay;
    overlayFnsRef.current.remove = removeOverlayFor;
    overlayFnsRef.current.removeUnified = removeUnifiedOverlay;
    overlayFnsRef.current.restyle = () => {}; // Deprecated - unified overlay handles this
  }, [
    updateOverlayFor,
    updateUnifiedOverlay,
    removeOverlayFor,
    removeUnifiedOverlay,
  ]);

  // Update unified overlay whenever selected elements change
  useEffect(() => {
    // Only update if we have the overlay system ready
    if (overlayDrawRef.current && selectedElements.length > 0) {
      updateUnifiedOverlay();
    } else if (selectedElements.length === 0) {
      // Clear overlay when no elements selected
      removeUnifiedOverlay();
    }
  }, [selectedElements, updateUnifiedOverlay, removeUnifiedOverlay]);

  // Zoom functionality (use camera utils)
  const handleZoom = useCallback((direction, mouseEvent = null) => {
    const zoomFactor = direction === "in" ? 1.1 : 0.9;

    setZoom((prevZoom) => {
      const newZoom = Math.max(0.1, Math.min(5, prevZoom * zoomFactor));
      setCamera((cam) =>
        computeZoomedCamera(
          baseSizeRef.current,
          cam,
          newZoom,
          containerRef.current,
          mouseEvent
        )
      );
      return newZoom;
    });
  }, []);

  // Helper: clear all current selections and remove visual class
  const clearSelection = useCallback(() => {
    // Clear any hover overlay when clearing selections
    if (hoverOverlayRef.current) {
      const overlays =
        hoverOverlayRef.current.querySelectorAll(".hover-overlay");
      overlays.forEach((overlay) => overlay.remove());
    }
    setHoveredElement(null);

    if (transformElRef.current) {
      disableTransformFor(transformElRef.current);
      transformElRef.current = null;
    }
    selectedElements.forEach((el) => {
      if (el && el.setAttribute) {
        // Use data attribute instead of CSS class for selection state
        el.removeAttribute("data-selected");
        // Restore original styling instead of relying on CSS classes
        const originalStroke =
          el.getAttribute("data-original-stroke") ||
          el.getAttribute("stroke") ||
          "#000000";
        const originalStrokeWidth =
          el.getAttribute("data-original-stroke-width") ||
          el.getAttribute("stroke-width") ||
          "1";
        el.setAttribute("stroke", originalStroke);
        el.setAttribute("stroke-width", originalStrokeWidth);
        el.style.filter = "";
      }
      overlayFnsRef.current.remove(el);
    });
    overlayFnsRef.current.removeUnified();
    setSelectedElements([]);
  }, [selectedElements, disableTransformFor]);

  // Shared function to apply selection styling to any element
  const applySelectionStyle = useCallback(
    (el) => {
      // Clear any hover overlay when selecting an element
      if (hoveredElement === el) {
        if (hoverOverlayRef.current) {
          const overlays =
            hoverOverlayRef.current.querySelectorAll(".hover-overlay");
          overlays.forEach((overlay) => overlay.remove());
        }
        setHoveredElement(null);
      }

      // Store original values before modifying
      if (!el.getAttribute("data-original-stroke")) {
        el.setAttribute(
          "data-original-stroke",
          el.getAttribute("stroke") || "#000000"
        );
      }
      if (!el.getAttribute("data-original-stroke-width")) {
        el.setAttribute(
          "data-original-stroke-width",
          el.getAttribute("stroke-width") || "1"
        );
      }

      // Apply selection styling directly
      el.setAttribute("data-selected", "true");
      el.setAttribute("stroke", "#00a3ff");
      // Use current stroke width (already scaled) instead of original unscaled width
      const currentWidth = parseFloat(el.getAttribute("stroke-width") || "1");
      // Make selection stroke slightly thicker than current stroke
      const selectionWidth = currentWidth * 1.5;
      el.setAttribute("stroke-width", selectionWidth.toString());
      el.style.filter = "drop-shadow(0 0 4px rgba(0, 163, 255, 0.8))";
    },
    [hoveredElement, setHoveredElement]
  );

  // Shared function to remove selection styling from any element
  const removeSelectionStyle = useCallback((el) => {
    el.removeAttribute("data-selected");
    const originalStroke = el.getAttribute("data-original-stroke") || "#000000";
    const originalStrokeWidth =
      el.getAttribute("data-original-stroke-width") || "1";
    el.setAttribute("stroke", originalStroke);
    el.setAttribute("stroke-width", originalStrokeWidth);
    el.style.filter = "";
  }, []);

  // Implement drawing functions now that clearSelection is available
  startDrawingRef.current = useCallback(
    (tool) => {
      if (!drawRef.current || !contentGroupRef.current) return;

      setIsDrawing(true);
      clearSelection(); // Clear any existing selections

      const contentGroup = SVG(contentGroupRef.current);

      try {
        let drawingElement;

        switch (tool) {
          case "draw-path":
            // Start drawing a path
            drawingElement = contentGroup
              .path()
              .fill("none")
              .stroke({
                color: propStroke,
                width: parseFloat(propStrokeWidth) / contentScale,
                linecap: propLinecap,
                linejoin: propLinejoin,
              });

            // Enable drawing mode
            drawingElement.draw();
            showTransformFeedback(
              "🖊️ Drawing path - click to add points, double-click to finish"
            );
            break;

          case "draw-polygon":
            // Start drawing a polygon/area
            drawingElement = contentGroup
              .polygon()
              .fill(propFill)
              .stroke({
                color: propStroke,
                width: parseFloat(propStrokeWidth) / contentScale,
                linecap: propLinecap,
                linejoin: propLinejoin,
              });

            drawingElement.draw();
            showTransformFeedback(
              "🔺 Drawing area - click to add points, double-click to finish"
            );
            break;

          case "draw-line":
            // Start drawing a line
            drawingElement = contentGroup.line().stroke({
              color: propStroke,
              width: parseFloat(propStrokeWidth) / contentScale,
              linecap: propLinecap,
            });

            drawingElement.draw();
            showTransformFeedback(
              "📏 Drawing line - click start and end points"
            );
            break;

          default:
            console.warn("Unknown drawing tool:", tool);
            setIsDrawing(false);
            return;
        }

        drawingElementRef.current = drawingElement;

        // Listen for drawing completion
        drawingElement.on("drawstop", () => {
          setIsDrawing(false);
          drawingElementRef.current = null;
          showTransformFeedback("✅ Drawing completed");

          // Add the new element to the DOM properly
          const newEl = drawingElement.node;
          if (newEl) {
            // Add proper attributes for selection
            newEl.setAttribute("data-editable", "true");
            if (!newEl.id) {
              newEl.id = `${newEl.tagName.toLowerCase()}-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`;
            }

            // Add hover event listeners
            const localHandleHover = (event) => {
              // Reuse hover logic from content injection
              const selectableTags = [
                "path",
                "polyline",
                "polygon",
                "line",
                "rect",
                "circle",
                "ellipse",
                "use",
              ];
              const target = event.target;

              if (
                selectableTags.includes(target.tagName?.toLowerCase()) &&
                target.closest('[class*="contentGroup"]') &&
                !target.getAttribute("data-selected") &&
                !target.classList.contains("hover-overlay")
              ) {
                if (event.type === "mouseenter") {
                  const currentHovered = hoveredElementRef.current;
                  if (target !== currentHovered && hoverOverlayRef.current) {
                    const overlays =
                      hoverOverlayRef.current.querySelectorAll(
                        ".hover-overlay"
                      );
                    overlays.forEach((overlay) => overlay.remove());

                    try {
                      const clone = target.cloneNode(false);
                      clone.setAttribute("stroke", "#0066ff");
                      const currentWidth = parseFloat(
                        target.getAttribute("stroke-width") || "1"
                      );
                      const hoverWidth = currentWidth * 0.8;
                      clone.setAttribute("stroke-width", hoverWidth.toString());
                      clone.setAttribute("fill", "none");
                      clone.setAttribute("opacity", "0.7");
                      clone.classList.add("hover-overlay");

                      hoverOverlayRef.current.appendChild(clone);
                      setHoveredElement(target);
                    } catch (e) {
                      console.warn(
                        "Failed to create hover overlay for drawn element:",
                        e
                      );
                    }
                  }
                } else if (event.type === "mouseleave") {
                  const currentHovered = hoveredElementRef.current;
                  if (target === currentHovered && hoverOverlayRef.current) {
                    const overlays =
                      hoverOverlayRef.current.querySelectorAll(
                        ".hover-overlay"
                      );
                    overlays.forEach((overlay) => overlay.remove());
                    setHoveredElement(null);
                  }
                }
              }
            };

            newEl.addEventListener("mouseenter", localHandleHover);
            newEl.addEventListener("mouseleave", localHandleHover);
          }
        });

        drawingElement.on("drawcancel", () => {
          setIsDrawing(false);
          drawingElementRef.current = null;
          showTransformFeedback("❌ Drawing cancelled");
        });
      } catch (e) {
        console.error("Failed to start drawing:", e);
        setIsDrawing(false);
        showTransformFeedback("❌ Failed to start drawing");
      }
    },
    [
      propStroke,
      propStrokeWidth,
      propFill,
      propLinecap,
      propLinejoin,
      contentScale,
      clearSelection,
      showTransformFeedback,
    ]
  );

  stopDrawingRef.current = useCallback(() => {
    if (drawingElementRef.current) {
      try {
        drawingElementRef.current.draw("stop");
      } catch (e) {
        console.warn("Failed to stop drawing:", e);
      }
    }
    setIsDrawing(false);
    drawingElementRef.current = null;
  }, []);

  convertToPathRef.current = useCallback(() => {
    if (selectedElements.length === 0) return;

    selectedElements.forEach((el) => {
      const shape = getShape(el);
      if (!shape) return;

      try {
        // Convert any shape to path
        if (shape.toPath) {
          const pathData = shape.toPath();

          // Create new path element
          const pathElement = shape.parent().path(pathData);

          // Copy styling
          pathElement.attr({
            stroke: shape.attr("stroke"),
            "stroke-width": shape.attr("stroke-width"),
            fill: shape.attr("fill"),
            opacity: shape.attr("opacity"),
            "stroke-linecap": shape.attr("stroke-linecap"),
            "stroke-linejoin": shape.attr("stroke-linejoin"),
          });

          // Remove original element
          shape.remove();

          showTransformFeedback("🔄 Converted to path");
        }
      } catch (e) {
        console.error("Failed to convert to path:", e);
      }
    });
  }, [selectedElements, getShape, showTransformFeedback]);

  applyFilterRef.current = useCallback(
    (filterType, intensity = 1) => {
      if (selectedElements.length === 0) return;

      selectedElements.forEach((el) => {
        const shape = getShape(el);
        if (!shape) return;

        try {
          let filter;

          switch (filterType) {
            case "drop-shadow":
              filter = shape.filterWith((add) => {
                add.offset(2 * intensity, 2 * intensity).in(add.sourceAlpha);
                add.flood("#000", 0.3 * intensity);
                add.composite(
                  add.componentTransfer().in(add.offset).build(),
                  add.flood
                );
                add.merge(add.composite, add.source);
              });
              showTransformFeedback(`🌫️ Applied drop shadow`);
              break;

            case "glow":
              filter = shape.filterWith((add) => {
                add.morphology("dilate", 2 * intensity).in(add.sourceAlpha);
                add.flood(propStroke, 0.5 * intensity);
                add.composite(add.flood, add.morphology);
                add.merge(add.composite, add.source);
              });
              showTransformFeedback(`✨ Applied glow effect`);
              break;

            case "blur":
              filter = shape.filterWith((add) => {
                add.gaussianBlur(intensity);
              });
              showTransformFeedback(`🌊 Applied blur effect`);
              break;

            case "remove-filters":
              shape.unfilter();
              showTransformFeedback(`🧹 Removed all filters`);
              break;

            default:
              console.warn("Unknown filter type:", filterType);
          }
        } catch (e) {
          console.error(`Failed to apply ${filterType} filter:`, e);
        }
      });
    },
    [selectedElements, getShape, propStroke, showTransformFeedback]
  );

  // Handle canvas click for different tools
  const handleCanvasClick = (event) => {
    if (import.meta.env && import.meta.env.DEV) {
      //   target: event.target && event.target.tagName,
      //   tool: activeTool,
      //   shift: !!event.shiftKey,
      //   ctrl: !!event.ctrlKey,
      //   meta: !!event.metaKey,
      // });
    }
    if (activeTool === "zoom") {
      event.preventDefault();
      // Zoom in on left click, zoom out on right click or with shift
      const direction = event.shiftKey ? "out" : "in";
      handleZoom(direction, event);
    } else if (activeTool === "select") {
      handleSvgClick(event);
    }
  };

  // Handle SVG element selection (Click) - Adobe Illustrator-like behavior
  const handleSvgClick = (event) => {
    if (activeTool === "pan" || isDragging) return;

    // IMPORTANT: Don't handle clicks immediately after marquee selection
    if (isMarquee || justFinishedMarquee) {
      return;
    }

    const selectableTags = [
      "path",
      "polyline",
      "polygon",
      "line",
      "rect",
      "circle",
      "ellipse",
      "use",
    ];
    const selector = selectableTags.join(",");

    let target = event.target;
    if (import.meta.env && import.meta.env.DEV) {
      try {
        const pe = target
          ? window.getComputedStyle(target).pointerEvents
          : "n/a";
        //   "[SVG] click target:",
        //   target && target.tagName,
        //   "pointer-events:",
        //   pe
        // );
      } catch {}
    }

    // If we didn't hit a selectable element, try to find the closest one up the tree
    if (!target || !selectableTags.includes(target.tagName?.toLowerCase?.())) {
      const closest =
        target && target.closest ? target.closest(selector) : null;
      if (!closest) {
        // Clicked on empty space - clear selection (Illustrator behavior)
        if (!event.shiftKey) {
          clearSelection();
        }
        return;
      }
      target = closest;
    }

    const alreadySelected = selectedElements.includes(target);

    if (event.shiftKey) {
      // Shift+click behavior: toggle selection of this element
      //   target: target.tagName,
      //   targetId: target.id,
      //   alreadySelected,
      //   currentSelectionLength: selectedElements.length,
      // });

      if (alreadySelected) {
        // Remove from selection
        removeSelectionStyle(target);
        setSelectedElements((prev) => {
          const next = prev.filter((el) => el !== target);
          // Always update active transform to last element in remaining selection
          const newActive = next.length ? next[next.length - 1] : null;
          enableTransformFor(newActive);
          return next;
        });
      } else {
        // Add to selection (only if not already present)
        setIsMarqueeSelection(false); // Individual/shift-click selection
        applySelectionStyle(target);
        setSelectedElements((prev) => {
          if (prev.includes(target)) return prev;
          const next = [...prev, target];
          enableTransformFor(target);
          return next;
        });
      }
    } else {
      // Regular click behavior
      if (alreadySelected && selectedElements.length === 1) {
        // Clicking on the only selected element - keep it selected (Illustrator behavior)
        return;
      } else if (alreadySelected && selectedElements.length > 1) {
        // Clicking on one of multiple selected elements - select only this one
        setIsMarqueeSelection(false); // Individual selection
        clearSelection();
        applySelectionStyle(target);
        setSelectedElements([target]);
        enableTransformFor(target);
      } else {
        // Clicking on unselected element - clear others and select this one
        setIsMarqueeSelection(false); // Individual selection
        clearSelection();
        applySelectionStyle(target);
        setSelectedElements([target]);
        enableTransformFor(target);
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

  // Duplicate selected elements using svg.js
  const duplicateSelected = useCallback(() => {
    if (selectedElements.length === 0) return;

    const duplicates = [];

    selectedElements.forEach((el) => {
      try {
        const shape = getShape(el);
        if (!shape) return;

        // Clone the svg.js element
        const clone = shape.clone();

        // Offset the duplicate slightly so it's visible
        const offsetX = 20 / contentScale; // Scale offset with content scale
        const offsetY = 20 / contentScale;
        clone.translate(offsetX, offsetY);

        // Add the cloned DOM element to our tracking
        const clonedEl = clone.node;

        // Ensure the cloned element has proper attributes
        if (!clonedEl.id) {
          clonedEl.id = `${el.tagName.toLowerCase()}-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        }

        // Copy data attributes
        clonedEl.setAttribute("data-editable", "true");

        // Apply hover event listeners to the duplicate
        const localHandleHover = (event) => {
          // Reuse the same hover logic as in content injection
          const selectableTags = [
            "path",
            "polyline",
            "polygon",
            "line",
            "rect",
            "circle",
            "ellipse",
            "use",
          ];
          const target = event.target;

          if (
            selectableTags.includes(target.tagName?.toLowerCase()) &&
            target.closest('[class*="contentGroup"]') &&
            !target.getAttribute("data-selected") &&
            !target.classList.contains("hover-overlay")
          ) {
            if (event.type === "mouseenter") {
              const currentHovered = hoveredElementRef.current;
              if (target !== currentHovered && hoverOverlayRef.current) {
                const overlays =
                  hoverOverlayRef.current.querySelectorAll(".hover-overlay");
                overlays.forEach((overlay) => overlay.remove());

                try {
                  const hoverClone = target.cloneNode(false);
                  hoverClone.setAttribute("stroke", "#0066ff");
                  const currentWidth = parseFloat(
                    target.getAttribute("stroke-width") || "1"
                  );
                  const hoverWidth = currentWidth * 0.8;
                  hoverClone.setAttribute(
                    "stroke-width",
                    hoverWidth.toString()
                  );
                  hoverClone.setAttribute("fill", "none");
                  hoverClone.setAttribute("opacity", "0.7");
                  hoverClone.classList.add("hover-overlay");

                  hoverOverlayRef.current.appendChild(hoverClone);
                  setHoveredElement(target);
                } catch (e) {
                  console.warn(
                    "Failed to create hover overlay for duplicate:",
                    e
                  );
                }
              }
            } else if (event.type === "mouseleave") {
              const currentHovered = hoveredElementRef.current;
              if (target === currentHovered && hoverOverlayRef.current) {
                const overlays =
                  hoverOverlayRef.current.querySelectorAll(".hover-overlay");
                overlays.forEach((overlay) => overlay.remove());
                setHoveredElement(null);
              }
            }
          }
        };

        clonedEl.addEventListener("mouseenter", localHandleHover);
        clonedEl.addEventListener("mouseleave", localHandleHover);

        duplicates.push(clonedEl);

        //   "📋 Duplicated element:",
        //   el.tagName,
        //   el.id,
        //   "→",
        //   clonedEl.id
        // );
      } catch (e) {
        console.error("Failed to duplicate element:", e);
      }
    });

    if (duplicates.length > 0) {
      // Clear current selection and select the duplicates
      clearSelection();

      // Apply selection styling to duplicates
      duplicates.forEach((el) => {
        // Store original values
        if (!el.getAttribute("data-original-stroke")) {
          el.setAttribute(
            "data-original-stroke",
            el.getAttribute("stroke") || "#000000"
          );
        }
        if (!el.getAttribute("data-original-stroke-width")) {
          el.setAttribute(
            "data-original-stroke-width",
            el.getAttribute("stroke-width") || "1"
          );
        }

        // Apply selection styling
        el.setAttribute("data-selected", "true");
        el.setAttribute("stroke", "#00a3ff");
        const currentWidth = parseFloat(el.getAttribute("stroke-width") || "1");
        const selectionWidth = currentWidth * 1.5;
        el.setAttribute("stroke-width", selectionWidth.toString());
        el.style.filter = "drop-shadow(0 0 4px rgba(0, 163, 255, 0.8))";
      });

      setSelectedElements(duplicates);

      // Enable transform for the last duplicated element
      if (duplicates.length > 0) {
        enableTransformFor(duplicates[duplicates.length - 1]);
      }
    }
  }, [
    selectedElements,
    getShape,
    contentScale,
    clearSelection,
    enableTransformFor,
  ]);

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

      // Element manipulation shortcuts (only when elements are selected)
      if (selectedElements.length > 0) {
        // Delete/Backspace - delete selected elements
        if (event.key === "Delete" || event.key === "Backspace") {
          deleteSelected();
          return;
        }

        // Transformation shortcuts
        if (event.key === "r" && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          // Rotate 90 degrees clockwise (Ctrl+R) or counterclockwise (Ctrl+Shift+R)
          const degrees = event.shiftKey ? -90 : 90;
          transformSelected("rotate", degrees);
          return;
        }

        if (event.key === "d" && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          // Duplicate selected elements
          duplicateSelected();
          return;
        }

        // Arrow keys for precise movement
        if (
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
            event.key
          )
        ) {
          event.preventDefault();
          const moveDistance = event.shiftKey ? 10 : 1; // Shift for larger steps
          const movements = {
            ArrowUp: { x: 0, y: -moveDistance },
            ArrowDown: { x: 0, y: moveDistance },
            ArrowLeft: { x: -moveDistance, y: 0 },
            ArrowRight: { x: moveDistance, y: 0 },
          };
          transformSelected("translate", movements[event.key]);
          return;
        }

        // Scale shortcuts
        if (event.key === "=" || event.key === "+") {
          event.preventDefault();
          // Scale up by 10%
          transformSelected("scale", 1.1);
          return;
        }

        if (event.key === "-") {
          event.preventDefault();
          // Scale down by 10%
          transformSelected("scale", 0.9);
          return;
        }

        // Flip shortcuts
        if (event.key === "h" && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          transformSelected("flip", "horizontal");
          return;
        }

        if (
          event.key === "v" &&
          (event.ctrlKey || event.metaKey) &&
          event.shiftKey
        ) {
          event.preventDefault();
          transformSelected("flip", "vertical");
          return;
        }

        // Reset transformations
        if (event.key === "t" && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          transformSelected("reset");
          return;
        }

        // Path conversion
        if (
          event.key === "p" &&
          (event.ctrlKey || event.metaKey) &&
          event.shiftKey
        ) {
          event.preventDefault();
          convertToPath();
          return;
        }

        // Filter shortcuts
        if (
          event.key === "s" &&
          (event.ctrlKey || event.metaKey) &&
          event.shiftKey
        ) {
          event.preventDefault();
          applyFilter("drop-shadow");
          return;
        }

        if (
          event.key === "g" &&
          (event.ctrlKey || event.metaKey) &&
          event.shiftKey
        ) {
          event.preventDefault();
          applyFilter("glow");
          return;
        }

        if (
          event.key === "b" &&
          (event.ctrlKey || event.metaKey) &&
          event.shiftKey
        ) {
          event.preventDefault();
          applyFilter("blur", 2);
          return;
        }

        if (
          event.key === "f" &&
          (event.ctrlKey || event.metaKey) &&
          event.shiftKey
        ) {
          event.preventDefault();
          applyFilter("remove-filters");
          return;
        }
      }

      // Drawing tool shortcuts (work without selection)
      if (event.key === "l" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        startDrawing("draw-line");
        return;
      }

      if (
        event.key === "p" &&
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey
      ) {
        event.preventDefault();
        startDrawing("draw-path");
        return;
      }

      if (
        event.key === "a" &&
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey
      ) {
        event.preventDefault();
        startDrawing("draw-polygon");
        return;
      }

      // Cancel drawing mode
      if (event.key === "Escape" && isDrawing) {
        event.preventDefault();
        stopDrawing();
        return;
      }

      // General shortcuts
      if (event.key === "Escape") {
        if (isDrawing) {
          stopDrawing();
        } else {
          clearSelection();
        }
      }

      // Select all shortcut
      if (
        (event.key === "a" || event.key === "A") &&
        (event.ctrlKey || event.metaKey)
      ) {
        event.preventDefault();
        // Select all selectable elements
        if (contentGroupRef.current) {
          const selector = "path,polyline,polygon,line,rect,circle,ellipse,use";
          const allElements = Array.from(
            contentGroupRef.current.querySelectorAll(selector)
          );
          clearSelection();
          allElements.forEach((el) => {
            // Store original values before modifying
            if (!el.getAttribute("data-original-stroke")) {
              el.setAttribute(
                "data-original-stroke",
                el.getAttribute("stroke") || "#000000"
              );
            }
            if (!el.getAttribute("data-original-stroke-width")) {
              el.setAttribute(
                "data-original-stroke-width",
                el.getAttribute("stroke-width") || "1"
              );
            }

            // Apply selection styling directly
            el.setAttribute("data-selected", "true");
            el.setAttribute("stroke", "#00a3ff");
            // Use current stroke width (already scaled) instead of original unscaled width
            const currentWidth = parseFloat(
              el.getAttribute("stroke-width") || "1"
            );
            // Make selection stroke slightly thicker than current stroke
            const selectionWidth = currentWidth * 1.5;
            el.setAttribute("stroke-width", selectionWidth.toString());
            el.style.filter = "drop-shadow(0 0 4px rgba(0, 163, 255, 0.8))";
          });
          setSelectedElements(allElements);
          if (allElements.length > 0) {
            enableTransformFor(allElements[allElements.length - 1]);
          }
        }
      }

      // Zoom shortcuts
      if (event.key === "+" || event.key === "=") {
        if (!selectedElements.length) {
          // Only zoom if no elements selected
          event.preventDefault();
          handleZoom("in");
        }
      }
      if (event.key === "-") {
        if (!selectedElements.length) {
          // Only zoom if no elements selected
          event.preventDefault();
          handleZoom("out");
        }
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
  }, [
    clearSelection,
    deleteSelected,
    handleZoom,
    isSpacePressed,
    activeTool,
    previousTool,
    selectedElements,
    transformSelected,
    duplicateSelected,
    convertToPath,
    applyFilter,
    startDrawing,
    stopDrawing,
    isDrawing,
  ]);

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

  // Panning + Marquee: extend mouse handlers
  const handleMouseDown = useCallback(
    (event) => {
      // Marquee selection (only when Select tool and not pressing Space)
      if (activeTool === "select" && !isSpacePressed) {
        const selector = "path,polyline,polygon,line,rect,circle,ellipse,use";
        const hit =
          event.target && event.target.closest
            ? event.target.closest(selector)
            : null;

        //   target: event.target?.tagName,
        //   targetId: event.target?.id,
        //   hasHit: !!hit,
        //   hitElement: hit?.tagName,
        //   activeTool,
        //   spacePressed: isSpacePressed,
        // });

        if (!hit) {
          // Clicked on empty space - start marquee selection
          event.preventDefault();
          setIsMarquee(true);
          const p = clientToSvg(event);
          marqueeStartRef.current = p;
          // Create marquee selection overlay with corner handles and rotation handle
          try {
            //   overlayDrawRef: overlayDrawRef.current,
            //   drawRef: drawRef.current,
            //   overlayGroupRef: overlayGroupRef.current,
            //   svgjsEnabled: svgjsEnabledRef.current,
            // });

            if (overlayDrawRef.current) {
              //   "✅ Using drawRef for marquee (root coordinate space)"
              // );
              // Create marquee group in the root SVG (not in the transformed overlay group)
              // This ensures marquee coordinates match the mouse coordinates
              const marqueeGroup = drawRef.current.group();
              marqueeGroup.attr({ id: "marquee-selection-group" });

              // Simple selection rectangle (no fill, just border) - no handles on marquee itself
              const rect = marqueeGroup
                .rect(0, 0)
                .fill("none")
                .attr({
                  "fill-opacity": 0,
                  fill: "transparent",
                })
                .stroke({
                  color: "#00A3FF",
                  width: Math.max(5, 10 / zoom), // Increased base stroke width for high contentScale scenarios
                  dasharray: "4 2",
                })
                .attr({
                  pointerEvents: "none",
                  id: "marquee-main-rect",
                });

              marqueeGroup.move(p.x, p.y);
              marqueeRectRef.current = {
                group: marqueeGroup,
                rect: rect,
              };

              // Debug logging
              //   contentScale,
              //   strokeWidth: Math.max(5, 10 / zoom),
              //   zoom,
              //   startPosition: p,
              //   groupId: "marquee-selection-group",
              //   overlayDrawRef: overlayDrawRef.current,
              //   svgRef: svgRef.current,
              //   parentNode: overlayDrawRef.current?.node?.parentNode,
              // });

              // Log DOM elements to verify they're being created
              setTimeout(() => {
                const group = document.getElementById(
                  "marquee-selection-group"
                );
                const rect = document.getElementById("marquee-main-rect");

                //   group,
                //   rect,
                //   groupParent: group?.parentNode?.tagName,
                //   rectAttributes: rect
                //     ? Array.from(rect.attributes)
                //         .map((attr) => `${attr.name}="${attr.value}"`)
                //         .join(", ")
                //     : null,
                // });
              }, 10);
            } else if (drawRef.current) {
              // Fallback to main SVG draw if overlay is not available
              const marqueeGroup = drawRef.current.group();
              marqueeGroup.attr({ id: "marquee-selection-group-fallback" });

              // Simple fallback marquee rectangle - no handles
              const rect = marqueeGroup
                .rect(0, 0)
                .fill("none")
                .attr({
                  "fill-opacity": 0,
                  fill: "transparent",
                })
                .stroke({
                  color: "#00A3FF",
                  width: Math.max(5, 10 / zoom), // Increased base stroke width for high contentScale scenarios
                  dasharray: "4 2",
                })
                .attr({
                  pointerEvents: "none",
                  id: "marquee-main-rect-fallback",
                });

              marqueeGroup.move(p.x, p.y);
              marqueeRectRef.current = {
                group: marqueeGroup,
                rect: rect,
              };
            } else {
            }
          } catch {}
          return; // don't start panning
        }
      }

      // Panning (when pan tool is active OR space is pressed)
      if (activeTool === "pan" || isSpacePressed) {
        event.preventDefault();
        setIsDragging(true);
        setDragStart({ x: event.clientX, y: event.clientY });
        cameraStartRef.current = camera;
        if (containerRef.current) {
          containerRef.current.style.cursor = "grabbing";
        }
      }
    },
    [activeTool, isSpacePressed, clientToSvg, contentScale, camera, zoom]
  );

  const handleMouseMove = useCallback(
    (event) => {
      // Update marquee rectangle and handles
      if (isMarquee && marqueeRectRef.current) {
        event.preventDefault();
        const start = marqueeStartRef.current;
        const cur = clientToSvg(event);
        const x = Math.min(start.x, cur.x);
        const y = Math.min(start.y, cur.y);
        const w = Math.abs(cur.x - start.x);
        const h = Math.abs(cur.y - start.y);

        try {
          const { group, rect } = marqueeRectRef.current;

          // Update main rectangle
          rect.move(x, y).size(w, h);
        } catch (e) {
          console.error("❌ Failed to update marquee rectangle:", e);
        }
        return;
      }

      // Panning move
      if (isDragging && (activeTool === "pan" || isSpacePressed)) {
        event.preventDefault();
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect || !cameraStartRef.current) return;
        const dxPx = event.clientX - dragStart.x;
        const dyPx = event.clientY - dragStart.y;
        const unitsPerPxX = camera.width / rect.width;
        const unitsPerPxY = camera.height / rect.height;
        const newMinX = cameraStartRef.current.minX - dxPx * unitsPerPxX;
        const newMinY = cameraStartRef.current.minY - dyPx * unitsPerPxY;
        setCamera((cam) => ({ ...cam, minX: newMinX, minY: newMinY }));
      }
    },
    [
      isMarquee,
      isDragging,
      activeTool,
      isSpacePressed,
      clientToSvg,
      camera,
      dragStart,
    ]
  );

  const performMarqueeSelect = useCallback(
    (rect, additive) => {
      const selector = "path,polyline,polygon,line,rect,circle,ellipse,use";
      const scope = contentGroupRef.current;
      if (!scope) return;
      const nodes = Array.from(scope.querySelectorAll(selector));
      const hits = [];

      //   rectCoords: rect,
      //   totalElements: nodes.length,
      //   contentScale,
      //   contentViewBox,
      //   camera,
      //   svgViewBox: svgRef.current?.viewBox?.baseVal,
      // });

      // Test coordinate space understanding
      //   marqueeRect: rect,
      //   cameraViewBox: camera,
      //   svgViewBox: svgRef.current?.getAttribute("viewBox"),
      //   containerBounds: containerRef.current?.getBoundingClientRect(),
      // });

      for (const el of nodes) {
        const bounds = boundsFor(el);
        if (!bounds) continue;

        // Both bounds and rect should be in the same SVG coordinate space
        // elementBoundsInSvg returns bounds in SVG root coordinates
        // clientToSvg returns coordinates in SVG root coordinates
        const marqueeInSvgSpace = rect;

        if (intersectsRect(bounds, marqueeInSvgSpace)) {
          hits.push(el);
        }
      }

      //   "🎯 Marquee selected:",
      //   hits.length,
      //   "elements out of",
      //   nodes.length,
      //   "total"
      // );

      let finalSelection;
      setSelectedElements((prev) => {
        const prevSet = new Set(prev);
        let next;

        if (additive) {
          // Shift+marquee: add new hits to selection, toggle if already selected
          next = [...prev];
          for (const el of hits) {
            if (prevSet.has(el)) {
              // Remove if already selected
              next = next.filter((e) => e !== el);
              removeSelectionStyle(el);
            } else {
              // Add if not selected
              next.push(el);
              applySelectionStyle(el);
            }
          }
          // Deduplicate (shouldn't be needed, but for safety)
          next = Array.from(new Set(next));
        } else {
          // Regular marquee: replace selection with hits
          // Remove styling from any previously selected not in hits
          prev.forEach((el) => {
            if (!hits.includes(el)) {
              removeSelectionStyle(el);
            }
          });
          // Apply selected styling to all in next
          next = Array.from(new Set(hits));
          next.forEach((el) => {
            applySelectionStyle(el);
          });
        }

        // Set active transform to last element in selection
        const newActive = next.length ? next[next.length - 1] : null;
        enableTransformFor(newActive);

        finalSelection = next;
        return next;
      });

      // Mark this selection as coming from marquee
      setIsMarqueeSelection(true);
    },
    [
      contentGroupRef,
      boundsFor,
      enableTransformFor,
      contentScale,
      contentViewBox,
      initialOffsetRef,
      applySelectionStyle,
      removeSelectionStyle,
    ]
  );

  const handleMouseUp = useCallback(
    (event) => {
      //   isMar      //   isDragging,
      //   activeTool,
      //   isSpacePressed,
      // });

      // Finish marquee
      if (isMarquee) {
        event.preventDefault();
        const start = marqueeStartRef.current;
        const end = clientToSvg(event);
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const w = Math.abs(end.x - start.x);
        const h = Math.abs(end.y - start.y);

        //   start,
        //   end,
        //   rect: { x, y, w, h },
        // });

        // Remove marquee overlay group
        try {
          if (marqueeRectRef.current && marqueeRectRef.current.group) {
            marqueeRectRef.current.group.remove();
          }
        } catch {}
        marqueeRectRef.current = null;
        setIsMarquee(false);

        // Set flag to ignore immediate clicks after marquee
        setJustFinishedMarquee(true);
        setTimeout(() => setJustFinishedMarquee(false), 100); // Clear flag after 100ms

        // Apply selection
        //   "🎯 Calling performMarqueeSelect with:",
        //   { x, y, width: w, height: h },
        //   "additive:",
        //   !!event.shiftKey
        // );
        performMarqueeSelect({ x, y, width: w, height: h }, !!event.shiftKey);
        return;
      }

      // Finish panning
      if (isDragging && (activeTool === "pan" || isSpacePressed)) {
        event.preventDefault();
        setIsDragging(false);
        if (containerRef.current) {
          if (isSpacePressed || activeTool === "pan") {
            containerRef.current.style.cursor = "grab";
          }
        }
      }
    },
    [
      isMarquee,
      isDragging,
      activeTool,
      isSpacePressed,
      clientToSvg,
      performMarqueeSelect,
    ]
  );

  // Add global mouse event listeners for panning
  useEffect(() => {
    const handleGlobalMouseMove = (event) => handleMouseMove(event);
    const handleGlobalMouseUp = (event) => handleMouseUp(event);

    if (isDragging || isMarquee) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, isMarquee, handleMouseMove, handleMouseUp]);

  // Reset view
  const resetView = () => {
    const baseW = baseSizeRef.current.width;
    const baseH = baseSizeRef.current.height;
    setZoom(1);
    setCamera({ minX: 0, minY: 0, width: baseW, height: baseH });
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

  // New: helpers to control dropdown behavior
  const closeAllMenus = useCallback(() => {
    [fileMenuRef, editMenuRef, viewMenuRef].forEach((ref) => {
      if (ref.current) ref.current.open = false;
    });
  }, []);

  const closeAllExcept = useCallback((refToKeep) => {
    [fileMenuRef, editMenuRef, viewMenuRef].forEach((ref) => {
      if (ref.current && ref !== refToKeep) ref.current.open = false;
    });
  }, []);

  const handleMenuToggle = useCallback(
    (ref) => (e) => {
      if (e.target.open) {
        // Close other menus when one opens
        closeAllExcept(ref);
      }
    },
    [closeAllExcept]
  );

  // New: close menus when clicking anywhere outside the menus
  useEffect(() => {
    const handleDocPointerDown = (e) => {
      const menus = [
        fileMenuRef.current,
        editMenuRef.current,
        viewMenuRef.current,
      ].filter(Boolean);
      const clickedInsideAny = menus.some((el) => el.contains(e.target));
      if (!clickedInsideAny) {
        closeAllMenus();
      }
    };
    document.addEventListener("mousedown", handleDocPointerDown, true);
    document.addEventListener("touchstart", handleDocPointerDown, true);
    return () => {
      document.removeEventListener("mousedown", handleDocPointerDown, true);
      document.removeEventListener("touchstart", handleDocPointerDown, true);
    };
  }, [closeAllMenus]);

  // New: close menus on Escape key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        closeAllMenus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeAllMenus]);

  // Sync properties from first selected element
  useEffect(() => {
    if (selectedElements.length > 0) {
      const el = selectedElements[0];
      setPropStroke(normalizeColor(el.getAttribute("stroke") || "#000000"));
      setPropStrokeWidth(el.getAttribute("stroke-width") || "1");
      setPropFill(
        normalizeColor(el.getAttribute("fill") || "#ffffff", "#ffffff")
      );
      setPropOpacity(el.getAttribute("opacity") || "1");
      setPropLinecap(el.getAttribute("stroke-linecap") || "butt");
      setPropLinejoin(el.getAttribute("stroke-linejoin") || "miter");
      setPropDasharray(el.getAttribute("stroke-dasharray") || "");
    }
  }, [selectedElements]);

  // Update unified overlay when selection changes
  useEffect(() => {
    if (overlayFnsRef.current.updateUnified) {
      // Use requestAnimationFrame to avoid blocking the main thread
      requestAnimationFrame(() => {
        overlayFnsRef.current.updateUnified();
      });
    }
  }, [selectedElements]);

  const updateAttrOnSelection = useCallback(
    (name, value) => {
      selectedElements.forEach((el) => {
        if (value === null || value === undefined || value === "") {
          el.removeAttribute(name);
        } else {
          el.setAttribute(name, String(value));
        }
        // keep original markers in sync so deselection restores to edited values
        if (name === "stroke") {
          el.setAttribute("data-original-stroke", String(value || ""));
        }
        if (name === "stroke-width") {
          el.setAttribute("data-original-stroke-width", String(value || ""));
        }
      });
    },
    [selectedElements]
  );

  const onStrokeChange = (e) => {
    const v = e.target.value;
    setPropStroke(v);
    updateAttrOnSelection("stroke", v);
  };
  const onStrokeWidthChange = (e) => {
    const v = e.target.value;
    setPropStrokeWidth(v);
    updateAttrOnSelection("stroke-width", v);
  };
  const onFillChange = (e) => {
    const v = e.target.value;
    setPropFill(v);
    updateAttrOnSelection("fill", v);
  };
  const onOpacityChange = (e) => {
    const v = e.target.value;
    setPropOpacity(v);
    updateAttrOnSelection("opacity", v);
  };
  const onLinecapChange = (e) => {
    const v = e.target.value;
    setPropLinecap(v);
    updateAttrOnSelection("stroke-linecap", v);
  };
  const onLinejoinChange = (e) => {
    const v = e.target.value;
    setPropLinejoin(v);
    updateAttrOnSelection("stroke-linejoin", v);
  };
  const onDasharrayChange = (e) => {
    const v = e.target.value;
    setPropDasharray(v);
    updateAttrOnSelection("stroke-dasharray", v);
  };

  // Unified property change handler for the enhanced inspector
  const onPropertyChange = useCallback(
    (property, value) => {
      switch (property) {
        case "stroke":
          setPropStroke(value);
          updateAttrOnSelection("stroke", value);
          break;
        case "stroke-width":
          setPropStrokeWidth(value);
          updateAttrOnSelection("stroke-width", value);
          break;
        case "fill":
          setPropFill(value);
          updateAttrOnSelection("fill", value);
          break;
        case "opacity":
          setPropOpacity(value);
          updateAttrOnSelection("opacity", value);
          break;
        case "stroke-linecap":
          setPropLinecap(value);
          updateAttrOnSelection("stroke-linecap", value);
          break;
        case "stroke-linejoin":
          setPropLinejoin(value);
          updateAttrOnSelection("stroke-linejoin", value);
          break;
        case "stroke-dasharray":
          setPropDasharray(value);
          updateAttrOnSelection("stroke-dasharray", value);
          break;
        case "d":
          // Handle path data changes
          selectedElements.forEach((el) => {
            if (el.tagName.toLowerCase() === "path") {
              el.setAttribute("d", value);
              overlayFnsRef.current.updateUnified();
            }
          });
          break;
        case "close-path":
          // Close the path if it's not already closed
          selectedElements.forEach((el) => {
            if (el.tagName.toLowerCase() === "path") {
              let pathData = el.getAttribute("d") || "";
              if (
                !pathData.trim().endsWith("Z") &&
                !pathData.trim().endsWith("z")
              ) {
                el.setAttribute("d", pathData + " Z");
                overlayFnsRef.current.updateUnified();
              }
            }
          });
          break;
        default:
          console.warn("Unknown property:", property);
      }
    },
    [selectedElements]
  );

  // Enhanced transform handler that integrates with the inspector
  const onTransform = useCallback(
    (transformType, value) => {
      transformSelected(transformType, value);
    },
    [transformSelected]
  );

  // Extract minX/minY from content viewBox to translate content to origin before scaling
  const [contentMinX, contentMinY] = (contentViewBox || "0 0 0 0")
    .split(" ")
    .map(Number);

  return (
    <div className={styles.mapEditor}>
      {/* Top Menu Bar with dropdowns */}
      <div className={styles.menuBar}>
        <details
          ref={fileMenuRef}
          className={styles.menuItem}
          role="menu"
          onToggle={handleMenuToggle(fileMenuRef)}
        >
          <summary>File</summary>
          <div className={styles.menuDropdown}>
            <button
              onClick={() => {
                handleSave();
                closeAllMenus();
              }}
            >
              Save
            </button>
            <button
              onClick={() => {
                handleExport("svg");
                closeAllMenus();
              }}
            >
              Export SVG
            </button>
          </div>
        </details>
        <details
          ref={editMenuRef}
          className={styles.menuItem}
          role="menu"
          onToggle={handleMenuToggle(editMenuRef)}
        >
          <summary>Edit</summary>
          <div className={styles.menuDropdown}>
            <button
              onClick={() => {
                clearSelection();
                closeAllMenus();
              }}
            >
              Deselect All
            </button>
            <button
              onClick={() => {
                deleteSelected();
                closeAllMenus();
              }}
              disabled={!selectedElements.length}
            >
              Delete
            </button>
          </div>
        </details>
        <details
          ref={viewMenuRef}
          className={styles.menuItem}
          role="menu"
          onToggle={handleMenuToggle(viewMenuRef)}
        >
          <summary>View</summary>
          <div className={styles.menuDropdown}>
            <button
              onClick={() => {
                setActiveTool("zoom");
                closeAllMenus();
              }}
            >
              Zoom Tool
            </button>
            <button
              onClick={() => {
                resetView();
                closeAllMenus();
              }}
            >
              Reset View
            </button>
          </div>
        </details>

        {/* DEBUG: Toggle button for debugging hover issues */}
        <button
          onClick={() => setDebugMode(!debugMode)}
          style={{
            marginLeft: "auto",
            padding: "6px 12px",
            backgroundColor: debugMode ? "#ff6b6b" : "#51cf66",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          Debug: {debugMode ? "ON" : "OFF"}
        </button>
      </div>

      {/* Work Area: Left tools + Canvas + Properties Panel */}
      <div className={styles.workArea}>
        {/* Left Toolbar */}
        <div className={styles.leftToolbar}>
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`${styles.leftToolButton} ${
                activeTool === tool.id ? styles.active : ""
              }`}
              onClick={() => {
                if (tool.action) {
                  tool.action(); // Execute the tool's action
                } else {
                  setActiveTool(tool.id); // Fallback to setting active tool
                }
              }}
              title={tool.name}
              aria-label={tool.name}
              data-tooltip={tool.name}
            >
              <span className={styles.leftToolIcon}>{tool.icon}</span>
            </button>
          ))}
        </div>

        {/* Canvas Area */}
        <div
          ref={containerRef}
          className={styles.canvasContainer}
          onMouseDown={handleMouseDown}
          onMouseMove={(e) => {
            // Throttle hover debug logging to reduce performance impact
            if (debugMode) {
              logHoverDebug(e.target);
            }
          }}
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
          {/* Drawing mode indicator */}
          {isDrawing && (
            <div className={`${styles.drawingModeIndicator}`}>
              <span>🎨 Drawing Mode Active</span>
              <span style={{ fontSize: "0.8em", marginLeft: "10px" }}>
                ESC to cancel
              </span>
            </div>
          )}

          {/* Transform feedback display */}
          {transformFeedback.visible && (
            <div
              className={`${styles.transformFeedback} ${
                transformFeedback.visible ? "visible" : ""
              }`}
            >
              {transformFeedback.text}
            </div>
          )}

          {/* New: Dedicated overlay group for selection visuals */}
          <svg
            ref={svgRef}
            className={styles.mapCanvas}
            onClick={handleCanvasClick}
            onContextMenu={(e) => e.preventDefault()}
            width="100%"
            height="100%"
            viewBox={`${camera.minX} ${camera.minY} ${camera.width} ${camera.height}`}
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
            data-testid="map-canvas"
          >
            {/* Render loaded SVG content with proper scaling via svg.js (no dangerouslySetInnerHTML) */}
            {loadedSvgElements ? (
              <>
                <g
                  ref={contentGroupRef}
                  className={styles.contentGroup}
                  transform={`translate(${initialOffsetRef.current.x} ${
                    initialOffsetRef.current.y
                  }) scale(${contentScale}) translate(${-contentMinX} ${-contentMinY})`}
                />
                {/* Hover overlay group for non-destructive hover effects */}
                <g
                  ref={hoverOverlayRef}
                  className="hover-overlay-group"
                  transform={`translate(${initialOffsetRef.current.x} ${
                    initialOffsetRef.current.y
                  }) scale(${contentScale}) translate(${-contentMinX} ${-contentMinY})`}
                  style={{ pointerEvents: "none" }}
                />
                {/* Overlay group above content for selection indicators - positioned in same coordinate space as content */}
                <g
                  ref={overlayGroupRef}
                  transform={`translate(${initialOffsetRef.current.x} ${
                    initialOffsetRef.current.y
                  }) scale(${contentScale}) translate(${-contentMinX} ${-contentMinY})`}
                  style={{ pointerEvents: "none" }}
                />
              </>
            ) : (
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
              </>
            )}
            {/* Removed custom selection overlay; svg.js selectize/resize provide visuals plus our overlay */}
          </svg>
        </div>

        {/* Right Properties Panel */}
        <div className={styles.rightPropertiesPanel}>
          <div className={`${styles.panel} ${styles.layersPanel}`}>
            <h3>Layers</h3>
            <p>Layer management coming soon...</p>
          </div>
          <PropertiesPanel
            selectedElements={selectedElements}
            properties={{
              stroke: propStroke,
              strokeWidth: propStrokeWidth,
              fill: propFill,
              opacity: propOpacity,
              linecap: propLinecap,
              linejoin: propLinejoin,
              dasharray: propDasharray,
            }}
            onPropertyChange={onPropertyChange}
            getTransformInfo={getTransformInfo}
            onTransform={onTransform}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <span>Tool: {tools.find((t) => t.id === activeTool)?.name}</span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span>Selected: {selectedElements.length} elements</span>
      </div>
    </div>
  );
};

export default MapEditor;

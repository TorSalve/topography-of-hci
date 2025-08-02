import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  evaluateExpression,
  formatValue,
  roundToThousandth,
  processInputValue,
} from "../utils/mathUtils";
import {
  createEnterKeyHandler,
  createInputChangeHandler,
  createFocusHandler,
  createBlurHandler,
} from "../utils/inputUtils";

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const AccordionSection = ({
  title,
  children,
  defaultOpen = false,
  onToggle,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggle) {
      onToggle(title.toLowerCase(), newState);
    }
  };

  return (
    <div className="accordion-section">
      <button
        className={`accordion-header ${isOpen ? "open" : ""}`}
        onClick={handleToggle}
      >
        <span className="accordion-title">{title}</span>
        <span className="accordion-icon">{isOpen ? "−" : "+"}</span>
      </button>
      <div className={`accordion-content ${isOpen ? "open" : ""}`}>
        <div className="accordion-content-inner">{children}</div>
      </div>
    </div>
  );
};

const HeightInput = ({ value, onChange, disabled = false }) => {
  const [inputValue, setInputValue] = useState(value?.toString() || "");
  const [isEditing, setIsEditing] = useState(false);

  // Update input value when external value changes
  useEffect(() => {
    if (!isEditing) {
      setInputValue(value?.toString() || "");
    }
  }, [value, isEditing]);

  const handleInputChange = createInputChangeHandler(setInputValue);
  const handleInputFocus = createFocusHandler(setIsEditing);
  const handleInputBlur = () => {
    const blurHandler = createBlurHandler({
      setIsEditing,
      setValue: setInputValue,
      onChange,
      processValue: processInputValue,
      formatValue: (val) => val?.toString() || "",
      currentValue: value,
    });
    blurHandler(inputValue);
  };

  const handleInputKeyDown = createEnterKeyHandler(handleInputBlur);

  return (
    <div className="height-input-container">
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        disabled={disabled}
        className="height-input"
        placeholder="Enter height (e.g., 10+5, 20*2)"
      />
      <span className="height-unit">units</span>
    </div>
  );
};

const DragInput = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
  disabled = false,
  onInteractionStart,
  onInteractionEnd,
}) => {
  const inputRef = useRef(null);
  const dragStateRef = useRef({ isDragging: false, startX: 0, startValue: 0 });
  const [inputValue, setInputValue] = useState(formatValue(value));
  const [isEditing, setIsEditing] = useState(false);

  // Update input value when external value changes
  useEffect(() => {
    if (!isEditing) {
      setInputValue(formatValue(value));
    }
  }, [value, isEditing]);

  const handleMouseDown = (e) => {
    // Only start drag if clicking on the wrapper, not the input field, and not disabled
    if (e.target.tagName === "INPUT" || disabled) return;

    dragStateRef.current.isDragging = true;
    dragStateRef.current.startX = e.clientX;
    dragStateRef.current.startValue = value;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Notify interaction start
    if (onInteractionStart) {
      onInteractionStart();
    }

    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (dragStateRef.current.isDragging) {
      const deltaX = e.clientX - dragStateRef.current.startX;
      const sensitivity = step * 0.5;
      const newValue = Math.max(
        min,
        Math.min(max, dragStateRef.current.startValue + deltaX * sensitivity)
      );

      // Round to nearest thousandth
      const roundedValue = roundToThousandth(newValue);
      onChange(roundedValue);
    }
  };

  const handleMouseUp = () => {
    dragStateRef.current.isDragging = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    // Notify interaction end
    if (onInteractionEnd) {
      onInteractionEnd();
    }
  };

  const handleInputChange = createInputChangeHandler(setInputValue);
  const handleInputFocus = createFocusHandler(setIsEditing, onInteractionStart);

  const handleInputBlur = () => {
    const blurHandler = createBlurHandler({
      setIsEditing,
      setValue: setInputValue,
      onChange: (newValue) => {
        const clampedValue = Math.max(min, Math.min(max, newValue));
        const roundedValue = roundToThousandth(clampedValue);
        onChange(roundedValue);
      },
      processValue: processInputValue,
      formatValue,
      currentValue: value,
      onInteractionEnd,
    });
    blurHandler(inputValue);
  };

  const handleInputKeyDown = createEnterKeyHandler(handleInputBlur, inputRef);

  return (
    <div className="drag-input-container">
      <label className="drag-input-label">{label}</label>
      <div
        className={`drag-input-wrapper ${isEditing ? "editing" : ""} ${
          disabled ? "disabled" : ""
        }`}
        onMouseDown={handleMouseDown}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="drag-input"
          placeholder={`${formatValue(value)} (e.g., 10+5, 20*2)`}
          disabled={disabled}
        />
        <span className="drag-input-unit">{unit}</span>
        {!disabled && <div className="drag-indicator">⟷</div>}
      </div>
    </div>
  );
};

const SlicePreview = ({
  file,
  parameters,
  zBounds,
  isUserInteracting,
  onInteractionStart,
  onInteractionEnd,
}) => {
  const [sliceData, setSliceData] = useState(null);
  const [currentZ, setCurrentZ] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatePending, setUpdatePending] = useState(false);
  const interactionTimeoutRef = useRef(null);

  // Set initial Z level to middle of bounds
  useEffect(() => {
    if (zBounds && zBounds.min !== undefined && zBounds.max !== undefined) {
      const midZ = (zBounds.min + zBounds.max) / 2;
      setCurrentZ(midZ);
    }
  }, [zBounds]);

  const fetchSlicePreview = useCallback(
    async (zLevel) => {
      if (!file) {
        return;
      }

      setLoading(true);
      setUpdatePending(false);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("z_level", zLevel.toString());
        formData.append("rotation_x", parameters.rotationX.toString());
        formData.append("rotation_y", parameters.rotationY.toString());
        formData.append("rotation_z", parameters.rotationZ.toString());
        formData.append("translation_x", parameters.translationX.toString());
        formData.append("translation_y", parameters.translationY.toString());
        formData.append("translation_z", parameters.translationZ.toString());
        formData.append("pivot_x", parameters.pivotX.toString());
        formData.append("pivot_y", parameters.pivotY.toString());
        formData.append("pivot_z", parameters.pivotZ.toString());
        formData.append("scale", parameters.scale.toString());

        const response = await fetch("http://localhost:8000/slice-preview/", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setSliceData(data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching slice preview:", err);
      } finally {
        setLoading(false);
      }
    },
    [file, parameters]
  );

  // Effect for parameter changes - only updates when user is NOT interacting
  useEffect(() => {
    if (currentZ !== null && zBounds && file && !isUserInteracting) {
      setUpdatePending(true);

      // Clear any existing timeout
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }

      // Set a timeout to trigger update
      interactionTimeoutRef.current = setTimeout(() => {
        fetchSlicePreview(currentZ);
      }, 300); // Shorter delay since we know user stopped interacting
    }
  }, [
    currentZ,
    parameters.rotationX,
    parameters.rotationY,
    parameters.rotationZ,
    parameters.translationX,
    parameters.translationY,
    parameters.translationZ,
    parameters.pivotX,
    parameters.pivotY,
    parameters.pivotZ,
    parameters.scale,
    fetchSlicePreview,
    zBounds,
    file,
    isUserInteracting,
  ]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, []);

  if (!file || !zBounds) {
    return (
      <div className="slice-preview">
        <div className="slice-preview-placeholder">
          <span>Upload a file to see slice preview</span>
        </div>
      </div>
    );
  }

  const handleZChange = (e) => {
    const newZ = parseFloat(e.target.value);
    setCurrentZ(newZ);
  };

  const zRange = zBounds.max - zBounds.min;
  const zPercentage =
    zRange > 0 ? ((currentZ - zBounds.min) / zRange) * 100 : 50;

  return (
    <div className="slice-preview">
      <div className="slice-preview-header">
        <h4>Slice Preview</h4>
        <div className="z-level-info">
          Z: {currentZ.toFixed(3)} ({zPercentage.toFixed(0)}%)
          {updatePending && !loading && (
            <span className="update-pending"> • Updating...</span>
          )}
        </div>
      </div>

      <div className="slice-preview-container">
        <div
          className={`slice-preview-canvas ${loading ? "loading" : ""} ${
            updatePending ? "pending" : ""
          }`}
        >
          {loading && <div className="slice-loading">Loading...</div>}
          {error && <div className="slice-error">Error: {error}</div>}
          {sliceData && sliceData.svg && (
            <div
              className="slice-svg"
              dangerouslySetInnerHTML={{ __html: sliceData.svg }}
            />
          )}
          {sliceData && sliceData.line_count === 0 && !loading && (
            <div className="slice-empty">No contours at this level</div>
          )}
        </div>

        <div className="slice-controls">
          <input
            type="range"
            min={zBounds.min}
            max={zBounds.max}
            step={zRange / 100}
            value={currentZ}
            onChange={handleZChange}
            onMouseDown={onInteractionStart}
            onMouseUp={onInteractionEnd}
            onTouchStart={onInteractionStart}
            onTouchEnd={onInteractionEnd}
            className="z-slider"
          />
          <div className="z-bounds">
            <span className="z-min">{zBounds.min.toFixed(2)}</span>
            <span className="z-max">{zBounds.max.toFixed(2)}</span>
          </div>
          {sliceData && (
            <div className="slice-stats">
              {sliceData.line_count} contour
              {sliceData.line_count !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Parameters = ({
  parameters,
  onParameterChange,
  visible,
  onAccordionToggle,
  isLocked = false,
  file = null,
  zBounds = null,
}) => {
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const interactionCountRef = useRef(0);

  if (!visible) return null;

  const handleInteractionStart = () => {
    interactionCountRef.current += 1;
    setIsUserInteracting(true);
  };

  const handleInteractionEnd = () => {
    interactionCountRef.current = Math.max(0, interactionCountRef.current - 1);
    if (interactionCountRef.current === 0) {
      // Small delay to ensure all interactions are finished
      setTimeout(() => {
        if (interactionCountRef.current === 0) {
          setIsUserInteracting(false);
        }
      }, 100);
    }
  };

  const handleChange = (name, value) => {
    if (!isLocked) {
      onParameterChange({ ...parameters, [name]: value });
    }
  };

  const handleAccordionToggle = (sectionName, isOpen) => {
    if (onAccordionToggle) {
      onAccordionToggle(sectionName, isOpen);
    }
  };

  const createDragInput = (label, paramName, min, max, step, unit = "") => (
    <DragInput
      label={label}
      value={parameters[paramName]}
      onChange={(value) => handleChange(paramName, value)}
      min={min}
      max={max}
      step={step}
      unit={unit}
      disabled={isLocked}
      onInteractionStart={handleInteractionStart}
      onInteractionEnd={handleInteractionEnd}
    />
  );

  const resetParameters = () => {
    if (!isLocked) {
      const defaultHeight = zBounds ? zBounds.max - zBounds.min : null;
      onParameterChange({
        contourLevels: 20,
        realWorldHeight: defaultHeight,
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
    }
  };

  return (
    <div className={`parameters-panel ${isLocked ? "locked" : ""}`}>
      {isLocked && (
        <div className="parameters-lock-overlay">
          <div className="lock-icon">🔒</div>
          <p>Parameters locked during processing</p>
        </div>
      )}
      <div className="parameters-header">
        <h3 className="parameters-title">Parameters</h3>
        <div className="header-controls">
          <div className="tooltip-container">
            <span className="tooltip-icon">💡</span>
            <div className="tooltip">
              <strong>Parameter Tips:</strong>
              <br />
              • Drag horizontally on input fields to adjust values
              <br />
              • Click section headers to expand/collapse
              <br />
              • Rotation values beyond ±180° are automatically normalized
              <br />• Reset button restores default values
            </div>
          </div>
          <button
            onClick={resetParameters}
            className="reset-btn"
            disabled={isLocked}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="parameters-list">
        <AccordionSection
          title="Processing"
          defaultOpen={true}
          onToggle={handleAccordionToggle}
        >
          <div className="parameter-group">
            <label className="parameter-label">Processing Engine</label>
            <select
              value={parameters.engine}
              onChange={(e) => handleChange("engine", e.target.value)}
              disabled={isLocked}
              className="engine-select"
            >
              <option value="trimesh">Trimesh (Clean Lines)</option>
              <option value="blender">Advanced Processing</option>
            </select>
          </div>
          <DragInput
            label="Contour Levels"
            value={parameters.contourLevels}
            onChange={(value) => handleChange("contourLevels", value)}
            min={5}
            max={50}
            step={1}
            disabled={isLocked}
          />

          {/* Model Height and Contour Interval Information */}
          <div className="parameter-group">
            <label className="parameter-label">Model Height (Real World)</label>
            <HeightInput
              value={parameters.realWorldHeight || ""}
              onChange={(value) => handleChange("realWorldHeight", value)}
              disabled={isLocked}
            />
          </div>

          {/* Display contour interval */}
          {parameters.realWorldHeight && parameters.contourLevels && (
            <div className="parameter-group contour-info">
              <label className="parameter-label">Contour Interval</label>
              <div className="contour-interval-display">
                {(
                  parameters.realWorldHeight / parameters.contourLevels
                ).toFixed(3)}{" "}
                units between lines
              </div>
            </div>
          )}
        </AccordionSection>

        <AccordionSection
          title="Rotation"
          defaultOpen={true}
          onToggle={handleAccordionToggle}
        >
          <DragInput
            label="X Axis"
            value={parameters.rotationX}
            onChange={(value) => handleChange("rotationX", value)}
            min={-720}
            max={720}
            step={5}
            unit="°"
          />
          <DragInput
            label="Y Axis"
            value={parameters.rotationY}
            onChange={(value) => handleChange("rotationY", value)}
            min={-720}
            max={720}
            step={5}
            unit="°"
          />
          <DragInput
            label="Z Axis"
            value={parameters.rotationZ}
            onChange={(value) => handleChange("rotationZ", value)}
            min={-720}
            max={720}
            step={5}
            unit="°"
          />
        </AccordionSection>

        <AccordionSection
          title="Pivot Point"
          defaultOpen={false}
          onToggle={handleAccordionToggle}
        >
          <DragInput
            label="X Axis"
            value={parameters.pivotX}
            onChange={(value) => handleChange("pivotX", value)}
            min={-2}
            max={2}
            step={0.1}
          />
          <DragInput
            label="Y Axis"
            value={parameters.pivotY}
            onChange={(value) => handleChange("pivotY", value)}
            min={-2}
            max={2}
            step={0.1}
          />
          <DragInput
            label="Z Axis"
            value={parameters.pivotZ}
            onChange={(value) => handleChange("pivotZ", value)}
            min={-2}
            max={2}
            step={0.1}
          />
        </AccordionSection>

        <AccordionSection
          title="Translation"
          defaultOpen={false}
          onToggle={handleAccordionToggle}
        >
          <DragInput
            label="X Axis"
            value={parameters.translationX}
            onChange={(value) => handleChange("translationX", value)}
            min={-5}
            max={5}
            step={0.1}
          />
          <DragInput
            label="Y Axis"
            value={parameters.translationY}
            onChange={(value) => handleChange("translationY", value)}
            min={-5}
            max={5}
            step={0.1}
          />
          <DragInput
            label="Z Axis"
            value={parameters.translationZ}
            onChange={(value) => handleChange("translationZ", value)}
            min={-5}
            max={5}
            step={0.1}
          />
        </AccordionSection>

        <AccordionSection
          title="Slice Preview"
          defaultOpen={true}
          onToggle={handleAccordionToggle}
        >
          <SlicePreview
            file={file}
            parameters={parameters}
            zBounds={zBounds}
            isUserInteracting={isUserInteracting}
            onInteractionStart={handleInteractionStart}
            onInteractionEnd={handleInteractionEnd}
          />
        </AccordionSection>

        <AccordionSection
          title="Scale"
          defaultOpen={false}
          onToggle={handleAccordionToggle}
        >
          <DragInput
            label="Scale Factor"
            value={parameters.scale}
            onChange={(value) => handleChange("scale", value)}
            min={0.1}
            max={10}
            step={0.1}
            unit="×"
          />
        </AccordionSection>
      </div>
    </div>
  );
};

export default Parameters;

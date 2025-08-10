// Camera/viewBox helpers

// Convert client (mouse) coordinates to outer SVG viewBox units
export const clientToSvgUnits = (containerEl, camera, evt) => {
  if (!containerEl || !evt) return { x: 0, y: 0 };
  const rect = containerEl.getBoundingClientRect();
  const rx = (evt.clientX - rect.left) / rect.width;
  const ry = (evt.clientY - rect.top) / rect.height;
  return {
    x: camera.minX + rx * camera.width,
    y: camera.minY + ry * camera.height,
  };
};

// Compute new camera on zoom with optional cursor anchoring
export const computeZoomedCamera = (
  baseSize,
  camera,
  newZoom,
  containerEl,
  mouseEvent
) => {
  const baseW = baseSize.width;
  const baseH = baseSize.height;
  const newW = baseW / newZoom;
  const newH = baseH / newZoom;
  if (mouseEvent && containerEl) {
    const rect = containerEl.getBoundingClientRect();
    const rx = (mouseEvent.clientX - rect.left) / rect.width;
    const ry = (mouseEvent.clientY - rect.top) / rect.height;
    const newMinX = camera.minX + (camera.width - newW) * rx;
    const newMinY = camera.minY + (camera.height - newH) * ry;
    return { minX: newMinX, minY: newMinY, width: newW, height: newH };
  }
  return {
    minX: camera.minX + (camera.width - newW) / 2,
    minY: camera.minY + (camera.height - newH) / 2,
    width: newW,
    height: newH,
  };
};

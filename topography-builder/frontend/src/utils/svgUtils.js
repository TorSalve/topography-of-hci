// SVG/DOM utility helpers shared by the editor

// Safely read an attribute with fallbacks used in the editor
export const getAttr = (el, name, fallback = "") => {
  if (!el) return fallback;
  const val = el.getAttribute(name);
  if (val !== null && val !== "") return val;
  if (name === "stroke") {
    const d = el.getAttribute("data-original-stroke");
    if (d) return d;
  }
  if (name === "stroke-width") {
    const d = el.getAttribute("data-original-stroke-width");
    if (d) return d;
  }
  return fallback;
};

// Normalize color-like values, returning a fallback for none/transparent
export const normalizeColor = (value, fallback = "#000000") => {
  if (!value || value === "none" || value === "transparent") return fallback;
  return value;
};

// Compute element bounds in outer SVG units using screen CTM
// Requires passing svgRef.current (the outer <svg> DOM element)
export const elementBoundsInSvg = (svgEl, el) => {
  const svg = svgEl;
  if (!svg || !el) return null;
  try {
    const svgScreenCTM = svg.getScreenCTM();
    if (!svgScreenCTM || typeof svgScreenCTM.inverse !== "function")
      return null;
    const invSvg = svgScreenCTM.inverse();
    const bbox = el.getBBox();
    const elCTM = el.getScreenCTM();
    if (!bbox || !elCTM) return null;
    const corners = [
      { x: bbox.x, y: bbox.y },
      { x: bbox.x + bbox.width, y: bbox.y },
      { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
      { x: bbox.x, y: bbox.y + bbox.height },
    ];
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const { x, y } of corners) {
      const p = svg.createSVGPoint();
      p.x = x;
      p.y = y;
      const screenP = p.matrixTransform(elCTM);
      const svgP = screenP.matrixTransform(invSvg);
      if (svgP.x < minX) minX = svgP.x;
      if (svgP.y < minY) minY = svgP.y;
      if (svgP.x > maxX) maxX = svgP.x;
      if (svgP.y > maxY) maxY = svgP.y;
    }
    return { minX, minY, maxX, maxY };
  } catch {
    return null;
  }
};

// Rectangle intersection helper used for marquee selection
export const intersectsRect = (a, b) => {
  return !(
    a.maxX < b.x ||
    a.minX > b.x + b.width ||
    a.maxY < b.y ||
    a.minY > b.y + b.height
  );
};

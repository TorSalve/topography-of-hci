import React from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import "../styles/MapEditorPage.scss";
import MapEditor from "../components/MapEditor/MapEditor";

function MapEditorPage() {
  const navigate = useNavigate();

  // Check for SVG data from MapGenerator (localStorage) or legacy sessionStorage
  const mapDataFromStorage = localStorage.getItem("editMapData");
  const svgFromSession = sessionStorage.getItem("svgToEdit");

  let initialSvg = null;
  let mapMetadata = null;

  if (mapDataFromStorage) {
    try {
      const parsedData = JSON.parse(mapDataFromStorage);
      initialSvg = parsedData.svgContent;
      mapMetadata = {
        originalFileName: parsedData.originalFileName,
        parameters: parsedData.parameters,
        zBounds: parsedData.zBounds,
        generatedAt: parsedData.generatedAt,
      };
    } catch (error) {
      console.error("Failed to parse map data from localStorage:", error);
    }
  } else if (svgFromSession) {
    initialSvg = svgFromSession;
  }

  const handleSave = (svgContent) => {
    // TODO: Implement saving to backend
    // For now, just show a success message
    alert("Map saved successfully!");
  };

  const handleExport = (svgContent, format) => {
    const blob = new Blob([svgContent], {
      type: format === "svg" ? "image/svg+xml" : "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // Use original filename if available, otherwise default
    const baseFileName = mapMetadata?.originalFileName
      ? mapMetadata.originalFileName.replace(/\.[^/.]+$/, "")
      : "edited-map";
    a.download = `${baseFileName}_edited.${format}`;

    a.click();
    URL.revokeObjectURL(url);

    // Clear both localStorage and sessionStorage after export
    localStorage.removeItem("editMapData");
    sessionStorage.removeItem("svgToEdit");
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="map-editor-page">
      <div className="container">
        <MapEditor
          initialSvg={initialSvg}
          mapMetadata={mapMetadata}
          onSave={handleSave}
          onExport={handleExport}
        />
      </div>
    </div>
  );
}

export default MapEditorPage;

import React from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import "../styles/App.scss";
import "../styles/MapGenerator.scss";
import { MapGenerator } from "../components";

function MapGeneratorPage() {
  const navigate = useNavigate();

  const handleSVGDownload = (svgContent) => {
    // Original download functionality
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "topography.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEditInEditor = (svgContent) => {
    // Store SVG in sessionStorage and navigate to editor
    sessionStorage.setItem("svgToEdit", svgContent);
    navigate("/editor");
  };

  return (
    <div className="map-generator-page">
      <div className="container">
        <MapGenerator
          onSVGDownload={handleSVGDownload}
          onEditInEditor={handleEditInEditor}
        />
      </div>
    </div>
  );
}

export default MapGeneratorPage;

import React from "react";
import "../styles/App.scss";
import "../styles/TopographyBuilder.scss";
import { MapGenerator } from "../components";

function TopographyBuilder({ onSVGDownload, onEditInEditor }) {
  return (
    <div className="topography-builder-page">
      <MapGenerator
        onSVGDownload={onSVGDownload}
        onEditInEditor={onEditInEditor}
      />
    </div>
  );
}

export default TopographyBuilder;

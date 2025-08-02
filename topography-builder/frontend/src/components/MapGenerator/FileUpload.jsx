import React, { useRef } from "react";
import { FILE_CONFIG } from "../../constants/config";

const FileUpload = ({ onFileSelect, loading }) => {
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileSelect = (e) => {
    e.stopPropagation();
    const file = e.target.files[0];
    if (file) onFileSelect(file);
  };

  const handleClick = (e) => {
    // Prevent click if it's on the input itself
    if (e.target.type === "file") {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const acceptedFormats = FILE_CONFIG.SUPPORTED_FORMATS.join(",");

  return (
    <div
      className="upload-area"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleClick}
      style={{
        opacity: loading ? 0.6 : 1,
        pointerEvents: loading ? "none" : "auto",
      }}
    >
      <div className="upload-icon">📁</div>
      <div className="upload-text">
        Drag & drop your file here, or click to select
      </div>
      <div className="upload-hint">
        Supported formats: {FILE_CONFIG.SUPPORTED_FORMATS.join(", ")}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats}
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
    </div>
  );
};

export default FileUpload;

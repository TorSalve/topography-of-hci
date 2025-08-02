import React, { useRef } from "react";
import { FILE_CONFIG } from "../constants/config";

const FileUpload = ({ onFileSelect, loading }) => {
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) onFileSelect(file);
  };

  const handleClick = () => {
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
      <p>Drag & drop your file here, or click to select</p>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats}
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default FileUpload;

import React from "react";

const LoadingSpinner = ({ visible, text = "Processing..." }) => {
  if (!visible) return null;

  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner"></div>
      <p className="loading-text">{text}</p>
    </div>
  );
};

export default LoadingSpinner;

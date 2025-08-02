import React from "react";

const ProgressBar = ({ progress, visible, status, isProcessing }) => {
  if (!visible) return null;

  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div
          className={`progress-fill ${isProcessing ? "processing" : ""}`}
          style={{
            width: isProcessing ? "100%" : `${progress}%`,
          }}
        />
      </div>
      <p className="progress-text">
        {status || (isProcessing ? "Processing..." : `${progress}%`)}
      </p>
    </div>
  );
};

export default ProgressBar;

import { useState } from "react";
import {
  uploadFile,
  uploadFileSVG,
  downloadBlob,
  createPreviewUrl,
  revokePreviewUrl,
} from "../services/uploadService";

export const useFileUpload = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(""); // New status state
  const [resultImage, setResultImage] = useState(null); // New state for result image
  const [resultBlob, setResultBlob] = useState(null); // Store the blob for download
  const [resultSvgBlob, setResultSvgBlob] = useState(null); // Store the SVG blob for download
  const [originalFileName, setOriginalFileName] = useState(""); // Store original filename
  const [selectedFile, setSelectedFile] = useState(null); // Store selected file for preview

  const handleUpload = async (file, parameters = {}) => {
    if (!file) return;

    // Clear previous result if any
    if (resultImage) {
      revokePreviewUrl(resultImage);
      setResultImage(null);
    }
    if (resultBlob) {
      setResultBlob(null);
    }
    if (resultSvgBlob) {
      setResultSvgBlob(null);
    }

    setLoading(true);
    setError("");
    setProgress(0);
    setStatus("Uploading file...");
    setOriginalFileName(file.name);

    try {
      const blob = await uploadFile(file, parameters, (uploadProgress) => {
        setProgress(uploadProgress);
        if (uploadProgress < 100) {
          setStatus(`Uploading... ${uploadProgress}%`);
        } else {
          setStatus("Processing file...");
          // Reset progress to show indeterminate progress for processing
          setProgress(0);
        }
      });

      setStatus("Processing complete!");

      // Create preview URL for the result image
      const previewUrl = createPreviewUrl(blob);
      setResultImage(previewUrl);
      setResultBlob(blob);

      // Clear status after a short delay
      setTimeout(() => {
        setStatus("");
      }, 3000);
    } catch (err) {
      setError(err.message);
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setError(""); // Clear any previous errors
  };

  const reset = () => {
    if (resultImage) {
      revokePreviewUrl(resultImage);
      setResultImage(null);
    }
    if (resultBlob) {
      setResultBlob(null);
    }
    if (resultSvgBlob) {
      setResultSvgBlob(null);
    }
    setLoading(false);
    setProgress(0);
    setError("");
    setStatus("");
    setOriginalFileName("");
    setSelectedFile(null);
  };

  const handleDownloadPNG = () => {
    if (resultBlob && originalFileName) {
      // Create download filename from original filename
      const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, "");
      const downloadFilename = `${nameWithoutExt}_topographical_map.png`;
      downloadBlob(resultBlob, downloadFilename);
    }
  };

  const handleDownloadSVG = async (parameters = {}) => {
    if (!selectedFile) {
      setError("No file selected for SVG download");
      return;
    }

    setLoading(true);
    setError("");
    setProgress(0);
    setStatus("Generating SVG...");

    try {
      const svgBlob = await uploadFileSVG(
        selectedFile,
        parameters,
        (uploadProgress) => {
          setProgress(uploadProgress);
          if (uploadProgress < 100) {
            setStatus(`Generating SVG... ${uploadProgress}%`);
          } else {
            setStatus("Processing SVG...");
            setProgress(0);
          }
        }
      );

      setStatus("SVG generation complete!");
      setResultSvgBlob(svgBlob);

      // Auto-download the SVG
      const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, "");
      const downloadFilename = `${nameWithoutExt}_topographical_map.svg`;
      downloadBlob(svgBlob, downloadFilename);

      // Clear status after a short delay
      setTimeout(() => {
        setStatus("");
      }, 3000);
    } catch (err) {
      setError(err.message);
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  // Legacy function for backward compatibility
  const handleDownload = handleDownloadPNG;

  return {
    loading,
    progress,
    error,
    status,
    resultImage,
    originalFileName,
    selectedFile,
    handleUpload,
    handleFileSelect,
    handleDownload,
    handleDownloadPNG,
    handleDownloadSVG,
    reset,
  };
};

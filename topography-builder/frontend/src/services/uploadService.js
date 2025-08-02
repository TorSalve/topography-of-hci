import { API_CONFIG, FILE_CONFIG } from "../constants/config";

// Upload service to handle file processing
export const uploadFile = (file, parameters = {}, onProgress) => {
  return new Promise((resolve, reject) => {
    // Validate file size
    if (file.size > FILE_CONFIG.MAX_FILE_SIZE) {
      reject(
        new Error(
          `File size exceeds ${FILE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB limit`
        )
      );
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    // Add parameters to form data
    formData.append("contour_levels", parameters.contourLevels || 20);
    formData.append("rotation_x", parameters.rotationX || 0);
    formData.append("rotation_y", parameters.rotationY || 0);
    formData.append("rotation_z", parameters.rotationZ || 0);
    formData.append("translation_x", parameters.translationX || 0);
    formData.append("translation_y", parameters.translationY || 0);
    formData.append("translation_z", parameters.translationZ || 0);
    formData.append("pivot_x", parameters.pivotX || 0);
    formData.append("pivot_y", parameters.pivotY || 0);
    formData.append("pivot_z", parameters.pivotZ || 0);
    formData.append("scale", parameters.scale || 1.0);
    formData.append("engine", parameters.engine || "trimesh");

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD}`,
      true
    );

    // Handle upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    // Handle successful response
    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = new Blob([xhr.response], { type: "image/png" });
        resolve(blob);
      } else if (xhr.status === 405) {
        reject(
          new Error(
            "CORS error: Make sure the backend server is running and CORS is configured properly."
          )
        );
      } else if (xhr.status === 0) {
        reject(
          new Error(
            `Network error: Cannot connect to server. Make sure the backend is running on ${API_CONFIG.BASE_URL}`
          )
        );
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(new Error(errorResponse.detail || "Unknown error occurred."));
        } catch {
          reject(new Error("Upload failed with status: " + xhr.status));
        }
      }
    };

    // Handle network errors
    xhr.onerror = () => {
      reject(
        new Error(
          `Network error: Cannot connect to server. Make sure the backend is running on ${API_CONFIG.BASE_URL}`
        )
      );
    };

    xhr.responseType = "blob";
    xhr.send(formData);
  });
};

// Upload service to handle SVG file processing
export const uploadFileSVG = (file, parameters = {}, onProgress) => {
  return new Promise((resolve, reject) => {
    // Validate file size
    if (file.size > FILE_CONFIG.MAX_FILE_SIZE) {
      reject(
        new Error(
          `File size exceeds ${FILE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB limit`
        )
      );
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    // Add parameters to form data
    formData.append("contour_levels", parameters.contourLevels || 20);
    formData.append("rotation_x", parameters.rotationX || 0);
    formData.append("rotation_y", parameters.rotationY || 0);
    formData.append("rotation_z", parameters.rotationZ || 0);
    formData.append("translation_x", parameters.translationX || 0);
    formData.append("translation_y", parameters.translationY || 0);
    formData.append("translation_z", parameters.translationZ || 0);
    formData.append("pivot_x", parameters.pivotX || 0);
    formData.append("pivot_y", parameters.pivotY || 0);
    formData.append("pivot_z", parameters.pivotZ || 0);
    formData.append("scale", parameters.scale || 1.0);
    formData.append("line_width", parameters.lineWidth || 1.0);
    formData.append("engine", parameters.engine || "trimesh");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_CONFIG.BASE_URL}/generate-map-svg`, true);

    // Handle upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    // Handle successful response
    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = new Blob([xhr.response], { type: "image/svg+xml" });
        resolve(blob);
      } else if (xhr.status === 405) {
        reject(
          new Error(
            "CORS error: Make sure the backend server is running and CORS is configured properly."
          )
        );
      } else if (xhr.status === 0) {
        reject(
          new Error(
            `Network error: Cannot connect to server. Make sure the backend is running on ${API_CONFIG.BASE_URL}`
          )
        );
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(new Error(errorResponse.detail || "Unknown error occurred."));
        } catch {
          reject(new Error("SVG upload failed with status: " + xhr.status));
        }
      }
    };

    // Handle network errors
    xhr.onerror = () => {
      reject(
        new Error(
          `Network error: Cannot connect to server. Make sure the backend is running on ${API_CONFIG.BASE_URL}`
        )
      );
    };

    xhr.responseType = "blob";
    xhr.send(formData);
  });
};

// Utility function to download a blob as a file
export const downloadBlob = (blob, filename = FILE_CONFIG.OUTPUT_FILENAME) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

// Utility function to create a preview URL from a blob
export const createPreviewUrl = (blob) => {
  return window.URL.createObjectURL(blob);
};

// Utility function to revoke a preview URL
export const revokePreviewUrl = (url) => {
  window.URL.revokeObjectURL(url);
};

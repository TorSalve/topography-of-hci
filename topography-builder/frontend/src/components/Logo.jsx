import React from "react";

const Logo = ({ size = "medium", className = "" }) => {
  const sizeMap = {
    small: { width: "24px", height: "24px" },
    medium: { width: "48px", height: "48px" },
    large: { width: "72px", height: "72px" },
    xlarge: { width: "96px", height: "96px" },
  };

  const logoSize = sizeMap[size] || sizeMap.medium;

  return (
    <img
      src="/logo-mobile.svg"
      alt="Topography of HCI"
      style={{
        width: logoSize.width,
        height: logoSize.height,
        objectFit: "contain",
      }}
      className={`logo ${className}`}
    />
  );
};

export default Logo;

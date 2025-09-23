"use client";

import React from "react";

interface AppIconProps {
  appName: string;
  iconUrl?: string;
  size?: number;
  className?: string;
}

function AppIcon(props: AppIconProps) {
  const { appName, iconUrl, size = 64, className = "" } = props;

  // Show icon if URL provided, otherwise fallback to first letter
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={`${appName} app icon`}
        className={`app-icon ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: "12px",
          objectFit: "cover",
          border: "1px solid #e5e7eb",
        }}
        onError={(e) => {
          // Fallback to letter icon if image fails to load
          const target = e.target as HTMLImageElement;
          const fallback = document.createElement("div");
          fallback.className = `app-icon-fallback ${className}`;
          fallback.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            background-color: #3b82f6;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${size * 0.4}px;
            font-weight: bold;
            color: white;
            border: 1px solid #2563eb;
          `;
          fallback.title = appName;
          fallback.textContent = appName.charAt(0).toUpperCase();
          target.parentNode?.replaceChild(fallback, target);
        }}
        title={appName}
      />
    );
  }

  // Fallback with first letter
  const firstLetter = appName.charAt(0).toUpperCase();
  return (
    <div
      className={`app-icon-fallback ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: "#3b82f6",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: "bold",
        color: "white",
        border: "1px solid #2563eb",
      }}
      title={appName}
    >
      {firstLetter}
    </div>
  );
}

export default AppIcon;

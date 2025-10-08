"use client";

import React, { useState, useEffect } from "react";

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  if (isOnline) {
    return null; // No need to display anything when online
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        width: "100%",
        background: "red",
        color: "white",
        textAlign: "center",
        padding: "10px",
      }}
    >
      Internet is not connected or not available.
    </div>
  );
};

export default NetworkStatus;

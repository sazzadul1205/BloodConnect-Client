// Pages/Frontend/components/Loading.jsx

import React from "react";

const Loading = ({ message = "Loading...", fullScreen = true }) => {
  return (
    <div
      className={`${fullScreen ? "fixed inset-0 flex items-center justify-center bg-base-100 z-50" : "flex items-center justify-center"
        }`}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Animated spinner */}
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-error"></div>

        {/* Message */}
        <p className="text-lg font-semibold text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default Loading;

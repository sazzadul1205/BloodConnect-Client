import React from "react";
import { MdErrorOutline, MdRefresh, MdArrowBack } from "react-icons/md";

const ErrorState = ({ error, onRetry, onGoBack, showHomeButton = false }) => {
  // Convert any error into user-friendly messages
  const extractMessages = (err) => {
    if (!err) return ["Something went wrong. Please try again."];

    if (Array.isArray(err)) return err.flatMap(extractMessages);

    if (typeof err === "string") return [err];

    if (err instanceof Error) return [err.message];

    if (err?.response) {
      const { status, data } = err.response;

      // Friendly messages per status code
      switch (status) {
        case 400:
          return ["The request was invalid. Please check your input and try again."];
        case 401:
          return ["You are not logged in or your session has expired. Please log in again."];
        case 403:
          return ["You don't have permission to perform this action."];
        case 404:
          return ["The requested resource was not found."];
        case 429:
          return ["Too many requests. Please wait a moment and try again."];
        case 500:
          return ["Oops! Something went wrong on the server. Please try again later."];
        case 502:
        case 503:
        case 504:
          return ["The server is currently unavailable. Please check back in a few minutes."];
        default:
          // fallback: use backend message if available
          {
            const backendMsg = data?.errors?.join(", ") || data?.message || data?.error;
            return [backendMsg || "Something went wrong. Please try again."];
          }
      }
    }

    // Handle network errors
    if (err?.code === 'ECONNABORTED' || err?.message?.includes('Network Error')) {
      return ["Network connection issue. Please check your internet connection and try again."];
    }

    return ["Something went wrong. Please try again."];
  };

  const messages = extractMessages(error);

  return (
    <div className="flex items-center justify-center my-16 md:my-0 md:min-h-screen bg-base-200 px-3 sm:px-4">
      <div className="card w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg shadow-2xl rounded-xl overflow-hidden animate-fadeIn">

        {/* Header - Responsive */}
        <div className="flex flex-col items-center justify-center p-4 sm:p-5 md:p-6 bg-linear-to-r from-red-600 to-red-400">
          <div className="rounded-full bg-white/20 p-3 sm:p-3.5 md:p-4 mb-2 sm:mb-3 md:mb-4 animate-bounce">
            <MdErrorOutline className="text-white text-3xl sm:text-4xl md:text-5xl" />
          </div>
          <h2 className="text-white text-lg sm:text-xl md:text-2xl font-bold mb-1 tracking-wide text-center">
            Oops! Something went wrong
          </h2>
          <p className="text-white/80 text-xs sm:text-sm text-center max-w-xs sm:max-w-sm">
            Don't worry, we're here to help
          </p>
        </div>

        {/* Body - Responsive */}
        <div className="card-body items-start text-left bg-base-100 p-4 sm:p-5 md:p-6">
          <div className="w-full">
            {messages.map((msg, idx) => (
              <div key={idx} className="flex items-start gap-2 mb-2">
                <span className="text-red-500 text-sm sm:text-base mt-0.5">•</span>
                <p className="text-base-content/80 text-xs sm:text-sm md:text-base wrap-break-word flex-1">
                  {msg}
                </p>
              </div>
            ))}
          </div>

          {/* Error Code (if available) - Responsive */}
          {error?.response?.status && (
            <div className="mt-2 sm:mt-3 w-full">
              <p className="text-xs sm:text-sm text-base-content/60 border-t border-base-300 pt-2 sm:pt-3">
                Error Code: <span className="font-mono font-semibold">{error.response.status}</span>
              </p>
            </div>
          )}

          {/* Action Buttons - Responsive */}
          <div className="mt-4 sm:mt-5 md:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
            {onRetry && (
              <button
                onClick={onRetry}
                className="btn btn-error btn-sm sm:btn-md flex-1 hover:scale-105 transition-transform duration-200 gap-2"
              >
                <MdRefresh className="text-sm sm:text-base" />
                <span className="text-xs sm:text-sm">Try Again</span>
              </button>
            )}

            {onGoBack && (
              <button
                onClick={onGoBack}
                className="btn btn-outline btn-sm sm:btn-md flex-1 hover:scale-105 transition-transform duration-200 gap-2"
              >
                <MdArrowBack className="text-sm sm:text-base" />
                <span className="text-xs sm:text-sm">Go Back</span>
              </button>
            )}

            {showHomeButton && !onGoBack && (
              <button
                onClick={() => window.location.href = '/'}
                className="btn btn-outline btn-sm sm:btn-md flex-1 hover:scale-105 transition-transform duration-200"
              >
                <span className="text-xs sm:text-sm">Go to Home</span>
              </button>
            )}
          </div>

          {/* Help Text for Mobile */}
          <p className="text-xs text-base-content/50 text-center w-full mt-3 sm:mt-4">
            If the problem persists, please contact support
          </p>
        </div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-out forwards;
          }

          /* Responsive adjustments */
          @media (max-width: 640px) {
            .btn {
              min-height: 2.5rem;
              padding-left: 0.75rem;
              padding-right: 0.75rem;
            }
          }
        `}
      </style>
    </div>
  );
};


export default ErrorState;
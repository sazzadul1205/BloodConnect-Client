import React from "react";
import { MdErrorOutline } from "react-icons/md";

const ErrorState = ({ error, onRetry }) => {
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
        case 401:
          return ["You are not logged in or your session has expired. Please log in again."];
        case 403:
          return ["You don’t have permission to perform this action."];
        case 404:
          return ["The requested resource was not found."];
        case 500:
          return ["Oops! Something went wrong on the server. Please try again later."];
        default:
          // fallback: use backend message if available
          {
            const backendMsg = data?.errors?.join(", ") || data?.message || data?.error;
            return [backendMsg || "Something went wrong. Please try again."];
          }
      }
    }

    return ["Something went wrong. Please try again."];
  };

  const messages = extractMessages(error);

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200 px-4">
      <div className="card w-full max-w-md shadow-2xl rounded-xl overflow-hidden animate-fadeIn">

        {/* Header */}
        <div className="flex flex-col items-center justify-center p-6 bg-linear-to-r from-red-600 to-red-400">
          <div className="rounded-full bg-white/20 p-4 mb-4 animate-bounce">
            <MdErrorOutline className="text-white text-5xl" />
          </div>
          <h2 className="text-white text-2xl font-bold mb-1 tracking-wide">
            Oops! Something went wrong
          </h2>
        </div>

        {/* Body */}
        <div className="card-body items-start text-left bg-base-100 p-6">
          {messages.map((msg, idx) => (
            <p
              key={idx}
              className="text-base-content/80 mb-2 wrap-break-word list-disc list-inside"
            >
              {msg}
            </p>
          ))}

          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className="btn btn-error btn-sm hover:scale-105 transition-transform duration-200"
              >
                Try Again
              </button>
            </div>
          )}
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
        `}
      </style>
    </div>
  );
};

export default ErrorState;
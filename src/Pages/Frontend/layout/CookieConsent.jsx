// Pages/Frontend/layout/CookieConsent.jsx

// React
import React, { useEffect, useState } from "react";

// Icons
import { FaCookieBite } from "react-icons/fa";

const COOKIE_NAME = "cookie_consent";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_NAME);
    if (!consent) {
      setTimeout(() => setVisible(true), 800); // small delay for smoother UX
    }
  }, []);

  const handleChoice = (choice) => {
    localStorage.setItem(COOKIE_NAME, choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-fadeIn">
      <div className="card w-80 bg-base-100 shadow-2xl border border-base-300">
        <div className="card-body p-5">
          <div className="flex items-center gap-3 mb-2">
            <FaCookieBite className="text-warning text-xl" />
            <h3 className="font-semibold text-lg">Cookies</h3>
          </div>

          <p className="text-sm text-base-content/70">
            We use cookies to improve your experience and analyze traffic.
          </p>

          <div className="card-actions justify-end mt-4 gap-2">
            <button
              onClick={() => handleChoice("declined")}
              className="btn btn-ghost btn-sm"
            >
              Decline
            </button>
            <button
              onClick={() => handleChoice("accepted")}
              className="btn btn-primary btn-sm"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;

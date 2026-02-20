// Pages/auth/Unauthorized .jsx

// React
import React from "react";
import { Link, useNavigate } from "react-router";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import { FaLock, FaArrowLeft, FaHome } from "react-icons/fa";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-linear-to-br from-base-100 to-base-200 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card bg-base-100 shadow-2xl border border-error/20 w-full max-w-md"
      >
        <div className="card-body text-center p-8">

          {/* Icon with pulse effect */}
          <div className="relative inline-block mx-auto mb-6">
            <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center">
              <FaLock className="text-5xl text-error" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-error rounded-full flex items-center justify-center text-white text-xs animate-ping">
              !
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-error mb-2">403</h1>
          <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>

          {/* Message */}
          <p className="text-base opacity-80 mb-6">
            You don't have permission to access this page. This area is restricted to authorized personnel only.
          </p>

          {/* Divider */}
          <div className="divider text-xs opacity-50">SECURITY NOTICE</div>

          {/* Suggestions */}
          <div className="text-left text-sm bg-base-200 p-4 rounded-xl mb-6">
            <p className="font-semibold mb-2">Possible reasons:</p>
            <ul className="list-disc list-inside space-y-1 opacity-70">
              <li>Insufficient user role</li>
              <li>Missing or expired session</li>
              <li>Invalid authentication token</li>
              <li>IP address restriction</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/" className="flex-1">
              <button className="btn btn-outline btn-error w-full gap-2">
                <FaHome /> Home
              </button>
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="flex-1 btn btn-error w-full gap-2"
            >
              <FaArrowLeft /> Go Back
            </button>
          </div>

          {/* Help Link */}
          <p className="text-xs opacity-60 mt-4">
            Need help? <Link to="/contact" className="link link-error">Contact Support</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Unauthorized;
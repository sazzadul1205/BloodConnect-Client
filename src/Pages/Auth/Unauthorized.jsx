// Pages/auth/Unauthorized.jsx

// React
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FaLock,
  FaArrowLeft,
  FaHome,
  FaExclamationTriangle,
  FaShieldAlt,
  FaHeadset,
  FaUserLock,
  FaClock,
  FaGlobe
} from "react-icons/fa";

const Unauthorized = () => {
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  const pulseVariants = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-base-100 to-base-200 flex items-center justify-center p-2 sm:p-3 md:p-4 relative overflow-hidden">

      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute top-0 left-0 w-64 h-64 bg-error rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-error rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main Card */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[95%] xs:max-w-sm sm:max-w-md md:max-w-lg z-10"
      >
        <div className="card bg-base-100/90 backdrop-blur-md shadow-2xl border border-error/20">

          <div className="card-body p-4 xs:p-5 sm:p-6 md:p-7 lg:p-8">

            {/* Icon with pulse effect - Responsive */}
            <motion.div
              variants={itemVariants}
              className="relative inline-block mx-auto mb-4 xs:mb-5 sm:mb-6"
            >
              <motion.div
                variants={pulseVariants}
                initial="initial"
                animate="animate"
                className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-error/10 rounded-full flex items-center justify-center"
              >
                <FaLock className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl text-error" />
              </motion.div>

              {/* Alert Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="absolute -top-1 -right-1 w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 bg-error rounded-full flex items-center justify-center text-white text-[8px] xs:text-[10px] sm:text-xs animate-ping"
              >
                !
              </motion.div>
            </motion.div>

            {/* Title Section - Responsive */}
            <motion.div variants={itemVariants} className="text-center">
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold text-error mb-1 sm:mb-2">
                403
              </h1>
              <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-semibold mb-2 sm:mb-3 md:mb-4">
                Access Denied
              </h2>

              {/* Message */}
              <p className="text-xs xs:text-sm sm:text-base md:text-lg opacity-80 mb-4 sm:mb-5 md:mb-6 px-2">
                You don't have permission to access this page. This area is restricted to authorized personnel only.
              </p>
            </motion.div>

            {/* Security Notice Divider - Responsive */}
            <motion.div variants={itemVariants} className="divider text-[8px] xs:text-[10px] sm:text-xs opacity-50 my-2 sm:my-3">
              <FaShieldAlt className="mx-1 text-error" /> SECURITY NOTICE <FaShieldAlt className="mx-1 text-error" />
            </motion.div>

            {/* Suggestions Card - Responsive */}
            <motion.div
              variants={itemVariants}
              className="text-left bg-base-200 p-3 xs:p-3.5 sm:p-4 md:p-5 rounded-lg sm:rounded-xl mb-4 sm:mb-5 md:mb-6"
            >
              <p className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-xs sm:text-sm md:text-base">
                <FaExclamationTriangle className="text-warning" />
                Possible reasons:
              </p>
              <ul className="space-y-1.5 sm:space-y-2">
                {[
                  { icon: FaUserLock, text: "Insufficient user role" },
                  { icon: FaClock, text: "Missing or expired session" },
                  { icon: FaShieldAlt, text: "Invalid authentication token" },
                  { icon: FaGlobe, text: "IP address restriction" }
                ].map((reason, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-center gap-2 text-[10px] xs:text-xs sm:text-sm opacity-70"
                  >
                    <reason.icon className="text-error shrink-0 text-xs sm:text-sm" />
                    <span>{reason.text}</span>
                  </motion.li>
                ))}
              </ul>

              {/* Additional Info - Visible on larger screens */}
              {windowWidth >= 640 && (
                <div className="mt-3 pt-3 border-t border-base-300">
                  <p className="text-[10px] sm:text-xs opacity-60">
                    <strong>Error Code:</strong> AUTH_403_FORBIDDEN
                  </p>
                </div>
              )}
            </motion.div>

            {/* Action Buttons - Responsive */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col xs:flex-row gap-2 sm:gap-3"
            >
              <Link to="/" className="flex-1">
                <motion.button
                  whileHover={{ scale: windowWidth < 640 ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn btn-outline btn-error w-full gap-1 sm:gap-2 text-xs xs:text-sm sm:text-base"
                >
                  <FaHome className="text-xs sm:text-sm" />
                  <span>Home</span>
                </motion.button>
              </Link>

              <motion.button
                whileHover={{ scale: windowWidth < 640 ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(-1)}
                className="btn btn-outline bg-error btn-black w-full gap-1 sm:gap-2 text-xs xs:text-sm sm:text-base"
              >
                <FaArrowLeft className="text-xs sm:text-sm" />
                <span>Go Back</span>
              </motion.button>
            </motion.div>

            {/* Help Section - Responsive */}
            <motion.div
              variants={itemVariants}
              className="mt-4 sm:mt-5 md:mt-6 text-center"
            >
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <p className="text-[10px] xs:text-xs sm:text-sm opacity-60">
                  Need help?
                </p>
                <Link to="/contact" className="link link-error flex items-center gap-1 text-[10px] xs:text-xs sm:text-sm">
                  <FaHeadset className="text-xs" />
                  Contact Support
                </Link>
                <span className="text-[8px] xs:text-[10px] opacity-40 hidden xs:inline">|</span>
                <Link to="/faq" className="link link-info text-[10px] xs:text-xs sm:text-sm hidden xs:inline">
                  Visit FAQ
                </Link>
              </div>
            </motion.div>

            {/* Session Information - Mobile Only */}
            {windowWidth < 640 && (
              <motion.div
                variants={itemVariants}
                className="mt-3 pt-3 border-t border-base-300 text-center"
              >
                <p className="text-[8px] opacity-50">
                  Session ID: •••••••• | Error: AUTH_403
                </p>
              </motion.div>
            )}
          </div>

          {/* Footer Stats - Responsive */}
          <motion.div
            variants={itemVariants}
            className="bg-error/5 p-2 sm:p-3 md:p-4 border-t border-error/10"
          >
            <div className="flex justify-between text-[8px] xs:text-[10px] sm:text-xs">

              {/* Security Level */}
              <div className="flex items-center gap-0.5 sm:gap-1">
                <FaShieldAlt className="text-error text-xs sm:text-sm" />
                <span className="hidden xs:inline">Security Level 3</span>
              </div>

              {/* Auto Logout */}
              <div className="flex items-center gap-0.5 sm:gap-1">
                <FaClock className="text-error text-xs sm:text-sm" />
                <span className="hidden xs:inline">Session: 30min</span>
              </div>

              {/* Support */}
              <div className="flex items-center gap-0.5 sm:gap-1">
                <FaHeadset className="text-error text-xs sm:text-sm" />
                <span className="hidden xs:inline">24/7 Support</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Unauthorized;
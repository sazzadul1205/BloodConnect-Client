// Shared/DonorProfileRequired.jsx

// React
import React from "react";
import { Link } from "react-router";

// Icons
import { FaHeart, FaTint, FaArrowRight } from "react-icons/fa";

// Framer Motion
import { motion } from "framer-motion";

const MotionDiv = motion.div;

const DonorProfileRequired = ({
  title = "Create Donor Profile First",
  description = "You need a donor profile to access this page.",
  helpText = "A donor profile helps us match you with recipients and track your donations.",
  redirectPath = "/donor/profile",
  buttonText = "Create Donor Profile",
  showHelp = true,
  variant = "warning", // "warning" or "info"
}) => {

  // Variant configurations
  const variants = {
    warning: {
      bgColor: "bg-error/10",
      textColor: "text-error",
      borderColor: "border-error/20",
      buttonColor: "btn-error",
      icon: FaTint,
    },
    info: {
      bgColor: "bg-info/10",
      textColor: "text-info",
      borderColor: "border-info/20",
      buttonColor: "btn-info",
      icon: FaHeart,
    },
  };

  const currentVariant = variants[variant] || variants.warning;
  const Icon = currentVariant.icon;

  return (
    <div className="md:min-h-screen bg-base-200 flex items-center justify-center p-4 sm:p-6">
      <MotionDiv
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`card bg-base-100 shadow-xl w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg border ${currentVariant.borderColor} overflow-hidden`}
      >
        {/* Animated Background Pulse (Optional) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute -inset-1 ${currentVariant.bgColor} opacity-20 blur-xl rounded-full animate-pulse`}></div>
        </div>

        <div className="card-body items-center text-center p-5 sm:p-6 md:p-8 relative">

          {/* Icon with responsive sizing */}
          <div className="relative">
            <div className={`${currentVariant.bgColor} ${currentVariant.textColor} rounded-full w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center mb-2 sm:mb-4 shadow-lg`}>
              <Icon size={window.innerWidth < 640 ? 28 : window.innerWidth < 768 ? 32 : 34} />
            </div>

            {/* Small decorative blood drop */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-error rounded-full flex items-center justify-center animate-bounce">
              <FaHeart className="text-white text-[8px] sm:text-[10px]" />
            </div>
          </div>

          {/* Title - Responsive */}
          <h2 className={`card-title text-xl sm:text-2xl md:text-3xl ${currentVariant.textColor} font-bold`}>
            {title}
          </h2>

          {/* Description - Responsive */}
          <p className="text-base-content/70 text-xs sm:text-sm md:text-base max-w-xs sm:max-w-sm">
            {description}
          </p>

          {/* Help Text (Optional) */}
          {showHelp && (
            <div className="bg-base-200/50 p-3 sm:p-4 rounded-lg w-full my-2 sm:my-3">
              <p className="text-xs sm:text-sm text-base-content/60">
                <span className="font-semibold">💡 Quick tip:</span> {helpText}
              </p>
            </div>
          )}

          {/* Action Buttons - Responsive */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full mt-2 sm:mt-4">
            <Link
              to={redirectPath}
              className={`btn ${currentVariant.buttonColor} py-2 text-white gap-2 flex-1 hover:scale-105 transition-transform duration-200`}
            >
              <FaHeart className="text-xs sm:text-sm" />
              <span className="text-xs sm:text-sm">{buttonText}</span>
              <FaArrowRight className="text-xs sm:text-sm opacity-70" />
            </Link>

            <Link
              to="/"
              className="btn btn-outline py-2 gap-2 flex-1 hover:scale-105 transition-transform duration-200 text-xs sm:text-sm"
            >
              Go Home
            </Link>
          </div>

          {/* Additional Info */}
          <p className="text-xs text-base-content/40 mt-3 sm:mt-4">
            This helps us verify your donor status and ensure safe donations.
          </p>
        </div>
      </MotionDiv>
    </div>
  );
};


export default DonorProfileRequired;
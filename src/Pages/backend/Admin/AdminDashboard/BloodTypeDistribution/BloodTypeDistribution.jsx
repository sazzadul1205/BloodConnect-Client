// Pages/backend/Admin/Dashboard/BloodTypeDistribution/BloodTypeDistribution.jsx

// React
import React from "react";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import { FiDroplet } from "react-icons/fi";

// Shared
import BloodLoader from "../../../../../shared/BloodLoader";

// ==================== CONSTANTS ====================

/**
 * Blood type colors for visual representation
 * Each blood type gets a distinct color for easy identification
 */
const bloodTypeColors = {
  "A+": "bg-red-500",
  "A-": "bg-red-400",
  "B+": "bg-blue-500",
  "B-": "bg-blue-400",
  "AB+": "bg-purple-500",
  "AB-": "bg-purple-400",
  "O+": "bg-green-500",
  "O-": "bg-green-400",
};

/**
 * All possible blood types in order
 */
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ==================== ANIMATION VARIANTS ====================

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (custom) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: custom * 0.1,
      duration: 0.4,
      ease: "easeOut"
    }
  })
};

const barVariants = {
  hidden: { width: 0 },
  visible: (custom) => ({
    width: `${custom}%`,
    transition: {
      duration: 0.5,
      delay: 0.2 + custom * 0.01,
      ease: "easeOut"
    }
  })
};

// ==================== MAIN COMPONENT ====================

/**
 * Blood Type Distribution Component
 * Displays distribution of blood units across different blood types
 * 
 * @param {Array} data - Array of blood bank data containing inventory
 * @param {boolean} isLoading - Loading state indicator
 */
const BloodTypeDistribution = ({ data, isLoading }) => {

  // ==================== LOADING STATE ====================

  if (isLoading) {
    return (
      <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-3 sm:p-4 h-64 sm:h-80">
        <div className="flex items-center justify-center h-full">
          <BloodLoader />
        </div>
      </div>
    );
  }

  // ==================== DATA PROCESSING ====================

  /**
   * Calculate blood type distribution from inventory data
   * Aggregates units from all blood banks
   */
  const calculateDistribution = () => {
    const distribution = {};

    // Aggregate units by blood type
    data.forEach(bank => {
      bank.inventory?.forEach(item => {
        if (!distribution[item.bloodType]) {
          distribution[item.bloodType] = 0;
        }
        distribution[item.bloodType] += item.units || 0;
      });
    });

    // Format for display, ensuring all blood types are represented
    return BLOOD_TYPES.map(type => ({
      type,
      units: distribution[type] || 0
    }));
  };

  // Calculate distribution and statistics
  const distribution = calculateDistribution();
  const totalUnits = distribution.reduce((sum, item) => sum + item.units, 0);

  // Find most common and rarest blood types
  const mostCommonType = [...distribution].sort((a, b) => b.units - a.units)[0]?.type || "N/A";
  const rarestType = [...distribution].sort((a, b) => a.units - b.units)[0]?.type || "N/A";

  // ==================== RENDER ====================

  return (
    <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-3 sm:p-4">

      {/* ==================== HEADER ==================== */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-3 sm:mb-4">
        <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
          <FiDroplet className="text-error text-sm sm:text-base" />
          Blood Type Distribution
        </h3>
        <span className="badge badge-xs sm:badge-sm">
          Total: {totalUnits} units
        </span>
      </div>

      {/* ==================== DISTRIBUTION LIST ==================== */}
      <div className="space-y-2 sm:space-y-3">
        {distribution.map((item, index) => {
          // Calculate percentage for progress bar
          const percentage = totalUnits > 0 ? Math.round((item.units / totalUnits) * 100) : 0;

          return (
            <motion.div
              key={item.type}
              variants={itemVariants}
              custom={index}
              initial="hidden"
              animate="visible"
              className="space-y-1"
            >
              {/* Type Label and Units */}
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  {/* Color indicator dot */}
                  <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${bloodTypeColors[item.type]}`} />
                  <span className="text-xs sm:text-sm font-medium">{item.type}</span>
                </div>
                <span className="text-[10px] sm:text-xs">
                  {item.units} units ({percentage}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-base-200 rounded-full h-1.5 sm:h-2">
                <motion.div
                  variants={barVariants}
                  custom={percentage}
                  initial="hidden"
                  animate="visible"
                  className={`${bloodTypeColors[item.type]} h-1.5 sm:h-2 rounded-full`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ==================== SUMMARY STATISTICS ==================== */}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-base-300">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-center">

          {/* Most Common Blood Type */}
          <div className="p-2 sm:p-3 bg-base-200 rounded-lg">
            <p className="text-[8px] sm:text-xs text-base-content/70">Most Common</p>
            <p className="text-base sm:text-lg md:text-xl font-bold text-error">
              {mostCommonType}
            </p>
          </div>

          {/* Rarest Blood Type */}
          <div className="p-2 sm:p-3 bg-base-200 rounded-lg">
            <p className="text-[8px] sm:text-xs text-base-content/70">Rarest</p>
            <p className="text-base sm:text-lg md:text-xl font-bold text-warning">
              {rarestType}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodTypeDistribution;
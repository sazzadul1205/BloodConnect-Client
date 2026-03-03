// Pages/backend/Admin/Dashboard/ActivityChart/ActivityChart.jsx

// React
import React from "react";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import { FiTrendingUp } from "react-icons/fi";

// Shared
import BloodLoader from "../../../../../shared/BloodLoader";
import { formatAppDate } from "../../../../../utils/dateFormat";

// ==================== ANIMATION VARIANTS ====================

const barVariants = {
  hidden: { height: 0 },
  visible: (custom) => ({
    height: `${custom}%`,
    transition: {
      duration: 0.5,
      delay: custom * 0.02,
      ease: "easeOut"
    }
  })
};

// ==================== MAIN COMPONENT ====================

/**
 * Activity Chart Component
 * Displays daily activity trends with animated bar chart
 * 
 * @param {Array} data - Array of daily activity data with _id (date) and count
 * @param {boolean} isLoading - Loading state indicator
 */
const ActivityChart = ({ data, isLoading }) => {

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

  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : [];

  // Calculate statistics
  const totalActivities = safeData.reduce((sum, d) => sum + (d?.count || 0), 0);
  const maxCount = Math.max(...safeData.map((d) => d?.count || 0), 1);
  const averagePerDay = safeData.length > 0
    ? Math.round(totalActivities / safeData.length)
    : 0;

  // Find peak day
  const peakDayEntry = [...safeData].sort((a, b) => (b?.count || 0) - (a?.count || 0))[0];

  // ==================== RENDER ====================

  return (
    <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-3 sm:p-4">

      {/* ==================== HEADER ==================== */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-3 sm:mb-4">
        <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
          <FiTrendingUp className="text-error text-sm sm:text-base" />
          Daily Activity
        </h3>
        <span className="badge badge-xs sm:badge-sm">
          Avg: {averagePerDay}/day
        </span>
      </div>

      {/* ==================== BAR CHART ==================== */}
      <div className="relative h-48 sm:h-56 md:h-64">
        <div className="absolute inset-0 flex items-end">
          {safeData.map((item, index) => {
            // Calculate bar height as percentage of max
            const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

            return (
              <motion.div
                key={item._id || index}
                variants={barVariants}
                custom={heightPercent}
                initial="hidden"
                animate="visible"
                className="flex-1 mx-0.5 sm:mx-1"
              >
                <div className="relative group h-full">
                  {/* Bar */}
                  <div
                    className="absolute bottom-0 w-full bg-linear-to-t from-error to-error/50 rounded-t hover:from-error/80 transition-all cursor-pointer"
                    style={{ height: `${heightPercent}%` }}
                  >
                    {/* Tooltip - Hidden on mobile, visible on hover */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-base-300 text-[8px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                      {formatAppDate(item._id, "MMM d")}: {item.count} activities
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ==================== X-AXIS LABELS ==================== */}
      <div className="flex justify-between mt-2 sm:mt-3 text-[8px] sm:text-xs text-base-content/50 overflow-x-auto pb-1">
        {safeData.slice(0, 7).map((item, index) => (
          <span key={item._id || index} className="px-1">
            {formatAppDate(item._id, "EEE")}
          </span>
        ))}
        {safeData.length > 7 && (
          <span className="px-1">...</span>
        )}
      </div>

      {/* ==================== STATS FOOTER ==================== */}
      <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-base-300">

        {/* Peak Day Stat */}
        <div className="text-center">
          <p className="text-[8px] sm:text-xs text-base-content/70">Peak Day</p>
          <p className="text-xs sm:text-sm font-bold truncate">
            {peakDayEntry ? formatAppDate(peakDayEntry._id, "MMM d") : "N/A"}
          </p>
        </div>

        {/* Peak Count Stat */}
        <div className="text-center">
          <p className="text-[8px] sm:text-xs text-base-content/70">Peak Count</p>
          <p className="text-xs sm:text-sm font-bold text-error">
            {maxCount}
          </p>
        </div>

        {/* Total Activities Stat */}
        <div className="text-center">
          <p className="text-[8px] sm:text-xs text-base-content/70">Total</p>
          <p className="text-xs sm:text-sm font-bold">
            {totalActivities}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActivityChart;
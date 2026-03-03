// Pages/backend/Admin/Dashboard/RequestsByStatus/RequestsByStatus.jsx

// React
import React from "react";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FiPieChart,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
} from "react-icons/fi";

// Shared
import BloodLoader from "../../../../../shared/BloodLoader";

// ==================== CONSTANTS ====================

/**
 * Status configuration for different request states
 * Each status has an icon, display label, and styling classes
 */
const statusConfig = {
  pending: {
    icon: FiClock,
    label: "Pending",
    iconClass: "text-warning",
    barClass: "bg-warning",
    description: "Requests awaiting donor response",
  },
  matched: {
    icon: FiAlertCircle,
    label: "Matched",
    iconClass: "text-info",
    barClass: "bg-info",
    description: "Donors found, awaiting confirmation",
  },
  fulfilled: {
    icon: FiCheckCircle,
    label: "Fulfilled",
    iconClass: "text-success",
    barClass: "bg-success",
    description: "Successfully completed",
  },
  cancelled: {
    icon: FiXCircle,
    label: "Cancelled",
    iconClass: "text-error",
    barClass: "bg-error",
    description: "Cancelled by requester or system",
  },
  expired: {
    icon: FiXCircle,
    label: "Expired",
    iconClass: "text-base-content/70",
    barClass: "bg-base-content/40",
    description: "Request expired without fulfillment",
  },
};

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
 * Requests by Status Component
 * Displays distribution of blood requests across different statuses
 * 
 * @param {Array} data - Array of status objects with _id and count
 * @param {boolean} isLoading - Loading state indicator
 */
const RequestsByStatus = ({ data, isLoading }) => {

  // ==================== DATA PROCESSING ====================

  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : [];

  // Calculate total requests
  const total = safeData.reduce((sum, item) => sum + (item?.count || 0), 0);

  // ==================== LOADING STATE ====================

  if (isLoading) {
    return (
      <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-3 sm:p-4 h-48 sm:h-64">
        <div className="flex items-center justify-center h-full">
          <BloodLoader />
        </div>
      </div>
    );
  }

  // ==================== RENDER ====================

  return (
    <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-3 sm:p-4">

      {/* ==================== HEADER ==================== */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-3 sm:mb-4">
        <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
          <FiPieChart className="text-error text-sm sm:text-base" />
          Requests by Status
        </h3>
        <span className="badge badge-xs sm:badge-sm">
          Total: {total}
        </span>
      </div>

      {/* ==================== STATUS DISTRIBUTION ==================== */}
      <div className="space-y-3 sm:space-y-4">
        {safeData.map((item, index) => {
          // Get status configuration or use pending as fallback
          const config = statusConfig[item._id] || statusConfig.pending;
          const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
          const Icon = config.icon;

          return (
            <motion.div
              key={item._id}
              variants={itemVariants}
              custom={index}
              initial="hidden"
              animate="visible"
              className="space-y-1"
            >
              {/* Status Label and Count */}
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <Icon className={`${config.iconClass} text-xs sm:text-sm`} />
                  <span className="text-xs sm:text-sm font-medium">{config.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-medium">
                    {item.count}
                  </span>
                  <span className="text-[10px] sm:text-xs text-base-content/50">
                    ({percentage}%)
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-base-200 rounded-full h-1.5 sm:h-2">
                <motion.div
                  variants={barVariants}
                  custom={percentage}
                  initial="hidden"
                  animate="visible"
                  className={`${config.barClass} h-1.5 sm:h-2 rounded-full`}
                />
              </div>

              {/* Description - Hidden on mobile, visible on hover/tooltip could be added */}
              <p className="text-[8px] sm:text-xs text-base-content/50 hidden sm:block">
                {config.description}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* ==================== QUICK STATS ==================== */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-base-300">

        {/* Completion Rate */}
        <div className="text-center p-2 sm:p-3 bg-base-200 rounded-lg">
          <p className="text-[8px] sm:text-xs text-base-content/70">Completion Rate</p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-success">
            {total > 0
              ? Math.round((safeData.find(d => d._id === "fulfilled")?.count || 0) / total * 100)
              : 0}%
          </p>
        </div>

        {/* Pending Count */}
        <div className="text-center p-2 sm:p-3 bg-base-200 rounded-lg">
          <p className="text-[8px] sm:text-xs text-base-content/70">Pending</p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-warning">
            {safeData.find(d => d._id === "pending")?.count || 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RequestsByStatus;
// Pages/backend/Admin/Dashboard/StatCard/StatCard.jsx

// React
import React from "react";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";

// ==================== CONSTANTS ====================

/**
 * Color configuration for different theme variants
 * Maps color names to Tailwind text color classes
 */
const colorClasses = {
  primary: "text-primary",
  secondary: "text-secondary",
  success: "text-success",
  error: "text-error",
  warning: "text-warning",
  info: "text-info",
  accent: "text-accent",
};

/**
 * Background color configuration for icon containers
 * Maps color names to Tailwind background color classes
 */
const bgColorClasses = {
  primary: "bg-primary/10",
  secondary: "bg-secondary/10",
  success: "bg-success/10",
  error: "bg-error/10",
  warning: "bg-warning/10",
  info: "bg-info/10",
  accent: "bg-accent/10",
};

// ==================== ANIMATION VARIANTS ====================

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: custom,
      ease: "easeOut"
    }
  }),
  hover: {
    scale: 1.02,
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.02)",
    transition: {
      duration: 0.2
    }
  }
};

// ==================== MAIN COMPONENT ====================

/**
 * Stat Card Component
 * Displays a single statistic with icon, value, and optional trend indicator
 * 
 * @param {string} title - Card title
 * @param {number} value - Main value to display
 * @param {React.ComponentType} icon - Icon component
 * @param {string} color - Color theme (primary, secondary, success, error, warning, info, accent)
 * @param {number} trend - Percentage trend value (positive for up, negative for down)
 * @param {string} trendLabel - Label for the trend (e.g., "vs last month")
 * @param {string} subValue - Optional sub-value to display below main value
 * @param {string} unit - Optional unit to display after value (e.g., "units", "kg")
 * @param {number} delay - Animation delay in seconds
 */
const StatCard = ({
  title,
  value,
  // eslint-disable-next-line no-unused-vars
  icon: Icon,
  color = "primary",
  trend,
  trendLabel,
  subValue,
  unit,
  delay = 0
}) => {

  // ==================== COMPUTED VALUES ====================

  // Determine trend color based on value
  const trendColor = trend > 0
    ? "text-success"
    : trend < 0
      ? "text-error"
      : "text-base-content/50";

  // Format value with commas for thousands
  const formattedValue = typeof value === 'number'
    ? value.toLocaleString()
    : value;

  // ==================== RENDER ====================

  return (
    <motion.div
      variants={cardVariants}
      custom={delay}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4 border border-base-300 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">

        {/* ==================== STAT VALUE SECTION ==================== */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="stat-title text-[10px] sm:text-xs text-base-content/70 truncate">
            {title}
          </p>

          {/* Main Value */}
          <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold mt-1 truncate">
            {formattedValue}
            {unit && (
              <span className="text-[10px] sm:text-xs font-normal text-base-content/50 ml-1">
                {unit}
              </span>
            )}
          </p>

          {/* Sub Value */}
          {subValue && (
            <p className="text-[8px] sm:text-xs text-base-content/50 mt-1 truncate">
              {subValue}
            </p>
          )}
        </div>

        {/* ==================== ICON SECTION ==================== */}
        <div className={`p-2 sm:p-3 rounded-full ${bgColorClasses[color]} shrink-0`}>
          <Icon className={`text-base sm:text-lg md:text-xl ${colorClasses[color]}`} />
        </div>
      </div>

      {/* ==================== TREND INDICATOR ==================== */}
      {trend !== undefined && (
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2 sm:mt-3 text-[8px] sm:text-xs">

          {/* Trend Icon and Percentage */}
          <div className={`flex items-center gap-0.5 sm:gap-1 ${trendColor}`}>
            {trend > 0 ? (
              <FiTrendingUp className="text-xs sm:text-sm" />
            ) : trend < 0 ? (
              <FiTrendingDown className="text-xs sm:text-sm" />
            ) : null}
            <span className="font-medium">{Math.abs(trend)}%</span>
          </div>

          {/* Trend Label */}
          {trendLabel && (
            <span className="text-base-content/50 truncate">
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
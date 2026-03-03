// Pages/backend/Admin/Dashboard/ActionStatistics/ActionStatistics.jsx

// React
import React from "react";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FiBarChart2,
  FiActivity,
  FiFolder,
  FiClock,
} from "react-icons/fi";

// Shared
import BloodLoader from "../../../../../shared/BloodLoader";

// ==================== ANIMATION VARIANTS ====================

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (custom) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: custom * 0.1,
      duration: 0.3
    }
  })
};

const barVariants = {
  hidden: { height: 0 },
  visible: (custom) => ({
    height: custom,
    transition: {
      delay: custom * 0.02,
      duration: 0.4,
      ease: "easeOut"
    }
  })
};

// ==================== MAIN COMPONENT ====================

/**
 * Action Statistics Component
 * Displays statistics about user actions, resources, and activity patterns
 * 
 * @param {Object} data - Statistics data object containing byAction, byResource, byHour, and totals
 * @param {boolean} isLoading - Loading state indicator
 */
const ActionStatistics = ({ data, isLoading }) => {

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

  // ==================== DATA EXTRACTION ====================

  const byAction = data?.byAction || [];
  const byResource = data?.byResource || [];
  const byHour = data?.byHour || [];
  const totals = data?.totals?.[0] || {};

  // Calculate maximum values for scaling
  const topActionCount = byAction[0]?.count || 1;
  const topResourceCount = byResource[0]?.count || 1;
  const peakHourCount = Math.max(...byHour.map((h) => h?.count || 0), 1);

  // ==================== RENDER ====================

  return (
    <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 overflow-hidden">

      {/* ==================== HEADER ==================== */}
      <div className="p-3 sm:p-4 border-b border-base-300">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
            <FiBarChart2 className="text-error text-sm sm:text-base" />
            Action Statistics ({data?.period || "30 days"})
          </h3>
        </div>
      </div>

      {/* ==================== SUMMARY STATS ==================== */}
      {/* Responsive grid: 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-4 bg-base-200/50 border-b border-base-300">

        {/* Total Actions Stat */}
        <div className="text-center">
          <p className="text-base sm:text-lg md:text-2xl font-bold text-primary">
            {totals.totalLogs || 0}
          </p>
          <p className="text-[10px] sm:text-xs text-base-content/70 truncate">Total Actions</p>
        </div>

        {/* Active Users Stat */}
        <div className="text-center">
          <p className="text-base sm:text-lg md:text-2xl font-bold text-success">
            {totals.uniqueUsers || 0}
          </p>
          <p className="text-[10px] sm:text-xs text-base-content/70 truncate">Active Users</p>
        </div>

        {/* Action Types Stat */}
        <div className="text-center">
          <p className="text-base sm:text-lg md:text-2xl font-bold text-info">
            {totals.uniqueActions || 0}
          </p>
          <p className="text-[10px] sm:text-xs text-base-content/70 truncate">Action Types</p>
        </div>

        {/* Resources Stat */}
        <div className="text-center">
          <p className="text-base sm:text-lg md:text-2xl font-bold text-warning">
            {totals.uniqueResources || 0}
          </p>
          <p className="text-[10px] sm:text-xs text-base-content/70 truncate">Resources</p>
        </div>
      </div>

      {/* ==================== CHARTS SECTION ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 sm:p-4">

        {/* ==================== TOP ACTIONS ==================== */}
        <div>
          <h4 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
            <FiActivity className="text-info text-xs sm:text-sm" />
            Top Actions
          </h4>
          <div className="space-y-2">
            {byAction.slice(0, 5).map((action, index) => (
              <motion.div
                key={action._id}
                variants={itemVariants}
                custom={index}
                initial="hidden"
                animate="visible"
                className="flex flex-col xs:flex-row xs:items-center justify-between gap-1"
              >
                {/* Action Name */}
                <span className="text-[10px] sm:text-xs truncate max-w-24 xs:max-w-32">
                  {action._id}
                </span>

                {/* Progress Bar and Count */}
                <div className="flex items-center gap-2 w-full xs:w-auto">
                  {/* Progress Bar */}
                  <div className="flex-1 xs:w-24 bg-base-200 rounded-full h-1.5 sm:h-2">
                    <div
                      className="bg-info h-1.5 sm:h-2 rounded-full"
                      style={{
                        width: `${((action.count || 0) / topActionCount) * 100}%`
                      }}
                    />
                  </div>
                  {/* Count */}
                  <span className="text-[10px] sm:text-xs font-medium w-8 sm:w-12 text-right">
                    {action.count}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ==================== TOP RESOURCES ==================== */}
        <div>
          <h4 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
            <FiFolder className="text-warning text-xs sm:text-sm" />
            Top Resources
          </h4>
          <div className="space-y-2">
            {byResource.slice(0, 5).map((resource, index) => (
              <motion.div
                key={resource._id}
                variants={itemVariants}
                custom={index}
                initial="hidden"
                animate="visible"
                className="flex flex-col xs:flex-row xs:items-center justify-between gap-1"
              >
                {/* Resource Name */}
                <span className="text-[10px] sm:text-xs truncate max-w-24 xs:max-w-32">
                  {resource._id}
                </span>

                {/* Progress Bar and Count */}
                <div className="flex items-center gap-2 w-full xs:w-auto">
                  {/* Progress Bar */}
                  <div className="flex-1 xs:w-24 bg-base-200 rounded-full h-1.5 sm:h-2">
                    <div
                      className="bg-warning h-1.5 sm:h-2 rounded-full"
                      style={{
                        width: `${((resource.count || 0) / topResourceCount) * 100}%`
                      }}
                    />
                  </div>
                  {/* Count */}
                  <span className="text-[10px] sm:text-xs font-medium w-8 sm:w-12 text-right">
                    {resource.count}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ==================== ACTIVITY BY HOUR ==================== */}
        <div className="md:col-span-2">
          <h4 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
            <FiClock className="text-success text-xs sm:text-sm" />
            Activity by Hour
          </h4>

          {/* Bar Chart Container */}
          <div className="flex items-end gap-1 h-24 sm:h-32 overflow-x-auto pb-6 sm:pb-8">
            {byHour.map((hour, index) => {
              const height = ((hour.count || 0) / peakHourCount) * 100;
              return (
                <motion.div
                  key={hour._id}
                  variants={barVariants}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  className="flex-1 min-w-6 sm:min-w-8 group relative"
                >
                  {/* Bar */}
                  <div
                    className="bg-success/50 hover:bg-success rounded-t transition-colors cursor-pointer"
                    style={{ height: `${height}%` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                      <div className="bg-base-300 text-base-content text-[8px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded shadow-lg whitespace-nowrap">
                        {hour.count} actions
                      </div>
                    </div>
                  </div>

                  {/* Hour Label */}
                  <div className="absolute -bottom-5 sm:-bottom-6 left-1/2 transform -translate-x-1/2 text-[8px] sm:text-xs text-base-content/70 whitespace-nowrap">
                    {hour._id}:00
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Chart Legend */}
          <div className="mt-4 sm:mt-6 text-center text-[8px] sm:text-xs text-base-content/50">
            Peak hour: {byHour.find(h => h.count === peakHourCount)?._id}:00 ({peakHourCount} actions)
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionStatistics;
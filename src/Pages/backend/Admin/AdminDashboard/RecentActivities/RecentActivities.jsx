// Pages/backend/Admin/Dashboard/RecentActivities/RecentActivities.jsx

// React
import React from "react";
import { formatDistanceToNow } from "date-fns";

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Icons
import {
  FiActivity,
  FiUser,
  FiDroplet,
  FiHome,
  FiClock,
} from "react-icons/fi";

// Shared
import BloodLoader from "../../../../../shared/BloodLoader";

// ==================== HELPER FUNCTIONS ====================

/**
 * Get appropriate icon based on action type
 * @param {string} action - Action name (e.g., "CREATE_USER", "UPDATE_REQUEST")
 * @returns {JSX.Element} Icon component with appropriate color
 */
const getActivityIcon = (action) => {
  const normalizedAction = String(action || "").toUpperCase();

  if (normalizedAction.includes("CREATE"))
    return <FiDroplet className="text-success text-sm sm:text-base" />;
  if (normalizedAction.includes("UPDATE"))
    return <FiActivity className="text-info text-sm sm:text-base" />;
  if (normalizedAction.includes("DELETE"))
    return <FiHome className="text-error text-sm sm:text-base" />;
  if (normalizedAction.includes("LOGIN"))
    return <FiUser className="text-primary text-sm sm:text-base" />;

  // Default icon for other actions
  return <FiClock className="text-warning text-sm sm:text-base" />;
};

/**
 * Get background color class based on action type
 * @param {string} action - Action name
 * @returns {string} CSS class for background and border
 */
const getActivityColor = (action) => {
  const normalizedAction = String(action || "").toUpperCase();

  if (normalizedAction.includes("CREATE"))
    return "bg-success/10 border-success/20";
  if (normalizedAction.includes("UPDATE"))
    return "bg-info/10 border-info/20";
  if (normalizedAction.includes("DELETE"))
    return "bg-error/10 border-error/20";
  if (normalizedAction.includes("LOGIN"))
    return "bg-primary/10 border-primary/20";

  // Default color for other actions
  return "bg-warning/10 border-warning/20";
};

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 * @param {string|Object} timestamp - ISO date string or MongoDB date object
 * @returns {string} Formatted relative time
 */
const formatTime = (timestamp) => {
  if (!timestamp) return "N/A";

  try {
    const date = new Date(timestamp?.$date || timestamp);
    if (Number.isNaN(date.getTime())) return "N/A";

    const relative = formatDistanceToNow(date, { addSuffix: true });
    return relative === "less than a minute ago" ? "Just now" : relative;
  } catch {
    return "N/A";
  }
};

// ==================== ANIMATION VARIANTS ====================

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (custom) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: custom * 0.05,
      duration: 0.3,
      ease: "easeOut"
    }
  }),
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2
    }
  }
};

// ==================== MAIN COMPONENT ====================

/**
 * Recent Activities Component
 * Displays a list of recent system activities with icons and timestamps
 * 
 * @param {Array} data - Array of activity objects
 * @param {boolean} isLoading - Loading state indicator
 */
const RecentActivities = ({ data, isLoading }) => {

  // ==================== DATA PROCESSING ====================

  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : [];

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

  // ==================== RENDER ====================

  return (
    <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 overflow-hidden">

      {/* ==================== HEADER ==================== */}
      <div className="p-3 sm:p-4 border-b border-base-300">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
          <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
            <FiActivity className="text-error text-sm sm:text-base" />
            Recent Activities
          </h3>
          <span className="badge badge-xs sm:badge-sm">
            {safeData.length} activities
          </span>
        </div>
      </div>

      {/* ==================== ACTIVITY LIST ==================== */}
      <div className="divide-y divide-base-300 max-h-80 sm:max-h-96 overflow-y-auto">
        <AnimatePresence>
          {safeData.length > 0 ? (
            safeData.map((activity, index) => (
              <motion.div
                key={activity._id || index}
                variants={itemVariants}
                custom={index}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`
                  p-3 sm:p-4 hover:bg-base-200/50 transition-colors
                  border-l-2 ${getActivityColor(activity.action)}
                `}
              >
                <div className="flex items-start gap-2 sm:gap-3">

                  {/* ==================== ACTIVITY ICON ==================== */}
                  <div className="mt-0.5 sm:mt-1 shrink-0">
                    {getActivityIcon(activity.action)}
                  </div>

                  {/* ==================== ACTIVITY CONTENT ==================== */}
                  <div className="flex-1 min-w-0">

                    {/* User and Action */}
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <span className="font-medium text-xs sm:text-sm">
                        {activity.user?.name || "System"}
                      </span>
                      <span className="text-[8px] sm:text-xs text-base-content/50">|</span>
                      <span className="text-[8px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full bg-base-300">
                        {activity.action}
                      </span>
                    </div>

                    {/* Resource Info */}
                    <p className="text-[10px] sm:text-xs text-base-content/70 mt-1 line-clamp-1 wrap-break-word">
                      {activity.resource}
                      {activity.resourceId && (
                        <span className="text-[8px] sm:text-xs opacity-60 ml-1">
                          | ID: {String(activity.resourceId).slice(-6)}
                        </span>
                      )}
                    </p>

                    {/* Changes Summary */}
                    {activity.changes && (
                      <p className="text-[8px] sm:text-xs text-info mt-1 line-clamp-1 wrap-break-word">
                        <span className="font-medium">Changed:</span> {Object.keys(activity.changes).join(", ")}
                      </p>
                    )}

                    {/* Timestamp and IP */}
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1.5 sm:mt-2 text-[8px] sm:text-xs text-base-content/50">
                      <span>{formatTime(activity.timestamp)}</span>
                      {activity.ipAddress && (
                        <>
                          <span className="hidden xs:inline">|</span>
                          <span className="truncate max-w-24 sm:max-w-32">
                            IP: {activity.ipAddress}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            // ==================== EMPTY STATE ====================
            <motion.div
              className="p-6 sm:p-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <FiActivity className="text-2xl sm:text-3xl md:text-4xl text-base-content/30 mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-base-content/50">No recent activities</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ==================== FOOTER ==================== */}
      <div className="p-2 sm:p-3 border-t border-base-300 bg-base-200/50">
        <button className="btn btn-ghost btn-xs sm:btn-sm w-full">
          <span className="text-[10px] sm:text-xs">View All Activities</span>
        </button>
      </div>
    </div>
  );
};

export default RecentActivities;
// Pages/backend/Admin/Dashboard/RecentActivities/RecentActivities.jsx

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

const RecentActivities = ({ data, isLoading }) => {
  const safeData = Array.isArray(data) ? data : [];

  // Activity Icon
  const getActivityIcon = (action) => {
    const normalizedAction = String(action || "").toUpperCase();
    if (normalizedAction.includes("CREATE"))
      return <FiDroplet className="text-success" />;
    if (normalizedAction.includes("UPDATE"))
      return <FiActivity className="text-info" />;
    if (normalizedAction.includes("DELETE"))
      return <FiHome className="text-error" />;
    if (normalizedAction.includes("LOGIN"))
      return <FiUser className="text-primary" />;
    return <FiClock className="text-warning" />;
  };

  // Activity Color
  const getActivityColor = (action) => {
    const normalizedAction = String(action || "").toUpperCase();
    if (normalizedAction.includes("CREATE")) return "bg-success/10 border-success/20";
    if (normalizedAction.includes("UPDATE")) return "bg-info/10 border-info/20";
    if (normalizedAction.includes("DELETE")) return "bg-error/10 border-error/20";
    if (normalizedAction.includes("LOGIN")) return "bg-primary/10 border-primary/20";
    return "bg-warning/10 border-warning/20";
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp?.$date || timestamp);
    if (Number.isNaN(date.getTime())) return "N/A";

    const relative = formatDistanceToNow(date, { addSuffix: true });
    return relative === "less than a minute ago" ? "Just now" : relative;
  };

  // Render component
  if (isLoading) {
    return (
      <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 h-80">
        <div className="flex items-center justify-center h-full">
          <BloodLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-base-100 rounded-lg shadow-lg border border-base-300">
      {/* Header */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <FiActivity className="text-error" />
            Recent Activities
          </h3>
          <span className="badge badge-sm">{safeData.length} activities</span>
        </div>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-base-300 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {safeData.length > 0 ? (
            safeData.map((activity, index) => (
              <motion.div
                key={activity._id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`p-3 hover:bg-base-200/50 transition-colors ${getActivityColor(activity.action)}`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="mt-1">{getActivityIcon(activity.action)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {activity.user?.name || "System"}
                      </span>
                      <span className="text-xs text-base-content/50">|</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-base-300">
                        {activity.action}
                      </span>
                    </div>

                    <p className="text-sm text-base-content/70 mt-1 line-clamp-1">
                      {activity.resource}
                      {activity.resourceId &&
                        ` | ID: ${String(activity.resourceId).slice(-6)}`}
                    </p>

                    {activity.changes && (
                      <p className="text-xs text-info mt-1 line-clamp-1">
                        Changed: {Object.keys(activity.changes).join(", ")}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-xs text-base-content/50">
                      <span>{formatTime(activity.timestamp)}</span>
                      {activity.ipAddress && (
                        <>
                          <span>|</span>
                          <span>IP: {activity.ipAddress}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-8 text-center">
              <FiActivity className="text-4xl text-base-content/30 mx-auto mb-2" />
              <p className="text-base-content/50">No recent activities</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-base-300 bg-base-200/50">
        <button className="btn btn-ghost btn-xs w-full">
          View All Activities
        </button>
      </div>
    </div>
  );
};

export default RecentActivities;

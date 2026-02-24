// Pages/backend/Admin/Dashboard/RequestsByStatus/RequestsByStatus.jsx

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

const RequestsByStatus = ({ data, isLoading }) => {
  const safeData = Array.isArray(data) ? data : [];

  // Status Config
  const statusConfig = {
    pending: {
      icon: FiClock,
      label: "Pending",
      iconClass: "text-warning",
      barClass: "bg-warning",
    },
    matched: {
      icon: FiAlertCircle,
      label: "Matched",
      iconClass: "text-info",
      barClass: "bg-info",
    },
    fulfilled: {
      icon: FiCheckCircle,
      label: "Fulfilled",
      iconClass: "text-success",
      barClass: "bg-success",
    },
    cancelled: {
      icon: FiXCircle,
      label: "Cancelled",
      iconClass: "text-error",
      barClass: "bg-error",
    },
    expired: {
      icon: FiXCircle,
      label: "Expired",
      iconClass: "text-base-content/70",
      barClass: "bg-base-content/40",
    },
  };

  // Total
  const total = safeData.reduce((sum, item) => sum + (item?.count || 0), 0);

  // Loading State
  if (isLoading) {
    return (
      <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 h-64">
        <div className="flex items-center justify-center h-full">
          <BloodLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <FiPieChart className="text-error" />
          Requests by Status
        </h3>
        <span className="badge badge-sm">Total: {total}</span>
      </div>

      {/* Status Distribution */}
      <div className="space-y-4">
        {safeData.map((item, index) => {
          const config = statusConfig[item._id] || statusConfig.pending;
          const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
          const Icon = config.icon;

          return (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Icon className={config.iconClass} size={14} />
                  <span className="text-sm">{config.label}</span>
                </div>
                <span className="text-sm font-medium">
                  {item.count} ({percentage}%)
                </span>
              </div>
              <div className="w-full bg-base-200 rounded-full h-2">
                <div
                  className={`${config.barClass} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-base-300">
        <div className="text-center p-2 bg-base-200 rounded-lg">
          <p className="text-xs text-base-content/70">Completion Rate</p>
          <p className="text-lg font-bold text-success">
            {total > 0
              ? Math.round((safeData.find(d => d._id === "fulfilled")?.count || 0) / total * 100)
              : 0}%
          </p>
        </div>
        <div className="text-center p-2 bg-base-200 rounded-lg">
          <p className="text-xs text-base-content/70">Pending</p>
          <p className="text-lg font-bold text-warning">
            {safeData.find(d => d._id === "pending")?.count || 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RequestsByStatus;

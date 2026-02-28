// Pages/backend/Admin/Dashboard/ActivityChart/ActivityChart.jsx

import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import { FiTrendingUp } from "react-icons/fi";

// Shared
import BloodLoader from "../../../../../shared/BloodLoader";
import { formatAppDate } from "../../../../../utils/dateFormat";

const ActivityChart = ({ data, isLoading }) => {

  // Loading State
  if (isLoading) {
    return (
      <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 h-80">
        <div className="flex items-center justify-center h-full">
          <BloodLoader />
        </div>
      </div>
    );
  }

  const safeData = Array.isArray(data) ? data : [];
  const totalActivities = safeData.reduce((sum, d) => sum + (d?.count || 0), 0);
  const maxCount = Math.max(...safeData.map((d) => d?.count || 0), 1);
  const averagePerDay = safeData.length > 0
    ? Math.round(totalActivities / safeData.length)
    : 0;
  const peakDayEntry = [...safeData].sort((a, b) => (b?.count || 0) - (a?.count || 0))[0];

  return (
    <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <FiTrendingUp className="text-error" />
          Daily Activity
        </h3>
        <span className="badge badge-sm">
          Avg: {averagePerDay}/day
        </span>
      </div>

      {/* Chart */}
      <div className="relative h-64">
        <div className="absolute inset-0 flex items-end">
          {safeData.map((item, index) => {
            const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

            return (
              <motion.div
                key={item._id || index}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5, delay: index * 0.02 }}
                className="flex-1 mx-0.5"
              >
                <div className="relative group h-full">
                  <div
                    className="absolute bottom-0 w-full bg-linear-to-t from-error to-error/50 rounded-t hover:from-error/80 transition-all"
                    style={{ height: `${height}%` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-base-300 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item._id || "N/A"}: {item.count} activities
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* X-Axis Labels */}
      <div className="flex justify-between mt-2 text-xs text-base-content/50">
        {safeData.slice(0, 7).map((item, index) => (
          <span key={item._id || index}>
            {formatAppDate(item._id, "EEE")}
          </span>
        ))}
        {safeData.length > 7 && <span>...</span>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-base-300">
        <div className="text-center">
          <p className="text-xs text-base-content/70">Peak Day</p>
          <p className="text-sm font-bold">
            {peakDayEntry?._id || "N/A"}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-base-content/70">Peak Count</p>
          <p className="text-sm font-bold text-error">
            {maxCount}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-base-content/70">Total</p>
          <p className="text-sm font-bold">
            {totalActivities}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActivityChart;

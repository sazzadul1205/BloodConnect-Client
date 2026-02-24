// Pages/backend/Admin/Dashboard/ActionStatistics/ActionStatistics.jsx

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

const ActionStatistics = ({ data, isLoading }) => {

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 h-64">
        <div className="flex items-center justify-center h-full">
          <BloodLoader />
        </div>
      </div>
    );
  }

  // Data structures
  const byAction = data?.byAction || [];
  const byResource = data?.byResource || [];
  const byHour = data?.byHour || [];
  const totals = data?.totals?.[0] || {};
  const topActionCount = byAction[0]?.count || 1;
  const topResourceCount = byResource[0]?.count || 1;
  const peakHourCount = Math.max(...byHour.map((h) => h?.count || 0), 1);

  return (
    <div className="bg-base-100 rounded-lg shadow-lg border border-base-300">
      {/* Header */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <FiBarChart2 className="text-error" />
            Action Statistics ({data?.period || "30 days"})
          </h3>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-base-200/50 border-b border-base-300">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{totals.totalLogs || 0}</p>
          <p className="text-xs text-base-content/70">Total Actions</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-success">{totals.uniqueUsers || 0}</p>
          <p className="text-xs text-base-content/70">Active Users</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-info">{totals.uniqueActions || 0}</p>
          <p className="text-xs text-base-content/70">Action Types</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-warning">{totals.uniqueResources || 0}</p>
          <p className="text-xs text-base-content/70">Resources</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Top Actions */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FiActivity className="text-info" />
            Top Actions
          </h4>
          <div className="space-y-2">
            {byAction.slice(0, 5).map((action, index) => (
              <motion.div
                key={action._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between"
              >
                <span className="text-sm">{action._id}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-base-200 rounded-full h-2">
                    <div
                      className="bg-info h-2 rounded-full"
                      style={{
                        width: `${((action.count || 0) / topActionCount) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {action.count}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Top Resources */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FiFolder className="text-warning" />
            Top Resources
          </h4>
          <div className="space-y-2">
            {byResource.slice(0, 5).map((resource, index) => (
              <motion.div
                key={resource._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between"
              >
                <span className="text-sm">{resource._id}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-base-200 rounded-full h-2">
                    <div
                      className="bg-warning h-2 rounded-full"
                      style={{
                        width: `${((resource.count || 0) / topResourceCount) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {resource.count}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Activity by Hour */}
        <div className="md:col-span-2">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FiClock className="text-success" />
            Activity by Hour
          </h4>
          <div className="flex items-end gap-1 h-32">
            {byHour.map((hour, index) => (
              <motion.div
                key={hour._id}
                initial={{ height: 0 }}
                animate={{ height: `${((hour.count || 0) / peakHourCount) * 100}%` }}
                transition={{ delay: index * 0.02 }}
                className="flex-1 bg-success/50 hover:bg-success rounded-t min-w-2"
                style={{ height: `${((hour.count || 0) / peakHourCount) * 100}%` }}
              >
                <div className="text-[10px] text-center mt-1 -rotate-45 origin-left">
                  {hour._id}:00
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionStatistics;

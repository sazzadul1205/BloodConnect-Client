// Pages/backend/Admin/Dashboard/BloodTypeDistribution/BloodTypeDistribution.jsx

import React from "react";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import { FiDroplet } from "react-icons/fi";

// Shared
import BloodLoader from "../../../../../shared/BloodLoader";

const BloodTypeDistribution = ({ data, isLoading }) => {
  // Calculate blood type distribution from inventory
  const calculateDistribution = () => {
    const distribution = {};
    const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    data.forEach(bank => {
      bank.inventory?.forEach(item => {
        if (!distribution[item.bloodType]) {
          distribution[item.bloodType] = 0;
        }
        distribution[item.bloodType] += item.units || 0;
      });
    });

    return bloodTypes.map(type => ({
      type,
      units: distribution[type] || 0
    }));
  };

  // Calculate distribution
  const distribution = calculateDistribution();
  const totalUnits = distribution.reduce((sum, item) => sum + item.units, 0);
  const mostCommonType = [...distribution].sort((a, b) => b.units - a.units)[0]?.type || "N/A";
  const rarestType = [...distribution].sort((a, b) => a.units - b.units)[0]?.type || "N/A";

  // Colors
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

  return (
    <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <FiDroplet className="text-error" />
          Blood Type Distribution
        </h3>
        <span className="badge badge-sm">Total: {totalUnits} units</span>
      </div>

      {/* Distribution List */}
      <div className="space-y-3">
        {distribution.map((item, index) => {
          const percentage = totalUnits > 0 ? Math.round((item.units / totalUnits) * 100) : 0;

          return (
            <motion.div
              key={item.type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${bloodTypeColors[item.type]}`} />
                  <span className="text-sm font-medium">{item.type}</span>
                </div>
                <span className="text-sm">
                  {item.units} units ({percentage}%)
                </span>
              </div>
              <div className="w-full bg-base-200 rounded-full h-2">
                <div
                  className={`${bloodTypeColors[item.type]} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-base-300">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 bg-base-200 rounded-lg">
            <p className="text-xs text-base-content/70">Most Common</p>
            <p className="text-lg font-bold text-error">
              {mostCommonType}
            </p>
          </div>
          <div className="p-2 bg-base-200 rounded-lg">
            <p className="text-xs text-base-content/70">Rarest</p>
            <p className="text-lg font-bold text-warning">
              {rarestType}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodTypeDistribution;

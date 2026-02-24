// Pages/backend/Admin/Dashboard/StatCard/StatCard.jsx

import React from "react";


// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";

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
  const colorClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    success: "text-success",
    error: "text-error",
    warning: "text-warning",
    info: "text-info",
    accent: "text-accent",
  };

  const bgColorClasses = {
    primary: "bg-primary/10",
    secondary: "bg-secondary/10",
    success: "bg-success/10",
    error: "bg-error/10",
    warning: "bg-warning/10",
    info: "bg-info/10",
    accent: "bg-accent/10",
  };

  const trendColor = trend > 0 ? "text-success" : trend < 0 ? "text-error" : "text-base-content/50";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="stat bg-base-100 rounded-lg shadow-lg p-4 border border-base-300"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-title text-sm text-base-content/70">{title}</p>
          <p className="stat-value text-2xl font-bold mt-1">
            {value.toLocaleString()}
            {unit && <span className="text-sm font-normal text-base-content/50 ml-1">{unit}</span>}
          </p>
          {subValue && (
            <p className="text-xs text-base-content/50 mt-1">{subValue}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${bgColorClasses[color]}`}>
          <Icon className={`text-xl ${colorClasses[color]}`} />
        </div>
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-2 mt-3 text-xs">
          <div className={`flex items-center gap-1 ${trendColor}`}>
            {trend > 0 ? <FiTrendingUp /> : <FiTrendingDown />}
            <span>{Math.abs(trend)}%</span>
          </div>
          <span className="text-base-content/50">{trendLabel}</span>
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
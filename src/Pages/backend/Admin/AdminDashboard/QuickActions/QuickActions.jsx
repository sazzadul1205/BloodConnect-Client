// Pages/backend/Admin/Dashboard/components/QuickActions.jsx

// React
import React from "react";
import { useNavigate } from "react-router";


// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FiPlus,
  FiUsers,
  FiDroplet,
  FiHome,
  FiCalendar,
  FiFileText,
  FiSettings,
  FiBell,
  FiBarChart2,
  FiMap,
} from "react-icons/fi";

const QuickActions = () => {

  // Hooks
  const navigate = useNavigate();

  // Data
  const actions = [
    {
      label: "Blood Banks",
      icon: FiHome,
      iconClass: "text-error",
      borderClass: "border-error/20 hover:border-error",
      hoverClass: "hover:bg-error/10",
      path: "/admin/blood-banks-management",
    },
    {
      label: "System Stats",
      icon: FiDroplet,
      iconClass: "text-info",
      borderClass: "border-info/20 hover:border-info",
      hoverClass: "hover:bg-info/10",
      path: "/admin/system-stats",
    },
    {
      label: "Audit Logs",
      icon: FiCalendar,
      iconClass: "text-success",
      borderClass: "border-success/20 hover:border-success",
      hoverClass: "hover:bg-success/10",
      path: "/admin/audit-logs",
    },
    {
      label: "Users",
      icon: FiUsers,
      iconClass: "text-primary",
      borderClass: "border-primary/20 hover:border-primary",
      hoverClass: "hover:bg-primary/10",
      path: "/admin/users-management",
    },
    {
      label: "Dashboard",
      icon: FiFileText,
      iconClass: "text-warning",
      borderClass: "border-warning/20 hover:border-warning",
      hoverClass: "hover:bg-warning/10",
      path: "/admin/dashboard",
    },
    {
      label: "Refresh",
      icon: FiMap,
      iconClass: "text-secondary",
      borderClass: "border-secondary/20 hover:border-secondary",
      hoverClass: "hover:bg-secondary/10",
      onClick: () => window.location.reload(),
    },
  ];

  return (
    <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4">

      {/* Quick Actions */}
      <h3 className="font-semibold flex items-center gap-2 mb-4">
        <FiPlus className="text-error" />
        Quick Actions
      </h3>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon;

          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                if (action.onClick) {
                  action.onClick();
                } else {
                  navigate(action.path);
                }
              }}
              className={`btn btn-outline btn-sm h-auto py-3 flex flex-col items-center gap-1 ${action.borderClass} ${action.hoverClass}`}
            >
              <Icon className={`${action.iconClass} text-lg`} />
              <span className="text-xs">{action.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Recent Shortcuts */}
      <div className="mt-4 pt-4 border-t border-base-300">
        <h4 className="text-xs font-semibold text-base-content/70 mb-2 flex items-center gap-1">
          <FiBell size={12} />
          Recent Shortcuts
        </h4>
        <div className="space-y-1">
          <button className="btn btn-ghost btn-xs w-full justify-start">
            <FiBarChart2 className="mr-2" />
            View Analytics
          </button>
          <button className="btn btn-ghost btn-xs w-full justify-start">
            <FiSettings className="mr-2" />
            System Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;

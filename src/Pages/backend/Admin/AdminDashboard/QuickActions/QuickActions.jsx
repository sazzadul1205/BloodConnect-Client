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

// ==================== CONSTANTS ====================

/**
 * Quick actions configuration
 * Each action has label, icon, styling classes, and navigation path/onClick
 */
const QUICK_ACTIONS = [
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

/**
 * Recent shortcuts configuration
 */
const RECENT_SHORTCUTS = [
  {
    label: "View Analytics",
    icon: FiBarChart2,
    path: "/admin/system-stats",
  },
  {
    label: "System Settings",
    icon: FiSettings,
    path: "/admin/settings",
  },
];

// ==================== ANIMATION VARIANTS ====================

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (custom) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: custom * 0.05,
      duration: 0.3,
      ease: "easeOut"
    }
  }),
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2
    }
  },
  tap: {
    scale: 0.95
  }
};

// ==================== MAIN COMPONENT ====================

/**
 * Quick Actions Component
 * Provides shortcut buttons for common admin tasks and navigation
 * Includes animated action buttons and recent shortcuts
 */
const QuickActions = () => {

  // ==================== HOOKS ====================

  const navigate = useNavigate();

  // ==================== RENDER ====================

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-3 sm:p-4"
    >

      {/* ==================== QUICK ACTIONS HEADER ==================== */}
      <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
        <FiPlus className="text-error text-sm sm:text-base" />
        Quick Actions
      </h3>

      {/* ==================== ACTION BUTTONS GRID ==================== */}
      {/* Responsive grid: 2 columns */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {QUICK_ACTIONS.map((action, index) => {
          const Icon = action.icon;

          return (
            <motion.button
              key={action.label}
              variants={buttonVariants}
              custom={index}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
              onClick={() => {
                if (action.onClick) {
                  action.onClick();
                } else {
                  navigate(action.path);
                }
              }}
              className={`
                btn btn-xs sm:btn-sm h-auto py-2 sm:py-3 
                flex flex-col items-center gap-1 sm:gap-2 
                border-2 ${action.borderClass} ${action.hoverClass}
                transition-all duration-200
              `}
            >
              {/* Icon */}
              <Icon className={`${action.iconClass} text-base sm:text-lg`} />
              {/* Label */}
              <span className="text-[10px] sm:text-xs font-medium">{action.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* ==================== RECENT SHORTCUTS ==================== */}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-base-300">

        {/* Recent Shortcuts Header */}
        <h4 className="text-[10px] sm:text-xs font-semibold text-base-content/70 mb-2 flex items-center gap-1">
          <FiBell size={10} className="sm:w-3 sm:h-3" />
          Recent Shortcuts
        </h4>

        {/* Shortcuts List */}
        <div className="space-y-1">
          {RECENT_SHORTCUTS.map((shortcut) => {
            const Icon = shortcut.icon;

            return (
              <motion.button
                key={shortcut.label}
                onClick={() => navigate(shortcut.path)}
                className="btn btn-ghost btn-xs sm:btn-sm w-full justify-start gap-2"
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="text-xs sm:text-sm" />
                <span className="text-[10px] sm:text-xs">{shortcut.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default QuickActions;
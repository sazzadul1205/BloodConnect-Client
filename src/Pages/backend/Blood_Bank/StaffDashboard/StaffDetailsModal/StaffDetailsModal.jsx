// Pages/backend/BloodBank/StaffDashboard/StaffDetailsModal/StaffDetailsModal.jsx

// React
import React from "react";

// Motion
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import { FaTimes, FaUser, FaShieldAlt, FaHeartbeat } from "react-icons/fa";
import {
  FiUser,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiMail,
} from "react-icons/fi";
import { formatAppDate } from "../../../../../utils/dateFormat";

// ==================== HELPER FUNCTIONS ====================

/**
 * Extract ID from MongoDB ObjectId or other formats
 */
const getId = (value) => {
  if (!value) return null;
  if (typeof value === "object") {
    return value?.$oid || value?.toString?.() || JSON.stringify(value);
  }
  return String(value);
};

// ==================== CONSTANTS ====================

/**
 * Staff role configuration for consistent display
 * Each role has specific icon, color theme, and label
 */
const staffRoleConfig = {
  manager: {
    icon: FaUser,
    color: "warning",
    label: "Manager",
    bgGradient: "from-warning to-warning/80",
    badgeClass: "badge-warning",
  },
  technician: {
    icon: FaHeartbeat,
    color: "info",
    label: "Technician",
    bgGradient: "from-info to-info/80",
    badgeClass: "badge-info",
  },
  nurse: {
    icon: FaUser,
    color: "success",
    label: "Nurse",
    bgGradient: "from-success to-success/80",
    badgeClass: "badge-success",
  },
  doctor: {
    icon: FaUser,
    color: "error",
    label: "Doctor",
    bgGradient: "from-error to-error/80",
    badgeClass: "badge-error",
  },
  administrator: {
    icon: FaShieldAlt,
    color: "secondary",
    label: "Administrator",
    bgGradient: "from-secondary to-secondary/80",
    badgeClass: "badge-secondary",
  },
  admin: {
    icon: FaShieldAlt,
    color: "error",
    label: "Admin",
    bgGradient: "from-error to-error/80",
    badgeClass: "badge-error",
  },
};

// Default config for unknown roles
const defaultRoleConfig = {
  icon: FaUser,
  color: "ghost",
  label: "Staff",
  bgGradient: "from-base-300 to-base-300/80",
  badgeClass: "badge-ghost",
};

// ==================== ANIMATION VARIANTS ====================

/**
 * Animation variants for modal entrance
 */
const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

/**
 * Animation variants for content sections
 */
const contentVariants = {
  hidden: {
    opacity: 0,
    x: -20
  },
  visible: (custom) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.1 + (custom * 0.1),
      duration: 0.4,
      ease: "easeOut"
    }
  })
};

/**
 * Animation variants for individual items
 */
const itemVariants = {
  hidden: {
    opacity: 0,
    y: 10
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

// ==================== MAIN COMPONENT ====================

/**
 * Staff Details Modal Component
 * Displays comprehensive information about a staff member
 * 
 * @param {Object} staff - Staff member data object
 * @param {Function} onClose - Function to close the modal
 */
const StaffDetailsModal = ({ staff, onClose }) => {
  // Return null if no staff data is provided
  if (!staff) return null;

  // Get role-specific configuration or use default
  const roleInfo = staffRoleConfig[staff.role] || {
    ...defaultRoleConfig,
    label: staff.role || "Staff",
  };

  const RoleIcon = roleInfo.icon;
  const user = staff.user || {};

  return (
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="modal-box w-11/12 max-w-2xl p-0 overflow-hidden bg-base-100 mx-2 sm:mx-0"
    >

      {/* ==================== MODAL HEADER ==================== */}
      {/* Gradient header based on staff role */}
      <motion.div
        className={`bg-linear-to-r ${roleInfo.bgGradient} p-4 sm:p-6 text-white`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

          {/* Staff Info with Avatar */}
          <motion.div
            className="flex items-center gap-2 sm:gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {/* Role-based avatar */}
            <div className="bg-white/20 p-2 sm:p-3 md:p-4 rounded-full">
              <RoleIcon size={20} className="sm:w-6 sm:h-6 md:w-8 md:h-8" />
            </div>

            {/* Name and Role Badges */}
            <div className="min-w-0">
              <motion.h2
                className="font-bold text-lg sm:text-xl md:text-2xl truncate max-w-48 sm:max-w-64"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {user.profile?.fullName || "Staff Member"}
              </motion.h2>
              <motion.div
                className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                {/* Role Badge */}
                <span className={`badge ${roleInfo.badgeClass} badge-xs sm:badge-sm gap-1`}>
                  <RoleIcon size={8} className="sm:w-3 sm:h-3" />
                  <span className="text-[10px] sm:text-xs">{roleInfo.label}</span>
                </span>

                {/* Department Badge */}
                <span className="text-white/80 text-[10px] sm:text-sm">
                  Dept: {staff.department || "General"}
                </span>
              </motion.div>
            </div>
          </motion.div>

          {/* Close Button */}
          <motion.button
            onClick={onClose}
            className="btn btn-ghost btn-xs sm:btn-sm btn-circle text-white hover:bg-white/20 self-end sm:self-auto"
            aria-label="Close modal"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <FaTimes size={14} className="sm:w-5 sm:h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* ==================== MODAL CONTENT ==================== */}
      {/* Scrollable content area */}
      <div className="p-4 sm:p-6 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto space-y-3 sm:space-y-4">

        {/* ==================== PERSONAL INFORMATION ==================== */}
        <motion.div
          custom={1}
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="bg-base-200 rounded-lg p-3 sm:p-4"
        >
          <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-2 sm:mb-3">
            <FiUser className="text-primary text-sm sm:text-base" />
            Personal Information
          </h3>

          {/* Responsive grid: 1 column on mobile, 2 on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

            {/* Full Name */}
            <motion.div variants={itemVariants}>
              <p className="text-xs opacity-70">Full Name</p>
              <p className="font-medium text-sm wrap-break-word">
                {user.profile?.fullName || "N/A"}
              </p>
            </motion.div>

            {/* Staff ID (last 8 characters) */}
            <motion.div variants={itemVariants}>
              <p className="text-xs opacity-70">Staff ID</p>
              <p className="font-medium text-sm">
                {getId(staff.userId)?.slice(-8) || "N/A"}
              </p>
            </motion.div>

            {/* Role */}
            <motion.div variants={itemVariants}>
              <p className="text-xs opacity-70">Role</p>
              <p className="font-medium text-sm capitalize">
                {staff.role || "N/A"}
              </p>
            </motion.div>

            {/* Department */}
            <motion.div variants={itemVariants}>
              <p className="text-xs opacity-70">Department</p>
              <p className="font-medium text-sm">
                {staff.department || "General"}
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* ==================== CONTACT INFORMATION ==================== */}
        <motion.div
          custom={2}
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="bg-base-200 rounded-lg p-3 sm:p-4"
        >
          <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-2 sm:mb-3">
            <FiPhone className="text-primary text-sm sm:text-base" />
            Contact Information
          </h3>

          <div className="space-y-2">
            {/* Email */}
            {user.email && (
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-2 text-xs sm:text-sm break-all"
              >
                <FiMail className="text-primary/70 shrink-0 sm:w-4 sm:h-4" size={12} />
                <span>{user.email}</span>
              </motion.div>
            )}

            {/* Phone */}
            {user.phone && (
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <FiPhone className="text-primary/70 shrink-0 sm:w-4 sm:h-4" size={12} />
                <span>{user.phone}</span>
              </motion.div>
            )}

            {/* Address/City */}
            {user.address?.city && (
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <FiMapPin className="text-primary/70 shrink-0 sm:w-4 sm:h-4" size={12} />
                <span>
                  {user.address.city}
                  {user.address.state && `, ${user.address.state}`}
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ==================== ACCOUNT INFORMATION ==================== */}
        {/* Only show if user has creation date */}
        {user.createdAt && (
          <motion.div
            custom={3}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="bg-base-200 rounded-lg p-3 sm:p-4"
          >
            <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-2 sm:mb-3">
              <FiCalendar className="text-primary text-sm sm:text-base" />
              Account Information
            </h3>

            {/* Responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

              {/* Join Date */}
              <motion.div variants={itemVariants}>
                <p className="text-xs opacity-70">Joined</p>
                <p className="font-medium text-sm">
                  {formatAppDate(user.createdAt)}
                </p>
              </motion.div>

              {/* Last Active Date */}
              <motion.div variants={itemVariants}>
                <p className="text-xs opacity-70">Last Active</p>
                <p className="font-medium text-sm">
                  {user.stats?.lastActive
                    ? formatAppDate(user.stats.lastActive)
                    : "N/A"}
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ==================== MODAL FOOTER ==================== */}
      <motion.div
        className="modal-action border-t border-base-300 p-3 sm:p-4 bg-base-200/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <motion.button
          onClick={onClose}
          className="btn btn-primary btn-sm sm:btn-md text-white ml-auto gap-1 sm:gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-xs sm:text-sm">Close</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default StaffDetailsModal;
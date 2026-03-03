// Pages/backend/Admin/UsersManagement/ViewUserModal/ViewUserModal.jsx

// React
import React, { useState, useEffect } from "react";

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Icons
import {
  FaTint,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaHeartbeat,
  FaBuilding,
  FaShieldAlt,
  FaTimes,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaVenusMars,
  FaIdCard,
  FaBell,
  FaGlobe,
  FaClock,
  FaUserCheck,
  FaUserClock,
  FaStar,
  FaChartLine,
} from "react-icons/fa";

// Hooks
import BloodLoader from "../../../../../shared/BloodLoader";
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";
import { formatAppDate, formatAppDateTime } from "../../../../../utils/dateFormat";

// ==================== CONSTANTS ====================

/**
 * Role configuration for different user types
 * Each role has specific icon, color theme, and label
 */
const roleConfig = {
  donor: {
    icon: FaTint,
    color: "success",
    label: "Donor",
    bgGradient: "from-success to-success/80",
    badgeClass: "badge-success"
  },
  requester: {
    icon: FaHeartbeat,
    color: "warning",
    label: "Requester",
    bgGradient: "from-warning to-warning/80",
    badgeClass: "badge-warning"
  },
  hospital: {
    icon: FaMapMarkerAlt,
    color: "info",
    label: "Hospital",
    bgGradient: "from-info to-info/80",
    badgeClass: "badge-info"
  },
  blood_bank: {
    icon: FaBuilding,
    color: "secondary",
    label: "Blood Bank",
    bgGradient: "from-secondary to-secondary/80",
    badgeClass: "badge-secondary"
  },
  admin: {
    icon: FaShieldAlt,
    color: "error",
    label: "Admin",
    bgGradient: "from-error to-error/80",
    badgeClass: "badge-error"
  },
  super_admin: {
    icon: FaShieldAlt,
    color: "error",
    label: "Super Admin",
    bgGradient: "from-error to-error/80",
    badgeClass: "badge-error"
  },
};

/**
 * Default role config for unknown roles
 */
const defaultRoleConfig = {
  icon: FaUser,
  color: "ghost",
  label: "User",
  bgGradient: "from-base-300 to-base-300/80",
  badgeClass: "badge-ghost"
};

// ==================== ANIMATION VARIANTS ====================

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
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

const tabContentVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3
    }
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.2
    }
  }
};

// ==================== MAIN COMPONENT ====================

/**
 * View User Modal Component
 * Displays comprehensive user information across multiple tabs
 * 
 * @param {string} userId - ID of the user to view
 * @param {Function} onClose - Function to close the modal
 */
const ViewUserModal = ({ userId, onClose }) => {
  const { axiosInstance } = useAxiosPublic();

  // ==================== STATE MANAGEMENT ====================

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("profile"); // profile, address, stats, settings, verification

  // ==================== EFFECTS ====================

  /**
   * Fetch user data when component mounts or userId changes
   */
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const response = await axiosInstance.get(`/users/profile/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
        });

        if (response.data?.success) {
          setUserData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, axiosInstance]);

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    return formatAppDate(dateString, "MMMM d, yyyy");
  };

  /**
   * Format datetime for display
   */
  const formatDateTime = (dateString) => {
    return formatAppDateTime(dateString, "MMMM d, yyyy p");
  };

  /**
   * Get role configuration with fallback
   */
  const getRoleInfo = (role) => {
    return roleConfig[role] || {
      ...defaultRoleConfig,
      label: role || "User"
    };
  };

  /**
   * Get verification status badge
   */
  const getStatusBadge = (isVerified) => {
    return isVerified ? (
      <span className="badge badge-success badge-xs sm:badge-sm gap-1">
        <FaCheckCircle size={8} className="sm:w-3 sm:h-3" />
        <span className="text-[10px] sm:text-xs">Verified</span>
      </span>
    ) : (
      <span className="badge badge-ghost badge-xs sm:badge-sm gap-1">
        <FaTimesCircle size={8} className="sm:w-3 sm:h-3" />
        <span className="text-[10px] sm:text-xs">Unverified</span>
      </span>
    );
  };

  // ==================== LOADING STATE ====================

  if (loading) return <BloodLoader fullscreen={false} />;
  if (!userData) return null;

  // Get role configuration
  const roleInfo = getRoleInfo(userData.role);
  const RoleIcon = roleInfo.icon;

  // Safe access to nested properties
  const profile = userData.profile || {};
  const verification = userData.verification || {};
  const address = userData.address || {};
  const stats = userData.stats || {};
  const settings = userData.settings || {};
  const notifications = settings.notifications || {};
  const privacy = settings.privacy || {};

  // ==================== RENDER ====================

  return (
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden bg-base-100 mx-2 sm:mx-0"
    >

      {/* ==================== MODAL HEADER ==================== */}
      <div className={`bg-linear-to-r ${roleInfo.bgGradient} p-4 sm:p-6 text-white`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

          {/* Title and icon */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-white/20 p-2 sm:p-3 md:p-4 rounded-full">
              <RoleIcon size={20} className="sm:w-6 sm:h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-xl md:text-2xl truncate max-w-48 sm:max-w-64">
                {profile.fullName || "User Profile"}
              </h2>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                {/* Role Badge */}
                <span className={`badge ${roleInfo.badgeClass} badge-xs sm:badge-sm gap-1`}>
                  <RoleIcon size={8} className="sm:w-3 sm:h-3" />
                  <span className="text-[10px] sm:text-xs">{roleInfo.label}</span>
                </span>
                {/* User ID (last 8 chars) */}
                <span className="text-white/80 text-[8px] sm:text-xs">
                  ID: {userData._id?.slice(-8) || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => onClose()}
            className="btn btn-ghost btn-xs sm:btn-sm btn-circle text-white hover:bg-white/20 self-end sm:self-auto"
            aria-label="Close modal"
          >
            <FaTimes size={14} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* ==================== QUICK STATS ==================== */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 p-3 sm:p-4 bg-base-200/50 border-b border-base-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Joined Date */}
        <div className="stat py-1 sm:py-2">
          <div className="stat-figure text-primary">
            <FaClock size={8} className="sm:w-4 sm:h-4" />
          </div>
          <div className="stat-title text-[8px] sm:text-xs">Joined</div>
          <div className="stat-value text-[10px] sm:text-sm truncate">{formatDate(userData.createdAt)}</div>
        </div>

        {/* Last Active */}
        <div className="stat py-1 sm:py-2">
          <div className="stat-figure text-success">
            <FaUserCheck size={8} className="sm:w-4 sm:h-4" />
          </div>
          <div className="stat-title text-[8px] sm:text-xs">Last Active</div>
          <div className="stat-value text-[10px] sm:text-sm truncate">{formatDate(stats.lastActive)}</div>
        </div>

        {/* Reputation */}
        <div className="stat py-1 sm:py-2">
          <div className="stat-figure text-warning">
            <FaStar size={8} className="sm:w-4 sm:h-4" />
          </div>
          <div className="stat-title text-[8px] sm:text-xs">Reputation</div>
          <div className="stat-value text-[10px] sm:text-sm">{stats.reputation || 100}%</div>
        </div>

        {/* Response Rate */}
        <div className="stat py-1 sm:py-2">
          <div className="stat-figure text-info">
            <FaChartLine size={8} className="sm:w-4 sm:h-4" />
          </div>
          <div className="stat-title text-[8px] sm:text-xs">Response</div>
          <div className="stat-value text-[10px] sm:text-sm">{stats.responseRate || 0}%</div>
        </div>
      </motion.div>

      {/* ==================== TABS ==================== */}
      <div className="tabs tabs-boxed bg-base-100 p-1 border-b border-base-300 flex-wrap">
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "profile" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <span className="text-[10px] sm:text-sm">Profile</span>
        </button>
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "address" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("address")}
        >
          <span className="text-[10px] sm:text-sm">Address</span>
        </button>
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "stats" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          <span className="text-[10px] sm:text-sm">Statistics</span>
        </button>
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "settings" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          <span className="text-[10px] sm:text-sm">Settings</span>
        </button>
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "verification" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("verification")}
        >
          <span className="text-[10px] sm:text-sm">Verification</span>
        </button>
      </div>

      {/* ==================== CONTENT ==================== */}
      <div className="p-4 sm:p-6 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ==================== PROFILE TAB ==================== */}
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 sm:space-y-6"
            >
              {/* Basic Information */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2 mb-3 sm:mb-4">
                  <FaUser className="text-primary sm:w-4 sm:h-4" size={12}  />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                  {/* Full Name */}
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Full Name</p>
                    <p className="font-medium text-xs sm:text-sm wrap-break-word">{profile.fullName || "N/A"}</p>
                  </div>
                  {/* Username */}
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Username</p>
                    <p className="font-medium text-xs sm:text-sm wrap-break-word">@{userData.username || "N/A"}</p>
                  </div>
                  {/* Email with Verification Badge */}
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Email</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-xs sm:text-sm wrap-break-word">{userData.email || "N/A"}</p>
                      {getStatusBadge(verification.isEmailVerified)}
                    </div>
                  </div>
                  {/* Phone with Verification Badge */}
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Phone</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-xs sm:text-sm wrap-break-word">{userData.phone || "N/A"}</p>
                      {getStatusBadge(verification.isPhoneVerified)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2 mb-3 sm:mb-4">
                  <FaVenusMars className="text-primary sm:w-4 sm:h-4" size={12} />
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* Blood Group */}
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Blood Group</p>
                    <p className="font-medium text-sm sm:text-base text-error">{profile.bloodGroup || "N/A"}</p>
                  </div>
                  {/* Date of Birth */}
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Date of Birth</p>
                    <p className="font-medium text-xs sm:text-sm">{formatDate(profile.dateOfBirth)}</p>
                  </div>
                  {/* Gender */}
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Gender</p>
                    <p className="font-medium text-xs sm:text-sm capitalize">{profile.gender || "N/A"}</p>
                  </div>
                  {/* Weight */}
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Weight</p>
                    <p className="font-medium text-xs sm:text-sm">{profile.weight ? `${profile.weight} kg` : "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact (if exists) */}
              {profile.emergencyContact?.name && (
                <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2 mb-3 sm:mb-4">
                    <FaPhone className="text-primary sm:w-4 sm:h-4" size={12}  />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {/* Contact Name */}
                    <div>
                      <p className="text-[10px] sm:text-xs opacity-70">Name</p>
                      <p className="font-medium text-xs sm:text-sm wrap-break-word">{profile.emergencyContact.name}</p>
                    </div>
                    {/* Relation */}
                    <div>
                      <p className="text-[10px] sm:text-xs opacity-70">Relation</p>
                      <p className="font-medium text-xs sm:text-sm wrap-break-word">{profile.emergencyContact.relation}</p>
                    </div>
                    {/* Phone */}
                    <div>
                      <p className="text-[10px] sm:text-xs opacity-70">Phone</p>
                      <p className="font-medium text-xs sm:text-sm wrap-break-word">{profile.emergencyContact.phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ==================== ADDRESS TAB ==================== */}
          {activeTab === "address" && (
            <motion.div
              key="address"
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 sm:space-y-6"
            >
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2 mb-3 sm:mb-4">
                  <FaMapMarkerAlt className="text-primary sm:w-4 sm:h-4" size={12} />
                  Address Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Street Address - Full width */}
                  <div className="col-span-1 sm:col-span-2">
                    <p className="text-[10px] sm:text-xs opacity-70">Street Address</p>
                    <p className="font-medium text-xs sm:text-sm wrap-break-word">{address.street || "N/A"}</p>
                  </div>
                  {/* City */}
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">City</p>
                    <p className="font-medium text-xs sm:text-sm wrap-break-word">{address.city || "N/A"}</p>
                  </div>
                  {/* State */}
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">State</p>
                    <p className="font-medium text-xs sm:text-sm wrap-break-word">{address.state || "N/A"}</p>
                  </div>
                  {/* Zip Code */}
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Zip Code</p>
                    <p className="font-medium text-xs sm:text-sm wrap-break-word">{address.zipCode || "N/A"}</p>
                  </div>
                  {/* Country */}
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Country</p>
                    <p className="font-medium text-xs sm:text-sm wrap-break-word">{address.country || "N/A"}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== STATISTICS TAB ==================== */}
          {activeTab === "stats" && (
            <motion.div
              key="stats"
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 sm:space-y-6"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                {/* Total Donations */}
                <div className="stat bg-base-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="stat-title text-[10px] sm:text-xs opacity-70">Total Donations</p>
                      <p className="stat-value text-base sm:text-lg md:text-xl font-bold text-primary">
                        {stats.totalDonations || 0}
                      </p>
                    </div>
                    <div className="stat-figure bg-primary/10 p-2 rounded-full">
                      <FaTint className="text-primary text-sm sm:text-base" />
                    </div>
                  </div>
                  <p className="stat-desc text-[8px] sm:text-xs mt-2">
                    Lives saved: {(stats.totalDonations || 0) * 3}
                  </p>
                </div>

                {/* Total Requests */}
                <div className="stat bg-base-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="stat-title text-[10px] sm:text-xs opacity-70">Total Requests</p>
                      <p className="stat-value text-base sm:text-lg md:text-xl font-bold text-warning">
                        {stats.totalRequests || 0}
                      </p>
                    </div>
                    <div className="stat-figure bg-warning/10 p-2 rounded-full">
                      <FaHeartbeat className="text-warning text-sm sm:text-base" />
                    </div>
                  </div>
                  <p className="stat-desc text-[8px] sm:text-xs mt-2">Active requests</p>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-xs sm:text-sm mb-3">Activity Timeline</h3>
                <div className="space-y-2 sm:space-y-3">
                  {/* Last Active */}
                  <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
                    <FaClock className="text-primary shrink-0 sm:w-3 sm:h-3" size={10} />
                    <span>Last active: {formatDateTime(stats.lastActive)}</span>
                  </div>
                  {/* Account Created */}
                  <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
                    <FaUserCheck className="text-success shrink-0 sm:w-3 sm:h-3" size={10} />
                    <span>Account created: {formatDateTime(userData.createdAt)}</span>
                  </div>
                  {/* Last Updated */}
                  <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
                    <FaUserClock className="text-warning shrink-0 sm:w-3 sm:h-3" size={10} />
                    <span>Last updated: {formatDateTime(userData.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== SETTINGS TAB ==================== */}
          {activeTab === "settings" && (
            <motion.div
              key="settings"
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 sm:space-y-6"
            >
              {/* Notification Settings */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2 mb-3 sm:mb-4">
                  <FaBell className="text-primary sm:w-4 sm:h-4" size={12}  />
                  Notification Settings
                </h3>
                <div className="space-y-2">
                  {/* Email Notifications */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
                    <div className={`badge badge-xs sm:badge-sm ${notifications.email ? 'badge-success' : 'badge-ghost'}`}>
                      {notifications.email ? 'Enabled' : 'Disabled'}
                    </div>
                    <span>Email Notifications</span>
                  </div>
                  {/* SMS Notifications */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
                    <div className={`badge badge-xs sm:badge-sm ${notifications.sms ? 'badge-success' : 'badge-ghost'}`}>
                      {notifications.sms ? 'Enabled' : 'Disabled'}
                    </div>
                    <span>SMS Notifications</span>
                  </div>
                  {/* Push Notifications */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
                    <div className={`badge badge-xs sm:badge-sm ${notifications.push ? 'badge-success' : 'badge-ghost'}`}>
                      {notifications.push ? 'Enabled' : 'Disabled'}
                    </div>
                    <span>Push Notifications</span>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2 mb-3 sm:mb-4">
                  <FaGlobe className="text-primary sm:w-4 sm:h-4" size={12} />
                  Privacy Settings
                </h3>
                <div className="space-y-2">
                  {/* Show Location */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
                    <div className={`badge badge-xs sm:badge-sm ${privacy.showLocation ? 'badge-success' : 'badge-ghost'}`}>
                      {privacy.showLocation ? 'Public' : 'Private'}
                    </div>
                    <span>Show Location</span>
                  </div>
                  {/* Show Contact Info */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
                    <div className={`badge badge-xs sm:badge-sm ${privacy.showContact ? 'badge-success' : 'badge-ghost'}`}>
                      {privacy.showContact ? 'Public' : 'Private'}
                    </div>
                    <span>Show Contact Info</span>
                  </div>
                  {/* Show Last Donation */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
                    <div className={`badge badge-xs sm:badge-sm ${privacy.showLastDonation ? 'badge-success' : 'badge-ghost'}`}>
                      {privacy.showLastDonation ? 'Public' : 'Private'}
                    </div>
                    <span>Show Last Donation</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== VERIFICATION TAB ==================== */}
          {activeTab === "verification" && (
            <motion.div
              key="verification"
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 sm:space-y-6"
            >
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2 mb-3 sm:mb-4">
                  <FaIdCard className="text-primary sm:w-4 sm:h-4" size={12}  />
                  Verification Status
                </h3>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                  {/* Email Verification */}
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Email Verification</p>
                    <div className="mt-1">
                      {getStatusBadge(verification.isEmailVerified)}
                    </div>
                  </div>
                  {/* Phone Verification */}
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Phone Verification</p>
                    <div className="mt-1">
                      {getStatusBadge(verification.isPhoneVerified)}
                    </div>
                  </div>
                  {/* Identity Verification */}
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Identity Verification</p>
                    <div className="mt-1">
                      {getStatusBadge(verification.isIdentityVerified)}
                    </div>
                  </div>
                </div>

                {/* Verified At (if available) */}
                {verification.verifiedAt && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-base-300">
                    <p className="text-[10px] sm:text-xs opacity-70">Verified On</p>
                    <p className="font-medium text-xs sm:text-sm">{formatDateTime(verification.verifiedAt)}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ==================== MODAL FOOTER ==================== */}
      <div className="modal-action border-t border-base-300 p-3 sm:p-4 bg-base-200/50">
        <button
          onClick={() => onClose()}
          className="btn btn-primary btn-sm sm:btn-md text-white ml-auto gap-1 sm:gap-2"
        >
          <FaEye size={12} className="sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm">Close</span>
        </button>
      </div>
    </motion.div>
  );
};

export default ViewUserModal;
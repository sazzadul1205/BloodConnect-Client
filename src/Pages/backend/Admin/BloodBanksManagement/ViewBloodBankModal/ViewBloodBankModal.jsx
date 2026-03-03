// Page/backend/Admin/BloodBanksManagement/ViewBloodBankModal/ViewBloodBankModal.jsx

// React
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Icons
import {
  FaHospital,
  FaBuilding,
  FaHeartbeat,
  FaPhone,
  FaEnvelope,
  FaGlobe,
  FaMapMarkerAlt,
  FaClock,
  FaTools,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaStar,
  FaShieldAlt,
  FaTimes,
  FaFileAlt,
  FaBoxes,
  FaExclamationTriangle,
} from "react-icons/fa";
import { FaDroplet } from "react-icons/fa6";

// Hooks
import BloodLoader from "../../../../../shared/BloodLoader";
import ErrorState from "../../../../../shared/ErrorState";
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";
import { formatAppDate, formatAppDateTime } from "../../../../../utils/dateFormat";

// ==================== QUERY KEYS ====================

const queryKeys = {
  bloodBankDetails: (bankId) => ['blood-bank-details', bankId],
};

// ==================== CONSTANTS ====================

// Bank type configuration for consistent display
const bankTypeMap = {
  government: {
    icon: FaBuilding,
    color: "primary",
    label: "Government",
    bgGradient: "from-primary to-primary/80",
    badgeColor: "badge-primary"
  },
  private: {
    icon: FaBuilding,
    color: "secondary",
    label: "Private",
    bgGradient: "from-secondary to-secondary/80",
    badgeColor: "badge-secondary"
  },
  ngo: {
    icon: FaHeartbeat,
    color: "success",
    label: "NGO",
    bgGradient: "from-success to-success/80",
    badgeColor: "badge-success"
  },
  hospital: {
    icon: FaHospital,
    color: "info",
    label: "Hospital",
    bgGradient: "from-info to-info/80",
    badgeColor: "badge-info"
  },
};

// Default config for unknown types
const defaultBankConfig = {
  icon: FaHospital,
  color: "ghost",
  label: "Blood Bank",
  bgGradient: "from-base-300 to-base-300/80",
  badgeColor: "badge-ghost"
};

// Days of week for hours display
const daysOfWeek = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

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

const statsVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (custom) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.1 + custom * 0.05,
      duration: 0.3
    }
  })
};

// ==================== MAIN COMPONENT ====================

/**
 * View Blood Bank Modal Component
 * Displays comprehensive blood bank information across multiple tabs
 * 
 * @param {string} bankId - ID of the blood bank to view
 * @param {Function} onClose - Function to close the modal
 */
const ViewBloodBankModal = ({ bankId, onClose }) => {
  const { axiosInstance } = useAxiosPublic();

  // ==================== STATE MANAGEMENT ====================

  // Active tab state for modal navigation
  const [activeTab, setActiveTab] = useState("overview"); // overview, contact, inventory, staff, verification

  // ==================== TANSTACK QUERY ====================

  /**
   * Fetch detailed blood bank information
   * Query is enabled only when bankId is provided
   * Caches data for 5 minutes to reduce API calls
   */
  const {
    data: bankData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    // Unique query key for this bank
    queryKey: queryKeys.bloodBankDetails(bankId),

    // Only run query when bankId exists
    enabled: Boolean(bankId),

    // Query function to fetch bank details
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const response = await axiosInstance.get(`/blood-banks/${bankId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.data?.success) {
        throw new Error("Failed to load blood bank details.");
      }

      return response.data.data;
    },

    // Data is considered fresh for 5 minutes
    staleTime: 5 * 60 * 1000,

    // Cache data for 10 minutes
    gcTime: 10 * 60 * 1000,
  });

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  const formatDate = (dateString) => {
    return formatAppDate(dateString, "MMMM d, yyyy");
  };

  /**
   * Format datetime for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted datetime
   */
  const formatDateTime = (dateString) => {
    return formatAppDateTime(dateString, "MMMM d, yyyy p");
  };

  /**
   * Get bank type configuration with fallback
   * @param {string} type - Bank type
   * @returns {Object} Bank configuration object
   */
  const getBankTypeInfo = (type) => {
    return bankTypeMap[type] || {
      ...defaultBankConfig,
      label: type || "Blood Bank"
    };
  };

  /**
   * Get verification status badge
   * @param {boolean} isVerified - Verification status
   * @returns {JSX.Element} Badge component
   */
  const getStatusBadge = (isVerified) => {
    return isVerified ? (
      <span className="badge badge-success gap-1 badge-xs sm:badge-sm">
        <FaCheckCircle size={8} className="sm:w-3 sm:h-3" />
        <span className="text-[10px] sm:text-xs">Verified</span>
      </span>
    ) : (
      <span className="badge badge-warning gap-1 badge-xs sm:badge-sm">
        <FaTimesCircle size={8} className="sm:w-3 sm:h-3" />
        <span className="text-[10px] sm:text-xs">Pending Verification</span>
      </span>
    );
  };

  /**
   * Get inventory status based on units and threshold
   * @param {number} units - Current units
   * @param {number} threshold - Threshold value
   * @returns {Object} Status object with color, label and icon
   */
  const getInventoryStatus = (units, threshold) => {
    if (units <= threshold) {
      return {
        status: "Low",
        color: "badge-error",
        icon: FaExclamationTriangle
      };
    }
    if (units <= threshold * 2) {
      return {
        status: "Adequate",
        color: "badge-warning",
        icon: FaCheckCircle
      };
    }
    return {
      status: "Good",
      color: "badge-success",
      icon: FaCheckCircle
    };
  };

  /**
   * Format day name for display
   * @param {string} day - Day key
   * @returns {string} Formatted day name
   */
  const formatDayName = (day) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  // ==================== LOADING & ERROR STATES ====================

  if (isLoading) return <BloodLoader fullscreen={false} />;

  if (isError) {
    return (
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="modal-box w-11/12 max-w-4xl p-6 bg-base-100 mx-2 sm:mx-0"
      >
        <ErrorState error={error} onRetry={refetch} />
      </motion.div>
    );
  }

  if (!bankData) return null;

  // ==================== DATA EXTRACTION ====================

  const bank = bankData;
  const typeInfo = getBankTypeInfo(bank.type);
  const TypeIcon = typeInfo.icon;

  // Safe access to nested properties with fallbacks
  const contact = bank.contact || {};
  const address = bank.address || {};
  const inventory = bank.inventory || [];
  const staff = bank.staff || [];
  const verification = bank.verification || {};
  const operatingHours = bank.operatingHours || {};
  const facilities = bank.facilities || [];
  const stats = bank.stats || {};

  // ==================== RENDER ====================

  return (
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden bg-base-100 mx-2 sm:mx-0"
    >

      {/* ==================== HEADER SECTION ==================== */}
      {/* Dynamic header based on bank type */}
      <motion.div
        className={`bg-linear-to-r ${typeInfo.bgGradient} p-4 sm:p-6 text-white`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

          {/* Bank Info */}
          <motion.div
            className="flex items-center gap-2 sm:gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="bg-white/20 p-2 sm:p-4 rounded-full">
              <TypeIcon size={20} className="sm:w-8 sm:h-8" />
            </div>
            <div className="min-w-0">
              <motion.h2
                className="font-bold text-lg sm:text-2xl truncate max-w-48 sm:max-w-64"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {bank.name || "Blood Bank"}
              </motion.h2>
              <motion.div
                className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                {/* Bank Type Badge */}
                <span className={`badge ${typeInfo.badgeColor} badge-xs sm:badge-sm gap-1`}>
                  <TypeIcon size={6} className="sm:w-3 sm:h-3" />
                  <span className="text-[10px] sm:text-xs">{typeInfo.label}</span>
                </span>
                {/* Registration Number */}
                <span className="text-white/80 text-[10px] sm:text-sm truncate max-w-24 sm:max-w-32">
                  Reg: {bank.registrationNumber?.slice(-8) || "N/A"}
                </span>
              </motion.div>
            </div>
          </motion.div>

          {/* Close Button */}
          <motion.button
            onClick={() => onClose()}
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

      {/* ==================== QUICK STATS ==================== */}
      {/* Responsive grid: 2 cols on mobile, 4 on desktop */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 p-2 sm:p-4 bg-base-200/50 border-b border-base-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        {/* Established Date */}
        <motion.div
          className="stat py-1 sm:py-2"
          variants={statsVariants}
          custom={0}
        >
          <div className="stat-figure text-primary">
            <FaClock size={8} className="sm:w-4 sm:h-4" />
          </div>
          <div className="stat-title text-[8px] sm:text-xs">Established</div>
          <div className="stat-value text-[10px] sm:text-sm wrap-break-word">
            {formatDate(bank.createdAt)}
          </div>
        </motion.div>

        {/* Staff Count */}
        <motion.div
          className="stat py-1 sm:py-2"
          variants={statsVariants}
          custom={1}
        >
          <div className="stat-figure text-success">
            <FaUsers size={8} className="sm:w-4 sm:h-4" />
          </div>
          <div className="stat-title text-[8px] sm:text-xs">Staff Count</div>
          <div className="stat-value text-[10px] sm:text-sm">
            {staff.length || 0} Members
          </div>
        </motion.div>

        {/* Blood Units */}
        <motion.div
          className="stat py-1 sm:py-2"
          variants={statsVariants}
          custom={2}
        >
          <div className="stat-figure text-warning">
            <FaDroplet size={8} className="sm:w-4 sm:h-4" />
          </div>
          <div className="stat-title text-[8px] sm:text-xs">Blood Units</div>
          <div className="stat-value text-[10px] sm:text-sm">
            {inventory.reduce((acc, item) => acc + (item.units || 0), 0)}
          </div>
        </motion.div>

        {/* Rating */}
        <motion.div
          className="stat py-1 sm:py-2"
          variants={statsVariants}
          custom={3}
        >
          <div className="stat-figure text-info">
            <FaStar size={8} className="sm:w-4 sm:h-4" />
          </div>
          <div className="stat-title text-[8px] sm:text-xs">Rating</div>
          <div className="stat-value text-[10px] sm:text-sm">{stats.rating || 0}/5</div>
        </motion.div>
      </motion.div>

      {/* ==================== TABS NAVIGATION ==================== */}
      {/* Responsive tabs that wrap on mobile */}
      <div className="tabs tabs-boxed bg-base-100 p-1 border-b border-base-300 flex-wrap">
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "overview" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <span className="text-[10px] sm:text-sm">Overview</span>
        </button>
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "contact" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("contact")}
        >
          <span className="text-[10px] sm:text-sm">Contact</span>
        </button>
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "inventory" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          <span className="text-[10px] sm:text-sm">Inventory</span>
        </button>
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "staff" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("staff")}
        >
          <span className="text-[10px] sm:text-sm">Staff</span>
        </button>
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "verification" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("verification")}
        >
          <span className="text-[10px] sm:text-sm">Verification</span>
        </button>
      </div>

      {/* ==================== CONTENT AREA ==================== */}
      {/* Scrollable content with responsive padding */}
      <div className="p-3 sm:p-6 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ==================== OVERVIEW TAB ==================== */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 sm:space-y-6"
            >
              {/* Basic Information Section */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                  <FaHospital className="text-primary text-sm sm:text-base" />
                  Basic Information
                </h3>

                {/* Responsive grid: 1 col on mobile, 2 on desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Registration Number</p>
                    <p className="font-medium text-xs sm:text-sm wrap-break-word">
                      {bank.registrationNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Bank Type</p>
                    <p className="font-medium text-xs sm:text-sm capitalize wrap-break-word">
                      {bank.type || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Verification Status</p>
                    <div className="mt-1">{getStatusBadge(verification.isVerified)}</div>
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                  <FaMapMarkerAlt className="text-primary text-sm sm:text-base" />
                  Location
                </h3>
                <div className="space-y-1 sm:space-y-2">
                  <p className="font-medium text-xs sm:text-sm wrap-break-word">
                    {address.street || "N/A"}
                  </p>
                  <p className="text-[10px] sm:text-xs text-base-content/70 wrap-break-word">
                    {address.city && address.state
                      ? `${address.city}, ${address.state} ${address.zipCode || ""}`
                      : "Address not available"}
                  </p>
                  {address.coordinates?.coordinates && (
                    <p className="text-[8px] sm:text-xs text-base-content/50 wrap-break-word">
                      Coordinates: {address.coordinates.coordinates[0]}, {address.coordinates.coordinates[1]}
                    </p>
                  )}
                </div>
              </div>

              {/* Facilities Section */}
              {facilities.length > 0 && (
                <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                    <FaTools className="text-primary text-sm sm:text-base" />
                    Facilities
                  </h3>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {facilities.map((facility, index) => (
                      <span key={index} className="badge badge-outline badge-xs sm:badge-sm">
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Operating Hours Section */}
              {Object.keys(operatingHours).length > 0 && (
                <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                    <FaClock className="text-primary text-sm sm:text-base" />
                    Operating Hours
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {daysOfWeek.map((day) => {
                      const hours = operatingHours[day];
                      const isOpen = hours?.open && hours?.close;

                      // Skip if no data
                      if (!hours) return null;

                      return (
                        <div key={day} className="flex justify-between items-center p-2 bg-base-300 rounded text-[10px] sm:text-xs">
                          <span className="capitalize font-medium">{formatDayName(day)}</span>
                          <span className={isOpen ? '' : 'text-base-content/50'}>
                            {isOpen ? `${hours.open} - ${hours.close}` : 'Closed'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ==================== CONTACT TAB ==================== */}
          {activeTab === "contact" && (
            <motion.div
              key="contact"
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 sm:space-y-6"
            >
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                  <FaPhone className="text-primary text-sm sm:text-base" />
                  Contact Details
                </h3>

                {/* Phone Numbers */}
                {contact.phone?.length > 0 && (
                  <div className="mb-3 sm:mb-4">
                    <p className="text-[10px] sm:text-xs opacity-70 mb-1 sm:mb-2">Phone Numbers</p>
                    <div className="space-y-1 sm:space-y-2">
                      {contact.phone.map((phone, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs sm:text-sm">
                          <FaPhone size={8} className="sm:w-4 sm:h-4 text-primary shrink-0" />
                          <span className="font-medium text-[10px] sm:text-xs wrap-break-word">{phone}</span>
                          {index === 0 && (
                            <span className="badge badge-primary badge-xs sm:badge-sm">Primary</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email & Website - Responsive grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {contact.email && (
                    <div>
                      <p className="text-[10px] sm:text-xs opacity-70">Email</p>
                      <p className="font-medium text-xs sm:text-sm flex items-center gap-2 wrap-break-word">
                        <FaEnvelope size={8} className="sm:w-4 sm:h-4 text-primary shrink-0" />
                        <span className="break-all text-[10px] sm:text-xs">{contact.email}</span>
                      </p>
                    </div>
                  )}
                  {contact.website && (
                    <div>
                      <p className="text-[10px] sm:text-xs opacity-70">Website</p>
                      <a
                        href={contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-xs sm:text-sm flex items-center gap-2 text-primary hover:underline break-all"
                      >
                        <FaGlobe size={8} className="sm:w-4 sm:h-4 shrink-0" />
                        <span className="break-all text-[10px] sm:text-xs">{contact.website}</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Emergency Contact */}
                {contact.emergency && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-base-300">
                    <p className="text-[10px] sm:text-xs opacity-70 mb-1 sm:mb-2">Emergency Contact</p>
                    <div className="flex items-center gap-2 text-error text-xs sm:text-sm">
                      <FaPhone size={8} className="sm:w-4 sm:h-4 shrink-0" />
                      <span className="font-medium text-[10px] sm:text-xs wrap-break-word">{contact.emergency}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== INVENTORY TAB ==================== */}
          {activeTab === "inventory" && (
            <motion.div
              key="inventory"
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 sm:space-y-6"
            >
              {inventory.length > 0 ? (
                <>
                  {/* Inventory Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Total Units Card */}
                    <motion.div
                      className="stat bg-base-200 rounded-lg p-3 sm:p-4"
                      variants={statsVariants}
                      custom={0}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="stat-title text-[10px] sm:text-xs opacity-70">Total Units</div>
                          <div className="stat-value text-sm sm:text-base md:text-lg font-bold">
                            {inventory.reduce((acc, item) => acc + (item.units || 0), 0)}
                          </div>
                        </div>
                        <div className="stat-figure bg-primary/10 p-2 rounded-full">
                          <FaDroplet className="text-primary text-sm sm:text-base" />
                        </div>
                      </div>
                      <p className="stat-desc text-[8px] sm:text-xs mt-2">Across all blood types</p>
                    </motion.div>

                    {/* Low Stock Items Card */}
                    <motion.div
                      className="stat bg-base-200 rounded-lg p-3 sm:p-4"
                      variants={statsVariants}
                      custom={1}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="stat-title text-[10px] sm:text-xs opacity-70">Low Stock Items</div>
                          <div className="stat-value text-sm sm:text-base md:text-lg font-bold text-warning">
                            {inventory.filter(item => (item.units || 0) <= (item.threshold || 0)).length}
                          </div>
                        </div>
                        <div className="stat-figure bg-warning/10 p-2 rounded-full">
                          <FaExclamationTriangle className="text-warning text-sm sm:text-base" />
                        </div>
                      </div>
                      <p className="stat-desc text-[8px] sm:text-xs mt-2">Need immediate attention</p>
                    </motion.div>
                  </div>

                  {/* Inventory Table */}
                  <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                    <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                      <FaBoxes className="text-primary text-sm sm:text-base" />
                      Blood Inventory Details
                    </h3>

                    {/* Responsive table with horizontal scroll */}
                    <div className="overflow-x-auto">
                      <table className="table table-xs sm:table-sm w-full">
                        <thead>
                          <tr className="bg-base-300">
                            <th className="text-[8px] sm:text-xs">Blood Type</th>
                            <th className="text-[8px] sm:text-xs">Units</th>
                            <th className="text-[8px] sm:text-xs">Threshold</th>
                            <th className="text-[8px] sm:text-xs">Status</th>
                            <th className="text-[8px] sm:text-xs hidden md:table-cell">Components</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventory.map((item) => {
                            const status = getInventoryStatus(item.units || 0, item.threshold || 0);
                            const StatusIcon = status.icon;
                            return (
                              <tr key={item.bloodType}>
                                <td className="font-semibold text-[10px] sm:text-xs">{item.bloodType}</td>
                                <td className="text-[10px] sm:text-xs">{item.units || 0}</td>
                                <td className="text-[10px] sm:text-xs">{item.threshold || 0}</td>
                                <td>
                                  <span className={`badge ${status.color} badge-xs sm:badge-sm gap-1`}>
                                    <StatusIcon size={6} className="sm:w-3 sm:h-3" />
                                    <span className="text-[8px] sm:text-xs">{status.status}</span>
                                  </span>
                                </td>
                                <td className="text-[8px] sm:text-xs hidden md:table-cell">
                                  <div className="flex gap-1">
                                    <span className="tooltip" data-tip="Whole Blood">
                                      WB: {item.components?.wholeBlood || 0}
                                    </span>
                                    <span className="text-[6px]">|</span>
                                    <span className="tooltip" data-tip="Plasma">
                                      P: {item.components?.plasma || 0}
                                    </span>
                                    <span className="text-[6px]">|</span>
                                    <span className="tooltip" data-tip="Platelets">
                                      PLT: {item.components?.platelets || 0}
                                    </span>
                                    <span className="text-[6px]">|</span>
                                    <span className="tooltip" data-tip="Red Blood Cells">
                                      RBC: {item.components?.redBloodCells || 0}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile components summary */}
                    <div className="mt-3 md:hidden">
                      <p className="text-[10px] font-medium mb-2">Components Summary:</p>
                      {inventory.map((item) => (
                        <div key={item.bloodType} className="text-[8px] mb-1 p-1 bg-base-300 rounded wrap-break-word">
                          <span className="font-bold">{item.bloodType}:</span> WB:{item.components?.wholeBlood || 0},
                          P:{item.components?.plasma || 0}, PLT:{item.components?.platelets || 0}, RBC:{item.components?.redBloodCells || 0}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                // Empty state
                <motion.div
                  className="bg-base-200 rounded-lg p-6 sm:p-8 text-center"
                  variants={tabContentVariants}
                >
                  <FaBoxes className="text-2xl sm:text-4xl text-base-content/30 mx-auto mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm text-base-content/70">No inventory data available</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ==================== STAFF TAB ==================== */}
          {activeTab === "staff" && (
            <motion.div
              key="staff"
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 sm:space-y-6"
            >
              {staff.length > 0 ? (
                <>
                  {/* Staff Count Card */}
                  <motion.div
                    className="stat bg-base-200 rounded-lg p-3 sm:p-4"
                    variants={statsVariants}
                    custom={0}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="stat-title text-[10px] sm:text-xs opacity-70">Total Staff</div>
                        <div className="stat-value text-sm sm:text-base md:text-lg font-bold">{staff.length}</div>
                      </div>
                      <div className="stat-figure bg-primary/10 p-2 rounded-full">
                        <FaUsers className="text-primary text-sm sm:text-base" />
                      </div>
                    </div>
                    <p className="stat-desc text-[8px] sm:text-xs mt-2">Active members</p>
                  </motion.div>

                  {/* Staff Members List */}
                  <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                    <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                      <FaUsers className="text-primary text-sm sm:text-base" />
                      Staff Members
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {staff.map((member, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-base-300 rounded-lg"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                        >
                          <div className="avatar placeholder">
                            <div className="bg-primary/10 text-primary rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                              <FaUsers size={8} className="sm:w-4 sm:h-4" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[10px] sm:text-xs truncate">
                              User ID: {member.userId}
                            </p>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[8px] sm:text-xs">
                              <span className="badge badge-xs sm:badge-sm">{member.role}</span>
                              {member.department && (
                                <span className="text-base-content/70 truncate">{member.department}</span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                // Empty state
                <motion.div
                  className="bg-base-200 rounded-lg p-6 sm:p-8 text-center"
                  variants={tabContentVariants}
                >
                  <FaUsers className="text-2xl sm:text-4xl text-base-content/30 mx-auto mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm text-base-content/70">No staff members assigned</p>
                </motion.div>
              )}
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
                <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                  <FaShieldAlt className="text-primary text-sm sm:text-base" />
                  Verification Status
                </h3>

                {/* Verification Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Verification Status</p>
                    <div className="mt-1">
                      {getStatusBadge(verification.isVerified)}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Documents</p>
                    <p className="font-medium text-xs sm:text-sm">
                      {verification.documents?.length || 0} uploaded
                    </p>
                  </div>
                </div>

                {/* Verification Timestamp */}
                {verification.verifiedAt && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-base-300">
                    <p className="text-[10px] sm:text-xs opacity-70">Verified On</p>
                    <p className="font-medium text-xs sm:text-sm">{formatDateTime(verification.verifiedAt)}</p>
                  </div>
                )}

                {/* Verified By */}
                {verification.verifiedBy && (
                  <div className="mt-2">
                    <p className="text-[10px] sm:text-xs opacity-70">Verified By</p>
                    <p className="font-medium text-xs sm:text-sm">User ID: {verification.verifiedBy}</p>
                  </div>
                )}

                {/* Verification Documents */}
                {verification.documents?.length > 0 && (
                  <div className="mt-3 sm:mt-4">
                    <p className="text-[10px] sm:text-xs opacity-70 mb-1 sm:mb-2">Verification Documents</p>
                    <div className="space-y-1 sm:space-y-2">
                      {verification.documents.map((doc, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-base-300 rounded text-[10px] sm:text-xs"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                        >
                          <FaFileAlt size={8} className="sm:w-4 sm:h-4 text-primary shrink-0" />
                          <span className="truncate flex-1 text-[8px] sm:text-xs">{doc.name || `Document ${index + 1}`}</span>
                          {doc.verified ? (
                            <FaCheckCircle className="text-success shrink-0 sm:w-4 sm:h-4" size={8} />
                          ) : (
                            <FaTimesCircle className="text-warning shrink-0 sm:w-4 sm:h-4" size={8} />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ==================== FOOTER ==================== */}
      <motion.div
        className="modal-action border-t border-base-300 p-3 sm:p-4 bg-base-200/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <motion.button
          onClick={() => onClose()}
          className="btn btn-primary btn-sm sm:btn-md text-white ml-auto gap-1 sm:gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaHospital size={12} className="sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm">Close</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default ViewBloodBankModal;
// Pages/backend/BloodBank/StaffDashboard/TodayEventsModal/TodayEventsModal.jsx

// React
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";

// Motion
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Icons
import {
  FaTimes,
  FaCalendarAlt,
  FaHeartbeat,
  FaAmbulance,
  FaSearch,
} from "react-icons/fa";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
} from "react-icons/fi";
import { formatAppTime } from "../../../../../utils/dateFormat";

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

/**
 * Format time for display
 */
const formatTime = (value) => {
  return formatAppTime(value);
};

// ==================== CONSTANTS ====================

/**
 * Event type configuration for consistent display
 * Each type has specific icon, colors, and label
 */
const eventTypeConfig = {
  camp: {
    icon: FaCalendarAlt,
    color: "success",
    label: "Blood Camp",
    iconBgClass: "bg-success/10",
    iconTextClass: "text-success",
    badgeClass: "badge-success",
  },
  drive: {
    icon: FaHeartbeat,
    color: "info",
    label: "Blood Drive",
    iconBgClass: "bg-info/10",
    iconTextClass: "text-info",
    badgeClass: "badge-info",
  },
  emergency: {
    icon: FaAmbulance,
    color: "error",
    label: "Emergency",
    iconBgClass: "bg-error/10",
    iconTextClass: "text-error",
    badgeClass: "badge-error",
  },
};

// Default config for unknown types
const defaultEventConfig = {
  icon: FaCalendarAlt,
  color: "info",
  label: "Event",
  iconBgClass: "bg-info/10",
  iconTextClass: "text-info",
  badgeClass: "badge-info",
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
 * Animation variants for header elements
 */
const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: (custom) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 + (custom * 0.1),
      duration: 0.4
    }
  })
};

/**
 * Animation variants for stats cards
 */
const statsVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (custom) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.2 + (custom * 0.1),
      duration: 0.3
    }
  })
};

/**
 * Animation variants for event cards
 */
const eventCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (custom) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.3 + (custom * 0.1),
      duration: 0.4,
      ease: "easeOut"
    }
  }),
  hover: {
    scale: 1.02,
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.02)",
    transition: {
      duration: 0.2
    }
  },
  tap: {
    scale: 0.98
  }
};

/**
 * Animation variants for filter elements
 */
const filterVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.25,
      duration: 0.3
    }
  }
};

/**
 * Animation variants for empty state
 */
const emptyStateVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.4,
      duration: 0.4
    }
  }
};

// ==================== MAIN COMPONENT ====================

/**
 * Today's Events Modal Component
 * Displays all events scheduled for today with search, filter, and statistics
 * 
 * @param {Array} events - List of today's events
 * @param {Function} onClose - Function to close the modal
 */
const TodayEventsModal = ({ events = [], onClose }) => {
  const navigate = useNavigate();

  // ==================== STATE MANAGEMENT ====================

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");

  // ==================== COMPUTED VALUES ====================

  /**
   * Filter events based on search term and type
   * Memoized for performance
   */
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          event.title?.toLowerCase().includes(term) ||
          event.location?.venue?.toLowerCase().includes(term) ||
          event.location?.city?.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      // Type filter
      if (selectedType && event.type !== selectedType) return false;

      return true;
    });
  }, [events, searchTerm, selectedType]);

  /**
   * Calculate event statistics
   */
  const stats = useMemo(() => {
    const totalRegistered = events.reduce((sum, e) => sum + (e.registeredDonors?.length || 0), 0);
    const totalCheckedIn = events.reduce((sum, e) =>
      sum + (e.registeredDonors?.filter(d => d.status === "checked_in" || d.status === "donated").length || 0), 0
    );
    const totalDonated = events.reduce((sum, e) =>
      sum + (e.registeredDonors?.filter(d => d.status === "donated").length || 0), 0
    );

    return {
      totalRegistered,
      totalCheckedIn,
      totalDonated,
      totalEvents: events.length,
    };
  }, [events]);

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
      <motion.div
        className="bg-linear-to-r from-info to-info/80 p-4 sm:p-6 text-white"
        variants={headerVariants}
        custom={0}
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

          {/* Title and icon */}
          <motion.div
            className="flex items-center gap-2 sm:gap-3"
            variants={headerVariants}
            custom={1}
          >
            <div className="bg-white/20 p-2 sm:p-3 rounded-full">
              <FiCalendar size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-xl md:text-2xl">Today's Events</h2>
              <p className="text-white/80 text-xs sm:text-sm">
                {stats.totalEvents} event{stats.totalEvents !== 1 ? 's' : ''} scheduled
              </p>
            </div>
          </motion.div>

          {/* Close button */}
          <motion.button
            onClick={onClose}
            className="btn btn-ghost btn-xs sm:btn-sm btn-circle text-white hover:bg-white/20 self-end sm:self-auto"
            aria-label="Close modal"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            variants={headerVariants}
            custom={2}
          >
            <FaTimes size={14} className="sm:w-5 sm:h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* ==================== STATS SUMMARY ==================== */}
      <motion.div
        className="grid grid-cols-3 gap-1 sm:gap-2 p-3 sm:p-4 bg-base-200/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Registered Stats */}
        <motion.div
          className="text-center"
          variants={statsVariants}
          custom={0}
        >
          <p className="text-[10px] sm:text-xs opacity-70">Registered</p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-warning">{stats.totalRegistered}</p>
        </motion.div>

        {/* Checked In Stats */}
        <motion.div
          className="text-center"
          variants={statsVariants}
          custom={1}
        >
          <p className="text-[10px] sm:text-xs opacity-70">Checked In</p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-info">{stats.totalCheckedIn}</p>
        </motion.div>

        {/* Donated Stats */}
        <motion.div
          className="text-center"
          variants={statsVariants}
          custom={2}
        >
          <p className="text-[10px] sm:text-xs opacity-70">Donated</p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-success">{stats.totalDonated}</p>
        </motion.div>
      </motion.div>

      {/* ==================== SEARCH AND FILTER ==================== */}
      <motion.div
        className="p-3 sm:p-4 border-b border-base-300"
        variants={filterVariants}
      >
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">

          {/* Search Input */}
          <div className="flex-1">
            <div className="form-control">
              <div className="flex">
                <span className="bg-base-200 border border-r-0 border-base-300 flex items-center px-2 sm:px-3 rounded-l-lg">
                  <FaSearch className="text-base-content/50 text-xs sm:text-sm" />
                </span>
                <input
                  type="text"
                  placeholder="Search events..."
                  className="input input-bordered input-sm sm:input-md w-full rounded-l-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Type Filter Dropdown */}
          <div className="w-full sm:w-48">
            <select
              className="select select-bordered select-sm sm:select-md w-full"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="camp">Blood Camp</option>
              <option value="drive">Blood Drive</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* ==================== EVENTS LIST ==================== */}
      <div className="p-3 sm:p-4 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {filteredEvents.length > 0 ? (
            <motion.div
              className="space-y-3 sm:space-y-4"
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {filteredEvents.map((event, index) => {
                const eventId = getId(event._id);
                const typeInfo = eventTypeConfig[event.type] || defaultEventConfig;
                const TypeIcon = typeInfo.icon;
                const registered = event.registeredDonors?.length || 0;
                const checkedIn = event.registeredDonors?.filter(d => d.status === "checked_in" || d.status === "donated").length || 0;
                const pending = registered - checkedIn;

                return (
                  <motion.div
                    key={eventId}
                    variants={eventCardVariants}
                    custom={index}
                    whileHover="hover"
                    whileTap="tap"
                    className="bg-base-200 rounded-lg p-3 sm:p-4"
                  >
                    {/* Event Header */}
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`${typeInfo.iconBgClass} p-1.5 sm:p-2 rounded-full`}>
                          <TypeIcon className={`${typeInfo.iconTextClass} text-xs sm:text-sm sm:w-4 sm:h-4`} size={12} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs sm:text-sm">{event.title}</h4>
                          <span className={`badge ${typeInfo.badgeClass} badge-xs sm:badge-sm mt-1`}>
                            {typeInfo.label}
                          </span>
                        </div>
                      </div>
                      <span className={`badge badge-xs sm:badge-sm ${event.type === 'emergency' ? 'badge-error' : 'badge-info'
                        }`}>
                        {event.status?.current || 'upcoming'}
                      </span>
                    </div>

                    {/* Event Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-[10px] sm:text-xs mb-3">
                      {/* Time */}
                      <div className="flex items-center gap-1">
                        <FiClock className="opacity-50 shrink-0" size={10} />
                        <span className="truncate">{event.schedule?.startTime} - {event.schedule?.endTime}</span>
                      </div>
                      {/* Venue */}
                      <div className="flex items-center gap-1">
                        <FiMapPin className="opacity-50 shrink-0" size={10} />
                        <span className="truncate">{event.location?.venue}</span>
                      </div>
                      {/* City */}
                      <div className="flex items-center gap-1">
                        <FiMapPin className="opacity-50 shrink-0" size={10} />
                        <span className="truncate">{event.location?.city}</span>
                      </div>
                    </div>

                    {/* Donation Stats Grid */}
                    <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-3">
                      <div className="bg-base-300 rounded p-1.5 sm:p-2 text-center">
                        <p className="text-[8px] sm:text-xs opacity-70">Registered</p>
                        <p className="font-bold text-warning text-xs sm:text-sm">{registered}</p>
                      </div>
                      <div className="bg-base-300 rounded p-1.5 sm:p-2 text-center">
                        <p className="text-[8px] sm:text-xs opacity-70">Checked In</p>
                        <p className="font-bold text-info text-xs sm:text-sm">{checkedIn}</p>
                      </div>
                      <div className="bg-base-300 rounded p-1.5 sm:p-2 text-center">
                        <p className="text-[8px] sm:text-xs opacity-70">Pending</p>
                        <p className="font-bold text-error text-xs sm:text-sm">{pending}</p>
                      </div>
                    </div>

                    {/* Pending Check-ins List */}
                    <AnimatePresence>
                      {pending > 0 && (
                        <motion.div
                          className="mt-3 pt-3 border-t border-base-300"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p className="text-[10px] sm:text-xs font-medium mb-2">Pending Check-ins:</p>
                          <div className="space-y-1 sm:space-y-2">
                            {event.registeredDonors
                              ?.filter(d => d.status === "registered")
                              .slice(0, 3)
                              .map((donor, idx) => (
                                <motion.div
                                  key={idx}
                                  className="flex items-center justify-between text-[8px] sm:text-xs"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                >
                                  <span className="truncate max-w-24 sm:max-w-32">{donor.donorName || "Anonymous"}</span>
                                  <span className="text-[8px] sm:text-xs opacity-70">
                                    {formatTime(donor.registrationDate)}
                                  </span>
                                </motion.div>
                              ))}
                            {pending > 3 && (
                              <motion.p
                                className="text-[8px] sm:text-xs opacity-70"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                +{pending - 3} more donors
                              </motion.p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* View Details Button */}
                    <motion.div
                      className="mt-3 flex justify-end"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <button
                        onClick={() => {
                          navigate(`/blood_bank/events-management?event=${eventId}`);
                        }}
                        className="btn btn-xs sm:btn-sm btn-outline gap-1"
                      >
                        <span className="text-[10px] sm:text-xs">View Details</span>
                      </button>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            // Empty State
            <motion.div
              variants={emptyStateVariants}
              initial="hidden"
              animate="visible"
              className="text-center py-8 sm:py-12 text-base-content/70"
            >
              <FiCalendar size={32} className="sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
              <p className="text-sm sm:text-base font-medium mb-1">No events found</p>
              <p className="text-[10px] sm:text-xs">
                {searchTerm || selectedType ? "Try adjusting your filters" : "No events scheduled for today"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ==================== MODAL FOOTER ==================== */}
      <motion.div
        className="modal-action border-t border-base-300 p-3 sm:p-4 bg-base-200/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
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

export default TodayEventsModal;
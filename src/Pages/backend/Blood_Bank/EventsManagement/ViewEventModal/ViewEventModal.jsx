// Pages/backend/BloodBank/EventsManagement/ViewEventModal/ViewEventModal.jsx

// React
import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FaCalendarAlt,
  FaTint,
  FaTimes,
  FaCheckCircle,
  FaHeartbeat,
  FaAmbulance,
  FaUserCheck,
  FaUserPlus,
  FaUserClock,
  FaCheckDouble,
  FaExclamationTriangle,
} from "react-icons/fa";
import {

  FiClock,
  FiMapPin,
  FiUsers,

  FiActivity,
  FiUser,
} from "react-icons/fi";

// Hooks
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";
import BloodLoader from "../../../../../shared/BloodLoader";
import { formatAppDate, formatAppDateTime } from "../../../../../utils/dateFormat";

// ==================== HELPER FUNCTIONS ====================

/**
 * Format date for display
 */
const formatDate = (value) => {
  return formatAppDate(value);
};

/**
 * Format datetime for display
 */
const formatDateTime = (value) => {
  return formatAppDateTime(value);
};

// ==================== CONSTANTS ====================

/**
 * Event type configuration for consistent display
 */
const eventTypeConfig = {
  camp: {
    icon: FaCalendarAlt,
    color: "success",
    label: "Blood Camp",
    headerBg: "from-success to-success/80",
    badge: "badge-success",
    iconBg: "bg-success/10",
    iconText: "text-success",
  },
  drive: {
    icon: FaHeartbeat,
    color: "info",
    label: "Blood Drive",
    headerBg: "from-info to-info/80",
    badge: "badge-info",
    iconBg: "bg-info/10",
    iconText: "text-info",
  },
  emergency: {
    icon: FaAmbulance,
    color: "error",
    label: "Emergency",
    headerBg: "from-error to-error/80",
    badge: "badge-error",
    iconBg: "bg-error/10",
    iconText: "text-error",
  },
};

/**
 * Status configuration for event status
 */
const statusConfig = {
  upcoming: {
    icon: FiClock,
    color: "info",
    label: "Upcoming",
    badge: "badge-info"
  },
  ongoing: {
    icon: FiActivity,
    color: "success",
    label: "Ongoing",
    badge: "badge-success"
  },
  completed: {
    icon: FaCheckCircle,
    color: "success",
    label: "Completed",
    badge: "badge-success"
  },
  cancelled: {
    icon: FaExclamationTriangle,
    color: "error",
    label: "Cancelled",
    badge: "badge-error"
  },
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

const donorItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (custom) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.05,
      duration: 0.3
    }
  })
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
 * View Event Modal Component
 * Displays comprehensive event details including overview, donor list, and requirements
 * 
 * @param {string} eventId - ID of the event to view
 * @param {Function} onClose - Function to close the modal
 */
const ViewEventModal = ({ eventId, onClose }) => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // ==================== STATE MANAGEMENT ====================

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview, donors, requirements

  // ==================== MUTATIONS ====================

  /**
   * Mutation 1: Check-in donor
   */
  const checkInMutation = useMutation({
    mutationFn: async ({ donorId }) => {
      const response = await axiosInstance.patch(
        `/donation-events/${eventId}/checkin/${donorId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
  });

  /**
   * Mutation 2: Complete donation
   */
  const completeMutation = useMutation({
    mutationFn: async ({ donorId }) => {
      const response = await axiosInstance.patch(
        `/donation-events/${eventId}/complete/${donorId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
  });

  // ==================== EFFECTS ====================

  /**
   * Fetch event data when component mounts
   */
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) return;

      setLoading(true);
      try {
        const response = await axiosInstance.get(`/donation-events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data?.success) {
          setEventData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, axiosInstance, token]);

  // ==================== COMPUTED VALUES ====================

  /**
   * Calculate donor statistics
   */
  const donorStats = {
    registered: eventData?.registeredDonors?.filter(d => d.status === "registered").length || 0,
    checkedIn: eventData?.registeredDonors?.filter(d => d.status === "checked_in").length || 0,
    donated: eventData?.registeredDonors?.filter(d => d.status === "donated").length || 0,
    cancelled: eventData?.registeredDonors?.filter(d => d.status === "cancelled").length || 0,
    total: eventData?.registeredDonors?.length || 0,
  };

  // ==================== HANDLER FUNCTIONS ====================

  /**
   * Handle check-in for a donor
   */
  const handleCheckIn = async (donorId, donorName) => {
    try {
      const result = await Swal.fire({
        title: "Check-in Donor",
        text: `Check in ${donorName}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#22c55e",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, check in",
        cancelButtonText: "Cancel",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-success text-white",
          cancelButton: "btn btn-sm",
        },
        buttonsStyling: false,
      });

      if (result.isConfirmed) {
        await checkInMutation.mutateAsync({ donorId });

        // Refresh data
        const response = await axiosInstance.get(`/donation-events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEventData(response.data.data);

        await Swal.fire({
          title: "Checked In!",
          text: `${donorName} has been checked in.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          },
          buttonsStyling: false,
        });
      }
    } catch (error) {
      console.error("Check-in error:", error);
      await Swal.fire({
        title: "Error",
        text: error.response?.data?.error || "Failed to check in donor",
        icon: "error",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error",
        },
        buttonsStyling: false,
      });
    }
  };

  /**
   * Handle complete donation for a donor
   */
  const handleComplete = async (donorId, donorName) => {
    try {
      const result = await Swal.fire({
        title: "Complete Donation",
        text: `Mark ${donorName}'s donation as complete?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#22c55e",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, complete",
        cancelButtonText: "Cancel",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-success text-white",
          cancelButton: "btn btn-sm",
        },
        buttonsStyling: false,
      });

      if (result.isConfirmed) {
        await completeMutation.mutateAsync({ donorId });

        // Refresh data
        const response = await axiosInstance.get(`/donation-events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEventData(response.data.data);

        await Swal.fire({
          title: "Completed!",
          text: `${donorName}'s donation has been recorded.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          },
          buttonsStyling: false,
        });
      }
    } catch (error) {
      console.error("Complete error:", error);
      await Swal.fire({
        title: "Error",
        text: error.response?.data?.error || "Failed to complete donation",
        icon: "error",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error",
        },
        buttonsStyling: false,
      });
    }
  };

  // ==================== LOADING STATE ====================

  if (loading) return <BloodLoader fullscreen={false} />;
  if (!eventData) return null;

  // Get configuration for event type and status
  const event = eventData;
  const typeInfo = eventTypeConfig[event.type] || eventTypeConfig.camp;
  const TypeIcon = typeInfo.icon;
  const statusInfo = statusConfig[event.status?.current] || statusConfig.upcoming;
  const StatusIcon = statusInfo.icon;

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
      <div className={`bg-linear-to-r ${typeInfo.headerBg} p-4 sm:p-6 text-white`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

          {/* Title and icon */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-white/20 p-2 sm:p-3 md:p-4 rounded-full">
              <TypeIcon size={20} className="sm:w-6 sm:h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-xl md:text-2xl truncate max-w-48 sm:max-w-64">
                {event.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {/* Event Type Badge */}
                <span className={`badge ${typeInfo.badge} badge-xs sm:badge-sm gap-1`}>
                  <TypeIcon size={8} className="sm:w-3 sm:h-3" />
                  <span className="text-[10px] sm:text-xs">{typeInfo.label}</span>
                </span>
                {/* Status Badge */}
                <span className={`badge ${statusInfo.badge} badge-xs sm:badge-sm gap-1`}>
                  <StatusIcon size={8} className="sm:w-3 sm:h-3" />
                  <span className="text-[10px] sm:text-xs">{statusInfo.label}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
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
      >
        {/* Capacity Stat */}
        <motion.div
          className="stat py-1 sm:py-2"
          variants={statsVariants}
          custom={0}
        >
          <div className="stat-figure text-info">
            <FiUsers size={10} className="sm:w-4 sm:h-4" />
          </div>
          <div className="stat-title text-[8px] sm:text-xs">Capacity</div>
          <div className="stat-value text-xs sm:text-sm">
            {event.capacity?.currentRegistrations || 0}/{event.capacity?.maxDonors || 0}
          </div>
        </motion.div>

        {/* Checked In Stat */}
        <motion.div
          className="stat py-1 sm:py-2"
          variants={statsVariants}
          custom={1}
        >
          <div className="stat-figure text-success">
            <FaUserCheck size={10} className="sm:w-4 sm:h-4" />
          </div>
          <div className="stat-title text-[8px] sm:text-xs">Checked In</div>
          <div className="stat-value text-xs sm:text-sm">{donorStats.checkedIn}</div>
        </motion.div>

        {/* Donated Stat */}
        <motion.div
          className="stat py-1 sm:py-2"
          variants={statsVariants}
          custom={2}
        >
          <div className="stat-figure text-success">
            <FaCheckDouble size={10} className="sm:w-4 sm:h-4" />
          </div>
          <div className="stat-title text-[8px] sm:text-xs">Donated</div>
          <div className="stat-value text-xs sm:text-sm">{donorStats.donated}</div>
        </motion.div>

        {/* Registered Stat */}
        <motion.div
          className="stat py-1 sm:py-2"
          variants={statsVariants}
          custom={3}
        >
          <div className="stat-figure text-warning">
            <FaUserClock size={10} className="sm:w-4 sm:h-4" />
          </div>
          <div className="stat-title text-[8px] sm:text-xs">Registered</div>
          <div className="stat-value text-xs sm:text-sm">{donorStats.registered}</div>
        </motion.div>
      </motion.div>

      {/* ==================== TABS ==================== */}
      <div className="tabs tabs-boxed bg-base-100 p-1 border-b border-base-300 flex-wrap">
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "overview" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <span className="text-[10px] sm:text-sm">Overview</span>
        </button>
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "donors" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("donors")}
        >
          <span className="text-[10px] sm:text-sm">Donors ({donorStats.total})</span>
        </button>
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "requirements" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("requirements")}
        >
          <span className="text-[10px] sm:text-sm">Requirements</span>
        </button>
      </div>

      {/* ==================== CONTENT ==================== */}
      <div className="p-4 sm:p-6 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto">
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
              {/* Description */}
              {event.description && (
                <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-base-content/80 wrap-break-word">{event.description}</p>
                </div>
              )}

              {/* Schedule */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2 mb-2 sm:mb-3">
                  <FiClock className="text-primary sm:w-4 sm:h-4" size={12} />
                  Schedule
                </h3>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                  {/* Start Date/Time */}
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Start</p>
                    <p className="font-medium text-xs sm:text-sm wrap-break-word">
                      {formatDate(event.schedule?.startDate)}
                      {event.schedule?.startTime && (
                        <span className="block xs:inline xs:ml-1 text-[10px] sm:text-xs opacity-70">
                          at {event.schedule.startTime}
                        </span>
                      )}
                    </p>
                  </div>
                  {/* End Date/Time */}
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">End</p>
                    <p className="font-medium text-xs sm:text-sm wrap-break-word">
                      {formatDate(event.schedule?.endDate)}
                      {event.schedule?.endTime && (
                        <span className="block xs:inline xs:ml-1 text-[10px] sm:text-xs opacity-70">
                          at {event.schedule.endTime}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2 mb-2 sm:mb-3">
                  <FiMapPin className="text-primary sm:w-4 sm:h-4" size={12} />
                  Location
                </h3>
                <div className="space-y-1">
                  <p className="font-medium text-xs sm:text-sm wrap-break-word">{event.location?.venue}</p>
                  {event.location?.address && (
                    <p className="text-[10px] sm:text-xs text-base-content/70 wrap-break-word">{event.location?.address}</p>
                  )}
                  {event.location?.city && (
                    <p className="text-[10px] sm:text-xs text-base-content/70">{event.location?.city}</p>
                  )}
                </div>
              </div>

              {/* Organizer */}
              {event.organizer && (
                <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2 mb-2 sm:mb-3">
                    <FiUser className="text-primary sm:w-4 sm:h-4" size={12} />
                    Organized By
                  </h3>
                  <p className="font-medium text-xs sm:text-sm wrap-break-word">{event.organizer.name}</p>
                  <p className="text-[10px] sm:text-xs text-base-content/70 wrap-break-word">{event.organizer.email}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ==================== DONORS TAB ==================== */}
          {activeTab === "donors" && (
            <motion.div
              key="donors"
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-3 sm:space-y-4"
            >
              {donorStats.total > 0 ? (
                <motion.div
                  className="space-y-2 sm:space-y-3"
                  initial="hidden"
                  animate="visible"
                >
                  {event.registeredDonors.map((donor, index) => (
                    <motion.div
                      key={index}
                      variants={donorItemVariants}
                      custom={index}
                      className="bg-base-200 rounded-lg p-3 sm:p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                        {/* Donor Info */}
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-primary/10 text-primary rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                              <FaUserPlus size={12} className="sm:w-4 sm:h-4" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-xs sm:text-sm">{donor.donorName || "Anonymous Donor"}</p>
                            <p className="text-[10px] sm:text-xs opacity-70">
                              Blood Group: {donor.donorBloodGroup || "Unknown"}
                            </p>
                          </div>
                        </div>

                        {/* Status and Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {/* Status Badge */}
                          <span className={`badge badge-xs sm:badge-sm ${donor.status === "donated" ? "badge-success" :
                            donor.status === "checked_in" ? "badge-info" :
                              donor.status === "cancelled" ? "badge-error" :
                                "badge-warning"
                            }`}>
                            {donor.status}
                          </span>

                          {/* Check-in Button (for ongoing events with registered donors) */}
                          {event.status?.current === "ongoing" && donor.status === "registered" && (
                            <button
                              onClick={() => handleCheckIn(donor.donorId, donor.donorName || "Donor")}
                              className="btn btn-success btn-xs sm:btn-sm"
                              disabled={checkInMutation.isPending}
                            >
                              Check In
                            </button>
                          )}

                          {/* Complete Button (for ongoing events with checked-in donors) */}
                          {event.status?.current === "ongoing" && donor.status === "checked_in" && (
                            <button
                              onClick={() => handleComplete(donor.donorId, donor.donorName || "Donor")}
                              className="btn btn-success btn-xs sm:btn-sm"
                              disabled={completeMutation.isPending}
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                // Empty State
                <motion.div
                  className="text-center py-6 sm:py-8 text-base-content/70"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <FiUsers size={32} className="sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                  <p className="text-xs sm:text-sm">No donors registered yet</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ==================== REQUIREMENTS TAB ==================== */}
          {activeTab === "requirements" && (
            <motion.div
              key="requirements"
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 sm:space-y-6"
            >
              {/* Blood Types */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2 mb-2 sm:mb-3">
                  <FaTint className="text-primary sm:w-4 sm:h-4" size={12} />
                  Accepted Blood Types
                </h3>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {event.requirements?.bloodTypes?.map((type) => (
                    <span key={type} className="badge badge-error badge-xs sm:badge-sm p-2 sm:p-3">
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Donor Requirements */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2 mb-2 sm:mb-3">
                  <FiUser className="text-primary sm:w-4 sm:h-4" size={12} />
                  Donor Requirements
                </h3>
                <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Minimum Age</p>
                    <p className="font-medium text-xs sm:text-sm">{event.requirements?.minAge || 18} years</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Maximum Age</p>
                    <p className="font-medium text-xs sm:text-sm">{event.requirements?.maxAge || 65} years</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs opacity-70">Minimum Weight</p>
                    <p className="font-medium text-xs sm:text-sm">{event.requirements?.minWeight || 50} kg</p>
                  </div>
                </div>
              </div>

              {/* Event Timeline */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2 mb-2 sm:mb-3">
                  <FaCalendarAlt className="text-primary sm:w-4 sm:h-4" size={12} />
                  Event Timeline
                </h3>
                <div className="space-y-1 sm:space-y-2">
                  <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center text-[10px] sm:text-xs">
                    <span className="opacity-70">Created:</span>
                    <span className="font-medium wrap-break-word">{formatDateTime(event.createdAt)}</span>
                  </div>
                  <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center text-[10px] sm:text-xs">
                    <span className="opacity-70">Last Updated:</span>
                    <span className="font-medium wrap-break-word">{formatDateTime(event.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ==================== MODAL FOOTER ==================== */}
      <div className="modal-action border-t border-base-300 p-3 sm:p-4 bg-base-200/50">
        <button
          onClick={onClose}
          className="btn btn-primary btn-sm sm:btn-md text-white ml-auto gap-1 sm:gap-2"
        >
          <span className="text-xs sm:text-sm">Close</span>
        </button>
      </div>
    </motion.div>
  );
};

export default ViewEventModal;
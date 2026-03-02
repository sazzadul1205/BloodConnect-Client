// Pages/backend/BloodBank/EventsManagement/DonorListModal/DonorListModal.jsx

// React
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Icons
import {
  FaTimes,
  FaUser,
  FaTint,
  FaTimesCircle,
  FaUserCheck,
  FaUserClock,
  FaCheckDouble,
} from "react-icons/fa";
import { FiUsers, FiCalendar } from "react-icons/fi";

// Hooks
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";
import BloodLoader from "../../../../../shared/BloodLoader";

// ==================== HELPER FUNCTIONS ====================

/**
 * Format date for display
 */
const formatDateTime = (value) => {
  if (!value) return "N/A";
  try {
    const date = new Date(value?.$date || value);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
};

// ==================== QUERY KEYS ====================

const queryKeys = {
  eventDetails: (eventId) => ['event-details', eventId],
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

const filterButtonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};

// ==================== MAIN COMPONENT ====================

/**
 * Donor List Modal Component
 * Displays list of donors registered for an event with filtering by status
 * 
 * @param {string} eventId - ID of the event
 * @param {Function} onClose - Function to close the modal
 */
const DonorListModal = ({ eventId, onClose }) => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // ==================== STATE MANAGEMENT ====================

  const [filter, setFilter] = useState("all"); // all, registered, checked_in, donated, cancelled

  // ==================== TANSTACK QUERY ====================

  /**
   * Query: Fetch event details including donor list
   */
  const {
    data: eventData,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.eventDetails(eventId),
    enabled: !!eventId,
    queryFn: async () => {
      const response = await axiosInstance.get(`/donation-events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error("Failed to fetch event data");
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // ==================== COMPUTED VALUES ====================

  /**
   * Filter donors based on selected status
   */
  const filteredDonors = eventData?.registeredDonors?.filter(donor => {
    if (filter === "all") return true;
    return donor.status === filter;
  }) || [];

  /**
   * Get status counts for filter buttons
   */
  const counts = {
    all: eventData?.registeredDonors?.length || 0,
    registered: eventData?.registeredDonors?.filter(d => d.status === "registered").length || 0,
    checked_in: eventData?.registeredDonors?.filter(d => d.status === "checked_in").length || 0,
    donated: eventData?.registeredDonors?.filter(d => d.status === "donated").length || 0,
    cancelled: eventData?.registeredDonors?.filter(d => d.status === "cancelled").length || 0,
  };

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Get status badge component based on donor status
   */
  const getStatusBadge = (status) => {
    switch (status) {
      case "registered":
        return (
          <span className="badge badge-warning badge-xs sm:badge-sm gap-1">
            <FaUserClock size={8} className="sm:w-3 sm:h-3" />
            <span className="text-[10px] sm:text-xs">Registered</span>
          </span>
        );
      case "checked_in":
        return (
          <span className="badge badge-info badge-xs sm:badge-sm gap-1">
            <FaUserCheck size={8} className="sm:w-3 sm:h-3" />
            <span className="text-[10px] sm:text-xs">Checked In</span>
          </span>
        );
      case "donated":
        return (
          <span className="badge badge-success badge-xs sm:badge-sm gap-1">
            <FaCheckDouble size={8} className="sm:w-3 sm:h-3" />
            <span className="text-[10px] sm:text-xs">Donated</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="badge badge-error badge-xs sm:badge-sm gap-1">
            <FaTimesCircle size={8} className="sm:w-3 sm:h-3" />
            <span className="text-[10px] sm:text-xs">Cancelled</span>
          </span>
        );
      default:
        return <span className="badge badge-ghost badge-xs sm:badge-sm">{status}</span>;
    }
  };

  // ==================== LOADING & ERROR STATES ====================

  if (isLoading) return <BloodLoader fullscreen={false} />;

  if (error || !eventData) {
    return (
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="modal-box w-11/12 max-w-3xl p-6 bg-base-100 mx-2 sm:mx-0"
      >
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FaTimesCircle className="text-4xl text-error mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Donors</h3>
          <p className="text-base-content/70 mb-4">
            {error?.message || "Could not load donor list. Please try again."}
          </p>
          <button
            onClick={onClose}
            className="btn btn-primary btn-sm"
          >
            Close
          </button>
        </div>
      </motion.div>
    );
  }

  // ==================== RENDER ====================

  return (
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="modal-box w-11/12 max-w-3xl p-0 overflow-hidden bg-base-100 mx-2 sm:mx-0"
    >

      {/* ==================== MODAL HEADER ==================== */}
      <div className="bg-linear-to-r from-primary to-primary/80 p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

          {/* Title and icon */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-white/20 p-2 sm:p-3 rounded-full">
              <FiUsers size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-2xl">Registered Donors</h2>
              <p className="text-white/80 text-xs sm:text-sm truncate max-w-48 sm:max-w-64">
                {eventData.title}
              </p>
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

      {/* ==================== FILTER TABS ==================== */}
      <div className="flex flex-wrap gap-2 p-3 sm:p-4 border-b border-base-300">
        {/* All Filter Button */}
        <motion.button
          variants={filterButtonVariants}
          whileHover="hover"
          whileTap="tap"
          className={`btn btn-xs sm:btn-sm ${filter === "all" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setFilter("all")}
        >
          <span className="text-[10px] sm:text-xs">All ({counts.all})</span>
        </motion.button>

        {/* Registered Filter Button */}
        <motion.button
          variants={filterButtonVariants}
          whileHover="hover"
          whileTap="tap"
          className={`btn btn-xs sm:btn-sm ${filter === "registered" ? "btn-warning" : "btn-outline"}`}
          onClick={() => setFilter("registered")}
        >
          <span className="text-[10px] sm:text-xs">Registered ({counts.registered})</span>
        </motion.button>

        {/* Checked In Filter Button */}
        <motion.button
          variants={filterButtonVariants}
          whileHover="hover"
          whileTap="tap"
          className={`btn btn-xs sm:btn-sm ${filter === "checked_in" ? "btn-info" : "btn-outline"}`}
          onClick={() => setFilter("checked_in")}
        >
          <span className="text-[10px] sm:text-xs">Checked In ({counts.checked_in})</span>
        </motion.button>

        {/* Donated Filter Button */}
        <motion.button
          variants={filterButtonVariants}
          whileHover="hover"
          whileTap="tap"
          className={`btn btn-xs sm:btn-sm ${filter === "donated" ? "btn-success" : "btn-outline"}`}
          onClick={() => setFilter("donated")}
        >
          <span className="text-[10px] sm:text-xs">Donated ({counts.donated})</span>
        </motion.button>

        {/* Cancelled Filter Button */}
        <motion.button
          variants={filterButtonVariants}
          whileHover="hover"
          whileTap="tap"
          className={`btn btn-xs sm:btn-sm ${filter === "cancelled" ? "btn-error" : "btn-outline"}`}
          onClick={() => setFilter("cancelled")}
        >
          <span className="text-[10px] sm:text-xs">Cancelled ({counts.cancelled})</span>
        </motion.button>
      </div>

      {/* ==================== DONORS LIST ==================== */}
      <div className="p-3 sm:p-4 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {filteredDonors.length > 0 ? (
            <motion.div
              className="space-y-2 sm:space-y-3"
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {filteredDonors.map((donor, index) => (
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
                        <div className="bg-primary/10 text-primary rounded-full w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center">
                          <FaUser size={12} className="sm:w-4 sm:h-4" />
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-xs sm:text-sm">{donor.donorName || "Anonymous Donor"}</p>
                        <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-3 text-[10px] sm:text-xs mt-1">
                          {/* Blood Type */}
                          <span className="flex items-center gap-1">
                            <FaTint className="text-error sm:w-3 sm:h-3" size={8} />
                            {donor.donorBloodGroup || "Unknown"}
                          </span>
                          {/* Registration Date */}
                          <span className="flex items-center gap-1">
                            <FiCalendar className="opacity-50 sm:w-3 sm:h-3" size={8} />
                            {formatDateTime(donor.registrationDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="self-end sm:self-auto">
                      {getStatusBadge(donor.status)}
                    </div>
                  </div>

                  {/* Additional Info (Check-in Time, Donation ID) */}
                  {donor.checkInTime && (
                    <div className="mt-2 pt-2 border-t border-base-300 text-[10px] sm:text-xs">
                      <span className="opacity-70">Checked in:</span> {formatDateTime(donor.checkInTime)}
                    </div>
                  )}

                  {donor.donationId && (
                    <div className="mt-1 text-[10px] sm:text-xs">
                      <span className="opacity-70">Donation ID:</span> {donor.donationId.slice(-8)}
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          ) : (
            // Empty State
            <motion.div
              className="text-center py-8 sm:py-12 text-base-content/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FiUsers size={32} className="sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
              <p className="text-sm sm:text-base font-medium mb-1">No donors found</p>
              <p className="text-[10px] sm:text-xs">
                {filter !== "all"
                  ? `No donors with status "${filter}"`
                  : "No donors registered for this event yet"}
              </p>
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

export default DonorListModal;
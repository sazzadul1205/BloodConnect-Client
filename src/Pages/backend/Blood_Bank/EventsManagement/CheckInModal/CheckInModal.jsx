// Pages/backend/BloodBank/EventsManagement/CheckInModal/CheckInModal.jsx

// React
import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FaTimes,
  FaUserCheck,
  FaExclamationTriangle,
  FaSearch,
  FaUserPlus,
  FaCheckDouble,
} from "react-icons/fa";
import { FiUser, FiClock, FiDroplet } from "react-icons/fi";

// Hooks
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";
import BloodLoader from "../../../../../shared/BloodLoader";
import { formatAppTime } from "../../../../../utils/dateFormat";

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

const statsVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (custom) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.1 + custom * 0.1,
      duration: 0.3
    }
  })
};

// ==================== MAIN COMPONENT ====================

/**
 * Check-in Modal Component
 * Allows staff to check in donors and complete donations for an ongoing event
 * 
 * @param {string} eventId - ID of the event
 * @param {Function} onClose - Function to close the modal
 * @param {Function} refreshEvents - Function to refresh events list
 */
const CheckInModal = ({ eventId, onClose, refreshEvents }) => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // ==================== STATE MANAGEMENT ====================

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // ==================== MUTATIONS ====================

  /**
   * Mutation 1: Check-in donor
   */
  const checkInMutation = useMutation({
    mutationFn: async (donorId) => {
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
    mutationFn: async (donorId) => {
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
   * Filter donors by search term
   */
  const filteredDonors = eventData?.registeredDonors?.filter(donor => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (donor.donorName?.toLowerCase().includes(term)) ||
      (donor.donorBloodGroup?.toLowerCase().includes(term))
    );
  }) || [];

  /**
   * Calculate donor statistics
   */
  const donorStats = {
    registered: eventData?.registeredDonors?.filter(d => d.status === "registered").length || 0,
    checkedIn: eventData?.registeredDonors?.filter(d => d.status === "checked_in").length || 0,
    donated: eventData?.registeredDonors?.filter(d => d.status === "donated").length || 0,
    cancelled: eventData?.registeredDonors?.filter(d => d.status === "cancelled").length || 0,
  };

  // ==================== HANDLER FUNCTIONS ====================

  /**
   * Handle check-in for a donor
   */
  const handleCheckIn = async (donor) => {
    setActionLoading(true);
    try {
      await checkInMutation.mutateAsync(donor.donorId);

      // Refresh data
      const response = await axiosInstance.get(`/donation-events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEventData(response.data.data);
      refreshEvents?.();

      await Swal.fire({
        title: "Checked In!",
        text: `${donor.donorName || "Donor"} has been checked in.`,
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
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Handle complete donation for a donor
   */
  const handleComplete = async (donor) => {
    setActionLoading(true);
    try {
      await completeMutation.mutateAsync(donor.donorId);

      // Refresh data
      const response = await axiosInstance.get(`/donation-events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEventData(response.data.data);
      refreshEvents?.();

      await Swal.fire({
        title: "Completed!",
        text: `${donor.donorName || "Donor"}'s donation has been recorded.`,
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
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== LOADING STATE ====================

  if (loading) return <BloodLoader fullscreen={false} />;
  if (!eventData) return null;

  // Check if event is ongoing (only ongoing events can have check-ins)
  const canCheckIn = eventData.status?.current === "ongoing";

  // ==================== RENDER ====================

  return (
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="modal-box w-11/12 max-w-2xl p-0 overflow-hidden bg-base-100 mx-2 sm:mx-0"
    >

      {/* ==================== MODAL HEADER ==================== */}
      <div className="bg-linear-to-r from-success to-success/80 p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

          {/* Title and icon */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-white/20 p-2 sm:p-3 rounded-full">
              <FaUserCheck size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-2xl">Check-in Donors</h2>
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

      {/* ==================== NOT ONGOING STATE ==================== */}
      <AnimatePresence>
        {!canCheckIn && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-4 sm:p-6 text-center"
          >
            <FaExclamationTriangle className="text-warning text-2xl sm:text-4xl mx-auto mb-3" />
            <p className="text-base sm:text-lg font-medium mb-2">Event is not ongoing</p>
            <p className="text-xs sm:text-sm text-base-content/70 mb-4">
              Check-in is only available for ongoing events.
            </p>
            <button onClick={onClose} className="btn btn-primary btn-sm sm:btn-md">
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {canCheckIn && (
        <>
          {/* ==================== SEARCH INPUT ==================== */}
          <div className="p-3 sm:p-4 border-b border-base-300">
            <div className="form-control">
              <div className="flex">
                <span className="bg-base-200 border border-r-0 border-base-300 flex items-center px-2 sm:px-3 rounded-l-lg">
                  <FaSearch className="text-base-content/50 text-xs sm:text-sm" />
                </span>
                <input
                  type="text"
                  placeholder="Search donors by name or blood type..."
                  className="input input-bordered input-sm sm:input-md w-full rounded-l-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ==================== DONOR STATS ==================== */}
          <motion.div
            className="grid grid-cols-3 gap-1 sm:gap-2 p-3 sm:p-4 bg-base-200/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Registered Stat */}
            <motion.div
              className="text-center"
              variants={statsVariants}
              custom={0}
            >
              <p className="text-[10px] sm:text-xs opacity-70">Registered</p>
              <p className="text-base sm:text-lg md:text-xl font-bold text-warning">{donorStats.registered}</p>
            </motion.div>

            {/* Checked In Stat */}
            <motion.div
              className="text-center"
              variants={statsVariants}
              custom={1}
            >
              <p className="text-[10px] sm:text-xs opacity-70">Checked In</p>
              <p className="text-base sm:text-lg md:text-xl font-bold text-info">{donorStats.checkedIn}</p>
            </motion.div>

            {/* Donated Stat */}
            <motion.div
              className="text-center"
              variants={statsVariants}
              custom={2}
            >
              <p className="text-[10px] sm:text-xs opacity-70">Donated</p>
              <p className="text-base sm:text-lg md:text-xl font-bold text-success">{donorStats.donated}</p>
            </motion.div>
          </motion.div>

          {/* ==================== DONORS LIST ==================== */}
          <div className="p-3 sm:p-4 max-h-[35vh] sm:max-h-[40vh] overflow-y-auto">
            {filteredDonors.length > 0 ? (
              <motion.div
                className="space-y-2 sm:space-y-3"
                initial="hidden"
                animate="visible"
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
                          <div className="bg-primary/10 text-primary rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                            <FiUser size={12} className="sm:w-4 sm:h-4" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-xs sm:text-sm">{donor.donorName || "Anonymous Donor"}</p>
                          <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 text-[10px] sm:text-xs">
                            {/* Blood Type */}
                            <span className="flex items-center gap-1">
                              <FiDroplet size={8} className="sm:w-3 sm:h-3 text-error" />
                              {donor.donorBloodGroup || "Unknown"}
                            </span>
                            {/* Registration Time */}
                            <span className="flex items-center gap-1">
                              <FiClock size={8} className="sm:w-3 sm:h-3 opacity-50" />
                              {formatAppTime(donor.registrationDate)}
                            </span>
                          </div>
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

                        {/* Action Buttons */}
                        {donor.status === "registered" && (
                          <button
                            onClick={() => handleCheckIn(donor)}
                            className="btn btn-success btn-xs sm:btn-sm"
                            disabled={actionLoading}
                          >
                            Check In
                          </button>
                        )}

                        {donor.status === "checked_in" && (
                          <button
                            onClick={() => handleComplete(donor)}
                            className="btn btn-success btn-xs sm:btn-sm gap-1"
                            disabled={actionLoading}
                          >
                            <FaCheckDouble size={8} className="sm:w-3 sm:h-3" />
                            <span className="text-[10px] sm:text-xs">Complete</span>
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
                <FaUserPlus size={32} className="sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                <p className="text-xs sm:text-sm">No donors found</p>
                {searchTerm && (
                  <p className="text-[10px] sm:text-xs mt-2">Try adjusting your search</p>
                )}
              </motion.div>
            )}
          </div>

          {/* ==================== MODAL FOOTER ==================== */}
          <div className="modal-action border-t border-base-300 p-3 sm:p-4 bg-base-200/50">
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm sm:btn-md ml-auto"
            >
              <span className="text-xs sm:text-sm">Close</span>
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default CheckInModal;
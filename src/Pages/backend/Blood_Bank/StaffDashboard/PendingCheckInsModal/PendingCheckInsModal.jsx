// Pages/backend/BloodBank/StaffDashboard/PendingCheckInsModal/PendingCheckInsModal.jsx

// React
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FaTimes,
  FaUser,
  FaClock,
  FaCheckCircle,
  FaSearch,
} from "react-icons/fa";
import { FiClock, FiCalendar, FiDroplet } from "react-icons/fi";
import { formatAppTime } from "../../../../../utils/dateFormat";

// ==================== HELPER FUNCTIONS ====================

/**
 * Format time for display
 */
const formatTime = (value) => {
  return formatAppTime(value);
};

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

// ==================== ANIMATION VARIANTS ====================

const fadeInUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

// ==================== MAIN COMPONENT ====================

const PendingCheckInsModal = ({ pendingCheckIns, onClose }) => {
  const navigate = useNavigate();

  // ==================== STATE MANAGEMENT ====================

  const [searchTerm, setSearchTerm] = useState("");

  // ==================== COMPUTED VALUES ====================

  /**
   * Filter pending check-ins by search term
   * Memoized for performance
   */
  const filteredCheckIns = useMemo(() => {
    if (!pendingCheckIns) return [];
    if (!searchTerm) return pendingCheckIns;

    const term = searchTerm.toLowerCase();
    return pendingCheckIns.filter(donor => {
      return (
        (donor.donorName?.toLowerCase().includes(term)) ||
        (donor.eventTitle?.toLowerCase().includes(term))
      );
    });
  }, [pendingCheckIns, searchTerm]);

  /**
   * Calculate unique events count
   */
  const uniqueEventsCount = useMemo(() => {
    if (!pendingCheckIns) return 0;
    return new Set(pendingCheckIns.map(d => d.eventId)).size;
  }, [pendingCheckIns]);

  // ==================== RENDER ====================

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="md:modal-box w-11/12 max-w-3xl p-0 overflow-hidden bg-base-100 mx-2 sm:mx-0"
    >

      {/* ==================== MODAL HEADER ==================== */}
      {/* Gradient header with warning theme for pending items */}
      <div className="bg-linear-to-r from-warning to-warning/80 p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

          {/* Title and icon */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-white/20 p-2 sm:p-3 rounded-full">
              <FaClock size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-2xl">Pending Check-ins</h2>
              <p className="text-white/80 text-xs sm:text-sm">
                {pendingCheckIns?.length || 0} donor{pendingCheckIns?.length !== 1 ? 's' : ''} waiting
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

      {/* ==================== SEARCH SECTION ==================== */}
      <div className="p-3 sm:p-4 border-b border-base-300">
        <div className="form-control">
          <div className="flex">
            {/* Search icon */}
            <span className="bg-base-200 border border-r-0 border-base-300 flex items-center px-2 sm:px-3 rounded-l-lg">
              <FaSearch className="text-base-content/50 text-xs sm:text-sm" />
            </span>

            {/* Search input */}
            <input
              type="text"
              placeholder="Search by donor name or event..."
              className="input input-bordered input-sm sm:input-md w-full rounded-l-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ==================== STATS SUMMARY ==================== */}
      {/* Responsive grid: 3 columns */}
      <div className="grid grid-cols-3 gap-1 sm:gap-2 p-3 sm:p-4 bg-base-200/50">

        {/* Total Pending Stat */}
        <div className="text-center">
          <p className="text-[10px] sm:text-xs opacity-70">Total Pending</p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-warning">
            {pendingCheckIns?.length || 0}
          </p>
        </div>

        {/* Unique Events Stat */}
        <div className="text-center">
          <p className="text-[10px] sm:text-xs opacity-70">Events Today</p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-info">
            {uniqueEventsCount}
          </p>
        </div>

        {/* Filtered Results Stat */}
        <div className="text-center">
          <p className="text-[10px] sm:text-xs opacity-70">Showing</p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-success">
            {filteredCheckIns.length}
          </p>
        </div>
      </div>

      {/* ==================== DONORS LIST ==================== */}
      {/* Scrollable area for donors */}
      <div className="p-3 sm:p-4 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto">

        {filteredCheckIns.length > 0 ? (
          // Donors exist - show list
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-2 sm:space-y-3"
          >
            {filteredCheckIns.map((donor, index) => (
              <motion.div
                key={`${getId(donor.eventId) || "event"}-${getId(donor.donorId) || donor.donorName || index}`}
                variants={fadeInUp}
                className="bg-base-200 rounded-lg p-3 sm:p-4"
              >
                {/* Donor Info Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                  {/* Donor Avatar and Details */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Avatar */}
                    <div className="avatar placeholder">
                      <div className="bg-warning/10 text-warning rounded-full w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center">
                        <FaUser size={12} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
                      </div>
                    </div>

                    {/* Donor Information */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs sm:text-sm truncate max-w-40 sm:max-w-full">
                        {donor.donorName || "Anonymous Donor"}
                      </p>
                      <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-3 text-[10px] sm:text-xs mt-1">
                        {/* Event Title */}
                        <span className="flex items-center gap-1 truncate max-w-32 sm:max-w-40">
                          <FiCalendar className="opacity-50 shrink-0" size={10} />
                          <span className="truncate">{donor.eventTitle}</span>
                        </span>

                        {/* Registration Time */}
                        <span className="flex items-center gap-1">
                          <FiClock className="opacity-50 shrink-0" size={10} />
                          <span>Registered: {formatTime(donor.registrationDate)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Check In Button */}
                  <button
                    onClick={() => {
                      const eventId = getId(donor.eventId);
                      navigate(`/blood_bank/events-management${eventId ? `?event=${eventId}` : ""}`);
                    }}
                    className="btn btn-warning btn-xs sm:btn-sm gap-1 sm:gap-2 w-full sm:w-auto"
                  >
                    <FaCheckCircle size={10} className="sm:w-4 sm:h-4" />
                    <span className="text-[10px] sm:text-xs">Check In</span>
                  </button>
                </div>

                {/* Blood Type (if available) */}
                {donor.donorBloodGroup && (
                  <div className="mt-2 pt-2 border-t border-base-300 text-[10px] sm:text-xs">
                    <span className="flex items-center gap-1">
                      <FiDroplet className="text-error shrink-0" size={10} />
                      <span>Blood Type: <span className="font-semibold">{donor.donorBloodGroup}</span></span>
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        ) : (
          // Empty State
          <div className="text-center py-8 sm:py-12 text-base-content/70">
            <FaClock size={32} className="sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
            <p className="text-sm sm:text-base font-medium mb-1">No pending check-ins</p>
            <p className="text-[10px] sm:text-xs">
              {searchTerm ? "Try adjusting your search" : "All donors have been checked in"}
            </p>
          </div>
        )}
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

export default PendingCheckInsModal;
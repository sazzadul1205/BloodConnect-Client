// Pages/backend/Donor/DonationHistory/DonationDetailsModal/DonationDetailsModal.jsx

/**
 * DonationDetailsModal Component
 * 
 * Displays detailed information about a specific blood donation record.
 * Features:
 * - Comprehensive donation information display
 * - Blood bank details with ID and name
 * - Timeline information for eligibility tracking
 * - Responsive design for mobile/tablet/desktop
 * - SweetAlert2 integration for confirmations
 * - Framer Motion animations for smooth transitions
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.selectedDonation - The donation record to display
 * @param {Function} props.formatDate - Function to format date with time
 * @param {Function} props.formatDateOnly - Function to format date only
 * @param {Function} props.formatDonationType - Function to format donation type
 * @param {Function} props.onClose - Callback when modal closes
 * @param {boolean} props.isMobile - Flag indicating mobile viewport
 */

// React and Core Libraries
import React, { useState, useEffect } from "react";

// Animation
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons - Organized by category for better maintainability
import {
  // Action icons
  FiActivity,
  FiAlertCircle,
  FiClock,
  FiX,
  FiCopy,
  FiCheckCircle,
} from "react-icons/fi";

import {
  FaTint,
  FaHospital,
  FaHeartbeat,
  FaFlask,
  FaMapMarkerAlt,
  FaNotesMedical,
  FaShieldAlt,
  FaCheckCircle as FaCheckCircleSolid,
  FaExclamationTriangle,
  FaTimes,
} from "react-icons/fa";

const DonationDetailsModal = ({
  selectedDonation,
  formatDate,
  formatDateOnly,
  formatDonationType,
  onClose,
  isMobile = false,
}) => {
  // ==========================================================================
  // State Management
  // ==========================================================================

  const [copySuccess, setCopySuccess] = useState("");
  const [activeTab, setActiveTab] = useState("details"); // 'details' or 'timeline'

  // ==========================================================================
  // Responsive Detection
  // ==========================================================================

  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 640 && width < 1024);
    };

    checkTablet();
    window.addEventListener('resize', checkTablet);

    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  // Return null if no donation selected
  if (!selectedDonation) return null;

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  /**
   * Gets donation type icon and color
   * @param {string} type - Donation type
   * @returns {Object} Icon component and color class
   */
  const getDonationTypeIcon = (type) => {
    switch (type) {
      case "whole_blood":
        return { icon: FaTint, color: "error", bgColor: "bg-error/10" };
      case "plasma":
        return { icon: FaFlask, color: "info", bgColor: "bg-info/10" };
      case "platelets":
        return { icon: FaHeartbeat, color: "warning", bgColor: "bg-warning/10" };
      default:
        return { icon: FaTint, color: "error", bgColor: "bg-error/10" };
    }
  };

  /**
   * Formats blood bank ID for display
   * @param {Object|string} bankId - Blood bank ID
   * @returns {string} Formatted ID
   */
  const formatBloodBankId = (bankId) => {
    if (!bankId) return "N/A";
    if (typeof bankId === "object") {
      return bankId.$oid || JSON.stringify(bankId);
    }
    return bankId;
  };

  /**
   * Copies blood bank ID to clipboard
   */
  const copyToClipboard = async () => {
    const bankId = formatBloodBankId(selectedDonation.bloodBankId);
    try {
      await navigator.clipboard.writeText(bankId);
      setCopySuccess("Copied!");

      // Show success toast
      Swal.fire({
        title: "Copied!",
        text: "Blood Bank ID copied to clipboard",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: isMobile ? 'top' : 'bottom-end',
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      });

      setTimeout(() => setCopySuccess(""), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  /**
   * Gets status badge based on donation details
   * @returns {Object} Status badge configuration
   */
  const getStatusBadge = () => {
    if (selectedDonation.reaction && selectedDonation.reaction !== "None") {
      return {
        text: "Reaction Reported",
        icon: FaExclamationTriangle,
        color: "warning",
        bgColor: "bg-warning/10",
        textColor: "text-warning",
      };
    }
    return {
      text: "Successful",
      icon: FaCheckCircleSolid,
      color: "success",
      bgColor: "bg-success/10",
      textColor: "text-success",
    };
  };

  const typeDetails = getDonationTypeIcon(selectedDonation.type);
  const TypeIcon = typeDetails.icon;
  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  // ==========================================================================
  // Animation Variants
  // ==========================================================================

  const tabVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  };

  // ==========================================================================
  // Render Component
  // ==========================================================================

  return (
    <div
      className={`
        ${isMobile
          ? 'modal-box w-full max-w-full h-screen max-h-screen rounded-none p-0'
          : 'modal-box w-11/12 max-w-2xl p-0'
        }
        overflow-hidden bg-base-100
      `}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ==================================================================
          Header Section - Responsive gradient background
      ================================================================== */}
      <div className={`bg-linear-to-r from-error to-error/80 ${isMobile ? 'p-4' : 'p-6'} text-white relative overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-white rounded-full"></div>
        </div>

        <div className="relative flex justify-between items-start">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Icon Container with animation */}
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.3 }}
              className={`
                bg-white/20 rounded-full flex items-center justify-center
                ${isMobile ? 'p-2' : 'p-3 md:p-4'}
              `}
            >
              <FiActivity size={isMobile ? 20 : isTablet ? 24 : 28} />
            </motion.div>

            <div>
              <motion.h3
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl md:text-3xl'}`}
              >
                {isMobile ? 'Donation Details' : 'Donation Details'}
              </motion.h3>
              <motion.p
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`text-white/80 ${isMobile ? 'text-xs' : 'text-sm'}`}
              >
                {formatDate(selectedDonation.date)}
              </motion.p>
            </div>
          </div>

          {/* Close Button */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={`
              btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20
              ${isMobile ? 'btn-xs' : ''}
            `}
            aria-label="Close modal"
          >
            <FaTimes size={isMobile ? 16 : 20} />
          </motion.button>
        </div>

        {/* Status Badge - Positioned absolutely on desktop, inline on mobile */}
        {!isMobile && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute top-4 right-16"
          >
            <div className={`badge ${statusBadge.bgColor} ${statusBadge.textColor} border-0 gap-2 p-3`}>
              <StatusIcon size={14} />
              {statusBadge.text}
            </div>
          </motion.div>
        )}
      </div>

      {/* Mobile Status Badge - Only visible on mobile */}
      {isMobile && (
        <div className="px-4 py-2 bg-base-200/50 border-b border-base-300">
          <div className={`badge ${statusBadge.bgColor} ${statusBadge.textColor} border-0 gap-1 p-2 w-full justify-center`}>
            <StatusIcon size={12} />
            {statusBadge.text}
          </div>
        </div>
      )}

      {/* ==================================================================
          Mobile Tabs (Only visible on mobile)
      ================================================================== */}
      {isMobile && (
        <div className="flex border-b border-base-300">
          <button
            onClick={() => setActiveTab('details')}
            className={`
              flex-1 py-3 text-sm font-medium transition-colors
              ${activeTab === 'details'
                ? 'text-error border-b-2 border-error'
                : 'text-base-content/60 hover:text-base-content'
              }
            `}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`
              flex-1 py-3 text-sm font-medium transition-colors
              ${activeTab === 'timeline'
                ? 'text-error border-b-2 border-error'
                : 'text-base-content/60 hover:text-base-content'
              }
            `}
          >
            Timeline
          </button>
        </div>
      )}

      {/* ==================================================================
          Main Content Area - Scrollable
      ================================================================== */}
      <div
        className={`
          ${isMobile ? 'p-4' : 'p-4 md:p-6'}
          ${isMobile ? 'max-h-[calc(100vh-180px)]' : 'max-h-[60vh]'}
          overflow-y-auto
        `}
      >
        {/* Animated Content Container */}
        <AnimatePresence mode="wait" custom={activeTab}>
          {/* Details Tab Content */}
          {(activeTab === 'details' || !isMobile) && (
            <motion.div
              key="details"
              variants={tabVariants}
              initial={isMobile ? "enter" : false}
              animate="center"
              exit={isMobile ? "exit" : false}
              custom={1}
              transition={{ duration: 0.2 }}
              className="space-y-3 md:space-y-4"
            >
              {/* ==============================================================
                  Donation Information Card
              ============================================================== */}
              <div className={`bg-base-200/50 rounded-lg border border-base-300 ${isMobile ? 'p-3' : 'p-4'}`}>
                <h4 className={`font-semibold flex items-center gap-2 mb-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  <div className={`${typeDetails.bgColor} ${isMobile ? 'p-1.5' : 'p-2'} rounded-lg`}>
                    <TypeIcon className={`text-${typeDetails.color} ${isMobile ? 'text-sm' : 'text-base'}`} />
                  </div>
                  Donation Information
                </h4>

                <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-2 md:grid-cols-4 gap-3'}`}>
                  {/* Type */}
                  <div className={`bg-base-100 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                    <p className={`opacity-70 ${isMobile ? 'text-xs' : 'text-sm'}`}>Type</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TypeIcon className={`text-${typeDetails.color} ${isMobile ? 'text-xs' : 'text-sm'}`} />
                      <p className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'} capitalize truncate`}>
                        {isMobile
                          ? formatDonationType(selectedDonation.type).split(' ')[0]
                          : formatDonationType(selectedDonation.type)
                        }
                      </p>
                    </div>
                  </div>

                  {/* Volume */}
                  <div className={`bg-base-100 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                    <p className={`opacity-70 ${isMobile ? 'text-xs' : 'text-sm'}`}>Volume</p>
                    <p className={`font-medium font-mono ${isMobile ? 'text-sm' : 'text-base'}`}>
                      {selectedDonation.volume}ml
                    </p>
                  </div>

                  {/* Reaction - Desktop */}
                  {!isMobile && (
                    <>
                      <div className="bg-base-100 rounded-lg p-3">
                        <p className="opacity-70 text-sm">Reaction</p>
                        <div className="flex items-center gap-1 mt-1">
                          {selectedDonation.reaction ? (
                            <FaExclamationTriangle className="text-warning" size={14} />
                          ) : (
                            <FaCheckCircleSolid className="text-success" size={14} />
                          )}
                          <p className="font-medium text-sm">
                            {selectedDonation.reaction || "None"}
                          </p>
                        </div>
                      </div>

                      {/* Next Eligible */}
                      <div className="bg-base-100 rounded-lg p-3">
                        <p className="opacity-70 text-sm">Next Eligible</p>
                        <p className="font-medium text-sm">
                          {selectedDonation.nextEligibleDate
                            ? formatDateOnly(selectedDonation.nextEligibleDate)
                            : "Immediately"}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Mobile Reaction and Next Eligible (2-column grid) */}
                {isMobile && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-base-100 rounded-lg p-2">
                      <p className="opacity-70 text-xs">Reaction</p>
                      <div className="flex items-center gap-1 mt-1">
                        {selectedDonation.reaction ? (
                          <FaExclamationTriangle className="text-warning" size={10} />
                        ) : (
                          <FaCheckCircleSolid className="text-success" size={10} />
                        )}
                        <p className="font-medium text-xs truncate">
                          {selectedDonation.reaction || "None"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-base-100 rounded-lg p-2">
                      <p className="opacity-70 text-xs">Next Eligible</p>
                      <p className="font-medium text-xs">
                        {selectedDonation.nextEligibleDate
                          ? formatDateOnly(selectedDonation.nextEligibleDate).split(' ')[0]
                          : "Now"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ==============================================================
                  Blood Bank Information Card
              ============================================================== */}
              <div className={`bg-base-200/50 rounded-lg border border-base-300 ${isMobile ? 'p-3' : 'p-4'}`}>
                <h4 className={`font-semibold flex items-center gap-2 mb-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  <div className={`bg-error/10 ${isMobile ? 'p-1.5' : 'p-2'} rounded-lg`}>
                    <FaHospital className="text-error" />
                  </div>
                  Blood Bank Information
                </h4>

                <div className="space-y-2">
                  {/* Blood Bank ID with Copy Button */}
                  <div className={`bg-base-100 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className={`opacity-70 ${isMobile ? 'text-xs' : 'text-sm'}`}>Blood Bank ID</p>
                        <p className={`font-mono ${isMobile ? 'text-xs' : 'text-sm'} break-all truncate`}>
                          {formatBloodBankId(selectedDonation.bloodBankId)}
                        </p>
                      </div>
                      <button
                        onClick={copyToClipboard}
                        className={`
                          btn btn-ghost btn-square
                          ${isMobile ? 'btn-xs' : 'btn-sm'}
                          relative
                        `}
                        title="Copy to clipboard"
                      >
                        <FiCopy />
                        {copySuccess && (
                          <span className="absolute -top-8 right-0 bg-success text-white text-xs px-2 py-1 rounded shadow-lg">
                            {copySuccess}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Blood Bank Name (if available) */}
                  {selectedDonation.bloodBankName && (
                    <div className={`bg-base-100 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                      <p className={`opacity-70 ${isMobile ? 'text-xs' : 'text-sm'}`}>Blood Bank Name</p>
                      <div className="flex items-center gap-2 mt-1">
                        <FaMapMarkerAlt className="text-base-content/40 shrink-0" size={isMobile ? 10 : 12} />
                        <p className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          {selectedDonation.bloodBankName}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ==============================================================
                  Additional Notes Card (if any)
              ============================================================== */}
              {selectedDonation.notes && (
                <div className={`bg-base-200/50 rounded-lg border border-base-300 ${isMobile ? 'p-3' : 'p-4'}`}>
                  <h4 className={`font-semibold flex items-center gap-2 mb-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
                    <div className={`bg-warning/10 ${isMobile ? 'p-1.5' : 'p-2'} rounded-lg`}>
                      <FiAlertCircle className="text-warning" />
                    </div>
                    Additional Notes
                  </h4>

                  <div className={`bg-base-100 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                    <div className="flex items-start gap-2">
                      <FaNotesMedical className="text-base-content/40 shrink-0 mt-1" size={isMobile ? 12 : 14} />
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'}`}>{selectedDonation.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Timeline Tab Content (Mobile Only) */}
          {isMobile && activeTab === 'timeline' && (
            <motion.div
              key="timeline"
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              custom={-1}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* ==============================================================
                  Timeline Card
              ============================================================== */}
              <div className="bg-base-200/50 rounded-lg border border-base-300 p-3">
                <h4 className="font-semibold flex items-center gap-2 text-sm mb-3">
                  <div className="bg-info/10 p-1.5 rounded-lg">
                    <FiClock className="text-info" />
                  </div>
                  Donation Timeline
                </h4>

                {/* Timeline Visual */}
                <div className="relative pl-4 border-l-2 border-info/30 space-y-4">
                  {/* Donation Event */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0 w-4 h-4 rounded-full bg-error border-2 border-base-100"></div>
                    <div className="bg-base-100 rounded-lg p-2 ml-2">
                      <p className="text-xs font-medium text-error">Donation</p>
                      <p className="text-xs opacity-70">{formatDate(selectedDonation.date)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TypeIcon className={`text-${typeDetails.color} text-xs`} />
                        <span className="text-xs capitalize">
                          {formatDonationType(selectedDonation.type)}
                        </span>
                        <span className="text-xs ml-auto">{selectedDonation.volume}ml</span>
                      </div>
                    </div>
                  </div>

                  {/* Next Eligible Event */}
                  {selectedDonation.nextEligibleDate && (
                    <div className="relative">
                      <div className="absolute -left-6 top-0 w-4 h-4 rounded-full bg-success border-2 border-base-100"></div>
                      <div className="bg-base-100 rounded-lg p-2 ml-2">
                        <p className="text-xs font-medium text-success">Next Eligible</p>
                        <p className="text-xs opacity-70">{formatDate(selectedDonation.nextEligibleDate)}</p>
                        <p className="text-xs mt-1">You can donate again</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ==============================================================
                  Eligibility Summary
              ============================================================== */}
              <div className="bg-base-200/50 rounded-lg border border-base-300 p-3">
                <h4 className="font-semibold flex items-center gap-2 text-sm mb-3">
                  <div className="bg-success/10 p-1.5 rounded-lg">
                    <FaShieldAlt className="text-success" />
                  </div>
                  Eligibility Summary
                </h4>

                <div className="space-y-2">
                  <div className="bg-base-100 rounded-lg p-2 flex justify-between items-center">
                    <span className="text-xs opacity-70">Status:</span>
                    <span className={`badge ${statusBadge.bgColor} ${statusBadge.textColor} border-0 gap-1 p-2`}>
                      <StatusIcon size={10} />
                      {statusBadge.text}
                    </span>
                  </div>

                  <div className="bg-base-100 rounded-lg p-2 flex justify-between items-center">
                    <span className="text-xs opacity-70">Days since donation:</span>
                    <span className="text-xs font-medium">
                      {Math.ceil((new Date() - new Date(selectedDonation.date)) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>

                  <div className="bg-base-100 rounded-lg p-2 flex justify-between items-center">
                    <span className="text-xs opacity-70">Waiting period:</span>
                    <span className="text-xs font-medium">
                      {selectedDonation.type === "whole_blood" ? "56 days" :
                        selectedDonation.type === "plasma" ? "28 days" :
                          selectedDonation.type === "platelets" ? "7 days" : "Varies"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ==================================================================
          Footer Actions - Responsive buttons
      ================================================================== */}
      <div className={`modal-action border-t border-base-300 ${isMobile ? 'p-3' : 'p-4'} bg-base-200/50`}>
        <div className="flex justify-end w-full">
          {/* Desktop View */}
          {!isMobile && (
            <>
              <button
                onClick={onClose}
                className="btn btn-ghost btn-sm md:btn-md mr-2"
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                className="btn btn-error btn-sm md:btn-md"
              >
                Close
              </button>
            </>
          )}

          {/* Mobile View - Full width button */}
          {isMobile && (
            <button
              onClick={onClose}
              className="btn btn-error btn-sm w-full gap-2"
            >
              <FiX />
              Close
            </button>
          )}
        </div>
      </div>

      {/* Data Source Indicator */}
      <div className={`text-center ${isMobile ? 'py-2' : 'pb-2'}`}>
        <span className="text-xs text-base-content/40 flex items-center justify-center gap-1">
          <FiCheckCircle size={10} />
          Donation record #{typeof selectedDonation._id === 'object'
            ? selectedDonation._id?.$oid?.slice(-6)
            : selectedDonation._id?.slice(-6) || 'N/A'}
        </span>
      </div>
    </div>
  );
};

export default DonationDetailsModal;
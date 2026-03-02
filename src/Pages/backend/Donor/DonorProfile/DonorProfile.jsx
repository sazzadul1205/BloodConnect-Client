// pages/backend/Donor/DonorProfile/DonorProfile.jsx

/**
 * DonorProfile Component
 * 
 * Main donor profile management page that handles:
 * - Displaying donor information in a tabbed interface
 * - Creating new donor profiles
 * - Editing existing profiles
 * - Deleting profiles with confirmation
 * - Responsive design for all screen sizes
 * 
 * @component
 */

import React, { useState, useEffect, useCallback } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// sweet alert
import Swal from "sweetalert2";

// Icons - Organized by category
import {
  // Medical/Blood icons
  FaTint, FaHeartbeat, FaFlask, FaStethoscope, FaPills,
  FaSyringe, FaPrescriptionBottle, FaNotesMedical,

  // Status/Action icons
  FaCheckCircle, FaExclamationCircle, FaBan, FaInfoCircle,
  FaEdit, FaTrashAlt, FaAward, FaHeart, FaHistory,

  // Navigation/Location icons
  FaMapMarkerAlt, FaGlobe, FaHome,

  // Time/Calendar icons
  FaCalendarAlt, FaClock, FaCalendarCheck,

  // User/Contact icons
  FaUser, FaPhone, FaEnvelope, FaIdCard,

  // Notification icons
  FaBell, FaShieldAlt,
  FaChevronDown,
} from "react-icons/fa";
import { FaDroplet, FaShieldHeart } from "react-icons/fa6";

// Components
import CreateDonorModal from "./CreateDonorModal/CreateDonorModal";
import EditDonorModal from "./EditDonorModal/EditDonorModal";

// Hooks
import useAxiosPublic from "../../../../hooks/useAxiosPublic";
import useAuth from "../../../../hooks/useAuth";

// Shared Components
import ErrorState from "../../../../shared/ErrorState";
import BloodLoader from "../../../../shared/BloodLoader";

// Utils
import { formatAppDate } from "../../../../utils/dateFormat";

const DonorProfile = () => {
  // ==========================================================================
  // Hooks and Initialization
  // ==========================================================================

  const { axiosInstance } = useAxiosPublic();
  const { user, loading: authLoading } = useAuth();
  const token = localStorage.getItem("auth_token");

  // ==========================================================================
  // State Management
  // ==========================================================================

  // Profile states
  const [hasProfile, setHasProfile] = useState(false);
  const [donor, setDonor] = useState(null);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ==========================================================================
  // Responsive Design Detection
  // ==========================================================================

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // ==========================================================================
  // Data Fetching
  // ==========================================================================

  /**
   * Checks if user has an existing donor profile
   * Fetches profile data if exists
   */
  const checkDonorProfile = useCallback(async () => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // Check if user exists and has an ID
    if (!user) {
      setLoading(false);
      setError(new Error("Please log in to view your donor profile"));
      return;
    }

    // Get the user ID - check different possible ID fields
    const userId = user?.userId || user?._id || user?.id || user?.uid;

    if (!userId) {
      setLoading(false);
      setError(new Error("User ID not found. Please log in again."));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_token");
      // Try to fetch donor profile using user ID
      const response = await axiosInstance.get(`/donors/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.data.success) {
        setHasProfile(true);
        setDonor(response.data.data);
      }
    } catch (err) {
      console.error("Error checking donor profile:", err);

      if (err.response?.status === 404) {
        setHasProfile(false);
        setError(null);
      } else if (err.response?.status === 401) {
        setError(new Error("Authentication failed. Please log in again."));
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, axiosInstance]);

  // Check if donor profile exists on component mount / auth changes
  useEffect(() => {
    checkDonorProfile();
  }, [checkDonorProfile]);

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  /**
   * Handles closing of create profile modal
   */
  const handleCreateProfileModalClose = () => {
    document.getElementById('create_donor_modal')?.close();
    checkDonorProfile();
  };

  /**
   * Refreshes donor profile data
   */
  const handleRefreshProfile = () => {
    checkDonorProfile();
  };

  /**
   * Retry after error
   */
  const handleRetry = () => {
    checkDonorProfile();
  };

  /**
   * Opens edit modal
   */
  const handleEdit = () => {
    document.getElementById("edit_donor_modal")?.showModal();
  };

  /**
   * Handles closing of edit modal
   */
  const handleEditProfileModalClose = () => {
    document.getElementById("edit_donor_modal")?.close();
    checkDonorProfile();
  };

  /**
   * Handles profile deletion with confirmation
   */
  const handleDelete = () => {
    // Close mobile menu if open
    setShowMobileMenu(false);

    Swal.fire({
      title: 'Delete Donor Profile?',
      text: "This action cannot be undone. All your donation history will be permanently removed.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
      color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      // Make it responsive for mobile
      ...(isMobile && {
        width: '90%',
        padding: '1rem',
      }),
    }).then(async (result) => {
      if (result.isConfirmed) {
        setDeleteLoading(true);

        try {
          // Show loading state
          Swal.fire({
            title: 'Deleting...',
            text: 'Please wait while we delete your profile',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            willOpen: () => {
              Swal.showLoading();
            },
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
            color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          });

          // Get donor ID from the donor object
          const donorId = donor?._id?.$oid || donor?._id;

          if (!donorId) {
            throw new Error('Donor ID not found');
          }

          // Make API call to delete donor profile
          const response = await axiosInstance.delete(`/donors/${donorId}?confirm=true`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          if (response.data.success) {
            // Success - close any open modals and update state
            document.getElementById('edit_donor_modal')?.close();

            Swal.fire({
              title: 'Deleted!',
              text: 'Your donor profile has been successfully deleted.',
              icon: 'success',
              confirmButtonColor: '#ef4444',
              timer: 2000,
              background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
              color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
            }).then(() => {
              // Update state to show create profile screen
              setHasProfile(false);
              setDonor(null);
            });
          }
        } catch (err) {
          console.error("Error deleting donor profile:", err);

          // Handle specific error cases
          let errorMessage = 'Failed to delete donor profile. Please try again.';

          if (err.response?.status === 403) {
            errorMessage = 'You do not have permission to delete this profile.';
          } else if (err.response?.status === 404) {
            errorMessage = 'Donor profile not found. It may have already been deleted.';
            setHasProfile(false);
            setDonor(null);
          } else if (err.response?.data?.error) {
            errorMessage = err.response.data.error;
          }

          Swal.fire({
            title: 'Error!',
            text: errorMessage,
            icon: 'error',
            confirmButtonColor: '#ef4444',
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
            color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          });
        } finally {
          setDeleteLoading(false);
        }
      }
    });
  };

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  /**
   * Formats date with fallback
   */
  const formatDate = (date) => {
    return formatAppDate(date, "MMMM d, yyyy", "Not available");
  };

  /**
   * Formats MongoDB date object
   */
  const formatMongoDate = (mongoDate) => {
    if (!mongoDate) return "Not available";
    return formatDate(mongoDate.$date || mongoDate);
  };

  /**
   * Gets status badge configuration based on donor eligibility
   */
  const getStatusBadge = () => {
    if (!donor?.eligibility?.isEligible) {
      return {
        text: donor?.eligibility?.ineligibleReason || "Not Eligible",
        icon: FaClock,
        color: "warning",
        bgColor: "bg-warning/10",
        textColor: "text-warning",
        borderColor: "border-warning/20",
        mobileText: isMobile ? "Not Eligible" : (donor?.eligibility?.ineligibleReason || "Not Eligible")
      };
    }
    if (donor?.donationPreferences?.isActive) {
      return {
        text: "Active & Eligible",
        icon: FaCheckCircle,
        color: "success",
        bgColor: "bg-success/10",
        textColor: "text-success",
        borderColor: "border-success/20",
        mobileText: "Active"
      };
    }
    return {
      text: "Inactive",
      icon: FaExclamationCircle,
      color: "neutral",
      bgColor: "bg-base-300",
      textColor: "text-base-content",
      borderColor: "border-base-300",
      mobileText: "Inactive"
    };
  };

  /**
   * Gets user's full name
   */
  const getFullName = () => {
    return donor?.user?.profile?.fullName || donor?.user?.fullName || "Donor Name";
  };

  /**
   * Gets user email
   */
  const getUserEmail = () => {
    return donor?.user?.email || "Email not available";
  };

  /**
   * Gets user phone
   */
  const getUserPhone = () => {
    return donor?.user?.phone || "Phone not available";
  };

  /**
   * Gets user location
   */
  const getUserLocation = () => {
    return donor?.user?.address?.city || donor?.user?.profile?.address?.city || "Location not set";
  };

  /**
   * Formats blood type with Rh factor
   */
  const getFormattedBloodType = () => {
    const bloodType = donor?.medicalInfo?.bloodType || "N/A";
    const rhFactor = donor?.medicalInfo?.rhFactor;

    if (rhFactor) {
      const rhSymbol = rhFactor === "positive" ? "+" : rhFactor === "negative" ? "-" : "";
      return `${bloodType}${rhSymbol}`;
    }
    return bloodType;
  };

  /**
   * Formats donation type for display
   */
  const getDonationTypeDisplay = (type) => {
    return type?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Not specified";
  };

  /**
   * Calculates days since last donation
   */
  const getDaysSinceLastDonation = () => {
    if (!donor?.eligibility?.lastDonationDate) return null;
    const lastDonation = new Date(donor.eligibility.lastDonationDate.$date || donor.eligibility.lastDonationDate);
    const today = new Date();
    const diffTime = Math.abs(today - lastDonation);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const statusBadge = donor ? getStatusBadge() : null;
  const StatusIcon = statusBadge?.icon || FaInfoCircle;
  const daysSinceLastDonation = getDaysSinceLastDonation();

  // ==========================================================================
  // Tab Configuration
  // ==========================================================================

  const tabs = [
    { id: "overview", label: isMobile ? "Overview" : "Overview", icon: FaUser },
    { id: "medical", label: isMobile ? "Medical" : "Medical", icon: FaStethoscope },
    { id: "donations", label: isMobile ? "History" : "Donation History", icon: FaHistory },
    { id: "preferences", label: isMobile ? "Pref" : "Preferences", icon: FaBell },
    { id: "badges", label: isMobile ? "Badges" : "Badges & Awards", icon: FaAward },
  ];

  // ==========================================================================
  // Loading State
  // ==========================================================================

  if (loading || authLoading) return <BloodLoader fullscreen={true} />;

  // ==========================================================================
  // Error State
  // ==========================================================================

  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  // ==========================================================================
  // Create Profile Screen (No Profile)
  // ==========================================================================

  if (!hasProfile) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        {/* Animated Card Container - Responsive padding */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="
            card bg-base-100 shadow-2xl 
            w-full max-w-sm sm:max-w-md lg:max-w-lg
            border border-error/20
          "
        >
          <div className="card-body items-center text-center space-y-4 sm:space-y-6 p-6 sm:p-8">
            {/* Blood Icon with Pulse Animation - Responsive sizing */}
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="
                bg-error/10 text-error 
                rounded-full 
                w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24
                flex items-center justify-center
              "
            >
              <FaTint size={isMobile ? 24 : isTablet ? 28 : 32} />
            </motion.div>

            {/* Title - Responsive text */}
            <h2 className="card-title text-xl sm:text-2xl lg:text-3xl font-bold text-error">
              {isMobile ? 'Become a Donor' : 'Become a Blood Donor'}
            </h2>

            {/* Description */}
            <p className="text-sm sm:text-base text-base-content/70">
              {isMobile
                ? 'Create your profile and start saving lives.'
                : 'You don\'t have a donor profile yet. Create one and start saving lives today.'
              }
            </p>

            {/* Features List - Hide on very small screens if needed */}
            {!isMobile && (
              <div className="w-full space-y-3 text-left pt-2">
                <div className="flex items-start gap-2 text-sm text-base-content/70">
                  <FaCheckCircle className="text-success mt-0.5 shrink-0" />
                  <span>Track your donation history</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-base-content/70">
                  <FaCheckCircle className="text-success mt-0.5 shrink-0" />
                  <span>Get notified for emergency needs</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-base-content/70">
                  <FaCheckCircle className="text-success mt-0.5 shrink-0" />
                  <span>Earn badges and achievements</span>
                </div>
              </div>
            )}

            {/* Call-To-Action Button */}
            <div className="card-actions mt-4 w-full">
              <motion.button
                onClick={() => document.getElementById("create_donor_modal")?.showModal()}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="
                  btn btn-error w-full text-white 
                  flex items-center justify-center gap-2
                  btn-sm sm:btn-md
                "
              >
                <FaHeart />
                {isMobile ? 'Create Profile' : 'Create Donor Profile'}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Create Donor Modal */}
        <dialog
          id="create_donor_modal"
          className="modal modal-bottom sm:modal-middle"
        >
          <CreateDonorModal
            refreshDonors={handleRefreshProfile}
            onSuccess={handleCreateProfileModalClose}
          />
          <form method="dialog" className="modal-backdrop hidden md:block">
            <button>close</button>
          </form>
        </dialog>
      </div>
    );
  }

  // ==========================================================================
  // Donor Profile View (Has Profile)
  // ==========================================================================

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-5">
      {/* ======================================================================
            Header Section - Responsive
        ====================================================================== */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        {/* Title and Actions Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          {/* Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 text-base-content">
              <FaHeartbeat className="text-error" />
              {isMobile ? 'Donor Profile' : 'Donor Profile'}
            </h1>
            <p className="text-xs sm:text-sm text-base-content/60 mt-1">
              {isMobile
                ? 'Manage your donor information'
                : 'Manage your donor information and track your contributions'
              }
            </p>
          </div>

          {/* Action Buttons - Responsive */}
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Edit Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEdit}
              className="btn btn-info gap-2 flex-1 sm:flex-none btn-sm sm:btn-md"
            >
              <FaEdit />
              {isMobile ? 'Edit' : 'Edit Profile'}
            </motion.button>

            {/* Delete Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              disabled={deleteLoading}
              className="btn btn-error gap-2 flex-1 sm:flex-none btn-sm sm:btn-md"
            >
              {deleteLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <FaTrashAlt />
              )}
              {isMobile ? 'Delete' : 'Delete Profile'}
            </motion.button>
          </div>
        </div>

        {/* Quick Stats Row - Responsive grid */}
        <div className={`
            grid gap-3 sm:gap-4 mt-4 sm:mt-6
            ${isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-4'}
          `}>
          {/* Blood Type Stat */}
          <div className="stat bg-base-100 rounded-lg shadow-sm p-3 sm:p-4">
            <div className="stat-figure text-error">
              <FaDroplet size={isMobile ? 20 : 24} />
            </div>
            <div className="stat-title text-xs sm:text-sm">Blood Type</div>
            <div className="stat-value text-lg sm:text-2xl text-error">{getFormattedBloodType()}</div>
            <div className="stat-desc text-xs hidden sm:block">
              {donor?.medicalInfo?.rhFactor ?
                (donor.medicalInfo.rhFactor === "positive" ? "Rh Positive" : "Rh Negative") :
                "Rh not specified"}
            </div>
          </div>

          {/* Total Donations Stat */}
          <div className="stat bg-base-100 rounded-lg shadow-sm p-3 sm:p-4">
            <div className="stat-figure text-info">
              <FaSyringe size={isMobile ? 20 : 24} />
            </div>
            <div className="stat-title text-xs sm:text-sm">Donations</div>
            <div className="stat-value text-lg sm:text-2xl text-info">{donor?.donationHistory?.length || 0}</div>
            <div className="stat-desc text-xs hidden sm:block">Lifetime</div>
          </div>

          {/* Volume Donated Stat */}
          <div className="stat bg-base-100 rounded-lg shadow-sm p-3 sm:p-4">
            <div className="stat-figure text-warning">
              <FaFlask size={isMobile ? 20 : 24} />
            </div>
            <div className="stat-title text-xs sm:text-sm">Volume</div>
            <div className="stat-value text-lg sm:text-2xl text-warning">{donor?.eligibility?.totalDonated || 0}ml</div>
            <div className="stat-desc text-xs hidden sm:block">Total volume</div>
          </div>

          {/* Next Eligible Stat */}
          <div className="stat bg-base-100 rounded-lg shadow-sm p-3 sm:p-4">
            <div className="stat-figure text-success">
              <FaCalendarCheck size={isMobile ? 20 : 24} />
            </div>
            <div className="stat-title text-xs sm:text-sm">Next Eligible</div>
            <div className="stat-value text-lg sm:text-2xl text-success">
              {donor?.eligibility?.nextEligibleDate ?
                formatAppDate(
                  donor.eligibility.nextEligibleDate.$date || donor.eligibility.nextEligibleDate,
                  isMobile ? "MMM d" : "MMM d",
                ) :
                'Now'}
            </div>
            <div className="stat-desc text-xs hidden sm:block">
              {daysSinceLastDonation ? `${daysSinceLastDonation} days since last` : 'No donations yet'}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================================
            Main Profile Card
        ====================================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-base-100 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-base-300"
      >
        {/* Profile Header with Gradient - Responsive padding */}
        <div className="bg-linear-to-r from-error to-error/80 p-4 sm:p-6 md:p-8 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full"></div>
            <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-white rounded-full"></div>
          </div>

          {/* Profile Header Content - Responsive layout */}
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* Profile Icon */}
            <div className="bg-white/20 p-4 sm:p-6 rounded-xl sm:rounded-2xl backdrop-blur-sm">
              <FaUser size={isMobile ? 32 : 40} />
            </div>

            {/* Donor Info */}
            <div className="flex-1 w-full">
              {/* Name and Status Row */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
                  {isMobile ? getFullName().split(' ')[0] : getFullName()}
                </h1>
                <div className={`badge ${statusBadge?.bgColor} ${statusBadge?.textColor} border-0 gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm`}>
                  <StatusIcon size={isMobile ? 12 : 14} />
                  {isMobile ? statusBadge?.mobileText : statusBadge?.text}
                </div>
              </div>

              {/* Contact Info Grid - Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white/90 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <FaIdCard className="text-white/60 shrink-0" />
                  <span className="truncate">
                    ID: {donor?._id?.$oid?.slice(-6) || donor?._id?.slice(-6) || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FaEnvelope className="text-white/60 shrink-0" />
                  <span className="truncate">{isMobile ? getUserEmail().split('@')[0] : getUserEmail()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="text-white/60 shrink-0" />
                  <span className="truncate">Since {formatMongoDate(donor?.createdAt).split(' ')[2] || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-white/60 shrink-0" />
                  <span className="truncate">{getUserLocation()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================
              Tabs Navigation - Responsive
          ================================================================== */}
        <div className="border-b border-base-300 px-2 sm:px-4 md:px-8 bg-base-100">
          {/* Mobile Dropdown Menu */}
          {isMobile && (
            <div className="py-2">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="btn btn-outline btn-error w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  {tabs.find(t => t.id === activeTab)?.icon && (
                    React.createElement(tabs.find(t => t.id === activeTab).icon)
                  )}
                  {tabs.find(t => t.id === activeTab)?.label}
                </span>
                <FaChevronDown className={`transition-transform ${showMobileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showMobileMenu && (
                <div className="mt-2 bg-base-100 rounded-lg shadow-lg border border-base-300 overflow-hidden">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setShowMobileMenu(false);
                        }}
                        className={`w-full flex items-center gap-2 px-4 py-3 text-left transition-colors
                            ${activeTab === tab.id
                            ? 'bg-error/10 text-error'
                            : 'hover:bg-base-200 text-base-content/70'
                          }`}
                      >
                        <Icon className={activeTab === tab.id ? 'text-error' : ''} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Desktop Tabs */}
          {!isMobile && (
            <div className="flex gap-1 sm:gap-2 overflow-x-auto py-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                        flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 
                        rounded-lg font-medium transition-all whitespace-nowrap
                        text-sm sm:text-base
                        ${isActive
                        ? 'bg-error/10 text-error shadow-sm'
                        : 'hover:bg-base-200 text-base-content/70 hover:text-base-content'
                      }
                      `}
                  >
                    <Icon className={isActive ? 'text-error' : ''} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ==================================================================
              Tab Content with Animation
          ================================================================== */}
        <div className="p-4 sm:p-6 md:p-8">
          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 sm:space-y-6"
              >
                <div className={`grid grid-cols-1 ${isTablet ? 'md:grid-cols-2' : 'lg:grid-cols-2'} gap-4 sm:gap-6`}>
                  {/* Personal Information Card */}
                  <div className="card bg-base-200/50 border border-base-300">
                    <div className="card-body p-4 sm:p-6">
                      <h3 className="card-title text-base sm:text-lg flex items-center gap-2">
                        <FaUser className="text-error" />
                        Personal Info
                      </h3>
                      <div className="space-y-3 sm:space-y-4">
                        <InfoRow icon={FaEnvelope} label="Email:" value={getUserEmail()} />
                        <InfoRow icon={FaPhone} label="Phone:" value={getUserPhone()} />
                        <InfoRow icon={FaMapMarkerAlt} label="Location:" value={getUserLocation()} />
                        <InfoRow icon={FaIdCard} label="Donor ID:" value={donor?._id?.$oid?.slice(-8) || donor?._id?.slice(-8) || "N/A"} />
                      </div>
                    </div>
                  </div>

                  {/* Eligibility Status Card */}
                  <div className="card bg-base-200/50 border border-base-300">
                    <div className="card-body p-4 sm:p-6">
                      <h3 className="card-title text-base sm:text-lg flex items-center gap-2">
                        <FaShieldAlt className="text-error" />
                        Eligibility
                      </h3>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex justify-between items-center p-2 sm:p-3 bg-base-100 rounded-lg">
                          <span className="text-xs sm:text-sm text-base-content/70">Status:</span>
                          <span className={`badge ${donor?.eligibility?.isEligible ? 'badge-success' : 'badge-warning'} gap-1 sm:gap-2 p-2 sm:p-3`}>
                            {donor?.eligibility?.isEligible ? <FaCheckCircle size={12} /> : <FaClock size={12} />}
                            {donor?.eligibility?.isEligible ? "Eligible" : "Not Eligible"}
                          </span>
                        </div>

                        <div className="p-2 sm:p-3 bg-base-100 rounded-lg">
                          <span className="text-xs sm:text-sm text-base-content/70 block mb-1">Last Donation:</span>
                          <span className="font-medium text-xs sm:text-sm flex items-center gap-2">
                            <FaCalendarAlt className="text-base-content/40 shrink-0" />
                            <span className="truncate">{formatMongoDate(donor?.eligibility?.lastDonationDate)}</span>
                          </span>
                        </div>

                        <div className="p-2 sm:p-3 bg-base-100 rounded-lg">
                          <span className="text-xs sm:text-sm text-base-content/70 block mb-1">Next Eligible:</span>
                          <span className="font-medium text-xs sm:text-sm flex items-center gap-2">
                            <FaCalendarCheck className="text-base-content/40 shrink-0" />
                            <span className="truncate">{formatMongoDate(donor?.eligibility?.nextEligibleDate)}</span>
                          </span>
                        </div>

                        {donor?.eligibility?.ineligibleReason && (
                          <div className="alert alert-warning p-2 sm:p-3 text-xs sm:text-sm">
                            <FaExclamationCircle className="shrink-0" />
                            <span className="truncate">{donor.eligibility.ineligibleReason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Medical Overview Card - Full Width */}
                  <div className="card bg-base-200/50 border border-base-300 lg:col-span-2">
                    <div className="card-body p-4 sm:p-6">
                      <h3 className="card-title text-base sm:text-lg flex items-center gap-2">
                        <FaStethoscope className="text-error" />
                        Medical Overview
                      </h3>
                      <div className={`grid grid-cols-1 ${isTablet ? 'sm:grid-cols-3' : 'md:grid-cols-3'} gap-3 sm:gap-4`}>
                        {/* Hemoglobin */}
                        <div className="stat bg-base-100 rounded-lg p-3 sm:p-4">
                          <div className="stat-title text-xs sm:text-sm">Hemoglobin</div>
                          <div className="stat-value text-lg sm:text-2xl text-error">
                            {donor?.medicalInfo?.hemoglobin || "N/A"}
                            {donor?.medicalInfo?.hemoglobin && <span className="text-xs font-normal"> g/dL</span>}
                          </div>
                        </div>

                        {/* Medical Conditions */}
                        <div className="bg-base-100 rounded-lg p-3 sm:p-4">
                          <p className="text-base-content/70 text-xs sm:text-sm mb-2 flex items-center gap-1">
                            <FaNotesMedical />
                            Conditions
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {donor?.medicalInfo?.diseases?.length > 0 ? (
                              donor.medicalInfo.diseases.slice(0, isMobile ? 2 : undefined).map((disease, i) => (
                                <span key={i} className="badge badge-error badge-xs sm:badge-sm gap-1 p-1 sm:p-2">
                                  {disease}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-base-content/60 flex items-center gap-1">
                                <FaCheckCircle className="text-success text-xs" />
                                None
                              </span>
                            )}
                            {donor?.medicalInfo?.diseases?.length > 2 && isMobile && (
                              <span className="badge badge-ghost badge-xs">+{donor.medicalInfo.diseases.length - 2}</span>
                            )}
                          </div>
                        </div>

                        {/* Allergies */}
                        <div className="bg-base-100 rounded-lg p-3 sm:p-4">
                          <p className="text-base-content/70 text-xs sm:text-sm mb-2 flex items-center gap-1">
                            <FaPills />
                            Allergies
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {donor?.medicalInfo?.allergies?.length > 0 ? (
                              donor.medicalInfo.allergies.slice(0, isMobile ? 2 : undefined).map((allergy, i) => (
                                <span key={i} className="badge badge-warning badge-xs sm:badge-sm gap-1 p-1 sm:p-2">
                                  {allergy}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-base-content/60 flex items-center gap-1">
                                <FaCheckCircle className="text-success text-xs" />
                                None
                              </span>
                            )}
                            {donor?.medicalInfo?.allergies?.length > 2 && isMobile && (
                              <span className="badge badge-ghost badge-xs">+{donor.medicalInfo.allergies.length - 2}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Medications section if any */}
                      {donor?.medicalInfo?.medications?.length > 0 && (
                        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-base-100 rounded-lg">
                          <p className="text-base-content/70 text-xs sm:text-sm mb-2 flex items-center gap-1">
                            <FaPrescriptionBottle />
                            Current Medications
                          </p>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {donor.medicalInfo.medications.slice(0, isMobile ? 3 : undefined).map((med, i) => (
                              <span key={i} className="badge badge-info badge-xs sm:badge-sm gap-1 p-1 sm:p-2">
                                {med}
                              </span>
                            ))}
                            {donor.medicalInfo.medications.length > 3 && isMobile && (
                              <span className="badge badge-ghost badge-xs">+{donor.medicalInfo.medications.length - 3}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Medical History Tab */}
            {activeTab === "medical" && (
              <motion.div
                key="medical"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 sm:space-y-6"
              >
                {/* Blood Information */}
                <div className="card bg-base-200/50 border border-base-300">
                  <div className="card-body p-4 sm:p-6">
                    <h3 className="card-title text-base sm:text-lg flex items-center gap-2">
                      <FaTint className="text-error" />
                      Blood Information
                    </h3>
                    <div className={`grid grid-cols-1 ${isTablet ? 'sm:grid-cols-3' : 'md:grid-cols-3'} gap-3 sm:gap-4`}>
                      <StatItem title="Blood Type" value={donor?.medicalInfo?.bloodType || "N/A"} color="error" />
                      <StatItem
                        title="Rh Factor"
                        value={donor?.medicalInfo?.rhFactor ?
                          (donor.medicalInfo.rhFactor === "positive" ? "Positive (+)" : "Negative (-)") :
                          "Not specified"
                        }
                        color="error"
                      />
                      <StatItem
                        title="Hemoglobin"
                        value={donor?.medicalInfo?.hemoglobin ? `${donor.medicalInfo.hemoglobin} g/dL` : "N/A"}
                        color="error"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Conditions */}
                <ConditionCard
                  title="Medical Conditions"
                  icon={FaStethoscope}
                  items={donor?.medicalInfo?.diseases}
                  emptyMessage="No medical conditions reported"
                  badgeColor="error"
                  isMobile={isMobile}
                />

                {/* Allergies */}
                <ConditionCard
                  title="Allergies"
                  icon={FaPills}
                  items={donor?.medicalInfo?.allergies}
                  emptyMessage="No allergies reported"
                  badgeColor="warning"
                  isMobile={isMobile}
                />

                {/* Current Medications */}
                <ConditionCard
                  title="Current Medications"
                  icon={FaPrescriptionBottle}
                  items={donor?.medicalInfo?.medications}
                  emptyMessage="No medications reported"
                  badgeColor="info"
                  isMobile={isMobile}
                />
              </motion.div>
            )}

            {/* Donation History Tab */}
            {activeTab === "donations" && (
              <motion.div
                key="donations"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    <FaHistory className="text-error" />
                    Donation History
                  </h3>
                  <span className="text-xs sm:text-sm text-base-content/60">
                    Total: {donor?.donationHistory?.length || 0}
                  </span>
                </div>

                {donor?.donationHistory?.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-base-300">
                    {isMobile ? (
                      // Mobile Card View
                      <div className="space-y-3 p-3">
                        {donor.donationHistory.map((donation, index) => (
                          <div key={index} className="bg-base-100 rounded-lg p-3 space-y-2 border border-base-300">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-base-content/60">{formatMongoDate(donation.date)}</span>
                              <span className="badge badge-error badge-sm gap-1">
                                <FaDroplet size={10} />
                                {getDonationTypeDisplay(donation.type)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Volume: <span className="font-medium">{donation.volume} ml</span></span>
                              <span>Reaction: {donation.reaction || "None"}</span>
                            </div>
                            <div className="text-xs text-base-content/60">
                              Location ID: {donation.bloodBankId ?
                                (typeof donation.bloodBankId === 'object' ?
                                  donation.bloodBankId.$oid?.slice(-6) :
                                  donation.bloodBankId.toString().slice(-6)) : "N/A"}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Desktop Table View
                      <table className="table table-zebra w-full">
                        <thead className="bg-base-200">
                          <tr>
                            <th className="text-xs sm:text-sm">Date</th>
                            <th className="text-xs sm:text-sm">Type</th>
                            <th className="text-xs sm:text-sm">Volume</th>
                            <th className="text-xs sm:text-sm">Location</th>
                            <th className="text-xs sm:text-sm">Reaction</th>
                          </tr>
                        </thead>
                        <tbody>
                          {donor.donationHistory.map((donation, index) => (
                            <tr key={index} className="hover">
                              <td className="text-xs sm:text-sm">{formatMongoDate(donation.date)}</td>
                              <td>
                                <span className="badge badge-error gap-1 sm:gap-2">
                                  <FaDroplet size={12} />
                                  {getDonationTypeDisplay(donation.type)}
                                </span>
                              </td>
                              <td className="text-xs sm:text-sm">{donation.volume} ml</td>
                              <td className="text-xs sm:text-sm">
                                {donation.bloodBankId ? (
                                  <span className="flex items-center gap-1">
                                    <FaHome className="text-base-content/40" />
                                    {typeof donation.bloodBankId === 'object' ?
                                      donation.bloodBankId.$oid?.slice(-6) :
                                      donation.bloodBankId.toString().slice(-6)}
                                  </span>
                                ) : "N/A"}
                              </td>
                              <td className="text-xs sm:text-sm">
                                {donation.reaction ? (
                                  <span className="badge badge-warning badge-sm">{donation.reaction}</span>
                                ) : "None"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : (
                  <EmptyState
                    icon={FaHeartbeat}
                    title="No donation history yet"
                    message="Your first donation will appear here"
                  />
                )}
              </motion.div>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className={`grid grid-cols-1 ${isTablet ? 'md:grid-cols-2' : 'lg:grid-cols-2'} gap-4 sm:gap-6`}
              >
                {/* Donation Types */}
                <PreferenceCard
                  title="Donation Types"
                  icon={FaHeartbeat}
                >
                  <div className="space-y-2">
                    {donor?.donationPreferences?.donationType?.length > 0 ? (
                      donor.donationPreferences.donationType.map((type, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-base-100 rounded-lg text-sm">
                          <FaCheckCircle className="text-success shrink-0" size={14} />
                          <span className="capitalize">{getDonationTypeDisplay(type)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-base-content/70">No preferences set</p>
                    )}
                  </div>
                </PreferenceCard>

                {/* Travel Preferences */}
                <PreferenceCard
                  title="Travel Preferences"
                  icon={FaGlobe}
                >
                  <div className="flex items-center gap-4 p-3 sm:p-4 bg-base-100 rounded-lg">
                    <div className="text-2xl sm:text-3xl font-bold text-error">
                      {donor?.donationPreferences?.maxDistance || 50}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-medium">kilometers</div>
                      <div className="text-xs text-base-content/50">Maximum travel distance</div>
                    </div>
                  </div>
                </PreferenceCard>

                {/* Availability */}
                <PreferenceCard
                  title="Availability"
                  icon={FaClock}
                >
                  {donor?.donationPreferences?.availability?.length > 0 ? (
                    <div className="space-y-2">
                      {donor.donationPreferences.availability.slice(0, isMobile ? 3 : undefined).map((slot, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-base-100 rounded-lg text-sm">
                          <span className="font-medium">{slot.day}</span>
                          <span className="text-xs bg-base-200 px-2 py-1 rounded">
                            {slot.start} - {slot.end}
                          </span>
                        </div>
                      ))}
                      {donor.donationPreferences.availability.length > 3 && isMobile && (
                        <p className="text-xs text-center text-base-content/50">
                          +{donor.donationPreferences.availability.length - 3} more
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-base-content/70">No availability set</p>
                  )}
                </PreferenceCard>

                {/* Emergency Settings */}
                <PreferenceCard
                  title="Emergency Settings"
                  icon={FaShieldHeart}
                >
                  <div className="space-y-3">
                    <ToggleItem
                      label="Emergency Donor"
                      value={donor?.donationPreferences?.emergencyDonor}
                      trueIcon={FaCheckCircle}
                      falseIcon={FaClock}
                    />
                    <ToggleItem
                      label="Emergency Notifications"
                      value={donor?.donationPreferences?.notifyForEmergency}
                      trueIcon={FaBell}
                      falseIcon={FaBan}
                    />
                  </div>
                </PreferenceCard>

                {/* Preferred Centers */}
                <PreferenceCard
                  title="Preferred Centers"
                  icon={FaMapMarkerAlt}
                  fullWidth={true}
                >
                  {donor?.donationPreferences?.preferredCenters?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {donor.donationPreferences.preferredCenters.slice(0, isMobile ? 3 : undefined).map((center, i) => (
                        <span key={i} className="badge badge-error gap-1 p-2 sm:p-3 text-xs sm:text-sm">
                          <FaHome />
                          {center.toString().slice(-6)}
                        </span>
                      ))}
                      {donor.donationPreferences.preferredCenters.length > 3 && isMobile && (
                        <span className="badge badge-ghost">+{donor.donationPreferences.preferredCenters.length - 3}</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-base-content/70">No preferred centers selected</p>
                  )}
                </PreferenceCard>

                {/* Account Status */}
                <PreferenceCard
                  title="Account Status"
                  icon={FaUser}
                  fullWidth={true}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 p-3 bg-base-100 rounded-lg text-sm">
                      <span className="text-base-content/70">Active Status:</span>
                      <span className={`badge ${donor?.donationPreferences?.isActive ? 'badge-success' : 'badge-neutral'}`}>
                        {donor?.donationPreferences?.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-base-100 rounded-lg text-sm">
                      <span className="text-base-content/70">Last Updated:</span>
                      <span className="font-medium truncate">{formatMongoDate(donor?.updatedAt)}</span>
                    </div>
                  </div>
                </PreferenceCard>
              </motion.div>
            )}

            {/* Badges Tab */}
            {activeTab === "badges" && (
              <motion.div
                key="badges"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 sm:space-y-6"
              >
                <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <FaAward className="text-error" />
                  Badges & Achievements
                </h3>

                {donor?.badges?.length > 0 ? (
                  <div className={`grid grid-cols-1 ${isTablet ? 'sm:grid-cols-2' : 'lg:grid-cols-3'} gap-3 sm:gap-4`}>
                    {donor.badges.map((badge, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        className="card bg-linear-to-br from-error/5 to-transparent border border-error/20 hover:shadow-lg transition-all"
                      >
                        <div className="card-body items-center text-center p-4 sm:p-6">
                          <div className="bg-error/10 text-error rounded-full w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 flex items-center justify-center mb-2 sm:mb-4">
                            <FaAward size={isMobile ? 20 : 24} />
                          </div>
                          <h4 className="font-bold text-sm sm:text-base">{badge.name}</h4>
                          <p className="text-xs sm:text-sm text-base-content/70">{badge.description}</p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-base-content/50">
                            <FaCalendarAlt />
                            Earned: {formatMongoDate(badge.earnedDate)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={FaAward}
                    title="No badges earned yet"
                    message="Complete donations to earn achievements and badges"
                  >
                    {/* Achievement Goals */}
                    <div className={`grid grid-cols-1 ${isTablet ? 'sm:grid-cols-3' : 'md:grid-cols-3'} gap-3 sm:gap-4 mt-6 sm:mt-8 w-full max-w-2xl`}>
                      <GoalCard title="First Donation" color="error" />
                      <GoalCard title="5 Donations" color="warning" />
                      <GoalCard title="1 Year Active" color="success" />
                    </div>
                  </EmptyState>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Footer Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 sm:mt-8 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-error/5 rounded-full">
          <FaHeart className="text-error animate-pulse" size={isMobile ? 12 : 14} />
          <span className="text-xs sm:text-sm text-base-content/70">
            This donor is helping save lives through blood donation
          </span>
        </div>
      </motion.div>


      {/* Edit Donor Modal */}
      <dialog id="edit_donor_modal" className="modal">
        <EditDonorModal
          donorId={donor?._id?.$oid || donor?._id}
          donorData={donor}
          refreshDonors={handleRefreshProfile}
          onSuccess={handleEditProfileModalClose}
        />
        <form method="dialog" className="modal-backdrop hidden md:block">
          <button>close</button>
        </form>
      </dialog>
    </div >
  );
};

// ==========================================================================
// Sub Components - Reusable UI Elements
// ==========================================================================

/**
 * Info Row Component - Displays a labeled info with icon
 */
// eslint-disable-next-line no-unused-vars
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-base-100 rounded-lg text-xs sm:text-sm">
    <Icon className="text-base-content/40 shrink-0" size={14} />
    <span className="text-base-content/70 shrink-0">{label}</span>
    <span className="font-medium truncate">{value}</span>
  </div>
);

/**
 * Stat Item Component - Displays a statistic
 */
const StatItem = ({ title, value, color }) => (
  <div className="stat bg-base-100 rounded-lg p-3 sm:p-4">
    <div className="stat-title text-xs sm:text-sm">{title}</div>
    <div className={`stat-value text-lg sm:text-2xl text-${color}`}>{value}</div>
  </div>
);

/**
 * Condition Card Component - Displays medical conditions with badges
 */
// eslint-disable-next-line no-unused-vars
const ConditionCard = ({ title, icon: Icon, items, emptyMessage, badgeColor, isMobile }) => (
  <div className="card bg-base-200/50 border border-base-300">
    <div className="card-body p-4 sm:p-6">
      <h3 className="card-title text-base sm:text-lg flex items-center gap-2">
        <Icon className={`text-${badgeColor}`} />
        {title}
      </h3>
      {items?.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.slice(0, isMobile ? 4 : undefined).map((item, i) => (
            <div key={i} className={`badge badge-${badgeColor} badge-lg p-3 sm:p-4 gap-2 text-xs sm:text-sm`}>
              {item}
            </div>
          ))}
          {items.length > 4 && isMobile && (
            <div className="badge badge-ghost badge-lg p-3">+{items.length - 4}</div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-base-content/70">
          <FaCheckCircle className="text-success" />
          {emptyMessage}
        </div>
      )}
    </div>
  </div>
);

/**
 * Preference Card Component - Container for preference sections
 */
// eslint-disable-next-line no-unused-vars
const PreferenceCard = ({ title, icon: Icon, children, fullWidth = false }) => (
  <div className={`card bg-base-200/50 border border-base-300 ${fullWidth ? 'md:col-span-2' : ''}`}>
    <div className="card-body p-4 sm:p-6">
      <h3 className="card-title text-base sm:text-lg flex items-center gap-2">
        <Icon className="text-error" />
        {title}
      </h3>
      {children}
    </div>
  </div>
);

/**
 * Toggle Item Component - Displays a boolean preference with icons
 */
// eslint-disable-next-line no-unused-vars
const ToggleItem = ({ label, value, trueIcon: TrueIcon, falseIcon: FalseIcon }) => (
  <div className="flex justify-between items-center p-2 sm:p-3 bg-base-100 rounded-lg text-xs sm:text-sm">
    <span>{label}:</span>
    <span className={`badge ${value ? 'badge-success' : 'badge-neutral'} gap-1 sm:gap-2 p-2 sm:p-3`}>
      {value ? <TrueIcon size={12} /> : <FalseIcon size={12} />}
      {value ? "Yes" : "No"}
    </span>
  </div>
);

/**
 * Empty State Component - Displays when no data is available
 */
// eslint-disable-next-line no-unused-vars
const EmptyState = ({ icon: Icon, title, message, children }) => (
  <div className="card bg-base-200/50 border border-base-300 p-8 sm:p-12 text-center">
    <div className="flex flex-col items-center gap-4">
      <Icon className="text-4xl sm:text-6xl text-base-content/30" />
      <div>
        <p className="text-base sm:text-lg text-base-content/70">{title}</p>
        <p className="text-xs sm:text-sm text-base-content/50 mt-1">{message}</p>
      </div>
      {children}
    </div>
  </div>
);

/**
 * Goal Card Component - Displays achievement goals
 */
const GoalCard = ({ title, color }) => (
  <div className={`bg-base-100 p-3 sm:p-4 rounded-lg border border-${color}/20`}>
    <div className={`text-${color} font-bold text-xs sm:text-sm mb-1 sm:mb-2`}>{title}</div>
    <div className="text-xs text-base-content/60">Achievement goal</div>
  </div>
);

export default DonorProfile;
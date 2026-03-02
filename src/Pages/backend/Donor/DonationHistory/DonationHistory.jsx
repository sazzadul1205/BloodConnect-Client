// Pages/backend/Donor/DonationHistory/DonationHistory.jsx

/**
 * DonationHistory Component
 * 
 * Manages blood donation records for donors including:
 * - Viewing donation history in table format
 * - Adding new donation records (authorized users only)
 * - Viewing detailed donation information in modal
 * - Statistics dashboard with key metrics
 * - Responsive design for all screen sizes
 * - Eligibility tracking and next eligible date calculation
 * 
 * Uses TanStack Query for data fetching, caching, and mutations
 * 
 * @component
 */

// React
import React, { useCallback, useEffect, useMemo, useState } from "react";

// TanStack Query
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Sweet Alert
import Swal from "sweetalert2";

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Icons
import {
  FiClock,
  FiPlusCircle,
  FiSave,
  FiDroplet,
  FiCalendar,
  FiActivity,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
  FiRefreshCw,
} from "react-icons/fi";
import {
  FaTint,
  FaFlask,
  FaHeartbeat,
  FaHospital,
  FaCheckCircle as FaCheckCircleSolid,
} from "react-icons/fa";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";
import DonorProfileRequired from "../../../../shared/DonorProfileRequired";

// Modals
import DonationDetailsModal from "./DonationDetailsModal/DonationDetailsModal";

// Utils
import { formatAppDate, formatAppDateTime } from "../../../../utils/dateFormat";

// ==========================================================================
// Constants
// ==========================================================================

/**
 * Query keys for TanStack Query
 * @constant
 */
const QUERY_KEYS = {
  donorProfile: (donorId) => ['donor', donorId, 'profile'],
  donationHistory: (donorId) => ['donor', donorId, 'donations'],
};

/**
 * Donation type configurations
 * @constant
 */
const donationTypes = [
  {
    value: "whole_blood",
    label: "Whole Blood",
    icon: FaTint,
    color: "error",
    description: "450ml whole blood donation",
    mobileLabel: "Whole"
  },
  {
    value: "plasma",
    label: "Plasma",
    icon: FaFlask,
    color: "info",
    description: "Plasma via apheresis",
    mobileLabel: "Plasma"
  },
  {
    value: "platelets",
    label: "Platelets",
    icon: FaHeartbeat,
    color: "warning",
    description: "Platelets via apheresis",
    mobileLabel: "Platelets"
  },
];

/**
 * Reaction options for donation records
 * @constant
 */
const reactionOptions = [
  "None",
  "Mild dizziness",
  "Fatigue",
  "Bruising",
  "Nausea",
  "Fainting",
  "Other",
];

const DonationHistory = () => {
  // ==========================================================================
  // Hooks and Initialization
  // ==========================================================================

  const { user, loading: authLoading } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("auth_token");

  // ==========================================================================
  // Responsive Design Detection
  // ==========================================================================

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

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
  // State Management
  // ==========================================================================

  // Get donor ID from user object
  const donorId = useMemo(
    () => user?.userId || user?._id || user?.id || user?.uid,
    [user],
  );

  // Check if user can add donation records
  const canAddDonation = useMemo(() => {
    return ["admin", "super_admin", "hospital", "blood_bank"].includes(user?.role);
  }, [user?.role]);

  // UI States
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'stats'

  // Form state for adding donation
  const [form, setForm] = useState({
    type: "whole_blood",
    bloodBankId: "",
    bloodBankName: "",
    volume: "",
    reaction: "",
    notes: "",
  });

  // ==========================================================================
  // TanStack Query - Fetch Donor Profile
  // ==========================================================================

  /**
   * Fetches donor profile with donation history
   * @async
   * @function fetchDonorProfile
   */
  const fetchDonorProfile = useCallback(async () => {
    if (!donorId) {
      throw new Error("Donor ID not found. Please log in again.");
    }

    const response = await axiosInstance.get(`/donors/${donorId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    return response.data?.data || null;
  }, [axiosInstance, donorId, token]);

  /**
   * Donor profile query
   */
  const {
    data: donor,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
    isError: isProfileError,
  } = useQuery({
    queryKey: QUERY_KEYS.donorProfile(donorId),
    queryFn: fetchDonorProfile,
    enabled: !!donorId && !authLoading,
    retry: (failureCount, error) => {
      // Don't retry on 404 (profile missing)
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // ==========================================================================
  // TanStack Query - Add Donation Mutation
  // ==========================================================================

  /**
   * Adds a new donation record
   * @async
   * @function addDonation
   */
  const addDonation = useMutation({
    mutationFn: async (donationData) => {
      const response = await axiosInstance.post(
        `/donors/${donorId}/donations`,
        donationData,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      return response.data;
    },
    onSuccess: async () => {
      // Invalidate and refetch donor profile query
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.donorProfile(donorId),
      });

      // Show success message
      await Swal.fire({
        title: "Donation Added",
        html: `
          <div class="text-center">
            <p class="mb-2">Donation record was added successfully.</p>
            <p class="text-sm text-base-content/70">The donor's eligibility has been updated.</p>
          </div>
        `,
        icon: "success",
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Great!",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        ...(isMobile && { width: '90%' }),
      });

      // Reset form
      resetForm();
    },
    onError: async (err) => {
      console.error("Error adding donation:", err);

      await Swal.fire({
        title: "Failed to Add Donation",
        text: err?.response?.data?.error || "Could not add donation record.",
        icon: "error",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        ...(isMobile && { width: '90%' }),
      });
    },
  });

  // ==========================================================================
  // Form Handlers
  // ==========================================================================

  /**
   * Handles form input changes
   * @param {Object} e - Event object
   */
  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Resets the donation form to initial state
   */
  const resetForm = () => {
    setForm({
      type: "whole_blood",
      bloodBankId: "",
      bloodBankName: "",
      volume: "",
      reaction: "",
      notes: "",
    });
    setShowAddForm(false);
  };

  // ==========================================================================
  // Donation Operations
  // ==========================================================================

  /**
   * Handles adding a new donation record
   * @async
   * @param {Object} e - Form submit event
   */
  const handleAddDonation = async (e) => {
    e.preventDefault();
    if (!canAddDonation) return;

    // Validate volume
    const volumeNum = Number(form.volume);
    if (volumeNum < 100 || volumeNum > 1000) {
      await Swal.fire({
        title: "Invalid Volume",
        text: "Volume should be between 100ml and 1000ml.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        ...(isMobile && { width: '90%' }),
      });
      return;
    }

    // Prepare payload
    const payload = {
      type: form.type,
      bloodBankId: form.bloodBankId.trim(),
      bloodBankName: form.bloodBankName.trim() || undefined,
      volume: volumeNum,
      reaction: form.reaction === "None" ? null : form.reaction.trim(),
      notes: form.notes.trim() || null,
      date: new Date().toISOString(),
    };

    // Execute mutation
    addDonation.mutate(payload);
  };

  /**
   * Handles retry when error occurs
   */
  const handleRetry = () => {
    refetchProfile();
  };

  // ==========================================================================
  // Modal Handlers
  // ==========================================================================

  /**
   * Opens donation details modal
   * @param {Object} donation - Donation record to view
   */
  const viewDonationDetails = (donation) => {
    setSelectedDonation(donation);
    document.getElementById("donation_details_modal")?.showModal();
  };

  /**
   * Closes donation details modal
   */
  const closeModal = () => {
    setSelectedDonation(null);
    document.getElementById("donation_details_modal")?.close();
  };

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  /**
   * Formats date with time for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date with time
   */
  const formatDate = (dateString) => {
    return formatAppDateTime(dateString);
  };

  /**
   * Formats date only for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  const formatDateOnly = (dateString) => {
    return formatAppDate(dateString, isMobile ? "MMM d, yyyy" : "MMMM d, yyyy");
  };

  /**
   * Gets donation type details
   * @param {string} type - Donation type value
   * @returns {Object} Donation type configuration
   */
  const getDonationTypeDetails = (type) => {
    return donationTypes.find(t => t.value === type) || donationTypes[0];
  };

  /**
   * Formats donation type for display
   * @param {string} type - Donation type
   * @returns {string} Formatted display string
   */
  const formatDonationType = (type) => {
    if (!type) return "N/A";
    return type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  // ==========================================================================
  // Statistics Calculation
  // ==========================================================================

  /**
   * Calculates donation statistics
   * @type {Object}
   */
  const stats = useMemo(() => {
    const history = donor?.donationHistory || [];
    const totalDonations = history.length;
    const totalVolume = history.reduce((sum, item) => sum + (item.volume || 0), 0);
    const lastDonation = history.length > 0 ? history[history.length - 1] : null;

    // Calculate donations by type
    const donationsByType = history.reduce((acc, item) => {
      const type = item.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Calculate average volume
    const avgVolume = totalDonations > 0 ? Math.round(totalVolume / totalDonations) : 0;

    // Get reactions count
    const reactions = history.filter(item => item.reaction && item.reaction !== "None").length;

    return {
      totalDonations,
      totalVolume,
      avgVolume,
      lastDonation,
      donationsByType,
      reactions,
      hasHistory: totalDonations > 0,
    };
  }, [donor]);

  // ==========================================================================
  // Derived States
  // ==========================================================================

  const history = donor?.donationHistory || [];
  const profileMissing = isProfileError && profileError?.response?.status === 404;
  const isLoading = profileLoading || authLoading;
  const isSaving = addDonation.isPending;

  // ==========================================================================
  // Loading State
  // ==========================================================================

  if (isLoading) return <BloodLoader fullscreen={true} />;

  // ==========================================================================
  // Error State (Non-404)
  // ==========================================================================

  if (isProfileError && !profileMissing) {
    return <ErrorState error={profileError} onRetry={handleRetry} />;
  }

  // ==========================================================================
  // Profile Missing State
  // ==========================================================================

  if (profileMissing) {
    return (
      <DonorProfileRequired
        title="Donation History Needs Donor Profile"
        description="Create your donor profile first, then your donations and eligibility timeline will appear here."
      />
    );
  }

  // ==========================================================================
  // Main Render
  // ==========================================================================

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-5">

      {/* ==================================================================
            Header Section - Responsive
        ================================================================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 text-base-content">
            <FiClock className="text-error" />
            {isMobile ? 'Donation History' : 'Donation History'}
          </h1>
          <p className="text-xs sm:text-sm text-base-content/60 mt-1">
            {isMobile
              ? 'Track your blood donation records'
              : 'Track and manage blood donation records'}
          </p>
        </div>

        {/* Refresh Button (TanStack Query) */}
        <button
          onClick={() => refetchProfile()}
          className="btn btn-ghost btn-sm sm:btn-md gap-2"
          disabled={profileLoading}
          title="Refresh data"
        >
          <FiRefreshCw className={`${profileLoading ? 'animate-spin' : ''}`} />
          {!isMobile && 'Refresh'}
        </button>

        {/* Mobile View Toggle */}
        {isMobile && (
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setMobileView('stats')}
              className={`btn btn-sm flex-1 ${mobileView === 'stats' ? 'btn-error' : 'btn-ghost'}`}
            >
              <FaHeartbeat />
              Stats
            </button>
            <button
              onClick={() => setMobileView('list')}
              className={`btn btn-sm flex-1 ${mobileView === 'list' ? 'btn-error' : 'btn-ghost'}`}
            >
              <FiClock />
              History
            </button>
          </div>
        )}

        {/* Desktop Stats Badge */}
        {!isMobile && (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="badge badge-outline badge-lg gap-1 sm:gap-2 p-3 sm:p-4">
              <FaTint className="text-error" />
              Total: {stats.totalDonations}
            </div>
            <div className="badge badge-outline badge-lg gap-1 sm:gap-2 p-3 sm:p-4">
              <FaFlask className="text-info" />
              {stats.totalVolume}ml
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================
            Statistics Cards - Responsive Grid
        ================================================================== */}
      {(!isMobile || mobileView === 'stats') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`grid gap-3 sm:gap-4 
              ${isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-4'}
            `}
        >
          {/* Total Donations Card */}
          <div className="stat bg-base-100 rounded-lg shadow-sm border border-base-300 p-3 sm:p-4">
            <div className="stat-figure text-error">
              <FaTint size={isMobile ? 20 : 24} />
            </div>
            <div className="stat-title text-xs sm:text-sm">Total Donations</div>
            <div className="stat-value text-lg sm:text-2xl text-error">{stats.totalDonations}</div>
            {!isMobile && <div className="stat-desc text-xs">Lifetime</div>}
          </div>

          {/* Total Volume Card */}
          <div className="stat bg-base-100 rounded-lg shadow-sm border border-base-300 p-3 sm:p-4">
            <div className="stat-figure text-info">
              <FaFlask size={isMobile ? 20 : 24} />
            </div>
            <div className="stat-title text-xs sm:text-sm">Total Volume</div>
            <div className="stat-value text-lg sm:text-2xl text-info">{stats.totalVolume}ml</div>
            {!isMobile && <div className="stat-desc text-xs">Avg: {stats.avgVolume}ml</div>}
          </div>

          {/* Last Donation Card */}
          <div className="stat bg-base-100 rounded-lg shadow-sm border border-base-300 p-3 sm:p-4">
            <div className="stat-figure text-warning">
              <FaHeartbeat size={isMobile ? 20 : 24} />
            </div>
            <div className="stat-title text-xs sm:text-sm">Last Donation</div>
            <div className="stat-value text-lg sm:text-2xl text-warning truncate">
              {stats.lastDonation
                ? formatDateOnly(stats.lastDonation.date).split(' ')[0]
                : 'Never'}
            </div>
            {!isMobile && (
              <div className="stat-desc text-xs">
                {stats.lastDonation?.type ? formatDonationType(stats.lastDonation.type) : ''}
              </div>
            )}
          </div>

          {/* Next Eligible Card */}
          <div className="stat bg-base-100 rounded-lg shadow-sm border border-base-300 p-3 sm:p-4">
            <div className="stat-figure text-success">
              <FaCheckCircleSolid size={isMobile ? 20 : 24} />
            </div>
            <div className="stat-title text-xs sm:text-sm">Next Eligible</div>
            <div className="stat-value text-lg sm:text-2xl text-success">
              {stats.lastDonation?.nextEligibleDate
                ? formatDateOnly(stats.lastDonation.nextEligibleDate).split(' ')[0]
                : 'Now'}
            </div>
            {!isMobile && (
              <div className="stat-desc text-xs">
                {stats.lastDonation ? 'Waiting period' : 'Eligible now'}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ==================================================================
            Add Donation Form - Only for authorized users
        ================================================================== */}
      {canAddDonation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-base-100 rounded-lg shadow-sm border border-base-300 overflow-hidden"
        >
          {/* Form Header - Click to toggle */}
          <div
            className="p-3 sm:p-4 bg-base-200/50 cursor-pointer flex items-center justify-between"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
              <FiPlusCircle className="text-error" />
              {isMobile ? 'Add Donation' : 'Add New Donation Record'}
            </h3>
            <span className={`transform transition-transform ${showAddForm ? 'rotate-180' : ''}`}>
              {showAddForm ? <FiChevronUp /> : <FiChevronDown />}
            </span>
          </div>

          {/* Collapsible Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 sm:p-5 border-t border-base-300"
              >
                <form onSubmit={handleAddDonation} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

                    {/* Donation Type Selection */}
                    <div className="form-control sm:col-span-2">
                      <label className="label">
                        <span className="label-text font-medium text-xs sm:text-sm">Donation Type</span>
                      </label>
                      <div className={`grid ${isMobile ? 'grid-cols-3 gap-1' : 'grid-cols-3 gap-2'}`}>
                        {donationTypes.map((type) => {
                          const Icon = type.icon;
                          const isSelected = form.type === type.value;
                          return (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, type: type.value }))}
                              className={`
                                  btn ${isMobile ? 'btn-xs' : 'btn-sm'} gap-1 sm:gap-2
                                  ${isSelected ? `btn-${type.color}` : 'btn-outline'}
                                `}
                            >
                              <Icon className={isSelected ? '' : `text-${type.color}`} />
                              {isMobile ? type.mobileLabel : type.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Volume Input */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium text-xs sm:text-sm">Volume (ml)</span>
                      </label>
                      <input
                        type="number"
                        min="100"
                        max="1000"
                        step="10"
                        name="volume"
                        value={form.volume}
                        onChange={handleInput}
                        className="input input-bordered input-sm sm:input-md"
                        placeholder="450"
                        required
                      />
                      {!isMobile && (
                        <label className="label">
                          <span className="label-text-alt text-base-content/60 text-xs">
                            Standard: 450ml for whole blood
                          </span>
                        </label>
                      )}
                    </div>

                    {/* Blood Bank ID */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium text-xs sm:text-sm">Blood Bank ID</span>
                      </label>
                      <input
                        type="text"
                        name="bloodBankId"
                        value={form.bloodBankId}
                        onChange={handleInput}
                        className="input input-bordered input-sm sm:input-md"
                        placeholder="Bank ID"
                        required
                      />
                    </div>

                    {/* Blood Bank Name (Optional) */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium text-xs sm:text-sm">Bank Name</span>
                      </label>
                      <input
                        type="text"
                        name="bloodBankName"
                        value={form.bloodBankName}
                        onChange={handleInput}
                        className="input input-bordered input-sm sm:input-md"
                        placeholder="e.g. City Blood Bank"
                      />
                    </div>

                    {/* Reaction Selection */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium text-xs sm:text-sm">Reaction</span>
                      </label>
                      <select
                        name="reaction"
                        value={form.reaction}
                        onChange={handleInput}
                        className="select select-bordered select-sm sm:select-md"
                      >
                        {reactionOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Notes */}
                    <div className="form-control sm:col-span-2">
                      <label className="label">
                        <span className="label-text font-medium text-xs sm:text-sm">Additional Notes</span>
                      </label>
                      <textarea
                        name="notes"
                        value={form.notes}
                        onChange={handleInput}
                        className="textarea textarea-bordered textarea-sm sm:textarea-md"
                        rows={isMobile ? 2 : 2}
                        placeholder="Any additional information..."
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      type="submit"
                      className="btn btn-error gap-2 btn-sm sm:btn-md"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <span className="loading loading-spinner loading-xs sm:loading-sm"></span>
                          {isMobile ? 'Saving...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <FiSave />
                          {isMobile ? 'Save' : 'Save Donation Record'}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="btn btn-ghost btn-sm sm:btn-md"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Form Info Alert */}
                  <div className="alert bg-info/10 border-info/20 text-xs sm:text-sm p-2 sm:p-3">
                    <FiAlertCircle className="text-info shrink-0" />
                    <span className="truncate">
                      {isMobile
                        ? 'Updates eligibility automatically'
                        : 'Adding a donation record will automatically update the donor\'s eligibility status.'}
                    </span>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ==================================================================
            Donation History Display
        ================================================================== */}
      {(!isMobile || mobileView === 'list') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-base-100 rounded-lg shadow-sm border border-base-300 overflow-hidden"
        >
          {/* Table Header */}
          <div className="p-3 sm:p-4 border-b border-base-300 font-semibold flex justify-between items-center">
            <span className="text-sm sm:text-base">Donation Records</span>
            <span className="badge badge-error badge-sm sm:badge-md">{history.length}</span>
          </div>

          {history.length > 0 ? (
            <div className="overflow-x-auto">
              {/* Desktop Table View */}
              {!isMobile ? (
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th className="text-xs sm:text-sm">Date</th>
                      <th className="text-xs sm:text-sm">Type</th>
                      <th className="text-xs sm:text-sm">Volume</th>
                      <th className="text-xs sm:text-sm">Blood Bank</th>
                      <th className="text-xs sm:text-sm">Reaction</th>
                      <th className="text-xs sm:text-sm">Next Eligible</th>
                      <th className="text-xs sm:text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item, idx) => {
                      const typeDetails = getDonationTypeDetails(item?.type);
                      const TypeIcon = typeDetails.icon;

                      return (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="hover:bg-base-200 cursor-pointer"
                          onClick={() => viewDonationDetails(item)}
                        >
                          <td>
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <FiCalendar className="opacity-50 shrink-0" />
                              {formatDateOnly(item?.date)}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <TypeIcon className={`text-${typeDetails.color} shrink-0`} size={14} />
                              <span className="text-xs sm:text-sm capitalize">
                                {item?.type?.replace(/_/g, ' ') || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="font-mono text-xs sm:text-sm">{item?.volume ? `${item.volume}ml` : "N/A"}</td>
                          <td>
                            <div className="flex items-center gap-1">
                              <FaHospital className="opacity-50 text-xs shrink-0" />
                              <span className="text-xs sm:text-sm truncate max-w-24 sm:max-w-32">
                                {item?.bloodBankName ||
                                  (typeof item?.bloodBankId === "object"
                                    ? item?.bloodBankId?.$oid?.slice(-6)
                                    : item?.bloodBankId?.slice(-6) || "N/A")}
                              </span>
                            </div>
                          </td>
                          <td>
                            {item?.reaction ? (
                              <span className="badge badge-warning badge-sm text-xs">{item.reaction}</span>
                            ) : (
                              <span className="badge badge-success badge-sm text-xs">None</span>
                            )}
                          </td>
                          <td>
                            {item?.nextEligibleDate ? (
                              <span className="text-xs sm:text-sm">
                                {formatDateOnly(item.nextEligibleDate).split(' ')[0]}
                              </span>
                            ) : (
                              <span className="badge badge-success badge-sm text-xs">Now</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-xs btn-ghost gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                viewDonationDetails(item);
                              }}
                            >
                              <FiActivity />
                              {!isTablet && 'Details'}
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                /* Mobile Card View */
                <div className="p-3 space-y-3">
                  {history.map((item, idx) => {
                    const typeDetails = getDonationTypeDetails(item?.type);
                    const TypeIcon = typeDetails.icon;

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-base-200/50 rounded-lg p-3 border border-base-300"
                        onClick={() => viewDonationDetails(item)}
                      >
                        {/* Card Header - Date and Type */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <FiCalendar className="text-base-content/40" size={12} />
                            <span className="text-xs font-medium">{formatDateOnly(item?.date)}</span>
                          </div>
                          <div className={`badge badge-${typeDetails.color} badge-sm gap-1`}>
                            <TypeIcon size={10} />
                            {formatDonationType(item?.type).split(' ')[0]}
                          </div>
                        </div>

                        {/* Card Details Grid */}
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="bg-base-100 rounded p-2">
                            <p className="text-xs text-base-content/50">Volume</p>
                            <p className="text-sm font-mono">{item?.volume || 'N/A'}ml</p>
                          </div>
                          <div className="bg-base-100 rounded p-2">
                            <p className="text-xs text-base-content/50">Reaction</p>
                            <p className="text-xs">
                              {item?.reaction ? (
                                <span className="badge badge-warning badge-xs">{item.reaction}</span>
                              ) : (
                                <span className="badge badge-success badge-xs">None</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Bank Info */}
                        <div className="flex items-center gap-2 mt-2 text-xs bg-base-100 rounded p-2">
                          <FaHospital className="text-base-content/40 shrink-0" size={10} />
                          <span className="truncate flex-1">
                            {item?.bloodBankName ||
                              (typeof item?.bloodBankId === "object"
                                ? item?.bloodBankId?.$oid?.slice(-6)
                                : item?.bloodBankId?.slice(-6) || "Unknown Bank")}
                          </span>
                          <button className="btn btn-xs btn-ghost">
                            <FiActivity size={12} />
                          </button>
                        </div>

                        {/* Next Eligible */}
                        {item?.nextEligibleDate && (
                          <div className="flex items-center gap-2 mt-2 text-xs bg-base-100 rounded p-2">
                            <FaCheckCircleSolid className="text-success" size={10} />
                            <span>Next eligible: {formatDateOnly(item.nextEligibleDate)}</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 sm:p-12 text-center text-base-content/70"
            >
              <FiDroplet className="mx-auto text-3xl sm:text-4xl mb-3 opacity-50" />
              <p className="text-base sm:text-lg font-medium mb-1">No Donation History Yet</p>
              <p className="text-xs sm:text-sm opacity-70">
                {canAddDonation
                  ? "Use the form above to add the first donation record."
                  : "Donation records will appear here once you've donated."}
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* ==================================================================
            Donation Details Modal
        ================================================================== */}
      <dialog id="donation_details_modal" className="modal">
        <DonationDetailsModal
          selectedDonation={selectedDonation}
          formatDate={formatDate}
          formatDateOnly={formatDateOnly}
          formatDonationType={formatDonationType}
          onClose={closeModal}
          isMobile={isMobile}
        />

        {/* Modal Backdrop */}
        <form method="dialog" className="modal-backdrop hidden md:block">
          <button onClick={closeModal}>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default DonationHistory;
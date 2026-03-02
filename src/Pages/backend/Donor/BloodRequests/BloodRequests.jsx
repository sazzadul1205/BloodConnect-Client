// Pages/backend/Donor/BloodRequests/BloodRequests.jsx

/**
 * BloodRequests Component
 * 
 * Manages blood donation requests for donors including:
 * - Viewing pending blood requests matching donor's blood type
 * - Searching and filtering requests by hospital or blood type
 * - Viewing detailed request information
 * - Responding to requests (accept/reject/donated)
 * - Real-time status updates
 * - Responsive design for all screen sizes
 * - Eligibility tracking and matching based on donor profile
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

// Icons - Fi (Feather Icons)
import {
  FiRefreshCw,
  FiEye,
  FiSend,
  FiAlertCircle,
  FiClock,
  FiMapPin,
  FiActivity,
  FiChevronDown,
  FiChevronUp,
  FiFilter,
  FiSearch,
} from "react-icons/fi";

// Icons - Fa (Font Awesome)
import {
  FaTint,
  FaHeartbeat,
  FaHospital,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaTimesCircle,
  FaUserMd,
} from "react-icons/fa";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";
import DonorProfileRequired from "../../../../shared/DonorProfileRequired";

// Utils
import { formatAppDateTime, formatAppDate } from "../../../../utils/dateFormat";

// ==========================================================================
// Constants
// ==========================================================================

/**
 * Query keys for TanStack Query
 * @constant
 */
const QUERY_KEYS = {
  donorProfile: (donorId) => ['donor', donorId, 'profile'],
  bloodRequests: (bloodType) => ['bloodRequests', bloodType],
  requestDetails: (requestId) => ['bloodRequest', requestId],
};

/**
 * Response options for donor actions
 * @constant
 */
const responseOptions = [
  {
    value: "accepted",
    label: "Accept",
    color: "success",
    icon: FaCheckCircle,
    description: "I can donate for this request",
    mobileLabel: "Accept"
  },
  {
    value: "rejected",
    label: "Reject",
    color: "error",
    icon: FaTimesCircle,
    description: "I cannot donate at this time",
    mobileLabel: "Reject"
  },
  {
    value: "donated",
    label: "Donated",
    color: "info",
    icon: FaHeartbeat,
    description: "I have already donated",
    mobileLabel: "Donated"
  },
];

/**
 * Urgency level color mapping
 * @constant
 */
const urgencyColors = {
  emergency: "error",
  urgent: "warning",
  normal: "info",
  low: "success",
};

/**
 * Urgency level display labels
 * @constant
 */
const urgencyLabels = {
  emergency: "Emergency",
  urgent: "Urgent",
  normal: "Normal",
  low: "Low Priority",
};

/**
 * Status color mapping
 * @constant
 */
const statusColors = {
  pending: "warning",
  accepted: "info",
  rejected: "error",
  donated: "success",
  completed: "success",
  cancelled: "error",
};

/**
 * Status display labels
 * @constant
 */
const statusLabels = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  donated: "Donated",
  completed: "Completed",
  cancelled: "Cancelled",
};

// ==========================================================================
// Helper Functions
// ==========================================================================

/**
 * Extracts ID from MongoDB ObjectId
 * @param {Object|string} value - MongoDB ObjectId or string
 * @returns {string} Extracted ID
 */
const getId = (value) =>
  typeof value === "object" ? value?.$oid || value?.toString?.() : value;

const BloodRequests = () => {
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
  // eslint-disable-next-line no-unused-vars
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

  // User role check
  const isDonor = useMemo(() => user?.role === "donor", [user]);

  // Get donor ID from user object
  const donorId = useMemo(
    () => user?.userId || user?._id || user?.id || user?.uid,
    [user],
  );

  // UI States
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [profileMissing, setProfileMissing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'details'

  // Form state for response
  const [respondForm, setRespondForm] = useState({
    response: "accepted",
    message: "",
  });

  // ==========================================================================
  // TanStack Query - Donor Profile
  // ==========================================================================

  /**
   * Fetches donor profile to get blood type
   * @async
   * @function fetchDonorProfile
   */
  const fetchDonorProfile = useCallback(async () => {
    if (!donorId) {
      throw new Error("Donor ID not found");
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
    data: donorProfile,
    isLoading: profileLoading,
    error: profileError,
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

  // Extract blood type from donor profile
  const donorBloodType = donorProfile?.medicalInfo?.bloodType || "";

  // Check if profile is missing
  useEffect(() => {
    if (isProfileError && profileError?.response?.status === 404) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfileMissing(true);
    } else {
      setProfileMissing(false);
    }
  }, [isProfileError, profileError]);

  // ==========================================================================
  // TanStack Query - Blood Requests
  // ==========================================================================

  /**
   * Fetches pending blood requests based on donor's blood type
   * @async
   * @function fetchBloodRequests
   */
  const fetchBloodRequests = useCallback(async () => {
    if (!donorBloodType) {
      return [];
    }

    const query = new URLSearchParams({ status: "pending" });
    if (donorBloodType) {
      query.set("bloodType", donorBloodType);
    }

    const response = await axiosInstance.get(`/blood-requests?${query.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    return response.data?.data || [];
  }, [axiosInstance, donorBloodType, token]);

  /**
   * Blood requests query
   */
  const {
    data: requests = [],
    isLoading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests,
    isFetching: isRefetching,
  } = useQuery({
    queryKey: QUERY_KEYS.bloodRequests(donorBloodType),
    queryFn: fetchBloodRequests,
    enabled: !!donorBloodType && !profileLoading && !profileMissing,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // ==========================================================================
  // TanStack Query - Request Details
  // ==========================================================================

  /**
   * Fetches detailed information for a specific request
   * @async
   * @function fetchRequestDetails
   */
  const fetchRequestDetails = useCallback(async () => {
    if (!selectedRequestId) return null;

    const response = await axiosInstance.get(`/blood-requests/${selectedRequestId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    return response.data?.data || null;
  }, [axiosInstance, selectedRequestId, token]);

  /**
   * Request details query
   */
  const {
    data: selectedRequest,
    isLoading: detailsLoading,
  } = useQuery({
    queryKey: QUERY_KEYS.requestDetails(selectedRequestId),
    queryFn: fetchRequestDetails,
    enabled: !!selectedRequestId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // ==========================================================================
  // TanStack Query - Respond to Request Mutation
  // ==========================================================================

  /**
   * Responds to a blood request
   * @async
   * @function respondToRequest
   */
  const respondToRequest = useMutation({
    mutationFn: async ({ requestId, response, message }) => {
      const response_data = await axiosInstance.post(
        `/blood-requests/${requestId}/respond`,
        {
          response,
          message: message || undefined,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      return response_data.data;
    },
    onSuccess: async (_, variables) => {
      // Invalidate and refetch relevant queries
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.bloodRequests(donorBloodType),
      });

      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.requestDetails(selectedRequestId),
      });

      // Show success message
      await Swal.fire({
        title: "Response Sent",
        html: `
          <div class="text-center">
            <p class="mb-2">You marked this request as ${variables.response}.</p>
            <p class="text-sm text-base-content/70">Thank you for your response!</p>
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
      setRespondForm({ response: "accepted", message: "" });
    },
    onError: async (err) => {
      console.error("Error responding to request:", err);

      await Swal.fire({
        title: "Response Failed",
        text: err?.response?.data?.error || "Could not submit response.",
        icon: "error",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        ...(isMobile && { width: '90%' }),
      });
    },
  });

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  /**
   * Handles selecting a request to view details
   * @param {string} requestId - ID of the request to select
   */
  const handleSelectRequest = (requestId) => {
    setSelectedRequestId(requestId);

    // On mobile, switch to details view
    if (isMobile) {
      setMobileView('details');
    }
  };

  /**
   * Handles donor response submission
   */
  const handleRespond = () => {
    const selectedId = getId(selectedRequest?._id);
    if (!selectedId) return;

    // Check if user is a donor
    if (!isDonor) {
      Swal.fire({
        title: "Not Allowed",
        text: "Only donors can respond to requests.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        ...(isMobile && { width: '90%' }),
      });
      return;
    }

    // Execute mutation
    respondToRequest.mutate({
      requestId: selectedId,
      response: respondForm.response,
      message: respondForm.message,
    });
  };

  /**
   * Handles back button on mobile
   */
  const handleMobileBack = () => {
    setMobileView('list');
    setSelectedRequestId(null);
  };

  /**
   * Handles retry when error occurs
   */
  const handleRetry = () => {
    refetchRequests();
  };

  // ==========================================================================
  // Filtering and Search
  // ==========================================================================

  /**
   * Filters requests based on search term and urgency filter
   * @type {Array}
   */
  const filteredRequests = useMemo(() => {
    let filtered = requests;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(req => {
        const hospitalName = req?.location?.hospitalName || req?.patientInfo?.hospital || "";
        const bloodType = req?.requestDetails?.bloodType || "";
        const searchLower = searchTerm.toLowerCase();

        return hospitalName.toLowerCase().includes(searchLower) ||
          bloodType.toLowerCase().includes(searchLower);
      });
    }

    // Apply urgency filter
    if (urgencyFilter !== "all") {
      filtered = filtered.filter(req =>
        (req?.requestDetails?.urgency || "normal") === urgencyFilter
      );
    }

    return filtered;
  }, [requests, searchTerm, urgencyFilter]);

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
   * Gets urgency badge configuration
   * @param {string} urgency - Urgency level
   * @returns {Object} Badge configuration
   */
  const getUrgencyBadge = (urgency = "normal") => {
    return {
      color: urgencyColors[urgency] || "info",
      label: urgencyLabels[urgency] || "Normal",
      icon: urgency === "emergency" ? FaExclamationCircle : FiClock,
    };
  };

  /**
   * Gets status badge configuration
   * @param {string} status - Request status
   * @returns {Object} Badge configuration
   */
  const getStatusBadge = (status = "pending") => {
    return {
      color: statusColors[status] || "warning",
      label: statusLabels[status] || "Pending",
    };
  };

  // ==========================================================================
  // Loading States
  // ==========================================================================

  const isLoading = profileLoading || (authLoading && !donorBloodType);
  const isRequestsLoading = requestsLoading && !requests.length;
  const isResponding = respondToRequest.isPending;

  if (isLoading) return <BloodLoader fullscreen={true} />;

  // ==========================================================================
  // Error State
  // ==========================================================================

  if (requestsError) {
    return <ErrorState error={requestsError} onRetry={handleRetry} />;
  }

  // ==========================================================================
  // Profile Missing State
  // ==========================================================================

  if (profileMissing) {
    return (
      <DonorProfileRequired
        title="Blood Requests Need Donor Profile"
        description="Create your donor profile so we can match requests using your blood type."
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
            <FaTint className="text-error" />
            {isMobile ? 'Blood Requests' : 'Blood Requests'}
          </h1>
          <p className="text-xs sm:text-sm text-base-content/60 mt-1">
            {isMobile
              ? 'View and respond to requests'
              : 'View and respond to blood requests matching your criteria'}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Blood Type Badge */}
          <div className="badge badge-outline badge-lg gap-1 sm:gap-2 p-3 sm:p-4 flex-1 sm:flex-none justify-center">
            <FaHeartbeat className="text-error" />
            {donorBloodType || "Not set"}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => refetchRequests()}
            className="btn btn-outline btn-sm sm:btn-md gap-2"
            disabled={isRefetching}
            title="Refresh requests"
          >
            <FiRefreshCw className={isRefetching ? 'animate-spin' : ''} />
            {!isMobile && 'Refresh'}
          </button>
        </div>
      </div>

      {/* ==================================================================
            Mobile View Toggle (Only on mobile)
        ================================================================== */}
      {isMobile && (
        <div className="flex gap-2">
          <button
            onClick={() => setMobileView('list')}
            className={`btn btn-sm flex-1 ${mobileView === 'list' ? 'btn-error' : 'btn-ghost'}`}
          >
            <FiActivity />
            Requests ({filteredRequests.length})
          </button>
          <button
            onClick={() => setMobileView('details')}
            className={`btn btn-sm flex-1 ${mobileView === 'details' ? 'btn-error' : 'btn-ghost'}`}
            disabled={!selectedRequestId}
          >
            <FiEye />
            Details
          </button>
        </div>
      )}

      {/* ==================================================================
            Search and Filters
        ================================================================== */}
      {(!isMobile || mobileView === 'list') && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Search Bar */}
          <div className="form-control">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
              <input
                type="text"
                placeholder={isMobile ? "Search..." : "Search by hospital or blood type..."}
                className="input input-bordered w-full pl-10 input-sm sm:input-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Toggle (Mobile) */}
          {isMobile && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-ghost btn-sm w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <FiFilter />
                Filter by Urgency
              </span>
              {showFilters ? <FiChevronUp /> : <FiChevronDown />}
            </button>
          )}

          {/* Filter Options */}
          <AnimatePresence>
            {(!isMobile || showFilters) && (
              <motion.div
                initial={isMobile ? { opacity: 0, height: 0 } : false}
                animate={isMobile ? { opacity: 1, height: 'auto' } : false}
                exit={isMobile ? { opacity: 0, height: 0 } : false}
                className="flex flex-wrap gap-2"
              >
                <button
                  onClick={() => setUrgencyFilter("all")}
                  className={`btn btn-xs sm:btn-sm ${urgencyFilter === "all" ? 'btn-error' : 'btn-outline btn-error'}`}
                >
                  All
                </button>
                {Object.keys(urgencyColors).map((urgency) => (
                  <button
                    key={urgency}
                    onClick={() => setUrgencyFilter(urgency)}
                    className={`btn btn-xs sm:btn-sm btn-${urgencyColors[urgency]} 
                        ${urgencyFilter === urgency ? '' : 'btn-outline'}`}
                  >
                    {urgencyLabels[urgency]}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ==================================================================
            Main Content Grid
        ================================================================== */}
      <div className={`
          ${!isMobile ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}
        `}>
        {/* Requests List Panel */}
        {(!isMobile || mobileView === 'list') && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-base-100 rounded-lg border border-base-300 shadow-sm overflow-hidden"
          >
            {/* Panel Header */}
            <div className="p-3 sm:p-4 border-b border-base-300 font-semibold flex justify-between items-center">
              <span className="text-sm sm:text-base">Pending Requests</span>
              <span className="badge badge-error badge-sm sm:badge-md">
                {filteredRequests.length}
              </span>
            </div>

            {isRequestsLoading ? (
              <div className="flex justify-center py-8">
                <BloodLoader />
              </div>
            ) : filteredRequests.length > 0 ? (
              <div className="divide-y divide-base-300 max-h-125 sm:max-h-150 overflow-y-auto">
                {filteredRequests.map((req) => {
                  const requestId = getId(req._id);
                  const urgency = req?.requestDetails?.urgency || "normal";
                  const status = req?.status?.current || "pending";
                  const urgencyBadge = getUrgencyBadge(urgency);
                  const UrgencyIcon = urgencyBadge.icon;
                  const statusBadge = getStatusBadge(status);

                  return (
                    <motion.div
                      key={requestId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                      className={`
                          p-3 sm:p-4 transition-colors cursor-pointer
                          ${selectedRequestId === requestId
                          ? 'bg-error/5 border-l-4 border-l-error'
                          : 'hover:bg-base-200'
                        }
                        `}
                      onClick={() => handleSelectRequest(requestId)}
                    >
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        {/* Request Summary */}
                        <div className="flex-1 min-w-0">
                          {/* Top Row - Blood Type and Units */}
                          <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-error text-sm sm:text-base">
                              {req?.requestDetails?.bloodType || "N/A"}
                            </span>
                            <span className="badge badge-sm badge-outline">
                              {req?.requestDetails?.units || 0} units
                            </span>
                            <span className={`badge badge-sm badge-${urgencyBadge.color} gap-1`}>
                              <UrgencyIcon size={10} />
                              {isMobile ? urgencyBadge.label.slice(0, 3) : urgencyBadge.label}
                            </span>
                          </div>

                          {/* Hospital Name */}
                          <p className="text-xs sm:text-sm flex items-center gap-1 truncate">
                            <FaHospital className="text-base-content/50 shrink-0" size={12} />
                            <span className="truncate">
                              {req?.location?.hospitalName || req?.patientInfo?.hospital || "Unknown hospital"}
                            </span>
                          </p>

                          {/* Bottom Row - Date and Status */}
                          <div className="flex items-center gap-2 sm:gap-3 mt-2 text-xs text-base-content/60">
                            <span className="flex items-center gap-1">
                              <FiClock size={10} />
                              {formatDateOnly(req?.createdAt)}
                            </span>
                            <span className={`badge badge-sm badge-${statusBadge.color}`}>
                              {statusBadge.label}
                            </span>
                          </div>
                        </div>

                        {/* View Details Button */}
                        <button
                          type="button"
                          className="btn btn-xs sm:btn-sm btn-error gap-1 sm:gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRequest(requestId);
                          }}
                          disabled={detailsLoading}
                        >
                          <FiEye size={12} />
                          {!isMobile && 'View'}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              // Empty State
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 sm:p-12 text-center text-base-content/70"
              >
                <FiAlertCircle className="mx-auto text-3xl sm:text-4xl mb-3 opacity-50" />
                <p className="text-sm sm:text-base font-medium mb-1">No Requests Found</p>
                <p className="text-xs sm:text-sm opacity-70">
                  {searchTerm || urgencyFilter !== "all"
                    ? "Try adjusting your filters"
                    : "No blood requests match your blood type"}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Request Details Panel */}
        {(!isMobile || mobileView === 'details') && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-base-100 rounded-lg border border-base-300 shadow-sm overflow-hidden"
          >
            {/* Panel Header */}
            <div className="p-3 sm:p-4 border-b border-base-300 font-semibold flex items-center gap-2">
              {isMobile && (
                <button
                  onClick={handleMobileBack}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  ←
                </button>
              )}
              <FiEye className="text-error" />
              <span className="text-sm sm:text-base">Request Details</span>
            </div>

            {/* Content Area */}
            <div className="p-3 sm:p-5">
              {detailsLoading ? (
                // Loading State
                <div className="flex justify-center py-8">
                  <BloodLoader />
                </div>
              ) : selectedRequest ? (
                // Request Details Content
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3 sm:space-y-4"
                >
                  {/* Request Information Cards */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="bg-base-200 rounded-lg p-2 sm:p-3">
                      <p className="text-xs opacity-70 mb-1">Blood Type</p>
                      <p className="font-semibold text-error text-base sm:text-lg">
                        {selectedRequest?.requestDetails?.bloodType || "N/A"}
                      </p>
                    </div>
                    <div className="bg-base-200 rounded-lg p-2 sm:p-3">
                      <p className="text-xs opacity-70 mb-1">Units Needed</p>
                      <p className="font-semibold text-base sm:text-lg">
                        {selectedRequest?.requestDetails?.units || 0}
                      </p>
                    </div>
                  </div>

                  {/* Status and Urgency Badges */}
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const urgency = selectedRequest?.requestDetails?.urgency || "normal";
                      const urgencyBadge = getUrgencyBadge(urgency);
                      const status = selectedRequest?.status?.current || "pending";
                      const statusBadge = getStatusBadge(status);

                      return (
                        <>
                          <span className={`badge badge-lg badge-${urgencyBadge.color} gap-2 p-3`}>
                            <urgencyBadge.icon />
                            {urgencyBadge.label} Urgency
                          </span>
                          <span className={`badge badge-lg badge-${statusBadge.color} p-3`}>
                            {statusBadge.label}
                          </span>
                        </>
                      );
                    })()}
                  </div>

                  {/* Patient Information Section */}
                  {selectedRequest?.patientInfo && (
                    <div className="bg-base-200 rounded-lg p-3 sm:p-4 space-y-2">
                      <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                        <FaUserMd className="text-error" />
                        Patient Information
                      </h4>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                        <div>
                          <p className="opacity-70">Name</p>
                          <p className="font-medium truncate">
                            {selectedRequest.patientInfo.name || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="opacity-70">Age</p>
                          <p className="font-medium">
                            {selectedRequest.patientInfo.age || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="opacity-70">Gender</p>
                          <p className="font-medium">
                            {selectedRequest.patientInfo.gender || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="opacity-70">Condition</p>
                          <p className="font-medium truncate">
                            {selectedRequest.patientInfo.condition || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Location Information Section */}
                  <div className="bg-base-200 rounded-lg p-3 sm:p-4 space-y-2">
                    <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                      <FaMapMarkerAlt className="text-error" />
                      Location
                    </h4>
                    <div className="space-y-1 text-xs sm:text-sm">
                      <p className="flex items-center gap-2">
                        <FaHospital className="opacity-70 shrink-0" />
                        <span className="truncate">
                          {selectedRequest?.location?.hospitalName ||
                            selectedRequest?.patientInfo?.hospital ||
                            "Hospital information not available"}
                        </span>
                      </p>
                      {selectedRequest?.location?.address && (
                        <p className="flex items-center gap-2">
                          <FiMapPin className="opacity-70 shrink-0" />
                          <span className="truncate">
                            {selectedRequest.location.address}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Timeline Section */}
                  <div className="bg-base-200 rounded-lg p-3 sm:p-4 space-y-2">
                    <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                      <FiClock className="text-error" />
                      Timeline
                    </h4>
                    <div className="space-y-1 text-xs sm:text-sm">
                      <p>
                        <span className="opacity-70">Requested:</span>{' '}
                        {formatDate(selectedRequest?.createdAt)}
                      </p>
                      {selectedRequest?.status?.updatedAt && (
                        <p>
                          <span className="opacity-70">Last Updated:</span>{' '}
                          {formatDate(selectedRequest.status.updatedAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Donor Response Section - Only visible to donors */}
                  {isDonor && (
                    <div className="border-t border-base-300 pt-3 sm:pt-4 space-y-3">
                      <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                        <FiSend className="text-error" />
                        Respond To Request
                      </h4>

                      {/* Response Options */}
                      <div className="grid grid-cols-3 gap-1 sm:gap-2">
                        {responseOptions.map((option) => {
                          const Icon = option.icon;
                          const isSelected = respondForm.response === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setRespondForm(prev => ({ ...prev, response: option.value }))}
                              className={`
                                  btn btn-xs sm:btn-sm gap-1
                                  ${isSelected ? `btn-${option.color}` : 'btn-outline'}
                                `}
                              title={option.description}
                            >
                              <Icon className={isSelected ? '' : `text-${option.color}`} size={12} />
                              {isMobile ? option.mobileLabel : option.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Message Input */}
                      <label className="form-control">
                        <span className="label-text text-xs sm:text-sm mb-1 w-full">
                          Message (optional)
                        </span>
                        <textarea
                          className="textarea textarea-bordered textarea-sm sm:textarea-md w-full"
                          rows={isMobile ? 2 : 3}
                          value={respondForm.message}
                          onChange={(e) =>
                            setRespondForm((prev) => ({ ...prev, message: e.target.value }))
                          }
                          placeholder="Add any notes or additional information..."
                        />
                      </label>

                      {/* Submit Button */}
                      <button
                        type="button"
                        onClick={handleRespond}
                        className="btn btn-error w-full gap-2 btn-sm sm:btn-md my-2"
                        disabled={isResponding}
                      >
                        {isResponding ? (
                          <>
                            <span className="loading loading-spinner loading-xs sm:loading-sm"></span>
                            {isMobile ? 'Submitting...' : 'Submitting...'}
                          </>
                        ) : (
                          <>
                            <FiSend />
                            {isMobile ? 'Submit' : 'Submit Response'}
                          </>
                        )}
                      </button>

                      {/* Response Info Alert */}
                      <div className="alert bg-info/10 border-info/20 text-xs sm:text-sm p-2 sm:p-3">
                        <FiAlertCircle className="text-info shrink-0" />
                        <span className="truncate">
                          {isMobile
                            ? 'Response sent to requester'
                            : 'Your response will be sent to the requester and relevant blood banks.'}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                // Empty State - No Request Selected
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 sm:py-12 text-base-content/70"
                >
                  <FiEye className="mx-auto text-3xl sm:text-4xl mb-3 opacity-50" />
                  <p className="text-sm sm:text-base font-medium mb-1">No Request Selected</p>
                  <p className="text-xs sm:text-sm opacity-70">
                    {isMobile
                      ? 'Tap on a request from the list'
                      : 'Select a request from the list to view details.'}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* ==================================================================
            Footer Stats
        ================================================================== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-error/5 rounded-full">
          <FaHeartbeat className="text-error animate-pulse" size={isMobile ? 12 : 14} />
          <span className="text-xs sm:text-sm text-base-content/70">
            Showing {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} matching your blood type
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default BloodRequests;
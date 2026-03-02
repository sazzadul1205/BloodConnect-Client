// Pages/backend/Requester/MyRequests/MyRequests.jsx

// React
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FiAlertCircle,
  FiCalendar,
  FiClock,
  FiDroplet,
  FiFilter,
  FiMapPin,
  FiRefreshCw,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiPlus,
} from "react-icons/fi";
import { FaHospital, FaHeartbeat, FaTint } from "react-icons/fa";

// Hooks
import useAxiosPublic from "../../../../hooks/useAxiosPublic";
import useAuth from "../../../../hooks/useAuth";

// Shared
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";
import Pagination from "../../../../shared/Pagination";
import ResultsCount from "../../../../shared/ResultsCount";
import { formatAppDate } from "../../../../utils/dateFormat";

// Modals
import ViewRequestModal from "./ViewRequestModal/ViewRequestModal";
import EditRequestModal from "./EditRequestModal/EditRequestModal";
import StatusUpdateModal from "./StatusUpdateModal/StatusUpdateModal";

// ==================== CONSTANTS ====================

// Status filter options with colors
const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending", color: "warning" },
  { value: "matched", label: "Matched", color: "info" },
  { value: "fulfilled", label: "Fulfilled", color: "success" },
  { value: "cancelled", label: "Cancelled", color: "error" },
  { value: "expired", label: "Expired", color: "neutral" },
];

// Urgency filter options with colors
const urgencyOptions = [
  { value: "", label: "All Urgency" },
  { value: "normal", label: "Normal", color: "info" },
  { value: "urgent", label: "Urgent", color: "warning" },
  { value: "emergency", label: "Emergency", color: "error" },
];

// Blood type options
const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Request type options
const requestTypeOptions = [
  { value: "whole_blood", label: "Whole Blood", icon: FaTint },
  { value: "plasma", label: "Plasma", icon: FaTint },
  { value: "platelets", label: "Platelets", icon: FaTint },
];

// Badge color mappings for urgency
const urgencyBadge = {
  emergency: "badge-error",
  urgent: "badge-warning",
  normal: "badge-info",
};

// Badge color mappings for status
const statusBadge = {
  pending: "badge-warning",
  matched: "badge-info",
  fulfilled: "badge-success",
  cancelled: "badge-error",
  expired: "badge-neutral",
};

// ==================== MAIN COMPONENT ====================

const MyRequests = () => {
  // ==================== HOOKS ====================

  const { axiosInstance } = useAxiosPublic();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("auth_token");
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine create request path based on user role
  const createRequestPath =
    user?.role === "hospital" ? "/hospital/create-request" : "/requester/create-request";

  // ==================== STATE MANAGEMENT ====================

  // Modal states
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filters derived from URL query params
  const status = searchParams.get("status") || "";
  const urgency = searchParams.get("urgency") || "";
  const bloodType = searchParams.get("bloodType") || "";
  const requestType = searchParams.get("type") || "";

  // ==================== MEMOIZED VALUES ====================

  /**
   * Build API query string based on URL params
   * Memoized to prevent unnecessary recalculations
   */
  const queryString = useMemo(() => {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (urgency) query.set("urgency", urgency);
    if (bloodType) query.set("bloodType", bloodType);
    if (requestType) query.set("type", requestType);
    return query.toString();
  }, [status, urgency, bloodType, requestType]);

  // ==================== QUERIES ====================

  /**
   * Fetch my requests list
   * Uses TanStack Query for caching and automatic refetching
   */
  const {
    data: requests = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["requester-my-requests", token, status, urgency, bloodType, requestType],
    enabled: !!token,
    queryFn: async () => {
      const endpoint = queryString ? `/blood-requests?${queryString}` : "/blood-requests";
      const res = await axiosInstance.get(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return Array.isArray(res?.data?.data) ? res.data.data : [];
    },
  });

  // ==================== MUTATIONS ====================

  /**
   * Mutation: update request status
   * Handles PATCH request to update status
   */
  const statusUpdateMutation = useMutation({
    mutationFn: async ({ requestId, newStatus, notes }) => {
      const res = await axiosInstance.patch(
        `/blood-requests/${requestId}/status`,
        {
          status: newStatus,
          notes,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return res.data;
    },
  });

  /**
   * Mutation: delete request
   * Handles DELETE request to remove a request
   */
  const deleteRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      const res = await axiosInstance.delete(`/blood-requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Combined loading state for mutations
  const isUpdating = statusUpdateMutation.isPending || deleteRequestMutation.isPending;

  // ==================== EFFECTS ====================

  /**
   * Reset pagination when filters change
   * Ensures user sees first page of filtered results
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [status, urgency, bloodType, requestType]);

  // ==================== HANDLER FUNCTIONS ====================

  /**
   * Update URL query params on filter change
   */
  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    return formatAppDate(dateString, "MMM d, yyyy", "N/A");
  };

  /**
   * Handle status update from modal
   */
  const handleStatusUpdate = async (requestId, newStatus, notes) => {
    try {
      const response = await statusUpdateMutation.mutateAsync({
        requestId,
        newStatus,
        notes,
      });

      if (response?.success) {
        await Swal.fire({
          title: "Status Updated",
          text: `Request status has been changed to ${newStatus}.`,
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

        // Invalidate queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ["requester-my-requests"] });
      }
    } catch (error) {
      console.error("Status update error:", error);
      await Swal.fire({
        title: "Error!",
        text: error.response?.data?.error || "Failed to update status",
        icon: "error",
        timer: 3000,
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    } finally {
      setStatusModalOpen(false);
      setSelectedRequest(null);
    }
  };

  /**
   * Handle delete request with confirmation
   */
  const handleDeleteRequest = async (requestId, requestTitle) => {
    try {
      const result = await Swal.fire({
        title: "Delete Request",
        html: `
          <div class="text-left">
            <p class="mb-3">Are you sure you want to delete this request?</p>
            <p class="font-semibold text-error mb-2">${requestTitle}</p>
            <p class="text-sm opacity-70">This action cannot be undone. The request will be permanently removed.</p>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Yes, delete request",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          title: "text-lg font-bold text-error",
          htmlContainer: "text-sm sm:text-base text-base-content/80",
          confirmButton: "btn btn-sm btn-error text-white",
          cancelButton: "btn btn-sm",
        },
        buttonsStyling: false,
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            return await deleteRequestMutation.mutateAsync(requestId);
          } catch (error) {
            Swal.showValidationMessage(
              error.response?.data?.error || "Failed to delete request"
            );
            throw error;
          }
        }
      });

      if (result.isConfirmed) {
        await Swal.fire({
          title: "Deleted!",
          text: "Request has been deleted successfully.",
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

        // Invalidate queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ["requester-my-requests"] });
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // ==================== PAGINATION CALCULATIONS ====================

  const filteredRequests = requests; // Already filtered by API
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  /**
   * Handle page change with smooth scroll to top
   */
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Close all modals
   */
  const closeModals = () => {
    setSelectedRequestId(null);
    setSelectedRequest(null);
    setViewModalOpen(false);
    setEditModalOpen(false);
    setStatusModalOpen(false);
  };

  /**
   * Get status badge class
   */
  const getStatusBadge = (status) => {
    return statusBadge[status] || "badge-neutral";
  };

  /**
   * Get urgency badge class
   */
  const getUrgencyBadge = (urgency) => {
    return urgencyBadge[urgency] || "badge-neutral";
  };

  // ==================== LOADING & ERROR STATES ====================

  if (isLoading) return <BloodLoader />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  // ==================== RENDER ====================

  return (
    <div className="space-y-4 sm:space-y-6 min-h-screen bg-base-200 p-3 sm:p-4 md:p-6">

      {/* ==================== HEADER SECTION ==================== */}
      {/* Animated header with title, refresh button, and create new request button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
      >
        {/* Title and description */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FiClock className="text-error" />
            My Blood Requests
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Track and manage all your blood requests
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Refresh button */}
          <button
            onClick={refetch}
            className="btn btn-xs sm:btn-sm btn-outline gap-1 sm:gap-2 flex-1 sm:flex-none"
            disabled={isFetching}
          >
            <FiRefreshCw size={12} className={`sm:hidden ${isFetching ? "animate-spin" : ""}`} />
            <FiRefreshCw size={14} className={`hidden sm:inline ${isFetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isFetching ? "Refreshing..." : "Refresh"}</span>
          </button>

          {/* Create new request button */}
          <Link
            to={createRequestPath}
            className="btn btn-xs sm:btn-sm btn-error gap-1 sm:gap-2 flex-1 sm:flex-none"
          >
            <FiPlus size={12} className="sm:hidden" />
            <FiPlus size={14} className="hidden sm:inline" />
            <span className="truncate">New Request</span>
          </Link>
        </div>
      </motion.div>

      {/* ==================== STATS CARDS ==================== */}
      {/* Responsive grid: 1 column on mobile, 2 on tablet, 5 on desktop */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4"
      >
        {/* Total Requests Card */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Total Requests</p>
              <p className="stat-value text-xl sm:text-2xl md:text-3xl font-bold text-error">
                {requests.length}
              </p>
            </div>
            <div className="stat-figure bg-error/10 p-2 rounded-full">
              <FiDroplet className="text-error text-lg sm:text-xl" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">All time requests</p>
        </motion.div>

        {/* Pending Requests Card */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Pending</p>
              <p className="stat-value text-xl sm:text-2xl md:text-3xl font-bold text-warning">
                {requests.filter(r => r.status?.current === "pending").length}
              </p>
            </div>
            <div className="stat-figure bg-warning/10 p-2 rounded-full">
              <FiClock className="text-warning text-lg sm:text-xl" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Awaiting donors</p>
        </motion.div>

        {/* Matched Requests Card */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Matched</p>
              <p className="stat-value text-xl sm:text-2xl md:text-3xl font-bold text-info">
                {requests.filter(r => r.status?.current === "matched").length}
              </p>
            </div>
            <div className="stat-figure bg-info/10 p-2 rounded-full">
              <FiCheckCircle className="text-info text-lg sm:text-xl" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Donors found</p>
        </motion.div>

        {/* Fulfilled Requests Card */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Fulfilled</p>
              <p className="stat-value text-xl sm:text-2xl md:text-3xl font-bold text-success">
                {requests.filter(r => r.status?.current === "fulfilled").length}
              </p>
            </div>
            <div className="stat-figure bg-success/10 p-2 rounded-full">
              <FaHeartbeat className="text-success text-lg sm:text-xl" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Successfully completed</p>
        </motion.div>

        {/* Cancelled Requests Card */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Cancelled</p>
              <p className="stat-value text-xl sm:text-2xl md:text-3xl font-bold text-error">
                {requests.filter(r => r.status?.current === "cancelled").length}
              </p>
            </div>
            <div className="stat-figure bg-error/10 p-2 rounded-full">
              <FiXCircle className="text-error text-lg sm:text-xl" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Inactive requests</p>
        </motion.div>
      </motion.div>

      {/* ==================== FILTERS SECTION ==================== */}
      {/* Responsive filter controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-3 sm:p-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">

          {/* Status Filter */}
          <div className="w-full">
            <label className="label py-1 sm:py-2">
              <span className="label-text text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                <FiFilter className="text-error text-xs sm:text-sm" />
                Status
              </span>
            </label>
            <select
              className="select select-bordered select-xs sm:select-sm w-full"
              value={status}
              onChange={(e) => updateFilter("status", e.target.value)}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Urgency Filter */}
          <div className="w-full">
            <label className="label py-1 sm:py-2">
              <span className="label-text text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                <FiAlertCircle className="text-error text-xs sm:text-sm" />
                Urgency
              </span>
            </label>
            <select
              className="select select-bordered select-xs sm:select-sm w-full"
              value={urgency}
              onChange={(e) => updateFilter("urgency", e.target.value)}
            >
              {urgencyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Blood Type Filter */}
          <div className="w-full">
            <label className="label py-1 sm:py-2">
              <span className="label-text text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                <FaTint className="text-error text-xs sm:text-sm" />
                Blood Type
              </span>
            </label>
            <select
              className="select select-bordered select-xs sm:select-sm w-full"
              value={bloodType}
              onChange={(e) => updateFilter("bloodType", e.target.value)}
            >
              <option value="">All Blood Types</option>
              {bloodTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Request Type Filter */}
          <div className="w-full">
            <label className="label py-1 sm:py-2">
              <span className="label-text text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                <FiDroplet className="text-error text-xs sm:text-sm" />
                Request Type
              </span>
            </label>
            <select
              className="select select-bordered select-xs sm:select-sm w-full"
              value={requestType}
              onChange={(e) => updateFilter("type", e.target.value)}
            >
              <option value="">All Types</option>
              {requestTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="btn btn-outline btn-xs sm:btn-sm w-full gap-1 sm:gap-2"
              title="Clear all filters"
            >
              <FiRefreshCw size={12} />
              <span className="sm:hidden">Clear</span>
              <span className="hidden sm:inline">Clear Filters</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ==================== RESULTS COUNT ==================== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <ResultsCount
          endIndex={endIndex}
          startIndex={startIndex}
          itemsPerPage={itemsPerPage}
          filteredUsers={filteredRequests}
          setCurrentPage={setCurrentPage}
          setItemsPerPage={setItemsPerPage}
        />
      </motion.div>

      {/* ==================== REQUESTS TABLE ==================== */}
      {/* Responsive table with horizontal scroll on mobile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="overflow-x-auto bg-base-100 rounded-lg shadow-lg border border-base-300"
      >
        <table className="table table-xs sm:table-sm md:table-md w-full">

          {/* Table Header */}
          <thead>
            <tr className="bg-base-200">
              <th className="w-12 text-xs sm:text-sm">#</th>
              <th className="text-xs sm:text-sm">Patient Info</th>
              <th className="text-xs sm:text-sm">Blood Details</th>
              <th className="hidden md:table-cell text-xs sm:text-sm">Location</th>
              <th className="text-xs sm:text-sm">Status</th>
              <th className="text-xs sm:text-sm">Urgency</th>
              <th className="hidden lg:table-cell text-xs sm:text-sm">Created</th>
              <th className="text-center text-xs sm:text-sm">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {paginatedRequests.length > 0 ? (
              paginatedRequests.map((request, index) => {
                const requestId = request?._id?.$oid || request?._id;
                const requestTitle = `${request?.requestDetails?.bloodType || 'N/A'} - ${request?.requestDetails?.units || '?'} Units`;

                return (
                  <motion.tr
                    key={requestId || `request-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.25 + index * 0.02 }}
                    className="hover"
                  >
                    <td className="font-medium text-xs sm:text-sm">{startIndex + index + 1}</td>

                    {/* Patient Info - Responsive */}
                    <td>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="avatar hidden sm:block">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-error/10 flex items-center justify-center">
                            <FiUser className="text-error text-sm sm:text-base" />
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-xs sm:text-sm">
                            {request?.patientInfo?.name || "N/A"}
                          </div>
                          <div className="text-xs text-base-content/70">
                            {request?.patientInfo?.age ? `Age: ${request.patientInfo.age}` : ''}
                          </div>
                          {/* Mobile-only location */}
                          <div className="block md:hidden text-xs text-base-content/50 mt-1">
                            {request?.location?.city || request?.patientInfo?.hospital || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Blood Details */}
                    <td>
                      <div className="space-y-1">
                        <div className="font-semibold text-error text-xs sm:text-sm">
                          {request?.requestDetails?.bloodType || "N/A"}
                        </div>
                        <div className="text-xs">
                          {request?.requestDetails?.units || 0}u • {request?.requestDetails?.type?.replace('_', ' ') || 'whole blood'}
                        </div>
                        {/* Mobile-only created date */}
                        <div className="block lg:hidden text-xs text-base-content/50 mt-1">
                          {formatDate(request?.createdAt)}
                        </div>
                      </div>
                    </td>

                    {/* Location - Desktop only */}
                    <td className="hidden md:table-cell">
                      <div className="flex items-center gap-1 text-xs sm:text-sm">
                        <FiMapPin size={12} className="text-base-content/50 shrink-0" />
                        <span className="truncate max-w-24 sm:max-w-32">
                          {request?.location?.city || request?.patientInfo?.hospital || "N/A"}
                        </span>
                      </div>
                      {request?.location?.hospitalName && (
                        <div className="flex items-center gap-1 text-xs text-base-content/50 mt-1">
                          <FaHospital size={10} className="shrink-0" />
                          <span className="truncate max-w-24 sm:max-w-32">{request.location.hospitalName}</span>
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td>
                      <div className={`badge badge-xs sm:badge-sm ${getStatusBadge(request?.status?.current)} gap-1`}>
                        {request?.status?.current || "pending"}
                      </div>
                    </td>

                    {/* Urgency Badge */}
                    <td>
                      <div className={`badge badge-xs sm:badge-sm ${getUrgencyBadge(request?.requestDetails?.urgency)} gap-1`}>
                        {request?.requestDetails?.urgency || "normal"}
                      </div>
                    </td>

                    {/* Created Date - Desktop only */}
                    <td className="hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-xs sm:text-sm">
                        <FiCalendar size={12} className="text-base-content/50 shrink-0" />
                        <span>{formatDate(request?.createdAt)}</span>
                      </div>
                    </td>

                    {/* Actions - Responsive button group */}
                    <td>
                      <div className="flex justify-center gap-1">
                        {/* View Button */}
                        <button
                          onClick={() => {
                            setSelectedRequestId(requestId);
                            setViewModalOpen(true);
                          }}
                          className="btn btn-ghost btn-xs sm:btn-sm btn-square tooltip"
                          data-tip="View Details"
                          disabled={isUpdating}
                        >
                          <FiEye size={14} className="sm:hidden" />
                          <FiEye size={16} className="hidden sm:inline" />
                        </button>

                        {/* Edit Button - Only for pending requests */}
                        {request?.status?.current === "pending" && (
                          <button
                            onClick={() => {
                              setSelectedRequestId(requestId);
                              setEditModalOpen(true);
                            }}
                            className="btn btn-ghost btn-xs sm:btn-sm btn-square tooltip"
                            data-tip="Edit Request"
                            disabled={isUpdating}
                          >
                            <FiEdit2 size={14} className="sm:hidden" />
                            <FiEdit2 size={16} className="hidden sm:inline" />
                          </button>
                        )}

                        {/* Status Update Button - Opens Modal */}
                        {(request?.status?.current === "pending" || request?.status?.current === "matched") && (
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setStatusModalOpen(true);
                            }}
                            className="btn btn-ghost btn-xs sm:btn-sm btn-square tooltip"
                            data-tip="Update Status"
                            disabled={isUpdating}
                          >
                            <FiCheckCircle size={14} className="sm:hidden" />
                            <FiCheckCircle size={16} className="hidden sm:inline" />
                          </button>
                        )}

                        {/* Delete Button - Only for cancelled/expired */}
                        {(request?.status?.current === "cancelled" || request?.status?.current === "expired") && (
                          <button
                            onClick={() => handleDeleteRequest(requestId, requestTitle)}
                            className="btn btn-ghost btn-xs sm:btn-sm btn-square text-error tooltip"
                            data-tip="Delete Permanently"
                            disabled={isUpdating}
                          >
                            <FiTrash2 size={14} className="sm:hidden" />
                            <FiTrash2 size={16} className="hidden sm:inline" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            ) : (
              // Empty State
              <motion.tr
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <td colSpan={8} className="text-center py-8 sm:py-12">
                  <div className="flex flex-col items-center gap-2 px-4">
                    <FiDroplet size={32} className="sm:w-12 sm:h-12 text-base-content/30" />
                    <h3 className="text-base sm:text-lg font-semibold text-base-content/70">No requests found</h3>
                    <p className="text-xs sm:text-sm text-base-content/50 text-center">
                      Try adjusting your filters or create a new request
                    </p>
                    <Link
                      to={createRequestPath}
                      className="btn btn-error btn-xs sm:btn-sm gap-1 sm:gap-2 mt-2"
                    >
                      <FiPlus size={12} />
                      <span>Create New Request</span>
                    </Link>
                  </div>
                </td>
              </motion.tr>
            )}
          </tbody>
        </table>
      </motion.div>

      {/* ==================== PAGINATION ==================== */}
      {filteredRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </motion.div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* View Request Modal */}
      <dialog id="view_request_modal" className="modal" open={viewModalOpen}>
        <ViewRequestModal
          requestId={selectedRequestId}
          onClose={closeModals}
        />
        <form method="dialog" className="modal-backdrop" onClick={closeModals}>
          <button>close</button>
        </form>
      </dialog>

      {/* Edit/Create Request Modal */}
      <dialog id="edit_request_modal" className="modal" open={editModalOpen}>
        <EditRequestModal
          requestId={selectedRequestId}
          onClose={closeModals}
          refreshRequests={refetch}
        />
        <form method="dialog" className="modal-backdrop" onClick={closeModals}>
          <button>close</button>
        </form>
      </dialog>

      {/* Status Update Modal */}
      <dialog id="status_update_modal" className="modal" open={statusModalOpen}>
        <StatusUpdateModal
          request={selectedRequest}
          onClose={closeModals}
          onUpdate={handleStatusUpdate}
        />
        <form method="dialog" className="modal-backdrop" onClick={closeModals}>
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default MyRequests;
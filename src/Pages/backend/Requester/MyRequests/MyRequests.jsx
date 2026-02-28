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

// Constants
const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending", color: "warning" },
  { value: "matched", label: "Matched", color: "info" },
  { value: "fulfilled", label: "Fulfilled", color: "success" },
  { value: "cancelled", label: "Cancelled", color: "error" },
  { value: "expired", label: "Expired", color: "neutral" },
];

const urgencyOptions = [
  { value: "", label: "All Urgency" },
  { value: "normal", label: "Normal", color: "info" },
  { value: "urgent", label: "Urgent", color: "warning" },
  { value: "emergency", label: "Emergency", color: "error" },
];

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const requestTypeOptions = [
  { value: "whole_blood", label: "Whole Blood", icon: FaTint },
  { value: "plasma", label: "Plasma", icon: FaTint },
  { value: "platelets", label: "Platelets", icon: FaTint },
];

// Badge color mappings
const urgencyBadge = {
  emergency: "badge-error",
  urgent: "badge-warning",
  normal: "badge-info",
};

const statusBadge = {
  pending: "badge-warning",
  matched: "badge-info",
  fulfilled: "badge-success",
  cancelled: "badge-error",
  expired: "badge-neutral",
};

const MyRequests = () => {
  const { axiosInstance } = useAxiosPublic();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("auth_token");
  const [searchParams, setSearchParams] = useSearchParams();
  const createRequestPath =
    user?.role === "hospital" ? "/hospital/create-request" : "/requester/create-request";

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

  // Build API query string based on URL params
  const queryString = useMemo(() => {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (urgency) query.set("urgency", urgency);
    if (bloodType) query.set("bloodType", bloodType);
    if (requestType) query.set("type", requestType);
    return query.toString();
  }, [status, urgency, bloodType, requestType]);

  // Fetch my requests list
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

  // Mutation: update request status
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

  // Mutation: delete request
  const deleteRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      const res = await axiosInstance.delete(`/blood-requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const isUpdating = statusUpdateMutation.isPending || deleteRequestMutation.isPending;

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [status, urgency, bloodType, requestType]);

  // Update URL query params on filter change
  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Date formatter
  const formatDate = (dateString) => {
    return formatAppDate(dateString, "MMM d, yyyy", "N/A");
  };

  // Handle status update from modal
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
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          },
        });

        await queryClient.invalidateQueries({ queryKey: ["requester-my-requests"] });
      }
    } catch (error) {
      console.error("Status update error:", error);
      await Swal.fire({
        title: "Error!",
        text: error.response?.data?.error || "Failed to update status",
        icon: "error",
        timer: 3000,
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        },
      });
    } finally {
      setStatusModalOpen(false);
      setSelectedRequest(null);
    }
  };

  // Handle delete request
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
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          title: "text-lg font-bold text-error",
          htmlContainer: "text-base text-base-content/80",
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
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          },
        });

        await queryClient.invalidateQueries({ queryKey: ["requester-my-requests"] });
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // Calculate pagination
  const filteredRequests = requests; // Already filtered by API
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Modal close handler
  const closeModals = () => {
    setSelectedRequestId(null);
    setSelectedRequest(null);
    setViewModalOpen(false);
    setEditModalOpen(false);
    setStatusModalOpen(false);
  };

  // Get status badge class
  const getStatusBadge = (status) => {
    return statusBadge[status] || "badge-neutral";
  };

  // Get urgency badge class
  const getUrgencyBadge = (urgency) => {
    return urgencyBadge[urgency] || "badge-neutral";
  };

  if (isLoading) return <BloodLoader />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FiClock className="text-error" />
            My Blood Requests
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            Track and manage all your blood requests
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={refetch}
            className="btn btn-outline btn-sm gap-2"
            disabled={isFetching}
          >
            <FiRefreshCw className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>

          <Link
            to={createRequestPath}
            className="btn btn-error btn-sm gap-2"
          >
            <FiPlus size={16} />
            New Request
          </Link>
        </div>
      </motion.div>

      {/* Stats Cards */}
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
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {/* Total Requests */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-error">
            <FiDroplet size={24} />
          </div>
          <p className="stat-title">Total Requests</p>
          <p className="stat-value text-3xl">{requests.length}</p>
          <p className="stat-desc">All time requests</p>
        </motion.div>

        {/* Pending */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-warning">
            <FiClock size={24} />
          </div>
          <p className="stat-title">Pending</p>
          <p className="stat-value text-3xl">
            {requests.filter(r => r.status?.current === "pending").length}
          </p>
          <p className="stat-desc">Awaiting donors</p>
        </motion.div>

        {/* Matched */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-info">
            <FiCheckCircle size={24} />
          </div>
          <p className="stat-title">Matched</p>
          <p className="stat-value text-3xl">
            {requests.filter(r => r.status?.current === "matched").length}
          </p>
          <p className="stat-desc">Donors found</p>
        </motion.div>

        {/* Fulfilled */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-success">
            <FaHeartbeat size={24} />
          </div>
          <p className="stat-title">Fulfilled</p>
          <p className="stat-value text-3xl">
            {requests.filter(r => r.status?.current === "fulfilled").length}
          </p>
          <p className="stat-desc">Successfully completed</p>
        </motion.div>

        {/* Cancelled */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-error">
            <FiXCircle size={24} />
          </div>
          <p className="stat-title">Cancelled</p>
          <p className="stat-value text-3xl">
            {requests.filter(r => r.status?.current === "cancelled").length}
          </p>
          <p className="stat-desc">Inactive requests</p>
        </motion.div>
      </motion.div>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex-1">
            <label className="label">
              <span className="label-text flex items-center gap-2">
                <FiFilter className="text-error" />
                Status
              </span>
            </label>
            <select
              className="select select-bordered w-full"
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
          <div className="flex-1">
            <label className="label">
              <span className="label-text flex items-center gap-2">
                <FiAlertCircle className="text-error" />
                Urgency
              </span>
            </label>
            <select
              className="select select-bordered w-full"
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
          <div className="flex-1">
            <label className="label">
              <span className="label-text flex items-center gap-2">
                <FaTint className="text-error" />
                Blood Type
              </span>
            </label>
            <select
              className="select select-bordered w-full"
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
          <div className="flex-1">
            <label className="label">
              <span className="label-text flex items-center gap-2">
                <FiDroplet className="text-error" />
                Request Type
              </span>
            </label>
            <select
              className="select select-bordered w-full"
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

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="btn btn-outline btn-square"
              title="Clear all filters"
            >
              <FiRefreshCw size={18} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Results Count */}
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

      {/* Requests Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="overflow-x-auto bg-base-100 rounded-lg shadow-lg border border-base-300"
      >
        <table className="table table-zebra w-full">
          {/* Table Header */}
          <thead>
            <tr className="bg-base-200">
              <th className="w-12">#</th>
              <th>Patient Info</th>
              <th>Blood Details</th>
              <th>Location</th>
              <th>Status</th>
              <th>Urgency</th>
              <th>Created</th>
              <th className="text-center">Actions</th>
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
                    <td className="font-medium">{startIndex + index + 1}</td>

                    {/* Patient Info */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                            <FiUser className="text-error" />
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold">
                            {request?.patientInfo?.name || "N/A"}
                          </div>
                          <div className="text-sm text-base-content/70">
                            {request?.patientInfo?.age ? `Age: ${request.patientInfo.age}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Blood Details */}
                    <td>
                      <div className="space-y-1">
                        <div className="font-semibold text-error">
                          {request?.requestDetails?.bloodType || "N/A"}
                        </div>
                        <div className="text-sm">
                          {request?.requestDetails?.units || 0} units • {request?.requestDetails?.type?.replace('_', ' ') || 'whole blood'}
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td>
                      <div className="flex items-center gap-1 text-sm">
                        <FiMapPin size={12} className="text-base-content/50" />
                        <span>
                          {request?.location?.city || request?.patientInfo?.hospital || "N/A"}
                        </span>
                      </div>
                      {request?.location?.hospitalName && (
                        <div className="flex items-center gap-1 text-xs text-base-content/50 mt-1">
                          <FaHospital size={10} />
                          <span className="truncate max-w-32">{request.location.hospitalName}</span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <div className={`badge ${getStatusBadge(request?.status?.current)} gap-1`}>
                        {request?.status?.current || "pending"}
                      </div>
                    </td>

                    {/* Urgency */}
                    <td>
                      <div className={`badge ${getUrgencyBadge(request?.requestDetails?.urgency)} gap-1`}>
                        {request?.requestDetails?.urgency || "normal"}
                      </div>
                    </td>

                    {/* Created Date */}
                    <td>
                      <div className="flex items-center gap-1 text-sm">
                        <FiCalendar size={12} className="text-base-content/50" />
                        <span>{formatDate(request?.createdAt)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="flex justify-center gap-1">
                        {/* View Button */}
                        <button
                          onClick={() => {
                            setSelectedRequestId(requestId);
                            setViewModalOpen(true);
                          }}
                          className="btn btn-ghost btn-sm btn-square tooltip"
                          data-tip="View Details"
                          disabled={isUpdating}
                        >
                          <FiEye size={16} />
                        </button>

                        {/* Edit Button - Only for pending requests */}
                        {request?.status?.current === "pending" && (
                          <button
                            onClick={() => {
                              setSelectedRequestId(requestId);
                              setEditModalOpen(true);
                            }}
                            className="btn btn-ghost btn-sm btn-square tooltip"
                            data-tip="Edit Request"
                            disabled={isUpdating}
                          >
                            <FiEdit2 size={16} />
                          </button>
                        )}

                        {/* Status Update Button - Opens Modal */}
                        {(request?.status?.current === "pending" || request?.status?.current === "matched") && (
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setStatusModalOpen(true);
                            }}
                            className="btn btn-ghost btn-sm btn-square tooltip"
                            data-tip="Update Status"
                            disabled={isUpdating}
                          >
                            <FiCheckCircle size={16} />
                          </button>
                        )}

                        {/* Delete Button - Only for cancelled/expired */}
                        {(request?.status?.current === "cancelled" || request?.status?.current === "expired") && (
                          <button
                            onClick={() => handleDeleteRequest(requestId, requestTitle)}
                            className="btn btn-ghost btn-sm btn-square text-error tooltip"
                            data-tip="Delete Permanently"
                            disabled={isUpdating}
                          >
                            <FiTrash2 size={16} />
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
                <td colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <FiDroplet size={48} className="text-base-content/30" />
                    <h3 className="text-lg font-semibold text-base-content/70">No requests found</h3>
                    <p className="text-sm text-base-content/50">
                      Try adjusting your filters or create a new request
                    </p>
                    <Link
                      to={createRequestPath}
                      className="btn btn-error btn-sm gap-2 mt-2"
                    >
                      <FiPlus size={16} />
                      Create New Request
                    </Link>
                  </div>
                </td>
              </motion.tr>
            )}
          </tbody>
        </table>
      </motion.div>

      {/* Pagination */}
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

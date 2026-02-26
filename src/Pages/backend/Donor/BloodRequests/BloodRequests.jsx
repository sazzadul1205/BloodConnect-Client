// Pages/backend/Donor/BloodRequests/BloodRequests.jsx

// React
import React, { useCallback, useEffect, useMemo, useState } from "react";

// Sweet Alert
import Swal from "sweetalert2";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons - Fi (Feather Icons)
import {
  FiRefreshCw,
  FiEye,
  FiSend,
  FiAlertCircle,
  FiClock,
  FiMapPin,
  FiUser,
  FiActivity,
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
} from "react-icons/fa";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";

// Constants
const responseOptions = [
  { value: "accepted", label: "Accept", color: "success", icon: FaCheckCircle },
  { value: "rejected", label: "Reject", color: "error", icon: FaTimesCircle },
  { value: "donated", label: "Donated", color: "info", icon: FaHeartbeat },
];

const urgencyColors = {
  emergency: "error",
  urgent: "warning",
  normal: "info",
  low: "success",
};

const statusColors = {
  pending: "warning",
  accepted: "info",
  rejected: "error",
  donated: "success",
  completed: "success",
  cancelled: "error",
};

// Helper function to extract ID from MongoDB ObjectId
const getId = (value) =>
  typeof value === "object" ? value?.$oid || value?.toString?.() : value;

const BloodRequests = () => {
  const { user, loading: authLoading } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // User role check
  const isDonor = useMemo(() => user?.role === "donor", [user]);

  // Get donor ID from user object
  const donorId = useMemo(
    () => user?.userId || user?._id || user?.id || user?.uid,
    [user],
  );

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [responding, setResponding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [donorBloodType, setDonorBloodType] = useState("");

  // Form state for response
  const [respondForm, setRespondForm] = useState({
    response: "accepted",
    message: "",
  });

  // Fetch donor's blood type on component mount
  useEffect(() => {
    const fetchDonorBloodType = async () => {
      if (authLoading || !donorId) return;

      try {
        const res = await axiosInstance.get(`/donors/${donorId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const bloodType = res?.data?.data?.medicalInfo?.bloodType || "";
        setDonorBloodType(bloodType);
      } catch {
        setDonorBloodType("");
      }
    };

    fetchDonorBloodType();
  }, [authLoading, axiosInstance, donorId, token]);

  // Fetch pending requests based on donor's blood type
  const fetchPendingRequests = useCallback(async () => {
    if (!authLoading && !donorBloodType) {
      setError(null);
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({ status: "pending" });
      if (donorBloodType) {
        query.set("bloodType", donorBloodType);
      }

      const res = await axiosInstance.get(`/blood-requests?${query.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setRequests(res.data?.data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [authLoading, axiosInstance, donorBloodType, token]);

  // Fetch requests when component mounts or blood type changes
  useEffect(() => {
    if (!authLoading) {
      fetchPendingRequests();
    }
  }, [authLoading, fetchPendingRequests]);

  // Fetch detailed information for a specific request
  const fetchRequestDetails = async (requestId) => {
    setDetailsLoading(true);
    try {
      const res = await axiosInstance.get(`/blood-requests/${requestId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSelectedRequest(res.data?.data || null);
      setRespondForm({ response: "accepted", message: "" });
    } catch (err) {
      await Swal.fire({
        title: "Unable To Load Details",
        text: err?.response?.data?.error || "Failed to fetch request details.",
        icon: "error",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  // Handle donor response submission
  const handleRespond = async () => {
    const selectedId = getId(selectedRequest?._id);
    if (!selectedId) return;

    // Check if user is a donor
    if (!isDonor) {
      await Swal.fire({
        title: "Not Allowed",
        text: "Only donors can respond to requests.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      });
      return;
    }

    setResponding(true);
    try {
      await axiosInstance.post(
        `/blood-requests/${selectedId}/respond`,
        {
          response: respondForm.response,
          message: respondForm.message || undefined,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      await Swal.fire({
        title: "Response Sent",
        html: `
          <div class="text-center">
            <p class="mb-2">You marked this request as ${respondForm.response}.</p>
            <p class="text-sm text-base-content/70">Thank you for your response!</p>
          </div>
        `,
        icon: "success",
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Great!",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      });

      // Refresh both the selected request and the list
      await fetchRequestDetails(selectedId);
      await fetchPendingRequests();
    } catch (err) {
      await Swal.fire({
        title: "Response Failed",
        text: err?.response?.data?.error || "Could not submit response.",
        icon: "error",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      });
    } finally {
      setResponding(false);
    }
  };

  // Filter requests based on search term
  const filteredRequests = useMemo(() => {
    if (!searchTerm) return requests;

    return requests.filter(req => {
      const hospitalName = req?.location?.hospitalName || req?.patientInfo?.hospital || "";
      const bloodType = req?.requestDetails?.bloodType || "";
      const searchLower = searchTerm.toLowerCase();

      return hospitalName.toLowerCase().includes(searchLower) ||
        bloodType.toLowerCase().includes(searchLower);
    });
  }, [requests, searchTerm]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (loading || authLoading) return <BloodLoader />;

  // Error state
  if (error) return <ErrorState error={error} onRetry={fetchPendingRequests} />;

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaTint className="text-error" />
            Blood Requests
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            View and respond to blood requests matching your criteria
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <span className="badge badge-outline">
            Blood Type: {donorBloodType || "Not set"}
          </span>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchPendingRequests}
            className="btn btn-outline btn-sm gap-2"
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="form-control">
        <div className="relative">
          <FiActivity className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
          <input
            type="text"
            placeholder="Search by hospital or blood type..."
            className="input input-bordered w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests List Panel */}
        <div className="bg-base-100 rounded-lg border border-base-300 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-base-300 font-semibold flex justify-between items-center">
            <span>Pending Requests</span>
            <span className="badge badge-error">{filteredRequests.length}</span>
          </div>

          {filteredRequests.length > 0 ? (
            <div className="divide-y divide-base-300 max-h-125 overflow-y-auto">
              {filteredRequests.map((req) => {
                const requestId = getId(req._id);
                const urgency = req?.requestDetails?.urgency || "normal";
                const status = req?.status?.current || "pending";
                const UrgencyIcon = urgency === "emergency" ? FaExclamationCircle : FiClock;

                return (
                  <motion.div
                    key={requestId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 hover:bg-base-200 transition-colors cursor-pointer"
                    onClick={() => fetchRequestDetails(requestId)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Request Summary */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-error">
                            {req?.requestDetails?.bloodType || "N/A"}
                          </span>
                          <span className="badge badge-sm badge-outline">
                            {req?.requestDetails?.units || 0} units
                          </span>
                          <span className={`badge badge-sm badge-${urgencyColors[urgency]}`}>
                            {urgency}
                          </span>
                        </div>

                        <p className="text-sm flex items-center gap-1">
                          <FaHospital className="text-base-content/50" />
                          {req?.location?.hospitalName || req?.patientInfo?.hospital || "Unknown hospital"}
                        </p>

                        <div className="flex items-center gap-3 mt-2 text-xs text-base-content/60">
                          <span className="flex items-center gap-1">
                            <FiClock />
                            {formatDate(req?.createdAt)}
                          </span>
                          <span className={`badge badge-sm badge-${statusColors[status]}`}>
                            {status}
                          </span>
                        </div>
                      </div>

                      {/* View Details Button */}
                      <button
                        type="button"
                        className="btn btn-sm btn-error gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchRequestDetails(requestId);
                        }}
                        disabled={detailsLoading}
                      >
                        <FiEye />
                        View
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            // Empty State
            <div className="p-8 text-center text-base-content/70">
              <FiAlertCircle className="mx-auto text-3xl mb-2 opacity-50" />
              <p>No blood requests found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Request Details Panel */}
        <div className="bg-base-100 rounded-lg border border-base-300 shadow-sm p-5">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <FiEye className="text-error" />
            Request Details
          </h3>

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
              className="space-y-4"
            >
              {/* Request Information Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-base-200 rounded-lg p-3">
                  <p className="text-xs opacity-70 mb-1">Blood Type</p>
                  <p className="font-semibold text-error text-lg">
                    {selectedRequest?.requestDetails?.bloodType || "N/A"}
                  </p>
                </div>
                <div className="bg-base-200 rounded-lg p-3">
                  <p className="text-xs opacity-70 mb-1">Units Needed</p>
                  <p className="font-semibold text-lg">
                    {selectedRequest?.requestDetails?.units || 0}
                  </p>
                </div>
              </div>

              {/* Status and Urgency Badges */}
              <div className="flex gap-2">
                <span className={`badge badge-lg badge-${urgencyColors[selectedRequest?.requestDetails?.urgency || "normal"]}`}>
                  {selectedRequest?.requestDetails?.urgency || "normal"} urgency
                </span>
                <span className={`badge badge-lg badge-${statusColors[selectedRequest?.status?.current || "pending"]}`}>
                  {selectedRequest?.status?.current || "pending"}
                </span>
              </div>

              {/* Patient Information Section */}
              {selectedRequest?.patientInfo && (
                <div className="bg-base-200 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <FiUser className="text-error" />
                    Patient Information
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs opacity-70">Name</p>
                      <p>{selectedRequest.patientInfo.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-70">Age</p>
                      <p>{selectedRequest.patientInfo.age || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-70">Gender</p>
                      <p>{selectedRequest.patientInfo.gender || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-70">Condition</p>
                      <p>{selectedRequest.patientInfo.condition || "N/A"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Location Information Section */}
              <div className="bg-base-200 rounded-lg p-4 space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <FaMapMarkerAlt className="text-error" />
                  Location
                </h4>
                <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-2">
                    <FaHospital className="opacity-70" />
                    {selectedRequest?.location?.hospitalName ||
                      selectedRequest?.patientInfo?.hospital ||
                      "Hospital information not available"}
                  </p>
                  {selectedRequest?.location?.address && (
                    <p className="flex items-center gap-2">
                      <FiMapPin className="opacity-70" />
                      {selectedRequest.location.address}
                    </p>
                  )}
                </div>
              </div>

              {/* Timeline Section */}
              <div className="bg-base-200 rounded-lg p-4 space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <FiClock className="text-error" />
                  Timeline
                </h4>
                <div className="space-y-1 text-sm">
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
                <div className="border-t border-base-300 pt-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <FiSend className="text-error" />
                    Respond To Request
                  </h4>

                  {/* Response Options */}
                  <div className="grid grid-cols-3 gap-2">
                    {responseOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = respondForm.response === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setRespondForm(prev => ({ ...prev, response: option.value }))}
                          className={`btn btn-sm ${isSelected ? `btn-${option.color}` : 'btn-outline'}`}
                        >
                          <Icon className={isSelected ? '' : `text-${option.color}`} />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Message Input */}
                  <label className="form-control">
                    <span className="label-text mb-1">Message (optional)</span>
                    <textarea
                      className="textarea textarea-bordered"
                      rows={3}
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
                    className="btn btn-error w-full gap-2"
                    disabled={responding}
                  >
                    {responding ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FiSend />
                        Submit Response
                      </>
                    )}
                  </button>

                  {/* Response Info Alert */}
                  <div className="alert bg-info/10 border-info/20 text-sm">
                    <FiAlertCircle className="text-info" />
                    <span>
                      Your response will be sent to the requester and relevant blood banks.
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            // Empty State - No Request Selected
            <div className="text-center py-8 text-base-content/70">
              <FiEye className="mx-auto text-3xl mb-2 opacity-50" />
              <p>Select a request from the list to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BloodRequests;

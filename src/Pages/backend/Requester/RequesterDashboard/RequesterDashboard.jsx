// Pages/backend/Requester/RequesterDashboard/RequesterDashboard.jsx

// React
import { Link } from "react-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons - Fi (Feather Icons)
import {
  FiClock,
  FiDroplet,
  FiRefreshCw,
  FiArrowRight,
  FiUsers,
} from "react-icons/fi";

// Icons - Fa (Font Awesome)
import {
  FaTint,
  FaHospital,
  FaCheckCircle,
  FaExclamationCircle,
  FaUser,
  FaShieldAlt,
  FaFlask,
  FaClipboardList,
  FaHourglassHalf,
  FaCheckDouble,
} from "react-icons/fa";
import { FaDroplet } from "react-icons/fa6";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";

// Helper function to extract ID from MongoDB ObjectId
const getId = (value) => {
  if (!value) return null;
  if (typeof value === "object") {
    return value?.$oid || value?.toString?.() || JSON.stringify(value);
  }
  return String(value);
};

// Format date for display
const formatDate = (value) => {
  if (!value) return "N/A";
  try {
    const date = new Date(value?.$date || value);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    // eslint-disable-next-line no-unused-vars
  } catch (e) {
    return "Invalid Date";
  }
};

// Format date with time
const formatDateTime = (value) => {
  if (!value) return "N/A";
  try {
    const date = new Date(value?.$date || value);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    // eslint-disable-next-line no-unused-vars
  } catch (e) {
    return "Invalid Date";
  }
};

// Status colors mapping
const statusColors = {
  pending: "warning",
  matched: "info",
  fulfilled: "success",
  cancelled: "error",
  expired: "neutral",
};

// Safe string render function to prevent object rendering errors
const safeString = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  return ""; // Return empty string for objects/arrays
};

const RequesterDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // Get requester ID from user object
  const requesterId = useMemo(
    () => user?.userId || user?._id || user?.id || user?.uid,
    [user],
  );

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requester, setRequester] = useState(null);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!requesterId) {
      setError(new Error("Requester ID not found. Please log in again."));
      setLoading(false);
      return;
    }

    setRefreshing(true);
    setError(null);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch requester profile and blood requests in parallel
      const [profileRes, requestsRes] = await Promise.all([
        axiosInstance.get(`/users/profile/${requesterId}`, { headers }),
        axiosInstance.get("/blood-requests", { headers }),
      ]);

      const requesterData = profileRes?.data?.data || null;
      setRequester(requesterData);

      // Filter requests for this requester
      const allRequests = requestsRes?.data?.data || [];
      const myRequests = allRequests.filter(
        request => String(getId(request.requesterId)) === String(requesterId)
      );
      setBloodRequests(myRequests);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [axiosInstance, requesterId, token]);

  // Initial data fetch
  useEffect(() => {
    if (!authLoading) {
      fetchDashboardData();
    }
  }, [authLoading, fetchDashboardData]);

  // Calculate request statistics
  const requestStats = useMemo(() => {
    const total = bloodRequests.length;
    const pending = bloodRequests.filter(r => r?.status?.current === "pending").length;
    const matched = bloodRequests.filter(r => r?.status?.current === "matched").length;
    const fulfilled = bloodRequests.filter(r => r?.status?.current === "fulfilled").length;
    const cancelled = bloodRequests.filter(r => r?.status?.current === "cancelled").length;
    const expired = bloodRequests.filter(r => r?.status?.current === "expired").length;

    // Calculate total units requested and fulfilled
    const totalUnitsRequested = bloodRequests.reduce((sum, r) =>
      sum + (r?.requestDetails?.units || 0), 0
    );

    const totalUnitsFulfilled = bloodRequests
      .filter(r => r?.status?.current === "fulfilled")
      .reduce((sum, r) => sum + (r?.requestDetails?.units || 0), 0);

    // Calculate response statistics from matches
    let totalResponses = 0;
    let acceptedResponses = 0;
    let pendingResponses = 0;

    bloodRequests.forEach(request => {
      if (request?.matches && Array.isArray(request.matches)) {
        request.matches.forEach(match => {
          const responseStatus = match?.response?.status;
          if (responseStatus) {
            totalResponses++;
            if (responseStatus === "accepted") acceptedResponses++;
            if (responseStatus === "pending") pendingResponses++;
          }
        });
      }
    });

    // Get urgent requests (emergency or urgent)
    const urgentRequests = bloodRequests.filter(r =>
      r?.requestDetails?.urgency === "emergency" ||
      r?.requestDetails?.urgency === "urgent"
    ).length;

    return {
      total,
      pending,
      matched,
      fulfilled,
      cancelled,
      expired,
      activeRequests: pending + matched,
      totalUnitsRequested,
      totalUnitsFulfilled,
      totalResponses,
      acceptedResponses,
      pendingResponses,
      responseRate: totalResponses ? Math.round((acceptedResponses / totalResponses) * 100) : 0,
      urgentRequests,
      successRate: total ? Math.round((fulfilled / total) * 100) : 0,
    };
  }, [bloodRequests]);

  // Get recent 5 requests
  const recentRequests = useMemo(() => {
    return [...bloodRequests]
      .sort((a, b) => {
        const dateA = new Date(a?.createdAt?.$date || a?.createdAt || 0);
        const dateB = new Date(b?.createdAt?.$date || b?.createdAt || 0);
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [bloodRequests]);

  // Get requests with pending responses
  const requestsWithPendingResponses = useMemo(() => {
    return bloodRequests
      .filter(request =>
        request?.matches && request.matches.some(match =>
          match?.response?.status === "pending"
        )
      )
      .map(request => ({
        ...request,
        pendingMatches: request.matches.filter(match =>
          match?.response?.status === "pending"
        )
      }))
      .sort((a, b) => b.pendingMatches.length - a.pendingMatches.length)
      .slice(0, 5);
  }, [bloodRequests]);

  // Get requests by blood type
  const requestsByBloodType = useMemo(() => {
    const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const counts = {};

    bloodTypes.forEach(type => {
      counts[type] = bloodRequests.filter(r =>
        r?.requestDetails?.bloodType === type &&
        r?.status?.current !== "fulfilled" &&
        r?.status?.current !== "cancelled"
      ).length;
    });

    return counts;
  }, [bloodRequests]);

  // Get urgent requests summary
  const urgentRequestsList = useMemo(() => {
    return bloodRequests
      .filter(r =>
        (r?.requestDetails?.urgency === "emergency" || r?.requestDetails?.urgency === "urgent") &&
        r?.status?.current !== "fulfilled" &&
        r?.status?.current !== "cancelled"
      )
      .sort((a, b) => {
        // Emergency first, then urgent
        if (a?.requestDetails?.urgency === "emergency" && b?.requestDetails?.urgency !== "emergency") return -1;
        if (a?.requestDetails?.urgency !== "emergency" && b?.requestDetails?.urgency === "emergency") return 1;
        return 0;
      })
      .slice(0, 3);
  }, [bloodRequests]);

  // Loading state
  if (loading || authLoading) return <BloodLoader />;

  // Error state
  if (error) return <ErrorState error={error} onRetry={fetchDashboardData} />;

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaClipboardList className="text-primary" />
            Requester Dashboard
          </h2>
          <p className="text-sm text-base-content/70 mt-1">
            Welcome back, <span className="font-semibold text-primary">{requester?.profile?.fullName || user?.profile?.fullName || "Requester"}</span>!
            Track your blood requests and responses.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            to="/requester/create-request"
            className="btn btn-sm btn-primary gap-2"
          >
            <FaDroplet />
            New Request
          </Link>
          <Link
            to="/requester/settings"
            className="btn btn-sm btn-outline gap-2"
          >
            <FaUser />
            Settings
          </Link>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="btn btn-sm btn-primary gap-2"
            disabled={refreshing}
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Urgent Requests Alert */}
      {requestStats.urgentRequests > 0 && (
        <div className="alert alert-error bg-error/10 border-error/20">
          <FaExclamationCircle className="text-error" />
          <span className="text-primary" >
            You have <span className="font-semibold ">{requestStats.urgentRequests}</span> urgent{' '}
            {requestStats.urgentRequests === 1 ? 'request' : 'requests'} that need attention.
          </span>
          <Link to="/requester/my-requests?urgency=urgent" className="btn btn-sm btn-error">
            View Urgent Requests
          </Link>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-base-100 border border-base-300 rounded-lg p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70 mb-1">Total Requests</p>
              <p className="text-2xl font-bold text-primary">{requestStats.total}</p>
            </div>
            <div className="p-3 rounded-full bg-primary/10">
              <FaClipboardList className="text-primary" size={24} />
            </div>
          </div>
          <p className="text-xs opacity-60 mt-2">
            Active: <span className="font-semibold text-warning">{requestStats.activeRequests}</span>
          </p>
        </motion.div>

        {/* Fulfilled Requests Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-base-100 border border-base-300 rounded-lg p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70 mb-1">Fulfilled</p>
              <p className="text-2xl font-bold text-success">{requestStats.fulfilled}</p>
            </div>
            <div className="p-3 rounded-full bg-success/10">
              <FaCheckCircle className="text-success" size={24} />
            </div>
          </div>
          <p className="text-xs opacity-60 mt-2">
            Success rate: <span className="font-semibold">{requestStats.successRate}%</span>
          </p>
        </motion.div>

        {/* Pending Responses Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-base-100 border border-base-300 rounded-lg p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70 mb-1">Pending Responses</p>
              <p className="text-2xl font-bold text-warning">{requestStats.pendingResponses}</p>
            </div>
            <div className="p-3 rounded-full bg-warning/10">
              <FaHourglassHalf className="text-warning" size={24} />
            </div>
          </div>
          <p className="text-xs opacity-60 mt-2">
            Total responses: <span className="font-semibold">{requestStats.totalResponses}</span>
          </p>
        </motion.div>

        {/* Units Requested Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-base-100 border border-base-300 rounded-lg p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70 mb-1">Units Requested</p>
              <p className="text-2xl font-bold text-info">{requestStats.totalUnitsRequested}</p>
            </div>
            <div className="p-3 rounded-full bg-info/10">
              <FaTint className="text-info" size={24} />
            </div>
          </div>
          <p className="text-xs opacity-60 mt-2">
            Fulfilled: <span className="font-semibold">{requestStats.totalUnitsFulfilled}</span>
          </p>
        </motion.div>
      </div>

      {/* Charts and Analytics Section */}
      {bloodRequests.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Requests by Status */}
          <div className="bg-base-100 border border-base-300 rounded-lg p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <FaFlask className="text-primary" />
              Requests by Status
            </h3>
            <div className="space-y-3">
              {[
                { status: "pending", count: requestStats.pending, color: "warning" },
                { status: "matched", count: requestStats.matched, color: "info" },
                { status: "fulfilled", count: requestStats.fulfilled, color: "success" },
                { status: "cancelled", count: requestStats.cancelled, color: "error" },
                { status: "expired", count: requestStats.expired, color: "neutral" },
              ].map(({ status, count, color }) => {
                if (count === 0) return null;
                const percentage = (count / requestStats.total) * 100;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{status}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-2">
                      <div
                        className={`bg-${color} h-2 rounded-full`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Requests by Blood Type */}
          <div className="bg-base-100 border border-base-300 rounded-lg p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <FaDroplet className="text-primary" />
              Active Requests by Blood Type
            </h3>
            <div className="space-y-3">
              {Object.entries(requestsByBloodType)
                .filter(([, count]) => count > 0)
                .map(([bloodType, count]) => {
                  const maxCount = Math.max(...Object.values(requestsByBloodType), 1);
                  const percentage = (count / maxCount) * 100;
                  return (
                    <div key={bloodType}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">{bloodType}</span>
                        <span>{count} {count === 1 ? 'request' : 'requests'}</span>
                      </div>
                      <div className="w-full bg-base-300 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              {Object.values(requestsByBloodType).every(v => v === 0) && (
                <p className="text-center text-base-content/70 py-4">
                  No active requests
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Three Column Grid for Recent Requests, Pending Responses, Urgent */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Requests */}
        <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-base-300 font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiClock className="text-primary" />
              Recent Requests
            </div>
            <span className="badge badge-primary">{bloodRequests.length}</span>
          </div>

          {recentRequests.length > 0 ? (
            <div className="divide-y divide-base-300 max-h-80 overflow-y-auto">
              {recentRequests.map((request) => {
                const urgency = request?.requestDetails?.urgency || "normal";
                const requestId = getId(request?._id);
                return (
                  <div key={requestId} className="p-4 hover:bg-base-200 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold text-primary">
                          {safeString(request?.requestDetails?.bloodType)}
                        </span>
                        <span className="ml-2 text-xs opacity-70">
                          {request?.requestDetails?.units || 0} units
                        </span>
                      </div>
                      <span className={`badge badge-${statusColors[request?.status?.current] || "neutral"} badge-sm`}>
                        {request?.status?.current || "unknown"}
                      </span>
                    </div>
                    <p className="text-sm flex items-center gap-1 mb-1">
                      <FaHospital className="text-base-content/50" />
                      {safeString(request?.patientInfo?.hospital) || "Unknown"}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`badge badge-${urgency === "emergency" ? "error" : urgency === "urgent" ? "warning" : "info"} badge-xs`}>
                        {urgency}
                      </span>
                      <span className="text-xs opacity-70">
                        {formatDate(request?.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-base-content/70">
              <FiDroplet className="mx-auto text-3xl mb-2 opacity-50" />
              <p className="text-sm">No requests yet</p>
              <Link to="/requester/create-request" className="btn btn-xs btn-primary mt-2">
                Create First Request
              </Link>
            </div>
          )}

          <div className="p-4 border-t border-base-300">
            <Link to="/requester/my-requests" className="btn btn-sm btn-outline w-full gap-2">
              View All Requests
              <FiArrowRight />
            </Link>
          </div>
        </div>

        {/* Pending Responses */}
        <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-base-300 font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaHourglassHalf className="text-warning" />
              Pending Responses
            </div>
            <span className="badge badge-warning">{requestStats.pendingResponses}</span>
          </div>

          {requestsWithPendingResponses.length > 0 ? (
            <div className="divide-y divide-base-300 max-h-80 overflow-y-auto">
              {requestsWithPendingResponses.map((request) => {
                const requestId = getId(request?._id);
                return (
                  <div key={requestId} className="p-4 hover:bg-base-200 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-primary">
                        {safeString(request?.requestDetails?.bloodType)}
                      </span>
                      <span className="badge badge-warning badge-sm">
                        {request.pendingMatches?.length || 0} pending
                      </span>
                    </div>
                    <p className="text-sm mb-2">
                      Waiting for {request.pendingMatches?.length || 0} donor{request.pendingMatches?.length !== 1 ? 's' : ''} to respond
                    </p>
                    <div className="flex gap-1 mb-2">
                      {request.pendingMatches?.slice(0, 3).map((match, idx) => (
                        <div key={idx} className="avatar placeholder">
                          <div className="bg-warning/20 text-warning rounded-full w-6 h-6">
                            <span className="text-xs">D{idx + 1}</span>
                          </div>
                        </div>
                      ))}
                      {request.pendingMatches?.length > 3 && (
                        <div className="avatar placeholder">
                          <div className="bg-base-300 rounded-full w-6 h-6">
                            <span className="text-xs">+{request.pendingMatches.length - 3}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <Link
                      to={`/blood-requests/${requestId}`}
                      className="btn btn-xs btn-ghost w-full"
                    >
                      View Responses
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-base-content/70">
              <FaHourglassHalf className="mx-auto text-3xl mb-2 opacity-50" />
              <p className="text-sm">No pending responses</p>
            </div>
          )}

          <div className="p-4 border-t border-base-300">
            <Link to="/requester/my-requests?status=pending" className="btn btn-sm btn-outline w-full gap-2">
              View All Pending
              <FiArrowRight />
            </Link>
          </div>
        </div>

        {/* Urgent Requests */}
        <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-base-300 font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaExclamationCircle className="text-error" />
              Urgent Requests
            </div>
            <span className="badge badge-error">{urgentRequestsList.length}</span>
          </div>

          {urgentRequestsList.length > 0 ? (
            <div className="divide-y divide-base-300 max-h-80 overflow-y-auto">
              {urgentRequestsList.map((request) => {
                const requestId = getId(request?._id);
                return (
                  <div key={requestId} className="p-4 hover:bg-base-200 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold text-error">
                          {safeString(request?.requestDetails?.bloodType)}
                        </span>
                        <span className="ml-2 text-xs opacity-70">
                          {request?.requestDetails?.units || 0} units
                        </span>
                      </div>
                      <span className={`badge badge-${request?.requestDetails?.urgency === "emergency" ? "error" : "warning"} badge-sm`}>
                        {request?.requestDetails?.urgency || "urgent"}
                      </span>
                    </div>
                    <p className="text-sm flex items-center gap-1 mb-1">
                      <FaHospital className="text-base-content/50" />
                      {safeString(request?.patientInfo?.hospital) || "Unknown"}
                    </p>
                    <p className="text-xs opacity-70 mb-2">
                      Required by: {formatDate(request?.requestDetails?.requiredBy)}
                    </p>
                    <Link
                      to={`/blood-requests/${requestId}`}
                      className="btn btn-xs btn-error w-full"
                    >
                      Find Donors Now
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-base-content/70">
              <FaCheckCircle className="mx-auto text-3xl mb-2 opacity-50 text-success" />
              <p className="text-sm">No urgent requests</p>
            </div>
          )}

          <div className="p-4 border-t border-base-300">
            <Link to="/requester/my-requests?urgency=urgent,emergency" className="btn btn-sm btn-outline w-full gap-2">
              View All Urgent
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      {recentRequests.length > 0 && (
        <div className="bg-base-100 border border-base-300 rounded-lg p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <FiClock className="text-primary" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentRequests.slice(0, 3).map((request, index) => {
              const status = request?.status?.current || "pending";
              const statusColor = statusColors[status] || "primary";

              let StatusIcon = FaDroplet;
              if (status === "fulfilled") StatusIcon = FaCheckDouble;
              if (status === "pending") StatusIcon = FaHourglassHalf;

              return (
                <div key={index} className="flex items-start gap-4">
                  <div className={`bg-${statusColor}/10 p-2 rounded-full`}>
                    <StatusIcon className={`text-${statusColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          {safeString(request?.requestDetails?.bloodType)} Request - {safeString(request?.patientInfo?.patientName) || "Patient"}
                        </p>
                        <p className="text-sm opacity-70">
                          {request?.requestDetails?.units || 0} units • {safeString(request?.patientInfo?.hospital) || "Unknown"}
                        </p>
                      </div>
                      <span className={`badge badge-${statusColor} badge-sm`}>
                        {status}
                      </span>
                    </div>
                    <p className="text-xs opacity-60 mt-1">
                      {formatDateTime(request?.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          to="/requester/create-request"
          className="bg-base-100 border border-base-300 rounded-lg p-4 text-center hover:shadow-lg transition-all hover:border-primary/50 group"
        >
          <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
            <FaDroplet className="text-primary" size={24} />
          </div>
          <p className="font-semibold text-sm">New Request</p>
        </Link>

        <Link
          to="/requester/my-requests"
          className="bg-base-100 border border-base-300 rounded-lg p-4 text-center hover:shadow-lg transition-all hover:border-primary/50 group"
        >
          <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
            <FaClipboardList className="text-primary" size={24} />
          </div>
          <p className="font-semibold text-sm">My Requests</p>
        </Link>

        <Link
          to="/requester/blood-banks"
          className="bg-base-100 border border-base-300 rounded-lg p-4 text-center hover:shadow-lg transition-all hover:border-primary/50 group"
        >
          <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
            <FiUsers className="text-primary" size={24} />
          </div>
          <p className="font-semibold text-sm">Blood Banks</p>
        </Link>

        <Link
          to="/requester/settings"
          className="bg-base-100 border border-base-300 rounded-lg p-4 text-center hover:shadow-lg transition-all hover:border-primary/50 group"
        >
          <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
            <FaUser className="text-primary" size={24} />
          </div>
          <p className="font-semibold text-sm">Settings</p>
        </Link>
      </div>

      {/* Footer Note */}
      <div className="text-xs text-center text-base-content/60 flex items-center justify-center gap-2">
        <FaShieldAlt className="inline" />
        Your requests are shared with eligible donors in your area.
      </div>
    </div>
  );
};

export default RequesterDashboard;
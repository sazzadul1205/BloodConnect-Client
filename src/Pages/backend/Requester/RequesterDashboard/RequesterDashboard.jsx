// Pages/backend/Requester/RequesterDashboard/RequesterDashboard.jsx

// React
import { Link } from "react-router";
import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

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
import { formatAppDate, formatAppDateTime } from "../../../../utils/dateFormat";
import { getId } from "../../../../utils/id";
import { safeString } from "../../../../utils/string";
import { getUserId } from "../../../../utils/user";

// Format date for display
const formatDate = (value) => {
  return formatAppDate(value, "MMM d, yyyy", "Invalid Date");
};

// Format date with time
const formatDateTime = (value) => {
  return formatAppDateTime(value, "MMM d, yyyy p", "Invalid Date");
};

// Status colors mapping for badges
const statusColors = {
  pending: "warning",
  matched: "info",
  fulfilled: "success",
  cancelled: "error",
  expired: "neutral",
};

const RequesterDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { axiosInstance } = useAxiosPublic();

  // Get requester ID from user object using utility function
  const requesterId = useMemo(
    () => getUserId(user),
    [user],
  );

  // Fetch dashboard data using TanStack Query
  const {
    data: dashboardData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["requester-dashboard", requesterId],
    enabled: !authLoading && !!requesterId, // Only run when not loading and requesterId exists
    queryFn: async () => {
      if (!requesterId) {
        throw new Error("Requester ID not found. Please log in again.");
      }

      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch requester profile and blood requests in parallel for better performance
      const [profileRes, requestsRes] = await Promise.all([
        axiosInstance.get(`/users/profile/${requesterId}`, { headers }),
        axiosInstance.get("/blood-requests", { headers }),
      ]);

      const requester = profileRes?.data?.data || null;
      const allRequests = requestsRes?.data?.data || [];

      // Filter requests belonging to this requester
      const bloodRequests = allRequests.filter(
        (request) => String(getId(request.requesterId)) === String(requesterId),
      );

      return { requester, bloodRequests };
    },
  });

  const requester = dashboardData?.requester || null;
  const bloodRequests = useMemo(
    () => dashboardData?.bloodRequests ?? [],
    [dashboardData?.bloodRequests],
  );

  /**
   * Calculate comprehensive request statistics
   * This memoized value updates only when bloodRequests changes
   */
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

    // Calculate response statistics from donor matches
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

    // Get urgent requests (emergency or urgent priority)
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
      activeRequests: pending + matched, // Requests that are still active
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

  /**
   * Get the 5 most recent requests sorted by creation date
   */
  const recentRequests = useMemo(() => {
    return [...bloodRequests]
      .sort((a, b) => {
        const dateA = new Date(a?.createdAt?.$date || a?.createdAt || 0);
        const dateB = new Date(b?.createdAt?.$date || b?.createdAt || 0);
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [bloodRequests]);

  /**
   * Get requests that have pending donor responses
   */
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

  /**
   * Count active requests by blood type
   */
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

  /**
   * Get urgent/emergency requests that need immediate attention
   */
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

  // Loading state - show blood loader animation
  if (isLoading || authLoading) return <BloodLoader />;

  // Error state - show error with retry option
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-4 sm:space-y-6 min-h-screen bg-base-200 p-3 sm:p-4 md:p-6">
      {/* ==================== HEADER SECTION ==================== */}
      {/* Responsive header with welcome message and action buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Welcome Text */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FaClipboardList className="text-primary" />
            Requester Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Welcome back, <span className="font-semibold text-primary">
              {requester?.profile?.fullName || user?.profile?.fullName || "Requester"}
            </span>!
            Track your blood requests and responses.
          </p>
        </div>

        {/* Action Buttons - Responsive layout */}
        <div className="flex flex-wrap items-center gap-2">
          {/* New Request Button - Primary Action */}
          <Link
            to="/requester/create-request"
            className="btn btn-xs sm:btn-sm btn-primary gap-1 sm:gap-2 flex-1 sm:flex-none"
          >
            <FaDroplet size={12} className="sm:hidden" />
            <FaDroplet size={14} className="hidden sm:block" />
            <span className="truncate">New Request</span>
          </Link>

          {/* Settings Button */}
          <Link
            to="/requester/settings"
            className="btn btn-xs sm:btn-sm btn-outline gap-1 sm:gap-2 flex-1 sm:flex-none"
          >
            <FaUser size={12} className="sm:hidden" />
            <FaUser size={14} className="hidden sm:block" />
            <span className="hidden sm:inline">Settings</span>
          </Link>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => refetch()}
            className="btn btn-xs sm:btn-sm btn-primary gap-1 sm:gap-2"
            disabled={isFetching}
            aria-label="Refresh data"
          >
            <FiRefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{isFetching ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* ==================== URGENT REQUESTS ALERT ==================== */}
      {/* Show alert banner when there are urgent requests */}
      {requestStats.urgentRequests > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="alert alert-error bg-error/10 border-error/20 flex-col sm:flex-row gap-3"
        >
          <div className="flex items-center gap-2">
            <FaExclamationCircle className="text-error text-lg sm:text-xl shrink-0" />
            <span className="text-xs sm:text-sm text-base-content">
              You have <span className="font-semibold text-error">{requestStats.urgentRequests}</span> urgent{' '}
              {requestStats.urgentRequests === 1 ? 'request' : 'requests'} that need attention.
            </span>
          </div>
          <Link
            to="/requester/my-requests?urgency=urgent"
            className="btn btn-xs sm:btn-sm btn-error w-full sm:w-auto"
          >
            View Urgent Requests
          </Link>
        </motion.div>
      )}

      {/* ==================== STATS CARDS GRID ==================== */}
      {/* Responsive grid: 1 column on mobile, 2 on tablet, 4 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Requests Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stat bg-base-100 border border-base-300 rounded-lg p-4 sm:p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Total Requests</p>
              <p className="stat-value text-2xl sm:text-3xl font-bold text-primary">
                {requestStats.total}
              </p>
            </div>
            <div className="stat-figure bg-primary/10 p-2 sm:p-3 rounded-full">
              <FaClipboardList className="text-primary text-xl sm:text-2xl" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">
            Active: <span className="font-semibold text-warning">{requestStats.activeRequests}</span>
          </p>
        </motion.div>

        {/* Fulfilled Requests Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="stat bg-base-100 border border-base-300 rounded-lg p-4 sm:p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Fulfilled</p>
              <p className="stat-value text-2xl sm:text-3xl font-bold text-success">
                {requestStats.fulfilled}
              </p>
            </div>
            <div className="stat-figure bg-success/10 p-2 sm:p-3 rounded-full">
              <FaCheckCircle className="text-success text-xl sm:text-2xl" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">
            Success rate: <span className="font-semibold">{requestStats.successRate}%</span>
          </p>
        </motion.div>

        {/* Pending Responses Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="stat bg-base-100 border border-base-300 rounded-lg p-4 sm:p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Pending Responses</p>
              <p className="stat-value text-2xl sm:text-3xl font-bold text-warning">
                {requestStats.pendingResponses}
              </p>
            </div>
            <div className="stat-figure bg-warning/10 p-2 sm:p-3 rounded-full">
              <FaHourglassHalf className="text-warning text-xl sm:text-2xl" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">
            Total responses: <span className="font-semibold">{requestStats.totalResponses}</span>
          </p>
        </motion.div>

        {/* Units Requested Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="stat bg-base-100 border border-base-300 rounded-lg p-4 sm:p-5 hover:shadow-lg transition-shadow sm:col-span-2 xl:col-span-1"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Units Requested</p>
              <p className="stat-value text-2xl sm:text-3xl font-bold text-info">
                {requestStats.totalUnitsRequested}
              </p>
            </div>
            <div className="stat-figure bg-info/10 p-2 sm:p-3 rounded-full">
              <FaTint className="text-info text-xl sm:text-2xl" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">
            Fulfilled: <span className="font-semibold">{requestStats.totalUnitsFulfilled}</span>
          </p>
        </motion.div>
      </div>

      {/* ==================== CHARTS AND ANALYTICS SECTION ==================== */}
      {/* Only show if there are requests */}
      {bloodRequests.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Requests by Status Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-base-100 border border-base-300 rounded-lg p-4 sm:p-5"
          >
            <h2 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-4">
              <FaFlask className="text-primary" />
              Requests by Status
            </h2>
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
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="capitalize">{status}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-1.5 sm:h-2">
                      <div
                        className={`bg-${color} h-1.5 sm:h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Requests by Blood Type Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-base-100 border border-base-300 rounded-lg p-4 sm:p-5"
          >
            <h2 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-4">
              <FaDroplet className="text-primary" />
              Active Requests by Blood Type
            </h2>
            <div className="space-y-3">
              {Object.entries(requestsByBloodType)
                .filter(([, count]) => count > 0)
                .map(([bloodType, count]) => {
                  const maxCount = Math.max(...Object.values(requestsByBloodType), 1);
                  const percentage = (count / maxCount) * 100;
                  return (
                    <div key={bloodType} className="space-y-1">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="font-semibold">{bloodType}</span>
                        <span>{count} {count === 1 ? 'req' : "req's"}</span>
                      </div>
                      <div className="w-full bg-base-300 rounded-full h-1.5 sm:h-2">
                        <div
                          className="bg-primary h-1.5 sm:h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              {Object.values(requestsByBloodType).every(v => v === 0) && (
                <p className="text-center text-base-content/70 py-4 text-sm">
                  No active requests
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ==================== THREE COLUMN GRID ==================== */}
      {/* Recent Requests, Pending Responses, Urgent Requests */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Requests Column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-base-100 border border-base-300 rounded-lg overflow-hidden flex flex-col"
        >
          {/* Column Header */}
          <div className="p-3 sm:p-4 border-b border-base-300 font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <FiClock className="text-primary" />
              <span>Recent Requests</span>
            </div>
            <span className="badge badge-primary badge-sm">{bloodRequests.length}</span>
          </div>

          {/* Scrollable Content Area */}
          {recentRequests.length > 0 ? (
            <div className="divide-y divide-base-300 max-h-80 overflow-y-auto">
              {recentRequests.map((request) => {
                const urgency = request?.requestDetails?.urgency || "normal";
                const requestId = getId(request?._id);
                return (
                  <div key={requestId} className="p-3 sm:p-4 hover:bg-base-200 transition-colors">
                    {/* Request Header */}
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                      <div>
                        <span className="font-semibold text-sm sm:text-base text-primary">
                          {safeString(request?.requestDetails?.bloodType)}
                        </span>
                        <span className="ml-2 text-xs opacity-70">
                          {request?.requestDetails?.units || 0}u
                        </span>
                      </div>
                      <span className={`badge badge-${statusColors[request?.status?.current] || "neutral"} badge-sm`}>
                        {request?.status?.current || "unknown"}
                      </span>
                    </div>

                    {/* Hospital Info */}
                    <p className="text-xs sm:text-sm flex items-center gap-1 mb-2">
                      <FaHospital className="text-base-content/50 shrink-0" />
                      <span className="truncate">{safeString(request?.patientInfo?.hospital) || "Unknown"}</span>
                    </p>

                    {/* Footer with Urgency and Date */}
                    <div className="flex flex-wrap justify-between items-center gap-2">
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
            // Empty State
            <div className="p-6 sm:p-8 text-center text-base-content/70">
              <FiDroplet className="mx-auto text-2xl sm:text-3xl mb-2 opacity-50" />
              <p className="text-xs sm:text-sm">No requests yet</p>
              <Link to="/requester/create-request" className="btn btn-xs btn-primary mt-2">
                Create First Request
              </Link>
            </div>
          )}

          {/* View All Link */}
          <div className="p-3 sm:p-4 border-t border-base-300 mt-auto">
            <Link to="/requester/my-requests" className="btn btn-xs sm:btn-sm btn-outline w-full gap-2">
              View All Requests
              <FiArrowRight size={12} />
            </Link>
          </div>
        </motion.div>

        {/* Pending Responses Column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-base-100 border border-base-300 rounded-lg overflow-hidden flex flex-col"
        >
          {/* Column Header */}
          <div className="p-3 sm:p-4 border-b border-base-300 font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <FaHourglassHalf className="text-warning" />
              <span>Pending Responses</span>
            </div>
            <span className="badge badge-warning badge-sm">{requestStats.pendingResponses}</span>
          </div>

          {/* Scrollable Content Area */}
          {requestsWithPendingResponses.length > 0 ? (
            <div className="divide-y divide-base-300 max-h-80 overflow-y-auto">
              {requestsWithPendingResponses.map((request) => {
                const requestId = getId(request?._id);
                return (
                  <div key={requestId} className="p-3 sm:p-4 hover:bg-base-200 transition-colors">
                    {/* Request Header */}
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-sm sm:text-base text-primary">
                        {safeString(request?.requestDetails?.bloodType)}
                      </span>
                      <span className="badge badge-warning badge-sm">
                        {request.pendingMatches?.length || 0} pending
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm mb-2">
                      Waiting for {request.pendingMatches?.length || 0} donor
                      {request.pendingMatches?.length !== 1 ? 's' : ''}
                    </p>

                    {/* Donor Avatars */}
                    <div className="flex gap-1 mb-2">
                      {request.pendingMatches?.slice(0, 3).map((match, idx) => (
                        <div key={idx} className="avatar placeholder">
                          <div className="bg-warning/20 text-warning rounded-full w-5 h-5 sm:w-6 sm:h-6">
                            <span className="text-[10px] sm:text-xs">D{idx + 1}</span>
                          </div>
                        </div>
                      ))}
                      {request.pendingMatches?.length > 3 && (
                        <div className="avatar placeholder">
                          <div className="bg-base-300 rounded-full w-5 h-5 sm:w-6 sm:h-6">
                            <span className="text-[10px] sm:text-xs">+{request.pendingMatches.length - 3}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* View Link */}
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
            // Empty State
            <div className="p-6 sm:p-8 text-center text-base-content/70">
              <FaHourglassHalf className="mx-auto text-2xl sm:text-3xl mb-2 opacity-50" />
              <p className="text-xs sm:text-sm">No pending responses</p>
            </div>
          )}

          {/* View All Link */}
          <div className="p-3 sm:p-4 border-t border-base-300 mt-auto">
            <Link to="/requester/my-requests?status=pending" className="btn btn-xs sm:btn-sm btn-outline w-full gap-2">
              View All Pending
              <FiArrowRight size={12} />
            </Link>
          </div>
        </motion.div>

        {/* Urgent Requests Column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-base-100 border border-base-300 rounded-lg overflow-hidden flex flex-col"
        >
          {/* Column Header */}
          <div className="p-3 sm:p-4 border-b border-base-300 font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <FaExclamationCircle className="text-error" />
              <span>Urgent Requests</span>
            </div>
            <span className="badge badge-error badge-sm">{urgentRequestsList.length}</span>
          </div>

          {/* Scrollable Content Area */}
          {urgentRequestsList.length > 0 ? (
            <div className="divide-y divide-base-300 max-h-80 overflow-y-auto">
              {urgentRequestsList.map((request) => {
                const requestId = getId(request?._id);
                return (
                  <div key={requestId} className="p-3 sm:p-4 hover:bg-base-200 transition-colors">
                    {/* Request Header */}
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                      <div>
                        <span className="font-semibold text-sm sm:text-base text-error">
                          {safeString(request?.requestDetails?.bloodType)}
                        </span>
                        <span className="ml-2 text-xs opacity-70">
                          {request?.requestDetails?.units || 0}u
                        </span>
                      </div>
                      <span className={`badge badge-${request?.requestDetails?.urgency === "emergency" ? "error" : "warning"} badge-sm`}>
                        {request?.requestDetails?.urgency || "urgent"}
                      </span>
                    </div>

                    {/* Hospital Info */}
                    <p className="text-xs sm:text-sm flex items-center gap-1 mb-2">
                      <FaHospital className="text-base-content/50 shrink-0" />
                      <span className="truncate">{safeString(request?.patientInfo?.hospital) || "Unknown"}</span>
                    </p>

                    {/* Required By Date */}
                    <p className="text-xs opacity-70 mb-2">
                      Required by: {formatDate(request?.requestDetails?.requiredBy)}
                    </p>

                    {/* Action Button */}
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
            // Empty State
            <div className="p-6 sm:p-8 text-center text-base-content/70">
              <FaCheckCircle className="mx-auto text-2xl sm:text-3xl mb-2 opacity-50 text-success" />
              <p className="text-xs sm:text-sm">No urgent requests</p>
            </div>
          )}

          {/* View All Link */}
          <div className="p-3 sm:p-4 border-t border-base-300 mt-auto">
            <Link to="/requester/my-requests?urgency=urgent,emergency" className="btn btn-xs sm:btn-sm btn-outline w-full gap-2">
              View All Urgent
              <FiArrowRight size={12} />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ==================== RECENT ACTIVITY TIMELINE ==================== */}
      {/* Only show if there are recent requests */}
      {recentRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-base-100 border border-base-300 rounded-lg p-4 sm:p-5"
        >
          <h2 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-4">
            <FiClock className="text-primary" />
            Recent Activity
          </h2>

          {/* Timeline Items */}
          <div className="space-y-4">
            {recentRequests.slice(0, 3).map((request, index) => {
              const status = request?.status?.current || "pending";
              const statusColor = statusColors[status] || "primary";

              let StatusIcon = FaDroplet;
              if (status === "fulfilled") StatusIcon = FaCheckDouble;
              if (status === "pending") StatusIcon = FaHourglassHalf;

              return (
                <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  {/* Status Icon */}
                  <div className={`bg-${statusColor}/10 p-2 rounded-full w-fit`}>
                    <StatusIcon className={`text-${statusColor} text-sm sm:text-base`} />
                  </div>

                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div>
                        <p className="font-semibold text-sm sm:text-base">
                          {safeString(request?.requestDetails?.bloodType)} Request - {safeString(request?.patientInfo?.patientName) || "Patient"}
                        </p>
                        <p className="text-xs sm:text-sm opacity-70 truncate">
                          {request?.requestDetails?.units || 0} units • {safeString(request?.patientInfo?.hospital) || "Unknown"}
                        </p>
                      </div>
                      <span className={`badge badge-${statusColor} badge-sm sm:self-start`}>
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
        </motion.div>
      )}

      {/* ==================== QUICK ACTIONS GRID ==================== */}
      {/* Responsive grid of action cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
      >
        {/* New Request Quick Action */}
        <Link
          to="/requester/create-request"
          className="bg-base-100 border border-base-300 rounded-lg p-3 sm:p-4 text-center hover:shadow-lg transition-all hover:border-primary/50 group"
        >
          <div className="bg-primary/10 p-2 sm:p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
            <FaDroplet className="text-primary text-lg sm:text-xl" />
          </div>
          <p className="font-semibold text-xs sm:text-sm">New Request</p>
        </Link>

        {/* My Requests Quick Action */}
        <Link
          to="/requester/my-requests"
          className="bg-base-100 border border-base-300 rounded-lg p-3 sm:p-4 text-center hover:shadow-lg transition-all hover:border-primary/50 group"
        >
          <div className="bg-primary/10 p-2 sm:p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
            <FaClipboardList className="text-primary text-lg sm:text-xl" />
          </div>
          <p className="font-semibold text-xs sm:text-sm">My Requests</p>
        </Link>

        {/* Blood Banks Quick Action */}
        <Link
          to="/requester/blood-banks"
          className="bg-base-100 border border-base-300 rounded-lg p-3 sm:p-4 text-center hover:shadow-lg transition-all hover:border-primary/50 group"
        >
          <div className="bg-primary/10 p-2 sm:p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
            <FiUsers className="text-primary text-lg sm:text-xl" />
          </div>
          <p className="font-semibold text-xs sm:text-sm">Blood Banks</p>
        </Link>

        {/* Settings Quick Action */}
        <Link
          to="/requester/settings"
          className="bg-base-100 border border-base-300 rounded-lg p-3 sm:p-4 text-center hover:shadow-lg transition-all hover:border-primary/50 group"
        >
          <div className="bg-primary/10 p-2 sm:p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
            <FaUser className="text-primary text-lg sm:text-xl" />
          </div>
          <p className="font-semibold text-xs sm:text-sm">Settings</p>
        </Link>
      </motion.div>

      {/* ==================== FOOTER NOTE ==================== */}
      {/* Privacy/Info footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-xs text-center text-base-content/60 flex items-center justify-center gap-2 px-2"
      >
        <FaShieldAlt className="shrink-0" />
        <span>Your requests are shared with eligible donors in your area.</span>
      </motion.div>
    </div>
  );
};

export default RequesterDashboard;
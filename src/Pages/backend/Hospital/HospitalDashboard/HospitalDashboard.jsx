// Pages/backend/Hospital/HospitalDashboard/HospitalDashboard.jsx

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
  FiCalendar,
  FiMapPin,
} from "react-icons/fi";

// Icons - Fa (Font Awesome)
import {
  FaTint,
  FaHospital,
  FaCheckCircle,
  FaUser,
  FaShieldAlt,
  FaFlask,
  FaClipboardList,
  FaHourglassHalf,
  FaAmbulance,
  FaBuilding,
  FaPhoneAlt,
  FaEnvelope,
} from "react-icons/fa";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";
import { formatAppDate, formatAppTime } from "../../../../utils/dateFormat";
import { getId } from "../../../../utils/id";
import { safeString } from "../../../../utils/string";
import { getUserId } from "../../../../utils/user";

// ==================== CONSTANTS ====================

// Format date for display
const formatDate = (value) => {
  return formatAppDate(value);
};

// Status colors mapping for badges
const statusColors = {
  pending: "warning",
  matched: "info",
  fulfilled: "success",
  cancelled: "error",
  expired: "neutral",
};

// Urgency colors mapping for badges
const urgencyColors = {
  emergency: "error",
  urgent: "warning",
  normal: "info",
};

// ==================== QUERY KEYS ====================

const queryKeys = {
  hospitalDashboard: (hospitalId) => ['hospital-dashboard', hospitalId],
  hospitalRequests: (hospitalName) => ['hospital-requests', hospitalName],
  hospitalPending: (hospitalName) => ['hospital-pending', hospitalName],
  hospitalFulfilled: (hospitalName) => ['hospital-fulfilled', hospitalName],
  upcomingEvents: (city) => ['upcoming-events', city],
  eligibleDonors: (city) => ['eligible-donors', city],
};

// ==================== MAIN COMPONENT ====================

const HospitalDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { axiosInstance } = useAxiosPublic();

  // Get hospital ID from user object using utility function
  const hospitalId = useMemo(
    () => getUserId(user),
    [user],
  );

  // Get hospital name from user profile
  const hospitalName = useMemo(() => {
    return user?.profile?.fullName || user?.hospitalName || "";
  }, [user]);

  /**
   * TanStack Query: Fetch all hospital dashboard data
   * Combines multiple API calls into a single query
   * Only runs when authentication is complete and hospitalId exists
   */
  const {
    data: dashboardData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    // Query key includes hospitalId for cache management
    queryKey: queryKeys.hospitalDashboard(hospitalId),

    // Only run query when we have hospitalId and auth is loaded
    enabled: !authLoading && !!hospitalId,

    // Query function that fetches all dashboard data
    queryFn: async () => {
      if (!hospitalId) {
        throw new Error("Hospital ID not found. Please log in again.");
      }

      // Get auth token for API requests
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch hospital profile
      const profileRes = await axiosInstance.get(`/users/profile/${hospitalId}`, { headers });
      const hospital = profileRes?.data?.data || null;

      // Get city for location-based queries
      const city = hospital?.address?.city || "";

      // Fetch all blood requests for this hospital
      const requestsRes = await axiosInstance.get(
        `/blood-requests?hospitalName=${encodeURIComponent(hospitalName)}`,
        { headers }
      );

      // Fetch pending requests count
      const pendingRes = await axiosInstance.get(
        `/blood-requests?status=pending&hospitalName=${encodeURIComponent(hospitalName)}`,
        { headers }
      );

      // Fetch fulfilled requests count
      const fulfilledRes = await axiosInstance.get(
        `/blood-requests?status=fulfilled&hospitalName=${encodeURIComponent(hospitalName)}`,
        { headers }
      );

      // Fetch upcoming events in the city (non-critical, won't fail dashboard if error)
      let events = [];
      if (city) {
        try {
          const eventsRes = await axiosInstance.get(
            `/donation-events?upcoming=true&city=${encodeURIComponent(city)}`,
            { headers }
          );
          events = eventsRes?.data?.data || [];
        } catch (err) {
          // Log error but don't fail the dashboard
          console.error("Error fetching events:", err);
        }
      }

      // Fetch recent eligible donors (prefer city when available)
      let donors = [];
      try {
        const donorQuery = city
          ? `/donors/search/eligible?city=${encodeURIComponent(city)}`
          : "/donors/search/eligible";
        const donorsRes = await axiosInstance.get(donorQuery, { headers });
        donors = (donorsRes?.data?.data || []).slice(0, 5);
      } catch (err) {
        // Log error but don't fail the dashboard
        console.error("Error fetching donors:", err);
      }

      // Return combined dashboard data
      return {
        hospital,
        allRequests: requestsRes?.data?.data || [],
        pendingRequests: pendingRes?.data?.data || [],
        fulfilledRequests: fulfilledRes?.data?.data || [],
        upcomingEvents: events,
        recentDonors: donors,
      };
    },

    // Data is considered fresh for 5 minutes (reduces unnecessary refetch)
    staleTime: 5 * 60 * 1000,

    // Cache data for 10 minutes
    gcTime: 10 * 60 * 1000,
  });

  // ==================== MEMOIZED VALUES ====================

  /**
   * Extract data from dashboard query result
   * Using useMemo to prevent unnecessary recalculations
   */
  const hospital = dashboardData?.hospital || null;

  const allRequests = useMemo(
    () => dashboardData?.allRequests ?? [],
    [dashboardData?.allRequests],
  );

  const pendingRequests = useMemo(
    () => dashboardData?.pendingRequests ?? [],
    [dashboardData?.pendingRequests],
  );

  const fulfilledRequests = useMemo(
    () => dashboardData?.fulfilledRequests ?? [],
    [dashboardData?.fulfilledRequests],
  );

  const upcomingEvents = useMemo(
    () => dashboardData?.upcomingEvents ?? [],
    [dashboardData?.upcomingEvents],
  );

  const recentDonors = useMemo(
    () => dashboardData?.recentDonors ?? [],
    [dashboardData?.recentDonors],
  );

  /**
   * Calculate comprehensive request statistics
   * Memoized to update only when requests data changes
   */
  const requestStats = useMemo(() => {
    const total = allRequests.length;
    const pending = pendingRequests.length;
    const fulfilled = fulfilledRequests.length;
    const matched = allRequests.filter(r => r?.status?.current === "matched").length;
    const cancelled = allRequests.filter(r => r?.status?.current === "cancelled").length;

    // Calculate by urgency
    const emergency = allRequests.filter(r => r?.requestDetails?.urgency === "emergency").length;
    const urgent = allRequests.filter(r => r?.requestDetails?.urgency === "urgent").length;
    const normal = allRequests.filter(r => r?.requestDetails?.urgency === "normal").length;

    // Calculate total units requested and fulfilled
    const totalUnitsRequested = allRequests.reduce((sum, r) =>
      sum + (r?.requestDetails?.units || 0), 0
    );

    const totalUnitsFulfilled = fulfilledRequests.reduce((sum, r) =>
      sum + (r?.requestDetails?.units || 0), 0
    );

    // Calculate response rate from donor matches
    let totalResponses = 0;
    let acceptedResponses = 0;

    allRequests.forEach(request => {
      if (request?.matches && Array.isArray(request.matches)) {
        request.matches.forEach(match => {
          const responseStatus = match?.response?.status;
          if (responseStatus) {
            totalResponses++;
            if (responseStatus === "accepted") acceptedResponses++;
          }
        });
      }
    });

    return {
      total,
      pending,
      matched,
      fulfilled,
      cancelled,
      activeRequests: pending + matched, // Requests still needing attention
      emergency,
      urgent,
      normal,
      totalUnitsRequested,
      totalUnitsFulfilled,
      totalResponses,
      acceptedResponses,
      responseRate: totalResponses ? Math.round((acceptedResponses / totalResponses) * 100) : 0,
      fulfillmentRate: total ? Math.round((fulfilled / total) * 100) : 0,
    };
  }, [allRequests, pendingRequests, fulfilledRequests]);

  /**
   * Get recent 5 requests sorted by creation date
   */
  const recentRequests = useMemo(() => {
    return [...allRequests]
      .sort((a, b) => {
        const dateA = new Date(a?.createdAt?.$date || a?.createdAt || 0);
        const dateB = new Date(b?.createdAt?.$date || b?.createdAt || 0);
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [allRequests]);

  /**
   * Get emergency requests that need immediate attention
   */
  const emergencyRequests = useMemo(() => {
    return allRequests
      .filter(r =>
        r?.requestDetails?.urgency === "emergency" &&
        r?.status?.current !== "fulfilled" &&
        r?.status?.current !== "cancelled"
      )
      .sort((a, b) => new Date(a?.createdAt) - new Date(b?.createdAt))
      .slice(0, 3);
  }, [allRequests]);

  // ==================== LOADING & ERROR STATES ====================

  if (isLoading || authLoading) return <BloodLoader />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  // ==================== RENDER ====================

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-6">

      {/* ==================== HEADER SECTION ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Title and welcome message */}
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaHospital className="text-error" />
            Hospital Dashboard
          </h2>
          <p className="text-sm text-base-content/70 mt-1">
            Welcome back, <span className="font-semibold text-error">
              {hospital?.profile?.fullName || user?.profile?.fullName || "Hospital"}
            </span>!
            Manage blood requests and monitor activity.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            to="/hospital/my-requests"
            className="btn btn-sm btn-error gap-2"
          >
            <FaClipboardList />
            View Requests
          </Link>
          <Link
            to="/hospital/settings"
            className="btn btn-sm btn-outline gap-2"
          >
            <FaUser />
            <span className="hidden md:block" >Settings</span>
          </Link>
          <button
            type="button"
            onClick={() => refetch()}
            className="btn btn-sm btn-error gap-2"
            disabled={isFetching}
          >
            <FiRefreshCw className={isFetching ? "animate-spin" : ""} />
            <span className="hidden md:block" >{isFetching ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* ==================== HOSPITAL INFO CARD ==================== */}
      {hospital && (
        <div className="bg-base-100 border border-base-300 rounded-lg p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Hospital Avatar */}
            <div className="bg-error/10 p-4 rounded-full">
              <FaHospital className="text-error" size={32} />
            </div>

            {/* Hospital Details */}
            <div className="flex-1">
              <h3 className="text-xl font-bold">{hospital?.profile?.fullName || "Hospital"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-sm">
                {/* Phone */}
                {hospital?.phone && (
                  <div className="flex items-center gap-2">
                    <FaPhoneAlt className="text-error/70" size={14} />
                    <span>{hospital.phone}</span>
                  </div>
                )}
                {/* Email */}
                {hospital?.email && (
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="text-error/70" size={14} />
                    <span>{hospital.email}</span>
                  </div>
                )}
                {/* Location */}
                {hospital?.address?.city && (
                  <div className="flex items-center gap-2">
                    <FiMapPin className="text-error/70" size={14} />
                    <span>{hospital.address.city}, {hospital.address.state || ''}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Verified Badge */}
            <div className="badge badge-lg badge-error p-3">
              Verified Hospital
            </div>
          </div>
        </div>
      )}

      {/* ==================== EMERGENCY REQUESTS ALERT ==================== */}
      {requestStats.emergency > 0 && (
        <div className="alert alert-error bg-error/10 border-error/20">
          <FaAmbulance className="text-error animate-pulse" size={20} />
          <span className="text-base-content">
            <span className="font-semibold text-error">{requestStats.emergency}</span> emergency{' '}
            {requestStats.emergency === 1 ? 'request' : 'requests'} need immediate attention!
          </span>
          <Link to="/hospital/my-requests" className="btn btn-sm btn-error">
            View Emergency
          </Link>
        </div>
      )}

      {/* ==================== STATS CARDS GRID ==================== */}
      {/* Animated cards showing key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Requests Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stat bg-base-100 border border-base-300 rounded-lg p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70 mb-1">Total Requests</p>
              <p className="text-2xl font-bold text-error">{requestStats.total}</p>
            </div>
            <div className="p-3 rounded-full bg-error/10">
              <FaClipboardList className="text-error" size={24} />
            </div>
          </div>
          <p className="text-xs opacity-60 mt-2">
            Active: <span className="font-semibold text-warning">{requestStats.activeRequests}</span>
          </p>
        </motion.div>

        {/* Pending Requests Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="stat bg-base-100 border border-base-300 rounded-lg p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70 mb-1">Pending</p>
              <p className="text-2xl font-bold text-warning">{requestStats.pending}</p>
            </div>
            <div className="p-3 rounded-full bg-warning/10">
              <FaHourglassHalf className="text-warning" size={24} />
            </div>
          </div>
          <p className="text-xs opacity-60 mt-2">
            Awaiting donor responses
          </p>
        </motion.div>

        {/* Fulfilled Requests Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="stat bg-base-100 border border-base-300 rounded-lg p-5 hover:shadow-lg transition-shadow"
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
            Fulfillment rate: <span className="font-semibold">{requestStats.fulfillmentRate}%</span>
          </p>
        </motion.div>

        {/* Units Requested Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="stat bg-base-100 border border-base-300 rounded-lg p-5 hover:shadow-lg transition-shadow"
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

      {/* ==================== CHARTS AND ANALYTICS SECTION ==================== */}
      {/* Only show if there are requests */}
      {allRequests.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Requests by Status Chart */}
          <div className="bg-base-100 border border-base-300 rounded-lg p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <FaFlask className="text-error" />
              Requests by Status
            </h3>
            <div className="space-y-3">
              {[
                { status: "pending", count: requestStats.pending, color: "warning" },
                { status: "matched", count: requestStats.matched, color: "info" },
                { status: "fulfilled", count: requestStats.fulfilled, color: "success" },
                { status: "cancelled", count: requestStats.cancelled, color: "error" },
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

          {/* Requests by Urgency Chart */}
          <div className="bg-base-100 border border-base-300 rounded-lg p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <FaAmbulance className="text-error" />
              Requests by Urgency
            </h3>
            <div className="space-y-3">
              {[
                { urgency: "emergency", count: requestStats.emergency, color: "error" },
                { urgency: "urgent", count: requestStats.urgent, color: "warning" },
                { urgency: "normal", count: requestStats.normal, color: "info" },
              ].map(({ urgency, count, color }) => {
                if (count === 0) return null;
                const percentage = (count / requestStats.total) * 100;
                return (
                  <div key={urgency}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{urgency}</span>
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
        </div>
      )}

      {/* ==================== THREE COLUMN GRID ==================== */}
      {/* Recent Requests, Upcoming Events, Eligible Donors */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Recent Blood Requests Column */}
        <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-base-300 font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiClock className="text-error" />
              Recent Requests
            </div>
            <span className="badge badge-error">{allRequests.length}</span>
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
                        <span className="font-semibold text-error">
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
                      <FaUser className="text-base-content/50" size={12} />
                      {safeString(request?.patientInfo?.name) || "Unknown Patient"}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`badge badge-${urgencyColors[urgency] || "info"} badge-xs`}>
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
            </div>
          )}

          <div className="p-4 border-t border-base-300">
            <Link to="/hospital/my-requests" className="btn btn-sm btn-outline w-full gap-2">
              View All Requests
              <FiArrowRight />
            </Link>
          </div>
        </div>

        {/* Upcoming Events Column */}
        <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-base-300 font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiCalendar className="text-success" />
              Upcoming Events
            </div>
            <span className="badge badge-success">{upcomingEvents.length}</span>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="divide-y divide-base-300 max-h-80 overflow-y-auto">
              {upcomingEvents.map((event) => {
                const eventId = getId(event?._id);
                return (
                  <div key={eventId} className="p-4 hover:bg-base-200 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-success">
                        {safeString(event?.title) || "Blood Donation Camp"}
                      </span>
                      <span className={`badge badge-${event?.type === "emergency" ? "error" : "success"} badge-sm`}>
                        {event?.type || "camp"}
                      </span>
                    </div>
                    <p className="text-sm flex items-center gap-1 mb-1">
                      <FiMapPin className="text-base-content/50" size={12} />
                      {safeString(event?.location?.venue) || safeString(event?.location?.address) || "Location TBD"}
                    </p>
                    <p className="text-xs flex items-center gap-1 mb-2">
                      <FiCalendar size={10} className="opacity-50" />
                      {formatDate(event?.schedule?.startDate)}
                      {event?.schedule?.startTime && ` at ${event.schedule.startTime}`}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs opacity-70">
                        {event?.capacity?.currentRegistrations || 0}/{event?.capacity?.maxDonors || 0} registered
                      </span>
                      <Link
                        to="/hospital/events"
                        className="btn btn-xs btn-success"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-base-content/70">
              <FiCalendar className="mx-auto text-3xl mb-2 opacity-50" />
              <p className="text-sm">No upcoming events</p>
              {!hospital?.address?.city && (
                <p className="text-xs opacity-60 mt-1">
                  Add your city in settings to see local events
                </p>
              )}
            </div>
          )}

          <div className="p-4 border-t border-base-300">
            <Link to="/hospital/events" className="btn btn-sm btn-outline w-full gap-2">
              View All Events
              <FiArrowRight />
            </Link>
          </div>
        </div>

        {/* Recent Eligible Donors Column */}
        <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-base-300 font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiUsers className="text-info" />
              Eligible Donors
            </div>
            <span className="badge badge-info">{recentDonors.length}</span>
          </div>

          {recentDonors.length > 0 ? (
            <div className="divide-y divide-base-300 max-h-80 overflow-y-auto">
              {recentDonors.map((donor) => {
                const donorId = getId(donor?.donorId);
                return (
                  <div key={donorId} className="p-4 hover:bg-base-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className="bg-info/20 text-info rounded-full w-8 h-8 flex items-center justify-center">
                          <FaUser size={14} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {donor?.user?.profile?.fullName || "Anonymous Donor"}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-info">
                            {donor?.medicalInfo?.bloodType || "Unknown"}
                          </span>
                          {donor?.donationPreferences?.emergencyDonor && (
                            <span className="badge badge-error badge-xs">Emergency</span>
                          )}
                        </div>
                      </div>
                      <Link
                        to={`/hospital/donor-search/eligible?bloodType=${encodeURIComponent(
                          donor?.medicalInfo?.bloodType || "",
                        )}&city=${encodeURIComponent(hospital?.address?.city || "")}`}
                        className="btn btn-xs btn-ghost"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-base-content/70">
              <FiUsers className="mx-auto text-3xl mb-2 opacity-50" />
              <p className="text-sm">No eligible donors found</p>
              {!hospital?.address?.city && (
                <p className="text-xs opacity-60 mt-1">
                  Add your city in settings to find local donors
                </p>
              )}
            </div>
          )}

          <div className="p-4 border-t border-base-300">
            <Link
              to={`/hospital/donor-search/eligible?city=${encodeURIComponent(
                hospital?.address?.city || "",
              )}`}
              className="btn btn-sm btn-outline w-full gap-2"
            >
              Search Donors
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>

      {/* ==================== EMERGENCY REQUESTS SECTION ==================== */}
      {/* Show emergency requests that need immediate attention */}
      {emergencyRequests.length > 0 && (
        <div className="bg-base-100 border border-error/30 rounded-lg p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4 text-error">
            <FaAmbulance className="text-error" />
            Emergency Requests Needing Attention
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {emergencyRequests.map((request) => {
              const requestId = getId(request?._id);
              return (
                <div key={requestId} className="bg-error/5 border border-error/20 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-error">
                      {safeString(request?.requestDetails?.bloodType)}
                    </span>
                    <span className="badge badge-error badge-sm">Emergency</span>
                  </div>
                  <p className="text-sm mb-1">
                    {request?.requestDetails?.units || 0} units needed
                  </p>
                  <p className="text-xs opacity-70 mb-2">
                    Patient: {safeString(request?.patientInfo?.name) || "Unknown"}
                  </p>
                  <Link
                    to="/hospital/my-requests"
                    className="btn btn-xs btn-error w-full"
                  >
                    Find Donors Now
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== QUICK ACTIONS GRID ==================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          to="/hospital/my-requests"
          className="bg-base-100 border border-base-300 rounded-lg p-4 text-center hover:shadow-lg transition-all hover:border-error/50 group"
        >
          <div className="bg-error/10 p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-error/20 transition-colors">
            <FaClipboardList className="text-error" size={24} />
          </div>
          <p className="font-semibold text-sm">My Requests</p>
        </Link>

        <Link
          to="/hospital/blood-banks"
          className="bg-base-100 border border-base-300 rounded-lg p-4 text-center hover:shadow-lg transition-all hover:border-error/50 group"
        >
          <div className="bg-error/10 p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-error/20 transition-colors">
            <FaBuilding className="text-error" size={24} />
          </div>
          <p className="font-semibold text-sm">Blood Banks</p>
        </Link>

        <Link
          to="/hospital/events"
          className="bg-base-100 border border-base-300 rounded-lg p-4 text-center hover:shadow-lg transition-all hover:border-error/50 group"
        >
          <div className="bg-error/10 p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-error/20 transition-colors">
            <FiCalendar className="text-error" size={24} />
          </div>
          <p className="font-semibold text-sm">Donation Events</p>
        </Link>

        <Link
          to="/hospital/settings"
          className="bg-base-100 border border-base-300 rounded-lg p-4 text-center hover:shadow-lg transition-all hover:border-error/50 group"
        >
          <div className="bg-error/10 p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-error/20 transition-colors">
            <FaUser className="text-error" size={24} />
          </div>
          <p className="font-semibold text-sm">Settings</p>
        </Link>
      </div>

      {/* ==================== FOOTER NOTE ==================== */}
      <div className="text-xs text-center text-base-content/60 flex items-center justify-center gap-2">
        <FaShieldAlt className="inline" />
        Your hospital data is updated in real-time. Last updated: {formatAppTime(new Date())}
      </div>
    </div>
  );
};

export default HospitalDashboard;
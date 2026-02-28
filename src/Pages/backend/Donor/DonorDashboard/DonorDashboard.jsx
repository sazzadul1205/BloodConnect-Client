// Pages/backend/Donor/DonorDashboard/DonorDashboard.jsx

// React
import { Link } from "react-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";


// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons - Fi (Feather Icons)
import {
  FiCalendar,
  FiClock,
  FiDroplet,
  FiRefreshCw,
  FiUserCheck,
  FiHeart,
  FiMapPin,
  FiTrendingUp,
  FiArrowRight,
} from "react-icons/fi";

// Icons - Fa (Font Awesome)
import {
  FaTint,
  FaHeartbeat,
  FaHospital,
  FaCheckCircle,
  FaExclamationCircle,
  FaUser,
  FaShieldAlt,
  FaFlask,
} from "react-icons/fa";
import { FaDroplet } from "react-icons/fa6";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";
import DonorProfileRequired from "../../../../shared/DonorProfileRequired";
import { formatAppDate, formatAppDateTime } from "../../../../utils/dateFormat";

// Helper function to extract ID from MongoDB ObjectId
const getId = (value) =>
  typeof value === "object" ? value?.$oid || value?.toString?.() : value;

// Format date for display
const formatDate = (value) => {
  return formatAppDate(value);
};

// Format date with time
const formatDateTime = (value) => {
  return formatAppDateTime(value);
};

// Urgency colors mapping
const urgencyColors = {
  emergency: "error",
  urgent: "warning",
  normal: "info",
  low: "success",
};

const DonorDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // Get donor ID from user object
  const donorId = useMemo(
    () => user?.userId || user?._id || user?.id || user?.uid,
    [user],
  );

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileMissing, setProfileMissing] = useState(false);
  const [donor, setDonor] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentDonations, setRecentDonations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!donorId) {
      setError(new Error("Donor ID not found. Please log in again."));
      setLoading(false);
      return;
    }

    setRefreshing(true);
    setError(null);
    setProfileMissing(false);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch donor profile first because dashboard depends on it
      const donorRes = await axiosInstance.get(`/donors/${donorId}`, { headers });
      const donorData = donorRes?.data?.data || null;
      setDonor(donorData);

      // Fetch pending requests and upcoming events in parallel
      const [requestsRes, eventsRes] = await Promise.all([
        axiosInstance.get("/blood-requests?status=pending", { headers }),
        axiosInstance.get("/donation-events?upcoming=true"),
      ]);

      setPendingRequests(requestsRes?.data?.data || []);
      setUpcomingEvents(eventsRes?.data?.data || []);

      // Extract recent donations from donor data
      if (donorData?.donationHistory) {
        const sortedDonations = [...donorData.donationHistory]
          .sort((a, b) => new Date(b.date?.$date || b.date) - new Date(a.date?.$date || a.date))
          .slice(0, 5);
        setRecentDonations(sortedDonations);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      if (err?.response?.status === 404) {
        setProfileMissing(true);
        setError(null);
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [axiosInstance, donorId, token]);

  // Initial data fetch
  useEffect(() => {
    if (!authLoading) {
      fetchDashboardData();
    }
  }, [authLoading, fetchDashboardData]);

  // Get user's registered events
  const myRegistrations = useMemo(() => {
    if (!donorId) return [];
    return upcomingEvents.filter((event) =>
      (event?.registeredDonors || []).some(
        (registration) => String(getId(registration?.donorId)) === String(donorId),
      ),
    );
  }, [donorId, upcomingEvents]);

  // Get matched requests that the donor has responded to
  const myResponses = useMemo(() => {
    if (!donorId || !donor?.matches) return [];
    return donor.matches.filter(match =>
      match.response?.status && match.response.status !== "pending"
    );
  }, [donorId, donor?.matches]);

  // Calculate dashboard statistics
  const stats = useMemo(() => {
    const eligibility = donor?.eligibility || {};
    const donationHistory = donor?.donationHistory || [];

    // Calculate total volume by type
    const volumeByType = donationHistory.reduce((acc, donation) => {
      const type = donation.type || "whole_blood";
      acc[type] = (acc[type] || 0) + (donation.volume || 0);
      return acc;
    }, {});

    // Calculate donations by year
    const donationsByYear = donationHistory.reduce((acc, donation) => {
      const year = new Date(donation.date?.$date || donation.date).getFullYear();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {});

    return {
      isEligible: Boolean(eligibility?.isEligible),
      nextEligibleDate: eligibility?.nextEligibleDate,
      totalDonated: eligibility?.totalDonated || 0,
      totalDonations: donationHistory.length,
      volumeByType,
      donationsByYear,
      lastDonation: donationHistory[donationHistory.length - 1],
      responseRate: donor?.stats?.responseRate || 0,
      reputation: donor?.stats?.reputation || 100,
    };
  }, [donor]);

  // Loading state
  if (loading || authLoading) return <BloodLoader />;

  // Error state
  if (error) return <ErrorState error={error} onRetry={fetchDashboardData} />;
  if (profileMissing) {
    return (
      <DonorProfileRequired
        title="Dashboard Needs Donor Profile"
        description="Create your donor profile to view eligibility, donation activity, and matched requests."
      />
    );
  }

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaTint className="text-error" />
            Donor Dashboard
          </h2>
          <p className="text-sm text-base-content/70 mt-1">
            Welcome back, <span className="font-semibold text-error">{user?.profile?.fullName || "Donor"}</span>!
            Here's your donation activity at a glance.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            to="/donor/profile"
            className="btn btn-sm btn-outline gap-2"
          >
            <FaUser />
            View Profile
          </Link>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="btn btn-sm btn-error gap-2"
            disabled={refreshing}
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Eligibility Alert */}
      {!stats.isEligible && stats.nextEligibleDate && (
        <div className="alert alert-warning bg-warning/10 border-warning/20">
          <FaExclamationCircle className="text-warning" />
          <span>
            You are currently not eligible to donate. You will be eligible again on{' '}
            <span className="font-semibold">{formatDate(stats.nextEligibleDate)}</span>.
          </span>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Eligibility Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-base-100 border border-base-300 rounded-lg p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70 mb-1">Eligibility Status</p>
              <p className={`text-xl font-bold ${stats.isEligible ? "text-success" : "text-warning"}`}>
                {stats.isEligible ? "Eligible" : "Not Eligible"}
              </p>
            </div>
            <div className={`p-3 rounded-full ${stats.isEligible ? "bg-success/10" : "bg-warning/10"}`}>
              <FaCheckCircle className={stats.isEligible ? "text-success" : "text-warning"} size={24} />
            </div>
          </div>
          {!stats.isEligible && stats.nextEligibleDate && (
            <p className="text-xs opacity-60 mt-2">
              Next eligible: {formatDate(stats.nextEligibleDate)}
            </p>
          )}
        </motion.div>

        {/* Total Donations Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-base-100 border border-base-300 rounded-lg p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70 mb-1">Total Donations</p>
              <p className="text-2xl font-bold text-error">{stats.totalDonations}</p>
            </div>
            <div className="p-3 rounded-full bg-error/10">
              <FaTint className="text-error" size={24} />
            </div>
          </div>
          <p className="text-xs opacity-60 mt-2">
            Total volume: <span className="font-semibold">{stats.totalDonated} ml</span>
          </p>
        </motion.div>

        {/* Response Rate Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-base-100 border border-base-300 rounded-lg p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70 mb-1">Response Rate</p>
              <p className="text-2xl font-bold text-info">{stats.responseRate}%</p>
            </div>
            <div className="p-3 rounded-full bg-info/10">
              <FiTrendingUp className="text-info" size={24} />
            </div>
          </div>
          <p className="text-xs opacity-60 mt-2">
            Reputation: <span className="font-semibold">{stats.reputation}</span>
          </p>
        </motion.div>

        {/* Active Registrations Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-base-100 border border-base-300 rounded-lg p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70 mb-1">Active Registrations</p>
              <p className="text-2xl font-bold text-success">{myRegistrations.length}</p>
            </div>
            <div className="p-3 rounded-full bg-success/10">
              <FiCalendar className="text-success" size={24} />
            </div>
          </div>
          <p className="text-xs opacity-60 mt-2">
            Pending requests: <span className="font-semibold">{pendingRequests.length}</span>
          </p>
        </motion.div>
      </div>

      {/* Charts and Analytics Section */}
      {Object.keys(stats.volumeByType).length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Donation Volume by Type */}
          <div className="bg-base-100 border border-base-300 rounded-lg p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <FaFlask className="text-error" />
              Donation Volume by Type
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.volumeByType).map(([type, volume]) => {
                const percentage = (volume / stats.totalDonated) * 100;
                return (
                  <div key={type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{type.replace("_", " ")}</span>
                      <span className="font-semibold">{volume} ml</span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-2">
                      <div
                        className="bg-error h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Donations by Year */}
          <div className="bg-base-100 border border-base-300 rounded-lg p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <FiTrendingUp className="text-error" />
              Donations by Year
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.donationsByYear)
                .sort(([a], [b]) => b - a)
                .map(([year, count]) => {
                  const maxCount = Math.max(...Object.values(stats.donationsByYear));
                  const percentage = (count / maxCount) * 100;
                  return (
                    <div key={year}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{year}</span>
                        <span className="font-semibold">{count} donations</span>
                      </div>
                      <div className="w-full bg-base-300 rounded-full h-2">
                        <div
                          className="bg-info h-2 rounded-full"
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

      {/* Recent Donations Timeline */}
      {recentDonations.length > 0 && (
        <div className="bg-base-100 border border-base-300 rounded-lg p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <FiClock className="text-error" />
            Recent Donations
          </h3>
          <div className="space-y-4">
            {recentDonations.map((donation, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="bg-error/10 p-2 rounded-full">
                  <FaTint className="text-error" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        {donation.type?.replace("_", " ")} - {donation.volume}ml
                      </p>
                      <p className="text-sm opacity-70">
                        {formatDateTime(donation.date)}
                      </p>
                    </div>
                    {donation.reaction && (
                      <span className="badge badge-warning badge-sm">
                        {donation.reaction}
                      </span>
                    )}
                  </div>
                  {donation.nextEligibleDate && (
                    <p className="text-xs opacity-60 mt-1">
                      Next eligible: {formatDate(donation.nextEligibleDate)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-base-300">
            <Link to="/donor/history" className="btn btn-sm btn-outline w-full gap-2">
              View Full History
              <FiArrowRight />
            </Link>
          </div>
        </div>
      )}

      {/* Three Column Grid for Requests, Events, Registrations */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Matched Blood Requests */}
        <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-base-300 font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaDroplet className="text-error" />
              Matched Requests
            </div>
            <span className="badge badge-error">{pendingRequests.length}</span>
          </div>

          {pendingRequests.length > 0 ? (
            <div className="divide-y divide-base-300 max-h-80 overflow-y-auto">
              {pendingRequests.slice(0, 5).map((request) => {
                const urgency = request?.requestDetails?.urgency || "normal";
                return (
                  <div key={String(getId(request?._id))} className="p-4 hover:bg-base-200 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-error">
                        {request?.requestDetails?.bloodType}
                      </span>
                      <span className={`badge badge-${urgencyColors[urgency]} badge-sm`}>
                        {urgency}
                      </span>
                    </div>
                    <p className="text-sm flex items-center gap-1 mb-1">
                      <FaHospital className="text-base-content/50" />
                      {request?.location?.hospitalName || request?.patientInfo?.hospital || "Unknown"}
                    </p>
                    <p className="text-xs opacity-70">
                      {request?.requestDetails?.units} units needed
                    </p>
                    <div className="mt-2">
                      <Link
                        to="/blood-requests"
                        className="btn btn-xs btn-ghost w-full"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-base-content/70">
              <FiDroplet className="mx-auto text-3xl mb-2 opacity-50" />
              <p className="text-sm">No pending matched requests</p>
            </div>
          )}

          <div className="p-4 border-t border-base-300">
            <Link to="/blood-requests" className="btn btn-sm btn-outline w-full gap-2">
              View All Requests
              <FiArrowRight />
            </Link>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-base-300 font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiCalendar className="text-error" />
              Upcoming Events
            </div>
            <span className="badge badge-error">{upcomingEvents.length}</span>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="divide-y divide-base-300 max-h-80 overflow-y-auto">
              {upcomingEvents.slice(0, 5).map((event) => (
                <div key={String(getId(event?._id))} className="p-4 hover:bg-base-200 transition-colors">
                  <p className="font-semibold mb-1">{event?.title || "Event"}</p>
                  <p className="text-sm flex items-center gap-1 mb-1">
                    <FiMapPin className="text-base-content/50" />
                    {event?.location?.venue || "Venue not set"}
                  </p>
                  <p className="text-sm flex items-center gap-1">
                    <FiClock className="text-base-content/50" />
                    {formatDate(event?.schedule?.startDate)}
                  </p>
                  <div className="mt-2">
                    <Link
                      to="/donation-events"
                      className="btn btn-xs btn-ghost w-full"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-base-content/70">
              <FiCalendar className="mx-auto text-3xl mb-2 opacity-50" />
              <p className="text-sm">No upcoming events</p>
            </div>
          )}

          <div className="p-4 border-t border-base-300">
            <Link to="/donation-events" className="btn btn-sm btn-outline w-full gap-2">
              View All Events
              <FiArrowRight />
            </Link>
          </div>
        </div>

        {/* My Registrations */}
        <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-base-300 font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiUserCheck className="text-error" />
              My Registrations
            </div>
            <span className="badge badge-success">{myRegistrations.length}</span>
          </div>

          {myRegistrations.length > 0 ? (
            <div className="divide-y divide-base-300 max-h-80 overflow-y-auto">
              {myRegistrations.slice(0, 5).map((event) => (
                <div key={String(getId(event?._id))} className="p-4 hover:bg-base-200 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold">{event?.title || "Event"}</p>
                    <span className="badge badge-success badge-sm">Registered</span>
                  </div>
                  <p className="text-sm flex items-center gap-1 mb-1">
                    <FiMapPin className="text-base-content/50" />
                    {event?.location?.venue || "Venue not set"}
                  </p>
                  <p className="text-sm flex items-center gap-1">
                    <FiClock className="text-base-content/50" />
                    {formatDate(event?.schedule?.startDate)}
                  </p>
                  <div className="mt-2">
                    <Link
                      to="/donation-events"
                      className="btn btn-xs btn-ghost w-full"
                    >
                      Manage Registration
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-base-content/70">
              <FiUserCheck className="mx-auto text-3xl mb-2 opacity-50" />
              <p className="text-sm">No active registrations</p>
            </div>
          )}

          <div className="p-4 border-t border-base-300">
            <Link to="/donation-events" className="btn btn-sm btn-outline w-full gap-2">
              Browse Events
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>

      {/* Response History Section (if any) */}
      {myResponses.length > 0 && (
        <div className="bg-base-100 border border-base-300 rounded-lg p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <FiHeart className="text-error" />
            Recent Responses to Requests
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myResponses.slice(0, 3).map((response, index) => (
              <div key={index} className="bg-base-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className={`badge badge-${response.response?.status === 'accepted' ? 'success' : 'warning'}`}>
                    {response.response?.status}
                  </span>
                  <span className="text-xs opacity-70">
                    {response.response?.respondedAt && formatDate(response.response.respondedAt)}
                  </span>
                </div>
                {response.response?.message && (
                  <p className="text-sm italic opacity-80">"{response.response.message}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          to={donorId ? `/donor/${donorId}/medical` : "/donor/profile"}
          className="bg-base-100 border border-base-300 rounded-lg p-4 text-center hover:shadow-lg transition-all hover:border-error/50 group"
        >
          <div className="bg-error/10 p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-error/20 transition-colors">
            <FaHeartbeat className="text-error" size={24} />
          </div>
          <p className="font-semibold text-sm">Medical Info</p>
        </Link>

        <Link
          to="/donor/history"
          className="bg-base-100 border border-base-300 rounded-lg p-4 text-center hover:shadow-lg transition-all hover:border-error/50 group"
        >
          <div className="bg-error/10 p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-error/20 transition-colors">
            <FiClock className="text-error" size={24} />
          </div>
          <p className="font-semibold text-sm">Donation History</p>
        </Link>

        <Link
          to="/blood-requests"
          className="bg-base-100 border border-base-300 rounded-lg p-4 text-center hover:shadow-lg transition-all hover:border-error/50 group"
        >
          <div className="bg-error/10 p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-error/20 transition-colors">
            <FaDroplet className="text-error" size={24} />
          </div>
          <p className="font-semibold text-sm">Blood Requests</p>
        </Link>

        <Link
          to="/donation-events"
          className="bg-base-100 border border-base-300 rounded-lg p-4 text-center hover:shadow-lg transition-all hover:border-error/50 group"
        >
          <div className="bg-error/10 p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-error/20 transition-colors">
            <FiCalendar className="text-error" size={24} />
          </div>
          <p className="font-semibold text-sm">Donation Events</p>
        </Link>
      </div>

      {/* Footer Note */}
      <div className="text-xs text-center text-base-content/60 flex items-center justify-center gap-2">
        <FaShieldAlt className="inline" />
        Your information is secure and only shared with verified blood banks and hospitals.
      </div>
    </div>
  );
};

export default DonorDashboard;

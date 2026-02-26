// Pages/backend/Donor/DonationEvents/DonationEvents.jsx

// React
import React, { useCallback, useEffect, useMemo, useState } from "react";

// Sweet Alert
import Swal from "sweetalert2";

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Icons - Fi (Feather Icons)
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiActivity,
  FiRefreshCw,
  FiNavigation,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiFilter,
  FiUser,
} from "react-icons/fi";

// Icons - Fa (Font Awesome)
import {
  FaHospital,
  FaUsers,
  FaTint,
  FaHeartbeat,
  FaCalendarAlt,
  FaCheckCircle as FaCheckCircleSolid,
  FaTimesCircle,
} from "react-icons/fa";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";

// Helper function to extract ID from MongoDB ObjectId
const getId = (value) =>
  typeof value === "object" ? value?.$oid || value?.toString?.() : value;

// Format date and time for display
const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value?.$date || value);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};


// Event type colors and icons
const eventTypeConfig = {
  drive: { icon: FaHeartbeat, color: "success", label: "Blood Drive" },
  emergency: { icon: FaTimesCircle, color: "error", label: "Emergency" },
  regular: { icon: FaCalendarAlt, color: "warning", label: "Regular" },
};

// Status colors
const statusColors = {
  upcoming: "info",
  ongoing: "success",
  completed: "success",
  cancelled: "error",
  postponed: "warning",
};

const DonationEvents = () => {
  const { user, loading: authLoading } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // Get donor ID from user object
  const donorId = useMemo(
    () => String(user?.userId || user?._id || user?.id || user?.uid || ""),
    [user],
  );

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [coords, setCoords] = useState({
    latitude: "",
    longitude: "",
    radius: 50000, // Default 50km radius
  });
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    bloodType: "",
    eventType: "",
  });

  // Auth headers for API requests
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token],
  );

  // Fetch all events
  const fetchAllEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/donation-events");
      setEvents(res.data?.data || []);
      setActiveTab("all");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  // Fetch upcoming events
  const fetchUpcomingEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/donation-events?upcoming=true");
      setEvents(res.data?.data || []);
      setActiveTab("upcoming");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  // Fetch nearby events based on coordinates
  const fetchNearbyEvents = useCallback(async () => {
    if (!coords.latitude || !coords.longitude) {
      await Swal.fire({
        title: "Location Required",
        text: "Please provide latitude and longitude to find nearby events.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        latitude: String(coords.latitude),
        longitude: String(coords.longitude),
        radius: String(coords.radius || 50000),
      });
      const res = await axiosInstance.get(`/donation-events/nearby?${query.toString()}`);
      setEvents(res.data?.data || []);
      setActiveTab("nearby");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [axiosInstance, coords.latitude, coords.longitude, coords.radius]);

  // Fetch event details by ID
  const fetchEventDetails = useCallback(
    async (eventId) => {
      setDetailsLoading(true);
      try {
        const res = await axiosInstance.get(`/donation-events/${eventId}`, {
          headers: authHeaders,
        });
        setSelectedEvent(res.data?.data || null);
      } catch (err) {
        await Swal.fire({
          title: "Failed To Load Event",
          text: err?.response?.data?.error || "Could not load event details.",
          icon: "error",
          confirmButtonColor: "#ef4444",
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        });
      } finally {
        setDetailsLoading(false);
      }
    },
    [authHeaders, axiosInstance],
  );

  // Refresh current tab
  const refreshCurrentTab = useCallback(async () => {
    if (activeTab === "upcoming") {
      await fetchUpcomingEvents();
      return;
    }
    if (activeTab === "nearby") {
      await fetchNearbyEvents();
      return;
    }
    await fetchAllEvents();
  }, [activeTab, fetchAllEvents, fetchNearbyEvents, fetchUpcomingEvents]);

  // Check if donor is registered for an event
  const isRegistered = useCallback(
    (event) => {
      const currentDonorId = String(donorId || "");
      if (!currentDonorId) return false;
      const registrations = event?.registeredDonors || [];
      return registrations.some(
        (registration) => String(getId(registration?.donorId) || "") === currentDonorId,
      );
    },
    [donorId],
  );

  // Handle event registration
  const handleRegister = useCallback(
    async (eventId) => {
      setActionLoadingId(eventId);
      try {
        await axiosInstance.post(
          `/donation-events/${eventId}/register`,
          {},
          { headers: authHeaders },
        );

        await Swal.fire({
          title: "Successfully Registered",
          html: `
            <div class="text-center">
              <p class="mb-2">You have been registered for this event.</p>
              <p class="text-sm text-base-content/70">Check your email for confirmation and event details.</p>
            </div>
          `,
          icon: "success",
          confirmButtonColor: "#ef4444",
          confirmButtonText: "Great!",
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        });

        await refreshCurrentTab();
        await fetchEventDetails(eventId);
      } catch (err) {
        await Swal.fire({
          title: "Registration Failed",
          text: err?.response?.data?.error || "Could not register for this event.",
          icon: "error",
          confirmButtonColor: "#ef4444",
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        });
      } finally {
        setActionLoadingId("");
      }
    },
    [authHeaders, axiosInstance, fetchEventDetails, refreshCurrentTab],
  );

  // Handle registration cancellation
  const handleCancelRegistration = useCallback(
    async (eventId) => {
      // Confirm cancellation
      const result = await Swal.fire({
        title: "Cancel Registration?",
        text: "Are you sure you want to cancel your registration for this event?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, cancel",
        cancelButtonText: "No, keep",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      });

      if (!result.isConfirmed) return;

      setActionLoadingId(eventId);
      try {
        await axiosInstance.delete(`/donation-events/${eventId}/register`, {
          headers: authHeaders,
        });

        await Swal.fire({
          title: "Registration Cancelled",
          html: `
            <div class="text-center">
              <p class="mb-2">Your registration has been cancelled.</p>
              <p class="text-sm text-base-content/70">We hope to see you at future events!</p>
            </div>
          `,
          icon: "success",
          confirmButtonColor: "#ef4444",
          confirmButtonText: "OK",
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        });

        await refreshCurrentTab();
        await fetchEventDetails(eventId);
      } catch (err) {
        await Swal.fire({
          title: "Cancel Failed",
          text: err?.response?.data?.error || "Could not cancel registration.",
          icon: "error",
          confirmButtonColor: "#ef4444",
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        });
      } finally {
        setActionLoadingId("");
      }
    },
    [authHeaders, axiosInstance, fetchEventDetails, refreshCurrentTab],
  );

  // Get user's current location
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      Swal.fire({
        title: "Not Supported",
        text: "Geolocation is not supported in this browser.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));

        // Show success message
        Swal.fire({
          title: "Location Updated",
          text: "Your location has been set. Click 'Nearby' to find events.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        });
      },
      async () => {
        await Swal.fire({
          title: "Location Access Failed",
          text: "Unable to read your location. You can enter coordinates manually.",
          icon: "warning",
          confirmButtonColor: "#ef4444",
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        });
      },
    );
  };

  // Filter events based on filters
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    if (filters.bloodType) {
      filtered = filtered.filter(event =>
        event?.requirements?.bloodTypes?.includes(filters.bloodType) ||
        !event?.requirements?.bloodTypes?.length
      );
    }

    if (filters.eventType) {
      filtered = filtered.filter(event => event?.type === filters.eventType);
    }

    return filtered;
  }, [events, filters]);

  // Load initial data
  useEffect(() => {
    if (!authLoading) {
      fetchAllEvents();
    }
  }, [authLoading, fetchAllEvents]);

  // Loading state
  if (loading || authLoading) return <BloodLoader />;

  // Error state
  if (error) return <ErrorState error={error} onRetry={refreshCurrentTab} />;

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FiCalendar className="text-error" />
            Donation Events
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            Browse events, view details, and manage your registrations.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'all' ? 'btn-error' : 'btn-outline'}`}
            onClick={fetchAllEvents}
          >
            All Events
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'upcoming' ? 'btn-error' : 'btn-outline'}`}
            onClick={fetchUpcomingEvents}
          >
            Upcoming
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'nearby' ? 'btn-error' : 'btn-outline'}`}
            onClick={fetchNearbyEvents}
          >
            Nearby
          </button>
          <button
            type="button"
            className="btn btn-sm btn-error gap-2"
            onClick={refreshCurrentTab}
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>
      </div>

      {/* Nearby Search Panel */}
      <div className="bg-base-100 border border-base-300 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <FiNavigation className="text-error" />
            Nearby Search
          </h3>
          <button
            type="button"
            className="btn btn-xs btn-ghost"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <FiFilter />
            {filterOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Coordinates Input */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="number"
            step="0.000001"
            placeholder="Latitude"
            className="input input-bordered input-sm"
            value={coords.latitude}
            onChange={(e) => setCoords((prev) => ({ ...prev, latitude: e.target.value }))}
          />
          <input
            type="number"
            step="0.000001"
            placeholder="Longitude"
            className="input input-bordered input-sm"
            value={coords.longitude}
            onChange={(e) => setCoords((prev) => ({ ...prev, longitude: e.target.value }))}
          />
          <input
            type="number"
            min="1000"
            step="1000"
            placeholder="Radius (meters)"
            className="input input-bordered input-sm"
            value={coords.radius}
            onChange={(e) => setCoords((prev) => ({ ...prev, radius: e.target.value }))}
          />
          <button
            type="button"
            className="btn btn-sm btn-outline gap-2"
            onClick={useMyLocation}
          >
            <FiNavigation />
            Use My Location
          </button>
        </div>

        {/* Additional Filters (Collapsible) */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-3 border-t border-base-300"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  className="select select-bordered select-sm"
                  value={filters.eventType}
                  onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
                >
                  <option value="">All Event Types</option>
                  {Object.entries(eventTypeConfig).map(([value, config]) => (
                    <option key={value} value={value}>{config.label}</option>
                  ))}
                </select>
                <select
                  className="select select-bordered select-sm"
                  value={filters.bloodType}
                  onChange={(e) => setFilters(prev => ({ ...prev, bloodType: e.target.value }))}
                >
                  <option value="">All Blood Types</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Events List */}
      <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-base-300 flex items-center justify-between">
          <span className="font-semibold capitalize flex items-center gap-2">
            {activeTab === 'all' ? 'All' : activeTab === 'upcoming' ? 'Upcoming' : 'Nearby'} Events
            <span className="badge badge-error badge-sm">{filteredEvents.length}</span>
          </span>
          {activeTab === 'nearby' && coords.latitude && coords.longitude && (
            <span className="text-xs opacity-70">
              Within {(coords.radius / 1000).toFixed(1)}km of your location
            </span>
          )}
        </div>

        {filteredEvents.length > 0 ? (
          <div className="divide-y divide-base-300">
            {filteredEvents.map((event) => {
              const eventId = String(getId(event?._id) || "");
              const registered = isRegistered(event);
              const busy = actionLoadingId === eventId;
              const eventType = event?.type || 'regular';
              const TypeIcon = eventTypeConfig[eventType]?.icon || FiCalendar;
              const typeColor = eventTypeConfig[eventType]?.color || 'info';
              const status = event?.status?.current || 'upcoming';
              const spotsLeft = event?.spotsLeft ?? 0;
              const isFull = event?.registrationStatus === 'full' || spotsLeft === 0;

              return (
                <motion.div
                  key={eventId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 hover:bg-base-200 transition-colors"
                >
                  <div className="flex flex-col xl:flex-row xl:items-center gap-4">
                    {/* Event Icon */}
                    <div className={`bg-${typeColor}/10 p-3 rounded-full hidden xl:block`}>
                      <TypeIcon className={`text-${typeColor}`} size={24} />
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-lg">{event?.title || "Event"}</p>
                        <span className={`badge badge-${typeColor} badge-sm capitalize`}>
                          {eventTypeConfig[eventType]?.label || eventType}
                        </span>
                        <span className={`badge badge-${statusColors[status]} badge-sm capitalize`}>
                          {status}
                        </span>
                        {isFull && (
                          <span className="badge badge-error badge-sm">Full</span>
                        )}
                      </div>

                      <p className="text-sm text-base-content/70 line-clamp-2">
                        {event?.description || "No description provided."}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <FiClock className="opacity-70" />
                          {formatDateTime(event?.schedule?.startDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiMapPin className="opacity-70" />
                          {event?.location?.venue || event?.location?.address || "Location unavailable"}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaHospital className="opacity-70" />
                          {event?.bloodBank?.name || "Blood bank unavailable"}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaUsers className="opacity-70" />
                          <span className={spotsLeft < 10 ? 'text-error font-semibold' : ''}>
                            {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => fetchEventDetails(eventId)}
                        disabled={detailsLoading}
                      >
                        <FiEye />
                        Details
                      </button>

                      {registered ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-warning gap-2"
                          onClick={() => handleCancelRegistration(eventId)}
                          disabled={busy}
                        >
                          {busy ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <FiXCircle />
                          )}
                          {busy ? "Cancelling..." : "Cancel"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`btn btn-sm gap-2 ${isFull ? 'btn-disabled' : 'btn-error'}`}
                          onClick={() => handleRegister(eventId)}
                          disabled={busy || isFull}
                        >
                          {busy ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <FiCheckCircle />
                          )}
                          {busy ? "Registering..." : isFull ? "Full" : "Register"}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          // Empty State
          <div className="p-12 text-center text-base-content/70">
            <FiActivity className="mx-auto text-4xl mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">No Events Found</p>
            <p className="text-sm opacity-70">
              {activeTab === 'nearby'
                ? "No donation events found near your location. Try increasing the radius or check back later."
                : "No donation events match your current filters. Try adjusting your search criteria."}
            </p>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <dialog className="modal modal-open" onClick={() => setSelectedEvent(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-box max-w-3xl p-0 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-linear-to-r from-error to-error/80 p-6 text-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-3 rounded-full">
                      <FiCalendar size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-2xl">{selectedEvent.title}</h3>
                      <p className="text-white/80 text-sm">
                        {eventTypeConfig[selectedEvent?.type]?.label || selectedEvent?.type || "Event"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20"
                  >
                    X
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {/* Description */}
                <p className="text-base-content/70 mb-4">{selectedEvent.description}</p>

                {/* Event Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date & Time Card */}
                  <div className="bg-base-200 rounded-lg p-4">
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <FiClock className="text-error" />
                      Date & Time
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="opacity-70">Start</p>
                        <p className="font-medium">{formatDateTime(selectedEvent?.schedule?.startDate)}</p>
                      </div>
                      <div>
                        <p className="opacity-70">End</p>
                        <p className="font-medium">{formatDateTime(selectedEvent?.schedule?.endDate)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Location Card */}
                  <div className="bg-base-200 rounded-lg p-4">
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <FiMapPin className="text-error" />
                      Location
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="opacity-70">Venue</p>
                        <p className="font-medium">{selectedEvent?.location?.venue || "N/A"}</p>
                      </div>
                      <div>
                        <p className="opacity-70">Address</p>
                        <p className="font-medium">{selectedEvent?.location?.address || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Capacity Card */}
                  <div className="bg-base-200 rounded-lg p-4">
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <FaUsers className="text-error" />
                      Capacity
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="opacity-70">Registered</p>
                        <p className="font-medium">{selectedEvent?.capacity?.currentRegistrations || 0}</p>
                      </div>
                      <div>
                        <p className="opacity-70">Maximum Donors</p>
                        <p className="font-medium">{selectedEvent?.capacity?.maxDonors || 0}</p>
                      </div>
                      <div>
                        <p className="opacity-70">Spots Left</p>
                        <p className={`font-medium ${selectedEvent?.spotsLeft < 10 ? 'text-error' : ''}`}>
                          {selectedEvent?.spotsLeft || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Requirements Card */}
                  <div className="bg-base-200 rounded-lg p-4">
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <FaTint className="text-error" />
                      Requirements
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="opacity-70">Accepted Blood Types</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedEvent?.requirements?.bloodTypes?.length > 0 ? (
                            selectedEvent.requirements.bloodTypes.map((type) => (
                              <span key={type} className="badge badge-error badge-sm">{type}</span>
                            ))
                          ) : (
                            <span className="text-sm">All types accepted</span>
                          )}
                        </div>
                      </div>
                      {selectedEvent?.requirements?.ageMin && (
                        <div>
                          <p className="opacity-70">Minimum Age</p>
                          <p className="font-medium">{selectedEvent.requirements.ageMin} years</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Blood Bank Card */}
                  {selectedEvent?.bloodBank && (
                    <div className="bg-base-200 rounded-lg p-4 md:col-span-2">
                      <h4 className="font-semibold flex items-center gap-2 mb-3">
                        <FaHospital className="text-error" />
                        Organizing Blood Bank
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="opacity-70">Name</p>
                          <p className="font-medium">{selectedEvent.bloodBank.name}</p>
                        </div>
                        <div>
                          <p className="opacity-70">Contact</p>
                          <p className="font-medium">{selectedEvent.bloodBank.phone || "N/A"}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="opacity-70">Address</p>
                          <p className="font-medium">{selectedEvent.bloodBank.address || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Registered Donors Card (if any) */}
                  {selectedEvent?.registeredDonors?.length > 0 && (
                    <div className="bg-base-200 rounded-lg p-4 md:col-span-2">
                      <h4 className="font-semibold flex items-center gap-2 mb-3">
                        <FaUsers className="text-error" />
                        Registered Donors ({selectedEvent.registeredDonors.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedEvent.registeredDonors.slice(0, 5).map((reg, idx) => (
                          <div key={idx} className="badge badge-outline gap-1 p-3">
                            <FiUser className="text-xs" />
                            {reg.donorName || "Registered Donor"}
                          </div>
                        ))}
                        {selectedEvent.registeredDonors.length > 5 && (
                          <div className="badge badge-outline p-3">
                            +{selectedEvent.registeredDonors.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Registration Status Alert */}
                {isRegistered(selectedEvent) && (
                  <div className="mt-4 alert alert-success bg-success/10 border-success/20">
                    <FaCheckCircleSolid className="text-success" />
                    <span>You are registered for this event.</span>
                  </div>
                )}

                {selectedEvent?.spotsLeft === 0 && (
                  <div className="mt-4 alert alert-error bg-error/10 border-error/20">
                    <FiAlertCircle className="text-error" />
                    <span>This event is full. No more registrations accepted.</span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-action border-t border-base-300 p-4 bg-base-200/50">
                <div className="flex justify-end gap-2 w-full">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setSelectedEvent(null)}
                  >
                    Close
                  </button>
                  {isRegistered(selectedEvent) ? (
                    <button
                      type="button"
                      className="btn btn-warning gap-2"
                      onClick={() => {
                        setSelectedEvent(null);
                        handleCancelRegistration(getId(selectedEvent._id));
                      }}
                      disabled={actionLoadingId === getId(selectedEvent._id)}
                    >
                      {actionLoadingId === getId(selectedEvent._id) ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        <FiXCircle />
                      )}
                      Cancel Registration
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`btn gap-2 ${selectedEvent?.spotsLeft === 0 ? 'btn-disabled' : 'btn-error'}`}
                      onClick={() => {
                        setSelectedEvent(null);
                        handleRegister(getId(selectedEvent._id));
                      }}
                      disabled={actionLoadingId === getId(selectedEvent._id) || selectedEvent?.spotsLeft === 0}
                    >
                      {actionLoadingId === getId(selectedEvent._id) ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        <FiCheckCircle />
                      )}
                      {selectedEvent?.spotsLeft === 0 ? 'Event Full' : 'Register Now'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Modal Backdrop */}
            <form method="dialog" className="modal-backdrop">
              <button onClick={() => setSelectedEvent(null)}>close</button>
            </form>
          </dialog>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DonationEvents;


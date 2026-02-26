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
  FiFilter,
} from "react-icons/fi";

// Icons - Fa (Font Awesome)
import {
  FaHospital,
  FaUsers,
  FaHeartbeat,
  FaCalendarAlt,
  FaTimesCircle,
} from "react-icons/fa";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import ErrorState from "../../../../shared/ErrorState";
import BloodLoader from "../../../../shared/BloodLoader";

// Modals
import EventDetailsModal from "./EventDetailsModal/EventDetailsModal";

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
  const { axiosInstance } = useAxiosPublic();
  const { user, loading: authLoading } = useAuth();
  const token = localStorage.getItem("auth_token");

  // Get donor ID from user object
  const donorId = useMemo(
    () => String(user?.userId || user?._id || user?.id || user?.uid || ""),
    [user],
  );

  // States
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState("");

  // Map state
  const [coords, setCoords] = useState({
    latitude: "",
    longitude: "",
    radius: 50000,
  });

  // Filters state
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
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
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
      try {
        const res = await axiosInstance.get(`/donation-events/${eventId}`, {
          headers: authHeaders,
        });
        setSelectedEvent(res.data?.data || null);
        document.getElementById("event_details_modal")?.showModal();
      } catch (err) {
        await Swal.fire({
          title: "Failed To Load Event",
          text: err?.response?.data?.error || "Could not load event details.",
          icon: "error",
          confirmButtonColor: "#ef4444",
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
            confirmButton: "btn btn-sm btn-error text-white",
          },
          buttonsStyling: false,
        });
      }
    },
    [authHeaders, axiosInstance],
  );

  const CloseModal = useCallback(() => {
    setSelectedEvent(null);
    document.getElementById("event_details_modal")?.close();
  }, []);

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
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
            confirmButton: "btn btn-sm btn-error text-white",
          },
          buttonsStyling: false,
        });

        await refreshCurrentTab();
      } catch (err) {
        await Swal.fire({
          title: "Registration Failed",
          text: err?.response?.data?.error || "Could not register for this event.",
          icon: "error",
          confirmButtonColor: "#ef4444",
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
            confirmButton: "btn btn-sm btn-error text-white",
          },
          buttonsStyling: false,
        });
      } finally {
        setActionLoadingId("");
      }
    },
    [authHeaders, axiosInstance, refreshCurrentTab],
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
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
          cancelButton: "btn btn-sm",
        },
        buttonsStyling: false,
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
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
            confirmButton: "btn btn-sm btn-error text-white",
          },
          buttonsStyling: false,
        });

        await refreshCurrentTab();
      } catch (err) {
        await Swal.fire({
          title: "Cancel Failed",
          text: err?.response?.data?.error || "Could not cancel registration.",
          icon: "error",
          confirmButtonColor: "#ef4444",
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
            confirmButton: "btn btn-sm btn-error text-white",
          },
          buttonsStyling: false,
        });
      } finally {
        setActionLoadingId("");
      }
    },
    [authHeaders, axiosInstance, refreshCurrentTab],
  );

  // Get user's current location
  const useMyLocation = () => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      Swal.fire({
        title: "Not Supported",
        text: "Geolocation is not supported in this browser.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
      return;
    }

    // Get user's current location
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
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          },
          buttonsStyling: false,
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
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
            confirmButton: "btn btn-sm btn-error text-white",
          },
          buttonsStyling: false,
        });
      },
    );
  };

  // Filter events based on filters
  const filteredEvents = useMemo(() => {
    // Copy events
    let filtered = [...events];

    // Filter by blood type
    if (filters.bloodType) {
      filtered = filtered.filter(event =>
        event?.requirements?.bloodTypes?.includes(filters.bloodType) ||
        !event?.requirements?.bloodTypes?.length
      );
    }

    // Filter by event type
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

  // Reset filters when tab changes
  useEffect(() => {
    setFilters({ bloodType: "", eventType: "" });
  }, [activeTab]);

  // Loading state
  if (loading || authLoading) return <BloodLoader />;

  // Error state
  if (error) return <ErrorState error={error} onRetry={refreshCurrentTab} />;

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-6">
      {/* Header Section with Fade In */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        {/* Header copy: communicates context and purpose of donation events dashboard. */}
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {/* Visual identity icon for donation events system. */}
            <FiCalendar className="text-error" />
            Donation Events
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            Browse events, view details, and manage your registrations.
          </p>
        </div>

        {/* Tab Buttons with staggered animations */}
        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className={`btn btn-sm ${activeTab === 'all' ? 'btn-error' : 'btn-outline'}`}
            onClick={fetchAllEvents}
          >
            All Events
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className={`btn btn-sm ${activeTab === 'upcoming' ? 'btn-error' : 'btn-outline'}`}
            onClick={fetchUpcomingEvents}
          >
            Upcoming
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className={`btn btn-sm ${activeTab === 'nearby' ? 'btn-error' : 'btn-outline'}`}
            onClick={fetchNearbyEvents}
          >
            Nearby
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className="btn btn-sm btn-error gap-2"
            onClick={refreshCurrentTab}
          >
            <FiRefreshCw size={14} />
            Refresh
          </motion.button>
        </div>
      </motion.div>

      {/* Nearby Search Panel with Fade In */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-base-100 border border-base-300 rounded-lg p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <FiNavigation className="text-error" />
            Nearby Search
          </h3>
          <button
            type="button"
            className="btn btn-xs btn-ghost gap-1"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <FiFilter size={14} />
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
            <FiNavigation size={14} />
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
              transition={{ duration: 0.3 }}
              className="pt-3 border-t border-base-300"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  className="select select-bordered select-sm w-full"
                  value={filters.eventType}
                  onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
                >
                  <option value="">All Event Types</option>
                  {Object.entries(eventTypeConfig).map(([value, config]) => (
                    <option key={value} value={value}>{config.label}</option>
                  ))}
                </select>
                <select
                  className="select select-bordered select-sm w-full"
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
      </motion.div>

      {/* Events List with Fade In */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="bg-base-100 border border-base-300 rounded-lg overflow-hidden"
      >
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
            {filteredEvents.map((event, index) => {
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
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.02 }}
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
                          <FiClock className="opacity-70" size={14} />
                          {formatDateTime(event?.schedule?.startDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiMapPin className="opacity-70" size={14} />
                          {event?.location?.venue || event?.location?.address || "Location unavailable"}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaHospital className="opacity-70" size={14} />
                          {event?.bloodBank?.name || "Blood bank unavailable"}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaUsers className="opacity-70" size={14} />
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
                      >
                        <FiEye size={16} />
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
                            <FiXCircle size={16} />
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
                            <FiCheckCircle size={16} />
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
          // Empty State with animation
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="p-12 text-center text-base-content/70"
          >
            <FiActivity className="mx-auto text-4xl mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">No Events Found</p>
            <p className="text-sm opacity-70">
              {activeTab === 'nearby'
                ? "No donation events found near your location. Try increasing the radius or check back later."
                : "No donation events match your current filters. Try adjusting your search criteria."}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Event Details Modal */}
      <dialog id="event_details_modal" className="modal">
        <EventDetailsModal
          onRegister={handleRegister}
          isRegistered={isRegistered}
          selectedEvent={selectedEvent}
          actionLoadingId={actionLoadingId}
          onClose={CloseModal}
          onCancelRegistration={handleCancelRegistration}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default DonationEvents;

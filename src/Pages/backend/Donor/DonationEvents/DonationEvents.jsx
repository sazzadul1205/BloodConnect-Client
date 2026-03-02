// Pages/backend/Donor/DonationEvents/DonationEvents.jsx

// React
import React, { useCallback, useMemo, useState } from "react";

// TanStack Query
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

// Helper function to safely extract ID from MongoDB ObjectId
const getId = (value) => {
  if (!value) return "";

  // Handle MongoDB ObjectId with $oid
  if (typeof value === "object") {
    if (value?.$oid) return value.$oid;
    if (value?.toString) return value.toString();
  }

  // Handle string or number IDs
  return String(value || "");
};

// Format date and time for display with error handling
const formatDateTime = (value) => {
  if (!value) return "N/A";

  try {
    const date = new Date(value);

    // Check if date is valid
    if (isNaN(date.getTime())) return "Invalid Date";

    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Invalid Date";
  }
};

// Event type colors and icons
const eventTypeConfig = {
  drive: { icon: FaHeartbeat, color: "error", label: "Blood Drive" },
  emergency: { icon: FaTimesCircle, color: "warning", label: "Emergency" },
  regular: { icon: FaCalendarAlt, color: "info", label: "Regular" },
};

// Status colors
const statusColors = {
  upcoming: "info",
  ongoing: "success",
  completed: "success",
  cancelled: "error",
  postponed: "warning",
};

// Query keys for TanStack Query
const queryKeys = {
  events: (params) => ['donationEvents', params],
  eventDetails: (id) => ['donationEvent', id],
  nearbyEvents: (coords) => ['donationEvents', 'nearby', coords],
};

const DonationEvents = () => {
  const { axiosInstance } = useAxiosPublic();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("auth_token");

  // Get donor ID from user object
  const donorId = useMemo(
    () => String(user?.userId || user?._id || user?.id || user?.uid || ""),
    [user],
  );

  // States
  const [activeTab, setActiveTab] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
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

  // Helper function to show SweetAlert with theme support
  const showAlert = useCallback(async (options) => {
    const isDark = document.documentElement.classList.contains('dark');

    return Swal.fire({
      background: isDark ? '#1f2937' : '#ffffff',
      color: isDark ? '#ffffff' : '#1f2937',
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        confirmButton: "btn btn-sm btn-error text-white",
        cancelButton: "btn btn-sm",
        ...options.customClass,
      },
      buttonsStyling: false,
      ...options,
    });
  }, []);

  // Build query params based on active tab and filters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();

    if (activeTab === 'upcoming') {
      params.append('upcoming', 'true');
    }

    if (filters.eventType) {
      params.append('type', filters.eventType);
    }

    return params.toString();
  }, [activeTab, filters.eventType]);

  // Fetch events based on active tab
  const {
    data: events = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.events(queryParams),
    queryFn: async () => {
      const url = `/donation-events${queryParams ? `?${queryParams}` : ''}`;
      const res = await axiosInstance.get(url);
      return res.data?.data || [];
    },
    enabled: activeTab !== 'nearby' && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch nearby events
  const {
    data: nearbyEvents = [],
    isLoading: nearbyLoading,
    error: nearbyError,
    refetch: refetchNearby,
  } = useQuery({
    queryKey: queryKeys.nearbyEvents(coords),
    queryFn: async () => {
      if (!coords.latitude || !coords.longitude) {
        throw new Error("Location required");
      }

      const params = new URLSearchParams({
        latitude: String(coords.latitude),
        longitude: String(coords.longitude),
        radius: String(coords.radius || 50000),
      });

      if (filters.eventType) {
        params.append('type', filters.eventType);
      }

      const res = await axiosInstance.get(`/donation-events/nearby?${params.toString()}`);
      return res.data?.data || [];
    },
    enabled: activeTab === 'nearby' && coords.latitude && coords.longitude && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch event details for modal
  const {
    data: selectedEvent = null,
    isLoading: modalLoading,
    error: modalError,
    refetch: refetchModal,
  } = useQuery({
    queryKey: queryKeys.eventDetails(selectedEventId),
    queryFn: async () => {
      if (!selectedEventId) return null;

      const res = await axiosInstance.get(`/donation-events/${selectedEventId}`, {
        headers: authHeaders,
      });
      return res.data?.data || null;
    },
    enabled: !!selectedEventId, // Only run when we have a selected event ID
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Register for event mutation
  const registerMutation = useMutation({
    mutationFn: async (eventId) => {
      await axiosInstance.post(
        `/donation-events/${eventId}/register`,
        {},
        { headers: authHeaders }
      );
    },
    onSuccess: async () => {
      await showAlert({
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
      });

      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.events(queryParams) });
      if (coords.latitude && coords.longitude) {
        queryClient.invalidateQueries({ queryKey: queryKeys.nearbyEvents(coords) });
      }
      if (selectedEventId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.eventDetails(selectedEventId) });
      }
    },
    onError: async (err) => {
      await showAlert({
        title: "Registration Failed",
        text: err?.response?.data?.error || "Could not register for this event.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    },
  });

  // Cancel registration mutation
  const cancelRegistrationMutation = useMutation({
    mutationFn: async (eventId) => {
      await axiosInstance.delete(`/donation-events/${eventId}/register`, {
        headers: authHeaders,
      });
    },
    onSuccess: async () => {
      await showAlert({
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
      });

      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.events(queryParams) });
      if (coords.latitude && coords.longitude) {
        queryClient.invalidateQueries({ queryKey: queryKeys.nearbyEvents(coords) });
      }
      if (selectedEventId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.eventDetails(selectedEventId) });
      }
    },
    onError: async (err) => {
      await showAlert({
        title: "Cancel Failed",
        text: err?.response?.data?.error || "Could not cancel registration.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    },
  });

  // Handle tab change
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setFilters({ bloodType: "", eventType: "" });
  }, []);

  // Handle fetch nearby events
  const handleFetchNearby = useCallback(async () => {
    if (!coords.latitude || !coords.longitude) {
      await showAlert({
        title: "Location Required",
        text: "Please provide latitude and longitude to find nearby events.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    setActiveTab("nearby");
    await refetchNearby();
  }, [coords, refetchNearby, showAlert]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (activeTab === "nearby") {
      refetchNearby();
    } else {
      refetch();
    }
  }, [activeTab, refetch, refetchNearby]);

  // Handle view details
  const handleViewDetails = useCallback((eventId) => {
    setSelectedEventId(eventId);
    setTimeout(() => {
      document.getElementById("event_details_modal")?.showModal();
    }, 100);
  }, []);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setSelectedEventId(null);
    document.getElementById("event_details_modal")?.close();
  }, []);

  // Handle register
  const handleRegister = useCallback(async (eventId) => {
    setActionLoadingId(eventId);
    try {
      await registerMutation.mutateAsync(eventId);
    } finally {
      setActionLoadingId("");
    }
  }, [registerMutation]);

  // Handle cancel registration
  const handleCancelRegistration = useCallback(async (eventId) => {
    const result = await showAlert({
      title: "Cancel Registration?",
      text: "Are you sure you want to cancel your registration for this event?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, cancel",
      cancelButtonText: "No, keep",
    });

    if (!result.isConfirmed) return;

    setActionLoadingId(eventId);
    try {
      await cancelRegistrationMutation.mutateAsync(eventId);
    } finally {
      setActionLoadingId("");
    }
  }, [cancelRegistrationMutation, showAlert]);

  // Get user's current location
  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showAlert({
        title: "Not Supported",
        text: "Geolocation is not supported in this browser.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        Swal.close();

        setCoords((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));

        showAlert({
          title: "Location Updated",
          text: "Your location has been set. Click 'Nearby' to find events.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      },
      async () => {
        Swal.close();

        await showAlert({
          title: "Location Access Failed",
          text: "Unable to read your location. You can enter coordinates manually.",
          icon: "warning",
          confirmButtonColor: "#ef4444",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [showAlert]);

  // Check if donor is registered for an event
  const isRegistered = useCallback(
    (event) => {
      const currentDonorId = String(donorId || "");
      if (!currentDonorId) return false;

      const registrations = event?.registeredDonors || [];
      return registrations.some((registration) => {
        const regDonorId = getId(registration?.donorId || registration?.donor);
        return String(regDonorId) === currentDonorId;
      });
    },
    [donorId],
  );

  // Filter events based on blood type filter
  const filteredEvents = useMemo(() => {
    const currentEvents = activeTab === 'nearby' ? nearbyEvents : events;

    if (!Array.isArray(currentEvents)) return [];

    if (!filters.bloodType) return currentEvents;

    return currentEvents.filter(event => {
      const bloodTypes = event?.requirements?.bloodTypes || [];
      return bloodTypes.length === 0 || bloodTypes.includes(filters.bloodType);
    });
  }, [events, nearbyEvents, filters.bloodType, activeTab]);

  // Determine loading and error states
  const isLoadingData = activeTab === 'nearby' ? nearbyLoading : isLoading;
  const errorData = activeTab === 'nearby' ? nearbyError : error;

  // Loading state
  if (authLoading) return <BloodLoader />;

  // Error state
  if (errorData) return <ErrorState error={errorData} onRetry={handleRefresh} />;

  return (
    <div className="space-y-4 sm:space-y-6 min-h-screen bg-base-200 p-3 sm:p-4 md:p-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FiCalendar className="text-error" />
            Donation Events
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Browse events, view details, and manage your registrations.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className={`btn btn-xs sm:btn-sm ${activeTab === 'all' ? 'btn-error' : 'btn-outline'}`}
            onClick={() => handleTabChange('all')}
            disabled={isLoadingData}
          >
            All Events
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className={`btn btn-xs sm:btn-sm ${activeTab === 'upcoming' ? 'btn-error' : 'btn-outline'}`}
            onClick={() => handleTabChange('upcoming')}
            disabled={isLoadingData}
          >
            Upcoming
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className={`btn btn-xs sm:btn-sm ${activeTab === 'nearby' ? 'btn-error' : 'btn-outline'}`}
            onClick={handleFetchNearby}
            disabled={isLoadingData}
          >
            Nearby
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className="btn btn-xs sm:btn-sm btn-error gap-1 sm:gap-2"
            onClick={handleRefresh}
            disabled={isLoadingData}
          >
            <FiRefreshCw size={12} className={`${isLoadingData ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Nearby Search Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-base-100 border border-base-300 rounded-lg p-3 sm:p-4 space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <FiNavigation className="text-error" />
            Nearby Search
          </h2>
          <button
            type="button"
            className="btn btn-xs btn-ghost gap-1 self-start sm:self-auto"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <FiFilter size={12} />
            {filterOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Coordinates Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            className="input input-bordered input-xs sm:input-sm w-full"
            value={coords.latitude}
            onChange={(e) => setCoords((prev) => ({ ...prev, latitude: e.target.value }))}
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            className="input input-bordered input-xs sm:input-sm w-full"
            value={coords.longitude}
            onChange={(e) => setCoords((prev) => ({ ...prev, longitude: e.target.value }))}
          />
          <input
            type="number"
            min="1000"
            step="1000"
            placeholder="Radius (meters)"
            className="input input-bordered input-xs sm:input-sm w-full"
            value={coords.radius}
            onChange={(e) => setCoords((prev) => ({ ...prev, radius: parseInt(e.target.value) || 50000 }))}
          />
          <button
            type="button"
            className="btn btn-xs sm:btn-sm btn-outline gap-1 sm:gap-2 w-full sm:w-auto"
            onClick={useMyLocation}
          >
            <FiNavigation size={12} />
            Use My Location
          </button>
        </div>

        {/* Additional Filters */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="pt-3 border-t border-base-300"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <select
                  className="select select-bordered select-xs sm:select-sm w-full"
                  value={filters.eventType}
                  onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
                >
                  <option value="">All Event Types</option>
                  {Object.entries(eventTypeConfig).map(([value, config]) => (
                    <option key={value} value={value}>{config.label}</option>
                  ))}
                </select>
                <select
                  className="select select-bordered select-xs sm:select-sm w-full"
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

      {/* Events List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="bg-base-100 border border-base-300 rounded-lg overflow-hidden"
      >
        <div className="p-3 sm:p-4 border-b border-base-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-sm sm:text-base font-semibold capitalize flex items-center gap-2">
            {activeTab === 'all' ? 'All' : activeTab === 'upcoming' ? 'Upcoming' : 'Nearby'} Events
            <span className="badge badge-error badge-xs sm:badge-sm">{filteredEvents.length}</span>
          </span>
          {activeTab === 'nearby' && coords.latitude && coords.longitude && (
            <span className="text-xs opacity-70">
              Within {(coords.radius / 1000).toFixed(1)}km
            </span>
          )}
        </div>

        {isLoadingData ? (
          <div className="p-8 text-center">
            <span className="loading loading-spinner loading-md text-error"></span>
            <p className="text-sm mt-2 text-base-content/70">Loading events...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="divide-y divide-base-300">
            {filteredEvents.map((event, index) => {
              const eventId = getId(event?._id);
              const registered = isRegistered(event);
              const busy = actionLoadingId === eventId;
              const eventType = event?.type || 'regular';
              const TypeIcon = eventTypeConfig[eventType]?.icon || FiCalendar;
              const typeColor = eventTypeConfig[eventType]?.color || 'info';
              const status = event?.status?.current || 'upcoming';
              const spotsLeft = event?.spotsLeft ?? 0;
              const isFull = spotsLeft === 0;

              return (
                <motion.div
                  key={eventId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.02 }}
                  className="p-3 sm:p-4 hover:bg-base-200 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3 sm:gap-4">
                    {/* Event Details */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h3 className="font-semibold text-sm sm:text-base truncate max-w-50 sm:max-w-full">
                          {event?.title || "Event"}
                        </h3>
                        <span className={`badge badge-${typeColor} badge-xs sm:badge-sm capitalize`}>
                          {eventTypeConfig[eventType]?.label || eventType}
                        </span>
                        <span className={`badge badge-${statusColors[status]} badge-xs sm:badge-sm capitalize`}>
                          {status}
                        </span>
                        {isFull && (
                          <span className="badge badge-error badge-xs sm:badge-sm">Full</span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-base-content/70 line-clamp-2">
                        {event?.description || "No description provided."}
                      </p>

                      {/* Event Meta Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs sm:text-sm">
                        <span className="flex items-center gap-1 truncate">
                          <FiClock className="opacity-70 shrink-0" size={12} />
                          <span className="truncate">{formatDateTime(event?.schedule?.startDate)}</span>
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <FiMapPin className="opacity-70 shrink-0" size={12} />
                          <span className="truncate">{event?.location?.venue || event?.location?.address || "Location unavailable"}</span>
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <FaHospital className="opacity-70 shrink-0" size={12} />
                          <span className="truncate">{event?.bloodBank?.name || "Blood bank unavailable"}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <FaUsers className="opacity-70 shrink-0" size={12} />
                          <span className={spotsLeft < 10 ? 'text-error font-semibold' : ''}>
                            {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 sm:gap-2 mt-2 lg:mt-0">
                      <button
                        type="button"
                        className="btn btn-xs sm:btn-sm btn-ghost gap-1"
                        onClick={() => handleViewDetails(eventId)}
                        disabled={modalLoading}
                      >
                        <FiEye size={12} />
                        <span className="hidden sm:inline">Details</span>
                      </button>

                      {registered ? (
                        <button
                          type="button"
                          className="btn btn-xs sm:btn-sm btn-warning gap-1"
                          onClick={() => handleCancelRegistration(eventId)}
                          disabled={busy || cancelRegistrationMutation.isPending}
                        >
                          {busy ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <FiXCircle size={12} />
                          )}
                          <span className="hidden sm:inline">{busy ? "Cancelling..." : "Cancel"}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`btn btn-xs sm:btn-sm gap-1 ${isFull ? 'btn-disabled' : 'btn-error'}`}
                          onClick={() => handleRegister(eventId)}
                          disabled={busy || isFull || registerMutation.isPending}
                        >
                          {busy ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <FiCheckCircle size={12} />
                          )}
                          <span className="hidden sm:inline">
                            {busy ? "Registering..." : isFull ? "Full" : "Register"}
                          </span>
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="p-8 sm:p-12 text-center text-base-content/70"
          >
            <FiActivity className="mx-auto text-3xl sm:text-4xl mb-3 opacity-50" />
            <p className="text-base sm:text-lg font-medium mb-1">No Events Found</p>
            <p className="text-xs sm:text-sm opacity-70">
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
          selectedEvent={selectedEvent}
          isLoading={modalLoading}
          error={modalError}
          onRegister={handleRegister}
          isRegistered={isRegistered}
          actionLoadingId={actionLoadingId}
          onClose={handleCloseModal}
          onCancelRegistration={handleCancelRegistration}
          onRetry={() => refetchModal()}
        />
        <form method="dialog" className="modal-backdrop">
          <button onClick={handleCloseModal}>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default DonationEvents;
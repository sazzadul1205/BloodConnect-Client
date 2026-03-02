// Pages/backend/BloodBank/EventsManagement/EventsManagement.jsx

// React
import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiRefreshCw,
  FiDownload,
  FiPlus,
  FiUserCheck,
  FiActivity,
} from "react-icons/fi";
import {
  FaCalendarAlt,
  FaHeartbeat,
  FaAmbulance,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import Pagination from "../../../../shared/Pagination";
import ErrorState from "../../../../shared/ErrorState";
import BloodLoader from "../../../../shared/BloodLoader";
import ResultsCount from "../../../../shared/ResultsCount";

// Modals
import AddEventModal from "./AddEventModal/AddEventModal";
import EditEventModal from "./EditEventModal/EditEventModal";
import ViewEventModal from "./ViewEventModal/ViewEventModal";
import CheckInModal from "./CheckInModal/CheckInModal";
import DonorListModal from "./DonorListModal/DonorListModal";
import { formatAppDate } from "../../../../utils/dateFormat";

// Utils
import { showExportOptions } from "./eventExport";

// ==================== HELPER FUNCTIONS ====================

/**
 * Extract ID from MongoDB ObjectId or other formats
 */
const getId = (value) => {
  if (!value) return null;
  if (typeof value === "object") {
    return value?.$oid || value?.toString?.() || JSON.stringify(value);
  }
  return String(value);
};

/**
 * Format date for display
 */
const formatDate = (value) => {
  return formatAppDate(value);
};

// ==================== CONSTANTS ====================

/**
 * Event type configuration for consistent display
 */
const eventTypeConfig = {
  camp: {
    icon: FaCalendarAlt,
    color: "success",
    badge: "badge-success",
    avatarBg: "bg-success/10",
    avatarText: "text-success",
    label: "Blood Camp",
    bgGradient: "from-success to-success/80",
  },
  drive: {
    icon: FaHeartbeat,
    color: "info",
    badge: "badge-info",
    avatarBg: "bg-info/10",
    avatarText: "text-info",
    label: "Blood Drive",
    bgGradient: "from-info to-info/80",
  },
  emergency: {
    icon: FaAmbulance,
    color: "error",
    badge: "badge-error",
    avatarBg: "bg-error/10",
    avatarText: "text-error",
    label: "Emergency",
    bgGradient: "from-error to-error/80",
  },
};

/**
 * Status configuration for event status
 */
const statusConfig = {
  upcoming: {
    icon: FiClock,
    color: "info",
    label: "Upcoming",
    badge: "badge-info",
  },
  ongoing: {
    icon: FiActivity,
    color: "success",
    label: "Ongoing",
    badge: "badge-success",
  },
  completed: {
    icon: FaCheckCircle,
    color: "success",
    label: "Completed",
    badge: "badge-success",
  },
  cancelled: {
    icon: FaTimesCircle,
    color: "error",
    label: "Cancelled",
    badge: "badge-error",
  },
};

// ==================== QUERY KEYS ====================

const queryKeys = {
  myBloodBank: (userId) => ['my-blood-bank-events', userId],
  bankEvents: (bankId, filter) => ['bank-events', bankId, filter],
};

// ==================== ANIMATION VARIANTS ====================

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const tableRowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (custom) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.35 + custom * 0.02,
      duration: 0.3
    }
  })
};

// ==================== MAIN COMPONENT ====================

const EventsManagement = () => {
  const queryClient = useQueryClient();
  const { axiosInstance } = useAxiosPublic();
  const { user, loading: authLoading } = useAuth();
  const token = localStorage.getItem("auth_token");
  const isBloodBankUser = user?.role === "blood_bank";

  // ==================== MEMOIZED VALUES ====================

  const userId = useMemo(
    () => user?.userId || user?._id || user?.id || user?.uid,
    [user],
  );

  // ==================== STATE MANAGEMENT ====================

  // Pagination and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Auth headers for API requests
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token],
  );

  // ==================== TANSTACK QUERIES ====================

  /**
   * Query 1: Fetch my blood bank data
   */
  const {
    data: myBankData,
    isLoading: myBankLoading,
    isError: myBankError,
  } = useQuery({
    queryKey: queryKeys.myBloodBank(userId),
    enabled: !authLoading && isBloodBankUser && !!userId,
    queryFn: async () => {
      const res = await axiosInstance.get("/blood-banks/staff/me", {
        headers: authHeaders,
      });
      return res.data?.data || null;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Resolve blood bank ID from multiple sources
   */
  const bankId = useMemo(() => {
    const profileBankId =
      user?.bankId ||
      user?.bloodBankId ||
      user?.assignedBankId ||
      user?.profile?.bankId ||
      user?.profile?.bloodBankId;

    if (isBloodBankUser) {
      return myBankData?._id || profileBankId || null;
    }

    return profileBankId || userId || null;
  }, [isBloodBankUser, myBankData, user, userId]);

  /**
   * Query 2: Fetch all events for this blood bank
   */
  const {
    data: eventsData,
    isLoading: loadingEvents,
    isError: eventsError,
    error: eventsErrorData,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: queryKeys.bankEvents(bankId, activeTab),
    enabled: !authLoading && !!bankId && (!isBloodBankUser || !myBankLoading),
    queryFn: async () => {
      let url = `/donation-events?bloodBankId=${bankId}`;

      // Add filters based on active tab
      if (activeTab === "upcoming") {
        url += "&upcoming=true";
      } else if (activeTab === "ongoing") {
        url += "&status=ongoing";
      } else if (activeTab === "completed") {
        url += "&status=completed";
      } else if (activeTab === "cancelled") {
        url += "&status=cancelled";
      }

      const res = await axiosInstance.get(url, {
        headers: authHeaders,
      });
      return res.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // ==================== MUTATIONS ====================

  /**
   * Mutation 1: Delete/cancel event
   */
  const deleteMutation = useMutation({
    mutationFn: async (eventId) => {
      const response = await axiosInstance.delete(`/donation-events/${eventId}`, {
        headers: authHeaders,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bankEvents(bankId) });
    },
  });

  /**
   * Mutation 2: Update event status
   */
  const updateEventStatusMutation = useMutation({
    mutationFn: async ({ eventId, status, notes }) => {
      const response = await axiosInstance.patch(
        `/donation-events/${eventId}/status`,
        { status, notes },
        { headers: authHeaders },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bankEvents(bankId) });
    },
  });

  // ==================== COMPUTED VALUES ====================

  /**
   * Filter events locally based on search, type, and status
   */
  const filteredEvents = useMemo(() => {
    if (!eventsData?.data) return [];

    let filtered = eventsData.data;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.location?.venue?.toLowerCase().includes(term) ||
        event.location?.city?.toLowerCase().includes(term)
      );
    }

    // Filter by type
    if (selectedType) {
      filtered = filtered.filter(event => event.type === selectedType);
    }

    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter(event => event.status?.current === selectedStatus);
    }

    return filtered;
  }, [eventsData, searchTerm, selectedType, selectedStatus]);

  /**
   * Calculate event statistics
   */
  const eventStats = useMemo(() => {
    const events = eventsData?.data || [];
    return {
      total: events.length,
      upcoming: events.filter(e => e.status?.current === "upcoming").length,
      ongoing: events.filter(e => e.status?.current === "ongoing").length,
      completed: events.filter(e => e.status?.current === "completed").length,
      cancelled: events.filter(e => e.status?.current === "cancelled").length,
      emergency: events.filter(e => e.type === "emergency").length,
      totalRegistrations: events.reduce((sum, e) => sum + (e.registeredDonors?.length || 0), 0),
    };
  }, [eventsData]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  // ==================== EFFECTS ====================

  /**
   * Reset pagination when filters change
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedStatus, activeTab]);

  // ==================== HANDLER FUNCTIONS ====================

  /**
   * Handle delete/cancel event with confirmation
   */
  const handleDeleteEvent = async (eventId, eventTitle) => {
    try {
      const result = await Swal.fire({
        title: "Cancel Event?",
        html: `
          <div class="text-left">
            <p class="mb-3">You are about to cancel:</p>
            <p class="font-semibold text-error">${eventTitle}</p>
            <p class="mt-3 text-sm opacity-70">This will notify all registered donors and mark the event as cancelled.</p>
            <p class="text-sm font-semibold text-warning">This action cannot be undone!</p>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, cancel event",
        cancelButtonText: "No, keep it",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          title: "text-lg font-bold text-error",
          htmlContainer: "text-xs sm:text-sm text-base-content/80",
          confirmButton: "btn btn-sm btn-error text-white",
          cancelButton: "btn btn-sm",
        },
        buttonsStyling: false,
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            await deleteMutation.mutateAsync(eventId);
          } catch (error) {
            Swal.showValidationMessage(
              error.response?.data?.error || "Failed to cancel event"
            );
            throw error;
          }
        },
      });

      if (result.isConfirmed) {
        await Swal.fire({
          title: "Cancelled!",
          text: "Event has been cancelled successfully.",
          icon: "success",
          timer: 3000,
          showConfirmButton: true,
          confirmButtonColor: "#22c55e",
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
            title: "text-lg font-bold text-success",
            confirmButton: "btn btn-sm btn-success text-white",
          },
          buttonsStyling: false,
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  /**
   * Handle end event (mark as completed)
   */
  const handleEndEvent = async (eventId, eventTitle) => {
    try {
      const result = await Swal.fire({
        title: "End Event?",
        html: `
          <div class="text-left">
            <p class="mb-3">Mark this event as completed:</p>
            <p class="font-semibold text-success">${eventTitle}</p>
            <p class="mt-3 text-sm opacity-70">This will stop check-ins for this event.</p>
          </div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, end event",
        cancelButtonText: "Cancel",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-success text-white",
          cancelButton: "btn btn-sm",
        },
        buttonsStyling: false,
      });

      if (!result.isConfirmed) return;

      await updateEventStatusMutation.mutateAsync({
        eventId,
        status: "completed",
        notes: "Marked as completed from Events Management",
      });

      await Swal.fire({
        title: "Event Completed",
        text: "The event has been marked as completed.",
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
    } catch (error) {
      await Swal.fire({
        title: "Failed",
        text: error?.response?.data?.error || "Failed to end event.",
        icon: "error",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    }
  };

  /**
   * Handle manual status change
   */
  const handleManualStatusChange = async (event, nextStatus) => {
    if (!nextStatus || nextStatus === event.status?.current) return;

    try {
      const result = await Swal.fire({
        title: "Change Event Status?",
        html: `
          <div class="text-left">
            <p><span class="font-semibold">${event.title}</span></p>
            <p class="mt-2 text-sm">Change status from <b>${event.status?.current || "unknown"}</b> to <b>${nextStatus}</b>?</p>
          </div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, update",
        cancelButtonText: "Cancel",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-success text-white",
          cancelButton: "btn btn-sm",
        },
        buttonsStyling: false,
      });

      if (!result.isConfirmed) return;

      await updateEventStatusMutation.mutateAsync({
        eventId: getId(event._id),
        status: nextStatus,
        notes: `Status updated manually from Events Management`,
      });

      await Swal.fire({
        title: "Status Updated",
        text: `Event status is now ${nextStatus}.`,
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
        },
        buttonsStyling: false,
      });
    } catch (error) {
      await Swal.fire({
        title: "Failed",
        text: error?.response?.data?.error || "Failed to update status.",
        icon: "error",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    }
  };

  /**
   * Handle page change with smooth scroll
   */
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Handle export with options
   */
  const handleExport = () => {
    showExportOptions(filteredEvents, activeTab, setIsExporting);
  };

  /**
   * Close all modals
   */
  const CloseModal = () => {
    setSelectedEventId(null);
    document.getElementById('add_event_modal')?.close();
    document.getElementById('edit_event_modal')?.close();
    document.getElementById('view_event_modal')?.close();
    document.getElementById('checkin_modal')?.close();
    document.getElementById('donor_list_modal')?.close();
  };

  // ==================== LOADING & ERROR STATES ====================

  if (loadingEvents || authLoading || myBankLoading) return <BloodLoader />;

  // No profile state
  if (!bankId || (isBloodBankUser && myBankError)) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-4 sm:space-y-6 min-h-screen bg-base-200 p-3 sm:p-4 md:p-6"
      >
        <motion.div variants={fadeInUp}>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FiCalendar className="text-error" />
            Events Management
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Create and manage blood donation events, track registrations.
          </p>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="alert bg-base-100 border border-error/20 shadow-sm items-start p-3 sm:p-4"
        >
          <FaTimesCircle className="text-error mt-0.5 text-lg sm:text-xl shrink-0" />
          <div>
            <h3 className="font-semibold text-error text-sm sm:text-base">Blood Bank Profile Not Found</h3>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1">
              No blood bank profile data is available for this account. Please contact an admin to create or link your blood bank profile.
            </p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Error state
  if (eventsError) {
    return (
      <ErrorState
        error={eventsErrorData}
        onRetry={() => refetchEvents()}
      />
    );
  }

  // ==================== RENDER ====================

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-4 sm:space-y-6 min-h-screen bg-base-200 p-3 sm:p-4 md:p-6"
    >

      {/* ==================== HEADER SECTION ==================== */}
      <motion.div
        variants={fadeInUp}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        {/* Title and description */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FiCalendar className="text-error" />
            Events Management
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Create and manage blood donation events, track registrations
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Export Button */}
          <button
            onClick={handleExport}
            className="btn btn-outline btn-xs sm:btn-sm gap-1 sm:gap-2"
            disabled={isExporting || filteredEvents.length === 0}
          >
            {isExporting ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span className="text-xs sm:text-sm">Exporting...</span>
              </>
            ) : (
              <>
                <FiDownload size={12} className="sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Export ({filteredEvents.length})</span>
              </>
            )}
          </button>

          {/* Create Event Button */}
          <button
            onClick={() => document.getElementById('add_event_modal')?.showModal()}
            className="btn btn-error btn-xs sm:btn-sm gap-1 sm:gap-2"
          >
            <FiPlus size={12} className="sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Create Event</span>
          </button>
        </div>
      </motion.div>

      {/* ==================== STATS CARDS ==================== */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4"
      >
        {/* Total Events Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Total Events</p>
              <p className="stat-value text-sm sm:text-base md:text-lg font-bold text-error">{eventStats.total}</p>
            </div>
            <div className="stat-figure bg-error/10 p-2 rounded-full">
              <FiCalendar className="text-error text-sm sm:text-base" />
            </div>
          </div>
        </motion.div>

        {/* Upcoming Events Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Upcoming</p>
              <p className="stat-value text-sm sm:text-base md:text-lg font-bold text-info">{eventStats.upcoming}</p>
            </div>
            <div className="stat-figure bg-info/10 p-2 rounded-full">
              <FiClock className="text-info text-sm sm:text-base" />
            </div>
          </div>
        </motion.div>

        {/* Ongoing Events Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Ongoing</p>
              <p className="stat-value text-sm sm:text-base md:text-lg font-bold text-success">{eventStats.ongoing}</p>
            </div>
            <div className="stat-figure bg-success/10 p-2 rounded-full">
              <FiActivity className="text-success text-sm sm:text-base" />
            </div>
          </div>
        </motion.div>

        {/* Completed Events Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Completed</p>
              <p className="stat-value text-sm sm:text-base md:text-lg font-bold text-success">{eventStats.completed}</p>
            </div>
            <div className="stat-figure bg-success/10 p-2 rounded-full">
              <FaCheckCircle className="text-success text-sm sm:text-base" />
            </div>
          </div>
        </motion.div>

        {/* Emergency Events Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Emergency</p>
              <p className="stat-value text-sm sm:text-base md:text-lg font-bold text-error">{eventStats.emergency}</p>
            </div>
            <div className="stat-figure bg-error/10 p-2 rounded-full">
              <FaAmbulance className="text-error text-sm sm:text-base" />
            </div>
          </div>
        </motion.div>

        {/* Total Registrations Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Registrations</p>
              <p className="stat-value text-sm sm:text-base md:text-lg font-bold text-warning">{eventStats.totalRegistrations}</p>
            </div>
            <div className="stat-figure bg-warning/10 p-2 rounded-full">
              <FiUsers className="text-warning text-sm sm:text-base" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ==================== TABS ==================== */}
      <motion.div
        variants={fadeInUp}
        className="tabs tabs-boxed bg-base-100 p-1 border border-base-300 overflow-x-auto flex-nowrap"
      >
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "all" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Events
        </button>
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "upcoming" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming
        </button>
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "ongoing" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("ongoing")}
        >
          Ongoing
        </button>
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "completed" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          Completed
        </button>
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "cancelled" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("cancelled")}
        >
          Cancelled
        </button>
      </motion.div>

      {/* ==================== FILTERS ==================== */}
      <motion.div
        variants={fadeInUp}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-3 sm:p-4"
      >
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">

          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by title, venue, city..."
              className="input input-bordered input-sm sm:input-md w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <div className="w-full lg:w-48">
            <select
              className="select select-bordered select-sm sm:select-md w-full"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="camp">Blood Camp</option>
              <option value="drive">Blood Drive</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <select
              className="select select-bordered select-sm sm:select-md w-full"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          <button
            className="btn btn-outline btn-sm btn-square"
            onClick={() => {
              setSearchTerm("");
              setSelectedType("");
              setSelectedStatus("");
              setActiveTab("all");
            }}
          >
            <FiRefreshCw size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </motion.div>

      {/* ==================== RESULTS COUNT ==================== */}
      <motion.div variants={fadeInUp}>
        <ResultsCount
          endIndex={endIndex}
          startIndex={startIndex}
          itemsPerPage={itemsPerPage}
          filteredUsers={filteredEvents}
          setCurrentPage={setCurrentPage}
          setItemsPerPage={setItemsPerPage}
        />
      </motion.div>

      {/* ==================== EVENTS SECTION ==================== */}
      <motion.div variants={fadeInUp} className="space-y-4">
        {/* ==================== MOBILE CARD VIEW ==================== */}
        <div className="block lg:hidden space-y-4">
          {paginatedEvents.length > 0 ? (
            paginatedEvents.map((event, index) => {
              const eventId = getId(event._id);
              const typeInfo = eventTypeConfig[event.type] || eventTypeConfig.camp;
              const TypeIcon = typeInfo.icon;
              const statusInfo = statusConfig[event.status?.current] || statusConfig.upcoming;
              const StatusIcon = statusInfo.icon;
              const spotsLeft = event.spotsLeft || 0;
              const isFull = event.registrationStatus === "full" || spotsLeft === 0;

              return (
                <motion.div
                  key={eventId}
                  variants={tableRowVariants}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  className="card bg-base-100 shadow-md border border-base-300"
                >
                  <div className="card-body p-4 space-y-3">

                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-sm">{event.title}</h3>
                        <p className="text-xs text-base-content/60 line-clamp-2">
                          {event.description}
                        </p>
                      </div>

                      <div className={`badge ${typeInfo.badge} badge-xs gap-1`}>
                        <TypeIcon size={10} />
                        {typeInfo.label}
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-base-content/70">
                      <FiCalendar size={12} />
                      {formatDate(event.schedule?.startDate)}
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-xs text-base-content/70">
                      <FiMapPin size={12} />
                      {event.location?.venue || "N/A"}
                    </div>

                    {/* Capacity */}
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1">
                        <FiUsers size={12} />
                        {event.capacity?.currentRegistrations || 0}/
                        {event.capacity?.maxDonors || 0}
                      </div>

                      {isFull ? (
                        <span className="badge badge-error badge-xs">Full</span>
                      ) : (
                        <span className="badge badge-success badge-xs">
                          {spotsLeft} spots left
                        </span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex justify-between items-center">
                      <div className={`badge ${statusInfo.badge} badge-xs gap-1`}>
                        <StatusIcon size={10} />
                        {statusInfo.label}
                      </div>

                      <select
                        className="select select-bordered select-xs"
                        value={event.status?.current || "upcoming"}
                        onChange={(e) =>
                          handleManualStatusChange(event, e.target.value)
                        }
                        disabled={updateEventStatusMutation.isPending}
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-base-300">

                      <button
                        onClick={() => {
                          setSelectedEventId(eventId);
                          document.getElementById("view_event_modal")?.showModal();
                        }}
                        className="btn btn-ghost btn-xs gap-1"
                      >
                        <FiEye size={12} />
                        View
                      </button>

                      {event.status?.current === "ongoing" && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedEventId(eventId);
                              document.getElementById("checkin_modal")?.showModal();
                            }}
                            className="btn btn-ghost btn-xs text-success gap-1"
                          >
                            <FiUserCheck size={12} />
                            Check-in
                          </button>

                          <button
                            onClick={() =>
                              handleEndEvent(eventId, event.title)
                            }
                            className="btn btn-ghost btn-xs text-success gap-1"
                          >
                            <FaCheckCircle size={12} />
                            End
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setSelectedEventId(eventId);
                          document.getElementById("edit_event_modal")?.showModal();
                        }}
                        className="btn btn-ghost btn-xs gap-1"
                      >
                        <FiEdit2 size={12} />
                        Edit
                      </button>

                      {(event.status?.current === "upcoming" ||
                        event.status?.current === "ongoing") && (
                          <button
                            onClick={() =>
                              handleDeleteEvent(eventId, event.title)
                            }
                            className="btn btn-ghost btn-xs text-error gap-1"
                          >
                            <FiTrash2 size={12} />
                            Cancel
                          </button>
                        )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-10">
              <FiCalendar size={40} className="mx-auto text-base-content/30" />
              <p className="text-sm text-base-content/60 mt-2">
                No events found
              </p>
            </div>
          )}
        </div>

        {/* ==================== DESKTOP TABLE VIEW ==================== */}
        <div className="hidden lg:block overflow-x-auto bg-base-100 rounded-lg shadow-lg border border-base-300">
          <table className="table table-md w-full">
            <thead>
              <tr className="bg-base-200">
                <th className="text-xs sm:text-sm w-12">#</th>
                <th className="text-xs sm:text-sm">Event</th>
                <th className="text-xs sm:text-sm">Type</th>
                <th className="text-xs sm:text-sm hidden md:table-cell">Date & Time</th>
                <th className="text-xs sm:text-sm hidden lg:table-cell">Location</th>
                <th className="text-xs sm:text-sm">Capacity</th>
                <th className="text-xs sm:text-sm">Status</th>
                <th className="text-xs sm:text-sm">Registrations</th>
                <th className="text-xs sm:text-sm text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedEvents.length > 0 ? (
                paginatedEvents.map((event, index) => {
                  const eventId = getId(event._id);
                  const typeInfo = eventTypeConfig[event.type] || eventTypeConfig.camp;
                  const TypeIcon = typeInfo.icon;
                  const statusInfo = statusConfig[event.status?.current] || statusConfig.upcoming;
                  const StatusIcon = statusInfo.icon;
                  const spotsLeft = event.spotsLeft || 0;
                  const isFull = event.registrationStatus === 'full' || spotsLeft === 0;

                  return (
                    <motion.tr
                      key={eventId}
                      variants={tableRowVariants}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      className="hover"
                    >
                      <td className="text-xs sm:text-sm font-medium">{startIndex + index + 1}</td>

                      {/* Event Details */}
                      <td>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="avatar hidden xs:block">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${typeInfo.avatarBg} flex items-center justify-center`}>
                              <TypeIcon className={typeInfo.avatarText} size={12} />
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-xs sm:text-sm">{event.title}</div>
                            <div className="text-[10px] sm:text-xs text-base-content/70 line-clamp-1 max-w-32 sm:max-w-40">
                              {event.description?.slice(0, 40)}
                              {event.description?.length > 40 ? '...' : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td>
                        <div className={`badge ${typeInfo.badge} badge-xs sm:badge-sm gap-1`}>
                          <TypeIcon size={8} className="sm:w-3 sm:h-3" />
                          <span className="text-[10px] sm:text-xs">{typeInfo.label}</span>
                        </div>
                      </td>

                      {/* Date & Time - Hidden on mobile */}
                      <td className="hidden md:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                            <FiCalendar size={8} className="sm:w-3 sm:h-3 text-base-content/50" />
                            <span>{formatDate(event.schedule?.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[8px] sm:text-[10px]">
                            <FiClock size={6} className="sm:w-2 sm:h-2 text-base-content/50" />
                            <span>
                              {event.schedule?.startTime} - {event.schedule?.endTime}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Location - Hidden on tablet */}
                      <td className="hidden lg:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                            <FiMapPin size={8} className="sm:w-3 sm:h-3 text-base-content/50" />
                            <span className="truncate max-w-24">{event.location?.venue || 'N/A'}</span>
                          </div>
                          <div className="text-[8px] sm:text-[10px] text-base-content/70">
                            {event.location?.city || ''}
                          </div>
                        </div>
                      </td>

                      {/* Capacity */}
                      <td>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                            <FiUsers size={8} className="sm:w-3 sm:h-3 text-base-content/50" />
                            <span>{event.capacity?.currentRegistrations || 0}/{event.capacity?.maxDonors || 0}</span>
                          </div>
                          {isFull ? (
                            <div className="badge badge-error badge-xs">Full</div>
                          ) : (
                            <div className="badge badge-success badge-xs">{spotsLeft} spots</div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <div className="space-y-2">
                          <div className={`badge ${statusInfo.badge} badge-xs sm:badge-sm gap-1`}>
                            <StatusIcon size={8} className="sm:w-3 sm:h-3" />
                            <span className="text-[10px] sm:text-xs">{statusInfo.label}</span>
                          </div>
                          <select
                            className="select select-bordered select-xs w-full min-w-24 sm:min-w-28"
                            value={event.status?.current || "upcoming"}
                            onChange={(e) => handleManualStatusChange(event, e.target.value)}
                            disabled={updateEventStatusMutation.isPending}
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>

                      {/* Registrations */}
                      <td>
                        <button
                          onClick={() => {
                            setSelectedEventId(eventId);
                            document.getElementById('donor_list_modal')?.showModal();
                          }}
                          className="btn btn-ghost btn-xs sm:btn-sm gap-1"
                        >
                          <FiUsers size={10} className="sm:w-4 sm:h-4" />
                          <span className="text-[10px] sm:text-xs">{event.registeredDonors?.length || 0}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex justify-center gap-1">
                          {/* View Button */}
                          <button
                            onClick={() => {
                              setSelectedEventId(eventId);
                              document.getElementById('view_event_modal')?.showModal();
                            }}
                            className="btn btn-ghost btn-xs sm:btn-sm btn-square tooltip"
                            data-tip="View Details"
                          >
                            <FiEye size={12} className="sm:w-4 sm:h-4" />
                          </button>

                          {/* Check-in Button (only for ongoing events) */}
                          {event.status?.current === 'ongoing' && (
                            <button
                              onClick={() => {
                                setSelectedEventId(eventId);
                                document.getElementById('checkin_modal')?.showModal();
                              }}
                              className="btn btn-ghost btn-xs sm:btn-sm btn-square tooltip text-success"
                              data-tip="Check-in Donors"
                            >
                              <FiUserCheck size={12} className="sm:w-4 sm:h-4" />
                            </button>
                          )}

                          {/* End Event Button (only for ongoing) */}
                          {event.status?.current === 'ongoing' && (
                            <button
                              onClick={() => handleEndEvent(eventId, event.title)}
                              className="btn btn-ghost btn-xs sm:btn-sm btn-square tooltip text-success"
                              data-tip="End Event"
                            >
                              <FaCheckCircle size={12} className="sm:w-4 sm:h-4" />
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            onClick={() => {
                              setSelectedEventId(eventId);
                              document.getElementById('edit_event_modal')?.showModal();
                            }}
                            className="btn btn-ghost btn-xs sm:btn-sm btn-square tooltip"
                            data-tip={
                              event.status?.current === "completed" || event.status?.current === "cancelled"
                                ? "View Edit Form (status will block save)"
                                : "Edit"
                            }
                          >
                            <FiEdit2 size={12} className="sm:w-4 sm:h-4" />
                          </button>

                          {/* Cancel/Delete Button (only for upcoming/ongoing) */}
                          {(event.status?.current === 'upcoming' || event.status?.current === 'ongoing') && (
                            <button
                              onClick={() => handleDeleteEvent(eventId, event.title)}
                              className="btn btn-ghost btn-xs sm:btn-sm btn-square text-error tooltip"
                              data-tip="Cancel Event"
                            >
                              <FiTrash2 size={12} className="sm:w-4 sm:h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <td colSpan={9} className="text-center py-8 sm:py-12">
                    <div className="flex flex-col items-center gap-2 px-4">
                      <FiCalendar size={32} className="sm:w-12 sm:h-12 text-base-content/30" />
                      <h3 className="text-sm sm:text-base font-semibold text-base-content/70">No events found</h3>
                      <p className="text-xs sm:text-sm text-base-content/50">
                        {searchTerm || selectedType || selectedStatus
                          ? "Try adjusting your filters"
                          : "Create your first donation event"}
                      </p>
                    </div>
                  </td>
                </motion.tr>
              )}
            </tbody>

          </table>
        </div>
      </motion.div>

      {/* ==================== PAGINATION ==================== */}
      {filteredEvents.length > 0 && (
        <motion.div variants={fadeInUp}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </motion.div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* Add Event Modal */}
      <dialog id="add_event_modal" className="modal">
        <AddEventModal
          bankId={bankId}
          onClose={CloseModal}
          refreshEvents={() => refetchEvents()}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop hidden md:block">
          <button>close</button>
        </form>
      </dialog>

      {/* Edit Event Modal */}
      <dialog id="edit_event_modal" className="modal">
        <EditEventModal
          eventId={selectedEventId}
          onClose={CloseModal}
          refreshEvents={() => refetchEvents()}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop hidden md:block">
          <button>close</button>
        </form>
      </dialog>

      {/* View Event Modal */}
      <dialog id="view_event_modal" className="modal">
        <ViewEventModal
          eventId={selectedEventId}
          onClose={CloseModal}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop hidden md:block">
          <button>close</button>
        </form>
      </dialog>

      {/* Check-in Modal */}
      <dialog id="checkin_modal" className="modal">
        <CheckInModal
          eventId={selectedEventId}
          onClose={CloseModal}
          refreshEvents={() => refetchEvents()}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop hidden md:block">
          <button>close</button>
        </form>
      </dialog>

      {/* Donor List Modal */}
      <dialog id="donor_list_modal" className="modal">
        <DonorListModal
          eventId={selectedEventId}
          onClose={CloseModal}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop hidden md:block">
          <button>close</button>
        </form>
      </dialog>
    </motion.div>
  );
};

export default EventsManagement;
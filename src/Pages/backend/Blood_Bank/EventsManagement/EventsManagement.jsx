// Pages/backend/BloodBank/EventsManagement/EventsManagement.jsx

// React
import React, { useState, useMemo } from "react";
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

// Utils
import { showExportOptions } from "./eventExport";

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
  } catch {
    return "N/A";
  }
};

// Event type configuration
const eventTypeConfig = {
  camp: {
    icon: FaCalendarAlt,
    color: "success",
    badge: "badge-success",
    avatarBg: "bg-success/10",
    avatarText: "text-success",
    label: "Blood Camp",
    bgColor: "from-success to-success/80",
  },
  drive: {
    icon: FaHeartbeat,
    color: "info",
    badge: "badge-info",
    avatarBg: "bg-info/10",
    avatarText: "text-info",
    label: "Blood Drive",
    bgColor: "from-info to-info/80",
  },
  emergency: {
    icon: FaAmbulance,
    color: "error",
    badge: "badge-error",
    avatarBg: "bg-error/10",
    avatarText: "text-error",
    label: "Emergency",
    bgColor: "from-error to-error/80",
  },
};

// Status configuration
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

const EventsManagement = () => {
  const queryClient = useQueryClient();
  const { axiosInstance } = useAxiosPublic();
  const { user, loading: authLoading } = useAuth();
  const token = localStorage.getItem("auth_token");
  const isBloodBankUser = user?.role === "blood_bank";

  const userId = useMemo(
    () => user?.userId || user?._id || user?.id || user?.uid,
    [user],
  );

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
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const {
    data: myBankData,
    isLoading: myBankLoading,
    isError: myBankError,
  } = useQuery({
    queryKey: ["my-blood-bank-events", userId, user?.role],
    enabled: !authLoading && isBloodBankUser && !!userId,
    queryFn: async () => {
      const res = await axiosInstance.get("/blood-banks/staff/me", {
        headers: authHeaders,
      });
      return res.data?.data || null;
    },
    retry: false,
  });

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

  // 🔹 Fetch All Events for this Blood Bank
  const {
    data: eventsData,
    isLoading: loadingEvents,
    isError: eventsError,
    error: eventsErrorData,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ["bank-events", bankId, activeTab],
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
  });

  // Delete event mutation
  const deleteMutation = useMutation({
    mutationFn: async (eventId) => {
      const response = await axiosInstance.delete(`/donation-events/${eventId}`, {
        headers: authHeaders,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-events"] });
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ["bank-events"] });
    },
  });

  // Filter events locally
  const getFilteredEvents = () => {
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
  };

  const filteredEvents = getFilteredEvents();

  // Pagination calculations
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  // Calculate statistics
  const eventStats = {
    total: eventsData?.data?.length || 0,
    upcoming: eventsData?.data?.filter(e => e.status?.current === "upcoming").length || 0,
    ongoing: eventsData?.data?.filter(e => e.status?.current === "ongoing").length || 0,
    completed: eventsData?.data?.filter(e => e.status?.current === "completed").length || 0,
    cancelled: eventsData?.data?.filter(e => e.status?.current === "cancelled").length || 0,
    emergency: eventsData?.data?.filter(e => e.type === "emergency").length || 0,
    totalRegistrations: eventsData?.data?.reduce((sum, e) => sum + (e.registeredDonors?.length || 0), 0) || 0,
  };

  // Handle delete event
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
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
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
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
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
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        },
      });
    } catch (error) {
      await Swal.fire({
        title: "Failed",
        text: error?.response?.data?.error || "Failed to end event.",
        icon: "error",
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    }
  };

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
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
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
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        },
      });
    } catch (error) {
      await Swal.fire({
        title: "Failed",
        text: error?.response?.data?.error || "Failed to update status.",
        icon: "error",
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle export
  const handleExport = () => {
    showExportOptions(filteredEvents, activeTab, setIsExporting);
  };

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedStatus, activeTab]);

  // Close modal helper
  const CloseModal = () => {
    setSelectedEventId(null);
    document.getElementById('add_event_modal')?.close();
    document.getElementById('edit_event_modal')?.close();
    document.getElementById('view_event_modal')?.close();
    document.getElementById('checkin_modal')?.close();
    document.getElementById('donor_list_modal')?.close();
  };

  // Loading state
  if (loadingEvents || authLoading || myBankLoading) return <BloodLoader />;

  if (!bankId || (isBloodBankUser && myBankError)) {
    return (
      <div className="space-y-6 min-h-screen bg-base-200 p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FiCalendar className="text-error" />
            Events Management
          </h2>
          <p className="text-sm text-base-content/70 mt-1">
            Create and manage blood donation events, track registrations.
          </p>
        </motion.div>

        <div className="alert bg-base-100 border border-error/20 shadow-sm items-start">
          <FaTimesCircle className="text-error mt-0.5" />
          <div>
            <h3 className="font-semibold text-error">Blood Bank Profile Not Found</h3>
            <p className="text-sm text-base-content/70 mt-1">
              No blood bank profile data is available for this account. Please contact an admin to create or link your blood bank profile.
            </p>
          </div>
        </div>
      </div>
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
            <FiCalendar className="text-error" />
            Events Management
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            Create and manage blood donation events, track registrations
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="btn btn-outline btn-sm gap-2"
            disabled={isExporting || filteredEvents.length === 0}
          >
            {isExporting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Exporting...
              </>
            ) : (
              <>
                <FiDownload size={16} />
                Export ({filteredEvents.length})
              </>
            )}
          </button>

          <button
            onClick={() => document.getElementById('add_event_modal')?.showModal()}
            className="btn btn-error btn-sm gap-2"
          >
            <FiPlus size={16} />
            Create Event
          </button>
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
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4"
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-error">
            <FiCalendar size={24} />
          </div>
          <p className="stat-title">Total Events</p>
          <p className="stat-value text-3xl">{eventStats.total}</p>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-info">
            <FiClock size={24} />
          </div>
          <p className="stat-title">Upcoming</p>
          <p className="stat-value text-3xl">{eventStats.upcoming}</p>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-success">
            <FiActivity size={24} />
          </div>
          <p className="stat-title">Ongoing</p>
          <p className="stat-value text-3xl">{eventStats.ongoing}</p>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-success">
            <FaCheckCircle size={24} />
          </div>
          <p className="stat-title">Completed</p>
          <p className="stat-value text-3xl">{eventStats.completed}</p>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-error">
            <FaAmbulance size={24} />
          </div>
          <p className="stat-title">Emergency</p>
          <p className="stat-value text-3xl">{eventStats.emergency}</p>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-warning">
            <FiUsers size={24} />
          </div>
          <p className="stat-title">Registrations</p>
          <p className="stat-value text-3xl">{eventStats.totalRegistrations}</p>
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="tabs tabs-boxed bg-base-100 p-1 border border-base-300 overflow-x-auto flex-nowrap"
      >
        <button
          className={`tab tab-sm ${activeTab === "all" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Events
        </button>
        <button
          className={`tab tab-sm ${activeTab === "upcoming" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming
        </button>
        <button
          className={`tab tab-sm ${activeTab === "ongoing" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("ongoing")}
        >
          Ongoing
        </button>
        <button
          className={`tab tab-sm ${activeTab === "completed" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          Completed
        </button>
        <button
          className={`tab tab-sm ${activeTab === "cancelled" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("cancelled")}
        >
          Cancelled
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by title, venue, city..."
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <div className="w-full lg:w-48">
            <select
              className="select select-bordered w-full"
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
              className="select select-bordered w-full"
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

          {/* Reset Filters */}
          <button
            className="btn btn-outline btn-square"
            onClick={() => {
              setSearchTerm("");
              setSelectedType("");
              setSelectedStatus("");
              setActiveTab("all");
            }}
          >
            <FiRefreshCw size={18} />
          </button>
        </div>
      </motion.div>

      {/* Results Count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <ResultsCount
          endIndex={endIndex}
          startIndex={startIndex}
          itemsPerPage={itemsPerPage}
          filteredUsers={filteredEvents}
          setCurrentPage={setCurrentPage}
          setItemsPerPage={setItemsPerPage}
        />
      </motion.div>

      {/* Events Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="overflow-x-auto bg-base-100 rounded-lg shadow-lg border border-base-300"
      >
        <table className="table table-zebra w-full">
          <thead>
            <tr className="bg-base-200">
              <th className="w-12">#</th>
              <th>Event</th>
              <th>Type</th>
              <th>Date & Time</th>
              <th>Location</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Registrations</th>
              <th className="text-center">Actions</th>
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
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.35 + index * 0.02 }}
                    className="hover"
                  >
                    <td className="font-medium">{startIndex + index + 1}</td>

                    {/* Event Details */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className={`w-10 h-10 rounded-full ${typeInfo.avatarBg} flex items-center justify-center`}>
                            <TypeIcon className={typeInfo.avatarText} size={20} />
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold">{event.title}</div>
                          <div className="text-xs text-base-content/70 line-clamp-1">
                            {event.description?.slice(0, 50)}
                            {event.description?.length > 50 ? '...' : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td>
                      <div className={`badge ${typeInfo.badge} gap-1`}>
                        <TypeIcon size={12} />
                        {typeInfo.label}
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <FiCalendar size={12} className="text-base-content/50" />
                          <span>{formatDate(event.schedule?.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <FiClock size={10} className="text-base-content/50" />
                          <span>
                            {event.schedule?.startTime} - {event.schedule?.endTime}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <FiMapPin size={12} className="text-base-content/50" />
                          <span>{event.location?.venue || 'N/A'}</span>
                        </div>
                        <div className="text-xs text-base-content/70">
                          {event.location?.city || ''}
                        </div>
                      </div>
                    </td>

                    {/* Capacity */}
                    <td>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <FiUsers size={12} className="text-base-content/50" />
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
                        <div className={`badge ${statusInfo.badge} gap-1`}>
                          <StatusIcon size={12} />
                          {statusInfo.label}
                        </div>
                        <select
                          className="select select-bordered select-xs w-full min-w-28"
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
                        className="btn btn-ghost btn-xs gap-1"
                      >
                        <FiUsers size={14} />
                        {event.registeredDonors?.length || 0} donors
                      </button>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="flex justify-center gap-1">
                        {/* View */}
                        <button
                          onClick={() => {
                            setSelectedEventId(eventId);
                            document.getElementById('view_event_modal')?.showModal();
                          }}
                          className="btn btn-ghost btn-sm btn-square tooltip"
                          data-tip="View Details"
                        >
                          <FiEye size={16} />
                        </button>

                        {/* Check-in (only for ongoing events) */}
                        {event.status?.current === 'ongoing' && (
                          <button
                            onClick={() => {
                              setSelectedEventId(eventId);
                              document.getElementById('checkin_modal')?.showModal();
                            }}
                            className="btn btn-ghost btn-sm btn-square tooltip text-success"
                            data-tip="Check-in Donors"
                          >
                            <FiUserCheck size={16} />
                          </button>
                        )}

                        {/* End Event (only for ongoing) */}
                        {event.status?.current === 'ongoing' && (
                          <button
                            onClick={() => handleEndEvent(eventId, event.title)}
                            className="btn btn-ghost btn-sm btn-square tooltip text-success"
                            data-tip="End Event"
                          >
                            <FaCheckCircle size={16} />
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          onClick={() => {
                            setSelectedEventId(eventId);
                            document.getElementById('edit_event_modal')?.showModal();
                          }}
                          className="btn btn-ghost btn-sm btn-square tooltip"
                          data-tip={
                            event.status?.current === "completed" || event.status?.current === "cancelled"
                              ? "View Edit Form (status will block save)"
                              : "Edit"
                          }
                        >
                          <FiEdit2 size={16} />
                        </button>

                        {/* Cancel/Delete (only for upcoming/ongoing) */}
                        {(event.status?.current === 'upcoming' || event.status?.current === 'ongoing') && (
                          <button
                            onClick={() => handleDeleteEvent(eventId, event.title)}
                            className="btn btn-ghost btn-sm btn-square text-error tooltip"
                            data-tip="Cancel Event"
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
              <motion.tr
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <td colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <FiCalendar size={48} className="text-base-content/30" />
                    <h3 className="text-lg font-semibold text-base-content/70">No events found</h3>
                    <p className="text-sm text-base-content/50">
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
      </motion.div>

      {/* Pagination */}
      {filteredEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </motion.div>
      )}

      {/* Modals */}
      <dialog id="add_event_modal" className="modal">
        <AddEventModal
          bankId={bankId}
          onClose={CloseModal}
          refreshEvents={() => refetchEvents()}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <dialog id="edit_event_modal" className="modal">
        <EditEventModal
          eventId={selectedEventId}
          onClose={CloseModal}
          refreshEvents={() => refetchEvents()}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <dialog id="view_event_modal" className="modal">
        <ViewEventModal
          eventId={selectedEventId}
          onClose={CloseModal}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <dialog id="checkin_modal" className="modal">
        <CheckInModal
          eventId={selectedEventId}
          onClose={CloseModal}
          refreshEvents={() => refetchEvents()}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <dialog id="donor_list_modal" className="modal">
        <DonorListModal
          eventId={selectedEventId}
          onClose={CloseModal}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default EventsManagement;

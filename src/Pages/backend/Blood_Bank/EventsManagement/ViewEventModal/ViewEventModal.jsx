// Pages/backend/BloodBank/EventsManagement/ViewEventModal/ViewEventModal.jsx

// React
import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUsers,
  FaTint,
  FaTimes,
  FaCheckCircle,
  FaHeartbeat,
  FaAmbulance,
  FaUserCheck,
  FaUserPlus,
  FaUserClock,
  FaCheckDouble,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiDroplet,
  FiActivity,
  FiUser,
} from "react-icons/fi";

// Hooks
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";
import BloodLoader from "../../../../../shared/BloodLoader";
import { formatAppDate, formatAppDateTime } from "../../../../../utils/dateFormat";

// Format date
const formatDate = (value) => {
  return formatAppDate(value);
};

// Format datetime
const formatDateTime = (value) => {
  return formatAppDateTime(value);
};

// Event type config
const eventTypeConfig = {
  camp: {
    icon: FaCalendarAlt,
    color: "success",
    label: "Blood Camp",
    headerBg: "from-success to-success/80",
    badge: "badge-success",
  },
  drive: {
    icon: FaHeartbeat,
    color: "info",
    label: "Blood Drive",
    headerBg: "from-info to-info/80",
    badge: "badge-info",
  },
  emergency: {
    icon: FaAmbulance,
    color: "error",
    label: "Emergency",
    headerBg: "from-error to-error/80",
    badge: "badge-error",
  },
};

// Status config
const statusConfig = {
  upcoming: { icon: FiClock, color: "info", label: "Upcoming", badge: "badge-info" },
  ongoing: { icon: FiActivity, color: "success", label: "Ongoing", badge: "badge-success" },
  completed: { icon: FaCheckCircle, color: "success", label: "Completed", badge: "badge-success" },
  cancelled: { icon: FaExclamationTriangle, color: "error", label: "Cancelled", badge: "badge-error" },
};

const ViewEventModal = ({ eventId, onClose }) => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // States
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview, donors, requirements

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async ({ donorId }) => {
      const response = await axiosInstance.patch(
        `/donation-events/${eventId}/checkin/${donorId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
  });

  // Complete donation mutation
  const completeMutation = useMutation({
    mutationFn: async ({ donorId }) => {
      const response = await axiosInstance.patch(
        `/donation-events/${eventId}/complete/${donorId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
  });

  // Fetch event data
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) return;

      setLoading(true);
      try {
        const response = await axiosInstance.get(`/donation-events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data?.success) {
          setEventData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, axiosInstance, token]);

  // Handle check-in
  const handleCheckIn = async (donorId, donorName) => {
    try {
      const result = await Swal.fire({
        title: "Check-in Donor",
        text: `Check in ${donorName}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#22c55e",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, check in",
        cancelButtonText: "Cancel",
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-success text-white",
          cancelButton: "btn btn-sm",
        },
        buttonsStyling: false,
      });

      if (result.isConfirmed) {
        await checkInMutation.mutateAsync({ donorId });

        // Refresh data
        const response = await axiosInstance.get(`/donation-events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEventData(response.data.data);

        await Swal.fire({
          title: "Checked In!",
          text: `${donorName} has been checked in.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          },
        });
      }
    } catch (error) {
      console.error("Check-in error:", error);
      await Swal.fire({
        title: "Error",
        text: error.response?.data?.error || "Failed to check in donor",
        icon: "error",
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error",
        },
        buttonsStyling: false,
      });
    }
  };

  // Handle complete donation
  const handleComplete = async (donorId, donorName) => {
    try {
      const result = await Swal.fire({
        title: "Complete Donation",
        text: `Mark ${donorName}'s donation as complete?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#22c55e",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, complete",
        cancelButtonText: "Cancel",
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-success text-white",
          cancelButton: "btn btn-sm",
        },
        buttonsStyling: false,
      });

      if (result.isConfirmed) {
        await completeMutation.mutateAsync({ donorId });

        // Refresh data
        const response = await axiosInstance.get(`/donation-events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEventData(response.data.data);

        await Swal.fire({
          title: "Completed!",
          text: `${donorName}'s donation has been recorded.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          },
        });
      }
    } catch (error) {
      console.error("Complete error:", error);
      await Swal.fire({
        title: "Error",
        text: error.response?.data?.error || "Failed to complete donation",
        icon: "error",
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error",
        },
        buttonsStyling: false,
      });
    }
  };

  if (loading) return <BloodLoader fullscreen={false} />;
  if (!eventData) return null;

  const event = eventData;
  const typeInfo = eventTypeConfig[event.type] || eventTypeConfig.camp;
  const TypeIcon = typeInfo.icon;
  const statusInfo = statusConfig[event.status?.current] || statusConfig.upcoming;
  const StatusIcon = statusInfo.icon;

  // Donor counts by status
  const donorStats = {
    registered: event.registeredDonors?.filter(d => d.status === "registered").length || 0,
    checkedIn: event.registeredDonors?.filter(d => d.status === "checked_in").length || 0,
    donated: event.registeredDonors?.filter(d => d.status === "donated").length || 0,
    cancelled: event.registeredDonors?.filter(d => d.status === "cancelled").length || 0,
  };

  return (
    <div className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden bg-base-100">
      {/* Header */}
      <div className={`bg-linear-to-r ${typeInfo.headerBg} p-6 text-white`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-full">
              <TypeIcon size={32} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">{event.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className={`badge ${typeInfo.badge} gap-1`}>
                  <TypeIcon size={12} />
                  {typeInfo.label}
                </div>
                <div className={`badge ${statusInfo.badge} gap-1`}>
                  <StatusIcon size={12} />
                  {statusInfo.label}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20"
          >
            <FaTimes size={20} />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2 p-4 bg-base-200/50 border-b border-base-300">
        <div className="stat py-2">
          <div className="stat-figure text-info">
            <FiUsers />
          </div>
          <div className="stat-title text-xs">Capacity</div>
          <div className="stat-value text-sm">
            {event.capacity?.currentRegistrations || 0}/{event.capacity?.maxDonors || 0}
          </div>
        </div>
        <div className="stat py-2">
          <div className="stat-figure text-success">
            <FaUserCheck />
          </div>
          <div className="stat-title text-xs">Checked In</div>
          <div className="stat-value text-sm">{donorStats.checkedIn}</div>
        </div>
        <div className="stat py-2">
          <div className="stat-figure text-success">
            <FaCheckDouble />
          </div>
          <div className="stat-title text-xs">Donated</div>
          <div className="stat-value text-sm">{donorStats.donated}</div>
        </div>
        <div className="stat py-2">
          <div className="stat-figure text-warning">
            <FaUserClock />
          </div>
          <div className="stat-title text-xs">Registered</div>
          <div className="stat-value text-sm">{donorStats.registered}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-100 p-1 border-b border-base-300">
        <button
          className={`tab tab-sm ${activeTab === "overview" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab tab-sm ${activeTab === "donors" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("donors")}
        >
          Donors ({event.registeredDonors?.length || 0})
        </button>
        <button
          className={`tab tab-sm ${activeTab === "requirements" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("requirements")}
        >
          Requirements
        </button>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[50vh] overflow-y-auto">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Description */}
            {event.description && (
              <div className="bg-base-200 rounded-lg p-4">
                <p className="text-base-content/80">{event.description}</p>
              </div>
            )}

            {/* Schedule */}
            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <FiClock className="text-primary" />
                Schedule
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-70">Start</p>
                  <p className="font-medium">
                    {formatDate(event.schedule?.startDate)}
                    {event.schedule?.startTime && ` at ${event.schedule.startTime}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm opacity-70">End</p>
                  <p className="font-medium">
                    {formatDate(event.schedule?.endDate)}
                    {event.schedule?.endTime && ` at ${event.schedule.endTime}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <FiMapPin className="text-primary" />
                Location
              </h4>
              <div className="space-y-1">
                <p className="font-medium">{event.location?.venue}</p>
                <p className="text-base-content/70">{event.location?.address}</p>
                <p className="text-base-content/70">{event.location?.city}</p>
              </div>
            </div>

            {/* Organizer */}
            {event.organizer && (
              <div className="bg-base-200 rounded-lg p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <FiUser className="text-primary" />
                  Organized By
                </h4>
                <p className="font-medium">{event.organizer.name}</p>
                <p className="text-sm text-base-content/70">{event.organizer.email}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Donors Tab */}
        {activeTab === "donors" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {event.registeredDonors?.length > 0 ? (
              event.registeredDonors.map((donor, index) => (
                <div
                  key={index}
                  className="bg-base-200 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="avatar placeholder">
                      <div className="bg-primary/10 text-primary rounded-full w-10 h-10 flex items-center justify-center">
                        <FaUserPlus size={18} />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">{donor.donorName || "Anonymous Donor"}</p>
                      <p className="text-xs opacity-70">
                        Blood Group: {donor.donorBloodGroup || "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`badge badge-sm ${donor.status === "donated" ? "badge-success" :
                        donor.status === "checked_in" ? "badge-info" :
                          donor.status === "cancelled" ? "badge-error" :
                            "badge-warning"
                      }`}>
                      {donor.status}
                    </span>

                    {event.status?.current === "ongoing" && donor.status === "registered" && (
                      <button
                        onClick={() => handleCheckIn(donor.donorId, donor.donorName || "Donor")}
                        className="btn btn-xs btn-success"
                        disabled={checkInMutation.isPending}
                      >
                        Check In
                      </button>
                    )}

                    {event.status?.current === "ongoing" && donor.status === "checked_in" && (
                      <button
                        onClick={() => handleComplete(donor.donorId, donor.donorName || "Donor")}
                        className="btn btn-xs btn-success"
                        disabled={completeMutation.isPending}
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-base-content/70">
                <FiUsers size={48} className="mx-auto mb-3 opacity-50" />
                <p>No donors registered yet</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Requirements Tab */}
        {activeTab === "requirements" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <FaTint className="text-primary" />
                Accepted Blood Types
              </h4>
              <div className="flex flex-wrap gap-2">
                {event.requirements?.bloodTypes?.map((type) => (
                  <span key={type} className="badge badge-error badge-lg">
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <FiUser className="text-primary" />
                Donor Requirements
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm opacity-70">Minimum Age</p>
                  <p className="font-medium">{event.requirements?.minAge || 18} years</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Maximum Age</p>
                  <p className="font-medium">{event.requirements?.maxAge || 65} years</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Minimum Weight</p>
                  <p className="font-medium">{event.requirements?.minWeight || 50} kg</p>
                </div>
              </div>
            </div>

            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <FaCalendarAlt className="text-primary" />
                Event Timeline
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="opacity-70">Created:</span>
                  <span className="font-medium">{formatDateTime(event.createdAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-70">Last Updated:</span>
                  <span className="font-medium">{formatDateTime(event.updatedAt)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="modal-action border-t border-base-300 p-4 bg-base-200/50">
        <button onClick={onClose} className="btn btn-primary text-white ml-auto">
          Close
        </button>
      </div>
    </div>
  );
};

export default ViewEventModal;

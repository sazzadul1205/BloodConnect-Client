// Pages/backend/BloodBank/EventsManagement/CheckInModal/CheckInModal.jsx

// React
import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FaTimes,
  FaUserCheck,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSearch,
  FaUserPlus,
  FaCheckDouble,
} from "react-icons/fa";
import { FiUser, FiClock, FiDroplet } from "react-icons/fi";

// Hooks
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";
import BloodLoader from "../../../../../shared/BloodLoader";
import { formatAppTime } from "../../../../../utils/dateFormat";

const CheckInModal = ({ eventId, onClose, refreshEvents }) => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // States
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (donorId) => {
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
    mutationFn: async (donorId) => {
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

  // Filter donors by search
  const filteredDonors = eventData?.registeredDonors?.filter(donor => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (donor.donorName?.toLowerCase().includes(term)) ||
      (donor.donorBloodGroup?.toLowerCase().includes(term))
    );
  }) || [];

  // Handle check-in
  const handleCheckIn = async (donor) => {
    setActionLoading(true);
    try {
      await checkInMutation.mutateAsync(donor.donorId);

      // Refresh data
      const response = await axiosInstance.get(`/donation-events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEventData(response.data.data);
      refreshEvents?.();

      await Swal.fire({
        title: "Checked In!",
        text: `${donor.donorName || "Donor"} has been checked in.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        },
      });
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
    } finally {
      setActionLoading(false);
    }
  };

  // Handle complete donation
  const handleComplete = async (donor) => {
    setActionLoading(true);
    try {
      await completeMutation.mutateAsync(donor.donorId);

      // Refresh data
      const response = await axiosInstance.get(`/donation-events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEventData(response.data.data);
      refreshEvents?.();

      await Swal.fire({
        title: "Completed!",
        text: `${donor.donorName || "Donor"}'s donation has been recorded.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        },
      });
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
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <BloodLoader fullscreen={false} />;
  if (!eventData) return null;

  const canCheckIn = eventData.status?.current === "ongoing";

  return (
    <div className="modal-box w-11/12 max-w-2xl p-0 overflow-hidden bg-base-100">
      {/* Header */}
      <div className="bg-linear-to-r from-success to-success/80 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <FaUserCheck size={24} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">Check-in Donors</h3>
              <p className="text-white/80 text-sm">{eventData.title}</p>
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

      {!canCheckIn ? (
        <div className="p-6 text-center">
          <FaExclamationTriangle className="text-warning text-4xl mx-auto mb-3" />
          <p className="text-lg font-medium mb-2">Event is not ongoing</p>
          <p className="text-sm text-base-content/70 mb-4">
            Check-in is only available for ongoing events.
          </p>
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="p-4 border-b border-base-300">
            <div className="form-control">
              <div className="input-group">
                <span className="bg-base-200 border border-r-0 border-base-300 flex items-center px-3 rounded-l-lg">
                  <FaSearch className="text-base-content/50" />
                </span>
                <input
                  type="text"
                  placeholder="Search donors by name or blood type..."
                  className="input input-bordered w-full rounded-l-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Donor Stats */}
          <div className="grid grid-cols-3 gap-2 p-4 bg-base-200/50">
            <div className="text-center">
              <p className="text-xs opacity-70">Registered</p>
              <p className="text-xl font-bold text-warning">
                {eventData.registeredDonors?.filter(d => d.status === "registered").length || 0}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs opacity-70">Checked In</p>
              <p className="text-xl font-bold text-info">
                {eventData.registeredDonors?.filter(d => d.status === "checked_in").length || 0}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs opacity-70">Donated</p>
              <p className="text-xl font-bold text-success">
                {eventData.registeredDonors?.filter(d => d.status === "donated").length || 0}
              </p>
            </div>
          </div>

          {/* Donors List */}
          <div className="p-4 max-h-[40vh] overflow-y-auto">
            {filteredDonors.length > 0 ? (
              <div className="space-y-3">
                {filteredDonors.map((donor, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-base-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-primary/10 text-primary rounded-full w-10 h-10 flex items-center justify-center">
                            <FiUser size={18} />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{donor.donorName || "Anonymous Donor"}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="flex items-center gap-1">
                              <FiDroplet size={12} className="text-error" />
                              {donor.donorBloodGroup || "Unknown"}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiClock size={12} className="opacity-50" />
                              {formatAppTime(donor.registrationDate)}
                            </span>
                          </div>
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

                        {donor.status === "registered" && (
                          <button
                            onClick={() => handleCheckIn(donor)}
                            className="btn btn-xs btn-success"
                            disabled={actionLoading}
                          >
                            Check In
                          </button>
                        )}

                        {donor.status === "checked_in" && (
                          <button
                            onClick={() => handleComplete(donor)}
                            className="btn btn-xs btn-success"
                            disabled={actionLoading}
                          >
                            <FaCheckDouble size={12} className="mr-1" />
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-base-content/70">
                <FaUserPlus size={48} className="mx-auto mb-3 opacity-50" />
                <p>No donors found</p>
                {searchTerm && (
                  <p className="text-sm mt-2">Try adjusting your search</p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-action border-t border-base-300 p-4 bg-base-200/50">
            <button onClick={onClose} className="btn btn-ghost ml-auto">
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CheckInModal;

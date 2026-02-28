// Pages/backend/BloodBank/EventsManagement/DonorListModal/DonorListModal.jsx

// React
import React, { useState, useEffect } from "react";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FaTimes,
  FaUser,
  FaTint,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaUserCheck,
  FaUserClock,
  FaCheckDouble,
} from "react-icons/fa";
import { FiUsers, FiCalendar, FiDroplet } from "react-icons/fi";

// Hooks
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";
import BloodLoader from "../../../../../shared/BloodLoader";

// Format date
const formatDateTime = (value) => {
  if (!value) return "N/A";
  try {
    const date = new Date(value?.$date || value);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
};

const DonorListModal = ({ eventId, onClose }) => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // States
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [filter, setFilter] = useState("all"); // all, registered, checked_in, donated, cancelled

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

  // Filter donors
  const filteredDonors = eventData?.registeredDonors?.filter(donor => {
    if (filter === "all") return true;
    return donor.status === filter;
  }) || [];

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "registered":
        return <span className="badge badge-warning gap-1"><FaUserClock /> Registered</span>;
      case "checked_in":
        return <span className="badge badge-info gap-1"><FaUserCheck /> Checked In</span>;
      case "donated":
        return <span className="badge badge-success gap-1"><FaCheckDouble /> Donated</span>;
      case "cancelled":
        return <span className="badge badge-error gap-1"><FaTimesCircle /> Cancelled</span>;
      default:
        return <span className="badge badge-ghost">{status}</span>;
    }
  };

  // Get status counts
  const counts = {
    all: eventData?.registeredDonors?.length || 0,
    registered: eventData?.registeredDonors?.filter(d => d.status === "registered").length || 0,
    checked_in: eventData?.registeredDonors?.filter(d => d.status === "checked_in").length || 0,
    donated: eventData?.registeredDonors?.filter(d => d.status === "donated").length || 0,
    cancelled: eventData?.registeredDonors?.filter(d => d.status === "cancelled").length || 0,
  };

  if (loading) return <BloodLoader fullscreen={false} />;
  if (!eventData) return null;

  return (
    <div className="modal-box w-11/12 max-w-3xl p-0 overflow-hidden bg-base-100">
      {/* Header */}
      <div className="bg-linear-to-r from-primary to-primary/80 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <FiUsers size={24} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">Registered Donors</h3>
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 p-4 border-b border-base-300">
        <button
          className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setFilter("all")}
        >
          All ({counts.all})
        </button>
        <button
          className={`btn btn-sm ${filter === "registered" ? "btn-warning" : "btn-outline"}`}
          onClick={() => setFilter("registered")}
        >
          Registered ({counts.registered})
        </button>
        <button
          className={`btn btn-sm ${filter === "checked_in" ? "btn-info" : "btn-outline"}`}
          onClick={() => setFilter("checked_in")}
        >
          Checked In ({counts.checked_in})
        </button>
        <button
          className={`btn btn-sm ${filter === "donated" ? "btn-success" : "btn-outline"}`}
          onClick={() => setFilter("donated")}
        >
          Donated ({counts.donated})
        </button>
        <button
          className={`btn btn-sm ${filter === "cancelled" ? "btn-error" : "btn-outline"}`}
          onClick={() => setFilter("cancelled")}
        >
          Cancelled ({counts.cancelled})
        </button>
      </div>

      {/* Donors List */}
      <div className="p-4 max-h-[50vh] overflow-y-auto">
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
                      <div className="bg-primary/10 text-primary rounded-full w-12 h-12 flex items-center justify-center">
                        <FaUser size={20} />
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold">{donor.donorName || "Anonymous Donor"}</p>
                      <div className="flex items-center gap-3 text-sm mt-1">
                        <span className="flex items-center gap-1">
                          <FaTint className="text-error" size={12} />
                          {donor.donorBloodGroup || "Unknown"}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiCalendar className="opacity-50" size={12} />
                          {formatDateTime(donor.registrationDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {getStatusBadge(donor.status)}
                  </div>
                </div>

                {donor.checkInTime && (
                  <div className="mt-2 pt-2 border-t border-base-300 text-sm">
                    <span className="opacity-70">Checked in:</span> {formatDateTime(donor.checkInTime)}
                  </div>
                )}

                {donor.donationId && (
                  <div className="mt-1 text-sm">
                    <span className="opacity-70">Donation ID:</span> {donor.donationId.slice(-8)}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-base-content/70">
            <FiUsers size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">No donors found</p>
            <p className="text-sm">
              {filter !== "all"
                ? `No donors with status "${filter}"`
                : "No donors registered for this event yet"}
            </p>
          </div>
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

export default DonorListModal;
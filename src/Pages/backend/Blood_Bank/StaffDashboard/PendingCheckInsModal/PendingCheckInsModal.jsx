// Pages/backend/BloodBank/StaffDashboard/PendingCheckInsModal/PendingCheckInsModal.jsx

// React
import React, { useState } from "react";
import { useNavigate } from "react-router";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FaTimes,
  FaUser,
  FaClock,
  FaCheckCircle,
  FaSearch,
} from "react-icons/fa";
import { FiClock, FiCalendar, FiDroplet } from "react-icons/fi";

// Format time
const formatTime = (value) => {
  if (!value) return "N/A";
  try {
    const date = new Date(value?.$date || value);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
};

const getId = (value) => {
  if (!value) return null;
  if (typeof value === "object") {
    return value?.$oid || value?.toString?.() || JSON.stringify(value);
  }
  return String(value);
};

const PendingCheckInsModal = ({ pendingCheckIns, onClose }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter pending check-ins by search
  const filteredCheckIns = pendingCheckIns.filter(donor => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (donor.donorName?.toLowerCase().includes(term)) ||
      (donor.eventTitle?.toLowerCase().includes(term))
    );
  });

  return (
    <div className="modal-box w-11/12 max-w-3xl p-0 overflow-hidden bg-base-100">
      {/* Header */}
      <div className="bg-linear-to-r from-warning to-warning/80 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <FaClock size={24} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">Pending Check-ins</h3>
              <p className="text-white/80 text-sm">
                {pendingCheckIns.length} donor{pendingCheckIns.length !== 1 ? 's' : ''} waiting
              </p>
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

      {/* Search */}
      <div className="p-4 border-b border-base-300">
        <div className="form-control">
          <div className="input-group">
            <span className="bg-base-200 border border-r-0 border-base-300 flex items-center px-3 rounded-l-lg">
              <FaSearch className="text-base-content/50" />
            </span>
            <input
              type="text"
              placeholder="Search by donor name or event..."
              className="input input-bordered w-full rounded-l-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-2 p-4 bg-base-200/50">
        <div className="text-center">
          <p className="text-xs opacity-70">Total Pending</p>
          <p className="text-xl font-bold text-warning">{pendingCheckIns.length}</p>
        </div>
        <div className="text-center">
          <p className="text-xs opacity-70">Events Today</p>
          <p className="text-xl font-bold text-info">
            {new Set(pendingCheckIns.map(d => d.eventId)).size}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs opacity-70">Showing</p>
          <p className="text-xl font-bold text-success">{filteredCheckIns.length}</p>
        </div>
      </div>

      {/* Donors List */}
      <div className="p-4 max-h-[50vh] overflow-y-auto">
        {filteredCheckIns.length > 0 ? (
          <div className="space-y-3">
            {filteredCheckIns.map((donor, index) => (
              <motion.div
                key={`${getId(donor.eventId) || "event"}-${getId(donor.donorId) || donor.donorName || index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-base-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="avatar placeholder">
                      <div className="bg-warning/10 text-warning rounded-full w-12 h-12 flex items-center justify-center">
                        <FaUser size={20} />
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold">{donor.donorName || "Anonymous Donor"}</p>
                      <div className="flex items-center gap-3 text-sm mt-1">
                        <span className="flex items-center gap-1">
                          <FiCalendar className="opacity-50" size={12} />
                          {donor.eventTitle}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiClock className="opacity-50" size={12} />
                          Registered: {formatTime(donor.registrationDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const eventId = getId(donor.eventId);
                      navigate(`/blood_bank/events-management${eventId ? `?event=${eventId}` : ""}`);
                    }}
                    className="btn btn-sm btn-warning gap-2"
                  >
                    <FaCheckCircle />
                    Check In
                  </button>
                </div>

                {donor.donorBloodGroup && (
                  <div className="mt-2 pt-2 border-t border-base-300 text-sm">
                    <span className="flex items-center gap-1">
                      <FiDroplet className="text-error" size={12} />
                      Blood Type: <span className="font-semibold">{donor.donorBloodGroup}</span>
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-base-content/70">
            <FaClock size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">No pending check-ins</p>
            <p className="text-sm">
              {searchTerm ? "Try adjusting your search" : "All donors have been checked in"}
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

export default PendingCheckInsModal;

// Pages/backend/BloodBank/StaffDashboard/TodayEventsModal/TodayEventsModal.jsx

// React
import React, { useState } from "react";
import { useNavigate } from "react-router";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FaTimes,
  FaCalendarAlt,
  FaHeartbeat,
  FaAmbulance,
  FaSearch,
} from "react-icons/fa";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
} from "react-icons/fi";
import { formatAppTime } from "../../../../../utils/dateFormat";

// Helper function to extract ID
const getId = (value) => {
  if (!value) return null;
  if (typeof value === "object") {
    return value?.$oid || value?.toString?.() || JSON.stringify(value);
  }
  return String(value);
};

// Format time
const formatTime = (value) => {
  return formatAppTime(value);
};

// Event type config
const eventTypeConfig = {
  camp: {
    icon: FaCalendarAlt,
    color: "success",
    label: "Blood Camp",
    iconBgClass: "bg-success/10",
    iconTextClass: "text-success",
    badgeClass: "badge-success",
  },
  drive: {
    icon: FaHeartbeat,
    color: "info",
    label: "Blood Drive",
    iconBgClass: "bg-info/10",
    iconTextClass: "text-info",
    badgeClass: "badge-info",
  },
  emergency: {
    icon: FaAmbulance,
    color: "error",
    label: "Emergency",
    iconBgClass: "bg-error/10",
    iconTextClass: "text-error",
    badgeClass: "badge-error",
  },
};

const TodayEventsModal = ({ events = [], onClose }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");

  // Filter events
  const filteredEvents = events.filter(event => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        event.title?.toLowerCase().includes(term) ||
        event.location?.venue?.toLowerCase().includes(term) ||
        event.location?.city?.toLowerCase().includes(term);
      if (!matchesSearch) return false;
    }

    // Type filter
    if (selectedType && event.type !== selectedType) return false;

    return true;
  });

  // Calculate totals
  const totalRegistered = events.reduce((sum, e) => sum + (e.registeredDonors?.length || 0), 0);
  const totalCheckedIn = events.reduce((sum, e) =>
    sum + (e.registeredDonors?.filter(d => d.status === "checked_in" || d.status === "donated").length || 0), 0
  );
  const totalDonated = events.reduce((sum, e) =>
    sum + (e.registeredDonors?.filter(d => d.status === "donated").length || 0), 0
  );

  return (
    <div className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden bg-base-100">
      {/* Header */}
      <div className="bg-linear-to-r from-info to-info/80 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <FiCalendar size={24} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">Today's Events</h3>
              <p className="text-white/80 text-sm">
                {events.length} event{events.length !== 1 ? 's' : ''} scheduled
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

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-2 p-4 bg-base-200/50">
        <div className="text-center">
          <p className="text-xs opacity-70">Registered</p>
          <p className="text-xl font-bold text-warning">{totalRegistered}</p>
        </div>
        <div className="text-center">
          <p className="text-xs opacity-70">Checked In</p>
          <p className="text-xl font-bold text-info">{totalCheckedIn}</p>
        </div>
        <div className="text-center">
          <p className="text-xs opacity-70">Donated</p>
          <p className="text-xl font-bold text-success">{totalDonated}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="p-4 border-b border-base-300">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="form-control">
              <div className="input-group">
                <span className="bg-base-200 border border-r-0 border-base-300 flex items-center px-3 rounded-l-lg">
                  <FaSearch className="text-base-content/50" />
                </span>
                <input
                  type="text"
                  placeholder="Search events..."
                  className="input input-bordered w-full rounded-l-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="w-full md:w-48">
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
        </div>
      </div>

      {/* Events List */}
      <div className="p-4 max-h-[50vh] overflow-y-auto">
        {filteredEvents.length > 0 ? (
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const eventId = getId(event._id);
              const typeInfo = eventTypeConfig[event.type] || eventTypeConfig.camp;
              const TypeIcon = typeInfo.icon;
              const registered = event.registeredDonors?.length || 0;
              const checkedIn = event.registeredDonors?.filter(d => d.status === "checked_in" || d.status === "donated").length || 0;
              const pending = registered - checkedIn;

              return (
                <motion.div
                  key={eventId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-base-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`${typeInfo.iconBgClass} p-2 rounded-full`}>
                        <TypeIcon className={typeInfo.iconTextClass} size={16} />
                      </div>
                      <div>
                        <h4 className="font-semibold">{event.title}</h4>
                        <span className={`badge ${typeInfo.badgeClass} badge-sm mt-1`}>
                          {typeInfo.label}
                        </span>
                      </div>
                    </div>
                    <span className={`badge ${event.type === 'emergency' ? 'badge-error' : 'badge-info'
                      } badge-sm`}>
                      {event.status?.current || 'upcoming'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <FiClock className="opacity-50" size={12} />
                      <span>{event.schedule?.startTime} - {event.schedule?.endTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiMapPin className="opacity-50" size={12} />
                      <span>{event.location?.venue}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiMapPin className="opacity-50" size={12} />
                      <span>{event.location?.city}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-base-300 rounded p-2 text-center">
                      <p className="text-xs opacity-70">Registered</p>
                      <p className="font-bold text-warning">{registered}</p>
                    </div>
                    <div className="bg-base-300 rounded p-2 text-center">
                      <p className="text-xs opacity-70">Checked In</p>
                      <p className="font-bold text-info">{checkedIn}</p>
                    </div>
                    <div className="bg-base-300 rounded p-2 text-center">
                      <p className="text-xs opacity-70">Pending</p>
                      <p className="font-bold text-error">{pending}</p>
                    </div>
                  </div>

                  {pending > 0 && (
                    <div className="mt-3 pt-3 border-t border-base-300">
                      <p className="text-sm font-medium mb-2">Pending Check-ins:</p>
                      <div className="space-y-2">
                        {event.registeredDonors
                          ?.filter(d => d.status === "registered")
                          .slice(0, 3)
                          .map((donor, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span>{donor.donorName || "Anonymous"}</span>
                              <span className="text-xs opacity-70">
                                {formatTime(donor.registrationDate)}
                              </span>
                            </div>
                          ))}
                        {pending > 3 && (
                          <p className="text-xs opacity-70">
                            +{pending - 3} more donors
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => {
                        navigate(`/blood_bank/events-management?event=${eventId}`);
                      }}
                      className="btn btn-xs btn-outline"
                    >
                      View Details
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-base-content/70">
            <FiCalendar size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">No events found</p>
            <p className="text-sm">
              {searchTerm || selectedType ? "Try adjusting your filters" : "No events scheduled for today"}
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

export default TodayEventsModal;

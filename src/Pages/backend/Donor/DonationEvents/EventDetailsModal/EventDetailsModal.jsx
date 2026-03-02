// Pages/backend/Donor/DonationEvents/EventDetailsModal.jsx

// React
import React, { useMemo } from "react";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons - Fi (Feather Icons)
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUser,
  FiXCircle,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";

// Icons - Fa (Font Awesome)
import {
  FaHospital,
  FaUsers,
  FaTint,
  FaCheckCircle as FaCheckCircleSolid,
} from "react-icons/fa";

// Helper function to extract ID from MongoDB ObjectId
const getId = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    if (value?.$oid) return value.$oid;
    if (value?.toString) return value.toString();
  }

  return String(value || "");
};

// Format date and time for display
const formatDateTime = (value) => {
  if (!value) return "N/A";

  try {
    const date = new Date(value);
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

// Event type configuration
const eventTypeConfig = {
  drive: { icon: FaUsers, color: "success", label: "Blood Drive" },
  emergency: { icon: FaUsers, color: "error", label: "Emergency" },
  regular: { icon: FaUsers, color: "warning", label: "Regular" },
  camp: { icon: FaUsers, color: "info", label: "Blood Camp" },
};

const EventDetailsModal = ({
  selectedEvent,
  isLoading,
  error,
  onClose,
  onRegister,
  onCancelRegistration,
  isRegistered,
  actionLoadingId,
  onRetry,
}) => {
  // Memoize computed values
  const eventData = useMemo(() => {
    if (!selectedEvent) return null;

    return {
      id: getId(selectedEvent._id),
      registered: isRegistered ? isRegistered(selectedEvent) : false,
      isLoading: actionLoadingId === getId(selectedEvent._id),
      isFull: selectedEvent?.spotsLeft === 0,
      type: selectedEvent?.type || 'regular',
      typeConfig: eventTypeConfig[selectedEvent?.type] || eventTypeConfig.regular,
      requirements: selectedEvent?.requirements || {},
      capacity: selectedEvent?.capacity || {},
      location: selectedEvent?.location || {},
      bloodBank: selectedEvent?.bloodBank || {},
      schedule: selectedEvent?.schedule || {},
      registeredDonors: Array.isArray(selectedEvent?.registeredDonors) ? selectedEvent.registeredDonors : [],
      stats: selectedEvent?.stats || {},
    };
  }, [selectedEvent, isRegistered, actionLoadingId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="modal-box w-11/12 max-w-3xl p-8 bg-base-100 mx-2 sm:mx-0">
        <div className="flex flex-col items-center justify-center py-12">
          <span className="loading loading-spinner loading-lg text-error"></span>
          <p className="mt-4 text-base-content/70">Loading event details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !selectedEvent) {
    return (
      <div className="modal-box w-11/12 max-w-3xl p-8 bg-base-100 mx-2 sm:mx-0">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FiAlertCircle className="text-5xl text-error mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Event</h3>
          <p className="text-base-content/70 mb-4">
            {error?.message || "Could not load event details. Please try again."}
          </p>
          <button
            type="button"
            className="btn btn-error btn-sm gap-2"
            onClick={onRetry}
          >
            <FiRefreshCw size={14} />
            Retry
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm mt-2"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!eventData) return null;

  return (
    <div className="modal-box w-11/12 max-w-3xl p-0 overflow-hidden bg-base-100 mx-2 sm:mx-0">
      {/* Modal Header */}
      <div className="bg-linear-to-r from-error to-error/80 p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-white/20 p-2 sm:p-3 rounded-full shrink-0">
              <FiCalendar size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-lg sm:text-2xl truncate">{selectedEvent.title}</h2>
              <p className="text-white/80 text-xs sm:text-sm">
                {eventData.typeConfig.label}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-xs sm:btn-sm btn-circle text-white hover:bg-white/20 self-end sm:self-start"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Modal Content */}
      <div className="p-4 sm:p-6 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
        {/* Description */}
        <p className="text-sm sm:text-base text-base-content/70 mb-4">
          {selectedEvent.description || "No description provided."}
        </p>

        {/* Event Stats (if available) */}
        {eventData.stats && Object.keys(eventData.stats).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
            <div className="bg-base-200 rounded-lg p-2 text-center">
              <p className="text-xs opacity-70">Registered</p>
              <p className="font-semibold text-sm sm:text-base">{eventData.stats.totalRegistered || 0}</p>
            </div>
            <div className="bg-base-200 rounded-lg p-2 text-center">
              <p className="text-xs opacity-70">Checked In</p>
              <p className="font-semibold text-sm sm:text-base">{eventData.stats.checkedIn || 0}</p>
            </div>
            <div className="bg-base-200 rounded-lg p-2 text-center">
              <p className="text-xs opacity-70">Donated</p>
              <p className="font-semibold text-sm sm:text-base">{eventData.stats.donated || 0}</p>
            </div>
            <div className="bg-base-200 rounded-lg p-2 text-center">
              <p className="text-xs opacity-70">Cancelled</p>
              <p className="font-semibold text-sm sm:text-base">{eventData.stats.cancelled || 0}</p>
            </div>
          </div>
        )}

        {/* Event Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Date & Time Card */}
          <div className="bg-base-200 rounded-lg p-3 sm:p-4">
            <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-2 sm:mb-3">
              <FiClock className="text-error text-sm sm:text-base" />
              Date & Time
            </h3>
            <div className="space-y-2 text-xs sm:text-sm">
              <div>
                <p className="opacity-70">Start</p>
                <p className="font-medium wrap-break-word">{formatDateTime(eventData.schedule.startDate)}</p>
              </div>
              <div>
                <p className="opacity-70">End</p>
                <p className="font-medium wrap-break-word">{formatDateTime(eventData.schedule.endDate)}</p>
              </div>
              {eventData.schedule.startTime && eventData.schedule.endTime && (
                <div>
                  <p className="opacity-70">Hours</p>
                  <p className="font-medium">{eventData.schedule.startTime} - {eventData.schedule.endTime}</p>
                </div>
              )}
            </div>
          </div>

          {/* Location Card */}
          <div className="bg-base-200 rounded-lg p-3 sm:p-4">
            <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-2 sm:mb-3">
              <FiMapPin className="text-error text-sm sm:text-base" />
              Location
            </h3>
            <div className="space-y-2 text-xs sm:text-sm">
              <div>
                <p className="opacity-70">Venue</p>
                <p className="font-medium wrap-break-word">{eventData.location.venue || "N/A"}</p>
              </div>
              <div>
                <p className="opacity-70">Address</p>
                <p className="font-medium wrap-break-word">
                  {eventData.location.address || eventData.location.city || "N/A"}
                </p>
              </div>
              {eventData.location.city && (
                <div>
                  <p className="opacity-70">City</p>
                  <p className="font-medium">{eventData.location.city}</p>
                </div>
              )}
            </div>
          </div>

          {/* Capacity Card */}
          <div className="bg-base-200 rounded-lg p-3 sm:p-4">
            <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-2 sm:mb-3">
              <FaUsers className="text-error text-sm sm:text-base" />
              Capacity
            </h3>
            <div className="space-y-2 text-xs sm:text-sm">
              <div>
                <p className="opacity-70">Registered</p>
                <p className="font-medium">{eventData.capacity.currentRegistrations || 0}</p>
              </div>
              <div>
                <p className="opacity-70">Maximum Donors</p>
                <p className="font-medium">{eventData.capacity.maxDonors || 0}</p>
              </div>
              <div>
                <p className="opacity-70">Spots Left</p>
                <p className={`font-medium ${selectedEvent?.spotsLeft < 10 ? "text-error" : ""}`}>
                  {selectedEvent?.spotsLeft || 0}
                </p>
              </div>
              {eventData.capacity.walkIns !== undefined && (
                <div>
                  <p className="opacity-70">Walk-ins</p>
                  <p className="font-medium">{eventData.capacity.walkIns ? "Allowed" : "Not Allowed"}</p>
                </div>
              )}
            </div>
          </div>

          {/* Requirements Card */}
          <div className="bg-base-200 rounded-lg p-3 sm:p-4">
            <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-2 sm:mb-3">
              <FaTint className="text-error text-sm sm:text-base" />
              Requirements
            </h3>
            <div className="space-y-2 text-xs sm:text-sm">
              <div>
                <p className="opacity-70">Accepted Blood Types</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {eventData.requirements.bloodTypes?.length > 0 ? (
                    eventData.requirements.bloodTypes.map((type) => (
                      <span key={type} className="badge badge-error badge-xs sm:badge-sm">{type}</span>
                    ))
                  ) : (
                    <span className="text-xs sm:text-sm">All types accepted</span>
                  )}
                </div>
              </div>
              {eventData.requirements.minAge && (
                <div>
                  <p className="opacity-70">Age Range</p>
                  <p className="font-medium">
                    {eventData.requirements.minAge} - {eventData.requirements.maxAge || 65} years
                  </p>
                </div>
              )}
              {eventData.requirements.minWeight && (
                <div>
                  <p className="opacity-70">Minimum Weight</p>
                  <p className="font-medium">{eventData.requirements.minWeight} kg</p>
                </div>
              )}
            </div>
          </div>

          {/* Blood Bank Card */}
          {eventData.bloodBank && Object.keys(eventData.bloodBank).length > 0 && (
            <div className="bg-base-200 rounded-lg p-3 sm:p-4 sm:col-span-2">
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-2 sm:mb-3">
                <FaHospital className="text-error text-sm sm:text-base" />
                Organizing Blood Bank
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <p className="opacity-70">Name</p>
                  <p className="font-medium wrap-break-word">{eventData.bloodBank.name || "N/A"}</p>
                </div>
                <div>
                  <p className="opacity-70">Contact</p>
                  <p className="font-medium wrap-break-word">
                    {eventData.bloodBank.contact?.phone || eventData.bloodBank.phone || "N/A"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="opacity-70">Address</p>
                  <p className="font-medium wrap-break-word">
                    {eventData.bloodBank.address?.street || eventData.bloodBank.address || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Registered Donors Card */}
          {eventData.registeredDonors.length > 0 && (
            <div className="bg-base-200 rounded-lg p-3 sm:p-4 sm:col-span-2">
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-2 sm:mb-3">
                <FaUsers className="text-error text-sm sm:text-base" />
                Registered Donors ({eventData.registeredDonors.length})
              </h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {eventData.registeredDonors.slice(0, 5).map((reg, idx) => (
                  <div key={idx} className="badge badge-outline gap-1 p-2 sm:p-3 text-xs">
                    <FiUser className="text-xs" />
                    <span className="truncate max-w-20 sm:max-w-none">
                      {reg.donorName || `Donor ${idx + 1}`}
                    </span>
                    {reg.donorBloodGroup && (
                      <span className="badge badge-xs ml-1">{reg.donorBloodGroup}</span>
                    )}
                  </div>
                ))}
                {eventData.registeredDonors.length > 5 && (
                  <div className="badge badge-outline p-2 sm:p-3 text-xs">
                    +{eventData.registeredDonors.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Registration Status Alert */}
        {eventData.registered && (
          <div className="mt-4 alert alert-success bg-success/10 border-success/20 p-3 sm:p-4">
            <FaCheckCircleSolid className="text-success text-sm sm:text-base shrink-0" />
            <span className="text-xs sm:text-sm">You are registered for this event.</span>
          </div>
        )}

        {eventData.isFull && (
          <div className="mt-4 alert alert-error bg-error/10 border-error/20 p-3 sm:p-4">
            <FiAlertCircle className="text-error text-sm sm:text-base shrink-0" />
            <span className="text-xs sm:text-sm">This event is full. No more registrations accepted.</span>
          </div>
        )}
      </div>

      {/* Modal Footer */}
      <div className="modal-action border-t border-base-300 p-3 sm:p-4 bg-base-200/50">
        <div className="flex flex-col sm:flex-row sm:justify-end gap-2 w-full">
          <button
            type="button"
            className="btn btn-xs sm:btn-sm btn-ghost order-2 sm:order-1"
            onClick={onClose}
          >
            Close
          </button>
          {eventData.registered ? (
            <button
              type="button"
              className="btn btn-xs sm:btn-sm btn-warning gap-1 sm:gap-2 order-1 sm:order-2"
              onClick={() => {
                onClose();
                onCancelRegistration(eventData.id);
              }}
              disabled={eventData.isLoading}
            >
              {eventData.isLoading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <FiXCircle size={14} />
              )}
              <span className="truncate">{eventData.isLoading ? "Cancelling..." : "Cancel Registration"}</span>
            </button>
          ) : (
            <button
              type="button"
              className={`btn btn-xs sm:btn-sm gap-1 sm:gap-2 ${eventData.isFull ? "btn-disabled" : "btn-error"} order-1 sm:order-2`}
              onClick={() => {
                onClose();
                onRegister(eventData.id);
              }}
              disabled={eventData.isLoading || eventData.isFull}
            >
              {eventData.isLoading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <FiCheckCircle size={14} />
              )}
              <span className="truncate">
                {eventData.isLoading ? "Registering..." : eventData.isFull ? "Event Full" : "Register Now"}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
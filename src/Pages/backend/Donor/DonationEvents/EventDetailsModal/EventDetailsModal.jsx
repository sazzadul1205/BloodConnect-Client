// Pages/backend/Donor/DonationEvents/EventDetailsModal.jsx

// React
import React from "react";

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
} from "react-icons/fi";

// Icons - Fa (Font Awesome)
import {
  FaHospital,
  FaUsers,
  FaTint,
  FaCheckCircle as FaCheckCircleSolid,
} from "react-icons/fa";

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

// Event type configuration
const eventTypeConfig = {
  drive: { icon: FaUsers, color: "success", label: "Blood Drive" },
  emergency: { icon: FaUsers, color: "error", label: "Emergency" },
  regular: { icon: FaUsers, color: "warning", label: "Regular" },
};

const EventDetailsModal = ({
  selectedEvent,
  onClose,
  onRegister,
  onCancelRegistration,
  isRegistered,
  actionLoadingId,
}) => {
  if (!selectedEvent) return null;

  const eventId = getId(selectedEvent._id);
  const registered = isRegistered(selectedEvent);
  const isLoading = actionLoadingId === eventId;
  const isFull = selectedEvent?.spotsLeft === 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="modal-box w-11/12 max-w-3xl p-0 overflow-hidden bg-base-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Modal Header - Gradient Background */}
      <div className="bg-linear-to-r from-error to-error/80 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <FiCalendar size={24} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">{selectedEvent.title}</h3>
              <p className="text-white/80 text-sm">
                {eventTypeConfig[selectedEvent?.type]?.label || selectedEvent?.type || "Event"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20"
          >
            X
          </button>
        </div>
      </div>

      {/* Modal Content */}
      <div className="p-6 max-h-[70vh] overflow-y-auto">
        {/* Description */}
        <p className="text-base-content/70 mb-4">{selectedEvent.description}</p>

        {/* Event Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date & Time Card */}
          <div className="bg-base-200 rounded-lg p-4">
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <FiClock className="text-error" />
              Date & Time
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <p className="opacity-70">Start</p>
                <p className="font-medium">{formatDateTime(selectedEvent?.schedule?.startDate)}</p>
              </div>
              <div>
                <p className="opacity-70">End</p>
                <p className="font-medium">{formatDateTime(selectedEvent?.schedule?.endDate)}</p>
              </div>
            </div>
          </div>

          {/* Location Card */}
          <div className="bg-base-200 rounded-lg p-4">
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <FiMapPin className="text-error" />
              Location
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <p className="opacity-70">Venue</p>
                <p className="font-medium">{selectedEvent?.location?.venue || "N/A"}</p>
              </div>
              <div>
                <p className="opacity-70">Address</p>
                <p className="font-medium">{selectedEvent?.location?.address || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Capacity Card */}
          <div className="bg-base-200 rounded-lg p-4">
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <FaUsers className="text-error" />
              Capacity
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <p className="opacity-70">Registered</p>
                <p className="font-medium">{selectedEvent?.capacity?.currentRegistrations || 0}</p>
              </div>
              <div>
                <p className="opacity-70">Maximum Donors</p>
                <p className="font-medium">{selectedEvent?.capacity?.maxDonors || 0}</p>
              </div>
              <div>
                <p className="opacity-70">Spots Left</p>
                <p className={`font-medium ${selectedEvent?.spotsLeft < 10 ? "text-error" : ""}`}>
                  {selectedEvent?.spotsLeft || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Requirements Card */}
          <div className="bg-base-200 rounded-lg p-4">
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <FaTint className="text-error" />
              Requirements
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <p className="opacity-70">Accepted Blood Types</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedEvent?.requirements?.bloodTypes?.length > 0 ? (
                    selectedEvent.requirements.bloodTypes.map((type) => (
                      <span key={type} className="badge badge-error badge-sm">{type}</span>
                    ))
                  ) : (
                    <span className="text-sm">All types accepted</span>
                  )}
                </div>
              </div>
              {selectedEvent?.requirements?.ageMin && (
                <div>
                  <p className="opacity-70">Minimum Age</p>
                  <p className="font-medium">{selectedEvent.requirements.ageMin} years</p>
                </div>
              )}
            </div>
          </div>

          {/* Blood Bank Card */}
          {selectedEvent?.bloodBank && (
            <div className="bg-base-200 rounded-lg p-4 md:col-span-2">
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <FaHospital className="text-error" />
                Organizing Blood Bank
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="opacity-70">Name</p>
                  <p className="font-medium">{selectedEvent.bloodBank.name}</p>
                </div>
                <div>
                  <p className="opacity-70">Contact</p>
                  <p className="font-medium">{selectedEvent.bloodBank.phone || "N/A"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="opacity-70">Address</p>
                  <p className="font-medium">{selectedEvent.bloodBank.address || "N/A"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Registered Donors Card (if any) */}
          {selectedEvent?.registeredDonors?.length > 0 && (
            <div className="bg-base-200 rounded-lg p-4 md:col-span-2">
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <FaUsers className="text-error" />
                Registered Donors ({selectedEvent.registeredDonors.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedEvent.registeredDonors.slice(0, 5).map((reg, idx) => (
                  <div key={idx} className="badge badge-outline gap-1 p-3">
                    <FiUser className="text-xs" />
                    {reg.donorName || "Registered Donor"}
                  </div>
                ))}
                {selectedEvent.registeredDonors.length > 5 && (
                  <div className="badge badge-outline p-3">
                    +{selectedEvent.registeredDonors.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Registration Status Alert */}
        {registered && (
          <div className="mt-4 alert alert-success bg-success/10 border-success/20">
            <FaCheckCircleSolid className="text-success" />
            <span>You are registered for this event.</span>
          </div>
        )}

        {isFull && (
          <div className="mt-4 alert alert-error bg-error/10 border-error/20">
            <FiAlertCircle className="text-error" />
            <span>This event is full. No more registrations accepted.</span>
          </div>
        )}
      </div>

      {/* Modal Footer */}
      <div className="modal-action border-t border-base-300 p-4 bg-base-200/50">
        <div className="flex justify-end gap-2 w-full">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
          >
            Close
          </button>
          {registered ? (
            <button
              type="button"
              className="btn btn-warning gap-2"
              onClick={() => {
                onClose();
                onCancelRegistration(eventId);
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <FiXCircle size={18} />
              )}
              Cancel Registration
            </button>
          ) : (
            <button
              type="button"
              className={`btn gap-2 ${isFull ? "btn-disabled" : "btn-error"}`}
              onClick={() => {
                onClose();
                onRegister(eventId);
              }}
              disabled={isLoading || isFull}
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <FiCheckCircle size={18} />
              )}
              {isFull ? "Event Full" : "Register Now"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EventDetailsModal;

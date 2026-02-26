// Pages/backend/Requester/MyRequests/StatusUpdateModal/StatusUpdateModal.jsx

// React
import React, { useState } from "react";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FaTimes,
  FaCheckCircle,
  FaClock,
  FaHeartbeat,
  FaTint,
} from "react-icons/fa";
import { FiAlertCircle } from "react-icons/fi";

const statusOptions = [
  {
    value: "fulfilled",
    label: "Fulfilled",
    color: "success",
    icon: FaCheckCircle,
    description: "Request has been completed successfully",
    conditions: "Can be set at any time"
  },
  {
    value: "cancelled",
    label: "Cancelled",
    color: "error",
    icon: FaTimes,
    description: "Request is no longer needed",
    conditions: "Only for pending requests"
  },
  {
    value: "expired",
    label: "Expired",
    color: "neutral",
    icon: FaClock,
    description: "Request has passed its expiry date",
    conditions: "Auto-set by system"
  },
];

const StatusUpdateModal = ({ request, onClose, onUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!request) return null;

  const requestId = request?._id?.$oid || request?._id;
  const currentStatus = request?.status?.current;
  const patientName = request?.patientInfo?.name || "Unknown";
  const bloodType = request?.requestDetails?.bloodType || "N/A";
  const units = request?.requestDetails?.units || 0;

  // Filter available status options based on current status
  const availableOptions = statusOptions.filter(option => {
    if (option.value === "cancelled" && currentStatus !== "pending") return false;
    if (option.value === currentStatus) return false;
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus) return;

    setLoading(true);
    try {
      await onUpdate(requestId, selectedStatus, notes);
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-box w-11/12 max-w-md p-0 overflow-hidden bg-base-100">
      {/* Header */}
      <div className="bg-linear-to-r from-primary to-primary/80 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <FaCheckCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">Update Status</h3>
              <p className="text-white/80 text-sm">Change request status</p>
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

      {/* Request Summary */}
      <div className="bg-base-200/50 p-4 border-b border-base-300">
        <div className="flex items-center gap-3">
          <div className="bg-error/10 p-2 rounded-full">
            <FaTint className="text-error" />
          </div>
          <div>
            <p className="font-semibold">{patientName}</p>
            <p className="text-sm text-base-content/70">
              {bloodType} • {units} units • Current: <span className="capitalize">{currentStatus}</span>
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Status Options */}
          <div className="space-y-3">
            <label className="label">
              <span className="label-text font-medium">Select New Status</span>
            </label>

            {availableOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedStatus === option.value;

              return (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                    ? `border-${option.color} bg-${option.color}/10`
                    : 'border-base-300 hover:border-primary/50'
                    }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={isSelected}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="hidden"
                  />
                  <div className={`mt-1 text-${option.color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${isSelected ? `text-${option.color}` : ''}`}>
                      {option.label}
                    </p>
                    <p className="text-xs opacity-70 mt-1">{option.description}</p>
                    <p className="text-xs opacity-50 mt-1">{option.conditions}</p>
                  </div>
                  {isSelected && (
                    <FaCheckCircle className={`text-${option.color}`} />
                  )}
                </label>
              );
            })}
          </div>

          {/* Notes Field */}
          <div className="form-control mt-4">
            <label className="label">
              <span className="label-text">Additional Notes</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this status change..."
              className="textarea textarea-bordered h-24 w-full"
            />
          </div>

          {/* Warning Messages */}
          {selectedStatus === "cancelled" && (
            <div className="alert alert-warning mt-4">
              <FiAlertCircle size={20} />
              <span>Cancelling this request will notify all matched donors.</span>
            </div>
          )}

          {selectedStatus === "fulfilled" && (
            <div className="alert alert-success mt-4">
              <FaHeartbeat size={20} />
              <span>Marking as fulfilled will complete this request.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-action border-t border-base-300 p-4 bg-base-200/50">
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedStatus || loading}
              className={`btn btn-${statusOptions.find(o => o.value === selectedStatus)?.color || 'primary'} text-white gap-2`}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Updating...
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  Update Status
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default StatusUpdateModal;
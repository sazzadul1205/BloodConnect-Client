// Pages/backend/Requester/MyRequests/ViewRequestModal/ViewRequestModal.jsx

// React
import React, { useState, useEffect } from "react";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FaTint,
  FaUser,
  FaHospital,
  FaTimes,
  FaEye,
  FaClock,
  FaCalendarAlt,
} from "react-icons/fa";
import { FiAlertCircle, FiDroplet } from "react-icons/fi";

// Shared
import BloodLoader from "../../../../../shared/BloodLoader";

// Hooks
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";

const ViewRequestModal = ({ requestId, onClose }) => {
  const { axiosInstance } = useAxiosPublic();
  const [loading, setLoading] = useState(true);
  const [requestData, setRequestData] = useState(null);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!requestId) return;

      setLoading(true);
      try {
        const response = await axiosInstance.get(`/blood-requests/${requestId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
        });

        if (response.data?.success) {
          setRequestData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching request:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId, axiosInstance]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      emergency: "error",
      urgent: "warning",
      normal: "info",
    };
    return colors[urgency] || "ghost";
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      matched: "info",
      fulfilled: "success",
      cancelled: "error",
      expired: "neutral",
    };
    return colors[status] || "ghost";
  };

  if (loading) return <BloodLoader fullscreen={false} />;
  if (!requestData) return null;

  const request = requestData;
  const patientInfo = request.patientInfo || {};
  const requestDetails = request.requestDetails || {};
  const location = request.location || {};
  const timeline = request.timeline || [];

  return (
    <div className="modal-box w-11/12 max-w-3xl p-0 overflow-hidden bg-base-100">
      {/* Header */}
      <div className={`bg-linear-to-r from-${getUrgencyColor(requestDetails.urgency)} to-${getUrgencyColor(requestDetails.urgency)}/80 p-6 text-white`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-full">
              <FaTint size={32} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">Blood Request Details</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge badge-${getUrgencyColor(requestDetails.urgency)} gap-1`}>
                  <FiAlertCircle size={12} />
                  {requestDetails.urgency || "normal"}
                </span>
                <span className={`badge badge-${getStatusColor(request.status?.current)} gap-1`}>
                  {request.status?.current || "pending"}
                </span>
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
          <div className="stat-figure text-primary">
            <FaTint />
          </div>
          <div className="stat-title text-xs">Blood Type</div>
          <div className="stat-value text-lg text-error">{requestDetails.bloodType || "N/A"}</div>
        </div>
        <div className="stat py-2">
          <div className="stat-figure text-primary">
            <FiDroplet />
          </div>
          <div className="stat-title text-xs">Units</div>
          <div className="stat-value text-lg">{requestDetails.units || 0}</div>
        </div>
        <div className="stat py-2">
          <div className="stat-figure text-primary">
            <FaClock />
          </div>
          <div className="stat-title text-xs">Created</div>
          <div className="stat-value text-sm">{formatDate(request.createdAt).split(',')[0]}</div>
        </div>
        <div className="stat py-2">
          <div className="stat-figure text-primary">
            <FaCalendarAlt />
          </div>
          <div className="stat-title text-xs">Required By</div>
          <div className="stat-value text-sm">{formatDate(requestDetails.requiredBy).split(',')[0]}</div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[50vh] overflow-y-auto space-y-6">
        {/* Patient Information */}
        <div className="bg-base-200 rounded-lg p-4">
          <h4 className="font-semibold flex items-center gap-2 mb-4 text-lg">
            <FaUser className="text-primary" />
            Patient Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-70">Full Name</p>
              <p className="font-medium">{patientInfo.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Age</p>
              <p className="font-medium">{patientInfo.age || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Blood Group</p>
              <p className="font-medium text-error">{patientInfo.bloodGroup || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Relationship</p>
              <p className="font-medium">{patientInfo.relationship || "N/A"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm opacity-70">Medical Case</p>
              <p className="font-medium">{patientInfo.case || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Hospital & Location */}
        <div className="bg-base-200 rounded-lg p-4">
          <h4 className="font-semibold flex items-center gap-2 mb-4 text-lg">
            <FaHospital className="text-primary" />
            Hospital & Location
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <p className="text-sm opacity-70">Hospital</p>
              <p className="font-medium">{location.hospitalName || patientInfo.hospital || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Doctor</p>
              <p className="font-medium">{patientInfo.doctorName || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">City</p>
              <p className="font-medium">{location.city || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">State</p>
              <p className="font-medium">{location.state || "N/A"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm opacity-70">Address</p>
              <p className="font-medium">{location.address || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {request.status?.notes && (
          <div className="bg-base-200 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Notes</h4>
            <p className="text-sm bg-base-100 p-3 rounded-lg">{request.status.notes}</p>
          </div>
        )}

        {/* Timeline */}
        {timeline.length > 0 && (
          <div className="bg-base-200 rounded-lg p-4">
            <h4 className="font-semibold flex items-center gap-2 mb-4">
              <FaClock className="text-primary" />
              Timeline
            </h4>
            <div className="space-y-3">
              {timeline.map((entry, index) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary"></div>
                  <div className="flex-1">
                    <p className="font-medium">{entry.event}</p>
                    <p className="text-xs opacity-70">{entry.description}</p>
                    <p className="text-xs opacity-50 mt-1">{formatDate(entry.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="modal-action border-t border-base-300 p-4 bg-base-200/50">
        <button
          onClick={onClose}
          className="btn btn-primary text-white ml-auto gap-2"
        >
          <FaEye />
          Close
        </button>
      </div>
    </div>
  );
};

export default ViewRequestModal;
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
import { formatAppDateTime } from "../../../../../utils/dateFormat";

// Hooks
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";

// ==================== VIEW REQUEST MODAL COMPONENT ====================
/**
 * Modal component to view detailed information about a blood request
 * Fetches and displays patient info, request details, location, timeline, and notes
 * 
 * @param {string} requestId - ID of the request to view
 * @param {function} onClose - Function to call when modal is closed
 */
const ViewRequestModal = ({ requestId, onClose }) => {
  // ==================== HOOKS ====================

  const { axiosInstance } = useAxiosPublic();
  const [loading, setLoading] = useState(true);
  const [requestData, setRequestData] = useState(null);

  // ==================== EFFECTS ====================

  /**
   * Fetch request details when component mounts or requestId changes
   */
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

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Format date for display with fallback
   */
  const formatDate = (dateString) => {
    return formatAppDateTime(dateString, "MMMM d, yyyy p", "N/A");
  };

  /**
   * Get color class based on urgency level - BUILD COMPATIBLE
   * Using static className mapping instead of dynamic template strings
   */
  const getUrgencyClasses = (urgency) => {
    switch (urgency) {
      case "emergency":
        return {
          bg: "from-error to-error/80",
          badge: "badge-error"
        };
      case "urgent":
        return {
          bg: "from-warning to-warning/80",
          badge: "badge-warning"
        };
      case "normal":
        return {
          bg: "from-info to-info/80",
          badge: "badge-info"
        };
      default:
        return {
          bg: "from-neutral to-neutral/80",
          badge: "badge-neutral"
        };
    }
  };

  /**
   * Get color class based on status - BUILD COMPATIBLE
   * Using static className mapping instead of dynamic template strings
   */
  const getStatusClasses = (status) => {
    switch (status) {
      case "pending":
        return "badge-warning";
      case "matched":
        return "badge-info";
      case "fulfilled":
        return "badge-success";
      case "cancelled":
        return "badge-error";
      case "expired":
        return "badge-neutral";
      default:
        return "badge-ghost";
    }
  };

  // ==================== LOADING & ERROR STATES ====================

  if (loading) return <BloodLoader fullscreen={false} />;
  if (!requestData) return null;

  // ==================== DATA EXTRACTION ====================

  const request = requestData;
  const patientInfo = request.patientInfo || {};
  const requestDetails = request.requestDetails || {};
  const location = request.location || {};
  const timeline = request.timeline || [];

  // Get urgency classes for header
  const urgencyClasses = getUrgencyClasses(requestDetails.urgency);
  const statusBadgeClass = getStatusClasses(request.status?.current);

  // ==================== RENDER ====================

  return (
    <div className="md:modal-box w-11/12 max-w-3xl p-0 overflow-hidden bg-base-100 mx-2 sm:mx-0">

      {/* ==================== HEADER SECTION ==================== */}
      {/* Dynamic header color based on urgency - Using static className */}
      <div className={`bg-linear-to-r ${urgencyClasses.bg} p-4 sm:p-6 text-white`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

          {/* Title and badges */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-white/20 p-2 sm:p-4 rounded-full">
              <FaTint size={20} className="sm:w-8 sm:h-8" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-2xl">Blood Request Details</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {/* Urgency badge - static class from mapping */}
                <span className={`badge ${urgencyClasses.badge} badge-sm sm:badge-md gap-1`}>
                  <FiAlertCircle size={10} className="sm:w-3 sm:h-3" />
                  <span className="text-xs sm:text-sm">{requestDetails.urgency || "normal"}</span>
                </span>
                {/* Status badge - static class from mapping */}
                <span className={`badge ${statusBadgeClass} badge-sm sm:badge-md gap-1`}>
                  <span className="text-xs sm:text-sm">{request.status?.current || "pending"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="btn btn-ghost btn-xs sm:btn-sm btn-circle text-white hover:bg-white/20 self-end sm:self-auto"
            aria-label="Close modal"
          >
            <FaTimes size={16} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* ==================== QUICK STATS SECTION ==================== */}
      {/* Responsive grid: 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:p-4 bg-base-200/50 border-b border-base-300">

        {/* Blood Type Stat */}
        <div className="stat py-1 sm:py-2">
          <div className="stat-figure text-primary">
            <FaTint className="text-xs sm:text-sm" />
          </div>
          <div className="stat-title text-[10px] sm:text-xs">Blood Type</div>
          <div className="stat-value text-sm sm:text-lg text-error">{requestDetails.bloodType || "N/A"}</div>
        </div>

        {/* Units Stat */}
        <div className="stat py-1 sm:py-2">
          <div className="stat-figure text-primary">
            <FiDroplet className="text-xs sm:text-sm" />
          </div>
          <div className="stat-title text-[10px] sm:text-xs">Units</div>
          <div className="stat-value text-sm sm:text-lg">{requestDetails.units || 0}</div>
        </div>

        {/* Created Date Stat */}
        <div className="stat py-1 sm:py-2">
          <div className="stat-figure text-primary">
            <FaClock className="text-xs sm:text-sm" />
          </div>
          <div className="stat-title text-[10px] sm:text-xs">Created</div>
          <div className="stat-value text-xs sm:text-sm truncate max-w-20 sm:max-w-full">
            {formatDate(request.createdAt).split(',')[0]}
          </div>
        </div>

        {/* Required By Date Stat */}
        <div className="stat py-1 sm:py-2">
          <div className="stat-figure text-primary">
            <FaCalendarAlt className="text-xs sm:text-sm" />
          </div>
          <div className="stat-title text-[10px] sm:text-xs">Required By</div>
          <div className="stat-value text-xs sm:text-sm truncate max-w-20 sm:max-w-full">
            {formatDate(requestDetails.requiredBy).split(',')[0]}
          </div>
        </div>
      </div>

      {/* ==================== CONTENT SECTION ==================== */}
      {/* Scrollable content area */}
      <div className="p-4 sm:p-6 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto space-y-4 sm:space-y-6">

        {/* ==================== PATIENT INFORMATION ==================== */}
        <div className="bg-base-200 rounded-lg p-3 sm:p-4">
          <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
            <FaUser className="text-primary text-sm sm:text-base" />
            Patient Information
          </h3>

          {/* Responsive grid: 1 column on mobile, 2 on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

            {/* Patient Name */}
            <div>
              <p className="text-xs opacity-70">Full Name</p>
              <p className="font-medium text-sm wrap-break-word">{patientInfo.name || "N/A"}</p>
            </div>

            {/* Patient Age */}
            <div>
              <p className="text-xs opacity-70">Age</p>
              <p className="font-medium text-sm">{patientInfo.age || "N/A"}</p>
            </div>

            {/* Blood Group */}
            <div>
              <p className="text-xs opacity-70">Blood Group</p>
              <p className="font-medium text-sm text-error">{patientInfo.bloodGroup || "N/A"}</p>
            </div>

            {/* Relationship */}
            <div>
              <p className="text-xs opacity-70">Relationship</p>
              <p className="font-medium text-sm">{patientInfo.relationship || "N/A"}</p>
            </div>

            {/* Medical Case - Full width */}
            <div className="col-span-1 sm:col-span-2">
              <p className="text-xs opacity-70">Medical Case</p>
              <p className="font-medium text-sm wrap-break-word">{patientInfo.case || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* ==================== HOSPITAL & LOCATION ==================== */}
        <div className="bg-base-200 rounded-lg p-3 sm:p-4">
          <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
            <FaHospital className="text-primary text-sm sm:text-base" />
            Hospital & Location
          </h3>

          {/* Responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

            {/* Hospital Name - Full width */}
            <div className="col-span-1 sm:col-span-2">
              <p className="text-xs opacity-70">Hospital</p>
              <p className="font-medium text-sm wrap-break-word">
                {location.hospitalName || patientInfo.hospital || "N/A"}
              </p>
            </div>

            {/* Doctor Name */}
            <div>
              <p className="text-xs opacity-70">Doctor</p>
              <p className="font-medium text-sm">{patientInfo.doctorName || "N/A"}</p>
            </div>

            {/* City */}
            <div>
              <p className="text-xs opacity-70">City</p>
              <p className="font-medium text-sm">{location.city || "N/A"}</p>
            </div>

            {/* State */}
            <div>
              <p className="text-xs opacity-70">State</p>
              <p className="font-medium text-sm">{location.state || "N/A"}</p>
            </div>

            {/* Address - Full width */}
            <div className="col-span-1 sm:col-span-2">
              <p className="text-xs opacity-70">Address</p>
              <p className="font-medium text-sm wrap-break-word">{location.address || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* ==================== NOTES SECTION ==================== */}
        {/* Only show if notes exist */}
        {request.status?.notes && (
          <div className="bg-base-200 rounded-lg p-3 sm:p-4">
            <h3 className="font-semibold text-sm sm:text-base mb-2">Notes</h3>
            <p className="text-xs sm:text-sm bg-base-100 p-2 sm:p-3 rounded-lg wrap-break-word">
              {request.status.notes}
            </p>
          </div>
        )}

        {/* ==================== TIMELINE SECTION ==================== */}
        {/* Only show if timeline exists */}
        {timeline.length > 0 && (
          <div className="bg-base-200 rounded-lg p-3 sm:p-4">
            <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
              <FaClock className="text-primary text-sm sm:text-base" />
              Timeline
            </h3>

            {/* Timeline entries */}
            <div className="space-y-2 sm:space-y-3">
              {timeline.map((entry, index) => (
                <div key={index} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                  {/* Timeline dot */}
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 mt-1.5 sm:mt-2 rounded-full bg-primary shrink-0"></div>

                  {/* Timeline content */}
                  <div className="flex-1">
                    <p className="font-medium text-xs sm:text-sm">{entry.event}</p>
                    <p className="text-[10px] sm:text-xs opacity-70 wrap-break-word">{entry.description}</p>
                    <p className="text-[10px] opacity-50 mt-0.5 sm:mt-1">{formatDate(entry.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ==================== FOOTER SECTION ==================== */}
      {/* Close button */}
      <div className="modal-action border-t border-base-300 p-3 sm:p-4 bg-base-200/50">
        <button
          onClick={onClose}
          className="btn btn-primary btn-sm sm:btn-md text-white ml-auto gap-1 sm:gap-2"
        >
          <FaEye size={14} className="sm:w-4 sm:h-4" />
          <span>Close</span>
        </button>
      </div>
    </div>
  );
};

export default ViewRequestModal;
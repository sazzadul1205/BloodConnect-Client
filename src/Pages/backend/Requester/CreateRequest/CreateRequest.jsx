// Pages/backend/Requester/CreateRequest/CreateRequest.jsx

// React
import React, { useState } from "react";
import { useNavigate } from "react-router";

// Sweet Alert
import Swal from "sweetalert2";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FiClipboard,
  FiDroplet,
  FiMapPin,
  FiPlusCircle,
  FiRefreshCw,
  FiUser,
  FiCalendar,
  FiClock,
  FiHome,
  FiMap,
  FiFileText,
  FiHeart,
  FiActivity,
} from "react-icons/fi";
import {
  FaHospital,
  FaUserMd,
  FaVenusMars,
  FaWeight,
  FaTint,
  FaExclamationTriangle,
  FaBuilding,
  FaGlobe,
  FaLocationArrow,
} from "react-icons/fa";

// Hooks
import useAxiosPublic from "../../../../hooks/useAxiosPublic";
import useAuth from "../../../../hooks/useAuth";

// ==================== CONSTANTS ====================

// Blood type options for dropdowns
const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Urgency levels for blood requests
const urgencyOptions = ["normal", "urgent", "emergency"];

// Types of blood products that can be requested
const requestTypes = ["whole_blood", "plasma", "platelets"];

// Patient relationship options for context
const relationshipOptions = [
  "father",
  "mother",
  "brother",
  "sister",
  "spouse",
  "child",
  "friend",
  "other",
];

// ==================== INITIAL FORM STATE ====================

/**
 * Initial empty form structure
 * Organized by sections: patient info, request details, location, notes
 */
const initialForm = {
  // Patient Information
  patientName: "",
  patientAge: "",
  patientBloodGroup: "",
  relationship: "",
  patientHospital: "",
  doctorName: "",
  caseDescription: "",

  // Request Details
  bloodType: "",
  units: 1,
  urgency: "normal",
  requiredBy: "",
  requestType: "whole_blood",

  // Location Information
  hospitalName: "",
  address: "",
  city: "",
  state: "",
  longitude: "",
  latitude: "",

  // Additional Notes
  notes: "",
};

// ==================== MAIN COMPONENT ====================

const CreateRequest = () => {
  // ==================== HOOKS ====================

  const { axiosInstance } = useAxiosPublic();
  const { user } = useAuth();
  const token = localStorage.getItem("auth_token");
  const navigate = useNavigate();

  // Check if user is hospital staff (affects redirect after submission)
  const isHospital = user?.role === "hospital";

  // ==================== STATE MANAGEMENT ====================

  // Form submission loading state
  const [submitting, setSubmitting] = useState(false);

  // Form data state
  const [form, setForm] = useState(initialForm);

  // ==================== EVENT HANDLERS ====================

  /**
   * Generic input change handler
   * Updates form state based on input name and value
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Reset form to initial empty state
   * Used when user wants to start over
   */
  const handleReset = () => {
    setForm(initialForm);
  };

  /**
   * Form submission handler
   * Validates input, constructs payload, and sends to API
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ==================== VALIDATION ====================

    // Check if user is authenticated
    if (!token) {
      await Swal.fire({
        title: "Not Authorized",
        text: "Please log in again to create a request.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
      return;
    }

    // Validate required patient fields
    if (!form.patientName || !form.patientBloodGroup || !form.patientHospital) {
      await Swal.fire({
        title: "Missing Patient Info",
        text: "Patient name, blood group, and hospital are required.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
      return;
    }

    // Validate required request fields
    if (!form.bloodType || !form.units || !form.urgency) {
      await Swal.fire({
        title: "Missing Request Details",
        text: "Blood type, units, and urgency are required.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
      return;
    }

    // ==================== PAYLOAD CONSTRUCTION ====================

    // Check if coordinates are provided
    const hasCoordinates = form.longitude !== "" && form.latitude !== "";

    // Construct API payload according to backend schema
    const payload = {
      patientInfo: {
        name: form.patientName,
        age: form.patientAge ? Number(form.patientAge) : undefined,
        bloodGroup: form.patientBloodGroup,
        relationship: form.relationship || undefined,
        hospital: form.patientHospital,
        doctorName: form.doctorName || undefined,
        case: form.caseDescription || undefined,
      },
      requestDetails: {
        bloodType: form.bloodType,
        units: Number(form.units),
        urgency: form.urgency,
        requiredBy: form.requiredBy || undefined,
        type: form.requestType,
      },
      location: {
        hospitalName: form.hospitalName || form.patientHospital,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        coordinates: hasCoordinates
          ? {
            type: "Point",
            coordinates: [Number(form.longitude), Number(form.latitude)],
          }
          : undefined,
      },
      notes: form.notes || undefined,
    };

    // ==================== API CALL ====================

    setSubmitting(true);
    try {
      // Send request to backend
      await axiosInstance.post("/blood-requests", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Show success message
      await Swal.fire({
        title: "Request Created",
        text: "Your blood request has been submitted successfully.",
        icon: "success",
        confirmButtonColor: "#ef4444",
        timer: 1700,
        showConfirmButton: false,
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
        },
        buttonsStyling: false,
      });

      // Reset form and navigate to appropriate requests page
      setForm(initialForm);
      navigate(isHospital ? "/hospital/my-requests" : "/requester/my-requests");
    } catch (err) {
      // Handle error
      await Swal.fire({
        title: "Request Failed",
        text: err?.response?.data?.error || "Unable to create blood request.",
        icon: "error",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-4 sm:space-y-6 min-h-screen bg-base-200 p-3 sm:p-4 md:p-6">
      {/* ==================== HEADER SECTION ==================== */}
      {/* Animated header with title and reset button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
      >
        {/* Title and description */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FiPlusCircle className="text-error" />
            Create Blood Request
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Fill the patient, request, and location details to submit a new request.
          </p>
        </div>

        {/* Reset form button */}
        <button
          type="button"
          onClick={handleReset}
          className="btn btn-xs sm:btn-sm btn-outline gap-1 sm:gap-2 w-full sm:w-auto"
          disabled={submitting}
        >
          <FiRefreshCw size={12} className="sm:hidden" />
          <FiRefreshCw size={14} className="hidden sm:inline" />
          <span className="truncate">Reset Form</span>
        </button>
      </motion.div>

      {/* ==================== MAIN FORM ==================== */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">

        {/* ==================== PATIENT INFORMATION SECTION ==================== */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 space-y-3 sm:space-y-4"
        >
          {/* Section header */}
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
            <FiUser className="text-error text-sm sm:text-base" />
            Patient Information
          </h2>

          {/* Responsive grid: 1 column on mobile, 2 on tablet/desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">

            {/* Patient Name - Required */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FiHeart className="text-error" size={14} />
                Patient Name <span className="text-error">*</span>
              </span>
              <input
                name="patientName"
                type="text"
                className="input input-bordered input-sm sm:input-md w-full"
                value={form.patientName}
                onChange={handleChange}
                placeholder="Enter patient name"
                required
              />
            </label>

            {/* Patient Age */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FiClock className="text-info" size={14} />
                Patient Age
              </span>
              <input
                type="number"
                min={0}
                max={120}
                name="patientAge"
                className="input input-bordered input-sm sm:input-md w-full"
                value={form.patientAge}
                onChange={handleChange}
                placeholder="Enter age"
              />
            </label>

            {/* Patient Blood Group - Required */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FaTint className="text-error" size={14} />
                Blood Group <span className="text-error">*</span>
              </span>
              <select
                name="patientBloodGroup"
                className="select select-bordered select-sm sm:select-md w-full"
                value={form.patientBloodGroup}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    patientBloodGroup: value,
                    // Auto-fill blood type with patient's blood group for convenience
                    bloodType: prev.bloodType || value,
                  }));
                }}
                required
              >
                <option value="">Select blood group</option>
                {bloodTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            {/* Relationship to Patient */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FaVenusMars className="text-secondary" size={14} />
                Relationship
              </span>
              <select
                name="relationship"
                className="select select-bordered select-sm sm:select-md w-full"
                value={form.relationship}
                onChange={handleChange}
              >
                <option value="">Select relationship</option>
                {relationshipOptions.map((item) => (
                  <option key={item} value={item}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            {/* Hospital Name - Required (full width on desktop) */}
            <label className="form-control w-full md:col-span-2">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FaHospital className="text-error" size={14} />
                Hospital <span className="text-error">*</span>
              </span>
              <div className="relative">
                <FaHospital className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 text-sm sm:text-base" />
                <input
                  name="patientHospital"
                  type="text"
                  className="input input-bordered input-sm sm:input-md w-full pl-8 sm:pl-10"
                  value={form.patientHospital}
                  onChange={handleChange}
                  placeholder="Hospital where blood is required"
                  required
                />
              </div>
            </label>

            {/* Doctor Name */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FaUserMd className="text-primary" size={14} />
                Doctor Name
              </span>
              <input
                name="doctorName"
                type="text"
                className="input input-bordered input-sm sm:input-md w-full"
                value={form.doctorName}
                onChange={handleChange}
                placeholder="Attending doctor name"
              />
            </label>

            {/* Case Description */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FiFileText className="text-warning" size={14} />
                Case Summary
              </span>
              <input
                name="caseDescription"
                type="text"
                className="input input-bordered input-sm sm:input-md w-full"
                value={form.caseDescription}
                onChange={handleChange}
                placeholder="e.g. Accident - internal bleeding"
              />
            </label>
          </div>
        </motion.section>

        {/* ==================== REQUEST DETAILS SECTION ==================== */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 space-y-3 sm:space-y-4"
        >
          {/* Section header */}
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
            <FiDroplet className="text-error text-sm sm:text-base" />
            Request Details
          </h2>

          {/* Responsive grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">

            {/* Required Blood Type */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FaTint className="text-error" size={14} />
                Required Blood Type <span className="text-error">*</span>
              </span>
              <select
                name="bloodType"
                className="select select-bordered select-sm sm:select-md w-full"
                value={form.bloodType}
                onChange={handleChange}
                required
              >
                <option value="">Select blood type</option>
                {bloodTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            {/* Units Required */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FaWeight className="text-info" size={14} />
                Units Required <span className="text-error">*</span>
              </span>
              <input
                type="number"
                min={1}
                max={20}
                name="units"
                className="input input-bordered input-sm sm:input-md w-full"
                value={form.units}
                onChange={handleChange}
                required
              />
            </label>

            {/* Urgency Level */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FaExclamationTriangle className="text-warning" size={14} />
                Urgency <span className="text-error">*</span>
              </span>
              <select
                name="urgency"
                className="select select-bordered select-sm sm:select-md w-full"
                value={form.urgency}
                onChange={handleChange}
                required
              >
                {urgencyOptions.map((item) => (
                  <option key={item} value={item}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            {/* Required By Date */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FiCalendar className="text-primary" size={14} />
                Required By
              </span>
              <input
                type="date"
                name="requiredBy"
                className="input input-bordered input-sm sm:input-md w-full"
                value={form.requiredBy}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]} // Can't select past dates
              />
            </label>

            {/* Request Type */}
            <label className="form-control w-full md:col-span-2">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FiActivity className="text-secondary" size={14} />
                Request Type
              </span>
              <select
                name="requestType"
                className="select select-bordered select-sm sm:select-md w-full"
                value={form.requestType}
                onChange={handleChange}
              >
                {requestTypes.map((item) => (
                  <option key={item} value={item}>
                    {item.split("_").join(" ").replace(/\b\w/g, (m) => m.toUpperCase())}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </motion.section>

        {/* ==================== LOCATION SECTION ==================== */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 space-y-3 sm:space-y-4"
        >
          {/* Section header */}
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
            <FiMapPin className="text-error text-sm sm:text-base" />
            Location
          </h2>

          {/* Responsive grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">

            {/* Hospital Name */}
            <label className="form-control w-full md:col-span-2">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FaBuilding className="text-primary" size={14} />
                Hospital Name
              </span>
              <input
                name="hospitalName"
                type="text"
                className="input input-bordered input-sm sm:input-md w-full"
                value={form.hospitalName}
                onChange={handleChange}
                placeholder="Defaults to patient hospital if empty"
              />
            </label>

            {/* Street Address */}
            <label className="form-control w-full md:col-span-2">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FiHome className="text-info" size={14} />
                Address
              </span>
              <input
                name="address"
                type="text"
                className="input input-bordered input-sm sm:input-md w-full"
                value={form.address}
                onChange={handleChange}
                placeholder="Street address"
              />
            </label>

            {/* City */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FiMap className="text-success" size={14} />
                City
              </span>
              <input
                name="city"
                type="text"
                className="input input-bordered input-sm sm:input-md w-full"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
              />
            </label>

            {/* State */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FaGlobe className="text-warning" size={14} />
                State
              </span>
              <input
                name="state"
                type="text"
                className="input input-bordered input-sm sm:input-md w-full"
                value={form.state}
                onChange={handleChange}
                placeholder="State"
              />
            </label>

            {/* Longitude (for map coordinates) */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FiMapPin className="text-error" size={14} />
                Longitude
              </span>
              <input
                type="number"
                step="any"
                name="longitude"
                className="input input-bordered input-sm sm:input-md w-full"
                value={form.longitude}
                onChange={handleChange}
                placeholder="e.g. 72.8777"
              />
            </label>

            {/* Latitude (for map coordinates) */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FaLocationArrow className="text-primary" size={14} />
                Latitude
              </span>
              <input
                type="number"
                step="any"
                name="latitude"
                className="input input-bordered input-sm sm:input-md w-full"
                value={form.latitude}
                onChange={handleChange}
                placeholder="e.g. 19.0760"
              />
            </label>
          </div>
        </motion.section>

        {/* ==================== ADDITIONAL NOTES SECTION ==================== */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 space-y-3 sm:space-y-4"
        >
          {/* Section header */}
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
            <FiClipboard className="text-error text-sm sm:text-base" />
            Additional Notes
          </h2>

          {/* Notes textarea */}
          <label className="form-control w-full">
            <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
              <FiFileText className="text-warning" size={14} />
              Notes
            </span>
            <textarea
              name="notes"
              rows={4}
              className="textarea textarea-bordered textarea-sm sm:textarea-md w-full"
              value={form.notes}
              onChange={handleChange}
              placeholder="Add any additional medical or urgency notes..."
            />
          </label>
        </motion.section>

        {/* ==================== FORM ACTIONS ==================== */}
        {/* Submit button - full width on mobile, auto on desktop */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-error btn-sm sm:btn-md gap-1 sm:gap-2 w-full sm:w-auto min-w-32 sm:min-w-44"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <FiPlusCircle size={14} className="sm:hidden" />
                <FiPlusCircle size={16} className="hidden sm:inline" />
                <span>Submit Request</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRequest;
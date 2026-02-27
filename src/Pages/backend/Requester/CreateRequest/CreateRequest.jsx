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
} from "react-icons/fi";
import { FaHospital } from "react-icons/fa";

// Hooks
import useAxiosPublic from "../../../../hooks/useAxiosPublic";
import useAuth from "../../../../hooks/useAuth";

// Constants
const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const urgencyOptions = ["normal", "urgent", "emergency"];
const requestTypes = ["whole_blood", "plasma", "platelets"];
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

const initialForm = {
  patientName: "",
  patientAge: "",
  patientBloodGroup: "",
  relationship: "",
  patientHospital: "",
  doctorName: "",
  caseDescription: "",
  bloodType: "",
  units: 1,
  urgency: "normal",
  requiredBy: "",
  requestType: "whole_blood",
  hospitalName: "",
  address: "",
  city: "",
  state: "",
  longitude: "",
  latitude: "",
  notes: "",
};

const CreateRequest = () => {
  const { axiosInstance } = useAxiosPublic();
  const { user } = useAuth();
  const token = localStorage.getItem("auth_token");
  const navigate = useNavigate();
  const isHospital = user?.role === "hospital";

  // States
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);

  // Generic input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Quick reset
  const handleReset = () => {
    setForm(initialForm);
  };

  // Create request submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      await Swal.fire({
        title: "Not Authorized",
        text: "Please log in again to create a request.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    if (!form.patientName || !form.patientBloodGroup || !form.patientHospital) {
      await Swal.fire({
        title: "Missing Patient Info",
        text: "Patient name, blood group, and hospital are required.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    if (!form.bloodType || !form.units || !form.urgency) {
      await Swal.fire({
        title: "Missing Request Details",
        text: "Blood type, units, and urgency are required.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    const hasCoordinates = form.longitude !== "" && form.latitude !== "";

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

    setSubmitting(true);
    try {
      await axiosInstance.post("/blood-requests", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await Swal.fire({
        title: "Request Created",
        text: "Your blood request has been submitted successfully.",
        icon: "success",
        confirmButtonColor: "#ef4444",
        timer: 1700,
        showConfirmButton: false,
      });

      setForm(initialForm);
      navigate(isHospital ? "/hospital/my-requests" : "/requester/my-requests");
    } catch (err) {
      await Swal.fire({
        title: "Request Failed",
        text: err?.response?.data?.error || "Unable to create blood request.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FiPlusCircle className="text-error" />
            Create Blood Request
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            Fill the patient, request, and location details to submit a new request.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="btn btn-outline btn-sm gap-2"
          disabled={submitting}
        >
          <FiRefreshCw size={16} />
          Reset Form
        </button>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Information */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
            <FiUser className="text-error" />
            Patient Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Patient Name *</span>
              <input
                name="patientName"
                className="input input-bordered w-full"
                value={form.patientName}
                onChange={handleChange}
                placeholder="Enter patient name"
                required
              />
            </label>

            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Patient Age</span>
              <input
                type="number"
                min={0}
                name="patientAge"
                className="input input-bordered w-full"
                value={form.patientAge}
                onChange={handleChange}
                placeholder="Enter age"
              />
            </label>

            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Blood Group *</span>
              <select
                name="patientBloodGroup"
                className="select select-bordered w-full"
                value={form.patientBloodGroup}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    patientBloodGroup: value,
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

            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Relationship</span>
              <select
                name="relationship"
                className="select select-bordered w-full"
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

            <label className="form-control w-full md:col-span-2">
              <span className="label-text font-medium mb-1">Hospital *</span>
              <div className="relative">
                <FaHospital className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                <input
                  name="patientHospital"
                  className="input input-bordered w-full pl-10"
                  value={form.patientHospital}
                  onChange={handleChange}
                  placeholder="Hospital where blood is required"
                  required
                />
              </div>
            </label>

            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Doctor Name</span>
              <input
                name="doctorName"
                className="input input-bordered w-full"
                value={form.doctorName}
                onChange={handleChange}
                placeholder="Attending doctor name"
              />
            </label>

            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Case Summary</span>
              <input
                name="caseDescription"
                className="input input-bordered w-full"
                value={form.caseDescription}
                onChange={handleChange}
                placeholder="e.g. Accident - internal bleeding"
              />
            </label>
          </div>
        </motion.section>

        {/* Request Details */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
            <FiDroplet className="text-error" />
            Request Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Required Blood Type *</span>
              <select
                name="bloodType"
                className="select select-bordered w-full"
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

            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Units Required *</span>
              <input
                type="number"
                min={1}
                max={20}
                name="units"
                className="input input-bordered w-full"
                value={form.units}
                onChange={handleChange}
                required
              />
            </label>

            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Urgency *</span>
              <select
                name="urgency"
                className="select select-bordered w-full"
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

            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Required By</span>
              <input
                type="date"
                name="requiredBy"
                className="input input-bordered w-full"
                value={form.requiredBy}
                onChange={handleChange}
              />
            </label>

            <label className="form-control w-full md:col-span-2">
              <span className="label-text font-medium mb-1">Request Type</span>
              <select
                name="requestType"
                className="select select-bordered w-full"
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

        {/* Location */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
            <FiMapPin className="text-error" />
            Location
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="form-control w-full md:col-span-2">
              <span className="label-text font-medium mb-1">Hospital Name</span>
              <input
                name="hospitalName"
                className="input input-bordered w-full"
                value={form.hospitalName}
                onChange={handleChange}
                placeholder="Defaults to patient hospital if empty"
              />
            </label>

            <label className="form-control w-full md:col-span-2">
              <span className="label-text font-medium mb-1">Address</span>
              <input
                name="address"
                className="input input-bordered w-full"
                value={form.address}
                onChange={handleChange}
                placeholder="Street address"
              />
            </label>

            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">City</span>
              <input
                name="city"
                className="input input-bordered w-full"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
              />
            </label>

            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">State</span>
              <input
                name="state"
                className="input input-bordered w-full"
                value={form.state}
                onChange={handleChange}
                placeholder="State"
              />
            </label>

            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Longitude</span>
              <input
                type="number"
                step="any"
                name="longitude"
                className="input input-bordered w-full"
                value={form.longitude}
                onChange={handleChange}
                placeholder="e.g. 72.8777"
              />
            </label>

            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Latitude</span>
              <input
                type="number"
                step="any"
                name="latitude"
                className="input input-bordered w-full"
                value={form.latitude}
                onChange={handleChange}
                placeholder="e.g. 19.0760"
              />
            </label>
          </div>
        </motion.section>

        {/* Notes */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
            <FiClipboard className="text-error" />
            Additional Notes
          </h3>

          <label className="form-control w-full">
            <span className="label-text font-medium mb-1">Notes</span>
            <textarea
              name="notes"
              rows={4}
              className="textarea textarea-bordered w-full"
              value={form.notes}
              onChange={handleChange}
              placeholder="Add any additional medical or urgency notes..."
            />
          </label>
        </motion.section>

        {/* Actions */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-error gap-2 min-w-44"
            disabled={submitting}
          >
            <FiPlusCircle />
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRequest;

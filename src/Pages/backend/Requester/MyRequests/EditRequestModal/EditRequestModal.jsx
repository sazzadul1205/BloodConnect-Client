// Pages/backend/Requester/MyRequests/EditRequestModal/EditRequestModal.jsx

// React
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// sweet alert
import Swal from "sweetalert2";

// Icons
import {
  FaTint,
  FaUser,
  FaHospital,
  FaMapMarkerAlt,
  FaTimes,
  FaEdit,
  FaPlus,
  FaCheckCircle,
  FaExclamationCircle,
  FaCalendarAlt,
  FaWeight,
  FaStethoscope,
  FaPhone,
  FaUserFriends,
} from "react-icons/fa";
import { FiAlertCircle, FiDroplet, FiClipboard } from "react-icons/fi";


// Shared
import BloodLoader from "../../../../../shared/BloodLoader";

// Hooks
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const urgencyLevels = [
  { value: "normal", label: "Normal", color: "info" },
  { value: "urgent", label: "Urgent", color: "warning" },
  { value: "emergency", label: "Emergency", color: "error" },
];
const requestTypes = [
  { value: "whole_blood", label: "Whole Blood", icon: FaTint },
  { value: "plasma", label: "Plasma", icon: FaTint },
  { value: "platelets", label: "Platelets", icon: FaTint },
];
const relationshipOptions = [
  "Father",
  "Mother",
  "Brother",
  "Sister",
  "Spouse",
  "Child",
  "Friend",
  "Self",
  "Other",
];

const EditRequestModal = ({ requestId, onClose, refreshRequests }) => {
  const { axiosInstance } = useAxiosPublic();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(!!requestId);
  const [apiError, setApiError] = useState("");
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    trigger,
  } = useForm({
    defaultValues: {
      // Patient Information
      patientName: "",
      patientAge: "",
      patientBloodGroup: "",
      patientHospital: "",
      patientDoctor: "",
      patientCase: "",
      patientRelationship: "",
      patientPhone: "",

      // Request Details
      bloodType: "",
      units: 1,
      urgency: "normal",
      requiredBy: "",
      requestType: "whole_blood",

      // Location
      hospitalName: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",

      // Additional
      notes: "",
    },
  });

  const selectedBloodType = watch("bloodType");
  const selectedUrgency = watch("urgency");
  const selectedPatientBloodGroup = watch("patientBloodGroup");

  // Fetch existing request data if editing
  useEffect(() => {
    const fetchRequest = async () => {
      if (!requestId) {
        setFetchLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`/blood-requests/${requestId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
        });

        if (response.data?.success) {
          const request = response.data.data;
          const patient = request.patientInfo || {};
          const details = request.requestDetails || {};
          const location = request.location || {};

          setValue("patientName", patient.name || "");
          setValue("patientAge", patient.age || "");
          setValue("patientBloodGroup", patient.bloodGroup || "");
          setValue("patientHospital", patient.hospital || "");
          setValue("patientDoctor", patient.doctorName || "");
          setValue("patientCase", patient.case || "");
          setValue("patientRelationship", patient.relationship || "");

          setValue("bloodType", details.bloodType || "");
          setValue("units", details.units || 1);
          setValue("urgency", details.urgency || "normal");
          setValue("requiredBy", details.requiredBy ? details.requiredBy.split('T')[0] : "");
          setValue("requestType", details.type || "whole_blood");

          setValue("hospitalName", location.hospitalName || "");
          setValue("address", location.address || "");
          setValue("city", location.city || "");
          setValue("state", location.state || "");
          setValue("zipCode", location.zipCode || "");

          setValue("notes", request.status?.notes || "");
        }
      } catch (error) {
        console.error("Error fetching request:", error);
        setApiError("Failed to load request data");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchRequest();
  }, [requestId, axiosInstance, setValue]);

  // Step navigation
  const nextStep = async () => {
    let fieldsToValidate = [];
    if (step === 1) fieldsToValidate = ["patientName", "patientBloodGroup", "patientHospital"];
    if (step === 2) fieldsToValidate = ["bloodType", "units", "urgency"];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError("");

    const requestData = {
      patientInfo: {
        name: data.patientName,
        age: data.patientAge ? parseInt(data.patientAge) : null,
        bloodGroup: data.patientBloodGroup,
        hospital: data.patientHospital,
        doctorName: data.patientDoctor,
        case: data.patientCase,
        relationship: data.patientRelationship,
        phone: data.patientPhone,
      },
      requestDetails: {
        bloodType: data.bloodType,
        units: parseInt(data.units),
        urgency: data.urgency,
        requiredBy: data.requiredBy || null,
        type: data.requestType,
      },
      location: {
        hospitalName: data.hospitalName || data.patientHospital,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
      },
      notes: data.notes,
    };

    try {
      let response;
      if (requestId) {
        // Update existing request
        response = await axiosInstance.patch(`/blood-requests/${requestId}`, requestData, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
        });
      } else {
        // Create new request
        response = await axiosInstance.post("/blood-requests", requestData, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
        });
      }

      if (response.data?.success) {
        await Swal.fire({
          title: "Success!",
          text: requestId ? "Request updated successfully" : "Request created successfully",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          },
        });

        reset();
        if (refreshRequests) refreshRequests();
        onClose();
      }
    } catch (error) {
      console.error("Submit error:", error);
      setApiError(error.response?.data?.error || "Failed to save request");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <BloodLoader fullscreen={false} />;

  return (
    <div className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden bg-base-100">
      {/* Header */}
      <div className="bg-linear-to-r from-error to-error/80 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              {requestId ? <FaEdit size={24} /> : <FaPlus size={24} />}
            </div>
            <div>
              <h3 className="font-bold text-2xl">
                {requestId ? "Edit Blood Request" : "New Blood Request"}
              </h3>
              <p className="text-white/80 text-sm">
                {requestId ? "Update request details" : "Create a new blood request"}
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

      {/* Progress Steps */}
      <div className="px-6 pt-6">
        <ul className="steps steps-horizontal w-full">
          <li className={`step ${step >= 1 ? "step-error" : ""}`}>Patient Info</li>
          <li className={`step ${step >= 2 ? "step-error" : ""}`}>Request Details</li>
          <li className={`step ${step >= 3 ? "step-error" : ""}`}>Location</li>
          <li className={`step ${step >= 4 ? "step-error" : ""}`}>Review</li>
        </ul>
      </div>

      {/* Error Message */}
      {apiError && (
        <div className="px-6 pt-4">
          <div className="alert alert-error shadow-lg">
            <div className="flex items-center gap-2">
              <FaExclamationCircle size={20} />
              <span>{apiError}</span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Patient Information */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-base-200 rounded-lg p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-4">
                  <FaUser className="text-error" />
                  Patient Information
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Patient Name */}
                  <div className="form-control col-span-2">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <FaUser className="text-error" /> Patient Name *
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter patient full name"
                      className={`input input-bordered w-full ${errors.patientName ? "input-error" : ""}`}
                      {...register("patientName", { required: "Patient name is required" })}
                    />
                    {errors.patientName && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.patientName.message}</span>
                      </label>
                    )}
                  </div>

                  {/* Age */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <FaWeight className="text-error" /> Age
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      placeholder="Enter age"
                      className="input input-bordered w-full"
                      {...register("patientAge")}
                    />
                  </div>

                  {/* Blood Group */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <FaTint className="text-error" /> Blood Group *
                      </span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {bloodTypes.map((type) => (
                        <label key={type} className="cursor-pointer">
                          <input
                            type="radio"
                            value={type}
                            className="hidden"
                            {...register("patientBloodGroup", { required: "Blood group is required" })}
                          />
                          <div
                            className={`btn btn-sm w-full ${selectedPatientBloodGroup === type
                              ? "btn-error text-white"
                              : "btn-outline btn-error"
                              }`}
                          >
                            {type}
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.patientBloodGroup && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.patientBloodGroup.message}</span>
                      </label>
                    )}
                  </div>

                  {/* Relationship */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <FaUserFriends className="text-error" /> Relationship
                      </span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      {...register("patientRelationship")}
                    >
                      <option value="">Select relationship</option>
                      {relationshipOptions.map(option => (
                        <option key={option} value={option.toLowerCase()}>{option}</option>
                      ))}
                    </select>
                  </div>

                  {/* Phone */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <FaPhone className="text-error" /> Contact Phone
                      </span>
                    </label>
                    <input
                      type="tel"
                      placeholder="Patient's phone"
                      className="input input-bordered w-full"
                      {...register("patientPhone")}
                    />
                  </div>

                  {/* Hospital */}
                  <div className="form-control col-span-2">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <FaHospital className="text-error" /> Hospital *
                      </span>
                    </label>
                    <div className="relative">
                      <FaHospital className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                      <input
                        type="text"
                        placeholder="Hospital where blood is required"
                        className={`input input-bordered w-full pl-10 ${errors.patientHospital ? "input-error" : ""}`}
                        {...register("patientHospital", { required: "Hospital is required" })}
                      />
                    </div>
                    {errors.patientHospital && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.patientHospital.message}</span>
                      </label>
                    )}
                  </div>

                  {/* Doctor Name */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <FaStethoscope className="text-error" /> Doctor Name
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="Attending doctor"
                      className="input input-bordered w-full"
                      {...register("patientDoctor")}
                    />
                  </div>

                  {/* Medical Case */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Medical Case</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Surgery, Accident"
                      className="input input-bordered w-full"
                      {...register("patientCase")}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Request Details */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-base-200 rounded-lg p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-4">
                  <FiDroplet className="text-error" />
                  Request Details
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Blood Type */}
                  <div className="form-control col-span-2">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <FaTint className="text-error" /> Blood Type Required *
                      </span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {bloodTypes.map((type) => (
                        <label key={type} className="cursor-pointer">
                          <input
                            type="radio"
                            value={type}
                            className="hidden"
                            {...register("bloodType", { required: "Blood type is required" })}
                          />
                          <div
                            className={`btn btn-sm w-full ${selectedBloodType === type
                              ? "btn-error text-white"
                              : "btn-outline btn-error"
                              }`}
                          >
                            {type}
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.bloodType && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.bloodType.message}</span>
                      </label>
                    )}
                  </div>

                  {/* Units */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Units Required *</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      className={`input input-bordered w-full ${errors.units ? "input-error" : ""}`}
                      {...register("units", {
                        required: "Units are required",
                        min: { value: 1, message: "Minimum 1 unit" },
                        max: { value: 20, message: "Maximum 20 units" }
                      })}
                    />
                    {errors.units && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.units.message}</span>
                      </label>
                    )}
                  </div>

                  {/* Request Type */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Request Type</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      {...register("requestType")}
                    >
                      {requestTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Urgency */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <FiAlertCircle className="text-error" /> Urgency *
                      </span>
                    </label>
                    <div className="flex gap-2">
                      {urgencyLevels.map(level => (
                        <label key={level.value} className="cursor-pointer flex-1">
                          <input
                            type="radio"
                            value={level.value}
                            className="hidden"
                            {...register("urgency", { required: "Urgency is required" })}
                          />
                          <div
                            className={`btn btn-sm w-full ${selectedUrgency === level.value
                              ? `btn-${level.color} text-white`
                              : `btn-outline btn-${level.color}`
                              }`}
                          >
                            {level.label}
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.urgency && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.urgency.message}</span>
                      </label>
                    )}
                  </div>

                  {/* Required By */}
                  <div className="form-control col-span-2">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <FaCalendarAlt className="text-error" /> Required By
                      </span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered w-full"
                      {...register("requiredBy")}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-base-200 rounded-lg p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-4">
                  <FaMapMarkerAlt className="text-error" />
                  Location Details
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Hospital Name */}
                  <div className="form-control col-span-2">
                    <label className="label">
                      <span className="label-text">Hospital Name (if different)</span>
                    </label>
                    <div className="relative">
                      <FaHospital className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                      <input
                        type="text"
                        placeholder="Leave empty to use patient's hospital"
                        className="input input-bordered w-full pl-10"
                        {...register("hospitalName")}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="form-control col-span-2">
                    <label className="label">
                      <span className="label-text">Street Address</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Street address"
                      className="input input-bordered w-full"
                      {...register("address")}
                    />
                  </div>

                  {/* City */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">City</span>
                    </label>
                    <input
                      type="text"
                      placeholder="City"
                      className="input input-bordered w-full"
                      {...register("city")}
                    />
                  </div>

                  {/* State */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">State</span>
                    </label>
                    <input
                      type="text"
                      placeholder="State"
                      className="input input-bordered w-full"
                      {...register("state")}
                    />
                  </div>

                  {/* Zip Code */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Zip Code</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Zip code"
                      className="input input-bordered w-full"
                      {...register("zipCode")}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-base-200 rounded-lg p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-4">
                  <FiClipboard className="text-error" />
                  Additional Notes
                </h4>
                <textarea
                  className="textarea textarea-bordered w-full h-24"
                  placeholder="Any additional information or special instructions..."
                  {...register("notes")}
                />
              </div>
            </motion.div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="alert alert-info bg-info/10 border-info/20">
                <FaCheckCircle className="text-info" />
                <span className="text-primary" >Please review the request details before submitting.</span>
              </div>

              {/* Patient Info Review */}
              <div className="bg-base-200 rounded-lg p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <FaUser className="text-error" />
                  Patient Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="opacity-70">Name</p>
                    <p className="font-medium">{watch("patientName") || "—"}</p>
                  </div>
                  <div>
                    <p className="opacity-70">Age</p>
                    <p className="font-medium">{watch("patientAge") || "—"}</p>
                  </div>
                  <div>
                    <p className="opacity-70">Blood Group</p>
                    <p className="font-medium text-error">{watch("patientBloodGroup") || "—"}</p>
                  </div>
                  <div>
                    <p className="opacity-70">Relationship</p>
                    <p className="font-medium capitalize">{watch("patientRelationship") || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="opacity-70">Hospital</p>
                    <p className="font-medium">{watch("patientHospital") || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Request Details Review */}
              <div className="bg-base-200 rounded-lg p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <FiDroplet className="text-error" />
                  Request Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="opacity-70">Blood Type</p>
                    <p className="font-medium text-error">{watch("bloodType") || "—"}</p>
                  </div>
                  <div>
                    <p className="opacity-70">Units</p>
                    <p className="font-medium">{watch("units") || "—"}</p>
                  </div>
                  <div>
                    <p className="opacity-70">Urgency</p>
                    <p className={`font-medium text-${urgencyLevels.find(u => u.value === watch("urgency"))?.color || 'base-content'}`}>
                      {watch("urgency") || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="opacity-70">Request Type</p>
                    <p className="font-medium">{(watch("requestType") || "").replace('_', ' ')}</p>
                  </div>
                </div>
              </div>

              {/* Location Review */}
              <div className="bg-base-200 rounded-lg p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <FaMapMarkerAlt className="text-error" />
                  Location
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2">
                    <p className="opacity-70">Hospital</p>
                    <p className="font-medium">{watch("hospitalName") || watch("patientHospital") || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="opacity-70">Address</p>
                    <p className="font-medium">{watch("address") || "—"}</p>
                  </div>
                  <div>
                    <p className="opacity-70">City</p>
                    <p className="font-medium">{watch("city") || "—"}</p>
                  </div>
                  <div>
                    <p className="opacity-70">State</p>
                    <p className="font-medium">{watch("state") || "—"}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-action border-t border-base-300 p-4 bg-base-200/50">
          <div className="flex justify-between w-full">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="btn btn-outline btn-error"
              >
                ← Previous
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn btn-error text-white ml-auto"
              >
                Next →
              </button>
            ) : (
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
                  disabled={loading}
                  className="btn btn-error text-white gap-2"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      {requestId ? <FaEdit /> : <FaPlus />}
                      {requestId ? "Update Request" : "Create Request"}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditRequestModal;
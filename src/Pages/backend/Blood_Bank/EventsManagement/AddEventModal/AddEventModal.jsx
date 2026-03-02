// Pages/backend/BloodBank/EventsManagement/AddEventModal/AddEventModal.jsx

// React
import React, { useState } from "react";
import { useForm } from "react-hook-form";

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUsers,
  FaTint,
  FaExclamationTriangle,
  FaTimes,
  FaCheckCircle,
  FaHeartbeat,
  FaAmbulance,
} from "react-icons/fa";
import { FiCalendar, FiClock } from "react-icons/fi";

// Hooks
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";

// ==================== CONSTANTS ====================

/**
 * Event types configuration
 */
const eventTypes = [
  {
    value: "camp",
    label: "Blood Camp",
    icon: FaCalendarAlt,
    color: "success",
    selectedClasses: "border-success bg-success/10",
    textClass: "text-success",
    description: "Organized camp at a specific location",
  },
  {
    value: "drive",
    label: "Blood Drive",
    icon: FaHeartbeat,
    color: "info",
    selectedClasses: "border-info bg-info/10",
    textClass: "text-info",
    description: "Mobile blood collection drive",
  },
  {
    value: "emergency",
    label: "Emergency",
    icon: FaAmbulance,
    color: "error",
    selectedClasses: "border-error bg-error/10",
    textClass: "text-error",
    description: "Urgent blood collection needed",
  },
];

/**
 * Blood types for selection
 */
const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ==================== ANIMATION VARIANTS ====================

const stepVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

// ==================== MAIN COMPONENT ====================

/**
 * Add Event Modal Component
 * Multi-step form for creating new donation events
 * 
 * @param {string} bankId - ID of the blood bank
 * @param {Function} onClose - Function to close the modal
 * @param {Function} refreshEvents - Function to refresh events list
 */
const AddEventModal = ({ bankId, onClose, refreshEvents }) => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // ==================== STATE MANAGEMENT ====================

  const [step, setStep] = useState(1);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  // ==================== FORM HANDLING ====================

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      type: "camp",
      location: {
        venue: "",
        address: "",
        city: "",
        coordinates: [0, 0],
      },
      schedule: {
        startDate: "",
        endDate: "",
        startTime: "09:00",
        endTime: "17:00",
      },
      capacity: {
        maxDonors: 100,
        walkIns: true,
      },
      requirements: {
        bloodTypes: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        minAge: 18,
        maxAge: 65,
        minWeight: 50,
      },
    },
  });

  // Watch form values for dynamic UI updates
  const selectedType = watch("type");
  const selectedBloodTypes = watch("requirements.bloodTypes") || [];

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Toggle blood type selection
   */
  const toggleBloodType = (type) => {
    const current = selectedBloodTypes;
    if (current.includes(type)) {
      setValue("requirements.bloodTypes", current.filter(t => t !== type));
    } else {
      setValue("requirements.bloodTypes", [...current, type]);
    }
  };

  /**
   * Select all blood types
   */
  const selectAllBloodTypes = () => {
    setValue("requirements.bloodTypes", [...bloodTypes]);
  };

  /**
   * Clear all blood types
   */
  const clearAllBloodTypes = () => {
    setValue("requirements.bloodTypes", []);
  };

  /**
   * Close modal and reset form
   */
  const closeModal = () => {
    reset();
    setStep(1);
    setApiError("");
    onClose();
  };

  /**
   * Validate and move to next step
   */
  const nextStep = async () => {
    setApiError("");
    let fieldsToValidate = [];

    // Validate fields based on current step
    if (step === 1) {
      fieldsToValidate = ["title", "type"];
    }
    if (step === 2) {
      fieldsToValidate = [
        "location.venue",
        "location.address",
        "location.city",
      ];
    }
    if (step === 3) {
      fieldsToValidate = [
        "schedule.startDate",
        "schedule.endDate",
      ];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  /**
   * Go to previous step
   */
  const prevStep = () => {
    setApiError("");
    setStep(step - 1);
  };

  /**
   * Form submission handler
   */
  const onSubmit = async (data) => {
    setLoading(true);
    setApiError("");

    // Validate bank ID
    if (!bankId) {
      setApiError("Blood bank ID not found");
      setLoading(false);
      return;
    }

    // Validate blood type selection
    if (data.requirements.bloodTypes.length === 0) {
      setApiError("Please select at least one blood type");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...data,
        bloodBankId: bankId,
      };

      const response = await axiosInstance.post("/donation-events", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        closeModal();
        refreshEvents();

        await Swal.fire({
          title: "Event Created",
          text: "Donation event has been created successfully.",
          icon: "success",
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
            title: "text-lg font-bold text-error",
            confirmButton: "btn btn-sm btn-error",
          },
          buttonsStyling: false,
        });
      }
    } catch (error) {
      console.error("Failed to create event:", error);
      setApiError(
        error.response?.data?.error || "Failed to create event. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER ====================

  return (
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="md:modal-box w-11/12 max-w-3xl p-0 overflow-hidden bg-base-100 mx-2 sm:mx-0"
    >

      {/* ==================== MODAL HEADER ==================== */}
      <div className="bg-linear-to-r from-error to-error/80 p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

          {/* Title and icon */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-white/20 p-2 sm:p-3 rounded-full">
              <FaCalendarAlt size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-2xl">Create Donation Event</h2>
              <p className="text-white/80 text-xs sm:text-sm">Organize a blood donation camp or drive</p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={closeModal}
            className="btn btn-ghost btn-xs sm:btn-sm btn-circle text-white hover:bg-white/20 self-end sm:self-auto"
            aria-label="Close modal"
          >
            <FaTimes size={14} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* ==================== PROGRESS STEPS ==================== */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="steps steps-horizontal w-full overflow-x-auto pb-2 flex-nowrap">
          <div className={`step step-xs sm:step-md ${step >= 1 ? "step-error" : ""}`}>Event Info</div>
          <div className={`step step-xs sm:step-md ${step >= 2 ? "step-error" : ""}`}>Location</div>
          <div className={`step step-xs sm:step-md ${step >= 3 ? "step-error" : ""}`}>Schedule</div>
          <div className={`step step-xs sm:step-md ${step >= 4 ? "step-error" : ""}`}>Capacity</div>
          <div className={`step step-xs sm:step-md ${step >= 5 ? "step-error" : ""}`}>Requirements</div>
        </div>
      </div>

      {/* ==================== API ERROR DISPLAY ==================== */}
      <AnimatePresence>
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 sm:px-6 pt-4"
          >
            <div className="alert alert-error shadow-lg p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <FaExclamationTriangle size={16} className="sm:w-5 sm:h-5 shrink-0" />
                <span className="text-xs sm:text-sm">{apiError}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-4 sm:p-6 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">

          {/* ==================== STEP 1: EVENT INFORMATION ==================== */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-3 sm:space-y-4"
            >
              {/* Event Title */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaCalendarAlt className="text-error" size={12} />
                    Event Title *
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Summer Blood Drive 2024"
                  className={`input input-bordered input-sm sm:input-md w-full ${errors.title ? "input-error" : ""}`}
                  {...register("title", {
                    required: "Event title is required",
                    minLength: {
                      value: 5,
                      message: "Title must be at least 5 characters",
                    },
                  })}
                />
                {errors.title && (
                  <label className="label py-1">
                    <span className="label-text-alt text-error text-xs">{errors.title.message}</span>
                  </label>
                )}
              </div>

              {/* Description */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm">Description</span>
                </label>
                <textarea
                  placeholder="Describe your event, purpose, instructions..."
                  className="textarea textarea-bordered textarea-sm sm:textarea-md h-20 sm:h-24 w-full"
                  {...register("description")}
                />
              </div>

              {/* Event Type Selection */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaHeartbeat className="text-error" size={12} />
                    Event Type *
                  </span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {eventTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.value;
                    return (
                      <label
                        key={type.value}
                        className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                          ? type.selectedClasses
                          : "border-base-300 hover:border-error/50"
                          }`}
                      >
                        <input
                          type="radio"
                          value={type.value}
                          className="hidden"
                          {...register("type", {
                            required: "Please select event type",
                          })}
                        />
                        <Icon className={`text-base sm:text-xl ${isSelected ? type.textClass : "text-gray-400"}`} />
                        <div className="flex-1">
                          <p className={`font-semibold text-xs sm:text-sm ${isSelected ? type.textClass : ""}`}>
                            {type.label}
                          </p>
                          <p className="text-[10px] sm:text-xs opacity-70">{type.description}</p>
                        </div>
                        {isSelected && <FaCheckCircle className={`${type.textClass} text-xs sm:text-sm`} />}
                      </label>
                    );
                  })}
                </div>
                {errors.type && (
                  <label className="label py-1">
                    <span className="label-text-alt text-error text-xs">{errors.type.message}</span>
                  </label>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== STEP 2: LOCATION ==================== */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-3 sm:space-y-4"
            >
              {/* Venue Name */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaMapMarkerAlt className="text-error" size={12} />
                    Venue Name *
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Community Hall, City Convention Center"
                  className={`input input-bordered input-sm sm:input-md w-full ${errors.location?.venue ? "input-error" : ""}`}
                  {...register("location.venue", {
                    required: "Venue name is required",
                  })}
                />
                {errors.location?.venue && (
                  <label className="label py-1">
                    <span className="label-text-alt text-error text-xs">{errors.location.venue.message}</span>
                  </label>
                )}
              </div>

              {/* Street Address */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm">Street Address</span>
                </label>
                <input
                  type="text"
                  placeholder="Street address"
                  className="input input-bordered input-sm sm:input-md w-full"
                  {...register("location.address")}
                />
              </div>

              {/* City */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm">City *</span>
                </label>
                <input
                  type="text"
                  placeholder="City"
                  className={`input input-bordered input-sm sm:input-md w-full ${errors.location?.city ? "input-error" : ""}`}
                  {...register("location.city", {
                    required: "City is required",
                  })}
                />
                {errors.location?.city && (
                  <label className="label py-1">
                    <span className="label-text-alt text-error text-xs">{errors.location.city.message}</span>
                  </label>
                )}
              </div>

              {/* Coordinates */}
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-medium text-sm sm:text-base">
                    Coordinates
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  {/* Longitude */}
                  <div>
                    <input
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      placeholder="Longitude (e.g. 90.4125)"
                      className="input input-bordered input-sm sm:input-md w-full"
                      {...register("location.coordinates.0", {
                        valueAsNumber: true,
                      })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Range: -180 to 180
                    </p>
                  </div>

                  {/* Latitude */}
                  <div>
                    <input
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      placeholder="Latitude (e.g. 23.8103)"
                      className="input input-bordered input-sm sm:input-md w-full"
                      {...register("location.coordinates.1", {
                        valueAsNumber: true,
                      })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Range: -90 to 90
                    </p>
                  </div>

                </div>

                <label className="label pt-1">
                  <span className="label-text-alt text-gray-500">
                    Use decimal format. Example: 90.4125, 23.8103
                  </span>
                </label>
              </div>
            </motion.div>
          )}

          {/* ==================== STEP 3: SCHEDULE ==================== */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-3 sm:space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Start Date */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                      <FiCalendar className="text-error" size={12} />
                      Start Date *
                    </span>
                  </label>
                  <input
                    type="date"
                    className={`input input-bordered input-sm sm:input-md w-full ${errors.schedule?.startDate ? "input-error" : ""}`}
                    {...register("schedule.startDate", {
                      required: "Start date is required",
                    })}
                  />
                  {errors.schedule?.startDate && (
                    <label className="label py-1">
                      <span className="label-text-alt text-error text-xs">{errors.schedule.startDate.message}</span>
                    </label>
                  )}
                </div>

                {/* End Date */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                      <FiCalendar className="text-error" size={12} />
                      End Date *
                    </span>
                  </label>
                  <input
                    type="date"
                    className={`input input-bordered input-sm sm:input-md w-full ${errors.schedule?.endDate ? "input-error" : ""}`}
                    {...register("schedule.endDate", {
                      required: "End date is required",
                      validate: (value) => {
                        const start = new Date(watch("schedule.startDate"));
                        const end = new Date(value);
                        return end >= start || "End date must be after start date";
                      },
                    })}
                  />
                  {errors.schedule?.endDate && (
                    <label className="label py-1">
                      <span className="label-text-alt text-error text-xs">{errors.schedule.endDate.message}</span>
                    </label>
                  )}
                </div>

                {/* Start Time */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                      <FiClock className="text-error" size={12} />
                      Start Time
                    </span>
                  </label>
                  <input
                    type="time"
                    className="input input-bordered input-sm sm:input-md w-full"
                    {...register("schedule.startTime")}
                  />
                </div>

                {/* End Time */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                      <FiClock className="text-error" size={12} />
                      End Time
                    </span>
                  </label>
                  <input
                    type="time"
                    className="input input-bordered input-sm sm:input-md w-full"
                    {...register("schedule.endTime")}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== STEP 4: CAPACITY ==================== */}
          {step === 4 && (
            <motion.div
              key="step4"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-3 sm:space-y-4"
            >
              {/* Maximum Donors */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaUsers className="text-error" size={12} />
                    Maximum Donors
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  className="input input-bordered input-sm sm:input-md w-full"
                  {...register("capacity.maxDonors")}
                />
              </div>

              {/* Walk-ins Allowed */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-2 sm:gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-error checkbox-sm sm:checkbox-md"
                    {...register("capacity.walkIns")}
                  />
                  <span className="label-text text-xs sm:text-sm">Allow walk-in donors (without registration)</span>
                </label>
              </div>
            </motion.div>
          )}

          {/* ==================== STEP 5: REQUIREMENTS ==================== */}
          {step === 5 && (
            <motion.div
              key="step5"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-3 sm:space-y-4"
            >
              {/* Blood Types Selection */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaTint className="text-error" size={12} />
                    Accepted Blood Types
                  </span>
                </label>

                {/* Blood Type Action Buttons */}
                <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    type="button"
                    onClick={selectAllBloodTypes}
                    className="btn btn-xs sm:btn-sm btn-outline btn-error"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearAllBloodTypes}
                    className="btn btn-xs sm:btn-sm btn-outline"
                  >
                    Clear All
                  </button>
                </div>

                {/* Blood Type Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {bloodTypes.map((type) => (
                    <label key={type} className="cursor-pointer">
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={selectedBloodTypes.includes(type)}
                        onChange={() => toggleBloodType(type)}
                      />
                      <div
                        className={`btn btn-xs sm:btn-sm w-full ${selectedBloodTypes.includes(type)
                          ? "btn-error text-white"
                          : "btn-outline btn-error"
                          }`}
                      >
                        {type}
                      </div>
                    </label>
                  ))}
                </div>

                {/* Validation Message */}
                {selectedBloodTypes.length === 0 && (
                  <label className="label py-1">
                    <span className="label-text-alt text-warning text-xs">
                      Select at least one blood type
                    </span>
                  </label>
                )}
              </div>

              {/* Age and Weight Requirements */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Minimum Age */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm">Minimum Age</span>
                  </label>
                  <input
                    type="number"
                    min="16"
                    max="100"
                    className="input input-bordered input-sm sm:input-md w-full"
                    {...register("requirements.minAge")}
                  />
                </div>

                {/* Maximum Age */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm">Maximum Age</span>
                  </label>
                  <input
                    type="number"
                    min="16"
                    max="100"
                    className="input input-bordered input-sm sm:input-md w-full"
                    {...register("requirements.maxAge")}
                  />
                </div>

                {/* Minimum Weight */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm">Minimum Weight (kg)</span>
                  </label>
                  <input
                    type="number"
                    min="30"
                    step="0.1"
                    className="input input-bordered input-sm sm:input-md w-full"
                    {...register("requirements.minWeight")}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* ==================== FOOTER ACTIONS ==================== */}
        <div className="modal-action border-t border-base-300 bg-base-200/40 px-4 py-4">
          <div className="flex flex-row items-center justify-between gap-3 w-full">

            {/* LEFT: Previous */}
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="btn btn-outline btn-error btn-sm sm:btn-md w-1/2 sm:w-auto flex items-center gap-2"
              >
                <FaTimes className="rotate-45 text-sm" />
                <span>Previous</span>
              </button>
            ) : (
              <div />
            )}

            {/* RIGHT: Next / Submit */}
            <div className="flex flex-col sm:flex-row gap-2 w-1/2 sm:w-auto sm:ml-auto">

              {step < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-error text-white btn-sm sm:btn-md w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <span>Next</span>
                  <FaCheckCircle className="text-sm" />
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={loading || selectedBloodTypes.length === 0}
                    className="btn btn-error text-white btn-sm sm:btn-md gap-2 w-full sm:w-auto flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <FaCalendarAlt className="text-sm" />
                        <span>Create Event</span>
                      </>
                    )}
                  </button>
                </>
              )}

            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default AddEventModal;
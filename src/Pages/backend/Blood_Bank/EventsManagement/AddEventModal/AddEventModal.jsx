// Pages/backend/BloodBank/EventsManagement/AddEventModal/AddEventModal.jsx

// React
import React, { useState } from "react";
import { useForm } from "react-hook-form";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUsers,
  FaTint,
  FaExclamationTriangle,
  FaTimes,
  FaPlus,
  FaCheckCircle,
  FaHeartbeat,
  FaAmbulance,
} from "react-icons/fa";
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiDroplet } from "react-icons/fi";

// Hooks
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";

const AddEventModal = ({ bankId, onClose, refreshEvents }) => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // States
  const [step, setStep] = useState(1);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  // Form handling
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

  // Watch form values
  const selectedType = watch("type");
  const selectedBloodTypes = watch("requirements.bloodTypes") || [];

  // Event types
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

  // Blood types
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // Toggle blood type selection
  const toggleBloodType = (type) => {
    const current = selectedBloodTypes;
    if (current.includes(type)) {
      setValue("requirements.bloodTypes", current.filter(t => t !== type));
    } else {
      setValue("requirements.bloodTypes", [...current, type]);
    }
  };

  // Select all blood types
  const selectAllBloodTypes = () => {
    setValue("requirements.bloodTypes", [...bloodTypes]);
  };

  // Clear all blood types
  const clearAllBloodTypes = () => {
    setValue("requirements.bloodTypes", []);
  };

  // Handle coordinates change
  const handleCoordinatesChange = (index, value) => {
    const currentCoords = watch("location.coordinates");
    const newCoords = [...currentCoords];
    newCoords[index] = parseFloat(value) || 0;
    setValue("location.coordinates", newCoords);
  };

  // Close Modal
  const closeModal = () => {
    reset();
    setStep(1);
    setApiError("");
    onClose();
  };

  // Step Next handler
  const nextStep = async () => {
    setApiError("");
    let fieldsToValidate = [];

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

  // Step Prev handler
  const prevStep = () => {
    setApiError("");
    setStep(step - 1);
  };

  // Submit handler
  const onSubmit = async (data) => {
    setLoading(true);
    setApiError("");

    // Ensure blood bank ID is included
    if (!bankId) {
      setApiError("Blood bank ID not found");
      setLoading(false);
      return;
    }

    // Ensure at least one blood type is selected
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
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
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

  return (
    <div className="modal-box w-11/12 max-w-3xl p-0 overflow-hidden bg-base-100">
      {/* Header */}
      <div className="bg-linear-to-r from-error to-error/80 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <FaCalendarAlt size={24} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">Create Donation Event</h3>
              <p className="text-white/80 text-sm">Organize a blood donation camp or drive</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20"
          >
            <FaTimes size={20} />
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-6 pt-6">
        <div className="steps steps-horizontal w-full">
          <div className={`step ${step >= 1 ? "step-error" : ""}`}>Event Info</div>
          <div className={`step ${step >= 2 ? "step-error" : ""}`}>Location</div>
          <div className={`step ${step >= 3 ? "step-error" : ""}`}>Schedule</div>
          <div className={`step ${step >= 4 ? "step-error" : ""}`}>Capacity</div>
          <div className={`step ${step >= 5 ? "step-error" : ""}`}>Requirements</div>
        </div>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="px-6 pt-4">
          <div className="alert alert-error shadow-lg">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle size={20} />
              <span>{apiError}</span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Event Information */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaCalendarAlt className="text-error" /> Event Title *
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Summer Blood Drive 2024"
                  className={`input input-bordered w-full ${errors.title ? "input-error" : ""}`}
                  {...register("title", {
                    required: "Event title is required",
                    minLength: {
                      value: 5,
                      message: "Title must be at least 5 characters",
                    },
                  })}
                />
                {errors.title && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.title.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control flex-row">
                <label className="label w-full">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  placeholder="Describe your event, purpose, instructions..."
                  className="textarea textarea-bordered h-24 w-full"
                  {...register("description")}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaHeartbeat className="text-error" /> Event Type *
                  </span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {eventTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.value;
                    return (
                      <label
                        key={type.value}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${isSelected
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
                        <Icon className={`text-xl ${isSelected ? type.textClass : "text-gray-400"}`} />
                        <div className="flex-1">
                          <p className={`font-semibold ${isSelected ? type.textClass : ""}`}>
                            {type.label}
                          </p>
                          <p className="text-xs opacity-70">{type.description}</p>
                        </div>
                        {isSelected && <FaCheckCircle className={type.textClass} />}
                      </label>
                    );
                  })}
                </div>
                {errors.type && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.type.message}</span>
                  </label>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaMapMarkerAlt className="text-error" /> Venue Name *
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Community Hall, City Convention Center"
                  className={`input input-bordered w-full ${errors.location?.venue ? "input-error" : ""}`}
                  {...register("location.venue", {
                    required: "Venue name is required",
                  })}
                />
                {errors.location?.venue && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.location.venue.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Street Address</span>
                </label>
                <input
                  type="text"
                  placeholder="Street address"
                  className={`input input-bordered w-full ${errors.location?.address ? "input-error" : ""}`}
                  {...register("location.address")}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">City *</span>
                </label>
                <input
                  type="text"
                  placeholder="City"
                  className={`input input-bordered w-full ${errors.location?.city ? "input-error" : ""}`}
                  {...register("location.city", {
                    required: "City is required",
                  })}
                />
                {errors.location?.city && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.location.city.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Coordinates (Longitude, Latitude)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    className="input input-bordered flex-1"
                    onChange={(e) => handleCoordinatesChange(0, e.target.value)}
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    className="input input-bordered flex-1"
                    onChange={(e) => handleCoordinatesChange(1, e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Schedule */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FiCalendar className="text-error" /> Start Date *
                    </span>
                  </label>
                  <input
                    type="date"
                    className={`input input-bordered w-full ${errors.schedule?.startDate ? "input-error" : ""}`}
                    {...register("schedule.startDate", {
                      required: "Start date is required",
                    })}
                  />
                  {errors.schedule?.startDate && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.schedule.startDate.message}</span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FiCalendar className="text-error" /> End Date *
                    </span>
                  </label>
                  <input
                    type="date"
                    className={`input input-bordered w-full ${errors.schedule?.endDate ? "input-error" : ""}`}
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
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.schedule.endDate.message}</span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FiClock className="text-error" /> Start Time
                    </span>
                  </label>
                  <input
                    type="time"
                    className="input input-bordered w-full"
                    {...register("schedule.startTime")}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FiClock className="text-error" /> End Time
                    </span>
                  </label>
                  <input
                    type="time"
                    className="input input-bordered w-full"
                    {...register("schedule.endTime")}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Capacity */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaUsers className="text-error" /> Maximum Donors
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  className="input input-bordered w-full"
                  {...register("capacity.maxDonors")}
                />
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-error"
                    {...register("capacity.walkIns")}
                  />
                  <span className="label-text">Allow walk-in donors (without registration)</span>
                </label>
              </div>
            </motion.div>
          )}

          {/* Step 5: Requirements */}
          {step === 5 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaTint className="text-error" /> Accepted Blood Types
                  </span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    type="button"
                    onClick={selectAllBloodTypes}
                    className="btn btn-xs btn-outline btn-error"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearAllBloodTypes}
                    className="btn btn-xs btn-outline"
                  >
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {bloodTypes.map((type) => (
                    <label key={type} className="cursor-pointer">
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={selectedBloodTypes.includes(type)}
                        onChange={() => toggleBloodType(type)}
                      />
                      <div
                        className={`btn btn-sm w-full ${selectedBloodTypes.includes(type)
                            ? "btn-error text-white"
                            : "btn-outline btn-error"
                          }`}
                      >
                        {type}
                      </div>
                    </label>
                  ))}
                </div>
                {selectedBloodTypes.length === 0 && (
                  <label className="label">
                    <span className="label-text-alt text-warning">
                      Select at least one blood type
                    </span>
                  </label>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Minimum Age</span>
                  </label>
                  <input
                    type="number"
                    min="16"
                    max="100"
                    className="input input-bordered w-full"
                    {...register("requirements.minAge")}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Maximum Age</span>
                  </label>
                  <input
                    type="number"
                    min="16"
                    max="100"
                    className="input input-bordered w-full"
                    {...register("requirements.maxAge")}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Minimum Weight (kg)</span>
                  </label>
                  <input
                    type="number"
                    min="30"
                    step="0.1"
                    className="input input-bordered w-full"
                    {...register("requirements.minWeight")}
                  />
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
            {step < 5 ? (
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
                  onClick={closeModal}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedBloodTypes.length === 0}
                  className="btn btn-error text-white gap-2"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaCalendarAlt />
                      Create Event
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

export default AddEventModal;

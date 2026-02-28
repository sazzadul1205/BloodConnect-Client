// Pages/backend/BloodBank/EventsManagement/EditEventModal/EditEventModal.jsx

// React
import React, { useState, useEffect } from "react";
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
  FaSave,
} from "react-icons/fa";
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiDroplet } from "react-icons/fi";

// Hooks
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";
import BloodLoader from "../../../../../shared/BloodLoader";

const EditEventModal = ({ eventId, onClose, refreshEvents }) => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // States
  const [step, setStep] = useState(1);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [eventData, setEventData] = useState(null);

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
        bloodTypes: [],
        minAge: 18,
        maxAge: 65,
        minWeight: 50,
      },
    },
  });

  // Watch form values
  const selectedBloodTypes = watch("requirements.bloodTypes") || [];

  // Event types
  const eventTypes = [
    { value: "camp", label: "Blood Camp", icon: FaCalendarAlt, color: "success", description: "Organized camp at a specific location" },
    { value: "drive", label: "Blood Drive", icon: FaHeartbeat, color: "info", description: "Mobile blood collection drive" },
    { value: "emergency", label: "Emergency", icon: FaAmbulance, color: "error", description: "Urgent blood collection needed" },
  ];

  // Blood types
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // Fetch event data
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) {
        setFetchLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`/donation-events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data?.success) {
          const event = response.data.data;
          setEventData(event);

          // Format dates for input fields
          const startDate = event.schedule?.startDate
            ? new Date(event.schedule.startDate).toISOString().split('T')[0]
            : "";
          const endDate = event.schedule?.endDate
            ? new Date(event.schedule.endDate).toISOString().split('T')[0]
            : "";

          // Populate form
          reset({
            title: event.title || "",
            description: event.description || "",
            type: event.type || "camp",
            location: {
              venue: event.location?.venue || "",
              address: event.location?.address || "",
              city: event.location?.city || "",
              coordinates: event.location?.coordinates?.coordinates || [0, 0],
            },
            schedule: {
              startDate: startDate,
              endDate: endDate,
              startTime: event.schedule?.startTime || "09:00",
              endTime: event.schedule?.endTime || "17:00",
            },
            capacity: {
              maxDonors: event.capacity?.maxDonors || 100,
              walkIns: event.capacity?.walkIns !== undefined ? event.capacity.walkIns : true,
            },
            requirements: {
              bloodTypes: event.requirements?.bloodTypes || [],
              minAge: event.requirements?.minAge || 18,
              maxAge: event.requirements?.maxAge || 65,
              minWeight: event.requirements?.minWeight || 50,
            },
          });
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        setApiError("Failed to load event data");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, axiosInstance, token, reset]);

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
    // Check if event can be edited
    if (eventData?.status?.current === "completed" || eventData?.status?.current === "cancelled") {
      setApiError("Cannot edit completed or cancelled events");
      return;
    }

    setLoading(true);
    setApiError("");

    // Ensure at least one blood type is selected
    if (data.requirements.bloodTypes.length === 0) {
      setApiError("Please select at least one blood type");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        title: data.title,
        description: data.description,
        location: data.location,
        schedule: data.schedule,
        capacity: data.capacity,
        requirements: data.requirements,
      };

      const response = await axiosInstance.patch(`/donation-events/${eventId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        closeModal();
        refreshEvents();

        await Swal.fire({
          title: "Event Updated",
          text: "Donation event has been updated successfully.",
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
      console.error("Failed to update event:", error);
      setApiError(
        error.response?.data?.error || "Failed to update event. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <BloodLoader fullscreen={false} />;

  // Check if event can be edited
  const canEdit = eventData?.status?.current !== "completed" && eventData?.status?.current !== "cancelled";

  return (
    <div className="modal-box w-11/12 max-w-3xl p-0 overflow-hidden bg-base-100">
      {/* Header */}
      <div className="bg-linear-to-r from-info to-info/80 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <FaSave size={24} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">Edit Event</h3>
              <p className="text-white/80 text-sm">{eventData?.title || "Donation Event"}</p>
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

      {/* Status Warning */}
      {!canEdit && (
        <div className="px-6 pt-4">
          <div className="alert alert-warning shadow-lg">
            <FaExclamationTriangle size={20} />
            <span>This event is {eventData?.status?.current} and cannot be edited.</span>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      {canEdit && (
        <div className="px-6 pt-6">
          <div className="steps steps-horizontal w-full">
            <div className={`step ${step >= 1 ? "step-info" : ""}`}>Event Info</div>
            <div className={`step ${step >= 2 ? "step-info" : ""}`}>Location</div>
            <div className={`step ${step >= 3 ? "step-info" : ""}`}>Schedule</div>
            <div className={`step ${step >= 4 ? "step-info" : ""}`}>Capacity</div>
            <div className={`step ${step >= 5 ? "step-info" : ""}`}>Requirements</div>
          </div>
        </div>
      )}

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

      {canEdit ? (
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
                      <FaCalendarAlt className="text-info" /> Event Title *
                    </span>
                  </label>
                  <input
                    type="text"
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

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Description</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    {...register("description")}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Event Type</span>
                  </label>
                  <select
                    className="select select-bordered w-full bg-base-200"
                    {...register("type")}
                    disabled
                  >
                    {eventTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">
                      Event type cannot be changed
                    </span>
                  </label>
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
                      <FaMapMarkerAlt className="text-info" /> Venue Name *
                    </span>
                  </label>
                  <input
                    type="text"
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
                    className="input input-bordered w-full"
                    {...register("location.address")}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">City *</span>
                  </label>
                  <input
                    type="text"
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
                    <span className="label-text">Coordinates</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      className="input input-bordered flex-1"
                      value={watch("location.coordinates")[0]}
                      onChange={(e) => handleCoordinatesChange(0, e.target.value)}
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      className="input input-bordered flex-1"
                      value={watch("location.coordinates")[1]}
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
                        <FiCalendar className="text-info" /> Start Date *
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
                        <FiCalendar className="text-info" /> End Date *
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
                        <FiClock className="text-info" /> Start Time
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
                        <FiClock className="text-info" /> End Time
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
                      <FaUsers className="text-info" /> Maximum Donors
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
                      className="checkbox checkbox-info"
                      {...register("capacity.walkIns")}
                    />
                    <span className="label-text">Allow walk-in donors</span>
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
                      <FaTint className="text-info" /> Accepted Blood Types
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <button
                      type="button"
                      onClick={selectAllBloodTypes}
                      className="btn btn-xs btn-outline btn-info"
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
                              ? "btn-info text-white"
                              : "btn-outline btn-info"
                            }`}
                        >
                          {type}
                        </div>
                      </label>
                    ))}
                  </div>
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
                  className="btn btn-outline btn-info"
                >
                  ← Previous
                </button>
              )}
              {step < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-info text-white ml-auto"
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
                    className="btn btn-info text-white gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaSave />
                        Update Event
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      ) : (
        <div className="p-6 text-center">
          <p className="text-base-content/70">This event cannot be edited.</p>
          <button onClick={closeModal} className="btn btn-primary mt-4">
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default EditEventModal;

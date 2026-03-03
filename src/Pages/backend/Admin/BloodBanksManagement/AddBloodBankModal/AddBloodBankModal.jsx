// Pages/backend/Admin/BloodBanksManagement/AddBloodBankModal/AddBloodBankModal.jsx

// React
import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FaHospital,
  FaPhone,
  FaEnvelope,
  FaGlobe,
  FaMapMarkerAlt,
  FaClock,
  FaBuilding,
  FaRegBuilding,
  FaPlus,
  FaMinus,
  FaTimes,
  FaCheckCircle,
  FaExclamationCircle,
  FaUserPlus,
} from "react-icons/fa";

// Hooks
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";

// ==================== CONSTANTS ====================

/**
 * Bank types for selection
 */
const bankTypes = [
  { value: "government", label: "Government", icon: FaBuilding },
  { value: "private", label: "Private", icon: FaRegBuilding },
  { value: "ngo", label: "NGO", icon: FaHospital },
  { value: "hospital", label: "Hospital", icon: FaHospital },
];

/**
 * Days of week for operating hours
 */
const daysOfWeek = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

// ==================== ANIMATION VARIANTS ====================

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

const stepVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

// ==================== MAIN COMPONENT ====================

/**
 * Add Blood Bank Modal Component
 * Multi-step form for creating new blood banks
 * 
 * @param {Function} onClose - Function to close the modal
 * @param {Function} refreshBanks - Function to refresh banks list after successful creation
 */
const AddBloodBankModal = ({ onClose, refreshBanks }) => {
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
    control,
    watch,
    trigger,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      registrationNumber: "",
      type: "government",
      contact: {
        phone: [""],
        email: "",
        website: "",
        emergency: "",
      },
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        coordinates: {
          type: "Point",
          coordinates: [0, 0],
        },
      },
      operatingHours: {
        monday: { open: "09:00", close: "17:00" },
        tuesday: { open: "09:00", close: "17:00" },
        wednesday: { open: "09:00", close: "17:00" },
        thursday: { open: "09:00", close: "17:00" },
        friday: { open: "09:00", close: "17:00" },
        saturday: { open: "09:00", close: "13:00" },
        sunday: { open: "", close: "" },
      },
      facilities: [""],
    },
  });

  // Watch form values for dynamic UI updates
  const selectedType = watch("type");
  const facilities = watch("facilities");
  const phones = watch("contact.phone");

  // ==================== FIELD ARRAYS ====================

  /**
   * Handle phone array with useFieldArray
   */
  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    control,
    name: "contact.phone",
  });

  /**
   * Handle facilities array with useFieldArray
   */
  const { fields: facilityFields, append: appendFacility, remove: removeFacility } = useFieldArray({
    control,
    name: "facilities",
  });

  // ==================== HANDLER FUNCTIONS ====================

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

    if (step === 1) {
      fieldsToValidate = ["name", "registrationNumber", "type"];
    }
    if (step === 2) {
      fieldsToValidate = [
        "contact.phone[0]",
        "contact.email",
        "contact.website",
        "contact.emergency",
      ];
    }
    if (step === 3) {
      fieldsToValidate = [
        "address.street",
        "address.city",
        "address.state",
        "address.zipCode",
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
   * Handle coordinates change
   */
  const handleCoordinatesChange = (index, value) => {
    const currentCoords = watch("address.coordinates.coordinates");
    const newCoords = [...currentCoords];
    newCoords[index] = parseFloat(value) || 0;
    setValue("address.coordinates.coordinates", newCoords);
  };

  /**
   * Handle operating hours change
   */
  const handleHoursChange = (day, period, value) => {
    setValue(`operatingHours.${day}.${period}`, value);
  };

  /**
   * Form submission handler
   */
  const onSubmit = async (data) => {
    setLoading(true);
    setApiError("");

    try {
      // Clean up empty facilities
      const cleanedFacilities = data.facilities.filter((f) => f?.trim() !== "");

      // Clean up empty phones
      const cleanedPhones = data.contact.phone.filter((p) => p?.trim() !== "");

      const payload = {
        ...data,
        facilities: cleanedFacilities,
        contact: {
          ...data.contact,
          phone: cleanedPhones,
        },
      };

      const response = await axiosInstance.post("/blood-banks", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        closeModal();
        refreshBanks();

        await Swal.fire({
          title: "Blood Bank Added",
          text: "The blood bank has been added successfully.",
          icon: "success",
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
            title: "text-lg font-bold text-error",
            content: "text-xs sm:text-sm text-base-content/80",
            confirmButton: "btn btn-sm btn-error",
          },
          buttonsStyling: false,
        });
      }
    } catch (error) {
      console.error("Failed to add blood bank:", error);
      setApiError(
        error.response?.data?.error || "Failed to add blood bank. Please try again."
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
      className="md:modal-box w-11/12 max-w-4xl p-0 overflow-hidden bg-base-100 mx-2 sm:mx-0"
    >

      {/* ==================== MODAL HEADER ==================== */}
      <div className="bg-linear-to-r from-error to-error/80 p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

          {/* Title and icon */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-white/20 p-2 sm:p-3 rounded-full">
              <FaHospital size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-2xl">Add New Blood Bank</h2>
              <p className="text-white/80 text-xs sm:text-sm">Register a new blood bank facility</p>
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
          <div className={`step step-xs sm:step-md ${step >= 1 ? "step-error" : ""}`}>Basic Info</div>
          <div className={`step step-xs sm:step-md ${step >= 2 ? "step-error" : ""}`}>Contact</div>
          <div className={`step step-xs sm:step-md ${step >= 3 ? "step-error" : ""}`}>Address</div>
          <div className={`step step-xs sm:step-md ${step >= 4 ? "step-error" : ""}`}>Facilities & Hours</div>
          <div className={`step step-xs sm:step-md ${step >= 5 ? "step-error" : ""}`}>Review</div>
        </div>
      </div>

      {/* ==================== API ERROR MESSAGE ==================== */}
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
                <FaExclamationCircle size={16} className="sm:w-5 sm:h-5 shrink-0" />
                <span className="text-xs sm:text-sm">{apiError}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-4 sm:p-6 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">

          {/* ==================== STEP 1: BASIC INFORMATION ==================== */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-3 sm:space-y-4"
            >
              {/* Bank Name */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaHospital className="text-error" size={12} />
                    Bank Name *
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Enter blood bank name"
                  className={`input input-bordered input-sm sm:input-md w-full ${errors.name ? "input-error" : ""}`}
                  {...register("name", {
                    required: "Blood bank name is required",
                    minLength: {
                      value: 3,
                      message: "Name must be at least 3 characters",
                    },
                  })}
                />
                {errors.name && (
                  <label className="label py-1">
                    <span className="label-text-alt text-error text-xs">{errors.name.message}</span>
                  </label>
                )}
              </div>

              {/* Registration Number */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaBuilding className="text-error" size={12} />
                    Registration Number *
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Enter registration number"
                  className={`input input-bordered input-sm sm:input-md w-full ${errors.registrationNumber ? "input-error" : ""}`}
                  {...register("registrationNumber", {
                    required: "Registration number is required",
                  })}
                />
                {errors.registrationNumber && (
                  <label className="label py-1">
                    <span className="label-text-alt text-error text-xs">{errors.registrationNumber.message}</span>
                  </label>
                )}
              </div>

              {/* Bank Type */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaRegBuilding className="text-error" size={12} />
                    Bank Type *
                  </span>
                </label>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                  {bankTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.value;
                    return (
                      <label
                        key={type.value}
                        className={`flex items-center gap-2 p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                          ? "border-error bg-error/10"
                          : "border-base-300 hover:border-error/50"
                          }`}
                      >
                        <input
                          type="radio"
                          value={type.value}
                          className="hidden"
                          {...register("type", {
                            required: "Please select bank type",
                          })}
                        />
                        <Icon className={`text-base sm:text-xl ${isSelected ? "text-error" : "text-gray-400"}`} />
                        <span className={`flex-1 text-xs sm:text-sm ${isSelected ? "text-error font-medium" : ""}`}>
                          {type.label}
                        </span>
                        {isSelected && <FaCheckCircle className="text-error text-xs sm:text-sm" />}
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

          {/* ==================== STEP 2: CONTACT INFORMATION ==================== */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-3 sm:space-y-4"
            >
              {/* Phone Numbers */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaPhone className="text-error" size={12} />
                    Phone Numbers *
                  </span>
                </label>
                <div className="space-y-2">
                  {phoneFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <input
                        type="tel"
                        placeholder={`Phone number ${index + 1}`}
                        className={`input input-bordered input-sm sm:input-md flex-1 ${errors.contact?.phone?.[index] ? "input-error" : ""
                          }`}
                        {...register(`contact.phone.${index}`, {
                          required: index === 0 ? "At least one phone number is required" : false,
                        })}
                      />
                      {phoneFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePhone(index)}
                          className="btn btn-square btn-ghost btn-sm text-error"
                        >
                          <FaMinus size={12} className="sm:w-4 sm:h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => appendPhone("")}
                    className="btn btn-xs sm:btn-sm btn-outline btn-error gap-1 sm:gap-2 mt-2"
                  >
                    <FaPlus size={10} className="sm:w-3 sm:h-3" />
                    <span className="text-[10px] sm:text-xs">Add Phone</span>
                  </button>
                </div>
                {errors.contact?.phone?.[0] && (
                  <label className="label py-1">
                    <span className="label-text-alt text-error text-xs">
                      {errors.contact.phone[0].message}
                    </span>
                  </label>
                )}
              </div>

              {/* Email and Website Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Email */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                      <FaEnvelope className="text-error" size={12} />
                      Email
                    </span>
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    className={`input input-bordered input-sm sm:input-md w-full ${errors.contact?.email ? "input-error" : ""}`}
                    {...register("contact.email", {
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                  />
                  {errors.contact?.email && (
                    <label className="label py-1">
                      <span className="label-text-alt text-error text-xs">{errors.contact.email.message}</span>
                    </label>
                  )}
                </div>

                {/* Website */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                      <FaGlobe className="text-error" size={12} />
                      Website
                    </span>
                  </label>
                  <input
                    type="url"
                    placeholder="Enter website URL"
                    className={`input input-bordered input-sm sm:input-md w-full ${errors.contact?.website ? "input-error" : ""}`}
                    {...register("contact.website", {
                      pattern: {
                        value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
                        message: "Invalid website URL",
                      },
                    })}
                  />
                  {errors.contact?.website && (
                    <label className="label py-1">
                      <span className="label-text-alt text-error text-xs">{errors.contact.website.message}</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaPhone className="text-error" size={12} />
                    Emergency Contact
                  </span>
                </label>
                <input
                  type="tel"
                  placeholder="Emergency phone number"
                  className={`input input-bordered input-sm sm:input-md w-full ${errors.contact?.emergency ? "input-error" : ""}`}
                  {...register("contact.emergency")}
                />
              </div>
            </motion.div>
          )}

          {/* ==================== STEP 3: ADDRESS ==================== */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-3 sm:space-y-4"
            >
              {/* Street Address */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaMapMarkerAlt className="text-error" size={12} />
                    Street Address *
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Enter street address"
                  className={`input input-bordered input-sm sm:input-md w-full ${errors.address?.street ? "input-error" : ""}`}
                  {...register("address.street", {
                    required: "Street address is required",
                  })}
                />
                {errors.address?.street && (
                  <label className="label py-1">
                    <span className="label-text-alt text-error text-xs">{errors.address.street.message}</span>
                  </label>
                )}
              </div>

              {/* City, State, ZIP Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* City */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm">City *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter city"
                    className={`input input-bordered input-sm sm:input-md w-full ${errors.address?.city ? "input-error" : ""}`}
                    {...register("address.city", {
                      required: "City is required",
                    })}
                  />
                  {errors.address?.city && (
                    <label className="label py-1">
                      <span className="label-text-alt text-error text-xs">{errors.address.city.message}</span>
                    </label>
                  )}
                </div>

                {/* State */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm">State *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter state"
                    className={`input input-bordered input-sm sm:input-md w-full ${errors.address?.state ? "input-error" : ""}`}
                    {...register("address.state", {
                      required: "State is required",
                    })}
                  />
                  {errors.address?.state && (
                    <label className="label py-1">
                      <span className="label-text-alt text-error text-xs">{errors.address.state.message}</span>
                    </label>
                  )}
                </div>

                {/* ZIP Code */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm">ZIP Code *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter ZIP code"
                    className={`input input-bordered input-sm sm:input-md w-full ${errors.address?.zipCode ? "input-error" : ""}`}
                    {...register("address.zipCode", {
                      required: "ZIP code is required",
                    })}
                  />
                  {errors.address?.zipCode && (
                    <label className="label py-1">
                      <span className="label-text-alt text-error text-xs">{errors.address.zipCode.message}</span>
                    </label>
                  )}
                </div>
              </div>

              {/* ==================== Coordinates ==================== */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaMapMarkerAlt className="text-error" size={14} />
                    Coordinates (Longitude, Latitude)
                  </span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Longitude */}
                  <div className="flex-1 w-full">
                    <input
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      className="input input-bordered input-sm sm:input-md w-full"
                      value={watch("address.coordinates.coordinates")[0] || ""}
                      onChange={(e) => handleCoordinatesChange(0, e.target.value)}
                    />
                  </div>

                  {/* Latitude */}
                  <div className="flex-1 w-full">
                    <input
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      className="input input-bordered input-sm sm:input-md w-full"
                      value={watch("address.coordinates.coordinates")[1] || ""}
                      onChange={(e) => handleCoordinatesChange(1, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== STEP 4: FACILITIES & OPERATING HOURS ==================== */}
          {step === 4 && (
            <motion.div
              key="step4"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              {/* Facilities */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2 font-medium">
                    <FaHospital className="text-error" size={16} />
                    Facilities
                  </span>
                </label>
                <div className="space-y-2">
                  {facilityFields.map((field, index) => (
                    <div key={field.id} className="flex flex-row gap-2 items-center">
                      <input
                        type="text"
                        placeholder={`Facility ${index + 1}`}
                        className="input input-bordered input-sm sm:input-md flex-1 py-2 w-full"
                        {...register(`facilities.${index}`)}
                      />
                      {facilityFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFacility(index)}
                          className="btn btn-square btn-ghost btn-sm text-error"
                        >
                          <FaMinus size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => appendFacility("")}
                    className="btn btn-xs sm:btn-sm btn-outline btn-error gap-2 mt-2 self-start"
                  >
                    <FaPlus size={12} />
                    <span className="text-xs sm:text-sm">Add Facility</span>
                  </button>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2 font-medium">
                    <FaClock className="text-error" size={16} />
                    Operating Hours
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {daysOfWeek.map((day) => (
                    <div
                      key={day}
                      className="border border-base-300 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <span className="font-semibold text-xs sm:text-sm capitalize w-full sm:w-1/4">
                        {day}
                      </span>
                      <div className="flex flex-row gap-2 flex-1">
                        <input
                          type="time"
                          className="input input-bordered input-xs sm:input-sm flex-1 w-full"
                          value={watch(`operatingHours.${day}.open`) || ""}
                          onChange={(e) => handleHoursChange(day, "open", e.target.value)}
                        />
                        <span className="self-center text-xs sm:text-sm hidden xs:inline">-</span>
                        <input
                          type="time"
                          className="input input-bordered input-xs sm:input-sm flex-1 w-full"
                          value={watch(`operatingHours.${day}.close`) || ""}
                          onChange={(e) => handleHoursChange(day, "close", e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== STEP 5: REVIEW ==================== */}
          {step === 5 && (
            <motion.div
              key="step5"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-3 sm:space-y-4"
            >
              {/* Review Alert */}
              <div className="alert alert-info bg-info/10 border-info/20 flex-col sm:flex-row gap-2 p-3 sm:p-4">
                <FaCheckCircle className="text-info text-lg sm:text-xl shrink-0" />
                <span className="text-xs sm:text-sm text-center sm:text-left">
                  Please review the blood bank information before submitting.
                </span>
              </div>

              {/* Basic Info Summary */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                  <FaHospital className="text-error" size={12} />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 text-[10px] sm:text-xs">
                  <div>
                    <p className="opacity-70">Bank Name</p>
                    <p className="font-medium wrap-break-word">{watch("name")}</p>
                  </div>
                  <div>
                    <p className="opacity-70">Registration No.</p>
                    <p className="font-medium wrap-break-word">{watch("registrationNumber")}</p>
                  </div>
                  <div>
                    <p className="opacity-70">Type</p>
                    <p className="font-medium capitalize wrap-break-word">{watch("type")}</p>
                  </div>
                </div>
              </div>

              {/* Contact Info Summary */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                  <FaPhone className="text-error" size={12} />
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 text-[10px] sm:text-xs">
                  <div>
                    <p className="opacity-70">Phone Numbers</p>
                    <p className="font-medium wrap-break-word">
                      {phones?.filter(Boolean).join(", ") || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="opacity-70">Email</p>
                    <p className="font-medium wrap-break-word">{watch("contact.email") || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="opacity-70">Website</p>
                    <p className="font-medium wrap-break-word">{watch("contact.website") || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="opacity-70">Emergency</p>
                    <p className="font-medium wrap-break-word">{watch("contact.emergency") || "Not provided"}</p>
                  </div>
                </div>
              </div>

              {/* Address Summary */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                  <FaMapMarkerAlt className="text-error" size={12} />
                  Address
                </h4>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 text-[10px] sm:text-xs">
                  <div className="col-span-1 xs:col-span-2">
                    <p className="opacity-70">Street</p>
                    <p className="font-medium wrap-break-word">{watch("address.street")}</p>
                  </div>
                  <div>
                    <p className="opacity-70">City</p>
                    <p className="font-medium wrap-break-word">{watch("address.city")}</p>
                  </div>
                  <div>
                    <p className="opacity-70">State</p>
                    <p className="font-medium wrap-break-word">{watch("address.state")}</p>
                  </div>
                  <div>
                    <p className="opacity-70">ZIP Code</p>
                    <p className="font-medium wrap-break-word">{watch("address.zipCode")}</p>
                  </div>
                </div>
              </div>

              {/* Facilities & Hours Summary */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                  <FaClock className="text-error" size={12} />
                  Facilities & Hours
                </h4>
                <div className="space-y-2 text-[10px] sm:text-xs">
                  <div>
                    <p className="opacity-70">Facilities</p>
                    <p className="font-medium wrap-break-word">
                      {facilities?.filter(Boolean).join(", ") || "No facilities listed"}
                    </p>
                  </div>
                  <div>
                    <pF className="opacity-70">Operating Hours</pF>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-1 mt-1">
                      {daysOfWeek.map((day) => {
                        const hours = watch(`operatingHours.${day}`);
                        if (hours?.open && hours?.close) {
                          return (
                            <div key={day} className="text-[8px] sm:text-xs">
                              <span className="capitalize font-medium">{day}:</span>{" "}
                              {hours.open} - {hours.close}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* ==================== FOOTER ACTIONS ==================== */}
        <div className="modal-action border-t border-base-300 bg-base-200/50 px-4 py-4">
          <div className="flex flex-row items-center justify-between gap-3 w-full">

            {/* LEFT SIDE - Previous */}
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="btn btn-outline btn-error btn-sm sm:btn-md w-1/2 sm:w-auto flex items-center gap-2"
              >
                <span>←</span>
                <span>Previous</span>
              </button>
            ) : (
              <div />
            )}

            {/* RIGHT SIDE - Cancel + Next / Submit */}
            <div className="flex flex-col sm:flex-row gap-2 w-1/2 sm:w-auto sm:ml-auto">


              {step < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-error text-white btn-sm sm:btn-md w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <span>Next</span>
                  <span>→</span>
                </button>
              ) : (
                <>
                  {/* Cancel */}
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={loading}
                    className="btn btn-ghost btn-sm sm:btn-md w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed hidden md:block"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-error text-white btn-sm sm:btn-md w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <FaUserPlus className="text-sm" />
                        <span>Create User</span>
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

export default AddBloodBankModal;
// React
import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

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
} from "react-icons/fa";

// Hooks
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";

const AddBloodBankModal = ({ onClose, refreshBanks }) => {
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

  // Watch form values
  const selectedType = watch("type");
  const facilities = watch("facilities");
  const phones = watch("contact.phone");

  // Constants
  const bankTypes = [
    { value: "government", label: "Government", icon: FaBuilding },
    { value: "private", label: "Private", icon: FaRegBuilding },
    { value: "ngo", label: "NGO", icon: FaHospital },
    { value: "hospital", label: "Hospital", icon: FaHospital },
  ];

  const daysOfWeek = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  // Handle phone array with useFieldArray
  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    control,
    name: "contact.phone",
  });

  // Handle facilities array with useFieldArray
  const { fields: facilityFields, append: appendFacility, remove: removeFacility } = useFieldArray({
    control,
    name: "facilities",
  });

  // Close Modal Function
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

  // Step Prev handler
  const prevStep = () => {
    setApiError("");
    setStep(step - 1);
  };

  // Handle coordinates
  const handleCoordinatesChange = (index, value) => {
    const currentCoords = watch("address.coordinates.coordinates");
    const newCoords = [...currentCoords];
    newCoords[index] = parseFloat(value) || 0;
    setValue("address.coordinates.coordinates", newCoords);
  };

  // Handle operating hours
  const handleHoursChange = (day, period, value) => {
    setValue(`operatingHours.${day}.${period}`, value);
  };

  // Submit handler
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
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
            title: "text-lg font-bold text-error",
            content: "text-base text-base-content/80",
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

  return (
    <div className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden bg-base-100">
      {/* Header */}
      <div className="bg-linear-to-r from-error to-error/80 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <FaHospital size={24} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">Add New Blood Bank</h3>
              <p className="text-white/80 text-sm">Register a new blood bank facility</p>
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
          <div className={`step ${step >= 1 ? "step-error" : ""}`}>Basic Info</div>
          <div className={`step ${step >= 2 ? "step-error" : ""}`}>Contact</div>
          <div className={`step ${step >= 3 ? "step-error" : ""}`}>Address</div>
          <div className={`step ${step >= 4 ? "step-error" : ""}`}>Facilities & Hours</div>
          <div className={`step ${step >= 5 ? "step-error" : ""}`}>Review</div>
        </div>
      </div>

      {/* Inline API Error Message */}
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
          {/* Step 1: Basic Information */}
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
                    <FaHospital className="text-error" /> Bank Name *
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Enter blood bank name"
                  className={`input input-bordered w-full ${errors.name ? "input-error" : ""}`}
                  {...register("name", {
                    required: "Blood bank name is required",
                    minLength: {
                      value: 3,
                      message: "Name must be at least 3 characters",
                    },
                  })}
                />
                {errors.name && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.name.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaBuilding className="text-error" /> Registration Number *
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Enter registration number"
                  className={`input input-bordered w-full ${errors.registrationNumber ? "input-error" : ""}`}
                  {...register("registrationNumber", {
                    required: "Registration number is required",
                  })}
                />
                {errors.registrationNumber && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.registrationNumber.message}
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaRegBuilding className="text-error" /> Bank Type *
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {bankTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.value;
                    return (
                      <label
                        key={type.value}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${isSelected
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
                        <Icon className={`text-xl ${isSelected ? "text-error" : "text-gray-400"}`} />
                        <span className={`flex-1 ${isSelected ? "text-error font-medium" : ""}`}>
                          {type.label}
                        </span>
                        {isSelected && <FaCheckCircle className="text-error" />}
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

          {/* Step 2: Contact Information */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Phone Numbers */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaPhone className="text-error" /> Phone Numbers *
                  </span>
                </label>
                <div className="space-y-2">
                  {phoneFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <input
                        type="tel"
                        placeholder={`Phone number ${index + 1}`}
                        className={`input input-bordered flex-1 ${errors.contact?.phone?.[index] ? "input-error" : ""
                          }`}
                        {...register(`contact.phone.${index}`, {
                          required: index === 0 ? "At least one phone number is required" : false,
                        })}
                      />
                      {phoneFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePhone(index)}
                          className="btn btn-square btn-ghost text-error"
                        >
                          <FaMinus size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => appendPhone("")}
                    className="btn btn-sm btn-outline btn-error gap-2 mt-2"
                  >
                    <FaPlus size={14} />
                    Add Phone
                  </button>
                </div>
                {errors.contact?.phone?.[0] && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.contact.phone[0].message}
                    </span>
                  </label>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaEnvelope className="text-error" /> Email
                    </span>
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    className={`input input-bordered w-full ${errors.contact?.email ? "input-error" : ""}`}
                    {...register("contact.email", {
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                  />
                  {errors.contact?.email && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.contact.email.message}
                      </span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaGlobe className="text-error" /> Website
                    </span>
                  </label>
                  <input
                    type="url"
                    placeholder="Enter website URL"
                    className={`input input-bordered w-full ${errors.contact?.website ? "input-error" : ""}`}
                    {...register("contact.website", {
                      pattern: {
                        value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
                        message: "Invalid website URL",
                      },
                    })}
                  />
                  {errors.contact?.website && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.contact.website.message}
                      </span>
                    </label>
                  )}
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaPhone className="text-error" /> Emergency Contact
                    </span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Emergency phone number"
                    className={`input input-bordered w-full ${errors.contact?.emergency ? "input-error" : ""}`}
                    {...register("contact.emergency")}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Address */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaMapMarkerAlt className="text-error" /> Street Address *
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter street address"
                    className={`input input-bordered w-full ${errors.address?.street ? "input-error" : ""}`}
                    {...register("address.street", {
                      required: "Street address is required",
                    })}
                  />
                  {errors.address?.street && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.address.street.message}
                      </span>
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">City *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter city"
                      className={`input input-bordered ${errors.address?.city ? "input-error" : ""}`}
                      {...register("address.city", {
                        required: "City is required",
                      })}
                    />
                    {errors.address?.city && (
                      <label className="label">
                        <span className="label-text-alt text-error">
                          {errors.address.city.message}
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">State *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter state"
                      className={`input input-bordered ${errors.address?.state ? "input-error" : ""}`}
                      {...register("address.state", {
                        required: "State is required",
                      })}
                    />
                    {errors.address?.state && (
                      <label className="label">
                        <span className="label-text-alt text-error">
                          {errors.address.state.message}
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">ZIP Code *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter ZIP code"
                      className={`input input-bordered ${errors.address?.zipCode ? "input-error" : ""}`}
                      {...register("address.zipCode", {
                        required: "ZIP code is required",
                      })}
                    />
                    {errors.address?.zipCode && (
                      <label className="label">
                        <span className="label-text-alt text-error">
                          {errors.address.zipCode.message}
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaMapMarkerAlt className="text-error" /> Coordinates (Longitude, Latitude)
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      className="input input-bordered flex-1"
                      value={watch("address.coordinates.coordinates")[0]}
                      onChange={(e) => handleCoordinatesChange(0, e.target.value)}
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      className="input input-bordered flex-1"
                      value={watch("address.coordinates.coordinates")[1]}
                      onChange={(e) => handleCoordinatesChange(1, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Facilities & Operating Hours */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Facilities */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaHospital className="text-error" /> Facilities
                  </span>
                </label>
                <div className="space-y-2">
                  {facilityFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Facility ${index + 1}`}
                        className="input input-bordered flex-1"
                        {...register(`facilities.${index}`)}
                      />
                      {facilityFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFacility(index)}
                          className="btn btn-square btn-ghost text-error"
                        >
                          <FaMinus size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => appendFacility("")}
                    className="btn btn-sm btn-outline btn-error gap-2 mt-2"
                  >
                    <FaPlus size={14} />
                    Add Facility
                  </button>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaClock className="text-error" /> Operating Hours
                  </span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="border border-base-300 rounded-lg p-3">
                      <label className="label">
                        <span className="label-text font-semibold capitalize">{day}</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="time"
                          className="input input-bordered input-sm flex-1"
                          value={watch(`operatingHours.${day}.open`)}
                          onChange={(e) => handleHoursChange(day, "open", e.target.value)}
                        />
                        <span className="self-center">-</span>
                        <input
                          type="time"
                          className="input input-bordered input-sm flex-1"
                          value={watch(`operatingHours.${day}.close`)}
                          onChange={(e) => handleHoursChange(day, "close", e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="alert alert-info bg-info/10 border-info/20">
                <FaCheckCircle className="text-info" />
                <span className="text-white">
                  Please review the blood bank information before submitting.
                </span>
              </div>

              {/* Basic Info */}
              <div className="bg-base-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <FaHospital className="text-error" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="opacity-70">Bank Name</p>
                    <p className="font-medium">{watch("name")}</p>
                  </div>
                  <div>
                    <p className="opacity-70">Registration No.</p>
                    <p className="font-medium">{watch("registrationNumber")}</p>
                  </div>
                  <div>
                    <p className="opacity-70">Type</p>
                    <p className="font-medium capitalize">{watch("type")}</p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-base-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <FaPhone className="text-error" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="opacity-70">Phone Numbers</p>
                    <p className="font-medium">
                      {phones?.filter(Boolean).join(", ") || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="opacity-70">Email</p>
                    <p className="font-medium">{watch("contact.email") || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="opacity-70">Website</p>
                    <p className="font-medium">{watch("contact.website") || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="opacity-70">Emergency</p>
                    <p className="font-medium">{watch("contact.emergency") || "Not provided"}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-base-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <FaMapMarkerAlt className="text-error" />
                  Address
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2">
                    <p className="opacity-70">Street</p>
                    <p className="font-medium">{watch("address.street")}</p>
                  </div>
                  <div>
                    <p className="opacity-70">City</p>
                    <p className="font-medium">{watch("address.city")}</p>
                  </div>
                  <div>
                    <p className="opacity-70">State</p>
                    <p className="font-medium">{watch("address.state")}</p>
                  </div>
                  <div>
                    <p className="opacity-70">ZIP Code</p>
                    <p className="font-medium">{watch("address.zipCode")}</p>
                  </div>
                </div>
              </div>

              {/* Facilities & Hours */}
              <div className="bg-base-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <FaClock className="text-error" />
                  Facilities & Hours
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="opacity-70">Facilities</p>
                    <p className="font-medium">
                      {facilities?.filter(Boolean).join(", ") || "No facilities listed"}
                    </p>
                  </div>
                  <div>
                    <p className="opacity-70">Operating Hours</p>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      {daysOfWeek.map((day) => {
                        const hours = watch(`operatingHours.${day}`);
                        if (hours?.open && hours?.close) {
                          return (
                            <div key={day} className="text-xs">
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
                  disabled={loading}
                  className="btn btn-error text-white gap-2"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Adding...
                    </>
                  ) : (
                    <>
                      <FaHospital />
                      Add Blood Bank
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

export default AddBloodBankModal;
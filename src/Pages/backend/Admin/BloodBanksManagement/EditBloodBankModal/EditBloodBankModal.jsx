// React
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";

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
  FaSave,
  FaEdit,
} from "react-icons/fa";

// Hooks
import BloodLoader from "../../../../../shared/BloodLoader";
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";

const EditBloodBankModal = ({ bankId, onClose, refreshBanks }) => {
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
    setValue,
    reset,
    trigger,
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
  const phones = watch("contact.phone");
  const facilities = watch("facilities");

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

  // Fetch bank details
  const {
    data: bankData,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ["bank-details-edit", bankId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/blood-banks/${bankId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!bankId,
  });

  // Populate form with bank data
  useEffect(() => {
    if (bankData?.data) {
      const bank = bankData.data;

      // Format phone numbers array
      const phones = bank.contact?.phone?.length ? bank.contact.phone : [""];

      // Format facilities array
      const facilities = bank.facilities?.length ? bank.facilities : [""];

      // Format operating hours with defaults
      const operatingHours = bank.operatingHours || {
        monday: { open: "09:00", close: "17:00" },
        tuesday: { open: "09:00", close: "17:00" },
        wednesday: { open: "09:00", close: "17:00" },
        thursday: { open: "09:00", close: "17:00" },
        friday: { open: "09:00", close: "17:00" },
        saturday: { open: "09:00", close: "13:00" },
        sunday: { open: "", close: "" },
      };

      // Set all form values
      reset({
        name: bank.name || "",
        registrationNumber: bank.registrationNumber || "",
        type: bank.type || "government",
        contact: {
          phone: phones,
          email: bank.contact?.email || "",
          website: bank.contact?.website || "",
          emergency: bank.contact?.emergency || "",
        },
        address: {
          street: bank.address?.street || "",
          city: bank.address?.city || "",
          state: bank.address?.state || "",
          zipCode: bank.address?.zipCode || "",
          coordinates: bank.address?.coordinates || {
            type: "Point",
            coordinates: [0, 0],
          },
        },
        operatingHours: operatingHours,
        facilities: facilities,
      });
    }
  }, [bankData, reset]);

  // Handle phone array operations manually (since useFieldArray might be overkill for edit)
  const addPhoneField = () => {
    const currentPhones = watch("contact.phone");
    setValue("contact.phone", [...currentPhones, ""]);
  };

  const removePhoneField = (index) => {
    const currentPhones = watch("contact.phone");
    if (currentPhones.length > 1) {
      const newPhones = currentPhones.filter((_, i) => i !== index);
      setValue("contact.phone", newPhones);
    }
  };

  // Handle facilities array manually
  const addFacilityField = () => {
    const currentFacilities = watch("facilities");
    setValue("facilities", [...currentFacilities, ""]);
  };

  const removeFacilityField = (index) => {
    const currentFacilities = watch("facilities");
    if (currentFacilities.length > 1) {
      const newFacilities = currentFacilities.filter((_, i) => i !== index);
      setValue("facilities", newFacilities);
    }
  };

  // Handle coordinates
  const handleCoordinatesChange = (index, value) => {
    const currentCoords = watch("address.coordinates.coordinates");
    const newCoords = [...currentCoords];
    newCoords[index] = parseFloat(value) || 0;
    setValue("address.coordinates.coordinates", newCoords);
  };

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
      fieldsToValidate = ["name"];
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

  // Submit handler
  const onSubmit = async (data) => {
    setLoading(true);
    setApiError("");

    try {
      // Clean up empty facilities
      const cleanedFacilities = data.facilities.filter((f) => f?.trim() !== "");

      // Clean up empty phones
      const cleanedPhones = data.contact.phone.filter((p) => p?.trim() !== "");

      // Only include fields that are allowed to be updated
      const payload = {
        name: data.name,
        contact: {
          ...data.contact,
          phone: cleanedPhones,
        },
        address: data.address,
        operatingHours: data.operatingHours,
        facilities: cleanedFacilities,
      };

      const response = await axiosInstance.patch(`/blood-banks/${bankId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        closeModal();
        refreshBanks();

        await Swal.fire({
          title: "Blood Bank Updated",
          text: "The blood bank has been updated successfully.",
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
      console.error("Failed to update blood bank:", error);
      setApiError(
        error.response?.data?.error || "Failed to update blood bank. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Show error state
  if (fetchError) {
    return (
      <div className="modal-box w-11/12 max-w-4xl p-6 bg-base-100">
        <div className="text-center py-10">
          <FaExclamationCircle className="text-error text-5xl mx-auto mb-4" />
          <h3 className="font-bold text-xl mb-2">Failed to Load</h3>
          <p className="text-base-content/70 mb-4">
            Could not load blood bank details. Please try again.
          </p>
          <button onClick={onClose} className="btn btn-error">
            Close
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <BloodLoader fullscreen={false} />;
  }

  return (
    <div className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden bg-base-100">
      {/* Header */}
      <div className="bg-linear-to-r from-error to-error/80 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <FaEdit size={24} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">Edit Blood Bank</h3>
              <p className="text-white/80 text-sm">Update blood bank information</p>
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

      {/* Read-only notice for immutable fields */}
      <div className="px-6 pt-4">
        <div className="alert alert-info bg-info/10 border-info/20 text-sm">
          <FaExclamationCircle className="text-info" />
          <span className="text-primary" >Registration number and bank type cannot be modified after creation.</span>
        </div>
      </div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaBuilding className="text-error" /> Registration Number
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full bg-base-200"
                    {...register("registrationNumber")}
                    disabled
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">
                      Cannot be changed
                    </span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaRegBuilding className="text-error" /> Bank Type
                    </span>
                  </label>
                  <select
                    className="select select-bordered w-full bg-base-200"
                    {...register("type")}
                    disabled
                  >
                    {bankTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">
                      Cannot be changed
                    </span>
                  </label>
                </div>
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
                  {phones?.map((phone, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="tel"
                        placeholder={`Phone number ${index + 1}`}
                        className={`input input-bordered flex-1 ${errors.contact?.phone?.[index] ? "input-error" : ""
                          }`}
                        {...register(`contact.phone.${index}`, {
                          required: index === 0 ? "At least one phone number is required" : false,
                        })}
                      />
                      {phones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePhoneField(index)}
                          className="btn btn-square btn-ghost text-error"
                        >
                          <FaMinus size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addPhoneField}
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
                    className={`input input-bordered w-full ${errors.contact?.email ? "input-error" : ""
                      }`}
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
                    className={`input input-bordered w-full ${errors.contact?.website ? "input-error" : ""
                      }`}
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
                    className="input input-bordered w-full"
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
                    className={`input input-bordered w-full ${errors.address?.street ? "input-error" : ""
                      }`}
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
                      className={`input input-bordered ${errors.address?.city ? "input-error" : ""
                        }`}
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
                      className={`input input-bordered ${errors.address?.state ? "input-error" : ""
                        }`}
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
                      className={`input input-bordered ${errors.address?.zipCode ? "input-error" : ""
                        }`}
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
                  {facilities?.map((facility, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Facility ${index + 1}`}
                        className="input input-bordered flex-1"
                        {...register(`facilities.${index}`)}
                      />
                      {facilities.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFacilityField(index)}
                          className="btn btn-square btn-ghost text-error"
                        >
                          <FaMinus size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFacilityField}
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
                          {...register(`operatingHours.${day}.open`)}
                        />
                        <span className="self-center">-</span>
                        <input
                          type="time"
                          className="input input-bordered input-sm flex-1"
                          {...register(`operatingHours.${day}.close`)}
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
                  Please review the changes before updating.
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
                        const open = watch(`operatingHours.${day}.open`);
                        const close = watch(`operatingHours.${day}.close`);
                        if (open && close) {
                          return (
                            <div key={day} className="text-xs">
                              <span className="capitalize font-medium">{day}:</span> {open} - {close}
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
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaSave />
                      Save Changes
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

export default EditBloodBankModal;
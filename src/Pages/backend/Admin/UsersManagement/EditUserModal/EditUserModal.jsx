// Pages/backend/Admin/UsersManagement/EditUserModal/EditUserModal.jsx

// React
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FaTint,
  FaUser,
  FaBell,
  FaPhone,
  FaTimes,
  FaGlobe,
  FaIdCard,
  FaWeight,
  FaEnvelope,
  FaUserEdit,
  FaBuilding,
  FaHeartbeat,
  FaShieldAlt,
  FaVenusMars,
  FaCheckCircle,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaExclamationCircle,
} from "react-icons/fa";

// Hooks
import useAuth from "../../../../../hooks/useAuth";
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";

// Shared
import BloodLoader from "../../../../../shared/BloodLoader";

// ==================== CONSTANTS ====================

/**
 * Blood types for selection
 */
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/**
 * Gender options
 */
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

/**
 * All possible roles with their configurations
 */
const ALL_ROLES = [
  {
    value: "donor",
    label: "Blood Donor",
    icon: FaTint,
    description: "User can donate blood",
    color: "success"
  },
  {
    value: "requester",
    label: "Blood Requester",
    icon: FaHeartbeat,
    description: "User can request blood",
    color: "warning"
  },
  {
    value: "hospital",
    label: "Hospital Staff",
    icon: FaMapMarkerAlt,
    description: "User represents a hospital",
    color: "info"
  },
  {
    value: "blood_bank",
    label: "Blood Bank Staff",
    icon: FaBuilding,
    description: "User works at blood bank",
    color: "secondary"
  },
  {
    value: "admin",
    label: "Administrator",
    icon: FaShieldAlt,
    description: "User has admin privileges",
    color: "error"
  },
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
 * Edit User Modal Component
 * Multi-step form for editing existing users
 * 
 * @param {string} userId - ID of the user to edit
 * @param {Function} refreshUsers - Function to refresh users list
 * @param {Function} onClose - Function to close the modal
 */
const EditUserModal = ({ userId, refreshUsers, onClose }) => {
  const { axiosInstance } = useAxiosPublic();
  const { user: currentUser, loading: authLoading } = useAuth();

  // ==================== STATE MANAGEMENT ====================

  const [step, setStep] = useState(1);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // ==================== FORM HANDLING ====================

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      // Profile Info
      fullName: "",
      email: "",
      phone: "",
      bloodGroup: "",
      role: "",

      // Additional Profile Fields
      dateOfBirth: "",
      gender: "",
      weight: "",

      // Address
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",

      // Verification
      isEmailVerified: false,
      isPhoneVerified: false,
      isIdentityVerified: false,

      // Settings
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      showLocation: true,
      showContact: false,
      showLastDonation: true,
    },
  });

  // Watch form values for dynamic UI updates
  const selectedRole = watch("role");
  const selectedBloodGroup = watch("bloodGroup");

  // ==================== COMPUTED VALUES ====================

  /**
   * Filter roles based on current user's permissions
   */
  const roles = ALL_ROLES.filter(role => {
    if (currentUser?.role === "super_admin") return true;
    if (currentUser?.role === "admin" && role.value === "admin") return false;
    return true;
  });

  // ==================== EFFECTS ====================

  /**
   * Fetch user data when component mounts or userId changes
   */
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setFetchLoading(false);
        return;
      }

      setApiError("");
      setFetchLoading(true);

      try {
        const response = await axiosInstance.get(`/users/profile/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
        });

        // Extract user data from various possible response structures
        let user = null;
        if (response.data?.success && response.data?.data) {
          user = response.data.data;
        } else if (response.data?.data) {
          user = response.data.data;
        } else if (response.data?.user) {
          user = response.data.user;
        } else if (typeof response.data === 'object' && !response.data.success) {
          user = response.data;
        }

        if (user) {
          // Populate form with user data
          setValue("fullName", user.profile?.fullName || "");
          setValue("email", user.email || "");
          setValue("phone", user.phone || "");
          setValue("bloodGroup", user.profile?.bloodGroup || "");
          setValue("role", user.role || "");
          setValue("dateOfBirth", user.profile?.dateOfBirth ? user.profile.dateOfBirth.split('T')[0] : "");
          setValue("gender", user.profile?.gender || "");
          setValue("weight", user.profile?.weight || "");
          setValue("street", user.address?.street || "");
          setValue("city", user.address?.city || "");
          setValue("state", user.address?.state || "");
          setValue("zipCode", user.address?.zipCode || "");
          setValue("country", user.address?.country || "");
          setValue("isEmailVerified", user.verification?.isEmailVerified || false);
          setValue("isPhoneVerified", user.verification?.isPhoneVerified || false);
          setValue("isIdentityVerified", user.verification?.isIdentityVerified || false);
          setValue("emailNotifications", user.settings?.notifications?.email ?? true);
          setValue("smsNotifications", user.settings?.notifications?.sms ?? true);
          setValue("pushNotifications", user.settings?.notifications?.push ?? true);
          setValue("showLocation", user.settings?.privacy?.showLocation ?? true);
          setValue("showContact", user.settings?.privacy?.showContact ?? false);
          setValue("showLastDonation", user.settings?.privacy?.showLastDonation ?? true);
        } else {
          throw new Error("Invalid response structure");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setApiError(error.response?.data?.message || error.message || "Failed to load user data");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchUserData();
  }, [userId, axiosInstance, setValue]);

  // ==================== HANDLER FUNCTIONS ====================

  /**
   * Close modal and reset form
   */
  const closeModal = () => {
    reset();
    setStep(1);
    setApiError("");
    if (onClose) {
      onClose();
    } else {
      const modal = document.getElementById('edit_user_modal');
      if (modal) modal.close();
    }
  };

  /**
   * Validate and move to next step
   */
  const nextStep = async () => {
    setApiError("");
    let fieldsToValidate = [];

    if (step === 1) fieldsToValidate = ["fullName", "email", "phone"];
    if (step === 2) fieldsToValidate = ["bloodGroup", "role"];
    if (step === 3) fieldsToValidate = ["dateOfBirth", "gender", "weight"];

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
   * Form submission handler - Update user profile
   */
  const onSubmit = async (data) => {
    setLoading(true);
    setApiError("");

    try {
      const token = localStorage.getItem("auth_token");

      // 1. Update profile information
      const profileUpdateData = {
        fullName: data.fullName,
        bloodGroup: data.bloodGroup,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null,
        gender: data.gender,
        weight: data.weight ? parseFloat(data.weight) : null,
      };

      await axiosInstance.patch(`/users/profile/${userId}`, profileUpdateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 2. Update address if provided
      if (data.street || data.city || data.state || data.zipCode || data.country) {
        const addressData = {
          street: data.street || "",
          city: data.city || "",
          state: data.state || "",
          zipCode: data.zipCode || "",
          country: data.country || "",
        };

        await axiosInstance.patch(`/users/address/${userId}`, addressData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // 3. Update settings if admin
      if (currentUser?.role === "admin" || currentUser?.role === "super_admin") {
        const settingsData = {
          notifications: {
            email: data.emailNotifications,
            sms: data.smsNotifications,
            push: data.pushNotifications,
          },
          privacy: {
            showLocation: data.showLocation,
            showContact: data.showContact,
            showLastDonation: data.showLastDonation,
          },
        };

        await axiosInstance.patch(`/users/settings/${userId}`, settingsData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // 4. Update verification status if admin
        const verificationData = {
          isEmailVerified: data.isEmailVerified,
          isPhoneVerified: data.isPhoneVerified,
          isIdentityVerified: data.isIdentityVerified,
        };

        await axiosInstance.patch(`/users/verify/${userId}`, verificationData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // Show success message
      await Swal.fire({
        title: "Success!",
        text: "User has been updated successfully.",
        icon: "success",
        timer: 2000,
        showConfirmButton: true,
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          title: "text-lg font-bold text-success",
          content: "text-xs sm:text-sm text-base-content/80",
          confirmButton: "btn btn-sm btn-success",
        },
        buttonsStyling: false,
      });

      // Close modal and refresh
      closeModal();
      if (refreshUsers) refreshUsers();

    } catch (error) {
      console.error("Failed to update user:", error);

      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to update user. Please try again.";

      setApiError(errorMessage);

      // Show error alert
      await Swal.fire({
        title: "Error!",
        text: errorMessage,
        icon: "error",
        timer: 3000,
        showConfirmButton: true,
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
    } finally {
      setLoading(false);
    }
  };

  // ==================== LOADING STATES ====================

  if (authLoading || fetchLoading) return <BloodLoader fullscreen={false} />;

  // ==================== RENDER ====================

  return (
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="modal-box w-11/12 max-w-3xl p-0 overflow-hidden bg-base-100 mx-2 sm:mx-0"
    >

      {/* ==================== MODAL HEADER ==================== */}
      <div className="bg-linear-to-r from-blue-600 to-blue-400 p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

          {/* Title and icon */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-white/20 p-2 sm:p-3 rounded-full">
              <FaUserEdit size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-2xl">Edit User</h2>
              <p className="text-white/80 text-xs sm:text-sm">Update user information</p>
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
          <div className={`step step-xs sm:step-md ${step >= 1 ? "step-primary" : ""}`}>Basic Info</div>
          <div className={`step step-xs sm:step-md ${step >= 2 ? "step-primary" : ""}`}>Role & Blood</div>
          <div className={`step step-xs sm:step-md ${step >= 3 ? "step-primary" : ""}`}>Personal</div>
          <div className={`step step-xs sm:step-md ${step >= 4 ? "step-primary" : ""}`}>Address</div>
          <div className={`step step-xs sm:step-md ${step >= 5 ? "step-primary" : ""}`}>Settings</div>
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
              {/* Full Name */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaUser className="text-primary" size={12} />
                    Full Name
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  className={`input input-bordered input-sm sm:input-md w-full ${errors.fullName ? "input-error" : ""}`}
                  {...register("fullName", {
                    required: "Full name is required",
                    minLength: {
                      value: 3,
                      message: "Name must be at least 3 characters",
                    },
                  })}
                />
                {errors.fullName && (
                  <label className="label py-1">
                    <span className="label-text-alt text-error text-xs">{errors.fullName.message}</span>
                  </label>
                )}
              </div>

              {/* Email (disabled) */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaEnvelope className="text-primary" size={12} />
                    Email Address
                  </span>
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  className={`input input-bordered input-sm sm:input-md w-full ${errors.email ? "input-error" : ""}`}
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  disabled // Email shouldn't be editable
                />
                {errors.email && (
                  <label className="label py-1">
                    <span className="label-text-alt text-error text-xs">{errors.email.message}</span>
                  </label>
                )}
              </div>

              {/* Phone */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaPhone className="text-primary" size={12} />
                    Phone Number
                  </span>
                </label>
                <input
                  type="tel"
                  placeholder="+1234567890"
                  className={`input input-bordered input-sm sm:input-md w-full ${errors.phone ? "input-error" : ""}`}
                  {...register("phone", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^[+]?[(]?[0-9]{1,3}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/,
                      message: "Invalid phone number",
                    },
                  })}
                />
                {errors.phone && (
                  <label className="label py-1">
                    <span className="label-text-alt text-error text-xs">{errors.phone.message}</span>
                  </label>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== STEP 2: ROLE & BLOOD GROUP ==================== */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-3 sm:space-y-4"
            >
              {/* Blood Type Selection */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaTint className="text-primary" size={12} />
                    Blood Type
                  </span>
                </label>
                <div className="grid grid-cols-2 xs:grid-cols-4 gap-2">
                  {BLOOD_TYPES.map((type) => (
                    <label key={type} className="cursor-pointer">
                      <input
                        type="radio"
                        value={type}
                        className="hidden"
                        {...register("bloodGroup", {
                          required: "Please select blood type",
                        })}
                      />
                      <div
                        className={`btn btn-xs sm:btn-sm w-full ${selectedBloodGroup === type
                          ? "btn-primary text-white"
                          : "btn-outline btn-primary"
                          }`}
                      >
                        {type}
                      </div>
                    </label>
                  ))}
                </div>
                {errors.bloodGroup && (
                  <label className="label py-1">
                    <span className="label-text-alt text-error text-xs">{errors.bloodGroup.message}</span>
                  </label>
                )}
              </div>

              {/* Role Selection */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaUser className="text-primary" size={12} />
                    User Role
                  </span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.value;
                    const isDisabled = currentUser?.role !== "super_admin" && role.value === "admin";

                    return (
                      <label
                        key={role.value}
                        className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                          } ${isSelected
                            ? `border-${role.color} bg-${role.color}/10`
                            : 'border-base-300 hover:border-primary/50'
                          }`}
                      >
                        <input
                          type="radio"
                          value={role.value}
                          className="hidden"
                          disabled={isDisabled}
                          {...register("role", {
                            required: "Please select role",
                          })}
                        />
                        <Icon className={`text-base sm:text-xl ${isSelected ? `text-${role.color}` : 'text-gray-400'}`} />
                        <div className="flex-1">
                          <p className={`font-semibold text-xs sm:text-sm ${isSelected ? `text-${role.color}` : ''}`}>
                            {role.label}
                          </p>
                          <p className="text-[10px] sm:text-xs opacity-70">{role.description}</p>
                        </div>
                        {isSelected && (
                          <FaCheckCircle className={`text-${role.color} text-xs sm:text-sm`} />
                        )}
                      </label>
                    );
                  })}
                </div>
                {errors.role && (
                  <label className="label py-1">
                    <span className="label-text-alt text-error text-xs">{errors.role.message}</span>
                  </label>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== STEP 3: PERSONAL INFORMATION ==================== */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-3 sm:space-y-4"
            >
              {/* Date of Birth */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaCalendarAlt className="text-primary" size={12} />
                    Date of Birth
                  </span>
                </label>
                <input
                  type="date"
                  className="input input-bordered input-sm sm:input-md w-full"
                  {...register("dateOfBirth")}
                />
              </div>

              {/* Gender */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaVenusMars className="text-primary" size={12} />
                    Gender
                  </span>
                </label>
                <select
                  className="select select-bordered select-sm sm:select-md w-full"
                  {...register("gender")}
                >
                  <option value="">Select Gender</option>
                  {GENDERS.map(gender => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>
              </div>

              {/* Weight */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaWeight className="text-primary" size={12} />
                    Weight (kg)
                  </span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Enter weight"
                  className="input input-bordered input-sm sm:input-md w-full"
                  {...register("weight", {
                    min: {
                      value: 30,
                      message: "Weight must be at least 30kg",
                    },
                    max: {
                      value: 200,
                      message: "Weight cannot exceed 200kg",
                    },
                  })}
                />
                {errors.weight && (
                  <label className="label py-1">
                    <span className="label-text-alt text-error text-xs">{errors.weight.message}</span>
                  </label>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== STEP 4: ADDRESS ==================== */}
          {step === 4 && (
            <motion.div
              key="step4"
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
                    <FaMapMarkerAlt className="text-primary" size={12} />
                    Street Address
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Street address"
                  className="input input-bordered input-sm sm:input-md w-full"
                  {...register("street")}
                />
              </div>

              {/* City & State Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* City */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm">City</span>
                  </label>
                  <input
                    type="text"
                    placeholder="City"
                    className="input input-bordered input-sm sm:input-md w-full"
                    {...register("city")}
                  />
                </div>

                {/* State */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm">State</span>
                  </label>
                  <input
                    type="text"
                    placeholder="State"
                    className="input input-bordered input-sm sm:input-md w-full"
                    {...register("state")}
                  />
                </div>
              </div>

              {/* Zip Code & Country Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Zip Code */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm">Zip Code</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Zip Code"
                    className="input input-bordered input-sm sm:input-md w-full"
                    {...register("zipCode")}
                  />
                </div>

                {/* Country */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm">Country</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Country"
                    className="input input-bordered input-sm sm:input-md w-full"
                    {...register("country")}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== STEP 5: SETTINGS & VERIFICATION ==================== */}
          {step === 5 && (currentUser?.role === "admin" || currentUser?.role === "super_admin") && (
            <motion.div
              key="step5-admin"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 sm:space-y-6"
            >

              {/* Verification Status */}
              <div className="bg-base-200 rounded-xl p-4 sm:p-6 space-y-4">
                <h4 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                  <FaIdCard className="text-primary" />
                  Verification Status
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { name: "isEmailVerified", label: "Email Verified" },
                    { name: "isPhoneVerified", label: "Phone Verified" },
                    { name: "isIdentityVerified", label: "Identity Verified" },
                  ].map((item) => (
                    <label
                      key={item.name}
                      className="flex items-center gap-3 p-3 rounded-lg border border-base-300 hover:border-primary transition cursor-pointer bg-base-100"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        {...register(item.name)}
                      />
                      <span className="text-xs sm:text-sm font-medium">
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notification Settings */}
              <div className="bg-base-200 rounded-xl p-4 sm:p-6 space-y-4">
                <h4 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                  <FaBell className="text-primary" />
                  Notification Settings
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { name: "emailNotifications", label: "Email Notifications" },
                    { name: "smsNotifications", label: "SMS Notifications" },
                    { name: "pushNotifications", label: "Push Notifications" },
                  ].map((item) => (
                    <label
                      key={item.name}
                      className="flex items-center gap-3 p-3 rounded-lg border border-base-300 hover:border-primary transition cursor-pointer bg-base-100"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        {...register(item.name)}
                      />
                      <span className="text-xs sm:text-sm font-medium">
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="bg-base-200 rounded-xl p-4 sm:p-6 space-y-4">
                <h4 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                  <FaGlobe className="text-primary" />
                  Privacy Settings
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { name: "showLocation", label: "Show Location" },
                    { name: "showContact", label: "Show Contact Info" },
                    { name: "showLastDonation", label: "Show Last Donation" },
                  ].map((item) => (
                    <label
                      key={item.name}
                      className="flex items-center gap-3 p-3 rounded-lg border border-base-300 hover:border-primary transition cursor-pointer bg-base-100"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        {...register(item.name)}
                      />
                      <span className="text-xs sm:text-sm font-medium">
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {/* ==================== STEP 5 FOR NON-ADMIN ==================== */}
          {step === 5 && currentUser?.role !== "admin" && currentUser?.role !== "super_admin" && (
            <motion.div
              key="step5-summary"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-3 sm:space-y-4"
            >
              <div className="alert alert-info bg-info/10 border-info/20 flex-col sm:flex-row gap-2 p-3 sm:p-4">
                <FaCheckCircle className="text-info text-lg sm:text-xl shrink-0" />
                <span className="text-xs sm:text-sm text-center sm:text-left">
                  Review the information before updating.
                </span>
              </div>

              {/* User Information Summary */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                <h4 className="font-semibold text-xs sm:text-sm">User Information</h4>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 text-[10px] sm:text-xs">
                  <div>
                    <p className="opacity-70">Full Name</p>
                    <p className="font-medium wrap-break-word">{watch("fullName")}</p>
                  </div>
                  <div>
                    <p className="opacity-70">Email</p>
                    <p className="font-medium wrap-break-word">{watch("email")}</p>
                  </div>
                  <div>
                    <p className="opacity-70">Phone</p>
                    <p className="font-medium wrap-break-word">{watch("phone")}</p>
                  </div>
                  <div>
                    <p className="opacity-70">Blood Type</p>
                    <p className="font-medium text-primary">{watch("bloodGroup")}</p>
                  </div>
                  <div>
                    <p className="opacity-70">Role</p>
                    <p className="font-medium capitalize">{watch("role")}</p>
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
                className="btn btn-outline btn-primary btn-sm sm:btn-md w-1/2 sm:w-auto flex items-center gap-2"
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
                <>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="btn btn-primary text-white btn-sm sm:btn-md w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    <span>Next</span>
                    <span>→</span>
                  </button>
                </>
              ) : (
                <>
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
                    className="btn btn-primary text-white btn-sm sm:btn-md w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <FaUserEdit className="text-sm" />
                        <span>Update User</span>
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

export default EditUserModal;
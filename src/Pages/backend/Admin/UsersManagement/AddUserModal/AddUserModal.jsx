// Pages/backend/Admin/UsersManagement/AddUserModal/AddUserModal.jsx

// React
import React, { useState } from "react";
import { useForm } from "react-hook-form";

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FaTint,
  FaUser,
  FaEnvelope,
  FaLock,
  FaPhone,
  FaMapMarkerAlt,
  FaEye,
  FaEyeSlash,
  FaHeartbeat,
  FaBuilding,
  FaShieldAlt,
  FaTimes,
  FaUserPlus,
  FaCheckCircle,
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
 * Add User Modal Component
 * Multi-step form for creating new users with different roles
 * 
 * @param {Function} refreshUsers - Function to refresh the users list after successful creation
 */
const AddUserModal = ({ refreshUsers }) => {
  const { axiosInstance } = useAxiosPublic();
  const { user, loading: authLoading } = useAuth();

  // ==================== STATE MANAGEMENT ====================

  const [step, setStep] = useState(1);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ==================== FORM HANDLING ====================

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    reset,
  } = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      bloodGroup: "",
      role: "donor",
    },
  });

  // Watch form values for dynamic UI updates
  const password = watch("password");
  const selectedRole = watch("role");
  const selectedBloodGroup = watch("bloodGroup");

  // ==================== COMPUTED VALUES ====================

  /**
   * Filter roles based on current user's permissions
   * Super admin can assign any role
   * Admin cannot assign admin role
   */
  const roles = ALL_ROLES.filter(role => {
    if (user?.role === "super_admin") return true; // super admin can assign anything
    if (user?.role === "admin" && role.value === "admin") return false; // admin cannot assign admin
    return true; // everyone else can assign all non-admin roles
  });

  /**
   * Calculate password strength
   */
  const getPasswordStrength = () => {
    if (!password) return null;
    if (password.length < 6) return "Weak";
    if (password.length < 10) return "Medium";
    return "Strong";
  };

  const passwordStrength = getPasswordStrength();

  // ==================== HANDLER FUNCTIONS ====================

  /**
   * Close modal and reset form
   */
  const closeModal = () => {
    reset();
    setStep(1);
    setApiError("");
    document.getElementById('add_user_modal').close();
  };

  /**
   * Validate and move to next step
   */
  const nextStep = async () => {
    setApiError("");
    let fieldsToValidate = [];

    if (step === 1) fieldsToValidate = ["fullName", "email", "phone"];
    if (step === 2) fieldsToValidate = ["bloodGroup", "role", "password"];

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

    const registerData = {
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: data.role,
      fullName: data.fullName,
      bloodGroup: data.bloodGroup,
    };

    try {
      const response = await axiosInstance.post("/auth/register", registerData);

      if (response.data.success) {
        closeModal();
        refreshUsers();

        await Swal.fire({
          title: "User Created",
          text: "The user has been created successfully.",
          icon: "success",
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
      }
    } catch (error) {
      console.error("Failed to create user:", error);
      setApiError(error.response?.data?.error || "Failed to create user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <BloodLoader fullscreen={false} />;

  // ==================== RENDER ====================

  return (
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="modal-box w-11/12 max-w-2xl p-0 overflow-hidden bg-base-100 mx-2 sm:mx-0"
    >

      {/* ==================== MODAL HEADER ==================== */}
      <div className="bg-linear-to-r from-error to-error/80 p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

          {/* Title and icon */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-white/20 p-2 sm:p-3 rounded-full">
              <FaUserPlus size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-2xl">Add New User</h2>
              <p className="text-white/80 text-xs sm:text-sm">Create a new user account</p>
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
          <div className={`step step-xs sm:step-md ${step >= 2 ? "step-error" : ""}`}>Role & Blood</div>
          <div className={`step step-xs sm:step-md ${step >= 3 ? "step-error" : ""}`}>Review</div>
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

      <form
        onSubmit={(e) => {
          if (step !== 3) {
            e.preventDefault();
            return;
          }
          handleSubmit(onSubmit)(e);
        }}
      >
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
                    <FaUser className="text-error" size={12} />
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

              {/* Email */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaEnvelope className="text-error" size={12} />
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
                    <FaPhone className="text-error" size={12} />
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
                    <FaTint className="text-error" size={12} />
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
                          ? "btn-error text-white"
                          : "btn-outline btn-error"
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
                    <FaUser className="text-error" size={12} />
                    User Role
                  </span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.value;
                    return (
                      <label
                        key={role.value}
                        className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                          ? `border-${role.color} bg-${role.color}/10`
                          : 'border-base-300 hover:border-error/50'
                          }`}
                      >
                        <input
                          type="radio"
                          value={role.value}
                          className="hidden"
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

              {/* Password */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaLock className="text-error" size={12} />
                    Password
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    className={`input input-bordered input-sm sm:input-md w-full pr-10 ${errors.password ? "input-error" : ""}`}
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                      pattern: {
                        value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/,
                        message: "Password must contain at least one letter and one number",
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-error"
                  >
                    {showPassword ? <FaEyeSlash size={14} className="sm:w-4 sm:h-4" /> : <FaEye size={14} className="sm:w-4 sm:h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <label className="label py-1">
                    <span className="label-text-alt text-error text-xs">{errors.password.message}</span>
                  </label>
                )}
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <motion.div
                  className="space-y-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded transition-all duration-300 ${passwordStrength === 'Strong'
                          ? i <= 3 ? 'bg-success' : 'bg-base-300'
                          : passwordStrength === 'Medium'
                            ? i <= 2 ? 'bg-warning' : 'bg-base-300'
                            : passwordStrength === 'Weak'
                              ? i <= 1 ? 'bg-error' : 'bg-base-300'
                              : 'bg-base-300'
                          }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] sm:text-xs opacity-70">
                    Password strength: <span className={
                      passwordStrength === 'Strong' ? 'text-success' :
                        passwordStrength === 'Medium' ? 'text-warning' :
                          'text-error'
                    }>{passwordStrength}</span>
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ==================== STEP 3: REVIEW ==================== */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-3 sm:space-y-4"
            >
              <div className="alert alert-info bg-info/10 border-info/20 flex-col sm:flex-row gap-2 p-3 sm:p-4">
                <FaCheckCircle className="text-info text-lg sm:text-xl shrink-0" />
                <span className="text-xs sm:text-sm text-center sm:text-left">
                  Please review the user information before creating the account.
                </span>
              </div>

              {/* Basic Information Summary */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                  <FaUser className="text-error" size={12} />
                  Basic Information
                </h4>
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
                </div>
              </div>

              {/* Role & Blood Type Summary */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                  <FaTint className="text-error" size={12} />
                  Role & Blood Type
                </h4>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 text-[10px] sm:text-xs">
                  <div>
                    <p className="opacity-70">Blood Type</p>
                    <p className="font-medium text-error">{watch("bloodGroup")}</p>
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


              {step < 3 ? (
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

export default AddUserModal;
// React
import React, { useState } from "react";
import { useForm } from "react-hook-form";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

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
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";
import useAuth from "../../../../../hooks/useAuth";

const AddUserModal = ({ refreshUsers }) => {
  const { axiosInstance } = useAxiosPublic();
  const { user, loading: authLoading } = useAuth();

  // States
  const [step, setStep] = useState(1);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form handling
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

  // Watch form values
  const password = watch("password");
  const selectedRole = watch("role");
  const selectedBloodGroup = watch("bloodGroup");

  // Constants
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // Roles
  const allRoles = [
    { value: "donor", label: "Blood Donor", icon: FaTint, description: "User can donate blood", color: "success" },
    { value: "requester", label: "Blood Requester", icon: FaHeartbeat, description: "User can request blood", color: "warning" },
    { value: "hospital", label: "Hospital Staff", icon: FaMapMarkerAlt, description: "User represents a hospital", color: "info" },
    { value: "blood_bank", label: "Blood Bank Staff", icon: FaBuilding, description: "User works at blood bank", color: "secondary" },
    { value: "admin", label: "Administrator", icon: FaShieldAlt, description: "User has admin privileges", color: "error" },
  ];

  // Filter roles based on current user
  const roles = allRoles.filter(role => {
    if (user?.role === "super_admin") return true; // super admin can assign anything
    if (user?.role === "admin" && role.value === "admin") return false; // admin cannot assign admin
    return true; // everyone else can assign all non-admin roles
  });

  // Close Modal Function
  const closeModal = () => {
    reset();
    setStep(1);
    setApiError(""); // Clear any API errors
    document.getElementById('add_user_modal').close();
  };

  // Step Next handler
  const nextStep = async () => {
    setApiError(""); // Clear API error when moving to next step
    let fieldsToValidate = [];
    if (step === 1) fieldsToValidate = ["fullName", "email", "phone"];
    if (step === 2) fieldsToValidate = ["bloodGroup", "role", "password"];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  // Step Prev handler
  const prevStep = () => {
    setApiError(""); // Clear API error when going back
    setStep(step - 1);
  };

  // Submit handler
  const onSubmit = async (data) => {
    setLoading(true);
    setApiError(""); // Clear any previous API errors

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
        // Close modal and refresh after alert
        closeModal();
        refreshUsers();

        // SweetAlert2 success with DaisyUI styling
        await Swal.fire({
          title: "User Created",
          text: "The user has been created successfully.",
          icon: "success",
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
            title: "text-lg font-bold text-green-600",
            content: "text-base text-base-content/80",
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

  if (authLoading) return <div>Loading...</div>;

  return (
    <div className="modal-box w-11/12 max-w-2xl p-0 overflow-hidden bg-base-100">
      {/* Header */}
      <div className="bg-linear-to-r from-error to-error/80 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <FaUserPlus size={24} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">Add New User</h3>
              <p className="text-white/80 text-sm">Create a new user account</p>
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
          <div className={`step ${step >= 2 ? "step-error" : ""}`}>Role & Blood</div>
          <div className={`step ${step >= 3 ? "step-error" : ""}`}>Review</div>
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
                    <FaUser className="text-error" /> Full Name
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  className={`input input-bordered w-full ${errors.fullName ? "input-error" : ""}`}
                  {...register("fullName", {
                    required: "Full name is required",
                    minLength: {
                      value: 3,
                      message: "Name must be at least 3 characters",
                    },
                  })}
                />
                {errors.fullName && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.fullName.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaEnvelope className="text-error" /> Email Address
                  </span>
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  className={`input input-bordered w-full ${errors.email ? "input-error" : ""}`}
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                />
                {errors.email && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.email.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaPhone className="text-error" /> Phone Number
                  </span>
                </label>
                <input
                  type="tel"
                  placeholder="+1234567890"
                  className={`input input-bordered w-full ${errors.phone ? "input-error" : ""}`}
                  {...register("phone", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^[+]?[(]?[0-9]{1,3}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/,
                      message: "Invalid phone number",
                    },
                  })}
                />
                {errors.phone && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.phone.message}</span>
                  </label>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Role & Blood Group */}
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
                    <FaTint className="text-error" /> Blood Type
                  </span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {bloodTypes.map((type) => (
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
                        className={`btn btn-sm w-full ${selectedBloodGroup === type
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
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.bloodGroup.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaUser className="text-error" /> User Role
                  </span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.value;
                    return (
                      <label
                        key={role.value}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${isSelected
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
                        <Icon className={`text-xl ${isSelected ? `text-${role.color}` : 'text-gray-400'}`} />
                        <div className="flex-1">
                          <p className={`font-semibold ${isSelected ? `text-${role.color}` : ''}`}>
                            {role.label}
                          </p>
                          <p className="text-xs opacity-70">{role.description}</p>
                        </div>
                        {isSelected && (
                          <FaCheckCircle className={`text-${role.color}`} />
                        )}
                      </label>
                    );
                  })}
                </div>
                {errors.role && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.role.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaLock className="text-error" /> Password
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    className={`input input-bordered w-full pr-10 ${errors.password ? "input-error" : ""}`}
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-error"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.password.message}</span>
                  </label>
                )}
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${password.length > i * 3 ? 'bg-error' : 'bg-base-300'
                          }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs opacity-70">
                    Password strength: {
                      password.length < 6 ? 'Weak' :
                        password.length < 10 ? 'Medium' : 'Strong'
                    }
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="alert alert-info bg-info/10 border-info/20">
                <FaCheckCircle className="text-info" />
                <span className="text-white">Please review the user information before creating the account.</span>
              </div>

              <div className="bg-base-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <FaUser className="text-error" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="opacity-70">Full Name</p>
                    <p className="font-medium">{watch("fullName")}</p>
                  </div>
                  <div>
                    <p className="opacity-70">Email</p>
                    <p className="font-medium">{watch("email")}</p>
                  </div>
                  <div>
                    <p className="opacity-70">Phone</p>
                    <p className="font-medium">{watch("phone")}</p>
                  </div>
                </div>
              </div>

              <div className="bg-base-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <FaTint className="text-error" />
                  Role & Blood Type
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
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
            {step < 3 ? (
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaUserPlus />
                      Create User
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

export default AddUserModal;
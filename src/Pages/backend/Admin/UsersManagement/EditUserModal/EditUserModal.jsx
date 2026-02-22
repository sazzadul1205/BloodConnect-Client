// Pages/backend/Admin/UsersManagement/EditUserModal/EditUserModal.jsx

// React
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

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

const EditUserModal = ({ userId, refreshUsers, onClose }) => {
  const { axiosInstance } = useAxiosPublic();
  const { user: currentUser, loading: authLoading } = useAuth();

  // States
  const [step, setStep] = useState(1);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Form handling
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

  // Watch form values
  const selectedRole = watch("role");
  const selectedBloodGroup = watch("bloodGroup");
  // const selectedGender = watch("gender");

  // Constants
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const genders = ["Male", "Female", "Other", "Prefer not to say"];

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
    if (currentUser?.role === "super_admin") return true;
    if (currentUser?.role === "admin" && role.value === "admin") return false;
    return true;
  });

  // Fetch user data on mount
  useEffect(() => {

    // Function to fetch user data
    const fetchUserData = async () => {

      // Check if userId is available
      if (!userId) {
        setFetchLoading(false);
        return;
      }

      // Reset form and set loading state
      setApiError("");
      setFetchLoading(true);

      try {

        // Fetch user data
        const response = await axiosInstance.get(`/users/profile/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
        });


        // Check different possible response structures
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

  // Close Modal Function
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

  // Step Next handler
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

  // Step Prev handler
  const prevStep = () => {
    setApiError("");
    setStep(step - 1);
  };

  // Submit handler - Update user profile
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
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          title: "text-lg font-bold text-success",
          content: "text-base text-base-content/80",
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
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          title: "text-lg font-bold text-error",
          content: "text-base text-base-content/80",
          confirmButton: "btn btn-sm btn-error",
        },
        buttonsStyling: false,
      });
    } finally {
      setLoading(false);
    }
  };

  // Render
  if (authLoading || fetchLoading) return <BloodLoader fullscreen={false} />;

  return (
    <div className="modal-box w-11/12 max-w-3xl p-0 overflow-hidden bg-base-100">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 to-blue-400 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <FaUserEdit size={24} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">Edit User</h3>
              <p className="text-white/80 text-sm">Update user information</p>
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
        <ul className="steps steps-horizontal w-full">
          <li className={`step ${step >= 1 ? "step-primary" : ""}`}>Basic Info</li>
          <li className={`step ${step >= 2 ? "step-primary" : ""}`}>Role & Blood</li>
          <li className={`step ${step >= 3 ? "step-primary" : ""}`}>Personal</li>
          <li className={`step ${step >= 4 ? "step-primary" : ""}`}>Address</li>
          <li className={`step ${step >= 5 ? "step-primary" : ""}`}>Settings</li>
        </ul>
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
                    <FaUser className="text-primary" /> Full Name
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
                    <FaEnvelope className="text-primary" /> Email Address
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
                  disabled // Email shouldn't be editable
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
                    <FaPhone className="text-primary" /> Phone Number
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
                    <FaTint className="text-primary" /> Blood Type
                  </span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {bloodTypes.map((type) => (
                    <label key={type} className="cursor-pointer">
                      <input
                        type="radio"
                        value={type}
                        className="hidden peer"
                        {...register("bloodGroup", {
                          required: "Please select blood type",
                        })}
                      />
                      <div
                        className={`btn btn-sm w-full ${selectedBloodGroup === type
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
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.bloodGroup.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaUser className="text-primary" /> User Role
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
                          : 'border-base-300 hover:border-primary/50'
                          }`}
                      >
                        <input
                          type="radio"
                          value={role.value}
                          className="hidden"
                          {...register("role", {
                            required: "Please select role",
                          })}
                          disabled={currentUser?.role !== "super_admin" && role.value === "admin"}
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
            </motion.div>
          )}

          {/* Step 3: Personal Information */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaCalendarAlt className="text-primary" /> Date of Birth
                  </span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  {...register("dateOfBirth")}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaVenusMars className="text-primary" /> Gender
                  </span>
                </label>
                <select
                  className="select select-bordered w-full"
                  {...register("gender")}
                >
                  <option value="">Select Gender</option>
                  {genders.map(gender => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaWeight className="text-primary" /> Weight (kg)
                  </span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Enter weight"
                  className="input input-bordered w-full"
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
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.weight.message}</span>
                  </label>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 4: Address */}
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
                    <FaMapMarkerAlt className="text-primary" /> Street Address
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Street address"
                  className="input input-bordered w-full"
                  {...register("street")}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Zip Code</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Zip Code"
                    className="input input-bordered w-full"
                    {...register("zipCode")}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Country</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Country"
                    className="input input-bordered w-full"
                    {...register("country")}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5: Settings & Verification (Admin only) */}
          {step === 5 && (currentUser?.role === "admin" || currentUser?.role === "super_admin") && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-base-200 rounded-lg p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <FaIdCard className="text-primary" />
                  Verification Status
                </h4>
                <div className="space-y-2">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm"
                      {...register("isEmailVerified")}
                    />
                    <span className="label-text">Email Verified</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm"
                      {...register("isPhoneVerified")}
                    />
                    <span className="label-text">Phone Verified</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm"
                      {...register("isIdentityVerified")}
                    />
                    <span className="label-text">Identity Verified</span>
                  </label>
                </div>
              </div>

              <div className="bg-base-200 rounded-lg p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <FaBell className="text-primary" />
                  Notification Settings
                </h4>
                <div className="space-y-2">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm"
                      {...register("emailNotifications")}
                    />
                    <span className="label-text">Email Notifications</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm"
                      {...register("smsNotifications")}
                    />
                    <span className="label-text">SMS Notifications</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm"
                      {...register("pushNotifications")}
                    />
                    <span className="label-text">Push Notifications</span>
                  </label>
                </div>
              </div>

              <div className="bg-base-200 rounded-lg p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <FaGlobe className="text-primary" />
                  Privacy Settings
                </h4>
                <div className="space-y-2">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm"
                      {...register("showLocation")}
                    />
                    <span className="label-text">Show Location</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm"
                      {...register("showContact")}
                    />
                    <span className="label-text">Show Contact Info</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm"
                      {...register("showLastDonation")}
                    />
                    <span className="label-text">Show Last Donation</span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5 for non-admin (just summary) */}
          {step === 5 && currentUser?.role !== "admin" && currentUser?.role !== "super_admin" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="alert alert-info bg-info/10 border-info/20">
                <FaCheckCircle className="text-info" />
                <span>Review the information before updating.</span>
              </div>

              <div className="bg-base-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">User Information</h4>
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

        {/* Footer Actions */}
        <div className="modal-action border-t border-base-300 p-4 bg-base-200/50">
          <div className="flex justify-between w-full">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="btn btn-outline btn-primary"
              >
                ← Previous
              </button>
            )}
            {step < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn btn-primary text-white ml-auto"
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
                  className="btn btn-primary text-white gap-2"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaUserEdit />
                      Update User
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

export default EditUserModal;
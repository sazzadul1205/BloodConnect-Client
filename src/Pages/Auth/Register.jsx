// pages/auth/Register.jsx

// React
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FaTint, FaUser, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt,
  FaEye, FaEyeSlash, FaHeartbeat, FaArrowLeft, FaShieldAlt,
} from "react-icons/fa";

// Hooks
import useAuth from "../../hooks/useAuth";

// Components
import BloodDrops from "./BloodDrops";
import ThemeToggle from "../Frontend/layout/ThemeToggle";

const Register = () => {
  // States
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Hooks Call
  const { register: registerUser, loading, error } = useAuth();
  const navigate = useNavigate();

  // Form handling
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
  } = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      bloodGroup: "",
      role: "donor",
      agreeTerms: false,
    },
  });


  // Watch form values
  const password = watch("password");
  const selectedRole = watch("role");
  const selectedBloodGroup = watch("bloodGroup");


  // Form data
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const roles = [
    { value: "donor", label: "Blood Donor", icon: FaTint, description: "I want to donate blood" },
    { value: "requester", label: "Blood Requester", icon: FaHeartbeat, description: "I need blood" },
    { value: "hospital", label: "Hospital Staff", icon: FaMapMarkerAlt, description: "I represent a hospital" },
  ];

  // Step Next handler
  const nextStep = async () => {
    let fieldsToValidate = [];
    if (step === 1) fieldsToValidate = ["fullName", "email", "phone"];
    if (step === 2) fieldsToValidate = ["bloodGroup", "role"];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  // Step Prev handler
  const prevStep = () => {
    setStep(step - 1);
  };

  // Submit handler
  const onSubmit = async (data) => {
    try {
      // Prepare registration data according to API
      const registerData = {
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.role,
        fullName: data.fullName,
        bloodGroup: data.bloodGroup,
      };

      await registerUser(registerData);

      // Redirect based on role
      if (data.role === "donor") {
        navigate("/donor/dashboard");
      } else if (data.role === "hospital") {
        navigate("/hospital/dashboard");
      } else {
        navigate("/requester/dashboard");
      }
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-base-100 to-base-200 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background Blood Drops */}
      <BloodDrops />

      {/* Back Button */}
      <Link to="/">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05, x: -5 }}
          className="absolute top-6 left-6 btn btn-ghost btn-sm gap-2 bg-base-100/50 backdrop-blur-sm hover:bg-error hover:text-white transition-all duration-300"
        >
          <FaArrowLeft /> Back to Home
        </motion.button>
      </Link>


      {/* Theme Toggle */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05, x: -5 }}
        className="absolute top-6 right-6 "
      >
        <ThemeToggle />
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="w-full max-w-md"
      >
        <div className="card bg-base-100/90 backdrop-blur-md shadow-2xl border border-error/20">

          {/* Header */}
          <div className="card-body p-6 sm:p-8">
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="relative inline-block"
              >
                <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaTint className="text-4xl text-error animate-bounce" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-error rounded-full animate-ping"></div>
              </motion.div>

              <h2 className="text-3xl font-bold bg-linear-to-r from-error to-error/70 bg-clip-text text-transparent">
                Join BloodConnect
              </h2>
              <p className="text-sm opacity-70 mt-1">
                Become a life-saver. Register in under 2 minutes.
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="alert alert-error shadow-lg mb-4">
                <div>
                  <span>{error.response?.data?.error || "Registration failed. Please try again."}</span>
                </div>
              </div>
            )}

            {/* Progress Steps using DaisyUI */}
            <div className="steps steps-horizontal mb-6">
              <div className={`step ${step >= 1 ? "step-secondary" : ""}`}></div>
              <div className={`step ${step >= 2 ? "step-secondary" : ""}`}></div>
              <div className={`step ${step >= 3 ? "step-secondary" : ""}`}></div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <FaUser className="text-error" /> Full Name
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="John Doe"
                        className={`input input-bordered w-full pl-10 focus:input-error ${errors.fullName ? "input-error" : ""
                          }`}
                        {...register("fullName", {
                          required: "Full name is required",
                          minLength: {
                            value: 3,
                            message: "Name must be at least 3 characters",
                          },
                        })}
                      />
                      <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    {errors.fullName && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.fullName.message}</span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <FaEnvelope className="text-error" /> Email
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="john@example.com"
                        className={`input input-bordered w-full pl-10 focus:input-error ${errors.email ? "input-error" : ""
                          }`}
                        {...register("email", {
                          required: "Email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address",
                          },
                        })}
                      />
                      <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
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
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="+1234567890"
                        className={`input input-bordered w-full pl-10 focus:input-error ${errors.phone ? "input-error" : ""
                          }`}
                        {...register("phone", {
                          required: "Phone number is required",
                          pattern: {
                            value: /^[+]?[(]?[0-9]{1,3}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/,
                            message: "Invalid phone number",
                          },
                        })}
                      />
                      <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    {errors.phone && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.phone.message}</span>
                      </label>
                    )}
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={nextStep}
                    className="btn btn-error text-white w-full mt-4"
                  >
                    Continue → Next Step
                  </motion.button>
                </motion.div>
              )}

              {/* Step 2: Blood Type & Role */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
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
                              required: "Please select your blood type",
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
                        <FaUser className="text-error" /> I am a
                      </span>
                    </label>
                    <div className="space-y-2">
                      {roles.map((role) => {
                        const Icon = role.icon;
                        const isSelected = selectedRole === role.value;
                        return (
                          <label
                            key={role.value}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                              ? 'border-error bg-error/10'
                              : 'border-base-300 hover:border-error/50'
                              }`}
                          >
                            <input
                              type="radio"
                              value={role.value}
                              className="hidden"
                              {...register("role", {
                                required: "Please select your role",
                              })}
                            />
                            <Icon className={`text-xl ${isSelected ? 'text-error' : 'text-gray-400'}`} />
                            <div className="flex-1">
                              <p className={`font-semibold ${isSelected ? 'text-error' : ''}`}>
                                {role.label}
                              </p>
                              <p className="text-xs opacity-70">{role.description}</p>
                            </div>
                            {isSelected && (
                              <div className="w-4 h-4 bg-error rounded-full"></div>
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

                  <div className="flex gap-2 mt-4">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={prevStep}
                      className="btn btn-outline btn-error flex-1"
                    >
                      ← Back
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={nextStep}
                      className="btn btn-error text-white flex-1"
                    >
                      Continue →
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Password & Terms */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <FaLock className="text-error" /> Password
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className={`input input-bordered w-full pl-10 pr-10 focus:input-error ${errors.password ? "input-error" : ""
                          }`}
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
                      <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <FaLock className="text-error" /> Confirm Password
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className={`input input-bordered w-full pl-10 pr-10 focus:input-error ${errors.confirmPassword ? "input-error" : ""
                          }`}
                        {...register("confirmPassword", {
                          required: "Please confirm your password",
                          validate: (value) =>
                            value === password || "Passwords do not match",
                        })}
                      />
                      <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-error"
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.confirmPassword.message}</span>
                      </label>
                    )}
                  </div>

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded ${password.length > i * 3 ? 'bg-error' : 'bg-base-300'
                            }`}></div>
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

                  <div className="form-control">
                    <label className="cursor-pointer label justify-start gap-3">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-error checkbox-sm"
                        {...register("agreeTerms", {
                          required: "You must agree to the terms and conditions",
                        })}
                      />
                      <span className="label-text text-sm">
                        I agree to the <Link to="/TermsPrivacy" className="link link-error">Terms</Link> and <Link to="/TermsPrivacy" className="link link-error">Privacy Policy</Link>
                      </span>
                    </label>
                    {errors.agreeTerms && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.agreeTerms.message}</span>
                      </label>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={prevStep}
                      className="btn btn-outline btn-error flex-1"
                    >
                      ← Back
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={loading}
                      className="btn btn-error text-white flex-1 gap-2 disabled:bg-error/50"
                    >
                      {loading ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <FaHeartbeat /> Sign Up
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </form>

            {/* Login Link */}
            <p className="text-center text-sm mt-6">
              Already have an account?{" "}
              <Link to="/login" className="link link-error font-semibold hover:gap-2 transition-all">
                Sign In
              </Link>
            </p>
          </div>

          {/* Footer Stats */}
          <div className="bg-error/5 p-4 border-t border-error/10">
            <div className="flex justify-between text-xs">

              {/* Secure Login */}
              <div className="flex items-center gap-1">
                <FaShieldAlt className="text-error" />
                <span>Secure Login</span>
              </div>

              {/* Donors */}
              <div className="flex items-center gap-1">
                <FaHeartbeat className="text-error" />
                <span>5,000+ Donors</span>
              </div>

              {/* Support */}
              <div className="flex items-center gap-1">
                <FaTint className="text-error" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
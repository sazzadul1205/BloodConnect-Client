// pages/auth/Register.jsx

// React
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FaTint, FaUser, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt,
  FaEye, FaEyeSlash, FaHeartbeat, FaArrowLeft, FaShieldAlt,
  FaBuilding, FaCheckCircle
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
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  // eslint-disable-next-line react-hooks/incompatible-library
  const password = watch("password");
  const selectedRole = watch("role");
  const selectedBloodGroup = watch("bloodGroup");

  // Form data
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // Roles array
  const roles = [
    { value: "donor", label: "Blood Donor", icon: FaTint, description: "I want to donate blood" },
    { value: "requester", label: "Blood Requester", icon: FaHeartbeat, description: "I need blood" },
    { value: "hospital", label: "Hospital Staff", icon: FaMapMarkerAlt, description: "I represent a hospital" },
    { value: "blood_bank", label: "Blood Bank Staff", icon: FaBuilding, description: "I work at a blood bank" },
  ];

  // Step Next handler
  const nextStep = async () => {
    let fieldsToValidate = [];
    if (step === 1) fieldsToValidate = ["fullName", "email", "phone"];
    if (step === 2) fieldsToValidate = ["bloodGroup", "role"];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
      // Scroll to top on step change for mobile
      if (windowWidth < 768) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Step Prev handler
  const prevStep = () => {
    setStep(step - 1);
    // Scroll to top on step change for mobile
    if (windowWidth < 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
      } else if (data.role === "requester") {
        navigate("/requester/dashboard");
      } else if (data.role === "blood_bank") {
        navigate("/blood_bank/dashboard");
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
    <div className="min-h-screen bg-linear-to-br from-base-100 to-base-200 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">

      {/* Background Blood Drops */}
      <BloodDrops />

      {/* Back Button - Responsive */}
      <Link to="/">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05, x: -5 }}
          className="absolute top-3 sm:top-6 left-3 sm:left-6 btn btn-ghost btn-xs sm:btn-sm gap-1 sm:gap-2 bg-base-100/50 backdrop-blur-sm hover:bg-error hover:text-white transition-all duration-300 z-10"
        >
          <FaArrowLeft className="text-xs sm:text-sm" />
          <span className="hidden xs:inline">Back to Home</span>
        </motion.button>
      </Link>

      {/* Theme Toggle - Responsive */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05, x: -5 }}
        className="absolute top-3 sm:top-6 right-3 sm:right-6 z-10"
      >
        <ThemeToggle />
      </motion.div>

      {/* Main Card - Responsive */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="w-full max-w-[95%] xs:max-w-sm sm:max-w-md z-20 my-4 sm:my-8"
      >
        <div className="card bg-base-100/90 backdrop-blur-md shadow-2xl border border-error/20">

          {/* Header - Responsive */}
          <div className="card-body p-4 xs:p-5 sm:p-6 md:p-8">
            <div className="text-center mb-4 sm:mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="relative inline-block"
              >
                <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
                  <FaTint className="text-2xl xs:text-3xl sm:text-4xl text-error animate-bounce" />
                </div>
                <div className="absolute -top-1 -right-1 w-2 h-2 xs:w-3 xs:h-3 sm:w-4 sm:h-4 bg-error rounded-full animate-ping"></div>
              </motion.div>

              <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold bg-linear-to-r from-error to-error/70 bg-clip-text text-transparent">
                Join BloodConnect
              </h2>
              <p className="text-xs xs:text-sm opacity-70 mt-0.5 sm:mt-1 px-2">
                Become a life-saver. Register in under 2 minutes.
              </p>
            </div>

            {/* Error Display - Responsive */}
            {error && (
              <div className="alert alert-error shadow-lg mb-3 sm:mb-4 p-2 sm:p-3">
                <div className="text-xs sm:text-sm">
                  <span>{error.response?.data?.error || "Registration failed. Please try again."}</span>
                </div>
              </div>
            )}

            {/* Progress Steps - Responsive */}
            <div className="steps steps-horizontal mb-4 sm:mb-6 w-full">
              <div className={`step step-xs sm:step-sm ${step >= 1 ? "step-error" : ""}`} data-content={step >= 1 ? "✓" : "1"}></div>
              <div className={`step step-xs sm:step-sm ${step >= 2 ? "step-error" : ""}`} data-content={step >= 2 ? "✓" : "2"}></div>
              <div className={`step step-xs sm:step-sm ${step >= 3 ? "step-error" : ""}`} data-content={step >= 3 ? "✓" : "3"}></div>
            </div>

            {/* Step Indicators - Mobile Friendly */}
            <div className="text-center mb-3 sm:hidden">
              <span className="text-xs font-medium text-error">
                Step {step} of 3: {step === 1 ? 'Basic Info' : step === 2 ? 'Blood & Role' : 'Password'}
              </span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3 sm:space-y-4"
                >
                  {/* Full Name Field */}
                  <div className="form-control">
                    <label className="label py-1 sm:py-2">
                      <span className="label-text text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                        <FaUser className="text-error text-xs sm:text-sm" /> Full Name
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="John Doe"
                        className={`input input-bordered w-full pl-8 sm:pl-10 text-sm sm:text-base focus:input-error ${errors.fullName ? "input-error" : ""}`}
                        {...register("fullName", {
                          required: "Full name is required",
                          minLength: {
                            value: 3,
                            message: "Name must be at least 3 characters",
                          },
                        })}
                      />
                      <FaUser className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
                    </div>
                    {errors.fullName && (
                      <label className="label py-1">
                        <span className="label-text-alt text-error text-xs">{errors.fullName.message}</span>
                      </label>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="form-control">
                    <label className="label py-1 sm:py-2">
                      <span className="label-text text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                        <FaEnvelope className="text-error text-xs sm:text-sm" /> Email
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="john@example.com"
                        className={`input input-bordered w-full pl-8 sm:pl-10 text-sm sm:text-base focus:input-error ${errors.email ? "input-error" : ""}`}
                        {...register("email", {
                          required: "Email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address",
                          },
                        })}
                      />
                      <FaEnvelope className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
                    </div>
                    {errors.email && (
                      <label className="label py-1">
                        <span className="label-text-alt text-error text-xs">{errors.email.message}</span>
                      </label>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div className="form-control">
                    <label className="label py-1 sm:py-2">
                      <span className="label-text text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                        <FaPhone className="text-error text-xs sm:text-sm" /> Phone Number
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="+1234567890"
                        className={`input input-bordered w-full pl-8 sm:pl-10 text-sm sm:text-base focus:input-error ${errors.phone ? "input-error" : ""}`}
                        {...register("phone", {
                          required: "Phone number is required",
                          pattern: {
                            value: /^[+]?[(]?[0-9]{1,3}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/,
                            message: "Invalid phone number",
                          },
                        })}
                      />
                      <FaPhone className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
                    </div>
                    {errors.phone && (
                      <label className="label py-1">
                        <span className="label-text-alt text-error text-xs">{errors.phone.message}</span>
                      </label>
                    )}
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: windowWidth < 640 ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={nextStep}
                    className="btn btn-error text-white w-full mt-2 sm:mt-4 text-xs sm:text-sm"
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
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3 sm:space-y-4"
                >
                  {/* Blood Type Selection - Responsive Grid */}
                  <div className="form-control">
                    <label className="label py-1 sm:py-2">
                      <span className="label-text text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                        <FaTint className="text-error text-xs sm:text-sm" /> Blood Type
                      </span>
                    </label>
                    <div className="grid grid-cols-4 gap-1 sm:gap-2">
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
                            className={`btn btn-xs sm:btn-sm w-full text-xs sm:text-sm ${selectedBloodGroup === type
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

                  {/* Role Selection - Responsive */}
                  <div className="form-control">
                    <label className="label py-1 sm:py-2">
                      <span className="label-text text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                        <FaUser className="text-error text-xs sm:text-sm" /> I am a
                      </span>
                    </label>
                    <div className="space-y-1 sm:space-y-2">
                      {roles.map((role) => {
                        const Icon = role.icon;
                        const isSelected = selectedRole === role.value;
                        return (
                          <label
                            key={role.value}
                            className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-all ${isSelected
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
                            <Icon className={`text-base sm:text-xl shrink-0 ${isSelected ? 'text-error' : 'text-gray-400'}`} />
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold text-xs sm:text-sm ${isSelected ? 'text-error' : ''}`}>
                                {role.label}
                              </p>
                              <p className="text-[10px] sm:text-xs opacity-70 truncate">{role.description}</p>
                            </div>
                            {isSelected && (
                              <FaCheckCircle className="text-error text-sm sm:text-base shrink-0" />
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

                  {/* Navigation Buttons - Responsive */}
                  <div className="flex gap-2 mt-2 sm:mt-4">
                    <motion.button
                      type="button"
                      whileHover={{ scale: windowWidth < 640 ? 1 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={prevStep}
                      className="btn btn-outline btn-error flex-1 text-xs sm:text-sm"
                    >
                      ← Back
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: windowWidth < 640 ? 1 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={nextStep}
                      className="btn btn-error text-white flex-1 text-xs sm:text-sm"
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
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3 sm:space-y-4"
                >
                  {/* Password Field */}
                  <div className="form-control">
                    <label className="label py-1 sm:py-2">
                      <span className="label-text text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                        <FaLock className="text-error text-xs sm:text-sm" /> Password
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className={`input input-bordered w-full pl-8 sm:pl-10 pr-8 sm:pr-10 text-sm sm:text-base focus:input-error ${errors.password ? "input-error" : ""}`}
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
                      <FaLock className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-error"
                      >
                        {showPassword ? <FaEyeSlash className="text-sm sm:text-base" /> : <FaEye className="text-sm sm:text-base" />}
                      </button>
                    </div>
                    {errors.password && (
                      <label className="label py-1">
                        <span className="label-text-alt text-error text-xs">{errors.password.message}</span>
                      </label>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="form-control">
                    <label className="label py-1 sm:py-2">
                      <span className="label-text text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                        <FaLock className="text-error text-xs sm:text-sm" /> Confirm Password
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className={`input input-bordered w-full pl-8 sm:pl-10 pr-8 sm:pr-10 text-sm sm:text-base focus:input-error ${errors.confirmPassword ? "input-error" : ""}`}
                        {...register("confirmPassword", {
                          required: "Please confirm your password",
                          validate: (value) =>
                            value === password || "Passwords do not match",
                        })}
                      />
                      <FaLock className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-error"
                      >
                        {showConfirmPassword ? <FaEyeSlash className="text-sm sm:text-base" /> : <FaEye className="text-sm sm:text-base" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <label className="label py-1">
                        <span className="label-text-alt text-error text-xs">{errors.confirmPassword.message}</span>
                      </label>
                    )}
                  </div>

                  {/* Password Strength Indicator - Responsive */}
                  {password && (
                    <div className="space-y-1">
                      <div className="flex gap-0.5 sm:gap-1">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1 sm:h-1.5 flex-1 rounded transition-all ${password.length > i * 3 ? 'bg-error' : 'bg-base-300'
                              }`}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] sm:text-xs opacity-70">
                        Password strength: {
                          password.length < 6 ? 'Weak' :
                            password.length < 10 ? 'Medium' : 'Strong'
                        }
                      </p>
                    </div>
                  )}

                  {/* Terms Checkbox - Responsive */}
                  <div className="form-control">
                    <label className="cursor-pointer label justify-start gap-2 sm:gap-3 py-1">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-error checkbox-xs sm:checkbox-sm"
                        {...register("agreeTerms", {
                          required: "You must agree to the terms and conditions",
                        })}
                      />
                      <span className="label-text text-[10px] sm:text-sm">
                        I agree to the <Link to="/TermsPrivacy" className="link link-error">Terms</Link> and <Link to="/TermsPrivacy" className="link link-error">Privacy Policy</Link>
                      </span>
                    </label>
                    {errors.agreeTerms && (
                      <label className="label py-1">
                        <span className="label-text-alt text-error text-xs">{errors.agreeTerms.message}</span>
                      </label>
                    )}
                  </div>

                  {/* Navigation Buttons - Responsive */}
                  <div className="flex gap-2 mt-2 sm:mt-4">
                    <motion.button
                      type="button"
                      whileHover={{ scale: windowWidth < 640 ? 1 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={prevStep}
                      className="btn btn-outline btn-error flex-1 text-xs sm:text-sm"
                    >
                      ← Back
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: windowWidth < 640 ? 1 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={loading}
                      className="btn btn-error text-white flex-1 gap-1 sm:gap-2 disabled:bg-error/50 text-xs sm:text-sm"
                    >
                      {loading ? (
                        <>
                          <span className="loading loading-spinner loading-xs sm:loading-sm"></span>
                          <span className="hidden xs:inline">Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <FaHeartbeat className="text-xs sm:text-sm" />
                          <span>Sign Up</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </form>

            {/* Login Link - Responsive */}
            <p className="text-center text-xs sm:text-sm mt-4 sm:mt-6">
              Already have an account?{" "}
              <Link to="/login" className="link link-error font-semibold hover:gap-2 transition-all">
                Sign In
              </Link>
            </p>
          </div>

          {/* Footer Stats - Responsive */}
          <div className="bg-error/5 p-2 sm:p-4 border-t border-error/10">
            <div className="flex justify-between text-[8px] xs:text-[10px] sm:text-xs">

              {/* Secure Login */}
              <div className="flex items-center gap-0.5 sm:gap-1">
                <FaShieldAlt className="text-error text-xs sm:text-sm" />
                <span className="hidden xs:inline">Secure Login</span>
              </div>

              {/* Donors */}
              <div className="flex items-center gap-0.5 sm:gap-1">
                <FaHeartbeat className="text-error text-xs sm:text-sm" />
                <span className="hidden xs:inline">5,000+ Donors</span>
              </div>

              {/* Support */}
              <div className="flex items-center gap-0.5 sm:gap-1">
                <FaTint className="text-error text-xs sm:text-sm" />
                <span className="hidden xs:inline">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
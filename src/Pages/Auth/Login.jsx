// Pages/auth/Login.jsx

// React
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FaTint, FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaArrowLeft, FaHeartbeat, FaShieldAlt, FaPhone,
  FaUserMd, FaHospital, FaUserTie, FaFlask, FaRocket,
  FaUsers, FaTimes
} from "react-icons/fa";

// Hooks
import useAuth from "../../hooks/useAuth";

// Components
import ThemeToggle from "../Frontend/layout/ThemeToggle";
import BloodDrops from "./BloodDrops";

const Login = () => {
  // States 
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState("email");
  const [showDemoPanel, setShowDemoPanel] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-show demo panel on larger screens, hide on mobile by default
  useEffect(() => {
    if (windowWidth >= 1024) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowDemoPanel(true);
    } else {
      setShowDemoPanel(false);
    }
  }, [windowWidth]);

  // Hooks Call
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  // Form handling
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      phone: "",
      password: "",
    },
  });

  // Demo accounts for quick login
  const demoAccounts = [
    {
      role: "Donor",
      email: "donor@gmail.com",
      password: "Donor1205",
      icon: <FaHeartbeat />,
      color: "bg-error",
      description: "View donation history & find events"
    },
    {
      role: "Requester",
      email: "Requester@gmail.com",
      password: "Requester1205",
      icon: <FaUserMd />,
      color: "bg-warning",
      description: "Request blood for patients"
    },
    {
      role: "Hospital Staff",
      email: "HospitalStaff@gmail.com",
      password: "Demo1234",
      icon: <FaHospital />,
      color: "bg-info",
      description: "Manage blood requests & inventory"
    },
    {
      role: "Blood Bank",
      email: "BloodBank@gmail.com",
      password: "Demo1234",
      icon: <FaFlask />,
      color: "bg-secondary",
      description: "Track donations & manage stock"
    },
    {
      role: "Admin",
      email: "admin@gmail.com",
      password: "Admin1205",
      icon: <FaUserTie />,
      color: "bg-purple-600",
      description: "Full system access & analytics"
    }
  ];

  // Redirect based on role
  const roleRoutes = {
    donor: "/donor/dashboard",
    hospital: "/hospital/dashboard",
    requester: "/requester/dashboard",
    blood_bank: "/blood_bank/bank-profile",
    admin: "/admin/dashboard",
    super_admin: "/super_admin/dashboard",
  };

  // Quick paste function - just fills the form without logging in
  const fillCredentials = (email, password) => {
    setValue("email", email);
    setValue("password", password);
    setLoginMethod("email");

    // Optional: Show a small notification
    const toast = document.createElement('div');
    toast.className = 'toast toast-top toast-center z-50';
    toast.innerHTML = `
      <div class="alert alert-success shadow-lg">
        <span>Credentials pasted! Click Sign In to continue.</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);

    // Close demo panel on mobile after selection
    if (windowWidth < 768) {
      setShowDemoPanel(false);
    }
  };

  // Submit handler
  const onSubmit = async (data) => {
    try {
      const loginData = {
        password: data.password,
        ...(loginMethod === "email"
          ? { email: data.email }
          : { phone: data.phone }),
      };

      const user = await login(loginData);
      navigate(roleRoutes[user.role] || "/");
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-base-100 to-base-200 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">

      {/* Background Blood Drops Animation */}
      <BloodDrops />

      {/* Back Button - Responsive positioning */}
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

      {/* Theme Toggle - Responsive positioning */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05, x: -5 }}
        className="absolute top-3 sm:top-6 right-3 sm:right-6 z-10"
      >
        <ThemeToggle />
      </motion.div>

      {/* Mobile Demo Panel Toggle Button */}
      {windowWidth < 768 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setShowDemoPanel(!showDemoPanel)}
          className="fixed bottom-4 right-4 z-30 btn btn-error btn-circle shadow-lg"
        >
          {showDemoPanel ? <FaTimes /> : <FaRocket />}
        </motion.button>
      )}

      {/* Quick Login Panel - Responsive */}
      {(showDemoPanel || windowWidth >= 768) && (
        <motion.div
          initial={{ opacity: 0, x: windowWidth < 768 ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={`
            fixed md:absolute 
            ${windowWidth < 768
              ? 'inset-x-4 bottom-20 max-h-[60vh] overflow-y-auto'
              : 'bottom-6 left-6 max-w-sm'
            }
            z-30
          `}
        >
          <div className="bg-base-100/95 backdrop-blur-md rounded-2xl shadow-2xl border border-error/20 p-3 sm:p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-error/10 rounded-full flex items-center justify-center">
                <FaRocket className="text-error text-xs sm:text-sm" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xs sm:text-sm flex items-center gap-1">
                  Demo Quick Access
                  <span className="badge badge-error badge-xs sm:badge-sm">DEMO</span>
                </h3>
                <p className="text-[8px] sm:text-[10px] opacity-60">Click to copy or paste credentials</p>
              </div>
              {/* Close button for mobile */}
              {windowWidth < 768 && (
                <button
                  onClick={() => setShowDemoPanel(false)}
                  className="btn btn-ghost btn-xs btn-circle"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Demo Accounts List - Responsive grid for mobile */}
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {demoAccounts.map((account) => (
                <div
                  key={account.role}
                  onClick={() => fillCredentials(account.email, account.password)}
                  className={`${account.color} bg-opacity-10 hover:bg-opacity-30 rounded-lg p-2 sm:p-3 border border-${account.color.split('-')[1]}/30 cursor-pointer transition-all`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Icon */}
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 ${account.color} rounded-full flex items-center justify-center text-white text-xs sm:text-sm shrink-0`}>
                      {account.icon}
                    </div>

                    {/* Role Name */}
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-xs sm:text-sm block truncate">{account.role}</span>
                      <p className="text-[8px] sm:text-[10px] opacity-60 truncate">{account.description}</p>
                    </div>

                    {/* Click indicator */}
                    <div className="text-[8px] sm:text-[10px] bg-base-300 text-base-content px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full opacity-50 shrink-0">
                      click
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Info Footer */}
            <div className="mt-2 sm:mt-3 text-[8px] sm:text-[10px] opacity-50 flex items-center gap-1 justify-center">
              <FaUsers className="text-xs" />
              <span>5 demo accounts • Click to paste</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Card - Responsive sizing */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="w-full max-w-[95%] xs:max-w-sm sm:max-w-md z-20"
      >
        <div className="card bg-base-100/90 backdrop-blur-md shadow-2xl border border-error/20">

          {/* Header with Blood Theme - Responsive */}
          <div className="card-body p-4 xs:p-5 sm:p-6 md:p-8">
            <div className="text-center mb-4 sm:mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="relative inline-block"
              >
                <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
                  <FaHeartbeat className="text-2xl xs:text-3xl sm:text-4xl text-error animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-2 h-2 xs:w-3 xs:h-3 sm:w-4 sm:h-4 bg-error rounded-full animate-ping"></div>
              </motion.div>

              <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold bg-linear-to-r from-error to-error/70 bg-clip-text text-transparent">
                Welcome Back
              </h2>
              <p className="text-xs xs:text-sm opacity-70 mt-0.5 sm:mt-1 px-2">
                Donate blood, save lives. Sign in to continue.
              </p>
            </div>

            {/* Demo Project Banner - Responsive */}
            <div className="alert alert-info shadow-lg mb-3 sm:mb-4 bg-blue-100 border-blue-300 p-2 sm:p-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <FaRocket className="text-blue-600 text-base sm:text-xl shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-bold text-blue-800 text-xs sm:text-sm">Demo Project</h3>
                  <p className="text-[10px] sm:text-xs text-blue-700 truncate">
                    {windowWidth < 640
                      ? "Use bottom right button for demos"
                      : "Use the panel at bottom left to paste credentials"}
                  </p>
                </div>
              </div>
            </div>

            {/* Login Method Toggle - Responsive */}
            <div className="tabs tabs-boxed bg-base-200 p-0.5 sm:p-1 mb-3 sm:mb-4">
              <button
                className={`tab tab-xs sm:tab-sm flex-1 ${loginMethod === "email" ? "tab-active bg-error text-white" : ""}`}
                onClick={() => setLoginMethod("email")}
              >
                <FaEnvelope className="mr-1 sm:mr-2 text-xs sm:text-sm" />
                <span className="text-xs sm:text-sm">Email</span>
              </button>
              <button
                className={`tab tab-xs sm:tab-sm flex-1 ${loginMethod === "phone" ? "tab-active bg-error text-white" : ""}`}
                onClick={() => setLoginMethod("phone")}
              >
                <FaPhone className="mr-1 sm:mr-2 text-xs sm:text-sm" />
                <span className="text-xs sm:text-sm">Phone</span>
              </button>
            </div>

            {/* Error Display - Responsive */}
            {error && (
              <div className="alert alert-error shadow-lg mb-3 sm:mb-4 p-2 sm:p-3">
                <div className="text-xs sm:text-sm">
                  <span>{error.response?.data?.error || "Login failed. Please try again."}</span>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">

              {/* Email Field */}
              {loginMethod === "email" && (
                <div className="form-control">
                  <label className="label py-1 sm:py-2">
                    <span className="label-text text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                      <FaEnvelope className="text-error text-xs sm:text-sm" /> Email Address
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="john@example.com"
                      className={`input input-bordered w-full pl-8 sm:pl-10 text-sm sm:text-base focus:input-error transition-all ${errors.email ? "input-error" : ""
                        }`}
                      {...register("email", {
                        required: loginMethod === "email" && "Email is required",
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
              )}

              {/* Phone Field */}
              {loginMethod === "phone" && (
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
                      className={`input input-bordered w-full pl-8 sm:pl-10 text-sm sm:text-base focus:input-error transition-all ${errors.phone ? "input-error" : ""
                        }`}
                      {...register("phone", {
                        required: loginMethod === "phone" && "Phone number is required",
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
              )}

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
                    className={`input input-bordered w-full pl-8 sm:pl-10 pr-8 sm:pr-10 text-sm sm:text-base focus:input-error transition-all ${errors.password ? "input-error" : ""
                      }`}
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                  />
                  <FaLock className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-error transition-colors"
                  >
                    {showPassword ? <FaEyeSlash className="text-sm sm:text-base" /> : <FaEye className="text-sm sm:text-base" />}
                  </button>
                </div>
                {errors.password && (
                  <label className="label py-1">
                    <span className="label-text-alt text-error text-xs">{errors.password.message}</span>
                  </label>
                )}
                <label className="label py-1">
                  <Link to="/forgot-password" className="label-text-alt text-xs link link-hover text-error">
                    Forgot password?
                  </Link>
                </label>
              </div>

              {/* Remember Me */}
              <div className="form-control">
                <label className="cursor-pointer label justify-start gap-2 sm:gap-3 py-1">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-error checkbox-xs sm:checkbox-sm"
                    {...register("rememberMe")}
                  />
                  <span className="label-text text-xs sm:text-sm">Remember me for 30 days</span>
                </label>
              </div>

              {/* Login Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: windowWidth < 640 ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="btn btn-error w-full gap-1 sm:gap-2 text-white disabled:bg-error/50 text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-xs sm:loading-sm"></span>
                    <span className="text-xs sm:text-sm">Signing In...</span>
                  </>
                ) : (
                  <>
                    <FaHeartbeat className="text-sm sm:text-base" />
                    <span className="text-xs sm:text-sm">Sign In</span>
                  </>
                )}
              </motion.button>
            </form>

            {/* Register Link - Responsive */}
            <p className="text-center text-xs sm:text-sm mt-3 sm:mt-4">
              Don't have an account?{" "}
              <Link to="/register" className="link link-error font-semibold hover:gap-2 transition-all">
                Register Now
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

export default Login;
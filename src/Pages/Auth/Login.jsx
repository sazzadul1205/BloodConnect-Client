// Pages/auth/Login.jsx

// React
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FaTint, FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaArrowLeft, FaHeartbeat, FaShieldAlt, FaPhone
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

  // Hooks Call
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  // Form handling
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      phone: "",
      password: "",
    },
  });

  // Redirect based on role
  const roleRoutes = {
    donor: "/donor/dashboard",
    hospital: "/hospital/dashboard",
    requester: "/requester/dashboard",
    blood_bank: "/blood_bank/dashboard",
    admin: "/admin/dashboard",
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

      console.log(user?.role);
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
    <div className="min-h-screen bg-linear-to-br from-base-100 to-base-200 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background Blood Drops Animation */}
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

          {/* Header with Blood Theme */}
          <div className="card-body p-6 sm:p-8">
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="relative inline-block"
              >
                <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaHeartbeat className="text-4xl text-error animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-error rounded-full animate-ping"></div>
              </motion.div>

              <h2 className="text-3xl font-bold bg-linear-to-r from-error to-error/70 bg-clip-text text-transparent">
                Welcome Back
              </h2>
              <p className="text-sm opacity-70 mt-1">
                Donate blood, save lives. Sign in to continue.
              </p>
            </div>

            {/* Login Method Toggle */}
            <div className="tabs tabs-boxed bg-base-200 p-1 mb-4">
              <button
                className={`tab flex-1 ${loginMethod === "email" ? "tab-active bg-error text-white" : ""}`}
                onClick={() => setLoginMethod("email")}
              >
                <FaEnvelope className="mr-2" /> Email
              </button>
              <button
                className={`tab flex-1 ${loginMethod === "phone" ? "tab-active bg-error text-white" : ""}`}
                onClick={() => setLoginMethod("phone")}
              >
                <FaPhone className="mr-2" /> Phone
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="alert alert-error shadow-lg mb-4">
                <div>
                  <span>{error.response?.data?.error || "Login failed. Please try again."}</span>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Email Field */}
              {loginMethod === "email" && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaEnvelope className="text-error" /> Email Address
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="john@example.com"
                      className={`input input-bordered w-full pl-10 focus:input-error transition-all ${errors.email ? "input-error" : ""
                        }`}
                      {...register("email", {
                        required: loginMethod === "email" && "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      })}
                    />
                    <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  </div>
                  {errors.email && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.email.message}</span>
                    </label>
                  )}
                </div>
              )}

              {/* Phone Field */}
              {loginMethod === "phone" && (
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
                      className={`input input-bordered w-full pl-10 focus:input-error transition-all ${errors.phone ? "input-error" : ""
                        }`}
                      {...register("phone", {
                        required: loginMethod === "phone" && "Phone number is required",
                        pattern: {
                          value: /^[+]?[(]?[0-9]{1,3}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/,
                          message: "Invalid phone number",
                        },
                      })}
                    />
                    <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  </div>
                  {errors.phone && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.phone.message}</span>
                    </label>
                  )}
                </div>
              )}

              {/* Password Field */}
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
                    className={`input input-bordered w-full pl-10 pr-10 focus:input-error transition-all ${errors.password ? "input-error" : ""
                      }`}
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                  />
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-error transition-colors"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.password.message}</span>
                  </label>
                )}
                <label className="label">
                  <a href="#" className="label-text-alt link link-hover text-error">
                    Forgot password?
                  </a>
                </label>
              </div>

              {/* Remember Me */}
              <div className="form-control">
                <label className="cursor-pointer label justify-start gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-error checkbox-sm"
                    {...register("rememberMe")}
                  />
                  <span className="label-text">Remember me for 30 days</span>
                </label>
              </div>

              {/* Login Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="btn btn-error w-full gap-2 text-white disabled:bg-error/50"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Signing In...
                  </>
                ) : (
                  <>
                    <FaHeartbeat /> Sign In
                  </>
                )}
              </motion.button>
            </form>

            {/* Register Link */}
            <p className="text-center text-sm mt-4">
              Don't have an account?{" "}
              <Link to="/register" className="link link-error font-semibold hover:gap-2 transition-all">
                Register Now
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

export default Login;
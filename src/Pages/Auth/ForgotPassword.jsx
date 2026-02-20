// Pages/auth/ForgotPassword.jsx

// React
import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";

// Icons
import { FaEnvelope, FaArrowLeft, FaHeartbeat } from "react-icons/fa";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import useAuth from "../../hooks/useAuth";

const ForgotPassword = () => {
  const [success, setSuccess] = useState(false);
  const { forgotPassword, loading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await forgotPassword(data.email);
      setSuccess(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-md bg-base-100 shadow-2xl border border-error/20"
      >
        <div className="card-body">
          <div className="text-center mb-6">
            <FaHeartbeat className="text-4xl text-error mx-auto mb-2" />
            <h2 className="text-2xl font-bold">Forgot Password</h2>
            <p className="text-sm opacity-70">
              Enter your email to receive reset instructions
            </p>
          </div>

          {success ? (
            <div className="alert alert-success">
              Password reset link sent to your email.
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaEnvelope className="text-error" />
                    Email Address
                  </span>
                </label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  className={`input input-bordered w-full ${errors.email ? "input-error" : ""
                    }`}
                  {...register("email", {
                    required: "Email is required",
                  })}
                />
                {errors.email && (
                  <span className="text-error text-sm mt-1">
                    {errors.email.message}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-error w-full text-white"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}

          <div className="text-center mt-4">
            <Link to="/login" className="link link-error flex items-center justify-center gap-2">
              <FaArrowLeft /> Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;